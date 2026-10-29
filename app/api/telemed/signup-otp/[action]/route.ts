import { NextResponse } from 'next/server';
import { telemedApiOrigin } from '../../../../lib/telemed-api-origin';
import { allowedRequestOrigin, validMutation } from '../../../../lib/telemed-dev-policy';

export const runtime = 'nodejs';
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  const publicOrigin = allowedRequestOrigin(request);
  if (!publicOrigin || !validMutation(request, publicOrigin)) return json({ error: 'Invalid origin' }, 403);
  const { action } = await context.params;
  if (!['send', 'verify', 'local'].includes(action)) return json({ error: 'Not found' }, 404);
  const origin = telemedApiOrigin(), secret = process.env.TELEMED_DEMO_BRIDGE_SECRET;
  if (!origin || !secret) return json({ error: 'ยังไม่ได้ตั้งค่าบริการยืนยันเบอร์' }, 503);
  if (action === 'local' && !(process.env.NODE_ENV === 'development' &&
      (!process.env.TELEMED_DEPLOY_ENV || process.env.TELEMED_DEPLOY_ENV === 'local') &&
      ['localhost', '127.0.0.1', '[::1]'].includes(new URL(publicOrigin).hostname) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname)))
    return json({ error: 'Not found' }, 404);
  try {
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Invalid content type' }, 415);
    const raw = await request.text();
    if (raw.length > 2048) return json({ error: 'Request too large' }, 413);
    const body = JSON.parse(raw);
    if (!body || typeof body.phone !== 'string' || !/^0[689]\d{8}$/.test(body.phone)) return json({ error: 'เบอร์โทรศัพท์ไม่ถูกต้อง' }, 400);
    const upstream = await fetch(new URL(action === 'local' ? '/api/v1/telemed/workflow/local/signup-proof' : `/api/v1/telemed/registration-otp/${action}`, origin), {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(20_000),
      headers: { 'Content-Type': 'application/json', 'x-telemed-bridge': secret },
      body: JSON.stringify({ phone: body.phone, challengeId: body.challengeId, code: body.code }),
    });
    const result = await upstream.json();
    if (!upstream.ok || result.status !== '0000') return json({ error: result.message || 'ยืนยันเบอร์ไม่สำเร็จ' }, upstream.ok ? 400 : upstream.status);
    return json(result.data);
  } catch (error) {
    return json({ error: error instanceof SyntaxError ? 'Invalid JSON' : 'ติดต่อบริการ SMS ไม่สำเร็จ กรุณาลองใหม่' }, error instanceof SyntaxError ? 400 : 503);
  }
}
