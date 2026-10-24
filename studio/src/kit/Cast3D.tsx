import React, { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * The recurring cast for character formats (formats-lab F1/F2), built from primitives so every
 * episode is reproducible in code: Doc (the DocX mascot), faceless people, a consult-room set
 * and a cut-based camera. Use inside <ThreeCanvas> from @remotion/three; pass `frame` down.
 *
 * Units are metres. The set's desk is centred at the origin along x; y is up.
 */

export type Vec3 = readonly [number, number, number];

const v3 = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);

/** 0..1 speech energy: syllable-like pulses while one of `words` is being spoken. */
export const talkLevel = (frame: number, words: readonly { frame: number; endFrame: number }[]): number => {
  const w = words.find((x) => frame >= x.frame - 1 && frame <= x.endFrame + 1);
  if (!w) return 0;
  return 0.35 + 0.65 * Math.abs(Math.sin((frame - w.frame) * 0.9));
};

// ---------- Camera ----------

export type Shot = {
  readonly pos: Vec3;
  readonly look: Vec3;
  readonly fov?: number;
  /** Slow move over the shot: the camera travels this offset from start to end. */
  readonly drift?: Vec3;
};

/** Places the camera for the current shot. `t` is 0..1 progress through the shot. */
export const CameraRig: React.FC<{ shot: Shot; t: number }> = ({ shot, t }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    const d = shot.drift ?? [0, 0, 0];
    const ease = t * t * (3 - 2 * t);
    camera.position.set(shot.pos[0] + d[0] * ease, shot.pos[1] + d[1] * ease, shot.pos[2] + d[2] * ease);
    camera.fov = shot.fov ?? 38;
    camera.near = 0.05;
    camera.far = 60;
    camera.updateProjectionMatrix();
    camera.lookAt(v3(shot.look));
  }, [camera, shot, t]);
  return null;
};

// ---------- Doc, the mascot ----------

export const DOC_TEAL = "#1FA392";

type DocProps = {
  readonly position: Vec3;
  readonly frame: number;
  readonly talk?: number;
  /** Turn (radians around y) to face someone or the camera. */
  readonly turn?: number;
  readonly color?: string;
  readonly size?: number;
};

/** Doc: a soft teal rounded cube with pill eyes. Hovers, blinks, bounces when it talks. */
export const Doc: React.FC<DocProps> = ({ position, frame, talk = 0, turn = 0, color = DOC_TEAL, size = 0.42 }) => {
  const body = useMemo(() => new RoundedBoxGeometry(size, size, size, 6, size * 0.18), [size]);
  const eye = useMemo(() => new THREE.CapsuleGeometry(size * 0.055, size * 0.16, 6, 12), [size]);
  const hover = Math.sin(frame / 18) * 0.025;
  const bounce = Math.abs(Math.sin(frame * 0.45)) * 0.035 * talk;
  const squash = 1 - 0.05 * talk * Math.abs(Math.sin(frame * 0.45));
  // Blink every ~3.3 s for 4 frames, a second blink offset so it feels alive.
  const cycle = frame % 100;
  const blink = cycle < 4 || (frame % 230 > 120 && frame % 230 < 124) ? 0.12 : 1;
  const half = size / 2;
  return (
    <group position={[position[0], position[1] + hover + bounce, position[2]]} rotation={[0, turn, Math.sin(frame / 40) * 0.03]}>
      <mesh geometry={body} castShadow receiveShadow scale={[1 + (1 - squash) * 0.5, squash, 1 + (1 - squash) * 0.5]}>
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} geometry={eye} position={[side * size * 0.17, size * 0.06, half + 0.002]} scale={[1, blink, 0.5]}>
          <meshStandardMaterial color="#0E1A1A" roughness={0.2} />
        </mesh>
      ))}
      {/* contact shadow on the surface below */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -half - 0.11 - hover - bounce, 0]}>
        <circleGeometry args={[size * 0.45, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18 - hover * 1.5} />
      </mesh>
    </group>
  );
};

// ---------- Faceless people ----------

export type Look = {
  readonly skin: string;
  readonly hair: string;
  readonly top: string;
  readonly pants: string;
  readonly shoes?: string;
  /** A white coat over `top` (doctor). */
  readonly coat?: string;
  readonly glasses?: boolean;
  readonly beard?: boolean;
  readonly hat?: string;
};

