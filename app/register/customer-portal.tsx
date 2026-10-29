"use client";

import { useEffect, useRef, useState } from "react";
import RegistrationFlow, { type RegisteredProfile } from "./registration-flow";
import BookingSheet from "./booking-sheet";
import TelemedAppointments from "./telemed-appointments";
import TelemedPrescriptions from './telemed-prescriptions';
import ShippingAddressEditor, { type ShippingAddress } from './shipping-address';
import UiSkeleton from '../ui-skeleton';
import { customerFirstName } from '../lib/customer-display-name';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  CameraOff,
  Check,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  FileText,
  HeartPulse,
  History,
  HomeIcon,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Mic,
  MicOff,
  NotebookTabs,
  PhoneOff,
  Pill,
  RefreshCw,
  Save,
  ShieldCheck,
  Send,
  Stethoscope,
  UserRound,
  Video,
  WalletCards,
  Weight,
  X,
  type LucideIcon,
} from "lucide-react";

type Tab = "home" | "appointments" | "prescriptions" | "history" | "profile";
type ProfilePanel = null | "personal" | "basic" | "health" | "address" | "email" | "privacy" | "help" | "logout";
type DoctorId = "nicha" | "arin" | "pavee";

type Doctor = {
  id: DoctorId;
  initials: string;
  image: string;
  name: string;
  specialty: string;
  duration: string;
  price: number;
};

type ProfileData = RegisteredProfile & { shippingAddress?: ShippingAddress };

const navItems: { id: Tab; Icon: LucideIcon; label: string }[] = [
  { id: "home", Icon: HomeIcon, label: "หน้าหลัก" },
  { id: "appointments", Icon: CalendarDays, label: "นัดหมาย" },
  { id: "prescriptions", Icon: Pill, label: "ใบสั่งยา" },
  { id: "history", Icon: History, label: "ประวัติ" },
  { id: "profile", Icon: UserRound, label: "โปรไฟล์" },
];

const doctors: Doctor[] = [
  { id: "nicha", initials: "ณว", image: "/doctors/doctor-nicha.jpg", name: "พญ. ณิชา วรเวช", specialty: "เวชศาสตร์ควบคุมน้ำหนัก", duration: "30 นาที", price: 500 },
  { id: "arin", initials: "อพ", image: "/doctors/doctor-arin.jpg", name: "นพ. อรินทร์ พิพัฒน์", specialty: "อายุรศาสตร์และเมตาบอลิก", duration: "30 นาที", price: 650 },
  { id: "pavee", initials: "ปช", image: "/doctors/doctor-pavee.jpg", name: "พญ. ปวีณ์ ชาญกิจ", specialty: "เวชศาสตร์ชะลอวัย", duration: "45 นาที", price: 800 },
];

export default function CustomerPortal({ customer, initialTab = 'home', allowTestData = false }: { customer?: { customerId?: string; name: string; phone: string }; initialTab?: 'home' | 'appointments'; allowTestData?: boolean }) {
  useEffect(() => {
    if (!customer) return;
    const channel = new BroadcastChannel('telemed-demo-auth');
    channel.onmessage = event => { if (event.data === 'logout') window.location.replace('/login'); };
    return () => channel.close();
  }, [customer]);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [bookingRefresh, setBookingRefresh] = useState(0);
  const [registrationComplete, setRegistrationComplete] = useState(!!customer);
  const [registrationStarted, setRegistrationStarted] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDate] = useState("29");
  const [selectedTime] = useState("14:30");
  const [selectedDoctorId] = useState<DoctorId>("nicha");
  const [appointmentBooked] = useState(false);
  const [appointmentConfirmationOpen, setAppointmentConfirmationOpen] = useState(false);
  const [profilePanel, setProfilePanel] = useState<ProfilePanel>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>(customer ? {
    name: customer.name, phone: customer.phone, birthDate: '', height: '', startWeight: '',
    healthHistory: '', allergyHistory: '', address: '', email: '',
  } : {
    name: "", phone: "", birthDate: "", height: "", startWeight: "",
    healthHistory: "", allergyHistory: "", address: "", email: "",
  });
  const [toast, setToast] = useState("");
  const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId) ?? doctors[0];

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  if (!registrationComplete) {
    if (!registrationStarted) {
      return <RegistrationWelcome onStart={() => setRegistrationStarted(true)} />;
    }
    return (
      <RegistrationFlow
        allowTestData={allowTestData}
        onComplete={(profile) => {
          setProfileData(profile);
          setRegistrationComplete(true);
          setActiveTab("home");
        }}
      />
    );
  }

  return (
    <main className="app-shell">
      {customer && <p role="status" style={{ padding: '8px 16px', color: '#29634f' }}>รหัสลูกค้า · {customer.customerId}</p>}
      <AppHeader
        title={activeTab === "home" ? undefined : navItems.find((item) => item.id === activeTab)?.label}
        profileName={profileData.name}
        onProfile={() => setActiveTab("profile")}
      />

      {activeTab === "home" && (
        <HomeView
          userName={profileData.name}
          bookingRefresh={bookingRefresh}
          onAppointment={() => setBookingOpen(true)}
        />
      )}
      {activeTab === "appointments" && (
        <TelemedAppointments refreshKey={bookingRefresh} onBook={() => setBookingOpen(true)} />
      )}
      {activeTab === "history" && (
        <HistoryView
          refreshKey={bookingRefresh}
        />
      )}
      {activeTab === "prescriptions" && <TelemedPrescriptions />}
      {activeTab === "profile" && <ProfileView data={profileData} onOpen={setProfilePanel} />}

      <BottomNav active={activeTab} onChange={setActiveTab} />

      {bookingOpen && (
        <BookingSheet onClose={() => setBookingOpen(false)} onSubmitted={() => { setBookingOpen(false); setActiveTab('appointments'); setBookingRefresh(value => value + 1); }} />
      )}

      {appointmentConfirmationOpen && (
        <AppointmentConfirmationModal
          doctor={selectedDoctor}
          date={selectedDate}
          time={selectedTime}
          onClose={() => setAppointmentConfirmationOpen(false)}
        />
      )}


      {profilePanel && (
        <ProfileSheet
          panel={profilePanel}
          data={profileData}
          onClose={() => setProfilePanel(null)}
          onSave={(nextData, message) => {
            setProfileData(nextData);
            setProfilePanel(null);
            showToast(message);
          }}
          onLogout={async () => {
            if (customer) {
              try {
                const response = await fetch('/api/telemed/auth/logout', { method: 'POST' });
                if (!response.ok) throw new Error('logout failed');
                const channel = new BroadcastChannel('telemed-demo-auth');
                channel.postMessage('logout'); channel.close();
                window.location.replace('/login');
              } catch { showToast('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่'); }
              return;
            }
            setProfilePanel(null);
            setActiveTab("home");
            setRegistrationStarted(false);
            setRegistrationComplete(false);
          }}
        />
      )}

      {videoOpen && <VideoCallOverlay profile={profileData} doctor={selectedDoctor} date={selectedDate} time={selectedTime} onClose={() => setVideoOpen(false)} onToast={showToast} />}

      {toast && <div className="toast" role="status"><span><Check size={13} strokeWidth={3} aria-hidden="true" /></span>{toast}</div>}
    </main>
  );
}

