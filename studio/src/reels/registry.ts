import type React from "react";
import { DemoReel, DEMO_DURATION } from "./demo/Reel";
import { Ep01ForgottenPlan, EP01_COVER, EP01_DURATION } from "./ep01-forgotten-plan/Reel";
import { MidnightQuestion, MIDNIGHT_COVER, MIDNIGHT_DURATION } from "./2026-10-26-midnight-question/Reel";
import { SeriesDemoReel, SERIES_DEMO_COVER, SERIES_DEMO_DURATION } from "./series-demo/Reel";

export type ReelEntry = {
  readonly id: string;
  readonly component: React.FC;
  readonly durationInFrames: number;
  /** Frame used as the grid cover (`<id>-cover` still). Pick a frame where the hook headline is fully on screen. */
  readonly coverFrame?: number;
};

// The animator agent appends one line per new reel.
export const REELS: readonly ReelEntry[] = [
  { id: "demo", component: DemoReel, durationInFrames: DEMO_DURATION, coverFrame: 75 },
  { id: "series-demo", component: SeriesDemoReel, durationInFrames: SERIES_DEMO_DURATION, coverFrame: SERIES_DEMO_COVER },
  { id: "ep01-forgotten-plan", component: Ep01ForgottenPlan, durationInFrames: EP01_DURATION, coverFrame: EP01_COVER },
  { id: "2026-10-26-midnight-question", component: MidnightQuestion, durationInFrames: MIDNIGHT_DURATION, coverFrame: MIDNIGHT_COVER },
];
