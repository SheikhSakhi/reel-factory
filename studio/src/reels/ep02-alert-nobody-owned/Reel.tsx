import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { SfxTrack, VoiceOver, loadTake, pop, progress, wordFrame, type SfxCue } from "../../kit";
import { CameraRig, talkLevel, type Shot } from "../../kit/Cast3D";
import { DocBot, LowPerson, NightStudio, type LowLook } from "../../kit/LowPoly";
import { CinemaGrade, Graded } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/ep02-alert-nobody-owned/take.json";

// Formats lab F1 v2 (mascot sitcom), episode 2: low-poly cast, night studio, cinematic grade, split layout with a
// UI card on top (step progress) and the scene below with gold serif subtitles. No CTA (learnings, 2026-10-30).
const TAKE = loadTake(takeJson);
type Line = { id: string; speaker: string; from: number; to: number; words: { token: string; frame: number; endFrame: number }[] };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
export const EP02_DURATION = TAKE.totalFrames;

const SERIF = BRAND.theme.fontDisplay;
const SANS = BRAND.theme.fontBody;
const MONO = BRAND.theme.fontMono;
const C = { card: "#15110F", ink: "#F3EEE4", muted: "#9C9084", orange: "#E8774A", gold: "#F2C14E", teal: "#3FC1AE", red: "#E5564A" } as const;

const TOP = 860; // the UI card takes the top; the 3D scene the rest
const SCENE_H = 1920 - TOP;

const DOCTOR: LowLook = { skin: "#C98C66", hair: "#2A1E18", top: "#2F5D5A", pants: "#2C2B33", beard: true, cap: "#3B2A22" };
const DOCTOR_AT = [-0.65, 0, 0] as const;
const DOC_AT = [0.5, 1.42, 0.08] as const;

const SHOTS: Record<string, Shot> = {
  wide: { pos: [1.15, 1.55, 3.1], look: [-0.1, 1.2, 0], fov: 36, drift: [-0.15, 0, -0.2] },
  wideEnd: { pos: [0.9, 1.5, 2.6], look: [-0.1, 1.2, 0], fov: 36, drift: [0.5, 0.25, 0.9] },
  doctor: { pos: [0.55, 1.6, 1.25], look: [-0.65, 1.45, 0], fov: 32, drift: [-0.06, 0, -0.1] },
  doc: { pos: [-0.75, 1.5, 1.75], look: [0.45, 1.38, 0.08], fov: 32, drift: [0.06, 0, -0.15] },
  ots: { pos: [1.55, 1.65, -0.35], look: [-0.65, 1.42, 0.05], fov: 34, drift: [-0.1, 0, 0.1] },
};
const SHOT_OF: Record<string, keyof typeof SHOTS> = {
  S1: "wide", S2: "doc", S3: "doctor", S4: "doc", S5: "doctor", S6: "ots", S7: "doctor", S8: "doc", S9: "wide",
  S10: "doctor", S11: "doc", S12: "doctor", S13: "wideEnd",
};
// Doc faces the doctor (-PI/2) or turns toward the camera in its close-ups.
const DOC_TURN: Record<keyof typeof SHOTS, number> = { wide: -0.75, wideEnd: -0.8, doctor: -Math.PI / 2, doc: -0.62, ots: -Math.PI / 2 };

