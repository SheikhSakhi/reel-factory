import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, pop, progress, wordFrame } from "../../kit";
import { CinemaGrade, Graded } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-09-all-fine-i-think/take.json";

// Formats lab F4 (chat drama), variation of the winner (call-from-april): an evening in the car outside the clinic, rain
// on the windscreen, the father's phone in a dashboard mount. Father and son text; two voices. Cutaways on the passenger
// seat for the proof. The ending answers: the plan, written, from the same doctor, with the next date and a way to ask.
// Ambient bed, no sound effects. No CTA.

const TAKE = loadTake(takeJson);
const TAIL = 50;
export const FINE_DURATION = TAKE.totalFrames + TAIL;
type Line = { id: string; speaker: string; text: string; from: number; to: number };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
const L = (id: string) => LINES.find((l) => l.id === id)!;
const W = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const SANS = BRAND.theme.fontBody;
const SERIF = BRAND.theme.fontDisplay;
const MONO = BRAND.theme.fontMono;
const C = { me: "#2F7DF6", them: "#E9E9EE", ink: "#1C1C22", muted: "#8A8A93", paper: "#FBF8F2", amber: "#F2B35B", teal: "#2E9E8A" };

// ---------- the car, the rain ----------

const DROPS = Array.from({ length: 70 }).map((_, i) => ({ x: (i * 397) % 1080, y: (i * 613) % 1100, r: 4 + (i % 5) * 2.4, speed: 0.4 + (i % 7) * 0.25 }));
const LIGHTS = [
  { x: 180, y: 360, r: 120, c: "#F2B35B" }, { x: 420, y: 300, r: 70, c: "#FFFFFF" }, { x: 700, y: 420, r: 150, c: "#7FB7FF" },
  { x: 930, y: 330, r: 90, c: "#F2B35B" }, { x: 560, y: 520, r: 60, c: "#FF6B5A" }, { x: 300, y: 560, r: 80, c: "#9FE0C8" },
];

const Car: React.FC<{ frame: number }> = ({ frame }) => {
  // a wiper sweep every ~8 s clears the drops for a moment
  const cycle = frame % 240;
  const wipe = cycle < 26 ? cycle / 26 : 0;
  const clear = cycle < 40 ? Math.max(0, 1 - Math.abs(cycle - 22) / 22) : 0;
  return (
    <AbsoluteFill style={{ background: "#0E1420" }}>
      {/* the clinic and the street, out of focus through the windscreen */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #121A2B 0%, #1B2538 45%, #1A1F2A 70%, #0B0E14 100%)" }} />
      {LIGHTS.map((l, i) => (
        <div key={i} style={{ position: "absolute", left: l.x - l.r, top: l.y - l.r, width: l.r * 2, height: l.r * 2, borderRadius: "50%",
          background: `radial-gradient(circle, ${l.c}AA 0%, ${l.c}33 45%, transparent 70%)`, filter: "blur(8px)", opacity: 0.8 + 0.15 * Math.sin(frame / 40 + i) }} />
      ))}
      <div style={{ position: "absolute", left: 300, top: 180, width: 480, height: 90, borderRadius: 10, background: "#E8F0FF22", filter: "blur(10px)" }} />
      {/* rain on the glass */}
      <svg width={1080} height={1150} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - clear * 0.85 }}>
        {DROPS.map((d, i) => {
          const y = (d.y + frame * d.speed) % 1150;
          return (
            <g key={i}>
              <ellipse cx={d.x} cy={y} rx={d.r} ry={d.r * 1.25} fill="#FFFFFF22" stroke="#FFFFFF55" strokeWidth={1.5} />
              <ellipse cx={d.x - d.r * 0.3} cy={y - d.r * 0.4} rx={d.r * 0.3} ry={d.r * 0.3} fill="#FFFFFFAA" />
            </g>
          );
        })}
      </svg>
      {/* the wiper */}
      {wipe > 0 ? (
        <div style={{ position: "absolute", left: 160, top: 1080, width: 980, height: 14, borderRadius: 7, background: "#06080C",
          transformOrigin: "0% 50%", transform: `rotate(${-8 - Math.sin(wipe * Math.PI) * 120}deg)` }} />
      ) : null}
      {/* the dashboard */}
      <div style={{ position: "absolute", left: -60, right: -60, top: 1080, bottom: 0, borderRadius: "60% 60% 0 0 / 90px 90px 0 0",
        background: "linear-gradient(180deg, #23252B 0%, #15161A 40%, #0C0D10 100%)", boxShadow: "0 -20px 60px #00000099" }} />
      <div style={{ position: "absolute", left: 80, top: 1180, width: 230, height: 70, borderRadius: 14, background: "#0A0B0E", border: "2px solid #2B2E35" }}>
        <div style={{ fontFamily: MONO, fontSize: 30, color: C.amber, textAlign: "center", lineHeight: "70px", opacity: 0.85 }}>18:47</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- the phone ----------

const PHONE_W = 720, PHONE_H = 1400;

const Bubble: React.FC<{ line: Line; me: boolean }> = ({ line, me }) => (
  <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", marginBottom: 18 }}>
    <div style={{ maxWidth: 580, padding: "22px 28px", borderRadius: 34, fontFamily: SANS, fontSize: 40, lineHeight: 1.25,
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

const PLAN_ROWS: [string, string][] = [
  ["Changed today", "your diabetes tablet"],
  ["How to take it", "as on the label, with dinner"],
  ["Each morning", "check your sugar, reply with the number"],
  ["Next visit", "2 December, 10:30"],
  ["Questions", "reply here. Dr. Mehta reads them"],
];

const PlanMessage: React.FC = () => (
  <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 18 }}>
    <div style={{ width: 600, borderRadius: 28, overflow: "hidden", background: "#FFFFFF", border: "2px solid #E3E3E8" }}>
      <div style={{ background: C.teal, color: "#fff", padding: "16px 24px", fontFamily: SANS, fontWeight: 700, fontSize: 30 }}>Your plan · Dr. Mehta</div>
      {PLAN_ROWS.slice(0, 3).map(([a, b]) => (
        <div key={a} style={{ padding: "12px 24px", borderBottom: "1px solid #EEE" }}>
          <div style={{ fontFamily: SANS, fontSize: 22, color: C.muted }}>{a}</div>
          <div style={{ fontFamily: SANS, fontSize: 28, color: C.ink }}>{b}</div>
        </div>
      ))}
      <div style={{ padding: "12px 24px", fontFamily: SANS, fontSize: 24, color: C.teal }}>+ 2 more</div>
    </div>
  </div>
);

type Item = { key: string; at: number; el: React.ReactNode };
const ITEMS: Item[] = [
  ...LINES.map((l) => ({ key: l.id, at: l.from - 4, el: <Bubble line={l} me={l.speaker === "DAD"} /> })),
  { key: "plan", at: W("S10", "from") - 2, el: <PlanMessage /> },
].sort((a, b) => a.at - b.at);

const Chat: React.FC<{ frame: number }> = ({ frame }) => {
  const shown = ITEMS.filter((it) => frame >= it.at);
  const nextSon = LINES.find((l) => l.speaker === "SON" && frame < l.from - 4 && frame >= l.from - 24);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 140, padding: "0 28px", display: "flex", flexDirection: "column" }}>
      {shown.map((it) => (
        <div key={it.key} style={{ opacity: Math.min(1, pop(frame, it.at, 14) * 1.4), transform: `translateY(${(1 - pop(frame, it.at, 14)) * 24}px)` }}>{it.el}</div>
      ))}
      {nextSon ? <Typing frame={frame} /> : null}
    </div>
  );
};

