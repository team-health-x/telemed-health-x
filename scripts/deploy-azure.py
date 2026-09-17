"""Update the Telemed image only; never create resources or replace app secrets."""
import json
import copy
import os
import re
import subprocess
import time
import urllib.error
import urllib.request

APP = 'healthx-telemed-web'
GROUP = 'healthx-clinic-app'
REPOSITORY = 'healthxregistry.azurecr.io/healthx-telemed-web'
DEV_GROUP = 'healthx-clinic-app-dev'
DEV_ORIGIN = 'https://healthx-api.kindrock-9a3ea2bc.southeastasia.azurecontainerapps.io'


def target_group(target):
    if target not in ('prod', 'dev'):
        raise ValueError('Unknown deployment target')
    return DEV_GROUP if target == 'dev' else GROUP


def az(*args):
    result = subprocess.run(['az', *args, '--only-show-errors', '-o', 'json'],
                            check=True, capture_output=True, text=True)
    return json.loads(result.stdout) if result.stdout.strip() else None


def validate(app, image, suffix, target='prod'):
    group = target_group(target)
    if not re.fullmatch(re.escape(REPOSITORY) + r'@sha256:[0-9a-f]{64}', image):
        raise ValueError('Deploy requires the exact Telemed repository and SHA256 digest')
    if not re.fullmatch(r'gh-[0-9]+-[0-9]+|local-[0-9a-f]{16}', suffix):
        raise ValueError('Invalid revision suffix')
    if app.get('name') != APP or app.get('resourceGroup', '').lower() != group:
        raise ValueError('Unexpected app target')
    properties = app['properties']
    configuration = properties['configuration']
    if configuration.get('activeRevisionsMode') != 'Single':
        raise ValueError('Multiple revision mode needs an explicit traffic rollout; refusing to change it')
    ingress = configuration.get('ingress') or {}
    if ingress.get('targetPort') != 3000 or not ingress.get('external'):
        raise ValueError('Configure external ingress with target port 3000 first')
    fqdn = ingress.get('fqdn', '')
    if not fqdn.endswith('.azurecontainerapps.io') or '/' in fqdn:
        raise ValueError('Unexpected application hostname')
    containers = properties['template']['containers']
    if len(containers) != 1:
        raise ValueError('Expected a single-container Telemed app')
    container = containers[0]
    if not container['image'].startswith((REPOSITORY + ':', REPOSITORY + '@')):
        raise ValueError('Existing container is not a Telemed image; configure it explicitly first')
    if container.get('command') or container.get('args'):
        raise ValueError('Remove startup overrides; use the image startup command')
    env = {entry['name']: entry for entry in container.get('env', [])}
    if target == 'prod':
        for key, expected in [('TELEMED_DEPLOY_ENV', 'prod'), ('TELEMED_DEMO_AUTH_ENABLED', 'false')]:
            if key in env and env[key].get('value') != expected:
                raise ValueError(f'Unsafe or secret-backed override: {key}')
    else:
        # The image stays production-safe; Dev is an explicit runtime configuration.
        for key, expected in [('TELEMED_DEPLOY_ENV', 'dev'),
                              ('TELEMED_API_ORIGIN', DEV_ORIGIN),
                              ('TELEMED_WORKFLOW_ORIGIN', DEV_ORIGIN)]:
            if env.get(key, {}).get('value') != expected:
                raise ValueError(f'Dev app requires explicit {key} pointing to Dev')
        demo = env.get('TELEMED_DEMO_AUTH_ENABLED', {}).get('value', 'false')
        if demo not in ('true', 'false') or env.get('TELEMED_DEMO_AUTH_ENABLED', {}).get('secretRef'):
            raise ValueError('Dev demo flag must be an explicit boolean string')
        if demo == 'true':
            origins = env.get('TELEMED_DEV_ORIGINS', {}).get('value', '').split(',')
            if 'https://' + fqdn not in [origin.strip() for origin in origins]:
                raise ValueError('Dev mock authentication requires the app HTTPS origin allowlist')
            for key in ('TELEMED_SESSION_SECRET', 'TELEMED_DEMO_BRIDGE_SECRET'):
                if not env.get(key, {}).get('secretRef'):
                    raise ValueError(f'Configure {key} through Azure Secrets before enabling Dev demo')
    return container['name'], fqdn


