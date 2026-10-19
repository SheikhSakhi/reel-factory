import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { EASE_OUT, progress } from "../../kit";
import { C, F, H, W } from "./style";

const FPS = 30;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const springAt = (f: number, at: number, damping = 13, stiffness = 170): number =>
  spring({ frame: f - at, fps: FPS, config: { damping, stiffness, mass: 0.7 } });

export const ramp = (f: number, at: number, dur = 12): number => progress(f, at, dur, EASE_OUT);

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

/** Springs its children in: scale + rise + blur. */
export const Pop: React.FC<{
  at: number; children: React.ReactNode; from?: "up" | "down" | "left" | "right" | "scale"; dist?: number; style?: React.CSSProperties; out?: number;
}> = ({ at, children, from = "up", dist = 60, style, out }) => {
  const f = useCurrentFrame();
  const t = springAt(f, at);
  const blur = (1 - ramp(f, at, 10)) * 14;
  const o = out === undefined ? 1 : 1 - ramp(f, out, 10);
  const dx = from === "left" ? -dist : from === "right" ? dist : 0;
  const dy = from === "up" ? dist : from === "down" ? -dist : 0;
  const s = from === "scale" ? 0.4 + 0.6 * t : 0.9 + 0.1 * t;
  return (
    <div style={{
      opacity: Math.min(1, t * 1.4) * o, filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
      transform: `translate(${dx * (1 - t)}px, ${dy * (1 - t)}px) scale(${s})`, ...style,
    }}>{children}</div>
  );
};

// ── type ─────────────────────────────────────────────────────────────
/** Display headline that reveals word by word. Wrap a word in *stars* to color it with `accent`. */
export const Words: React.FC<{
  text: string; at: number; size?: number; color?: string; accent?: string; stagger?: number; weight?: number;
  font?: string; align?: "center" | "left"; maxWidth?: number; lineHeight?: number; style?: React.CSSProperties;
}> = ({ text, at, size = 96, color = C.fg, accent = C.cyan, stagger = 4, weight = 800, font = F.display, align = "center", maxWidth = 1600, lineHeight = 1.08, style }) => {
  const f = useCurrentFrame();
  let open = false;
  const words = text.split(" ").map((raw) => {
    const starts = raw.startsWith("*");
    const ends = raw.endsWith("*") && (raw.length > 1 || !starts);
    const hot = open || starts;
    open = (open || starts) && !ends;
    return { text: raw.replace(/^\*/, "").replace(/\*$/, ""), hot };
  });
  return (
    <div style={{
      fontFamily: font, fontSize: size, fontWeight: weight, color, lineHeight, letterSpacing: "-0.02em",
      textAlign: align, width: "max-content", maxWidth, textWrap: "balance", ...style,
    }}>
      {words.map(({ text: word, hot }, i) => {
        const t = springAt(f, at + i * stagger, 14, 190);
        return (
          <React.Fragment key={i}>
            {i > 0 ? " " : ""}
            <span style={{
              display: "inline-block", opacity: Math.min(1, t * 1.5), color: hot ? accent : undefined,
              transform: `translateY(${(1 - t) * 0.5 * size}px) scale(${0.9 + 0.1 * t})`,
              filter: t < 0.98 ? `blur(${(1 - t) * 10}px)` : undefined,
              textShadow: hot ? `0 0 ${size * 0.4}px ${accent}66` : undefined,
            }}>{word}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 24, color = C.muted, style }) => (
  <div style={{ fontFamily: F.mono, fontSize: size, color, letterSpacing: "0.08em", textTransform: "uppercase", ...style }}>{children}</div>
);

/** Small source tag in the corner of a data scene. */
export const Source: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", right: 70, top: 56, opacity: ramp(f, at, 15) * 0.85 }}>
      <Mono size={20}>источник: {children}</Mono>
    </div>
  );
};

/** Section tag at the top-left, like a chapter marker. */
export const Chapter: React.FC<{ n: string; label: string; at?: number }> = ({ n, label, at = 0 }) => {
  const f = useCurrentFrame();
  const t = ramp(f, at, 14);
  return (
    <div style={{ position: "absolute", left: 70, top: 56, display: "flex", gap: 16, alignItems: "center", opacity: t }}>
      <div style={{ width: 46 * t, height: 2, background: C.cyan }} />
      <Mono size={20} color={C.cyan}>{n}</Mono>
      <Mono size={20}>{label}</Mono>
    </div>
  );
};

export const Pill: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = C.cyan, size = 34, style }) => (
  <div style={{
    fontFamily: F.body, fontWeight: 800, fontSize: size, color, padding: `${size * 0.38}px ${size * 0.8}px`, borderRadius: 999,
    border: `2px solid ${color}88`, background: `${color}14`, boxShadow: `0 0 40px ${color}22, inset 0 0 20px ${color}11`, whiteSpace: "nowrap", ...style,
  }}>{children}</div>
);

