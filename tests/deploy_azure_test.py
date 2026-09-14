import copy
import importlib.util
import unittest
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


if __name__ == '__main__':
    unittest.main()
