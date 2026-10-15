'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, Download, QrCode, RefreshCw } from 'lucide-react';
import './beam-consultation-payment.css';
import { getBeamJson } from './beam-request';

type Selection = { doctorId: string; courseItemId: string; date: string; time: string; expectedPrice: number };
type Payment = { id: string; bookingId: string; amount: number; status: string; qrImage: string | null; expiresAt: string; sandbox: boolean };
export default function BeamConsultationPayment({ selection, bookingId, onStarted, onPaid }: {
  selection?: Selection; bookingId?: string; onStarted?: () => void; onPaid: () => void;
}) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [sandbox, setSandbox] = useState<boolean | null>(null);
  const [liveConfirmed, setLiveConfirmed] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const requestKey = useRef('');
  const inFlight = useRef(false);
  const mutationVersion = useRef(0);
  const mounted = useRef(false);
  const activeBooking = payment?.bookingId || bookingId;
  const terminal = !!payment && ['PAID', 'FAILED', 'REVIEW_REQUIRED', 'EXPIRED'].includes(payment.status);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    let active = true;
    getBeamJson<{ available: boolean; sandbox: boolean }>('/api/telemed/beam/capabilities').then(result => {
      if (active) { setAvailable(result.available === true); setSandbox(result.sandbox); }
    }).catch(reason => { if (active) { setAvailable(false); setError(reason.message); } });
    return () => { active = false; };
  }, []);
  const refresh = useCallback(async (isCurrent: () => boolean = () => true) => {
    if (!activeBooking || inFlight.current) return;
    const version = mutationVersion.current;
    try {
      const result = await getBeamJson<Payment>(`/api/telemed/beam/bookings/${encodeURIComponent(activeBooking)}`);
      if (mounted.current && isCurrent() && version === mutationVersion.current) setPayment(result);
    } catch (reason) { if (mounted.current && isCurrent() && version === mutationVersion.current) setError(reason instanceof Error ? reason.message : 'ตรวจสอบการชำระไม่สำเร็จ'); }
  }, [activeBooking]);
  useEffect(() => {
    if (!activeBooking || terminal) return;
    let active = true;
    void refresh(() => active);
    const timer = setInterval(() => { if (document.visibilityState !== 'hidden') void refresh(() => active); }, 12000);
    return () => { active = false; clearInterval(timer); };
  }, [activeBooking, terminal, refresh]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  async function create() {
    if ((!selection && !bookingId) || inFlight.current) return;
    if (!available || sandbox === null || (sandbox === false && !liveConfirmed)) return;
    mutationVersion.current++;
    inFlight.current = true; setBusy(true); setError('');
    requestKey.current ||= crypto.randomUUID();
    // Lock the selection even after a timeout: the backend may already have reserved it.
    onStarted?.();
    try {
      const response = await fetch(bookingId ? `/api/telemed/beam/bookings/${encodeURIComponent(bookingId)}/resume` : '/api/telemed/beam/bookings', { method: 'POST', signal: AbortSignal.timeout(45000), headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingId ? {} : { ...selection, requestKey: requestKey.current }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'สร้าง QR ไม่สำเร็จ');
      setPayment(result);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'สร้าง QR ไม่สำเร็จ'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  const expired = !!payment && now > Date.parse(payment.expiresAt);
  const seconds = payment ? Math.max(0, Math.ceil((Date.parse(payment.expiresAt) - (now || Date.now())) / 1000)) : 0;
  const pending = payment?.status === 'PENDING';
  return <section className="beam-payment" aria-label="ชำระด้วยพร้อมเพย์">
    <h3><QrCode size={20} />พร้อมเพย์</h3>
    {sandbox !== null && <p className="beam-sandbox">{sandbox ? 'Beam Playground · สำหรับทดสอบเท่านั้น ห้ามโอนเงินจริง' : 'Beam Production · QR นี้รับชำระเงินจริง'}</p>}
    {sandbox === false && !payment?.qrImage && (!payment || (pending && !expired)) && <label>
      <input type="checkbox" checked={liveConfirmed} onChange={event => setLiveConfirmed(event.target.checked)} /> ยืนยันสร้าง QR สำหรับชำระเงินจริง
    </label>}
    {available === null && <p role="status">กำลังตรวจสอบช่องทางชำระเงิน...</p>}
    {available === false && !error && <p role="status">พร้อมเพย์ยังไม่พร้อมใช้งาน</p>}
    {!payment && bookingId && !error && <p role="status">กำลังโหลดรายการชำระเงิน...</p>}
    {!payment && !bookingId && <button type="button" className="wide-button" disabled={!available || busy || sandbox === null || (sandbox === false && !liveConfirmed)} onClick={create}>
      {busy ? <RefreshCw size={18} /> : <QrCode size={18} />}{busy ? 'กำลังสร้าง QR...' : 'สร้าง QR พร้อมเพย์'}
    </button>}
    {payment && <>
      <strong className="beam-amount">{payment.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</strong>
      {pending && !expired && payment.qrImage && <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="beam-qr" src={payment.qrImage} width={240} height={240} alt="QR พร้อมเพย์สำหรับค่าปรึกษา" />
        <p className="beam-timer"><Clock size={16} />{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</p>
        <a className="beam-download" href={payment.qrImage} download="telemed-promptpay.png"><Download size={16} />บันทึก QR</a>
      </>}
      <p role="status" className="beam-status">{payment.status === 'PAID' ? <><CheckCircle2 size={22} />ชำระค่าปรึกษาสำเร็จ</> :
        payment.status === 'REVIEW_REQUIRED' ? 'ได้รับผลชำระแล้ว กรุณาติดต่อเจ้าหน้าที่เพื่อตรวจสอบรายการ' :
        payment.status === 'FAILED' ? 'ชำระไม่สำเร็จ กรุณาติดต่อเจ้าหน้าที่หรือเลือกนัดหมายใหม่' :
        expired || payment.status === 'EXPIRED' ? 'รายการชำระหมดอายุ กรุณาตรวจสอบผลชำระก่อนเลือกนัดหมายใหม่' :
        !payment.qrImage ? 'ยังไม่ได้ชำระเงิน กรุณาสร้าง QR เพื่อชำระค่าปรึกษา' : 'รอชำระเงิน กรุณาสแกน QR เพื่อชำระค่าปรึกษา'}</p>
      {pending && !expired && !payment.qrImage && <button type="button" className="wide-button" disabled={!available || busy || sandbox === null || (sandbox === false && !liveConfirmed)} onClick={create}>
        {busy ? <RefreshCw size={18} /> : <QrCode size={18} />}{busy ? 'กำลังสร้าง QR...' : 'สร้าง QR เพื่อชำระเงิน'}
      </button>}
      {payment.status === 'PAID' ? <button type="button" className="wide-button" onClick={onPaid}><CheckCircle2 size={18} />ดูนัดหมาย</button> :
        (!pending || expired || payment.qrImage) && <button type="button" className="wide-button soft" disabled={busy} onClick={() => void refresh()}><RefreshCw size={18} />ตรวจสอบผลชำระ</button>}
    </>}
    {error && <p role="alert" className="slip-error">{error}</p>}
  </section>;
}
