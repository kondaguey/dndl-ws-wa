import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, useTexture, Plane } from "@react-three/drei";
import * as THREE from "three";

// --- CONFIG ---
const BACKDROPS = {
  teal: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/(admin)/admin/vibe-writer/Gemini_Generated_Image_x2w1c9x2w1c9x2w1.jpeg",
  yellow:
    "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/(admin)/admin/vibe-writer/vibewriter-skyline-newcincinnati-cyberpunk.jpeg",
  light: "",
};

const THEME_COLORS = {
  teal: "#02020a",
  yellow: "#1a0500",
  light: "#f8fafc",
};

const SNOW_COLOR = { teal: "#ccfbf1", yellow: "#fef9c3", light: "#cbd5e1" };
const RAIN_COLOR = { teal: "#a5f3fc", yellow: "#e4e4e7", light: "#60a5fa" };

// --- HELPER: VIGNETTE ALPHA MAP ---
function useVignetteTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(256, 256, 120, 256, 256, 256);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    return new THREE.CanvasTexture(canvas);
  }, []);
}

// --- BACKGROUND PLANE ---
function HallOfHumanWriting({ theme }) {
  const { viewport } = useThree();
  const url = BACKDROPS[theme] || BACKDROPS.teal;
  const texture = useTexture(url);
  const alphaMap = useVignetteTexture();

  const imageAspect = 16 / 9;
  const viewportAspect = viewport.width / viewport.height;
  let scaleWidth, scaleHeight;

  if (viewportAspect > imageAspect) {
    scaleWidth = viewport.width;
    scaleHeight = viewport.width / imageAspect;
  } else {
    scaleHeight = viewport.height;
    scaleWidth = viewport.height * imageAspect;
  }

  const DISTANCE_SCALE = 3.2;

  return (
    <Plane
      position={[0, 0, -40]}
      scale={[scaleWidth * DISTANCE_SCALE, scaleHeight * DISTANCE_SCALE, 1]}
    >
      <meshBasicMaterial
        map={texture}
        alphaMap={alphaMap}
        transparent={true}
        opacity={1}
        depthWrite={false}
        toneMapped={false}
        fog={false}
      />
    </Plane>
  );
}

// --- HELPER: SOFT SNOW TEXTURE ---
function useSnowTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }, []);
}

// --- SYSTEM 1: UNIFIED & DENSE SNOW ---
const SnowSystem = ({ theme }) => {
  const ref = useRef();
  const tex = useSnowTexture();
  const count = 65000;

  const xBound = 55;
  const yBound = 40;

  // OPTIMIZED Z-DEPTH:
  // -60 is back in the fog.
  // 0 is right in front of the camera (but not clipping through it at +10).
  // This compresses all 65k particles into the visible volume, making it look much fuller.
  const zMin = -60;
  const zMax = 0;

  // Unified wind bias (Drift Right)
  const windBias = 0.025;

  const [positions, data] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const dat = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * xBound * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * yBound * 2;
      pos[i * 3 + 2] = zMin + Math.random() * (zMax - zMin);

      // Data: [AmplitudeX, FallSpeed, AmplitudeZ, Phase]
      dat[i * 4] = 0.03 + Math.random() * 0.04;
      dat[i * 4 + 1] = 0.05 + Math.random() * 0.2;
      dat[i * 4 + 2] = 0.05 + Math.random() * 0.1;
      dat[i * 4 + 3] = Math.random() * Math.PI * 2;
    }
    return [pos, dat];
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.1);
    const p = ref.current.geometry.attributes.position.array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const id = i * 4;

      const swayX = data[id];
      const speed = data[id + 1];
      const swayZ = data[id + 2];
      const phase = data[id + 3];

      // 1. UNIFIED DIRECTION + FLUTTER
      const flutterX = Math.sin(time * 0.3 + phase) * swayX;
      p[ix] += (windBias + flutterX) * (dt * 20);

      // Z-axis gentle wobble
      p[ix + 2] += Math.cos(time * 0.2 + phase) * swayZ * (dt * 20);

      // 2. GRAVITY
      p[ix + 1] -= speed * (dt * 15);

      // 3. WRAPPING
      if (p[ix + 1] < -yBound) {
        p[ix + 1] = yBound;
        p[ix] = (Math.random() - 0.5) * xBound * 2;
        // Respawn within visible depth
        p[ix + 2] = zMin + Math.random() * (zMax - zMin);
      }

      if (p[ix] > xBound) p[ix] = -xBound;
      if (p[ix] < -xBound) p[ix] = xBound;
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        map={tex}
        transparent
        depthWrite={false}
        color={SNOW_COLOR[theme] || SNOW_COLOR.teal}
        size={0.09}
        sizeAttenuation={true}
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

// --- SYSTEM 2: PERFECTED RAIN ---
const RainSystem = ({ theme }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const count = 20000;
  const xBound = 60;
  const yBound = 50;

  // Z Buffer Zone (Prevents clipping)
  const zMin = -80;
  const zMax = 0;

  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 120,
      y: (Math.random() - 0.5) * 100,
      z: zMin + Math.random() * (zMax - zMin),
      speed: 2.0 + Math.random() * 2.0,
    }));
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.1);

    for (let i = 0; i < count; i++) {
      const p = particles[i];

      // Gravity
      p.y -= p.speed * (dt * 30);

      if (p.y < -yBound) {
        p.y = yBound;
        p.x = (Math.random() - 0.5) * 120;
        p.z = zMin + Math.random() * (zMax - zMin);
      }

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.z = 0;

      // Thin & Long
      dummy.scale.set(0.008, 3.0, 1);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, count]}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={RAIN_COLOR[theme] || RAIN_COLOR.teal}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};

export default function DystopianTheme({
  theme = "teal",
  weatherMode = "snow",
}) {
  const bg = THEME_COLORS[theme] || THEME_COLORS.teal;

  return (
    <>
      <color attach="background" args={[bg]} />
      <fogExp2 attach="fog" args={[bg, 0.015]} />

      <ambientLight intensity={0.6} />

      <React.Suspense fallback={null}>
        <HallOfHumanWriting theme={theme} />
      </React.Suspense>

      {weatherMode === "snow" ? (
        <SnowSystem theme={theme} />
      ) : (
        <RainSystem theme={theme} />
      )}
    </>
  );
}
