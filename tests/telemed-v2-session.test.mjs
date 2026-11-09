import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const savedEnv = { ...process.env }, savedFetch = globalThis.fetch;
const dataUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
function compile(file, imports = {}) {
  let code = ts.transpileModule(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const [from, to] of Object.entries(imports)) code = code.replaceAll("'" + from + "'", JSON.stringify(to));
  return dataUrl(code);
}
const originModule = compile('app/lib/telemed-api-origin.ts');
const policyModule = compile('app/lib/telemed-dev-policy.ts');
const authModule = dataUrl("export const DEMO_COOKIE='telemed_demo_session'; export class DemoAuthError extends Error { constructor(message,status){super(message);this.status=status;} }");
const sessionModule = compile('app/lib/telemed-v2-session.ts', { './telemed-api-origin': originModule, './demo-auth': authModule });
const session = await import(sessionModule);
const callerModule = compile('app/lib/telemed-otp-caller.ts', { './demo-auth': authModule });
const route = await import(compile('app/api/telemed/auth/[action]/route.ts', {
  'next/headers': dataUrl('export async function cookies(){ return {get:()=>({value:globalThis.__telemedTestCookie})}; }'),
  'next/server': pathToFileURL(require.resolve('next/server.js')).href,
  '../../../../lib/local-login': dataUrl('export function localLoginEnabled(){return false;}'),
  '../../../../lib/demo-auth': authModule,
  '../../../../lib/telemed-v2-session': sessionModule,
  '../../../../lib/telemed-api-origin': originModule,
  '../../../../lib/telemed-dev-policy': policyModule,
  '../../../../lib/telemed-otp-caller': callerModule,
}));
const capabilities = await import(compile('app/api/telemed/capabilities/route.ts', { '../../../lib/telemed-api-origin': originModule }));
const policy = await import(policyModule);
const token = 't'.repeat(43), customer = { customerId: 'TL-TEST', name: 'Synthetic User', phone: '0812345678' };
let calls = [];
const context = action => ({ params: Promise.resolve({ action }) });
const request = (action, body, origin = 'https://telemed.theritzclinic.com') => new Request('https://telemed.theritzclinic.com/api/telemed/auth/' + action, {
  method: 'POST', headers: { host: 'telemed.theritzclinic.com', origin, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
  body: JSON.stringify(body ?? {}),
});
beforeEach(() => {
  Object.assign(process.env, { TELEMED_DEPLOY_ENV: 'prod', TELEMED_PRODUCTION_ENABLED: 'true', TELEMED_DEMO_AUTH_ENABLED: 'false',
    TELEMED_PUBLIC_ORIGIN: 'https://telemed.theritzclinic.com', TELEMED_V2_API_ORIGIN: 'https://v2.example.invalid',
    TELEMED_API_ORIGIN: 'https://v2.example.invalid', TELEMED_WORKFLOW_ORIGIN: 'https://v2.example.invalid',
    TELEMED_SESSION_SECRET: 's'.repeat(40), TELEMED_DEMO_BRIDGE_SECRET: 'b'.repeat(40) });
  globalThis.__telemedTestCookie = token; calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url: String(url), options });
    return Response.json({ status: '0000', data: { customer, expiresAt: Date.now() + 60 * 60000 } }); };
});
after(() => { globalThis.fetch = savedFetch; delete globalThis.__telemedTestCookie;
  for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key]; Object.assign(process.env, savedEnv); });
