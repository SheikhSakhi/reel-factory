import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, pop, progress, wordFrame } from "../../kit";
import { CinemaGrade, Graded } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-18-the-full-pill-box/take.json";

// Formats lab F4 (chat drama), evening side-table version: Nani's phone on a crocheted doily beside her weekly pill box,
// still full. She texts her grandson; two voices read the messages. Frame 1 is the full pill box (the hook picture).
// Cutaways: the WHO card, the updated plan. Ambient bed, no sound effects. No CTA, no dosing advice.

const TAKE = loadTake(takeJson);
const TAIL = 50;
export const PILLBOX_DURATION = TAKE.totalFrames + TAIL;
type Line = { id: string; speaker: string; text: string; from: number; to: number };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
const L = (id: string) => LINES.find((l) => l.id === id)!;
const W = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const SANS = BRAND.theme.fontBody;
const SERIF = BRAND.theme.fontDisplay;
const MONO = BRAND.theme.fontMono;
const C = { wood: "#B98B5E", woodDark: "#9C7048", woodLight: "#CFA478", me: "#2F7DF6", them: "#E9E9EE", ink: "#1C1C22", muted: "#8A8A93", paper: "#FBF8F2" };

// ---------- the table ----------

const PillBox: React.FC<{ x: number; y: number; s?: number; empty?: number }> = ({ x, y, s = 1, empty = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 760 * s, height: 220 * s, borderRadius: 26 * s, background: "#E9E3F2", boxShadow: "16px 24px 36px #2A170A55",
    display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 * s, padding: 16 * s }}>
    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
      <div key={i} style={{ borderRadius: 14 * s, background: "#F7F4FB", border: `${3 * s}px solid #C9BEDD`, position: "relative" }}>
        <div style={{ position: "absolute", top: 6 * s, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 22 * s, color: "#7A6C93" }}>{d}</div>
        {i >= empty ? (
          <>
            <div style={{ position: "absolute", left: "22%", top: "48%", width: 34 * s, height: 16 * s, borderRadius: 8 * s, background: "#E26D5A" }} />
            <div style={{ position: "absolute", left: "48%", top: "64%", width: 20 * s, height: 20 * s, borderRadius: 10 * s, background: "#FFFFFF", border: `${2 * s}px solid #DDD` }} />
          </>
        ) : null}
      </div>
    ))}
  </div>
);

const Table: React.FC<{ frame: number; pills?: boolean }> = ({ frame, pills = true }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 40% 30%, #8A5A3A 0%, #5E3B25 60%, #3A2414 100%)` }}>
    <AbsoluteFill style={{ background: "repeating-linear-gradient(88deg, transparent 0 22px, #00000014 22px 24px)" }} />
    {/* crocheted doily */}
    <div style={{ position: "absolute", left: 60, top: 220, width: 960, height: 960, borderRadius: "50%", background: "repeating-radial-gradient(circle, #F3EDE2 0 10px, #E8DFCF 10px 13px, transparent 13px 18px)", opacity: 0.9 }} />
    {/* reading glasses */}
    <div style={{ position: "absolute", right: 40, top: 120, width: 300, height: 110, transform: "rotate(-18deg)", opacity: 0.85 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 120, height: 100, borderRadius: "50%", border: "8px solid #2B2320" }} />
      <div style={{ position: "absolute", left: 170, top: 0, width: 120, height: 100, borderRadius: "50%", border: "8px solid #2B2320" }} />
      <div style={{ position: "absolute", left: 120, top: 40, width: 52, height: 8, background: "#2B2320" }} />
    </div>
    {pills ? <PillBox x={150} y={1600} s={1} /> : null}
    {/* warm lamp light, breathing slowly */}
    <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.85 + 0.08 * Math.sin(frame / 50), background: "radial-gradient(ellipse 70% 55% at 80% 10%, #FFD9A0 0%, transparent 60%)" }} />
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