type PersonProps = {
  readonly look: Look;
  readonly position: Vec3;
  /** Facing direction around y; 0 faces +z. */
  readonly turn?: number;
  readonly frame: number;
  readonly talk?: number;
  readonly seated?: boolean;
  /** 0..1 raise of the right forearm (talking with hands). */
  readonly gesture?: number;
  /** Head turn relative to the body (radians). */
  readonly headTurn?: number;
  readonly headTilt?: number;
};

const Part: React.FC<{ color: string; children: React.ReactNode; position?: Vec3; rotation?: Vec3; scale?: Vec3; rough?: number }> = ({
  color, children, position, rotation, scale, rough = 0.8,
}) => (
  <mesh position={position as [number, number, number]} rotation={rotation as [number, number, number]} scale={scale as [number, number, number]} castShadow receiveShadow>
    {children}
    <meshStandardMaterial color={color} roughness={rough} />
  </mesh>
);

/** A stylised faceless person (no eyes, no mouth: anyone can be them). */
export const Person: React.FC<PersonProps> = ({
  look, position, turn = 0, frame, talk = 0, seated = true, gesture = 0, headTurn = 0, headTilt = 0,
}) => {
  const breathe = 1 + Math.sin(frame / 22) * 0.012;
  const nod = Math.sin(frame * 0.32) * 0.07 * talk;
  const hipY = seated ? 0.5 : 0.92;
  const chestY = hipY + 0.36;
  const shoulderY = hipY + 0.6;
  const headY = hipY + 0.86;
  const torsoColor = look.coat ?? look.top;
  const wave = Math.sin(frame * 0.18) * 0.12 * gesture;
  return (
    <group position={position as [number, number, number]} rotation={[0, turn, 0]}>
      {/* legs */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.1, hipY, 0]}>
          {seated ? (
            <>
              <Part color={look.pants} position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}><capsuleGeometry args={[0.085, 0.36, 6, 12]} /></Part>
              <Part color={look.pants} position={[0, -0.25, 0.44]}><capsuleGeometry args={[0.075, 0.38, 6, 12]} /></Part>
              <Part color={look.shoes ?? "#2A2A2A"} position={[0, -0.47, 0.5]} scale={[1, 0.6, 1.6]}><sphereGeometry args={[0.075, 16, 12]} /></Part>
            </>
          ) : (
            <>
              <Part color={look.pants} position={[0, -0.42, 0]}><capsuleGeometry args={[0.085, 0.7, 6, 12]} /></Part>
              <Part color={look.shoes ?? "#2A2A2A"} position={[0, -0.88, 0.05]} scale={[1, 0.6, 1.6]}><sphereGeometry args={[0.075, 16, 12]} /></Part>
            </>
          )}
        </group>
      ))}
      {/* torso */}
      <group position={[0, chestY, 0]} scale={[1, breathe, 1]}>
        <Part color={torsoColor} scale={[1, 1, 0.78]}><capsuleGeometry args={[0.2, 0.36, 8, 20]} /></Part>
        {look.coat ? (
          // the shirt showing in the open coat
          <Part color={look.top} position={[0, 0.08, 0.152]} rotation={[-0.08, 0, 0]} scale={[1, 1.4, 0.3]}><coneGeometry args={[0.09, 0.3, 3]} /></Part>
        ) : null}
        {look.coat ? (
          // stethoscope
          <mesh position={[0, 0.2, 0.06]} rotation={[Math.PI / 2.4, 0, 0]} castShadow>
            <torusGeometry args={[0.13, 0.012, 8, 32, Math.PI * 1.25]} />
            <meshStandardMaterial color="#2D3A44" roughness={0.4} />
          </mesh>
        ) : null}
      </group>
      {/* arms: left rests, right gestures while talking */}
      {[-1, 1].map((side) => {
        const right = side === 1;
        const lift = right ? -0.5 - 0.7 * gesture + wave : -0.35;
        return (
          <group key={side} position={[side * 0.25, shoulderY, 0]} rotation={[lift, 0, side * 0.12]}>
            <Part color={torsoColor} position={[0, -0.2, 0]}><capsuleGeometry args={[0.065, 0.3, 6, 12]} /></Part>
            <group position={[0, -0.38, 0]} rotation={[right ? -0.9 * gesture - 0.6 : -0.9, 0, 0]}>
              <Part color={look.coat ? look.coat : look.top} position={[0, -0.12, 0]}><capsuleGeometry args={[0.058, 0.2, 6, 12]} /></Part>
              <Part color={look.skin} position={[0, -0.27, 0]} rough={0.6}><sphereGeometry args={[0.062, 14, 10]} /></Part>
            </group>
          </group>
        );
      })}
      {/* neck + head */}
      <Part color={look.skin} position={[0, shoulderY + 0.07, 0]} rough={0.6}><cylinderGeometry args={[0.06, 0.07, 0.12, 14]} /></Part>
      <group position={[0, headY, 0]} rotation={[nod + headTilt, headTurn, 0]}>
        <Part color={look.skin} scale={[0.92, 1.06, 0.98]} rough={0.55}><sphereGeometry args={[0.15, 28, 20]} /></Part>
        {/* hair: a cap over the top and back of the head */}
        <Part color={look.hair} position={[0, 0.01, -0.01]} rotation={[-0.6, 0, 0]} scale={[0.97, 1.04, 1.02]} rough={0.9}>
          <sphereGeometry args={[0.154, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
        </Part>
        {look.beard ? (
          <Part color={look.hair} position={[0, -0.085, 0.05]} scale={[0.82, 0.55, 0.72]} rough={0.95}>
            <sphereGeometry args={[0.13, 20, 14, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55]} />
          </Part>
        ) : null}
        {look.glasses ? (
          <group position={[0, 0.005, 0.142]}>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.05, 0, 0]}>
                <torusGeometry args={[0.034, 0.006, 8, 24]} />
                <meshStandardMaterial color="#1B1B1B" roughness={0.3} />
              </mesh>
            ))}
            <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.004, 0.004, 0.035, 6]} /><meshStandardMaterial color="#1B1B1B" /></mesh>
          </group>
        ) : null}
        {look.hat ? (
          <group position={[0, 0.1, 0]}>
            <Part color={look.hat} scale={[1, 0.62, 1]}><sphereGeometry args={[0.162, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /></Part>
            <Part color={look.hat} position={[0, -0.005, 0]}><cylinderGeometry args={[0.24, 0.26, 0.02, 32]} /></Part>
          </group>
        ) : null}
      </group>
    </group>
  );
};

