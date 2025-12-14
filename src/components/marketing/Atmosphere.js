"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Cloud, Stars } from "@react-three/drei";

function FloatingClouds() {
  const group = useRef();

  // Gentle rotation for the whole system
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.05; // Slow spin
    }
  });

  return (
    <group ref={group}>
      {/* CONFIG EXPLAINED:
        opacity: Transparency (0.5 is ghost-like)
        speed: How fast the internal vapor moves
        width/depth: Size of the cloud
        segments: Quality (Lower = faster on iPhone)
        color: The brand tint
      */}

      {/* Cloud 1: The Teal Haze (Left) */}
      <Cloud
        opacity={0.5}
        speed={0.4}
        width={10}
        depth={1.5}
        segments={20}
        texture="/clouds/cloud.png" // Drei uses a default if this is missing, but it's safe
        position={[-5, 2, -5]}
        color="#2dd4bf" // Tailwind teal-400
      />

      {/* Cloud 2: The Indigo/Purple Mist (Right) */}
      <Cloud
        opacity={0.5}
        speed={0.3}
        width={10}
        depth={1.5}
        segments={20}
        position={[5, -2, -5]}
        color="#818cf8" // Tailwind indigo-400
      />

      {/* Tiny stars in the deep background for depth */}
      <Stars
        radius={100}
        depth={50}
        count={1000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
    </group>
  );
}

export default function Atmosphere() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#f0f9ff" />
        <FloatingClouds />
      </Canvas>
    </div>
  );
}