const lineAt = (f: number): Line => LINES.find((l) => f >= l.from && f < l.to) ?? LINES[LINES.length - 1];
const L = (id: string): Line => LINES.find((l) => l.id === id)!;
const at = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const World: React.FC<{ frame: number }> = ({ frame }) => {
  const line = lineAt(frame);
  const shotName = SHOT_OF[line.id];
  const t = Math.min(1, (frame - line.from) / Math.max(1, line.to - line.from));
  const talking = (who: string) => (line.speaker === who ? talkLevel(frame, line.words) : 0);
  const prev = LINES[Math.max(0, LINES.indexOf(line) - 1)];
  const turn = interpolate(frame, [line.from, line.from + 10], [DOC_TURN[SHOT_OF[prev.id]], DOC_TURN[shotName]], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // The doctor frowns at the flood, lifts his brows at the fix.
  const brows = ["S1", "S3", "S5"].includes(line.id) ? -0.8 : ["S9", "S11"].includes(line.id) ? 0.7 : 0;
  // Doc's eyes go amber while the alerts flood in, back to warm white once each alert has an owner.
  const eyes = frame < L("S8").from ? "#FFB46B" : "#F6E7B0";
  return (
    <>
      <color attach="background" args={["#1A120E"]} />
      <fog attach="fog" args={["#1A120E", 4, 9]} />
      <CameraRig shot={SHOTS[shotName]} t={t} />
      <NightStudio frame={frame} screen={frame < L("S8").from ? "#FF8A6B" : "#7FB6FF"} />
      <LowPerson look={DOCTOR} position={DOCTOR_AT} turn={Math.PI / 2} frame={frame} talk={talking("DOCTOR")} brows={brows}
        gesture={line.speaker === "DOCTOR" ? 0.6 : 0.05} headTilt={line.id === "S12" ? 0.12 : 0} />
      <DocBot position={DOC_AT} frame={frame} talk={talking("DOC")} turn={turn} eyes={eyes} />
    </>
  );
};

// ---------- the UI card on top ----------

const STEPS = [
  { title: "The flood", from: L("S1").from, to: L("S6").from },
  { title: "What studies found", from: L("S6").from, to: L("S7").from },
  { title: "The fix", from: L("S7").from, to: L("S10").from },
  { title: "The plan", from: L("S10").from, to: TAKE.totalFrames },
];

const StepBar: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const s = STEPS[i];
  const fill = progress(f, s.from, s.to - s.from);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ background: C.orange, color: "#1A0E08", fontFamily: SANS, fontWeight: 800, fontSize: 30, padding: "8px 22px", borderRadius: 999, whiteSpace: "nowrap" }}>
        STEP {i + 1}/4
      </div>
      {STEPS.map((_, k) => (
        <div key={k} style={{ flex: 1, height: 16, borderRadius: 10, background: "#2A2420", border: k === i ? `2px solid ${C.gold}` : "2px solid transparent", overflow: "hidden" }}>
          <div style={{ width: `${k < i ? 100 : k === i ? fill * 100 : 0}%`, height: "100%", background: k === i ? C.gold : "#5A4A3E" }} />
        </div>
      ))}
    </div>
  );
};

const Row: React.FC<{ at: number; children: React.ReactNode; accent?: string; dim?: number }> = ({ at: start, children, accent = C.orange, dim = 0 }) => {
  const f = useCurrentFrame();
  if (f < start - 3) return null;
  const t = pop(f, start - 3, 14);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, background: "#211B17", borderRadius: 18, padding: "18px 24px", borderLeft: `8px solid ${accent}`,
      opacity: Math.min(1, t * 1.5) * (1 - dim * 0.65), transform: `translateX(${(1 - t) * 80}px)` }}>{children}</div>
  );
};

