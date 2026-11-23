import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, pop, progress, wordFrame } from "../../kit";
import { CinemaGrade } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-23-results-are-ready/take.json";

// Formats lab F3 (B-roll story), premium medical night UI: frosted-glass cards floating in soft navy light with
// bokeh, one red value, one warm doctor's note at the end. A new picture every 1-2 s. One narrator (Emma), night
// ambient bed, no sound effects. Personal moment -> the linking question -> the fact -> an answering ending. No CTA.

const TAKE = loadTake(takeJson);
const TAIL = 45;
export const RESULTS_DURATION = TAKE.totalFrames + TAIL;
type Word = { token: string; frame: number; endFrame: number };
type Line = { id: string; from: number; to: number; words: Word[] };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
const L = (id: string) => LINES.find((l) => l.id === id)!;
const W = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const SANS = BRAND.theme.fontBody;
const SERIF = BRAND.theme.fontDisplay;
const MONO = BRAND.theme.fontMono;
const C = { text: "#EEF3FF", dim: "#EEF3FF99", faint: "#EEF3FF55", red: "#FF6B6B", warm: "#F6C177", teal: "#7FE0D0" };

// ---------- the night background and glass ----------

const BOKEH = Array.from({ length: 16 }).map((_, i) => ({ x: (i * 271) % 1080, y: (i * 457) % 1920, r: 60 + (i % 5) * 40, c: i % 3 === 0 ? "#3B6FD8" : i % 3 === 1 ? "#6B4FD8" : "#2FA3B8" }));

const Night: React.FC<{ f: number; warm?: number }> = ({ f, warm = 0 }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 35%, #172A55 0%, #0B1530 55%, #050A18 100%)" }}>
    {BOKEH.map((b, i) => (
      <div key={i} style={{ position: "absolute", left: b.x - b.r + Math.sin(f / 90 + i) * 20, top: b.y - b.r + Math.cos(f / 110 + i) * 16, width: b.r * 2, height: b.r * 2,
        borderRadius: "50%", background: b.c, opacity: 0.16, filter: "blur(30px)" }} />
    ))}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 40% at 50% 70%, #F6C17733 0%, transparent 70%)", opacity: warm }} />
  </AbsoluteFill>
);

const Glass: React.FC<{ children: React.ReactNode; top: number; at: number; left?: number; right?: number; pad?: string; tint?: string }> = ({ children, top, at, left = 80, right = 80, pad = "40px 44px", tint = "#FFFFFF14" }) => {
  const f = useCurrentFrame();
  const p = pop(f, at, 14);
  return (
    <div style={{ position: "absolute", left, right, top, padding: pad, borderRadius: 36, background: tint, border: "1.5px solid #FFFFFF2A",
      backdropFilter: "blur(18px)", boxShadow: "0 30px 80px #00000066, inset 0 1px 0 #FFFFFF33", opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 30}px) scale(${0.97 + 0.03 * p})` }}>
      {children}
    </div>
  );
};

const Big: React.FC<{ children: React.ReactNode; top: number; at: number; size?: number; color?: string; serif?: boolean }> = ({ children, top, at, size = 80, color = C.text, serif }) => {
  const f = useCurrentFrame();
  const p = pop(f, at, 13);
  return <div style={{ position: "absolute", left: 80, right: 80, top, textAlign: "center", fontFamily: serif ? SERIF : SANS, fontWeight: serif ? 400 : 800, fontSize: size, lineHeight: 1.08,
    letterSpacing: serif ? 0 : "-0.02em", color, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 24}px)` }}>{children}</div>;
};

// ---------- pieces ----------

const LockScreen: React.FC<{ f: number; at: number; note?: boolean }> = ({ f, at, note }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", fontFamily: SANS, fontWeight: 200, fontSize: 230, letterSpacing: "-0.03em", color: C.text, opacity: progress(f, at, 10) }}>23:40</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 530, textAlign: "center", fontFamily: SANS, fontSize: 38, color: C.dim, opacity: progress(f, at, 10) }}>Tuesday</div>
    <Glass top={760} at={at + (note ? 10 : W("S1", "my") - 4)} tint="#FFFFFF1C">
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <div style={{ width: 70, height: 70, borderRadius: 18, background: "#3B6FD8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 40, color: "#fff" }}>+</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: SANS, fontSize: 28, color: C.dim }}>Patient portal · now</div>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 40, color: C.text, marginTop: 4 }}>Your results are ready</div>
          {note ? <div style={{ fontFamily: SANS, fontSize: 32, color: C.warm, marginTop: 6 }}>with a note from Dr. Rao</div> : null}
        </div>
      </div>
    </Glass>
  </>
);

const ROWS: [string, string, string, boolean][] = [
  ["Haemoglobin", "13.8", "g/dL", false], ["Glucose, fasting", "112", "mg/dL", false], ["HbA1c", "7.9", "%", true], ["Creatinine", "0.9", "mg/dL", false], ["LDL cholesterol", "104", "mg/dL", false],
];

const ResultsCard: React.FC<{ f: number; at: number; focus?: number; top?: number }> = ({ f, at, focus = 0, top = 380 }) => (
  <Glass top={top} at={at}>
    <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.16em", color: C.faint }}>LAB RESULTS · 23:40</div>
    {ROWS.map(([name, v, u, red], i) => (
      <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "22px 0", borderTop: i ? "1px solid #FFFFFF1A" : "none", marginTop: i ? 0 : 16,
        opacity: progress(f, at + 4 + i * 3, 8) * (focus > 0 && !red ? 1 - focus * 0.7 : 1), transform: red && focus > 0 ? `scale(${1 + focus * 0.08})` : "none", transformOrigin: "50% 50%" }}>
        <span style={{ fontFamily: SANS, fontSize: 38, color: red ? C.red : C.text, fontWeight: red ? 700 : 400 }}>{name}</span>
        <span style={{ fontFamily: SANS, fontSize: 44, fontWeight: 700, color: red ? C.red : C.text }}>{v} <span style={{ fontSize: 28, fontWeight: 400, color: C.dim }}>{u}</span>{red ? <span style={{ fontSize: 28, marginLeft: 10 }}>▲ H</span> : null}</span>
      </div>
    ))}
  </Glass>
);

