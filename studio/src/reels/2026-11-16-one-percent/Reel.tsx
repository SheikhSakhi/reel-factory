import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, pop, progress, wordFrame } from "../../kit";
import { CinemaGrade } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-16-one-percent/take.json";

// F7 animated flipped explainer, first auto run, our own opening. General: compounding (1% a day). Flip: the same law
// behind a patient's year. Desire: the doctor who sees the trend turns it while it's small. Answer: small daily steps,
// a signal when the line bends, someone watching the line with you. Mirror of the opening. Light paper, one ink chart,
// red for drift, teal for the turn. Calm low narrator, ambient bed, no SFX. No product, no CTA.

const TAKE = loadTake(takeJson);
const TAIL = 55;
export const ONE_DURATION = TAKE.totalFrames + TAIL;
type Word = { token: string; frame: number; endFrame: number };
type Line = { id: string; from: number; to: number; words: Word[] };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
const L = (id: string) => LINES.find((l) => l.id === id)!;
const W = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const PAPER = "#F2EFE8";
const INK = "#1B1A18";
const FAINT = "#1B1A1822";
const RED = "#D6452F";
const TEAL = "#239A8B";
const SERIF = BRAND.theme.fontDisplay;
const SANS = BRAND.theme.fontBody;

// chart geometry
const X0 = 120, X1 = 960, BASE = 1080;
const dx = (d: number) => X0 + (d / 365) * (X1 - X0);
const upY = (d: number) => BASE - ((Math.pow(1.01, d) - 1) / 36.78) * 620;
const downY = (d: number) => BASE + (1 - Math.pow(0.99, d)) * 220;

const curve = (fy: (d: number) => number, to: number) =>
  Array.from({ length: Math.max(2, Math.round(to)) + 1 }).map((_, d) => `${d ? "L" : "M"} ${dx(Math.min(d, to))} ${fy(Math.min(d, to))}`).join(" ");

// the patient's year: a slow drift down; a visit at day 0 and day 270
const driftY = (d: number) => BASE - 180 + Math.pow(d / 270, 2.2) * 330;
const turnY = (d: number, from = 60) => (d < from ? driftY(d) : driftY(from) - (Math.pow(1.006, d - from) - 1) * 66);

const Counter: React.FC<{ value: string; at: number; color?: string; top: number }> = ({ value, at, color = INK, top }) => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 150, letterSpacing: "-0.04em", color,
    opacity: progress(f, at, 8) }}>{value}</div>;
};

