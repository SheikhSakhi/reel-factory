import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import {
  Backdrop, Captions, CtaCard, Headline, ProofShot, SeriesChrome, SfxTrack, VoiceOver,
  captionProps, loadTake, pop, progress, scene, wordEnd, wordFrame, CHROME_CLEARANCE,
  type ChromeStep, type SfxCue, type Theme, type VoScene,
} from "../../kit";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/series-demo/take.json";

// Example of the brand template: one fixed look, series chrome, voice-synced beats, a real proof shot, keyword CTA.
const TAKE = loadTake(takeJson);
export const SERIES_DEMO_DURATION = TAKE.totalFrames;

const { theme: TH, alt: ALT } = BRAND;
const TABS = ["IDEAS", "SCRIPT", "BRAND", "VOICE", "REPLIES"] as const;
const S = (id: string): VoScene => scene(TAKE, id);
/** Local frame (inside the scene's Sequence) where a spoken word starts. */
const at = (id: string, word: string, n = 0): number => wordFrame(TAKE, id, word, n) - S(id).from;
const words = (id: string, list: readonly string[]): number[] => list.map((w) => at(id, w));

export const SERIES_DEMO_COVER = wordEnd(TAKE, "S1", "out") + 6;

const Body: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = CHROME_CLEARANCE + 40 }) => (
  <AbsoluteFill style={{ padding: `${top}px 80px 0`, flexDirection: "column", alignItems: "center", gap: 56 }}>{children}</AbsoluteFill>
);

const Chip: React.FC<{ theme: Theme; text: string; delay: number; lit?: boolean }> = ({ theme, text, delay, lit = false }) => {
  const t = pop(useCurrentFrame(), delay);
  return (
    <div style={{
      padding: "18px 30px", borderRadius: 999, fontFamily: theme.fontMono, fontSize: 30, letterSpacing: "0.06em",
      border: `3px solid ${lit ? theme.accent : `${theme.muted}66`}`, color: lit ? theme.bg : theme.fg,
      background: lit ? theme.accent : "transparent", opacity: t, transform: `scale(${0.7 + 0.3 * t})`,
    }}>{text}</div>
  );
};

const Card: React.FC<{ theme: Theme; delay: number; kicker: string; text: string }> = ({ theme, delay, kicker, text }) => {
  const t = pop(useCurrentFrame(), delay);
  return (
    <div style={{
      width: 860, boxSizing: "border-box", padding: "30px 40px", borderRadius: 32, background: theme.surface,
      boxShadow: "0 20px 50px rgba(0,0,0,0.12)", opacity: t, transform: `translateX(${(1 - t) * 140}px)`,
    }}>
      <div style={{ fontFamily: theme.fontMono, fontSize: 24, color: theme.accent, letterSpacing: "0.1em" }}>{kicker}</div>
      <div style={{ fontFamily: theme.fontBody, fontSize: 46, fontWeight: 600, color: theme.fg, marginTop: 8 }}>{text}</div>
    </div>
  );
};

const Hook: React.FC = () => (
  <Backdrop theme={TH}>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 70, padding: "0 80px", paddingBottom: 260 }}>
      <Headline theme={TH} highlight={BRAND.highlight} size={128} text={"One idea in.\n*A week of reels* out."}
        delay={0} stagger={3} />
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <Chip theme={TH} text="8 AI AGENTS" delay={at("S1", "eight")} lit />
        <Chip theme={TH} text="CLAUDE CODE" delay={at("S1", "work")} />
        <Chip theme={TH} text="$0 / MONTH" delay={at("S1", "nothing")} />
      </div>
    </AbsoluteFill>
  </Backdrop>
);

const Ideas: React.FC = () => (
  <Backdrop theme={TH}>
    <Body>
      <Headline theme={TH} highlight={BRAND.highlight} size={104} text="Find what's *already working*" delay={2} stagger={3} />
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <Card theme={TH} delay={at("S2", "ideas")} kicker="FORMAT · NUMBERED LIST" text="5 tools I use every day" />
        <Card theme={TH} delay={at("S2", "working")} kicker="FORMAT · MYTH VS FACT" text="Stop believing this one" />
        <Card theme={TH} delay={at("S2", "niche")} kicker="FORMAT · BEFORE / AFTER" text="Same idea, 10x the views" />
      </div>
    </Body>
  </Backdrop>
);

