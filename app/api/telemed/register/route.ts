import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { DEMO_COOKIE, demoEnabled, withDemoStore } from '../../../lib/demo-auth';
import { DemoAuthError } from '../../../lib/demo-auth-store';

export const runtime = 'nodejs';
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  const host = request.headers.get('host') ?? '';
  const url = new URL(request.url);
  if (!demoEnabled() || !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return json({ error: 'Not found' }, 404);
  if (request.headers.get('origin') !== `${url.protocol}//${host}` || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Invalid origin' }, 403);
  const origin = process.env.TELEMED_WORKFLOW_ORIGIN;
  const secret = process.env.TELEMED_DEMO_BRIDGE_SECRET;
  if (!origin || !secret) return json({ error: 'ยังไม่ได้ตั้งค่าเชื่อมระบบสมัคร Dev' }, 503);
  try {
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Invalid content type' }, 415);
    const raw = await request.text();
    if (raw.length > 14_000_000) return json({ error: 'ข้อมูลใหญ่เกินไป' }, 413);
    const { proof, signup } = JSON.parse(raw);
    const key = withDemoStore(store => store.signupKey(proof, signup?.phoneNumber));
    const response = await fetch(new URL('/api/v1/telemed/workflow/demo/register', origin), { method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(30000), headers: { 'Content-Type': 'application/json', 'x-telemed-bridge': secret, 'x-registration-key': key }, body: JSON.stringify(signup) });
    const result = await response.json();
    if (!response.ok || result.status !== '0000') return json({ error: result.message || 'สมัครไม่สำเร็จ' }, response.ok ? 409 : response.status);
    const customer = result.data;
    if (customer?.phone !== signup.phoneNumber || typeof customer.customerId !== 'string' || !customer.customerId.startsWith('TL-')) return json({ error: 'ข้อมูลตอบกลับไม่ถูกต้อง' }, 502);
    const old = (await cookies()).get(DEMO_COOKIE)?.value ?? '';
    const session = withDemoStore(store => store.finishSignup(proof, customer, old));
    const reply = json({ customer });
    reply.cookies.set(DEMO_COOKIE, session.token, { httpOnly: true, sameSite: 'strict', secure: url.protocol === 'https:', path: '/', expires: new Date(session.expiresAt) });
    return reply;
  } catch (error) {
    if (error instanceof DemoAuthError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ error: 'Invalid JSON' }, 400);
    return json({ error: 'ยืนยันผลการสมัครไม่ได้ กรุณาลองใหม่ด้วยข้อมูลเดิม' }, 503);
  }
}
