import LoginForm from './login-form';
import './auth.css';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export default async function LoginPage() {
  return <LoginForm />;
}
