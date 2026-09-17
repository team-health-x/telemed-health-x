"""Build in ACR and deploy Dev using the current Azure CLI login."""
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
    'AZURE_RESOURCE_GROUP': deploy.DEV_GROUP,
    'AZURE_CONTAINER_APP_NAME': deploy.APP,
    'AZURE_CONTAINER_REGISTRY': 'healthxregistry',
}


def load_runtime_env(path):
    values = {}
    for number, line in enumerate(path.read_text(encoding='utf-8-sig').splitlines(), 1):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        key, separator, raw = line.partition('=')
        key = key.strip()
        if not separator or not re.fullmatch(r'TELEMED_[A-Z0-9_]+', key) or key in values:
            raise ValueError(f'Invalid or duplicate runtime variable on line {number}')
        tokens = shlex.split(raw, comments=True)
        if len(tokens) > 1:
            raise ValueError(f'Quote runtime values containing spaces on line {number}')
        values[key] = tokens[0] if tokens else ''
    for key, expected in [('TELEMED_DEPLOY_ENV', 'dev'),
                          ('TELEMED_API_ORIGIN', deploy.DEV_ORIGIN),
                          ('TELEMED_WORKFLOW_ORIGIN', deploy.DEV_ORIGIN)]:
        if values.get(key) != expected:
            raise ValueError(f'Runtime file must set {key} to the expected Dev value')
    return values


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-only', action='store_true',
                        help='Check login and Dev configuration without build or deployment')
    args = parser.parse_args(argv)
    for key, expected in EXPECTED.items():
        if os.environ.get(key) != expected:
            raise ValueError(f'{key} must match the Telemed Dev target; use deployment/deploy-dev.sh')
    subscription = EXPECTED['AZURE_SUBSCRIPTION_ID']
    account = deploy.az('account', 'show', '--subscription', subscription)
    if account.get('id') != subscription or account.get('state') != 'Enabled':
        raise ValueError('Log in with az login and select the enabled project subscription')
    suffix = 'local-' + uuid.uuid4().hex[:16]
    runtime_env = load_runtime_env(ROOT / 'deployment/environment/dev.env')
    app = deploy.az('containerapp', 'show', '--subscription', subscription,
                    '--name', deploy.APP, '--resource-group', deploy.DEV_GROUP)
    # Validate app safety before paying for an ACR build. The digest is resolved after build.
    planned = deploy.with_runtime_env(app, runtime_env)
    deploy.validate(planned, deploy.REPOSITORY + '@sha256:' + '0' * 64, suffix, 'dev')
    print(f'Configuration OK: {deploy.DEV_GROUP}/{deploy.APP}', flush=True)
    print('Runtime variables to apply: ' + ', '.join(runtime_env), flush=True)
    if args.check_only:
        print('No build or deployment performed. Write permissions have not been tested.')
        return
    previous = deploy.az('account', 'show')['id']
    try:
        deploy.az('account', 'set', '--subscription', subscription)
        tag = 'dev-' + suffix
        image_name = deploy.REPOSITORY.split('/', 1)[1] + ':' + tag
        subprocess.run(['az', 'acr', 'build', '--subscription', subscription,
                        '--registry', EXPECTED['AZURE_CONTAINER_REGISTRY'],
                        '--image', image_name, '--platform', 'linux/amd64',
                        '--file', 'Dockerfile', '.'], cwd=ROOT, check=True)
        digest = deploy.az('acr', 'repository', 'show', '--subscription', subscription,
                           '--name', EXPECTED['AZURE_CONTAINER_REGISTRY'],
                           '--image', image_name, '--query', 'digest')
        if not isinstance(digest, str) or not re.fullmatch(r'sha256:[0-9a-f]{64}', digest):
            raise ValueError('ACR did not return an immutable image digest')
        os.environ.update(TELEMED_DEPLOY_TARGET='dev', TELEMED_IMAGE=deploy.REPOSITORY + '@' + digest,
                          TELEMED_REVISION_SUFFIX=suffix)
        deploy.main(runtime_env=runtime_env)
    finally:
        if previous != subscription:
            deploy.az('account', 'set', '--subscription', previous)


if __name__ == '__main__':
    main()
