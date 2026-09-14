# CI/CD ของ Telemed บน Azure

## Pipeline ทำอะไร

ไฟล์ `.github/workflows/telemed-azure.yml` ใช้กับ repo
`team-health-x/telemed-health-x` และ branch `main`

| เหตุการณ์ | สิ่งที่ทำ |
| --- | --- |
| เปิด/อัปเดต PR เข้า main | รัน test, build Docker และทดสอบหน้าเว็บ/ไฟล์ static/การปิด mock OTP |
| Push เข้า main | ตรวจเหมือน PR แล้ว publish image ที่ทดสอบแล้วเข้า ACR |
| Run workflow บน main, deploy ไม่ถูกเลือก | Build/test และ publish เท่านั้น |
| Run workflow บน main, เลือก deploy | Build/test, publish และอัปเดตแอป Telemed เดิม |

ใช้ artifact ส่ง image เดิมจาก job ทดสอบไป publish ไม่ build ใหม่หลังทดสอบ
PR ไม่ได้รับ Azure credentials และไม่มีสิทธิ์ publish/deploy
Image tag เป็น `sha-<commit>-<run id>-<attempt>` และ deploy ด้วย SHA256 digest
ไม่เขียนทับ tag `prod` เพื่อไม่ให้สับสนกับเวอร์ชันที่กำลังรัน

## ปลายทาง

- Registry: `healthxregistry.azurecr.io`
- Repository: `healthx-telemed-web`
- Resource group: `healthx-clinic-app`
- Container App: `healthx-telemed-web`
- Ingress: external, port `3000`
- Revision mode: `Single`

Pipeline **ไม่สร้าง Container App** ให้สร้างแอปด้วย image Telemed ก่อน
หากชื่อแอปจริงไม่ตรง ห้ามเปลี่ยนไปใช้แอป V1 แทน ให้แก้ปลายทางและ test ร่วมกัน
ไม่เปลี่ยน env, secrets, DNS, CPU/RAM, scale หรือ backend/database
ไม่ deploy `healthx-api`, `healthx-web`, `healthx-web-admin` หรือ ERP

## ตั้งค่าครั้งแรก

1. สร้าง GitHub Environment ชื่อ `production` ใน Settings > Environments
2. จำกัด deployment branch เป็น `main` และตั้ง required reviewers หากแผน GitHub รองรับ
3. ให้ผู้ดูแล Azure สร้าง identity สำหรับ pipeline และ federated credential:
   - Issuer: `https://token.actions.githubusercontent.com`
   - Subject: `repo:team-health-x/telemed-health-x:environment:production`
   - Audience: `api://AzureADTokenExchange`
4. ให้สิทธิ์ push/pull image และอ่าน registry สำหรับ `healthxregistry`
   โดยใช้สิทธิ์ระดับ repository เมื่อ registry รองรับ ABAC
   หากใช้ `AcrPush` บน registry แบบ RBAC จะมีสิทธิ์ต่อทุก repository ใน registry
   ไม่ใช่เฉพาะ Telemed ต้องให้ผู้ดูแลยอมรับขอบเขตนี้ก่อน
5. ให้สิทธิ์ `Container Apps Contributor` เฉพาะ resource ของ `healthx-telemed-web`
   ไม่ให้ Contributor ทั้ง subscription/resource group เพื่อความสะดวก
6. Container App ต้องมีสิทธิ์ pull image ของตัวเองด้วย เช่น managed identity ที่มี
   `AcrPull` หรือ repository reader ตาม permission mode ของ registry
   identity ที่ deploy กับ identity ที่ pull image เป็นคนละหน้าที่
7. เพิ่ม Variables ต่อไปนี้ใน GitHub Environment `production`:

| Variable | ค่า |
| --- | --- |
| `AZURE_CLIENT_ID` | Client ID ของ identity สำหรับ pipeline |
| `AZURE_TENANT_ID` | Tenant ID ของ Azure |
| `AZURE_SUBSCRIPTION_ID` | `acf02b4d-8c3d-4fcc-92a8-9c072341e6c4` |
| `TELEMED_AUTO_DEPLOY` | `false` หรือเว้นว่างในช่วงเตรียมระบบ |

ใช้ OIDC ไม่ต้องสร้าง/วาง client secret หรือ registry password ใน repo
ระบบยังต้องตั้งค่า federation และ role assignments จริง ไม่ใช่แค่ใส่ Variables

## วิธีใช้งาน

หลัง merge ไฟล์ pipeline เข้า main:

1. GitHub > Actions > Telemed Azure CI-CD
2. เลือก Run workflow > branch main
3. ไม่เลือก deploy หากต้องการแค่ image เพื่อสร้าง Container App/DNS
4. เลือก deploy เมื่อมี Container App และต้องการเปลี่ยนเวอร์ชันเว็บ
5. อนุมัติ environment ตามที่ตั้งไว้ แล้วดู image tag/digest ใน Summary ของ run

เมื่อพร้อมให้ deploy อัตโนมัติทุก push main ค่อยตั้ง `TELEMED_AUTO_DEPLOY=true`
การอนุมัติ environment ยังมีผลหากเปิด required reviewers

## ตรวจหลัง deploy และย้อนกลับ

สคริปต์ `scripts/deploy-azure.py` จะบันทึก revision ก่อนหน้า, อัปเดตเฉพาะ image,
รอ revision ใหม่ ready, ตรวจ digest และเช็คหน้าแรก HTTP 200
Single revision mode ให้ Azure เปลี่ยน traffic เมื่อ revision พร้อม
Pipeline ไม่สลับ traffic แบบหลาย revision และไม่ rollback อัตโนมัติหาก HTTP check ล้มเหลว
หากล้มเหลวหลัง update ให้ตรวจ Azure revisions/logs ก่อน retry
สำหรับ rollback ให้เลือก digest ของ Telemed เวอร์ชันที่เคยผ่าน test แล้วและ deploy
เป็น revision ใหม่ โดยรักษา env/secrets เดิม ห้ามถือว่ากด rerun คือ rollback

## ข้อจำกัดก่อนเปิดใช้งานจริง

Image นี้ยังเป็นการเตรียม infrastructure: ปิด mock OTP/login ใน Prod
หากยังไม่ตั้ง API origin จะตอบ 503 สำหรับ catalog/payment โดยตั้งใจ
HTTP 200 ที่หน้าแรกไม่ได้ยืนยันว่า signup, payment หรือ OTP จริงพร้อมใช้งาน
ก่อนเปิดรับลูกค้าต้องเชื่อม production authentication/OTP และทดสอบ full flow
อย่านำ env Dev มาเปิดเพื่อทำให้ login ผ่าน

อ้างอิง OIDC: https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect

## สถานะการติดตั้ง

การเพิ่มไฟล์ในเครื่องยังไม่ทำให้ workflow ปรากฏบน GitHub ต้อง commit/push ก่อน
ไม่ควรเปิด auto-deploy จนกว่าจะตั้ง OIDC, สิทธิ์ pull และแอปปลายทางครบ
