import { cookies } from 'next/headers';
import CustomerPortal from './customer-portal';
import { authEnabled, demoEnabled } from '../lib/telemed-dev-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function RegistrationPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const initialTab = (await searchParams).tab === 'appointments' ? 'appointments' : 'home';
  if (authEnabled()) {
    const { DEMO_COOKIE, withDemoStore } = await import('../lib/demo-auth');
    const token = (await cookies()).get(DEMO_COOKIE)?.value ?? '';
    const session = withDemoStore(store => store.session(token));
    if (session) return <CustomerPortal customer={session.customer} initialTab={initialTab} allowTestData={demoEnabled()} />;
  }
  return <CustomerPortal allowTestData={demoEnabled()} />;
}
