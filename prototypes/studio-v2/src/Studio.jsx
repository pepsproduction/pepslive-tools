import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  RoundedBox,
  Environment,
  Lightformer,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { media } from "./runtime";

const orange = "#ff743d";

function Box({
  size,
  position,
  rotation,
  color = "#202530",
  radius = 0.07,
  metal = 0.4,
  children,
  ...props
}) {
  return (
    <RoundedBox
      args={size}
      position={position}
      rotation={rotation}
      radius={radius}
      smoothness={3}
      castShadow
      receiveShadow
      {...props}
    >
      {children || (
        <meshStandardMaterial
          color={color}
          roughness={0.33}
          metalness={metal}
        />
      )}
    </RoundedBox>
  );
}

function Rod({ from, to, radius = 0.035, color = "#6b7686" }) {
  const { length, center, quaternion } = useMemo(() => {
    const a = new THREE.Vector3(...from),
      b = new THREE.Vector3(...to),
      delta = b.clone().sub(a);
    return {
      length: delta.length(),
      center: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        delta.normalize(),
      ),
    };
  }, [from.join(), to.join()]);
  return (
    <mesh position={center} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, length, 10]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.7} />
    </mesh>
  );
}

function CameraModel() {
  return (
    <group position={[-2.8, 0.35, 1.3]} rotation={[0, -0.5, 0]} scale={0.85}>
      <Box size={[1.15, 0.78, 0.83]} position={[0, 0.55, 0]} color="#262b34" />
      <Box
        size={[0.72, 0.12, 0.24]}
        position={[0, 1.1, -0.08]}
        color="#4b5260"
        radius={0.04}
      />
      <Rod from={[-0.3, 0.91, -0.08]} to={[-0.3, 1.1, -0.08]} radius={0.06} />
      <Rod from={[0.3, 0.91, -0.08]} to={[0.3, 1.1, -0.08]} radius={0.06} />
      <mesh
        position={[0, 0.55, 0.65]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.37, 0.32, 0.56, 40]} />
        <meshStandardMaterial color="#171b25" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.55, 0.95]}>
        <torusGeometry args={[0.31, 0.044, 12, 48]} />
        <meshStandardMaterial color={orange} metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.55, 0.97]}>
        <circleGeometry args={[0.27, 40]} />
        <meshPhysicalMaterial
          color="#194c6b"
          metalness={0.6}
          roughness={0.05}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0.11, 0.65, 0.98]}>
        <circleGeometry args={[0.055, 20]} />
        <meshBasicMaterial color="#97e2ff" transparent opacity={0.7} />
      </mesh>
      <Box
        size={[0.07, 0.36, 0.44]}
        position={[-0.62, 0.65, -0.06]}
        rotation={[0, -0.35, 0]}
        color="#456077"
        radius={0.025}
      />
      <mesh position={[0.38, 0.99, 0.2]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color="#ff3e33" />
      </mesh>
      <Rod from={[0, -0.1, 0]} to={[0, 0.15, 0]} radius={0.13} />
      <Rod from={[0, -0.1, 0]} to={[-0.52, -0.95, 0.44]} radius={0.04} />
      <Rod from={[0, -0.1, 0]} to={[0.52, -0.95, 0.44]} radius={0.04} />
      <Rod from={[0, -0.1, 0]} to={[0, -0.95, -0.55]} radius={0.04} />
    </group>
  );
}

function Monitor({ mode }) {
  const maps = useTexture([
    media("junior.jpg"),
    media("culture.jpg"),
    media("u17.jpg"),
  ]);
  const map = maps[mode === "sport" ? 0 : mode === "event" ? 1 : 2];
  useEffect(() => {
    maps.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
    });
  }, [maps]);
  return (
    <group position={[0.25, 1.08, -0.25]} rotation={[0, -0.12, 0]}>
      <Box
        size={[4.6, 2.79, 0.22]}
        color={mode === "event" ? "#d85b8a" : orange}
        radius={0.17}
      />
      <Box
        size={[4.52, 2.71, 0.25]}
        position={[0, 0, 0.055]}
        color="#151a22"
        radius={0.14}
      />
      <mesh position={[0, 0.04, 0.19]}>
        <planeGeometry args={[4.27, 2.4]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      <mesh position={[0, -1.25, 0.2]}>
        <sphereGeometry args={[0.025, 10, 10]} />
        <meshBasicMaterial color="#caff91" />
      </mesh>
      <Box
        size={[0.28, 0.62, 0.17]}
        position={[0, -1.65, -0.03]}
        color="#414957"
        radius={0.04}
      />
      <Box
        size={[1.5, 0.07, 0.65]}
        position={[0, -1.95, 0.05]}
        color="#353f50"
        radius={0.03}
      />
    </group>
  );
}

