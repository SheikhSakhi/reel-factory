import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, pop, progress, wordFrame } from "../../kit";
import { CinemaGrade, Graded } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-06-the-call-from-april/take.json";

// Formats lab F4 (chat drama), daylight version: a phone lying on a wooden kitchen table, top-down, window light;
// a mother and daughter text, two voices read the messages. Two cutaways on the table (the study, the report).
// Soft ambient bed, no sound effects. No CTA.

const TAKE = loadTake(takeJson);
const TAIL = 50;
export const APRIL_DURATION = TAKE.totalFrames + TAIL;
type Line = { id: string; speaker: string; text: string; from: number; to: number };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
const L = (id: string) => LINES.find((l) => l.id === id)!;
const W = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

const SANS = BRAND.theme.fontBody;
const SERIF = BRAND.theme.fontDisplay;
const MONO = BRAND.theme.fontMono;
const C = { wood: "#B98B5E", woodDark: "#9C7048", woodLight: "#CFA478", me: "#2F7DF6", them: "#E9E9EE", ink: "#1C1C22", muted: "#8A8A93", paper: "#FBF8F2" };

// ---------- the table ----------

const Table: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ background: `repeating-linear-gradient(92deg, ${C.wood} 0px, ${C.woodLight} 26px, ${C.wood} 58px, ${C.woodDark} 64px, ${C.wood} 90px)` }}>
    {/* plank seams and grain */}
    {[0, 1, 2, 3].map((i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 120 + i * 520, height: 6, background: "#7A5636", opacity: 0.55 }} />)}
    <AbsoluteFill style={{ background: "repeating-linear-gradient(2deg, transparent 0px, transparent 11px, #00000010 12px, transparent 14px)" }} />
    {/* coffee cup, top-down, at the edge */}
    <div style={{ position: "absolute", right: -90, top: 150, width: 330, height: 330, borderRadius: "50%", background: "#F4F1EA", boxShadow: "18px 26px 40px #3A22104D" }}>
      <div style={{ position: "absolute", inset: 34, borderRadius: "50%", background: "radial-gradient(circle at 45% 40%, #6B4529 0%, #3E2414 70%)" }} />
      <div style={{ position: "absolute", left: -70, top: 120, width: 90, height: 60, borderRadius: 30, border: "18px solid #F4F1EA" }} />
    </div>
    {/* keys */}
    <div style={{ position: "absolute", left: -30, bottom: 160, width: 120, height: 120, borderRadius: "50%", border: "14px solid #C9C6BE", boxShadow: "8px 12px 18px #3A22104D" }} />
    <div style={{ position: "absolute", left: 70, bottom: 210, width: 160, height: 44, borderRadius: 12, background: "#A9A69E", transform: "rotate(-24deg)", boxShadow: "8px 12px 18px #3A22104D" }} />
    {/* window light across the table, breathing slowly */}
    <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.8 + 0.1 * Math.sin(frame / 60),
      background: "linear-gradient(125deg, #FFF3DD 0%, #FFF3DD 30%, transparent 46%, transparent 54%, #FFF3DD55 62%, transparent 76%)" }} />
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
  ...LINES.map((l) => ({ key: l.id, at: l.from - 4, el: <Bubble line={l} me={l.speaker === "DAUGHTER"} />, h: 0 })),
  { key: "link", at: W("S8", "in") - 2, el: <LinkCard />, h: 0 },
  { key: "photo", at: W("S9", "report") - 4, el: <PhotoCard />, h: 0 },
  { key: "booked", at: W("S10", "booking") - 2, el: <BookedCard />, h: 0 },
].sort((a, b) => a.at - b.at);

