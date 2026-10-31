import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * A cinematic finish for code-rendered scenes: warm grade and contrast (wrap the scene in <Graded>), plus film grain,
 * a vignette and a soft warm glow on top (<CinemaGrade>). The grain changes every frame, like film.
 */
export const Graded: React.FC<{ children: React.ReactNode; warmth?: number; contrast?: number; brightness?: number; style?: React.CSSProperties }> = ({
  children, warmth = 0.18, contrast = 1.12, brightness = 0.98, style,
}) => (
  <AbsoluteFill style={{ filter: `contrast(${contrast}) saturate(1.06) sepia(${warmth}) brightness(${brightness})`, ...style }}>{children}</AbsoluteFill>
);

export const CinemaGrade: React.FC<{
  grain?: number; vignette?: number; glow?: string; style?: React.CSSProperties;
  /** Soft daylight beams falling from a window in the top-left, slowly breathing. */
  rays?: boolean;
  /** Milky haze that lifts the shadows (0..1), for bright, soft scenes. */
  haze?: number;
}> = ({ grain = 0.14, vignette = 0.55, glow = "#FF9A4A", style, rays = false, haze = 0 }) => {
  const f = useCurrentFrame();
  const id = `grain-${f}`;
  const breathe = 0.85 + 0.15 * Math.sin(f / 45);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", ...style }}>
      {haze > 0 ? <AbsoluteFill style={{ background: `rgba(255,248,236,${haze})`, mixBlendMode: "screen" }} /> : null}
      {rays ? (
        <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.55 * breathe, filter: "blur(18px)",
          background: [
            "linear-gradient(118deg, transparent 18%, rgba(255,240,210,0.38) 24%, transparent 31%)",
            "linear-gradient(118deg, transparent 33%, rgba(255,240,210,0.26) 38%, transparent 44%)",
            "linear-gradient(118deg, transparent 47%, rgba(255,240,210,0.18) 51%, transparent 57%)",
          ].join(", ") }} />
      ) : null}
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
