import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, progress, wordFrame } from "../../kit";
import { CinemaGrade } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-11-the-lighthouse/take.json";

// Formats lab F2 (faceless parable), second run: sumi-e ink wash on rice paper, the lighthouse beam in gold as the only
// colour, one red seal. A young doctor and an old lighthouse keeper; the metaphor object is the light. Two calm voices,
// a night ambient bed, no sound effects. The ending answers concretely. No CTA.

const TAKE = loadTake(takeJson);
const TAIL = 54;
export const LIGHTHOUSE_DURATION = TAKE.totalFrames + TAIL;
type Word = { token: string; frame: number; endFrame: number };
type Line = { id: string; speaker: string; from: number; to: number; words: Word[] };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
const L = (id: string) => LINES.find((l) => l.id === id)!;
const W = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const PAPER = "#EEE6D4";
const INK = "#1E1D1C";
const GOLD = "#E9B24C";
const RED = "#B8322A";
const SANS = BRAND.theme.fontBody;
const SERIF = BRAND.theme.fontDisplay;

// ---------- ink tools ----------

const InkDefs: React.FC = () => (
  <defs>
    <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={4} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={9} />
      <feGaussianBlur stdDeviation={0.8} />
    </filter>
    <filter id="wash" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={4} seed={9} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={40} result="d" />
      <feGaussianBlur in="d" stdDeviation={10} />
    </filter>
    <filter id="dry" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={2} result="g" />
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.6" result="mask" />
      <feComposite in="SourceGraphic" in2="mask" operator="in" />
    </filter>
    <radialGradient id="glow"><stop offset="0" stopColor={GOLD} stopOpacity={0.95} /><stop offset="0.3" stopColor={GOLD} stopOpacity={0.45} /><stop offset="1" stopColor={GOLD} stopOpacity={0} /></radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={GOLD} stopOpacity={0.75} /><stop offset="1" stopColor={GOLD} stopOpacity={0} /></linearGradient>
  </defs>
);

/** A scene on rice paper with a slow push-in; `night` darkens the sky with an ink wash. */
const Scroll: React.FC<{ children: React.ReactNode; from: number; night?: number; push?: number; origin?: string }> = ({ children, from, night = 0.75, push = 0.06, origin = "50% 45%" }) => {
  const f = useCurrentFrame();
  const s = 1 + Math.min(1, (f - from) / 150) * push;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: origin }}>
      <InkDefs />
      <rect x={-50} y={-50} width={1180} height={2020} fill={PAPER} />
      {night > 0 ? <path d="M -100 -100 L 1180 -100 L 1180 1500 L -100 1500 Z" fill={INK} opacity={night * 0.6} filter="url(#wash)" /> : null}
      {children}
    </svg>
  );
};

const Sea: React.FC<{ frame: number; y: number; rough?: number; dark?: number }> = ({ frame, y, rough = 0.2, dark = 0.55 }) => (
  <g>
    <rect x={-50} y={y} width={1180} height={1920 - y + 50} fill={INK} opacity={dark * 0.55} filter="url(#wash)" />
    {Array.from({ length: 9 }).map((_, i) => {
      const yy = y + 40 + i * 110;
      const amp = 8 + rough * 70 * (0.5 + 0.5 * Math.sin(i));
      const ph = frame / (18 - rough * 8) + i * 1.7;
      const d = Array.from({ length: 13 }).map((__, k) => {
        const x = -60 + k * 100;
        return `${k === 0 ? "M" : "L"} ${x} ${yy + Math.sin(ph + k * 0.9) * amp}`;
      }).join(" ");
      return <path key={i} d={d} fill="none" stroke={INK} strokeWidth={3 + i * 0.8} opacity={0.35 + i * 0.05} filter="url(#ink)" strokeLinecap="round" />;
    })}
  </g>
);