test('accepts the B+ 60-minute login while rejecting expired, excessive and malformed credentials', () => {
  const login = { ...customer, sessionToken: token, expiresAt: Date.now() + 60 * 60000 };
  assert.equal(session.acceptBackendLogin(login).token, token);
  for (const patch of [{ expiresAt: Date.now() - 1 }, { expiresAt: Date.now() + 2 * 3600000 }, { sessionToken: 'old-v1-ticket' }])
    assert.throws(() => session.acceptBackendLogin({ ...login, ...patch }), { status: 502 });
});
test('introspection forwards opaque credentials only to the backend and projects no bearer material', async () => {
  const result = await session.backendSession(token); assert.deepEqual(result.customer, customer);
  assert.equal(calls[0].options.headers['x-telemed-session'], token);
  assert.equal(calls[0].options.headers['x-telemed-bridge'], 'b'.repeat(40));
  assert.equal(calls[0].options.redirect, 'error'); assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(JSON.stringify(result).includes(token), false);
});
test('revoked sessions and old V1 tickets have no local fallback', async () => {
  globalThis.fetch = async () => new Response(null, { status: 401 });
  assert.equal(await session.backendSession(token), null);
  assert.equal(await session.backendSession('signed.v1.ticket'), null);
});
test('backend logout failure remains retryable rather than claiming revocation', async () => {
  globalThis.fetch = async () => new Response(null, { status: 503 });
  await assert.rejects(session.backendLogout(token), { status: 503 });
  globalThis.fetch = async () => new Response(null, { status: 401 }); await session.backendLogout(token);
});
test('login sets an eight-hour HttpOnly secure host-only cookie and never returns its token', async () => {
  globalThis.fetch = async () => Response.json({ status: '0000', data: { ...customer, sessionToken: token, expiresAt: Date.now() + 60 * 60000 } });
  const response = await route.POST(request('verify-otp', { phone: customer.phone, challengeId: 'synthetic', code: '123456' }), context('verify-otp'));
  assert.equal(response.status, 200); const cookie = response.headers.get('set-cookie');
  for (const part of ['HttpOnly', 'Secure', 'SameSite=strict', 'Max-Age=28800', 'Path=/']) assert.ok(cookie.includes(part), part);
  assert.equal(/Domain=/i.test(cookie), false); assert.equal(JSON.stringify(await response.json()).includes(token), false);
});
test('activity uses the backend sliding deadline without resetting absolute cookie custody', async () => {
  const response = await route.POST(request('session'), context('session'));
  assert.equal(response.status, 200); assert.equal(response.headers.get('set-cookie'), null);
  assert.ok((await response.json()).expiresAt > Date.now());
});
test('logout keeps the cookie on unavailable revocation and clears it only after acknowledgement', async () => {
  globalThis.fetch = async () => new Response(null, { status: 503 });
  const failed = await route.POST(request('logout'), context('logout'));
  assert.equal(failed.status, 503); assert.equal(failed.headers.get('set-cookie'), null);
  globalThis.fetch = async () => Response.json({ status: '0000', data: {} });
  const success = await route.POST(request('logout'), context('logout'));
  assert.equal(success.status, 200); assert.ok(success.headers.get('set-cookie').includes('Max-Age=0'));
});
test('cross-site authentication changes are denied before any upstream call', async () => {
  const response = await route.POST(request('logout', {}, 'https://other.example.invalid'), context('logout'));
  assert.equal(response.status, 403); assert.equal(calls.length, 0);
});
test('idle and absolute expiration require fresh authentication', async () => {
  globalThis.fetch = async () => new Response(null, { status: 401 });
  const response = await route.POST(request('session'), context('session'));
  assert.equal(response.status, 401); assert.equal(response.headers.get('set-cookie'), null);
});
test('unavailable or malformed capabilities keep maintenance visible', async () => {
  for (const payload of [{ status: '0000', data: {} }, { status: '9999', data: { enabled: true } }]) {
    globalThis.fetch = async () => Response.json(payload);
    const response = await capabilities.GET(); assert.equal(response.status, 503); assert.equal((await response.json()).enabled, false);
  }
});
test('backend capability switch controls maintenance and production defaults closed', async () => {
  globalThis.fetch = async () => Response.json({ status: '0000', data: { enabled: false } });
  assert.equal((await (await capabilities.GET()).json()).maintenance, true);
  process.env.TELEMED_PRODUCTION_ENABLED = 'false'; assert.equal(policy.productionEnabled(), false);
  const response = await route.POST(request('session'), context('session')); assert.equal(response.status, 404);
});
