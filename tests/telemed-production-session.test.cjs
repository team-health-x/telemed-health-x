const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const previousLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};
const { withDemoStore } = require('../app/lib/demo-auth.ts');
require.extensions['.ts'] = previousLoader;

test('Production sessions validate signatures and never accept mock OTP', () => {
  const previous = { ...process.env };
  try {
    Object.assign(process.env, {
      TELEMED_DEPLOY_ENV: 'prod', TELEMED_PRODUCTION_ENABLED: 'true', TELEMED_DEMO_AUTH_ENABLED: 'false',
      TELEMED_PUBLIC_ORIGIN: 'https://telemed.theritzclinic.com',
      TELEMED_API_ORIGIN: 'https://healthx-api.nicemoss-83033b3e.southeastasia.azurecontainerapps.io',
      TELEMED_WORKFLOW_ORIGIN: 'https://healthx-api.nicemoss-83033b3e.southeastasia.azurecontainerapps.io',
      TELEMED_SESSION_SECRET: 's'.repeat(32), TELEMED_DEMO_BRIDGE_SECRET: 'b'.repeat(32),
    });
    withDemoStore(store => {
      const customer = { customerId: 'TL-test', name: 'Test', phone: '0812345678' };
      const issued = store.issue(customer);
      assert.deepEqual(store.session(issued.token).customer, customer);
      assert.equal(store.session('tampered.' + issued.token), null);
      assert.throws(() => store.send(customer.phone), /disabled/);
      assert.throws(() => store.verifySignup('test', '123456', customer.phone), /disabled/);
      assert.throws(() => store.finishSignup('test', customer), /disabled/);
      process.env.TELEMED_SESSION_SECRET = 'x'.repeat(32);
      assert.equal(store.session(issued.token), null);
      process.env.TELEMED_SESSION_SECRET = 's'.repeat(32);
      process.env.TELEMED_DEPLOY_ENV = 'dev';
      assert.equal(store.session(issued.token), null);
    });
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  }
});
