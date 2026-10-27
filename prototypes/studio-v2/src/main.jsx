import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/prompt/400.css";
import "@fontsource/prompt/500.css";
import "@fontsource/prompt/600.css";
import "@fontsource/prompt/700.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import { Icon, media, useMotionPreference } from "./runtime";
import { Hero, Director } from "./ExperienceComponents";
import content from "./content.json";
import "./styles.css";

const workImages = [
  "junior.jpg",
  "junior-two.jpg",
  "culture.jpg",
  "u17.jpg",
  "u14.jpg",
];
const phases = [
  [
    "01",
    "ภาพหลักที่จำได้",
    "วางหน้าแบบ editorial ใช้ฉากสตูดิโอที่มีมิติ พร้อมลำดับการอ่านและปุ่มสำคัญบน Desktop / Mobile",
  ],
  [
    "02",
    "แสง กระจก และฉากเดียวกัน",
    "ต่อ R3F, Shader Gradient และ Liquid Glass JS เข้าด้วยกัน ให้การเลือกบรรยากาศเปลี่ยนภาพทั้งชุด",
  ],
  [
    "03",
    "ลองกำกับภาพได้จริง",
    "เปลี่ยนกล้องในสนามจำลอง เปิด–ปิดสกอร์ และเล่นเหตุการณ์เดิมซ้ำแบบช้า",
  ],
  [
    "04",
    "เล่าเรื่องด้วยผลงานจริง",
    "ใช้ภาพ ชื่องาน และลิงก์จากเว็บไซต์เดิม พร้อมตัวกรองและรายละเอียดผลงาน",
  ],
  [
    "05",
    "คุณภาพที่ใช้งานได้",
    "ตรวจการโหลด ปุ่ม จอแคบ คีย์บอร์ด และลดการเคลื่อนไหว พร้อมพัก canvas ที่พ้นจอ",
  ],
  [
    "06",
    "ประกอบเข้าระบบเดิม",
    "หลังตรวจรับต้นแบบ จึงเชื่อมปฏิทิน รายการสด และ analytics เดิม ก่อนตรวจเว็บจริงและเผยแพร่",
  ],
];

function Modal({ children, label, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const node = dialog.current;
    node.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      previous?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-label={label}
      className="modal"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <button
        className="icon-button modal-close"
        aria-label="ปิดหน้าต่าง"
        onClick={onClose}
      >
        <Icon name="close" />
      </button>
      {children}
    </dialog>
  );
}

function Header({ motion, setMotion }) {
  const [menu, setMenu] = useState(false);
  return (
    <header className="header">
      <a className="brand" href="#home" aria-label="PepsProduction หน้าแรก">
        <img
          src={media("brand.png")}
          width="160"
          height="51"
          alt="PepsProduction"
        />
        <span>LIVE · SPORT · PRODUCTION</span>
      </a>
      <nav
        className={menu ? "navigation is-open" : "navigation"}
        id="main-nav"
        aria-label="เมนูหลัก"
      >
        <a href="#experience" onClick={() => setMenu(false)}>
          ประสบการณ์
        </a>
        <a href="#works" onClick={() => setMenu(false)}>
          ผลงาน
        </a>
        <a href="#tools" onClick={() => setMenu(false)}>
          PepsLive Tools
        </a>
      </nav>
      <div className="header-actions">
        <button
          className="motion-control icon-button"
          onClick={() => setMotion(!motion)}
          aria-label={motion ? "หยุดการเคลื่อนไหว" : "เปิดการเคลื่อนไหว"}
          title={motion ? "หยุดการเคลื่อนไหว" : "เปิดการเคลื่อนไหว"}
        >
          <Icon name={motion ? "pause" : "play"} size={15} />
        </button>
        <a href="#contact" className="contact-top">
          คุยเรื่องงาน <Icon name="diagonal" size={17} />
        </a>
        <button
          className="menu-button icon-button"
          aria-label="เปิดหรือปิดเมนู"
          aria-expanded={menu}
          aria-controls="main-nav"
          onClick={() => setMenu(!menu)}
        >
          <Icon name={menu ? "close" : "menu"} />
        </button>
      </div>
    </header>
  );
}

