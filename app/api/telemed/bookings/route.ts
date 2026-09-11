import { cookies } from 'next/headers';
import { DEMO_COOKIE, demoEnabled, withDemoStore } from '../../../lib/demo-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
async function proxy(request: Request) {
  const host = request.headers.get('host') ?? '';
  if (!demoEnabled() || !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return json({ error: 'Not found' }, 404);
  if (request.method === 'POST' && (request.headers.get('origin') !== `${new URL(request.url).protocol}//${host}` || request.headers.get('sec-fetch-site') === 'cross-site')) return json({ error: 'Invalid origin' }, 403);
  const token = (await cookies()).get(DEMO_COOKIE)?.value ?? '';
  const session = withDemoStore(store => store.session(token));
  if (!session) return json({ error: 'กรุณาเข้าสู่ระบบก่อนส่งนัดหมาย' }, 401);
  const origin = process.env.TELEMED_WORKFLOW_ORIGIN;
  const secret = process.env.TELEMED_DEMO_BRIDGE_SECRET;
  if (!origin || !secret) return json({ error: 'ยังไม่ได้ตั้งค่าเชื่อมระบบนัดหมาย Dev' }, 503);
  try {
    let body: string | undefined;
    if (request.method === 'POST') {
      if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Invalid content type' }, 415);
      if (Number(request.headers.get('content-length')) > 14_100_000) return json({ error: 'ไฟล์ใหญ่เกินไป' }, 413);
      body = await request.text();
      if (body.length > 14_100_000) return json({ error: 'ไฟล์ใหญ่เกินไป' }, 413);
    }
    const response = await fetch(new URL('/api/v1/telemed/workflow/demo/bookings', origin), { method: request.method, body, cache: 'no-store', signal: AbortSignal.timeout(30000), headers: { 'Content-Type': 'application/json', 'x-telemed-bridge': secret, 'x-telemed-customer': session.customer.customerId } });
    const result = await response.json();
    if (!response.ok || result.status !== '0000') return json({ error: result.message || 'บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่' }, response.ok ? 409 : response.status);
    return json(result.data);
  } catch { return json({ error: 'ไม่สามารถยืนยันผลได้ กรุณาลองใหม่ ระบบจะไม่สร้างซ้ำสำหรับคำขอเดิม' }, 503); }
}
export const GET = proxy;
export const POST = proxy;
