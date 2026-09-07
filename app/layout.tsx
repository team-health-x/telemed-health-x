import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")),
  title: "Program Resize | โปรแกรมดูแลน้ำหนักที่ออกแบบเพื่อคุณ",
  description:
    "โปรแกรมดูแลน้ำหนักเฉพาะบุคคล ประเมินและติดตามผลโดยทีมแพทย์ พร้อมคำแนะนำด้านโภชนาการและพฤติกรรม",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "/",
    title: "Program Resize | โปรแกรมดูแลน้ำหนักที่ออกแบบเพื่อคุณ",
    description: "ดูแลน้ำหนักอย่างเข้าใจร่างกาย ด้วยแผนเฉพาะบุคคลและการติดตามผลโดยทีมแพทย์",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Program Resize" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Program Resize | โปรแกรมดูแลน้ำหนักที่ออกแบบเพื่อคุณ",
    description: "ดูแลน้ำหนักอย่างเข้าใจร่างกาย ด้วยแผนเฉพาะบุคคลและการติดตามผลโดยทีมแพทย์",
    images: ["/og.png"],
  },
  alternates: { canonical: "/" },
  icons: {
    icon: "/program-resize-logo.png",
    shortcut: "/program-resize-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