function Works() {
  const [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState(null);
  const works = content.portfolio.map((work, index) => ({
    ...work,
    image: workImages[index],
    type: index === 2 ? "event" : "sport",
    index,
  }));
  const shown = works.filter(
    (work) => filter === "all" || work.type === filter,
  );
  return (
    <section
      className="works section-shell"
      id="works"
      aria-labelledby="works-heading"
    >
      <div className="section-heading">
        <span className="section-number">02 / SELECTED WORK</span>
        <p>ภาพจริง เรื่องราวจริง</p>
      </div>
      <div className="works-heading">
        <h2 id="works-heading">
          เราอยู่ตรงนั้น.
          <br />
          <span>เพื่อเก็บทุกเรื่องราว.</span>
        </h2>
        <div className="work-filters" role="group" aria-label="กรองผลงาน">
          {[
            ["all", "ทั้งหมด"],
            ["sport", "กีฬา"],
            ["event", "อีเวนต์"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="work-grid">
        {shown.map((work, i) => (
          <button
            key={work.url}
            className={`work-card ${i === 0 ? "work-featured" : ""}`}
            onClick={() => setSelected(work)}
            aria-label={`ดูผลงาน ${work.title}`}
          >
            <div className="work-image">
              <img
                src={media(work.image)}
                alt={work.imageAlt || work.title}
                loading="lazy"
              />
              <span className="work-play">
                <Icon name="play" size={21} />
              </span>
              <span className="work-number">0{work.index + 1}</span>
            </div>
            <div className="work-copy">
              <small>{work.category}</small>
              <h3>{work.title}</h3>
              <span className="work-arrow">
                <Icon name="diagonal" size={20} />
              </span>
            </div>
          </button>
        ))}
      </div>
      {selected && (
        <Modal label={selected.title} onClose={() => setSelected(null)}>
          <img
            className="modal-work-image"
            src={media(selected.image)}
            alt={selected.imageAlt || selected.title}
          />
          <div className="modal-content">
            <p className="eyebrow">{selected.category}</p>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
            <a
              className="button button-primary"
              href={selected.url}
              target="_blank"
              rel="noreferrer"
            >
              รับชมผลงานบน YouTube <Icon name="diagonal" size={18} />
            </a>
          </div>
        </Modal>
      )}
    </section>
  );
}

function Tools() {
  return (
    <section className="tools section-shell" id="tools">
      <div className="tool-art">
        <div className="tool-orbit orbit-one" />
        <div className="tool-orbit orbit-two" />
        <span className="tool-type">
          TOOLS
          <br />
          FOR LIVE.
        </span>
        <img
          src={media("launcher.webp")}
          alt="PepsLive Tool Launcher"
          loading="lazy"
        />
        <span className="tool-art-label">PEPSLIVE ECOSYSTEM / WINDOWS</span>
      </div>
      <div className="tools-copy">
        <p className="section-number">03 / MADE FOR THE CREW</p>
        <h2>
          เบื้องหลังภาพที่ดี
          <br />
          <span>มีเครื่องมือที่เข้าใจงาน.</span>
        </h2>
        <p>
          รวมเครื่องมือ PepsLive ไว้ใน Launcher เดียว
          <br />
          สำหรับคนที่อยู่หลังกล้องและอยู่กับงานถ่ายทอดจริง
        </p>
        <div className="tool-tags">
          <span>Scoreboard</span>
          <span>Replay</span>
          <span>OBS workflow</span>
        </div>
        <a
          className="button button-primary"
          href={content.launcher.downloadUrl}
          target="_blank"
          rel="noreferrer"
        >
          ดาวน์โหลด Launcher <Icon name="diagonal" size={18} />
        </a>
        <small className="version-note">
          Windows · v{content.launcher.version} · {content.launcher.size}
        </small>
        <a
          className="text-link tutorial-link"
          href={content.youtubePlaylist}
          target="_blank"
          rel="noreferrer"
        >
          ดูคลิปแนะนำการใช้งาน <Icon name="arrow" size={16} />
        </a>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className="contact section-shell" id="contact">
      <div className="section-heading">
        <span className="section-number">04 / YOUR NEXT MOMENT</span>
        <span className="contact-kicker">LET'S MAKE IT HAPPEN.</span>
      </div>
      <div className="contact-grid">
        <div>
          <h2>
            งานต่อไปของคุณ
            <br />
            <em>ให้เราอยู่ด้วย.</em>
          </h2>
          <p>
            บอกวัน สถานที่ และภาพงานที่คุณอยากเห็น
            <br />
            แล้วมาวางแผนการถ่ายทอดด้วยกัน
          </p>
          <a
            className="contact-calendar"
            href="https://pepsproduction.com/#schedule"
            target="_blank"
            rel="noreferrer"
          >
            ดูตารางงานที่เผยแพร่บนเว็บไซต์หลัก{" "}
            <Icon name="diagonal" size={16} />
          </a>
        </div>
        <div className="contact-links">
          {content.contactLinks.map((contact) => (
            <a
              key={`${contact.platform}-${contact.url}`}
              href={contact.url}
              target={contact.url.startsWith("https:") ? "_blank" : undefined}
              rel={contact.url.startsWith("https:") ? "noopener noreferrer" : undefined}
              aria-label={`${contact.label}: ${contact.name}`}
            >
              <span><small>{contact.label}</small><strong>{contact.name}</strong></span>
              <Icon name={contact.platform === "phone" ? "phone" : "diagonal"} size={25} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function App() {
  const [motion, setMotion] = useMotionPreference(),
    [showPlan, setShowPlan] = useState(false);
  return (
    <div className={`app ${motion ? "" : "motion-reduced"}`}>
      <a className="skip-link" href="#experience">
        ข้ามไปยังเนื้อหา
      </a>
      <Header motion={motion} setMotion={setMotion} />
      <main>
        <Hero motion={motion} />
        <div className="capability-strip" aria-label="งานของเรา">
          <span>MULTICAM PRODUCTION</span>
          <i>✳</i>
          <span>LIVE GRAPHICS</span>
          <i>✳</i>
          <span>INSTANT REPLAY</span>
          <i>✳</i>
          <span>EVERY MOMENT MATTERS</span>
        </div>
        <Director motion={motion} />
        <Works />
        <Tools />
        <Contact />
      </main>
      <footer className="footer section-shell">
        <div>
          <img
            src={media("brand.png")}
            width="128"
            height="41"
            alt="PepsProduction"
          />
          <span>LIVE IN EVERY MOMENT.</span>
        </div>
        <button onClick={() => setShowPlan(true)}>
          ต้นแบบ 02 · ดูแผนพัฒนา <Icon name="diagonal" size={14} />
        </button>
      </footer>
      {showPlan && (
        <Modal label="แผนพัฒนาเว็บไซต์ใหม่" onClose={() => setShowPlan(false)}>
          <div className="modal-content plan-content">
            <p className="eyebrow">PEPSPRODUCTION / DESIGN STUDY 02</p>
            <h2>
              จากภาพสวย
              <br />
              สู่ประสบการณ์ที่ลองได้.
            </h2>
            <div className="phase-list">
              {phases.map(([number, title, description]) => (
                <article key={number}>
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="plan-disclosure">
              ต้นแบบใช้ React Three Fiber + @shadergradient/react และ shader ของ
              dashersw/liquid-glass-js ผ่านตัวเชื่อม canvas สด ส่วนสนาม คะแนน
              และรีเพลย์เป็นเหตุการณ์จำลอง
              ผลงานและช่องทางติดต่ออ้างอิงข้อมูลเว็บไซต์เดิม
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