const Phone: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ position: "absolute", left: (1080 - PHONE_W) / 2, top: 260, width: PHONE_W, height: PHONE_H, borderRadius: 92, background: "#141418", padding: 20,
    boxShadow: "0 40px 80px #000000AA", transform: `rotate(${0.8 + Math.sin(frame / 90) * 0.3}deg)` }}>
    {/* the mount's arms */}
    <div style={{ position: "absolute", left: -26, top: 600, width: 26, height: 200, borderRadius: 8, background: "#2A2C32" }} />
    <div style={{ position: "absolute", right: -26, top: 600, width: 26, height: 200, borderRadius: 8, background: "#2A2C32" }} />
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 74, overflow: "hidden", background: "#FFFFFF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "#F7F7F9", borderBottom: "2px solid #E6E6EB", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: "#7D93B2", margin: "66px auto 0", fontFamily: SANS, fontWeight: 700, fontSize: 38, color: "#fff", lineHeight: "80px" }}>R</div>
        <div style={{ fontFamily: SANS, fontSize: 26, color: C.ink, marginTop: 4 }}>Ravi</div>
      </div>
      <div style={{ position: "absolute", top: 200, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
        <Chat frame={frame} />
      </div>
      <div style={{ position: "absolute", left: 28, right: 28, bottom: 32, height: 78, borderRadius: 40, border: "2px solid #E0E0E6", fontFamily: SANS, fontSize: 28, color: "#B4B4BC", padding: "21px 30px" }}>Message</div>
      {/* the screen catches a little of the street light */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, #FFFFFF14 0%, transparent 40%)" }} />
    </div>
  </div>
);

// ---------- cutaways on the passenger seat ----------

const Seat: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: "repeating-linear-gradient(90deg, #2A2C33 0 6px, #24262C 6px 12px)" }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 60% 30%, #F2B35B22 0%, transparent 60%)" }} />
    {children}
  </AbsoluteFill>
);

