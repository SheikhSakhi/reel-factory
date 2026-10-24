import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { SfxTrack, VoiceOver, loadTake, pop, progress, wordFrame, type SfxCue } from "../../kit";
import { DialogueCaptions } from "../../kit/DialogueCaptions";
import { CameraRig, ConsultRoom, DESK_TOP, Doc, Person, talkLevel, type Look, type Shot, type Vec3 } from "../../kit/Cast3D";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/ep01-forgotten-plan/take.json";

// Formats lab F1 (mascot sitcom), episode 1: the plan patients forget. Faceless 3D cast, three voices.
const TAKE = loadTake(takeJson);
type Line = { id: string; speaker: string; from: number; to: number; words: { token: string; frame: number; endFrame: number }[] };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
export const EP01_DURATION = TAKE.totalFrames;

const FONT = BRAND.theme.fontBody;
const SERIF = BRAND.theme.fontDisplay;
const COLORS = { DOCTOR: "#2C4A6B", PATIENT: "#B5502A", DOC: "#138A7E" } as const;

const DOCTOR: Look = { skin: "#C9906A", hair: "#2B211C", top: "#5D86A8", coat: "#F4F4F1", pants: "#3A4048", glasses: true };
const PATIENT: Look = { skin: "#8D5A3C", hair: "#1A1412", top: "#D9A23A", pants: "#3E5B73", shoes: "#EDEDED", beard: true };

const DOCTOR_AT: Vec3 = [0, 0, -0.73];
const PATIENT_AT: Vec3 = [0, 0, 0.77];
const DOC_AT: Vec3 = [-0.6, DESK_TOP + 0.33, 0];

const SHOTS: Record<string, Shot> = {
  pill: { pos: [0.5, 1.16, 0.9], look: [-0.05, DESK_TOP + 0.1, 0.22], fov: 30, drift: [-0.08, -0.03, -0.12] },
  wide: { pos: [3.9, 2.05, 1.0], look: [-0.1, 0.98, 0], fov: 44, drift: [-0.25, 0, 0] },
  wideEnd: { pos: [3.2, 1.8, 0.8], look: [-0.1, 0.98, 0], fov: 44, drift: [1.4, 0.7, 0.4] },
  otsDoctor: { pos: [0.42, 1.5, 1.85], look: [0, 1.2, -0.73], fov: 32, drift: [0, 0, -0.15] },
  otsPatient: { pos: [-0.42, 1.52, -1.8], look: [0, 1.15, 0.77], fov: 32, drift: [0, 0, 0.15] },
  closePatient: { pos: [0.95, 1.42, -0.4], look: [0, 1.2, 0.77], fov: 30, drift: [-0.1, 0, 0.1] },
  closeDoctor: { pos: [-1.15, 1.5, 0.25], look: [0, 1.22, -0.73], fov: 30, drift: [0.1, 0, -0.1] },
  doc: { pos: [1.35, 1.5, 1.15], look: [-0.6, 1.28, 0], fov: 30, drift: [-0.35, -0.04, -0.2] },
  top: { pos: [0.02, 4.6, 0.02], look: [0, 0, 0], fov: 38, drift: [0, -0.6, 0] },
};

/** Which shot each line is cut to (one cut per line, like a sitcom). Phone scenes keep a dimmed shot behind. */
const SHOT_OF: Record<string, keyof typeof SHOTS> = {
  S1: "pill", S2: "otsPatient", S3: "closePatient", S4: "wide", S5: "doc", S6: "doc", S7: "closeDoctor",
  S8: "top", S9: "wide", S10: "wide", S11: "otsPatient", S12: "doc", S13: "closePatient", S14: "wideEnd",
};
const PHONE_SCENES = ["S9", "S10", "S12"];

const lineAt = (f: number): Line => LINES.find((l) => f >= l.from && f < l.to) ?? LINES[LINES.length - 1];
const L = (id: string): Line => LINES.find((l) => l.id === id)!;
const at = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

// Doc turns to whoever the moment is about: the doctor (PI), the patient (0) or the camera (lessons).
const TO_DOCTOR = 2.45, TO_PATIENT = 0.66, TO_CAMERA = 1.03, TO_WIDE = 1.35;
const DOC_TURN: Record<string, number> = {
  S1: TO_DOCTOR, S2: TO_PATIENT, S3: TO_PATIENT, S4: TO_DOCTOR, S5: TO_CAMERA, S6: TO_CAMERA, S7: TO_DOCTOR, S8: TO_DOCTOR,
  S9: TO_WIDE, S10: TO_WIDE, S11: TO_PATIENT, S12: TO_CAMERA, S13: TO_PATIENT, S14: TO_WIDE,
};

