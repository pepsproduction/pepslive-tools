import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function fieldTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 ? "#244c43" : "#2a564a";
    ctx.fillRect((i * 1024) / 12, 0, 1024 / 12, 640);
  }
  ctx.strokeStyle = "#b7dfc6";
  ctx.lineWidth = 3;
  ctx.strokeRect(35, 35, 954, 570);
  ctx.beginPath();
  ctx.moveTo(512, 35);
  ctx.lineTo(512, 605);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(512, 320, 80, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(35, 170, 145, 300);
  ctx.strokeRect(844, 170, 145, 300);
  ctx.strokeRect(35, 240, 60, 160);
  ctx.strokeRect(929, 240, 60, 160);
  ctx.fillStyle = "#d2f2da";
  ctx.beginPath();
  ctx.arc(512, 320, 4, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Player({ color, position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.31, 0]} castShadow>
        <capsuleGeometry args={[0.105, 0.22, 3, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.59, 0]} castShadow>
        <sphereGeometry args={[0.095, 10, 10]} />
        <meshStandardMaterial color="#d9b598" />
      </mesh>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.19, 16]} />
        <meshBasicMaterial color="#071b16" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function Match({ angle, running, replay, onReplayEnd, visible, timeline }) {
  const texture = useMemo(fieldTexture, []),
    ball = useRef(),
    players = useRef(),
    replayTime = useRef(0),
    replayStart = useRef(0);
  const { camera, invalidate } = useThree();
  const desired = useRef(new THREE.Vector3());
  const positions = useMemo(
    () => [
      [-4, 0, 0],
      [-2.3, 0, -1.8],
      [-2.4, 0, 1.7],
      [-0.6, 0, -0.9],
      [-0.3, 0, 1.4],
      [4, 0, 0],
      [2.3, 0, -1.8],
      [2.3, 0, 1.7],
      [0.8, 0, -0.4],
      [0.6, 0, 1.7],
    ],
    [],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => {
    replayTime.current = 0;
    replayStart.current = Math.max(0, timeline.current - 6);
    invalidate();
  }, [replay, invalidate, timeline]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (running && visible) timeline.current += dt;
    if (replay && running && visible) {
      replayTime.current += dt * 0.45;
      if (replayTime.current >= 6) onReplayEnd();
    }
    const time = replay
      ? replayStart.current + Math.min(replayTime.current, 6)
      : timeline.current;
    const bx = Math.sin(time * 0.63) * 3.7,
      bz = Math.cos(time * 0.9) * 1.85;
    if (ball.current) {
      ball.current.position.set(
        bx,
        0.16 + Math.abs(Math.sin(time * 2)) * 0.14,
        bz,
      );
      ball.current.rotation.x = time * 3;
    }
    players.current?.children.forEach((player, i) => {
      const base = positions[i];
      player.position.x = base[0] + Math.sin(time * 0.8 + i) * 0.5;
      player.position.z = base[2] + Math.cos(time * 0.7 + i) * 0.4;
    });
    desired.current.set(
      ...(angle === 0
        ? [0, 7.3, 8.8]
        : angle === 1
          ? [8, 3.5, 4]
          : [0.01, 13, 0.1]),
    );
    if (running)
      camera.position.lerp(desired.current, 1 - Math.exp(-delta * 4));
    else camera.position.copy(desired.current);
    camera.lookAt(angle === 1 ? bx * 0.15 : 0, 0, angle === 1 ? bz * 0.12 : 0);
    if (visible && camera.position.distanceTo(desired.current) > 0.01)
      invalidate();
  });
  return (
    <>
      <color attach="background" args={["#121e26"]} />
      <ambientLight intensity={1.6} />
      <directionalLight
        position={[3, 9, 4]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 7.5]} />
        <meshStandardMaterial map={texture} roughness={1} />
      </mesh>
      <mesh position={[0, -0.17, 0]}>
        <boxGeometry args={[12.4, 0.32, 7.9]} />
        <meshStandardMaterial color="#12212b" />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 5.65, 0, 0]}>
          {[-0.75, 0.75].map((z) => (
            <mesh key={z} position={[0, 0.48, z]}>
              <cylinderGeometry args={[0.035, 0.035, 0.96, 8]} />
              <meshStandardMaterial color="#e8e8dd" />
            </mesh>
          ))}
          <mesh position={[0, 0.96, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 1.57, 8]} />
            <meshStandardMaterial color="#e8e8dd" />
          </mesh>
          <mesh position={[side * 0.3, 0.45, 0]}>
            <boxGeometry args={[0.55, 0.9, 1.5, 2, 5, 8]} />
            <meshBasicMaterial
              color="#b4c4bb"
              wireframe
              transparent
              opacity={0.3}
            />
          </mesh>
        </group>
      ))}
      <group ref={players}>
        {positions.map((position, i) => (
          <Player
            key={i}
            position={position}
            color={i < 5 ? "#ff783d" : "#7acff1"}
          />
        ))}
      </group>
      <mesh ref={ball} castShadow>
        <icosahedronGeometry args={[0.12, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} flatShading />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[0, 0, side * 4.2]}>
          {[0, 1, 2].map((level) => (
            <mesh
              key={level}
              position={[0, 0.15 + level * 0.26, side * level * 0.3]}
            >
              <boxGeometry args={[12, 0.2, 0.3]} />
              <meshStandardMaterial
                color={level === 2 ? "#435d71" : "#26394a"}
              />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

export default function MatchScene(props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.25]}
      camera={{ position: [0, 7.3, 8.8], fov: 48 }}
      frameloop={props.running && props.visible ? "always" : "demand"}
      gl={{ antialias: true, powerPreference: "default" }}
      fallback={
        <div className="scene-placeholder">
          ภาพจำลองสนาม · อุปกรณ์นี้แสดงฉาก 3D ไม่ได้
        </div>
      }
    >
      <Match {...props} />
    </Canvas>
  );
}
