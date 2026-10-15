import { cookies } from 'next/headers';
import { DEMO_COOKIE, withDemoStore } from '../../../../lib/demo-auth';
import { telemedApiOrigin } from '../../../../lib/telemed-api-origin';
import { allowedRequestOrigin, validMutation } from '../../../../lib/telemed-dev-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const origin = allowedRequestOrigin(request);
  if (!origin) return json({ error: 'Not found' }, 404);
  if (request.method === 'POST' && !validMutation(request, origin)) return json({ error: 'Invalid origin' }, 403);
  const path = (await context.params).path;
  const sales = path.length === 2 && path[0] === 'sales' && /^[a-zA-Z0-9-]{1,50}$/.test(path[1]);
  const allowed = sales || (request.method === 'POST' ? (path.length === 1 && path[0] === 'bookings') ||
    (path.length === 3 && path[0] === 'bookings' && /^[a-zA-Z0-9-]{1,50}$/.test(path[1]) && path[2] === 'resume') :
    (path.length === 1 && path[0] === 'capabilities') || (path.length === 2 && path[0] === 'bookings' && /^[a-zA-Z0-9-]{1,50}$/.test(path[1])));
  if (!allowed) return json({ error: 'Not found' }, 404);
  const token = (await cookies()).get(DEMO_COOKIE)?.value ?? '';
  const session = withDemoStore(store => store.session(token));
  if (!session) return json({ error: 'กรุณาเข้าสู่ระบบ' }, 401);
  const backend = telemedApiOrigin();
  const secret = process.env.TELEMED_DEMO_BRIDGE_SECRET;
  if (!backend || !secret) return json({ error: 'ยังไม่ได้ตั้งค่าระบบชำระเงิน' }, 503);
  try {
    let body: string | undefined;
    if (request.method === 'POST') {
      if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Invalid content type' }, 415);
      if (Number(request.headers.get('content-length')) > 4096) return json({ error: 'Request too large' }, 413);
      body = await request.text();
      if (body.length > 4096) return json({ error: 'Request too large' }, 413);
    }
    const response = await fetch(new URL(`/api/v1/telemed/workflow/demo/beam/${path.map(encodeURIComponent).join('/')}`, backend), {
      method: request.method, cache: 'no-store', body, signal: AbortSignal.timeout(45000), headers: {
        'Content-Type': 'application/json', 'x-telemed-bridge': secret, 'x-telemed-customer': session.customer.customerId,
      },
    });
    const result = await response.json();
    if (!response.ok || result.status !== '0000') return json({ error: result.message || 'ไม่สามารถยืนยันการชำระเงินได้' }, response.ok ? 409 : response.status);
    return json(result.data);
  } catch { return json({ error: 'เชื่อมต่อไม่สำเร็จ กรุณาลองรายการเดิมอีกครั้ง' }, 503); }
}
export const GET = proxy;
export const POST = proxy;