function RegistrationWelcome({ onStart }: { onStart: () => void }) {
  return (
    <main className="app-shell onboarding-shell">
      <header className="onboarding-brand">
        <div className="brand-lockup" aria-label="Program Resize by The Ritz Clinic">
          <img className="brand-logo program-resize-logo" src="/program-resize-logo.png" alt="Program Resize" />
          <span className="brand-divider" aria-hidden="true" />
          <img className="brand-logo ritz-logo" src="/the-ritz-clinic-logo.png" alt="The Ritz Clinic" />
        </div>
      </header>

      <section className="onboarding-hero" aria-labelledby="onboarding-title">
        <span className="onboarding-orb onboarding-orb-one" aria-hidden="true" />
        <span className="onboarding-orb onboarding-orb-two" aria-hidden="true" />
        <p className="onboarding-kicker">ยินดีต้อนรับสู่ PROGRAM RESIZE</p>
        <h1 id="onboarding-title">เริ่มต้นดูแลน้ำหนัก<br />อย่างมั่นใจกับทีมแพทย์</h1>
        <p>ลงทะเบียนครั้งเดียว เพื่อให้แพทย์รู้จักสุขภาพของคุณและวางแผนการดูแลได้เหมาะสมยิ่งขึ้น</p>
        <div className="onboarding-plan-card">
          <span><Stethoscope size={22} strokeWidth={2.2} aria-hidden="true" /></span>
          <div><small>การดูแลเฉพาะบุคคล</small><strong>ประเมินโดยทีมแพทย์ The Ritz Clinic</strong></div>
          <i><Check size={15} strokeWidth={3} aria-hidden="true" /></i>
        </div>
        <div className="onboarding-consultation-price">
          <strong>ปรึกษา 500 บาท</strong>
          <p>*สามารถนำมาเป็นส่วนลดในการซื้อคอร์สได้</p>
        </div>
      </section>

      <section className="onboarding-prep" aria-labelledby="onboarding-prep-title">
        <p className="eyebrow">ก่อนเริ่มลงทะเบียน</p>
        <h2 id="onboarding-prep-title">เตรียมข้อมูลเพียง 3 ส่วน</h2>
        <div className="onboarding-checklist">
          <div><span><UserRound size={19} strokeWidth={2.2} aria-hidden="true" /></span><p><strong>ข้อมูลส่วนตัว</strong><small>บัตรประชาชนและข้อมูลติดต่อ</small></p></div>
          <div><span><HeartPulse size={19} strokeWidth={2.2} aria-hidden="true" /></span><p><strong>ข้อมูลสุขภาพ</strong><small>โรคประจำตัว ยาที่ใช้ และประวัติแพ้ยา</small></p></div>
          <div><span><FileCheck2 size={19} strokeWidth={2.2} aria-hidden="true" /></span><p><strong>ตรวจสอบและยินยอม</strong><small>ยืนยันความถูกต้องก่อนส่งให้คลินิก</small></p></div>
        </div>
      </section>

      <div className="onboarding-privacy"><ShieldCheck size={18} strokeWidth={2.3} aria-hidden="true" /><p><strong>ขั้นตอนถัดไปเกี่ยวข้องกับข้อมูลสุขภาพและข้อมูลอ่อนไหว</strong><small>โปรดอ่านรายละเอียดและให้ความยินยอมก่อนเริ่มกรอกข้อมูล เพื่อการลงทะเบียนและบริการทางการแพทย์</small></p></div>
      <button className="onboarding-start" type="button" onClick={onStart}>เริ่มลงทะเบียน <ArrowRight size={19} strokeWidth={2.5} aria-hidden="true" /></button>
      <p className="onboarding-time">ใช้เวลาประมาณ 5–7 นาที</p>
    </main>
  );
}

function firstName(name: string) {
  return customerFirstName(name);
}

function profileInitial(name: string) {
  return Array.from(firstName(name))[0] || "ส";
}

