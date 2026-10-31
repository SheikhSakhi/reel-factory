import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { Activity, ClipboardList, HeartPulse, Hospital, House, Smartphone, Stethoscope, TrendingUp } from "lucide";
import {
  DrawIcon, DrawPath, Label, Multiply, PanelBackdrop, PanelContext, PopCaptions, SfxTrack, SketchCircle, SketchUnderline, Stamp,
  VoiceOver, loadTake, pop, progress, usePanel, usePanelAt, wordFrame, type SfxCue, type Theme,
} from "../../kit";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-10-30-monitor-not-plan/take.json";

// Formats lab F5 (drawn explainer), faceless: full-screen navy blueprint panels drawn on the narrator's words.
const TAKE = loadTake(takeJson);
export const MONITOR_DURATION = TAKE.totalFrames;

const THEME: Theme = { ...BRAND.alt, name: "blueprint", bg: "#0B1120", fg: "#E6EAF4", muted: "#7D88A3", accent: "#5B8CFF", surface: "#1A2338" };
const GOLD = "#F3C64B";
const RED = "#FF6B5A";

const Abs: React.FC<{ x: number; y: number; children: React.ReactNode; w?: number }> = ({ x, y, children, w }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w }}>{children}</div>
);

/** S1: the logic. Hospital -> home with a monitor -> fewer come back. */
const S1: React.FC = () => {
  const { theme } = usePanel();
  const home = usePanelAt("S1:home");
  const monitor = usePanelAt("S1:monitor,");
  const fewer = usePanelAt("S1:fewer");
  const logic = usePanelAt("S1:logic.");
  return (
    <PanelBackdrop>
      <Abs x={110} y={360}><DrawIcon icon={Hospital} size={250} color={theme.fg} at={0} duration={22} strokeWidth={1.2} /></Abs>
      <Label text="hospital" at={6} size={40} italic color={theme.muted} style={{ position: "absolute", left: 160, top: 630 }} />
      <DrawPath d="M 0 60 C 80 0 200 0 280 60" viewBox="0 0 280 70" width={280} height={70} color={theme.accent} at={home - 4} duration={16} strokeWidth={4} dashed
        style={{ position: "absolute", left: 400, top: 430 }} />
      <Abs x={700} y={360}><DrawIcon icon={House} size={250} color={theme.fg} at={home} duration={20} strokeWidth={1.2} /></Abs>
      <Label text="home" at={home + 6} size={40} italic color={theme.muted} style={{ position: "absolute", left: 770, top: 630 }} />
      <Abs x={770} y={430}><DrawIcon icon={HeartPulse} size={110} color={GOLD} at={monitor} duration={14} strokeWidth={1.8} /></Abs>
      <DrawPath d="M 280 10 C 200 70 80 70 0 10" viewBox="0 0 280 80" width={280} height={80} color={GOLD} at={fewer - 2} duration={14} strokeWidth={4}
        style={{ position: "absolute", left: 400, top: 560 }} />
      <Label text="fewer come back" at={fewer + 6} size={44} color={GOLD} style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center" }} />
      <Label text="That's the logic." at={logic - 6} size={88} style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center" }} />
      <SketchUnderline x={310} y={880} w={460} h={96} color={GOLD} at={logic + 4} />
    </PanelBackdrop>
  );
};

const Dot: React.FC<{ size: number }> = ({ size }) => <div style={{ width: size, height: size, borderRadius: size, background: "#E6EAF4CC" }} />;

/** S2: the trial and its 1,286 patients. */
const S2: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const jama = usePanelAt("S2:JAMA");
  const one = usePanelAt("S2:One");
  const patients = usePanelAt("S2:patients,");
  const after = usePanelAt("S2:after");
  const card = pop(f, jama - 4, 15);
  const n = Math.round(interpolate(f, [one, patients + 4], [0, 1286], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <PanelBackdrop>
      <div style={{ position: "absolute", left: 120, right: 120, top: 220, background: "#F2EBDD", borderRadius: 12, padding: "36px 44px",
        boxShadow: "0 30px 70px rgba(0,0,0,0.45)", opacity: f < jama - 4 ? 0 : card, transform: `translateY(${(1 - card) * 60}px) rotate(${-1.5 * card}deg)` }}>
        <div style={{ fontFamily: theme.fontMono, fontSize: 26, letterSpacing: "0.12em", color: "#6B6459" }}>JAMA NETWORK OPEN · JUNE 2026</div>
        <div style={{ fontFamily: theme.fontDisplay, fontSize: 60, color: "#2A2320", marginTop: 14 }}>The ACCOMPLISH trial</div>
        <div style={{ fontFamily: theme.fontBody, fontSize: 30, color: "#6B6459", marginTop: 8 }}>Remote monitoring after sepsis or pneumonia</div>
      </div>
      <div style={{ position: "absolute", left: 140, top: 620 }}>
        <Multiply cols={12} rows={5} cell={38} gap={28} at={one} spread={20} order="random"><Dot size={38} /></Multiply>
      </div>
      {f >= one ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1040, textAlign: "center", fontFamily: theme.fontDisplay, fontSize: 170, color: theme.fg }}>
          {n.toLocaleString("en-US")}
        </div>
      ) : null}
      <Label text="sepsis or pneumonia survivors" at={after} size={44} italic color={GOLD} style={{ position: "absolute", left: 0, right: 0, top: 1240, textAlign: "center" }} />
    </PanelBackdrop>
  );
};

