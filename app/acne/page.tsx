/* eslint-disable @next/next/no-html-link-for-pages -- the handoff uses native <a> on purpose (client-side navigation broke on the original host). */
import Image from "next/image";
import "../telehealth.css";
import TelehealthLogo from "../telehealth-logo";
import type { Metadata } from "next";
import {
  Camera,
  ClipboardCheck,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Video,
} from "lucide-react";

export const metadata: Metadata = {
  title: "โปรแกรมรักษาสิว | THE RITZ TeleHealth",
  description: "โปรแกรมดูแลสิวที่เริ่มจากการประเมินโดยแพทย์ ทบทวนการดูแลเดิม และติดตามการตอบสนองของผิวเป็นรายบุคคล",
  alternates: { canonical: "/acne" },
  openGraph: {
    url: "/acne",
    title: "โปรแกรมรักษาสิว | THE RITZ TeleHealth",
    description: "ดูแลปัญหาสิวอย่างเข้าใจผิว ด้วยการประเมินและติดตามผลโดยแพทย์",
  },
};

const assessmentItems = [
  { icon: Camera, title: "ลักษณะและตำแหน่งของสิว", text: "ดูรูปแบบของสิว บริเวณที่เป็น และสัญญาณที่ควรตรวจเพิ่มเติม" },
  { icon: ClipboardCheck, title: "ประวัติการดูแลที่ผ่านมา", text: "ทบทวนผลิตภัณฑ์ ยา หรือหัตถการที่เคยใช้ รวมถึงผลที่เกิดขึ้น" },
  { icon: ShieldCheck, title: "สุขภาพและข้อควรระวัง", text: "ประเมินข้อมูลสุขภาพ การแพ้ยา และปัจจัยที่เกี่ยวข้องก่อนวางแผน" },
  { icon: RefreshCw, title: "กิจวัตรและการติดตามผล", text: "ออกแบบแนวทางที่ทำได้จริง พร้อมติดตามการตอบสนองและอาการไม่พึงประสงค์" },
];

const faqs = [
  ["ปรึกษาออนไลน์ได้ทุกกรณีไหม?", "ไม่ทุกกรณี แพทย์จะประเมินก่อนว่าข้อมูลและภาพที่มีเพียงพอหรือไม่ หากมีสิวรุนแรง เจ็บมาก เสี่ยงเกิดแผลเป็น หรือมีอาการที่ต้องตรวจเพิ่มเติม อาจแนะนำให้เข้ารับการตรวจที่สถานพยาบาล"],
  ["ต้องใช้ยาทุกคนหรือไม่?", "ไม่จำเป็น แผนดูแลขึ้นอยู่กับลักษณะสิว ประวัติสุขภาพ และการประเมินของแพทย์ อาจเริ่มจากการปรับผลิตภัณฑ์และกิจวัตร หรือพิจารณาการรักษาอื่นเมื่อเหมาะสม"],
  ["ควรเตรียมอะไรก่อนปรึกษา?", "เตรียมรายชื่อผลิตภัณฑ์และยาที่ใช้อยู่ ประวัติแพ้ยา ระยะเวลาที่เริ่มเป็น และภาพผิวในแสงธรรมชาติ โดยทีมดูแลจะแจ้งวิธีเตรียมข้อมูลผ่านช่องทางที่เหมาะสม"],
  ["เห็นผลเมื่อไร?", "การตอบสนองแตกต่างกันในแต่ละคน แพทย์จะกำหนดช่วงติดตามที่เหมาะกับแผนและอาการ โดยไม่รับประกันผลลัพธ์หรือตารางเวลาตายตัว"],
];