// ---------- shots ----------

type Shot = { from: number; render: (f: number) => React.ReactNode };
const S = (id: string) => L(id).from;

const SHOTS: Shot[] = [
  { from: 0, render: (f) => <LockScreen f={f} at={0} /> },
  { from: S("S2"), render: (f) => <ResultsCard f={f} at={S("S2")} focus={progress(f, W("S2", "red"), 10)} /> },
  { from: W("S2", "no") - 3, render: (f) => (
    <>
      <ResultsCard f={f} at={S("S2") - 30} focus={1} top={300} />
      <Glass top={1120} at={W("S2", "no") - 3} tint="#FFFFFF0E">
        <div style={{ fontFamily: SANS, fontSize: 30, color: C.faint }}>Doctor's comment</div>
        <div style={{ fontFamily: SANS, fontSize: 44, color: C.faint, marginTop: 8 }}>—</div>
      </Glass>
    </>
  ) },
  { from: W("S2", "just") - 3, render: (f) => <Big top={760} at={W("S2", "just") - 3} size={170} color={C.red}>7.9 %</Big> },
  { from: S("S3"), render: (f) => (
    <>
      <ResultsCard f={f} at={S("S3") - 30} focus={1} top={300} />
      <Big top={1180} at={W("S3", "twelve") - 3} size={150} color={C.text}>×{Math.min(12, Math.max(1, Math.round((f - W("S3", "twelve")) / 2) + 1))}</Big>
    </>
  ) },
  { from: W("S3", "searched") - 3, render: (f) => {
    const q = "HbA1c 7.9 what does it mean";
    const typed = q.slice(0, Math.max(0, Math.round((f - W("S3", "searched")) * 1.4)));
    return (
      <>
        <Glass top={520} at={W("S3", "searched") - 3} pad="30px 40px">
          <div style={{ fontFamily: SANS, fontSize: 40, color: C.text }}>🔍 {typed}<span style={{ opacity: Math.floor(f / 12) % 2 }}>|</span></div>
        </Glass>
        {["Complications of high HbA1c", "Is 7.9 dangerous?", "Forum: my result was red too"].map((t, i) => (
          <Glass key={t} top={760 + i * 170} at={W("S3", "searched") + 10 + i * 5} pad="26px 40px" tint="#FFFFFF0C">
            <div style={{ fontFamily: SANS, fontSize: 34, color: C.dim }}>{t}</div>
          </Glass>
        ))}
      </>
    );
  } },
  { from: W("S3", "didn't") - 6, render: (f) => {
    const times = ["00:40", "01:55", "03:10", "04:25"];
    const k = Math.min(times.length - 1, Math.floor((f - W("S3", "didn't") + 6) / 10));
    return <Big top={700} at={W("S3", "didn't") - 6} size={210} color={C.text}><span style={{ fontWeight: 200 }}>{times[k]}</span></Big>;
  } },
  { from: S("S4"), render: () => (
    <Glass top={640} at={S("S4")} pad="60px 54px">
      <div style={{ fontFamily: SERIF, fontSize: 84, lineHeight: 1.08, color: C.text, textAlign: "center" }}>Who was supposed to tell me <i>what it means?</i></div>
    </Glass>
  ) },
  { from: S("S5"), render: (f) => {
    const eight = W("S5", "eight");
    const all = W("S5", "almost");
    return (
      <>
        <Glass top={260} at={S("S5") + 2} pad="30px 40px">
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.14em", color: C.faint }}>JAMA NETWORK OPEN · 2023</div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: C.text, marginTop: 8 }}>8,139 patients surveyed</div>
        </Glass>
        <div style={{ position: "absolute", left: 120, right: 120, top: 620, display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 14, opacity: progress(f, eight, 10) }}>
          {Array.from({ length: 100 }).map((_, i) => <div key={i} style={{ height: 70, borderRadius: 35, background: i < 96 && f >= all + i * 0.3 ? C.teal : "#FFFFFF22" }} />)}
        </div>
        <Big top={1560} at={all} size={58}>almost all wanted results <span style={{ color: C.teal }}>right away</span></Big>
      </>
    );
  } },
  { from: S("S6"), render: (f) => {
    const one = W("S6", "one");
    return (
      <>
        <ResultsCard f={f} at={S("S6") - 30} focus={1} top={200} />
        <div style={{ position: "absolute", left: 140, right: 140, top: 980, display: "flex", justifyContent: "space-between" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <svg key={i} width={110} height={200} viewBox="0 0 60 110" style={{ opacity: progress(f, W("S6", "about") + i * 2, 6) }}>
              <circle cx={30} cy={20} r={18} fill={i === 0 && f >= one ? C.red : "#FFFFFF44"} />
              <path d="M 4 108 L 4 62 Q 4 42 30 42 Q 56 42 56 62 L 56 108 Z" fill={i === 0 && f >= one ? C.red : "#FFFFFF44"} />
            </svg>
          ))}
        </div>
        <Big top={1260} at={one} size={60}><span style={{ color: C.red }}>1 in 6</span> more worried after reading it</Big>
      </>
    );
  } },
  { from: S("S7"), render: (f) => (
    <>
      <Big top={600} at={S("S7") + 2} size={130}>Fast <span style={{ color: C.teal }}>✓</span></Big>
      <Big top={860} at={W("S7", "alone") - 3} size={130} color={C.red}>Alone ✕</Big>
    </>
  ) },
  { from: S("S8"), render: (f) => {
    const rows: [string, string, number][] = [
      ["What it means", "Slightly above your target.", W("S8", "means")],
      ["Whether it matters", "Not urgent. No change tonight.", W("S8", "matters")],
      ["What happens next", "We adjust at your visit on 4 Dec. Keep your morning readings.", W("S8", "next")],
    ];
    return (
      <>
        <Night f={f} warm={progress(f, S("S8"), 30)} />
        <div style={{ position: "absolute", inset: 0, transform: "scale(0.82)", transformOrigin: "50% 18%" }}>
          <ResultsCard f={f} at={S("S8") - 30} top={120} />
        </div>
        <Glass top={920} at={W("S8", "line") - 4} tint="#F6C1772A">
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, color: C.warm }}>Note from Dr. Rao</div>
          {rows.map(([k, v, at]) => (
            <div key={k} style={{ marginTop: 18, opacity: progress(f, at - 6, 8) }}>
              <div style={{ fontFamily: SANS, fontSize: 26, color: C.dim }}>{k}</div>
              <div style={{ fontFamily: SANS, fontSize: 38, color: C.text, lineHeight: 1.25 }}>{v}</div>
            </div>
          ))}
        </Glass>
      </>
    );
  } },
  { from: S("S9"), render: (f) => (
    <>
      <Night f={f} warm={0.7} />
      <LockScreen f={f} at={S("S9")} note />
    </>
  ) },
];

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const line = LINES.find((l) => f >= l.from && f < l.to);
  if (!line || line.id === "S4" || line.id === "S7") return null;
  const ws = line.words;
  const i = ws.findIndex((w, k) => f >= w.frame - 2 && f < (ws[k + 1]?.frame ?? line.to) - 2);
  if (i < 0) return null;
  const chunks: number[][] = [];
  let cur: number[] = [];
  ws.forEach((w, k) => { cur.push(k); if (cur.length === 4 || /[.,?:]$/.test(w.token)) { chunks.push(cur); cur = []; } });
  if (cur.length) chunks.push(cur);
  const chunk = chunks.find((c) => c.includes(i))!;
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 1740, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 42, color: C.text, textShadow: "0 2px 12px #000000AA" }}>
      {chunk.map((k) => <span key={k} style={{ opacity: k <= i ? 1 : 0.4 }}>{ws[k].token} </span>)}
    </div>
  );
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.15 : 0.28) * Math.min(1, f / 20) * Math.min(1, (RESULTS_DURATION - f) / 30);
};

export const ResultsAreReady: React.FC = () => {
  const f = useCurrentFrame();
  const shot = [...SHOTS].reverse().find((s) => f >= s.from) ?? SHOTS[0];
  const push = 1 + ((f - shot.from) / 300) * 0.04;
  return (
    <AbsoluteFill>
      <Night f={f} />
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 45%" }}>{shot.render(f)}</AbsoluteFill>
      <Captions />
      <CinemaGrade grain={0.06} vignette={0.35} glow="#3B6FD8" />
      <AbsoluteFill style={{ background: "#050A18", opacity: progress(f, RESULTS_DURATION - 24, 22) }} />
      <VoiceOver take={TAKE} volume={1.25} />
      <Audio src={staticFile("music/2026-11-23-results-are-ready.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const RESULTS_COVER = W("S2", "red") + 12;
