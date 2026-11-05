import Image from "next/image";
import "./telehealth.css";
import TelehealthLogo from "./telehealth-logo";
import {
  ArrowRight,
  UserPlus,
  ShieldCheck,
  Stethoscope,
  Video,
} from "lucide-react";

export default function TeleHealthHome() {
  return (
    <div className="telehealth-site"><main className="hub-page">
      <header className="site-header hub-header">
        <a className="hub-brand" href="#top" aria-label="THE RITZ TeleHealth หน้าแรก">
          <Image className="clinic-brand-logo" src="/the-ritz-clinic-logo.png" alt="THE RITZ Clinic" width={1506} height={551} priority />
          <TelehealthLogo priority />
        </a>
        <nav className="desktop-nav" aria-label="เมนูหลัก">
          <a href="/programs">โปรแกรม</a>
          <a href="/programs#how-it-works">ขั้นตอน</a>
          <a href="#clinic">ข้อมูลคลินิก</a>
        </nav>
        <div className="header-actions"><a className="register-button" href="/programs">สนใจ</a></div>
      </header>

      <section className="hub-hero" id="top">
        <div className="hub-hero-copy">
          <h1 className="hub-brand-title hub-logo-title"><TelehealthLogo priority /></h1>
          <div className="hero-actions">
            <a className="button hub-registration-button" href="/programs">สนใจ <ArrowRight aria-hidden="true" /></a>
          </div>
        </div>
        <div className="hub-hero-visual" aria-label="บริการปรึกษาแพทย์ออนไลน์">
          <div className="hub-photo hub-photo-main"><Image src="/online-consultation-hero-v1.png" alt="ภาพประกอบผู้รับบริการวิดีโอคอลปรึกษาแพทย์ โดยเห็นแพทย์บนหน้าจอแล็ปท็อป" fill sizes="(max-width: 900px) 88vw, 42vw" priority /></div>
          <div className="hub-orb hub-orb-one" /><div className="hub-orb hub-orb-two" />
        </div>
      </section>

      <section className="hub-proof" aria-label="หลักการให้บริการ">
        <article><Stethoscope aria-hidden="true" /><div><strong>แพทย์ประเมินก่อน</strong><span>เพื่อวางแผนดูแลที่เหมาะกับคุณ</span></div></article>
        <article><Video aria-hidden="true" /><div><strong>ออนไลน์อย่างเป็นส่วนตัว</strong><span>ทีมดูแลช่วยเตรียมความพร้อม</span></div></article>
        <article><ShieldCheck aria-hidden="true" /><div><strong>คำนึงถึงความปลอดภัย</strong><span>พิจารณาความเหมาะสมเป็นรายบุคคล</span></div></article>
      </section>

      <section className="hub-clinic" id="clinic">
        <div className="hub-clinic-intro">
          <h2><TelehealthLogo className="clinic-telehealth-logo" /><span>ดูแลโดย THE RITZ Clinic</span></h2>
          <p>บริการออนไลน์เป็นส่วนหนึ่งของการดูแลจาก เดอะริทซ์คลินิก เวชกรรม โดยแพทย์จะพิจารณาว่าแต่ละกรณีเหมาะกับการปรึกษาทางไกลหรือควรเข้ารับการตรวจที่สถานพยาบาล</p>
          <a className="button light-button" href="tel:0946891666">โทร 094-689-1666</a>
        </div>
        <address className="hub-clinic-card">
          <Image src="/the-ritz-clinic-logo.png" alt="THE RITZ Clinic" width={1506} height={551} />
          <dl>
            <div><dt>ชื่อสถานพยาบาล</dt><dd>เดอะริทซ์คลินิก เวชกรรม</dd></div>
            <div><dt>ใบอนุญาตเลขที่</dt><dd>10101012963</dd></div>
            <div><dt>ที่ตั้ง</dt><dd>345/6 โครงการ Headquarters เอกมัย–ลาดพร้าว แขวงพลับพลา เขตวังทองหลาง กรุงเทพมหานคร 10310</dd></div>
            <div><dt>โทรศัพท์</dt><dd><a href="tel:0946891666">094-689-1666</a></dd></div>
          </dl>
        </address>
      </section>

      <footer className="hub-footer">
        <div className="footer-brand">
          <div className="footer-logo-pair"><Image src="/the-ritz-clinic-logo.png" alt="THE RITZ Clinic" width={1506} height={551} /><TelehealthLogo /></div>
          <p>บริการดูแลสุขภาพออนไลน์จาก เดอะริทซ์คลินิก เวชกรรม</p>
        </div>
        <div className="footer-links"><a href="/programs">โปรแกรม</a><a href="/resize">โปรแกรมดูแลรูปร่าง ลดน้ำหนัก</a><a href="/acne">โปรแกรมรักษาสิว</a><a href="#clinic">ข้อมูลคลินิก</a></div>
        <div className="footer-bottom">
          <p>© 2026 THE RITZ Clinic</p>
          <p>ข้อมูลบนเว็บไซต์นี้เป็นข้อมูลทั่วไป ไม่ใช่การวินิจฉัยหรือคำแนะนำทางการแพทย์เฉพาะบุคคล ผลลัพธ์และความเหมาะสมแตกต่างกันไปในแต่ละบุคคล</p>
          <p className="photo-credit">ภาพแบนเนอร์และภาพโปรแกรมเป็นภาพประกอบสร้างด้วย AI ไม่ใช่ภาพแพทย์หรือผู้รับบริการจริง และไม่ใช่ภาพก่อน–หลังหรือผลลัพธ์การรักษา</p>
          <p className="medical-reference">แนวทางบริการ: <a href="https://tmc.or.th/index.php/News/News-and-Activities/Telemedicine" target="_blank" rel="noreferrer">ประกาศแพทยสภาเรื่องการแพทย์ทางไกล</a></p>
        </div>
      </footer>
      <div className="hub-contact-dock">
        <a className="contact-pill contact-register" href="/programs"><span className="contact-pill-icon" aria-hidden="true"><UserPlus /></span><span>สนใจ</span></a>
      </div>
    </main></div>
  );
}
