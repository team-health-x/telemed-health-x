import importlib.util
import os
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('prod_deploy', Path(__file__).resolve().parents[1] / 'scripts/deploy-local-prod.py')
local = importlib.util.module_from_spec(spec)
spec.loader.exec_module(local)
APP = {'properties': {'configuration': {'secrets': [{'name': 'telemed-session-secret'}, {'name': 'telemed-bridge-secret'}]}, 'template': {'containers': [{'env': []}]}}}
ACCOUNT = {'id': local.EXPECTED['AZURE_SUBSCRIPTION_ID'], 'state': 'Enabled'}


class ProdDeployTests(unittest.TestCase):
    def test_wrong_target_rejected_before_azure(self):
        with patch.dict(os.environ, dict(local.EXPECTED, AZURE_RESOURCE_GROUP=local.deploy.DEV_GROUP)), patch.object(local.deploy, 'az') as az:
            with self.assertRaises(ValueError):
                local.main([])
            az.assert_not_called()

    def test_check_only_never_writes_or_builds(self):
        with patch.dict(os.environ, local.EXPECTED), patch.object(local.deploy, 'az', side_effect=[ACCOUNT, APP]) as az, patch.object(local.deploy, 'validate'), patch.object(local.subprocess, 'run') as run, patch.object(local.deploy, 'main') as rollout:
            local.main(['--check-only'])
            self.assertEqual(az.call_count, 2)
            run.assert_not_called()
            rollout.assert_not_called()

    def test_build_failure_does_not_rollout_and_restores_subscription(self):
        with patch.dict(os.environ, local.EXPECTED), patch.object(local.deploy, 'az', side_effect=[ACCOUNT, APP, {'id': 'previous'}, None, None]) as az, patch.object(local.deploy, 'validate'), patch.object(local.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, 'az')), patch.object(local.deploy, 'main') as rollout:
            with self.assertRaises(subprocess.CalledProcessError):
                local.main([])
            rollout.assert_not_called()
            az.assert_called_with('account', 'set', '--subscription', 'previous')

    def test_uses_digest_and_preserves_runtime_environment(self):
        digest = 'sha256:' + 'a' * 64
        with patch.dict(os.environ, local.EXPECTED), patch.object(local.deploy, 'az', side_effect=[ACCOUNT, APP, ACCOUNT, None, digest]), patch.object(local.deploy, 'validate'), patch.object(local.subprocess, 'run'), patch.object(local.deploy, 'main') as rollout:
            local.main([])
            self.assertEqual(os.environ['TELEMED_DEPLOY_TARGET'], 'prod')
            self.assertEqual(os.environ['TELEMED_IMAGE'], local.deploy.REPOSITORY + '@' + digest)
            rollout.assert_called_once_with(runtime_env=local.load_runtime_env())

    def test_plaintext_secret_rejected(self):
        with self.assertRaises(ValueError):
            local.deploy.with_runtime_env(APP, {'TELEMED_SESSION_SECRET': 'plaintext'})

    def test_missing_secret_reference_rejected(self):
        with self.assertRaises(ValueError):
            local.deploy.with_runtime_env(APP, {'TELEMED_SESSION_SECRET': 'secretref:missing'})

    def test_invalid_digest_does_not_rollout(self):
        with patch.dict(os.environ, local.EXPECTED), patch.object(local.deploy, 'az', side_effect=[ACCOUNT, APP, ACCOUNT, None, 'latest']), patch.object(local.deploy, 'validate'), patch.object(local.subprocess, 'run'), patch.object(local.deploy, 'main') as rollout:
            with self.assertRaises(ValueError):
                local.main([])
            rollout.assert_not_called()


if __name__ == '__main__':
    unittest.main()