function Console() {
  return (
    <group position={[0.65, -0.67, 1.35]} rotation={[0.16, -0.1, 0]}>
      <Box size={[2.7, 0.23, 1.35]} color="#303743" radius={0.1} />
      <Box
        size={[2.75, 0.07, 1.39]}
        position={[0, -0.12, 0]}
        color={orange}
        radius={0.025}
      />
      {Array.from({ length: 18 }, (_, i) => (
        <Box
          key={i}
          size={[0.24, 0.06, 0.22]}
          position={[
            -1.09 + (i % 6) * 0.3,
            0.15,
            -0.39 + Math.floor(i / 6) * 0.32,
          ]}
          color={i === 8 ? "#adff9b" : i === 7 || i === 13 ? orange : "#64717f"}
          radius={0.025}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0.93 + i * 0.11, 0.15, 0.05]}>
          <Box size={[0.025, 0.018, 0.76]} color="#090e14" radius={0.004} />
          <Box
            size={[0.075, 0.07, 0.13]}
            position={[0, 0.05, -0.2 + i * 0.15]}
            color="#b5bec8"
            radius={0.01}
          />
        </group>
      ))}
    </group>
  );
}

function GlassPanel() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#111b2ae0";
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "#c5ef98";
    ctx.beginPath();
    ctx.arc(35, 34, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#f8fbff";
    ctx.fillText("PROGRAM / 01", 58, 42);
    ctx.fillStyle = "#ff8b59";
    ctx.font = "bold 70px sans-serif";
    ctx.fillText("LIVE", 30, 131);
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#b3c3d5";
    ctx.fillText("PEPSPRODUCTION", 32, 220);
    for (let i = 0; i < 23; i++) {
      ctx.fillStyle = i > 17 ? "#ff976a" : "#9bd9e1";
      ctx.fillRect(31 + i * 20, 165 - ((i * 17) % 42), 9, 7 + ((i * 17) % 42));
    }
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group position={[2.66, 0.47, 1.25]} rotation={[0, -0.4, -0.04]}>
      <Box size={[1.95, 1.15, 0.13]} radius={0.13}>
        <meshPhysicalMaterial
          color="#9fd5e8"
          roughness={0.12}
          metalness={0.05}
          transmission={0.75}
          thickness={0.25}
          ior={1.45}
          clearcoat={1}
        />
      </Box>
      <mesh position={[0, 0, 0.075]}>
        <planeGeometry args={[1.79, 0.94]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0.94}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Scene({ mode, motion, visible }) {
  const root = useRef(null),
    goal = useRef(new THREE.Vector3()),
    { camera, pointer, invalidate } = useThree();
  useFrame((state, delta) => {
    const preset =
      mode === "event"
        ? [5.9, 3.9, 9.5]
        : mode === "studio"
          ? [5.2, 6.2, 8.8]
          : [6.5, 3.7, 9.8];
    goal.current.set(...preset);
    if (motion) camera.position.lerp(goal.current, 1 - Math.exp(-delta * 3));
    else camera.position.copy(goal.current);
    camera.lookAt(0, 0.3, 0.15);
    if (root.current) {
      root.current.rotation.y = THREE.MathUtils.damp(
        root.current.rotation.y,
        (motion ? pointer.x * 0.09 : 0) - 0.12,
        4,
        delta,
      );
      root.current.position.y = motion
        ? Math.sin(state.clock.elapsedTime * 0.6) * 0.055
        : 0;
    }
    if (visible && camera.position.distanceTo(goal.current) > 0.005)
      invalidate();
  });
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={3.1}
        color="#fff0da"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <pointLight position={[-5, 2, 0]} intensity={36} color="#78cfff" />
      <pointLight
        position={[3, 0, -3]}
        intensity={35}
        color={mode === "event" ? "#ff50b6" : orange}
      />
      <Environment resolution={64} frames={1}>
        <Lightformer
          position={[0, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
          intensity={2}
        />
        <Lightformer
          position={[-5, 1, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[3, 6, 1]}
          color="#81d6ff"
          intensity={3}
        />
      </Environment>
      <group ref={root}>
        <Box
          size={[7.3, 0.18, 4.4]}
          position={[0, -1.13, 0.35]}
          color="#1c2736"
          radius={0.08}
        />
        <Box
          size={[7.4, 0.04, 4.5]}
          position={[0, -1.22, 0.35]}
          color="#5b8eb6"
          radius={0.019}
        />
        <Monitor mode={mode} />
        <CameraModel />
        <Console />
        <GlassPanel />
        <mesh position={[0, -1.4, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.6, 3.62, 96]} />
          <meshBasicMaterial
            color="#8bdcf1"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, -1.41, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.1, 4.11, 96]} />
          <meshBasicMaterial
            color="#8bdcf1"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.42, 0]}
      >
        <planeGeometry args={[15, 15]} />
        <shadowMaterial transparent opacity={0.25} />
      </mesh>
    </>
  );
}

export default function Studio({ mode, motion, visible }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.35]}
      camera={{ position: [6.5, 3.7, 9.8], fov: 37 }}
      frameloop={visible && motion ? "always" : "demand"}
      gl={{ alpha: true, antialias: true, powerPreference: "default" }}
      fallback={
        <img
          className="scene-image-fallback"
          src={media("junior.jpg")}
          alt="ผลงานถ่ายทอดสด PepsProduction"
        />
      }
    >
      <Suspense fallback={null}>
        <Scene mode={mode} motion={motion} visible={visible} />
      </Suspense>
    </Canvas>
  );
}
