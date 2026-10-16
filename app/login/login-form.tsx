'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, LoaderCircle, ShieldCheck, RefreshCw } from 'lucide-react';
type Challenge = { challengeId: string; expiresAt: number; resendAt: number };
export default function LoginForm({ returnTo = '/register', localLogin = false }: { returnTo?: string; localLogin?: boolean }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const pending = useRef(false);
  const otpInput = useRef<HTMLInputElement>(null);
  const otpFields = useRef<(HTMLInputElement | null)[]>([]);
  function updateDigits(index: number, value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6 - index);
    const next = code.padEnd(6, ' ').split('');
    if (!digits) next[index] = ' ';
    else [...digits].forEach((digit, offset) => { next[index + offset] = digit; });
    setCode(next.join('').trimEnd());
    setError('');
    if (digits) otpFields.current[Math.min(index + digits.length, 5)]?.focus();
  }
  useEffect(() => {
    if (!challenge) return;
    otpInput.current?.focus();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [challenge]);
  const resendSeconds = challenge ? Math.max(0, Math.ceil((challenge.resendAt - now) / 1000)) : 0;
  const expiresSeconds = challenge ? Math.max(0, Math.ceil((challenge.expiresAt - now) / 1000)) : 0;
  async function submit(action: 'send-otp' | 'verify-otp' | 'local-login') {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const response = await fetch(`/api/telemed/auth/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ phone, code, challengeId: challenge?.challengeId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่');
      if (action === 'send-otp') { setChallenge(result); setCode(''); setNow(Date.now()); }
      else window.location.assign(returnTo);
    } catch (e) { setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'การเชื่อมต่อขัดข้อง กรุณาลองใหม่'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <main className="telemed-auth login-page">
    <Link href="/" className="auth-back"><ArrowLeft size={18} />กลับหน้าแรก</Link>
    <div className="login-content">
      <Image src="/the-ritz-clinic-logo.png" alt="The Ritz Clinic" width={180} height={66} priority />
      <header className="login-heading">
        <h1>{challenge ? 'ยืนยันเบอร์โทรศัพท์' : 'เข้าสู่ระบบ Telemed'}</h1>
        <p>{localLogin ? 'เข้าสู่ระบบทดสอบ Local ด้วยเบอร์ที่ลงทะเบียน' : challenge ? `ส่งรหัส OTP ไปที่ ${phone.slice(0, 3)} •••• ${phone.slice(-3)}` : 'ใช้เบอร์โทรศัพท์ที่ลงทะเบียน เพื่อรับรหัสยืนยันทาง SMS'}</p>
      </header>
      <form onSubmit={event => { event.preventDefault(); void submit(localLogin ? 'local-login' : challenge ? 'verify-otp' : 'send-otp'); }}>
        {!challenge ? <div className="login-field">
          <label htmlFor="login-phone">เบอร์โทรศัพท์</label>
          <input id="login-phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="08X XXX XXXX" value={phone} maxLength={10} pattern="0[689][0-9]{8}" required disabled={busy} onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }} />
        </div> : <div className="login-field">
          <label htmlFor="login-otp">รหัส OTP 6 หลัก</label>
          <div className="login-otp-digits" role="group" aria-label="กรอกรหัสยืนยัน">
            {Array.from({ length: 6 }, (_, index) => <input
              key={index}
              ref={element => { otpFields.current[index] = element; if (index === 0) otpInput.current = element; }}
              id={index === 0 ? 'login-otp' : `login-otp-${index}`}
              aria-label={index === 0 ? undefined : `รหัส OTP หลักที่ ${index + 1}`}
              className="login-code" type="text" inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              value={code[index]?.trim() ?? ''} maxLength={6} pattern="[0-9]" required
              disabled={busy} aria-describedby="otp-expiry" aria-invalid={!!error}
              onFocus={event => event.target.select()}
              onChange={event => updateDigits(index, event.target.value)}
              onPaste={event => {
                event.preventDefault();
                const digits = event.clipboardData.getData('text').replace(/\D/g, '');
                if (digits) updateDigits(digits.length >= 6 ? 0 : index, digits);
              }}
              onKeyDown={event => {
                if (event.key === 'Backspace' && !code[index]?.trim() && index > 0) {
                  event.preventDefault(); updateDigits(index - 1, ''); otpFields.current[index - 1]?.focus();
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                  event.preventDefault(); otpFields.current[Math.max(0, Math.min(5, index + (event.key === 'ArrowLeft' ? -1 : 1)))]?.focus();
                }
              }}
            />)}
          </div>
          <p id="otp-expiry" className="login-hint">{expiresSeconds ? `รหัสมีอายุอีก ${Math.floor(expiresSeconds / 60)}:${String(expiresSeconds % 60).padStart(2, '0')} นาที` : 'รหัสหมดอายุแล้ว กรุณาขอรหัสใหม่'}</p>
        </div>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-primary" type="submit" disabled={busy || (challenge ? !/^\d{6}$/.test(code) || !expiresSeconds : !/^0[689]\d{8}$/.test(phone))}>
          {busy ? <LoaderCircle className="auth-spinner" size={18} /> : <ArrowRight size={18} />}{busy ? 'กำลังดำเนินการ...' : localLogin ? 'เข้าสู่ระบบ' : challenge ? 'ยืนยันและเข้าสู่ระบบ' : 'ขอรหัส OTP'}
        </button>
        {challenge && <div className="login-secondary">
          <button type="button" disabled={busy || resendSeconds > 0} onClick={() => void submit('send-otp')}><RefreshCw size={16} />{resendSeconds ? `ขอรหัสใหม่ใน ${resendSeconds} วินาที` : 'ขอรหัสใหม่'}</button>
          <button type="button" disabled={busy} onClick={() => { setChallenge(null); setCode(''); setError(''); }}>เปลี่ยนเบอร์โทรศัพท์</button>
        </div>}
      </form>
      <p className="login-security"><ShieldCheck size={18} aria-hidden="true" />{localLogin ? 'Local เท่านั้น: ไม่ส่ง SMS และไม่ต้องใช้ OTP' : 'เพื่อความปลอดภัย อย่าเปิดเผยรหัส OTP ให้ผู้อื่น'}</p>
      <footer className="login-footer">ยังไม่มีบัญชี? <Link href="/register">ลงทะเบียน</Link></footer>
    </div>
  </main>;
}
