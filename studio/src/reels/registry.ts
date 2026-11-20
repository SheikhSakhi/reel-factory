import type React from "react";
import { DemoReel, DEMO_DURATION } from "./demo/Reel";
import { Ep01ForgottenPlan, EP01_COVER, EP01_DURATION } from "./ep01-forgotten-plan/Reel";
import { MidnightQuestion, MIDNIGHT_COVER, MIDNIGHT_DURATION } from "./2026-10-26-midnight-question/Reel";
import { ScribeEvening, SCRIBE_COVER, SCRIBE_DURATION } from "./2026-10-28-scribe-evening/Reel";
import { MonitorNotPlan, MONITOR_COVER, MONITOR_DURATION } from "./2026-10-30-monitor-not-plan/Reel";
import { Ep02AlertNobodyOwned, EP02_COVER, EP02_DURATION } from "./ep02-alert-nobody-owned/Reel";
import { Ep02Soft, EP02_SOFT_COVER, EP02_SOFT_DURATION } from "./ep02-soft/Reel";
import { WhoComesBack, WHO_BACK_COVER, WHO_BACK_DURATION } from "./2026-10-31-who-comes-back/Reel";
import { S1E4Dark, S1E4_COVER, S1E4_DURATION } from "../edits/s1e4-dark/Reel";
import { TheGardener, GARDENER_COVER, GARDENER_DURATION } from "./2026-11-02-the-gardener/Reel";
import { SevenDoctors, SEVEN_COVER, SEVEN_DURATION } from "./2026-11-04-seven-doctors/Reel";
import { CallFromApril, APRIL_COVER, APRIL_DURATION } from "./2026-11-06-the-call-from-april/Reel";
import { AllFineIThink, FINE_COVER, FINE_DURATION } from "./2026-11-09-all-fine-i-think/Reel";
import { TheLighthouse, LIGHTHOUSE_COVER, LIGHTHOUSE_DURATION } from "./2026-11-11-the-lighthouse/Reel";
import { WhyAreYouHere, WHY_COVER, WHY_DURATION } from "./2026-11-13-why-are-you-here/Reel";
import { AsBelowSoAbove, ABOVE_COVER, ABOVE_DURATION } from "./2026-11-13-as-below-so-above/Reel";
import { ThePeak, PEAK_COVER, PEAK_DURATION } from "./2026-11-15-the-peak/Reel";
import { OnePercent, ONE_COVER, ONE_DURATION } from "./2026-11-16-one-percent/Reel";
import { FullPillBox, PILLBOX_COVER, PILLBOX_DURATION } from "./2026-11-18-the-full-pill-box/Reel";
import { LookUp, LOOKUP_COVER, LOOKUP_DURATION } from "./2026-11-19-look-up/Reel";
import { TheClockmaker, CLOCK_COVER, CLOCK_DURATION } from "./2026-11-20-the-clockmaker/Reel";
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
  { id: "2026-10-28-scribe-evening", component: ScribeEvening, durationInFrames: SCRIBE_DURATION, coverFrame: SCRIBE_COVER },
  { id: "2026-10-30-monitor-not-plan", component: MonitorNotPlan, durationInFrames: MONITOR_DURATION, coverFrame: MONITOR_COVER },
  { id: "ep02-alert-nobody-owned", component: Ep02AlertNobodyOwned, durationInFrames: EP02_DURATION, coverFrame: EP02_COVER },
  { id: "ep02-soft", component: Ep02Soft, durationInFrames: EP02_SOFT_DURATION, coverFrame: EP02_SOFT_COVER },
  { id: "2026-10-31-who-comes-back", component: WhoComesBack, durationInFrames: WHO_BACK_DURATION, coverFrame: WHO_BACK_COVER },
  { id: "2026-11-02-the-gardener", component: TheGardener, durationInFrames: GARDENER_DURATION, coverFrame: GARDENER_COVER },
  { id: "2026-11-04-seven-doctors", component: SevenDoctors, durationInFrames: SEVEN_DURATION, coverFrame: SEVEN_COVER },
  { id: "2026-11-06-the-call-from-april", component: CallFromApril, durationInFrames: APRIL_DURATION, coverFrame: APRIL_COVER },
  { id: "2026-11-09-all-fine-i-think", component: AllFineIThink, durationInFrames: FINE_DURATION, coverFrame: FINE_COVER },
  { id: "2026-11-11-the-lighthouse", component: TheLighthouse, durationInFrames: LIGHTHOUSE_DURATION, coverFrame: LIGHTHOUSE_COVER },
  { id: "2026-11-13-why-are-you-here", component: WhyAreYouHere, durationInFrames: WHY_DURATION, coverFrame: WHY_COVER },
  { id: "2026-11-13-as-below-so-above", component: AsBelowSoAbove, durationInFrames: ABOVE_DURATION, coverFrame: ABOVE_COVER },
  { id: "2026-11-15-the-peak", component: ThePeak, durationInFrames: PEAK_DURATION, coverFrame: PEAK_COVER },
  { id: "2026-11-16-one-percent", component: OnePercent, durationInFrames: ONE_DURATION, coverFrame: ONE_COVER },
  { id: "2026-11-18-the-full-pill-box", component: FullPillBox, durationInFrames: PILLBOX_DURATION, coverFrame: PILLBOX_COVER },
  { id: "2026-11-19-look-up", component: LookUp, durationInFrames: LOOKUP_DURATION, coverFrame: LOOKUP_COVER },
  { id: "2026-11-20-the-clockmaker", component: TheClockmaker, durationInFrames: CLOCK_DURATION, coverFrame: CLOCK_COVER },
  { id: "nvidia-s1e4-dark", component: S1E4Dark, durationInFrames: S1E4_DURATION, coverFrame: S1E4_COVER },
];