const AlertFlood: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [at("S1", "four"), at("S1", "alerts") + 6], [0, 400], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const unread = progress(f, at("S5", "lunch.") - 4, 10);
  const items = ["Potassium 5.4 · Bed 12", "Duplicate order · Bed 3", "Interaction warning · Bed 7", "Heart rate 104 · Bed 9", "Allergy check · Bed 15"];
  const scroll = ((f - L("S1").from) * 3) % 120;
  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 6 }}>
        <div style={{ fontFamily: SERIF, fontSize: 150, color: C.ink, lineHeight: 1 }}>{n}</div>
        <div style={{ fontFamily: MONO, fontSize: 30, color: C.muted, letterSpacing: "0.1em" }}>ALERTS TODAY</div>
      </div>
      <div style={{ position: "relative", height: 330, overflow: "hidden", marginTop: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, transform: `translateY(${-scroll}px)` }}>
          {[...items, ...items, ...items].map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", background: "#211B17", borderRadius: 14, padding: "14px 22px",
              fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.ink, opacity: f >= at("S1", "four") ? 1 - unread * 0.6 : 0 }}>
              <span>{it}</span><span style={{ color: unread > 0.5 ? C.muted : C.red, fontFamily: MONO, fontSize: 24 }}>{unread > 0.5 ? "UNREAD" : "NEW"}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const Evidence: React.FC = () => {
  const f = useCurrentFrame();
  const lo = progress(f, at("S6", "half") - 2, 10);
  const hi = interpolate(f, [at("S6", "almost"), at("S6", "cases.") + 4], [49, 96], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = (p: number) => (p / 100) * 900;
  return (
    <>
      <div style={{ background: "#F2EBDD", borderRadius: 14, padding: "26px 32px", marginTop: 10, opacity: progress(f, at("S6", "Studies") - 4, 10) }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: "#6B6459", letterSpacing: "0.12em" }}>JAMIA · 2006 · REVIEW OF 17 STUDIES</div>
        <div style={{ fontFamily: SERIF, fontSize: 46, color: "#2A2320", marginTop: 8 }}>Overriding of drug safety alerts</div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 28, color: C.muted, marginTop: 40, letterSpacing: "0.1em", opacity: lo }}>ALERTS OVERRIDDEN</div>
      <div style={{ position: "relative", height: 90, marginTop: 14, background: "#211B17", borderRadius: 12, opacity: lo }}>
        <div style={{ position: "absolute", left: x(49), top: 0, height: 90, width: Math.max(4, x(hi) - x(49)), background: C.red, borderRadius: 12 }} />
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 84, color: C.ink, marginTop: 14, opacity: lo }}>49–{Math.round(hi)}%</div>
    </>
  );
};

const Fix: React.FC = () => (
  <>
    <div style={{ fontFamily: SERIF, fontSize: 60, color: C.ink, marginTop: 10, lineHeight: 1.1 }}>Alerts nobody owns<br />don't work.</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 30 }}>
      <Row at={at("S9", "threshold.")} accent={C.gold}><span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: C.ink }}>One threshold</span><span style={{ fontFamily: SANS, fontSize: 30, color: C.muted }}>for this patient</span></Row>
      <Row at={at("S9", "person.")} accent={C.gold}><span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: C.ink }}>One person</span><span style={{ fontFamily: SANS, fontSize: 30, color: C.muted }}>who answers</span></Row>
      <Row at={at("S9", "action.")} accent={C.gold}><span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: C.ink }}>One action</span><span style={{ fontFamily: SANS, fontSize: 30, color: C.muted }}>what happens next</span></Row>
    </div>
  </>
);

const Plan: React.FC = () => {
  const f = useCurrentFrame();
  const one = at("S11", "one.");
  const count = f < at("S11", "Four") ? null : f < one ? 400 : 1;
  return (
    <>
      <div style={{ background: "#211B17", borderRadius: 18, padding: "24px 28px", marginTop: 10, borderLeft: `8px solid ${C.teal}`, opacity: progress(f, at("S10", "Rao.") - 4, 10) }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: C.teal, letterSpacing: "0.12em" }}>PLAN · MRS. RAO</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: C.ink, marginTop: 10, opacity: progress(f, at("S10", "oxygen") - 2, 8) }}>Oxygen below the agreed level</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: C.gold, marginTop: 6, opacity: progress(f, at("S10", "call") - 2, 8) }}>→ call her doctor</div>
      </div>
      {count !== null ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 26 }}>
          <div style={{ fontFamily: SERIF, fontSize: 130, color: count === 1 ? C.teal : C.ink, lineHeight: 1, transform: `scale(${count === 1 ? 0.8 + 0.2 * pop(f, one, 10) : 1})` }}>{count}</div>
          <div style={{ fontFamily: MONO, fontSize: 30, color: C.muted, letterSpacing: "0.1em" }}>{count === 1 ? "ALERT THAT MATTERS" : "ALERTS"}</div>
        </div>
      ) : null}
      <div style={{ marginTop: 18 }}>
        <Row at={at("S13", "again.")} accent={C.teal}><span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, color: C.ink }}>No reply?</span><span style={{ fontFamily: SANS, fontSize: 30, color: C.muted }}>call again</span></Row>
      </div>
    </>
  );
};

