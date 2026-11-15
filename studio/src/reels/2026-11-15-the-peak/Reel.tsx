import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, progress, wordFrame } from "../../kit";
import { CinemaGrade } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-15-the-peak/take.json";

// F7 animated flipped explainer, test 2. The general part (S1-S4) is the user's reference narration, translated word
// for word on their instruction (test only). The flip (S5) turns "the peak" into seeing each patient's whole path; the
// build-up (S6-S9) says why every doctor wants to stand there; the turn (S10-S11) asks what to bring; the answer (S12)
// is the warm clothes: a plan, a line for when to act, a system that watches with you; S13 mirrors the first line.
// Our own dark line art: one mountain, a small figure, the patients' paths below. Teal arrives with the flip.

const TAKE = loadTake(takeJson);
const TAIL = 60;
export const PEAK_DURATION = TAKE.totalFrames + TAIL;
type Word = { token: string; frame: number; endFrame: number };
type Line = { id: string; from: number; to: number; words: Word[] };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
const L = (id: string) => LINES.find((l) => l.id === id)!;
const W = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const LINE = "#E9E6DF";
const DIM = "#E9E6DF44";
const TEAL = "#4FD1BE";
const AMBER = "#F2B35B";
const SERIF = BRAND.theme.fontDisplay;

const PEAK = { x: 540, y: 560 };
const BASE_Y = 1150;
const MOUNTAIN = "M 110 1150 L 250 1010 L 300 1035 L 400 880 L 450 900 L 540 560 L 620 760 L 680 730 L 790 940 L 840 925 L 970 1150";
const CLIMB: [number, number][] = [[230, 1150], [300, 1035], [400, 880], [450, 900], [540, 560]];

