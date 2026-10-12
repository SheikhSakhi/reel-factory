import { Easing, interpolate, spring } from "remotion";
import { REEL } from "./theme";

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 progress between two frames with an ease-out curve. */
export const progress = (frame: number, from: number, duration: number, easing = EASE_OUT): number =>
  interpolate(frame, [from, from + duration], [0, 1], { ...CLAMP, easing });

/** Snappy spring that starts at `delay` frames. */
export const pop = (frame: number, delay = 0, damping = 14): number =>
  spring({ frame: frame - delay, fps: REEL.fps, config: { damping, stiffness: 180, mass: 0.6 } });

export const lerp = (t: number, a: number, b: number): number => a + (b - a) * t;
