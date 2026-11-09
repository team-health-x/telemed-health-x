import type { Metadata } from "next";
import "./globals.css";
import DemoSession from "./demo-session";
import TelemedMaintenance from './telemed-maintenance';
import { authEnabled } from './lib/telemed-dev-policy';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")),
  title: "THE RITZ TeleHealth | ดูแลสุขภาพออนไลน์โดย THE RITZ Clinic",
  description:
    "บริการดูแลสุขภาพออนไลน์จาก THE RITZ Clinic เลือกดูโปรแกรมดูแลรูปร่าง ลดน้ำหนัก และโปรแกรมรักษาสิว พร้อมประเมินและติดตามผลโดยทีมแพทย์",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "/",
    title: "THE RITZ TeleHealth | ดูแลสุขภาพออนไลน์โดย THE RITZ Clinic",
    description: "เลือกดูโปรแกรมดูแลรูปร่าง ลดน้ำหนัก และโปรแกรมรักษาสิว พร้อมประเมินและติดตามผลโดยทีมแพทย์",
    images: [{ url: "/online-consultation-hero-v1.png", alt: "THE RITZ TeleHealth — ปรึกษาแพทย์ออนไลน์" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "THE RITZ TeleHealth | ดูแลสุขภาพออนไลน์โดย THE RITZ Clinic",
    description: "เลือกดูโปรแกรมดูแลรูปร่าง ลดน้ำหนัก และโปรแกรมรักษาสิว พร้อมประเมินและติดตามผลโดยทีมแพทย์",
    images: ["/online-consultation-hero-v1.png"],
  },
  alternates: { canonical: "/" },
  icons: {
    icon: "/the-ritz-clinic-logo.png",
    shortcut: "/the-ritz-clinic-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body><TelemedMaintenance />{authEnabled() && <DemoSession />}{children}</body>
    </html>
  );
}
