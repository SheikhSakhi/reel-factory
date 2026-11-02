import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { NarratorLights, TiNarrator, type NarratorLook } from "../../kit/Narrator3D";
import { BRAND } from "../../brand/brand";

// Design round for the S1E4 narrator: each look composited where the old robot stood, over a real S1E4 frame.
const LABEL: Record<NarratorLook, string> = { cube: "A · Floating cube", companion: "B · Companion (body + arms)", lantern: "C · Lantern (lit, antenna)" };


export const TiDesign: React.FC<{ look: NarratorLook }> = ({ look }) => {
  const f = useCurrentFrame();
  const talk = 0.6 + 0.4 * Math.abs(Math.sin(f * 0.8));
  return (
    <AbsoluteFill style={{ background: "#0C0C0E" }}>
      <Img src={staticFile("edit/s1e4-dark/preview.jpg")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
      {/* cover the old robot */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1380, height: 540,
        background: "linear-gradient(180deg, rgba(12,12,14,0) 0%, #0C0C0E 22%, #0C0C0E 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1220, height: 700 }}>
        <ThreeCanvas width={1080} height={700} dpr={1} gl={{ antialias: true, preserveDrawingBuffer: true }}
          camera={{ position: [0, 0.75, 4.2], fov: 30 }}>
          <NarratorLights />
          <group position={[0, look === "companion" ? -1.05 : -0.75, 0]} rotation={[0.05, -0.25, 0]} scale={1.2}>
            <TiNarrator frame={f} talk={talk} look={look} gesture={look === "companion" ? 0.6 : 0} />
          </group>
        </ThreeCanvas>
      </div>
      <div style={{ position: "absolute", left: 40, top: 40, padding: "10px 18px", borderRadius: 10, background: "#FFFFFF14", color: "#FFFFFFCC",
        fontFamily: BRAND.theme.fontMono, fontSize: 26 }}>DESIGN {LABEL[look]}</div>
    </AbsoluteFill>
  );
};
