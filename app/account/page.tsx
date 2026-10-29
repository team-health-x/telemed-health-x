import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { DEMO_COOKIE, authEnabled, withDemoStore } from '../lib/demo-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export default async function AccountPage() {
  if (!authEnabled()) notFound();
  const token = (await cookies()).get(DEMO_COOKIE)?.value ?? '';
  const session = withDemoStore(store => store.session(token));
  if (!session) redirect('/login');
  redirect('/register');
}
