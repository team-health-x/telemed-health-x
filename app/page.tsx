import Image from "next/image";
import {
  RefreshCw,
  Stethoscope,
  Video,
} from "lucide-react";
import RegistrationCta from "./registration-cta";
import DoctorVideo from "./doctor-video";
import CustomerReviews from "./customer-reviews";

const programItems = [
  { number: "01", title: "แพทย์ประเมินก่อนเริ่ม", image: "/program-doctor-assessment.webp", alt: "การปรึกษาแพทย์ผ่านวิดีโอคอลเพื่อประเมินก่อนเริ่มโปรแกรม" },
  { number: "02", title: "วางแผนการรักษาเฉพาะบุคคล", image: "/program-personal-plan.webp", alt: "ทีมดูแลทบทวนและบันทึกข้อมูลสำหรับแผนการรักษาเฉพาะบุคคล" },
  { number: "03", title: "ติดตามและปรับแผนต่อเนื่อง", image: "/program-follow-up.webp", alt: "ทีมดูแลโทรศัพท์ติดตามผลการดูแลอย่างต่อเนื่อง" },
];

const serviceItems = [
  { icon: Stethoscope, title: "CONVENIENCE", text: "ดูแลสะดวกขึ้น พร้อมทางเลือกสำหรับผู้ที่ไม่สะดวกมาคลินิก" },
  { icon: Video, title: "DOCTOR CARE", text: "เริ่มจากการปรึกษาแพทย์ออนไลน์ และประเมินความเหมาะสมเป็นรายบุคคล" },
  { icon: RefreshCw, title: "CONTINUOUS CARE", text: "จัดส่งแบบ Cold Chain พร้อมทีมดูแลและติดตามผลอย่างต่อเนื่อง" },
];

const steps = [
  ["ลงทะเบียน / จองคิว", ""],
  ["Online Consultation", "ปรึกษาแพทย์ออนไลน์ เพื่อประเมินและวางแผนการรักษา"],
  ["Cold Chain Delivery", "จัดส่งยาตามแผนการรักษา โดยควบคุมมาตรฐานการจัดส่ง"],
  ["Start & Follow-up", "เริ่มแผนการรักษาและติดตามผลต่อเนื่อง"],
];

const faqs = [
  ["ผลข้างเคียงที่พบบ่อยมีอะไรบ้าง?", "อาจพบอาการทางระบบทางเดินอาหาร เช่น คลื่นไส้ อาเจียน ท้องผูก ท้องเสีย หรือท้องอืด โดยอาการและความรุนแรงแตกต่างกันในแต่ละบุคคล หากมีอาการมาก ผิดปกติ หรือกังวล ควรติดต่อทีมดูแล/แพทย์"],
  ["ใครบ้างที่ควรแจ้งแพทย์ก่อนเริ่ม?", "ควรแจ้งประวัติโรคประจำตัว ยาที่ใช้อยู่ การตั้งครรภ์/วางแผนตั้งครรภ์ ผู้ป่วยที่รับประทานยาโรคเบาหวาน หรือทานยาอื่นร่วมด้วย รวมถึงประวัติทางการแพทย์ที่เกี่ยวข้อง เพื่อให้แพทย์ประเมินความเหมาะสมก่อนเริ่ม"],
  ["ใช้ร่วมกับยาอื่นได้ไหม?", "ควรแจ้งยาและอาหารเสริมทั้งหมดที่ใช้อยู่ก่อนเริ่ม เพื่อให้แพทย์ประเมินการใช้ร่วมกันและความเสี่ยงเฉพาะบุคคล"],
];

