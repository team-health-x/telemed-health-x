import { backendSession } from '../lib/telemed-v2-session';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { DEMO_COOKIE, authEnabled } from '../lib/demo-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export default async function AccountPage() {
  if (!authEnabled()) notFound();
  const token = (await cookies()).get(DEMO_COOKIE)?.value ?? '';
  const session = await backendSession(token);
  if (!session) redirect('/login');
  redirect('/register');
}
