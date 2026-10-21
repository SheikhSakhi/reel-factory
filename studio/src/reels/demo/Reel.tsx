import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import {
  Backdrop, ChatBubble, Counter, KineticText, Orbit, SfxTrack, Steps, pop, sec,
  type SfxCue, type Theme,
} from "../../kit";
import { BRAND } from "../../brand/brand";

// Fonts come from the brand kit (vendored locally), so the demo renders offline.
const display = BRAND.theme.fontBody;
const body = BRAND.theme.fontBody;
const mono = BRAND.theme.fontMono;

// Art director's call for this reel: warm paper + ink, one hot orange accent.
const THEME: Theme = {
  name: "ink-on-paper", bg: "#F1EFEA", fg: "#141414", muted: "#8A867D", accent: "#F2662B",
  surface: "#FFFFFF", fontDisplay: display, fontBody: body, fontMono: mono, texture: "grid",
};
const DARK: Theme = { ...THEME, name: "ink-night", bg: "#0E0E0E", fg: "#F1EFEA", surface: "#1E1E1E", texture: "dots" };

const AGENTS = ["research", "script", "art", "sound", "animate", "QA"] as const;
const PIPELINE = ["idea", "script", "style", "sound", "animation", "check", "publish"] as const;

const T = { hook: sec(3.4), team: sec(3.6), flow: sec(3.4), proof: sec(2.8), cta: sec(3.2), cross: 10 } as const;
export const DEMO_DURATION = T.hook + T.team + T.flow + T.proof + T.cta - 4 * T.cross;

const center: React.CSSProperties = { justifyContent: "center", alignItems: "center", padding: 90 };

const Hook: React.FC = () => (
  <Backdrop theme={THEME}>
    <AbsoluteFill style={{ ...center, gap: 34, flexDirection: "column" }}>
      <ChatBubble theme={THEME} side="left" delay={4} text="how do you make these reels??" size={64} />
      <ChatBubble theme={THEME} side="right" delay={30} text="relax." size={64} />
      <ChatBubble theme={THEME} side="right" delay={50} text="I'll show you who builds them" size={64} />
    </AbsoluteFill>
  </Backdrop>
);

const Team: React.FC = () => {
  const frame = useCurrentFrame();
  const active = frame < 30 ? -1 : Math.floor((frame - 30) / 12) % AGENTS.length;
  return (
    <Backdrop theme={DARK}>
      <AbsoluteFill style={{ ...center, gap: 40, flexDirection: "column" }}>
        <KineticText text="a team of AI agents" size={104} font={display} color={DARK.fg} />
        <Orbit theme={DARK} center={"Claude\nCode"} nodes={AGENTS} active={active} delay={10} radius={300} />
      </AbsoluteFill>
    </Backdrop>
  );
};

const Flow: React.FC = () => (
  <Backdrop theme={{ ...THEME, texture: "lines" }}>
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 70 }}>
      <KineticText text="one command." size={92} font={display} color={THEME.muted} />
      <Steps theme={THEME} items={PIPELINE} delay={14} every={11} size={84} />
    </AbsoluteFill>
  </Backdrop>
);

const Proof: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Backdrop theme={{ ...THEME, bg: THEME.accent, fg: "#141414", texture: "noise" }}>
      <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 20 }}>
        <Counter to={0} from={147} duration={45} delay={4} style={{ fontSize: 330, fontFamily: display, transform: `scale(${pop(frame, 2)})` }} />
        <KineticText text="references to hunt for" size={78} font={body} delay={20} />
        <KineticText text="every reel in your brand" size={52} font={mono} weight={500} delay={42} stagger={2} />
      </AbsoluteFill>
    </Backdrop>
  );
};

const Cta: React.FC = () => (
  <Backdrop theme={DARK}>
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 60 }}>
      <KineticText text="type it:" size={80} font={display} color={DARK.muted} />
      <div style={{ background: DARK.surface, borderRadius: 40, padding: "40px 56px", width: "100%", boxSizing: "border-box" }}>
        <KineticText text="/reel-factory your idea" mode="type" size={54} font={mono} weight={500} color={DARK.accent} align="left" delay={12} />
      </div>
    </AbsoluteFill>
  </Backdrop>
);

// Sound director's cue sheet (absolute frames).
const at = (scene: number, local: number): number => {
  const starts = [0, T.hook - T.cross, T.hook + T.team - 2 * T.cross, T.hook + T.team + T.flow - 3 * T.cross, T.hook + T.team + T.flow + T.proof - 4 * T.cross];
  return starts[scene] + local;
};
const CUES: readonly SfxCue[] = [
  { at: at(0, 4), sound: "pop" }, { at: at(0, 30), sound: "pop" }, { at: at(0, 50), sound: "pop" },
  { at: at(1, 0), sound: "whoosh", volume: 0.5 }, { at: at(1, 10), sound: "thud", volume: 0.8 },
  ...AGENTS.map((_, i) => ({ at: at(1, 30 + i * 12), sound: "tick" as const, volume: 0.4 })),
  { at: at(2, 0), sound: "whoosh", volume: 0.5 },
  ...PIPELINE.map((_, i) => ({ at: at(2, 14 + i * 11), sound: "click" as const, volume: 0.5 })),
  { at: at(3, 0), sound: "rise", volume: 0.4 }, { at: at(3, 49), sound: "thud", volume: 0.9 },
  { at: at(4, 0), sound: "whoosh", volume: 0.5 }, { at: at(4, 60), sound: "ding", volume: 0.5 },
];

export const DemoReel: React.FC = () => (
  <AbsoluteFill>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={T.hook}><Hook /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: T.cross })} />
      <TransitionSeries.Sequence durationInFrames={T.team}><Team /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T.cross })} />
      <TransitionSeries.Sequence durationInFrames={T.flow}><Flow /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T.cross })} />
      <TransitionSeries.Sequence durationInFrames={T.proof}><Proof /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T.cross })} />
      <TransitionSeries.Sequence durationInFrames={T.cta}><Cta /></TransitionSeries.Sequence>
    </TransitionSeries>
    <SfxTrack cues={CUES} />
  </AbsoluteFill>
);
