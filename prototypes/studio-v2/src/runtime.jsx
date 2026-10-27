import React, { useEffect, useRef, useState } from "react";

export const media = (file) =>
  `${window.PEPS_STUDIO_MEDIA_BASE || `${import.meta.env.BASE_URL}media/`}${file}`;

export function useVisibility(margin = "100px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let inView = false;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) setEntered(true);
        update();
      },
      { rootMargin: margin },
    );
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [margin]);
  return { ref, visible, entered };
}

export function useMotionPreference() {
  const [motion, setMotion] = useState(
    () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotion(!query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return [motion, setMotion];
}

export class SceneBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.warn("Scene fallback:", error.message);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Icon({ name = "arrow", size = 20, ...rest }) {
  const shapes = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    diagonal: <path d="M6 18 18 6M6 6h12v12" />,
    play: <path d="m9 5 11 7-11 7Z" />,
    pause: (
      <>
        <path d="M8 5v14M16 5v14" />
      </>
    ),
    camera: (
      <>
        <rect x="3" y="6" width="12" height="12" rx="3" />
        <path d="m15 10 6-3v10l-6-3" />
      </>
    ),
    sport: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 8 6 0 2 6-5 4-5-4Z" />
      </>
    ),
    event: <path d="m13 2-9 12h7l-1 8 10-13h-7Z" />,
    studio: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8m-4-4v4M6 8h12" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" />
      </>
    ),
    replay: (
      <>
        <path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" />
        <path d="m11 8 5 4-5 4Z" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    menu: <path d="M4 8h16M4 16h16" />,
    phone: (
      <path d="m5 3 4 1 1 5-3 2c2 4 3 5 6 6l2-3 5 1 1 4c-5 6-23-11-16-16Z" />
    ),
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {shapes[name] || shapes.arrow}
    </svg>
  );
}