const Chat: React.FC<{ frame: number }> = ({ frame }) => {
  const shown = ITEMS.filter((it) => frame >= it.at);
  // the next mom message shows typing dots for ~0.6 s before it appears
  const nextMom = LINES.find((l) => l.speaker === "MOM" && frame < l.from - 4 && frame >= l.from - 24);
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
  const locked = frame < L("S1").from + 62;
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
              <div style={{ width: 84, height: 84, borderRadius: 42, background: "#C8A98A", margin: "70px auto 0", fontFamily: SANS, fontWeight: 700, fontSize: 40, color: "#fff", lineHeight: "84px" }}>M</div>
              <div style={{ fontFamily: SANS, fontSize: 26, color: C.ink, marginTop: 6 }}>Mom</div>
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

const StudyCard: React.FC<{ frame: number }> = ({ frame }) => {
  const four = W("S8", "four");
  const missed = W("S8", "missed");
  return (
    <div style={{ position: "absolute", left: 110, top: 360, width: 860, height: 1120, background: C.paper, borderRadius: 10, padding: "70px 64px",
      boxShadow: "24px 36px 60px #2A170A55", transform: "rotate(1.5deg)" }}>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.14em", color: C.muted }}>ROY ET AL. · ANNALS OF INTERNAL MEDICINE · 2005</div>
      <div style={{ fontFamily: SERIF, fontSize: 64, lineHeight: 1.08, color: C.ink, marginTop: 24 }}>Patients leaving two hospitals with results still pending</div>
      <div style={{ display: "flex", gap: 22, marginTop: 70, justifyContent: "center" }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const on = i < 4 && frame >= four + i * 3;
          return (
            <svg key={i} width={60} height={130} viewBox="0 0 60 130">
              <circle cx={30} cy={22} r={20} fill={on ? "#E5484D" : "#CFC8BA"} />
              <path d="M 4 128 L 4 70 Q 4 48 30 48 Q 56 48 56 70 L 56 128 Z" fill={on ? "#E5484D" : "#CFC8BA"} />
            </svg>
          );
        })}
      </div>
      <div style={{ textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 120, color: "#E5484D", marginTop: 30, opacity: progress(frame, four, 8) }}>4 in 10</div>
      <div style={{ textAlign: "center", fontFamily: SANS, fontSize: 40, color: C.ink, opacity: progress(frame, W("S8", "pending") - 4, 8) }}>went home with results pending</div>
      <div style={{ marginTop: 50, padding: "24px 30px", background: "#FCE7E4", borderRadius: 14, fontFamily: SANS, fontSize: 36, lineHeight: 1.3, color: C.ink,
        opacity: progress(frame, missed - 4, 10) }}>
        Their doctors were unaware of <b>many</b> of the results that needed action.
      </div>
    </div>
  );
};

const ReportCard: React.FC<{ frame: number }> = ({ frame }) => {
  const three = W("S9", "three");
  return (
    <div style={{ position: "absolute", left: 90, top: 420, width: 900, height: 1000, background: C.paper, borderRadius: 8, padding: "70px 70px",
      boxShadow: "24px 36px 60px #2A170A55", transform: "rotate(-2deg)" }}>
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: "0.12em", color: C.muted }}>RADIOLOGY REPORT · 18 APRIL</div>
      {[92, 80, 88, 64, 84, 70].map((w, i) => <div key={i} style={{ height: 16, width: `${w}%`, background: "#DDD8CC", borderRadius: 8, marginTop: 30 }} />)}
      <div style={{ marginTop: 60, fontFamily: SANS, fontSize: 32, color: C.muted }}>Recommendation</div>
      <div style={{ position: "relative", display: "inline-block", marginTop: 10, fontFamily: SANS, fontWeight: 800, fontSize: 64, color: C.ink }}>
        Follow up in 3 months.
        <svg width="110%" height={60} style={{ position: "absolute", left: "-5%", bottom: -40, overflow: "visible" }}>
          <path d="M 10 30 Q 300 10 620 26" stroke="#E5484D" strokeWidth={10} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1}
            strokeDashoffset={1 - progress(frame, three, 14)} />
        </svg>
      </div>
    </div>
  );
};

