// A Theme is the art director's per-reel style decision. Every reel gets its own.
export type Theme = {
  readonly name: string;
  readonly bg: string;
  readonly fg: string;
  readonly muted: string;
  readonly accent: string;
  readonly surface: string;
  readonly fontDisplay: string;
  readonly fontBody: string;
  readonly fontMono: string;
  readonly texture: "none" | "grid" | "dots" | "noise" | "lines";
};

export const REEL = { width: 1080, height: 1920, fps: 30 } as const;

export const sec = (seconds: number): number => Math.round(seconds * REEL.fps);
