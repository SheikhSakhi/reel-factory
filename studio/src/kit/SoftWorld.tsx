import React from "react";
import type { Vec3 } from "./Cast3D";

/**
 * Soft cast and set for character episodes (F1 v3, user feedback 2026-10-30): smooth, rounded "clay" characters,
 * a bright daylight clinic, soft shadows. Pair with <CinemaGrade> soft settings (haze, window rays, light grain).
 * Use inside <ThreeCanvas> from @remotion/three and pass `frame` down. Units are metres, y is up.
 */

const Soft: React.FC<{ color: string; rough?: number; emissive?: string; intensity?: number; sheen?: number }> = ({
  color, rough = 0.75, emissive, intensity = 1,
}) => <meshStandardMaterial color={color} roughness={rough} metalness={0} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? intensity : 0} />;

type MeshProps = { position?: Vec3; rotation?: Vec3; scale?: Vec3 | number; children: React.ReactNode };
const M: React.FC<MeshProps> = ({ position, rotation, scale, children }) => (
  <mesh position={position as [number, number, number]} rotation={rotation as [number, number, number]}
    scale={(typeof scale === "number" ? [scale, scale, scale] : scale) as [number, number, number]} castShadow receiveShadow>
    {children}
  </mesh>
);

export type SoftLook = {
  readonly skin: string;
  readonly hair: string;
  readonly top: string;
  readonly pants: string;
  readonly shoes?: string;
  /** Hair style: a bun on top (default), short crop, or long. */
  readonly style?: "bun" | "short" | "long";
  readonly glasses?: boolean;
  /** A lanyard / ID badge on the chest. */
  readonly badge?: boolean;
};

type PersonProps = {
  readonly look: SoftLook;
  readonly position: Vec3;
  readonly turn?: number;
  readonly frame: number;
  readonly talk?: number;
  /** -1..1: worried (inner ends up) .. pleased. */
  readonly mood?: number;
  readonly headTurn?: number;
  readonly headTilt?: number;
  readonly gesture?: number;
};

