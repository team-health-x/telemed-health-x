import { cookies } from 'next/headers';
import { DEMO_COOKIE, withDemoStore } from '../../../../lib/demo-auth';
import { allowedRequestOrigin, validMutation } from '../../../../lib/telemed-dev-policy';
import { telemedApiOrigin } from '../../../../lib/telemed-api-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
async function proxy(request: Request, context: { params: Promise<{ id: string }> }) {
  const allowed = allowedRequestOrigin(request);
  if (!allowed) return json({ error: 'Not found' }, 404);
  if (request.method === 'POST' && !validMutation(request, allowed)) return json({ error: 'Invalid origin' }, 403);
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9-]{1,50}$/.test(id)) return json({ error: 'Not found' }, 404);
  const token = (await cookies()).get(DEMO_COOKIE)?.value || '';
  const session = withDemoStore(store => store.session(token));
  if (!session) return json({ error: 'กรุณาเข้าสู่ระบบอีกครั้ง' }, 401);
  const origin = telemedApiOrigin();
  const secret = process.env.TELEMED_DEMO_BRIDGE_SECRET;
  if (!origin || !secret) return json({ error: 'ยังไม่ได้เชื่อมต่อระบบชำระเงิน' }, 503);
  try {
    let body: string | undefined;
    if (request.method === 'POST') {
      if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Invalid content type' }, 415);
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = []; let size = 0;
      if (reader) while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 4_220_000) { await reader.cancel(); return json({ error: 'ไฟล์ใหญ่เกินไป' }, 413); }
        chunks.push(chunk.value);
      }
      body = Buffer.concat(chunks).toString('utf8');
    }
    const response = await fetch(new URL(`/api/v1/telemed/workflow/demo/payments/${id}`, origin), {
      method: request.method, body, cache: 'no-store', signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json', 'x-telemed-bridge': secret, 'x-telemed-customer': session.customer.customerId },
    });
    const result = await response.json();
    if (!response.ok || result.status !== '0000') return json({ error: result.message || 'ดำเนินการไม่สำเร็จ' }, response.ok ? 409 : response.status);
    return json(result.data);
  } catch { return json({ error: 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่' }, 503); }
}
export const GET = proxy;
export const POST = proxy;
