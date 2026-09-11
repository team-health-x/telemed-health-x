import { join } from 'node:path';
import { DemoAuthStore } from './demo-auth-store';
import { demoEnabled } from './telemed-dev-policy';
export { demoEnabled } from './telemed-dev-policy';

export const DEMO_COOKIE = 'telemed_demo_session';
export function withDemoStore<T>(fn: (store: DemoAuthStore) => T): T {
  if (!demoEnabled()) throw new Error('Demo authentication is disabled');
  const store = new DemoAuthStore(process.env.TELEMED_SESSION_DB_PATH || join(process.cwd(), '.local', 'telemed-demo-auth.sqlite'));
  try { return fn(store); } finally { store.close(); }
}
