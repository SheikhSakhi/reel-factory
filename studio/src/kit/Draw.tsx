import React from "react";
import { getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
import type { IconNode } from "lucide";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { EASE_IN_OUT, EASE_OUT, pop, progress } from "./motion";

/**
 * Drawing primitives for explainer panels: everything is vector, so it stays sharp at any
 * render scale. `at` is always a LOCAL frame (inside the panel's scene); use usePanelAt("S2:word")
 * from PanelKit to turn a spoken word into one.
 */

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 -> 1 stroke progress for a draw-on that starts at `at`. */
const drawn = (f: number, at: number, duration: number): number =>
  interpolate(f, [at, at + duration], [0, 1], { ...CLAMP, easing: EASE_IN_OUT });

// ---------- icons (lucide, 24x24 line icons) ----------

/** A lucide icon node: import { HeartPulse } from "lucide" (2,000+ line icons, ISC licence). */
export type { IconNode } from "lucide";

/** Draws a line icon stroke by stroke, then optionally fills it. */
export const DrawIcon: React.FC<{
  icon: IconNode; size?: number; color: string; at?: number; duration?: number; strokeWidth?: number;
  fill?: string; style?: React.CSSProperties;
}> = ({ icon, size = 160, color, at = 0, duration = 24, strokeWidth = 1.5, fill, style }) => {
  const f = useCurrentFrame();
  const t = drawn(f, at, duration);
  const fillIn = fill ? progress(f, at + duration - 4, 10) : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible", ...style }}>
      {icon.map(([tag, attrs], i) => React.createElement(tag, {
        key: i, ...attrs, pathLength: 1, stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round",
        strokeDasharray: 1, strokeDashoffset: 1 - t, fill: fill ?? "none", fillOpacity: fillIn,
      }))}
    </svg>
  );
};

// ---------- custom line art ----------

/** Draws any SVG path (line art, a diagram, a signature) on, with an optional glow. */
export const DrawPath: React.FC<{
  d: string; viewBox: string; width: number; height: number; color: string; at?: number; duration?: number;
  strokeWidth?: number; glow?: boolean; fill?: string; dashed?: boolean; style?: React.CSSProperties;
}> = ({ d, viewBox, width, height, color, at = 0, duration = 30, strokeWidth = 3, glow = false, fill, dashed = false, style }) => {
  const f = useCurrentFrame();
  const t = drawn(f, at, duration);
  const fillIn = fill ? progress(f, at + duration - 6, 12) : 0;
  return (
    <svg width={width} height={height} viewBox={viewBox} style={{ overflow: "visible", ...style }}>
      {glow ? <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth * 4} opacity={0.18 * t} pathLength={1}
        strokeDasharray={1} strokeDashoffset={1 - t} strokeLinecap="round" /> : null}
      <path d={d} fill={fill ?? "none"} fillOpacity={fillIn} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeLinejoin="round" pathLength={1}
        strokeDasharray={dashed ? undefined : 1} strokeDashoffset={dashed ? undefined : 1 - t}
        style={dashed ? { strokeDasharray: "0.012 0.012", clipPath: `inset(0 ${100 - t * 100}% 0 0)` } : undefined} />
    </svg>
  );
};

// ---------- hand-drawn annotations ----------

type Box = { x: number; y: number; w: number; h: number };

/** Smooth closed-ish curve through points (Catmull-Rom -> cubic Bezier). */
const smooth = (pts: readonly [number, number][]): string =>
  pts.reduce((d, p, i) => {
    if (i === 0) return `M ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const p0 = pts[i - 2] ?? pts[i - 1];
    const p1 = pts[i - 1];
    const p3 = pts[i + 1] ?? p;
    const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6];
    const c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
    return `${d} C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }, "");

/** A marker-pen ellipse around a box, slightly over-drawn like a real hand. */
export const SketchCircle: React.FC<Box & { color: string; at?: number; duration?: number; width?: number; seed?: string }> = ({
  x, y, w, h, color, at = 0, duration = 16, width = 6, seed = "c",
}) => {
  const f = useCurrentFrame();
  const t = drawn(f, at, duration);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const n = 14;
  const pts = Array.from({ length: n + 3 }, (_, i): [number, number] => {
    const a = -Math.PI * 0.6 + (i / n) * Math.PI * 2.15;
    const jitter = 1 + (random(`${seed}-${i}`) - 0.5) * 0.08;
    return [cx + Math.cos(a) * (w / 2 + 18) * jitter, cy + Math.sin(a) * (h / 2 + 14) * jitter];
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ overflow: "visible" }}>
        <path d={smooth(pts)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1}
          strokeDasharray={1} strokeDashoffset={1 - t} />
      </svg>
    </AbsoluteFill>
  );
};

