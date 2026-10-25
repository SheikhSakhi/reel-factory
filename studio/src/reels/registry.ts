import type React from "react";
import { DemoReel, DEMO_DURATION } from "./demo/Reel";
import { AgentBankReel, AgentBankReelEn, AgentBankReelEnFast, AGENT_BANK_DURATION, AGENT_BANK_EN_DURATION, AGENT_BANK_EN_FAST_DURATION, AGENT_BANK_SIZE } from "./agent-bank/Reel";

export type ReelEntry = {
  readonly id: string;
  readonly component: React.FC;
  readonly durationInFrames: number;
  /** Override the default 1080x1920 canvas, e.g. 1920x1080 for a 16:9 presentation video. */
  readonly width?: number;
  readonly height?: number;
};

// The animator agent appends one line per new reel.
export const REELS: readonly ReelEntry[] = [
  { id: "demo", component: DemoReel, durationInFrames: DEMO_DURATION },
  { id: "agent-bank", component: AgentBankReel, durationInFrames: AGENT_BANK_DURATION, ...AGENT_BANK_SIZE },
  { id: "agent-bank-en", component: AgentBankReelEn, durationInFrames: AGENT_BANK_EN_DURATION, ...AGENT_BANK_SIZE },
  { id: "agent-bank-en-fast", component: AgentBankReelEnFast, durationInFrames: AGENT_BANK_EN_FAST_DURATION, ...AGENT_BANK_SIZE },
];
