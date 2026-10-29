import { cookies } from 'next/headers';
import { telemedApiOrigin } from '../../../../../../lib/telemed-api-origin';
import { DEMO_COOKIE, withDemoStore } from '../../../../../../lib/demo-auth';
import { allowedRequestOrigin, validMutation, authEnabled } from '../../../../../../lib/telemed-dev-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
type Context = { params: Promise<{ id: string; file?: string[] }> };
async function proxy(request: Request, context: Context) {
  const publicOrigin = allowedRequestOrigin(request);
  if (!publicOrigin) return json({ error: 'Not found' }, 404);
  if (request.method === 'POST' && !validMutation(request, publicOrigin)) return json({ error: 'Invalid origin' }, 403);
  const { id, file } = await context.params;
  const read = file?.length === 1 && file[0] === 'read' && request.method === 'POST';
  const socket = file?.length === 1 && file[0] === 'socket' && request.method === 'POST';
  const download = file?.length === 2 && /^[a-zA-Z0-9-]{1,50}$/.test(file[0]) && file[1] === 'file' && request.method === 'GET';
  if (!/^[a-zA-Z0-9-]{1,50}$/.test(id) || (file && !read && !download && !socket)) return json({ error: 'Not found' }, 404);
  if (!authEnabled()) return json({ error: 'แชทยังไม่เปิดให้บริการ' }, 503);
  const token = (await cookies()).get(DEMO_COOKIE)?.value ?? '';
  const session = withDemoStore(store => store.session(token));
  if (!session) return json({ error: 'กรุณาเข้าสู่ระบบอีกครั้ง' }, 401);
  const origin = telemedApiOrigin();
  const secret = process.env.TELEMED_DEMO_BRIDGE_SECRET;
  if (!origin || !secret) return json({ error: 'ยังไม่ได้เชื่อมต่อระบบแชท' }, 503);
  try {
    let body: string | undefined;
    if (request.method === 'POST') {
      if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Invalid content type' }, 415);
      if (Number(request.headers.get('content-length')) > 7_050_000) return json({ error: 'ไฟล์ใหญ่เกินไป' }, 413);
      // Bound streamed request bodies as well as Content-Length.
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader) while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 7_050_000) { await reader.cancel(); return json({ error: 'ไฟล์ใหญ่เกินไป' }, 413); }
        chunks.push(chunk.value);
      }
      body = Buffer.concat(chunks).toString('utf8');
    }
    const url = new URL(`/api/v1/telemed/workflow/demo/bookings/${id}/chat${file ? `/${file.join('/')}` : ''}`, origin);
    const before = new URL(request.url).searchParams.get('before');
    if (before !== null) url.searchParams.set('before', before);
    const response = await fetch(url, { method: request.method, body, cache: 'no-store', signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json', 'x-telemed-bridge': secret, 'x-telemed-customer': session.customer.customerId } });
    const result = await response.json();
    if (!response.ok || result.status !== '0000') return json({ error: result.message || 'ดำเนินการไม่สำเร็จ' }, response.ok ? 409 : response.status);
    if (socket) {
      const socketUrl = new URL('/api/v1/telemed/chat-socket', process.env.TELEMED_SOCKET_ORIGIN || origin);
      socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      return json({ ...result.data, url: socketUrl.toString() });
    }
    return json(result.data);
  } catch { return json({ error: 'เชื่อมต่อแชทไม่สำเร็จ กรุณาลองใหม่' }, 503); }
}
export const GET = proxy;
export const POST = proxy;
