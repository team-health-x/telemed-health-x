"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, FileCheck2, ImagePlus, LoaderCircle, RefreshCw, ShieldCheck, Stethoscope, Upload, Video, WalletCards, X } from "lucide-react";
import "./booking-sheet.css";
import PaymentMethods from './payment-methods';

type Offering = {
  courseId: string; courseItemId: string; courseName: string; courseCode: string;
  price: number; durationMinutes: number;
  availability: { date: string; times: string[] }[];
};
type Catalog = { doctors: { id: string; name: string; courses: Offering[] }[] };
type Doctor = {
  id: string; doctorId: string; courseItemId: string; name: string; specialty: string; duration: string; price: number;
  availability: Offering["availability"];
};
function formatDate(date: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(date + "T00:00:00+07:00").toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", ...options });
}
function DoctorPhoto({ doctor }: { doctor: Doctor }) {
  return <span className="booking-doctor-placeholder" role="img" aria-label={`ยังไม่มีรูป ${doctor.name}`}><Stethoscope size={30} /></span>;
}

export default function BookingSheet({ onClose, onSubmitted }: { onClose?: () => void; onSubmitted?: () => void }) {
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const dialog = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const submittingRef = useRef(false);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  function close() { if (submittingRef.current) return; if (closeRef.current) closeRef.current(); else window.location.assign("/register"); }
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/telemed/catalog", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "ไม่สามารถโหลดข้อมูลได้");
        return body as Catalog;
      })
      .then(catalog => {
        if (!controller.signal.aborted) setDoctors(catalog.doctors.flatMap(d => d.courses
          .filter(c => c.availability.some(day => day.times.length > 0))
          .map(c => ({
            id: JSON.stringify([d.id, c.courseItemId]), doctorId: d.id, courseItemId: c.courseItemId, name: d.name,
            specialty: c.courseName, duration: `${c.durationMinutes} นาที`, price: c.price,
            availability: c.availability.filter(day => day.times.length > 0),
          }))));
      })
      .catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key !== "Tab") return;
      const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]') ?? [])].filter(el => el.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, []);
  function retry() { setDoctors(null); setError(""); setAttempt(value => value + 1); }
  return <div className="sheet-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <section ref={dialog} tabIndex={-1} className="booking-sheet telemed-booking" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      {doctors && doctors.length > 0 ? <BookingContent doctors={doctors} onClose={close} onPending={value => { submittingRef.current = value; }} onSubmitted={onSubmitted ?? (() => window.location.assign('/register?tab=appointments'))} /> : <>
        <div className="sheet-handle" />
        <div className="booking-heading"><span /><h2 id="booking-title">นัดหมายแพทย์</h2><button type="button" aria-label="ปิด" onClick={close}><X size={18} /></button></div>
        <div className="booking-load-state">
          {error ? <><p role="alert">{error}</p><button className="wide-button" type="button" onClick={retry}><RefreshCw size={18} />ลองใหม่</button></> :
            doctors ? <><p role="status">ยังไม่มีแพทย์เปิดรับนัดในช่วงนี้</p><button className="wide-button" type="button" onClick={retry}>ตรวจสอบอีกครั้ง</button></> :
            <p role="status"><LoaderCircle className="booking-spinner" size={22} />กำลังโหลดแพทย์และคอร์ส...</p>}
        </div>
      </>}
    </section>
  </div>;
}

type BookingStage = "doctor" | "schedule" | "payment" | "slip";

