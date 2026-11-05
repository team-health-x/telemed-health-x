/* eslint-disable @next/next/no-html-link-for-pages -- the handoff uses native <a> on purpose (client-side navigation broke on the original host). */
import Image from "next/image";
import "../telehealth.css";
import TelehealthLogo from "../telehealth-logo";
import type { Metadata } from "next";
import { ArrowRight, CalendarCheck, ClipboardCheck, PackageCheck, Video } from "lucide-react";

export const metadata: Metadata = {
  title: "เลือกโปรแกรมที่ตรงกับเป้าหมายของคุณ | THE RITZ TeleHealth",
  description: "เลือกโปรแกรมดูแลรูปร่าง ลดน้ำหนัก หรือโปรแกรมรักษาสิว พร้อมดูขั้นตอนการรับบริการทั้ง 4 ขั้นตอน",
  alternates: { canonical: "/programs" },
  openGraph: { url: "/programs", title: "เลือกโปรแกรม | THE RITZ TeleHealth" },
};

const careSteps = [
  { icon: ClipboardCheck, number: "1", title: "ลงทะเบียน / จองคิว", text: "เลือกโปรแกรมดูแลรูปร่าง ลดน้ำหนัก หรือโปรแกรมรักษาสิว แล้วให้ทีมดูแลช่วยเตรียมข้อมูลและนัดหมายเวลาที่สะดวก" },
  { icon: Video, number: "2", title: "ปรึกษาแพทย์ออนไลน์", text: "พูดคุยกับแพทย์เพื่อประเมินความเหมาะสม และวางแผนดูแลเฉพาะบุคคล" },
  { icon: PackageCheck, number: "3", title: "เตรียมการดูแล / รับยา", text: "หากแพทย์สั่งยา ทีมงานจะแจ้งวิธีรับยา การจัดส่ง และการเก็บรักษาที่เหมาะสม" },
  { icon: CalendarCheck, number: "4", title: "เริ่มดูแลและติดตามผล", text: "เริ่มต้นตามแผนที่ได้รับ พร้อมนัดติดตามการตอบสนองและปรับแผนร่วมกับแพทย์" },
];


