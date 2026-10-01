'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, RefreshCw, Video, Check, Clock, MessageCircle, X } from 'lucide-react';
import TelemedChat, { type ChatRequest } from './TelemedChat';
import UiSkeleton from '../ui-skeleton';
import { useChatUnread } from './use-chat-unread';

type Booking = { id: string; chatEnabled?: boolean; state: string; doctorName: string; courseName: string; date: string; time: string; price: number; saleOrderId: string; meetingUrl: string | null };
const labels: Record<string, string> = { PENDING_PAYMENT: 'รอตรวจสอบการชำระเงิน', PENDING_MEETING: 'รอลิงก์ Meeting', CONFIRMED: 'นัดหมายเรียบร้อย', CANCELLED: 'ยกเลิกแล้ว' };
const steps = ['ตรวจสอบการชำระเงิน', 'รอลิงก์ประชุม', 'ยืนยันนัดหมาย'];
const descriptions: Record<string, string> = {
  PENDING_PAYMENT: 'ส่งคำขอนัดหมายแล้ว เจ้าหน้าที่กำลังรอตรวจสอบหลักฐานการชำระเงิน',
  PENDING_MEETING: 'ตรวจสอบการชำระเงินแล้ว รอเจ้าหน้าที่ส่งลิงก์ประชุม',
  CONFIRMED: 'ยืนยันนัดหมายแล้ว เข้าร่วมประชุมได้ตามเวลานัด',
};
export default function TelemedAppointments({ refreshKey, onBook, compact = false }: { refreshKey: number; onBook: () => void; compact?: boolean }) {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [chat, setChat] = useState<Booking | null>(null);
  const [chatPicker, setChatPicker] = useState(false);
  const unread = useChatUnread(items.filter(item => item.chatEnabled && item.state !== 'CANCELLED').map(item => item.id));
  const unreadTotal = Object.values(unread).reduce((sum, count) => sum + count, 0);
  const picker = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (chatPicker) picker.current?.showModal();
  }, [chatPicker]);
  function closeChat() {
    setChat(null); setChatPicker(false);
    requestAnimationFrame(() => launcher.current?.focus());
  }
  function openChat() {
    const available = items.filter(item => item.chatEnabled && item.state !== 'CANCELLED');
    if (!loading && !error && available.length === 1) setChat(available[0]);
    else setChatPicker(true);
  }
  const chatRequest: ChatRequest = useCallback(async <T,>(path: string, body?: object, signal?: AbortSignal): Promise<T> => {
    if (!chat) throw new Error('กรุณาเลือกนัดหมาย');
    const response = await fetch(`/api/telemed/bookings/${encodeURIComponent(chat.id)}/chat${path}`, {
      method: body === undefined ? 'GET' : 'POST', cache: 'no-store', signal,
      headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'เชื่อมต่อแชทไม่สำเร็จ');
    return result;
  }, [chat]);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function refresh() {
      if (pending || document.visibilityState === 'hidden') return;
      pending = true;
      try {
        const response = await fetch('/api/telemed/bookings', { cache: 'no-store', signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setItems(result); setError('');
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'โหลดนัดหมายไม่สำเร็จ'); }
      finally { pending = false; if (!controller.signal.aborted) setLoading(false); }
    }
    void refresh();
    const interval = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [refreshKey, attempt]);
  const visibleItems = compact ? items.filter(item => item.state !== 'CANCELLED')
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)) : items;
  return <section className={compact ? 'booking-summary' : 'tab-page'}>
    {!compact && <h2>นัดหมายของคุณ</h2>}
    {loading && !error && <UiSkeleton rows={compact ? 1 : 3} label="กำลังโหลดนัดหมาย" />}
    {error && <div role="alert"><p>{error}</p><button type="button" className="wide-button soft" onClick={() => setAttempt(x => x + 1)}><RefreshCw size={18} />ลองใหม่</button></div>}
    {!loading && !error && !visibleItems.length && <p>ยังไม่มีนัดหมายที่กำลังดำเนินการ</p>}
    {!error && visibleItems.map(item => <article className="booking-process-card" key={item.id}>
      <p className="booking-process-status" role="status"><Clock size={16} aria-hidden="true" />{labels[item.state] ?? 'กำลังอัปเดตสถานะ'}</p><h3>{item.courseName}</h3><p>{item.doctorName}</p>
      <p>{new Date(`${item.date}T00:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })} · {item.time} น.</p>
      <p>{item.price.toLocaleString('th-TH')} บาท · {item.saleOrderId}</p>
      {descriptions[item.state] && <>
        <ol className="booking-process-steps" aria-label="ขั้นตอนนัดหมาย">
          {steps.map((step, index) => {
            const current = ['PENDING_PAYMENT', 'PENDING_MEETING', 'CONFIRMED'].indexOf(item.state);
            const complete = index < current || item.state === 'CONFIRMED';
            return <li key={step} className={complete ? 'complete' : index === current ? 'current' : ''} aria-current={index === current ? 'step' : undefined}>
              <span>{complete ? <Check size={16} aria-hidden="true" /> : index + 1}</span><small>{step}</small>
            </li>;
          })}
        </ol>
        <p className="booking-process-description">{descriptions[item.state]}</p>
      </>}
      {item.state === 'CONFIRMED' && item.meetingUrl && <a className="wide-button" href={item.meetingUrl} target="_blank" rel="noopener noreferrer"><Video size={18} />เข้าร่วม Meeting</a>}
    </article>)}
    <button type="button" className="wide-button" onClick={onBook}><CalendarDays size={18} />นัดหมายแพทย์</button>
    <button ref={launcher} type="button" className="telemed-chat-launcher" title="แชทกับเจ้าหน้าที่" aria-label={unreadTotal ? `แชทกับเจ้าหน้าที่ มี ${unreadTotal} ข้อความที่ยังไม่อ่าน` : 'แชทกับเจ้าหน้าที่'} aria-haspopup="dialog" aria-expanded={!!chat || chatPicker} onClick={openChat}><MessageCircle size={26} aria-hidden="true" />{unreadTotal > 0 && <span className="telemed-chat-unread" aria-live="polite">{unreadTotal > 99 ? '99+' : unreadTotal}</span>}</button>
    {chatPicker && <dialog ref={picker} className="telemed-chat telemed-chat-docked telemed-chat-picker" aria-labelledby="chat-picker-title" onCancel={event => { event.preventDefault(); closeChat(); }}>
      <header className="telemed-chat-header"><h2 id="chat-picker-title">แชทกับเจ้าหน้าที่</h2><button type="button" aria-label="ปิดแชท" title="ปิดแชท" onClick={closeChat}><X size={20} /></button></header>
      <div className="telemed-chat-log">
        {loading ? <p role="status">กำลังโหลดนัดหมาย...</p> : error ? <p role="alert">{error}</p> : <>
          {!items.some(item => item.state !== 'CANCELLED') && <p>ยังไม่มีนัดหมายสำหรับติดต่อเจ้าหน้าที่</p>}
          {items.filter(item => item.state !== 'CANCELLED').map(item => <button className="telemed-chat-booking" type="button" key={item.id} disabled={!item.chatEnabled} onClick={() => { setChatPicker(false); setChat(item); }}>
            <strong>{item.courseName}</strong><span>{item.date} · {item.time} น.</span><span>{item.chatEnabled ? 'แชทกับเจ้าหน้าที่' : 'แชทยังไม่พร้อมใช้งาน'}</span>
            {!!unread[item.id] && <span>ยังไม่อ่าน {unread[item.id]} ข้อความ</span>}
          </button>)}
        </>}
      </div>
    </dialog>}
    {chat && <TelemedChat key={chat.id} bookingId={chat.id} docked title={`${chat.courseName} · ${chat.date}`} ownKind="CUSTOMER" request={chatRequest} onClose={closeChat} />}
  </section>;
}