const LinkCard: React.FC = () => (
  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
    <div style={{ width: 560, borderRadius: 28, overflow: "hidden", background: "#FFFFFF", border: "2px solid #E3E3E8" }}>
      <div style={{ height: 120, background: "repeating-linear-gradient(0deg, #F2F2F5 0 14px, #E6E6EB 14px 16px)" }} />
      <div style={{ padding: "16px 22px" }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28, color: C.ink }}>Test results that return after hospital discharge</div>
        <div style={{ fontFamily: SANS, fontSize: 24, color: C.muted, marginTop: 6 }}>Annals of Internal Medicine · 2005</div>
      </div>
    </div>
  </div>
);

const PhotoCard: React.FC = () => (
  <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 18 }}>
    <div style={{ width: 460, height: 300, borderRadius: 26, background: C.paper, border: "2px solid #E3E3E8", padding: 22, transform: "rotate(-1deg)" }}>
      <div style={{ fontFamily: MONO, fontSize: 18, color: C.muted }}>RADIOLOGY REPORT · APRIL</div>
      {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 10, width: `${90 - i * 12}%`, background: "#DDD8CC", borderRadius: 5, marginTop: 18 }} />)}
      <div style={{ marginTop: 22, fontFamily: SANS, fontWeight: 700, fontSize: 24, color: "#C2412D" }}>Follow up in 3 months</div>
    </div>
  </div>
);

const BookedCard: React.FC = () => (
  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
    <div style={{ width: 460, borderRadius: 26, background: "#FFFFFF", border: "2px solid #E3E3E8", padding: "18px 24px", display: "flex", gap: 20, alignItems: "center" }}>
      <div style={{ width: 84, height: 84, borderRadius: 18, overflow: "hidden", border: "2px solid #E3E3E8", textAlign: "center" }}>
        <div style={{ background: "#E5484D", color: "#fff", fontFamily: SANS, fontWeight: 700, fontSize: 18, padding: 4 }}>SEP</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: C.ink }}>14</div>
      </div>
      <div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: C.ink }}>Follow-up booked</div>
        <div style={{ fontFamily: SANS, fontSize: 24, color: C.muted }}>Mom · scan review</div>
      </div>
    </div>
  </div>
);

type Item = { key: string; at: number; el: React.ReactNode; h: number };

const ITEMS: Item[] = [
  ...LINES.map((l) => ({ key: l.id, at: l.from - 4, el: <Bubble line={l} me={l.speaker === "NANI"} />, h: 0 })),
].sort((a, b) => a.at - b.at);

const Chat: React.FC<{ frame: number }> = ({ frame }) => {
  const shown = ITEMS.filter((it) => frame >= it.at);
  // the next mom message shows typing dots for ~0.6 s before it appears
  const nextMom = LINES.find((l) => l.speaker === "GRANDSON" && frame < l.from - 4 && frame >= l.from - 24);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, padding: "0 30px", display: "flex", flexDirection: "column" }}>
      {shown.map((it) => (
        <div key={it.key} style={{ opacity: Math.min(1, pop(frame, it.at, 14) * 1.4), transform: `translateY(${(1 - pop(frame, it.at, 14)) * 24}px)` }}>{it.el}</div>
      ))}
      {nextMom ? <Typing frame={frame} /> : null}
    </div>
  );
};

