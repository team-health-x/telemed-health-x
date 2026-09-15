import copy
import importlib.util
import unittest
from unittest.mock import patch
from pathlib import Path

spec = importlib.util.spec_from_file_location('deploy', Path(__file__).resolve().parents[1] / 'scripts/deploy-azure.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class DeploymentGuardTests(unittest.TestCase):
    def setUp(self):
        self.image = deploy.REPOSITORY + '@sha256:' + 'a' * 64
        self.app = {'name': deploy.APP, 'resourceGroup': deploy.GROUP, 'properties': {
            'configuration': {'activeRevisionsMode': 'Single', 'ingress': {
                'targetPort': 3000, 'external': True, 'fqdn': 'telemed.example.azurecontainerapps.io'}},
            'template': {'containers': [{'name': 'telemed', 'image': deploy.REPOSITORY + ':prod'}]}}}

    def test_expected_app(self):
        self.assertEqual(deploy.validate(self.app, self.image, 'gh-123-1')[0], 'telemed')

    def test_rejects_other_images_and_tags(self):
        for image in ['healthxregistry.azurecr.io/healthx-web@sha256:' + 'a'*64, deploy.REPOSITORY + ':prod']:
            with self.assertRaises(ValueError):
                deploy.validate(self.app, image, 'gh-123-1')

    def test_rejects_other_app_and_multi_revision(self):
        wrong = copy.deepcopy(self.app)
        wrong['name'] = 'healthx-web'
        with self.assertRaises(ValueError): deploy.validate(wrong, self.image, 'gh-123-1')
        self.app['properties']['configuration']['activeRevisionsMode'] = 'Multiple'
        with self.assertRaises(ValueError): deploy.validate(self.app, self.image, 'gh-123-1')

    def test_rejects_demo_and_dev_env_overrides(self):
        for entry in [{'name': 'TELEMED_DEMO_AUTH_ENABLED', 'value': 'true'},
                      {'name': 'TELEMED_DEPLOY_ENV', 'value': 'dev'},
                      {'name': 'TELEMED_DEPLOY_ENV', 'secretRef': 'unknown'}]:
            self.app['properties']['template']['containers'][0]['env'] = [entry]
            with self.assertRaises(ValueError): deploy.validate(self.app, self.image, 'gh-123-1')

    def test_rejects_port_and_startup_overrides(self):
        wrong = copy.deepcopy(self.app)
        wrong['properties']['configuration']['ingress']['targetPort'] = 80
        with self.assertRaises(ValueError): deploy.validate(wrong, self.image, 'gh-123-1')
        self.app['properties']['template']['containers'][0]['command'] = ['sh']
        with self.assertRaises(ValueError): deploy.validate(self.app, self.image, 'gh-123-1')

    def dev_app(self, demo=False):
        app = copy.deepcopy(self.app)
        app['resourceGroup'] = deploy.DEV_GROUP
        app['properties']['template']['containers'][0]['env'] = [
            {'name': 'TELEMED_DEPLOY_ENV', 'value': 'dev'},
            {'name': 'TELEMED_API_ORIGIN', 'value': deploy.DEV_ORIGIN},
            {'name': 'TELEMED_WORKFLOW_ORIGIN', 'value': deploy.DEV_ORIGIN},
            {'name': 'TELEMED_DEMO_AUTH_ENABLED', 'value': str(demo).lower()},
        ]
        return app

    def test_dev_and_prod_targets_are_isolated(self):
        app = self.dev_app()
        self.assertEqual(deploy.validate(app, self.image, 'gh-123-1', 'dev')[0], 'telemed')
        with self.assertRaises(ValueError): deploy.validate(app, self.image, 'gh-123-1')
        with self.assertRaises(ValueError): deploy.validate(self.app, self.image, 'gh-123-1', 'dev')
        with self.assertRaises(ValueError): deploy.validate(app, self.image, 'gh-123-1', 'development')

    def test_dev_requires_explicit_dev_env_and_backend(self):
        for name in ['TELEMED_DEPLOY_ENV', 'TELEMED_API_ORIGIN', 'TELEMED_WORKFLOW_ORIGIN']:
            app = self.dev_app()
            env = app['properties']['template']['containers'][0]['env']
            env[:] = [entry for entry in env if entry['name'] != name]
            with self.assertRaises(ValueError): deploy.validate(app, self.image, 'gh-123-1', 'dev')
        app = self.dev_app()
        app['properties']['template']['containers'][0]['env'][1]['value'] = 'https://production.example.com'
        with self.assertRaises(ValueError): deploy.validate(app, self.image, 'gh-123-1', 'dev')

    def test_dev_demo_requires_secrets_and_matching_origin(self):
        app = self.dev_app(demo=True)
        env = app['properties']['template']['containers'][0]['env']
        with self.assertRaises(ValueError): deploy.validate(app, self.image, 'gh-123-1', 'dev')
        env.append({'name': 'TELEMED_DEV_ORIGINS', 'value': 'https://telemed.example.azurecontainerapps.io'})
        with self.assertRaises(ValueError): deploy.validate(app, self.image, 'gh-123-1', 'dev')
        env.extend([{'name': key, 'secretRef': key.lower()} for key in
                    ['TELEMED_SESSION_SECRET', 'TELEMED_DEMO_BRIDGE_SECRET']])
        self.assertEqual(deploy.validate(app, self.image, 'gh-123-1', 'dev')[0], 'telemed')

    def test_dev_rollout_uses_dev_group_for_every_azure_call(self):
        app = self.dev_app()
        app['properties']['latestReadyRevisionName'] = deploy.APP + '--gh-123-1'
        ready = copy.deepcopy(app)
        ready['properties']['template']['containers'][0]['image'] = self.image
        calls = []

        def fake_az(*args):
            calls.append(args)
            return ready if args[1:3] == ('revision', 'show') else app

        with patch.dict('os.environ', {'TELEMED_DEPLOY_TARGET': 'dev', 'TELEMED_IMAGE': self.image,
                                     'TELEMED_REVISION_SUFFIX': 'gh-123-1'}, clear=True), \
                patch.object(deploy, 'az', side_effect=fake_az), \
                patch.object(deploy.urllib.request, 'urlopen') as urlopen:
            urlopen.return_value.__enter__.return_value.status = 200
            deploy.main()
        self.assertTrue(any(args[1] == 'update' for args in calls))
        for args in calls:
            self.assertEqual(args[args.index('--resource-group') + 1], deploy.DEV_GROUP)


if __name__ == '__main__':
    unittest.main()