const Lighthouse: React.FC<{ x: number; y: number; s: number; frame: number; beam?: number; sweep?: number }> = ({ x, y, s, frame, beam = 1, sweep = 1 }) => {
  const a = Math.sin(frame / 38) * 38 * sweep;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* rocks */}
      <path d="M -330 120 Q -260 20 -150 40 Q -60 -10 40 30 Q 160 0 260 60 Q 330 90 360 140 L 360 260 L -360 260 Z" fill={INK} opacity={0.88} filter="url(#ink)" />
      {/* tower */}
      <path d="M -70 40 L -45 -520 L 45 -520 L 70 40 Z" fill={PAPER} stroke={INK} strokeWidth={7} filter="url(#ink)" />
      <path d="M -62 -60 L 62 -60 M -55 -220 L 55 -220 M -50 -380 L 50 -380" stroke={INK} strokeWidth={14} opacity={0.7} filter="url(#ink)" />
      {/* lamp room */}
      <rect x={-62} y={-610} width={124} height={90} fill={GOLD} opacity={0.35 + 0.65 * beam} />
      <path d="M -62 -610 L 62 -610 L 62 -520 L -62 -520 Z M -20 -610 L -20 -520 M 20 -610 L 20 -520" fill="none" stroke={INK} strokeWidth={7} filter="url(#ink)" />
      <path d="M -80 -610 L 0 -680 L 80 -610 Z" fill={INK} filter="url(#ink)" />
      <rect x={-90} y={-524} width={180} height={14} fill={INK} filter="url(#ink)" />
      {/* the beam */}
      <g opacity={beam} style={{ mixBlendMode: "multiply" }}>
        <circle cx={0} cy={-565} r={200} fill="url(#glow)" />
        <g transform={`translate(0 -565) rotate(${a})`}>
          <path d="M 0 0 L 1100 -170 L 1100 170 Z" fill="url(#beam)" />
          <path d="M 0 0 L -1100 -170 L -1100 170 Z" fill="url(#beam)" transform="scale(-1 1) rotate(180)" opacity={0} />
        </g>
      </g>
    </g>
  );
};

/** Faceless ink figures. */
const Keeper: React.FC<{ x: number; y: number; s: number; frame: number; talk?: number }> = ({ x, y, s, frame, talk = 0 }) => (
  <g transform={`translate(${x} ${y + Math.sin(frame / 30) * 2}) scale(${s})`} filter="url(#ink)">
    <path d="M -120 0 Q -130 -260 -70 -330 L 70 -330 Q 130 -260 120 0 Z" fill={INK} opacity={0.9} />
    <ellipse cx={0} cy={-400 - talk * 3} rx={62} ry={72} fill={PAPER} stroke={INK} strokeWidth={7} />
    <path d="M -58 -390 Q -60 -310 0 -296 Q 60 -310 58 -390 Q 0 -350 -58 -390 Z" fill={INK} opacity={0.35} />
    <path d="M -72 -450 Q 0 -520 72 -450 L 90 -440 L -76 -434 Z" fill={INK} />
  </g>
);

const Doctor: React.FC<{ x: number; y: number; s: number; frame: number; talk?: number }> = ({ x, y, s, frame, talk = 0 }) => (
  <g transform={`translate(${x} ${y + Math.sin(frame / 27 + 1) * 2}) scale(${s})`} filter="url(#ink)">
    <path d="M -110 0 Q -120 -250 -64 -320 L 64 -320 Q 120 -250 110 0 Z" fill={PAPER} stroke={INK} strokeWidth={7} />
    <path d="M -30 -318 L 0 -230 L 30 -318" fill="none" stroke={INK} strokeWidth={6} />
    <path d="M -36 -310 Q -60 -220 -14 -196 M 36 -310 Q 60 -220 14 -196" fill="none" stroke={RED} strokeWidth={6} opacity={0.85} />
    <ellipse cx={0} cy={-392 - talk * 3} rx={56} ry={68} fill={PAPER} stroke={INK} strokeWidth={7} />
    <path d="M -60 -400 Q -66 -470 0 -472 Q 66 -470 60 -400 Q 70 -330 54 -300 Q 40 -380 0 -420 Q -40 -380 -54 -300 Q -70 -330 -60 -400 Z" fill={INK} />
  </g>
);

const Boat: React.FC<{ x: number; y: number; s: number; tilt?: number; lit?: number }> = ({ x, y, s, tilt = 0, lit = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}>
    {lit > 0 ? <circle cx={0} cy={-40} r={160} fill="url(#glow)" opacity={lit} /> : null}
    <g filter="url(#ink)">
      <path d="M -110 0 Q 0 50 110 0 L 90 -26 L -90 -26 Z" fill={INK} />
      <path d="M 0 -26 L 0 -170 M 0 -160 L 70 -40 L 0 -40" fill="none" stroke={INK} strokeWidth={6} />
    </g>
  </g>
);

const talking = (f: number, who: string) => {
  const line = LINES.find((l) => f >= l.from && f < l.to);
  if (!line || line.speaker !== who) return 0;
  const w = line.words.find((x) => f >= x.frame && f <= x.endFrame + 1);
  return w ? 1 : 0;
};

// ---------- shots ----------

type Shot = { from: number; render: (f: number) => React.ReactNode };
const S = (id: string) => L(id).from;

