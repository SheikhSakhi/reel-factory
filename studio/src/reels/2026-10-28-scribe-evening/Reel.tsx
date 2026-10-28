import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FlaskConical, Inbox, MessageCircle, Mic, Moon, UtensilsCrossed } from "lucide";
import { DrawIcon, SfxTrack, VoiceOver, loadTake, pop, progress, wordFrame, type SfxCue } from "../../kit";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-10-28-scribe-evening/take.json";

// Formats lab F3 (B-roll story), faceless: editorial kinetic typography. A hard cut every 1-2 s on a spoken word,
// cream paper / black / orange pattern breaks, sound on every beat.
const TAKE = loadTake(takeJson);
export const SCRIBE_DURATION = TAKE.totalFrames;

const FONT = BRAND.theme.fontBody;
const SERIF = BRAND.theme.fontDisplay;
const MONO = BRAND.theme.fontMono;
const C = { paper: "#F3EEE4", ink: "#171512", orange: "#C8461A", muted: "#6B6459", night: "#0E0F14", good: "#2F7D5B", bad: "#C8461A" } as const;

const at = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);

type Shot = { readonly from: number; readonly bg: string; readonly C: React.FC<{ s: number }> };

/** Big type that punches in on its frame. */
const Big: React.FC<{ children: React.ReactNode; s: number; size?: number; color?: string; top?: number; font?: string; italic?: boolean }> = ({
  children, s, size = 170, color = C.ink, top = 640, font = FONT, italic = false,
}) => {
  const f = useCurrentFrame();
  const t = pop(f, s, 12);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, textAlign: "center", fontFamily: font, fontWeight: font === FONT ? 800 : 400,
      fontStyle: italic ? "italic" : "normal", fontSize: size, lineHeight: 0.95, letterSpacing: font === FONT ? "-0.04em" : "-0.01em", color,
      transform: `scale(${1.18 - 0.18 * t})`, opacity: Math.min(1, t * 2) }}>{children}</div>
  );
};

const Kicker: React.FC<{ text: string; s: number; color?: string; top?: number }> = ({ text, s, color = C.muted, top = 420 }) => {
  const f = useCurrentFrame();
  const t = progress(f, s, 8);
  return <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: MONO, fontSize: 34, letterSpacing: "0.22em", color, opacity: t }}>{text}</div>;
};

const Icon: React.FC<{ icon: Parameters<typeof DrawIcon>[0]["icon"]; s: number; size?: number; color?: string; top?: number }> = ({ icon, s, size = 380, color = C.ink, top = 520 }) => (
  <div style={{ position: "absolute", left: (1080 - size) / 2, top }}><DrawIcon icon={icon} size={size} color={color} at={s} duration={16} strokeWidth={1.4} /></div>
);

// ---------- shots ----------

const Clock: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const minute = f - s < 14 ? "39" : "40";
  return (
    <>
      <Kicker text="TUESDAY · PM" s={s} />
      <Big s={s} size={330} top={560}>9:{minute}</Big>
    </>
  );
};

const Dinner: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const steam = 1 - progress(f, s + 6, 20);
  return (
    <>
      <Icon icon={UtensilsCrossed} s={s} color={C.muted} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 430 + i * 80, top: 400 - ((f - s) * 1.5) % 40, width: 8, height: 90, borderRadius: 8,
          background: C.muted, opacity: 0.5 * steam }} />
      ))}
      <Big s={s + 4} size={120} top={1000} color={C.muted}>cold.</Big>
    </>
  );
};

const Charting: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const lines = Math.min(9, Math.floor((f - s) / 3));
  return (
    <>
      <div style={{ position: "absolute", left: 120, right: 120, top: 420, height: 760, borderRadius: 22, background: "#1C1E26", border: "2px solid #2C2F3A", padding: 44 }}>
        <div style={{ fontFamily: MONO, fontSize: 26, color: "#7C8194", letterSpacing: "0.12em" }}>EHR · 21:41 · PATIENT 27 OF 27</div>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} style={{ height: 22, marginTop: 34, width: `${55 + ((i * 37) % 40)}%`, borderRadius: 6, background: i === lines - 1 ? C.orange : "#3A3E4C" }} />
        ))}
      </div>
      <Big s={s} size={110} top={1260} color="#F3EEE4">still charting.</Big>
    </>
  );
};