const World: React.FC<{ frame: number }> = ({ frame }) => {
  const line = lineAt(frame);
  const shot = SHOTS[SHOT_OF[line.id]];
  const t = Math.min(1, (frame - line.from) / Math.max(1, line.to - line.from));
  const talking = (who: string) => (line.speaker === who ? talkLevel(frame, line.words) : 0);
  // Ease Doc's turn from the previous line's target over 10 frames.
  const prev = LINES[Math.max(0, LINES.indexOf(line) - 1)];
  const turn = interpolate(frame, [line.from, line.from + 10], [DOC_TURN[prev.id], DOC_TURN[line.id]], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const doctorLooksAtDoc = ["S4", "S5", "S6", "S7", "S8"].includes(line.id);
  const patientLooksAtDoc = ["S5", "S6", "S12", "S14"].includes(line.id);
  return (
    <>
      <color attach="background" args={["#E9E0D1"]} />
      <fog attach="fog" args={["#E9E0D1", 7, 16]} />
      <CameraRig shot={shot} t={t} />
      <ConsultRoom frame={frame} />
      <Person look={DOCTOR} position={DOCTOR_AT} turn={0} frame={frame} talk={talking("DOCTOR")}
        gesture={line.speaker === "DOCTOR" ? 0.7 : 0.1} headTurn={doctorLooksAtDoc ? -0.69 : 0} headTilt={line.id === "S7" ? 0.12 : 0} />
      <Person look={PATIENT} position={PATIENT_AT} turn={Math.PI} frame={frame + 37} talk={talking("PATIENT")}
        gesture={line.speaker === "PATIENT" ? 0.5 : 0} headTurn={patientLooksAtDoc ? 0.66 : 0} headTilt={line.id === "S3" ? -0.15 : 0} />
      <Doc position={DOC_AT} frame={frame} talk={talking("DOC")} turn={turn} />
    </>
  );
};

// ---------- overlays ----------

const EpisodeLabel: React.FC = () => {
  const f = useCurrentFrame();
  const t = pop(f, 4);
  const out = progress(f, 95, 10);
  return (
    <div style={{ position: "absolute", left: 60, top: 230, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10,
      opacity: 1 - out, transform: `translateX(${(1 - t) * -60}px)` }}>
      <div style={{ background: "#C8371E", color: "#fff", fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: "0.12em", padding: "8px 18px" }}>EPISODE 1</div>
      <div style={{ background: "#FFFFFF", color: "#171512", fontFamily: FONT, fontWeight: 700, fontSize: 38, padding: "8px 18px" }}>THE FORGOTTEN PLAN</div>
    </div>
  );
};

const BigLine: React.FC<{ text: string; at: number; until: number; top?: number }> = ({ text, at: start, until, top = 560 }) => {
  const f = useCurrentFrame();
  if (f < start || f > until) return null;
  const t = pop(f, start, 11);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 150,
      letterSpacing: "-0.03em", color: "#FFFFFF", textShadow: "0 10px 40px rgba(0,0,0,0.55)", transform: `scale(${1.25 - 0.25 * t})`, opacity: Math.min(1, t * 2) }}>
      {text}
    </div>
  );
};

const FactCard: React.FC = () => {
  const f = useCurrentFrame();
  const s5 = L("S5"), s6 = L("S6");
  if (f < s5.from || f >= s6.to) return null;
  const t = pop(f, s5.from + 4);
  const big = Math.round(interpolate(f, [at("S5", "forty"), at("S5", "eighty")], [0, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const range = f >= at("S5", "eighty") ? "40–80%" : `${big}%`;
  const second = pop(f, at("S6", "half"));
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 250, background: "#FBF8F2", borderRadius: 28, padding: "44px 48px",
      boxShadow: "0 30px 80px rgba(0,0,0,0.35)", transform: `translateY(${(1 - t) * -80}px) rotate(${(1 - t) * -3}deg)`, opacity: t }}>
      <div style={{ fontFamily: SERIF, fontSize: 170, lineHeight: 0.9, color: COLORS.DOC }}>{range}</div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 44, color: "#171512", marginTop: 14 }}>of what the doctor says is forgotten right away</div>
      <div style={{ height: 2, background: "#00000018", margin: "26px 0", opacity: second }} />
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 40, color: "#171512", opacity: second, transform: `translateY(${(1 - second) * 16}px)` }}>
        and <span style={{ color: COLORS.PATIENT }}>about half</span> of what is remembered is wrong
      </div>
      <div style={{ fontFamily: FONT, fontSize: 26, color: "#6B6459", marginTop: 22 }}>Kessels, J R Soc Med 2003 (review of studies)</div>
    </div>
  );
};

const PHONE_W = 600, PHONE_H = 1060, PHONE_TOP = 170;

