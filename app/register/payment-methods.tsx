'use client';
import { useEffect, useState } from 'react';
import { Building2, RefreshCw } from 'lucide-react';
export default function PaymentMethods({ onAvailable }: { onAvailable: (available: boolean) => void }) {
  const [methods, setMethods] = useState<{id: string; name: string}[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    onAvailable(false); setError(''); setMethods(null);
    fetch('/api/telemed/payment-methods', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw Error(data.error || 'โหลดช่องทางชำระไม่สำเร็จ');
      if (!controller.signal.aborted) { setMethods(data); onAvailable(data.length > 0); }
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [attempt, onAvailable]);
  return <div className='payment-panel'>
    <h3>ช่องทางชำระของสาขา Telemed</h3>
    {!methods && !error && <p role='status'>กำลังโหลดช่องทางชำระ...</p>}
    {error && <div role='alert'><p>{error}</p><button type='button' className='wide-button soft' onClick={() => setAttempt(n => n + 1)}><RefreshCw size={18} />ลองใหม่</button></div>}
    {methods?.length === 0 && <p role='status'>ยังไม่มีช่องทางชำระออนไลน์ที่เปิดใช้งาน</p>}
    {methods?.map(method => <div className='payment-account' key={method.id}><Building2 size={20} aria-hidden='true' /><strong>{method.name}</strong></div>)}
    {!!methods?.length && <p>ยังไม่มีรายละเอียดบัญชีหรือ QR รับเงินจริง กรุณาอย่าโอนเงิน</p>}
  </div>;
}
