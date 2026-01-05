"use client";
import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, useTexture, Plane } from "@react-three/drei";
import * as THREE from "three";

const BACKDROPS = {
  teal: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/Gemini_Generated_Image_x2w1c9x2w1c9x2w1.jpeg",
  yellow:
    "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/vibewriter-skyline-newcincinnati-cyberpunk.jpeg",
};

const SNOW_COLORS = {
  teal: "#2dd4bf",
  yellow: "#facc15",
};

function HallOfHumanWriting({ theme }) {
  const { viewport } = useThree();
  const texture = useTexture(BACKDROPS[theme] || BACKDROPS.teal);

  // 1. Aspect Ratio Correction (Prevents distortion)
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

  // 2. Normalizing Size
  // We place it at z=-40 (Standard depth).
  // At z=-40 with camera at z=10, the view is 5x wider than at z=0.
  // We scale by 8x to ensure it covers the edges comfortably with parallax.
  const DISTANCE_SCALE = 8;

  return (
    <Plane
      position={[0, 0, -40]}
      scale={[scaleWidth * DISTANCE_SCALE, scaleHeight * DISTANCE_SCALE, 1]}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.5}
        depthWrite={false}
        toneMapped={false}
      />
    </Plane>
  );
}

export default function DystopianSnow({ theme = "teal" }) {
  const ref = useRef();
  const count = 30000;
  const xBound = 25;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;
      vel[i] = 0.01 + Math.random() * 0.03;
    }
    return [pos, vel];
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      attr[i * 3 + 1] -= velocities[i];
      attr[i * 3] += velocities[i] * 0.3;
      attr[i * 3] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.002;

      if (attr[i * 3 + 1] < -15) attr[i * 3 + 1] = 15;
      if (attr[i * 3] > xBound) attr[i * 3] = -xBound;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <React.Suspense fallback={null}>
        <HallOfHumanWriting theme={theme} />
      </React.Suspense>

      <ambientLight intensity={0.2} />
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={SNOW_COLORS[theme] || SNOW_COLORS.teal}
          size={0.025}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.7}
        />
      </Points>
    </>
  );
}
