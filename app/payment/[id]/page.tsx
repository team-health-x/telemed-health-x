import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { DEMO_COOKIE, withDemoStore } from '../../lib/demo-auth';
import { demoEnabled } from '../../lib/telemed-dev-policy';
import PaymentPage from './payment-page';
import './payment.css';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!demoEnabled() || !/^[a-zA-Z0-9-]{1,50}$/.test(id)) notFound();
  const token = (await cookies()).get(DEMO_COOKIE)?.value || '';
  if (!withDemoStore(store => store.session(token))) redirect(`/login?next=${encodeURIComponent(`/payment/${id}`)}`);
  return <PaymentPage id={id} />;
}
