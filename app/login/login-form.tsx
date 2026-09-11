'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, LogIn, LoaderCircle } from 'lucide-react';

export default function LoginForm() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<{ challengeId: string; expiresAt: number; phone: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function verify() {
    setBusy(true); setError('');
    try {
      let active = challenge;
      if (!active || active.phone !== phone || active.expiresAt <= Date.now()) {
        const sent = await fetch('/api/telemed/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
        const body = await sent.json();
        if (!sent.ok) throw new Error(body.error || 'ไม่สามารถขอ OTP ได้');
        active = { challengeId: body.challengeId, expiresAt: body.expiresAt, phone };
        setChallenge(active);
      }
      const response = await fetch('/api/telemed/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId: active.challengeId, code }) });
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
    <p>เบอร์ที่ลงทะเบียน · OTP ทดสอบ <strong>123456</strong></p>
    <form onSubmit={event => { event.preventDefault(); if (!busy) void verify(); }}>
      <label htmlFor="login-phone">เบอร์โทรศัพท์</label>
      <input id="login-phone" type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} maxLength={10} pattern="[0-9]{10}" required disabled={busy} onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }} />
        <label htmlFor="login-otp">รหัส OTP</label>
        <input id="login-otp" inputMode="numeric" autoComplete="one-time-code" value={code} maxLength={6} pattern="[0-9]{6}" required disabled={busy} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-primary" type="submit" disabled={busy || code.length !== 6 || phone.length !== 10}>
        {busy ? <LoaderCircle className="auth-spinner" size={18} /> : <LogIn size={18} />}{busy ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
      </button>
    </form>
    <Link href="/register">ยังไม่มีบัญชี? ลงทะเบียน</Link>
  </main>;
}
