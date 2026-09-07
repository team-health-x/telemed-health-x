import type { Metadata } from "next";
import Link from "next/link";
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
      </nav>
      {children}
    </div>
  );
}