function BookingContent({ doctors, onClose, onSubmitted, onPending }: { doctors: Doctor[]; onClose: () => void; onSubmitted: () => void; onPending: (value: boolean) => void }) {
  const [paymentAvailable, setPaymentAvailable] = useState(false);
  const [doctorId, setDoctorId] = useState(doctors[0].id);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const requestKey = useRef('');
  const pending = useRef(false);
  function onDoctor(id: string) {
    if (id === doctorId) return;
    setDoctorId(id); setDate(""); setTime(""); setSlip(null); setSlipError(""); requestKey.current = '';
  }
  function onDate(value: string) { setDate(value); setTime(""); setSlip(null); setSlipError(""); }
  function onTime(value: string) { setTime(value); setSlip(null); setSlipError(""); }
  async function onConfirm() {
    if (!slip || !validTime || pending.current) return;
    onPending(true);
    pending.current = true; setSubmitting(true); setSubmitError('');
    requestKey.current ||= crypto.randomUUID();
    try {
      const slipData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
        reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.readAsDataURL(slip);
      });
      const response = await fetch('/api/telemed/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestKey: requestKey.current, doctorId: selectedDoctor.doctorId, courseItemId: selectedDoctor.courseItemId, date, time, expectedPrice: selectedDoctor.price, slipData, slipMime: slip.type, slipName: slip.name }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ส่งนัดหมายไม่สำเร็จ');
      onSubmitted();
    } catch (e) { setSubmitError(e instanceof Error ? e.message : 'ส่งนัดหมายไม่สำเร็จ'); }
    finally { pending.current = false; onPending(false); setSubmitting(false); }
  }
  const [stage, setStage] = useState<BookingStage>("doctor");
  const [slip, setSlip] = useState<File | null>(null);
  const [slipError, setSlipError] = useState("");
  const selectedDoctor = doctors.find((doctor) => doctor.id === doctorId) ?? doctors[0];
  const times = selectedDoctor.availability.find(day => day.date === date)?.times ?? [];
  const validTime = !!date && times.includes(time);
  const stageOrder: BookingStage[] = ["doctor", "schedule", "payment", "slip"];
  const step = stageOrder.indexOf(stage) + 1;
  const titles: Record<BookingStage, string> = {
    doctor: "เลือกแพทย์",
    schedule: "เลือกวันและเวลา",
    payment: "ชำระค่าปรึกษา",
    slip: "แนบสลิป",
  };

  function goBack() {
    const previous = stageOrder[step - 2];
    if (previous) setStage(previous);
  }

  function chooseSlip(file?: File) {
    requestKey.current = ''; setSubmitError('');
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSlip(null);
      setSlipError("ไฟล์มีขนาดเกิน 10 MB กรุณาเลือกไฟล์ใหม่");
      return;
    }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type) || file.size === 0) {
      setSlip(null); setSlipError("กรุณาเลือกไฟล์ JPG, PNG หรือ PDF"); return;
    }
    setSlip(file);
    setSlipError("");
  }

  function useDemoSlip() {
    if (process.env.NODE_ENV !== 'development' || !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) return;
    // A tiny PNG fixture, generated locally without uploading or fetching a file.
    const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a33sAAAAASUVORK5CYII='), char => char.charCodeAt(0));
    chooseSlip(new File([bytes], 'demo-slip-local.png', { type: 'image/png' }));
  }

  return (
    <fieldset disabled={submitting} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }} aria-busy={submitting}>
        <div className="sheet-handle" />
        <div className="booking-heading">
          {stage === "doctor" ? <span /> : <button type="button" aria-label="ย้อนกลับ" onClick={goBack}><ArrowLeft size={18} strokeWidth={2.4} aria-hidden="true" /></button>}
          <div><p className="eyebrow">นัดหมายแพทย์</p><h2 id="booking-title">{titles[stage]}</h2></div>
          <button type="button" aria-label="ปิด" onClick={onClose}><X size={18} strokeWidth={2.5} aria-hidden="true" /></button>
        </div>
        <div className="booking-step-meta"><span>ขั้นตอนที่ {step} จาก 4</span><strong>{step * 25}%</strong></div>
        <div className="booking-progress" aria-label={`ความคืบหน้า ${step} จาก 4 ขั้นตอน`}><span style={{ width: `${step * 25}%` }} /></div>

        <div className="booking-content">
          {stage === "doctor" && (
            <>
              <p className="booking-lead">เลือกแพทย์ที่ต้องการปรึกษา ค่าบริการจะแสดงก่อนชำระเงิน</p>
              <div className="doctor-options" role="radiogroup" aria-label="เลือกแพทย์">
                {doctors.map((doctor) => (
                  <button key={doctor.id} type="button" className={`doctor-option ${doctorId === doctor.id ? "selected" : ""}`} role="radio" aria-checked={doctorId === doctor.id} onClick={() => onDoctor(doctor.id)}>
                    <span className="doctor-option-photo"><DoctorPhoto doctor={doctor} /></span>
                    <div className="doctor-option-info"><strong>{doctor.name}</strong><small>{doctor.specialty}</small><span><i><Video size={13} aria-hidden="true" />{doctor.duration}</i><i>เปิดรับนัด</i></span></div>
                    <b><small>ค่าปรึกษา</small>฿{doctor.price.toLocaleString("th-TH")}</b>
                    {doctorId === doctor.id && <span className="doctor-option-selected"><Check size={12} strokeWidth={3} aria-hidden="true" />เลือกแล้ว</span>}
                  </button>
                ))}
              </div>
              <button className="wide-button" type="button" disabled={!selectedDoctor.availability.length} onClick={() => setStage("schedule")}>เลือกวันและเวลา <ArrowRight size={17} aria-hidden="true" /></button>
            </>
          )}

          {stage === "schedule" && (
            <>
              <DoctorBookingSummary doctor={selectedDoctor} />
              <p className="field-label booking-date-label">วันที่เปิดรับนัด · เวลาประเทศไทย</p>
              <div className="date-options" role="group" aria-label="เลือกวันที่">
                {selectedDoctor.availability.map(day => (
                  <button key={day.date} type="button" aria-pressed={date === day.date} className={date === day.date ? "selected" : ""} onClick={() => onDate(day.date)}>
                    <small>{formatDate(day.date, { weekday: "short" })}</small>
                    <strong>{formatDate(day.date, { day: "numeric" })}</strong>
                    <small>{formatDate(day.date, { month: "short", year: "2-digit" })}</small>
                  </button>
                ))}
              </div>
              <p className="field-label">เวลาที่ว่าง</p>
              {!date && <p className="booking-lead">กรุณาเลือกวันที่</p>}
              <div className="time-options" role="group" aria-label="เลือกเวลา">
                {times.map(value => <button key={value} type="button" aria-pressed={time === value} className={time === value ? "selected" : ""} onClick={() => onTime(value)}>{value}</button>)}
              </div>
              <button className="wide-button" type="button" disabled={!validTime} onClick={() => setStage("payment")}>ไปหน้าชำระเงิน • ฿{selectedDoctor.price.toLocaleString("th-TH")}</button>
            </>
          )}

          {stage === "payment" && (
            <>
              <div className="payment-summary">
                <div><span>คอร์ส</span><strong>{selectedDoctor.specialty}</strong></div>
                <div><span>แพทย์</span><strong>{selectedDoctor.name}</strong></div>
                <div><span>วันและเวลา</span><strong>{formatDate(date)} • {time} น.</strong></div>
                <div className="payment-total"><span>ยอดชำระทั้งหมด</span><strong>฿{selectedDoctor.price.toLocaleString("th-TH")}</strong></div>
              </div>
              <PaymentMethods onAvailable={setPaymentAvailable} />
              <p className="payment-demo-note">ทดสอบเท่านั้น กรุณาอย่าโอนเงินจริง ยังไม่มีการจองคิว</p>
              <button className="wide-button" type="button" disabled={!paymentAvailable} onClick={() => setStage("slip")}>ไปแนบสลิปทดสอบ <ArrowRight size={17} aria-hidden="true" /></button>
            </>
          )}

          {stage === "slip" && (
            <>
              <div className="payment-summary compact">
                <div><span>ยอดชำระ</span><strong>฿{selectedDoctor.price.toLocaleString("th-TH")}</strong></div>
                <div><span>นัดหมาย</span><strong>{formatDate(date)} • {time} น.</strong></div>
              </div>
              {process.env.NODE_ENV === 'development' && <button className="wide-button soft" type="button" onClick={useDemoSlip}><ImagePlus size={18} aria-hidden="true" />ใช้รูปทดสอบ (Local)</button>}
              <label className={`slip-upload ${slip ? "uploaded" : ""}`}>
                <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => chooseSlip(event.target.files?.[0])} />
                <span>{slip ? <FileCheck2 size={25} aria-hidden="true" /> : <Upload size={25} aria-hidden="true" />}</span>
                <strong>{slip ? slip.name : "แตะเพื่อแนบสลิป"}</strong>
                <small>{slip ? `${(slip.size / 1024 / 1024).toFixed(2)} MB • แตะเพื่อเปลี่ยนไฟล์` : "รองรับ JPG, PNG หรือ PDF ขนาดไม่เกิน 10 MB"}</small>
              </label>
              {slipError && <p className="slip-error" role="alert">{slipError}</p>}
              <div className="slip-privacy"><ShieldCheck size={17} aria-hidden="true" /><p>ส่งสลิปเพื่อให้เจ้าหน้าที่ตรวจสอบการชำระเงิน ยังไม่ถือว่าชำระสำเร็จ</p></div>
              {submitError && <p role="alert" className="slip-error">{submitError}</p>}
              <button className="wide-button" type="button" disabled={!slip || !validTime || submitting} onClick={onConfirm}>{submitting ? 'กำลังส่งนัดหมาย...' : 'ส่งนัดหมายและสลิป'}</button>
            </>
          )}
        </div>
    </fieldset>
  );
}

function DoctorBookingSummary({ doctor }: { doctor: Doctor }) {
  return (
    <div className="doctor-mini">
      <DoctorPhoto doctor={doctor} />
      <div><small>แพทย์ที่เลือก</small><strong>{doctor.name}</strong><p>{doctor.specialty}</p></div>
      <span>{doctor.duration}<b>฿{doctor.price.toLocaleString("th-TH")}</b></span>
    </div>
  );
}