const ReviewCard: React.FC<{ frame: number }> = ({ frame }) => {
  const forty = W("S6", "forty");
  const half = W("S7", "half");
  const forgotten = Math.round(40 + 40 * progress(frame, forty, W("S6", "percent") - forty + 6));
  return (
    <Seat>
      <div style={{ position: "absolute", left: 100, top: 330, width: 880, height: 1180, background: C.paper, borderRadius: 10, padding: "70px 64px",
        boxShadow: "24px 36px 60px #00000088", transform: "rotate(-1.5deg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.14em", color: C.muted }}>KESSELS · J R SOC MED · 2003 · REVIEW</div>
        <div style={{ fontFamily: SERIF, fontSize: 64, lineHeight: 1.08, color: C.ink, marginTop: 22 }}>Patients' memory for medical information</div>
        <div style={{ marginTop: 60, height: 70, borderRadius: 35, background: "#ECE6DA", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${progress(frame, forty, 10) * forgotten}%`, background: "#C9C2B5" }} />
        </div>
        <div style={{ textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 110, color: C.ink, marginTop: 30, opacity: progress(frame, forty, 8) }}>40–80%</div>
        <div style={{ textAlign: "center", fontFamily: SANS, fontSize: 40, color: C.ink, opacity: progress(frame, W("S6", "almost") - 4, 8) }}>forgotten almost straight away</div>
        <div style={{ marginTop: 60, padding: "26px 30px", background: "#FCE7E4", borderRadius: 14, fontFamily: SANS, fontSize: 38, lineHeight: 1.3, color: C.ink,
          opacity: progress(frame, half - 4, 10) }}>
          And almost <b>half</b> of what is remembered is <b>incorrect</b>.
        </div>
      </div>
    </Seat>
  );
};

const PlanCard: React.FC<{ frame: number }> = ({ frame }) => {
  const at = [W("S11", "what"), W("S11", "when"), W("S11", "check"), W("S13", "second"), W("S13", "reply")];
  return (
    <Seat>
      <div style={{ position: "absolute", left: 90, top: 300, width: 900, height: 1260, background: "#FFFFFF", borderRadius: 34, overflow: "hidden",
        boxShadow: "24px 36px 60px #00000088", transform: "rotate(1deg)" }}>
        <div style={{ background: C.teal, color: "#fff", padding: "40px 50px" }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.14em", opacity: 0.85 }}>FROM THE CLINIC · TODAY 18:45</div>
          <div style={{ fontFamily: SERIF, fontSize: 76, marginTop: 8 }}>Your plan</div>
          <div style={{ fontFamily: SANS, fontSize: 32, opacity: 0.9 }}>Dr. Mehta</div>
        </div>
        {PLAN_ROWS.map(([a, b], i) => (
          <div key={a} style={{ padding: "26px 50px", borderBottom: "2px solid #F0F0F2", opacity: 0.25 + 0.75 * progress(frame, at[i] - 3, 8),
            background: frame >= at[i] - 3 && (i === PLAN_ROWS.length - 1 || frame < at[i + 1] - 3) ? "#EAF6F3" : "transparent" }}>
            <div style={{ fontFamily: SANS, fontSize: 28, color: C.muted }}>{a}</div>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 42, color: C.ink, marginTop: 4 }}>{b}</div>
          </div>
        ))}
      </div>
    </Seat>
  );
};

const QuoteCard: React.FC<{ frame: number }> = ({ frame }) => (
  <Seat>
    <div style={{ position: "absolute", left: 120, top: 520, width: 840, background: C.paper, borderRadius: 10, padding: "70px 64px",
      boxShadow: "24px 36px 60px #00000088", transform: "rotate(-1deg)" }}>
      <div style={{ fontFamily: SERIF, fontSize: 84, lineHeight: 1.08, color: C.ink, opacity: progress(frame, W("S14", "written") - 3, 8) }}>
        “Written information is better <i>remembered</i>.”
      </div>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.12em", color: C.muted, marginTop: 34 }}>KESSELS · J R SOC MED · 2003</div>
    </div>
  </Seat>
);

const cutaway = (f: number): React.ReactNode | null => {
  if (f >= W("S6", "a") - 4 && f < L("S7").to) return <ReviewCard frame={f} />;
  if (f >= W("S11", "what") - 4 && f < L("S13").to) return <PlanCard frame={f} />;
  if (f >= W("S14", "written") - 4 && f < W("S14", "that's") - 2) return <QuoteCard frame={f} />;
  return null;
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.15 : 0.28) * Math.min(1, f / 20) * Math.min(1, (FINE_DURATION - f) / 30);
};

export const AllFineIThink: React.FC = () => {
  const f = useCurrentFrame();
  const cut = cutaway(f);
  const push = 1 + Math.min(1, f / FINE_DURATION) * 0.06;
  return (
    <AbsoluteFill style={{ background: "#0E1420" }}>
      <Graded warmth={0.06} contrast={1.05} brightness={1.0}>
        <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 45%" }}>
          {cut ? cut : (
            <>
              <Car frame={f} />
              <Phone frame={f} />
            </>
          )}
        </AbsoluteFill>
      </Graded>
      <CinemaGrade grain={0.08} vignette={0.45} glow="#F2B35B" />
      <AbsoluteFill style={{ background: "#05070B", opacity: progress(f, FINE_DURATION - 24, 22) }} />
      <VoiceOver take={TAKE} volume={1.25} />
      <Audio src={staticFile("music/2026-11-09-all-fine-i-think.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const FINE_COVER = 90;