const along = (pts: [number, number][], t: number): [number, number] => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) { const k = d / segs[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};

/** A small line figure, standing at (x, y) (feet). */
const Figure: React.FC<{ x: number; y: number; color?: string; s?: number; look?: number }> = ({ x, y, color = LINE, s = 1, look = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round">
    <circle cx={look * 3} cy={-62} r={9} />
    <path d="M 0 -52 L 0 -22 M 0 -22 L -8 0 M 0 -22 L 8 0 M 0 -44 L -10 -30 M 0 -44 L 10 -30" />
  </g>
);

// ---------- the patients' paths below the mountain ----------

type Path = { y: number; kind: "better" | "drift" | "today" | "plain"; gap: number };
const PATHS: Path[] = [
  { y: 1270, kind: "better", gap: 0.55 }, { y: 1330, kind: "plain", gap: 0.3 }, { y: 1390, kind: "drift", gap: 0.7 },
  { y: 1450, kind: "plain", gap: 0.45 }, { y: 1510, kind: "today", gap: 0.62 }, { y: 1570, kind: "better", gap: 0.35 }, { y: 1630, kind: "plain", gap: 0.5 },
];
const EXTRA: Path[] = Array.from({ length: 8 }).map((_, i) => ({ y: 1300 + i * 45, kind: "plain", gap: 0.2 + (i % 4) * 0.15 }));

const pathD = (p: Path, i: number, f: number, drift: number) => {
  const pts: string[] = [];
  for (let x = 120; x <= 960; x += 30) {
    const k = (x - 120) / 840;
    const off = p.kind === "drift" ? drift * Math.max(0, k - 0.5) * 120 : 0;
    pts.push(`${x === 120 ? "M" : "L"} ${x} ${p.y + Math.sin(k * 6 + i + f / 40) * 6 + off}`);
  }
  return pts.join(" ");
};

const Paths: React.FC<{ f: number }> = ({ f }) => {
  const show = progress(f, W("S5", "whole") - 6, 24);
  if (show <= 0) return null;
  const see = progress(f, W("S6", "who") - 4, 12);
  const caught = progress(f, W("S7", "catch") - 2, 30);
  const gapsClose = progress(f, W("S8", "stop") - 4, 24);
  const more = progress(f, W("S10", "more") - 6, 20) * (1 - progress(f, W("S12", "system") - 4, 30) * 0);
  const line = progress(f, W("S12", "line") - 4, 14);
  const system = progress(f, W("S12", "system") - 4, 20);
  const drift = 1 - caught;
  const all = [...PATHS, ...(more > 0 ? EXTRA : [])];
  return (
    <g opacity={show}>
      {all.map((p, i) => {
        const isExtra = i >= PATHS.length;
        const col = !see || isExtra ? LINE : p.kind === "better" ? TEAL : p.kind === "drift" ? (caught > 0.5 ? TEAL : AMBER) : p.kind === "today" ? AMBER : LINE;
        const gx = 120 + p.gap * 840;
        const gw = 60 * (1 - gapsClose);
        return (
          <g key={i} opacity={isExtra ? more * 0.45 : 0.85}>
            <path d={pathD(p, i, f, drift)} fill="none" stroke={col} strokeWidth={2.6} strokeDasharray={gw > 1 ? `${gx - 120} ${gw} 2000` : undefined} />
            {/* the patient: a dot moving along the path */}
            {!isExtra ? <circle cx={120 + ((f * 0.9 + i * 130) % 840)} cy={p.y + Math.sin(i + f / 40) * 6} r={6} fill={col} /> : null}
            {p.kind === "today" && see > 0 ? <circle cx={760} cy={p.y} r={14 + Math.sin(f / 5) * 4} fill="none" stroke={AMBER} strokeWidth={3} opacity={see * (1 - system)} /> : null}
          </g>
        );
      })}
      {/* catching the drift while it's small */}
      {caught > 0 && caught < 1 ? <circle cx={660} cy={1395} r={30} fill="none" stroke={TEAL} strokeWidth={3} opacity={1 - caught} /> : null}
      {/* the line for when to act */}
      <g opacity={line}>
        <line x1={120} y1={1215} x2={960} y2={1215} stroke={AMBER} strokeWidth={3} strokeDasharray="14 10" />
        <text x={960} y={1200} textAnchor="end" fontFamily={SERIF} fontSize={28} fill={AMBER}>when to act</text>
      </g>
      {/* the system that watches with you: a soft net over every path */}
      <g opacity={system}>
        <rect x={100} y={1235} width={880} height={430} rx={30} fill="none" stroke={TEAL} strokeWidth={3} style={{ filter: `drop-shadow(0 0 12px ${TEAL}88)` }} />
        {[300, 540, 780].map((x) => <line key={x} x1={x} y1={1235} x2={x} y2={1665} stroke={TEAL} strokeWidth={1.5} opacity={0.4} />)}
      </g>
    </g>
  );
};

// ---------- the mountain, the figures ----------

const Mountain: React.FC<{ f: number }> = ({ f }) => {
  const draw = progress(f, 0, 50);
  const flip = progress(f, W("S5", "medicine") - 2, 16);
  const clear = progress(f, L("S13").from, 30);
  const cold = (f >= W("S3", "cold") - 4 && f < L("S5").from) ? 1 : (f >= L("S10").from && f < W("S12", "system")) ? 0.4 : 0;
  const climb = progress(f, W("S5", "stop") - 6, W("S5", "path") - W("S5", "stop") + 10);
  const [cx, cy] = along(CLIMB, flip > 0 ? climb : 0);
  const atTop = f >= W("S3", "reaches") - 2 && f < L("S5").from;
  const warm = progress(f, W("S9", "every") - 4, 20) * (1 - progress(f, L("S10").from, 20));
  const sight = progress(f, W("S6", "see") - 4, 14);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {/* stars thin out near the peak */}
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={(i * 263) % 1080} cy={180 + ((i * 397) % 760)} r={1.5 + (i % 3)} fill={LINE} opacity={(0.2 + 0.5 * Math.abs(Math.sin(f / 30 + i))) * (1 - clear * 0.5)} />
      ))}
      {/* the warm glow at the top while we say why every doctor wants it */}
      <circle cx={PEAK.x} cy={PEAK.y} r={260} fill={`url(#warm)`} opacity={warm + clear * 0.6} />
      <defs>
        <radialGradient id="warm"><stop offset="0" stopColor={clear > 0 ? TEAL : AMBER} stopOpacity={0.45} /><stop offset="1" stopColor={AMBER} stopOpacity={0} /></radialGradient>
      </defs>
      <path d={MOUNTAIN} fill="none" stroke={flip > 0 ? TEAL : LINE} strokeWidth={3} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      <line x1={60} y1={BASE_Y} x2={1020} y2={BASE_Y} stroke={DIM} strokeWidth={2} />
      {/* cold up there: snow drifting at the summit */}
      {cold > 0 ? Array.from({ length: 24 }).map((_, i) => (
        <circle key={i} cx={PEAK.x - 140 + ((i * 53 + f * 1.5) % 280)} cy={PEAK.y - 120 + ((i * 37 + f * 2) % 240)} r={2} fill={LINE} opacity={0.6 * cold} />
      )) : null}
      {/* before the flip: someone at the top, alone; someone at the foot, looking up */}
      {atTop ? <Figure x={PEAK.x} y={PEAK.y} s={0.9} /> : null}
      {f < L("S5").from ? <Figure x={230} y={BASE_Y} look={1} /> : null}
      {f >= W("S4", "question") - 4 && f < L("S5").from ? (
        <g opacity={progress(f, W("S4", "question") - 4, 10)}>
          <ellipse cx={330} cy={1040} rx={120} ry={46} fill="none" stroke={LINE} strokeWidth={2.5} />
          <text x={330} y={1034} textAnchor="middle" fontFamily={SERIF} fontSize={24} fill={LINE}>what is bad</text>
          <text x={330} y={1062} textAnchor="middle" fontFamily={SERIF} fontSize={24} fill={LINE}>about this good?</text>
        </g>
      ) : null}
      {/* after the flip: the doctor climbs, then stays at the top */}
      {flip > 0 ? <Figure x={cx} y={cy} color={TEAL} s={0.95} /> : null}
      {/* the view from the top down to the paths */}
      {sight > 0 ? <path d={`M ${PEAK.x} ${PEAK.y + 10} L 140 1240 M ${PEAK.x} ${PEAK.y + 10} L 940 1240`} stroke={TEAL} strokeWidth={1.5} strokeDasharray="6 10" opacity={sight * 0.5} /> : null}
      {/* "what do I bring?": the question again, at the foot */}
      {f >= L("S11").from && f < L("S12").from ? (
        <g opacity={progress(f, L("S11").from, 10)}>
          <Figure x={230} y={BASE_Y} color={TEAL} look={1} />
          <ellipse cx={340} cy={1040} rx={110} ry={40} fill="none" stroke={TEAL} strokeWidth={2.5} />
          <text x={340} y={1048} textAnchor="middle" fontFamily={SERIF} fontSize={28} fill={TEAL}>what do I bring?</text>
        </g>
      ) : null}
      {/* the warm clothes: a plan for every patient appears by the doctor at the top */}
      <g opacity={progress(f, W("S12", "plan") - 4, 12)}>
        <rect x={PEAK.x + 50} y={PEAK.y - 110} width={80} height={100} rx={6} fill="none" stroke={TEAL} strokeWidth={3} />
        {[0, 1, 2, 3].map((i) => <line key={i} x1={PEAK.x + 64} y1={PEAK.y - 88 + i * 20} x2={PEAK.x + 116} y2={PEAK.y - 88 + i * 20} stroke={TEAL} strokeWidth={3} />)}
      </g>
      <Paths f={f} />
    </svg>
  );
};

