import { cookies } from 'next/headers';
import CustomerPortal from './customer-portal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function RegistrationPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const initialTab = (await searchParams).tab === 'appointments' ? 'appointments' : 'home';
  if (process.env.NODE_ENV === 'development' && process.env.TELEMED_DEMO_AUTH_ENABLED === 'true') {
    const { DEMO_COOKIE, withDemoStore } = await import('../lib/demo-auth');
    const token = (await cookies()).get(DEMO_COOKIE)?.value ?? '';
    const session = withDemoStore(store => store.session(token));
    if (session) return <CustomerPortal customer={session.customer} initialTab={initialTab} />;
  }
  return <CustomerPortal />;
}
