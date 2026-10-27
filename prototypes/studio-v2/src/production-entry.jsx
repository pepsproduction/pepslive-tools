import React from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import {
  Director,
  HeroAtmosphere,
  HeroStudio,
  MoodControls,
  useHeroExperience,
} from "./ExperienceComponents";
import { Icon, useMotionPreference } from "./runtime";
import "@fontsource/prompt/400.css";
import "@fontsource/prompt/500.css";
import "@fontsource/prompt/600.css";
import "@fontsource/prompt/700.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./styles.css";

window.PEPS_STUDIO_MEDIA_BASE ??= new URL(
  "assets/studio-v2/media/",
  document.baseURI,
).toString();

function ProductionExperience() {
  const [motion, setMotion] = useMotionPreference();
  const hero = useHeroExperience(motion);
  const slot = (id) => document.getElementById(id);

  return (
    <>
      {createPortal(
        <HeroAtmosphere {...hero} />,
        slot("hero-atmosphere-mount"),
      )}
      {createPortal(
        <HeroStudio {...hero} sceneRef={hero.ref} />,
        slot("hero-studio-mount"),
      )}
      {createPortal(<MoodControls {...hero} />, slot("hero-controls-mount"))}
      {createPortal(
        <button
          className="motion-control icon-button"
          onClick={() => setMotion(!motion)}
          aria-label={motion ? "หยุดการเคลื่อนไหว" : "เปิดการเคลื่อนไหว"}
          title={motion ? "หยุดการเคลื่อนไหว" : "เปิดการเคลื่อนไหว"}
        >
          <Icon name={motion ? "pause" : "play"} size={15} />
        </button>,
        slot("motion-control-mount"),
      )}
      {createPortal(<Director motion={motion} />, slot("director-mount"))}
    </>
  );
}

const mount = document.getElementById("production-experience-root");
if (mount) createRoot(mount).render(<ProductionExperience />);
