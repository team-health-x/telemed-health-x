'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, LogIn, LoaderCircle, RotateCw, WandSparkles } from 'lucide-react';

export default function LoginForm() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<{ challengeId: string; resendAt: number } | null>(null);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const wait = Math.max(0, Math.ceil(((challenge?.resendAt ?? 0) - now) / 1000));
  async function send() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/telemed/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setChallenge(body); setCode(''); setNow(Date.now());
    } catch (e) { setError(e instanceof Error ? e.message : 'ไม่สามารถขอ OTP ได้'); }
    finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/telemed/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId: challenge?.challengeId, code }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      window.location.assign('/register');
    } catch (e) { setError(e instanceof Error ? e.message : 'ไม่สามารถเข้าสู่ระบบได้'); setBusy(false); }
  }
  return <main className="telemed-auth">
    <Link href="/" className="auth-back"><ArrowLeft size={18} />กลับหน้าแรก</Link>
    <Image src="/the-ritz-clinic-logo.png" alt="The Ritz Clinic" width={180} height={66} priority />
    <h1>เข้าสู่ระบบ Telemed</h1>
    <p className="auth-demo">บัญชีทดสอบ Dev เท่านั้น</p>
    <p>เบอร์ทดสอบ <strong>0000000001</strong> · OTP <strong>123456</strong></p>
    <form onSubmit={event => { event.preventDefault(); if (!busy) void (challenge ? verify() : send()); }}>
      {process.env.NODE_ENV === 'development' && <button type="button" disabled={busy || (!!challenge && phone !== '0000000001')} onClick={() => {
        if (!['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) return;
        setError('');
        if (challenge) setCode('123456');
        else setPhone('0000000001');
      }}><WandSparkles size={18} />{challenge ? 'Auto fill OTP (Local)' : 'Auto fill (Local)'}</button>}
      <label htmlFor="login-phone">เบอร์โทรศัพท์</label>
      <input id="login-phone" type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} maxLength={10} pattern="[0-9]{10}" required disabled={!!challenge || busy} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
      {challenge && <>
        <label htmlFor="login-otp">รหัส OTP</label>
        <input id="login-otp" inputMode="numeric" autoComplete="one-time-code" value={code} maxLength={6} pattern="[0-9]{6}" required disabled={busy} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
        <div className="auth-actions"><button type="button" disabled={busy || wait > 0} onClick={send}><RotateCw size={16} />{wait ? `ขอรหัสใหม่ใน ${wait} วินาที` : 'ขอรหัสใหม่'}</button><button type="button" disabled={busy} onClick={() => { setChallenge(null); setCode(''); setError(''); }}>เปลี่ยนเบอร์</button></div>
      </>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-primary" type="submit" disabled={busy || (challenge ? code.length !== 6 : phone.length !== 10)}>
        {busy ? <LoaderCircle className="auth-spinner" size={18} /> : <LogIn size={18} />}{busy ? 'กำลังดำเนินการ...' : challenge ? 'เข้าสู่ระบบ' : 'ขอรหัส OTP'}
      </button>
    </form>
    <Link href="/register">ยังไม่มีบัญชี? ลงทะเบียน</Link>
  </main>;
}
