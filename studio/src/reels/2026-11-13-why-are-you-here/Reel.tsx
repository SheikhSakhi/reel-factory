import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, pop, progress, wordFrame } from "../../kit";
import { CinemaGrade } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-13-why-are-you-here/take.json";

// Formats lab F3 (B-roll story), transit-map style: the patient's care drawn as metro lines, stations, departure
// boards and platform signs; the referral letter rides the line and is lost at the transfer. One narrator (Emma),
// a calm ambient bed, no sound effects. The ending answers. No CTA.

const TAKE = loadTake(takeJson);
const TAIL = 45;
export const WHY_DURATION = TAKE.totalFrames + TAIL;
type Line = { id: string; from: number; to: number; words: { token: string; frame: number; endFrame: number }[] };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
const L = (id: string) => LINES.find((l) => l.id === id)!;
const W = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const BG = "#F3F1EA";
const INK = "#16181D";
const RED = "#E2382F";
const BLUE = "#1F6FD1";
const GREEN = "#18A058";
const YELLOW = "#F2B81D";
const SANS = BRAND.theme.fontBody;
const MONO = BRAND.theme.fontMono;

// ---------- transit parts ----------

const Station: React.FC<{ x: number; y: number; label: string; side?: "l" | "r" | "t" | "b"; big?: boolean; at?: number; color?: string }> = ({
  x, y, label, side = "r", big = false, at = 0, color = INK,
}) => {
  const f = useCurrentFrame();
  const p = pop(f, at, 14);
  const r = big ? 34 : 24;
  const tx = side === "r" ? x + r + 22 : side === "l" ? x - r - 22 : x;
  const ty = side === "t" ? y - r - 24 : side === "b" ? y + r + 52 : y + 14;
  return (
    <g opacity={Math.min(1, p * 1.5)}>
      <circle cx={x} cy={y} r={r * (0.6 + 0.4 * p)} fill="#FFFFFF" stroke={color} strokeWidth={big ? 12 : 9} />
      <text x={tx} y={ty} textAnchor={side === "l" ? "end" : side === "r" ? "start" : "middle"} fontFamily={SANS} fontWeight={800} fontSize={big ? 46 : 36} fill={INK}>{label}</text>
    </g>
  );
};

const Track: React.FC<{ d: string; color: string; at: number; dur?: number; w?: number }> = ({ d, color, at, dur = 20, w = 26 }) => {
  const f = useCurrentFrame();
  return <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress(f, at, dur)} />;
};

const Letter: React.FC<{ x: number; y: number; s?: number; o?: number; rot?: number }> = ({ x, y, s = 1, o = 1, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <rect x={-60} y={-40} width={120} height={80} rx={8} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
    <path d="M -60 -40 L 0 6 L 60 -40" fill="none" stroke={INK} strokeWidth={6} />
  </g>
);

/** A platform / departure board: dark panel, amber dot-matrix type. */
const Board: React.FC<{ rows: [string, string][]; at: number; top: number; title?: string }> = ({ rows, at, top, title }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, background: "#101216", borderRadius: 18, padding: "34px 40px", boxShadow: "0 24px 50px #0000003A",
      opacity: progress(f, at, 8), transform: `translateY(${(1 - pop(f, at, 14)) * 30}px)` }}>
      {title ? <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: "0.18em", color: "#FFFFFF77", marginBottom: 18 }}>{title}</div> : null}
      {rows.map(([a, b], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 46, color: YELLOW, padding: "10px 0",
          borderTop: i ? "2px solid #FFFFFF14" : "none", opacity: progress(f, at + 4 + i * 5, 6) }}>
          <span>{a}</span><span>{b}</span>
        </div>
      ))}
    </div>
  );
};

