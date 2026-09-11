'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, LogOut } from 'lucide-react';

type Session = { expiresAt: number; renewedDay: string; customer: { customerId: string; name: string; phone: string } };
export default function Account({ initialSession }: { initialSession: Session }) {
  const [session, setSession] = useState(initialSession);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lastDay = useRef(initialSession.renewedDay);
  useEffect(() => {
    let pending = false; let closed = false; let lastTry = 0;
    const controller = new AbortController();
    const channel = new BroadcastChannel('telemed-demo-auth');
    channel.onmessage = event => { if (event.data === 'logout') window.location.replace('/login'); };
    async function renew() {
      const now = Date.now();
      const day = new Date(now + 7 * 3600000).toISOString().slice(0, 10);
      if (document.visibilityState !== 'visible' || pending || day <= lastDay.current || now - lastTry < 30000) return;
      pending = true; lastTry = now;
      try {
        const response = await fetch('/api/telemed/auth/session', { method: 'POST', signal: controller.signal });
        if (response.status === 401) { window.location.replace('/login'); return; }
        if (!response.ok) throw new Error('ไม่สามารถต่ออายุการเข้าสู่ระบบได้ กรุณาลองใหม่');
        const body = await response.json();
        if (!closed) { lastDay.current = body.renewedDay; setSession(body); setError(''); }
      } catch (e) { if (!closed) setError(e instanceof Error ? e.message : 'ไม่สามารถเชื่อมต่อได้'); }
      finally { pending = false; }
    }
    void renew();
    window.addEventListener('focus', renew);
    document.addEventListener('visibilitychange', renew);
    document.addEventListener('pointerdown', renew);
    document.addEventListener('keydown', renew);
    return () => { closed = true; controller.abort(); channel.close(); window.removeEventListener('focus', renew); document.removeEventListener('visibilitychange', renew); document.removeEventListener('pointerdown', renew); document.removeEventListener('keydown', renew); };
  }, []);
  async function logout() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/telemed/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่');
      const channel = new BroadcastChannel('telemed-demo-auth'); channel.postMessage('logout'); channel.close();
      window.location.replace('/login');
    } catch (e) { setError(e instanceof Error ? e.message : 'ออกจากระบบไม่สำเร็จ'); setBusy(false); }
  }
  return <main className="telemed-auth">
    <Image src="/the-ritz-clinic-logo.png" alt="The Ritz Clinic" width={180} height={66} priority />
    <h1>{session.customer.name}</h1><p className="auth-demo">บัญชีทดสอบ Dev · สาขา Telemed</p>
    <dl className="account-details"><dt>รหัสลูกค้าทดสอบ</dt><dd>{session.customer.customerId}</dd><dt>เบอร์ทดสอบ</dt><dd>{session.customer.phone}</dd><dt>เข้าสู่ระบบถึง</dt><dd>{new Date(session.expiresAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</dd></dl>
    <div className="auth-actions"><Link href="/register/appointments" className="auth-primary"><CalendarDays size={18} />นัดหมายแพทย์</Link><button type="button" disabled={busy} onClick={logout}><LogOut size={18} />{busy ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}</button></div>
    {error && <p role="alert" className="auth-error">{error}</p>}
  </main>;
}
