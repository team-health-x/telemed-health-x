import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedRequestOrigin, demoEnabled, validMutation } from '../app/lib/telemed-dev-policy.ts';

test('Dev deployment is explicit, HTTPS-only and origin-scoped', () => {
  const previous = { ...process.env };
  try {
    process.env.NODE_ENV = 'production';
    process.env.TELEMED_DEMO_AUTH_ENABLED = 'true';
    delete process.env.TELEMED_DEPLOY_ENV;
    assert.equal(demoEnabled(), false);
    process.env.TELEMED_DEPLOY_ENV = 'dev';
    delete process.env.TELEMED_SESSION_DB_PATH;
    assert.equal(demoEnabled(), false);
    process.env.TELEMED_SESSION_DB_PATH = '/data/auth.sqlite';
    process.env.TELEMED_DEV_ORIGINS = 'https://telemed-dev.example.com';
    const request = (host: string, origin: string) => new Request('http://internal:3000/api', { headers: { host, origin } });
    const good = request('telemed-dev.example.com', 'https://telemed-dev.example.com');
    assert.equal(allowedRequestOrigin(good), 'https://telemed-dev.example.com');
    assert.equal(validMutation(good, allowedRequestOrigin(good)!), true);
    assert.equal(allowedRequestOrigin(request('evil.example.com', 'https://telemed-dev.example.com')), null);
    assert.equal(validMutation(request('telemed-dev.example.com', 'https://evil.example.com'), allowedRequestOrigin(good)!), false);
    process.env.TELEMED_DEV_ORIGINS = 'http://telemed-dev.example.com';
    assert.equal(allowedRequestOrigin(good), null);
    process.env.TELEMED_DEPLOY_ENV = 'prod';
    assert.equal(demoEnabled(), false);
    delete process.env.TELEMED_DEPLOY_ENV;
    process.env.NODE_ENV = 'development';
    assert.equal(allowedRequestOrigin(request('localhost:3100', 'http://localhost:3100')), 'http://localhost:3100');
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  }
});
