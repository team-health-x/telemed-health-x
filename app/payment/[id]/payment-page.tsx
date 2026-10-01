'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import UiSkeleton from '../../ui-skeleton';
import { ArrowLeft, RefreshCw, Upload, X, CheckCircle2, Clock3, Building2, Copy, ImagePlus } from 'lucide-react';
type Detail = { id: string; saleOrderId: string; total: number; paid: number; balance: number; version: string; status: string; devOnly: boolean;
  consultationDiscount?: { amount: number; originalTotal: number; sourceSaleId: string } | null;
  items: { id: string; name: string; quantity: number; price: number; net: number }[];
  bank: { name: string; accountName: string; accountNumber: string } | null;
  slip: { id: string; file_name: string; created_at: string } | null };
const money = (value: number) => value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const labels: Record<string, string> = { UNPAID: 'รอชำระเงิน', PENDING_REVIEW: 'รอตรวจสอบสลิป', PAID: 'ชำระครบแล้ว', CANCELLED: 'ยกเลิกใบขาย', REVIEW_REQUIRED: 'กรุณาติดต่อเจ้าหน้าที่' };
export default function PaymentPage({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const previewUrl = useRef('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localDemo, setLocalDemo] = useState(false);
  const retry = useRef<{ file: File; version: string; key: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/telemed/payments/${id}`, { cache: 'no-store', signal });
      const result = await response.json();
      if (!signal?.aborted && [401, 403, 404].includes(response.status)) {
        setDetail(null);
        if (response.status === 401) window.location.assign(`/login?next=${encodeURIComponent(`/payment/${id}`)}`);
      }
      if (!response.ok) throw new Error(result.error || 'โหลดใบขายไม่สำเร็จ');
      if (!signal?.aborted) {
        setDetail(result); setError('');
        setLocalDemo(process.env.NODE_ENV === 'development' && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname));
      }
    } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : 'โหลดใบขายไม่สำเร็จ'); }
  }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const poll = async () => { if (pending || document.visibilityState === 'hidden') return; pending = true; await refresh(controller.signal); pending = false; };
    void poll(); const timer = setInterval(poll, 15000); window.addEventListener('focus', poll);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener('focus', poll); };
  }, [refresh]);
  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);
  function updateFile(value: File | null) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = value?.type.startsWith('image/') ? URL.createObjectURL(value) : '';
    setPreview(previewUrl.current); setFile(value);
  }
  function choose(value?: File) {
    setActionError(''); setSuccess(false);
    if (!value) return;
    if (!['image/png', 'image/jpeg', 'application/pdf'].includes(value.type) || value.size > 3 * 1024 * 1024 || value.name.length > 160) {
      setActionError('แนบไฟล์ PNG, JPG หรือ PDF ไม่เกิน 3 MB'); return;
    }
    updateFile(value);
  }
  function useDemoSlip() {
    if (busy || process.env.NODE_ENV !== 'development' || !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 400;
    const context = canvas.getContext('2d');
    if (!context) { setActionError('สร้างรูปทดสอบไม่สำเร็จ'); return; }
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, 640, 400);
    context.fillStyle = '#b42318'; context.font = 'bold 36px sans-serif';
    context.fillText('TEST ONLY - NOT A PAYMENT', 28, 90);
    context.fillStyle = '#222222'; context.font = '24px sans-serif';
    context.fillText('Local upload test', 28, 160);
    context.fillText('No money has been transferred.', 28, 215);
    const data = canvas.toDataURL('image/png').split(',')[1];
    const bytes = Uint8Array.from(atob(data), char => char.charCodeAt(0));
    choose(new File([bytes], 'TEST-ONLY-local-slip.png', { type: 'image/png' }));
  }
  async function submit() {
    if (!file || !detail || busy) return;
    setBusy(true); setActionError(''); setSuccess(false);
    if (retry.current?.file !== file || retry.current.version !== detail.version) retry.current = { file, version: detail.version, key: crypto.randomUUID() };
    const version = detail.version;
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ')); reader.readAsDataURL(file);
      });
      const response = await fetch(`/api/telemed/payments/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestKey: retry.current.key, version, text: `แจ้งชำระใบขาย ${detail.saleOrderId}`, file: { name: file.name, mime: file.type, data } }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ส่งสลิปไม่สำเร็จ');
      updateFile(null); retry.current = null; setSuccess(true); await refresh();
    } catch (e) { setActionError(e instanceof Error ? e.message : 'ส่งสลิปไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  const open = detail && ['UNPAID', 'PENDING_REVIEW'].includes(detail.status);
  return <main className="sales-payment">
    <header><Image src="/the-ritz-clinic-logo.png" alt="The Ritz Clinic" width={150} height={55} priority /><Link href="/register?tab=appointments"><ArrowLeft size={18} />นัดหมายของฉัน</Link></header>
    <div className="payment-heading"><div><p>TELEMED</p><h1>รายการชำระเงิน</h1>{detail && <p>ใบขาย {detail.saleOrderId}</p>}</div>{detail && <span className={`payment-state ${detail.status === 'PAID' ? 'paid' : ''}`}>{detail.status === 'PAID' ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}{labels[detail.status]}</span>}</div>
    <p className="payment-warning">ระบบทดสอบ Dev กรุณาอย่าโอนเงินจริง</p>
    {error && <div role="alert" className="payment-error">{error}<button type="button" title="โหลดข้อมูลใหม่" aria-label="โหลดข้อมูลใหม่" onClick={() => refresh()}><RefreshCw size={18} /></button></div>}
    {!detail && !error && <UiSkeleton rows={3} label="กำลังโหลดรายการชำระเงิน" />}
    {detail && <>
      <section className="payment-items"><h2>สรุปรายการ</h2><div className="payment-table"><table><thead><tr><th>รายการ</th><th>จำนวน</th><th>ยอดสุทธิ</th></tr></thead><tbody>{detail.items.map(item => <tr key={item.id}><td>{item.name}<small>{money(item.price)} บาท / หน่วย</small></td><td>{item.quantity}</td><td>{money(item.net)}</td></tr>)}</tbody></table></div>
        <dl className="payment-totals">{detail.consultationDiscount && <><div><dt>ยอดก่อนหักสิทธิ์</dt><dd>{money(detail.consultationDiscount.originalTotal)} บาท</dd></div><div><dt>หักสิทธิ์ค่าปรึกษา<small>อ้างอิง {detail.consultationDiscount.sourceSaleId}</small></dt><dd>-{money(detail.consultationDiscount.amount)} บาท</dd></div></>}<div><dt>ยอดสุทธิใบขาย</dt><dd>{money(detail.total)} บาท</dd></div><div><dt>รับชำระแล้ว</dt><dd>{money(detail.paid)} บาท</dd></div><div className="payment-balance"><dt>ยอดคงเหลือ</dt><dd>{money(detail.balance)} บาท</dd></div></dl>
      </section>
      {detail.slip && <section className="payment-submitted"><CheckCircle2 size={22} /><div><h2>{detail.status === 'PAID' ? 'ชำระครบแล้ว' : 'ได้รับสลิปแล้ว'}</h2><p>{detail.slip.file_name}</p><p>{new Date(detail.slip.created_at).toLocaleString('th-TH')}</p>{detail.status === 'PENDING_REVIEW' && <p>รอเจ้าหน้าที่ตรวจสอบและบันทึกรับชำระ ยังไม่ถือว่าชำระสำเร็จ</p>}</div></section>}
      {open && <section className="payment-transfer"><h2><Building2 size={20} />บัญชีรับชำระ</h2>{detail.bank ? <dl><div><dt>ธนาคาร</dt><dd>{detail.bank.name}</dd></div><div><dt>ชื่อบัญชี</dt><dd>{detail.bank.accountName}</dd></div><div><dt>เลขบัญชี</dt><dd>{detail.bank.accountNumber}<button type="button" title="คัดลอกเลขบัญชี" aria-label="คัดลอกเลขบัญชี" onClick={async () => { try { await navigator.clipboard.writeText(detail.bank!.accountNumber); setCopied(true); } catch { setActionError('คัดลอกไม่สำเร็จ'); } }}><Copy size={18} /></button>{copied && <small role="status">คัดลอกแล้ว</small>}</dd></div></dl> : <p>ยังไม่ได้ตั้งค่าบัญชีรับชำระ กรุณาติดต่อเจ้าหน้าที่</p>}</section>}
      {open && <form className="payment-upload" onSubmit={e => { e.preventDefault(); void submit(); }}><h2>{detail.slip ? 'ส่งสลิปเพิ่มเติม' : 'แนบหลักฐานการชำระเงิน'}</h2><p>PNG, JPG หรือ PDF ไม่เกิน 3 MB</p>
        <input type="file" hidden disabled={busy} ref={fileInput} accept=".png,.jpg,.jpeg,.pdf" onChange={e => { choose(e.target.files?.[0]); e.target.value = ''; }} />
        <button className="payment-choose" type="button" disabled={busy} onClick={() => fileInput.current?.click()}><Upload size={20} />เลือกสลิป</button>
        {localDemo && <button className="payment-choose" type="button" disabled={busy} onClick={useDemoSlip}><ImagePlus size={20} />ใช้สลิปทดสอบ (Local)</button>}
        {file && <div className="payment-file"><span>{file.name}</span><button type="button" disabled={busy} title="ลบไฟล์" aria-label="ลบไฟล์" onClick={() => updateFile(null)}><X size={18} /></button></div>}
        {preview && <Image unoptimized src={preview} alt="ตัวอย่างสลิป" width={400} height={300} className="payment-slip-preview" />}
        {actionError && <p role="alert" className="payment-error">{actionError}</p>}{success && <p role="status">ส่งสลิปให้เจ้าหน้าที่แล้ว</p>}
        <button className="payment-submit" type="submit" disabled={!file || busy || !!error}><Upload size={18} />{busy ? 'กำลังส่ง...' : 'ส่งสลิปให้ตรวจสอบ'}</button>
      </form>}
    </>}
  </main>;
}