export const Glass: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; glow?: string }> = ({ children, style, glow = C.cyan }) => (
  <div style={{
    background: "linear-gradient(160deg, rgba(160,190,255,0.12), rgba(120,150,255,0.03))", border: `1.5px solid ${C.line}`,
    borderRadius: 28, boxShadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 60px ${glow}14`, backdropFilter: "blur(6px)", ...style,
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
/** Every scene: quick blur-in, slow camera push, blur-out at the end. */
export const Shell: React.FC<{ dur: number; children: React.ReactNode; push?: number; shakeAt?: readonly number[] }> = ({ dur, children, push = 0.035, shakeAt = [] }) => {
  const f = useCurrentFrame();
  const inT = ramp(f, 0, 12);
  const outT = interpolate(f, [dur - 9, dur], [0, 1], CLAMP);
  const scale = (0.97 + 0.03 * inT) * (1 + push * (f / Math.max(1, dur))) * (1 + 0.04 * outT);
  const shake = shakeAt.reduce((acc, at) => {
    const k = f - at;
    return k >= 0 && k < 14 ? acc + (1 - k / 14) * 14 : acc;
  }, 0);
  const sx = Math.sin(f * 2.7) * shake;
  const sy = Math.cos(f * 3.3) * shake * 0.7;
  return (
    <AbsoluteFill style={{
      opacity: inT * (1 - outT), filter: outT > 0.01 || inT < 0.99 ? `blur(${(1 - inT) * 10 + outT * 12}px)` : undefined,
      transform: `translate(${sx}px, ${sy}px) scale(${scale})`,
    }}>{children}</AbsoluteFill>
  );
};

/** White flash overlay at a frame (impacts). */
export const Flash: React.FC<{ at: number; color?: string; strength?: number }> = ({ at, color = "#ffffff", strength = 0.7 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 1, at, at + 10], [0, strength, 0], CLAMP);
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

/** Expanding ring shockwave. */
export const Ring: React.FC<{ at: number; x: number; y: number; color?: string; size?: number; dur?: number }> = ({ at, x, y, color = C.cyan, size = 900, dur = 26 }) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  const t = ramp(f, at, dur);
  const r = size * t;
  return (
    <div style={{
      position: "absolute", left: x - r / 2, top: y - r / 2, width: r, height: r, borderRadius: "50%",
      border: `${3 + 8 * (1 - t)}px solid ${color}`, opacity: 1 - t, boxShadow: `0 0 40px ${color}`,
    }} />
  );
};

// ── background ───────────────────────────────────────────────────────
const seeded = (i: number): number => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const PARTICLES = Array.from({ length: 90 }, (_, i) => ({
  x: seeded(i) * W, y: seeded(i + 100) * H, r: 1 + seeded(i + 200) * 2.6, speed: 0.15 + seeded(i + 300) * 0.6, tw: seeded(i + 400) * 6.28,
}));

export type Mood = { readonly glow: string; readonly glow2: string; readonly dark: number; readonly grid: number };

/** Global animated world: drifting glows, perspective grid floor, plankton particles, grain, vignette. */
export const World: React.FC<{ mood: Mood }> = ({ mood }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{
        background: `radial-gradient(1100px 700px at ${30 + Math.sin(f / 90) * 12}% ${35 + Math.cos(f / 110) * 10}%, ${mood.glow}38, transparent 70%),
          radial-gradient(900px 650px at ${72 + Math.cos(f / 80) * 10}% ${68 + Math.sin(f / 70) * 8}%, ${mood.glow2}30, transparent 70%),
          linear-gradient(180deg, ${C.bg} 0%, ${C.deep} 100%)`,
      }} />
      <div style={{
        position: "absolute", left: -W * 0.5, width: W * 2, top: H * 0.56, height: H * 1.1, opacity: 0.55 * mood.grid,
        transform: "perspective(700px) rotateX(72deg)", transformOrigin: "50% 0%",
        backgroundImage: `linear-gradient(${C.cyan}55 1.5px, transparent 1.5px), linear-gradient(90deg, ${C.cyan}55 1.5px, transparent 1.5px)`,
        backgroundSize: "90px 90px", backgroundPosition: `0px ${(f * 1.6) % 90}px`,
        maskImage: "linear-gradient(180deg, transparent 0%, black 30%, black 60%, transparent 100%)",
      }} />
      {PARTICLES.map((p, i) => {
        const y = (p.y - f * p.speed + H * 4) % (H + 40) - 20;
        const x = p.x + Math.sin(f / 50 + p.tw) * 18;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: p.r * 2, height: p.r * 2, borderRadius: "50%",
            background: i % 7 === 0 ? C.gold : C.cyan, opacity: 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(f / 18 + p.tw)),
            boxShadow: `0 0 ${p.r * 5}px ${i % 7 === 0 ? C.gold : C.cyan}`,
          }} />
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)" }} />
      <AbsoluteFill style={{ background: "#000", opacity: mood.dark }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "overlay" }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 12} /></filter>
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
