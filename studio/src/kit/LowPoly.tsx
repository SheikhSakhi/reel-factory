import React, { useMemo } from "react";
import * as THREE from "three";
import type { Vec3 } from "./Cast3D";

/**
 * Low-poly cast and set for character episodes (formats-lab F1, v2): faceted flat-shaded models with simple faces,
 * a warm studio lit by a practical lamp. Pair with <CinemaGrade> (film grain, vignette, warm grade) on top of the
 * canvas. Use inside <ThreeCanvas> from @remotion/three and pass `frame` down. Units are metres, y is up.
 */

const Flat: React.FC<{ color: string; rough?: number; emissive?: string; intensity?: number; metal?: number }> = ({
  color, rough = 0.85, emissive, intensity = 1, metal = 0,
}) => (
  <meshStandardMaterial color={color} roughness={rough} metalness={metal} flatShading emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? intensity : 0} />
);

type MeshProps = { position?: Vec3; rotation?: Vec3; scale?: Vec3 | number; children: React.ReactNode };
const M: React.FC<MeshProps> = ({ position, rotation, scale, children }) => (
  <mesh position={position as [number, number, number]} rotation={rotation as [number, number, number]}
    scale={(typeof scale === "number" ? [scale, scale, scale] : scale) as [number, number, number]} castShadow receiveShadow>
    {children}
  </mesh>
);

// ---------- people ----------

export type LowLook = {
  readonly skin: string;
  readonly hair: string;
  readonly top: string;
  readonly pants: string;
  readonly shoes?: string;
  readonly beard?: boolean;
  readonly cap?: string;
  readonly glasses?: boolean;
};

type PersonProps = {
  readonly look: LowLook;
  readonly position: Vec3;
  readonly turn?: number;
  readonly frame: number;
  /** 0..1 speech energy (talkLevel from Cast3D). */
  readonly talk?: number;
  /** -1..1: brows down (frown) to up (surprise). */
  readonly brows?: number;
  readonly headTurn?: number;
  readonly headTilt?: number;
  /** 0..1 raise of the right forearm (talking with hands). */
  readonly gesture?: number;
};

