import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, progress, wordFrame } from "../../kit";
import { CinemaGrade } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-13-as-below-so-above/take.json";

// New genre test (user, 2026-11-13): the animated FLIPPED explainer. It opens on a general, attention-catching idea
// (the old maxim "as above, so below"), builds it, then flips at the line where it maps onto care ("a cluttered desk is
// a cluttered mind" -> "a cluttered treatment plan is a cluttered life") and continues as medical narration, closing on
// the opening line. Dark minimal line art: two mirrored frames whose labels change; the flip brings the first colour.
// Calm low narrator, night ambient bed, no sound effects. No product, no CTA.

const TAKE = loadTake(takeJson);
const TAIL = 60;
export const ABOVE_DURATION = TAKE.totalFrames + TAIL;
type Word = { token: string; frame: number; endFrame: number };
type Line = { id: string; from: number; to: number; words: Word[] };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
const L = (id: string) => LINES.find((l) => l.id === id)!;
const W = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const BG = "#0A0B10";
const LINE = "#E9E6DF";
const DIM = "#E9E6DF55";
const TEAL = "#4FD1BE";
const SERIF = BRAND.theme.fontDisplay;

const FRAME = 400;
const TOP = { x: 540, y: 600 };
const BOT = { x: 540, y: 1080 };

const rand = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

// ---------- the clutter: strokes that fall into order ----------

type Pose = { x: number; y: number; r: number; len: number };
const chaos = (n: number, seed: number): Pose[] => {
  const r = rand(seed);
  return Array.from({ length: n }).map(() => ({ x: (r() - 0.5) * 300, y: (r() - 0.5) * 300, r: r() * 180, len: 40 + r() * 70 }));
};
const order = (n: number): Pose[] => Array.from({ length: n }).map((_, i) => ({ x: -110 + (i % 2) * 120 + 60, y: -140 + Math.floor(i / 2) * 44, r: 0, len: 100 }));
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, r: a.r + (b.r - a.r) * t, len: a.len + (b.len - a.len) * t });

const Strokes: React.FC<{ seed: number; t: number; color?: string; jitter?: number; frame: number; n?: number }> = ({ seed, t, color = LINE, jitter = 0, frame, n = 14 }) => {
  const c = chaos(n, seed), o = order(n);
  return (
    <g>
      {c.map((p, i) => {
        const q = lerpPose(p, o[i], t);
        const j = jitter * Math.sin(frame / 2.3 + i * 1.7) * 6;
        return <line key={i} x1={q.x - q.len / 2} y1={q.y + j} x2={q.x + q.len / 2} y2={q.y - j} stroke={color} strokeWidth={3.5} strokeLinecap="round"
          transform={`rotate(${q.r} ${q.x} ${q.y})`} />;
      })}
    </g>
  );
};

// ---------- the medical clutter (below, after the flip) ----------

const Pill: React.FC<{ x: number; y: number; r: number; c?: string }> = ({ x, y, r, c = LINE }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-26} y={-11} width={52} height={22} rx={11} fill="none" stroke={c} strokeWidth={3} />
    <line x1={0} y1={-11} x2={0} y2={11} stroke={c} strokeWidth={3} />
  </g>
);
const DocTag: React.FC<{ x: number; y: number; r: number; c?: string }> = ({ x, y, r, c = LINE }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-30} y={-22} width={60} height={44} rx={8} fill="none" stroke={c} strokeWidth={3} />
    <path d="M -8 0 L 8 0 M 0 -8 L 0 8" stroke={c} strokeWidth={3} />
  </g>
);
const ListDoc: React.FC<{ x: number; y: number; r: number; rows?: number; c?: string; mark?: number }> = ({ x, y, r, rows = 4, c = LINE, mark = -1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-45} y={-60} width={90} height={120} rx={6} fill="none" stroke={c} strokeWidth={3} />
    {Array.from({ length: rows }).map((_, i) => <line key={i} x1={-30} y1={-36 + i * 22} x2={i === mark ? 10 : 30} y2={-36 + i * 22} stroke={i === mark ? TEAL : c} strokeWidth={3} />)}
  </g>
);
const Envelope: React.FC<{ x: number; y: number; r: number; c?: string }> = ({ x, y, r, c = LINE }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-40} y={-26} width={80} height={52} rx={4} fill="none" stroke={c} strokeWidth={3} />
    <path d="M -40 -26 L 0 4 L 40 -26" fill="none" stroke={c} strokeWidth={3} />
  </g>
);