const FORMATS = ["LIST", "BEFORE/AFTER", "MYTH VS FACT", "TUTORIAL", "STORY"] as const;

const Script: React.FC = () => {
  const f = useCurrentFrame();
  const rule = pop(f, at("S3", "hook"));
  return (
    <Backdrop theme={TH}>
      <Body>
        <Headline theme={TH} highlight={BRAND.highlight} size={110} text="A *proven* format" at={words("S3", ["writes", "proven", "format"])} />
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", maxWidth: 900 }}>
          {FORMATS.map((name, i) => (
            <Chip key={name} theme={TH} text={name} delay={at("S3", "script") + i * 4} lit={i === 0 && f >= at("S3", "format")} />
          ))}
        </div>
        <div style={{
          width: 860, boxSizing: "border-box", padding: "34px 40px", borderRadius: 32, background: TH.fg, color: TH.bg,
          opacity: rule, transform: `translateY(${(1 - rule) * 60}px)`,
        }}>
          <div style={{ fontFamily: TH.fontMono, fontSize: 26, letterSpacing: "0.1em", color: TH.accent }}>QA RULE · FIRST 3 SECONDS</div>
          <div style={{ fontFamily: TH.fontBody, fontSize: 50, fontWeight: 600, marginTop: 10 }}>promise + proof, or it fails</div>
        </div>
      </Body>
    </Backdrop>
  );
};

const Brand: React.FC = () => (
  <Backdrop theme={TH}>
    <Body top={CHROME_CLEARANCE + 10}>
      <Headline theme={TH} highlight={BRAND.highlight} size={96} text="Your *brand*, every reel" delay={2} stagger={3} />
      <ProofShot theme={TH} src="assets/series-demo/brand-frame.jpg" device="phone" width={310} delay={at("S4", "reel")}
        caption="A REAL FRAME FROM THIS STUDIO" zoomTo={1.06}
        highlight={{ x: 0.08, y: 0.2, w: 0.84, h: 0.14, at: at("S4", "know") }} />
    </Body>
  </Backdrop>
);

/** The scene shows its own spoken words, lighting each one as the voice says it. */
const Voice: React.FC = () => {
  const f = useCurrentFrame();
  const s = S("S5");
  return (
    <Backdrop theme={ALT}>
      <Body>
        <Headline theme={ALT} highlight={BRAND.highlight} size={110} text="Lands on the *word*" at={words("S5", ["adds", "lands", "the", "word"])} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 16px", justifyContent: "center", maxWidth: 880 }}>
          {s.words.map((w) => {
            const local = w.frame - s.from;
            const t = progress(f, local, 5);
            const speaking = f >= local && f < w.endFrame - s.from + 2;
            return (
              <div key={w.frame} style={{
                padding: "10px 20px", borderRadius: 16, fontFamily: ALT.fontMono, fontSize: 34,
                background: speaking ? ALT.accent : ALT.surface, color: speaking ? ALT.bg : t > 0 ? ALT.fg : ALT.muted,
                transform: `translateY(${speaking ? -8 : 0}px)`,
              }}>{w.token.replace(/[.,]$/, "")}</div>
            );
          })}
        </div>
      </Body>
    </Backdrop>
  );
};