export default function AcnePage() {
  return (
    <div className="telehealth-site"><main className="acne-page">
      <header className="site-header acne-header">
        <a className="hub-brand" href="/" aria-label="THE RITZ TeleHealth หน้าหลัก">
          <Image className="clinic-brand-logo" src="/the-ritz-clinic-logo.png" alt="THE RITZ Clinic" width={1506} height={551} priority />
          <TelehealthLogo priority />
        </a>
        <nav className="desktop-nav" aria-label="เมนูโปรแกรมรักษาสิว">
          <a href="/">หน้าหลัก</a><a href="#assessment">การประเมิน</a><a href="#steps">ขั้นตอน</a><a href="#faq">คำถามที่พบบ่อย</a>
        </nav>
        <div className="header-actions"><a className="register-button acne-register" href="#consultation">เริ่มต้นปรึกษา</a></div>
      </header>

      <section className="acne-hero" id="top">
        <div className="acne-hero-copy">
          <p className="eyebrow">โปรแกรมรักษาสิว</p>
          <h1>ดูแลสิวแบบเข้าใจผิว<span>ไม่ลองผิดลองถูก</span></h1>
          <p className="hero-lead">เริ่มจากการประเมินลักษณะสิว ประวัติการดูแล และสุขภาพของคุณ ก่อนร่วมวางแผนที่เหมาะสมและติดตามการตอบสนองของผิว</p>
          <div className="hero-actions"><a className="button acne-button" href="#consultation">ปรึกษาทีมดูแล</a><a className="text-link" href="#assessment">ดูรายละเอียดโปรแกรม <span aria-hidden="true">→</span></a></div>
          <ul className="trust-list"><li><span>✓</span> แพทย์ประเมินก่อน</li><li><span>✓</span> ไม่รับประกันผลเกินจริง</li><li><span>✓</span> ติดตามผลเป็นรายบุคคล</li></ul>
        </div>
        <div className="acne-hero-visual">
          <div className="acne-image-frame"><Image src="/acne-telehealth-v1.png" alt="ผู้หญิงกำลังรับคำปรึกษาออนไลน์เรื่องปัญหาสิว" fill sizes="(max-width: 900px) 100vw, 48vw" priority /></div>
          <div className="acne-note"><Sparkles aria-hidden="true" /><p><strong>เริ่มจากผิวของคุณ</strong>ไม่ใช้แผนเดียวกับทุกคน</p></div>
        </div>
      </section>

      <section className="acne-proof">
        <div><strong>ประเมินอย่างเป็นระบบ</strong><span>ดูทั้งผิวและประวัติสุขภาพ</span></div><div><strong>แผนที่ทำได้จริง</strong><span>เข้ากับกิจวัตรของคุณ</span></div><div><strong>ติดตามการตอบสนอง</strong><span>ปรับเมื่อผิวหรืออาการเปลี่ยน</span></div>
      </section>

      <section className="acne-assessment section-pad" id="assessment">
        <div className="section-heading"><p className="eyebrow">START WITH ASSESSMENT</p><h2>ก่อนวางแผน เราทำความเข้าใจ<br />ผิวของคุณให้ครบก่อน</h2><p>สิวที่ดูคล้ายกันอาจมีปัจจัยและข้อควรระวังต่างกัน การประเมินจึงเป็นจุดเริ่มต้นของทุกแผน</p></div>
        <div className="acne-assessment-grid">
          {assessmentItems.map((item, index) => { const Icon = item.icon; return <article key={item.title}><div className="acne-card-top"><span>0{index + 1}</span><Icon aria-hidden="true" /></div><h3>{item.title}</h3><p>{item.text}</p></article>; })}
        </div>
      </section>

      <section className="acne-care-plan">
        <div className="acne-care-image"><Image src="/doctor-telehealth.jpg" alt="แพทย์ให้คำปรึกษาผ่านระบบออนไลน์" fill sizes="(max-width: 900px) 92vw, 45vw" /></div>
        <div className="acne-care-copy"><p className="eyebrow">PERSONALIZED PLAN</p><h2>ดูแลเท่าที่จำเป็น<br />และติดตามอย่างเหมาะสม</h2><p>หลังประเมิน แพทย์อาจแนะนำการปรับกิจวัตรและผลิตภัณฑ์ การรักษาเฉพาะที่ หรือแนวทางอื่นตามความเหมาะสม โดยคำนึงถึงประสิทธิภาพ ความปลอดภัย และข้อจำกัดของแต่ละคน</p><div className="acne-mini-list"><span><ShieldCheck />อธิบายวิธีใช้และข้อควรระวัง</span><span><RefreshCw />นัดติดตามเพื่อประเมินการตอบสนอง</span><span><MessageCircle />เปิดโอกาสให้ถามก่อนตัดสินใจ</span></div></div>
      </section>

      <section className="acne-steps section-pad" id="steps">
        <div className="section-heading narrow"><p className="eyebrow">HOW IT WORKS</p><h2>จากข้อมูลแรก<br />สู่แผนดูแลที่ชัดเจน</h2></div>
        <div className="acne-step-grid"><article><span>01</span><Camera /><h3>เตรียมข้อมูลผิว</h3><p>ทีมดูแลแจ้งข้อมูลและภาพที่ควรเตรียมผ่านช่องทางที่เหมาะสม</p></article><article><span>02</span><Video /><h3>ปรึกษาแพทย์</h3><p>ทบทวนอาการ ประวัติ และความเหมาะสมของการดูแลทางไกล</p></article><article><span>03</span><Stethoscope /><h3>รับแผนดูแล</h3><p>แพทย์อธิบายทางเลือก วิธีปฏิบัติ และข้อควรระวังก่อนเริ่ม</p></article><article><span>04</span><RefreshCw /><h3>ติดตามผล</h3><p>ประเมินการตอบสนอง อาการไม่พึงประสงค์ และปรับแผนเมื่อจำเป็น</p></article></div>
        <div className="acne-safety"><ShieldCheck aria-hidden="true" /><div><p className="eyebrow light">MEDICAL SAFETY FIRST</p><h3>บางกรณีควรเข้ารับการตรวจโดยตรง</h3><p>หากข้อมูลทางไกลไม่เพียงพอ หรือมีอาการที่ต้องตรวจเพิ่มเติม แพทย์อาจแนะนำให้เข้ารับบริการที่สถานพยาบาลก่อนเริ่มหรือเปลี่ยนแผน</p></div></div>
      </section>

      <section className="faq-section section-pad acne-faq" id="faq">
        <div className="faq-intro"><p className="eyebrow">FAQ</p><h2>คำถามที่พบบ่อย</h2><p>อ่านข้อมูลเบื้องต้นก่อนนัดหมาย และสอบถามทีมดูแลเพิ่มเติมได้หากยังไม่แน่ใจ</p></div>
        <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="acne-consultation" id="consultation">
        <div><p className="eyebrow light">READY WHEN YOU ARE</p><h2>เริ่มต้นด้วยการพูดคุย<br />โดยยังไม่มีข้อผูกมัด</h2><p>ทีมดูแลพร้อมอธิบายโปรแกรมและช่วยนัดหมาย การติดต่อครั้งแรกไม่ใช่การวินิจฉัยหรือสั่งยา</p></div>
        <div className="acne-contact-card"><TelehealthLogo className="contact-telehealth-logo" /><h3>ติดต่อทีมดูแล</h3><p>เปิดทุกวันตามเวลาทำการของคลินิก</p><a className="button acne-button" href="tel:0946891666">โทร 094-689-1666</a><small>ทีมงานจะแจ้งช่องทางส่งข้อมูลและนัดหมายที่เหมาะสม</small></div>
      </section>

      <footer className="acne-footer">
        <div className="footer-brand"><div className="footer-logo-pair"><Image src="/the-ritz-clinic-logo.png" alt="THE RITZ Clinic" width={1506} height={551} /><TelehealthLogo /></div><p>โปรแกรมรักษาสิว ภายใต้การดูแลของ เดอะริทซ์คลินิก เวชกรรม</p></div>
        <div className="footer-links"><a href="/">หน้าหลัก</a><a href="/resize">โปรแกรมดูแลรูปร่าง ลดน้ำหนัก</a><a href="#assessment">โปรแกรมรักษาสิว</a><a href="#faq">คำถามที่พบบ่อย</a></div>
        <div className="footer-bottom"><p>© 2026 THE RITZ Clinic</p><p>ข้อมูลนี้ไม่ใช่คำวินิจฉัยหรือคำแนะนำเฉพาะบุคคล ไม่ควรเริ่ม หยุด หรือเปลี่ยนยาโดยไม่ได้รับคำแนะนำจากแพทย์หรือเภสัชกร</p><p className="photo-credit">ภาพผู้รับบริการเป็นภาพประกอบสร้างด้วย AI ไม่ใช่ภาพก่อน–หลังหรือผลลัพธ์การรักษา · ภาพแพทย์: <a href="https://www.pexels.com/photo/a-woman-in-white-lab-coat-smiling-while-typing-on-laptop-8376280/" target="_blank" rel="noreferrer">Tima Miroshnichenko / Pexels</a></p><p className="medical-reference">ข้อมูลเพิ่มเติม: <a href="https://www.aad.org/member/clinical-quality/guidelines/acne" target="_blank" rel="noreferrer">แนวทางการดูแลสิวของ AAD</a> · <a href="https://cms-media.fda.moph.go.th/461152405212504064/2023/03/qVBy0UDod1W0t0oP1drCRqgL.pdf" target="_blank" rel="noreferrer">ข้อมูลยารักษาสิวจาก อย.</a> · <a href="https://tmc.or.th/index.php/News/News-and-Activities/Telemedicine" target="_blank" rel="noreferrer">แนวทางการแพทย์ทางไกลของแพทยสภา</a></p></div>
      </footer>
      <a className="mobile-sticky-cta acne-mobile-cta" href="tel:0946891666">โทรปรึกษาทีมดูแล</a>
    </main></div>
  );
}
