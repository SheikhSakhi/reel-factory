import React, { useMemo } from "react";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Ti, the orange narrator for the NVIDIA Certification Journey series (owned design, not a copy of any creator's
 * mascot): a rounded orange cube with a dark glass visor and one glowing line instead of eyes. The line widens and
 * brightens while it talks. Three looks for the design round: "cube" (a floating head), "companion" (head on a soft
 * body with arms, for gestures like the old robot), "lantern" (a softly lit cube with a smile line and an antenna).
 */
export type NarratorLook = "cube" | "companion" | "lantern";

const ORANGE = "#F07A2E";
const ORANGE_DEEP = "#D9621C";
const GLASS = "#14161D";
const LINE = "#7FF5E0";

const Mat: React.FC<{ color: string; rough?: number; metal?: number; emissive?: string; intensity?: number; clearcoat?: number }> = ({
  color, rough = 0.38, metal = 0, emissive, intensity = 0, clearcoat = 0.6,
}) => (
  <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clearcoat} clearcoatRoughness={0.25}
    emissive={emissive ?? "#000000"} emissiveIntensity={intensity} />
);

const useRounded = (w: number, h: number, d: number, r: number) => useMemo(() => new RoundedBoxGeometry(w, h, d, 6, r), [w, h, d, r]);

/** The head: the cube, its visor and the light line. talk 0..1. */
const Head: React.FC<{ frame: number; talk: number; look: NarratorLook }> = ({ frame, talk, look }) => {
  const cube = useRounded(1, 1, 1, 0.22);
  const visor = useRounded(0.84, 0.36, 0.1, 0.05);
  const blink = frame % 137 < 4 ? 0.25 : 1;
  const lineH = (0.03 + talk * 0.028) * blink;
  const glow = 1.6 + talk * 1.8;
  const lantern = look === "lantern";
  return (
    <group>
      <mesh geometry={cube} castShadow>
        <Mat color={ORANGE} rough={lantern ? 0.55 : 0.32} emissive={lantern ? "#FF8A3A" : undefined} intensity={lantern ? 0.35 + 0.15 * Math.sin(frame / 18) : 0} />
      </mesh>
      {/* the visor */}
      <mesh geometry={visor} position={[0, 0.06, 0.5]}>
        <Mat color={GLASS} rough={0.12} metal={0.2} clearcoat={1} />
      </mesh>
      {lantern ? (
        // a soft smile line
        <mesh position={[0, 0.16, 0.556]} rotation={[0, 0, Math.PI * 1.15]}>
          <torusGeometry args={[0.2, 0.022 + talk * 0.012, 12, 40, Math.PI * 0.7]} />
          <meshBasicMaterial color={LINE} toneMapped={false} />
        </mesh>
      ) : (
        <mesh position={[0, 0.06, 0.556]}>
          <boxGeometry args={[0.5 + talk * 0.08, lineH, 0.01]} />
          <meshStandardMaterial color={LINE} emissive={LINE} emissiveIntensity={glow} toneMapped={false} />
        </mesh>
      )}
      <pointLight position={[0, 0.06, 0.9]} intensity={0.05 + talk * 0.08} distance={0.9} color={LINE} />
      {/* small side tabs */}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.07, 32]} />
          <Mat color={look === "cube" ? GLASS : ORANGE_DEEP} rough={0.3} />
        </mesh>
      ))}
      {lantern ? (
        <group position={[0, 0.5, 0]}>
          <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.02, 0.02, 0.2, 10]} /><Mat color="#3A3A40" /></mesh>
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.07, 20, 14]} />
            <meshStandardMaterial color="#FFD58A" emissive="#FFC46B" emissiveIntensity={1.2 + 0.6 * Math.sin(frame / 10)} toneMapped={false} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

const Arm: React.FC<{ side: -1 | 1; raise: number }> = ({ side, raise }) => (
  <group position={[side * 0.46, 0.18, 0]} rotation={[0, 0, side * (0.25 + raise * 1.1)]}>
    <mesh position={[0, -0.26, 0]} castShadow>
      <capsuleGeometry args={[0.08, 0.38, 8, 16]} />
      <Mat color={ORANGE_DEEP} rough={0.4} />
    </mesh>
    <mesh position={[0, -0.52, 0]}><sphereGeometry args={[0.1, 20, 14]} /><Mat color="#F3EEE6" rough={0.5} /></mesh>
  </group>
);

/** The narrator, standing (companion) or hovering (cube, lantern) with its base at the origin. */
export const TiNarrator: React.FC<{ frame: number; talk?: number; look?: NarratorLook; gesture?: number; turn?: number }> = ({
  frame, talk = 0, look = "cube", gesture = 0, turn = 0,
}) => {
  const hover = Math.sin(frame / 24) * 0.04;
  const nod = talk * 0.05 * Math.sin(frame / 3.1);
  const body = useRounded(0.8, 0.7, 0.55, 0.24);
  return (
    <group rotation={[0, turn, 0]}>
      {/* contact shadow (only when it stands on the ground) */}
      {look === "companion" ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <circleGeometry args={[look === "companion" ? 0.55 : 0.45, 48]} />
        <meshBasicMaterial color={look === "companion" ? "#000000" : "#FF8A3A"} transparent opacity={look === "companion" ? 0.35 : 0.16 - hover * 0.5} />
      </mesh> : null}
      {look === "companion" ? (
        <group position={[0, 0.02, 0]}>
          <mesh geometry={body} position={[0, 0.45, 0]} castShadow><Mat color="#F3EEE6" rough={0.45} /></mesh>
          <mesh position={[0, 0.82, 0]}><cylinderGeometry args={[0.1, 0.12, 0.12, 24]} /><Mat color={GLASS} /></mesh>
          <group position={[0, 0.45, 0]}>
            <Arm side={-1} raise={gesture * 0.3} />
            <Arm side={1} raise={gesture} />
          </group>
          <group position={[0, 1.22 + hover * 0.3, 0]} rotation={[nod, 0, 0]} scale={0.78}>
            <Head frame={frame} talk={talk} look={look} />
          </group>
        </group>
      ) : (
        <group position={[0, 0.85 + hover, 0]} rotation={[nod, Math.sin(frame / 60) * 0.08, Math.sin(frame / 50) * 0.03]}>
          <Head frame={frame} talk={talk} look={look} />
        </group>
      )}
    </group>
  );
};

/** Studio light for the narrator on a dark background: a warm key, a cool rim, a soft fill. */
export const NarratorLights: React.FC = () => (
  <>
    <hemisphereLight args={["#DDE6FF", "#1A1410", 0.6]} />
    <directionalLight position={[2.5, 3, 3]} intensity={2.2} color="#FFE4C8" castShadow />
    <directionalLight position={[-3, 2, -2]} intensity={1.6} color="#7FB2FF" />
    <pointLight position={[0, 1.2, 2.2]} intensity={1.2} distance={6} color="#FFFFFF" />
  </>
);

