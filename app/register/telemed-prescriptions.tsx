'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, FileText, RefreshCw } from 'lucide-react';
import './telemed-prescriptions.css';

type Prescription = {
  id: string; issuedAt: string | null; opdId: string; doctorName: string | null;
  items: { id: string; name: string; quantity: number; unit: string; instructions: string | null }[];
  payment: { status: string; balance: number; url: string | null } | null;
};
const money = (value: number) => value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric' }) : 'ไม่ระบุวันที่';

function displayReference(row: Prescription) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id)) return row.id;
  const issued = row.issuedAt ? new Date(row.issuedAt) : null;
  const parts = issued && Number.isFinite(issued.getTime())
    ? new Intl.DateTimeFormat('en-US-u-ca-buddhist', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(issued)
    : [];
  const stamp = ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value || '').join('');
  return ['RX', stamp, row.id.slice(0, 8).toUpperCase()].filter(Boolean).join('-');
}

export default function TelemedPrescriptions() {
  const [rows, setRows] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setRows([]);
    fetch('/api/telemed/prescriptions', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !Array.isArray(result)) throw new Error(result.error || 'โหลดใบสั่งยาไม่สำเร็จ');
        if (!controller.signal.aborted) setRows(result);
      }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  return <section className="tab-page rx-page">
    <div className="rx-heading"><h2>ใบสั่งยาของฉัน</h2><button type="button" title="โหลดใบสั่งยาใหม่" aria-label="โหลดใบสั่งยาใหม่" disabled={loading} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={20} /></button></div>
    {loading && <p role="status">กำลังโหลดใบสั่งยา...</p>}
    {error && <div role="alert"><p>{error}</p><button className="wide-button soft" onClick={() => setRefresh(value => value + 1)}>ลองใหม่</button></div>}
    {!loading && !error && rows.length === 0 && <div className="rx-empty" role="status"><FileText size={56} strokeWidth={1.5} aria-hidden="true" /><h2>ยังไม่มีใบสั่งยา</h2></div>}
    {!loading && !error && rows.map((row, index) => <article className="rx-record" key={row.id}>
      <header><FileText size={24} aria-hidden="true" /><div><small>{index === 0 ? 'ใบสั่งยาล่าสุด' : 'ประวัติใบสั่งยา'}</small><h3 title={row.id}>{displayReference(row)}</h3><p>{date(row.issuedAt)}</p></div><span className="rx-status">บันทึกแล้ว</span></header>
      <dl className="rx-meta"><div><dt>แพทย์ผู้ตรวจ</dt><dd>{row.doctorName || 'ไม่ระบุ'}</dd></div><div><dt>OPD</dt><dd>{row.opdId}</dd></div></dl>
      <ul className="rx-items">{row.items.map(item => <li key={item.id}><strong>{item.name}</strong><span>{item.quantity} {item.unit}</span></li>)}</ul>
      <button type="button" className="rx-details" aria-expanded={expanded === row.id} onClick={() => setExpanded(expanded === row.id ? null : row.id)}>รายละเอียดและวิธีใช้ {expanded === row.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
      {expanded === row.id && <div className="rx-instructions">{row.items.map(item => <section key={item.id}><h4>{item.name}</h4><p>{item.instructions?.trim() || 'ยังไม่ได้ระบุวิธีใช้ กรุณาติดต่อคลินิกก่อนใช้ยา'}</p></section>)}</div>}
      <footer><span>การชำระเงิน</span><strong>{!row.payment ? 'ยังไม่มีใบขาย' : row.payment.balance === 0 ? 'ไม่มียอดค้างชำระ' : `ค้างชำระ ${money(row.payment.balance)} บาท`}</strong></footer>
      {row.payment?.url && row.payment.balance > 0 && <a className="wide-button" href={row.payment.url}>ดูรายการชำระเงิน</a>}
    </article>)}
  </section>;
}