const Phone: React.FC<{ frame: number }> = ({ frame }) => {
  const locked = false;
  const buzz = frame < 20 ? Math.sin(frame * 2.2) * 4 * (1 - frame / 20) : 0;
  return (
    <div style={{ position: "absolute", left: (1080 - PHONE_W) / 2, top: (1920 - PHONE_H) / 2 + 30, width: PHONE_W, height: PHONE_H, borderRadius: 96,
      background: "#141418", padding: 22, boxShadow: "30px 50px 70px #2A170A66, 6px 10px 18px #2A170A55", transform: `rotate(${-2.5 + buzz * 0.2}deg) translateX(${buzz}px)` }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 76, overflow: "hidden", background: locked ? "linear-gradient(160deg, #D9C3A5, #8C6E57)" : "#FFFFFF" }}>
        {locked ? (
          <>
            <div style={{ position: "absolute", top: 160, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 300, fontSize: 170, color: "#FFFFFF" }}>10:42</div>
            <div style={{ position: "absolute", top: 380, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontSize: 36, color: "#FFFFFFDD" }}>Tuesday, 9 September</div>
            <div style={{ position: "absolute", top: 560, left: 40, right: 40, padding: "28px 30px", borderRadius: 36, background: "#FFFFFFCC",
              opacity: progress(frame, 6, 10), transform: `translateY(${(1 - pop(frame, 6, 14)) * -40}px)` }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: C.ink }}>Mom</div>
              <div style={{ fontFamily: SANS, fontSize: 34, color: C.ink, marginTop: 6 }}>The hospital just called. About a scan from April.</div>
            </div>
          </>
        ) : (
          <>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 210, background: "#F7F7F9", borderBottom: "2px solid #E6E6EB", textAlign: "center" }}>
              <div style={{ width: 84, height: 84, borderRadius: 42, background: "#C8A98A", margin: "70px auto 0", fontFamily: SANS, fontWeight: 700, fontSize: 40, color: "#fff", lineHeight: "84px" }}>A</div>
              <div style={{ fontFamily: SANS, fontSize: 26, color: C.ink, marginTop: 6 }}>Arjun</div>
            </div>
            <div style={{ position: "absolute", top: 210, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
              <Chat frame={frame} />
            </div>
            <div style={{ position: "absolute", left: 30, right: 30, bottom: 34, height: 80, borderRadius: 40, border: "2px solid #E0E0E6", fontFamily: SANS, fontSize: 28, color: "#B4B4BC", padding: "22px 30px" }}>Message</div>
          </>
        )}
      </div>
    </div>
  );
};

// ---------- cutaways on the table ----------

const HookBox: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <Table frame={frame} pills={false} />
    <AbsoluteFill style={{ background: "#2A170A66" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 640, height: 260, transform: `scale(${1 + frame * 0.0015})`, transformOrigin: "50% 50%" }}>
      <PillBox x={124} y={0} s={1.1} />
    </div>
    <div style={{ position: "absolute", left: 80, right: 80, top: 1040, textAlign: "center", fontFamily: SERIF, fontSize: 64, color: "#FFF4E2", opacity: progress(frame, W("S1", "still") - 4, 8) }}>
      Sunday. Still full.
    </div>
  </>
);

const WhoCard: React.FC<{ frame: number }> = ({ frame }) => {
  const half = W("S8", "half");
  return (
    <>
      <Table frame={frame} />
      <div style={{ position: "absolute", left: 110, top: 360, width: 860, height: 1100, background: C.paper, borderRadius: 10, padding: "70px 64px",
        boxShadow: "24px 36px 60px #2A170A88", transform: "rotate(1.5deg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.14em", color: C.muted }}>WORLD HEALTH ORGANIZATION · 2003</div>
        <div style={{ fontFamily: SERIF, fontSize: 60, lineHeight: 1.08, color: C.ink, marginTop: 22 }}>Adherence to long-term therapies</div>
        <div style={{ display: "flex", gap: 30, marginTop: 70, justifyContent: "center" }}>
          {[0, 1].map((i) => (
            <svg key={i} width={200} height={300} viewBox="0 0 60 130">
              <circle cx={30} cy={22} r={20} fill={i === 1 && frame >= half ? "#E5484D" : "#CFC8BA"} />
              <path d="M 4 128 L 4 70 Q 4 48 30 48 Q 56 48 56 70 L 56 128 Z" fill={i === 1 && frame >= half ? "#E5484D" : "#CFC8BA"} />
            </svg>
          ))}
        </div>
        <div style={{ textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 100, color: "#E5484D", marginTop: 20, opacity: progress(frame, half - 4, 8) }}>about 1 in 2</div>
        <div style={{ textAlign: "center", fontFamily: SANS, fontSize: 38, lineHeight: 1.3, color: C.ink, opacity: progress(frame, half, 8) }}>
          with long-term illness don't take their medicines as prescribed
        </div>
        <div style={{ textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: C.ink, marginTop: 50, opacity: progress(frame, W("S9", "never") - 4, 8) }}>
          Most never tell anyone.
        </div>
      </div>
    </>
  );
};

