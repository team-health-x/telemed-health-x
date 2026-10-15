import { telemedApiOrigin } from './telemed-api-origin';

export function localLoginEnabled() {
  if (process.env.NODE_ENV !== 'development' || process.env.TELEMED_LOCAL_LOGIN !== 'true') return false;
  if (process.env.TELEMED_DEPLOY_ENV && process.env.TELEMED_DEPLOY_ENV !== 'local') return false;
  try {
    const url = new URL(telemedApiOrigin());
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch { return false; }
}
