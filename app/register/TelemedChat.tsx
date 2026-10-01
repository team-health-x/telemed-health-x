'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { X as CloseIcon, RefreshCw as RefreshIcon, Paperclip as AttachIcon, Send as SendIcon, Download as DownloadIcon } from 'lucide-react'
import './telemed-chat.css'

export type ChatRequest = <T>(path: string, body?: object, signal?: AbortSignal) => Promise<T>
type Message = { id: string; sequence: number; sender_kind: string; text: string; file_name: string | null; file_mime: string | null; created_at: string; payment_id?: string | null }
type Page = { items: Message[]; nextBefore: number | null }
type Attachment = { name: string; mime: string; data: string }
const errorText = (error: unknown) => error instanceof Error ? error.message : 'เชื่อมต่อไม่สำเร็จ'
function merge(previous: Message[], incoming: Message[]) {
  return Array.from(new Map([...previous, ...incoming].map(item => [item.id, item])).values()).sort((a, b) => a.sequence - b.sequence)
}
export default function TelemedChat({ title, ownKind, request, onClose, docked = false, bookingId }: { title: string; ownKind: 'CUSTOMER' | 'STAFF'; request: ChatRequest; onClose: () => void; docked?: boolean; bookingId?: string }) {
  const modal = useRef<HTMLDialogElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const alive = useRef(true)
  const started = useRef(false)
  const newest = useRef(0)
  const readSequence = useRef(0)
  const scrollBottom = useRef(true)
  const retry = useRef<{ payload: string; key: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [before, setBefore] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [file, setFile] = useState<Attachment | null>(null)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [olderBusy, setOlderBusy] = useState(false)
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const page = await request<Page>('', undefined, signal)
      if (!alive.current || signal?.aborted) return
      const missedWindow = started.current && page.nextBefore !== null && page.items[0]?.sequence > newest.current
      setMessages(old => missedWindow ? page.items : merge(old, page.items))
      if (!started.current || missedWindow) { setBefore(page.nextBefore); started.current = true }
      setLoadError('')
      const last = page.items.at(-1)?.sequence || 0
      newest.current = Math.max(newest.current, last)
      if (last > readSequence.current && document.visibilityState !== 'hidden') {
        await request('/read', { sequence: last }, signal)
        if (alive.current && !signal?.aborted) readSequence.current = last
      }
    } catch (e) { if (alive.current && !signal?.aborted) setLoadError(errorText(e)) }
    finally { if (alive.current && !signal?.aborted) setLoading(false) }
  }, [request])
  useEffect(() => {
    alive.current = true
    modal.current?.showModal()
    const controller = new AbortController()
    let pending = false
    const poll = async () => {
      if (pending || document.visibilityState === 'hidden') return
      pending = true
      await refresh(controller.signal)
      pending = false
    }
    void poll()
    const timer = setInterval(poll, 5000)
    const update = (event: Event) => { if ((event as CustomEvent).detail?.bookingId === bookingId) void poll() }
    window.addEventListener('telemed-chat-update', update)
    window.addEventListener('focus', poll)
    document.addEventListener('visibilitychange', poll)
    return () => { alive.current = false; controller.abort(); clearInterval(timer); window.removeEventListener('focus', poll); window.removeEventListener('telemed-chat-update', update); document.removeEventListener('visibilitychange', poll) }
  }, [refresh, bookingId])
  useEffect(() => {
    if (scrollBottom.current && log.current) log.current.scrollTop = log.current.scrollHeight
  }, [messages])
  async function older() {
    if (!before || olderBusy) return
    setOlderBusy(true)
    const height = log.current?.scrollHeight || 0
    scrollBottom.current = false
    try {
      const page = await request<Page>(`?before=${before}`)
      if (!alive.current) return
      setMessages(old => merge(old, page.items)); setBefore(page.nextBefore)
      requestAnimationFrame(() => { if (log.current) log.current.scrollTop += log.current.scrollHeight - height })
    } catch (e) { if (alive.current) setError(errorText(e)) }
    finally { if (alive.current) setOlderBusy(false) }
  }
  async function attach(selected?: File) {
    if (!selected || busy) return
    setError('')
    if (!['application/pdf', 'image/png', 'image/jpeg'].includes(selected.type) || selected.size > 5 * 1024 * 1024 || selected.name.length > 160) {
      setError('แนบ PDF, PNG หรือ JPG ขนาดไม่เกิน 5 MB'); return
    }
    setBusy(true)
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(',')[1])
        reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
        reader.readAsDataURL(selected)
      })
      if (alive.current) setFile({ name: selected.name, mime: selected.type, data })
    } catch (e) { if (alive.current) setError(errorText(e)) }
    finally { if (alive.current) setBusy(false) }
  }
  async function send() {
    if (busy || (!text.trim() && !file)) return
    setBusy(true); setError('')
    const payload = JSON.stringify({ text: text.trim(), ...(file ? { file } : {}) })
    if (retry.current?.payload !== payload) retry.current = { payload, key: crypto.randomUUID() }
    try {
      await request('', { ...JSON.parse(payload), requestKey: retry.current.key })
      if (!alive.current) return
      setText(''); setFile(null); retry.current = null
      scrollBottom.current = true
      await refresh()
    } catch (e) { if (alive.current) setError(errorText(e)) }
    finally { if (alive.current) setBusy(false) }
  }
  async function download(id: string) {
    setError('')
    try {
      const result = await request<{ data: string; mime: string; name: string }>(`/${id}/file`)
      if (!alive.current) return
      const bytes = Uint8Array.from(atob(result.data), c => c.charCodeAt(0))
      const url = URL.createObjectURL(new Blob([bytes], { type: result.mime }))
      const link = document.createElement('a')
      link.href = url; link.download = result.name; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (e) { if (alive.current) setError(errorText(e)) }
  }
  return <dialog ref={modal} className={`telemed-chat${docked ? ' telemed-chat-docked' : ''}`} aria-labelledby="telemed-chat-title" onCancel={onClose}>
    <header className="telemed-chat-header"><div><h2 id="telemed-chat-title">แชท Telemed</h2><p>{title}</p></div>
      <button type="button" aria-label="ปิดแชท" title="ปิดแชท" onClick={onClose}><CloseIcon /></button></header>
    {loadError && <div role="alert" className="telemed-chat-error">{loadError}<button type="button" aria-label="ลองใหม่" title="ลองใหม่" onClick={() => refresh()}><RefreshIcon /></button></div>}
    <div className="telemed-chat-log" ref={log} role="log" aria-label="ประวัติแชท" aria-live="polite"
      onScroll={() => { const el = log.current; if (el) scrollBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80 }}>
      {before && <button type="button" className="telemed-chat-older" disabled={olderBusy} onClick={older}>{olderBusy ? 'กำลังโหลด...' : 'ข้อความก่อนหน้า'}</button>}
      {loading ? <p role="status">กำลังโหลดข้อความ...</p> : !messages.length && !loadError ? <p className="telemed-chat-empty">ยังไม่มีข้อความ</p> : null}
      {messages.map(item => <article key={item.id} className={`telemed-chat-message ${item.sender_kind === ownKind ? 'own' : ''}`}>
        <small>{item.sender_kind === 'CUSTOMER' ? 'ลูกค้า' : 'เจ้าหน้าที่'}</small>
        {item.text && <p>{item.text}</p>}
        {item.payment_id && <a className="telemed-chat-payment" href={`/payment/${encodeURIComponent(item.payment_id)}`}>ดูรายการและชำระเงิน</a>}
        {item.file_name && <button type="button" className="telemed-chat-download" onClick={() => download(item.id)} title="ดาวน์โหลดเอกสาร"><DownloadIcon /><span>{item.file_name}</span></button>}
        <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
      </article>)}
    </div>
    <form className="telemed-chat-compose" onSubmit={e => { e.preventDefault(); void send() }}>
      {error && <p role="alert" className="telemed-chat-error">{error}</p>}
      {file && <div className="telemed-chat-file"><span>{file.name}</span><button type="button" title="ลบไฟล์แนบ" aria-label="ลบไฟล์แนบ" disabled={busy} onClick={() => setFile(null)}><CloseIcon /></button></div>}
      <textarea aria-label="ข้อความ" placeholder="พิมพ์ข้อความ..." rows={2} maxLength={4000} value={text} disabled={busy} onChange={e => setText(e.target.value)} />
      <div className="telemed-chat-tools">
        <input hidden type="file" ref={input} disabled={busy} accept=".pdf,.png,.jpg,.jpeg" onChange={e => { void attach(e.target.files?.[0]); e.target.value = '' }} />
        <button type="button" disabled={busy} aria-label="แนบเอกสาร" title="แนบ PDF / รูปภาพ" onClick={() => input.current?.click()}><AttachIcon /></button>
        <small>{text.length}/4000</small>
        <button type="submit" className="telemed-chat-send" disabled={busy || (!text.trim() && !file)} aria-label="ส่งข้อความ" title="ส่งข้อความ"><SendIcon /><span>{busy ? 'กำลังส่ง...' : 'ส่ง'}</span></button>
      </div>
    </form>
  </dialog>
}
