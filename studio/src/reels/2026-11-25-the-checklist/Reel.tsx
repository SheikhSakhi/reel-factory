import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, pop, progress, wordFrame } from "../../kit";
import { CinemaGrade } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-25-the-checklist/take.json";

// F7 animated flipped explainer, our own opening: the 1935 crash that gave aviation the pilot's checklist, flipped into
// care between visits. 1930s technical manual look: cream paper, sepia line drawings, typewriter labels, a red stamp;
// teal arrives with the flip. Narrator: ElevenLabs George. Ambient bed, no SFX. No product, no CTA.

const TAKE = loadTake(takeJson);
const TAIL = 55;
export const CHECKLIST_DURATION = TAKE.totalFrames + TAIL;
type Word = { token: string; frame: number; endFrame: number };
type Line = { id: string; from: number; to: number; words: Word[] };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
const L = (id: string) => LINES.find((l) => l.id === id)!;
const W = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const PAPER = "#F1E8D6";
const SEPIA = "#3B2A1C";
const FADED = "#3B2A1C55";
const RED = "#B3362A";
const TEAL = "#1F8A7E";
const SERIF = BRAND.theme.fontDisplay;
const MONO = BRAND.theme.fontMono;
const SANS = BRAND.theme.fontBody;

const Sheet: React.FC<{ children: React.ReactNode; from: number; push?: number }> = ({ children, from, push = 0.04 }) => {
  const f = useCurrentFrame();
  const s = 1 + Math.min(1, (f - from) / 150) * push;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: "50% 45%" }}>
      <defs>
        <filter id="pen"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={2} result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale={2.2} /></filter>
      </defs>
      {/* manual page frame and grid */}
      <rect x={60} y={150} width={960} height={1620} fill="none" stroke={FADED} strokeWidth={3} />
      {Array.from({ length: 16 }).map((_, i) => <line key={i} x1={60} y1={150 + i * 108} x2={1020} y2={150 + i * 108} stroke="#3B2A1C10" strokeWidth={2} />)}
      <g filter="url(#pen)">{children}</g>
    </svg>
  );
};

const Type: React.FC<{ x: number; y: number; at: number; size?: number; color?: string; anchor?: "start" | "middle" | "end"; children: string }> = ({ x, y, at, size = 34, color = SEPIA, anchor = "start", children }) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(children.length, Math.round((f - at) * 1.6)));
  return <text x={x} y={y} textAnchor={anchor} fontFamily={MONO} fontSize={size} fill={color}>{children.slice(0, n)}</text>;
};

