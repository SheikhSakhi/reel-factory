import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, pop, progress, wordFrame } from "../../kit";
import { CinemaGrade, Graded } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-27-the-chair/take.json";

// Formats lab F4 (chat drama), dawn living-room version. Dad's phone lies on the wide arm of a sage velvet armchair
// where he slept sitting up, two weeks after a heart-failure discharge. His daughter texts; two voices read the messages.
// Frame 1 is the chair (the hook picture). Cutaways on the same set: the shoes, the weight notebook, the study card,
// the guidance line, the plan with the weight line. Ambient bed, no sound effects. No CTA, no drug or dose advice.

const TAKE = loadTake(takeJson);
const TAIL = 60;
export const CHAIR_DURATION = TAKE.totalFrames + TAIL;
type Line = { id: string; speaker: string; text: string; from: number; to: number };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
const L = (id: string) => LINES.find((l) => l.id === id)!;
const W = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const SANS = BRAND.theme.fontBody;
const SERIF = BRAND.theme.fontDisplay;
const MONO = BRAND.theme.fontMono;
const C = {
  velvet: "#7E9A86", velvetDark: "#5E7A67", velvetLight: "#9DB7A3", wool: "#EFE6D6", woolLine: "#DCCFB8",
  me: "#2F7DF6", them: "#E9E9EE", ink: "#1C1C22", muted: "#8A8A93", paper: "#FBF8F2", red: "#D9483B", teal: "#2E9E8A",
  dawn: "#B9C9E0", sun: "#FFD3A0",
};

// ---------- the set: the armchair arm, top-down ----------

const Blanket: React.FC<{ x: number; y: number; w: number; h: number; r?: number }> = ({ x, y, w, h, r = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${r}deg)`, borderRadius: 40,
    background: `repeating-linear-gradient(90deg, ${C.wool} 0 16px, ${C.woolLine} 16px 24px, ${C.wool} 24px 40px)`,
    boxShadow: "20px 30px 50px #1A222855", overflow: "hidden" }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 50% at 40% 40%, #FFFFFF22, transparent 70%)" }} />
  </div>
);

const Arm: React.FC<{ frame: number; warm?: number }> = ({ frame, warm = 0 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 45% 35%, ${C.velvetLight} 0%, ${C.velvet} 55%, ${C.velvetDark} 100%)` }}>
    {/* velvet nap */}
    <AbsoluteFill style={{ background: "repeating-linear-gradient(92deg, transparent 0 5px, #FFFFFF0A 5px 7px)" }} />
    {/* piping along the arm's edge */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, height: 14, background: C.velvetDark, opacity: 0.6, borderRadius: 7 }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, height: 14, background: C.velvetDark, opacity: 0.6, borderRadius: 7 }} />
    <Blanket x={-140} y={1500} w={760} h={560} r={-8} />
    {/* dawn: cool window light, one warm stripe that grows toward the end */}
    <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.8, background: `linear-gradient(200deg, ${C.dawn} 0%, transparent 60%)` }} />
    <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.35 + 0.5 * warm + 0.05 * Math.sin(frame / 60),
      background: `linear-gradient(118deg, transparent 30%, ${C.sun} 42%, transparent 54%)` }} />
  </AbsoluteFill>
);

// ---------- the phone ----------

const PHONE_W = 820, PHONE_H = 1600;

const Bubble: React.FC<{ line: Line; me: boolean }> = ({ line, me }) => (
  <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", marginBottom: 18 }}>
    <div style={{ maxWidth: 600, padding: "22px 28px", borderRadius: 34, fontFamily: SANS, fontSize: 41, lineHeight: 1.25,
      background: me ? C.me : C.them, color: me ? "#FFFFFF" : C.ink, borderBottomRightRadius: me ? 10 : 34, borderBottomLeftRadius: me ? 34 : 10 }}>
      {line.text}
    </div>
  </div>
);

const Typing: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 18 }}>
    <div style={{ padding: "24px 28px", borderRadius: 34, background: C.them, display: "flex", gap: 10 }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: C.muted, opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame / 6 + i)) }} />)}
    </div>
  </div>
);

const Chat: React.FC<{ frame: number }> = ({ frame }) => {
  const shown = LINES.filter((l) => frame >= l.from - 4);
  const next = LINES.find((l) => l.speaker === "DAUGHTER" && frame < l.from - 4 && frame >= l.from - 24);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, padding: "0 30px", display: "flex", flexDirection: "column" }}>
      {shown.map((l) => (
        <div key={l.id} style={{ opacity: Math.min(1, pop(frame, l.from - 4, 14) * 1.4), transform: `translateY(${(1 - pop(frame, l.from - 4, 14)) * 24}px)` }}>
          <Bubble line={l} me={l.speaker === "DAD"} />
        </div>
      ))}
      {next ? <Typing frame={frame} /> : null}
    </div>
  );
};

