import React from "react";
import { useCurrentFrame } from "remotion";
import { pop } from "./motion";
import type { Theme } from "./theme";

type Props = {
  theme: Theme;
  center: string;
  nodes: readonly string[];
  /** Index of the node to highlight, or -1. */
  active?: number;
  delay?: number;
  radius?: number;
};

/** Hub-and-spoke diagram: a central model surrounded by agent nodes. */
export const Orbit: React.FC<Props> = ({ theme, center, nodes, active = -1, delay = 0, radius = 330 }) => {
  const frame = useCurrentFrame();
  const size = radius * 2 + 260;
  const spin = frame * 0.15;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{
        position: "absolute", left: 130, top: 130, width: radius * 2, height: radius * 2, borderRadius: "50%",
        border: `3px solid ${theme.muted}66`, opacity: pop(frame, delay),
      }} />
      {nodes.map((label, i) => {
        const angle = ((i / nodes.length) * 360 - 90 + spin) * (Math.PI / 180);
        const t = pop(frame, delay + 6 + i * 4);
        const isActive = i === active;
        return (
          <div key={label} style={{
            position: "absolute", left: size / 2 + Math.cos(angle) * radius - 110, top: size / 2 + Math.sin(angle) * radius - 110,
            width: 220, height: 220, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            textAlign: "center", fontSize: 30, fontWeight: 700, padding: 20, boxSizing: "border-box",
            background: isActive ? theme.accent : theme.surface, color: isActive ? theme.bg : theme.fg,
            transform: `scale(${t * (isActive ? 1.12 : 1)})`, border: `2px solid ${theme.muted}55`,
          }}>{label}</div>
        );
      })}
      <div style={{
        position: "absolute", left: size / 2 - 150, top: size / 2 - 150, width: 300, height: 300, borderRadius: "50%",
        background: theme.fg, color: theme.bg, display: "flex", alignItems: "center", justifyContent: "center",
        textAlign: "center", whiteSpace: "pre-line", fontSize: 54, fontWeight: 800, lineHeight: 1.05, transform: `scale(${pop(frame, delay)})`,
        fontFamily: theme.fontDisplay,
      }}>{center}</div>
    </div>
  );
};
