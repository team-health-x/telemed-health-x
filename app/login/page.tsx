import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { DEMO_COOKIE, demoEnabled, withDemoStore } from '../lib/demo-auth';
import LoginForm from './login-form';
import './auth.css';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export default async function LoginPage() {
  if (!demoEnabled()) notFound();
  const token = (await cookies()).get(DEMO_COOKIE)?.value ?? '';
  if (withDemoStore(store => store.session(token))) redirect('/register');
  return <LoginForm />;
}