const Phone: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ position: "absolute", left: (1080 - PHONE_W) / 2, top: (1920 - PHONE_H) / 2 + 20, width: PHONE_W, height: PHONE_H, borderRadius: 96,
    background: "#141418", padding: 22, boxShadow: "30px 50px 70px #1A222877, 6px 10px 18px #1A222855", transform: "rotate(2deg)" }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 76, overflow: "hidden", background: "#FFFFFF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 210, background: "#F7F7F9", borderBottom: "2px solid #E6E6EB", textAlign: "center" }}>
        <div style={{ width: 84, height: 84, borderRadius: 42, background: "#B88FA6", margin: "70px auto 0", fontFamily: SANS, fontWeight: 700, fontSize: 40, color: "#fff", lineHeight: "84px" }}>P</div>
        <div style={{ fontFamily: SANS, fontSize: 26, color: C.ink, marginTop: 6 }}>Priya</div>
      </div>
      <div style={{ position: "absolute", top: 210, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
        <Chat frame={frame} />
      </div>
      <div style={{ position: "absolute", left: 30, right: 30, bottom: 34, height: 80, borderRadius: 40, border: "2px solid #E0E0E6", fontFamily: SANS, fontSize: 28, color: "#B4B4BC", padding: "22px 30px" }}>Message</div>
    </div>
  </div>
);

// ---------- the room (hook and ending) ----------

const Armchair: React.FC<{ frame: number; folded: number }> = ({ frame, folded }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3C4A5C" /><stop offset="1" stopColor="#56657A" />
      </linearGradient>
      <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8FA6C8" /><stop offset={0.75 - 0.25 * folded} stopColor="#C9D3E4" /><stop offset="1" stopColor="#FFD3A0" />
      </linearGradient>
      <linearGradient id="vel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9DB7A3" /><stop offset="1" stopColor="#5E7A67" />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#wall)" />
    {/* window with dawn */}
    <rect x={600} y={170} width={360} height={620} rx={10} fill="url(#win)" />
    <rect x={776} y={170} width={10} height={620} fill="#3C4A5C" />
    <rect x={600} y={470} width={360} height={10} fill="#3C4A5C" />
    {/* floor */}
    <rect x={0} y={1420} width={1080} height={500} fill="#6B5544" />
    <rect x={0} y={1420} width={1080} height={500} fill="url(#wall)" opacity={0.25} />
    {/* light falling on the floor */}
    <polygon points="600,1420 960,1420 1080,1920 760,1920" fill="#FFE2B8" opacity={0.12 + 0.2 * folded} />
    {/* the armchair */}
    <g transform="translate(140 700)">
      <rect x={60} y={0} width={560} height={560} rx={110} fill="url(#vel)" />
      <rect x={0} y={330} width={160} height={460} rx={70} fill="#6E8C77" />
      <rect x={520} y={330} width={160} height={460} rx={70} fill="#6E8C77" />
      <rect x={120} y={480} width={440} height={260} rx={50} fill="#86A28E" />
      {/* the seat cushion still pressed in from the night */}
      <ellipse cx={340} cy={560} rx={150} ry={40} fill="#5E7A67" opacity={0.55 * (1 - folded)} />
      {/* pillow propped high against the back */}
      <rect x={210} y={150} width={260} height={170} rx={60} fill="#EFE6D6" transform={`rotate(${-6 + 6 * folded} 340 235)`} opacity={1 - 0.9 * folded} />
      {/* blanket: thrown over the arm, then folded on the seat at the end */}
      <path d="M 440 380 Q 560 420 640 520 L 660 820 Q 560 860 470 800 Z" fill="#EFE6D6" opacity={1 - folded} />
      <rect x={200} y={470} width={280} height={70} rx={14} fill="#EFE6D6" opacity={folded} />
      <rect x={60} y={780} width={24} height={90} fill="#3A2C22" />
      <rect x={596} y={780} width={24} height={90} fill="#3A2C22" />
    </g>
    {/* side table with a glass of water */}
    <rect x={850} y={1180} width={170} height={20} rx={6} fill="#4A3A2E" />
    <rect x={925} y={1200} width={20} height={240} fill="#4A3A2E" />
    <rect x={905} y={1110} width={50} height={70} rx={8} fill="#DDE6F0" opacity={0.8} />
    <g opacity={0.25 + 0.05 * Math.sin(frame / 40)}><rect width={1080} height={1920} fill="#1A2638" /></g>
  </svg>
);

const Notification: React.FC<{ frame: number; at: number }> = ({ frame, at }) => (
  <div style={{ position: "absolute", top: 180, left: 50, right: 50, padding: "28px 34px", borderRadius: 40, background: "#FFFFFFE6",
    boxShadow: "0 20px 50px #0A101855", opacity: progress(frame, at, 8), transform: `translateY(${(1 - pop(frame, at, 14)) * -50}px)` }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 28, color: C.muted }}><span>Priya</span><span>6:12 AM</span></div>
    <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, color: C.ink, marginTop: 8 }}>Dad, why did you sleep in the chair?</div>
  </div>
);

