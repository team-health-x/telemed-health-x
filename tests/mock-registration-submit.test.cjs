const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);

test('confirm registration calls register directly, not OTP endpoints', () => {
  const source = ts.createSourceFile('registration-flow.tsx', fs.readFileSync('app/register/registration-flow.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let submit;
  const visit = node => { if (ts.isFunctionDeclaration(node) && node.name?.text === 'submitRegistration') submit = node; ts.forEachChild(node, visit); };
  visit(source);
  assert.ok(submit);
  const urls = [];
  const collect = node => { if (ts.isCallExpression(node) && node.expression.getText(source) === 'fetch') urls.push(node.arguments[0].text); ts.forEachChild(node, collect); };
  collect(submit);
  assert.deepEqual(urls, ['/api/telemed/register']);
});

test('Dev register forwards one request and reuses its key without an OTP request', async () => {
  process.env.NODE_ENV = 'development';
  process.env.TELEMED_DEPLOY_ENV = 'local';
  process.env.TELEMED_DEMO_AUTH_ENABLED = 'true';
  process.env.TELEMED_WORKFLOW_ORIGIN = 'https://backend.example.test';
  process.env.TELEMED_DEMO_BRIDGE_SECRET = 's'.repeat(32);
  const { POST } = require('../app/api/telemed/register/route.ts');
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return Response.json({ status: '0000', data: { customerId: 'TL-TEST', name: 'Test', phone: '0812345678' } });
  };
  const body = { requestId: '1b5de1aa-14b6-45f0-9f12-65777b790cd4', mockOtp: '123456', signup: { phoneNumber: '0812345678' } };
  const request = data => new Request('http://localhost:3100/api/telemed/register', { method: 'POST', headers: { host: 'localhost:3100', origin: 'http://localhost:3100', 'content-type': 'application/json' }, body: JSON.stringify(data) });
  try {
    for (let i = 0; i < 2; i++) {
      const result = await POST(request(body));
      assert.equal(result.status, 200);
      assert.match(result.headers.get('set-cookie'), /HttpOnly/i);
    }
    assert.equal(calls.length, 2);
    assert.ok(calls.every(call => call.url === 'https://backend.example.test/api/v1/telemed/register'));
    assert.equal(calls[0].options.headers['x-registration-key'], calls[1].options.headers['x-registration-key']);
    assert.equal((await POST(request({ ...body, mockOtp: '000000' }))).status, 400);
    assert.equal(calls.length, 2);
  } finally { global.fetch = originalFetch; }
});