function formatThaiDate(value: string) {
  if (!value) return "ยังไม่ได้ระบุวันเกิด";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function AppHeader({ title, profileName, onProfile }: { title?: string; profileName: string; onProfile: () => void }) {
  return (
    <header className="topbar">
      {title ? (
        <h1 className="page-title">{title}</h1>
      ) : (
        <div className="brand-lockup" aria-label="Program Resize by The Ritz Clinic">
          <img className="brand-logo program-resize-logo" src="/program-resize-logo.png" alt="Program Resize" />
          <span className="brand-divider" aria-hidden="true" />
          <img className="brand-logo ritz-logo" src="/the-ritz-clinic-logo.png" alt="The Ritz Clinic" />
        </div>
      )}
      <button className="profile-button" type="button" aria-label={`เปิดโปรไฟล์ของ ${profileName}`} onClick={onProfile}>{profileInitial(profileName)}</button>
    </header>
  );
}

function HomeView({ userName, onAppointment, bookingRefresh }: { userName: string; onAppointment: () => void; bookingRefresh: number }) {
  return (
    <>
      <section className="greeting" aria-labelledby="welcome-title">
        <h1 id="welcome-title">สวัสดีค่ะ {firstName(userName)}</h1>
        <p>ดูแลน้ำหนักอย่างเป็นระบบ ไปทีละก้าวกับทีมแพทย์</p>
      </section>

      <section className="hero-card consultation-card" aria-label="ปรึกษาแพทย์ออนไลน์">
        <div className="hero-content">
          <span className="status-pill"><Video size={16} aria-hidden="true" />ปรึกษาออนไลน์</span>
          <h2>ปรึกษาแพทย์ออนไลน์</h2>
          <p>พูดคุยกับแพทย์ รับคำปรึกษาและคำแนะนำในการดูแลสุขภาพผ่านวิดีโอคอล</p>
          <button className="primary-button" type="button" onClick={onAppointment}><CalendarDays size={20} aria-hidden="true" />นัดหมายแพทย์ <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" /></button>
        </div>
      </section>

      <a className="telemed-brochure" href="/resize-telemed-brochure.jpg" target="_blank" rel="noopener noreferrer" aria-label="เปิดโบรชัวร์ Resize by THE RITZ ขนาดเต็ม">
        <img src="/resize-telemed-brochure.jpg" alt="โบรชัวร์ Resize by THE RITZ โปรแกรม Telemed และราคายา Wegovy และ Mounjaro" width={1145} height={1374} />
      </a>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">นัดหมายของคุณ</p><h2>นัดหมายที่กำลังมาถึง</h2></div></div>
        <TelemedAppointments refreshKey={bookingRefresh} onBook={onAppointment} compact />
      </section>

    </>
  );
}

function HistoryView({ refreshKey }: { refreshKey: number }) {
  type HistoryBooking = { id: string; date: string; time: string; doctorName: string; courseName: string; price: number; paidAmount: number; state: string; saleOrderId: string };
  type MedicineHistory = { saleOrderId: string; date: string; names: string[]; total: number; paidAmount: number; balance: number; status: string; paymentUrl: string | null; receipts: { id: string; date: string | null; amount: number }[] };
  const [bookings, setBookings] = useState<HistoryBooking[]>([]);
  const [medicines, setMedicines] = useState<MedicineHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch('/api/telemed/history', { cache: 'no-store', signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'โหลดประวัติไม่สำเร็จ');
        if (!Array.isArray(result.bookings) || !Array.isArray(result.medicines) || [...result.bookings, ...result.medicines].some(item => !Number.isFinite(item.paidAmount))) throw new Error('ข้อมูลชำระเงินยังไม่พร้อม กรุณาลองใหม่');
        if (!controller.signal.aborted) { setBookings(result.bookings); setMedicines(result.medicines); setError(''); }
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'โหลดประวัติไม่สำเร็จ');
      } finally { pending = false; if (!controller.signal.aborted) setLoading(false); }
    }
    void refresh();
    const interval = setInterval(() => { if (document.visibilityState !== 'hidden') void refresh(); }, 30000);
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [refreshKey, attempt]);
  const labels: Record<string, string> = { PENDING_PAYMENT: 'รอตรวจชำระเงิน', PENDING_MEETING: 'รอลิงก์ประชุม', CONFIRMED: 'ยืนยันนัดหมายแล้ว', CANCELLED: 'ยกเลิกแล้ว' };
  const historyItems = bookings.map(item => {
    const date = new Date(`${item.date}T00:00:00+07:00`);
    const format = (options: Intl.DateTimeFormatOptions) => date.toLocaleDateString('th-TH', { ...options, timeZone: 'Asia/Bangkok' });
    return {
      id: item.id, day: format({ day: '2-digit' }), month: format({ month: 'short' }),
      date: `${format({ day: 'numeric', month: 'long', year: 'numeric' })} · ${item.time} น.`,
      doctor: item.doctorName, specialty: item.courseName, amount: item.paidAmount,
      appointmentStatus: labels[item.state] || 'ไม่ทราบสถานะ',
      paymentStatus: item.paidAmount >= item.price && item.price > 0 ? 'ชำระครบแล้ว' : item.paidAmount > 0 ? 'ชำระบางส่วน' : 'ยังไม่มียอดรับชำระ',
      reference: item.saleOrderId, current: item.state !== 'CANCELLED',
    };
  });
  const consultationPaid = historyItems.reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100;
  const medicinePaid = medicines.reduce((sum, item) => sum + Math.round(item.paidAmount * 100), 0) / 100;
  const totalPaid = Math.round((consultationPaid + medicinePaid) * 100) / 100;
  const paymentLabels: Record<string, string> = { PAID: 'ชำระครบแล้ว', PARTIAL: 'ชำระบางส่วน', PENDING_REVIEW: 'รอตรวจสอบสลิป', UNPAID: 'ยังไม่มียอดรับชำระ', CANCELLED: 'ยกเลิกใบขาย' };

  return (
    <section className="tab-page history-page">
      <div className="page-intro">
        <h2>ประวัติการนัดหมายและชำระเงิน</h2>
        <p>นัดหมายและใบขายค่ายา อย่างละไม่เกิน 100 รายการ</p>
      </div>
      {loading && !error && <UiSkeleton label="กำลังโหลดประวัติ" />}
      {error && <div role="alert"><p>{error}</p><button type="button" className="wide-button soft" onClick={() => setAttempt(value => value + 1)}><RefreshCw size={18} />ลองใหม่</button></div>}
      {!loading && !error && <>
      <div className="history-summary-grid">
        <article><span><CalendarDays size={18} aria-hidden="true" /></span><div><small>นัดหมายในรายการ</small><strong>{historyItems.length} ครั้ง</strong></div></article>
        <article><span><WalletCards size={18} aria-hidden="true" /></span><div><small>ชำระแล้ว</small><strong>฿{totalPaid.toLocaleString("th-TH")}</strong></div></article>
      </div>
      <dl className="history-payment-summary">
        <div><dt>ค่าปรึกษาที่รับชำระ</dt><dd>฿{consultationPaid.toLocaleString('th-TH')}</dd></div>
        <div><dt>ค่ายาที่รับชำระ</dt><dd>฿{medicinePaid.toLocaleString('th-TH')}</dd></div>
      </dl>
      {!medicines.length && !historyItems.length ? <div className="history-empty" role="status">
        <History size={56} strokeWidth={1.5} aria-hidden="true" />
        <h2>ยังไม่มีประวัติ</h2>
        <p>ประวัติการนัดหมายและชำระเงินของคุณจะแสดงที่นี่</p>
      </div> : <>
      <div className="section-heading compact"><h2>ประวัติชำระค่ายา</h2></div>
      <div className="history-list">
        {!medicines.length && <p className="history-section-empty">ยังไม่มีรายการค่ายา</p>}
        {medicines.map(item => <article key={item.saleOrderId} className="history-card">
          <div className="history-card-top"><span className="history-date"><Pill size={24} aria-hidden="true" /></span><div><small>{new Date(item.date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })}</small><strong>ค่ายา · {item.saleOrderId}</strong><p>{item.names.join(', ')}</p></div></div>
          <div className="history-payment-row"><span><WalletCards size={16} aria-hidden="true" />{paymentLabels[item.status] || 'ไม่ทราบสถานะ'}</span><strong>รับชำระ ฿{item.paidAmount.toLocaleString('th-TH')}</strong></div>
          <p className="history-reference">ยอดสุทธิ ฿{item.total.toLocaleString('th-TH')} · คงเหลือ ฿{item.balance.toLocaleString('th-TH')}</p>
          {item.receipts.map(receipt => <p className="history-reference" key={receipt.id}>ใบเสร็จ {receipt.id}{receipt.date ? ` · ${new Date(receipt.date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })}` : ''} · ฿{receipt.amount.toLocaleString('th-TH')}</p>)}
          {item.paymentUrl && <a className="wide-button soft" href={item.paymentUrl}>ดูรายการชำระเงิน</a>}
        </article>)}
      </div>
      <div className="section-heading compact"><h2>ประวัติการนัดหมาย</h2></div>
      <div className="history-list">
        {!historyItems.length && <p className="history-section-empty">ยังไม่มีประวัติการนัดหมาย</p>}
        {historyItems.map((item) => (
          <article key={item.id} className={`history-card ${item.current ? "current" : ""}`}>
            <div className="history-card-top">
              <span className="history-date"><strong>{item.day}</strong><small>{item.month}</small></span>
              <div><small>{item.date}</small><strong>{item.doctor}</strong><p>{item.specialty}</p></div>
              <i className="upcoming">{item.appointmentStatus}</i>
            </div>
            <div className="history-payment-row"><span><WalletCards size={16} aria-hidden="true" />{item.paymentStatus}</span><strong>฿{item.amount.toLocaleString("th-TH")}</strong></div>
            <p className="history-reference">ใบรายการขาย {item.reference}</p>
          </article>
        ))}
      </div>
      </>}
      </>}
    </section>
  );
}

