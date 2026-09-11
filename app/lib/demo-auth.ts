import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { demoEnabled } from './telemed-dev-policy';
export { demoEnabled } from './telemed-dev-policy';

export const DEMO_COOKIE = 'telemed_demo_session';
export class DemoAuthError extends Error {
  constructor(message: string, public status = 401) { super(message); }
}
type Customer = { customerId: string; name: string; phone: string };
type Ticket = { kind: string; expiresAt: number; phone?: string; customer?: Customer; nonce: string };
function secret() {
  const value = process.env.TELEMED_SESSION_SECRET || process.env.TELEMED_DEMO_BRIDGE_SECRET || '';
  if (value.length < 32) throw new Error('Session secret is not configured');
  return value;
}
function sign(value: Omit<Ticket, 'nonce'>) {
  const body = Buffer.from(JSON.stringify({ ...value, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  const mac = createHmac('sha256', secret()).update(`telemed-dev-v1:${body}`).digest('base64url');
  return `${body}.${mac}`;
}
function read(token: string, kind: string): Ticket | null {
  try {
    if (typeof token !== 'string' || token.length > 4096) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const expected = createHmac('sha256', secret()).update(`telemed-dev-v1:${parts[0]}`).digest();
    const received = Buffer.from(parts[1], 'base64url');
    if (received.length !== expected.length || !timingSafeEqual(expected, received)) return null;
    const value = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')) as Ticket;
    return value.kind === kind && Number.isFinite(value.expiresAt) && value.expiresAt > Date.now() ? value : null;
  } catch { return null; }
}

// Dev-only signed tickets work across serverless instances without local files.
// Logout clears the browser cookie; copied tickets expire after eight hours.
class DevAuth {
  send(phone: string) {
    if (!/^0[689]\d{8}$/.test(phone)) throw new DemoAuthError('เบอร์โทรศัพท์ไม่ถูกต้อง', 400);
    const expiresAt = Date.now() + 300000;
    return { challengeId: sign({ kind: 'challenge', phone, expiresAt }), expiresAt, resendAt: Date.now() + 60000 };
  }
  verifySignup(challenge: string, code: string, phone: string) {
    if (code !== '123456' || read(challenge, 'challenge')?.phone !== phone) throw new DemoAuthError('OTP ไม่ถูกต้องหรือหมดอายุ');
    return { proof: sign({ kind: 'signup', phone, expiresAt: Date.now() + 1800000 }) };
  }
  signupKey(proof: string, phone: string) {
    if (read(proof, 'signup')?.phone !== phone) throw new DemoAuthError('กรุณายืนยัน OTP อีกครั้ง');
    return createHash('sha256').update(proof).digest('hex');
  }
  issue(customer: Customer) {
    if (!customer?.customerId?.startsWith('TL-') || !/^0[689]\d{8}$/.test(customer.phone)) throw new Error('Invalid customer');
    const expiresAt = Date.now() + 8 * 3600000;
    return { customer, expiresAt, token: sign({ kind: 'session', customer, expiresAt }) };
  }
  finishSignup(proof: string, customer: Customer, _old = '') {
    this.signupKey(proof, customer.phone);
    return this.issue(customer);
  }
  session(token: string, _renew = false) {
    const value = read(token, 'session');
    return value?.customer?.customerId?.startsWith('TL-') ? { customer: value.customer, expiresAt: value.expiresAt } : null;
  }
  logout(_token: string) {}
}
export function withDemoStore<T>(fn: (store: DevAuth) => T): T {
  if (!demoEnabled()) throw new Error('Demo authentication is disabled');
  return fn(new DevAuth());
}
