import type React from "react";
import { DemoReel, DEMO_DURATION } from "./demo/Reel";
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
];