const PlanCard: React.FC<{ frame: number }> = ({ frame }) => {
  const rows: [string, string, number][] = [
    ["Message from Nani", "“The new tablet makes me dizzy.”", W("S13", "message")],
    ["Seen by Dr. Rao", "the same day", W("S13", "sees")],
    ["Plan changed", "new tablet adjusted, see the updated label", W("S13", "changes")],
    ["Check-in", "Friday: how is the dizziness?", W("S13", "hear")],
  ];
  return (
    <>
      <Table frame={frame} />
      <div style={{ position: "absolute", left: 90, top: 330, width: 900, height: 1200, background: "#FFFFFF", borderRadius: 34, overflow: "hidden",
        boxShadow: "24px 36px 60px #2A170A88", transform: "rotate(-1deg)" }}>
        <div style={{ background: "#2E9E8A", color: "#fff", padding: "40px 50px" }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.14em", opacity: 0.85 }}>BETWEEN VISITS</div>
          <div style={{ fontFamily: SERIF, fontSize: 76, marginTop: 8 }}>Your plan, updated</div>
        </div>
        {rows.map(([a, b, at], i) => (
          <div key={a} style={{ padding: "30px 50px", borderBottom: "2px solid #F0F0F2", opacity: 0.2 + 0.8 * progress(frame, at - 3, 8),
            background: frame >= at - 3 && (i === rows.length - 1 || frame < rows[i + 1][2] - 3) ? "#EAF6F3" : "transparent" }}>
            <div style={{ fontFamily: SANS, fontSize: 28, color: C.muted }}>{a}</div>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 42, color: C.ink, marginTop: 4 }}>{b}</div>
          </div>
        ))}
      </div>
    </>
  );
};

const cutaway = (f: number): React.ReactNode | null => {
  if (f < L("S2").from - 2) return <HookBox frame={f} />;
  if (f >= W("S8", "the") - 4 && f < L("S9").to) return <WhoCard frame={f} />;
  if (f >= W("S13", "you") - 4 && f < L("S13").to) return <PlanCard frame={f} />;
  return null;
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.15 : 0.28) * Math.min(1, f / 20) * Math.min(1, (PILLBOX_DURATION - f) / 30);
};

export const FullPillBox: React.FC = () => {
  const f = useCurrentFrame();
  const cut = cutaway(f);
  // the camera: a slow drift and push toward the newest message
  const push = 1 + Math.min(1, f / PILLBOX_DURATION) * 0.08;
  const end = progress(f, L("S14").to + 6, 40);
  return (
    <AbsoluteFill style={{ background: C.wood }}>
      <Graded warmth={0.08} contrast={1.03} brightness={1.02}>
        <AbsoluteFill style={{ transform: `scale(${push * (1 - end * 0.1)}) translateY(${-f * 0.02}px)`, transformOrigin: "50% 62%" }}>
          {cut ? cut : (<><Table frame={f} /><Phone frame={f} /></>)}
        </AbsoluteFill>
      </Graded>
      <CinemaGrade rays haze={0.03} grain={0.06} vignette={0.3} glow="#FFE2B8" />
      <AbsoluteFill style={{ background: "#1C120A", opacity: progress(f, PILLBOX_DURATION - 24, 22) }} />
      <VoiceOver take={TAKE} volume={1.25} />
      <Audio src={staticFile("music/2026-11-18-the-full-pill-box.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const PILLBOX_COVER = 30;
