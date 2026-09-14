"""Update the Telemed image only; never create resources or replace app secrets."""
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.request

APP = 'healthx-telemed-web'
GROUP = 'healthx-clinic-app'
REPOSITORY = 'healthxregistry.azurecr.io/healthx-telemed-web'


def az(*args):
    result = subprocess.run(['az', *args, '--only-show-errors', '-o', 'json'],
                            check=True, capture_output=True, text=True)
    return json.loads(result.stdout) if result.stdout.strip() else None


def validate(app, image, suffix):
    if not re.fullmatch(re.escape(REPOSITORY) + r'@sha256:[0-9a-f]{64}', image):
        raise ValueError('Deploy requires the exact Telemed repository and SHA256 digest')
    if not re.fullmatch(r'gh-[0-9]+-[0-9]+', suffix):
        raise ValueError('Invalid revision suffix')
    if app.get('name') != APP or app.get('resourceGroup', '').lower() != GROUP:
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
    for key, expected in [('TELEMED_DEPLOY_ENV', 'prod'), ('TELEMED_DEMO_AUTH_ENABLED', 'false')]:
        if key in env and env[key].get('value') != expected:
            raise ValueError(f'Unsafe or secret-backed override: {key}')
    return container['name'], fqdn


def main():
    image = os.environ['TELEMED_IMAGE']
    suffix = os.environ['TELEMED_REVISION_SUFFIX']
    app = az('containerapp', 'show', '--name', APP, '--resource-group', GROUP)
    container, fqdn = validate(app, image, suffix)
    previous = app['properties'].get('latestReadyRevisionName', '')
    revision = APP + '--' + suffix
    print(f'Target: {GROUP}/{APP}; previous ready revision: {previous}')
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a', encoding='utf-8') as report:
            report.write(f'\n### Deployment\nPrevious ready revision: `{previous}`\n\nTarget: `{revision}`\n')
    az('containerapp', 'update', '--name', APP, '--resource-group', GROUP,
       '--container-name', container, '--image', image, '--revision-suffix', suffix)
    for _ in range(60):
        current = az('containerapp', 'show', '--name', APP, '--resource-group', GROUP)['properties']
        if current.get('latestReadyRevisionName') == revision:
            break
        time.sleep(10)
    else:
        raise RuntimeError('New revision did not become ready within 10 minutes; inspect Azure before retrying')
    deployed = az('containerapp', 'revision', 'show', '--name', APP,
                  '--resource-group', GROUP, '--revision', revision)
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