const Chart: React.FC = () => {
  const f = useCurrentFrame();
  const s = (id: string) => L(id).from;
  const flip = progress(f, W("S5", "same") - 2, 14);
  const up = progress(f, W("S2", "every") - 4, W("S2", "times") - W("S2", "every") + 8) * 365;
  const down = progress(f, W("S3", "lose") - 4, W("S3", "left") - W("S3", "lose") + 8) * 365;
  const habitsOut = 1 - flip;
  const drift = progress(f, s("S5") + 10, s("S7") - s("S5")) * 270;
  const fog = f >= W("S7", "nobody") - 4 && f < W("S7", "crisis") - 2 ? progress(f, W("S7", "nobody") - 4, 10) : 0;
  const turn = progress(f, W("S8", "turn") - 6, W("S8", "too") - W("S8", "turn") + 30) * 305;
  const icons: [number, string, string][] = [[40, "skipped pill", W("S6", "skipped")], [100, "+ salt", W("S6", "salt")], [160, "+1 kg", W("S6", "kilo")], [215, "reading ↑", W("S6", "reading")]].map(([d, t, a]) => [d as number, t as string, String(a)]);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {/* the axis */}
      <line x1={X0} y1={BASE} x2={X1} y2={BASE} stroke={FAINT} strokeWidth={3} />
      <text x={X0} y={BASE + 50} fontFamily={SANS} fontSize={26} fill="#1B1A1888">day 0</text>
      <text x={X1} y={BASE + 50} textAnchor="end" fontFamily={SANS} fontSize={26} fill="#1B1A1888">day 365</text>
      {/* the habit curves */}
      <g opacity={habitsOut}>
        {up > 0 ? <path d={curve(upY, up)} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" /> : null}
        {down > 0 ? <path d={curve(downY, down)} fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" /> : null}
        {f >= W("S4", "nothing") - 3 && f < s("S5") ? (
          <>
            <rect x={dx(0)} y={BASE - 70} width={dx(200) - dx(0)} height={140} fill="#1B1A1810" />
            <text x={dx(100)} y={BASE - 90} textAnchor="middle" fontFamily={SERIF} fontSize={40} fill={INK}>nothing happens</text>
            <g opacity={progress(f, W("S4", "then") - 3, 8)}>
              <rect x={dx(300)} y={upY(365) - 20} width={dx(365) - dx(300)} height={BASE - upY(365) + 40} fill="#1B1A1810" />
              <text x={dx(330)} y={upY(365) - 40} textAnchor="middle" fontFamily={SERIF} fontSize={40} fill={INK}>then everything</text>
            </g>
          </>
        ) : null}
      </g>
      {/* the patient's year */}
      <g opacity={flip}>
        <text x={X0} y={BASE - 260} fontFamily={SERIF} fontStyle="italic" fontSize={46} fill={RED}>a patient's year</text>
        <path d={curve(driftY, drift)} fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" />
        {icons.map(([d, t, at]) => (
          <g key={t} opacity={progress(f, Number(at) - 3, 8)}>
            <circle cx={dx(d)} cy={driftY(d)} r={10} fill={RED} />
            <text x={dx(d)} y={driftY(d) - 28} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={28} fill={INK}>{t}</text>
          </g>
        ))}
        {/* the visits */}
        {[0, 270].map((d) => (
          <g key={d} opacity={progress(f, W("S7", "next") - 4, 10) + (d === 0 ? progress(f, s("S5"), 10) : 0)}>
            <line x1={dx(d)} y1={BASE - 330} x2={dx(d)} y2={BASE + 200} stroke={INK} strokeWidth={3} strokeDasharray="10 8" />
            <text x={dx(d) + 10} y={BASE + 190} fontFamily={SANS} fontWeight={700} fontSize={28} fill={INK}>visit</text>
          </g>
        ))}
        {/* nobody sees 1%: fog between the visits */}
        <rect x={dx(4)} y={BASE - 330} width={dx(266) - dx(4)} height={560} fill={PAPER} opacity={fog * 0.92} />
        {f >= W("S7", "crisis") - 3 && f < s("S8") + 20 ? (
          <g opacity={progress(f, W("S7", "crisis") - 3, 8)}>
            <circle cx={dx(270)} cy={driftY(270)} r={34} fill="none" stroke={RED} strokeWidth={6} />
            <text x={dx(270)} y={driftY(270) + 80} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={48} fill={RED}>crisis</text>
          </g>
        ) : null}
        {/* the doctor who sees the trend turns it early */}
        {turn > 0 ? (
          <g>
            <circle cx={dx(60)} cy={driftY(60)} r={26} fill="none" stroke={TEAL} strokeWidth={5} opacity={1 - progress(f, L("S9").from, 20) * 0.6} />
            <path d={Array.from({ length: Math.round(turn) + 1 }).map((_, k) => { const d = 60 + k; return `${k ? "L" : "M"} ${dx(d)} ${turnY(d)}`; }).join(" ")} fill="none" stroke={TEAL} strokeWidth={7} strokeLinecap="round" />
          </g>
        ) : null}
        {/* the answer: steps, a signal, someone watching */}
        <g opacity={progress(f, W("S9", "small") - 3, 8)}>
          {Array.from({ length: 24 }).map((_, k) => { const d = 70 + k * 12; return <line key={k} x1={dx(d)} y1={turnY(d) - 14} x2={dx(d)} y2={turnY(d) + 14} stroke={TEAL} strokeWidth={3} />; })}
          <text x={dx(215)} y={turnY(215) - 44} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={28} fill={TEAL}>small daily steps</text>
        </g>
        <g opacity={progress(f, W("S9", "signal") - 3, 8)}>
          <path d={`M ${dx(60) - 20} ${driftY(60) + 50} l 20 -30 l 20 30 z`} fill={TEAL} />
          <text x={dx(60)} y={driftY(60) + 92} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={28} fill={TEAL}>signal</text>
        </g>
        <g opacity={progress(f, W("S9", "someone") - 3, 8)} transform={`translate(${dx(330)} ${turnY(330) - 120})`} stroke={TEAL} strokeWidth={3} fill="none">
          <circle cx={-22} cy={-34} r={11} /><path d="M -44 8 Q -44 -16 -22 -18 Q 0 -16 0 8" />
          <circle cx={22} cy={-34} r={11} /><path d="M 0 8 Q 0 -16 22 -18 Q 44 -16 44 8" />
        </g>
      </g>
    </svg>
  );
};

const Narration: React.FC = () => {
  const f = useCurrentFrame();
  const line = LINES.find((l) => f >= l.from && f < l.to);
  if (!line) return null;
  const sentences: Word[][] = [];
  let cur: Word[] = [];
  line.words.forEach((w) => { cur.push(w); if (/[.?!]$/.test(w.token)) { sentences.push(cur); cur = []; } });
  if (cur.length) sentences.push(cur);
  const sent = [...sentences].reverse().find((s) => f >= s[0].frame - 3) ?? sentences[0];
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 1500, textAlign: "center", fontFamily: SERIF, fontSize: 54, lineHeight: 1.2 }}>
      {sent.map((w, k) => (
        <span key={`${w.frame}-${k}`} style={{ color: f >= w.frame - 2 ? (line.id === "S5" && /patient|year/.test(w.token) ? RED : INK) : "#1B1A1822" }}>{w.token} </span>
      ))}
    </div>
  );
};

