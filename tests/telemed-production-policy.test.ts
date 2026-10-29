import test from 'node:test';
import assert from 'node:assert/strict';
import { authEnabled, demoEnabled, allowedRequestOrigin, validMutation } from '../app/lib/telemed-dev-policy.ts';

test('Production requires real configuration and rejects test and cross-site origins', () => {
  const previous = { ...process.env };
  try {
    Object.assign(process.env, {
      TELEMED_DEPLOY_ENV: 'prod', TELEMED_PRODUCTION_ENABLED: 'true', TELEMED_DEMO_AUTH_ENABLED: 'false',
      TELEMED_PUBLIC_ORIGIN: 'https://telemed.theritzclinic.com',
      TELEMED_API_ORIGIN: 'https://healthx-api.nicemoss-83033b3e.southeastasia.azurecontainerapps.io',
      TELEMED_WORKFLOW_ORIGIN: 'https://healthx-api.nicemoss-83033b3e.southeastasia.azurecontainerapps.io',
      TELEMED_SESSION_SECRET: 's'.repeat(32), TELEMED_DEMO_BRIDGE_SECRET: 'b'.repeat(32),
    });
    const request = (host: string, origin = 'https://telemed.theritzclinic.com') =>
      new Request('http://internal:3000/api', { headers: { host, origin } });
    assert.equal(authEnabled(), true);
    assert.equal(demoEnabled(), false);
    const origin = allowedRequestOrigin(request('telemed.theritzclinic.com'))!;
    assert.equal(origin, 'https://telemed.theritzclinic.com');
    assert.equal(validMutation(request('telemed.theritzclinic.com'), origin), true);
    assert.equal(validMutation(request('telemed.theritzclinic.com', 'https://evil.example'), origin), false);
    for (const host of ['localhost:3100', 'evil.example', 'telemed.theritzclinic.com.evil.example']) {
      assert.equal(allowedRequestOrigin(request(host)), null);
    }
    for (const key of ['TELEMED_PRODUCTION_ENABLED', 'TELEMED_SESSION_SECRET', 'TELEMED_DEMO_BRIDGE_SECRET', 'TELEMED_PUBLIC_ORIGIN', 'TELEMED_API_ORIGIN', 'TELEMED_WORKFLOW_ORIGIN']) {
      const saved = process.env[key]; delete process.env[key];
      assert.equal(authEnabled(), false, key); process.env[key] = saved;
    }
    process.env.TELEMED_SESSION_SECRET = process.env.TELEMED_DEMO_BRIDGE_SECRET;
    assert.equal(authEnabled(), false);
    process.env.TELEMED_SESSION_SECRET = 's'.repeat(32);
    process.env.TELEMED_DEMO_AUTH_ENABLED = 'true';
    assert.equal(authEnabled(), false);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  }
});