function AppointmentsView({ appointmentBooked, selectedDate, selectedTime, doctor, onBook, onJoin }: { appointmentBooked: boolean; selectedDate: string; selectedTime: string; doctor: Doctor; onBook: () => void; onJoin: () => void }) {
  return (
    <section className="tab-page">
      {appointmentBooked ? (
        <article className="confirmed-card">
          <div className="confirmed-top"><span><Check size={20} strokeWidth={3} aria-hidden="true" /></span><div><small>ชำระเงินและยืนยันแล้ว</small><strong>{selectedDate} สิงหาคม 2569 • {selectedTime} น.</strong></div></div>
          <div className="doctor-row"><DoctorPhoto doctor={doctor} /><div><small>แพทย์ที่เลือก</small><strong>{doctor.name}</strong><p>{doctor.specialty} • ฿{doctor.price.toLocaleString("th-TH")}</p></div></div>
          <button className="wide-button soft" type="button" onClick={onJoin}><Video size={17} strokeWidth={2.3} aria-hidden="true" /> เข้าห้องวิดีโอคอล</button>
          <p className="card-footnote">ห้องวิดีโอจะเปิดก่อนเวลานัด 10 นาที และมีลิงก์สำรองในอีเมล</p>
        </article>
      ) : (
        <article className="empty-appointment">
          <div className="calendar-art"><span>29</span></div>
          <h3>นัดติดตามผลกับแพทย์</h3>
          <p>เลือกเวลาที่สะดวกเพื่อทบทวนผลและวางแผนสัปดาห์ถัดไป</p>
          <button className="wide-button" type="button" onClick={onBook}>นัดหมายแพทย์</button>
        </article>
      )}
      <button className="change-appointment" type="button" onClick={onBook}>เปลี่ยนวันหรือเวลานัด</button>
      <div className="section-heading compact"><div><p className="eyebrow">ก่อนพบแพทย์</p><h2>เช็กลิสต์เตรียมตัว</h2></div></div>
      <div className="check-list">
        <div><span><Weight size={17} strokeWidth={2.3} aria-hidden="true" /></span><p><strong>บันทึกน้ำหนักล่าสุด</strong><small>ใช้เครื่องชั่งเดิมและช่วงเวลาใกล้เคียงเดิม</small></p></div>
        <div><span><NotebookTabs size={17} strokeWidth={2.3} aria-hidden="true" /></span><p><strong>เตรียมรายการยาและอาหารเสริม</strong><small>รวมยาที่แพทย์ท่านอื่นสั่งและยาที่ซื้อเอง</small></p></div>
        <div><span><HeartPulse size={17} strokeWidth={2.3} aria-hidden="true" /></span><p><strong>สรุปอาการหลังฉีด</strong><small>คลื่นไส้ อาเจียน ปวดท้อง หรืออาการที่กังวล</small></p></div>
      </div>
    </section>
  );
}


function AppointmentConfirmationModal({ doctor, date, time, onClose }: { doctor: Doctor; date: string; time: string; onClose: () => void }) {
  return (
    <div className="appointment-confirmation-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="appointment-confirmation" role="dialog" aria-modal="true" aria-labelledby="appointment-confirmation-title">
        <header className="appointment-confirmation-hero">
          <button className="appointment-confirmation-close" type="button" aria-label="ปิด" onClick={onClose}><X size={18} strokeWidth={2.5} aria-hidden="true" /></button>
          <div className="appointment-confirmation-status">
            <span className="appointment-success-mark"><Check size={23} strokeWidth={3} aria-hidden="true" /></span>
            <div>
              <small>ส่งสลิปสำเร็จ</small>
              <h2 id="appointment-confirmation-title">นัดหมายเรียบร้อย</h2>
              <p>ระบบบันทึกนัดหมายของคุณแล้ว</p>
            </div>
          </div>
        </header>

        <div className="appointment-confirmation-body">
          <div className="appointment-ticket">
            <div className="appointment-ticket-doctor"><DoctorPhoto doctor={doctor} /><div><small>นัดหมายกับ</small><strong>{doctor.name}</strong><p>{doctor.specialty}</p></div><span><Video size={13} aria-hidden="true" />วิดีโอคอล</span></div>
            <div className="appointment-schedule-card">
              <span><CalendarDays size={20} strokeWidth={2.3} aria-hidden="true" /></span>
              <div><small>วันนัดหมาย</small><strong>{date} สิงหาคม 2569</strong></div>
              <i />
              <div><small>เวลา</small><strong>{time} น.</strong></div>
            </div>
            <div className="appointment-ticket-meta">
              <div><small>ระยะเวลา</small><strong>{doctor.duration}</strong></div>
              <div><small>ค่าปรึกษา</small><strong>฿{doctor.price.toLocaleString("th-TH")}</strong></div>
            </div>
            <div className="appointment-ticket-status"><FileCheck2 size={17} aria-hidden="true" /><div><small>สถานะการชำระเงิน</small><strong>รับสลิปแล้ว</strong></div><span>รอตรวจสอบ</span></div>
            <p className="appointment-ticket-reference">APT-2569-{date.padStart(2, "0")}-001</p>
          </div>

          <div className="appointment-confirmation-note"><Mail size={16} aria-hidden="true" /><p>ทีมดูแลจะส่งผลยืนยันและลิงก์วิดีโอคอลทางอีเมล</p></div>
          <button className="wide-button" type="button" onClick={onClose}>ไปที่นัดหมาย <ArrowRight size={17} aria-hidden="true" /></button>
        </div>
      </section>
    </div>
  );
}