const Replies: React.FC = () => {
  const f = useCurrentFrame();
  const card = pop(f, at("S6", "drafts"));
  const approve = at("S6", "approve");
  const pressed = f >= approve;
  return (
    <Backdrop theme={TH}>
      <Body>
        <Headline theme={TH} highlight={BRAND.highlight} size={104} text="It drafts your *replies*" at={words("S6", ["comments", "drafts", "your", "replies"])} />
        <div style={{
          width: 860, boxSizing: "border-box", padding: 40, borderRadius: 36, background: TH.surface,
          boxShadow: "0 24px 60px rgba(0,0,0,0.14)", opacity: card, transform: `translateY(${(1 - card) * 80}px)`,
        }}>
          <div style={{ fontFamily: TH.fontMono, fontSize: 24, color: TH.muted, letterSpacing: "0.1em" }}>EXAMPLE · COMMENT "FACTORY"</div>
          <div style={{ fontFamily: TH.fontMono, fontSize: 24, color: TH.accent, letterSpacing: "0.1em", marginTop: 26 }}>DRAFT DM</div>
          <div style={{ fontFamily: TH.fontBody, fontSize: 44, fontWeight: 500, color: TH.fg, marginTop: 8, lineHeight: 1.25 }}>
            Here's the repo, as promised. Start with /reel-brand.
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 34 }}>
            <div style={{
              flex: 1, textAlign: "center", padding: "20px 0", borderRadius: 999, fontFamily: TH.fontBody, fontSize: 36, fontWeight: 700,
              background: pressed ? TH.accent : TH.fg, color: TH.bg, transform: `scale(${pressed ? 0.97 + 0.03 * progress(f, approve, 8) : 1})`,
            }}>{pressed ? "Approved" : "Approve"}</div>
            <div style={{
              flex: 1, textAlign: "center", padding: "20px 0", borderRadius: 999, fontFamily: TH.fontBody, fontSize: 36, fontWeight: 700,
              border: `3px solid ${TH.muted}66`, color: TH.fg,
            }}>Edit</div>
          </div>
        </div>
      </Body>
    </Backdrop>
  );
};

const Cta: React.FC = () => (
  <Backdrop theme={TH}>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 200 }}>
      <CtaCard theme={TH} keyword="FACTORY" promise="the link" handle={BRAND.handle} delay={0} tapAt={at("S7", "factory")} />
    </AbsoluteFill>
  </Backdrop>
);

const SCENES: readonly { id: string; Component: React.FC }[] = [
  { id: "S1", Component: Hook }, { id: "S2", Component: Ideas }, { id: "S3", Component: Script },
  { id: "S4", Component: Brand }, { id: "S5", Component: Voice }, { id: "S6", Component: Replies }, { id: "S7", Component: Cta },
];

const CHROME: readonly ChromeStep[] = TAKE.scenes.map((s, i) => ({
  from: s.from,
  chapter: i >= 1 && i <= 5 ? i - 1 : undefined,
  hidden: s.id === "S1" || s.id === "S7",
  alt: s.id === "S5",
}));

// Sound director's sheet: whooshes sit in the gap before each scene's first word, UI cues stay under the voice.
const CUES: readonly SfxCue[] = [
  ...TAKE.scenes.slice(1).map((s) => ({ at: s.from, sound: "whoosh" as const, volume: 0.28 })),
  { at: wordFrame(TAKE, "S1", "eight"), sound: "pop", volume: 0.3 },
  ...["ideas", "working", "niche"].map((w) => ({ at: wordFrame(TAKE, "S2", w), sound: "click" as const, volume: 0.25 })),
  { at: wordFrame(TAKE, "S3", "hook"), sound: "thud", volume: 0.3 },
  { at: wordFrame(TAKE, "S4", "reel"), sound: "pop", volume: 0.28 },
  { at: wordFrame(TAKE, "S6", "approve"), sound: "click", volume: 0.3 },
  { at: wordFrame(TAKE, "S7", "factory"), sound: "pop", volume: 0.3 },
  { at: S("S7").speechEnd + 4, sound: "ding", volume: 0.45 },
];

export const SeriesDemoReel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: TH.bg }}>
    {SCENES.map(({ id, Component }) => {
      const s = S(id);
      return (
        <Sequence key={id} from={s.from} durationInFrames={s.to - s.from} name={id}>
          <Component />
        </Sequence>
      );
    })}
    <SeriesChrome theme={TH} altTheme={ALT} steps={CHROME} totalFrames={TAKE.totalFrames}
      label={BRAND.chrome.chapterLabel} tabs={BRAND.chrome.tabs ? TABS : undefined}
      counter={BRAND.chrome.counter} progressBar={BRAND.chrome.progressBar} />
    <VoiceOver take={TAKE} />
    <Captions take={TAKE} scenes={["S2", "S3", "S4", "S6"]} keepTogether={["three seconds"]} {...captionProps(BRAND)} />
    <SfxTrack cues={CUES} />
  </AbsoluteFill>
);
