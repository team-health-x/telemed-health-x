export function hostedDev() {
  return process.env.TELEMED_DEPLOY_ENV === 'dev';
}

export function productionEnabled() {
  const secret = process.env.TELEMED_SESSION_SECRET || '';
  const bridge = process.env.TELEMED_DEMO_BRIDGE_SECRET || '';
  const backend = 'https://healthx-api.nicemoss-83033b3e.southeastasia.azurecontainerapps.io';
  return process.env.TELEMED_DEPLOY_ENV === 'prod' &&
    process.env.TELEMED_PRODUCTION_ENABLED === 'true' &&
    process.env.TELEMED_DEMO_AUTH_ENABLED === 'false' &&
    process.env.TELEMED_PUBLIC_ORIGIN === 'https://telemed.theritzclinic.com' &&
    process.env.TELEMED_API_ORIGIN === backend && process.env.TELEMED_WORKFLOW_ORIGIN === backend &&
    secret.length >= 32 && bridge.length >= 32 && secret !== bridge &&
    !secret.startsWith('secretref:') && !bridge.startsWith('secretref:');
}

export function authEnabled() {
  return productionEnabled() || demoEnabled();
}

export function demoEnabled() {
  if (process.env.TELEMED_DEPLOY_ENV && !['local', 'dev'].includes(process.env.TELEMED_DEPLOY_ENV)) return false;
  return process.env.TELEMED_DEMO_AUTH_ENABLED === 'true' && (
    hostedDev()
      ? (process.env.TELEMED_SESSION_SECRET || process.env.TELEMED_DEMO_BRIDGE_SECRET || '').length >= 32
      : process.env.NODE_ENV === 'development'
  );
}

// Use configured external origins behind a TLS proxy; never trust forwarded headers.
export function allowedRequestOrigin(request: Request): string | null {
  if (!authEnabled()) return null;
  const host = request.headers.get('host') || '';
  if (process.env.TELEMED_DEPLOY_ENV === 'prod') {
    return host === 'telemed.theritzclinic.com' ? 'https://telemed.theritzclinic.com' : null;
  }
  if (!hostedDev()) {
    return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)
      ? `${new URL(request.url).protocol}//${host}` : null;
  }
  for (const entry of (process.env.TELEMED_DEV_ORIGINS || '').split(',')) {
    try {
      const origin = new URL(entry.trim());
      if (origin.protocol === 'https:' && origin.origin === entry.trim() && origin.host === host) return origin.origin;
    } catch { /* Invalid entries grant no access. */ }
  }
  return null;
}

export function validMutation(request: Request, origin: string) {
  return request.headers.get('origin') === origin && request.headers.get('sec-fetch-site') !== 'cross-site';
}
