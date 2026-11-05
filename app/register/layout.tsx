import type { Metadata } from "next";
import Link from "next/link";
import "./telemed.css";
import "./responsive.css";

export const metadata: Metadata = {
  title: "ลงทะเบียนและนัดหมาย | โปรแกรมดูแลรูปร่าง ลดน้ำหนัก",
  alternates: { canonical: "/register" },
};

export default function RegistrationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="telemed-site">
      <nav className="portal-navigation" aria-label="กลับหน้าเว็บไซต์">
        <Link href="/resize">← กลับหน้าโปรแกรมดูแลรูปร่าง ลดน้ำหนัก</Link>
        <Link href="/login" style={{ marginLeft: 'auto' }}>เข้าสู่ระบบ</Link>
      </nav>
      {children}
    </div>
  );
}
