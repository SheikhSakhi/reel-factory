import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, progress, wordFrame } from "../../kit";
import { CinemaGrade } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-20-the-clockmaker/take.json";

// Formats lab F2 (faceless parable), third run: sumi-e ink wash on rice paper, gold as the only colour, a red seal.
// A young doctor and an old clockmaker; the metaphor object is the clock: set, check, adjust. Personal case -> the
// linking question -> the fact (WHO 2023) -> an answering ending. Calm voices, night ambient bed, no sound effects.

const TAKE = loadTake(takeJson);
const TAIL = 54;
export const CLOCK_DURATION = TAKE.totalFrames + TAIL;
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


// ---------- the clocks ----------

/** An ink clock face. drift: how far its hands have wandered from the true time (0 = right). */
const Clock: React.FC<{ x: number; y: number; r: number; f: number; drift?: number; lit?: number }> = ({ x, y, r, f, drift = 0, lit = 0 }) => {
  const t = f / 30;
  const minute = (t * 6) % 360 + drift * 140;
  const hour = (t * 0.5) % 360 + 300 + drift * 60;
  return (
    <g transform={`translate(${x} ${y})`}>
      {lit > 0 ? <circle r={r * 1.9} fill="url(#glow)" opacity={lit} /> : null}
      <circle r={r} fill={PAPER} stroke={INK} strokeWidth={Math.max(3, r * 0.08)} filter="url(#ink)" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={Math.sin(a) * r * 0.78} y1={-Math.cos(a) * r * 0.78} x2={Math.sin(a) * r * 0.9} y2={-Math.cos(a) * r * 0.9} stroke={INK} strokeWidth={Math.max(2, r * 0.04)} />;
      })}
      <line x1={0} y1={0} x2={0} y2={-r * 0.5} stroke={drift > 0.2 ? RED : INK} strokeWidth={Math.max(3, r * 0.08)} strokeLinecap="round" transform={`rotate(${hour})`} />
      <line x1={0} y1={0} x2={0} y2={-r * 0.76} stroke={drift > 0.2 ? RED : INK} strokeWidth={Math.max(2, r * 0.05)} strokeLinecap="round" transform={`rotate(${minute})`} />
      <circle r={Math.max(3, r * 0.07)} fill={INK} />
    </g>
  );
};

/** The shop wall: rows of clocks. drifting: share of clocks drifting (4 in 5 when 0.8); settle: 0..1 all corrected. */
const ClockWall: React.FC<{ f: number; drifting?: number; settle?: number; y0?: number; glow?: number }> = ({ f, drifting = 0, settle = 0, y0 = 260, glow = 0 }) => (
  <g>
    {Array.from({ length: 6 * 7 }).map((_, i) => {
      const c = i % 6, r = Math.floor(i / 6);
      const off = (i * 7) % 5 === 0 ? 0 : 1; // 4 in 5 drift
      const d = drifting * off * (0.4 + ((i * 13) % 7) / 10) * (1 - settle);
      return <Clock key={i} x={120 + c * 168 + (r % 2) * 20} y={y0 + r * 168} r={60 + ((i * 11) % 3) * 6} f={f} drift={d} lit={glow * (off ? 0.6 : 0.9)} />;
    })}
  </g>
);

const Bench: React.FC = () => (
  <g filter="url(#ink)">
    <rect x={-50} y={1460} width={1180} height={40} fill={INK} opacity={0.85} />
    <rect x={-50} y={1500} width={1180} height={500} fill={INK} opacity={0.55} filter="url(#wash)" />
  </g>
);

type Shot = { from: number; render: (f: number) => React.ReactNode };
const S = (id: string) => L(id).from;

