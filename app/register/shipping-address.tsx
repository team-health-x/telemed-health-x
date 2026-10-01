'use client';
import { useEffect, useState } from 'react';
import './shipping-address.css';

export type ShippingAddress = { detail: string; province: string; district: string; subdistrict: string; postcode: string };
type Area = { id: string; province_id: string; province_TH: string; district_id: string; district_TH: string; sub_district_id: string; sub_district_TH: string; postcode: string };
const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'th'));

export default function ShippingAddressEditor({ value, onChange, onValidity }: { value: ShippingAddress; onChange: (value: ShippingAddress, formatted: string, valid: boolean) => void; onValidity: (valid: boolean) => void }) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    fetch('/data/thai-addresses.json', { signal: controller.signal }).then(async r => {
      const data = await r.json();
      if (!r.ok || !Array.isArray(data)) throw new Error('โหลดข้อมูลที่อยู่ไม่สำเร็จ');
      if (!controller.signal.aborted) setAreas(data);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    onValidity(!loading && !error && !!value.detail.trim() && areas.some(a => a.province_id === value.province && a.district_id === value.district && a.sub_district_id === value.subdistrict && a.postcode === value.postcode));
  }, [areas, loading, error, value.detail, value.province, value.district, value.subdistrict, value.postcode, onValidity]);
  function update(next: ShippingAddress) {
    const match = areas.find(a => a.province_id === next.province && a.district_id === next.district && a.sub_district_id === next.subdistrict && a.postcode === next.postcode);
    const formatted = match ? `${next.detail.trim()} ${match.province_TH === 'กรุงเทพมหานคร' ? 'แขวง' : 'ตำบล'}${match.sub_district_TH} ${match.province_TH === 'กรุงเทพมหานคร' ? 'เขต' : 'อำเภอ'}${match.district_TH} ${match.province_TH} ${match.postcode}` : next.detail;
    onChange(next, formatted, !!match && !!next.detail.trim());
  }
  const provinces = unique(areas.map(a => a.province_id));
  const districts = unique(areas.filter(a => a.province_id === value.province).map(a => a.district_id));
  const subdistricts = unique(areas.filter(a => a.province_id === value.province && a.district_id === value.district).map(a => a.sub_district_id));
  const postalMatches = /^\d{5}$/.test(value.postcode) ? areas.filter(a => a.postcode === value.postcode) : [];
  function selectArea(area: Area) { update({ ...value, province: area.province_id, district: area.district_id, subdistrict: area.sub_district_id, postcode: area.postcode }); }
  function postalChanged(postcode: string) {
    const matches = areas.filter(a => a.postcode === postcode);
    const selected = matches.find(a => a.province_id === value.province && a.district_id === value.district && a.sub_district_id === value.subdistrict);
    if (selected) { update({ ...value, postcode }); return; }
    const province = unique(matches.map(a => a.province_id));
    const district = unique(matches.map(a => a.district_id));
    const subdistrict = unique(matches.map(a => a.sub_district_id));
    update({ ...value, postcode, province: province.length === 1 ? province[0] : '', district: district.length === 1 ? district[0] : '', subdistrict: subdistrict.length === 1 ? subdistrict[0] : '' });
  }
  return <div className="profile-field-grid shipping-address-fields">
    <label className="sheet-field full">บ้านเลขที่ อาคาร หมู่ ซอย ถนน<textarea rows={3} value={value.detail} onChange={e => update({ ...value, detail: e.target.value })} /></label>
    {loading && <p role="status">กำลังโหลดข้อมูลที่อยู่...</p>}
    {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt(a => a + 1)}>ลองใหม่</button></div>}
    <label className="sheet-field">รหัสไปรษณีย์<input inputMode="numeric" autoComplete="postal-code" maxLength={5} disabled={loading || !!error} value={value.postcode} onChange={e => postalChanged(e.target.value.replace(/\D/g, ''))} /></label>
    {value.postcode.length === 5 && !loading && !error && !postalMatches.length && <p role="alert">ไม่พบรหัสไปรษณีย์นี้</p>}
    {postalMatches.length > 1 && !value.subdistrict && <label className="sheet-field full">พื้นที่ของรหัสไปรษณีย์<select aria-label="พื้นที่ของรหัสไปรษณีย์" value="" onChange={e => { const area = areas.find(a => a.id === e.target.value); if (area) selectArea(area); }}><option value="">เลือกพื้นที่</option>{postalMatches.map(a => <option key={a.id} value={a.id}>{a.sub_district_TH} · {a.district_TH} · {a.province_TH}</option>)}</select></label>}
    <label className="sheet-field">จังหวัด<select aria-label="จังหวัด" disabled={loading || !!error} value={value.province} onChange={e => update({ ...value, province: e.target.value, district: '', subdistrict: '', postcode: '' })}><option value="">เลือกจังหวัด</option>{provinces.map(id => <option key={id} value={id}>{areas.find(a => a.province_id === id)?.province_TH}</option>)}</select></label>
    <label className="sheet-field">อำเภอ/เขต<select aria-label="อำเภอ/เขต" disabled={!value.province || loading || !!error} value={value.district} onChange={e => update({ ...value, district: e.target.value, subdistrict: '', postcode: '' })}><option value="">เลือกอำเภอ/เขต</option>{districts.map(id => <option key={id} value={id}>{areas.find(a => a.district_id === id)?.district_TH}</option>)}</select></label>
    <label className="sheet-field">ตำบล/แขวง<select aria-label="ตำบล/แขวง" disabled={!value.district || loading || !!error} value={value.subdistrict} onChange={e => { const matches = areas.filter(a => a.province_id === value.province && a.district_id === value.district && a.sub_district_id === e.target.value); const codes = unique(matches.map(a => a.postcode)); update({ ...value, subdistrict: e.target.value, postcode: codes.length === 1 ? codes[0] : '' }); }}><option value="">เลือกตำบล/แขวง</option>{subdistricts.map(id => <option key={id} value={id}>{areas.find(a => a.sub_district_id === id)?.sub_district_TH}</option>)}</select></label>
  </div>;
}
