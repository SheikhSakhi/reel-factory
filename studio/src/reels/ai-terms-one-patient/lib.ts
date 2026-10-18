// Small deterministic math helpers shared by the world and the overlay.
import { Easing, random } from "remotion";

export type V3 = readonly [number, number, number];

export const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0);
export const smooth = (t: number): number => { const x = clamp01(t); return x * x * (3 - 2 * x); };

/** 0→1 between two frames, eased (ease-out by default). */
export const ramp = (frame: number, from: number, dur: number, ease: (t: number) => number = easeOut): number =>
  dur <= 0 ? (frame >= from ? 1 : 0) : ease(clamp01((frame - from) / dur));

/** Fade in over `inDur` from `from`, hold, fade out over `outDur` ending at `to`. */
export const window01 = (frame: number, from: number, to: number, inDur = 12, outDur = 12): number =>
  Math.min(ramp(frame, from, inDur, easeOut), 1 - ramp(frame, to - outDur, outDur, easeInOut));

/** Seeded random in [0,1). */
export const rnd = (seed: string | number): number => random(seed);

/** Catmull-Rom between p1 and p2. */
export const catmull = (p0: V3, p1: V3, p2: V3, p3: V3, t: number): V3 => {
  const t2 = t * t, t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1]), f(p0[2], p1[2], p2[2], p3[2])];
};

export type Key = { readonly f: number; readonly v: V3; readonly ease?: "inout" | "linear" | "out" | "in" };

/**
 * Samples a keyframed 3D path. Segments ease in-out by default (a hold between two equal keys
 * stays still); the path is a Catmull-Rom spline so travel curves through intermediate keys.
 */
export const samplePath = (keys: readonly Key[], frame: number): V3 => {
  if (frame <= keys[0].f) return keys[0].v;
  const last = keys[keys.length - 1];
  if (frame >= last.f) return last.v;
  let i = 0;
  while (i < keys.length - 2 && frame >= keys[i + 1].f) i++;
  const a = keys[i], b = keys[i + 1];
  const raw = (frame - a.f) / Math.max(1, b.f - a.f);
  const kind = b.ease ?? "inout";
  const t = kind === "linear" ? raw : kind === "out" ? easeOut(raw) : kind === "in" ? easeIn(raw) : easeInOut(raw);
  const same = a.v[0] === b.v[0] && a.v[1] === b.v[1] && a.v[2] === b.v[2];
  if (same) return a.v;
  const p0 = keys[Math.max(0, i - 1)].v, p3 = keys[Math.min(keys.length - 1, i + 2)].v;
  // Neighbours that equal the endpoints (holds) would bend the curve; mirror instead.
  const prev = p0 === a.v || (p0[0] === a.v[0] && p0[1] === a.v[1] && p0[2] === a.v[2]) ? lerp3(a.v, b.v, -1) : p0;
  const next = p3[0] === b.v[0] && p3[1] === b.v[1] && p3[2] === b.v[2] ? lerp3(b.v, a.v, -1) : p3;
  return catmull(prev, a.v, b.v, next, t);
};

/** Scalar keyframes (fov, opacity curves). */
export const sampleScalar = (keys: readonly { f: number; v: number }[], frame: number): number => {
  if (frame <= keys[0].f) return keys[0].v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (frame < b.f) return lerp(a.v, b.v, easeInOut((frame - a.f) / Math.max(1, b.f - a.f)));
  }
  return keys[keys.length - 1].v;
};
