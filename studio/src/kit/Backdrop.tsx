import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Theme } from "./theme";

const textureCss = (theme: Theme, frame: number): React.CSSProperties => {
  const drift = frame * 0.4;
  switch (theme.texture) {
    case "grid":
      return {
        backgroundImage: `linear-gradient(${theme.muted}22 1px, transparent 1px), linear-gradient(90deg, ${theme.muted}22 1px, transparent 1px)`,
        backgroundSize: "54px 54px",
        backgroundPosition: `0 ${drift}px`,
      };
    case "dots":
      return {
        backgroundImage: `radial-gradient(${theme.muted}44 2px, transparent 2px)`,
        backgroundSize: "40px 40px",
        backgroundPosition: `${drift}px 0`,
      };
    case "lines":
      return {
        backgroundImage: `repeating-linear-gradient(0deg, ${theme.muted}18 0 2px, transparent 2px 6px)`,
      };
    case "noise":
      return {
        backgroundImage: `radial-gradient(circle at ${30 + Math.sin(frame / 40) * 20}% 30%, ${theme.accent}33, transparent 60%)`,
      };
    default:
      return {};
  }
};

export const Backdrop: React.FC<{ theme: Theme; children?: React.ReactNode }> = ({ theme, children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, color: theme.fg, fontFamily: theme.fontBody }}>
      <AbsoluteFill style={textureCss(theme, frame)} />
      {children}
    </AbsoluteFill>
  );
};