function ProfileView({ data, onOpen }: { data: ProfileData; onOpen: (panel: ProfilePanel) => void }) {
  return (
    <section className="tab-page">
      <div className="profile-hero">
        <div className="profile-large">{profileInitial(data.name)}</div>
        <h2>{data.name}</h2>
        <p>สมาชิก Program Resize • สัปดาห์ที่ 3 จาก 12</p>
        <button type="button" onClick={() => onOpen("personal")}>แก้ไขข้อมูล</button>
      </div>
      <div className="profile-card">
        <p className="settings-label">ข้อมูลสุขภาพ</p>
        <ProfileRow Icon={UserRound} title="ข้อมูลพื้นฐาน" detail={`${formatThaiDate(data.birthDate)} • ${data.height || "–"} ซม. • ${data.startWeight || "–"} กก.`} onClick={() => onOpen("basic")} />
        <ProfileRow Icon={Stethoscope} title="ประวัติสุขภาพและยา" detail={data.healthHistory || "ยังไม่ได้ระบุ"} onClick={() => onOpen("health")} />
        <ProfileRow Icon={MapPin} title="ที่อยู่จัดส่ง" detail={data.address || "ยังไม่ได้ระบุ"} onClick={() => onOpen("address")} />
      </div>
      <div className="profile-card">
        <p className="settings-label">บัญชีและความเป็นส่วนตัว</p>
        <ProfileRow Icon={Mail} title="อีเมล" detail={data.email} onClick={() => onOpen("email")} />
        <ProfileRow Icon={LockKeyhole} title="นโยบายความเป็นส่วนตัว" detail="การใช้และคุ้มครองข้อมูลสุขภาพ" onClick={() => onOpen("privacy")} />
        <ProfileRow Icon={CircleHelp} title="ศูนย์ช่วยเหลือ" detail="วิธีใช้ปากกา การจัดเก็บ และติดต่อทีมดูแล" onClick={() => onOpen("help")} />
      </div>
      <button className="logout-button" type="button" onClick={() => onOpen("logout")}><LogOut size={17} strokeWidth={2.3} aria-hidden="true" /> ออกจากระบบ</button>
    </section>
  );
}

function DoctorPhoto({ doctor, className = "" }: { doctor: Doctor; className?: string }) {
  return <img className={`doctor-photo ${className}`} src={doctor.image} alt={`รูป${doctor.name}`} />;
}

function ProfileRow({ Icon, title, detail, onClick }: { Icon: LucideIcon; title: string; detail: string; onClick: () => void }) {
  return <button type="button" className="profile-row" onClick={onClick}><span><Icon size={17} strokeWidth={2.3} aria-hidden="true" /></span><div><strong>{title}</strong><small>{detail}</small></div><i><ChevronRight size={18} aria-hidden="true" /></i></button>;
}

function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="bottom-nav" aria-label="เมนูหลัก">
      {navItems.map((item) => (
        <button key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} type="button" onClick={() => onChange(item.id)} aria-current={active === item.id ? "page" : undefined}>
          <span><item.Icon size={18} strokeWidth={2.25} aria-hidden="true" /></span>{item.label}
        </button>
      ))}
    </nav>
  );
}

function ProfileSheet({ panel, data, onClose, onSave, onLogout }: {
  panel: Exclude<ProfilePanel, null>;
  data: ProfileData;
  onClose: () => void;
  onSave: (data: ProfileData, message: string) => void;
  onLogout: () => void;
}) {
  const [draft, setDraft] = useState(data);
  const [addressValid, setAddressValid] = useState(false);
  const titles: Record<Exclude<ProfilePanel, null>, string> = {
    personal: "แก้ไขข้อมูลส่วนตัว",
    basic: "ข้อมูลพื้นฐาน",
    health: "ประวัติสุขภาพและยา",
    address: "ที่อยู่จัดส่ง",
    email: "แก้ไขอีเมล",
    privacy: "นโยบายความเป็นส่วนตัว",
    help: "ศูนย์ช่วยเหลือ",
    logout: "ออกจากระบบ",
  };
  const update = (key: keyof ProfileData, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const messages: Partial<Record<Exclude<ProfilePanel, null>, string>> = {
    personal: "บันทึกข้อมูลส่วนตัวแล้ว",
    basic: "บันทึกข้อมูลพื้นฐานแล้ว",
    health: "บันทึกประวัติสุขภาพแล้ว",
    address: "บันทึกที่อยู่จัดส่งแล้ว",
    email: "บันทึกอีเมลแล้ว",
  };

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`profile-sheet ${panel === "logout" ? "logout-sheet" : ""}`} role="dialog" aria-modal="true" aria-labelledby="profile-sheet-title">
        <div className="sheet-handle" />
        <div className="sheet-heading"><div><p className="eyebrow">PROFILE</p><h2 id="profile-sheet-title">{titles[panel]}</h2></div><button type="button" aria-label="ปิด" onClick={onClose}><X size={18} strokeWidth={2.5} aria-hidden="true" /></button></div>

        <div className="profile-sheet-content">
          {panel === "personal" && <><SheetField label="ชื่อ–นามสกุล"><input value={draft.name} onChange={(event) => update("name", event.target.value)} /></SheetField><SheetField label="เบอร์โทรศัพท์"><input inputMode="tel" value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></SheetField></>}
          {panel === "basic" && <div className="profile-field-grid"><SheetField label="วันเดือนปีเกิด"><input type="date" value={draft.birthDate} onChange={(event) => update("birthDate", event.target.value)} /></SheetField><SheetField label="ส่วนสูง (ซม.)"><input type="number" value={draft.height} onChange={(event) => update("height", event.target.value)} /></SheetField><SheetField label="น้ำหนักตั้งต้น (กก.)" full><input type="number" step="0.1" value={draft.startWeight} onChange={(event) => update("startWeight", event.target.value)} /></SheetField></div>}
          {panel === "health" && <><p className="sheet-description">ข้อมูลนี้ช่วยให้ทีมแพทย์ติดตามความปลอดภัย กรุณาระบุโรคประจำตัว ยาที่ใช้อยู่ และประวัติแพ้ยา</p><SheetField label="รายละเอียด"><textarea rows={6} value={draft.healthHistory} onChange={(event) => update("healthHistory", event.target.value)} /></SheetField></>}
          {panel === "address" && <ShippingAddressEditor onValidity={setAddressValid} value={draft.shippingAddress || { detail: draft.address, province: '', district: '', subdistrict: '', postcode: '' }} onChange={(shippingAddress, address, valid) => { setDraft(previous => ({ ...previous, shippingAddress, address })); setAddressValid(valid); }} />}
          {panel === "email" && <><SheetField label="อีเมล"><input type="email" value={draft.email} onChange={(event) => update("email", event.target.value)} /></SheetField><p className="sheet-description">ระบบจะใช้สำหรับแจ้งนัดและส่งลิงก์สำรองของห้องวิดีโอคอล</p></>}
          {panel === "privacy" && <div className="information-panel"><ShieldCheck size={28} aria-hidden="true" /><h3>การใช้และคุ้มครองข้อมูลสุขภาพ</h3><p>คลินิกใช้ข้อมูลเพื่อสร้างประวัติ นัดหมาย ติดตามการรักษา และติดต่อเกี่ยวกับบริการ โดยจำกัดการเข้าถึงเฉพาะผู้เกี่ยวข้อง</p><p>คุณสามารถขอเข้าถึง แก้ไข หรือลบข้อมูลตามช่องทางของคลินิกได้ เอกสารฉบับนี้เป็นข้อความสำหรับต้นแบบและต้องผ่านการตรวจทานก่อนใช้งานจริง</p></div>}
          {panel === "help" && <div className="help-panel"><details open><summary>เตรียมตัวก่อนใช้ปากกา</summary><p>ตรวจชื่อบนฉลาก วันหมดอายุ ลักษณะยา และทำตามคำสั่งแพทย์ที่ได้รับทุกครั้ง</p></details><details><summary>ควรจัดเก็บอย่างไร</summary><p>เก็บตามเงื่อนไขบนฉลากยา หลีกเลี่ยงความร้อนและแสง และไม่ใช้หากสภาพยาเปลี่ยนไป</p></details><details><summary>มีอาการผิดปกติทำอย่างไร</summary><p>ติดต่อทีมดูแลเพื่อขอคำแนะนำ หากอาการรุนแรงให้งดฉีดและติดต่อแพทย์หรือบริการฉุกเฉินทันที</p></details></div>}
          {panel === "logout" && (
            <div className="logout-confirm">
              <div className="logout-visual"><span><LogOut size={27} strokeWidth={2.3} aria-hidden="true" /></span></div>
              <p className="logout-kicker">SECURE SIGN OUT</p>
              <h3>ออกจากระบบตอนนี้?</h3>
              <p className="logout-lead">คุณจะกลับไปยังหน้าเริ่มต้น และต้องลงทะเบียนอีกครั้งเมื่อต้องการเข้าใช้งาน</p>
              <div className="logout-note"><LockKeyhole size={15} strokeWidth={2.3} aria-hidden="true" /><span>ข้อมูลที่ส่งให้คลินิกแล้วจะไม่ถูกลบ</span></div>
            </div>
          )}
        </div>

        {messages[panel] && <button className="wide-button" type="button" disabled={(panel === "email" && !draft.email.includes("@")) || (panel === "address" && !addressValid)} onClick={() => onSave(draft, messages[panel] ?? "บันทึกแล้ว")}><Save size={17} aria-hidden="true" />บันทึกข้อมูล</button>}
        {panel === "privacy" && <button className="wide-button" type="button" onClick={onClose}>รับทราบและปิด</button>}
        {panel === "help" && <button className="wide-button" type="button" onClick={onClose}>รับทราบและปิด</button>}
        {panel === "logout" && <div className="logout-actions"><button type="button" onClick={onClose}>ยกเลิก</button><button type="button" onClick={onLogout}><LogOut size={16} strokeWidth={2.4} aria-hidden="true" />ออกจากระบบ</button></div>}
      </section>
    </div>
  );
}

