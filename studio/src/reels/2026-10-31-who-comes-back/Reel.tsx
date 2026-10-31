import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { VoiceOver, loadTake, pop, progress, wordFrame, scene } from "../../kit";
import { CameraRig, type Shot } from "../../kit/Cast3D";
import { NightCity } from "../../kit/NightCity";
import { CinemaGrade } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-10-31-who-comes-back/take.json";

// Formats lab F6 (visual essay), pilot: a calm documentary narrator over real NASA night imagery with data drawn on
// it and a 3D night city in between. Yellow-highlight captions, an ambient bed, no sound effects, no CTA.
const TAKE = loadTake(takeJson);
export const WHO_BACK_DURATION = TAKE.totalFrames;

const SANS = BRAND.theme.fontBody;
const SERIF = BRAND.theme.fontDisplay;
const MONO = BRAND.theme.fontMono;
const Y = "#F5E04A"; // highlight yellow
const INK = "#0B0F1A";
const A = "assets/2026-10-31-who-comes-back";

const at = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);
const S = (id: string) => scene(TAKE, id);

// ---------- building blocks ----------

/** A still photo that always moves: a slow push from one framing to another (Ken Burns), cover-cropped to 9:16. */
const Photo: React.FC<{ src: string; from: number; dur: number; z0?: number; z1?: number; x0?: number; x1?: number; y0?: number; y1?: number; dim?: number }> = ({
  src, from, dur, z0 = 1.15, z1 = 1.35, x0 = 50, x1 = 50, y0 = 50, y1 = 50, dim = 0,
}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [from, from + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ease = t * t * (3 - 2 * t);
  const z = z0 + (z1 - z0) * ease;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <Img src={staticFile(src)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover",
        objectPosition: `${x0 + (x1 - x0) * ease}% ${y0 + (y1 - y0) * ease}%`, transform: `scale(${z})`, filter: "contrast(1.08) saturate(1.1)" }} />
      {dim > 0 ? <AbsoluteFill style={{ background: `rgba(4,6,12,${dim})` }} /> : null}
    </AbsoluteFill>
  );
};

const CITY_SHOTS: Record<string, Shot> = {
  descend: { pos: [6, 9, 9], look: [0, 0.6, 0], fov: 40, drift: [-3.2, -5.5, -4.6] },
  orbit: { pos: [3.6, 2.6, 4.2], look: [0, 1.2, 0], fov: 38, drift: [-2.2, 0.2, 0.6] },
  wide: { pos: [9, 6.5, 10], look: [0, 0.4, 0], fov: 42, drift: [-1.5, 0.4, -1.0] },
  rise: { pos: [2.6, 2.2, 3.6], look: [0, 1.2, 0], fov: 38, drift: [3.5, 7.5, 6.5] },
};

const City: React.FC<{ shot: keyof typeof CITY_SHOTS; from: number; dur: number; ring?: number }> = ({ shot, from, dur, ring = 1 }) => {
  const f = useCurrentFrame();
  const t = Math.min(1, Math.max(0, (f - from) / dur));
  return (
    <AbsoluteFill>
      <ThreeCanvas width={1080} height={1920} dpr={1} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <CameraRig shot={CITY_SHOTS[shot]} t={t} />
        <NightCity frame={f} ring={ring} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ text: string; at: number; top?: number; left?: number }> = ({ text, at: start, top = 230, left = 70 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top, left, fontFamily: MONO, fontSize: 26, letterSpacing: "0.16em", color: "#FFFFFFCC", background: "rgba(0,0,0,0.45)",
      padding: "8px 16px", borderRadius: 6, opacity: progress(f, start, 10) }}>{text}</div>
  );
};

const Source: React.FC<{ text: string; at: number }> = ({ text, at: start }) => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: 70, right: 70, top: 1560, fontFamily: MONO, fontSize: 22, color: "#FFFFFF99", opacity: progress(f, start, 12) }}>{text}</div>;
};

