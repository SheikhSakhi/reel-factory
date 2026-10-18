// The 3D world: architecture, patient light, and the act objects that are not beads.
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
import { cameraAt, makeCamera } from "../camera";
import { C } from "../style";
import { HALL, FLOOR_Y, LAYERS, MODEL, PIX, ST } from "../world";
import { patientAt, patientGlow } from "../patient";
import { at, be, bs } from "../timing";
import { smooth } from "../lib";
import { TERMS, imagePlaneOpacity, layerOpacity, pagePose, termPose } from "../poses";
import { TRAIN } from "../training";
import { FOUND_SLAB, FOUND_TASK_X, GPU } from "../spine/formations";
import { useTextures } from "./textures";

// ------------------------------------------------------------- camera

export const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => { makeCamera(frame, camera); }, [frame, camera]);
  return null;
};

// ------------------------------------------------------------- glow sprite

const glowTexture = (() => {
  let tex: THREE.Texture | null = null;
  return () => {
    if (tex) return tex;
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const g = cv.getContext("2d")!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.18, "rgba(255,255,255,0.55)");
    grd.addColorStop(0.45, "rgba(255,255,255,0.12)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
})();

export const Glow: React.FC<{ pos: readonly [number, number, number]; size: number; color: string; opacity: number }> = ({ pos, size, color, opacity }) => (
  <sprite position={pos as [number, number, number]} scale={[size, size, 1]}>
    <spriteMaterial map={glowTexture()} color={color} opacity={opacity} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
  </sprite>
);

// ------------------------------------------------------------- patient

export const Patient: React.FC = () => {
  const frame = useCurrentFrame();
  const p = patientAt(frame);
  const g = patientGlow(frame);
  if (g <= 0.001) return null;
  return (
    <group>
      <mesh position={p as [number, number, number]}>
        <sphereGeometry args={[0.11, 32, 16]} />
        <meshBasicMaterial color={C.amberCore} toneMapped={false} transparent opacity={Math.min(1, g)} />
      </mesh>
      <Glow pos={p} size={1.1} color={C.amber} opacity={0.9 * g} />
      <Glow pos={p} size={3.6} color={C.amber} opacity={0.32 * g} />
      <pointLight position={p as [number, number, number]} color={C.amber} intensity={14 * g} distance={9} decay={1.6} />
    </group>
  );
};

// ------------------------------------------------------------- hall architecture

export const Hall: React.FC = () => {
  const frame = useCurrentFrame();
  const geo = useMemo(() => {
    const v: number[] = [];
    const seg = (a: number[], b: number[]) => v.push(...a, ...b);
    const { halfWidth: hw, top } = HALL;
    for (let z = HALL.zStart; z >= HALL.zEnd; z -= HALL.every) {
      seg([-hw, FLOOR_Y, z], [-hw, top, z]); seg([hw, FLOOR_Y, z], [hw, top, z]);
      seg([-hw, top, z], [-hw * 0.35, top + 1.2, z]); seg([hw * 0.35, top + 1.2, z], [hw, top, z]);
      seg([-hw * 0.35, top + 1.2, z], [hw * 0.35, top + 1.2, z]);
      seg([-hw, FLOOR_Y, z], [hw, FLOOR_Y, z]);
    }
    for (const x of [-HALL.halfWidth, HALL.halfWidth]) for (const y of [FLOOR_Y, HALL.top]) seg([x, y, HALL.zStart], [x, y, HALL.zEnd]);
    for (let x = -HALL.halfWidth; x <= HALL.halfWidth; x += 1.5) seg([x, FLOOR_Y, HALL.zStart], [x, FLOOR_Y, HALL.zEnd]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, []);
  // The hall fades during the opening void and the deep compute dive.
  const inHall = smooth((frame - be("B03") + 30) / 40);
  const below = smooth((frame - at("B37", "gpus") + 20) / 30) * (1 - smooth((frame - at("B38", "nvidia") - 10) / 40));
  const o = 0.16 * inHall * (1 - 0.6 * below);
  return (
    <group>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color={C.ink} transparent opacity={o} depthWrite={false} />
      </lineSegments>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y - 0.01, (HALL.zStart + HALL.zEnd) / 2]}>
        <planeGeometry args={[HALL.halfWidth * 2, HALL.zStart - HALL.zEnd]} />
        <meshStandardMaterial color={C.midnight} metalness={0.6} roughness={0.35} transparent opacity={0.55 * inHall * (1 - 0.7 * below)} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------- opening slabs

export const TermSlabs: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <group>
      {TERMS.map((_, i) => {
        const p = termPose(i, frame);
        if (p.o <= 0.001) return null;
        return (
          <group key={i} position={p.c as [number, number, number]} rotation={p.rot as [number, number, number]}>
            <mesh>
              <boxGeometry args={[p.w, p.h, 0.08]} />
              <meshStandardMaterial color={C.midnight} metalness={0.2} roughness={0.15} transparent opacity={0.3 * p.o} depthWrite={false} />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(p.w, p.h, 0.08)]} />
              <lineBasicMaterial color={C.ink} transparent opacity={0.45 * p.o} />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
};

// ------------------------------------------------------------- machine learning model core

export const ModelCore: React.FC = () => {
  const frame = useCurrentFrame();
  const on = smooth((frame - at("B11", "model") + 10) / 24) * (1 - smooth((frame - bs("B16") - 20) / 30));
  if (on <= 0.001) return null;
  const st = TRAIN.state(frame);
  const settled = smooth((frame - TRAIN.settledAt()) / 24);
  const c: [number, number, number] = [ST.ml[0], ST.ml[1] + MODEL.y, ST.ml[2] + 0.6];
  return (
    <group position={c}>
      <mesh>
        <boxGeometry args={[MODEL.w, MODEL.h, 0.9]} />
        <meshStandardMaterial color={C.midnight} metalness={0.7} roughness={0.28} transparent opacity={0.6 * on} depthWrite={false} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(MODEL.w, MODEL.h, 0.9)]} />
        <lineBasicMaterial color={settled > 0.5 ? C.ink : C.cyan} transparent opacity={(0.5 + 0.3 * settled) * on} />
      </lineSegments>
      {st.settings.map((v, j) => {
        const x = -MODEL.w / 2 + 0.33 + j * ((MODEL.w - 0.66) / 11);
        const h = 0.15 + v * 1.05;
        const moving = st.active && st.phase > 0.6 ? 1 : 0;
        return (
          <mesh key={j} position={[x, -MODEL.h / 2 + 0.2 + h / 2, 0]}>
            <boxGeometry args={[0.1, h, 0.1]} />
            <meshBasicMaterial color={moving ? C.ink : C.cyan} toneMapped={false} transparent opacity={(0.55 + 0.4 * moving) * on * (1 - 0.35 * settled)} />
          </mesh>
        );
      })}
    </group>
  );
};

// ------------------------------------------------------------- deep learning planes

export const DeepPlanes: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures();
  const img = imagePlaneOpacity(frame);
  return (
    <group position={ST.dl as unknown as [number, number, number]}>
      {img > 0.001 ? (
        <mesh position={[0, 0, -0.04]}>
          <planeGeometry args={[PIX.size, PIX.size]} />
          <meshBasicMaterial map={tex.xray} transparent opacity={img} toneMapped={false} depthWrite={false} />
        </mesh>
      ) : null}
      {LAYERS.map((l, k) => {
        // A plane fades as the camera flies through it, so it never floods the frame.
        const camZ = cameraAt(frame).pos[2] - ST.dl[2];
        const clearance = smooth((Math.abs(camZ - l.z) - 0.8) / 3.2);
        const o = layerOpacity(k, frame) * clearance * (k === LAYERS.length - 1 ? 1 - smooth((frame - bs("B22") - 2) / 16) : 1);
        if (o <= 0.001) return null;
        return (
          <group key={k} position={[0, 0, l.z]}>
            <mesh>
              <planeGeometry args={[l.size, l.size]} />
              <meshBasicMaterial map={tex.feat[k]} color="#9fefff" transparent opacity={o} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.PlaneGeometry(l.size, l.size)]} />
              <lineBasicMaterial color={C.ink} transparent opacity={0.35 * o} />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
};

// ------------------------------------------------------------- document surface

export const PageSurface: React.FC = () => {
  const frame = useCurrentFrame();
  const p = pagePose(frame);
  if (p.o <= 0.001) return null;
  return (
    <group position={p.c as [number, number, number]} rotation={p.rot as [number, number, number]}>
      <mesh>
        <planeGeometry args={[p.w, p.h]} />
        <meshStandardMaterial color="#0d1625" metalness={0.1} roughness={0.4} transparent={p.o < 0.99} opacity={0.94 * p.o} depthWrite side={THREE.DoubleSide} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(p.w, p.h)]} />
        <lineBasicMaterial color={C.ink} transparent opacity={0.6 * p.o} />
      </lineSegments>
    </group>
  );
};

// ------------------------------------------------------------- foundation tasks and ghosts

export const FoundationTasks: React.FC = () => {
  const frame = useCurrentFrame();
  const on = smooth((frame - at("B27", "adapted") + 12) / 20) * (1 - smooth((frame - at("B29", "connect")) / 24));
  const ghost = smooth((frame - at("B28", "separate") + 6) / 14) * (1 - smooth((frame - at("B28", "foundation") + 4) / 20));
  if (on <= 0.001 && ghost <= 0.001) return null;
  const o = ST.found;
  return (
    <group position={o as unknown as [number, number, number]}>
      {FOUND_TASK_X.map((x, k) => (
        <group key={k}>
          <lineSegments position={[x, FOUND_SLAB.y - 0.1, 0]}>
            <edgesGeometry args={[new THREE.BoxGeometry(1.45, 0.9, 2.2)]} />
            <lineBasicMaterial color={C.muted} transparent opacity={0.7 * ghost} />
          </lineSegments>
          <mesh position={[x, 0.95, 0]}>
            <boxGeometry args={[1.35, 1.35, 0.06]} />
            <meshStandardMaterial color={C.midnight} metalness={0.5} roughness={0.3} transparent opacity={0.75 * on} depthWrite={false} />
          </mesh>
          <lineSegments position={[x, 0.95, 0]}>
            <edgesGeometry args={[new THREE.BoxGeometry(1.35, 1.35, 0.06)]} />
            <lineBasicMaterial color={C.ink} transparent opacity={0.55 * on} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
};

// ------------------------------------------------------------- GPU field beneath the hospital

/** Neighbouring dies drawn as fine line grids: scale without a false horizon. */
export const GpuField: React.FC = () => {
  const frame = useCurrentFrame();
  const on = smooth((frame - at("B37", "gpus") + 10) / 30) * (1 - smooth((frame - at("B39", "for")) / 40));
  const wide = smooth((frame - at("B37", "use") + 6) / 40);
  const size = GPU.n * GPU.pitch;
  const span = size + 1.2;
  const ring = 3;
  const geo = useMemo(() => {
    const v: number[] = [];
    const sub = 8;
    for (let r = -ring; r <= ring; r++) for (let c = -ring; c <= ring; c++) {
      if (r === 0 && c === 0) continue;
      const x0 = ST.gpu[0] + c * span - size / 2, z0 = ST.gpu[2] + r * span - size / 2, y = ST.gpu[1] - 0.02;
      for (let k = 0; k <= sub; k++) {
        const t = (k / sub) * size;
        v.push(x0, y, z0 + t, x0 + size, y, z0 + t);
        v.push(x0 + t, y, z0, x0 + t, y, z0 + size);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(new Array(v.length).fill(0), 3));
    return g;
  }, [size, span]);
  useLayoutEffect(() => {
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const col = geo.getAttribute("color") as THREE.BufferAttribute;
    const g = new THREE.Color(C.green);
    for (let i = 0; i < pos.count; i++) {
      const dx = (pos.getX(i) - ST.gpu[0]) / span, dz = (pos.getZ(i) - ST.gpu[2]) / span;
      const wave = 0.5 + 0.5 * Math.cos(frame / 5 - Math.hypot(dx, dz) * 1.6);
      const k = 0.08 + 0.5 * wide * wave;
      col.setXYZ(i, g.r * k, g.g * k, g.b * k);
    }
    col.needsUpdate = true;
  }, [frame, geo, span, wide]);
  if (on <= 0.001) return null;
  return (
    <group>
      <lineSegments geometry={geo}>
        <lineBasicMaterial vertexColors transparent opacity={on} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </lineSegments>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ST.gpu[0], ST.gpu[1] - 0.12, ST.gpu[2]]}>
        <planeGeometry args={[size + 0.5, size + 0.5]} />
        <meshStandardMaterial color="#0d1410" metalness={0.8} roughness={0.35} transparent={on < 0.99} opacity={on} depthWrite />
      </mesh>
    </group>
  );
};

/** Brushed-metal body of the foundation slab (beads sit on its surface). */
export const FoundationSlab: React.FC = () => {
  const frame = useCurrentFrame();
  const on = smooth((frame - at("B27", "foundation") + 6) / 24) * (1 - smooth((frame - at("B29", "connect")) / 24));
  if (on <= 0.001) return null;
  return (
    <mesh position={[ST.found[0], ST.found[1] + FOUND_SLAB.y, ST.found[2]]}>
      <boxGeometry args={[FOUND_SLAB.w - 0.1, FOUND_SLAB.h - 0.2, FOUND_SLAB.d - 0.4]} />
      <meshStandardMaterial color="#1a2433" metalness={0.85} roughness={0.32} transparent={on < 0.99} opacity={on} depthWrite />
    </mesh>
  );
};
