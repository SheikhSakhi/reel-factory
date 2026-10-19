import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { useT } from "./lang";
import { C, F, H, W } from "./style";

const FPS = 30;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** Long, calm ease-out: the house curve for every reveal. */
export const EASE = Easing.bezier(0.22, 1, 0.36, 1);

/** Critically damped spring: settles without bouncing. */
export const springAt = (f: number, at: number, damping = 13, stiffness = 170): number =>
  spring({ frame: f - at, fps: FPS, config: { damping: Math.max(damping, 18), stiffness: Math.min(stiffness, 140), mass: 0.8, overshootClamping: true } });

export const ramp = (f: number, at: number, dur = 12): number => interpolate(f, [at, at + dur], [0, 1], { ...CLAMP, easing: EASE });

/** 1 inside [from, to), fading in and out over `fade` frames. */
export const window01 = (f: number, from: number, to: number, fade = 10): number =>
  interpolate(f, [from, from + fade, to - fade, to], [0, 1, 1, 0], CLAMP);

// ── layout ───────────────────────────────────────────────────────────
export const Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...style }}>{children}</AbsoluteFill>
);

/** Positions children with their center at (x, y). */
export const At: React.FC<{ x: number; y: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, children, style }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", ...style }}>{children}</div>
);

/** Eases its children in: a short glide plus a defocus-to-sharp. No bounce. */
export const Pop: React.FC<{
  at: number; children: React.ReactNode; from?: "up" | "down" | "left" | "right" | "scale"; dist?: number; style?: React.CSSProperties; out?: number;
}> = ({ at, children, from = "up", dist = 60, style, out }) => {
  const f = useCurrentFrame();
  const t = ramp(f, at, 22);
  const o = out === undefined ? 1 : 1 - ramp(f, out, 12);
  const d = dist * 0.45;
  const dx = from === "left" ? -d : from === "right" ? d : 0;
  const dy = from === "up" ? d : from === "down" ? -d : 0;
  const s = from === "scale" ? 0.92 + 0.08 * t : 1;
  const blur = (1 - t) * 10;
  return (
    <div style={{
      opacity: t * o, filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
      transform: `translate(${dx * (1 - t)}px, ${dy * (1 - t)}px) scale(${s})`, ...style,
    }}>{children}</div>
  );
};

// ── type ─────────────────────────────────────────────────────────────
/**
 * Headline whose words rise out of a mask, one after another.
 * Wrap words in *stars* (one or several) to color them with `accent`.
 */