/** A hand-drawn underline under a box. */
export const SketchUnderline: React.FC<Box & { color: string; at?: number; duration?: number; width?: number; seed?: string }> = ({
  x, y, w, h, color, at = 0, duration = 10, width = 7, seed = "u",
}) => {
  const f = useCurrentFrame();
  const t = drawn(f, at, duration);
  const base = y + h + 10;
  const pts: [number, number][] = [0, 0.33, 0.66, 1].map((k, i) => [x - 8 + (w + 16) * k, base + (random(`${seed}${i}`) - 0.5) * 8]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ overflow: "visible" }}>
        <path d={smooth(pts)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1}
          strokeDasharray={1} strokeDashoffset={1 - t} />
      </svg>
    </AbsoluteFill>
  );
};

/** A curved hand-drawn arrow from one point to another (px in the panel). */
export const SketchArrow: React.FC<{
  from: [number, number]; to: [number, number]; color: string; at?: number; duration?: number; bend?: number; width?: number;
}> = ({ from, to, color, at = 0, duration = 14, bend = 0.25, width = 6 }) => {
  const f = useCurrentFrame();
  const t = drawn(f, at, duration);
  const mx = (from[0] + to[0]) / 2 - (to[1] - from[1]) * bend;
  const my = (from[1] + to[1]) / 2 + (to[0] - from[0]) * bend;
  const d = `M ${from[0]} ${from[1]} Q ${mx} ${my} ${to[0]} ${to[1]}`;
  const tangent = getTangentAtLength(d, getLength(d)) ?? { x: 1, y: 0 };
  const angle = Math.atan2(tangent.y, tangent.x);
  const head = (side: number): string => {
    const a = angle + Math.PI + side * 0.5;
    return `M ${to[0] + Math.cos(a) * 26} ${to[1] + Math.sin(a) * 26} L ${to[0]} ${to[1]}`;
  };
  const headIn = progress(f, at + duration - 3, 6);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ overflow: "visible" }}>
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
        <path d={`${head(1)} ${head(-1)}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round"
          strokeLinejoin="round" opacity={headIn} />
      </svg>
    </AbsoluteFill>
  );
};

/** Marker highlight swiped across a box (behind text: render before the text). */
export const Highlight: React.FC<Box & { color: string; at?: number; duration?: number; radius?: number }> = ({
  x, y, w, h, color, at = 0, duration = 10, radius = 10,
}) => {
  const f = useCurrentFrame();
  const t = progress(f, at, duration);
  return <div style={{ position: "absolute", left: x - 8, top: y - 4, width: (w + 16) * t, height: h + 8, borderRadius: radius, background: color }} />;
};

// ---------- motion ----------

/** Moves children along a path (e.g. a car over a ramp), rotating with the path. Children are centred on the point.
 *  Pair with <PathTrail> (same d, at, duration) for a dotted trajectory behind it. */
export const PathMotion: React.FC<{
  d: string; at?: number; duration?: number; rotate?: boolean;
  /** Extra full turns done mid-flight (a barrel roll at the top of a jump). */
  spin?: number; children: React.ReactNode;
}> = ({ d, at = 0, duration = 40, rotate = true, spin = 0, children }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [at, at + duration], [0, 1], { ...CLAMP, easing: EASE_IN_OUT });
  const total = getLength(d);
  const p = getPointAtLength(d, total * t) ?? { x: 0, y: 0 };
  const tan = getTangentAtLength(d, total * t) ?? { x: 1, y: 0 };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: p.x, top: p.y,
        transform: `translate(-50%, -50%) rotate(${(rotate ? Math.atan2(tan.y, tan.x) : 0) + spin * Math.PI * 2 * interpolate(t, [0.35, 0.65], [0, 1], CLAMP)}rad)`,
      }}>{children}</div>
    </AbsoluteFill>
  );
};

/** Dotted trail that is revealed as far as an object has travelled along the same path. */
export const PathTrail: React.FC<{ d: string; color: string; at?: number; duration?: number; width?: number }> = ({
  d, color, at = 0, duration = 40, width = 4,
}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [at, at + duration], [0, 1], { ...CLAMP, easing: EASE_IN_OUT });
  const total = getLength(d);
  const dots = Math.floor(total / 18);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ overflow: "visible" }}>
        {Array.from({ length: Math.floor(dots * t) }, (_, i) => {
          const pt = getPointAtLength(d, (i / dots) * total) ?? { x: 0, y: 0 };
          return <circle key={i} cx={pt.x} cy={pt.y} r={width / 2} fill={color} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ---------- stamps, ticks, multiplication ----------

/** A rubber stamp that thumps onto the panel. */
export const Stamp: React.FC<{ text: string; color: string; at?: number; rotate?: number; size?: number; font?: string }> = ({
  text, color, at = 0, rotate = -12, size = 44, font,
}) => {
  const f = useCurrentFrame();
  const t = pop(f, at, 9);
  return (
    <div style={{
      display: "inline-block", padding: "10px 26px", border: `5px solid ${color}`, borderRadius: 12, color,
      fontFamily: font, fontSize: size, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
      opacity: f < at ? 0 : Math.min(1, t * 1.4), transform: `rotate(${rotate}deg) scale(${1.8 - 0.8 * Math.min(1, t)})`,
      mixBlendMode: "normal",
    }}>{text}</div>
  );
};

/** A tick mark drawn on. */
export const Tick: React.FC<{ color: string; at?: number; size?: number; width?: number }> = ({ color, at = 0, size = 70, width = 9 }) => {
  const f = useCurrentFrame();
  const t = drawn(f, at, 10);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ overflow: "visible" }}>
      <path d="M4 13 L10 19 L21 5" fill="none" stroke={color} strokeWidth={width / (size / 24)} strokeLinecap="round" strokeLinejoin="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
    </svg>
  );
};

/** Copies of one element filling a grid, spreading from the centre ("the whole internet saw it"). */
export const Multiply: React.FC<{
  cols: number; rows: number; cell: number; gap?: number; at?: number; spread?: number;
  /** "center": spreads outwards; "random": copies pop up all over, like an explosion of reposts. */
  order?: "center" | "random"; children: React.ReactNode;
}> = ({ cols, rows, cell, gap = 10, at = 0, spread = 30, order = "center", children }) => {
  const f = useCurrentFrame();
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxD = Math.hypot(cx, cy) || 1;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap }}>
      {Array.from({ length: cols * rows }, (_, i) => {
        const d = Math.hypot((i % cols) - cx, Math.floor(i / cols) - cy) / maxD;
        const start = order === "random" ? at + random(`m${i}`) * spread : at + d * spread + random(`m${i}`) * 4;
        const t = pop(f, start, 13);
        return (
          <div key={i} style={{ width: cell, height: cell * 1.6, opacity: f < start ? 0 : t, transform: `scale(${0.4 + 0.6 * t})` }}>
            {children}
          </div>
        );
      })}
    </div>
  );
};

/** Fade + rise for any element, starting at `at`. */
export const Appear: React.FC<{ at?: number; from?: "bottom" | "left" | "right" | "top" | "none"; distance?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at = 0, from = "bottom", distance = 40, children, style,
}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [at, at + 12], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const dx = from === "left" ? -distance : from === "right" ? distance : 0;
  const dy = from === "bottom" ? distance : from === "top" ? -distance : 0;
  return <div style={{ opacity: t, transform: `translate(${dx * (1 - t)}px, ${dy * (1 - t)}px)`, ...style }}>{children}</div>;
};

// ---------- traced or hand-made line art ----------

/** Line art from scripts/lineart.py (or written by hand in the same shape). */
export type Art = {
  readonly width: number;
  readonly height: number;
  readonly strokes: readonly { readonly d: string; readonly x0: number; readonly x1: number; readonly kind: string }[];
};

/**
 * Draws line art the way an explainer does it: a faint ghost of the whole drawing, then a pen
 * sweeping left to right (`sweep` frames), then the outline fills with a soft gradient and glows.
 */
export const DrawArt: React.FC<{
  art: Art; width: number; color: string; outlineColor?: string; fillColor?: string; at?: number; sweep?: number;
  strokeDuration?: number; strokeWidth?: number; ghost?: boolean; glow?: boolean; fillAt?: number; style?: React.CSSProperties;
}> = ({ art, width, color, outlineColor, fillColor, at = 0, sweep = 22, strokeDuration = 14, strokeWidth = 2.5, ghost = true, glow = true, fillAt, style }) => {
  const f = useCurrentFrame();
  const height = (width / art.width) * art.height;
  const k = art.width / width;
  const fillStart = fillAt ?? at + sweep + strokeDuration;
  const fill = fillColor ? progress(f, fillStart, 14) : 0;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${art.width} ${art.height}`} style={{ overflow: "visible", ...style }}>
      <defs>
        <linearGradient id="art-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity={0.55} />
          <stop offset="100%" stopColor={fillColor} stopOpacity={0.12} />
        </linearGradient>
      </defs>
      {ghost ? art.strokes.map((s, i) => (
        <path key={`g${i}`} d={s.d} fill="none" stroke={color} strokeWidth={strokeWidth * k} opacity={0.14}
          strokeLinecap="round" strokeLinejoin="round" />
      )) : null}
      {art.strokes.map((s, i) => {
        const start = at + (s.x0 / art.width) * sweep;
        const t = drawn(f, start, strokeDuration);
        const outline = s.kind === "outline";
        const stroke = outline ? outlineColor ?? color : color;
        return (
          <g key={i}>
            {outline && fillColor ? <path d={s.d} fill="url(#art-fill)" opacity={fill} /> : null}
            {glow ? <path d={s.d} fill="none" stroke={stroke} strokeWidth={strokeWidth * 5 * k} opacity={0.12 * t}
              strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} /> : null}
            <path d={s.d} fill="none" stroke={stroke} strokeWidth={(outline ? strokeWidth * 1.3 : strokeWidth) * k}
              strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
          </g>
        );
      })}
    </svg>
  );
};