const ECG = "M 0 60 L 60 60 L 80 20 L 100 100 L 120 60 L 190 60 L 205 40 L 220 60 L 300 60";

/** S3: what was monitored, and the four strategies. */
const S3: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const vitals = usePanelAt("S3:Vitals");
  const symptoms = usePanelAt("S3:symptoms,");
  const words = ["S3:Four", "S3:different", "S3:monitoring", "S3:strategies."].map(usePanelAt);
  const cards = [["Short questions", "standard team"], ["Short questions", "enhanced team"], ["Long questions", "standard team"], ["Long questions", "enhanced team"]];
  return (
    <PanelBackdrop>
      <Abs x={110} y={220}><DrawIcon icon={Smartphone} size={260} color={theme.fg} at={vitals - 4} duration={16} strokeWidth={1.1} /></Abs>
      <DrawPath d={ECG} viewBox="0 0 300 120" width={300} height={120} color={GOLD} at={vitals + 4} duration={22} strokeWidth={4} glow
        style={{ position: "absolute", left: 420, top: 260 }} />
      <Label text="vitals" at={vitals + 2} size={44} italic color={theme.muted} style={{ position: "absolute", left: 760, top: 290 }} />
      <Abs x={430} y={380}><DrawIcon icon={ClipboardList} size={110} color={theme.fg} at={symptoms} duration={12} strokeWidth={1.6} /></Abs>
      <Label text="symptoms" at={symptoms + 2} size={44} italic color={theme.muted} style={{ position: "absolute", left: 560, top: 410 }} />
      <div style={{ position: "absolute", left: 110, right: 110, top: 620, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
        {cards.map(([a, b], i) => {
          const t = pop(f, words[i] - 2, 14);
          return (
            <div key={i} style={{ border: `2px solid ${theme.accent}99`, borderRadius: 18, padding: "26px 26px", background: "#1A2338",
              opacity: f < words[i] - 2 ? 0 : t, transform: `scale(${0.8 + 0.2 * t})` }}>
              <div style={{ fontFamily: theme.fontMono, fontSize: 24, color: theme.accent }}>{`0${i + 1}`}</div>
              <div style={{ fontFamily: theme.fontDisplay, fontSize: 42, color: theme.fg, marginTop: 8 }}>{a}</div>
              <div style={{ fontFamily: theme.fontBody, fontSize: 30, color: theme.muted, marginTop: 4 }}>+ {b}</div>
            </div>
          );
        })}
      </div>
    </PanelBackdrop>
  );
};

/** S4: the readmission rates on one scale. */
const S4: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const ninety = usePanelAt("S4:Ninety");
  const low = usePanelAt("S4:thirty");
  const high = usePanelAt("S4:forty");
  const usual = usePanelAt("S4:thirty#1");
  const verdict = usePanelAt("S5:No");
  const X0 = 140, W = 800, LO = 30, HI = 50; // the axis shows 30% .. 50%, where the results differ
  const x = (pct: number) => X0 + ((pct - LO) / (HI - LO)) * W;
  const axis = progress(f, ninety, 16);
  const band = progress(f, low, 10);
  const bandHi = interpolate(f, [low, high + 6], [36.3, 44.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line = progress(f, usual - 2, 10);
  return (
    <PanelBackdrop>
      <Label text="Readmitted within 90 days" at={ninety} size={60} style={{ position: "absolute", left: 140, top: 200 }} />
      <div style={{ position: "absolute", left: X0, top: 760, width: W * axis, height: 3, background: theme.muted }} />
      {[30, 35, 40, 45, 50].map((p) => (
        <div key={p} style={{ position: "absolute", left: x(p) - 30, width: 60, top: 780, textAlign: "center", fontFamily: theme.fontMono, fontSize: 26,
          color: theme.muted, opacity: axis }}>{p}%</div>
      ))}
      {f >= low ? (
        <>
          <div style={{ position: "absolute", left: x(36.3), top: 470, width: (x(bandHi) - x(36.3)) * band, height: 110, borderRadius: 10, background: `${theme.accent}CC` }} />
          <div style={{ position: "absolute", left: x(36.3), top: 330, whiteSpace: "nowrap", fontFamily: theme.fontMono, fontSize: 30, color: theme.accent, opacity: band }}>
            WITH MONITORING
          </div>
          <div style={{ position: "absolute", left: x(36.3), top: 372, whiteSpace: "nowrap", fontFamily: theme.fontDisplay, fontSize: 64, color: theme.fg, opacity: band }}>
            36.3–{bandHi.toFixed(1)}%
          </div>
        </>
      ) : null}
      {f >= usual - 2 ? (
        <>
          <div style={{ position: "absolute", left: x(37.8) - 3, top: 440 + (1 - line) * 300, width: 6, height: 300 * line, background: GOLD, boxShadow: `0 0 18px ${GOLD}` }} />
          <div style={{ position: "absolute", left: x(37.8) - 420, top: 860, width: 400, textAlign: "right", whiteSpace: "nowrap", fontFamily: theme.fontMono, fontSize: 30, color: GOLD, opacity: line }}>
            USUAL FOLLOW-UP
          </div>
          <div style={{ position: "absolute", left: x(37.8) - 420, top: 902, width: 400, textAlign: "right", fontFamily: theme.fontDisplay, fontSize: 72, color: GOLD, opacity: line }}>
            37.8%
          </div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1080, display: "flex", justifyContent: "center" }}>
        <Stamp text="NO SIGNIFICANT DIFFERENCE" color={RED} at={verdict} size={50} rotate={-6} />
      </div>
    </PanelBackdrop>
  );
};

/** S5: the verdict, and the older patients. */
const S5: React.FC = () => {
  const { theme } = usePanel();
  const older = usePanelAt("S5:older");
  const more = usePanelAt("S5:more");
  return (
    <PanelBackdrop glow={RED}>
      <Abs x={140} y={640}><DrawIcon icon={TrendingUp} size={220} color={RED} at={older} duration={16} strokeWidth={1.6} /></Abs>
      <Label text="older patients" at={older + 2} size={62} style={{ position: "absolute", left: 410, top: 660 }} />
      <Label text="readmitted more often" at={more - 4} size={48} italic color={RED} style={{ position: "absolute", left: 410, top: 750 }} />
      <SketchCircle x={390} y={735} w={520} h={90} color={GOLD} at={more + 8} />
    </PanelBackdrop>
  );
};

/** S6: numbers stream out of the monitor; a person has to decide. */
const S6: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const numbers = usePanelAt("S6:numbers.");
  const someone = usePanelAt("S6:Someone");
  const decide = usePanelAt("S6:decide");
  const patient = usePanelAt("S6:patient.");
  const readings = ["SpO₂ 93", "HR 108", "BP 98/61", "Temp 37.9", "RR 22", "Pain 4/10"];
  return (
    <PanelBackdrop>
      <Abs x={110} y={300}><DrawIcon icon={Activity} size={200} color={theme.fg} at={0} duration={14} strokeWidth={1.4} /></Abs>
      <Label text="monitor" at={4} size={40} italic color={theme.muted} style={{ position: "absolute", left: 150, top: 520 }} />
      {readings.map((r, i) => {
        const start = numbers - 8 + i * 4;
        const t = progress(f, start, 30);
        return (
          <div key={r} style={{ position: "absolute", left: 360 + t * 300, top: 250 + i * 52, whiteSpace: "nowrap", fontFamily: theme.fontMono, fontSize: 34, color: theme.accent,
            opacity: f < start ? 0 : Math.min(1, t * 3) * (1 - progress(f, someone + 10, 12) * 0.6) }}>{r}</div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 590, textAlign: "center", fontFamily: theme.fontDisplay, fontSize: 200, color: GOLD,
        opacity: progress(f, someone, 8), transform: `scale(${0.6 + 0.4 * pop(f, someone, 10)})` }}>?</div>
      <Abs x={140} y={880}><DrawIcon icon={Stethoscope} size={220} color={theme.fg} at={decide - 4} duration={18} strokeWidth={1.2} /></Abs>
      <Label text="decides" at={decide} size={64} style={{ position: "absolute", left: 420, top: 930 }} />
      <Label text="for this patient" at={patient - 6} size={54} italic color={GOLD} style={{ position: "absolute", left: 420, top: 1020 }} />
    </PanelBackdrop>
  );
};

/** S7: the line to remember. */
const S7: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const isnt = usePanelAt("S7:isn't");
  const plan = usePanelAt("S7:plan");
  const strike = progress(f, isnt + 6, 10);
  return (
    <PanelBackdrop light="center">
      <div style={{ position: "absolute", left: 90, right: 90, top: 480, textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", fontFamily: theme.fontDisplay, fontSize: 104, color: theme.fg, opacity: progress(f, -2, 8) }}>
          More data
          <div style={{ position: "absolute", left: -10, top: "52%", width: `${(strike * 100) + 4}%`, height: 8, background: RED, opacity: strike > 0 ? 1 : 0 }} />
        </div>
        <div style={{ fontFamily: theme.fontDisplay, fontSize: 104, color: theme.muted, opacity: progress(f, isnt - 2, 8) }}>isn't more care.</div>
        <div style={{ fontFamily: theme.fontDisplay, fontStyle: "italic", fontSize: 150, color: GOLD, marginTop: 40, opacity: progress(f, plan - 4, 8),
          transform: `scale(${0.8 + 0.2 * pop(f, plan - 4, 12)})` }}>A plan is.</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1240, textAlign: "center", fontFamily: theme.fontMono, fontSize: 28, letterSpacing: "0.2em",
        color: theme.muted, opacity: progress(f, plan + 20, 12) }}>DOCX · CARE BETWEEN VISITS</div>
    </PanelBackdrop>
  );
};

const PANELS: Record<string, React.FC> = { S1, S2, S3, S4, S5, S6, S7 };

const at = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const sfx = (): SfxCue[] => [
  { at: 0, sound: "hum", volume: 0.14 },
  { at: 300, sound: "hum", volume: 0.12 },
  { at: 600, sound: "hum", volume: 0.12 },
  { at: 900, sound: "hum", volume: 0.12 },
  ...RANGES.slice(1).map((s) => ({ at: s.from, sound: "swoosh" as const, volume: 0.2 })),
  { at: at("S1", "home") - 4, sound: "whoosh", volume: 0.25 },
  { at: at("S1", "monitor,"), sound: "blip", volume: 0.3 },
  { at: at("S1", "fewer") - 2, sound: "whoosh", volume: 0.25 },
  { at: at("S1", "logic.") + 4, sound: "click", volume: 0.3 },
  { at: at("S2", "JAMA") - 4, sound: "thud", volume: 0.35 },
  { at: at("S2", "One"), sound: "particles", volume: 0.3 },
  { at: at("S2", "patients,") + 4, sound: "ding", volume: 0.25 },
  { at: at("S3", "Vitals") + 4, sound: "blip", volume: 0.3 },
  { at: at("S3", "symptoms,"), sound: "click", volume: 0.3 },
  ...["Four", "different", "monitoring", "strategies."].map((w) => ({ at: at("S3", w) - 2, sound: "pop" as const, volume: 0.25 })),
  { at: at("S4", "thirty"), sound: "rise", volume: 0.2 },
  { at: at("S4", "thirty", 1) - 2, sound: "ding", volume: 0.3 },
  { at: at("S4", "eight.") + 30, sound: "riser", volume: 0.22 },
  { at: at("S5", "No"), sound: "impact", volume: 0.42 },
  { at: at("S5", "older"), sound: "thud", volume: 0.35 },
  ...[0, 1, 2, 3, 4, 5].map((i) => ({ at: at("S6", "numbers.") - 8 + i * 4, sound: "tick" as const, volume: 0.15 })),
  { at: at("S6", "Someone"), sound: "pop", volume: 0.35 },
  { at: at("S6", "decide") - 4, sound: "whoosh", volume: 0.25 },
  { at: at("S7", "isn't") + 6, sound: "click", volume: 0.35 },
  { at: at("S7", "plan") - 4, sound: "shimmer", volume: 0.35 },
];

// Panel ranges follow the scenes, except that the chart (S4) stays up for the verdict and S5 starts on "And older".
const S5_FROM = wordFrame(TAKE, "S5", "And") - 3;
const RANGES = TAKE.scenes.map((s) => ({
  id: s.id,
  from: s.id === "S5" ? S5_FROM : s.from,
  to: s.id === "S4" ? S5_FROM : s.to,
}));

export const MonitorNotPlan: React.FC = () => (
  <AbsoluteFill style={{ background: THEME.bg }}>
    {RANGES.map((s) => {
      const Panel = PANELS[s.id];
      return (
        <Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from} name={s.id}>
          <PanelContext.Provider value={{ take: TAKE, from: s.from, width: 1080, height: 1920, theme: THEME }}>
            <Panel />
          </PanelContext.Provider>
        </Sequence>
      );
    })}
    <PopCaptions take={TAKE} font={THEME.fontBody} accent={GOLD} variant="band" y={1440} until={TAKE.scenes[6].from} />
    <VoiceOver take={TAKE} />
    <SfxTrack cues={sfx()} />
  </AbsoluteFill>
);

export const MONITOR_COVER = at("S5", "difference.") + 8;
