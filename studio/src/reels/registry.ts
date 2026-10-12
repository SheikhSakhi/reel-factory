import type React from "react";
import { DemoReel, DEMO_DURATION } from "./demo/Reel";

export type ReelEntry = { readonly id: string; readonly component: React.FC; readonly durationInFrames: number };

// The animator agent appends one line per new reel.
export const REELS: readonly ReelEntry[] = [
  { id: "demo", component: DemoReel, durationInFrames: DEMO_DURATION },
];