export const Words: React.FC<{
  text: string; at: number; size?: number; color?: string; accent?: string; stagger?: number; weight?: number;
  font?: string; align?: "center" | "left"; maxWidth?: number; lineHeight?: number; style?: React.CSSProperties;
}> = ({ text, at, size = 96, color = C.fg, accent = C.cyan, stagger = 3, weight = 600, font = F.display, align = "center", maxWidth = 1600, lineHeight = 1.06, style }) => {
  const f = useCurrentFrame();
  let open = false;
  const words = text.split(" ").map((raw) => {
    const starts = raw.startsWith("*");
    const ends = raw.endsWith("*") && (raw.length > 1 || !starts);
    const hot = open || starts;
    open = (open || starts) && !ends;
    return { word: raw.replace(/^\*/, "").replace(/\*$/, ""), hot };
  });
  return (
    <div style={{
      fontFamily: font, fontSize: size, fontWeight: weight, color, lineHeight, letterSpacing: "-0.035em",
      textAlign: align, width: "max-content", maxWidth, textWrap: "balance", ...style,
    }}>
      {words.map(({ word, hot }, i) => {
        const t = ramp(f, at + i * stagger, 20);
        return (
          <React.Fragment key={i}>
            {i > 0 ? " " : ""}
            <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", paddingBottom: size * 0.12, marginBottom: -size * 0.12 }}>
              <span style={{
                display: "inline-block", transform: `translateY(${(1 - t) * 105}%)`, opacity: 0.25 + 0.75 * t,
                color: hot ? accent : undefined,
                ...(hot ? { textShadow: `0 0 ${size * 0.5}px ${accent}40` } : {}),
              }}>{word}</span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 24, color = C.muted, style }) => (
  <div style={{ fontFamily: F.mono, fontSize: size * 0.9, fontWeight: 500, color, letterSpacing: "0.16em", textTransform: "uppercase", ...style }}>{children}</div>
);

/** Small source tag in the top-right corner of a data scene. */
export const Source: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const f = useCurrentFrame();
  const tr = useT();
  return (
    <div style={{ position: "absolute", right: 72, top: 58, opacity: ramp(f, at, 20) * 0.7 }}>
      <Mono size={18}>{tr("источник")} · {children}</Mono>
    </div>
  );
};

/** Chapter marker at the top-left: index, hairline, label. */
export const Chapter: React.FC<{ n: string; label: string; at?: number }> = ({ n, label, at = 0 }) => {
  const f = useCurrentFrame();
  const t = ramp(f, at, 24);
  return (
    <div style={{ position: "absolute", left: 72, top: 54, display: "flex", gap: 18, alignItems: "center", opacity: t }}>
      <Mono size={19} color={C.fg}>{n}</Mono>
      <div style={{ width: 56 * t, height: 1, background: `linear-gradient(90deg, ${C.cyan}, transparent)` }} />
      <Mono size={19}>{label}</Mono>
    </div>
  );
};

export const Pill: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = C.cyan, size = 34, style }) => (
  <div style={{
    fontFamily: F.body, fontWeight: 500, fontSize: size * 0.9, color, padding: `${size * 0.36}px ${size * 0.78}px`, borderRadius: 999,
    border: `1px solid ${color}55`, background: `linear-gradient(180deg, ${color}14, ${color}06)`,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 30px ${color}12`, whiteSpace: "nowrap", letterSpacing: "-0.01em", ...style,
  }}>{children}</div>
);

export const Glass: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; glow?: string }> = ({ children, style, glow = C.cyan }) => (
  <div style={{
    background: "linear-gradient(165deg, rgba(255,255,255,0.075), rgba(255,255,255,0.018) 60%)", border: `1px solid ${C.line}`,
    borderRadius: 22, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.09), 0 40px 90px rgba(0,0,0,0.55), 0 0 80px ${glow}0d`,
    backdropFilter: "blur(10px)", ...style,
  }}>{children}</div>
);

/** Number that rolls to a value. */
export const Roll: React.FC<{ from?: number; to: number; at: number; dur?: number; decimals?: number; style?: React.CSSProperties; format?: (v: number) => string }> = ({
  from = 0, to, at, dur = 30, decimals = 0, style, format,
}) => {
  const f = useCurrentFrame();
  const v = from + (to - from) * ramp(f, at, dur);
  const text = format ? format(v) : v.toFixed(decimals).replace(".", ",");
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{text}</span>;
};

// ── scene shell ──────────────────────────────────────────────────────
/** Every scene: defocus-in, a slow dolly push, defocus-out. Impacts get a short, small tremor. */
export const Shell: React.FC<{ dur: number; children: React.ReactNode; push?: number; shakeAt?: readonly number[] }> = ({ dur, children, push = 0.03, shakeAt = [] }) => {
  const f = useCurrentFrame();
  const inT = ramp(f, 0, 16);
  const outT = interpolate(f, [dur - 10, dur], [0, 1], { ...CLAMP, easing: Easing.in(Easing.cubic) });
  const scale = (0.985 + 0.015 * inT) * (1 + push * (f / Math.max(1, dur))) * (1 + 0.02 * outT);
  const shake = shakeAt.reduce((acc, at) => {
    const k = f - at;
    return k >= 0 && k < 12 ? acc + (1 - k / 12) * 5 : acc;
  }, 0);
  return (
    <AbsoluteFill style={{
      opacity: inT * (1 - outT), filter: outT > 0.01 || inT < 0.99 ? `blur(${(1 - inT) * 14 + outT * 14}px)` : undefined,
      transform: `translate(${Math.sin(f * 2.7) * shake}px, ${Math.cos(f * 3.3) * shake * 0.6}px) scale(${scale})`,
    }}>{children}</AbsoluteFill>
  );
};

/** Soft light bloom at a frame (impacts). */
export const Flash: React.FC<{ at: number; color?: string; strength?: number }> = ({ at, color = "#ffffff", strength = 0.7 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 1, at + 1, at + 16], [0, strength * 0.45, 0], CLAMP);
  return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)`, opacity: o, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

/** Hairline shockwave ring. */
export const Ring: React.FC<{ at: number; x: number; y: number; color?: string; size?: number; dur?: number }> = ({ at, x, y, color = C.cyan, size = 900, dur = 30 }) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  const t = ramp(f, at, dur);
  const r = size * t;
  return (
    <div style={{
      position: "absolute", left: x - r / 2, top: y - r / 2, width: r, height: r, borderRadius: "50%",
      border: `1px solid ${color}`, opacity: (1 - t) * 0.8, boxShadow: `0 0 24px ${color}66, inset 0 0 24px ${color}33`,
    }} />
  );
};

/** Thin horizontal light sweep used at scene changes. */
export const Sweep: React.FC<{ at: number; dur?: number }> = ({ at, dur = 18 }) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  const t = ramp(f, at, dur);
  return (
    <div style={{
      position: "absolute", top: 0, bottom: 0, left: -400 + (W + 800) * t, width: 260, opacity: Math.sin(t * Math.PI) * 0.35,
      background: `linear-gradient(90deg, transparent, ${C.cyan}55, rgba(255,255,255,0.35), ${C.cyan}55, transparent)`,
      filter: "blur(30px)", mixBlendMode: "screen", pointerEvents: "none",
    }} />
  );
};

// ── background ───────────────────────────────────────────────────────
const seeded = (i: number): number => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const MOTES = Array.from({ length: 46 }, (_, i) => ({
  x: seeded(i) * W, y: seeded(i + 100) * H, r: 0.6 + seeded(i + 200) * 1.6, speed: 0.08 + seeded(i + 300) * 0.3, tw: seeded(i + 400) * 6.28, depth: seeded(i + 500),
}));

export type Mood = { readonly glow: string; readonly glow2: string; readonly dark: number; readonly grid: number };

/** Global world: volumetric aurora, a fine dot matrix, slow dust in depth, grain and vignette. */
export const World: React.FC<{ mood: Mood }> = ({ mood }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg} 0%, ${C.deep} 100%)` }} />
      {/* aurora: two soft light volumes drifting slowly */}
      <div style={{
        position: "absolute", width: 1500, height: 900, left: 120 + Math.sin(f / 140) * 140, top: -260 + Math.cos(f / 170) * 60,
        background: `radial-gradient(closest-side, ${mood.glow}2e, transparent)`, filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", width: 1300, height: 800, left: 760 + Math.cos(f / 120) * 160, top: 420 + Math.sin(f / 150) * 70,
        background: `radial-gradient(closest-side, ${mood.glow2}22, transparent)`, filter: "blur(50px)",
      }} />
      {/* dot matrix, fading toward the edges */}
      <AbsoluteFill style={{
        opacity: 0.5 * mood.grid,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1.2px)", backgroundSize: "32px 32px",
        backgroundPosition: `${(f * 0.15) % 32}px ${(f * 0.1) % 32}px`,
        maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black 10%, transparent 75%)",
      }} />
      {/* horizon hairline */}
      <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.72, height: 1, opacity: 0.35 * mood.grid, background: `linear-gradient(90deg, transparent, ${mood.glow}88, transparent)` }} />
      {MOTES.map((p, i) => {
        const y = (p.y - f * p.speed + H * 4) % (H + 40) - 20;
        const x = p.x + Math.sin(f / 70 + p.tw) * 14;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: p.r * 2, height: p.r * 2, borderRadius: "50%",
            background: i % 9 === 0 ? C.gold : "#ffffff", opacity: (0.12 + 0.3 * p.depth) * (0.6 + 0.4 * Math.sin(f / 25 + p.tw)),
            filter: p.depth < 0.3 ? "blur(1.5px)" : undefined,
          }} />
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />
      <AbsoluteFill style={{ background: "#000", opacity: mood.dark }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.06, mixBlendMode: "overlay" }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 12} /></filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// ── audio ────────────────────────────────────────────────────────────
export type Cue = { readonly at: number; readonly sound: string; readonly volume?: number };

export const Cues: React.FC<{ cues: readonly Cue[] }> = ({ cues }) => (
  <>
    {cues.map((c, i) => (
      <Sequence key={`${c.sound}-${c.at}-${i}`} from={Math.max(0, c.at)} layout="none" name={`sfx ${c.sound}`}>
        <Audio src={staticFile(`audio/agent-bank/sfx/${c.sound}.wav`)} volume={c.volume ?? 0.5} />
      </Sequence>
    ))}
  </>
);
