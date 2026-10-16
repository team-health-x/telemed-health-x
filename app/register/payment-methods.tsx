'use client';
import { useEffect, useState } from 'react';
import { Building2, RefreshCw, Copy, Check } from 'lucide-react';
import UiSkeleton from '../ui-skeleton';
export default function PaymentMethods({ onAvailable }: { onAvailable: (available: boolean) => void }) {
  const [methods, setMethods] = useState<{id: string; name: string; bank?: { name: string; accountNumber: string } | null}[] | null>(null);
  const [copied, setCopied] = useState('');
  const [copyError, setCopyError] = useState('');
  async function copyAccount(id: string, number: string) {
    setCopied(''); setCopyError('');
    try { await navigator.clipboard.writeText(number); setCopied(id); }
    catch { setCopyError('คัดลอกไม่สำเร็จ กรุณาเลือกเลขบัญชีเพื่อคัดลอก'); }
  }
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
    {!methods && !error && <UiSkeleton rows={2} label="กำลังโหลดช่องทางชำระ" />}
    {error && <div role='alert'><p>{error}</p><button type='button' className='wide-button soft' onClick={() => setAttempt(n => n + 1)}><RefreshCw size={18} />ลองใหม่</button></div>}
    {methods?.length === 0 && <p role='status'>ยังไม่มีช่องทางชำระออนไลน์ที่เปิดใช้งาน</p>}
    {methods?.map(method => <div className='payment-account payment-account-transfer' key={method.id}>
      <Building2 size={20} aria-hidden='true' />
      <div className='payment-account-details'><strong>{method.name}</strong>
        {method.bank ? <>
          <small>{method.bank.name}</small>
          <button className='payment-account-number' type='button' title='คัดลอกเลขบัญชี' aria-label={`คัดลอกเลขบัญชี ${method.bank.accountNumber}`} onClick={() => void copyAccount(method.id, method.bank!.accountNumber)}>
            <span>{method.bank.accountNumber}</span>
            {copied === method.id ? <Check size={14} aria-hidden='true' /> : <Copy size={14} aria-hidden='true' />}
          </button>
          {copied === method.id && <small className='payment-copy-status' role='status'>คัดลอกเลขบัญชีแล้ว</small>}
        </> : <small>ยังไม่ได้ระบุเลขบัญชี</small>}
      </div>
    </div>)}
    {copyError && <p role='alert'>{copyError}</p>}
    {!!methods?.length && <p>ยังไม่มี QR รับเงิน ระบบนี้เป็น Dev สำหรับทดสอบ กรุณาอย่าโอนเงินจริง</p>}
  </div>;
}