const TopCard: React.FC = () => {
  const f = useCurrentFrame();
  const i = STEPS.findIndex((s) => f >= s.from && f < s.to);
  const step = Math.max(0, i);
  const enter = pop(f, STEPS[step].from, 16);
  const body = [<AlertFlood key={0} />, <Evidence key={1} />, <Fix key={2} />, <Plan key={3} />][step];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: TOP, background: C.card, padding: "120px 60px 0", boxSizing: "border-box",
      borderBottom: "2px solid #3A2C22" }}>
      <StepBar i={step} />
      <div style={{ fontFamily: SERIF, fontSize: 84, color: C.ink, marginTop: 22, opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` }}>{STEPS[step].title}</div>
      <div style={{ opacity: Math.min(1, enter * 1.5) }}>{body}</div>
    </div>
  );
};

/** Gold serif subtitles on the scene: Doc in gold, the doctor in cream. */
const Subs: React.FC = () => {
  const f = useCurrentFrame();
  const line = LINES.find((l) => f >= l.from && f < l.to);
  if (!line) return null;
  const chunks: Line["words"][] = [];
  for (const w of line.words) {
    const last = chunks[chunks.length - 1];
    if (!last || last.length >= 4 || /[.?!:,]$/.test(last[last.length - 1].token)) chunks.push([w]);
    else last.push(w);
  }
  const chunk = [...chunks].reverse().find((c) => f >= c[0].frame - 2) ?? chunks[0];
  const t = pop(f, chunk[0].frame - 2, 16);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: TOP + 60, textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontSize: 70, lineHeight: 1.1,
      color: line.speaker === "DOC" ? C.gold : C.ink, textShadow: "0 4px 20px rgba(0,0,0,0.75)", opacity: Math.min(1, t * 1.6), transform: `translateY(${(1 - t) * 10}px)` }}>
      {chunk.map((w) => w.token).join(" ")}
    </div>
  );
};

const sfx = (): SfxCue[] => [
  ...[0, 1, 2, 3, 4].map((k) => ({ at: k * 280, sound: "hum" as const, volume: 0.13 })),
  ...LINES.slice(1).map((l) => ({ at: l.from, sound: "whoosh" as const, volume: 0.08 })),
  ...Array.from({ length: 10 }, (_, k) => ({ at: at("S1", "four") + k * 2, sound: "blip" as const, volume: 0.14 })),
  { at: at("S5", "lunch.") - 4, sound: "thud", volume: 0.3 },
  { at: L("S6").from, sound: "swoosh", volume: 0.3 },
  { at: at("S6", "half") - 2, sound: "click", volume: 0.3 },
  { at: at("S6", "almost"), sound: "riser", volume: 0.18 },
  { at: at("S6", "cases.") + 4, sound: "impact", volume: 0.35 },
  { at: L("S7").from, sound: "swoosh", volume: 0.25 },
  ...["threshold.", "person.", "action."].map((w) => ({ at: at("S9", w) - 3, sound: "pop" as const, volume: 0.28 })),
  { at: L("S10").from, sound: "swoosh", volume: 0.25 },
  { at: at("S10", "Rao.") - 4, sound: "click", volume: 0.3 },
  { at: at("S11", "one."), sound: "shimmer", volume: 0.35 },
  { at: at("S13", "again.") - 3, sound: "ding", volume: 0.25 },
];

export const Ep02AlertNobodyOwned: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0E0A08" }}>
      <div style={{ position: "absolute", left: 0, top: TOP, width: 1080, height: SCENE_H, overflow: "hidden" }}>
        <Graded>
          <ThreeCanvas width={1080} height={SCENE_H} shadows dpr={1} gl={{ antialias: true, preserveDrawingBuffer: true }}>
            <World frame={frame} />
          </ThreeCanvas>
        </Graded>
        <CinemaGrade />
      </div>
      <TopCard />
      <Subs />
      <CinemaGrade grain={0.08} vignette={0} glow="#000000" />
      <VoiceOver take={TAKE} volume={1} />
      <SfxTrack cues={sfx()} />
    </AbsoluteFill>
  );
};

export const EP02_COVER = at("S6", "cases.") + 12;
