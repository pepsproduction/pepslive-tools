import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Icon, media, SceneBoundary, useVisibility } from "./runtime";
import LiveGlass from "./LiveGlass";

const Studio = lazy(() => import("./Studio"));
const Atmosphere = lazy(() => import("./Atmosphere"));
const MatchScene = lazy(() => import("./MatchScene"));
const modes = [
  { id: "sport", title: "สนามแข่งขัน", icon: "sport" },
  { id: "event", title: "เวทีอีเวนต์", icon: "event" },
  { id: "studio", title: "ห้องควบคุม", icon: "studio" },
];

export function useHeroExperience(motion) {
  const [mode, setMode] = useState("sport");
  const [settings, setSettings] = useState(false);
  const [speed, setSpeed] = useState(0.2),
    [depth, setDepth] = useState(1.2);
  const { ref, visible, entered } = useVisibility("0px");
  return {
    mode,
    setMode,
    settings,
    setSettings,
    speed,
    setSpeed,
    depth,
    setDepth,
    ref,
    visible,
    entered,
    motion,
  };
}

export function HeroAtmosphere({
  mode,
  motion,
  visible,
  entered,
  speed,
  depth,
}) {
  return (
    <>
      <div className="atmosphere" aria-hidden="true">
        <SceneBoundary fallback={null}>
          <Suspense fallback={null}>
            {entered && (
              <Atmosphere
                mode={mode}
                motion={motion}
                visible={visible}
                speed={speed}
                depth={depth}
              />
            )}
          </Suspense>
        </SceneBoundary>
      </div>
      <div className="hero-shade" aria-hidden="true" />
    </>
  );
}

export function HeroStudio({ mode, motion, visible, entered, sceneRef }) {
  const fallback = (
    <img
      className="scene-image-fallback"
      src={media("junior.jpg")}
      alt="ผลงานถ่ายทอดสดฟุตบอลเยาวชน"
    />
  );
  return (
    <>
      <div
        className="studio-scene"
        ref={sceneRef}
        role="img"
        aria-label={`ฉากสามมิติสตูดิโอ PepsProduction บรรยากาศ${modes.find((item) => item.id === mode).title}`}
      >
        <SceneBoundary fallback={fallback}>
          <Suspense
            fallback={
              <div className="scene-loading">
                กำลังจัดแสงในสตูดิโอ
                <span />
              </div>
            }
          >
            {entered && (
              <Studio mode={mode} motion={motion} visible={visible} />
            )}
          </Suspense>
        </SceneBoundary>
      </div>
      <div className="scene-tag">
        <span className="tag-cross">+</span>
        <div>
          BUILT AROUND THE MOMENT<small>ภาพผลงานจริง · ฉากสตูดิโอจำลอง</small>
        </div>
      </div>
    </>
  );
}

