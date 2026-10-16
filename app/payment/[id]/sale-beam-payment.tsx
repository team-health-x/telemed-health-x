'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock3, Download, QrCode, RefreshCw } from 'lucide-react';
import { getBeamJson } from '../../register/beam-request';

export type SaleQr = { id: string; amount: number; status: string; qrImage: string | null; expiresAt: string; sandbox: boolean };
type State = { available: boolean; sandbox: boolean; payment: SaleQr | null };
export function useSaleBeam(id: string) {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const manualCheck = useRef(false);
  const active = useRef(false);
  const inFlight = useRef(false);
  const version = useRef(0);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const refresh = useCallback(async (manual = false) => {
    if (inFlight.current || manualCheck.current) return;
    if (manual) { manualCheck.current = true; setChecking(true); }
    const current = version.current;
    try {
      const result = await getBeamJson<State>(`/api/telemed/beam/sales/${encodeURIComponent(id)}?revision=${current}`);
      if (active.current && current === version.current) {
        setState(result); setError('');
        if (result.payment?.qrImage || result.payment?.status === 'PAID') setCreateError('');
      }
    } catch (reason) { if (active.current && current === version.current) setError(reason instanceof Error ? reason.message : 'ตรวจสอบ QR ไม่สำเร็จ'); }
    finally {
      if (manual) { manualCheck.current = false; if (active.current) setChecking(false); }
    }
  }, [id]);
  useEffect(() => {
    void refresh();
    const poll = () => { if (document.visibilityState !== 'hidden') void refresh(); };
    const timer = setInterval(poll, 12000);
    window.addEventListener('focus', poll);
    return () => { clearInterval(timer); window.removeEventListener('focus', poll); };
  }, [refresh]);
  async function create(saleVersion: string) {
    if (!state?.available || inFlight.current || manualCheck.current) return;
    version.current++; inFlight.current = true; setBusy(true); setError(''); setCreateError('');
    try {
      const response = await fetch(`/api/telemed/beam/sales/${encodeURIComponent(id)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(45000),
        body: JSON.stringify({ version: saleVersion }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'สร้าง QR ไม่สำเร็จ');
      if (active.current) setState(previous => previous && { ...previous, payment: result });
    } catch (reason) { if (active.current) setCreateError(reason instanceof Error ? reason.message : 'สร้าง QR ไม่สำเร็จ'); }
    finally { inFlight.current = false; if (active.current) setBusy(false); void refresh(); }
  }
  const bankLocked = busy || !state || !!error || (!!state.payment && !['FAILED', 'EXPIRED'].includes(state.payment.status));
  return { state, error: error || createError, busy, checking, bankLocked, refresh, create };
}

export function SaleBeamPayment({ beam, saleVersion, unpaid }: {
  beam: ReturnType<typeof useSaleBeam>; saleVersion: string; unpaid: boolean;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const payment = beam.state?.payment;
  const expired = !!payment && now >= Date.parse(payment.expiresAt);
  const seconds = payment ? Math.max(0, Math.ceil((Date.parse(payment.expiresAt) - now) / 1000)) : 0;
  const canCreate = unpaid && beam.state?.available && (!payment || (payment.status === 'PENDING' && !expired && !payment.qrImage));
  return <section className="sale-beam" aria-label="ชำระใบขายด้วยพร้อมเพย์">
    <h2><QrCode size={22} />พร้อมเพย์ QR</h2>
    {beam.state && <p className="payment-warning">{beam.state.sandbox ? 'Beam Playground · สำหรับทดสอบเท่านั้น ห้ามโอนเงินจริง' : 'Beam Production · QR นี้รับชำระเงินจริง'}</p>}
    {!beam.state && !beam.error && <p role="status">กำลังตรวจสอบช่องทางชำระเงิน...</p>}
    {beam.state && !beam.state.available && <p role="status">พร้อมเพย์ยังไม่พร้อมใช้งาน</p>}
    {payment && <>
      <strong className="sale-beam-amount">{payment.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</strong>
      {payment.status === 'PENDING' && !expired && payment.qrImage && <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={payment.qrImage} width={240} height={240} className="sale-beam-qr" alt="QR พร้อมเพย์สำหรับใบขาย" />
        <p className="sale-beam-timer"><Clock3 size={16} />{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</p>
        <a href={payment.qrImage} download="telemed-sale-promptpay.png"><Download size={18} />บันทึก QR</a>
      </>}
      <p role="status">{payment.status === 'PAID' ? <><CheckCircle2 size={20} />ชำระเงินสำเร็จ</> :
        payment.status === 'REVIEW_REQUIRED' ? 'ได้รับผลชำระจาก Beam แล้ว แต่ข้อมูลใบขายเปลี่ยน กรุณาติดต่อเจ้าหน้าที่ ห้ามชำระซ้ำ' :
        payment.status === 'FAILED' ? 'ชำระไม่สำเร็จ สามารถเลือกโอนบัญชีและแนบสลิปได้' :
        payment.status === 'EXPIRED' ? 'QR หมดอายุ สามารถเลือกโอนบัญชีและแนบสลิปได้' :
        expired ? 'QR หมดเวลา กำลังตรวจสอบผลชำระก่อนเปิดช่องทางอื่น' :
        payment.qrImage ? 'รอชำระเงิน' : 'ยังไม่ได้รับ QR กรุณาลองรายการเดิมอีกครั้ง'}</p>
    </>}
    {!unpaid && !payment && <p>ส่งสลิปแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบ</p>}
    {canCreate && <>
      {!beam.state?.sandbox && <label className="sale-beam-confirm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />ยืนยันสร้าง QR สำหรับชำระเงินจริง</label>}
      <button type="button" className="payment-submit" disabled={beam.busy || beam.checking || (!beam.state?.sandbox && !confirmed)} onClick={() => void beam.create(saleVersion)}>
        {beam.busy ? <RefreshCw size={20} /> : <QrCode size={20} />}{beam.busy ? 'กำลังสร้าง QR...' : 'สร้าง QR พร้อมเพย์'}
      </button>
    </>}
    {beam.error && <p role="alert" className="payment-error">{beam.error}</p>}
    {(payment || beam.error) && <button type="button" disabled={beam.busy || beam.checking} aria-busy={beam.checking} onClick={() => void beam.refresh(true)}>
      <RefreshCw size={18} className={beam.checking ? 'sale-beam-spinner' : undefined} aria-hidden="true" />
      {beam.checking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบผลชำระ'}
    </button>}
  </section>;
}