/** The patient's plan below: clutter (t=0) to one list, one doctor, one next date (t=1). */
const PlanBelow: React.FC<{ f: number }> = ({ f }) => {
  const s8 = (w: string) => progress(f, W("S9", w) - 3, 8);
  const ordered = (w: string) => progress(f, W("S12", w) - 4, 22);
  const tList = ordered("list"), tDoc = ordered("doctor"), tDate = ordered("next");
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  return (
    <g>
      {/* three doctors -> one doctor */}
      {[[-120, -110, -18], [110, -120, 24], [-20, 120, -8]].map(([x, y, r], i) => (
        <g key={`d${i}`} opacity={s8("doctors") * (i === 0 ? 1 : 1 - tDoc)}>
          <DocTag x={i === 0 ? mix(x, 110, tDoc) : x} y={i === 0 ? mix(y, -120, tDoc) : y} r={i === 0 ? mix(r, 0, tDoc) : r} c={i === 0 && tDoc > 0.5 ? TEAL : LINE} />
        </g>
      ))}
      {/* five pills -> into the list */}
      {[[-60, -40, 30], [40, -20, -50], [120, 40, 80], [-130, 40, 10], [60, 120, -20]].map(([x, y, r], i) => (
        <g key={`p${i}`} opacity={s8("pills") * (1 - tList)}><Pill x={x} y={y} r={r} /></g>
      ))}
      {/* two lists that don't agree -> one list */}
      <g opacity={s8("lists")}>
        <ListDoc x={mix(-60, -60, tList)} y={mix(30, 10, tList)} r={mix(-14, 0, tList)} rows={tList > 0.5 ? 5 : 4} c={tList > 0.5 ? TEAL : LINE} />
        <g opacity={1 - tList}><ListDoc x={70} y={60} r={16} rows={4} mark={2} /></g>
      </g>
      {/* a result nobody read */}
      <g opacity={s8("result") * (1 - tList)}><Envelope x={-110} y={130} r={-24} /></g>
      {/* the next step, with a date */}
      <g opacity={tDate}>
        <rect x={20} y={70} width={150} height={60} rx={10} fill="none" stroke={TEAL} strokeWidth={3} />
        <text x={95} y={108} textAnchor="middle" fontFamily={SERIF} fontSize={26} fill={TEAL}>next · 4 Dec</text>
      </g>
    </g>
  );
};

// ---------- the two mirrored frames ----------

type Stage = { from: number; top: (f: number) => React.ReactNode; bot: (f: number) => React.ReactNode; labels: [string, string] };

const Stars: React.FC<{ seed: number; f: number; tiny?: boolean }> = ({ seed, f, tiny }) => {
  const r = rand(seed);
  return (
    <g>
      {Array.from({ length: 26 }).map((_, i) => {
        const x = (r() - 0.5) * 340, y = (r() - 0.5) * 340, s = tiny ? 1.6 + r() * 1.4 : 2 + r() * 3.5;
        return <circle key={i} cx={x} cy={y} r={s} fill={LINE} opacity={0.4 + 0.6 * Math.abs(Math.sin(f / 20 + i))} />;
      })}
    </g>
  );
};

const Within: React.FC<{ big?: boolean }> = ({ big }) => (
  <g>{(big ? [150, 110, 70, 30] : [60, 30]).map((r) => <circle key={r} cx={0} cy={0} r={r} fill="none" stroke={LINE} strokeWidth={2.5} opacity={Math.min(1, 0.4 + 30 / r)} />)}
    <circle cx={0} cy={0} r={6} fill={LINE} /></g>
);
const Orbit: React.FC<{ f: number }> = ({ f }) => (
  <g><ellipse cx={0} cy={0} rx={150} ry={60} fill="none" stroke={DIM} strokeWidth={2.5} />
    <circle cx={0} cy={0} r={26} fill="none" stroke={LINE} strokeWidth={3} />
    <circle cx={Math.cos(f / 22) * 150} cy={Math.sin(f / 22) * 60} r={10} fill={LINE} /></g>
);
const Drop: React.FC<{ f: number }> = ({ f }) => (
  <g><path d="M -150 60 Q -20 -150 150 -40 Q 20 120 -150 60 Z" fill="none" stroke={LINE} strokeWidth={3} />
    <path d="M -150 60 Q 0 0 150 -40" fill="none" stroke={DIM} strokeWidth={2} />
    <path d={`M 10 ${-10 + Math.sin(f / 18) * 2} q 16 26 0 38 q -16 -12 0 -38 Z`} fill="none" stroke={LINE} strokeWidth={3} /></g>
);

