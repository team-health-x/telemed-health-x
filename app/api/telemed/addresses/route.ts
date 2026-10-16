import { cookies } from 'next/headers';
import { telemedApiOrigin } from '../../../lib/telemed-api-origin';
import { DEMO_COOKIE, withDemoStore } from '../../../lib/demo-auth';
import { allowedRequestOrigin } from '../../../lib/telemed-dev-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: Request) {
  if (!allowedRequestOrigin(request)) return json({ error: 'Not found' }, 404);
  const token = (await cookies()).get(DEMO_COOKIE)?.value ?? '';
  const session = withDemoStore(store => store.session(token));
  if (!session) return json({ error: 'กรุณาเข้าสู่ระบบเพื่อดูข้อมูลที่อยู่' }, 401);
  const origin = telemedApiOrigin();
  const secret = process.env.TELEMED_DEMO_BRIDGE_SECRET;
  if (!origin || !secret) return json({ error: 'ยังไม่ได้เชื่อมต่อระบบข้อมูลที่อยู่' }, 503);
  try {
    const response = await fetch(new URL('/api/v1/telemed/workflow/demo/addresses', origin), {
      cache: 'no-store', signal: AbortSignal.timeout(30000),
      headers: { 'x-telemed-bridge': secret, 'x-telemed-customer': session.customer.customerId },
    });
    const result = await response.json();
    if (!response.ok || result.status !== '0000') return json({ error: 'โหลดข้อมูลที่อยู่ไม่สำเร็จ กรุณาลองใหม่' }, response.ok ? 502 : response.status);
    return json(result.data);
  } catch { return json({ error: 'เชื่อมต่อระบบข้อมูลที่อยู่ไม่สำเร็จ กรุณาลองใหม่' }, 503); }
}
