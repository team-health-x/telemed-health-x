import Image from "next/image";
import {
  ClipboardCheck,
  Lightbulb,
  RefreshCw,
  SlidersHorizontal,
  Stethoscope,
  TrendingUp,
  Video,
} from "lucide-react";
import RegistrationCta from "./registration-cta";

const programItems = [
  { number: "01", icon: ClipboardCheck, title: "ประเมินโดยแพทย์", text: "ทบทวนประวัติสุขภาพ เป้าหมาย และปัจจัยที่เกี่ยวข้อง เพื่อดูว่าแนวทางใดเหมาะกับคุณ", tag: "เริ่มจากสุขภาพของคุณ" },
  { number: "02", icon: SlidersHorizontal, title: "แผนดูแลเฉพาะบุคคล", text: "ออกแบบแนวทางตามผลประเมิน ทั้งการรักษา โภชนาการ และกิจวัตรที่ทำได้จริง", tag: "เหมาะกับชีวิตประจำวัน" },
  { number: "03", icon: TrendingUp, title: "ติดตามผลเป็นระยะ", text: "มีทีมดูแลคอยติดตามความคืบหน้าและปรับแผนตามการตอบสนองของร่างกาย", tag: "ปรับแผนตามผลลัพธ์" },
  { number: "04", icon: Lightbulb, title: "ความรู้เพื่อไปต่อได้", text: "เข้าใจสัญญาณความหิว การเลือกอาหาร และวิธีสร้างนิสัยที่ช่วยดูแลน้ำหนักระยะยาว", tag: "สร้างนิสัยที่ยั่งยืน" },
];

const serviceItems = [
  { icon: Stethoscope, title: "ประเมินและวางแผนโดยแพทย์", text: "ทบทวนสุขภาพ เป้าหมาย ข้อบ่งใช้ และข้อควรระวัง ก่อนออกแบบแนวทางที่เหมาะกับคุณ" },
  { icon: Video, title: "ปรึกษาทางไกลอย่างเป็นส่วนตัว", text: "นัดหมายพูดคุยกับทีมดูแลได้สะดวก โดยแพทย์จะพิจารณาว่ากรณีใดเหมาะกับการปรึกษาทางไกล" },
  { icon: RefreshCw, title: "ติดตามผลและปรับแผนต่อเนื่อง", text: "ติดตามความคืบหน้า อาการไม่พึงประสงค์ และปรับแผนตามการตอบสนองของร่างกาย" },
];

const steps = [
  ["ทำแบบประเมิน", "ตอบคำถามสุขภาพและเป้าหมายเบื้องต้น ใช้เวลาประมาณ 3–5 นาที"],
  ["คุยกับทีมดูแล", "เจ้าหน้าที่ติดต่อกลับเพื่อนัดหมายและอธิบายขั้นตอนอย่างเป็นส่วนตัว"],
  ["พบแพทย์", "แพทย์ประเมินความเหมาะสมและร่วมวางแผนดูแลที่เหมาะกับคุณ"],
  ["เริ่มและติดตามผล", "เริ่มโปรแกรมพร้อมนัดติดตาม เพื่อดูผลลัพธ์และปรับแผนเมื่อจำเป็น"],
];