const STAGES: Stage[] = [
  { from: 0, labels: ["above", "below"], top: (f) => <Stars seed={3} f={f} />, bot: (f) => <Stars seed={3} f={f + 30} tiny /> },
  { from: L("S3").from, labels: ["a star", "dust"], top: (f) => <Stars seed={7} f={f} />, bot: (f) => <Stars seed={7} f={f + 30} tiny /> },
  { from: L("S4").from, labels: ["a kingdom", "a house"], top: () => (
    <g>{[-120, -40, 40, 120].map((x) => <line key={x} x1={x} y1={-160} x2={x} y2={160} stroke={LINE} strokeWidth={2.5} />)}
      {[-120, -40, 40, 120].map((y) => <line key={y} x1={-160} y1={y} x2={160} y2={y} stroke={LINE} strokeWidth={2.5} />)}</g>
  ), bot: () => (
    <g><path d="M -110 40 L -110 140 L 110 140 L 110 40 L 0 -60 Z" fill="none" stroke={LINE} strokeWidth={3} />
      <rect x={-20} y={80} width={40} height={60} fill="none" stroke={LINE} strokeWidth={3} />
      <circle cx={-55} cy={70} r={12} fill={LINE} opacity={0.8} /></g>
  ) },
  { from: L("S5").from, labels: ["the large", "the small"], top: (f) => <Orbit f={f} />, bot: (f) => <Drop f={f} /> },
  { from: L("S6").from, labels: ["the small", "within"], top: (f) => <Drop f={f} />, bot: () => <Within big /> },
  { from: L("S7").from, labels: ["mind", "desk"], top: (f) => <Strokes seed={11} t={0} frame={f} />, bot: (f) => <Strokes seed={11} t={0} frame={f} /> },
  // the flip: below becomes the plan, above becomes the life; the first colour arrives
  { from: W("S8", "treatment") - 4, labels: ["life", "plan"], top: (f) => {
    const settle = progress(f, L("S13").from + 30, L("S13").to - L("S13").from);
    const worry = f >= L("S10").from && f < L("S11").from ? 1 : 0.25;
    return (
      <g>
        <Strokes seed={11} t={settle} frame={f} jitter={worry * (1 - settle)} color={settle > 0.6 ? TEAL : LINE} />
        {f >= W("S10", "midnight") - 4 && f < L("S11").to ? (
          <path d="M 120 -150 A 40 40 0 1 0 150 -100 A 30 30 0 1 1 120 -150 Z" fill={LINE} opacity={progress(f, W("S10", "midnight") - 4, 8)} />
        ) : null}
      </g>
    );
  }, bot: (f) => (f < L("S9").from ? <Strokes seed={11} t={0} frame={f} color={TEAL} /> : <PlanBelow f={f} />) },
];

const stageAt = (f: number) => [...STAGES].reverse().find((s) => f >= s.from) ?? STAGES[0];

