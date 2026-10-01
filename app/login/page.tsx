import LoginForm from './login-form';
import './auth.css';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = (await searchParams).next;
  return <LoginForm returnTo={next && /^\/payment\/[a-zA-Z0-9-]{1,50}$/.test(next) ? next : '/register'} />;
}
