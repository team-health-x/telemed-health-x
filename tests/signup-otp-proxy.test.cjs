const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const { createHmac } = require('node:crypto');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);

test('signup OTP proxy validates origin and forwards send/verify only to the backend', async () => {
  process.env.NODE_ENV = 'development';
  process.env.TELEMED_DEPLOY_ENV = 'dev';
  process.env.TELEMED_DEV_ORIGINS = 'https://telemed.example.test';
  process.env.TELEMED_DEMO_AUTH_ENABLED = 'true';
  process.env.TELEMED_WORKFLOW_ORIGIN = 'https://backend.example.test';
  process.env.TELEMED_DEMO_BRIDGE_SECRET = 's'.repeat(32);
  process.env.TELEMED_OTP_CALLER_HMAC_KEY = 'c'.repeat(40);
  process.env.TELEMED_OTP_INGRESS_HMAC_KEY = 'i'.repeat(40);
  process.env.TELEMED_CLINIC_ID = 'SYNTHETIC'; process.env.TELEMED_BRANCH_ID = '15';
  const originalLoad = Module._load;
  Module._load = function(id, ...args) {
    if (id === 'next/headers') return { cookies: async () => ({ get: () => undefined }) };
    return originalLoad.call(this, id, ...args);
  };
  const { POST } = require('../app/api/telemed/signup-otp/[action]/route.ts');
  Module._load = originalLoad;
  const original = global.fetch, calls = [];
  const request = (body, origin = 'https://telemed.example.test', valid = true) => {
    const at = String(Date.now()), caller = '192.0.2.1';
    return new Request('https://telemed.example.test/api/telemed/signup-otp/send', {
      method: 'POST', headers: { host: 'telemed.example.test', origin, 'content-type': 'application/json',
        'x-telemed-ingress-caller': caller, 'x-telemed-ingress-at': at,
        'x-telemed-ingress-signature': valid ? createHmac('sha256', process.env.TELEMED_OTP_INGRESS_HMAC_KEY).update(JSON.stringify(['https://telemed.example.test', caller, at])).digest('hex') : '' },
      body: JSON.stringify(body),
    });
  };
  const context = action => ({ params: Promise.resolve({ action }) });
  global.fetch = async (url, options) => {
    calls.push({ url: String(url), body: JSON.parse(options.body) });
    return Response.json({ status: '0000', data: { challengeId: 'test' } });
  };
  try {
    assert.equal((await POST(request({ phone: '0812345678' }), context('send'))).status, 200);
    assert.equal((await POST(request({ phone: '0812345678', challengeId: 'test', code: '654321' }), context('verify'))).status, 200);
    assert.equal(calls[0].url, 'https://backend.example.test/api/v1/telemed/registration-otp/send');
    assert.equal(calls[1].body.code, '654321');
    assert.equal((await POST(request({ phone: '0812345678' }, 'https://evil.test'), context('send'))).status, 403);
    assert.equal((await POST(request({ phone: 'bad' }), context('send'))).status, 400);
    assert.equal((await POST(request({ phone: '0812345678' }, undefined, false), context('send'))).status, 403);
    assert.equal(calls.length, 2);
  } finally { global.fetch = original; }
});

test('registration UI no longer uses a fixed OTP and resets proof on identity changes', () => {
  const source = fs.readFileSync('app/register/registration-flow.tsx', 'utf8');
  assert.ok(!source.includes('MOCK_OTP'));
  assert.ok(!source.includes('รหัสสำหรับทดสอบ: 123456'));
  assert.ok(source.includes("'/api/telemed/signup-otp/send'"));
  assert.ok(source.includes("'/api/telemed/signup-otp/verify'"));
  assert.match(source, /if \(key === "documentNumber" \|\| key === "primaryPhone"\) \{\s*setOtpVerified\(false\);\s*setSignupProof\(''\)/);
});

test('local signup bypass requires development, local deployment and loopback backend', async () => {
  const saved = { ...process.env }, original = global.fetch;
  process.env.NODE_ENV = 'development';
  process.env.TELEMED_DEPLOY_ENV = 'local';
  process.env.TELEMED_DEMO_AUTH_ENABLED = 'true';
  process.env.TELEMED_WORKFLOW_ORIGIN = 'http://127.0.0.1:3001';
  process.env.TELEMED_API_ORIGIN = 'http://127.0.0.1:3001';
  process.env.TELEMED_DEMO_BRIDGE_SECRET = 's'.repeat(32);
  const { POST } = require('../app/api/telemed/signup-otp/[action]/route.ts');
  const request = () => new Request('http://localhost:3100/api/telemed/signup-otp/local', {
    method: 'POST', headers: { host: 'localhost:3100', origin: 'http://localhost:3100', 'content-type': 'application/json' }, body: JSON.stringify({ phone: '0812345678' }),
  });
  let calls = 0;
  global.fetch = async url => {
    calls++;
    assert.equal(String(url), 'http://127.0.0.1:3001/api/v1/telemed/workflow/local/signup-proof');
    return Response.json({ status: '0000', data: { proof: 'test-proof' } });
  };
  try {
    assert.equal((await POST(request(), { params: Promise.resolve({ action: 'local' }) })).status, 200);
    for (const env of ['dev', 'prod']) {
      process.env.TELEMED_DEPLOY_ENV = env;
      assert.ok((await POST(request(), { params: Promise.resolve({ action: 'local' }) })).status >= 400);
    }
    process.env.TELEMED_DEPLOY_ENV = 'local';
    process.env.NODE_ENV = 'production';
    assert.ok((await POST(request(), { params: Promise.resolve({ action: 'local' }) })).status >= 400);
    process.env.NODE_ENV = 'development';
    process.env.TELEMED_API_ORIGIN = process.env.TELEMED_WORKFLOW_ORIGIN = 'https://backend.example.test';
    assert.equal((await POST(request(), { params: Promise.resolve({ action: 'local' }) })).status, 404);
    assert.equal(calls, 1);
  } finally {
    global.fetch = original;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
