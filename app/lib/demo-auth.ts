import { join } from 'node:path';
import { DemoAuthStore } from './demo-auth-store';

export const DEMO_COOKIE = 'telemed_demo_session';
export function demoEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.TELEMED_DEMO_AUTH_ENABLED === 'true';
}
export function withDemoStore<T>(fn: (store: DemoAuthStore) => T): T {
  if (!demoEnabled()) throw new Error('Demo authentication is disabled');
  const store = new DemoAuthStore(join(process.cwd(), '.local', 'telemed-demo-auth.sqlite'));
  try { return fn(store); } finally { store.close(); }
}