const faqs = [
  ["โปรแกรมนี้เหมาะกับใคร?", "เหมาะสำหรับผู้ใหญ่ที่ต้องการดูแลน้ำหนักอย่างเป็นระบบ และพร้อมให้แพทย์ประเมินประวัติสุขภาพก่อนเริ่ม ทั้งนี้ความเหมาะสมขึ้นอยู่กับดุลยพินิจของแพทย์เป็นรายบุคคล"],
  ["จำเป็นต้องใช้ยาหรือปากกาลดน้ำหนักทุกคนไหม?", "ไม่จำเป็น แพทย์จะพิจารณาจากประวัติสุขภาพ ผลประเมิน และข้อบ่งใช้ของแต่ละคน หากไม่เหมาะสม ทีมดูแลจะแนะนำทางเลือกอื่น โดยจะไม่มีการจ่ายยาก่อนการประเมินจากแพทย์"],
  ["จะรู้ได้อย่างไรว่าฉันเหมาะกับโปรแกรม?", "เริ่มจากศึกษารายละเอียดและลงทะเบียนให้ทีมดูแลติดต่อกลับ จากนั้นจึงเข้าสู่ขั้นตอนนัดหมายและประเมินโดยแพทย์ หากมีข้อจำกัดหรือความเสี่ยง แพทย์จะอธิบายให้ทราบก่อนตัดสินใจทุกครั้ง"],
  ["ผลลัพธ์ใช้เวลานานเท่าไร?", "แต่ละคนตอบสนองแตกต่างกันตามสุขภาพ จุดเริ่มต้น และการปฏิบัติตามแผน โปรแกรมจึงเน้นเป้าหมายที่เหมาะสมและการติดตามผล มากกว่าการรับประกันตัวเลขหรือตารางเวลาตายตัว"],
  ["ค่าใช้จ่ายเท่าไร?", "ค่าใช้จ่ายขึ้นอยู่กับแผนที่แพทย์เห็นว่าเหมาะสม หลังประเมินแล้วทีมดูแลจะแจ้งรายละเอียดอย่างชัดเจนก่อนเริ่ม โดยคุณสามารถตัดสินใจได้โดยไม่มีข้อผูกมัด"],
  ["ปรึกษาทางไกลได้ทุกกรณีไหม?", "ขึ้นอยู่กับความเหมาะสมของแต่ละคน บางกรณีแพทย์อาจแนะนำให้ตรวจร่างกาย ตรวจทางห้องปฏิบัติการ หรือเข้ารับบริการที่สถานพยาบาลก่อนเริ่มแผน"],
  ["หากแพทย์เห็นว่าเหมาะสม จะรับยาอย่างไร?", "ทีมดูแลจะแจ้งชื่อยา วิธีใช้ ข้อควรระวัง ค่าใช้จ่าย และช่องทางรับยาที่ถูกต้องหลังแพทย์ประเมิน ไม่ควรซื้อปากกาลดน้ำหนักหรือปรับขนาดยาด้วยตนเองผ่านช่องทางออนไลน์"],
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
        <div className="header-actions"><a className="register-button" href="/register">ลงทะเบียน</a></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">MEDICAL WEIGHT MANAGEMENT</p>
          <h1>ลดน้ำหนักอย่างเข้าใจร่างกาย<span>ด้วยแผนที่ออกแบบเพื่อคุณ</span></h1>
          <p className="hero-lead">โปรแกรมดูแลน้ำหนักภายใต้การประเมินของแพทย์ ครบทั้งการติดตามผล โภชนาการ และการปรับพฤติกรรม เพื่อเป้าหมายที่ยั่งยืนกว่าเดิม</p>
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

      <section className="program-section section-pad" id="program">
        <div className="section-heading">
          <p className="eyebrow">PROGRAM RESIZE</p>
          <h2>ให้การลดน้ำหนักครั้งนี้<br />เป็นครั้งที่คุณรู้สึกว่า “ทำได้จริง”</h2>
          <p>เราผสานการดูแลทางการแพทย์เข้ากับคำแนะนำที่นำไปใช้ได้ในชีวิตประจำวัน เพื่อช่วยให้คุณเริ่มต้นอย่างมั่นใจและไปต่อได้ด้วยวิธีที่เหมาะกับตัวเอง</p>
        </div>
        <div className="program-grid">
          {programItems.map((item) => {
            const Icon = item.icon;
            return (
              <article className="program-card" key={item.number}>
                <div className="program-card-top">
                  <span className="card-number">{item.number}</span>
                  <span className="program-icon" aria-hidden="true"><Icon /></span>
                </div>
                <h3>{item.title}</h3><p>{item.text}</p>
                <span className="program-tag"><span aria-hidden="true">✓</span>{item.tag}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="services-section section-pad" aria-labelledby="services-title">
        <div className="section-heading services-heading">
          <p className="eyebrow">WHAT YOU RECEIVE</p>
          <h2 id="services-title">บริการหลักที่ดูแลคุณ<br />ตั้งแต่เริ่มต้นจนติดตามผล</h2>
          <p>ครบทั้งการประเมินโดยแพทย์ การปรึกษาที่เข้าถึงง่าย และการติดตามอย่างต่อเนื่องในเส้นทางเดียว</p>
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
            <h3>โปรแกรมที่ดีเริ่มจาก “ความเหมาะสม” ไม่ใช่การขายยา</h3>
            <p>หากมีการใช้ปากกาลดน้ำหนัก แพทย์จะเป็นผู้ประเมิน สั่งใช้ และติดตามผลเป็นรายบุคคล พร้อมอธิบายทางเลือกและข้อควรระวังก่อนตัดสินใจ</p>
          </div>
          <ul><li>ไม่มีการจ่ายยาก่อนแพทย์ประเมิน</li><li>แจ้งรายละเอียดแผนและค่าใช้จ่ายก่อนเริ่ม</li><li>ติดตามอาการและปรับแผนเมื่อจำเป็น</li></ul>
        </aside>
      </section>

      <section className="clinical-section section-pad">
        <div className="clinical-image-wrap">
          <Image src="/doctor-telehealth.jpg" alt="แพทย์ให้คำปรึกษาผ่านวิดีโอคอล" fill sizes="(max-width: 900px) 100vw, 46vw" />
          <div className="image-caption"><strong>ดูแลโดยทีมวิชาชีพ</strong><span>ตั้งแต่การประเมินจนถึงการติดตามผล</span></div>
        </div>
        <div className="clinical-copy">
          <p className="eyebrow">WHY MEDICAL CARE</p>
          <h2>เพราะน้ำหนักไม่ได้ขึ้นอยู่กับ<br />“ความพยายาม” เพียงอย่างเดียว</h2>
          <p className="large-copy">การนอน ฮอร์โมน ความเครียด ยาบางชนิด และพันธุกรรม ล้วนมีผลต่อความหิวและการใช้พลังงานของร่างกาย การประเมินที่รอบด้านจึงช่วยให้เราเห็นภาพมากกว่าตัวเลขบนตาชั่ง</p>
          <ul className="check-panel">
            <li><span>✓</span><div><strong>เข้าใจจุดเริ่มต้น</strong><p>ทบทวนสุขภาพ พฤติกรรม และเป้าหมายของคุณ</p></div></li>
            <li><span>✓</span><div><strong>เลือกแนวทางอย่างปลอดภัย</strong><p>พิจารณาข้อบ่งใช้ ข้อควรระวัง และทางเลือกที่เหมาะสม</p></div></li>
            <li><span>✓</span><div><strong>ติดตามการตอบสนอง</strong><p>ประเมินผลข้างเคียง ความคืบหน้า และปรับแผนเมื่อจำเป็น</p></div></li>
          </ul>
          <a className="text-link" href="/register">ลงทะเบียนรับคำปรึกษา <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="steps-section section-pad" id="steps">
        <div className="section-heading narrow">
          <p className="eyebrow">HOW IT WORKS</p><h2>จากเริ่มต้นจนถึงติดตามผล<br />ครบในเส้นทางเดียว</h2><p>กระบวนการ 4 ขั้นตอนที่เรียบง่าย เป็นส่วนตัว และมีทีมดูแลคุณตลอดเส้นทาง</p>
        </div>
        <div className="steps-grid">
          {steps.map(([title, text], index) => (
            <article className="step-card" key={title}>
              <div className="step-index">{index + 1}</div><h3>{title}</h3><p>{text}</p>
              {index < steps.length - 1 && <span className="step-arrow" aria-hidden="true">→</span>}
            </article>
          ))}
        </div>
        <div className="center-action"><a className="button" href="/register">ลงทะเบียนรับคำปรึกษา</a><p>ฝากชื่อและเบอร์โทร แล้วทีมดูแลจะติดต่อกลับ</p></div>
      </section>

      <section className="principles-section section-pad">
        <div className="principles-copy">
          <p className="eyebrow light">OUR APPROACH</p><h2>เป้าหมายไม่ใช่แค่ “ลด”<br />แต่คือดูแลให้ไปต่อได้</h2>
          <p>เราไม่ใช้แผนเดียวกับทุกคน และไม่กดดันให้คุณสมบูรณ์แบบ แต่ช่วยออกแบบการเปลี่ยนแปลงเล็ก ๆ ที่เหมาะกับชีวิตจริง</p>
        </div>
        <div className="principles-list">
          <article><span>ก</span><div><strong>กาย</strong><p>ดูแลปัจจัยสุขภาพ ความหิว และพลังงาน</p></div></article>
          <article><span>ใจ</span><div><strong>ความคิด</strong><p>ลดความรู้สึกผิด และสร้างความสัมพันธ์ที่ดีกับอาหาร</p></div></article>
          <article><span>วัน</span><div><strong>ชีวิตประจำวัน</strong><p>เลือกพฤติกรรมที่ทำซ้ำได้ ไม่ใช่แค่ทำได้ชั่วคราว</p></div></article>
        </div>
      </section>

      <section className="faq-section section-pad" id="faq">
        <div className="faq-intro">
          <p className="eyebrow">QUESTIONS, ANSWERED</p><h2>คำถามที่พบบ่อย</h2>
          <p>หากยังไม่แน่ใจ อ่านคำตอบเกี่ยวกับความเหมาะสม ขั้นตอน และความปลอดภัยก่อนตัดสินใจเริ่มโปรแกรมได้</p>
          <a className="text-link" href="/register">ลงทะเบียน <span aria-hidden="true">→</span></a>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>
          ))}
        </div>
      </section>

      <section className="registration-section" id="registration">
        <div className="registration-copy">
          <p className="eyebrow light">GET STARTED</p><h2>เริ่มต้นง่าย ๆ<br />ให้ทีมดูแลติดต่อกลับ</h2>
          <p>กรอกข้อมูลติดต่อเพียงเล็กน้อย ทีมดูแลจะโทรกลับเพื่ออธิบายโปรแกรม ตอบคำถาม และช่วยนัดหมายขั้นตอนถัดไป โดยยังไม่มีข้อผูกมัด</p>
          <div className="registration-points"><span>✓ ใช้เวลาไม่ถึง 1 นาที</span><span>✓ ไม่มีค่าใช้จ่ายในการลงทะเบียน</span><span>✓ ดูแลข้อมูลอย่างเหมาะสม</span></div>
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