/** A seated low-poly person with a simple face (eyes, brows, mouth), a beard or cap optional. */
export const LowPerson: React.FC<PersonProps> = ({
  look, position, turn = 0, frame, talk = 0, brows = 0, headTurn = 0, headTilt = 0, gesture = 0,
}) => {
  const breathe = 1 + Math.sin(frame / 24) * 0.01;
  const nod = Math.sin(frame * 0.3) * 0.05 * talk;
  const blink = frame % 97 < 3 ? 0.15 : 1;
  const browY = 0.055 + 0.014 * brows + 0.008 * talk * Math.abs(Math.sin(frame * 0.4));
  const mouth = 0.006 + 0.016 * talk * Math.abs(Math.sin(frame * 0.9));
  const wave = Math.sin(frame * 0.17) * 0.12 * gesture;
  return (
    <group position={position as [number, number, number]} rotation={[0, turn, 0]}>
      {/* legs, seated: thighs forward, shins down */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.11, 0.52, 0]}>
          <M position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.085, 0.075, 0.42, 6]} /><Flat color={look.pants} /></M>
          <M position={[0, -0.26, 0.4]}><cylinderGeometry args={[0.07, 0.06, 0.46, 6]} /><Flat color={look.pants} /></M>
          <M position={[0, -0.5, 0.46]} scale={[1, 0.6, 1.7]}><boxGeometry args={[0.11, 0.1, 0.12]} /><Flat color={look.shoes ?? "#2A2622"} /></M>
        </group>
      ))}
      {/* torso: a faceted barrel */}
      <group position={[0, 0.9, 0]} scale={[1, breathe, 1]}>
        <M scale={[1, 1, 0.75]}><cylinderGeometry args={[0.2, 0.17, 0.62, 7]} /><Flat color={look.top} /></M>
        <M position={[0, 0.34, 0]} scale={[1, 0.5, 0.75]}><icosahedronGeometry args={[0.2, 0]} /><Flat color={look.top} /></M>
      </group>
      {/* arms */}
      {[-1, 1].map((s) => {
        const right = s === 1;
        const lift = right ? -0.55 - 0.7 * gesture + wave : -0.45;
        return (
          <group key={s} position={[s * 0.25, 1.15, 0]} rotation={[lift, 0, s * 0.1]}>
            <M position={[0, -0.18, 0]}><cylinderGeometry args={[0.065, 0.055, 0.36, 6]} /><Flat color={look.top} /></M>
            <group position={[0, -0.36, 0]} rotation={[right ? -0.8 * gesture - 0.7 : -1.0, 0, 0]}>
              <M position={[0, -0.13, 0]}><cylinderGeometry args={[0.055, 0.05, 0.26, 6]} /><Flat color={look.top} /></M>
              <M position={[0, -0.29, 0]}><icosahedronGeometry args={[0.055, 0]} /><Flat color={look.skin} rough={0.7} /></M>
            </group>
          </group>
        );
      })}
      {/* neck + head */}
      <M position={[0, 1.31, 0]}><cylinderGeometry args={[0.06, 0.07, 0.12, 6]} /><Flat color={look.skin} /></M>
      <group position={[0, 1.5, 0]} rotation={[nod + headTilt, headTurn, 0]}>
        <M scale={[0.92, 1.08, 0.98]}><icosahedronGeometry args={[0.16, 1]} /><Flat color={look.skin} rough={0.65} /></M>
        {/* nose */}
        <M position={[0, -0.005, 0.155]} rotation={[0.2, 0, 0]}><coneGeometry args={[0.03, 0.06, 4]} /><Flat color={look.skin} /></M>
        {/* ears */}
        {[-1, 1].map((s) => <M key={s} position={[s * 0.15, 0, 0]} scale={[0.4, 1, 0.7]}><icosahedronGeometry args={[0.04, 0]} /><Flat color={look.skin} /></M>)}
        {/* eyes: white, dark pupil, blinking */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.055, 0.03, 0.14]} scale={[1, blink, 1]}>
            <M scale={[1, 0.7, 0.4]}><icosahedronGeometry args={[0.024, 0]} /><Flat color="#F4EFE6" rough={0.4} /></M>
            <M position={[0, 0, 0.008]} scale={[1, 1, 0.5]}><icosahedronGeometry args={[0.012, 0]} /><Flat color="#161210" rough={0.3} /></M>
          </group>
        ))}
        {/* brows */}
        {[-1, 1].map((s) => (
          <M key={s} position={[s * 0.058, browY, 0.145]} rotation={[0, 0, s * (0.12 - 0.1 * brows)]}><boxGeometry args={[0.06, 0.013, 0.02]} /><Flat color={look.hair} /></M>
        ))}
        {/* mouth */}
        <M position={[0, -0.075, 0.142]}><boxGeometry args={[0.05, mouth, 0.015]} /><Flat color="#3A1F1A" /></M>
        {/* hair cap */}
        <M position={[0, 0.045, -0.02]} rotation={[-0.45, 0, 0]} scale={[1, 0.85, 1.02]}>
          <sphereGeometry args={[0.165, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.45]} /><Flat color={look.hair} rough={0.95} />
        </M>
        {look.beard ? (
          <M position={[0, -0.075, 0.05]} scale={[0.95, 0.75, 0.9]}>
            <sphereGeometry args={[0.15, 8, 5, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} /><Flat color={look.hair} rough={0.95} />
          </M>
        ) : null}
        {look.cap ? (
          <group position={[0, 0.07, 0]} rotation={[-0.1, 0, 0]}>
            <M scale={[1, 0.7, 1]}><sphereGeometry args={[0.172, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2]} /><Flat color={look.cap} /></M>
            <M position={[0, 0, 0.17]} rotation={[0.15, 0, 0]}><boxGeometry args={[0.24, 0.018, 0.13]} /><Flat color={look.cap} /></M>
          </group>
        ) : null}
        {look.glasses ? (
          <group position={[0, 0.03, 0.158]}>
            {[-1, 1].map((s) => <mesh key={s} position={[s * 0.055, 0, 0]}><torusGeometry args={[0.032, 0.005, 4, 8]} /><Flat color="#1B1B1B" rough={0.3} /></mesh>)}
          </group>
        ) : null}
      </group>
    </group>
  );
};

// ---------- Doc v2: the robot head ----------

export const DOC_TEAL = "#1F9E8E";

type DocProps = {
  readonly position: Vec3;
  readonly frame: number;
  readonly talk?: number;
  readonly turn?: number;
  readonly color?: string;
  readonly size?: number;
  /** Eye glow colour; amber when it raises an alarm. */
  readonly eyes?: string;
};

