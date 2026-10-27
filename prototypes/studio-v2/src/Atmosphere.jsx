import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import { publishGradient } from "./LiveGlass";

const palettes = {
  sport: ["#ff7136", "#123f5b", "#91d3db"],
  event: ["#f0537f", "#42286c", "#ffba71"],
  studio: ["#90bada", "#103458", "#4cdbbd"],
};

function Bridge({ running, revision }) {
  const { setFrameloop, invalidate } = useThree();
  useEffect(() => {
    setFrameloop(running ? "always" : "demand");
    invalidate();
  }, [running, revision, setFrameloop, invalidate]);
  useFrame(({ gl, scene, camera }) => {
    gl.render(scene, camera);
    publishGradient(gl.domElement, performance.now());
  }, 1);
  return null;
}

export default function Atmosphere({ mode, motion, visible, speed, depth }) {
  const colors = palettes[mode];
  return (
    <ShaderGradientCanvas
      className="gradient-engine"
      pixelDensity={1}
      fov={45}
      style={{ width: "100%", height: "100%" }}
      lazyLoad={false}
      pointerEvents="none"
      powerPreference="low-power"
      preserveDrawingBuffer={false}
    >
      <ShaderGradient
        control="props"
        type="waterPlane"
        animate={motion && visible ? "on" : "off"}
        color1={colors[0]}
        color2={colors[1]}
        color3={colors[2]}
        lightType="3d"
        brightness={1.15}
        grain="off"
        uSpeed={speed}
        uStrength={3.1}
        uDensity={1.2}
        uFrequency={3.4}
        uAmplitude={0}
        cDistance={3.6}
        cPolarAngle={90}
        cAzimuthAngle={0}
        rotationX={0}
        rotationY={0}
        rotationZ={-35}
        positionY={0}
        reflection={0.1}
      />
      <Bridge
        running={motion && visible}
        revision={`${mode}:${speed}:${depth}`}
      />
    </ShaderGradientCanvas>
  );
}
