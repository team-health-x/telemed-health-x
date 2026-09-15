# Telemed Development CI/CD

## การทำงาน

- Workflow: `.github/workflows/telemed-azure-dev.yml` / **Telemed Azure Development**
- PR เข้า `develop`: ทดสอบ guard/auth, build Docker และทดสอบ container แบบไม่เชื่อม backend
- Push เข้า `develop`: ทดสอบ, publish image และ deploy Dev อัตโนมัติ
- Run workflow: เลือก branch `develop`; เอาเครื่องหมาย deploy ออกได้หากต้องการ publish อย่างเดียว
- ตั้ง Environment variable `TELEMED_DEV_AUTO_DEPLOY=false` เพื่อหยุด auto-deploy ชั่วคราว
- Workflow Prod บน `main` ไม่เปลี่ยนเงื่อนไขการทำงาน

## ปลายทาง Dev เท่านั้น

| รายการ | ค่า |
| --- | --- |
| GitHub Environment | `development` |
| Resource group | `healthx-clinic-app-dev` |
| Container App | `healthx-telemed-web` (ชื่อเหมือน Prod แต่คนละกลุ่ม) |
| Azure Environment | `environment-healthx-clinic-app-dev` |
| Image repository | `healthxregistry.azurecr.io/healthx-telemed-web` |
| Image tag | `dev-<commit>-<run id>-<attempt>` |
| Ingress | External HTTP, port `3000` |
| Revision mode | `Single` |

Deploy ด้วย digest ของ image ที่ผ่าน test ไม่เขียนทับ tag Prod
สคริปต์ตรวจกลุ่มปลายทางและ backend Dev ก่อน update
ไม่สร้าง resource, เปลี่ยน IAM, เขียน env/secrets, เปลี่ยน DNS หรือแก้ฐานข้อมูลให้เอง

## สิ่งที่ต้องตั้งค่าครั้งแรก

1. สร้าง Container App ด้านบนในกลุ่ม Dev และให้แอป pull image จาก ACR ได้
2. สร้าง GitHub Environment `development` จำกัด deployment branch เป็น `develop`
3. ตั้ง Azure OIDC สำหรับ identity แยกจาก Prod:
   - Issuer: `https://token.actions.githubusercontent.com`
   - Subject: `repo:team-health-x/telemed-health-x:environment:development`
   - Audience: `api://AzureADTokenExchange`
4. เพิ่ม Variables ใน GitHub Environment `development`:
   - `AZURE_CLIENT_ID`: identity สำหรับ Dev pipeline
   - `AZURE_TENANT_ID`: tenant ของ Azure
   - `AZURE_SUBSCRIPTION_ID`: `acf02b4d-8c3d-4fcc-92a8-9c072341e6c4`
   - `TELEMED_DEV_AUTO_DEPLOY`: `true` หรือเว้นว่างให้ deploy ทุก push; `false` เพื่อ publish อย่างเดียว
5. ให้สิทธิ์ deploy เฉพาะ Container App ในกลุ่ม Dev ไม่ให้สิทธิ์เขียนแอป Prod
   ให้สิทธิ์ registry ตาม permission mode: repository writer/reader เมื่อรองรับ ABAC
   หรือ `AcrPush` ใน RBAC ซึ่งครอบคลุมทั้ง registry ต้องรับทราบขอบเขตก่อน
   identity สำหรับ container pull image ต้องมีสิทธิ์ pull แยกด้วย

ไม่ใช้ client secret ใน repo และไม่ใช้ OIDC identity ของ Prod ร่วมเพื่อความสะดวก

## Runtime env ใน Container App Dev

Image ยังคงค่าเริ่มต้นแบบ Prod-safe ต้องตั้ง runtime env ชัดเจน:

```dotenv
TELEMED_DEPLOY_ENV=dev
TELEMED_API_ORIGIN=https://healthx-api.kindrock-9a3ea2bc.southeastasia.azurecontainerapps.io
TELEMED_WORKFLOW_ORIGIN=https://healthx-api.kindrock-9a3ea2bc.southeastasia.azurecontainerapps.io
TELEMED_DEMO_AUTH_ENABLED=false
```

หากต้องทดสอบ OTP จำลอง ให้จำกัดการเข้าถึงเว็บเฉพาะผู้ทดสอบก่อน จากนั้นตั้ง:

- `TELEMED_DEMO_AUTH_ENABLED=true`
- `TELEMED_DEV_ORIGINS=https://<hostname ของแอป Dev>` เพิ่มโดเมนอื่นได้ด้วย comma
- `TELEMED_SESSION_SECRET` อ้าง Azure Secret ของ Dev
- `TELEMED_DEMO_BRIDGE_SECRET` อ้าง Azure Secret ที่ตรงกับ Backend Dev

ใช้ secret ที่ยาวและสุ่มตาม policy เดิม ไม่ฝังใน Docker image หรือ GitHub workflow
OTP `123456` ไม่ใช่การยืนยันเจ้าของเบอร์จริง ห้ามเปิดให้คนทั่วไปเข้าถึงบัญชีจริง
Pipeline ไม่สร้าง secret และไม่เปิด demo ให้เอง

## เริ่มใช้

Commit workflow และสคริปต์เข้า repo แล้วให้ branch `develop` มีไฟล์เหล่านี้
ควร merge workflow เข้า default branch `main` ด้วย เพื่อให้ปุ่ม Run workflow ปรากฏ
การ merge นี้ไม่เปิด auto-deploy Prod (ยังใช้เงื่อนไขเดิม)
จากนั้น push งานเข้า `develop` และดู Actions > Telemed Azure Development

ก่อนตั้ง OIDC และ Container App ครบ CI ยังตรวจ test/build ได้ แต่ release/deploy จะไม่สำเร็จ
หลัง deploy จะตรวจ revision/digest และหน้าแรก HTTP 200 ไม่ใช่การยืนยัน full flow
ยังต้องทดสอบสมัคร/login/นัดหมาย/ชำระเงินจริงใน environment ที่เหมาะสมแยกต่างหาก

ดูรายละเอียดการ rollback และขอบเขต CI/CD ร่วมใน [telemed-cicd.md](telemed-cicd.md)