const HookChair: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <div style={{ position: "absolute", inset: 0, transform: `scale(${1.04 + frame * 0.0012})`, transformOrigin: "40% 60%" }}><Armchair frame={frame} folded={0} /></div>
    <Notification frame={frame} at={0} />
  </>
);

const EndChair: React.FC<{ frame: number; at: number }> = ({ frame, at }) => {
  const t = progress(frame, at, 50);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1.1 - t * 0.06})`, transformOrigin: "40% 60%" }}><Armchair frame={frame} folded={t} /></div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1600, textAlign: "center", fontFamily: SERIF, fontSize: 60, color: "#FFF4E2",
        opacity: progress(frame, W("S16", "bed") - 2, 14) }}>Tonight, the bed.</div>
    </>
  );
};

// ---------- cutaways ----------

const Shoe: React.FC<{ x: number; flip?: boolean }> = ({ x, flip }) => (
  <svg x={x} width={420} height={260} viewBox="0 0 420 260" style={{ position: "absolute", left: x, top: 820, transform: flip ? "scaleX(-1)" : undefined }}>
    <path d="M 20 200 Q 20 120 110 110 L 190 70 Q 230 60 250 100 L 380 170 Q 410 190 400 220 L 30 222 Z" fill="#3B2A20" />
    <path d="M 20 222 L 402 222 L 400 240 L 24 240 Z" fill="#1E1510" />
    {/* laces pulled wide open: the shoe no longer closes */}
    {[0, 1, 2, 3].map((i) => <line key={i} x1={150 + i * 22} y1={100 + i * 8} x2={220 + i * 22} y2={84 + i * 8} stroke="#EFE6D6" strokeWidth={5} strokeLinecap="round" />)}
    <path d="M 150 100 Q 120 40 170 30" stroke="#EFE6D6" strokeWidth={5} fill="none" />
  </svg>
);

const Shoes: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #56657A 0%, #56657A 52%, #6B5544 52%, #5A4638 100%)" }} />
    <div style={{ position: "absolute", left: 120, right: 120, top: 1000, height: 240, borderRadius: 24, background: "#8C7A63", opacity: 0.7 }} />
    <Shoe x={120} />
    <Shoe x={520} flip />
    <div style={{ position: "absolute", left: 80, right: 80, top: 1360, textAlign: "center", fontFamily: SERIF, fontSize: 58, color: "#FFF4E2", opacity: progress(frame, W("S4", "puffy") - 4, 10) }}>
      They fit last month.
    </div>
  </>
);

const DAYS: [string, string][] = [["Mon", "71.8"], ["Tue", "72.3"], ["Wed", "72.9"], ["Thu", "73.6"], ["Fri", "74.1"], ["Sat", "74.6"], ["Sun", "74.9"]];

const Notebook: React.FC<{ frame: number }> = ({ frame }) => {
  const start = W("S8", "notebook") - 6;
  const circle = W("S8", "three");
  const me = W("S10", "me") - 2;
  return (
    <>
      <Arm frame={frame} />
      <div style={{ position: "absolute", left: 130, top: 300, width: 820, height: 1180, background: C.paper, borderRadius: 12, padding: "70px 70px 0 120px",
        boxShadow: "24px 36px 60px #1A222888", transform: "rotate(-2deg)",
        backgroundImage: "repeating-linear-gradient(0deg, transparent 0 86px, #C9D6E8 86px 88px)", backgroundPositionY: 52 }}>
        <div style={{ position: "absolute", left: 90, top: 0, bottom: 0, width: 3, background: "#E7A3A3" }} />
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 50, color: "#2A3A6A" }}>Morning weight (kg)</div>
        {DAYS.map(([d, w], i) => (
          <div key={d} style={{ display: "flex", justifyContent: "space-between", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 54, color: "#2A3A6A",
            marginTop: 24, opacity: progress(frame, start + i * 4, 8) }}>
            <span>{d}</span><span>{w}</span>
          </div>
        ))}
        <svg width={260} height={130} style={{ position: "absolute", right: 30, top: 880 }} viewBox="0 0 260 130">
          <ellipse cx={130} cy={65} rx={120} ry={52} fill="none" stroke={C.red} strokeWidth={6}
            strokeDasharray={600} strokeDashoffset={600 * (1 - progress(frame, circle, 14))} />
        </svg>
        <div style={{ position: "absolute", right: 94, top: 912, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: C.red, opacity: progress(frame, circle + 6, 8) }}>+3.1</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1580, textAlign: "center", fontFamily: SERIF, fontSize: 64, color: "#FFFFFF",
        opacity: progress(frame, W("S9", "who") - 2, 10) }}>
        <span style={{ background: "#1C2A33CC", padding: "14px 34px", borderRadius: 18 }}>
        {frame >= me ? "Read by: him." : "Read by: ?"}</span>
      </div>
    </>
  );
};

const StudyCard: React.FC<{ frame: number }> = ({ frame }) => {
  const five = W("S11", "five");
  const half = W("S11", "half");
  return (
    <>
      <Arm frame={frame} />
      <div style={{ position: "absolute", left: 100, top: 300, width: 880, height: 1250, background: C.paper, borderRadius: 10, padding: "70px 64px",
        boxShadow: "24px 36px 60px #1A222888", transform: "rotate(1.2deg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.14em", color: C.muted }}>NEW ENGLAND JOURNAL OF MEDICINE · 2009</div>
        <div style={{ fontFamily: SERIF, fontSize: 56, lineHeight: 1.1, color: C.ink, marginTop: 20 }}>Rehospitalizations among nearly 12 million patients</div>
        <div style={{ display: "flex", gap: 22, marginTop: 70, justifyContent: "center" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <svg key={i} width={130} height={210} viewBox="0 0 60 130">
              <circle cx={30} cy={22} r={20} fill={i === 4 && frame >= five ? C.red : "#CFC8BA"} />
              <path d="M 4 128 L 4 70 Q 4 48 30 48 Q 56 48 56 70 L 56 128 Z" fill={i === 4 && frame >= five ? C.red : "#CFC8BA"} />
            </svg>
          ))}
        </div>
        <div style={{ textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 92, color: C.red, marginTop: 20, opacity: progress(frame, five - 4, 8) }}>1 in 5</div>
        <div style={{ textAlign: "center", fontFamily: SANS, fontSize: 40, color: C.ink, opacity: progress(frame, five, 8) }}>back in hospital within 30 days</div>
        <div style={{ margin: "60px auto 0", width: 640, padding: "28px 30px", borderRadius: 20, border: `4px solid ${C.red}`, textAlign: "center",
          fontFamily: SANS, fontWeight: 600, fontSize: 40, lineHeight: 1.3, color: C.ink, opacity: progress(frame, half - 4, 10) }}>
          Half of them saw no doctor in between
        </div>
      </div>
    </>
  );
};

const Guidance: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <Arm frame={frame} />
    <div style={{ position: "absolute", left: 110, top: 520, width: 860, padding: "70px 60px", background: "#FFFFFF", borderRadius: 34,
      boxShadow: "24px 36px 60px #1A222888", transform: "rotate(-1deg)", textAlign: "center" }}>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.14em", color: C.muted }}>HEART FAILURE GUIDANCE</div>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 120, color: C.ink, marginTop: 30, opacity: progress(frame, W("S13", "two") - 4, 8) }}>+2 kg</div>
      <div style={{ fontFamily: SANS, fontSize: 50, color: C.ink, opacity: progress(frame, W("S13", "three") - 4, 8) }}>in 3 days</div>
      <div style={{ fontFamily: SERIF, fontSize: 64, color: C.teal, marginTop: 40, opacity: progress(frame, W("S13", "tell") - 4, 8) }}>tell your doctor</div>
      <div style={{ fontFamily: SANS, fontSize: 36, color: C.muted, marginTop: 30, opacity: progress(frame, W("S13", "wait") - 4, 8) }}>not at the next visit</div>
      <div style={{ fontFamily: SANS, fontSize: 22, color: C.muted, marginTop: 40 }}>Heart Failure Association (ESC) · your care team sets your own line</div>
    </div>
  </>
);

const PlanCard: React.FC<{ frame: number }> = ({ frame }) => {
  const s = L("S14").from;
  const cross = W("S14", "cross");
  const calls = W("S14", "calls");
  const changes = W("S14", "changes");
  const pts = DAYS.map(([, w], i) => [60 + i * 120, 330 - (parseFloat(w) - 71.5) * 70] as const);
  const shownPts = Math.max(1, Math.min(7, Math.floor((frame - s) / 10) + 1));
  const line = pts.slice(0, shownPts).map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  const rows: [string, string, number][] = [
    ["07:40", "Dr. Mehta sees the weight line", cross],
    ["08:15", "She calls him", calls],
    ["Today", "Plan changed, recheck tomorrow", changes],
  ];
  return (
    <>
      <Arm frame={frame} />
      <div style={{ position: "absolute", left: 90, top: 280, width: 900, height: 1300, background: "#FFFFFF", borderRadius: 34, overflow: "hidden",
        boxShadow: "24px 36px 60px #1A222888", transform: "rotate(-1deg)" }}>
        <div style={{ background: C.teal, color: "#fff", padding: "40px 50px" }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.14em", opacity: 0.85 }}>BETWEEN VISITS</div>
          <div style={{ fontFamily: SERIF, fontSize: 70, marginTop: 8 }}>Morning weight</div>
        </div>
        <svg width={900} height={420} viewBox="0 0 900 420">
          <line x1={40} x2={860} y1={330 - (71.8 + 2 - 71.5) * 70} y2={330 - (71.8 + 2 - 71.5) * 70} stroke={C.red} strokeWidth={4} strokeDasharray="14 12" />
          <text x={850} y={330 - (73.8 - 71.5) * 70 - 14} textAnchor="end" fontFamily={SANS} fontSize={26} fill={C.red}>+2 kg line</text>
          <path d={line} fill="none" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
          {pts.slice(0, shownPts).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={11} fill={parseFloat(DAYS[i][1]) > 73.8 && frame >= cross - 4 ? C.red : C.ink} />
          ))}
        </svg>
        {rows.map(([a, b, at], i) => (
          <div key={a} style={{ padding: "26px 50px", borderTop: "2px solid #F0F0F2", opacity: 0.2 + 0.8 * progress(frame, at - 3, 8),
            background: frame >= at - 3 && (i === rows.length - 1 || frame < rows[i + 1][2] - 3) ? "#EAF6F3" : "transparent", display: "flex", gap: 30 }}>
            <div style={{ fontFamily: MONO, fontSize: 30, color: C.muted, width: 120 }}>{a}</div>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 40, color: C.ink }}>{b}</div>
          </div>
        ))}
      </div>
    </>
  );
};

const cutaway = (f: number): React.ReactNode | null => {
  if (f < L("S2").from - 2) return <HookChair frame={f} />;
  if (f >= W("S4", "shoes") - 4 && f < L("S4").to) return <Shoes frame={f} />;
  if (f >= W("S8", "notebook") - 6 && f < L("S10").to + 8) return <Notebook frame={f} />;
  if (f >= W("S11", "study") - 4 && f < L("S11").to) return <StudyCard frame={f} />;
  if (f >= L("S13").from - 2 && f < L("S13").to) return <Guidance frame={f} />;
  if (f >= L("S14").from - 2 && f < L("S14").to) return <PlanCard frame={f} />;
  if (f >= W("S16", "tonight") - 4) return <EndChair frame={f} at={W("S16", "tonight") - 4} />;
  return null;
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.14 : 0.26) * Math.min(1, f / 20) * Math.min(1, (CHAIR_DURATION - f) / 30);
};

export const TheChair: React.FC = () => {
  const f = useCurrentFrame();
  const cut = cutaway(f);
  const push = 1 + Math.min(1, f / CHAIR_DURATION) * 0.07;
  return (
    <AbsoluteFill style={{ background: C.velvet }}>
      <Graded warmth={0.02} contrast={1.03} brightness={1.02}>
        <AbsoluteFill style={{ transform: `scale(${push}) translateY(${-f * 0.015}px)`, transformOrigin: "50% 60%" }}>
          {cut ? cut : (<><Arm frame={f} /><Phone frame={f} /></>)}
        </AbsoluteFill>
      </Graded>
      <CinemaGrade rays haze={0.03} grain={0.06} vignette={0.3} glow="#FFE2B8" />
      <AbsoluteFill style={{ background: "#0E141C", opacity: progress(f, CHAIR_DURATION - 26, 24) }} />
      <VoiceOver take={TAKE} volume={1.2} />
      <Audio src={staticFile("music/2026-11-27-the-chair.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const CHAIR_COVER = 20;
