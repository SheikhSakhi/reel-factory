import React, { createContext, useContext } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EASE_OUT, pop, progress } from "./motion";
import type { Theme } from "./theme";
import { wordFrame, scene as sceneOf, type VoTake } from "./voiceover";

/**
 * Explainer panels: per-video animation drawn in code, shown above the speaker (split layout)
 * or full screen (panel layout) while the voice continues.
 *
 * A panel is a React component for one scene, written per video in src/edits/<slug>/Panels.tsx:
 *
 *   export const panels: Panels = {
 *     S2: () => {
 *       const at = usePanelAt;                     // spoken word -> local frame
 *       const { width, height, theme } = usePanel();
 *       return (<PanelBackdrop>
 *         <DrawIcon icon={HeartPulse} color={theme.accent} at={at("S2:heart")} />
 *       </PanelBackdrop>);
 *     },
 *   };
 */
export type PanelInfo = {
  readonly take: VoTake;
  /** Absolute frame where this panel's scene starts (its Sequence offset). */
  readonly from: number;
  readonly width: number;
  readonly height: number;
  readonly theme: Theme;
};

export type Panels = Readonly<Record<string, React.FC>>;

export const PanelContext = createContext<PanelInfo | null>(null);

export const usePanel = (): PanelInfo => {
  const info = useContext(PanelContext);
  if (!info) throw new Error("usePanel() must be used inside a panel rendered by EditedReel");
  return info;
};

/**
 * Local frame of a spoken word for the current panel: "S2:three", "S2:three#1" (second time),
 * "S2:start". Words from other scenes work too (negative before the panel starts).
 */
export const usePanelAt = (at: string): number => {
  const { take, from } = usePanel();
  const m = at.match(/^(S\d+):(.+?)(?:#(\d+))?$/);
  if (!m) throw new Error(`panel moment "${at}" must look like "S2:word"`);
  if (m[2] === "start") return sceneOf(take, m[1]).from - from;
  return wordFrame(take, m[1], m[2], m[3] ? parseInt(m[3], 10) : 0) - from;
};

/** Panel background: the brand's dark theme with a faint grid and a soft glow, like an explainer screen. */
export const PanelBackdrop: React.FC<{ children?: React.ReactNode; glow?: string; grid?: boolean }> = ({ children, glow, grid = true }) => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const light = glow ?? theme.accent;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at ${50 + Math.sin(f / 60) * 8}% 35%, ${light}2E, transparent 60%)`,
      }} />
      {grid ? (
        <AbsoluteFill style={{
          backgroundImage: `linear-gradient(${theme.fg}0D 1px, transparent 1px), linear-gradient(90deg, ${theme.fg}0D 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
      ) : null}
      {children}
    </AbsoluteFill>
  );
};

/** Text that fades up at a frame. */
export const Label: React.FC<{ text: string; at: number; size?: number; color?: string; font?: "display" | "body" | "mono"; weight?: number; italic?: boolean; style?: React.CSSProperties }> = ({
  text, at, size = 44, color, font = "display", weight = 700, italic = false, style,
}) => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const t = interpolate(f, [at, at + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });
  const family = font === "display" ? theme.fontDisplay : font === "mono" ? theme.fontMono : theme.fontBody;
  return (
    <div style={{
      fontFamily: family, fontSize: size, fontWeight: weight, fontStyle: italic ? "italic" : "normal", color: color ?? theme.fg,
      opacity: t, transform: `translateY(${(1 - t) * 16}px)`, ...style,
    }}>{text}</div>
  );
};

export type Bar = { readonly label: string; readonly value: number; readonly color?: string; readonly at: number; readonly display?: string };