const Phone: React.FC<{ children: React.ReactNode; enter: number; tilt?: number }> = ({ children, enter, tilt = 0 }) => {
  const f = useCurrentFrame();
  const t = pop(f, enter, 15);
  return (
    <div style={{ position: "absolute", left: (1080 - PHONE_W) / 2, top: PHONE_TOP, width: PHONE_W, height: PHONE_H, borderRadius: 78,
      background: "#101214", padding: 18, boxShadow: "0 50px 120px rgba(0,0,0,0.55)",
      transform: `translateY(${(1 - t) * 900}px) rotate(${tilt + (1 - t) * 8}deg)` }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 62, background: "#F6F3EE", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: 16, left: "50%", width: 150, height: 40, marginLeft: -75, borderRadius: 30, background: "#101214" }} />
        {children}
      </div>
    </div>
  );
};

const Item: React.FC<{ n: number; title: string; detail: string; at: number }> = ({ n, title, detail, at: start }) => {
  const f = useCurrentFrame();
  const t = pop(f, start - 3);
  return (
    <div style={{ display: "flex", gap: 22, alignItems: "center", background: "#FFFFFF", borderRadius: 26, padding: "24px 26px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.07)", opacity: Math.min(1, t * 1.5), transform: `translateX(${(1 - t) * 120}px)` }}>
      <div style={{ width: 64, height: 64, borderRadius: 32, background: COLORS.DOC, color: "#fff", fontFamily: FONT, fontWeight: 700, fontSize: 32,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</div>
      <div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 36, color: "#171512" }}>{title}</div>
        <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 28, color: "#6B6459", marginTop: 4 }}>{detail}</div>
      </div>
    </div>
  );
};

const PlanScreen: React.FC = () => {
  const s = L("S9");
  return (
    <Phone enter={s.from}>
      <div style={{ padding: "96px 34px 0", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 26, color: COLORS.DOC, letterSpacing: "0.1em" }}>YOUR HEALTH PLAN</div>
        <div style={{ fontFamily: SERIF, fontSize: 64, lineHeight: 1, color: "#171512", marginBottom: 12 }}>After today's visit</div>
        <Item n={1} title="What to take" detail="The new pill, 1 tablet" at={at("S9", "take.")} />
        <Item n={2} title="When" detail="Every morning, with breakfast" at={at("S9", "When.")} />
        <Item n={3} title="What to watch" detail="How you feel, day by day" at={at("S9", "watch.")} />
        <Item n={4} title="When to call" detail="If anything feels worse" at={at("S9", "call.")} />
      </div>
    </Phone>
  );
};

const Bubble: React.FC<{ tag: string; text: string; at: number; color: string; buttons?: readonly string[] }> = ({ tag, text, at: start, color, buttons }) => {
  const f = useCurrentFrame();
  const t = pop(f, start - 3);
  if (f < start - 3) return null;
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 28, padding: "22px 26px", boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
      borderLeft: `10px solid ${color}`, transform: `scale(${0.8 + 0.2 * t})`, opacity: Math.min(1, t * 1.5) }}>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 26, letterSpacing: "0.08em", color }}>{tag}</div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 34, color: "#171512", marginTop: 6, lineHeight: 1.2 }}>{text}</div>
      {buttons ? (
        <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
          {buttons.map((b, i) => (
            <div key={b} style={{ fontFamily: FONT, fontWeight: 700, fontSize: 28, padding: "10px 22px", borderRadius: 999,
              background: i === 1 && f > start + 26 ? COLORS.PATIENT : "#EFEBE4", color: i === 1 && f > start + 26 ? "#fff" : "#171512" }}>{b}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const FollowUpScreen: React.FC = () => {
  const s = L("S10");
  const f = useCurrentFrame();
  const stamp = pop(f, at("S10", "Not"), 10);
  return (
    <Phone enter={s.from - 8} tilt={-2}>
      <div style={{ padding: "96px 30px 0", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 26, color: COLORS.DOC, letterSpacing: "0.1em" }}>BETWEEN VISITS</div>
        <Bubble tag="DAY 1 · REMINDER" text="Start the new pill this morning" at={at("S10", "one,")} color={COLORS.DOC} />
        <Bubble tag="DAY 3 · CHECK-IN" text="How are you feeling on it?" at={at("S10", "three,")} color={COLORS.DOC} buttons={["Good", "Not great"]} />
        <Bubble tag="TO YOUR DOCTOR" text="Patient reports a problem. Review today." at={at("S10", "off,")} color={COLORS.PATIENT} />
      </div>
      {f >= at("S10", "Not") - 2 ? (
        <div style={{ position: "absolute", left: 60, right: 60, bottom: 90, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 56,
          color: COLORS.PATIENT, border: `6px solid ${COLORS.PATIENT}`, borderRadius: 18, padding: "10px 0",
          transform: `rotate(-6deg) scale(${1.6 - 0.6 * stamp})`, opacity: Math.min(1, stamp * 2) }}>
          DAYS, NOT 6 WEEKS
        </div>
      ) : null}
    </Phone>
  );
};

const LockScreen: React.FC = () => {
  const s = L("S12");
  const f = useCurrentFrame();
  const note = pop(f, at("S12", "Morning.") + 4);
  return (
    <Phone enter={s.from - 6} tilt={3}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#1E5F5A,#123B3A)" }} />
      <div style={{ position: "relative", textAlign: "center", paddingTop: 150, color: "#fff" }}>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, opacity: 0.8 }}>Tuesday</div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 170, letterSpacing: "-0.04em", lineHeight: 1 }}>8:00</div>
      </div>
      <div style={{ position: "absolute", left: 26, right: 26, top: 470, background: "rgba(255,255,255,0.92)", borderRadius: 30, padding: "24px 28px",
        transform: `translateY(${(1 - note) * -60}px)`, opacity: note }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 26, color: COLORS.DOC, letterSpacing: "0.08em" }}>DOCX · NOW</div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 38, color: "#171512", marginTop: 6 }}>Morning: the new pill</div>
        <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 30, color: "#6B6459", marginTop: 4 }}>1 tablet with breakfast. Tap when taken.</div>
      </div>
    </Phone>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const start = L("S14").words[L("S14").words.length - 1].endFrame + 8;
  if (f < start) return null;
  const t = pop(f, start, 16);
  const sub = pop(f, start + 12);
  return (
    <AbsoluteFill style={{ background: `rgba(12,30,29,${0.82 * Math.min(1, t)})`, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30 }}>
      <div style={{ fontFamily: SERIF, fontSize: 96, color: "#fff", textAlign: "center", lineHeight: 1.05, padding: "0 80px", opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}>
        The plan should go home <span style={{ color: "#5FD6C4", fontStyle: "italic" }}>with the patient.</span>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 34, letterSpacing: "0.14em", color: "#5FD6C4", opacity: sub }}>DOCX · EPISODE 2 ON FRIDAY</div>
    </AbsoluteFill>
  );
};

