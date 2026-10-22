import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Counter } from "./Counter";
import { pop, progress } from "./motion";
import type { Theme } from "./theme";

/**
 * Overlay widgets for edited footage. Each one is mounted in a <Sequence> that starts on
 * its word, with `hold` = how many frames it stays; it animates in and out by itself.
 */

const OUT = 8;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 -> 1 on entry (spring), 1 -> 0 over the last OUT frames. */
const life = (f: number, hold: number): number =>
  Math.min(pop(f, 0, 15), interpolate(f, [hold - OUT, hold], [1, 0], CLAMP));

type Base = { readonly theme: Theme; readonly hold: number };

/** Card that slides in from the side: small kicker + one line. Sits in the upper third. */
export const Callout: React.FC<Base & { kicker?: string; text: string; side?: "left" | "right"; y?: number }> = ({
  theme, hold, kicker, text, side = "left", y = 330,
}) => {
  const f = useCurrentFrame();
  const t = life(f, hold);
  const dir = side === "left" ? -1 : 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", top: y, [side]: 70, maxWidth: 760, padding: "26px 34px", borderRadius: 30,
        background: theme.surface, boxShadow: "0 24px 60px rgba(0,0,0,0.3)", borderLeft: side === "left" ? `10px solid ${theme.accent}` : undefined,
        borderRight: side === "right" ? `10px solid ${theme.accent}` : undefined,
        opacity: t, transform: `translateX(${(1 - t) * 160 * dir}px) rotate(${(1 - t) * 4 * dir}deg)`,
      }}>
        {kicker ? <div style={{ fontFamily: theme.fontMono, fontSize: 26, letterSpacing: "0.12em", color: theme.accent }}>{kicker}</div> : null}
        <div style={{ fontFamily: theme.fontBody, fontSize: 50, fontWeight: 700, color: theme.fg, lineHeight: 1.15, marginTop: kicker ? 6 : 0 }}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};

/** One huge word that slams onto the screen with a shake. For the single most important word. */
export const Slam: React.FC<Base & { text: string; y?: number }> = ({ theme, hold, text, y = 640 }) => {
  const f = useCurrentFrame();
  const t = life(f, hold);
  const shake = f < 10 ? (random(`slam-${f}`) - 0.5) * 24 * (1 - f / 10) : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: 0, right: 0, top: y - 120, textAlign: "center",
        fontFamily: theme.fontDisplay, fontSize: 230, fontWeight: 800, lineHeight: 1, color: theme.accent,
        WebkitTextStroke: "12px rgba(0,0,0,0.85)", paintOrder: "stroke fill", textShadow: "0 18px 50px rgba(0,0,0,0.5)",
        textTransform: "uppercase", opacity: t, transform: `translate(${shake}px, ${shake * 0.6}px) scale(${2.2 - 1.2 * Math.min(1, pop(f, 0, 11))})`,
      }}>{text}</div>
    </AbsoluteFill>
  );
};

