import React from "react";
import { useCurrentFrame } from "remotion";
import { pop, progress } from "./motion";

type Props = {
  text: string;
  size?: number;
  color?: string;
  font?: string;
  weight?: number;
  delay?: number;
  stagger?: number;
  mode?: "words" | "chars" | "type";
  align?: "center" | "left";
  style?: React.CSSProperties;
};

/** Headline that animates in word-by-word, char-by-char, or as a typewriter. */
export const KineticText: React.FC<Props> = ({
  text, size = 110, color, font, weight = 800, delay = 0, stagger = 3, mode = "words", align = "center", style,
}) => {
  const frame = useCurrentFrame();
  const base: React.CSSProperties = {
    fontSize: size, fontFamily: font, fontWeight: weight, color, lineHeight: 1.02,
    letterSpacing: "-0.03em", textAlign: align, whiteSpace: "pre-wrap", ...style,
  };

  if (mode === "type") {
    const shown = Math.floor(Math.max(0, frame - delay) / 2);
    const caretOn = Math.floor(frame / 15) % 2 === 0;
    return <div style={base}>{text.slice(0, shown)}<span style={{ opacity: caretOn ? 1 : 0 }}>▌</span></div>;
  }

  const units = mode === "chars" ? Array.from(text) : text.split(/(\s+)/);
  return (
    <div style={base}>
      {units.map((unit, i) => {
        if (/^\s+$/.test(unit)) return <span key={i}>{unit}</span>;
        const t = pop(frame, delay + i * stagger);
        const blur = (1 - progress(frame, delay + i * stagger, 10)) * 12;
        return (
          <span key={i} style={{
            display: "inline-block", opacity: t, filter: `blur(${blur}px)`,
            transform: `translateY(${(1 - t) * 60}px) scale(${0.85 + t * 0.15})`,
          }}>{unit}</span>
        );
      })}
    </div>
  );
};
