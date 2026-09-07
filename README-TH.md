# Program Resize — เว็บรวม

โปรเจกต์เดียวรวม Landing Page, ลงทะเบียน 5 ขั้นตอน และแอปผู้รับบริการ (นัดหมาย ชำระเงิน ใบสั่งยา ประวัติ โปรไฟล์ และหน้าวิดีโอคอล)

## เปิดใช้งานในเครื่อง

ใช้ Node.js >= 22.13.0 และ pnpm:

```sh
pnpm install --frozen-lockfile
pnpm dev --port 3000
```

- `http://localhost:3000/` — หน้าแนะนำโปรแกรม
- `http://localhost:3000/register` — ลงทะเบียน และเข้าสู่แอปเมื่อทำขั้นตอนครบ
- กด “กลับหน้า Program Resize” เพื่อกลับหน้าแนะนำโปรแกรม

ข้อมูลในแอปยังเป็น state ของต้นแบบ เมื่อรีเฟรชหรือออกจากหน้าลงทะเบียนจะเริ่มใหม่ ยังไม่ได้เชื่อม backend, OTP จริง, ระบบชำระเงิน หรือบริการวิดีโอคอลจริง รหัส OTP ทดสอบคือ `123456`

## ที่มาของโค้ด

- หน้าแรกและ dependency lockfile ใช้ชุด `landing page/Program-Resize-Dev-Handoff/source`
- แอปใช้ชุด `ลงทะเบียน/Program_Resize_Telemedicine_v9_Dev_2026-09-03/source`
- โค้ดหน้าจอในชุด `เอกสาร/Telemed_Developer_Handoff_2026-09-02` ตรงกับแอปลงทะเบียน จึงใช้แอปเพียงชุดเดียว
- คู่มือผู้ใช้และ SOP อยู่ใน `docs/`
- CSS ของแต่ละส่วนถูกจำกัดขอบเขตไว้ใต้ `.landing-site` และ `.telemed-site` เพื่อรักษาสี ฟอนต์ และหน้าตาของแต่ละส่วน

## Vercel

รองรับ Next.js บน Vercel โดย `vercel.json` กำหนด build เป็น `pnpm build:vercel` ไว้แล้ว ใช้ root directory ของ repository (`./`) และติดตั้งด้วย `pnpm install --frozen-lockfile`

ทดสอบ runtime เดียวกับ Vercel ในเครื่อง:

```sh
pnpm build:vercel
pnpm start:vercel
```

สามารถตั้ง `NEXT_PUBLIC_SITE_URL` เป็นโดเมนจริงเพื่อใช้ใน metadata ได้ หากไม่กำหนดจะใช้โดเมน production จาก Vercel

โค้ด Cloudflare D1 ใน `db/` และตัวอย่างใน `examples/` ไม่ได้เชื่อมเข้าหน้าเว็บ และไม่ใช่ backend สำหรับ Vercel

## ตรวจสอบต้นแบบ Cloudflare

```sh
pnpm test
pnpm lint
```

`pnpm test` สร้าง production build และตรวจเส้นทางหลักจาก HTML ที่ server render; ไม่ใช่การยืนยันว่า backend ใช้งานจริง