/** Doc: a faceted teal robot head with a dark screen face, glowing eyes, a talking bar-mouth, antenna and orbit ring. */
export const DocBot: React.FC<DocProps> = ({ position, frame, talk = 0, turn = 0, color = DOC_TEAL, size = 0.3, eyes = "#F6E7B0" }) => {
  const hover = Math.sin(frame / 20) * 0.03;
  const bob = Math.abs(Math.sin(frame * 0.45)) * 0.025 * talk;
  const blink = frame % 113 < 3 ? 0.1 : 1;
  const ring = useMemo(() => new THREE.TorusGeometry(size * 1.45, 0.006, 4, 48), [size]);
  const bars = 7;
  return (
    <group position={[position[0], position[1] + hover + bob, position[2]]} rotation={[0, turn, Math.sin(frame / 45) * 0.04]}>
      <M><icosahedronGeometry args={[size, 1]} /><Flat color={color} rough={0.45} metal={0.1} /></M>
      {/* screen face */}
      <mesh position={[0, 0, size * 0.62]} rotation={[0, 0, 0]}>
        <circleGeometry args={[size * 0.72, 10]} />
        <meshStandardMaterial color="#0C1012" roughness={0.25} metalness={0.2} flatShading />
      </mesh>
      <mesh position={[0, 0, size * 0.6]}>
        <torusGeometry args={[size * 0.74, size * 0.05, 4, 10]} />
        <meshStandardMaterial color="#E9E2D3" roughness={0.5} flatShading />
      </mesh>
      {/* eyes */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * size * 0.26, size * 0.14, size * 0.64]} scale={[1, blink, 1]}>
          <boxGeometry args={[size * 0.2, size * 0.1, 0.01]} />
          <meshStandardMaterial color={eyes} emissive={eyes} emissiveIntensity={2.2} />
        </mesh>
      ))}
      {/* bar mouth that moves with speech */}
      {Array.from({ length: bars }).map((_, i) => {
        const h = size * (0.04 + 0.12 * talk * Math.abs(Math.sin(frame * 0.8 + i * 1.3)));
        return (
          <mesh key={i} position={[(i - (bars - 1) / 2) * size * 0.07, -size * 0.2, size * 0.64]}>
            <boxGeometry args={[size * 0.04, h, 0.01]} />
            <meshStandardMaterial color={eyes} emissive={eyes} emissiveIntensity={1.8} />
          </mesh>
        );
      })}
      {/* antenna */}
      <M position={[size * 0.05, size * 1.18, 0]}><cylinderGeometry args={[0.006, 0.006, size * 0.5, 5]} /><Flat color="#C9452B" /></M>
      <mesh position={[size * 0.05, size * 1.45, 0]}>
        <icosahedronGeometry args={[size * 0.08, 0]} />
        <meshStandardMaterial color="#F2C14E" emissive="#F2C14E" emissiveIntensity={1.4 + 0.6 * Math.sin(frame / 8)} flatShading />
      </mesh>
      {/* orbit ring */}
      <mesh geometry={ring} rotation={[Math.PI / 2 + 0.35, 0, frame / 40]}>
        <meshStandardMaterial color="#E9E2D3" roughness={0.4} transparent opacity={0.7} />
      </mesh>
    </group>
  );
};

// ---------- set: a warm studio / clinic office at night ----------

export const STUDIO_DESK_TOP = 0.74;