/** A platform sign: a coloured roundel and a station name. */
const Sign: React.FC<{ text: string; color: string; at: number; top: number; sub?: string }> = ({ text, color, at, top, sub }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, display: "flex", alignItems: "center", gap: 30, background: "#FFFFFF", border: `10px solid ${color}`,
      borderRadius: 20, padding: "34px 40px", opacity: progress(f, at, 8), transform: `scale(${0.92 + 0.08 * pop(f, at, 14)})` }}>
      <div style={{ width: 110, height: 110, borderRadius: 55, border: `22px solid ${color}`, flexShrink: 0 }} />
      <div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 70, lineHeight: 1, color: INK, letterSpacing: "-0.02em" }}>{text}</div>
        {sub ? <div style={{ fontFamily: SANS, fontSize: 34, color: "#5A5E66", marginTop: 10 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

const Plate: React.FC<{ children: React.ReactNode; from: number; push?: number; origin?: string }> = ({ children, from, push = 0.05, origin = "50% 50%" }) => {
  const f = useCurrentFrame();
  const s = 1 + Math.min(1, (f - from) / 100) * push;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: origin }}>
      {/* map grid */}
      {Array.from({ length: 12 }).map((_, i) => <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={1920} stroke="#E4E1D7" strokeWidth={2} />)}
      {Array.from({ length: 20 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 100} x2={1080} y2={i * 100} stroke="#E4E1D7" strokeWidth={2} />)}
      {children}
    </svg>
  );
};

