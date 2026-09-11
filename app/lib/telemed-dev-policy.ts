export function hostedDev() {
  return process.env.TELEMED_DEPLOY_ENV === 'dev';
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
  if (!demoEnabled()) return null;
  const host = request.headers.get('host') || '';
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