const Stamp: React.FC<{ x: number; y: number; at: number; text: string; color?: string; r?: number }> = ({ x, y, at, text, color = RED, r = -8 }) => {
  const f = useCurrentFrame();
  const p = pop(f, at, 10);
  if (f < at) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${1.4 - 0.4 * Math.min(1, p)})`} opacity={Math.min(1, p * 1.5) * 0.9}>
      <rect x={-text.length * 15 - 30} y={-46} width={text.length * 30 + 60} height={92} rx={8} fill="none" stroke={color} strokeWidth={7} />
      <text x={0} y={18} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={50} fill={color}>{text}</text>
    </g>
  );
};

/** A 1930s four-engine monoplane in side view, line drawing. */
const Plane: React.FC<{ x: number; y: number; s?: number; r?: number; color?: string }> = ({ x, y, s = 1, r = 0, color = SEPIA }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
    <path d="M -300 0 Q -290 -34 -220 -38 L 180 -40 Q 250 -40 290 -10 Q 300 6 270 14 L -260 18 Q -300 16 -300 0 Z" fill={PAPER} />
    <path d="M -230 -36 L -280 -120 L -240 -122 L -170 -38" fill={PAPER} />
    <path d="M -60 4 L -180 90 L -120 92 L 40 6" />
    <path d="M -40 -38 L -150 -140 L -90 -142 L 40 -40" />
    {[-130, -60].map((ex) => <ellipse key={ex} cx={ex} cy={50} rx={26} ry={12} fill={PAPER} />)}
    <path d="M 200 -36 Q 240 -60 270 -24" />
    {Array.from({ length: 7 }).map((_, i) => <line key={i} x1={-150 + i * 46} y1={-20} x2={-130 + i * 46} y2={-20} strokeWidth={3} />)}
  </g>
);

const Check: React.FC<{ x: number; y: number; at: number; label: string; done?: boolean; color?: string; size?: number }> = ({ x, y, at, label, done = true, color = SEPIA, size = 38 }) => {
  const f = useCurrentFrame();
  const show = progress(f, at, 8);
  const tick = progress(f, at + 8, 10);
  return (
    <g opacity={show}>
      <rect x={x} y={y - 34} width={44} height={44} fill="none" stroke={color} strokeWidth={4} />
      {done ? <path d={`M ${x + 8} ${y - 12} L ${x + 20} ${y} L ${x + 40} ${y - 30}`} fill="none" stroke={RED} strokeWidth={7} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} /> : null}
      <text x={x + 70} y={y} fontFamily={MONO} fontSize={size} fill={color}>{label}</text>
    </g>
  );
};

type Shot = { from: number; render: (f: number) => React.ReactNode };
const S = (id: string) => L(id).from;

const SHOTS: Shot[] = [
  // S1 1935: the plane takes off, then the trajectory breaks
  { from: 0, render: (f) => {
    const crash = W("S1", "crashed");
    const fly = Math.min(1, f / 90);
    const fall = progress(f, crash - 2, 24);
    return (
      <Sheet from={0} push={0.05}>
        <Type x={120} y={260} at={2} size={40}>WRIGHT FIELD · 30 OCT 1935</Type>
        <path d="M 100 1260 L 980 1260" stroke={SEPIA} strokeWidth={4} />
        <path d={`M 160 1250 Q 420 1220 560 1040 Q 640 ${940 + fall * 60} 700 ${1000 + fall * 250}`} fill="none" stroke={FADED} strokeWidth={4} strokeDasharray="14 12" />
        <Plane x={200 + fly * 360 + fall * 120} y={1220 - fly * 200 + fall * 240} s={0.75} r={-12 * fly + fall * 40} />
        {fall > 0.6 ? <path d="M 760 1250 Q 740 1140 800 1080 Q 760 1020 820 960 Q 790 900 850 850" fill="none" stroke={FADED} strokeWidth={14} opacity={(fall - 0.6) / 0.4} /> : null}
        <text x={540} y={560} textAnchor="middle" fontFamily={SERIF} fontSize={74} fill={SEPIA} opacity={progress(f, W("S1", "most") - 3, 10)}>the most advanced</text>
        <text x={540} y={650} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={74} fill={SEPIA} opacity={progress(f, W("S1", "airplane") - 3, 10)}>airplane in the world</text>
      </Sheet>
    );
  } },
  // S2 nothing was broken: the inspection report
  { from: S("S2"), render: (f) => (
    <Sheet from={S("S2")}>
      <Type x={140} y={300} at={S("S2")} size={44}>INSPECTION REPORT</Type>
      <line x1={140} y1={330} x2={940} y2={330} stroke={SEPIA} strokeWidth={3} />
      <Check x={160} y={480} at={W("S2", "nothing") - 2} label="ENGINES ......... OK" />
      <Check x={160} y={580} at={W("S2", "nothing") + 6} label="AIRFRAME ........ OK" />
      <Check x={160} y={680} at={W("S2", "broken") - 2} label="INSTRUMENTS ..... OK" />
      <Check x={160} y={820} at={W("S2", "pilot") - 4} label="PILOT: experienced" />
      <Stamp x={700} y={1180} at={W("S2", "broken")} text="NO FAULT FOUND" />
    </Sheet>
  ) },
  // S3 the controls were still locked
  { from: S("S3"), render: (f) => {
    const lock = W("S3", "locked");
    return (
      <Sheet from={S("S3")} push={0.06}>
        <Type x={140} y={300} at={S("S3")} size={40}>FIG. 7 · CONTROL GUST LOCK</Type>
        <g transform="translate(540 900)" fill="none" stroke={SEPIA} strokeWidth={6}>
          <rect x={-260} y={-60} width={520} height={120} rx={20} fill={PAPER} />
          <path d="M -200 0 L 200 0" strokeWidth={4} strokeDasharray="10 10" />
          <rect x={-40} y={-200} width={80} height={180} rx={10} fill={PAPER} />
          <circle cx={0} cy={-210} r={40} fill={PAPER} />
        </g>
        <circle cx={540} cy={800} r={170} fill="none" stroke={RED} strokeWidth={8} opacity={progress(f, lock - 2, 8)} />
        <Stamp x={540} y={1210} at={lock} text="STILL LOCKED" r={-4} />
        <text x={540} y={1420} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={60} fill={SEPIA} opacity={progress(f, W("S3", "one") - 3, 10)}>one forgotten step</text>
      </Sheet>
    );
  } },
  // S4 they wrote it down: the first checklist, then the B-17
  { from: S("S4"), render: (f) => {
    const born = W("S4", "checklist");
    const b17 = W("S4", "became");
    return (
      <Sheet from={S("S4")}>
        <Type x={140} y={300} at={W("S4", "wrote") - 4} size={44}>PILOT'S CHECKLIST</Type>
        <line x1={140} y1={330} x2={940} y2={330} stroke={SEPIA} strokeWidth={3} />
        {["FUEL", "FLAPS", "TRIM", "CONTROLS UNLOCKED", "BRAKES"].map((t, i) => (
          <Check key={t} x={160} y={460 + i * 100} at={born - 6 + i * 5} label={t} color={i === 3 ? RED : SEPIA} />
        ))}
        <g opacity={progress(f, b17 - 4, 12)}>
          <Plane x={540} y={1300} s={0.9} r={-6} />
          <Type x={540} y={1480} at={b17} size={56} anchor="middle">B-17</Type>
        </g>
      </Sheet>
    );
  } },
  // S5 memory becomes a risk
  { from: S("S5"), render: (f) => (
    <Sheet from={S("S5")} push={0.05}>
      <text x={540} y={800} textAnchor="middle" fontFamily={SERIF} fontSize={120} fill={SEPIA} opacity={progress(f, W("S5", "memory") - 3, 10)}>memory</text>
      <path d="M 540 860 L 540 980 M 500 940 L 540 990 L 580 940" fill="none" stroke={SEPIA} strokeWidth={6} opacity={progress(f, W("S5", "becomes") - 6, 8)} />
      <Stamp x={540} y={1120} at={W("S5", "risk") - 2} text="RISK" r={-6} />
      <text x={540} y={1360} textAnchor="middle" fontFamily={MONO} fontSize={34} fill={FADED} opacity={progress(f, W("S5", "complex") - 3, 10)}>when work gets complex enough</text>
    </Sheet>
  ) },
  // S6 the flip: the checklist page becomes a patient's file; teal arrives
  { from: S("S6"), render: (f) => {
    const flip = progress(f, W("S6", "medicine") - 2, 16);
    return (
      <Sheet from={S("S6")}>
        <Type x={140} y={300} at={S("S6")} size={44} color={TEAL}>PATIENT FILE</Type>
        <line x1={140} y1={330} x2={940} y2={330} stroke={TEAL} strokeWidth={3} opacity={flip} />
        {["Diagnosis", "Medicines", "Readings", "Results", "Next visit"].map((t, i) => (
          <g key={t} opacity={flip}>
            <rect x={160} y={426 + i * 100} width={44} height={44} fill="none" stroke={TEAL} strokeWidth={4} />
            <text x={230} y={460 + i * 100} fontFamily={MONO} fontSize={38} fill={SEPIA}>{t}</text>
          </g>
        ))}
        <g opacity={progress(f, W("S6", "between") - 3, 10)}>
          <text x={540} y={1180} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={70} fill={TEAL}>especially between visits</text>
        </g>
      </Sheet>
    );
  } },
  // S7 surgeons proved it: the surgical checklist study
  { from: S("S7"), render: (f) => {
    const from = W("S7", "from");
    const under = W("S7", "under");
    return (
      <Sheet from={S("S7")}>
        <Type x={140} y={300} at={S("S7")} size={36}>HAYNES ET AL. · NEJM · 2009</Type>
        <Type x={140} y={350} at={S("S7") + 10} size={28} color={FADED}>8 HOSPITALS · 7,688 PATIENTS</Type>
        <Type x={140} y={480} at={W("S7", "one-page") - 4} size={40}>SURGICAL SAFETY CHECKLIST</Type>
        <rect x={260} y={1200 - 150 * progress(f, from - 4, 12)} width={180} height={150 * progress(f, from - 4, 12)} fill="none" stroke={SEPIA} strokeWidth={6} />
        <rect x={640} y={1200 - 80 * progress(f, under - 4, 12)} width={180} height={80 * progress(f, under - 4, 12)} fill={TEAL} opacity={0.85} />
        <line x1={200} y1={1200} x2={880} y2={1200} stroke={SEPIA} strokeWidth={4} />
        <text x={350} y={1010} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={60} fill={SEPIA} opacity={progress(f, from, 8)}>1.5%</text>
        <text x={730} y={1080} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={60} fill={TEAL} opacity={progress(f, under, 8)}>0.8%</text>
        <text x={350} y={1260} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={SEPIA}>before</text>
        <text x={730} y={1260} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={SEPIA}>after</text>
        <text x={540} y={1400} textAnchor="middle" fontFamily={MONO} fontSize={30} fill={FADED} opacity={progress(f, W("S7", "deaths") - 3, 10)}>deaths after surgery</text>
      </Sheet>
    );
  } },
  // S8 imagine that for the months between visits
  { from: S("S8"), render: (f) => {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];
    const next = W("S8", "next");
    return (
      <Sheet from={S("S8")} push={0.03}>
        <Type x={140} y={300} at={S("S8")} size={40} color={TEAL}>BETWEEN VISITS</Type>
        {months.map((m, i) => (
          <g key={m} opacity={progress(f, W("S8", "months") - 4 + i * 3, 8)}>
            <rect x={140 + (i % 3) * 270} y={440 + Math.floor(i / 3) * 330} width={230} height={280} fill="none" stroke={SEPIA} strokeWidth={4} />
            <text x={160 + (i % 3) * 270} y={490 + Math.floor(i / 3) * 330} fontFamily={MONO} fontSize={30} fill={SEPIA}>{m}</text>
            {[0, 1, 2].map((k) => (
              <rect key={k} x={170 + (i % 3) * 270} y={530 + Math.floor(i / 3) * 330 + k * 56} width={34} height={34} fill="none" stroke={TEAL} strokeWidth={3}
                opacity={progress(f, next - 4 + i * 2 + k, 6)} />
            ))}
          </g>
        ))}
        <text x={540} y={1280} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={58} fill={SEPIA} opacity={progress(f, W("S8", "reliable") - 4, 10)}>more reliable than memory</text>
      </Sheet>
    );
  } },
  // S9 the answer: a written plan
  { from: S("S9"), render: (f) => (
    <Sheet from={S("S9")}>
      <Type x={140} y={300} at={S("S9")} size={44} color={TEAL}>PLAN · ONE PATIENT</Type>
      <line x1={140} y1={330} x2={940} y2={330} stroke={TEAL} strokeWidth={3} />
      <Check x={160} y={520} at={W("S9", "check") - 6} label="WHAT TO CHECK" color={TEAL} size={44} />
      <Check x={160} y={680} at={W("S9", "act") - 6} label="WHEN TO ACT" color={TEAL} size={44} />
      <Check x={160} y={840} at={W("S9", "call") - 6} label="WHO TO CALL" color={TEAL} size={44} />
    </Sheet>
  ) },
  // S10 the mirror: the pilot's list and the doctor's
  { from: S("S10"), render: (f) => (
    <Sheet from={S("S10")} push={0.06}>
      <g opacity={progress(f, S("S10"), 12)}><Plane x={540} y={560} s={0.7} r={-4} /></g>
      <text x={540} y={900} textAnchor="middle" fontFamily={SERIF} fontSize={66} fill={SEPIA} opacity={progress(f, W("S10", "needed") - 3, 10)}>He needed a list.</text>
      <text x={540} y={1060} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={84} fill={TEAL} opacity={progress(f, W("S10", "doctor") - 6, 12)}>So does the best doctor.</text>
    </Sheet>
  ) },
];

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const line = LINES.find((l) => f >= l.from && f < l.to);
  if (!line || line.id === "S10") return null;
  const ws = line.words;
  const i = ws.findIndex((w, k) => f >= w.frame - 2 && f < (ws[k + 1]?.frame ?? line.to) - 2);
  if (i < 0) return null;
  const chunks: number[][] = [];
  let cur: number[] = [];
  ws.forEach((w, k) => { cur.push(k); if (cur.length === 4 || /[.,?]$/.test(w.token)) { chunks.push(cur); cur = []; } });
  if (cur.length) chunks.push(cur);
  const chunk = chunks.find((c) => c.includes(i))!;
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 1650, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 44, color: SEPIA }}>
      {chunk.map((k) => <span key={k} style={{ opacity: k <= i ? 1 : 0.35 }}>{ws[k].token} </span>)}
    </div>
  );
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.16 : 0.28) * Math.min(1, f / 20) * Math.min(1, (CHECKLIST_DURATION - f) / 30);
};

export const TheChecklist: React.FC = () => {
  const f = useCurrentFrame();
  const shot = [...SHOTS].reverse().find((s) => f >= s.from) ?? SHOTS[0];
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <AbsoluteFill>{shot.render(f)}</AbsoluteFill>
      <Captions />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 110% 80% at 50% 45%, transparent 55%, #6B4A2A44 100%)", mixBlendMode: "multiply" }} />
      <CinemaGrade grain={0.16} vignette={0.2} glow="#FFF2D8" />
      <AbsoluteFill style={{ background: PAPER, opacity: progress(f, CHECKLIST_DURATION - 24, 22) }} />
      <VoiceOver take={TAKE} volume={1.25} />
      <Audio src={staticFile("music/2026-11-25-the-checklist.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const CHECKLIST_COVER = W("S3", "locked") + 12;