/** The big caption for a shot, signage style. */
const Big: React.FC<{ children: React.ReactNode; at: number; top: number; size?: number; color?: string }> = ({ children, at, top, size = 78, color = INK }) => {
  const f = useCurrentFrame();
  const p = pop(f, at, 13);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1.03, letterSpacing: "-0.03em", color,
      opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 26}px)` }}>{children}</div>
  );
};

// ---------- shots ----------

type Shot = { from: number; render: (f: number) => React.ReactNode };
const S = (id: string) => L(id).from;
// the route used in several shots: family doctor (red line) -> transfer -> specialist (blue line)
const ROUTE_RED = "M 200 1500 L 200 1100 Q 200 980 320 980 L 540 980";
const ROUTE_BLUE = "M 540 980 L 760 980 Q 880 980 880 860 L 880 420";

const SHOTS: Shot[] = [
  // S1 the specialist's question
  { from: 0, render: (f) => (
    <>
      <Plate from={0} push={0.03}><g /></Plate>
      <Sign text="Specialist" color={BLUE} at={4} top={300} sub="Floor 3 · Room 12" />
      <div style={{ position: "absolute", left: 120, right: 120, top: 760, padding: "50px 54px", borderRadius: 40, background: BLUE, color: "#FFFFFF",
        fontFamily: SANS, fontWeight: 800, fontSize: 80, lineHeight: 1.05, opacity: progress(f, W("S1", "so") - 3, 8), transform: `rotate(-1.5deg) scale(${0.9 + 0.1 * pop(f, W("S1", "so") - 3, 13)})` }}>
        “So, why are you here?”
      </div>
    </>
  ) },
  // S2 my doctor sent me: the route appears
  { from: S("S2"), render: () => (
    <>
      <Plate from={S("S2")} push={0.04}>
        <Track d={ROUTE_RED} color={RED} at={W("S2", "my") - 4} />
        <Track d={ROUTE_BLUE} color={BLUE} at={W("S2", "sent") - 4} />
        <Station x={200} y={1500} label="Family doctor" big at={W("S2", "my") - 4} />
        <Station x={540} y={980} label="Referral" side="b" at={W("S2", "doctor")} />
        <Station x={880} y={420} label="Specialist" side="l" big at={W("S2", "sent")} />
      </Plate>
      <Big at={S("S2") + 2} top={220} size={70}>“My doctor sent me.”</Big>
    </>
  ) },
  // S3 three weeks, two buses, the story from the start
  { from: S("S3"), render: () => (
    <>
      <Board title="NEXT APPOINTMENT" rows={[["Specialist", "21 days"]]} at={S("S3") + 2} top={300} />
      <Board title="ROUTE" rows={[["Bus 14", "22 min"], ["Bus 7", "18 min"]]} at={W("S3", "two") - 4} top={720} />
      <Big at={W("S3", "told") - 4} top={1330} size={64}>…and told my story <span style={{ color: RED }}>from the start.</span></Big>
    </>
  ) },
  // S4 where did the letter go
  { from: S("S4"), render: (f) => {
    const t = progress(f, S("S4"), 50);
    const red = (k: number) => (k < 0.5 ? [200, 1500 - k * 2 * 520] : [200 + (k - 0.5) * 2 * 340, 980]);
    const [x, y] = red(Math.min(1, t * 1.15));
    const lost = progress(f, W("S4", "go") - 4, 12);
    return (
      <>
        <Plate from={S("S4")} push={0.05} origin="45% 55%">
          <Track d={ROUTE_RED} color={RED} at={-100} />
          <Track d={ROUTE_BLUE} color={BLUE} at={-100} />
          <Station x={200} y={1500} label="Family doctor" big />
          <Station x={540} y={980} label="Referral" side="b" />
          <Station x={880} y={420} label="Specialist" side="l" big />
          <Letter x={x} y={y - 70} s={1} o={1 - lost} rot={lost * 30} />
          <text x={540} y={880} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={140} fill={RED} opacity={lost}>?</text>
        </Plate>
        <Big at={W("S4", "letter") - 4} top={220} size={74}>Where did the letter go?</Big>
      </>
    );
  } },
  // S5 the survey: 7 in 10 send
  { from: S("S5"), render: (f) => {
    const seven = W("S5", "seven");
    return (
      <>
        <Board title="US PHYSICIAN SURVEY · 2008 · 4,720 DOCTORS" rows={[["O'Malley & Reschovsky", "Arch Intern Med 2011"]]} at={S("S5") + 2} top={240} />
        <div style={{ position: "absolute", left: 90, right: 90, top: 720, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 30 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ height: 150, borderRadius: 75, border: `14px solid ${RED}`, background: i < 7 && f >= seven + i * 2 ? RED : "#FFFFFF" }} />
          ))}
        </div>
        <Big at={seven - 2} top={1180} size={70}><span style={{ color: RED }}>7 in 10</span> family doctors say they <u>send</u> the history</Big>
      </>
    );
  } },
  // S6 1 in 3 get it
  { from: S("S6"), render: (f) => {
    const one = W("S6", "one");
    return (
      <>
        <div style={{ position: "absolute", left: 90, right: 90, top: 520, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 260, borderRadius: 130, border: `20px solid ${BLUE}`, background: i === 0 && f >= one ? BLUE : "#FFFFFF" }} />
          ))}
        </div>
        <Big at={one - 2} top={1000} size={80}>About <span style={{ color: BLUE }}>1 in 3</span> specialists say they <u>get</u> it</Big>
      </>
    );
  } },
  // S7 both sides did their part; lost on the way
  { from: S("S7"), render: (f) => {
    const lost = W("S7", "lost");
    const drop = progress(f, lost - 6, 30);
    return (
      <>
        <Plate from={S("S7")} push={0.03}>
          <rect x={60} y={560} width={420} height={70} fill={RED} />
          <rect x={600} y={560} width={420} height={70} fill={BLUE} />
          <text x={270} y={720} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill={INK}>Sent ✓</text>
          <text x={810} y={720} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill={INK}>Received ?</text>
          {/* the gap between the platforms */}
          <rect x={480} y={560} width={120} height={1000} fill="#2A2C31" />
          <Letter x={540} y={600 + drop * 900} s={0.9} rot={drop * 140} o={1 - drop * 0.6} />
        </Plate>
        <Big at={W("S7", "both") - 2} top={240} size={66}>Both sides think they did their part.</Big>
        <Big at={lost - 4} top={1660} size={66} color={RED}>Lost on the way.</Big>
      </>
    );
  } },
  // S8 a referral that travels with the question, history, plan
  { from: S("S8"), render: (f) => {
    const q = W("S8", "question");
    const move = progress(f, W("S8", "travel") - 4, 80);
    const cars: [string, number, string][] = [["QUESTION", q, RED], ["HISTORY", W("S8", "history"), YELLOW], ["PLAN", W("S8", "plan"), GREEN]];
    return (
      <>
        <Plate from={S("S8")} push={0.02}>
          <line x1={-50} y1={1100} x2={1130} y2={1100} stroke={GREEN} strokeWidth={26} />
          <g transform={`translate(${-500 + move * 640} 0)`}>
            {cars.map(([label, at, col], i) => (
              <g key={label} transform={`translate(${i * 300} 0)`} opacity={progress(f, at - 4, 8)}>
                <rect x={0} y={960} width={280} height={120} rx={22} fill={col} />
                <text x={140} y={1036} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={38} fill="#FFFFFF">{label}</text>
              </g>
            ))}
          </g>
        </Plate>
        <Big at={W("S8", "referral") - 2} top={300} size={74}>A referral should travel with…</Big>
      </>
    );
  } },
  // S9 the answer comes back, with the next step and its date
  { from: S("S9"), render: (f) => {
    const back = W("S9", "back");
    const t = progress(f, back - 4, 40);
    return (
      <>
        <Plate from={S("S9")} push={0.03}>
          <g transform="translate(108 392) scale(0.8)">
          <Track d="M 880 420 L 880 860 Q 880 980 760 980 L 320 980 Q 200 980 200 1100 L 200 1500" color={GREEN} at={back - 4} dur={40} />
          <Station x={880} y={420} label="Specialist" side="l" big />
          <Station x={200} y={1500} label="Your doctor" big at={W("S9", "doctor") - 2} color={GREEN} />
          <Letter x={880 - t * 680} y={980 - 70} o={t > 0 ? 1 : 0} />
          </g>
        </Plate>
        <Board title="YOUR NEXT STEP" rows={[["Scan", "4 Dec"], ["Review", "11 Dec"]]} at={W("S9", "next") - 4} top={220} />
      </>
    );
  } },
  // S10 next time
  { from: S("S10"), render: (f) => (
    <>
      <Sign text="Specialist" color={BLUE} at={S("S10")} top={300} sub="Floor 3 · Room 12" />
      <div style={{ position: "absolute", left: 120, right: 120, top: 760, padding: "50px 54px", borderRadius: 40, background: GREEN, color: "#FFFFFF",
        fontFamily: SANS, fontWeight: 800, fontSize: 70, lineHeight: 1.08, opacity: progress(f, W("S10", "nobody") - 3, 8), transform: `rotate(1deg) scale(${0.9 + 0.1 * pop(f, W("S10", "nobody") - 3, 13)})` }}>
        “I've read your history. Let's start from your question.”
      </div>
    </>
  ) },
];

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const line = LINES.find((l) => f >= l.from && f < l.to);
  if (!line) return null;
  const ws = line.words;
  const i = ws.findIndex((w, k) => f >= w.frame - 2 && f < (ws[k + 1]?.frame ?? line.to) - 2);
  if (i < 0) return null;
  const chunks: number[][] = [];
  let cur: number[] = [];
  ws.forEach((w, k) => { cur.push(k); if (cur.length === 4 || /[.,?]$/.test(w.token)) { chunks.push(cur); cur = []; } });
  if (cur.length) chunks.push(cur);
  const chunk = chunks.find((c) => c.includes(i))!;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1760, display: "flex", justifyContent: "center" }}>
      <div style={{ background: INK, color: "#FFFFFF", fontFamily: SANS, fontWeight: 600, fontSize: 38, padding: "10px 22px", borderRadius: 8 }}>
        {chunk.map((k) => ws[k].token).join(" ")}
      </div>
    </div>
  );
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.15 : 0.28) * Math.min(1, f / 20) * Math.min(1, (WHY_DURATION - f) / 30);
};

export const WhyAreYouHere: React.FC = () => {
  const f = useCurrentFrame();
  const shot = [...SHOTS].reverse().find((s) => f >= s.from) ?? SHOTS[0];
  return (
    <AbsoluteFill style={{ background: BG }}>
      <AbsoluteFill>{shot.render(f)}</AbsoluteFill>
      <Captions />
      <CinemaGrade grain={0.06} vignette={0.12} glow="#FFFFFF" />
      <AbsoluteFill style={{ background: BG, opacity: progress(f, WHY_DURATION - 24, 22) }} />
      <VoiceOver take={TAKE} volume={1.25} />
      <Audio src={staticFile("music/2026-11-13-why-are-you-here.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const WHY_COVER = W("S1", "here") + 10;