/** Bars that grow at their own moments, with value labels; `max` fixes the scale. */
export const BarChart: React.FC<{ bars: readonly Bar[]; width: number; height: number; max?: number; barWidth?: number }> = ({
  bars, width, height, max, barWidth = 120,
}) => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const top = max ?? Math.max(...bars.map((b) => b.value));
  const slot = width / bars.length;
  return (
    <div style={{ position: "relative", width, height: height + 60 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: height, height: 3, background: `${theme.fg}55` }} />
      {bars.map((b, i) => {
        const t = interpolate(f, [b.at, b.at + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });
        const h = (b.value / top) * height * t;
        const left = slot * i + (slot - barWidth) / 2;
        return (
          <React.Fragment key={b.label}>
            <div style={{ position: "absolute", left, width: barWidth, top: height - h, height: h, background: b.color ?? theme.fg, borderRadius: "8px 8px 0 0" }} />
            <div style={{
              position: "absolute", left: left - 40, width: barWidth + 80, top: height - h - 52, textAlign: "center",
              fontFamily: theme.fontBody, fontWeight: 700, fontSize: 34, color: theme.fg, opacity: progress(f, b.at + 14, 8),
            }}>{b.display ?? b.value.toLocaleString("ru-RU")}</div>
            <div style={{
              position: "absolute", left: left - 40, width: barWidth + 80, top: height + 14, textAlign: "center",
              fontFamily: theme.fontDisplay, fontSize: 28, color: b.color ?? theme.muted, opacity: progress(f, b.at, 8),
            }}>{b.label}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export type Row = { readonly text: string; readonly right?: string; readonly at: number; readonly mark?: { readonly at: number; readonly color: string } };

/** A paper card (menu, list, plan, prescription) whose rows appear and get marked on cue. */
export const PaperCard: React.FC<{ title: string; rows: readonly Row[]; at: number; width?: number; paper?: string; ink?: string; accent?: string; tilt?: number }> = ({
  title, rows, at, width = 640, paper = "#F2EBDD", ink = "#2A2320", accent = "#9C2B2B", tilt = -1.5,
}) => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const t = pop(f, at, 15);
  return (
    <div style={{
      width, padding: "40px 46px 44px", background: paper, borderRadius: 14, boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
      opacity: f < at ? 0 : t, transform: `translateY(${(1 - t) * 60}px) rotate(${tilt * t}deg)`,
    }}>
      <div style={{ fontFamily: theme.fontDisplay, fontStyle: "italic", fontSize: 46, color: accent, textAlign: "center", marginBottom: 26 }}>{title}</div>
      {rows.map((r) => {
        const show = progress(f, r.at, 10);
        const mark = r.mark ? progress(f, r.mark.at, 10) : 0;
        return (
          <div key={r.text} style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "12px 14px", opacity: show,
            transform: `translateX(${(1 - show) * -20}px)` }}>
            {r.mark ? (
              <div style={{ position: "absolute", inset: 0, borderRadius: 10, border: `4px solid ${r.mark.color}`, background: `${r.mark.color}22`,
                clipPath: `inset(0 ${100 - mark * 100}% 0 0)` }} />
            ) : null}
            <span style={{ position: "relative", fontFamily: theme.fontDisplay, fontSize: 34, color: ink }}>{r.text}</span>
            {r.right ? <span style={{ position: "relative", fontFamily: theme.fontDisplay, fontSize: 30, color: accent }}>{r.right}</span> : null}
          </div>
        );
      })}
    </div>
  );
};

/** A photo or screenshot card (path under public/) that pops in. */
export const ImageCard: React.FC<{ src: string; at: number; width: number; height: number; radius?: number; tilt?: number; border?: string }> = ({
  src, at, width, height, radius = 26, tilt = 0, border = "rgba(255,255,255,0.12)",
}) => {
  const f = useCurrentFrame();
  const t = pop(f, at, 14);
  return (
    <div style={{
      width, height, borderRadius: radius, overflow: "hidden", border: `3px solid ${border}`, boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
      opacity: f < at ? 0 : t, transform: `scale(${0.85 + 0.15 * t}) rotate(${tilt * t}deg)`,
    }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
};