const SHOTS: Shot[] = [
  // S1 the hook: a wall of a hundred clocks, all in step
  { from: 0, render: (f) => (
    <Scroll from={0} night={0.35} push={0.08} origin="50% 40%">
      <ClockWall f={f} y0={200} glow={0.35} />
      <Doctor x={540} y={1650} s={0.6} frame={f} talk={talking(f, "YOUNG")} />
      <rect x={-50} y={1600} width={1180} height={400} fill={INK} opacity={0.6} filter="url(#wash)" />
    </Scroll>
  ) },
  // S2 the clockmaker sets, checks, sets again
  { from: S("S2"), render: (f) => {
    const check = W("S2", "check");
    const again = W("S2", "again");
    const drift = f < W("S2", "set", 1) ? 0.6 : f < check ? 0 : f < again ? 0.25 : 0;
    return (
      <Scroll from={S("S2")} night={0.5} push={0.05}>
        <circle cx={760} cy={560} r={380} fill="url(#glow)" style={{ mixBlendMode: "multiply" }} />
        <Clock x={760} y={640} r={230} f={f} drift={drift} />
        <Keeper x={300} y={1560} s={2.0} frame={f} talk={talking(f, "OLD")} />
        <Bench />
      </Scroll>
    );
  } },
  // S3 the doctor's own case: perfect the day she prescribed, six months later it wasn't
  { from: S("S3"), render: (f) => {
    const six = W("S3", "six");
    const k = progress(f, six - 4, 40);
    return (
      <Scroll from={S("S3")} night={0} push={0.03}>
        <text x={140} y={420} fontFamily={SERIF} fontSize={62} fill={INK}>Her blood pressure</text>
        <path d="M 140 1180 L 940 1180" stroke={INK} strokeWidth={5} opacity={0.6} filter="url(#ink)" />
        <path d="M 140 900 L 940 900" stroke={RED} strokeWidth={4} strokeDasharray="20 14" opacity={0.6} />
        <text x={940} y={880} textAnchor="end" fontFamily={SANS} fontSize={28} fill={RED} opacity={0.8}>too high</text>
        <path d={`M 160 1080 ${Array.from({ length: Math.max(2, Math.round(k * 24)) }).map((_, i) => `L ${160 + i * 32} ${1080 - Math.pow(i / 24, 1.6) * 300 + Math.sin(i * 1.7) * 12}`).join(" ")}`}
          fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" filter="url(#ink)" />
        <g opacity={progress(f, W("S3", "perfect") - 4, 8)}>
          <circle cx={160} cy={1080} r={22} fill={GOLD} />
          <text x={160} y={1250} textAnchor="middle" fontFamily={SANS} fontSize={30} fill={INK}>the day I prescribed</text>
        </g>
        <g opacity={progress(f, six, 10)}>
          <text x={900} y={1250} textAnchor="end" fontFamily={SANS} fontSize={30} fill={INK}>six months later</text>
        </g>
      </Scroll>
    );
  } },
  // S4 the linking question
  { from: S("S4"), render: (f) => (
    <Scroll from={S("S4")} night={0.55} push={0.04}>
      <circle cx={300} cy={600} r={380} fill="url(#glow)" style={{ mixBlendMode: "multiply" }} />
      <Keeper x={640} y={1580} s={2.3} frame={f} talk={talking(f, "OLD")} />
      <Bench />
    </Scroll>
  ) },
  // S5 nobody: she came back with the headaches
  { from: S("S5"), render: (f) => (
    <Scroll from={S("S5")} night={0.6} push={0.04}>
      <Clock x={540} y={760} r={260} f={f * 6} drift={1.2} />
      <Doctor x={540} y={1600} s={1.6} frame={f} talk={talking(f, "YOUNG")} />
      <Bench />
    </Scroll>
  ) },
  // S6 set a clock and walked out of the shop
  { from: S("S6"), render: (f) => {
    const walk = progress(f, W("S6", "walked") - 4, 30);
    return (
      <Scroll from={S("S6")} night={0.7} push={0.03}>
        <Clock x={540} y={620} r={200} f={f} drift={walk * 0.8} />
        <path d="M 760 1500 L 760 900 L 1000 900 L 1000 1500" fill="none" stroke={INK} strokeWidth={10} filter="url(#ink)" />
        <rect x={770} y={910} width={220} height={580} fill={GOLD} opacity={0.25 + walk * 0.3} filter="url(#wash)" />
        <g transform={`translate(${walk * 300} 0)`} opacity={1 - walk * 0.9}><Doctor x={600} y={1500} s={0.9} frame={f} /></g>
        <Bench />
      </Scroll>
    );
  } },
  // S7 the fact: four in five
  { from: S("S7"), render: (f) => {
    const four = W("S7", "four");
    return (
      <Scroll from={S("S7")} night={0} push={0.03}>
        <text x={140} y={420} fontFamily={SERIF} fontSize={60} fill={INK}>People with high blood pressure</text>
        {[0, 1, 2, 3, 4].map((i) => (
          <Clock key={i} x={160 + i * 190} y={800} r={80} f={f} drift={i < 4 && f >= four + i * 3 ? 0.9 : 0} />
        ))}
        <g transform="translate(540 1110) rotate(-5)" opacity={progress(f, four - 2, 8)}>
          <rect x={-170} y={-70} width={340} height={140} rx={14} fill={RED} filter="url(#ink)" />
          <text x={0} y={22} textAnchor="middle" fontFamily={SERIF} fontSize={64} fill={PAPER}>4 in 5</text>
        </g>
        <text x={540} y={1290} textAnchor="middle" fontFamily={SANS} fontSize={34} fill={INK} opacity={progress(f, W("S7", "adequately") - 4, 8)}>not adequately treated</text>
        <text x={540} y={1360} textAnchor="middle" fontFamily={SANS} fontSize={24} fill={INK} opacity={0.55}>WHO, Global report on hypertension, 2023</text>
      </Scroll>
    );
  } },
  // S8 four clocks in five drifting, nobody in the shop
  { from: S("S8"), render: (f) => (
    <Scroll from={S("S8")} night={0.45} push={0.05}>
      <ClockWall f={f} drifting={progress(f, S("S8"), 30)} y0={220} />
      <g opacity={progress(f, W("S8", "nobody") - 4, 10)}>
        <rect x={-50} y={1460} width={1180} height={600} fill={INK} opacity={0.6} filter="url(#wash)" />
        <path d="M 470 1460 L 470 1380 L 610 1380 L 610 1460" fill="none" stroke={INK} strokeWidth={8} filter="url(#ink)" />
      </g>
    </Scroll>
  ) },
  // S9 I can't see her every week
  { from: S("S9"), render: (f) => (
    <Scroll from={S("S9")} night={0.5} push={0.04}>
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i} opacity={0.3 + (i % 4 === 0 ? 0.6 : 0)}>
          <rect x={140 + (i % 4) * 210} y={300 + Math.floor(i / 4) * 200} width={170} height={150} rx={10} fill={PAPER} stroke={INK} strokeWidth={4} filter="url(#ink)" />
        </g>
      ))}
      <Doctor x={540} y={1600} s={1.6} frame={f} talk={talking(f, "YOUNG")} />
      <Bench />
    </Scroll>
  ) },
  // S10 hear the clock: he holds it to his ear
  { from: S("S10"), render: (f) => {
    const hear = W("S10", "hear");
    return (
      <Scroll from={S("S10")} night={0.55} push={0.04}>
        <circle cx={540} cy={700} r={420} fill="url(#glow)" style={{ mixBlendMode: "multiply" }} opacity={progress(f, hear - 4, 12)} />
        <Keeper x={480} y={1580} s={2.2} frame={f} talk={talking(f, "OLD")} />
        <Clock x={700} y={620} r={110} f={f} />
        {f >= hear - 4 ? [0, 1, 2].map((i) => {
          const p = ((f - hear) / 30 + i / 3) % 1;
          return <circle key={i} cx={700} cy={620} r={120 + p * 220} fill="none" stroke={GOLD} strokeWidth={5} opacity={(1 - p) * 0.8} />;
        }) : null}
        <Bench />
      </Scroll>
    );
  } },
  // S11 the answer: a reading every week, an agreed line, adjust when it drifts
  { from: S("S11"), render: (f) => {
    const reading = W("S11", "reading");
    const line = W("S11", "line");
    const drifts = W("S11", "drifts");
    const adjust = W("S11", "adjust");
    const back = progress(f, adjust, 30);
    const pts = Array.from({ length: 12 }).map((_, i) => {
      const drift = i >= 6 ? (i - 5) * 22 : 0;
      const y = 1040 - (i < 8 ? drift : Math.max(0, 66 - (i - 8) * 40) * (1 - back) + (1 - back) * 0 + (i >= 8 ? 0 : 0));
      return [180 + i * 64, i < 8 ? 1040 - drift : 1040 - (66 * (1 - back) + Math.max(0, 50 - (i - 8) * 20) * back)] as const;
    });
    const shown = Math.min(12, Math.max(0, Math.round((f - reading) / 6)));
    return (
      <Scroll from={S("S11")} night={0} push={0.02}>
        <text x={140} y={420} fontFamily={SERIF} fontSize={60} fill={INK}>Set. Check. Adjust.</text>
        <path d="M 160 1120 L 940 1120" stroke={INK} strokeWidth={4} opacity={0.5} />
        <g opacity={progress(f, line - 4, 8)}>
          <path d="M 160 960 L 940 960" stroke={RED} strokeWidth={5} strokeDasharray="22 14" />
          <text x={940} y={940} textAnchor="end" fontFamily={SANS} fontSize={28} fill={RED}>the line we agreed</text>
        </g>
        {pts.slice(0, shown).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={14} fill={i >= 6 && i < 8 && f >= drifts ? RED : INK} filter="url(#ink)" />)}
        <text x={180} y={1180} fontFamily={SANS} fontSize={28} fill={INK} opacity={progress(f, reading, 8)}>a reading every week</text>
        <g opacity={progress(f, adjust - 4, 8)}>
          <circle cx={180 + 7 * 64} cy={pts[7][1]} r={40} fill="none" stroke={GOLD} strokeWidth={6} />
          <text x={180 + 7 * 64} y={pts[7][1] - 60} textAnchor="middle" fontFamily={SERIF} fontSize={40} fill={INK}>adjust</text>
        </g>
        <text x={540} y={1420} textAnchor="middle" fontFamily={SANS} fontSize={30} fill={INK} opacity={progress(f, W("S11", "without") - 4, 8)}>without waiting for the visit</text>
      </Scroll>
    );
  } },
  // S12 the callback: every clock right again
  { from: S("S12"), render: (f) => (
    <Scroll from={S("S12")} night={0.35} push={0.06} origin="50% 40%">
      <ClockWall f={f} drifting={1} settle={progress(f, W("S12", "adjust") - 4, 40)} y0={200} glow={progress(f, W("S12", "that's") - 4, 20) * 0.6} />
      <Keeper x={380} y={1650} s={0.6} frame={f} />
      <Doctor x={680} y={1650} s={0.6} frame={f} />
      <rect x={-50} y={1600} width={1180} height={400} fill={INK} opacity={0.6} filter="url(#wash)" />
    </Scroll>
  ) },
];

