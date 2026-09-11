import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DemoAuthStore, DEMO_PHONE, DEMO_OTP, SESSION_TTL } from '../app/lib/demo-auth-store.ts';

const loginTime = Date.parse('2026-09-10T16:59:00Z');
function fixture(fn: (store: DemoAuthStore, path: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'telemed-auth-test-'));
  const path = join(dir, 'sessions.sqlite');
  const store = new DemoAuthStore(path);
  try { fn(store, path); } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
}
function login(store: DemoAuthStore, time = loginTime) {
  const challenge = store.send(DEMO_PHONE, time);
  return store.verify(challenge.challengeId, DEMO_OTP, undefined, time);
}
test('demo login creates an opaque session for 30 days without storing the raw token', () => fixture((store, path) => {
  const result = login(store);
  assert.match(result.token, /^[a-f0-9]{64}$/);
  assert.equal(result.expiresAt, loginTime + SESSION_TTL);
  assert.equal(result.customer.customerId, 'TL-DEMO-LOGIN01');
  assert.equal(readFileSync(path).includes(Buffer.from(result.token)), false);
  assert.equal(store.session('fake-token'), null);
}));
test('renews once per Bangkok calendar day, including across separate connections', () => fixture((store, path) => {
  const { token } = login(store);
  assert.equal(store.session(token, true, loginTime + 1000)?.renewed, false);
  const midnight = Date.parse('2026-09-10T17:00:00Z');
  const renewed = store.session(token, true, midnight)!;
  assert.equal(renewed.renewed, true);
  assert.equal(renewed.renewedDay, '2026-09-11');
  assert.equal(renewed.expiresAt, midnight + SESSION_TTL);
  const second = new DemoAuthStore(path);
  try {
    const again = second.session(token, true, midnight + 3600000)!;
    assert.equal(again.renewed, false);
    assert.equal(again.expiresAt, renewed.expiresAt);
    assert.equal(second.session(token, true, midnight + 86400000)?.renewed, true);
  } finally { second.close(); }
}));
test('GET-style reads never extend a session and expiry cannot be revived', () => fixture(store => {
  const { token, expiresAt } = login(store);
  assert.equal(store.session(token, false, loginTime + 86400000)?.expiresAt, expiresAt);
  assert.equal(store.session(token, true, expiresAt), null);
}));
test('logout revokes a session for all connections', () => fixture((store, path) => {
  const { token } = login(store);
  store.logout(token);
  const other = new DemoAuthStore(path);
  try { assert.equal(other.session(token, true, loginTime + 86400000), null); } finally { other.close(); }
}));
test('OTP is one-time, expires after 5 minutes and locks after 5 failed attempts', () => fixture(store => {
  const first = store.send(DEMO_PHONE, loginTime);
  for (let i = 0; i < 5; i++) assert.throws(() => store.verify(first.challengeId, '999999', undefined, loginTime), /OTP/);
  assert.throws(() => store.verify(first.challengeId, DEMO_OTP, undefined, loginTime), /OTP/);
  const second = store.send(DEMO_PHONE, loginTime + 60001);
  assert.throws(() => store.verify(second.challengeId, DEMO_OTP, undefined, loginTime + 360001), /OTP/);
  const third = store.send(DEMO_PHONE, loginTime + 420002);
  store.verify(third.challengeId, DEMO_OTP, undefined, loginTime + 420002);
  assert.throws(() => store.verify(third.challengeId, DEMO_OTP, undefined, loginTime + 420003), /OTP/);
}));
test('only the isolated demo phone can authenticate; resend is rate limited', () => fixture(store => {
  const challenge = store.send('0812345678', loginTime);
  assert.throws(() => store.verify(challenge.challengeId, DEMO_OTP, undefined, loginTime), /OTP/);
  assert.throws(() => store.send('0812345678', loginTime + 1000), /กรุณารอ/);
}));
test('a new successful login revokes the previous browser session', () => fixture(store => {
  const old = login(store);
  const next = store.send(DEMO_PHONE, loginTime + 60001);
  const current = store.verify(next.challengeId, DEMO_OTP, old.token, loginTime + 60001);
  assert.equal(store.session(old.token, false, loginTime + 60001), null);
  assert.ok(store.session(current.token, false, loginTime + 60001));
}));
test('signup proof is phone-bound and the issued session uses the saved TL customer', () => fixture(store => {
  const phone = '0812345678';
  const challenge = store.send(phone, loginTime);
  const { proof } = store.verifySignup(challenge.challengeId, DEMO_OTP, phone, loginTime);
  assert.throws(() => store.signupKey(proof, '0899999999', loginTime), /OTP/);
  assert.throws(() => store.verifySignup(challenge.challengeId, DEMO_OTP, phone, loginTime), /OTP/);
  const customer = { customerId: 'TL-TEST-01', name: 'Registration test', phone };
  const session = store.finishSignup(proof, customer, '', loginTime);
  assert.deepEqual(store.session(session.token, false, loginTime)?.customer, customer);
  const next = store.send(phone, loginTime + 60001);
  const loggedIn = store.verify(next.challengeId, DEMO_OTP, session.token, loginTime + 60001);
  assert.deepEqual(loggedIn.customer, customer);
  assert.equal(store.session(session.token, false, loginTime + 60001), null);
}));
test('expired signup proof cannot create a session', () => fixture(store => {
  const phone = '0812345678';
  const challenge = store.send(phone, loginTime);
  const { proof } = store.verifySignup(challenge.challengeId, DEMO_OTP, phone, loginTime);
  assert.throws(() => store.finishSignup(proof, { customerId: 'TL-TEST', name: 'Test', phone }, '', loginTime + 1800001), /OTP/);
}));