export function MoodControls({
  mode,
  setMode,
  settings,
  setSettings,
  speed,
  setSpeed,
  depth,
}) {
  return (
    <div className="mood-container">
      <p className="mood-hint">
        เปลี่ยนบรรยากาศของงาน <span>↘</span>
      </p>
      <div className="mood-bar">
        <LiveGlass depth={depth} />
        <div
          className="mood-buttons"
          role="group"
          aria-label="เลือกบรรยากาศสตูดิโอ"
        >
          {modes.map((item) => (
            <button
              key={item.id}
              aria-pressed={item.id === mode}
              onClick={() => setMode(item.id)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.title}</span>
            </button>
          ))}
        </div>
        <button
          className="mood-settings icon-button"
          aria-label="ปรับแสงและกระจก"
          aria-expanded={settings}
          onClick={() => setSettings(!settings)}
        >
          <Icon name="sun" size={20} />
        </button>
      </div>
      {settings && (
        <div className="mood-popover">
          <div className="popover-title">
            ปรับบรรยากาศ
            <button
              className="icon-button"
              aria-label="ปิดแผงปรับบรรยากาศ"
              onClick={() => setSettings(false)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          <label>
            ความเร็วแสง <output>{speed.toFixed(2)}</output>
            <input
              aria-label="ความเร็วแสง"
              type="range"
              min="0"
              max="0.6"
              step="0.02"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
          </label>
          <label>
            ความหนากระจก <output>{depth.toFixed(1)}</output>
            <input
              aria-label="ความหนากระจก"
              type="range"
              min="0"
              max="2.5"
              step="0.1"
              value={depth}
              onChange={(event) => setDepth(Number(event.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
}

export function Hero({ motion }) {
  const experience = useHeroExperience(motion);
  const { mode, ref, visible, entered, speed, depth, settings, setSettings } =
    experience;
  return (
    <section
      className="hero"
      ref={ref}
      data-mode={mode}
      id="home"
      aria-labelledby="hero-heading"
    >
      <HeroAtmosphere {...experience} />
      <div className="hero-topline">
        <span>
          <i /> IN THE MOMENT. ON THE AIR.
        </span>
        <span>PEPSPRODUCTION — EST. IN THE FIELD</span>
      </div>
      <div className="hero-copy">
        <p className="eyebrow">ทุกเกมมีเรื่องราว</p>
        <h1 id="hero-heading">
          ให้เรา
          <br />
          <em>ถ่ายทอด.</em>
        </h1>
        <p className="hero-description">
          จากจังหวะในสนาม สู่สายตาของคนดู
          <br />
          งานถ่ายทอดสดที่ใส่ใจทุกภาพและทุกเรื่องราว
        </p>
        <div className="hero-actions">
          <a href="#experience" className="button button-primary">
            ลองเป็นผู้กำกับภาพ <Icon name="arrow" size={19} />
          </a>
          <a href="#works" className="text-link">
            ดูผลงานจริง <Icon name="diagonal" size={17} />
          </a>
        </div>
        <div className="hero-footnote">
          <span className="mini-cross">+</span> YOUR MOMENT. OUR PRODUCTION.
        </div>
      </div>
      <HeroStudio
        mode={mode}
        motion={motion}
        visible={visible}
        entered={entered}
        sceneRef={ref}
      />
      <div className="hero-bottom">
        <div className="scroll-cue">
          <span>SCROLL TO EXPLORE</span>
          <span>↓</span>
        </div>
        <MoodControls {...experience} />
        <span className="hero-index">01 — 03</span>
      </div>
    </section>
  );
}
export function Director({ motion }) {
  const { ref, entered, visible } = useVisibility("80px");
  const [angle, setAngle] = useState(0),
    [scoreVisible, setScoreVisible] = useState(true),
    [score, setScore] = useState([1, 0]);
  const [replay, setReplay] = useState(false),
    [playing, setPlaying] = useState(true);
  const timeline = useRef(8);
  const running = motion && playing;
  const names = ["กล้องหลัก", "ข้างสนาม", "มุมสูง"];
  return (
    <section
      className="director section-shell"
      id="experience"
      ref={ref}
      aria-labelledby="experience-heading"
    >
      <div className="section-heading">
        <div className="section-number">01 / THE EXPERIENCE</div>
        <p>จากคนดู สู่คนเลือกภาพ</p>
      </div>
      <div className="director-heading">
        <h2 id="experience-heading">
          จังหวะเดียวกัน.
          <br />
          <span>เล่าได้หลายมุม.</span>
        </h2>
        <div>
          <p>
            ลองเลือกมุมที่คุณอยากให้คนดูเห็น
            <br />
            สลับกล้อง ใส่สกอร์ และย้อนดูจังหวะสำคัญ
          </p>
          <span className="simulation-label">
            <i /> สนามและเหตุการณ์จำลอง
          </span>
        </div>
      </div>
      <div className="director-desk">
        <div className="program-window">
          <div className="program-header">
            <span>
              <i className={replay ? "replay-dot" : ""} />{" "}
              {replay ? "REPLAY / 0.45×" : "PROGRAM / DEMO"}
            </span>
            <span>
              PEPSPRODUCTION <b>↗</b>
            </span>
          </div>
          <div
            className="match-viewport"
            aria-label={`สนามจำลอง มุม${names[angle]}`}
          >
            <SceneBoundary
              fallback={
                <div className="scene-placeholder">
                  เปิดดูผลงานจริงได้ในส่วนถัดไป
                </div>
              }
            >
              <Suspense
                fallback={
                  <div className="scene-loading">
                    กำลังเตรียมสนาม
                    <span />
                  </div>
                }
              >
                {entered && (
                  <MatchScene
                    angle={angle}
                    running={running}
                    replay={replay}
                    onReplayEnd={() => setReplay(false)}
                    visible={visible}
                    timeline={timeline}
                  />
                )}
              </Suspense>
            </SceneBoundary>
            {scoreVisible && (
              <div
                className="scorebug"
                aria-label={`ทีมส้ม ${score[0]} ต่อ ${score[1]} ทีมฟ้า`}
              >
                <span className="team-orange">ทีมส้ม</span>
                <strong>
                  {score[0]} <i>:</i> {score[1]}
                </strong>
                <span className="team-blue">ทีมฟ้า</span>
                <small>DEMO</small>
              </div>
            )}
            <span className="angle-label">
              CAM 0{angle + 1} <i>/</i> {names[angle]}
            </span>
            {!running && <span className="paused-label">หยุดภาพชั่วคราว</span>}
          </div>
          <div className="director-controls">
            <div
              className="camera-buttons"
              role="group"
              aria-label="เลือกมุมกล้อง"
            >
              {names.map((name, index) => (
                <button
                  key={name}
                  aria-pressed={angle === index}
                  onClick={() => setAngle(index)}
                >
                  <small>0{index + 1}</small>
                  {name}
                </button>
              ))}
            </div>
            <button
              className="play-control icon-button"
              aria-label={playing ? "พักการจำลอง" : "เล่นการจำลอง"}
              onClick={() => setPlaying(!playing)}
            >
              <Icon name={playing ? "pause" : "play"} size={16} />
            </button>
          </div>
        </div>
        <aside className="switcher">
          <div className="switcher-title">
            <Icon name="studio" size={19} />
            <span>คุณคือผู้กำกับภาพ</span>
            <span className="tiny-led" />
          </div>
          <div className="switcher-section">
            <small>01 / GRAPHICS</small>
            <button
              className="toggle-control"
              aria-pressed={scoreVisible}
              onClick={() => setScoreVisible(!scoreVisible)}
            >
              กราฟิกสกอร์
              <span className={scoreVisible ? "toggle is-on" : "toggle"} />
            </button>
            <div className="score-controls">
              <button
                onClick={() => setScore(([a, b]) => [Math.min(99, a + 1), b])}
                aria-label="เพิ่มคะแนนทีมส้ม"
              >
                <span className="team-swatch orange" />
                ทีมส้ม
                <Icon name="plus" size={14} />
              </button>
              <button
                onClick={() => setScore(([a, b]) => [a, Math.min(99, b + 1)])}
                aria-label="เพิ่มคะแนนทีมฟ้า"
              >
                <span className="team-swatch blue" />
                ทีมฟ้า
                <Icon name="plus" size={14} />
              </button>
            </div>
          </div>
          <div className="switcher-section">
            <small>02 / INSTANT REPLAY</small>
            <button
              className={`replay-button ${replay ? "is-active" : ""}`}
              disabled={!running}
              aria-pressed={replay}
              onClick={() => setReplay(!replay)}
            >
              <Icon name="replay" size={20} />
              <span>
                {replay ? "กลับสู่ภาพปัจจุบัน" : "ย้อนจังหวะสำคัญ"}
                <small>
                  {replay
                    ? "กำลังเล่นช้า 0.45 เท่า"
                    : "เล่น 6 วินาทีก่อนหน้าแบบช้า"}
                </small>
              </span>
              <span>↗</span>
            </button>
          </div>
          <p className="demo-explanation">
            ลองกดเปลี่ยนมุมด้านล่างจอ
            <br />
            ทุกปุ่มควบคุมฉากที่คุณกำลังเห็น
          </p>
          <button
            className="reset-demo"
            onClick={() => {
              timeline.current = 8;
              setAngle(0);
              setScore([1, 0]);
              setScoreVisible(true);
              setReplay(false);
              setPlaying(true);
            }}
          >
            เริ่มตัวอย่างใหม่ ↺
          </button>
        </aside>
      </div>
      {!motion && (
        <p className="reduced-note">
          โหมดลดการเคลื่อนไหวเปิดอยู่ —
          เปิดการเคลื่อนไหวจากปุ่มเล่นด้านบนเพื่อใช้รีเพลย์
        </p>
      )}
    </section>
  );
}