// ---------- captions (Garib style: 1-3 words, centre; the key line big) ----------

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const line = LINES.find((l) => f >= l.from && f < l.to);
  if (!line || line.id === "S12") return null;
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
  const l = L("S12");
  if (f < l.from) return null;
  const words: [string, number][] = [["Set.", W("S12", "set")], ["Check.", W("S12", "check")], ["Adjust.", W("S12", "adjust")]];
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1500, textAlign: "center", fontFamily: SERIF, fontSize: 110, lineHeight: 1.05, color: "#FFF8E8",
      textShadow: "0 4px 30px #000000AA" }}>
      {words.map(([w, at]) => <span key={w} style={{ opacity: progress(f, at - 3, 8), marginRight: 26 }}>{w}</span>)}
    </div>
  );
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.16 : 0.3) * Math.min(1, f / 30) * Math.min(1, (CLOCK_DURATION - f) / 40);
};

export const TheClockmaker: React.FC = () => {
  const f = useCurrentFrame();
  const shot = [...SHOTS].reverse().find((s) => f >= s.from) ?? SHOTS[0];
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <AbsoluteFill>{shot.render(f)}</AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 110% 80% at 50% 45%, transparent 55%, #8A7A5A55 100%)", mixBlendMode: "multiply" }} />
      <CinemaGrade grain={0.14} vignette={0.25} glow={GOLD} />
      <KeyLine />
      <Captions />
      <AbsoluteFill style={{ background: "#0E0D0C", opacity: progress(f, CLOCK_DURATION - 26, 24) }} />
      <VoiceOver take={TAKE} volume={1.25} />
      <Audio src={staticFile("music/2026-11-20-the-clockmaker.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const CLOCK_COVER = 40;
