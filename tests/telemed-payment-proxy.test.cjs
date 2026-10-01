const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
let cookie = '';
const originalLoad = Module._load;
Module._load = function(id, ...args) {
  if (id === 'next/headers') return { cookies: async () => ({ get: () => ({ value: cookie }) }) };
  return originalLoad.call(this, id, ...args);
};
const route = require('../app/api/telemed/payments/[id]/route.ts');
Module._load = originalLoad;
const { withDemoStore } = require('../app/lib/demo-auth.ts');
const context = { params: Promise.resolve({ id: 'payment-1' }) };
const request = (method = 'GET', body, origin = 'http://localhost:3100') => new Request('http://localhost:3100/api/telemed/payments/payment-1', {
  method, headers: { host: 'localhost:3100', origin, 'content-type': 'application/json', 'x-telemed-customer': 'TL-FORGED' }, ...(body ? { body: JSON.stringify(body) } : {}),
});
test('payment proxy requires signed owner, rejects CSRF/oversize bodies and disables caching', async () => {
  Object.assign(process.env, { NODE_ENV: 'development', TELEMED_DEPLOY_ENV: 'local', TELEMED_DEMO_AUTH_ENABLED: 'true',
    TELEMED_SESSION_SECRET: 'test-session-'.repeat(4), TELEMED_DEMO_BRIDGE_SECRET: 'test-bridge-'.repeat(4), TELEMED_WORKFLOW_ORIGIN: 'http://127.0.0.1:3001' });
  const originalFetch = global.fetch; const calls = [];
  global.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ status: '0000', data: { status: 'PENDING_REVIEW' } }); };
  try {
    assert.equal((await route.GET(request(), context)).status, 401); assert.equal(calls.length, 0);
    cookie = withDemoStore(store => store.issue({ customerId: 'TL-TEST', name: 'Test', phone: '0812345678' })).token;
    assert.equal((await route.POST(request('POST', { text: 'x' }, 'https://evil.example'), context)).status, 403);
    assert.equal(calls.length, 0);
    const response = await route.POST(request('POST', { text: 'x', customerId: 'TL-FORGED' }), context);
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(calls[0].options.headers['x-telemed-customer'], 'TL-TEST');
    assert.equal(calls[0].url.pathname, '/api/v1/telemed/workflow/demo/payments/payment-1');
    assert.equal((await route.POST(request('POST', { text: 'x'.repeat(4_220_001) }), context)).status, 413);
    assert.equal((await route.GET(request(), { params: Promise.resolve({ id: '../other' }) })).status, 404);
    cookie += 'invalid'; assert.equal((await route.GET(request(), context)).status, 401);
    process.env.TELEMED_DEMO_AUTH_ENABLED = 'false'; assert.equal((await route.GET(request(), context)).status, 404);
  } finally { global.fetch = originalFetch; }
});
