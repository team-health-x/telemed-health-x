import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { DEMO_COOKIE, withDemoStore } from '../../../../lib/demo-auth';
import { DemoAuthError } from '../../../../lib/demo-auth-store';
import { allowedRequestOrigin, validMutation } from '../../../../lib/telemed-dev-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ action: string }> };
function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' } });
}
function permitted(request: Request, mutation: boolean) {
  const origin = allowedRequestOrigin(request);
  if (!origin) return json({ error: 'Not found' }, 404);
  if (mutation && !validMutation(request, origin)) {
    return json({ error: 'Invalid origin' }, 403);
  }
  return null;
}
export async function GET(request: Request, context: Context) {
  const blocked = permitted(request, false);
  if (blocked) return blocked;
  if ((await context.params).action !== 'session') return json({ error: 'Not found' }, 404);
  const token = (await cookies()).get(DEMO_COOKIE)?.value ?? '';
  const session = withDemoStore(store => store.session(token));
  return session ? json(session) : json({ error: 'กรุณาเข้าสู่ระบบ' }, 401);
}
export async function POST(request: Request, context: Context) {
  const blocked = permitted(request, true);
  if (blocked) return blocked;
  const { action } = await context.params;
  const token = (await cookies()).get(DEMO_COOKIE)?.value ?? '';
  const cookieOptions = { httpOnly: true, sameSite: 'strict' as const, secure: allowedRequestOrigin(request)!.startsWith('https:'), path: '/' };
  try {
    if (action === 'logout') {
      withDemoStore(store => store.logout(token));
      const response = json({ ok: true });
      response.cookies.set(DEMO_COOKIE, '', { ...cookieOptions, maxAge: 0 });
      return response;
    }
    if (action === 'session') {
      const session = withDemoStore(store => store.session(token, true));
      if (!session) return json({ error: 'กรุณาเข้าสู่ระบบ' }, 401);
      const response = json(session);
      // Reconcile the cookie to the stored deadline without extending it twice.
      response.cookies.set(DEMO_COOKIE, token, { ...cookieOptions, expires: new Date(session.expiresAt) });
      return response;
    }
    if (!['send-otp', 'verify-otp', 'verify-signup'].includes(action)) return json({ error: 'Not found' }, 404);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Invalid content type' }, 415);
    if (Number(request.headers.get('content-length')) > 2048) return json({ error: 'Request too large' }, 413);
    const raw = await request.text();
    if (raw.length > 2048) return json({ error: 'Request too large' }, 413);
    const body = JSON.parse(raw);
    if (action === 'send-otp') return json(withDemoStore(store => store.send(typeof body.phone === 'string' ? body.phone.trim() : '')));
    if (action === 'verify-signup') return json(withDemoStore(store => store.verifySignup(body.challengeId ?? '', body.code ?? '', body.phone ?? '')));
    const result = withDemoStore(store => store.verify(
      typeof body.challengeId === 'string' ? body.challengeId : '', typeof body.code === 'string' ? body.code : '', token,
    ));
    const response = json({ customer: result.customer, expiresAt: result.expiresAt, renewedDay: result.renewedDay });
    response.cookies.set(DEMO_COOKIE, result.token, { ...cookieOptions, expires: new Date(result.expiresAt) });
    return response;
  } catch (error) {
    if (error instanceof DemoAuthError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError || error instanceof TypeError) return json({ error: 'Invalid request' }, 400);
    return json({ error: 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่' }, 503);
  }
}
