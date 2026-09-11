import type { Metadata } from "next";
import Link from "next/link";
import { demoEnabled } from '../lib/telemed-dev-policy';
import "./telemed.css";
import "./responsive.css";

export const metadata: Metadata = {
  title: "ลงทะเบียนและนัดหมาย | Program Resize",
  alternates: { canonical: "/register" },
};

export default function RegistrationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="telemed-site">
      <nav className="portal-navigation" aria-label="กลับหน้าเว็บไซต์">
        <Link href="/">← กลับหน้า Program Resize</Link>
        {demoEnabled() && <Link href="/login" style={{ marginLeft: 'auto' }}>เข้าสู่ระบบ</Link>}
      </nav>
      {children}
    </div>
  );
}