export default function ProgramsPage() {
  return (
    <div className="telehealth-site"><main className="hub-page programs-page" id="top">
      <header className="site-header hub-header">
        <a className="hub-brand" href="/" aria-label="THE RITZ TeleHealth หน้าหลัก">
          <Image className="clinic-brand-logo" src="/the-ritz-clinic-logo.png" alt="THE RITZ Clinic" width={1506} height={551} priority />
          <TelehealthLogo priority />
        </a>
        <nav className="desktop-nav" aria-label="เมนูหลัก">
          <a href="/">หน้าหลัก</a>
          <a href="#programs">โปรแกรม</a>
          <a href="#how-it-works">ขั้นตอน</a>
          <a href="/#clinic">ข้อมูลคลินิก</a>
        </nav>
        <div className="header-actions"><a className="register-button" href="/">กลับหน้าหลัก</a></div>
      </header>
      <section className="hub-programs section-pad" id="programs">
        <div className="section-heading">
          <h1>เลือกโปรแกรมที่ตรงกับ<br />เป้าหมายของคุณ</h1>
          <p>แต่ละโปรแกรมมีหน้ารายละเอียด ขั้นตอน และข้อควรทราบแยกกัน เพื่อให้คุณตัดสินใจก่อนนัดหมายได้อย่างมั่นใจ</p>
        </div>
        <div className="hub-program-grid">
          <article className="hub-program-card resize-card clickable-program-card">
            <div className="hub-program-image"><Image src="/hero-weight-management-couple-v3.png" alt="ชายและหญิงสุขภาพดีในโปรแกรมดูแลน้ำหนัก" fill sizes="(max-width: 760px) 92vw, 45vw" /></div>
            <div className="hub-program-content">
              <div><h3>โปรแกรมดูแลรูปร่าง ลดน้ำหนัก</h3></div>
              <p>โปรแกรมดูแลน้ำหนักเฉพาะบุคคล ครบทั้งการประเมิน ติดตามผล โภชนาการ และพฤติกรรม</p>
              <ul><li>ประเมินสุขภาพและเป้าหมาย</li><li>วางแผนให้เหมาะกับชีวิตประจำวัน</li><li>ติดตามและปรับแผนต่อเนื่อง</li></ul>
              <a className="program-card-link" href="/resize">ดูโปรแกรมดูแลรูปร่าง ลดน้ำหนัก <ArrowRight aria-hidden="true" /></a>
            </div>
          </article>
          <article className="hub-program-card acne-card">
            <div className="hub-program-image"><Image src="/acne-telehealth-v1.png" alt="ผู้หญิงรับคำปรึกษาออนไลน์เรื่องปัญหาสิว" fill sizes="(max-width: 760px) 92vw, 45vw" /></div>
            <div className="hub-program-content">
              <div><h3>โปรแกรมรักษาสิว</h3></div>
              <p>โปรแกรมดูแลสิวที่เริ่มจากการทำความเข้าใจผิว ประวัติการดูแล และปัจจัยที่เกี่ยวข้องก่อนวางแผน</p>
              <ul><li>ประเมินลักษณะและระดับของสิว</li><li>ทบทวนผลิตภัณฑ์และการรักษาเดิม</li><li>ติดตามการตอบสนองของผิว</li></ul>
              <a href="/acne">ดูโปรแกรมรักษาสิว <ArrowRight aria-hidden="true" /></a>
            </div>
          </article>
        </div>
      </section>

      <section className="hub-process section-pad" id="how-it-works">
        <div className="section-heading narrow">
          <h2>ดูแลคุณครบใน 4 ขั้นตอน</h2>
          <p>ทุกโปรแกรมเริ่มจากการทำความเข้าใจความต้องการ และให้แพทย์ประเมินก่อนเลือกแนวทางดูแล</p>
        </div>
        <ol className="hub-step-grid pearl-steps">
          {careSteps.map((step) => {
            const Icon = step.icon;
            return <li className="pearl-step" key={step.number}>
              <div className="pearl-stage" aria-hidden="true">
                <div className="pearl-orbit" />
                <div className="pearl-glass"><Icon strokeWidth={1.35} /><span className="pearl-number">{step.number}</span></div>
                <div className="pearl-pedestal" />
              </div>
              <div className="pearl-copy"><h3>{step.title}</h3><div className="pearl-rule" /><p>{step.text}</p></div>
            </li>;
          })}
        </ol>
      </section>


      <footer className="hub-footer">
        <div className="footer-brand">
          <div className="footer-logo-pair"><Image src="/the-ritz-clinic-logo.png" alt="THE RITZ Clinic" width={1506} height={551} /><TelehealthLogo /></div>
          <p>บริการดูแลสุขภาพออนไลน์จาก เดอะริทซ์คลินิก เวชกรรม</p>
        </div>
        <div className="footer-links"><a href="#programs">โปรแกรม</a><a href="/resize">โปรแกรมดูแลรูปร่าง ลดน้ำหนัก</a><a href="/acne">โปรแกรมรักษาสิว</a><a href="/#clinic">ข้อมูลคลินิก</a></div>
        <div className="footer-bottom">
          <p>© 2026 THE RITZ Clinic</p>
          <p>ข้อมูลบนเว็บไซต์นี้เป็นข้อมูลทั่วไป ไม่ใช่การวินิจฉัยหรือคำแนะนำทางการแพทย์เฉพาะบุคคล ผลลัพธ์และความเหมาะสมแตกต่างกันไปในแต่ละบุคคล</p>
          <p className="photo-credit">ภาพแบนเนอร์และภาพโปรแกรมเป็นภาพประกอบสร้างด้วย AI ไม่ใช่ภาพแพทย์หรือผู้รับบริการจริง และไม่ใช่ภาพก่อน–หลังหรือผลลัพธ์การรักษา</p>
          <p className="medical-reference">แนวทางบริการ: <a href="https://tmc.or.th/index.php/News/News-and-Activities/Telemedicine" target="_blank" rel="noreferrer">ประกาศแพทยสภาเรื่องการแพทย์ทางไกล</a></p>
        </div>
      </footer>

    </main></div>
  );
}