const Dim: React.FC = () => {
  const f = useCurrentFrame();
  const scenes = PHONE_SCENES.map(L);
  const a = Math.max(...scenes.map((s) => Math.min(progress(f, s.from - 8, 10), 1 - progress(f, s.to - 4, 6))));
  return <AbsoluteFill style={{ background: `rgba(16,22,24,${0.55 * a})`, backdropFilter: a > 0.01 ? `blur(${6 * a}px)` : undefined }} />;
};

const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(30,18,8,0.35) 100%)", pointerEvents: "none" }} />
);

const sfx = (): SfxCue[] => {
  const cuts = LINES.slice(1).map((l) => ({ at: l.from, sound: "whoosh" as const, volume: 0.12 }));
  return [
    { at: 4, sound: "thud", volume: 0.5 },
    ...cuts,
    { at: at("S5", "eighty"), sound: "pop", volume: 0.4 },
    { at: at("S9", "take."), sound: "click", volume: 0.35 },
    { at: at("S9", "When."), sound: "click", volume: 0.35 },
    { at: at("S9", "watch."), sound: "click", volume: 0.35 },
    { at: at("S9", "call."), sound: "click", volume: 0.35 },
    { at: at("S10", "one,"), sound: "ding", volume: 0.3 },
    { at: at("S10", "three,"), sound: "ding", volume: 0.3 },
    { at: at("S10", "off,"), sound: "ding", volume: 0.35 },
    { at: at("S10", "Not"), sound: "thud", volume: 0.45 },
    { at: at("S12", "Morning.") + 4, sound: "ding", volume: 0.35 },
  ];
};

export const Ep01ForgottenPlan: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#E9E0D1" }}>
      <ThreeCanvas width={1080} height={1920} shadows dpr={1} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <World frame={frame} />
      </ThreeCanvas>
      <Vignette />
      <Dim />
      <EpisodeLabel />
      <BigLine text="6 WEEKS." at={at("S1", "Six")} until={L("S1").to - 1} />
      <FactCard />
      {frame >= L("S9").from - 8 && frame < L("S9").to ? <PlanScreen /> : null}
      {frame >= L("S10").from - 8 && frame < L("S10").to ? <FollowUpScreen /> : null}
      {frame >= L("S12").from - 6 && frame < L("S12").to ? <LockScreen /> : null}
      <DialogueCaptions lines={LINES} colors={COLORS} font={FONT} y={1330} skip={["S1"]}
        until={L("S14").words[L("S14").words.length - 1].endFrame + 8} />
      <EndCard />
      <VoiceOver take={TAKE} volume={1} />
      <SfxTrack cues={sfx()} />
    </AbsoluteFill>
  );
};

export const EP01_COVER = at("S5", "eighty") + 20;