function SheetField({ label, full = false, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <label className={`sheet-field ${full ? "full" : ""}`}><span>{label}</span>{children}</label>;
}

const complicationOptions = [
  { id: "none", label: "ไม่มีอาการผิดปกติ" },
  { id: "nausea", label: "คลื่นไส้หรืออาเจียน" },
  { id: "abdominal", label: "ปวดท้องหรือแน่นท้อง" },
  { id: "dizziness", label: "เวียนศีรษะหรืออ่อนเพลีย" },
  { id: "bowel", label: "ท้องผูกหรือท้องเสีย" },
  { id: "allergy", label: "ผื่น บวม หรือหายใจติดขัด" },
  { id: "other", label: "อาการอื่น ๆ" },
];

function VideoCallOverlay({ profile, doctor, date, time, onClose, onToast }: { profile: ProfileData; doctor: Doctor; date: string; time: string; onClose: () => void; onToast: (message: string) => void }) {
  const [stage, setStage] = useState<"checkin" | "prejoin" | "room">("checkin");
  const [currentWeight, setCurrentWeight] = useState(profile.startWeight);
  const [complications, setComplications] = useState<string[]>(["none"]);
  const [symptomNote, setSymptomNote] = useState("");
  const [weightError, setWeightError] = useState("");
  const [complicationError, setComplicationError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [deviceMessage, setDeviceMessage] = useState("คุณสามารถเข้าห้องรอได้แม้ยังไม่เปิดกล้องหรือไมโครโฟน");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatText, setChatText] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(1);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "ทีมดูแล", text: "สวัสดีค่ะ คุณเข้าห้องนัดหมายเรียบร้อยแล้ว หากมีปัญหาเรื่องเสียงหรือภาพ แจ้งเราในแชทนี้ได้เลยค่ะ", time: "14:24", own: false },
  ]);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const hasUrgentSymptom = complications.includes("allergy");

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = streamRef.current;
  }, [cameraOn, stage]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatOpen, chatMessages]);

  function openChat() {
    setChatOpen(true);
    setUnreadMessages(0);
  }

  function sendChatMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatText.trim();
    if (!message) return;
    const sentAt = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    setChatMessages((current) => [...current, { id: Date.now(), sender: "คุณ", text: message, time: sentAt, own: true }]);
    setChatText("");
  }

  function toggleComplication(id: string) {
    setComplicationError("");
    setComplications((current) => {
      if (id === "none") return ["none"];
      const withoutNone = current.filter((value) => value !== "none");
      return withoutNone.includes(id) ? withoutNone.filter((value) => value !== id) : [...withoutNone, id];
    });
  }

  function saveHealthUpdate() {
    const weight = Number(currentWeight);
    const nextWeightError = !currentWeight.trim() || !Number.isFinite(weight) || weight < 30 || weight > 350 ? "กรุณากรอกน้ำหนัก 30–350 กก." : "";
    const nextComplicationError = complications.length === 0 ? "กรุณาเลือกอย่างน้อย 1 รายการ" : complications.includes("other") && !symptomNote.trim() ? "กรุณาระบุอาการอื่นเพิ่มเติม" : "";
    setWeightError(nextWeightError);
    setComplicationError(nextComplicationError);
    if (nextWeightError || nextComplicationError) return;
    setStage("prejoin");
    onToast("บันทึกอัปเดตสุขภาพก่อนพบแพทย์แล้ว");
  }

  async function addDevice(kind: "camera" | "microphone", nextFacing = facingMode) {
    if (!navigator.mediaDevices?.getUserMedia) {
      setDeviceMessage("อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการเปิดกล้องและไมโครโฟน");
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: kind === "camera" ? { facingMode: nextFacing } : false,
        audio: kind === "microphone",
      });
      if (!streamRef.current) streamRef.current = new MediaStream();
      const oldTracks = kind === "camera" ? streamRef.current.getVideoTracks() : streamRef.current.getAudioTracks();
      oldTracks.forEach((track) => { track.stop(); streamRef.current?.removeTrack(track); });
      media.getTracks().forEach((track) => streamRef.current?.addTrack(track));
      if (kind === "camera") setCameraOn(true);
      if (kind === "microphone") setMicOn(true);
      if (videoRef.current) videoRef.current.srcObject = streamRef.current;
      setDeviceMessage("อุปกรณ์พร้อมใช้งาน");
    } catch {
      setDeviceMessage("ยังเปิดอุปกรณ์ไม่ได้ กรุณาอนุญาตกล้องหรือไมโครโฟนในเบราว์เซอร์");
    }
  }

  function disableDevice(kind: "camera" | "microphone") {
    const tracks = kind === "camera" ? streamRef.current?.getVideoTracks() : streamRef.current?.getAudioTracks();
    tracks?.forEach((track) => { track.stop(); streamRef.current?.removeTrack(track); });
    if (kind === "camera") setCameraOn(false);
    if (kind === "microphone") setMicOn(false);
    setDeviceMessage(kind === "camera" ? "ปิดกล้องแล้ว" : "ปิดไมโครโฟนแล้ว");
  }

  async function switchCamera() {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    if (cameraOn) await addDevice("camera", nextFacing);
    else setDeviceMessage(nextFacing === "user" ? "เลือกกล้องหน้าแล้ว" : "เลือกกล้องหลังแล้ว");
  }

  function hangUp() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    onClose();
    onToast("ออกจากห้องวิดีโอคอลแล้ว");
  }

  return (
    <div className="video-call-overlay" role="dialog" aria-modal="true" aria-labelledby="video-call-title">
      {stage === "checkin" ? (
        <section className="precall-checkin">
          <div className="video-heading"><button type="button" aria-label="ปิด" onClick={onClose}><X size={20} aria-hidden="true" /></button><div><p className="eyebrow">HEALTH UPDATE</p><h2 id="video-call-title">อัปเดตก่อนพบแพทย์</h2></div><span /></div>
          <div className="precall-progress"><span>ขั้นตอนที่ 1 จาก 2</span><strong>อัปเดตข้อมูลสุขภาพ</strong></div>
          <div className="appointment-person precall-appointment"><DoctorPhoto doctor={doctor} /><div><small>นัดหมายกับ</small><strong>{doctor.name}</strong><p>{date} สิงหาคม 2569 • {time} น.</p></div></div>

          <section className="precall-baseline" aria-labelledby="baseline-title">
            <div className="precall-section-heading"><span><Weight size={19} strokeWidth={2.3} aria-hidden="true" /></span><div><h3 id="baseline-title">ข้อมูลร่างกายล่าสุด</h3><p>ส่วนสูงเชื่อมจากข้อมูลลงทะเบียนและไม่สามารถแก้ไขที่นี่</p></div></div>
            <div className="precall-metrics">
              <label className={weightError ? "invalid" : ""}><span>น้ำหนักล่าสุด <em>*</em></span><div><input type="number" inputMode="decimal" min="30" max="350" step="0.1" value={currentWeight} onChange={(event) => { setCurrentWeight(event.target.value); setWeightError(""); }} /><small>กก.</small></div>{weightError && <i>{weightError}</i>}</label>
              <div className="locked-metric"><span>ส่วนสูง</span><strong>{profile.height || "–"}<small>ซม.</small></strong><i><LockKeyhole size={12} strokeWidth={2.4} aria-hidden="true" />จากข้อมูลลงทะเบียน</i></div>
            </div>
          </section>

          <section className="precall-allergy" aria-labelledby="allergy-title">
            <div><ShieldCheck size={18} strokeWidth={2.3} aria-hidden="true" /></div><span><small id="allergy-title">ประวัติการแพ้จากข้อมูลลงทะเบียน</small><strong>{profile.allergyHistory}</strong></span><LockKeyhole size={15} strokeWidth={2.3} aria-label="ล็อกข้อมูลแล้ว" />
          </section>

          <section className="precall-symptoms" aria-labelledby="symptoms-title">
            <div className="precall-section-heading"><span><HeartPulse size={19} strokeWidth={2.3} aria-hidden="true" /></span><div><h3 id="symptoms-title">มีอาการผิดปกติหรือภาวะแทรกซ้อนหรือไม่?</h3><p>เลือกได้มากกว่า 1 รายการ เพื่อให้แพทย์เห็นข้อมูลก่อนเริ่มคุย</p></div></div>
            <div className="complication-options" role="group" aria-label="อาการผิดปกติหรือภาวะแทรกซ้อน">
              {complicationOptions.map((option) => {
                const selected = complications.includes(option.id);
                return <button key={option.id} type="button" className={`${selected ? "selected" : ""} ${option.id === "allergy" ? "urgent" : ""}`} aria-pressed={selected} onClick={() => toggleComplication(option.id)}><i>{selected && <Check size={12} strokeWidth={3} aria-hidden="true" />}</i><span>{option.label}</span></button>;
              })}
            </div>
            <label className="symptom-note"><span>{complications.includes("other") ? "ระบุอาการอื่น *" : "รายละเอียดเพิ่มเติม (ถ้ามี)"}</span><textarea rows={3} value={symptomNote} onChange={(event) => { setSymptomNote(event.target.value); setComplicationError(""); }} placeholder="เช่น เริ่มมีอาการเมื่อไร ความรุนแรง และเป็นต่อเนื่องหรือไม่" /></label>
            {complicationError && <p className="precall-error">{complicationError}</p>}
            {hasUrgentSymptom && <div className="precall-urgent"><ShieldCheck size={17} strokeWidth={2.3} aria-hidden="true" /><p><strong>หากกำลังหายใจลำบาก หน้าหรือคอบวม</strong><br />อย่ารอวิดีโอคอล ให้ติดต่อบริการฉุกเฉินทันที</p></div>}
          </section>

          <button className="wide-button" type="button" onClick={saveHealthUpdate}>บันทึกและเตรียมอุปกรณ์ <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" /></button>
          <p className="sheet-note">ข้อมูลอัปเดตนี้จะแสดงให้แพทย์ก่อนเริ่มการปรึกษา</p>
        </section>
      ) : stage === "prejoin" ? (
        <section className="video-prejoin">
          <div className="video-heading"><button type="button" aria-label="ปิด" onClick={onClose}><X size={20} aria-hidden="true" /></button><div><p className="eyebrow">APPOINTMENT ROOM</p><h2 id="video-call-title">เตรียมเข้าห้องวิดีโอคอล</h2></div><button className="video-chat-button" type="button" aria-label={`เปิดแชท${unreadMessages ? ` มี ${unreadMessages} ข้อความใหม่` : ""}`} onClick={openChat}><MessageCircle size={19} aria-hidden="true" />{unreadMessages > 0 && <span>{unreadMessages}</span>}</button></div>
          <div className={`self-preview ${cameraOn ? "camera-on" : ""}`}>
            <video ref={videoRef} autoPlay muted playsInline />
            {!cameraOn && <div><UserRound size={34} aria-hidden="true" /><strong>กล้องปิดอยู่</strong><small>เปิดเมื่อคุณพร้อม</small></div>}
          </div>
          <div className="appointment-person"><DoctorPhoto doctor={doctor} /><div><small>นัดกับ</small><strong>{doctor.name}</strong><p>{date} สิงหาคม 2569 • {time} น.</p></div></div>
          <div className="precall-saved-summary"><span><Check size={14} strokeWidth={3} aria-hidden="true" /></span><div><small>อัปเดตสุขภาพแล้ว</small><strong>น้ำหนัก {currentWeight} กก. • {complications.includes("none") ? "ไม่มีอาการผิดปกติ" : `${complications.length} อาการ`}</strong></div><button type="button" onClick={() => setStage("checkin")}>แก้ไข</button></div>
          <div className="device-controls">
            <button type="button" className={micOn ? "active" : ""} aria-pressed={micOn} onClick={() => micOn ? disableDevice("microphone") : addDevice("microphone")}>{micOn ? <Mic size={19} aria-hidden="true" /> : <MicOff size={19} aria-hidden="true" />}<span>{micOn ? "เปิดไมค์" : "ปิดไมค์"}</span></button>
            <button type="button" className={cameraOn ? "active" : ""} aria-pressed={cameraOn} onClick={() => cameraOn ? disableDevice("camera") : addDevice("camera")}>{cameraOn ? <Camera size={19} aria-hidden="true" /> : <CameraOff size={19} aria-hidden="true" />}<span>{cameraOn ? "เปิดกล้อง" : "ปิดกล้อง"}</span></button>
            <button type="button" onClick={switchCamera}><RefreshCw size={19} aria-hidden="true" /><span>สลับกล้อง</span></button>
          </div>
          <p className="device-message" role="status">{deviceMessage}</p>
          <button className="wide-button" type="button" onClick={() => setStage("room")}><Video size={18} aria-hidden="true" />เข้าสู่ห้องรอ</button>
          <p className="sheet-note">ระบบจะให้แพทย์เข้าร่วมเมื่อถึงเวลานัด</p>
        </section>
      ) : (
        <section className="video-room">
          <div className="room-topbar"><div className="call-status"><span /><div><strong>อยู่ในห้องรอ</strong><small>กำลังรอแพทย์เข้าร่วม</small></div></div><button className="room-chat-button" type="button" aria-label={`เปิดแชท${unreadMessages ? ` มี ${unreadMessages} ข้อความใหม่` : ""}`} onClick={openChat}><MessageCircle size={20} aria-hidden="true" />{unreadMessages > 0 && <span>{unreadMessages}</span>}</button></div>
          <div className="remote-stage"><DoctorPhoto doctor={doctor} className="large" /><h2 id="video-call-title">{doctor.name}</h2><p>ระบบจะแจ้งแพทย์ว่าคุณพร้อมแล้ว</p>{cameraOn && <video className="floating-preview" ref={videoRef} autoPlay muted playsInline />}</div>
          <div className="room-device-message" role="status">{deviceMessage}</div>
          <div className="call-controls">
            <button type="button" className={micOn ? "active" : ""} aria-label={micOn ? "ปิดไมโครโฟน" : "เปิดไมโครโฟน"} onClick={() => micOn ? disableDevice("microphone") : addDevice("microphone")}>{micOn ? <Mic size={21} /> : <MicOff size={21} />}</button>
            <button type="button" className={cameraOn ? "active" : ""} aria-label={cameraOn ? "ปิดกล้อง" : "เปิดกล้อง"} onClick={() => cameraOn ? disableDevice("camera") : addDevice("camera")}>{cameraOn ? <Camera size={21} /> : <CameraOff size={21} />}</button>
            <button type="button" aria-label="สลับกล้อง" onClick={switchCamera}><RefreshCw size={21} /></button>
            <button className="hangup" type="button" aria-label="วางสาย" onClick={hangUp}><PhoneOff size={22} /></button>
          </div>
          <p className="room-caption">หน้าห้องวิดีโอคอลต้นแบบ • การเชื่อมต่อกับแพทย์จริงต้องใช้บริการวิดีโอของคลินิก</p>
        </section>
      )}
      {chatOpen && (
        <div className="video-chat-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setChatOpen(false)}>
          <aside className="video-chat-panel" aria-label="ห้องแชทนัดหมาย">
            <div className="video-chat-handle" aria-hidden="true" />
            <header className="video-chat-header">
              <div className="video-chat-person"><DoctorPhoto doctor={doctor} /><span><strong>ห้องแชทนัดหมาย</strong><small><i aria-hidden="true" />ทีมดูแลพร้อมช่วยเหลือ</small></span></div>
              <button type="button" aria-label="ปิดห้องแชท" onClick={() => setChatOpen(false)}><X size={18} strokeWidth={2.5} aria-hidden="true" /></button>
            </header>
            <div className="video-chat-date"><span>วันนี้ • นัดหมาย {time} น.</span></div>
            <div className="video-chat-messages" aria-live="polite">
              <div className="chat-system-message"><ShieldCheck size={14} aria-hidden="true" />ข้อความในห้องนี้ใช้สำหรับการนัดหมายและการดูแลของคลินิก</div>
              {chatMessages.map((message) => (
                <div className={`chat-message ${message.own ? "own" : "staff"}`} key={message.id}>
                  {!message.own && <small>{message.sender}</small>}
                  <p>{message.text}</p>
                  <time>{message.time} น.</time>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form className="video-chat-composer" onSubmit={sendChatMessage}>
              <input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="พิมพ์ข้อความ..." aria-label="พิมพ์ข้อความแชท" />
              <button type="submit" disabled={!chatText.trim()} aria-label="ส่งข้อความ"><Send size={18} strokeWidth={2.4} aria-hidden="true" /></button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
