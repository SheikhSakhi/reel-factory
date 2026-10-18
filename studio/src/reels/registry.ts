import type React from "react";
import { DemoReel, DEMO_DURATION } from "./demo/Reel";
import { FILM_DURATION, FilmCaptioned, FilmClean } from "./ai-terms-one-patient/Film";

export type ReelEntry = { readonly id: string; readonly component: React.FC; readonly durationInFrames: number };

// The animator agent appends one line per new reel.
export const REELS: readonly ReelEntry[] = [
  { id: "demo", component: DemoReel, durationInFrames: DEMO_DURATION },
  { id: "ai-terms-one-patient", component: FilmClean, durationInFrames: FILM_DURATION },
  { id: "ai-terms-one-patient-captioned", component: FilmCaptioned, durationInFrames: FILM_DURATION },
];