// ---------- the words ----------

const Narration: React.FC = () => {
  const f = useCurrentFrame();
  const line = LINES.find((l) => f >= l.from && f < l.to);
  if (!line) return null;
  const sentences: Word[][] = [];
  let cur: Word[] = [];
  line.words.forEach((w) => { cur.push(w); if (/[.?!:]$/.test(w.token)) { sentences.push(cur); cur = []; } });
  if (cur.length) sentences.push(cur);
  const sent = [...sentences].reverse().find((s) => f >= s[0].frame - 3) ?? sentences[0];
  const tealFrom = L("S5").from;
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 1700, textAlign: "center", fontFamily: SERIF, fontSize: 46, lineHeight: 1.22 }}>
      {sent.map((w, k) => (
        <span key={`${w.frame}-${k}`} style={{ color: f >= w.frame - 2 ? (line.id === "S5" && /peak|title/.test(w.token) ? TEAL : f >= tealFrom && /path|plan|line|system|clearer/.test(w.token) ? TEAL : LINE) : "#E9E6DF22" }}>{w.token} </span>
      ))}
    </div>
  );
};

const Header: React.FC = () => {
  const f = useCurrentFrame();
  const show = progress(f, L("S2").from, 20);
  const end = progress(f, L("S13").from, 20);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 38 }}>
      <span style={{ color: "#E9E6DF99", opacity: show * (1 - end) }}>The higher the peak, the thinner the air.</span>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, color: TEAL, opacity: end }}>The higher the peak, the clearer the view.</div>
    </div>
  );
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.17 : 0.3) * Math.min(1, f / 30) * Math.min(1, (PEAK_DURATION - f) / 40);
};

export const ThePeak: React.FC = () => {
  const f = useCurrentFrame();
  const drift = interpolate(f, [0, PEAK_DURATION], [1, 1.04]);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0D0F16 0%, #0A0B10 60%, #07080B 100%)" }}>
      <AbsoluteFill style={{ transform: `scale(${drift})`, transformOrigin: "50% 40%" }}>
        <Header />
        <Mountain f={f} />
      </AbsoluteFill>
      <Narration />
      <CinemaGrade grain={0.07} vignette={0.5} glow="#1A2A2A" />
      <AbsoluteFill style={{ background: "#000", opacity: progress(f, PEAK_DURATION - 26, 24) }} />
      <VoiceOver take={TAKE} volume={1.25} />
      <Audio src={staticFile("music/2026-11-15-the-peak.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const PEAK_COVER = W("S5", "path") + 20;