const Big: React.FC<{ text: string; at: number; top: number; size?: number; color?: string }> = ({ text, at: start, top, size = 150, color = "#FFFFFF" }) => {
  const f = useCurrentFrame();
  if (f < start - 2) return null;
  const t = pop(f, start - 2, 14);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: "-0.03em", color,
      textShadow: "0 6px 30px rgba(0,0,0,0.6)", transform: `scale(${1.15 - 0.15 * t})`, opacity: Math.min(1, t * 2) }}>{text}</div>
  );
};

/** A person icon (head + shoulders). */
const Person: React.FC<{ lit: boolean; size?: number; t: number }> = ({ lit, size = 120, t }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 24 29" style={{ opacity: Math.min(1, t * 1.5), transform: `translateY(${(1 - t) * 30}px)` }}>
    <circle cx="12" cy="7" r="5" fill={lit ? Y : "#FFFFFF55"} />
    <path d="M2 28 C2 18 6 14 12 14 C18 14 22 18 22 28 Z" fill={lit ? Y : "#FFFFFF55"} />
  </svg>
);

// ---------- scenes (absolute frames) ----------

const S1Space: React.FC = () => {
  const f = useCurrentFrame();
  const city = at("S1", "hospital,") - 4;
  if (f >= city) return <City shot="descend" from={city} dur={S("S1").to - city + 40} />;
  return <Photo src={`${A}/blue-marble.jpg`} from={0} dur={city} z0={1.0} z1={1.9} x0={50} x1={36} y0={50} y1={58} />;
};

const S2OneInFive: React.FC = () => {
  const f = useCurrentFrame();
  const s = S("S2");
  const one = at("S2", "one");
  return (
    <>
      <Photo src={`${A}/us-night.jpg`} from={s.from} dur={s.to - s.from} z0={1.2} z1={1.45} x0={30} x1={55} y0={60} y1={50} dim={0.15} />
      <Tag text="UNITED STATES · MEDICARE" at={s.from + 6} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center", gap: 26 }}>
        {[0, 1, 2, 3, 4].map((i) => <Person key={i} lit={i === 2 && f >= at("S2", "five")} t={pop(f, one + i * 3, 14)} />)}
      </div>
      <Big text="19.6%" at={at("S2", "Medicare")} top={860} size={170} color={Y} />
      <Big text="back within 30 days" at={at("S2", "thirty")} top={1060} size={64} />
      <Source text="Jencks et al., NEJM 2009 · Medicare claims 2003-04" at={at("S2", "Medicare")} />
    </>
  );
};

const LETTERS: [string, string, string][] = [["L", "S3", "L."], ["A", "S3", "A."], ["C", "S3", "C."], ["E", "S3", "E."]];