const Big: React.FC = () => {
  const f = useCurrentFrame();
  if (f < L("S2").from + 4) return <Counter value="1%" at={0} top={300} />;
  if (f < L("S3").from) {
    const d = progress(f, W("S2", "every") - 4, W("S2", "times") - W("S2", "every") + 8) * 365;
    return <Counter value={`×${Math.pow(1.01, d).toFixed(1)}`} at={L("S2").from} top={300} />;
  }
  if (f < L("S4").from) {
    const d = progress(f, W("S3", "lose") - 4, W("S3", "left") - W("S3", "lose") + 8) * 365;
    return <Counter value={`×${Math.pow(0.99, d).toFixed(2)}`} at={L("S3").from} top={300} color={RED} />;
  }
  if (f >= L("S10").from) {
    const p = pop(f, L("S10").from, 14);
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", opacity: Math.min(1, p * 1.4) }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 150, letterSpacing: "-0.04em", color: INK }}>1%</div>
        <div style={{ fontFamily: SERIF, fontSize: 52, color: INK, marginTop: -10, opacity: progress(f, W("S10", "which") - 3, 8) }}>
          <span style={{ color: TEAL }}>↑</span> which way <span style={{ color: RED }}>↓</span> · who is watching
        </div>
      </div>
    );
  }
  return null;
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.16 : 0.28) * Math.min(1, f / 20) * Math.min(1, (ONE_DURATION - f) / 40);
};

export const OnePercent: React.FC = () => {
  const f = useCurrentFrame();
  const push = 1 + Math.min(1, f / ONE_DURATION) * 0.04;
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}>
        {/* faint grid */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 12 }).map((_, i) => <line key={`v${i}`} x1={i * 90 + 45} y1={0} x2={i * 90 + 45} y2={1920} stroke="#1B1A180B" strokeWidth={2} />)}
          {Array.from({ length: 22 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 90} x2={1080} y2={i * 90} stroke="#1B1A180B" strokeWidth={2} />)}
        </svg>
        <Big />
        <Chart />
      </AbsoluteFill>
      <Narration />
      <CinemaGrade grain={0.08} vignette={0.15} glow="#FFFFFF" />
      <AbsoluteFill style={{ background: PAPER, opacity: progress(f, ONE_DURATION - 24, 22) }} />
      <VoiceOver take={TAKE} volume={1.25} />
      <Audio src={staticFile("music/2026-11-16-one-percent.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const ONE_COVER = W("S2", "times") + 6;
