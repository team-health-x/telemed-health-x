import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const DEMO_PHONE = '0000000001';
export const DEMO_OTP = '123456';
export const SESSION_TTL = 30 * 86400000;
export const DEMO_CUSTOMER = { customerId: 'TL-DEMO-LOGIN01', name: 'ลูกค้าทดสอบ Telemed', phone: DEMO_PHONE };
export const bangkokDay = (now: number) => new Date(now + 7 * 3600000).toISOString().slice(0, 10);
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
type Challenge = { id: string; phone_hash: string; code_hash: string; created_at: number; expires_at: number; attempts: number; used: number };
type Session = { token_hash: string; expires_at: number; renewed_day: string; revoked: number };
type Customer = { customerId: string; name: string; phone: string };

export class DemoAuthError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

// Local development only: opaque sessions can map to customers saved in HV1 Dev.
export class DemoAuthStore {
  private db: DatabaseSync;
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    chmodSync(path, 0o600);
    this.db.exec(`PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY, phone_hash TEXT NOT NULL, code_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0, used INTEGER NOT NULL DEFAULT 0);
      CREATE INDEX IF NOT EXISTS challenges_phone_time ON challenges(phone_hash, created_at);
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL,
        renewed_day TEXT NOT NULL, revoked INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS signup_proofs (token_hash TEXT PRIMARY KEY, phone_hash TEXT NOT NULL, expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS registered_customers (phone_hash TEXT PRIMARY KEY, customer_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS session_customers (token_hash TEXT PRIMARY KEY, customer_json TEXT NOT NULL);`);
  }
  close() { this.db.close(); }
  private transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  send(phone: string, now = Date.now()) {
    if (!/^\d{10}$/.test(phone)) throw new DemoAuthError('กรอกเบอร์ทดสอบ 10 หลัก');
    return this.transaction(() => {
      this.db.prepare('DELETE FROM challenges WHERE created_at < ?').run(now - 86400000);
      this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
      this.db.prepare('DELETE FROM session_customers WHERE token_hash NOT IN (SELECT token_hash FROM sessions)').run();
      this.db.prepare('DELETE FROM signup_proofs WHERE expires_at <= ?').run(now);
      const recent = this.db.prepare('SELECT created_at, phone_hash FROM challenges WHERE created_at > ?').all(now - 3600000) as { created_at: number; phone_hash: string }[];
      const matching = recent.filter(c => c.phone_hash === hash(phone));
      if (recent.length >= 30 || matching.length >= 10 || matching.some(c => c.created_at > now - 60000)) {
        throw new DemoAuthError('กรุณารอสักครู่ก่อนขอ OTP อีกครั้ง', 429);
      }
      const id = randomBytes(32).toString('hex');
      this.db.prepare('INSERT INTO challenges(id,phone_hash,code_hash,created_at,expires_at) VALUES (?,?,?,?,?)')
        .run(id, hash(phone), hash(`${id}:${DEMO_OTP}`), now, now + 300000);
      return { challengeId: id, expiresAt: now + 300000, resendAt: now + 60000 };
    });
  }
  verify(challengeId: string, code: string, oldToken?: string, now = Date.now()) {
    if (!/^[a-f0-9]{64}$/.test(challengeId) || !/^\d{6}$/.test(code)) throw new DemoAuthError('OTP ไม่ถูกต้องหรือหมดอายุ', 401);
    const result = this.transaction(() => {
      const row = this.db.prepare('SELECT * FROM challenges WHERE id=?').get(challengeId) as Challenge | undefined;
      if (!row || row.used || row.attempts >= 5 || row.expires_at <= now) return null;
      this.db.prepare('UPDATE challenges SET attempts=attempts+1 WHERE id=?').run(challengeId);
      const registered = this.db.prepare('SELECT customer_json FROM registered_customers WHERE phone_hash=?').get(row.phone_hash) as { customer_json: string } | undefined;
      if (!timingSafeEqual(Buffer.from(row.code_hash, 'hex'), Buffer.from(hash(`${challengeId}:${code}`), 'hex')) || (!registered && row.phone_hash !== hash(DEMO_PHONE))) return null;
      const customer: Customer = registered ? JSON.parse(registered.customer_json) : DEMO_CUSTOMER;
      this.db.prepare('UPDATE challenges SET used=1 WHERE id=?').run(challengeId);
      const token = randomBytes(32).toString('hex');
      const expiresAt = now + SESSION_TTL;
      this.db.prepare('INSERT INTO sessions(token_hash,expires_at,renewed_day) VALUES (?,?,?)').run(hash(token), expiresAt, bangkokDay(now));
      if (registered) this.db.prepare('INSERT INTO session_customers VALUES (?,?)').run(hash(token), JSON.stringify(customer));
      if (oldToken) this.db.prepare('UPDATE sessions SET revoked=1 WHERE token_hash=?').run(hash(oldToken));
      return { token, expiresAt, renewedDay: bangkokDay(now), customer };
    });
    if (!result) throw new DemoAuthError('OTP ไม่ถูกต้องหรือหมดอายุ', 401);
    return result;
  }
  session(token: string, renew = false, now = Date.now()) {
    if (!/^[a-f0-9]{64}$/.test(token)) return null;
    return this.transaction(() => {
      let renewed = false;
      if (renew) {
        const updated = this.db.prepare('UPDATE sessions SET expires_at=?, renewed_day=? WHERE token_hash=? AND revoked=0 AND expires_at>? AND renewed_day<?')
          .run(now + SESSION_TTL, bangkokDay(now), hash(token), now, bangkokDay(now));
        renewed = Number(updated.changes) === 1;
      }
      const row = this.db.prepare('SELECT * FROM sessions WHERE token_hash=? AND revoked=0 AND expires_at>?').get(hash(token), now) as Session | undefined;
      const mapped = this.db.prepare('SELECT customer_json FROM session_customers WHERE token_hash=?').get(hash(token)) as { customer_json: string } | undefined;
      return row ? { expiresAt: row.expires_at, renewedDay: row.renewed_day, renewed, customer: mapped ? JSON.parse(mapped.customer_json) as Customer : DEMO_CUSTOMER } : null;
    });
  }
  logout(token: string) { this.db.prepare('UPDATE sessions SET revoked=1 WHERE token_hash=?').run(hash(token)); }
  verifySignup(challengeId: string, code: string, phone: string, now = Date.now()) {
    if (!/^[a-f0-9]{64}$/.test(challengeId) || !/^\d{6}$/.test(code) || !/^0[689]\d{8}$/.test(phone)) throw new DemoAuthError('OTP ไม่ถูกต้อง', 401);
    const proof = this.transaction(() => {
      const row = this.db.prepare('SELECT * FROM challenges WHERE id=?').get(challengeId) as Challenge | undefined;
      if (!row || row.used || row.attempts >= 5 || row.expires_at <= now) return null;
      this.db.prepare('UPDATE challenges SET attempts=attempts+1 WHERE id=?').run(challengeId);
      if (row.phone_hash !== hash(phone) || !timingSafeEqual(Buffer.from(row.code_hash, 'hex'), Buffer.from(hash(`${challengeId}:${code}`), 'hex'))) return null;
      this.db.prepare('UPDATE challenges SET used=1 WHERE id=?').run(challengeId);
      const token = randomBytes(32).toString('hex');
      this.db.prepare('INSERT INTO signup_proofs VALUES (?,?,?)').run(hash(token), hash(phone), now + 30 * 60000);
      return token;
    });
    if (!proof) throw new DemoAuthError('OTP ไม่ถูกต้องหรือหมดอายุ', 401);
    return { proof };
  }
  signupKey(proof: string, phone: string, now = Date.now()) {
    if (typeof proof !== 'string' || typeof phone !== 'string' || !/^[a-f0-9]{64}$/.test(proof)) throw new DemoAuthError('กรุณายืนยัน OTP', 401);
    const row = this.db.prepare('SELECT token_hash FROM signup_proofs WHERE token_hash=? AND phone_hash=? AND expires_at>?').get(hash(proof), hash(phone), now);
    if (!row) throw new DemoAuthError('กรุณายืนยัน OTP อีกครั้ง', 401);
    return hash(proof);
  }
  finishSignup(proof: string, customer: Customer, oldToken = '', now = Date.now()) {
    this.signupKey(proof, customer.phone, now);
    if (!customer.customerId.startsWith('TL-')) throw new DemoAuthError('Invalid customer');
    return this.transaction(() => {
      const token = randomBytes(32).toString('hex');
      const expiresAt = now + SESSION_TTL;
      this.db.prepare('INSERT INTO registered_customers VALUES (?,?) ON CONFLICT(phone_hash) DO UPDATE SET customer_json=excluded.customer_json').run(hash(customer.phone), JSON.stringify(customer));
      this.db.prepare('INSERT INTO sessions(token_hash,expires_at,renewed_day) VALUES (?,?,?)').run(hash(token), expiresAt, bangkokDay(now));
      this.db.prepare('INSERT INTO session_customers VALUES (?,?)').run(hash(token), JSON.stringify(customer));
      if (oldToken) this.logout(oldToken);
      return { token, expiresAt, customer };
    });
  }
}