/** Name + title bar, lower left, for introducing the speaker or a guest. */
export const LowerThird: React.FC<Base & { name: string; title?: string; y?: number }> = ({ theme, hold, name, title, y = 1080 }) => {
  const f = useCurrentFrame();
  const t = life(f, hold);
  const bar = progress(f, 0, 14);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 70, top: y, opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}>
        <div style={{ height: 8, width: 120 * bar, background: theme.accent, borderRadius: 4, marginBottom: 14 }} />
        <div style={{
          display: "inline-block", padding: "14px 26px", background: theme.fg, color: theme.bg, borderRadius: 14,
          fontFamily: theme.fontBody, fontSize: 46, fontWeight: 700, clipPath: `inset(0 ${100 - 100 * bar}% 0 0)`,
        }}>{name}</div>
        {title ? (
          <div style={{
            marginTop: 10, display: "inline-block", padding: "10px 22px", background: theme.surface, color: theme.fg, borderRadius: 12,
            fontFamily: theme.fontMono, fontSize: 28, letterSpacing: "0.04em", opacity: progress(f, 8, 12),
          }}>{title}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** Big counting number with a label and a required source tag. */
export const StatPop: React.FC<Base & { to: number; from?: number; prefix?: string; suffix?: string; label: string; source: string; y?: number }> = ({
  theme, hold, to, from = 0, prefix, suffix, label, source, y = 360,
}) => {
  const f = useCurrentFrame();
  const t = life(f, hold);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: 70, right: 70, top: y, display: "flex", flexDirection: "column", alignItems: "center",
        padding: "30px 30px 26px", borderRadius: 36, background: `${theme.surface}F2`, boxShadow: "0 30px 70px rgba(0,0,0,0.3)",
        opacity: t, transform: `scale(${0.8 + 0.2 * t})`,
      }}>
        <Counter to={to} from={from} prefix={prefix} suffix={suffix} duration={28}
          style={{ fontFamily: theme.fontDisplay, fontSize: 190, lineHeight: 1, color: theme.accent, letterSpacing: "-0.03em" }} />
        <div style={{ fontFamily: theme.fontBody, fontSize: 44, fontWeight: 700, color: theme.fg, textAlign: "center", marginTop: 8 }}>{label}</div>
        <div style={{ fontFamily: theme.fontMono, fontSize: 22, color: theme.muted, marginTop: 12, letterSpacing: "0.06em" }}>{`SOURCE: ${source}`}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Animated arrow pointing at a spot (x, y in px), drawn on with a bounce. */
export const Arrow: React.FC<Base & { x: number; y: number; from?: "left" | "right" | "top"; label?: string }> = ({
  theme, hold, x, y, from = "left", label,
}) => {
  const f = useCurrentFrame();
  const t = life(f, hold);
  const draw = progress(f, 0, 14);
  const bob = Math.sin(f / 5) * 8;
  const angle = from === "left" ? 0 : from === "right" ? 180 : 90;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: t }}>
      <div style={{ position: "absolute", left: x, top: y, transform: `rotate(${angle}deg) translateX(${-230 + bob}px)`, transformOrigin: "0 0" }}>
        <svg width={220} height={80} viewBox="0 0 220 80" style={{ overflow: "visible" }}>
          <path d="M5 60 Q 90 0 200 40" stroke={theme.accent} strokeWidth={12} fill="none" strokeLinecap="round"
            strokeDasharray={260} strokeDashoffset={260 * (1 - draw)} />
          <path d="M175 18 L205 41 L172 58" stroke={theme.accent} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={draw} />
        </svg>
      </div>
      {label ? (
        <div style={{
          position: "absolute", left: from === "right" ? x + 40 : x - 520, top: y - 120, width: 480, textAlign: from === "right" ? "left" : "right",
          fontFamily: theme.fontBody, fontSize: 44, fontWeight: 800, color: "#fff", WebkitTextStroke: "8px rgba(0,0,0,0.8)", paintOrder: "stroke fill",
        }}>{label}</div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Full-frame flash for a hard beat (pairs with a cut or a slam). */
export const Flash: React.FC<{ color?: string; hold?: number }> = ({ color = "#FFFFFF", hold = 8 }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: color, opacity: interpolate(f, [0, 1, hold], [0, 0.85, 0], CLAMP), pointerEvents: "none" }} />;
};

/** Burst of sparks around a point: a small celebratory accent. */
export const Burst: React.FC<Base & { x?: number; y?: number; count?: number }> = ({ theme, hold, x = 540, y = 760, count = 14 }) => {
  const f = useCurrentFrame();
  const t = progress(f, 0, Math.min(hold, 24));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + random(`b${i}`) * 0.4;
        const r = 80 + 260 * t * (0.7 + 0.5 * random(`r${i}`));
        const size = 14 + 14 * random(`s${i}`);
        return (
          <div key={i} style={{
            position: "absolute", left: x + Math.cos(a) * r - size / 2, top: y + Math.sin(a) * r - size / 2, width: size, height: size,
            borderRadius: i % 2 ? "50%" : 4, background: i % 3 ? theme.accent : theme.surface, opacity: 1 - t,
            transform: `rotate(${t * 180}deg)`,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Picture-in-picture card for a screenshot or clip while the speaker keeps talking. */
export const PictureCard: React.FC<Base & { children: React.ReactNode; y?: number; width?: number; tilt?: number }> = ({
  hold, children, y = 300, width = 760, tilt = -2,
}) => {
  const f = useCurrentFrame();
  const t = life(f, hold);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", top: y, left: (1080 - width) / 2, width, borderRadius: 34, overflow: "hidden",
        boxShadow: "0 40px 90px rgba(0,0,0,0.45)", border: "6px solid #fff",
        opacity: t, transform: `translateY(${(1 - t) * 120}px) rotate(${tilt * t}deg) scale(${0.9 + 0.1 * t})`,
      }}>{children}</div>
    </AbsoluteFill>
  );
};

/** Thin progress bar across the top for the whole video. */
export const ProgressLine: React.FC<{ theme: Theme; total: number; top?: number }> = ({ theme, total, top = 210 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 80, right: 80, top, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.3)" }}>
        <div style={{ width: `${Math.min(1, f / total) * 100}%`, height: "100%", borderRadius: 4, background: theme.accent }} />
      </div>
    </AbsoluteFill>
  );
};
