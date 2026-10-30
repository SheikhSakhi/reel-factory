import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * A cinematic finish for code-rendered scenes: warm grade and contrast (wrap the scene in <Graded>), plus film grain,
 * a vignette and a soft warm glow on top (<CinemaGrade>). The grain changes every frame, like film.
 */
export const Graded: React.FC<{ children: React.ReactNode; warmth?: number; style?: React.CSSProperties }> = ({ children, warmth = 0.18, style }) => (
  <AbsoluteFill style={{ filter: `contrast(1.12) saturate(1.08) sepia(${warmth}) brightness(0.98)`, ...style }}>{children}</AbsoluteFill>
);

export const CinemaGrade: React.FC<{ grain?: number; vignette?: number; glow?: string; style?: React.CSSProperties }> = ({
  grain = 0.14, vignette = 0.55, glow = "#FF9A4A", style,
}) => {
  const f = useCurrentFrame();
  const id = `grain-${f}`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", ...style }}>
      {/* soft warm glow from the lamp side */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 55% at 78% 40%, ${glow}33 0%, transparent 60%)`, mixBlendMode: "screen" }} />
      {/* vignette */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 75% at 50% 48%, transparent 45%, rgba(8,4,2,${vignette}) 100%)` }} />
      {/* film grain: fresh noise every frame */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: grain, mixBlendMode: "overlay" }}>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 997} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};
