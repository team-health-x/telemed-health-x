import importlib.util
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('local_deploy', Path(__file__).resolve().parents[1] / 'scripts/deploy-local-dev.py')
local = importlib.util.module_from_spec(spec)
spec.loader.exec_module(local)
APP = {'properties': {'template': {'containers': [{}]}, 'configuration': {'secrets': [
    {'name': 'telemed-session-secret'}, {'name': 'telemed-bridge-secret'}]}}}


class LocalDeployTests(unittest.TestCase):
    def setUp(self):
        patcher = patch.object(local, 'registration_plan', side_effect=lambda app, env: (app, env, {}))
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_rejects_prod_before_azure_calls(self):
        env = dict(local.EXPECTED, AZURE_RESOURCE_GROUP='healthx-clinic-app')
        with patch.dict(os.environ, env), patch.object(local.deploy, 'az') as az:
            with self.assertRaises(ValueError):
                local.main([])
            az.assert_not_called()

    def test_check_only_does_not_build_or_deploy(self):
        account = {'id': local.EXPECTED['AZURE_SUBSCRIPTION_ID'], 'state': 'Enabled'}
        with patch.dict(os.environ, local.EXPECTED), \
             patch.object(local.deploy, 'az', side_effect=[account, APP]) as az, \
             patch.object(local.deploy, 'validate') as validate, \
             patch.object(local.subprocess, 'run') as run, \
             patch.object(local.deploy, 'main') as rollout:
            local.main(['--check-only'])
            self.assertEqual(az.call_count, 2)
            self.assertEqual(validate.call_args.args[-1], 'dev')
            run.assert_not_called()
            rollout.assert_not_called()

    def test_build_failure_restores_subscription_and_does_not_deploy(self):
        account = {'id': local.EXPECTED['AZURE_SUBSCRIPTION_ID'], 'state': 'Enabled'}
        with patch.dict(os.environ, local.EXPECTED), \
             patch.object(local.deploy, 'az', side_effect=[account, APP, {'id': 'previous'}, None, None]) as az, \
             patch.object(local.deploy, 'validate'), \
             patch.object(local.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, 'az')), \
             patch.object(local.deploy, 'main') as rollout:
            with self.assertRaises(subprocess.CalledProcessError):
                local.main([])
            az.assert_called_with('account', 'set', '--subscription', 'previous')
            rollout.assert_not_called()

    def test_deploy_uses_digest_and_dev_only(self):
        account = {'id': local.EXPECTED['AZURE_SUBSCRIPTION_ID'], 'state': 'Enabled'}
        digest = 'sha256:' + 'a' * 64
        with patch.dict(os.environ, local.EXPECTED), \
             patch.object(local.deploy, 'az', side_effect=[account, APP, account, None, digest]), \
             patch.object(local.deploy, 'validate'), \
             patch.object(local.subprocess, 'run') as run, \
             patch.object(local.deploy, 'main') as rollout:
            local.main([])
            self.assertIn('linux/amd64', run.call_args.args[0])
            self.assertEqual(os.environ['TELEMED_IMAGE'], local.deploy.REPOSITORY + '@' + digest)
            self.assertEqual(os.environ['TELEMED_DEPLOY_TARGET'], 'dev')
            rollout.assert_called_once()
            self.assertEqual(rollout.call_args.kwargs['runtime_env']['TELEMED_DEPLOY_ENV'], 'dev')

    def test_runtime_parser(self):
        base = (local.ROOT / 'deployment/environment/dev.env').read_text()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'dev.env'
            path.write_text(base + '\nTELEMED_LABEL="hello world" # comment\n')
            self.assertEqual(local.load_runtime_env(path)['TELEMED_LABEL'], 'hello world')
            for extra in ['TELEMED_DEPLOY_ENV=prod', 'BAD=value', 'TELEMED_LABEL=unquoted spaces']:
                path.write_text(base + '\n' + extra)
                with self.assertRaises(ValueError):
                    local.load_runtime_env(path)


class RegistrationPlanTests(unittest.TestCase):
    def setUp(self):
        self.runtime = local.load_runtime_env(local.ROOT / 'deployment/environment/dev.env')
        self.app = {'name': local.deploy.APP, 'resourceGroup': local.deploy.DEV_GROUP, 'properties': {
            'configuration': {'ingress': {'fqdn': 'telemed.azurecontainerapps.io'}, 'secrets': []},
            'template': {'containers': [{}]},
        }}
        self.backend = {'name': 'healthx-api', 'resourceGroup': local.deploy.DEV_GROUP, 'properties': {
            'configuration': {'ingress': {'fqdn': local.deploy.DEV_ORIGIN.removeprefix('https://')}},
            'template': {'containers': [{'env': [
                {'name': 'TELEMED_DEPLOY_ENV', 'value': 'dev'},
                {'name': 'TELEMED_WORKFLOW_ENABLED', 'value': 'true'},
                {'name': 'TELEMED_DEMO_BRIDGE_SECRET', 'secretRef': 'backend-key'},
            ]}]},
        }}
        self.bridge = 'test-bridge-' + 'a' * 40

    def plan(self, current):
        with patch.object(local.deploy, 'validate'), patch.object(local.deploy, 'az', side_effect=[
            self.backend, [{'name': 'backend-key', 'value': self.bridge}], current,
        ]) as az:
            result = local.registration_plan(self.app, self.runtime)
            self.assertTrue(all('set' not in call.args and 'update' not in call.args for call in az.call_args_list))
            return result

    def test_bootstrap_derives_origin_and_secrets_without_writes(self):
        app, env, writes = self.plan([])
        self.assertEqual(env['TELEMED_DEV_ORIGINS'], 'https://telemed.azurecontainerapps.io')
        self.assertEqual(writes['telemed-bridge-secret'], self.bridge)
        self.assertGreaterEqual(len(writes['telemed-session-secret']), 32)
        self.assertEqual(self.app['properties']['configuration']['secrets'], [])
        self.assertEqual(len(app['properties']['configuration']['secrets']), 2)

    def test_keeps_existing_session_and_matching_bridge(self):
        _, _, writes = self.plan([{'name': 'telemed-bridge-secret', 'value': self.bridge},
                                  {'name': 'telemed-session-secret', 'value': 's' * 48}])
        self.assertEqual(writes, {})

    def test_rejects_wrong_target_before_reading_secrets(self):
        self.app['resourceGroup'] = local.deploy.GROUP
        with patch.object(local.deploy, 'az') as az:
            with self.assertRaises(ValueError):
                local.registration_plan(self.app, self.runtime)
            az.assert_not_called()

    def test_rejects_unsafe_backend(self):
        self.backend['resourceGroup'] = local.deploy.GROUP
        with self.assertRaises(ValueError):
            self.plan([])

    def test_does_not_rotate_existing_invalid_session(self):
        with self.assertRaises(ValueError):
            self.plan([{'name': 'telemed-session-secret', 'value': 'short'}])

    def test_write_failure_does_not_expose_secret(self):
        with patch.object(local.deploy, 'az', side_effect=subprocess.CalledProcessError(1, ['az', self.bridge])):
            with self.assertRaises(RuntimeError) as error:
                local.apply_registration_secrets({'telemed-bridge-secret': self.bridge})
            self.assertNotIn(self.bridge, str(error.exception))
