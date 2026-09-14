import test from 'node:test';
import assert from 'node:assert/strict';
import { telemedApiOrigin } from '../app/lib/telemed-api-origin.ts';

test('production requires explicit origins while existing Dev fallback is preserved', () => {
  const previous = { ...process.env };
  try {
    delete process.env.TELEMED_API_ORIGIN;
    delete process.env.TELEMED_WORKFLOW_ORIGIN;
    process.env.TELEMED_DEPLOY_ENV = 'prod';
    assert.equal(telemedApiOrigin(), '');
    assert.equal(telemedApiOrigin('catalog'), '');
    process.env.TELEMED_API_ORIGIN = ' https://catalog.example.com ';
    process.env.TELEMED_WORKFLOW_ORIGIN = 'https://workflow.example.com';
    assert.equal(telemedApiOrigin('catalog'), 'https://catalog.example.com');
    assert.equal(telemedApiOrigin(), 'https://workflow.example.com');
    delete process.env.TELEMED_WORKFLOW_ORIGIN;
    process.env.TELEMED_DEPLOY_ENV = 'dev';
    assert.match(telemedApiOrigin(), /kindrock/);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  }
});
