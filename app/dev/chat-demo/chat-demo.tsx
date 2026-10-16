'use client';
import { useCallback, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import TelemedChat, { type ChatRequest } from '../../register/TelemedChat';

type Attachment = { name: string; mime: string; data: string };
type Message = { id: string; sequence: number; sender_kind: string; text: string; created_at: string; file_name: string | null; file_mime: string | null; file?: Attachment };

export default function ChatDemo() {
  const [open, setOpen] = useState(true);
  const messages = useRef<Message[]>([]);
  const keys = useRef(new Set<string>());
  const request: ChatRequest = useCallback(async <T,>(path: string, body?: object): Promise<T> => {
    const append = (sender: string, text: string, file?: Attachment) => {
      const sequence = messages.current.length + 1;
      messages.current.push({ id: `demo-${sequence}`, sequence, sender_kind: sender, text,
        created_at: new Date().toISOString(), file_name: file?.name ?? null, file_mime: file?.mime ?? null, file });
    };
    if (!messages.current.length) append('STAFF', 'สวัสดีค่ะ คุณ TL-00011 นี่คือข้อความจำลองจากเจ้าหน้าที่ค่ะ');
    if (path === '/read') return { ok: true } as T;
    if (path.endsWith('/file')) {
      const message = messages.current.find(item => `/${item.id}/file` === path);
      if (!message?.file) throw new Error('ไม่พบไฟล์จำลอง');
      return message.file as T;
    }
    if (body) {
      const input = body as { text: string; requestKey: string; file?: Attachment };
      if (!keys.current.has(input.requestKey)) {
        keys.current.add(input.requestKey);
        append('CUSTOMER', input.text, input.file);
        append('STAFF', input.file ? 'ได้รับไฟล์ในหน้าจำลองแล้วค่ะ ยังไม่ได้ส่งให้เจ้าหน้าที่จริง' : 'ได้รับข้อความในหน้าจำลองแล้วค่ะ ต้องการสอบถามเรื่องนัดหมายหรือเอกสารคะ?');
      }
      return { id: messages.current.at(-1)?.id } as T;
    }
    return { items: [...messages.current], nextBefore: null } as T;
  }, []);
  return <main style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
    <h1 style={{ fontSize: 24 }}>รหัสลูกค้า · TL-00011</h1>
    <p role="status">โหมดจำลอง ไม่ส่งข้อความจริง ไม่บันทึกฐานข้อมูล และไม่แจ้ง Telegram</p>
    <button className="telemed-chat-launcher" type="button" title="เปิดแชทจำลอง" aria-label="เปิดแชทจำลอง" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><MessageCircle size={26} /></button>
    {open && <TelemedChat docked title="TL-00011 · แชทจำลอง" ownKind="CUSTOMER" request={request} onClose={() => setOpen(false)} />}
  </main>;
}
