const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const { withDemoStore } = require('../app/lib/demo-auth.ts');

test('signed Dev sessions isolate customers, survive new store instances and reject tampering', () => {
  process.env.NODE_ENV = 'development';
  process.env.TELEMED_DEPLOY_ENV = 'local';
  process.env.TELEMED_DEMO_AUTH_ENABLED = 'true';
  process.env.TELEMED_SESSION_SECRET = 'test-secret-'.repeat(4);
  const customer = { customerId: 'TL-00001', name: 'Test', phone: '0812345678' };
  const issued = withDemoStore(store => store.issue(customer));
  assert.deepEqual(withDemoStore(store => store.session(issued.token)).customer, customer);
  assert.equal(withDemoStore(store => store.session(issued.token + 'x')), null);
  const second = withDemoStore(store => store.issue({ ...customer, customerId: 'TL-00002', phone: '0891112233' }));
  assert.equal(withDemoStore(store => store.session(second.token)).customer.customerId, 'TL-00002');
  const sent = withDemoStore(store => store.send(customer.phone));
  assert.throws(() => withDemoStore(store => store.verifySignup(sent.challengeId, '000000', customer.phone)));
  const { proof } = withDemoStore(store => store.verifySignup(sent.challengeId, '123456', customer.phone));
  assert.throws(() => withDemoStore(store => store.signupKey(proof, '0891112233')));
  assert.equal(withDemoStore(store => store.session(proof)), null);
  assert.equal(withDemoStore(store => store.signupKey(proof, customer.phone)).length, 64);
  const originalNow = Date.now;
  try { Date.now = () => issued.expiresAt + 1; assert.equal(withDemoStore(store => store.session(issued.token)), null); }
  finally { Date.now = originalNow; }
});