const S3Score: React.FC = () => {
  const f = useCurrentFrame();
  const s = S("S3");
  return (
    <>
      <City shot="orbit" from={s.from} dur={s.to - s.from + 40} />
      <Big text="a score" at={at("S3", "score.")} top={360} size={90} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1150, display: "flex", justifyContent: "center", gap: 22 }}>
        {LETTERS.map(([l, id, w]) => {
          const when = at(id, w);
          const t = pop(f, when - 2, 12);
          return (
            <div key={l} style={{ width: 170, height: 190, borderRadius: 18, background: f >= when - 2 ? Y : "transparent", border: `4px solid ${Y}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 130, color: INK,
              transform: `scale(${f >= when - 2 ? 0.7 + 0.3 * t : 1})`, opacity: f >= at("S3", "letters.") - 4 ? 1 : 0 }}>{f >= when - 2 ? l : ""}</div>
          );
        })}
      </div>
    </>
  );
};

const ROWS: { l: string; name: string; value: string; pts: number; word: [string, string] }[] = [
  { l: "L", name: "Length of stay", value: "5 days", pts: 4, word: ["S4", "Length"] },
  { l: "A", name: "Acute admission", value: "yes", pts: 3, word: ["S4", "Acuity"] },
  { l: "C", name: "Comorbidities", value: "Charlson 2", pts: 2, word: ["S4", "Comorbidities."] },
  { l: "E", name: "ER visits, 6 months", value: "1", pts: 1, word: ["S4", "Emergency"] },
];

const ScoreCard: React.FC<{ total: boolean }> = ({ total }) => {
  const f = useCurrentFrame();
  const sum = at("S5", "points.");
  const shown = Math.round(interpolate(f, [sum, sum + 18], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 330, background: "rgba(12,16,28,0.86)", border: "1px solid #FFFFFF22", borderRadius: 26, padding: "34px 36px",
      backdropFilter: "blur(10px)" }}>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.16em", color: "#FFFFFF99" }}>EXAMPLE PATIENT · LACE</div>
      {ROWS.map((r) => {
        const when = at(r.word[0], r.word[1]);
        const t = pop(f, when - 3, 14);
        return (
          <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 22, opacity: f < when - 3 ? 0.18 : Math.min(1, t * 1.5) }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: Y, color: INK, fontFamily: SANS, fontWeight: 800, fontSize: 40, display: "flex",
              alignItems: "center", justifyContent: "center" }}>{r.l}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 38, color: "#FFFFFF" }}>{r.name}</div>
              <div style={{ fontFamily: SANS, fontSize: 28, color: "#FFFFFF99" }}>{r.value}</div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 40, color: Y }}>+{r.pts}</div>
          </div>
        );
      })}
      {total ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 26, paddingTop: 20, borderTop: "1px solid #FFFFFF33" }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: "#FFFFFF" }}>Score</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 96, color: Y }}>{shown}</div>
        </div>
      ) : null}
    </div>
  );
};

const S4Factors: React.FC = () => {
  const s = S("S4");
  return (
    <>
      <Photo src={`${A}/city-close.jpg`} from={s.from} dur={s.to - s.from + 260} z0={1.3} z1={1.7} x0={40} x1={55} dim={0.55} />
      <ScoreCard total={false} />
    </>
  );
};

const S5Range: React.FC = () => {
  const f = useCurrentFrame();
  const s = S("S5");
  const zero = at("S5", "Zero");
  const nineteen = at("S5", "Nineteen");
  const markerAt = interpolate(f, [zero, zero + 10, nineteen - 4, nineteen + 10], [0, 0, 0, 19], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = (v: number) => 90 + (v / 19) * 900;
  return (
    <>
      <Photo src={`${A}/city-close.jpg`} from={S("S4").from} dur={s.to - S("S4").from} z0={1.3} z1={1.7} x0={40} x1={55} dim={0.55} />
      <ScoreCard total />
      <div style={{ position: "absolute", left: 90, width: 900, top: 1120, height: 26, borderRadius: 13,
        background: "linear-gradient(90deg, #4ED1A1, #F5E04A 55%, #FF6B5A)", opacity: progress(f, zero - 6, 10) }} />
      {f >= zero - 2 ? (
        <>
          <div style={{ position: "absolute", left: x(markerAt) - 16, top: 1106, width: 32, height: 54, borderRadius: 8, background: "#FFFFFF", boxShadow: "0 0 18px #FFFFFF" }} />
          <div style={{ position: "absolute", left: 90, top: 1180, fontFamily: SANS, fontWeight: 800, fontSize: 64, color: "#4ED1A1" }}>0 → 2%</div>
        </>
      ) : null}
      {f >= nineteen ? <div style={{ position: "absolute", right: 90, top: 1180, fontFamily: SANS, fontWeight: 800, fontSize: 64, color: "#FF6B5A", opacity: progress(f, nineteen, 8) }}>19 → 44%</div> : null}
      <Tag text="RISK OF READMISSION OR DEATH · 30 DAYS" at={zero - 6} top={1280} left={90} />
      <Source text="van Walraven et al., CMAJ 2010 (derivation cohort). Example patient is illustrative." at={zero} />
    </>
  );
};

const S6Name: React.FC = () => {
  const f = useCurrentFrame();
  const s = S("S6");
  return (
    <>
      <City shot="wide" from={s.from} dur={s.to - s.from + 30} />
      <div style={{ position: "absolute", left: 70, right: 70, top: 560, textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: "0.3em", color: "#FFFFFFAA",
        opacity: progress(f, at("S6", "called") - 2, 8) }}>IT'S CALLED</div>
      <Big text="RISK STRATIFICATION" at={at("S6", "risk")} top={610} size={92} color={Y} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 64, color: "#FFFFFF",
        opacity: progress(f, at("S6", "roughly.") - 2, 8) }}>accuracy: moderate</div>
    </>
  );
};

const S7Gap: React.FC = () => {
  const f = useCurrentFrame();
  const s = S("S7");
  const half = at("S7", "half");
  const between = at("S7", "between.");
  const line = progress(f, at("S7", "patients"), 30);
  return (
    <>
      <Photo src={`${A}/east-airglow.jpg`} from={s.from} dur={s.to - s.from} z0={1.25} z1={1.5} x0={35} x1={55} y0={30} y1={34} dim={0.35} />
      <Tag text="SAME STUDY · MEDICAL PATIENTS READMITTED" at={s.from + 8} />
      <Big text="≈ 50%" at={half} top={420} size={190} color={Y} />
      {/* discharge -> gap -> back */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 860 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 26, color: "#FFFFFFCC", opacity: progress(f, at("S7", "patients"), 8) }}>
          <span>DISCHARGE</span><span>BACK IN HOSPITAL</span>
        </div>
        <div style={{ position: "relative", height: 40, marginTop: 16 }}>
          <div style={{ position: "absolute", left: 0, top: 18, width: `${line * 100}%`, height: 4, background: "repeating-linear-gradient(90deg, #FFFFFFAA 0 18px, transparent 18px 32px)" }} />
          <div style={{ position: "absolute", left: -14, top: 6, width: 28, height: 28, borderRadius: 14, background: "#FFFFFF" }} />
          {line > 0.98 ? <div style={{ position: "absolute", right: -14, top: 6, width: 28, height: 28, borderRadius: 14, background: "#FF6B5A" }} /> : null}
        </div>
        <div style={{ textAlign: "center", marginTop: 26, fontFamily: SANS, fontWeight: 700, fontSize: 52, color: "#FFFFFF", opacity: progress(f, at("S7", "seen") - 2, 8) }}>
          no doctor visit <span style={{ background: Y, color: INK, padding: "0 12px", borderRadius: 8 }}>in between</span>
        </div>
      </div>
      <Source text="Jencks et al., NEJM 2009: 50.2% of medical patients readmitted within 30 days had no physician visit in between" at={between - 10} />
    </>
  );
};

const S8Day3: React.FC = () => {
  const f = useCurrentFrame();
  const s = S("S8");
  const nobody = at("S8", "Nobody");
  const three = at("S8", "three.");
  return (
    <>
      <Photo src={`${A}/east-airglow.jpg`} from={S("S7").from} dur={s.to - S("S7").from} z0={1.25} z1={1.6} x0={35} x1={60} y0={30} y1={36} dim={0.65} />
      <div style={{ position: "absolute", left: 120, right: 120, top: 520, display: "flex", gap: 22 }}>
        {[1, 2, 3, 4].map((d) => {
          const isThree = d === 3;
          const lit = isThree && f >= three - 4;
          return (
            <div key={d} style={{ flex: 1, height: 230, borderRadius: 22, border: `3px solid ${lit ? Y : "#FFFFFF44"}`, background: lit ? "#F5E04A22" : "rgba(10,14,24,0.6)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: progress(f, s.from + d * 4, 10) }}>
              <div style={{ fontFamily: MONO, fontSize: 24, color: "#FFFFFF99", letterSpacing: "0.14em" }}>DAY</div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 96, color: lit ? Y : "#FFFFFF" }}>{d}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 56, color: "#FFFFFF", opacity: progress(f, nobody, 8) }}>
        missed calls: <span style={{ color: "#FF6B5A" }}>none.</span> calls made: <span style={{ color: "#FF6B5A" }}>none.</span>
      </div>
    </>
  );
};

const S9Knew: React.FC = () => {
  const f = useCurrentFrame();
  const s = S("S9");
  const end = s.words[s.words.length - 1].endFrame;
  return (
    <>
      <City shot="rise" from={s.from} dur={s.to - s.from} ring={1 - progress(f, at("S9", "call.") - 6, 30) * 0.8} />
      <div style={{ position: "absolute", left: 70, right: 70, top: 1640, fontFamily: MONO, fontSize: 20, lineHeight: 1.5, color: "#FFFFFF88", opacity: progress(f, end + 12, 14) }}>
        Sources: Jencks et al., NEJM 2009; van Walraven et al., CMAJ 2010. Imagery: NASA. The city, hospital and patient are illustrations.
      </div>
    </>
  );
};

const SCENES: [string, React.FC][] = [["S1", S1Space], ["S2", S2OneInFive], ["S3", S3Score], ["S4", S4Factors], ["S5", S5Range], ["S6", S6Name], ["S7", S7Gap], ["S8", S8Day3], ["S9", S9Knew]];

// ---------- captions: 1-3 words, the key word on a yellow highlight ----------

const KEY = new Set(["hospital,", "back.", "one", "five", "thirty", "days.", "score.", "L.", "A.", "C.", "E.", "stay.", "points.", "two", "percent", "Nineteen", "forty", "four.",
  "stratification.", "roughly.", "half", "doctor", "between.", "three.", "call."]);

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const words = TAKE.scenes.flatMap((s) => s.words);
  const i = words.findIndex((w, k) => f >= w.frame && f < (words[k + 1]?.frame ?? w.endFrame + 15));
  if (i < 0) return null;
  // chunks of up to 3 words, breaking after sentence ends
  const chunks: number[][] = [];
  words.forEach((w, k) => {
    const last = chunks[chunks.length - 1];
    if (!last || last.length >= 3 || /[.?!,]$/.test(words[last[last.length - 1]].token)) chunks.push([k]);
    else last.push(k);
  });
  const chunk = chunks.find((c) => c.includes(i))!;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1420, display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
      {chunk.map((k) => {
        const w = words[k];
        const key = KEY.has(w.token);
        const on = f >= w.frame;
        return (
          <span key={`${w.frame}-${k}`} style={{ fontFamily: SANS, fontWeight: 800, fontSize: 62, lineHeight: 1.1, color: key ? INK : "#FFFFFF",
            background: key && on ? Y : "transparent", padding: key ? "0 12px" : 0, borderRadius: 8, opacity: on ? 1 : 0.35,
            textShadow: key ? "none" : "0 3px 16px rgba(0,0,0,0.8)" }}>{w.token.replace(/[.,]$/, "")}</span>
        );
      })}
    </div>
  );
};

const SPEECH = TAKE.scenes.flatMap((s) => s.words.map((w) => [w.frame, w.endFrame] as const));
const musicVolume = (f: number) => (SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8) ? 0.2 : 0.34) * Math.min(1, f / 30);

/** Scenes are written in absolute frames, so the active one is chosen here (no Sequence, which would make frames local). */
const ActiveScene: React.FC = () => {
  const f = useCurrentFrame();
  const found = SCENES.find(([id]) => f >= S(id).from && f < S(id).to) ?? SCENES[SCENES.length - 1];
  const C = found[1];
  return <C />;
};

export const WhoComesBack: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <ActiveScene />
    <CinemaGrade grain={0.07} vignette={0.45} glow="#000000" />
    <Captions />
    <VoiceOver take={TAKE} volume={1.25} />
    <Audio src={staticFile("music/2026-10-31-who-comes-back.mp3")} volume={(f) => musicVolume(f)} />
  </AbsoluteFill>
);

export const WHO_BACK_COVER = at("S2", "Medicare") + 20;