const PlanCard: React.FC<{ frame: number }> = ({ frame }) => {
  const rows: [string, string, number, string][] = [
    ["18 Apr", "Scan done", W("S12", "plan") - 6, "#2F7DF6"],
    ["18 Apr", "Result reviewed the day it came in", W("S13", "sees"), "#2E9E6A"],
    ["Next", "Follow-up scan in 3 months", W("S13", "next") - 4, "#2F7DF6"],
    ["11 Jul", "Reminder: book the scan this week", W("S13", "when") - 4, "#E5A13A"],
    ["18 Jul", "Scan reviewed, plan updated", W("S13", "when") + 8, "#2E9E6A"],
  ];
  return (
    <div style={{ position: "absolute", left: 100, top: 330, width: 880, height: 1240, background: C.paper, borderRadius: 10, padding: "64px 60px",
      boxShadow: "24px 36px 60px #2A170A55", transform: "rotate(-1.2deg)" }}>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.14em", color: C.muted }}>WHAT FOLLOW-UP SHOULD LOOK LIKE</div>
      <div style={{ fontFamily: SERIF, fontSize: 76, lineHeight: 1.04, color: C.ink, marginTop: 18 }}>One doctor.<br /><i>One plan.</i></div>
      <div style={{ position: "relative", marginTop: 50 }}>
        <div style={{ position: "absolute", left: 173, top: 20, bottom: 30, width: 4, background: "#E3DED2" }} />
        {rows.map(([when, what, at, col], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 30, marginBottom: 46, opacity: progress(frame, at, 8), transform: `translateX(${(1 - pop(frame, at, 14)) * -30}px)` }}>
            <div style={{ width: 130, flexShrink: 0, whiteSpace: "nowrap", textAlign: "right", fontFamily: SANS, fontWeight: 700, fontSize: 30, color: C.muted }}>{when}</div>
            <div style={{ width: 30, height: 30, borderRadius: 15, background: col, flexShrink: 0, zIndex: 1 }} />
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 38, lineHeight: 1.2, color: C.ink }}>{what}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EvidenceCard: React.FC<{ frame: number }> = ({ frame }) => {
  const eighteen = W("S14", "eighteen");
  return (
    <div style={{ position: "absolute", left: 110, top: 380, width: 860, height: 1120, background: C.paper, borderRadius: 10, padding: "70px 64px",
      boxShadow: "24px 36px 60px #2A170A55", transform: "rotate(1.2deg)" }}>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.14em", color: C.muted }}>PEREIRA GRAY ET AL. · BMJ OPEN · 2018</div>
      <div style={{ fontFamily: SERIF, fontSize: 62, lineHeight: 1.08, color: C.ink, marginTop: 22 }}>Seeing the same doctor over time</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 14, marginTop: 60 }}>
        {Array.from({ length: 22 }).map((_, i) => {
          const on = i < 18 && frame >= eighteen + i;
          return <div key={i} style={{ height: 56, borderRadius: 10, background: on ? "#2E9E6A" : "#E3DED2", opacity: progress(frame, W("S14", "twenty") + i, 6) }} />;
        })}
      </div>
      <div style={{ textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 110, color: "#2E9E6A", marginTop: 50, opacity: progress(frame, eighteen, 8) }}>18 of 22</div>
      <div style={{ textAlign: "center", fontFamily: SANS, fontSize: 40, lineHeight: 1.25, color: C.ink, opacity: progress(frame, W("S14", "linked") - 4, 8) }}>
        studies linked it to <b>fewer deaths</b>
      </div>
      <div style={{ textAlign: "center", fontFamily: SANS, fontSize: 24, color: C.muted, marginTop: 30, opacity: progress(frame, W("S14", "linked"), 8) }}>Observational studies · generalists and specialists</div>
    </div>
  );
};

// ---------- the cut ----------

const cutaway = (f: number): React.ReactNode | null => {
  if (f >= W("S8", "four") - 4 && f < L("S8").to) return <StudyCard frame={f} />;
  if (f >= W("S9", "follow") - 4 && f < L("S9").to) return <ReportCard frame={f} />;
  if (f >= W("S12", "whole") - 4 && f < L("S13").to) return <PlanCard frame={f} />;
  if (f >= W("S14", "in") - 4 && f < L("S14").to) return <EvidenceCard frame={f} />;
  return null;
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.15 : 0.28) * Math.min(1, f / 20) * Math.min(1, (APRIL_DURATION - f) / 30);
};

export const CallFromApril: React.FC = () => {
  const f = useCurrentFrame();
  const cut = cutaway(f);
  // the camera: a slow drift and push toward the newest message
  const push = 1 + Math.min(1, f / APRIL_DURATION) * 0.08;
  const end = progress(f, L("S15").to + 6, 40);
  return (
    <AbsoluteFill style={{ background: C.wood }}>
      <Graded warmth={0.08} contrast={1.03} brightness={1.02}>
        <AbsoluteFill style={{ transform: `scale(${push * (1 - end * 0.1)}) translateY(${-f * 0.02}px)`, transformOrigin: "50% 62%" }}>
          <Table frame={f} />
          {cut ? cut : <Phone frame={f} />}
        </AbsoluteFill>
      </Graded>
      <CinemaGrade rays haze={0.03} grain={0.06} vignette={0.3} glow="#FFE2B8" />
      <AbsoluteFill style={{ background: "#1C120A", opacity: progress(f, APRIL_DURATION - 24, 22) }} />
      <VoiceOver take={TAKE} volume={1.25} />
      <Audio src={staticFile("music/2026-11-06-the-call-from-april.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const APRIL_COVER = 30;
