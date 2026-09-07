import { UserPlus } from "lucide-react";

export default function RegistrationCta() {
  return (
    <div className="registration-card">
      <span className="registration-card-icon" aria-hidden="true">
        <UserPlus />
      </span>
      <p className="registration-card-kicker">GET STARTED</p>
      <h3>พร้อมเริ่มต้นหรือยัง?</h3>
      <p>กดลงทะเบียนเพื่อไปยังขั้นตอนถัดไป</p>
      <a className="button registration-card-button" href="/register">ลงทะเบียน</a>
    </div>
  );
}