/** Night office: acoustic panels, coloured drapes, desk with laptop and a lamp, mic stand, warm practical light. */
export const NightStudio: React.FC<{ frame: number; screen?: string; lamp?: number }> = ({ frame, screen = "#7FB6FF", lamp = 1 }) => {
  const flicker = 1 + Math.sin(frame / 7) * 0.015 + Math.sin(frame / 3.3) * 0.01;
  const panels = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -2.4; x <= 2.4; x += 0.62) for (let y = 0.9; y <= 2.9; y += 0.62) out.push([x, y]);
    return out;
  }, []);
  return (
    <group>
      <hemisphereLight args={["#FFD9B0", "#1A1210", 0.35]} />
      {/* practical lamp: the warm key */}
      <pointLight position={[0.95, 1.35, 0.35]} intensity={7.5 * lamp * flicker} distance={6} decay={1.6} color="#FFB36B" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.002} />
      {/* cool laptop spill and a rim from the back */}
      <pointLight position={[-0.15, 1.05, 0.55]} intensity={1.6} distance={2.2} color={screen} />
      <directionalLight position={[-3, 3.2, -2.5]} intensity={0.9} color="#7FA8FF" />
      {/* floor, back wall, side wall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[12, 12]} /><Flat color="#3A2A22" /></mesh>
      <mesh position={[0, 2, -1.8]} receiveShadow><planeGeometry args={[12, 5]} /><Flat color="#4A3A30" /></mesh>
      <mesh position={[-2.6, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[8, 5]} /><Flat color="#3E3029" /></mesh>
      {/* acoustic foam panels */}
      {panels.map(([x, y], i) => (
        <M key={i} position={[x, y, -1.77]} rotation={[0, 0, (i % 2) * Math.PI / 2]}>
          <boxGeometry args={[0.56, 0.56, 0.05]} /><Flat color={i % 3 === 0 ? "#57463B" : "#4E3E34"} rough={1} />
        </M>
      ))}
      {/* coloured drapes on the left */}
      {[["#C99A3B", -2.4], ["#5E7A4A", -2.15], ["#A5452F", -1.92], ["#D9C27A", -1.7]].map(([c, x], i) => (
        <M key={i} position={[x as number, 1.6, -1.55 + i * 0.05]} rotation={[0, 0.2, 0]}><boxGeometry args={[0.2, 3.2, 0.04]} /><Flat color={c as string} rough={0.95} /></M>
      ))}
      {/* desk */}
      <M position={[0.35, STUDIO_DESK_TOP, -0.35]}><boxGeometry args={[1.5, 0.05, 0.7]} /><Flat color="#6B4A33" rough={0.7} /></M>
      {[[-0.35, -0.65], [1.05, -0.65], [-0.35, -0.05], [1.05, -0.05]].map(([x, z]) => (
        <M key={`${x}${z}`} position={[x, STUDIO_DESK_TOP / 2, z]}><boxGeometry args={[0.05, STUDIO_DESK_TOP, 0.05]} /><Flat color="#4D3525" /></M>
      ))}
      {/* laptop, open toward the chair */}
      <group position={[-0.05, STUDIO_DESK_TOP + 0.03, -0.3]} rotation={[0, 0.55, 0]}>
        <M><boxGeometry args={[0.42, 0.02, 0.3]} /><Flat color="#9AA0A8" rough={0.35} metal={0.3} /></M>
        <group position={[0, 0, -0.15]} rotation={[-0.25, 0, 0]}>
          <M position={[0, 0.14, 0]}><boxGeometry args={[0.42, 0.28, 0.015]} /><Flat color="#8C939C" rough={0.35} metal={0.3} /></M>
          <mesh position={[0, 0.14, 0.009]}><planeGeometry args={[0.38, 0.24]} /><meshStandardMaterial color={screen} emissive={screen} emissiveIntensity={0.9} /></mesh>
        </group>
      </group>
      {/* desk lamp */}
      <group position={[0.95, STUDIO_DESK_TOP + 0.03, -0.45]}>
        <M><cylinderGeometry args={[0.09, 0.1, 0.03, 8]} /><Flat color="#2B2B2B" /></M>
        <M position={[0, 0.25, 0]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.012, 0.012, 0.5, 5]} /><Flat color="#2B2B2B" /></M>
        <M position={[-0.12, 0.48, 0.12]} rotation={[0.6, 0, -0.5]}><coneGeometry args={[0.11, 0.16, 7, 1, true]} /><Flat color="#C9452B" /></M>
        <mesh position={[-0.1, 0.43, 0.15]}><icosahedronGeometry args={[0.04, 0]} /><meshStandardMaterial color="#FFE2B0" emissive="#FFC27A" emissiveIntensity={3 * lamp} /></mesh>
      </group>
      {/* mic on a stand, as in a creator's studio */}
      <group position={[0.15, 0, 0.55]}>
        <M position={[0, 0.02, 0]}><cylinderGeometry args={[0.16, 0.18, 0.03, 6]} /><Flat color="#1E1E1E" /></M>
        <M position={[0, 0.8, 0]}><cylinderGeometry args={[0.012, 0.012, 1.6, 5]} /><Flat color="#1E1E1E" /></M>
        <M position={[0, 1.62, 0.04]} rotation={[0.4, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 0.14, 6]} /><Flat color="#3A3A3A" metal={0.5} rough={0.4} /></M>
        <mesh position={[0, 1.66, 0.13]} rotation={[0.4, 0, 0]}><torusGeometry args={[0.08, 0.008, 4, 12]} /><Flat color="#1E1E1E" /></mesh>
      </group>
      {/* stool */}
      <M position={[-0.65, 0.48, 0]}><cylinderGeometry args={[0.24, 0.22, 0.1, 8]} /><Flat color="#B24A2A" rough={0.9} /></M>
      <M position={[-0.65, 0.22, 0]}><cylinderGeometry args={[0.2, 0.24, 0.42, 8]} /><Flat color="#933A21" rough={0.9} /></M>
    </group>
  );
};
