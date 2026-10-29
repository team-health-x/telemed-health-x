"""Manually build and update the existing Prod app; preserve Azure env/secrets."""
import argparse
import importlib.util
import os
from pathlib import Path
import re
import shlex
import subprocess
import uuid

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('deploy', ROOT / 'scripts/deploy-azure.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)

EXPECTED = {
    'AZURE_SUBSCRIPTION_ID': 'acf02b4d-8c3d-4fcc-92a8-9c072341e6c4',
    'AZURE_RESOURCE_GROUP': deploy.GROUP,
    'AZURE_CONTAINER_APP_NAME': deploy.APP,
    'AZURE_CONTAINER_REGISTRY': 'healthxregistry',
}


def load_runtime_env():
    values = {}
    path = ROOT / 'deployment/environment/prod.env'
    for number, line in enumerate(path.read_text(encoding='utf-8-sig').splitlines(), 1):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        key, separator, raw = line.partition('=')
        key = key.strip()
        if not separator or not re.fullmatch(r'TELEMED_[A-Z0-9_]+', key) or key in values:
            raise ValueError(f'Invalid runtime variable on line {number}')
        tokens = shlex.split(raw, comments=True)
        if len(tokens) != 1:
            raise ValueError(f'Expected a nonempty runtime value on line {number}')
        values[key] = tokens[0]
    origin = 'https://healthx-api.nicemoss-83033b3e.southeastasia.azurecontainerapps.io'
    for key, expected in {'TELEMED_DEPLOY_ENV': 'prod', 'TELEMED_DEMO_AUTH_ENABLED': 'false',
                          'TELEMED_API_ORIGIN': origin, 'TELEMED_WORKFLOW_ORIGIN': origin}.items():
        if values.get(key) != expected:
            raise ValueError(f'{key} must match the Production configuration')
    return values


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-only', action='store_true',
                        help='Read Azure configuration only; no build or writes')
    args = parser.parse_args(argv)
    for key, expected in EXPECTED.items():
        if os.environ.get(key) != expected:
            raise ValueError(f'{key} must match Prod; use deployment/deploy-prod.sh')
    subscription = EXPECTED['AZURE_SUBSCRIPTION_ID']
    account = deploy.az('account', 'show', '--subscription', subscription)
    if account.get('id') != subscription or account.get('state') != 'Enabled':
        raise ValueError('Log in to the enabled project subscription with az login')
    app = deploy.az('containerapp', 'show', '--subscription', subscription,
                    '--name', deploy.APP, '--resource-group', deploy.GROUP)
    suffix = 'local-' + uuid.uuid4().hex[:16]
    runtime_env = load_runtime_env()
    app = deploy.with_runtime_env(app, runtime_env)
    deploy.validate(app, deploy.REPOSITORY + '@sha256:' + '0' * 64, suffix, 'prod')
    secrets = {entry['name'] for entry in app['properties']['configuration'].get('secrets', [])}
    for container in app['properties']['template']['containers']:
        for entry in container.get('env', []):
            if entry.get('secretRef') and entry['secretRef'] not in secrets:
                raise ValueError(f'Missing Azure secret for {entry["name"]}')
    print(f'Production target: {deploy.GROUP}/{deploy.APP}', flush=True)
    print('Applying Prod runtime file; other Azure env, secrets and domains are preserved.', flush=True)
    print('Production authentication requires matching Azure secrets and a configured backend.', flush=True)
    if args.check_only:
        print('Configuration check passed; no build or deployment performed.')
        return
    previous = deploy.az('account', 'show')['id']
    try:
        deploy.az('account', 'set', '--subscription', subscription)
        image_name = deploy.REPOSITORY.split('/', 1)[1] + ':prod-' + suffix
        subprocess.run(['az', 'acr', 'build', '--subscription', subscription,
                        '--registry', EXPECTED['AZURE_CONTAINER_REGISTRY'],
                        '--image', image_name, '--platform', 'linux/amd64',
                        '--file', 'Dockerfile', '.'], cwd=ROOT, check=True)
        digest = deploy.az('acr', 'repository', 'show', '--subscription', subscription,
                           '--name', EXPECTED['AZURE_CONTAINER_REGISTRY'],
                           '--image', image_name, '--query', 'digest')
        if not isinstance(digest, str) or not re.fullmatch(r'sha256:[0-9a-f]{64}', digest):
            raise ValueError('ACR did not return a valid immutable digest')
        os.environ.update(TELEMED_DEPLOY_TARGET='prod', TELEMED_IMAGE=deploy.REPOSITORY + '@' + digest,
                          TELEMED_REVISION_SUFFIX=suffix)
        deploy.main(runtime_env=runtime_env)
    finally:
        if previous != subscription:
            deploy.az('account', 'set', '--subscription', previous)


if __name__ == '__main__':
    main()
