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
APP = {'properties': {'template': {'containers': [{}]}, 'configuration': {}}}


class LocalDeployTests(unittest.TestCase):
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