// ---------- Set: a sunlit consult room ----------

const Box: React.FC<{ size: Vec3; position: Vec3; color: string; rough?: number; rotation?: Vec3; emissive?: string }> = ({
  size, position, color, rough = 0.8, rotation, emissive,
}) => (
  <mesh position={position as [number, number, number]} rotation={rotation as [number, number, number]} castShadow receiveShadow>
    <boxGeometry args={size as [number, number, number]} />
    <meshStandardMaterial color={color} roughness={rough} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? 1 : 0} />
  </mesh>
);

export const DESK_TOP = 0.76;

const Chair: React.FC<{ position: Vec3; turn: number; color: string }> = ({ position, turn, color }) => (
  <group position={position as [number, number, number]} rotation={[0, turn, 0]}>
    <Box size={[0.5, 0.06, 0.48]} position={[0, 0.46, 0.05]} color={color} />
    <Box size={[0.5, 0.55, 0.06]} position={[0, 0.76, -0.2]} color={color} />
    {[[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.24], [0.2, 0.24]].map(([x, z]) => (
      <Box key={`${x}${z}`} size={[0.04, 0.44, 0.04]} position={[x, 0.22, z]} color="#3B3B3B" />
    ))}
  </group>
);

/** A warm consult room: desk at the origin, window light from the left, a plant, a frame. */
export const ConsultRoom: React.FC<{ frame: number; pill?: boolean }> = ({ frame, pill = true }) => {
  const dust = Math.sin(frame / 50) * 0.02;
  return (
    <group>
      {/* light: low warm sun through the window + soft fill */}
      <hemisphereLight args={["#FFF4E2", "#7A5A44", 0.75]} />
      <directionalLight
        position={[-4.5, 4.2, 1.6]} intensity={2.6} color="#FFD9A8" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-4} shadow-camera-right={4}
        shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0004}
      />
      <pointLight position={[1.8, 2.4, 2.2]} intensity={6} distance={9} color="#BFE3FF" />
      {/* floor, walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[14, 14]} /><meshStandardMaterial color="#B98D62" roughness={0.9} /></mesh>
      <mesh position={[0, 2, -2.2]} receiveShadow><planeGeometry args={[14, 4]} /><meshStandardMaterial color="#E9E0D1" roughness={0.95} /></mesh>
      <mesh position={[-2.8, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[10, 4]} /><meshStandardMaterial color="#D6E4DF" roughness={0.95} /></mesh>
      {/* window on the left wall, glowing */}
      <Box size={[0.04, 1.5, 1.3]} position={[-2.78, 1.75, -0.3]} color="#FFF6E0" emissive="#FFE9C2" />
      <Box size={[0.06, 1.56, 0.05]} position={[-2.76, 1.75, -0.3]} color="#F5F0E8" />
      <Box size={[0.06, 0.05, 1.36]} position={[-2.76, 1.75, -0.3]} color="#F5F0E8" />
      {/* framed certificate */}
      <Box size={[0.62, 0.46, 0.03]} position={[0.6, 1.95, -2.18]} color="#5C4632" />
      <Box size={[0.52, 0.36, 0.01]} position={[0.6, 1.95, -2.16]} color="#F7F2E6" />
      {/* plant */}
      <group position={[-2.1, 0, -1.6]}>
        <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.2, 0.16, 0.44, 20]} /><meshStandardMaterial color="#C8643A" roughness={0.8} /></mesh>
        {[[0, 0.75, 0, 0.3], [0.18, 0.62, 0.08, 0.22], [-0.16, 0.66, -0.06, 0.24], [0.04, 0.98, -0.05, 0.2]].map(([x, y, z, r]) => (
          <mesh key={`${x}${y}`} position={[x, y + dust, z]} castShadow><sphereGeometry args={[r, 16, 12]} /><meshStandardMaterial color="#3F7D4E" roughness={0.85} /></mesh>
        ))}
      </group>
      {/* desk */}
      <Box size={[1.9, 0.06, 0.95]} position={[0, DESK_TOP, 0]} color="#7A5236" rough={0.6} />
      <Box size={[1.8, 0.62, 0.04]} position={[0, DESK_TOP - 0.34, -0.42]} color="#6A4730" />
      {[-0.88, 0.88].map((x) => <Box key={x} size={[0.06, DESK_TOP, 0.85]} position={[x, DESK_TOP / 2, 0]} color="#6A4730" />)}
      {/* laptop (doctor's side, facing the doctor) */}
      <group position={[0.35, DESK_TOP + 0.03, -0.18]}>
        <Box size={[0.42, 0.02, 0.3]} position={[0, 0, 0]} color="#C9CDD2" rough={0.3} />
        <group position={[0, 0.0, -0.15]} rotation={[-0.3, 0, 0]}>
          <Box size={[0.42, 0.28, 0.015]} position={[0, 0.14, 0]} color="#B9BEC4" rough={0.3} />
        </group>
      </group>
      {/* mug */}
      <mesh position={[0.72, DESK_TOP + 0.07, 0.2]} castShadow><cylinderGeometry args={[0.05, 0.045, 0.12, 20]} /><meshStandardMaterial color="#F4EFE7" roughness={0.5} /></mesh>
      {/* the untouched pill bottle (the episode's prop) */}
      {pill ? (
        <group position={[-0.05, DESK_TOP + 0.03, 0.22]}>
          <mesh position={[0, 0.07, 0]} castShadow><cylinderGeometry args={[0.045, 0.045, 0.14, 20]} /><meshStandardMaterial color="#E08A1E" roughness={0.3} transparent opacity={0.92} /></mesh>
          <mesh position={[0, 0.155, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.035, 20]} /><meshStandardMaterial color="#FFFFFF" roughness={0.5} /></mesh>
          <mesh position={[0, 0.07, 0.046]}><planeGeometry args={[0.07, 0.06]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
        </group>
      ) : null}
      <Chair position={[0, 0, -0.78]} turn={0} color="#2F4858" />
      <Chair position={[0, 0, 0.82]} turn={Math.PI} color="#8A8F94" />
    </group>
  );
};