def with_runtime_env(app, runtime_env):
    planned = copy.deepcopy(app)
    containers = planned['properties']['template']['containers']
    if len(containers) != 1:
        raise ValueError('Expected a single-container Telemed app')
    entries = {entry['name']: entry for entry in containers[0].get('env', [])}
    secrets = {entry['name'] for entry in planned['properties']['configuration'].get('secrets', [])}
    for key, value in runtime_env.items():
        if not re.fullmatch(r'TELEMED_[A-Z0-9_]+', key) or not isinstance(value, str):
            raise ValueError('Invalid Telemed runtime variable')
        if re.search(r'SECRET|PASSWORD|TOKEN|API_KEY|PRIVATE_KEY', key) and not value.startswith('secretref:'):
            raise ValueError(f'{key} must reference an Azure secret, not a plaintext value')
        if value.startswith('secretref:'):
            name = value[len('secretref:'):]
            if not name or name not in secrets:
                raise ValueError(f'Azure secret referenced by {key} does not exist')
            entries[key] = {'name': key, 'secretRef': name}
        else:
            entries[key] = {'name': key, 'value': value}
    containers[0]['env'] = list(entries.values())
    return planned


def main(runtime_env=None):
    target = os.environ.get('TELEMED_DEPLOY_TARGET', 'prod')
    group = target_group(target)
    image = os.environ['TELEMED_IMAGE']
    suffix = os.environ['TELEMED_REVISION_SUFFIX']
    app = az('containerapp', 'show', '--name', APP, '--resource-group', group)
    if runtime_env is not None:
        if target != 'dev':
            raise ValueError('Local runtime env updates are Dev-only')
        app = with_runtime_env(app, runtime_env)
    container, fqdn = validate(app, image, suffix, target)
    previous = app['properties'].get('latestReadyRevisionName', '')
    revision = APP + '--' + suffix
    print(f'Target: {group}/{APP}; previous ready revision: {previous}')
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a', encoding='utf-8') as report:
            report.write(f'\n### Deployment\nPrevious ready revision: `{previous}`\n\nTarget: `{revision}`\n')
    env_args = ['--set-env-vars', *[f'{key}={value}' for key, value in runtime_env.items()]] if runtime_env else []
    az('containerapp', 'update', '--name', APP, '--resource-group', group,
       '--container-name', container, '--image', image, '--revision-suffix', suffix, *env_args)
    for _ in range(60):
        current = az('containerapp', 'show', '--name', APP, '--resource-group', group)['properties']
        if current.get('latestReadyRevisionName') == revision:
            break
        time.sleep(10)
    else:
        raise RuntimeError('New revision did not become ready within 10 minutes; inspect Azure before retrying')
    deployed = az('containerapp', 'revision', 'show', '--name', APP,
                  '--resource-group', group, '--revision', revision)
    actual = deployed['properties']['template']['containers']
    if not any(c['name'] == container and c['image'] == image for c in actual):
        raise RuntimeError('Ready revision does not contain the requested image digest')
    url = 'https://' + fqdn
    for attempt in range(12):
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                if response.status == 200:
                    print(f'Deployment ready: {revision}; HTTP 200: {url}')
                    if summary:
                        with open(summary, 'a', encoding='utf-8') as report:
                            report.write(f'\nReady: `{revision}`\n\nURL: {url}\n')
                    return
        except (urllib.error.URLError, TimeoutError):
            pass
        time.sleep(5)
    raise RuntimeError('Revision is ready but public homepage check failed; no automatic rollback performed')


if __name__ == '__main__':
    main()
