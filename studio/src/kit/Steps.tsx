import React from "react";
import { useCurrentFrame } from "remotion";
import { pop } from "./motion";
import type { Theme } from "./theme";

type Props = { theme: Theme; items: readonly string[]; delay?: number; every?: number; size?: number };

/** Vertical timeline whose steps light up one after another. */
export const Steps: React.FC<Props> = ({ theme, items, delay = 0, every = 12, size = 76 }) => {
  const frame = useCurrentFrame();
  const current = Math.floor((frame - delay) / every);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
      {items.map((item, i) => {
        const t = pop(frame, delay + i * every);
        const isLit = i <= current;
        return (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 28, opacity: 0.25 + 0.75 * t }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: isLit ? theme.accent : theme.muted, transform: `scale(${t})` }} />
            <div style={{ fontSize: size, fontFamily: theme.fontDisplay, color: isLit ? theme.fg : theme.muted }}>{item}</div>
          </div>
        );
      })}
    </div>
  );
};