const SHOTS: Shot[] = [
  { from: 0, render: (f) => (
    <Scroll from={0} night={0.85} push={0.08} origin="60% 40%">
      <Sea frame={f} y={1180} rough={0.15} />
      <Lighthouse x={700} y={1180} s={1.05} frame={f} />
      <Doctor x={680} y={603} s={0.12} frame={f} />
      <Keeper x={730} y={603} s={0.12} frame={f} />
    </Scroll>
  ) },
  { from: S("S2"), render: (f) => (
    <Scroll from={S("S2")} night={0.9} push={0.05}>
      <circle cx={760} cy={620} r={420} fill="url(#glow)" style={{ mixBlendMode: "multiply" }} />
      <rect x={560} y={420} width={400} height={360} fill={GOLD} opacity={0.4} filter="url(#wash)" />
      <path d="M 520 380 L 1000 380 M 520 820 L 1000 820 M 680 380 L 680 820 M 840 380 L 840 820" stroke={INK} strokeWidth={14} filter="url(#ink)" />
      <Keeper x={420} y={1500} s={2.1} frame={f} talk={talking(f, "OLD")} />
      <rect x={-50} y={1450} width={1180} height={600} fill={INK} opacity={0.8} filter="url(#wash)" />
    </Scroll>
  ) },
  { from: S("S3"), render: (f) => (
    <Scroll from={S("S3")} night={0.8} push={0.05}>
      <Sea frame={f} y={1050} rough={0.2} />
      <Doctor x={540} y={1550} s={2.2} frame={f} talk={talking(f, "YOUNG")} />
      <rect x={-50} y={1500} width={1180} height={600} fill={INK} opacity={0.75} filter="url(#wash)" />
    </Scroll>
  ) },
  { from: S("S4"), render: (f) => {
    const small = W("S4", "small");
    return (
      <Scroll from={S("S4")} night={0.4} push={0.04}>
        <Sea frame={f} y={700} rough={0.05 + 0.25 * progress(f, small, 40)} dark={0.35} />
        {[0, 1, 2].map((i) => {
          const p = ((f - S("S4")) / 60 + i / 3) % 1;
          return <ellipse key={i} cx={540} cy={1200} rx={60 + p * 380} ry={(60 + p * 380) * 0.28} fill="none" stroke={INK} strokeWidth={5} opacity={(1 - p) * 0.7} filter="url(#ink)" />;
        })}
      </Scroll>
    );
  } },
  { from: S("S5"), render: (f) => (
    <Scroll from={S("S5")} night={1} push={0.05}>
      <Sea frame={f} y={900} rough={1} dark={0.9} />
      <Boat x={520} y={1180} s={2} tilt={Math.sin(f / 7) * 18} />
      {Array.from({ length: 40 }).map((_, i) => {
        const x = (i * 211 + f * 9) % 1200 - 60, y = (i * 389 + f * 34) % 1920;
        return <line key={i} x1={x} y1={y} x2={x - 30} y2={y + 110} stroke={INK} strokeWidth={4} opacity={0.5} />;
      })}
    </Scroll>
  ) },
  { from: S("S6"), render: (f) => (
    <Scroll from={S("S6")} night={0.9} push={0.04}>
      <circle cx={300} cy={600} r={380} fill="url(#glow)" style={{ mixBlendMode: "multiply" }} />
      <Keeper x={640} y={1560} s={2.3} frame={f} talk={talking(f, "OLD")} />
      <rect x={-50} y={1500} width={1180} height={600} fill={INK} opacity={0.8} filter="url(#wash)" />
    </Scroll>
  ) },
  { from: S("S7"), render: (f) => {
    const weight = W("S7", "weight");
    const week = W("S7", "week");
    const draw = progress(f, weight - 6, week - weight + 20);
    // a month of daily weights: a slow drift, then a steeper final week
    const pts = Array.from({ length: 31 }).map((_, d) => {
      const base = d < 23 ? d * 1.6 : 37 + (d - 23) * 7;
      return [140 + d * 26, 1240 - base * 6 + Math.sin(d * 2.3) * 14] as const;
    });
    const n = Math.max(2, Math.round(draw * pts.length));
    return (
      <Scroll from={S("S7")} night={0} push={0.03}>
        <text x={140} y={420} fontFamily={SERIF} fontSize={66} fill={INK}>Daily weight</text>
        <text x={140} y={480} fontFamily={SANS} fontSize={30} fill={INK} opacity={0.6}>the month before a heart failure admission</text>
        <path d={`M 120 1300 L 960 1300`} stroke={INK} strokeWidth={6} opacity={0.6} filter="url(#ink)" />
        <path d={pts.slice(0, n).map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ")} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" filter="url(#ink)" />
        {/* the last week, marked */}
        <rect x={140 + 23 * 26} y={600} width={7 * 26 + 20} height={700} fill={GOLD} opacity={0.35 * progress(f, week - 4, 10)} filter="url(#wash)" />
        <g transform={`translate(${140 + 26 * 26} 1420) rotate(-6)`} opacity={progress(f, week - 2, 8)}>
          <rect x={-110} y={-60} width={220} height={120} rx={14} fill={RED} filter="url(#ink)" />
          <text x={0} y={18} textAnchor="middle" fontFamily={SERIF} fontSize={52} fill={PAPER}>1 week</text>
        </g>
        <text x={140} y={1640} fontFamily={SANS} fontSize={34} fill={INK} opacity={0.75 * progress(f, W("S7", "hospital") - 6, 10)}>Starts creeping up at least a week before hospital.</text>
        <text x={140} y={1700} fontFamily={SANS} fontSize={26} fill={INK} opacity={0.55}>Chaudhry et al., Circulation, 2007 · illustration of the pattern</text>
      </Scroll>
    );
  } },
  { from: S("S8"), render: (f) => {
    const rise = progress(f, S("S8"), 90);
    return (
      <Scroll from={S("S8")} night={0.6} push={0.04}>
        <path d="M -60 900 Q 200 820 420 880 Q 700 960 1140 860 L 1140 1980 L -60 1980 Z" fill={INK} opacity={0.75} filter="url(#ink)" />
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <path key={d} d={`M -60 ${1500 - d * 60 * rise} Q 540 ${1470 - d * 60 * rise} 1140 ${1500 - d * 60 * rise}`} stroke={PAPER} strokeWidth={4} fill="none" opacity={0.25 + d * 0.08} filter="url(#ink)" />
        ))}
        <rect x={-60} y={1500 - 6 * 60 * rise} width={1200} height={600} fill={INK} opacity={0.45} filter="url(#wash)" />
      </Scroll>
    );
  } },
  { from: S("S9"), render: (f) => (
    <Scroll from={S("S9")} night={0.9} push={0.04}>
      {[0, 1, 2].map((i) => {
        const at = W("S9", "every") + i * 6;
        return (
          <g key={i} opacity={progress(f, at, 8)}>
            <circle cx={240 + i * 300} cy={620} r={100} fill={PAPER} />
            <circle cx={240 + i * 300 + (i - 1) * 50} cy={620} r={100} fill={INK} opacity={0.75} filter="url(#wash)" />
          </g>
        );
      })}
      <Sea frame={f} y={1150} rough={0.25} />
      <Lighthouse x={540} y={1250} s={0.6} frame={f} beam={0.25} sweep={0} />
    </Scroll>
  ) },
  { from: S("S10"), render: (f) => {
    const keep = W("S10", "keep");
    const on = progress(f, keep - 4, 20);
    return (
      <Scroll from={S("S10")} night={0.95} push={0.06}>
        <Sea frame={f} y={1150} rough={0.25} />
        {[[180, 1300, 0.8], [880, 1260, 0.6], [420, 1500, 1], [760, 1620, 0.9]].map(([x, y, s], i) => (
          <Boat key={i} x={x} y={y} s={s} tilt={Math.sin(f / 20 + i) * 5} lit={on * (0.5 + 0.5 * Math.max(0, Math.cos(f / 38 - i)))} />
        ))}
        <Lighthouse x={540} y={1150} s={0.9} frame={f} beam={0.2 + 0.8 * on} sweep={1.6} />
      </Scroll>
    );
  } },
  { from: S("S11"), render: (f) => {
    const scale = W("S11", "scale");
    const line = W("S11", "line");
    const sees = W("S11", "sees");
    const crossed = W("S11", "crossed");
    return (
      <Scroll from={S("S11")} night={0} push={0.02}>
        {/* 1. a scale every morning */}
        <g opacity={progress(f, scale - 4, 8)} filter="url(#ink)">
          <rect x={150} y={330} width={300} height={300} rx={40} fill={PAPER} stroke={INK} strokeWidth={10} />
          <path d="M 220 420 A 80 80 0 0 1 380 420" fill="none" stroke={INK} strokeWidth={8} />
          <path d="M 300 420 L 330 375" stroke={RED} strokeWidth={8} />
        </g>
        <text x={520} y={470} fontFamily={SERIF} fontSize={54} fill={INK} opacity={progress(f, scale, 8)}>every morning</text>
        {/* 2. a line agreed together */}
        <g opacity={progress(f, line - 4, 8)}>
          <path d="M 150 900 L 930 900" stroke={RED} strokeWidth={8} strokeDasharray="30 18" filter="url(#ink)" />
          <path d={`M 150 1040 Q 300 1020 420 1000 Q 560 980 ${640 + 60 * progress(f, crossed - 10, 20)} ${960 - 110 * progress(f, crossed - 10, 20)}`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" filter="url(#ink)" />
          <text x={150} y={860} fontFamily={SANS} fontSize={32} fill={RED}>the line we agreed</text>
        </g>
        {/* 3. someone who sees when it's crossed */}
        <g opacity={progress(f, sees - 4, 8)}>
          <circle cx={700} cy={850} r={150} fill="url(#glow)" opacity={progress(f, crossed - 2, 10)} style={{ mixBlendMode: "multiply" }} />
          <Lighthouse x={540} y={1700} s={0.42} frame={f} beam={0.4 + 0.6 * progress(f, crossed - 2, 10)} sweep={0.6} />
        </g>
        <text x={150} y={1360} fontFamily={SERIF} fontSize={54} fill={INK} opacity={progress(f, sees, 8)}>and someone who sees</text>
      </Scroll>
    );
  } },
  { from: S("S12"), render: (f) => (
    <Scroll from={S("S12")} night={0.9} push={0.1} origin="55% 40%">
      <Sea frame={f} y={1180} rough={0.12} />
      <Lighthouse x={620} y={1180} s={1.05} frame={f} sweep={1.2} />
      <Doctor x={620} y={603} s={0.12} frame={f} />
    </Scroll>
  ) },
];

// ---------- captions (Garib style: 1-3 words, centre; key line big) ----------

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const line = LINES.find((l) => f >= l.from && f < l.to);
  if (!line || line.id === "S10" || line.id === "S12") return null;
  const ws = line.words;
  const i = ws.findIndex((w, k) => f >= w.frame - 2 && f < (ws[k + 1]?.frame ?? line.to) - 2);
  if (i < 0) return null;
  const chunks: number[][] = [];
  let cur: number[] = [];
  ws.forEach((w, k) => { cur.push(k); if (cur.length === 3 || /[.,?]$/.test(w.token)) { chunks.push(cur); cur = []; } });
  if (cur.length) chunks.push(cur);
  const chunk = chunks.find((c) => c.includes(i))!;
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 1560, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 60, color: "#FFFDF6",
      textShadow: "0 2px 4px #000000CC, 0 0 24px #000000AA" }}>
      {chunk.map((k) => ws[k].token).join(" ")}
    </div>
  );
};

