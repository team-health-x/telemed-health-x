# Program Resize — Telemed Health X

เว็บรวม Landing Page, ลงทะเบียนแบบ Responsive และแอปผู้รับบริการ (นัดหมาย ใบสั่งยา ประวัติ และโปรไฟล์)

ดูวิธีใช้งานและขอบเขตต้นแบบใน [README-TH.md](README-TH.md) คู่มือผู้ใช้และ SOP อยู่ใน [docs/](docs/)

หน้าแรก: `/` · ลงทะเบียนและแอปผู้รับบริการ: `/register`

## Tech stack

- React 19 + Vinext (Next.js-compatible App Router)
- TypeScript
- Cloudflare Worker runtime
- OpenAI Sites สำหรับ hosting เมื่อพร้อมเผยแพร่

## เริ่มต้นพัฒนา

ต้องใช้ Node.js `>=22.13.0` และ pnpm

```bash
pnpm install
pnpm dev
```

เปิด [http://localhost:3000](http://localhost:3000) เพื่อดูหน้าเว็บในเครื่อง หน้าเว็บเปิดได้โดยไม่ต้องเข้าสู่ระบบ

ตรวจคุณภาพก่อนส่งให้ทีมพัฒนา:

```bash
pnpm lint
pnpm test
```

## ปุ่มลงทะเบียน

หน้าเว็บแสดงปุ่มลงทะเบียนโดยไม่มีช่องกรอกข้อมูล ระบบสร้างบัญชี รหัสผ่าน หรือ OTP ทีมพัฒนาสามารถเชื่อมปุ่มกับ URL หรือขั้นตอนลงทะเบียนจริงได้ภายหลัง

## โครงสร้างโปรเจกต์

- `app/`: หน้าเว็บ styles และ components
- `public/`: โลโก้ ภาพประกอบ และ social preview
- `tests/`: smoke test สำหรับหน้า server-rendered
- `worker/`: Cloudflare Worker entry point
- `.openai/hosting.json`: Sites project configuration; ไม่มีข้อมูลลับ

เว็บไซต์นี้ทำงานแบบสาธารณะโดยไม่ต้องล็อคอิน การเผยแพร่เป็นขั้นตอนแยกต่างหากและไม่เกิดขึ้นจากการรันในเครื่อง