/** A hand drawn in line, reaching into the lower frame while the plan is put in order. */
const Hand: React.FC<{ f: number }> = ({ f }) => {
  const a = W("S11", "put") - 6, b = L("S12").to;
  if (f < a || f > b + 10) return null;
  const inn = progress(f, a, 18) - progress(f, b - 10, 18);
  const x = 980 - inn * 260;
  return (
    <g transform={`translate(${x} ${BOT.y + 40 + Math.sin(f / 9) * 4})`} opacity={inn}>
      <path d="M 0 0 L -60 -8 Q -84 -10 -82 4 Q -80 14 -60 14 L -40 16 M -48 14 Q -70 22 -64 34 Q -58 42 -40 36 L 0 30 M 0 -12 L 300 -30 M 0 40 L 300 50"
        fill="none" stroke={LINE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

const Frames: React.FC = () => {
  const f = useCurrentFrame();
  const st = stageAt(f);
  const idx = STAGES.indexOf(st);
  const fadeIn = idx === 0 ? progress(f, 0, 12) : progress(f, st.from, 12);
  const flip = progress(f, W("S8", "treatment") - 4, 16);
  const done = progress(f, L("S14").from, 20);
  const frameColor = (above: boolean) => (above ? (done > 0 ? TEAL : LINE) : flip > 0 ? TEAL : LINE);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {/* the mirror line */}
      <line x1={80} y1={(TOP.y + BOT.y) / 2} x2={1000} y2={(TOP.y + BOT.y) / 2} stroke={DIM} strokeWidth={1.5} />
      {[TOP, BOT].map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y})`}>
          <rect x={-FRAME / 2} y={-FRAME / 2} width={FRAME} height={FRAME} fill="none" stroke={frameColor(i === 0)} strokeWidth={2.5}
            style={{ filter: (i === 1 && flip > 0) || (i === 0 && done > 0) ? `drop-shadow(0 0 10px ${TEAL}88)` : "none" }} />
          <g opacity={fadeIn}>{i === 0 ? st.top(f) : st.bot(f)}</g>
          <text x={-FRAME / 2 - 24} y={8} textAnchor="end" fontFamily={SERIF} fontSize={34} fill={i === 1 && flip > 0 ? TEAL : LINE} opacity={0.85 * fadeIn}>
            {st.labels[i]}
          </text>
        </g>
      ))}
      <Hand f={f} />
    </svg>
  );
};

// ---------- the words ----------

/** Serif narration under the frames, revealed word by word (the spoken word bright, the rest of the line dim). */
const Narration: React.FC = () => {
  const f = useCurrentFrame();
  const line = LINES.find((l) => f >= l.from && f < l.to);
  if (!line) return null;
  const ws = line.words;
  // show the current sentence of the line
  const sentences: Word[][] = [];
  let cur: Word[] = [];
  ws.forEach((w) => { cur.push(w); if (/[.?!]$/.test(w.token)) { sentences.push(cur); cur = []; } });
  if (cur.length) sentences.push(cur);
  const sent = [...sentences].reverse().find((s) => f >= s[0].frame - 3) ?? sentences[0];
  const flipLine = line.id === "S8";
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 1420, textAlign: "center", fontFamily: SERIF, fontSize: 52, lineHeight: 1.25 }}>
      {sent.map((w, k) => (
        <span key={`${w.frame}-${k}`} style={{ color: f >= w.frame - 2 ? (flipLine && k >= 2 && k <= 6 ? TEAL : LINE) : "#E9E6DF22", transition: "none" }}>{w.token} </span>
      ))}
    </div>
  );
};

const Header: React.FC = () => {
  const f = useCurrentFrame();
  const show = progress(f, L("S2").from, 20);
  const glow = progress(f, L("S14").from, 20);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 36, lineHeight: 1.3,
      color: glow > 0 ? TEAL : "#E9E6DF99", opacity: show }}>
      As above, so below.<br />As below, so above.
    </div>
  );
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.17 : 0.3) * Math.min(1, f / 30) * Math.min(1, (ABOVE_DURATION - f) / 40);
};

export const AsBelowSoAbove: React.FC = () => {
  const f = useCurrentFrame();
  const drift = interpolate(f, [0, ABOVE_DURATION], [1, 1.04]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #0D0F16 0%, ${BG} 60%, #07080B 100%)` }}>
      <AbsoluteFill style={{ transform: `scale(${drift})`, transformOrigin: "50% 45%" }}>
        <Header />
        <Frames />
      </AbsoluteFill>
      <Narration />
      <CinemaGrade grain={0.07} vignette={0.5} glow="#1A2A2A" />
      <AbsoluteFill style={{ background: "#000", opacity: progress(f, ABOVE_DURATION - 26, 24) }} />
      <VoiceOver take={TAKE} volume={1.25} />
      <Audio src={staticFile("music/2026-11-13-as-below-so-above.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const ABOVE_COVER = W("S8", "life") + 10;