/** A seated, rounded character with a gentle face: dot eyes, soft brows, a small mouth that talks, rosy cheeks. */
export const SoftPerson: React.FC<PersonProps> = ({
  look, position, turn = 0, frame, talk = 0, mood = 0, headTurn = 0, headTilt = 0, gesture = 0,
}) => {
  const breathe = 1 + Math.sin(frame / 26) * 0.01;
  const nod = Math.sin(frame * 0.26) * 0.04 * talk + Math.sin(frame / 50) * 0.01;
  const blink = frame % 107 < 3 ? 0.12 : 1;
  const mouthOpen = 0.004 + 0.018 * talk * Math.abs(Math.sin(frame * 0.85));
  const wave = Math.sin(frame * 0.12) * 0.1 * gesture;
  const browTilt = -0.25 * mood;
  return (
    <group position={position as [number, number, number]} rotation={[0, turn, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.11, 0.52, 0]}>
          <M position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}><capsuleGeometry args={[0.085, 0.3, 8, 16]} /><Soft color={look.pants} /></M>
          <M position={[0, -0.25, 0.4]}><capsuleGeometry args={[0.07, 0.34, 8, 16]} /><Soft color={look.pants} /></M>
          <M position={[0, -0.49, 0.46]} scale={[1, 0.55, 1.6]}><sphereGeometry args={[0.075, 20, 14]} /><Soft color={look.shoes ?? "#EDE8E0"} /></M>
        </group>
      ))}
      <group position={[0, 0.9, 0]} scale={[1, breathe, 1]}>
        <M scale={[1, 1, 0.78]}><capsuleGeometry args={[0.2, 0.32, 10, 24]} /><Soft color={look.top} rough={0.85} /></M>
        {/* scrub V-neck */}
        <M position={[0, 0.22, 0.155]} rotation={[-0.1, 0, Math.PI]} scale={[1, 1, 0.3]}><coneGeometry args={[0.07, 0.12, 3]} /><Soft color={look.skin} /></M>
        {look.badge ? (
          <>
            <M position={[0.09, 0.05, 0.16]}><boxGeometry args={[0.07, 0.09, 0.008]} /><Soft color="#FFFFFF" rough={0.4} /></M>
            <M position={[0.09, 0.075, 0.165]}><boxGeometry args={[0.05, 0.012, 0.004]} /><Soft color="#3FA796" /></M>
          </>
        ) : null}
      </group>
      {[-1, 1].map((s) => {
        const right = s === 1;
        const lift = right ? -0.55 - 0.65 * gesture + wave : -0.45;
        return (
          <group key={s} position={[s * 0.25, 1.13, 0]} rotation={[lift, 0, s * 0.1]}>
            <M position={[0, -0.17, 0]}><capsuleGeometry args={[0.06, 0.26, 8, 16]} /><Soft color={look.top} rough={0.85} /></M>
            <group position={[0, -0.34, 0]} rotation={[right ? -0.8 * gesture - 0.7 : -1.0, 0, 0]}>
              <M position={[0, -0.12, 0]}><capsuleGeometry args={[0.05, 0.18, 8, 16]} /><Soft color={look.skin} /></M>
              <M position={[0, -0.26, 0]}><sphereGeometry args={[0.056, 18, 12]} /><Soft color={look.skin} /></M>
            </group>
          </group>
        );
      })}
      <M position={[0, 1.29, 0]}><cylinderGeometry args={[0.058, 0.066, 0.12, 20]} /><Soft color={look.skin} /></M>
      <group position={[0, 1.49, 0]} rotation={[nod + headTilt, headTurn, 0]}>
        <M scale={[0.95, 1.05, 0.98]}><sphereGeometry args={[0.165, 40, 30]} /><Soft color={look.skin} rough={0.65} /></M>
        {/* face */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <M position={[s * 0.056, 0.02, 0.152]} scale={[0.9, 1.15 * blink, 0.5]}><sphereGeometry args={[0.017, 16, 12]} /><Soft color="#2A211D" rough={0.3} /></M>
            <M position={[s * 0.056 + 0.006, 0.028, 0.16]} scale={[1, blink, 0.5]}><sphereGeometry args={[0.005, 8, 6]} /><Soft color="#FFFFFF" emissive="#FFFFFF" intensity={0.6} /></M>
            <M position={[s * 0.058, 0.062, 0.15]} rotation={[0, 0, s * browTilt]} scale={[1, 0.35, 0.4]}><capsuleGeometry args={[0.01, 0.035, 6, 10]} /><Soft color={look.hair} /></M>
            <M position={[s * 0.088, -0.03, 0.128]} scale={[1, 0.6, 0.3]}><sphereGeometry args={[0.026, 14, 10]} /><Soft color="#F08C82" rough={0.9} /></M>
          </group>
        ))}
        <M position={[0, -0.002, 0.163]} scale={[0.8, 1, 0.8]}><sphereGeometry args={[0.018, 14, 10]} /><Soft color={look.skin} /></M>
        <M position={[0, -0.062, 0.152]} scale={[1, mouthOpen / 0.012 + 0.25, 0.5]}><sphereGeometry args={[0.02, 16, 10]} /><Soft color="#8A3F3A" rough={0.6} /></M>
        {/* hair */}
        <M position={[0, 0.035, -0.02]} rotation={[-0.35, 0, 0]} scale={[1.02, 0.95, 1.04]}>
          <sphereGeometry args={[0.172, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.48]} /><Soft color={look.hair} rough={0.9} />
        </M>
        {(look.style ?? "bun") === "bun" ? <M position={[0, 0.17, -0.07]}><sphereGeometry args={[0.07, 24, 18]} /><Soft color={look.hair} rough={0.9} /></M> : null}
        {look.style === "long" ? <M position={[0, -0.08, -0.08]} scale={[1, 1.4, 0.7]}><sphereGeometry args={[0.16, 28, 20]} /><Soft color={look.hair} rough={0.9} /></M> : null}
        {look.glasses ? (
          <group position={[0, 0.022, 0.165]}>
            {[-1, 1].map((s) => <mesh key={s} position={[s * 0.056, 0, 0]}><torusGeometry args={[0.03, 0.004, 10, 28]} /><Soft color="#C9A27A" rough={0.3} /></mesh>)}
            <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.003, 0.003, 0.05, 8]} /><Soft color="#C9A27A" /></mesh>
          </group>
        ) : null}
      </group>
    </group>
  );
};

type BotProps = { readonly position: Vec3; readonly frame: number; readonly talk?: number; readonly turn?: number; readonly visor?: string };