export default function Home() {
  return (
    <main className="landing-site">
      <header className="site-header">
        <div className="brand-lockup">
          <a className="brand" href="#top" aria-label="Program Resize หน้าแรก">
            <Image src="/program-resize-logo.png" alt="Program Resize by The Ritz" width={1580} height={720} priority />
          </a>
          <span className="brand-divider" aria-hidden="true" />
          <Image className="ritz-brand" src="/the-ritz-clinic-logo.png" alt="The Ritz Clinic" width={1506} height={551} priority />
        </div>
        <nav className="desktop-nav" aria-label="เมนูหลัก">
          <a href="#program">โปรแกรม</a>
          <a href="#steps">ขั้นตอน</a>
          <a href="#faq">คำถามที่พบบ่อย</a>
        </nav>
        <div className="header-actions"><a href="/login">เข้าสู่ระบบ</a><a className="register-button" href="/register">ลงทะเบียน</a></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">MEDICAL WEIGHT MANAGEMENT</p>
          <h1>Resize ใกล้คุณ<span>ดูแลสะดวกขึ้น</span></h1>
          <p className="hero-lead">Resize by THE RITZ โปรแกรมดูแลน้ำหนักภายใต้การประเมินของแพทย์ พร้อมทางเลือกการใช้ยาควบคุมน้ำหนักตามความเหมาะสมของแต่ละบุคคล</p>
          <div className="hero-actions">
            <a className="button" href="/register">ลงทะเบียนรับคำปรึกษา</a>
            <a className="text-link" href="#program">ดูรายละเอียดโปรแกรม <span aria-hidden="true">→</span></a>
          </div>
          <ul className="trust-list" aria-label="จุดเด่นของบริการ">
            <li><span aria-hidden="true">✓</span> ประเมินโดยแพทย์</li>
            <li><span aria-hidden="true">✓</span> ติดตามผลต่อเนื่อง</li>
            <li><span aria-hidden="true">✓</span> ดูแลข้อมูลเป็นส่วนตัว</li>
          </ul>
        </div>
        <div className="hero-visual">
          <div className="hero-image-frame">
            <Image src="/hero-weight-management-couple-v3.png" alt="ชายและหญิงสุขภาพดีในชุดออกกำลังกายพร้อมเสื่อโยคะและสายวัดรอบเอว" fill sizes="(max-width: 900px) 100vw, 46vw" priority />
          </div>
          <div className="doctor-note">
            <span className="doctor-dot" aria-hidden="true">+</span>
            <p><strong>ไม่ใช่แค่การคุมอาหาร</strong> แต่คือการดูแลแบบองค์รวม</p>
          </div>
          <div className="soft-orb orb-one" /><div className="soft-orb orb-two" />
        </div>
      </section>

      <section className="proof-strip" aria-label="ภาพรวมโปรแกรม">
        <div><strong>เฉพาะบุคคล</strong><span>แผนดูแลตามผลประเมิน</span></div>
        <div><strong>ทุกขั้นตอน</strong><span>มีทีมดูแลและติดตามผล</span></div>
        <div><strong>ง่ายและเป็นส่วนตัว</strong><span>เริ่มต้นด้วยการประเมินออนไลน์</span></div>
      </section>

      <DoctorVideo />

      <section className="program-section section-pad" id="program">
        <div className="section-heading">
          <p className="eyebrow">PROGRAM RESIZE</p>
          <h2>Resize by THE RITZ<br /><span>ดูแลน้ำหนักในแบบที่เหมาะกับคุณ</span></h2>
          <p>สำหรับผู้ที่ไม่สะดวกเดินทางมาคลินิก สามารถเลือกปรึกษาแพทย์ออนไลน์ พร้อมทางเลือก Resize at Home</p>
        </div>
        <div className="program-grid">
          {programItems.map((item) => (
            <article className="program-feature" key={item.number}>
              <div className="program-feature-heading">
                <span className="program-number" aria-hidden="true">{item.number}</span>
                <h3>{item.title}</h3>
              </div>
              <div className="program-photo">
                <Image src={item.image} alt={item.alt} fill sizes="(max-width: 900px) 100vw, 33vw" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="services-section section-pad" aria-labelledby="services-title">
        <div className="section-heading services-heading">
          <p className="eyebrow">WHAT YOU RECEIVE</p>
          <h2 id="services-title">ปรึกษาปัญหาลดน้ำหนักกับแพทย์ผู้ชำนาญการ<br />ได้ง่ายๆ ได้ทุกที่</h2>
          <p>ง่าย สะดวก รวดเร็ว ได้มาตรฐาน มีแพทย์คอยให้คำปรึกษาแบบส่วนตัว</p>
        </div>
        <div className="service-grid">
          {serviceItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <article className="service-card" key={item.title}>
                <div className="service-card-top"><span className="service-icon" aria-hidden="true"><Icon /></span><span>0{index + 1}</span></div>
                <h3>{item.title}</h3><p>{item.text}</p>
              </article>
            );
          })}
        </div>
        <aside className="safety-callout" aria-label="หลักการใช้ยาอย่างปลอดภัย">
          <span className="safety-mark" aria-hidden="true">✓</span>
          <div>
            <p className="eyebrow">MEDICAL SAFETY FIRST</p>
            <h3>ทุกแผนของ Resize เริ่มจากการประเมินความเหมาะสมโดยแพทย์</h3>
          </div>
        </aside>
      </section>

      <section className="clinical-section section-pad" id="medical-care">
        <div className="clinical-image-wrap">
          <Image src="/clinical-doctor-care.webp" alt="ผู้รับบริการและแพทย์ THE RITZ CLINIC ดูแลโดยแพทย์อย่างใกล้ชิดและปรับแผนให้เหมาะกับแต่ละบุคคล ผลลัพธ์ขึ้นอยู่กับแต่ละบุคคล" fill sizes="(max-width: 900px) 100vw, 46vw" />
        </div>
        <div className="clinical-copy">
          <p className="eyebrow">WHY MEDICAL CARE</p>
          <h2>เพราะน้ำหนักไม่ได้ขึ้นอยู่กับ<br />“ความพยายาม” เพียงอย่างเดียว</h2>
          <p className="large-copy">การดูแลน้ำหนักด้วยยาไม่ได้เหมาะกับทุกคน แพทย์จึงต้องประเมินข้อมูลสุขภาพ ประวัติการใช้ยา เป้าหมาย และปัจจัยที่เกี่ยวข้องก่อนเริ่ม</p>
          <ul className="check-panel">
            <li><span aria-hidden="true">✓</span><strong>ประเมินความเหมาะสมก่อนเริ่ม</strong></li>
            <li><span aria-hidden="true">✓</span><strong>พิจารณาทางเลือกและแผนเฉพาะบุคคล</strong></li>
            <li><span aria-hidden="true">✓</span><strong>ติดตามผลและอาการระหว่างการดูแล</strong></li>
            <li><span aria-hidden="true">✓</span><strong>ปรับแผนตามความเหมาะสม</strong></li>
          </ul>
          <a className="text-link" href="/register">ลงทะเบียนรับคำปรึกษา <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="steps-section section-pad" id="steps">
        <div className="section-heading narrow">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>Resize by THE RITZ Home<br /><span>สะดวกตั้งแต่เริ่มต้น จนถึงการติดตามผล</span></h2>
        </div>
        <div className="steps-grid">
          {steps.map(([title, text], index) => (
            <article className="step-card" key={title}>
              <div className="step-index">{index + 1}</div><h3>{title}</h3>{text && <p>{text}</p>}
              {index < steps.length - 1 && <span className="step-arrow" aria-hidden="true">→</span>}
            </article>
          ))}
        </div>
        <div className="center-action"><a className="button" href="/register">ลงทะเบียนรับคำปรึกษา</a></div>
      </section>

      <section className="principles-section section-pad">
        <div className="principles-copy">
          <p className="eyebrow light">OUR APPROACH</p><h2>เป้าหมายไม่ใช่แค่ “ลด”<br />แต่คือดูแลให้ไปต่อได้</h2>
          <p>เราไม่ใช้แผนเดียวกับทุกคน และไม่กดดันให้คุณสมบูรณ์แบบ แต่ช่วยออกแบบการเปลี่ยนแปลงเล็ก ๆ ที่เหมาะกับชีวิตจริง</p>
          <p>พร้อมออกแบบรูปแบบการดูแลให้เหมาะกับสุขภาพ เป้าหมาย และ Lifestyle ของคุณ</p>
        </div>
        <div className="principles-list">
          <article><span>ก</span><div><strong>กาย</strong><p>ดูแลปัจจัยสุขภาพ ความหิว และพลังงาน</p></div></article>
          <article><span>ใจ</span><div><strong>ความคิด</strong><p>ลดความรู้สึกผิด และสร้างความสัมพันธ์ที่ดีกับอาหาร</p></div></article>
          <article><span>วัน</span><div><strong>ชีวิตประจำวัน</strong><p>เลือกพฤติกรรมที่ทำซ้ำได้ ไม่ใช่แค่ทำได้ชั่วคราว</p></div></article>
        </div>
      </section>

      <CustomerReviews />

      <section className="faq-section section-pad" id="faq">
        <div className="faq-intro">
          <p className="eyebrow">QUESTIONS, ANSWERED</p><h2>คำถามที่พบบ่อย</h2>
          <p>หากยังไม่แน่ใจ อ่านคำตอบเกี่ยวกับความเหมาะสม ขั้นตอน และความปลอดภัยก่อนตัดสินใจเริ่มโปรแกรมได้</p>
          <a className="text-link" href="/register">ลงทะเบียน <span aria-hidden="true">→</span></a>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <article key={question}><h3>{question}</h3><p>{answer}</p></article>
          ))}
        </div>
      </section>

      <section className="registration-section" id="registration">
        <div className="registration-copy">
          <p className="eyebrow light">GET STARTED</p>
          <h2>เริ่ม Resize by THE RITZ at Home ด้วยการปรึกษาแพทย์ออนไลน์</h2>
          <p>ลงทะเบียนเพื่อจองคิวปรึกษาแพทย์ผู้ชำนาญการ</p>
        </div>
        <RegistrationCta />
      </section>

      <footer>
        <div className="footer-brand">
          <Image src="/program-resize-logo.png" alt="Program Resize by The Ritz" width={1580} height={720} />
          <p>โปรแกรมดูแลน้ำหนักเฉพาะบุคคล ภายใต้การประเมินและติดตามผลโดยทีมแพทย์</p>
        </div>
        <div className="footer-links"><a href="#program">โปรแกรม</a><a href="#steps">ขั้นตอน</a><a href="#faq">คำถามที่พบบ่อย</a><a href="/register">ลงทะเบียน</a></div>
        <div className="footer-bottom">
          <p>© 2026 Program Resize by The Ritz</p>
          <p>ข้อมูลบนเว็บไซต์นี้ไม่ใช่คำวินิจฉัยหรือคำแนะนำทางการแพทย์เฉพาะบุคคล ผลลัพธ์และความเหมาะสมแตกต่างกันไปในแต่ละบุคคล</p>
          <p className="photo-credit">ภาพประกอบ: <a href="https://www.pexels.com/photo/woman-posing-with-bowl-of-lettuce-8845645/" target="_blank" rel="noreferrer">Yaroslav Shuraev</a> และ <a href="https://www.pexels.com/photo/a-woman-in-white-lab-coat-smiling-while-typing-on-laptop-8376280/" target="_blank" rel="noreferrer">Tima Miroshnichenko</a> / Pexels</p>
          <p className="medical-reference">ข้อมูลความปลอดภัยเพิ่มเติม: <a href="https://www.fda.moph.go.th/news/news802569" target="_blank" rel="noreferrer">สำนักงานคณะกรรมการอาหารและยา</a> · <a href="https://tmc.or.th/index.php/News/News-and-Activities/Telemedicine" target="_blank" rel="noreferrer">แนวทางการแพทย์ทางไกลของแพทยสภา</a></p>
        </div>
      </footer>
      <a className="mobile-sticky-cta" href="/register">ลงทะเบียนรับคำปรึกษา</a>
    </main>
  );
}