const KeyLine: React.FC = () => {
  const f = useCurrentFrame();
  const l10 = L("S10"), l12 = L("S12");
  const show = (l: Line, text: React.ReactNode, top: number) => (
    <div style={{ position: "absolute", left: 70, right: 70, top, textAlign: "center", fontFamily: SERIF, fontSize: 104, lineHeight: 1.05, color: "#FFF8E8",
      textShadow: "0 4px 30px #000000AA", opacity: progress(f, l.words[0].frame - 2, 10) }}>{text}</div>
  );
  if (f >= W("S10", "keep") - 4 && f < l10.to) return show(l10, <>Keep a light on <i>between the visits.</i></>, 260);
  if (f >= l12.from) return show(l12, <>Now you're keeping <i>a lighthouse.</i></>, 300);
  return null;
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.16 : 0.3) * Math.min(1, f / 30) * Math.min(1, (LIGHTHOUSE_DURATION - f) / 40);
};

export const TheLighthouse: React.FC = () => {
  const f = useCurrentFrame();
  const shot = [...SHOTS].reverse().find((s) => f >= s.from) ?? SHOTS[0];
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <AbsoluteFill>{shot.render(f)}</AbsoluteFill>
      {/* rice paper fibre */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 110% 80% at 50% 45%, transparent 55%, #8A7A5A55 100%)", mixBlendMode: "multiply" }} />
      <CinemaGrade grain={0.14} vignette={0.25} glow={GOLD} />
      <KeyLine />
      <Captions />
      <AbsoluteFill style={{ background: "#0E0D0C", opacity: progress(f, LIGHTHOUSE_DURATION - 26, 24) }} />
      <VoiceOver take={TAKE} volume={1.25} />
      <Audio src={staticFile("music/2026-11-11-the-lighthouse.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const LIGHTHOUSE_COVER = 60;
