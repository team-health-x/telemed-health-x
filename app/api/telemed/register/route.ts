import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { DEMO_COOKIE, withDemoStore } from '../../../lib/demo-auth';
import { DemoAuthError } from '../../../lib/demo-auth';
import { allowedRequestOrigin, validMutation } from '../../../lib/telemed-dev-policy';

export const runtime = 'nodejs';
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  const publicOrigin = allowedRequestOrigin(request);
  if (!publicOrigin) return json({ error: 'Not found' }, 404);
  if (!validMutation(request, publicOrigin)) return json({ error: 'Invalid origin' }, 403);
  const origin = process.env.TELEMED_WORKFLOW_ORIGIN;
  const secret = process.env.TELEMED_DEMO_BRIDGE_SECRET;
  if (!origin || !secret) return json({ error: 'ยังไม่ได้ตั้งค่าเชื่อมระบบสมัคร Dev' }, 503);
  try {
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Invalid content type' }, 415);
    const raw = await request.text();
    if (raw.length > 14_000_000) return json({ error: 'ข้อมูลใหญ่เกินไป' }, 413);
    const { requestId, mockOtp, signup } = JSON.parse(raw);
    if (mockOtp !== '123456' || typeof requestId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId) || typeof signup?.phoneNumber !== 'string' || !/^0[689]\d{8}$/.test(signup.phoneNumber)) {
      return json({ error: 'ข้อมูลยืนยันการสมัครไม่ถูกต้อง' }, 400);
    }
    // The route is Dev-only. This is an idempotency key, not proof of phone ownership.
    const key = createHash('sha256').update(`telemed-mock-signup:${requestId}:${signup.phoneNumber}`).digest('hex');
    const response = await fetch(new URL('/api/v1/telemed/workflow/demo/register', origin), { method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(30000), headers: { 'Content-Type': 'application/json', 'x-telemed-bridge': secret, 'x-registration-key': key }, body: JSON.stringify(signup) });
    const result = await response.json();
    if (!response.ok || result.status !== '0000') return json({ error: result.message || 'สมัครไม่สำเร็จ' }, response.ok ? 409 : response.status);
    const customer = result.data;
    if (customer?.phone !== signup.phoneNumber || typeof customer.customerId !== 'string' || !customer.customerId.startsWith('TL-')) return json({ error: 'ข้อมูลตอบกลับไม่ถูกต้อง' }, 502);
    const session = withDemoStore(store => store.issue(customer));
    const reply = json({ customer });
    reply.cookies.set(DEMO_COOKIE, session.token, { httpOnly: true, sameSite: 'strict', secure: publicOrigin.startsWith('https:'), path: '/', expires: new Date(session.expiresAt) });
    return reply;
  } catch (error) {
    if (error instanceof DemoAuthError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ error: 'Invalid JSON' }, 400);
    return json({ error: 'ยืนยันผลการสมัครไม่ได้ กรุณาลองใหม่ด้วยข้อมูลเดิม' }, 503);
  }
}
