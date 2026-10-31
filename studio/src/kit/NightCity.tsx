import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * A 3D night city for visual essays (formats-lab F6): instanced towers with lit windows, amber streets, and one
 * hospital (white, a glowing red cross, a pulsing ring on the ground). Deterministic: the same seed gives the same
 * city. Use inside <ThreeCanvas> with <CameraRig>; the hospital stands at HOSPITAL_AT.
 */

export const HOSPITAL_AT: [number, number, number] = [0, 0, 0];

const rand = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

/** A window texture: a grid of warm and cool lit windows on a dark facade. */
const windowTexture = (seed: number, lit: number): THREE.CanvasTexture => {
  const r = rand(seed);
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000000";
  g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 124; y += 8) {
    for (let x = 4; x < 60; x += 8) {
      if (r() < lit) {
        const warm = r() < 0.75;
        g.fillStyle = warm ? `rgba(255,${190 + Math.floor(r() * 40)},${110 + Math.floor(r() * 50)},1)` : "rgba(170,210,255,1)";
        g.fillRect(x, y, 4, 5);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;
  return t;
};

type Tower = { x: number; z: number; w: number; d: number; h: number };

const useTowers = (seed: number, count: number, spread: number): Tower[] =>
  useMemo(() => {
    const r = rand(seed);
    const out: Tower[] = [];
    const block = 1.6;
    for (let gx = -spread; gx <= spread; gx += block) {
      for (let gz = -spread; gz <= spread; gz += block) {
        if (Math.abs(gx) < 1.2 && Math.abs(gz) < 1.2) continue; // the hospital's block
        const per = r() < 0.5 ? 1 : 2;
        for (let k = 0; k < per && out.length < count; k++) {
          const w = 0.35 + r() * 0.45;
          const d = 0.35 + r() * 0.45;
          const dist = Math.hypot(gx, gz);
          const h = 0.4 + r() * (dist < 6 ? 3.2 : 1.6);
          out.push({ x: gx + (r() - 0.5) * 0.7, z: gz + (r() - 0.5) * 0.7, w, d, h });
        }
      }
    }
    return out;
  }, [seed, count, spread]);

const Towers: React.FC<{ towers: Tower[]; seed: number }> = ({ towers, seed }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => {
    const tex = windowTexture(seed, 0.42);
    return new THREE.MeshStandardMaterial({ color: "#1B2233", roughness: 0.8, emissive: new THREE.Color("#FFFFFF"), emissiveMap: tex, emissiveIntensity: 1.1 });
  }, [seed]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    towers.forEach((t, i) => {
      m.compose(new THREE.Vector3(t.x, t.h / 2, t.z), new THREE.Quaternion(), new THREE.Vector3(t.w, t.h, t.d));
      ref.current!.setMatrixAt(i, m);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [towers]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, towers.length]} material={material}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
};

/** The hospital: a white block with lit windows, a red cross that glows, and a pulsing ring around it. */
export const Hospital: React.FC<{ frame: number; ring?: number }> = ({ frame, ring = 1 }) => {
  const tex = useMemo(() => windowTexture(77, 0.7), []);
  const pulse = (frame % 60) / 60;
  return (
    <group position={HOSPITAL_AT}>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[1.4, 2.4, 1.0]} />
        <meshStandardMaterial color="#DDE3EA" roughness={0.6} emissive="#FFFFFF" emissiveMap={tex} emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0.95, 0.6, 0.1]}>
        <boxGeometry args={[0.7, 1.2, 0.8]} />
        <meshStandardMaterial color="#CFD6DE" roughness={0.6} emissive="#FFFFFF" emissiveMap={tex} emissiveIntensity={0.8} />
      </mesh>
      {/* red cross on the roof edge and on the front */}
      {[[0, 2.62, 0, 0], [0, 1.95, 0.51, 1]].map(([x, y, z, front], i) => (
        <group key={i} position={[x, y, z]} rotation={front ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}>
          <mesh><boxGeometry args={[0.42, 0.12, 0.02]} /><meshStandardMaterial color="#FF3B3B" emissive="#FF2D2D" emissiveIntensity={2.4} /></mesh>
          <mesh><boxGeometry args={[0.12, 0.42, 0.02]} /><meshStandardMaterial color="#FF3B3B" emissive="#FF2D2D" emissiveIntensity={2.4} /></mesh>
        </group>
      ))}
      <pointLight position={[0, 2.9, 0.4]} intensity={3} distance={3} color="#FF5A5A" />
      {/* pulsing ring on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.25 + pulse * 0.8, 1.32 + pulse * 0.8, 64]} />
        <meshBasicMaterial color="#F5E04A" transparent opacity={(1 - pulse) * 0.8 * ring} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[1.2, 1.26, 64]} />
        <meshBasicMaterial color="#F5E04A" transparent opacity={0.9 * ring} />
      </mesh>
    </group>
  );
};

/** The whole city: towers, amber streets on a dark ground, a blue-black sky haze, and the hospital. */
export const NightCity: React.FC<{ frame: number; seed?: number; ring?: number }> = ({ frame, seed = 5, ring = 1 }) => {
  const towers = useTowers(seed, 520, 14);
  const streets = useMemo(() => {
    const out: { x: number; z: number; along: "x" | "z" }[] = [];
    for (let p = -14.4; p <= 14.4; p += 1.6) {
      out.push({ x: p + 0.8, z: 0, along: "z" });
      out.push({ x: 0, z: p + 0.8, along: "x" });
    }
    return out;
  }, []);
  return (
    <group>
      <color attach="background" args={["#070B16"]} />
      <fog attach="fog" args={["#0A1022", 6, 26]} />
      <hemisphereLight args={["#3A4C7A", "#0A0A12", 0.5]} />
      <directionalLight position={[-6, 10, 4]} intensity={0.35} color="#9FB8FF" />
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#0C1018" roughness={1} /></mesh>
      {streets.map((s, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[s.x, 0.005, s.z]}>
          <planeGeometry args={s.along === "z" ? [0.08, 30] : [30, 0.08]} />
          <meshBasicMaterial color="#FFB357" transparent opacity={0.55} />
        </mesh>
      ))}
      <Towers towers={towers} seed={seed} />
      <Hospital frame={frame} ring={ring} />
    </group>
  );
};