/** Doc v3: a smooth cream robot head with a teal visor, soft glowing eyes and a light ring that pulses as it speaks. */
export const SoftDoc: React.FC<BotProps> = ({ position, frame, talk = 0, turn = 0, visor = "#2F8F86" }) => {
  const hover = Math.sin(frame / 22) * 0.025;
  const blink = frame % 121 < 3 ? 0.12 : 1;
  const glow = 0.9 + 0.8 * talk * Math.abs(Math.sin(frame * 0.7));
  const s = 0.27;
  return (
    <group position={[position[0], position[1] + hover, position[2]]} rotation={[0, turn, Math.sin(frame / 48) * 0.035]}>
      <M scale={[1, 0.94, 0.96]}><sphereGeometry args={[s, 48, 36]} /><Soft color="#F3EEE6" rough={0.35} /></M>
      {/* visor */}
      <M position={[0, 0.01, s * 0.62]} scale={[1, 0.62, 0.42]}><sphereGeometry args={[s * 0.82, 40, 28]} /><Soft color={visor} rough={0.15} /></M>
      {[-1, 1].map((k) => (
        <M key={k} position={[k * s * 0.24, s * 0.06, s * 0.96]} scale={[1, blink, 0.35]}><capsuleGeometry args={[s * 0.06, s * 0.08, 8, 12]} /><Soft color="#E8FFF9" emissive="#BFFFF2" intensity={1.6} /></M>
      ))}
      {/* a soft speaking light under the eyes */}
      <M position={[0, -s * 0.15, s * 0.95]} scale={[1, 0.35, 0.3]}><sphereGeometry args={[s * 0.09, 16, 10]} /><Soft color="#E8FFF9" emissive="#BFFFF2" intensity={glow} /></M>
      {/* ear discs */}
      {[-1, 1].map((k) => <M key={k} position={[k * s * 0.98, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[s * 0.26, s * 0.26, s * 0.12, 32]} /><Soft color={visor} rough={0.3} /></M>)}
      {/* little antenna with a soft bulb */}
      <M position={[0, s * 1.08, 0]}><cylinderGeometry args={[0.005, 0.005, s * 0.3, 10]} /><Soft color="#D9D2C6" /></M>
      <M position={[0, s * 1.27, 0]}><sphereGeometry args={[s * 0.07, 16, 12]} /><Soft color="#FFD58A" emissive="#FFC46B" intensity={0.8 + 0.4 * Math.sin(frame / 10)} /></M>
    </group>
  );
};

export const CLINIC_DESK_TOP = 0.74;

/** A bright daylight clinic office: big window, light wood, plants, shelves; sun through the window, soft fill. */
export const BrightClinic: React.FC<{ frame: number }> = ({ frame }) => {
  const sway = Math.sin(frame / 60) * 0.02;
  return (
    <group>
      <hemisphereLight args={["#FFF6EA", "#D8CBB8", 1.15]} />
      <directionalLight position={[-3.2, 3.6, 2.2]} intensity={2.4} color="#FFE7C4" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-3} shadow-camera-right={3}
        shadow-camera-top={3} shadow-camera-bottom={-3} shadow-bias={-0.0004} shadow-radius={6} />
      <pointLight position={[1.6, 2.2, 2.2]} intensity={2.2} distance={8} color="#CFE6FF" />
      {/* floor, walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[12, 12]} /><Soft color="#D9C4A6" rough={0.8} /></mesh>
      <mesh position={[0, 2, -1.8]} receiveShadow><planeGeometry args={[12, 5]} /><Soft color="#F1EAE0" rough={0.95} /></mesh>
      <mesh position={[-2.5, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[8, 5]} /><Soft color="#E6EEEA" rough={0.95} /></mesh>
      {/* big window on the back wall: glowing daylight + frame */}
      <mesh position={[-0.9, 1.75, -1.78]}><planeGeometry args={[1.9, 1.6]} /><meshStandardMaterial color="#FFF8EC" emissive="#FFF2DA" emissiveIntensity={1.4} /></mesh>
      {[[-1.85, 1.75, 0.06, 1.7], [0.05, 1.75, 0.06, 1.7], [-0.9, 1.75, 0.05, 1.7]].map(([x, y, w, h], i) => (
        <M key={i} position={[x, y, -1.76]}><boxGeometry args={[w, h, 0.05]} /><Soft color="#FFFFFF" /></M>
      ))}
      {[0.95, 2.55, 1.75].map((y, i) => <M key={i} position={[-0.9, y, -1.76]}><boxGeometry args={[1.96, 0.05, 0.05]} /><Soft color="#FFFFFF" /></M>)}
      {/* shelves with books and a plant on the right */}
      <M position={[1.6, 1.4, -1.65]}><boxGeometry args={[1.2, 0.04, 0.25]} /><Soft color="#C9A77F" /></M>
      <M position={[1.6, 1.9, -1.65]}><boxGeometry args={[1.2, 0.04, 0.25]} /><Soft color="#C9A77F" /></M>
      {["#7FA7A0", "#E3B98B", "#B9C9D6", "#E8D9B5", "#9FB98A"].map((c, i) => (
        <M key={i} position={[1.15 + i * 0.12, 1.53, -1.65]}><boxGeometry args={[0.09, 0.22 + (i % 2) * 0.04, 0.18]} /><Soft color={c} /></M>
      ))}
      <group position={[1.9, 1.94, -1.65]}>
        <M position={[0, 0.07, 0]}><cylinderGeometry args={[0.08, 0.065, 0.14, 24]} /><Soft color="#F3EEE6" /></M>
        {[0, 1, 2, 3].map((i) => <M key={i} position={[Math.cos(i * 1.6) * 0.06, 0.2 + i * 0.02, Math.sin(i * 1.6) * 0.04]}><sphereGeometry args={[0.07, 18, 12]} /><Soft color="#8DBB8A" /></M>)}
      </group>
      {/* floor plant by the window */}
      <group position={[-2.05, 0, -1.3]} rotation={[0, 0, sway]}>
        <M position={[0, 0.22, 0]}><cylinderGeometry args={[0.2, 0.16, 0.44, 28]} /><Soft color="#EDE6DA" /></M>
        {[[0, 0.78, 0, 0.26], [0.16, 0.64, 0.06, 0.2], [-0.14, 0.68, -0.05, 0.22], [0.05, 0.98, -0.04, 0.18]].map(([x, y, z, r], i) => (
          <M key={i} position={[x, y, z]}><sphereGeometry args={[r, 24, 16]} /><Soft color="#7FB07A" /></M>
        ))}
      </group>
      {/* desk */}
      <M position={[0.35, CLINIC_DESK_TOP, -0.35]}><boxGeometry args={[1.5, 0.05, 0.7]} /><Soft color="#E2CBA7" rough={0.55} /></M>
      {[[-0.35, -0.65], [1.05, -0.65], [-0.35, -0.05], [1.05, -0.05]].map(([x, z]) => (
        <M key={`${x}${z}`} position={[x, CLINIC_DESK_TOP / 2, z]}><cylinderGeometry args={[0.025, 0.025, CLINIC_DESK_TOP, 12]} /><Soft color="#C9AE8A" /></M>
      ))}
      {/* laptop */}
      <group position={[-0.05, CLINIC_DESK_TOP + 0.03, -0.3]} rotation={[0, 0.55, 0]}>
        <M><boxGeometry args={[0.42, 0.02, 0.3]} /><Soft color="#E4E6EA" rough={0.3} /></M>
        <group position={[0, 0, -0.15]} rotation={[-0.25, 0, 0]}>
          <M position={[0, 0.14, 0]}><boxGeometry args={[0.42, 0.28, 0.015]} /><Soft color="#DADDE2" rough={0.3} /></M>
          <mesh position={[0, 0.14, 0.009]}><planeGeometry args={[0.38, 0.24]} /><meshStandardMaterial color="#DFF1EE" emissive="#CFEDE8" emissiveIntensity={0.5} /></mesh>
        </group>
      </group>
      {/* mug and a small vase */}
      <M position={[0.62, CLINIC_DESK_TOP + 0.07, -0.2]}><cylinderGeometry args={[0.05, 0.045, 0.12, 24]} /><Soft color="#F28C6B" /></M>
      {/* soft round stool */}
      <M position={[-0.65, 0.47, 0]}><cylinderGeometry args={[0.24, 0.24, 0.1, 32]} /><Soft color="#8FC1B8" rough={0.9} /></M>
      <M position={[-0.65, 0.21, 0]}><cylinderGeometry args={[0.05, 0.08, 0.42, 16]} /><Soft color="#D9D2C6" /></M>
    </group>
  );
};