const Buys: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const stamp = pop(f, at("S2", "buys"), 9);
  return (
    <>
      <div style={{ position: "absolute", left: 170, right: 170, top: 470, background: C.paper, borderRadius: 10, padding: "50px 54px", transform: `rotate(-3deg) translateY(${(1 - pop(f, s, 14)) * 300}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 28, color: C.muted, letterSpacing: "0.14em" }}>PURCHASE ORDER</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 76, color: C.ink, marginTop: 20 }}>AI scribe</div>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 36, color: C.muted, marginTop: 10 }}>Enterprise licence · all clinics</div>
        <div style={{ height: 2, background: "#00000022", margin: "34px 0" }} />
        <div style={{ fontFamily: MONO, fontSize: 30, color: C.ink }}>APPROVED</div>
        {f >= at("S2", "buys") ? (
          <div style={{ position: "absolute", right: 40, bottom: 40, fontFamily: FONT, fontWeight: 800, fontSize: 64, color: C.orange, border: `6px solid ${C.orange}`,
            borderRadius: 12, padding: "4px 20px", transform: `rotate(-12deg) scale(${1.8 - 0.8 * stamp})`, opacity: Math.min(1, stamp * 2) }}>PAID</div>
        ) : null}
      </div>
    </>
  );
};

const Scribe: React.FC<{ s: number }> = ({ s }) => (
  <>
    <Kicker text="NEW" s={s} color={C.paper} top={560} />
    <Big s={s} size={210} top={640} color={C.paper}>AI SCRIBE</Big>
  </>
);

const Listens: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  return (
    <>
      <Icon icon={Mic} s={s} size={240} top={420} />
      <div style={{ position: "absolute", left: 140, right: 140, top: 800, height: 260, display: "flex", alignItems: "center", gap: 10 }}>
        {Array.from({ length: 32 }).map((_, i) => {
          const h = 30 + 200 * Math.abs(Math.sin((f - s) * 0.35 + i * 0.7) * Math.sin(i * 1.3 + (f - s) * 0.11));
          return <div key={i} style={{ flex: 1, height: h * progress(f, s, 8), borderRadius: 6, background: i % 5 === 0 ? C.orange : C.ink }} />;
        })}
      </div>
      <Big s={s + 3} size={100} top={1150}>it listens.</Big>
    </>
  );
};

const Writes: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const rows = ["S  Subjective", "O  Objective", "A  Assessment", "P  Plan"];
  return (
    <div style={{ position: "absolute", left: 150, right: 150, top: 400, background: "#FFFFFF", borderRadius: 16, padding: "50px 54px", boxShadow: "0 30px 70px rgba(0,0,0,0.15)" }}>
      <div style={{ fontFamily: MONO, fontSize: 28, color: C.muted, letterSpacing: "0.14em" }}>VISIT NOTE · DRAFTED</div>
      {rows.map((r, i) => {
        const t = progress(f, s + i * 6, 8);
        return (
          <div key={r} style={{ marginTop: 34, opacity: t }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.ink }}>{r}</div>
            <div style={{ height: 16, marginTop: 14, borderRadius: 6, background: "#D9D3C7", width: `${t * (60 + i * 9)}%` }} />
          </div>
        );
      })}
    </div>
  );
};

const Solved: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const q = pop(f, at("S2", "solved?"), 8);
  return (
    <>
      <Big s={s} size={170} top={600} color={C.paper}>PROBLEM</Big>
      <Big s={at("S2", "solved?")} size={170} top={780} color={C.paper}>SOLVED<span style={{ color: C.orange, display: "inline-block", transform: `rotate(${(1 - q) * 30}deg)` }}>?</span></Big>
    </>
  );
};

const Journal: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const t = pop(f, s, 14);
  return (
    <div style={{ position: "absolute", left: 130, right: 130, top: 420, background: "#FFFFFF", borderTop: `24px solid ${C.orange}`, padding: "50px 56px",
      boxShadow: "0 30px 80px rgba(0,0,0,0.18)", transform: `translateX(${(1 - t) * 900}px) rotate(1.5deg)` }}>
      <div style={{ fontFamily: SERIF, fontSize: 96, color: C.ink }}>JAMA</div>
      <div style={{ fontFamily: MONO, fontSize: 26, color: C.muted, letterSpacing: "0.12em", marginTop: 6 }}>ORIGINAL INVESTIGATION · APRIL 2026</div>
      <div style={{ fontFamily: SERIF, fontSize: 50, color: C.ink, marginTop: 34, lineHeight: 1.15 }}>
        Changes in clinician time with adoption of AI-powered scribes: a multisite study
      </div>
    </div>
  );
};

const Clinicians: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [s, at("S3", "clinicians,") + 4], [0, 8581], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const dots = Math.min(170, Math.floor(((f - s) / 40) * 170));
  return (
    <>
      <div style={{ position: "absolute", left: 90, right: 90, top: 330, display: "flex", flexWrap: "wrap", gap: 12 }}>
        {Array.from({ length: 170 }).map((_, i) => (
          <div key={i} style={{ width: 40, height: 40, borderRadius: 20, background: i < dots ? (i % 7 === 0 ? C.orange : C.ink) : "#E2DCCF" }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1090, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 190, letterSpacing: "-0.04em", color: C.ink }}>
        {n.toLocaleString("en-US")}
      </div>
      <Kicker text="CLINICIANS" s={s} top={1345} color={C.ink} />
    </>
  );
};

const Systems: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const names = ["Mass General Brigham", "Emory", "UCSF", "Yale New Haven", "UC Davis"];
  return (
    <>
      <Big s={s + 6} size={150} top={300}>5</Big>
      <Kicker text="HEALTH SYSTEMS" s={s + 6} top={470} color={C.ink} />
      <div style={{ position: "absolute", left: 140, right: 140, top: 580, display: "flex", flexDirection: "column", gap: 20 }}>
        {names.map((n, i) => {
          const t = pop(f, at("S3", "health") + i * 4, 14);
          return (
            <div key={n} style={{ fontFamily: FONT, fontWeight: 700, fontSize: 52, color: C.ink, padding: "20px 30px", border: `3px solid ${C.ink}`, borderRadius: 12,
              transform: `translateX(${(1 - t) * (i % 2 ? 500 : -500)}px)`, opacity: Math.min(1, t * 2) }}>{n}</div>
          );
        })}
      </div>
    </>
  );
};

const NotesDown: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const shrink = progress(f, at("S4", "down."), 14);
  return (
    <>
      <Kicker text="TIME ON NOTES" s={s} top={420} color={C.ink} />
      <div style={{ position: "absolute", left: 140, top: 520, width: 800, height: 120, background: "#E2DCCF", borderRadius: 12 }} />
      <div style={{ position: "absolute", left: 140, top: 520, width: 800 * (1 - 0.1 * shrink), height: 120, background: C.good, borderRadius: 12 }} />
      <Big s={at("S4", "down.")} size={150} top={760} color={C.good}>DOWN ↓</Big>
    </>
  );
};

const Sixteen: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [s, s + 14], [0, 16], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <>
      <Big s={s} size={330} top={500} color={C.paper}>−{n}</Big>
      <Kicker text="MINUTES" s={s} top={870} color={C.paper} />
      <Kicker text="PER 8 HOURS OF PATIENTS" s={at("S4", "every")} top={960} color="#FFFFFFAA" />
    </>
  );
};

const AfterHours: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  return (
    <>
      <Icon icon={Moon} s={s} size={200} top={330} color="#E9E3D6" />
      <Kicker text="TIME ON THE COMPUTER AFTER HOURS" s={s + 4} top={620} color="#E9E3D6" />
      <div style={{ position: "absolute", left: 140, top: 700, width: 800, height: 120, background: "#2A2C36", borderRadius: 12 }} />
      <div style={{ position: "absolute", left: 140, top: 700, width: 800 * (1 - 0.012 * progress(f, s + 10, 30)), height: 120, background: "#8B90A3", borderRadius: 12 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 90, color: "#E9E3D6",
        opacity: progress(f, at("S5", "hours?"), 8) }}>?</div>
    </>
  );
};

const NoChange: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const t = pop(f, at("S5", "significant") - 2, 9);
  return (
    <>
      <div style={{ position: "absolute", left: 140, top: 520, width: 800, height: 120, background: "#2A2C36", borderRadius: 12 }} />
      <div style={{ position: "absolute", left: 140, top: 520, width: 790, height: 120, background: "#8B90A3", borderRadius: 12 }} />
      <div style={{ position: "absolute", left: 140, top: 660, fontFamily: MONO, fontSize: 28, color: "#9AA0B3" }}>−3.1 min · not significant</div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 820, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 104, lineHeight: 1, color: C.orange,
        border: `10px solid ${C.orange}`, borderRadius: 20, padding: "26px 10px", transform: `rotate(-6deg) scale(${1.7 - 0.7 * t})`, opacity: Math.min(1, t * 2) }}>
        NO SIGNIFICANT CHANGE
      </div>
    </>
  );
};

const NotWhole: React.FC<{ s: number }> = ({ s }) => (
  <>
    <Big s={s} size={130} top={560}>the note</Big>
    <Big s={at("S6", "never")} size={190} top={720} color={C.orange}>≠</Big>
    <Big s={at("S6", "evening.")} size={130} top={940} font={SERIF} italic>the evening</Big>
  </>
);

const InboxShot: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const n = Math.min(47, 12 + Math.max(0, Math.floor((f - s) * 1.4)));
  return (
    <>
      <Icon icon={Inbox} s={s} size={360} top={460} color={C.paper} />
      <div style={{ position: "absolute", left: 640, top: 420, minWidth: 130, height: 130, borderRadius: 65, background: C.orange, color: "#fff",
        fontFamily: FONT, fontWeight: 800, fontSize: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px",
        transform: `scale(${pop(f, s + 4, 10)})` }}>{n}</div>
      <Big s={s + 2} size={110} top={950} color={C.paper}>the inbox.</Big>
    </>
  );
};

const Results: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const rows = ["CBC", "HbA1c", "Lipid panel", "TSH", "Chest X-ray"];
  return (
    <>
      <div style={{ position: "absolute", left: 140, top: 300 }}><DrawIcon icon={FlaskConical} size={140} color={C.ink} at={s} duration={12} strokeWidth={1.6} /></div>
      <Kicker text="RESULTS TO REVIEW" s={s} top={330} color={C.ink} />
      <div style={{ position: "absolute", left: 140, right: 140, top: 500, display: "flex", flexDirection: "column", gap: 18 }}>
        {rows.map((r, i) => {
          const t = pop(f, s + i * 3, 14);
          return (
            <div key={r} style={{ display: "flex", justifyContent: "space-between", padding: "24px 30px", background: "#FFFFFF", borderRadius: 12,
              borderLeft: `10px solid ${i % 2 ? C.orange : "#D9D3C7"}`, transform: `translateX(${(1 - t) * 700}px)` }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: C.ink }}>{r}</span>
              <span style={{ fontFamily: MONO, fontSize: 30, color: C.muted }}>UNREVIEWED</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Quick: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const msgs = ["quick question?", "is this normal?", "sorry, one more thing"];
  return (
    <>
      <div style={{ position: "absolute", left: 140, top: 330 }}><DrawIcon icon={MessageCircle} size={150} color={C.paper} at={s} duration={12} strokeWidth={1.6} /></div>
      <div style={{ position: "absolute", left: 140, right: 140, top: 560, display: "flex", flexDirection: "column", gap: 26 }}>
        {msgs.map((m, i) => {
          const t = pop(f, s + i * 7, 13);
          if (f < s + i * 7) return null;
          return (
            <div key={m} style={{ alignSelf: i % 2 ? "flex-end" : "flex-start", fontFamily: FONT, fontWeight: 600, fontSize: 54, color: C.ink, background: C.paper,
              padding: "26px 36px", borderRadius: 40, borderBottomLeftRadius: i % 2 ? 40 : 8, borderBottomRightRadius: i % 2 ? 8 : 40,
              transform: `scale(${0.7 + 0.3 * t})`, opacity: Math.min(1, t * 2) }}>{m}</div>
          );
        })}
      </div>
    </>
  );
};

const Split: React.FC<{ s: number }> = ({ s }) => {
  const f = useCurrentFrame();
  const right = progress(f, at("S7", "Nobody") - 2, 10);
  const between = at("S7", "between");
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: 540, height: 1920, background: C.paper }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: MONO, fontSize: 32, letterSpacing: "0.16em", color: C.muted }}>THE VISIT</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 180, color: C.good, transform: `scale(${pop(f, at("S7", "visit.") - 2, 10)})` }}>✓</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 940, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 44, color: C.ink, opacity: progress(f, at("S7", "fixed"), 8) }}>fixed by the scribe</div>
      </div>
      <div style={{ position: "absolute", left: 540, top: 0, width: 540, height: 1920, background: C.night, transform: `translateX(${(1 - right) * 540}px)` }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: MONO, fontSize: 32, letterSpacing: "0.16em", color: "#8B90A3" }}>BETWEEN VISITS</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 180, color: C.bad, transform: `scale(${pop(f, between, 10)})`, opacity: f >= between ? 1 : 0 }}>✕</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 940, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 44, color: "#E9E3D6", opacity: progress(f, at("S7", "happens"), 8) }}>fixed by nobody</div>
      </div>
    </>
  );
};

const Home: React.FC<{ s: number }> = () => {
  const f = useCurrentFrame();
  const words: [string, number][] = [["the work", at("S8", "work")], ["that follows", at("S8", "follows")], ["you home.", at("S8", "home.")]];
  return (
    <>
      <div style={{ position: "absolute", left: 80, right: 80, top: 520 }}>
        {words.map(([w, when], i) => (
          <div key={w} style={{ fontFamily: i === 2 ? SERIF : FONT, fontStyle: i === 2 ? "italic" : "normal", fontWeight: i === 2 ? 400 : 800, fontSize: 150, lineHeight: 1.05,
            letterSpacing: i === 2 ? "-0.01em" : "-0.04em", color: C.paper, opacity: progress(f, when - 2, 6), transform: `translateY(${(1 - progress(f, when - 2, 8)) * 40}px)` }}>{w}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1240, textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: "0.2em", color: "#FFFFFFB0",
        opacity: progress(f, at("S8", "home.") + 10, 10) }}>DOCX · CARE BETWEEN VISITS</div>
    </>
  );
};

const SHOTS: readonly Shot[] = [
  { from: 0, bg: C.paper, C: Clock },
  { from: at("S1", "Dinner's") - 2, bg: "#DCE3E6", C: Dinner },
  { from: at("S1", "And") - 2, bg: C.night, C: Charting },
  { from: at("S2", "hospital") - 2, bg: C.orange, C: Buys },
  { from: at("S2", "AI") - 2, bg: C.ink, C: Scribe },
  { from: at("S2", "listens.") - 4, bg: C.paper, C: Listens },
  { from: at("S2", "writes") - 3, bg: "#E9E3D6", C: Writes },
  { from: at("S2", "Problem") - 2, bg: C.ink, C: Solved },
  { from: at("S3", "JAMA") - 3, bg: C.paper, C: Journal },
  { from: at("S3", "eight") - 3, bg: C.paper, C: Clinicians },
  { from: at("S3", "across") - 2, bg: "#E9E3D6", C: Systems },
  { from: at("S4", "Time") - 3, bg: C.paper, C: NotesDown },
  { from: at("S4", "Sixteen") - 3, bg: C.good, C: Sixteen },
  { from: at("S5", "Time") - 3, bg: C.night, C: AfterHours },
  { from: at("S5", "No") - 2, bg: C.night, C: NoChange },
  { from: at("S6", "Because") - 3, bg: C.paper, C: NotWhole },
  { from: at("S6", "inbox.") - 4, bg: C.ink, C: InboxShot },
  { from: at("S6", "results.") - 3, bg: "#E9E3D6", C: Results },
  { from: at("S6", "quick") - 3, bg: C.orange, C: Quick },
  { from: at("S7", "The") - 3, bg: C.paper, C: Split },
  { from: at("S8", "That's") - 3, bg: C.orange, C: Home },
];

/** Small captions, farza-style: a few words at a time on a dark pill, low in the frame. */
const MiniCaptions: React.FC = () => {
  const f = useCurrentFrame();
  const words = TAKE.scenes.flatMap((s) => s.words);
  const i = words.findIndex((w, k) => f >= w.frame && f < (words[k + 1]?.frame ?? w.endFrame + 12));
  if (i < 0 || f > words[words.length - 1].endFrame + 10) return null;
  const start = Math.floor(i / 4) * 4;
  const chunk = words.slice(start, start + 4);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1500, display: "flex", justifyContent: "center" }}>
      <div style={{ background: "#000000CC", borderRadius: 14, padding: "12px 24px", fontFamily: FONT, fontWeight: 600, fontSize: 40, color: "#fff" }}>
        {chunk.map((w, k) => <span key={`${w.frame}-${k}`} style={{ opacity: f >= w.frame ? 1 : 0.45 }}>{k ? " " : ""}{w.token}</span>)}
      </div>
    </div>
  );
};

const sfx = (): SfxCue[] => [
  ...SHOTS.slice(1).map((s) => ({ at: s.from, sound: "whoosh" as const, volume: 0.16 })),
  ...Array.from({ length: 8 }, (_, k) => ({ at: SHOTS[2].from + 4 + k * 3, sound: "tick" as const, volume: 0.1 })),
  { at: at("S2", "buys"), sound: "thud", volume: 0.45 },
  { at: at("S2", "AI") - 2, sound: "impact", volume: 0.3 },
  { at: at("S2", "listens.") - 4, sound: "hum", volume: 0.12 },
  { at: at("S2", "solved?"), sound: "pop", volume: 0.35 },
  { at: at("S3", "JAMA") - 3, sound: "swoosh", volume: 0.3 },
  { at: at("S3", "clinicians,") + 4, sound: "ding", volume: 0.25 },
  ...[0, 1, 2, 3, 4].map((i) => ({ at: at("S3", "health") + i * 4, sound: "blip" as const, volume: 0.22 })),
  { at: at("S4", "down."), sound: "click", volume: 0.35 },
  { at: at("S4", "Sixteen"), sound: "impact", volume: 0.3 },
  { at: at("S5", "Time") - 40, sound: "riser", volume: 0.22 },
  { at: at("S5", "significant") - 2, sound: "impact", volume: 0.42 },
  { at: at("S6", "inbox.") - 2, sound: "pop", volume: 0.3 },
  ...[0, 1, 2, 3, 4].map((i) => ({ at: at("S6", "results.") - 3 + i * 3, sound: "blip" as const, volume: 0.18 })),
  ...[0, 1, 2].map((i) => ({ at: at("S6", "quick") - 3 + i * 7, sound: "ding" as const, volume: 0.2 })),
  { at: at("S7", "visit.") - 2, sound: "click", volume: 0.35 },
  { at: at("S7", "Nobody") - 2, sound: "swoosh", volume: 0.35 },
  { at: at("S7", "between"), sound: "thud", volume: 0.45 },
  { at: at("S8", "home.") + 6, sound: "shimmer", volume: 0.3 },
];

/** A short shake on the two impacts that matter. */
const shakeAt = (f: number): string => {
  const hits = [at("S2", "AI") - 2, at("S5", "significant") - 2];
  let dx = 0, dy = 0;
  for (const h of hits) {
    if (f >= h && f < h + 12) {
      const k = 1 - (f - h) / 12;
      dx += Math.sin((f - h) * 2.7) * 14 * k * k;
      dy += Math.cos((f - h) * 3.3) * 10 * k * k;
    }
  }
  return `translate(${dx}px, ${dy}px)`;
};

export const ScribeEvening: React.FC = () => {
  const f = useCurrentFrame();
  const idx = SHOTS.reduce((acc, s, i) => (f >= s.from ? i : acc), 0);
  const shot = SHOTS[idx];
  const Shot = shot.C;
  // A slow push on every shot keeps the frame alive between cuts.
  const push = 1 + 0.03 * Math.min(1, (f - shot.from) / 45);
  return (
    <AbsoluteFill style={{ background: shot.bg }}>
      <AbsoluteFill style={{ transform: `${shakeAt(f)} scale(${push})` }}>
        <Shot s={shot.from} />
      </AbsoluteFill>
      <MiniCaptions />
      <VoiceOver take={TAKE} />
      <SfxTrack cues={sfx()} />
    </AbsoluteFill>
  );
};

export const SCRIBE_COVER = at("S5", "change.") + 6;
