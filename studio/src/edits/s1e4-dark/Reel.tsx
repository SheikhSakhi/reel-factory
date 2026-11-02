import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BRAND } from "../../brand/brand";
import { pop, progress } from "../../kit";
import { ThreeCanvas } from "@remotion/three";
import { NarratorLights, TiNarrator, type TiPose } from "../../kit/Narrator3D";
import envJson from "../../../public/edit/s1e4-dark/env.json";
import timeline from "../../../public/edit/s1e4-dark/timeline.json";
import light from "../../../public/edit/s1e4-dark/light.json";
import wordsJson from "../../../public/edit/s1e4-dark/words.json";

// NVIDIA Journey S1E4, dark rebuild: the creator's own footage (auto-darkened where a scene is light), the narration
// spliced with converted inserts (briefs/nvidia-s1e4), a rebuilt cough example for attention, and a new ending: what a
// general AI does with that sentence, closing on Treatment Intelligence.

const FPS = 30;
const D = "edit/s1e4-dark";
const SANS = BRAND.theme.fontBody;
const SERIF = BRAND.theme.fontDisplay;
const MONO = BRAND.theme.fontMono;
const BLUE = "#4C8DFF";
const GOLD = "#F2C14E";
const BG = "#05070D";
const PANEL_H = 1270;

type Piece = { kind: "src" | "new"; out: number; dur: number; src: number };
const PIECES = (timeline as { total: number; pieces: Piece[] }).pieces;
export const S1E4_DURATION = Math.ceil((timeline as { total: number }).total * FPS);
const LIGHT = light as [number, number][];
type W = { text: string; start: number; end: number };
const WORDS = (wordsJson as { words: W[] }).words;

/** Output second of the first spoken word matching `token` after `after` seconds. */
const t = (token: string, after = 0): number => {
  const w = WORDS.find((x) => x.start >= after && x.text.toLowerCase().replace(/[^a-z0-9']/g, "") === token.toLowerCase().replace(/[^a-z0-9']/g, ""));
  if (!w) throw new Error(`word "${token}" after ${after}s not found`);
  return w.start;
};
const F = (sec: number) => Math.round(sec * FPS);

const CAT_FROM = 44.4;
const CAT_TO = t("transformer", 64) + 1.0;
const END_FROM = PIECES[PIECES.length - 1].out;

// ---------- the footage, remapped and darkened ----------

const isLight = (srcSec: number) => LIGHT.some(([a, b]) => srcSec >= a && srcSec < b);

/** One stretch of source footage on the output timeline; inverts light scenes into a dark theme frame by frame. */
const Footage: React.FC<{ srcStart: number }> = ({ srcStart }) => {
  const f = useCurrentFrame();
  const srcSec = srcStart + f / FPS;
  const dark = isLight(srcSec);
  return (
    <AbsoluteFill style={{ background: BG }}>
      <OffthreadVideo src={staticFile(`${D}/source.mp4`)} startFrom={F(srcStart)} muted
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: dark ? "invert(1) hue-rotate(180deg) contrast(1.05)" : "contrast(1.04) brightness(0.96)" }} />
    </AbsoluteFill>
  );
};

/** Footage stretches: the source pieces as they are; inserts keep the robot moving from the cut point; the long new
 * ending loops a dark stretch of the robot (the top of the frame is covered by the rebuilt panels there). */
const STRETCHES: { from: number; dur: number; src: number }[] = (() => {
  const out: { from: number; dur: number; src: number }[] = [];
  for (const p of PIECES) {
    if (p.kind === "src" || p.dur < 5) out.push({ from: p.out, dur: p.dur, src: p.src });
    else {
      // Only stretches with nothing but the robot in the lower frame (the source shows a label and an icon 98.5-104.5).
      const CLEAN = [94.0, 105.0];
      let at = p.out;
      for (let k = 0; at < p.out + p.dur; k++) {
        const d = Math.min(3.9, p.out + p.dur - at);
        out.push({ from: at, dur: d, src: CLEAN[k % 2] });
        at += d;
      }
    }
  }
  return out;
})();

// ---------- shared pieces for the rebuilt panels ----------

const Panel: React.FC<{ from: number; to: number; h?: number; children: React.ReactNode }> = ({ from, to, h = PANEL_H, children }) => {
  const f = useCurrentFrame();
  const s = f / FPS;
  if (s < from || s >= to) return null;
  const a = Math.min(progress(f, F(from), 8), 1 - progress(f, F(to) - 8, 8));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h + 140, opacity: a,
      background: `linear-gradient(180deg, ${BG} 0%, ${BG} ${(h / (h + 140)) * 100}%, transparent 100%)` }}>
      {children}
    </div>
  );
};

/** Top captions in the original's style: the current few words, the spoken one white and bold, the rest grey. */
const TopCaption: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const ws = WORDS.filter((w) => w.start >= from - 0.05 && w.start < to);
  const i = ws.findIndex((w, k) => s >= w.start - 0.05 && s < (ws[k + 1]?.start ?? w.end + 0.6));
  if (i < 0) return null;
  const start = Math.floor(i / 3) * 3;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 96, textAlign: "center", fontFamily: SANS, fontSize: 46, letterSpacing: "-0.01em" }}>
      {ws.slice(start, start + 3).map((w, k) => (
        <span key={`${w.start}-${k}`} style={{ color: start + k === i ? "#FFFFFF" : "#FFFFFF66", fontWeight: start + k === i ? 800 : 500, marginRight: 14 }}>
          {w.text.replace(/[.,?]$/, "")}
        </span>
      ))}
    </div>
  );
};

// ---------- the cough example (replaces the cat sentence) ----------

const SENT = ["I", "have", "a", "cough", "and", "it", "is", "getting", "worse", "at", "night"];
const COUGH = [2, 3]; // "a cough"
const IT = 5;
const colX = (i: number) => 60 + i * 96;

const Column: React.FC<{ i: number; at: number }> = ({ i, at }) => {
  const f = useCurrentFrame();
  const p = pop(f, at, 14);
  const seed = (k: number) => Math.abs(Math.sin(i * 12.9898 + k * 78.233)) % 1;
  return (
    <div style={{ position: "absolute", left: colX(i) - 20, top: 640, width: 40, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 40}px)` }}>
      {Array.from({ length: 7 }).map((_, k) => {
        const r = seed(k);
        const c = r < 0.45 ? "#2F5FBF" : r < 0.75 ? "#DCE3EE" : "#E3A955";
        return <div key={k} style={{ width: 40, height: 22, marginBottom: 6, borderRadius: 5, background: c, opacity: 0.9 }} />;
      })}
    </div>
  );
};

const Arc: React.FC<{ from: number; to: number; at: number; color: string; width?: number; lift?: number }> = ({ from, to, at, color, width = 3, lift = 120 }) => {
  const f = useCurrentFrame();
  const p = progress(f, at, 14);
  const x1 = colX(from), x2 = colX(to), y = 630;
  const d = `M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - lift} ${x2} ${y}`;
  return (
    <svg width={1080} height={900} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
    </svg>
  );
};

const CatPanel: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const typeFrom = t("type", 44) + 0.2;
  const typed = "I have a cough and it is getting worse at night".slice(0, Math.max(0, Math.floor((s - typeFrom) * 32)));
  const every = t("every", 45);
  const paper = t("2017", 48);
  const attention = t("attention.", 50);
  const each = t("each", 52);
  const sentence = t("sentence,", 56);
  const links = t("links", 60);
  const cough2 = t("cough,", 62);
  const thats = t("that's", 62.5);
  const tT = t("t", 63);
  const transformer = t("transformer.", 64);
  const showTyped = s < every;
  return (
    <Panel from={CAT_FROM} to={CAT_TO}>
      <TopCaption from={CAT_FROM} to={CAT_TO} />
      {/* typing the sentence */}
      {showTyped ? (
        <div style={{ position: "absolute", left: 80, right: 80, top: 420, padding: "26px 30px", borderRadius: 26, background: "#121826", border: "1px solid #FFFFFF22",
          fontFamily: SANS, fontSize: 40, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: progress(f, F(CAT_FROM), 8) }}>
          <span>{typed}<span style={{ color: BLUE, opacity: Math.floor(f / 15) % 2 }}>|</span></span>
          <span style={{ width: 54, height: 54, borderRadius: 27, background: BLUE, flexShrink: 0 }} />
        </div>
      ) : null}
      {/* every word becomes a list of numbers */}
      {s >= every ? SENT.map((w, i) => {
        const isCough = COUGH.includes(i), isIt = i === IT;
        const hot = (isCough && s >= cough2 - 0.4) || (isIt && s >= links + 0.2);
        return (
          <React.Fragment key={i}>
            <Column i={i} at={F(every) + i * 3} />
            <div style={{ position: "absolute", left: colX(i) - 48, width: 96, top: 1050, textAlign: "center", fontFamily: SANS, fontWeight: hot ? 800 : 600,
              fontSize: 25, color: hot ? (isIt ? GOLD : "#FFFFFF") : "#FFFFFFAA", opacity: progress(f, F(every) + i * 3, 8),
              textShadow: hot ? `0 0 14px ${isIt ? GOLD : "#FFFFFF"}` : "none" }}>{w}</div>
          </React.Fragment>
        );
      }) : null}
      {/* the 2017 paper */}
      {s >= paper - 0.2 && s < each ? (
        <div style={{ position: "absolute", left: 140, right: 140, top: 250, padding: "22px 28px", borderRadius: 14, background: "#0F1624", border: "1px solid #FFFFFF22",
          display: "flex", gap: 20, alignItems: "center", opacity: progress(f, F(paper) - 6, 8), transform: `translateY(${(1 - progress(f, F(paper) - 6, 10)) * -30}px)` }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 56, color: BLUE }}>2017</div>
          <div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, color: "#FFFFFF" }}>Attention Is All You Need</div>
            <div style={{ fontFamily: MONO, fontSize: 20, color: "#FFFFFF88" }}>Vaswani et al. · Google</div>
          </div>
        </div>
      ) : null}
      {s >= attention - 0.2 && s < each ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", fontFamily: SERIF, fontSize: 120, color: "#FFFFFF",
          textShadow: `0 0 30px ${BLUE}`, opacity: progress(f, F(attention) - 6, 8) }}>Attention</div>
      ) : null}
      {/* each word looks back */}
      {s >= each && s < links ? SENT.map((_, i) => (i > 0 ? (
        <Arc key={i} from={i} to={Math.max(0, i - 1 - (i % 3))} at={F(each) + i * 5} color="#6FA0FF" width={2} lift={70 + (i % 3) * 40} />
      ) : null)) : null}
      {/* the sentence, read aloud */}
      {s >= sentence - 0.2 ? (
        <div style={{ position: "absolute", left: 70, right: 70, top: 250, textAlign: "center", fontFamily: SERIF, fontSize: 64, lineHeight: 1.15, color: "#FFFFFF",
          opacity: progress(f, F(sentence) - 6, 8) * (1 - progress(f, F(thats) - 4, 8)) }}>
          “{SENT.map((w, i) => {
            const on = (COUGH.includes(i) && s >= cough2 - 0.4) || (i === IT && s >= links + 0.2);
            return <span key={i} style={{ color: on ? (i === IT ? GOLD : "#FFFFFF") : "#FFFFFFCC", fontStyle: on ? "italic" : "normal",
              background: on ? "#FFFFFF14" : "transparent", borderRadius: 8, padding: on ? "0 6px" : 0 }}>{w}{i < SENT.length - 1 ? " " : ""}</span>;
          })}”
        </div>
      ) : null}
      {/* attention links "it" to "a cough" */}
      {s >= links ? <Arc from={IT} to={3} at={F(links) + 6} color={GOLD} width={6} lift={260} /> : null}
      {s >= links + 0.3 && s < thats ? (
        <div style={{ position: "absolute", left: colX(3) - 120, width: colX(IT) - colX(3) + 240, top: 440, textAlign: "center", fontFamily: MONO, fontSize: 32, color: GOLD,
          opacity: progress(f, F(links) + 12, 8) }}>“it” → “a cough”</div>
      ) : null}
      {/* ChatGPT: the T */}
      {s >= thats - 0.1 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", opacity: progress(f, F(thats) - 4, 8) }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 150, letterSpacing: "-0.04em", color: "#FFFFFF" }}>
            ChatGP<span style={{ color: s >= tT - 0.1 ? BLUE : "#FFFFFF", textShadow: s >= tT - 0.1 ? `0 0 30px ${BLUE}` : "none" }}>T</span>
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 40, color: "#FFFFFFAA", marginTop: 6, opacity: progress(f, F(transformer) - 8, 8) }}>
            Generative Pre-trained <span style={{ color: BLUE, fontWeight: 800 }}>Transformer</span>
          </div>
        </div>
      ) : null}
    </Panel>
  );
};

// ---------- next word (replaces the cat sentence and "tired" in the layers scene) ----------

const NEXT: [string, number][] = [["night", 41], ["times", 16], ["rest", 9], ["home", 7], ["work", 5]];

const NextWordPanel: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const from = CAT_TO;
  const to = t("but", 73) - 0.05;
  const stack = t("stack", 65);
  const last = t("last", 67);
  const scores = t("scores", 69);
  const pick = t("pick", 71);
  const add = t("add", 72);
  const repeat = t("repeat.", 72.5);
  const LAYERS = 9;
  const filled = s >= add + 0.25;
  return (
    <Panel from={from} to={to} h={1450}>
      <TopCaption from={from} to={to} />
      {/* the stack of layers */}
      {Array.from({ length: LAYERS }).map((_, i) => {
        const p = progress(f, F(stack) + i * 3, 10);
        const isLast = i === 0 && s >= last;
        const y = 640 + i * 54;
        return (
          <div key={i} style={{ position: "absolute", left: 190, width: 700, top: y, height: 120, opacity: p * (s >= scores && i > 0 ? 0.55 : 1),
            transform: `perspective(900px) rotateX(62deg) translateY(${(1 - p) * 60}px)`,
            border: `2px solid ${isLast ? BLUE : "#5B6B9A88"}`, background: isLast ? "#4C8DFF22" : "#1A223A55", borderRadius: 10,
            boxShadow: isLast ? `0 0 30px ${BLUE}` : "none" }} />
        );
      })}
      {s >= stack && s < scores ? (
        <div style={{ position: "absolute", right: 70, top: 640, fontFamily: MONO, fontSize: 24, letterSpacing: "0.12em", color: "#FFFFFF88", textAlign: "right",
          opacity: progress(f, F(t("dozens", 66)), 8) }}>DOZENS<br />OF LAYERS</div>
      ) : null}
      {/* scores for every possible next word */}
      {s >= scores - 0.1 ? NEXT.map(([w, pct], i) => {
        const p = progress(f, F(scores) + i * 4, 14);
        const hot = i === 0 && s >= pick;
        const hgt = pct * 9 * p;
        return (
          <div key={w} style={{ position: "absolute", left: 200 + i * 140, width: 100, top: 300, height: 400 }}>
            <div style={{ position: "absolute", bottom: hgt + 10, width: 100, textAlign: "center", fontFamily: SANS, fontWeight: hot ? 800 : 600, fontSize: 28,
              color: hot ? "#FFFFFF" : "#FFFFFFBB", opacity: p }}>{w}<div style={{ fontFamily: MONO, fontSize: 20, color: "#FFFFFF77" }}>{pct}%</div></div>
            <div style={{ position: "absolute", bottom: 0, width: 100, height: hgt, borderRadius: "10px 10px 0 0",
              background: i === 0 ? "#E8EDF5" : BLUE, boxShadow: hot ? "0 0 30px #FFFFFFAA" : "none",
              opacity: s >= pick && i > 0 ? 0.45 : 1 }} />
          </div>
        );
      }) : null}
      {s >= pick - 0.1 && s < add ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 240, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: "0.16em", color: BLUE,
          opacity: progress(f, F(pick), 6) }}>NEXT WORD</div>
      ) : null}
      {/* the sentence, waiting for its next word */}
      <div style={{ position: "absolute", left: 50, right: 50, top: 1190, textAlign: "center", fontFamily: SANS, fontSize: 34, color: "#FFFFFFDD",
        opacity: progress(f, F(stack) + 10, 10) }}>
        I have a cough and it is getting worse at{" "}
        <span style={{ display: "inline-block", minWidth: 110, padding: "2px 14px", borderRadius: 10, fontWeight: 800,
          background: filled ? BLUE : "transparent", border: filled ? "none" : "2px dashed #FFFFFF55", color: "#FFFFFF",
          transform: `scale(${filled ? 0.9 + 0.1 * pop(f, F(add) + 8, 12) : 1})` }}>{filled ? "night" : " "}</span>
        {s >= repeat ? <span style={{ marginLeft: 14, fontFamily: MONO, fontSize: 28, color: BLUE, opacity: progress(f, F(repeat), 6) }}>↻</span> : null}
      </div>
    </Panel>
  );
};

// ---------- the new ending: a general AI answers the same sentence ----------

const QUESTIONS = [
  "How long have you had it, and is it dry or producing phlegm?",
  "Any fever, wheezing, shortness of breath, or chest pain?",
  "Does it worsen when you lie down? Any blocked or runny nose, mucus in your throat, heartburn, or sour taste?",
];

const Chat: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const start = t("now", 95);
  const userAt = t("i", 98);
  const watch = t("watch", 101);
  const searches = t("searches", 102);
  const knows = t("knows", 104);
  const asks = t("asks", 106);
  const how = t("how", 108);
  const fever = t("fever", 110);
  const careless = t("careless.", 112);
  const typed = "I have a cough and it is getting worse at night".slice(0, Math.max(0, Math.floor((s - userAt) * 26)));
  const dim = progress(f, F(t("simply", 113)), 12);
  const site = Math.floor((s - searches) * 3) % 4;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 190, opacity: progress(f, F(start) - 6, 10) * (1 - dim), transform: `scale(${1 - dim * 0.06})`, transformOrigin: "50% 0%" }}>
      <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.18em", color: "#FFFFFF77", marginBottom: 22 }}>A GENERAL AI ASSISTANT · EXAMPLE</div>
      {s >= userAt - 0.1 ? (
        <div style={{ marginLeft: "auto", width: "fit-content", maxWidth: 760, background: "#0B1A6E", color: "#DDE4FF", fontFamily: SANS, fontSize: 38, lineHeight: 1.3,
          padding: "22px 30px", borderRadius: 34 }}>{typed || " "}</div>
      ) : null}
      {s >= watch - 0.2 ? (
        <div style={{ marginTop: 30, fontFamily: SANS, fontSize: 32, color: "#FFFFFFDD", opacity: progress(f, F(watch) - 6, 8) }}>
          I'll check current guidance on nighttime cough and the symptoms that need urgent assessment.
        </div>
      ) : null}
      {s >= searches - 0.3 && s < knows + 0.3 ? (
        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 14, fontFamily: SANS, fontSize: 30, color: "#FFFFFF99" }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, border: "3px solid #FFFFFF44", borderTopColor: "#FFFFFF", transform: `rotate(${f * 18}deg)` }} />
          Searching {4} websites
          <span style={{ fontFamily: MONO, fontSize: 24, color: "#FFFFFF77" }}>{["nhs.uk", "website 2", "website 3", "website 4"][site]}</span>
        </div>
      ) : null}
      {s >= knows + 0.3 ? (
        <div style={{ marginTop: 22, opacity: progress(f, F(knows) + 9, 8) }}>
          <div style={{ fontFamily: SANS, fontSize: 24, color: "#FFFFFF66" }}>Worked for 24s ›</div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, lineHeight: 1.35, color: "#FFFFFF", marginTop: 10 }}>
            A cough that worsens at night can occur with mucus draining from the nose, acid reflux, or asthma; a respiratory infection is another common cause.
            <span style={{ fontWeight: 500, color: "#FFFFFFCC" }}> The nighttime pattern alone cannot establish the diagnosis.</span>
            <span style={{ marginLeft: 10, fontFamily: SANS, fontWeight: 600, fontSize: 22, color: "#FFFFFFAA", background: "#FFFFFF14", padding: "4px 12px", borderRadius: 14 }}>nhs.uk +1</span>
          </div>
        </div>
      ) : null}
      {s >= asks ? (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontFamily: SANS, fontSize: 30, color: "#FFFFFF", opacity: progress(f, F(asks), 8) }}>To narrow it down:</div>
          {QUESTIONS.map((q, i) => {
            const at = [how, fever, careless][i];
            return (
              <div key={i} style={{ display: "flex", gap: 14, marginTop: 12, fontFamily: SANS, fontWeight: 700, fontSize: 28, lineHeight: 1.3, color: "#FFFFFF",
                opacity: progress(f, F(at) - 6, 8) }}>
                <span style={{ color: "#FFFFFF99" }}>{i + 1}.</span><span>{q}</span>
              </div>
            );
          })}
          {s >= how - 0.2 && s < t("simply", 113) ? (
            <div style={{ marginTop: 16, display: "inline-block", fontFamily: MONO, fontSize: 22, letterSpacing: "0.14em", color: GOLD, border: `2px solid ${GOLD}`,
              borderRadius: 8, padding: "6px 14px", opacity: progress(f, F(how), 8) }}>THE SAME QUESTIONS FOR EVERYONE</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const Memory: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const simply = t("simply", 113);
  const predicts = t("predicts", 120);
  if (s < simply - 0.1 || s >= predicts) return null;
  const rows: [string, number][] = [["Your diagnosis", t("diagnosis,", 115)], ["Your medicines", t("medicines,", 116)], ["Your doctor's plan", t("plan", 118)]];
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 330, padding: "34px 36px", borderRadius: 26, background: "#0E1320", border: "1px solid #FFFFFF22",
      opacity: progress(f, F(simply), 10) * (1 - progress(f, F(predicts) - 8, 8)) }}>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.16em", color: "#FFFFFF88" }}>MEMORY OF YOUR TREATMENT</div>
      <div style={{ fontFamily: SERIF, fontSize: 72, color: "#FFFFFF", marginTop: 8 }}>Empty.</div>
      {rows.map(([label, at]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, padding: "18px 22px", borderRadius: 16,
          border: "2px dashed #FFFFFF33", opacity: progress(f, F(at) - 6, 8) }}>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, color: "#FFFFFFCC" }}>{label}</span>
          <span style={{ fontFamily: MONO, fontSize: 26, color: "#FF6B5A" }}>not known</span>
        </div>
      ))}
    </div>
  );
};

const Internet: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const from = t("predicts", 120);
  const to = t("your", 123);
  if (s < from - 0.1 || s >= to) return null;
  const snippets = ["…common causes of night cough…", "…postnasal drip…", "…acid reflux at night…", "…when to see a GP…", "…asthma symptoms…", "…home remedies…",
    "…cough lasting 3 weeks…", "…chest infection…", "…lying down makes it…", "…dry or chesty…"];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 200, height: 1000, opacity: progress(f, F(from), 8) * (1 - progress(f, F(to) - 6, 6)) }}>
      {snippets.map((sn, i) => {
        const y = 900 - ((f - F(from) + i * 14) * 6) % 900;
        return (
          <div key={i} style={{ position: "absolute", left: 80 + (i % 3) * 280, top: y, fontFamily: MONO, fontSize: 24, color: "#FFFFFF66",
            background: "#FFFFFF0D", padding: "8px 14px", borderRadius: 10 }}>{sn}</div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 64, color: "#FFFFFF",
        textShadow: "0 4px 30px #000" }}>likely words<br /><span style={{ fontWeight: 500, fontSize: 40, color: "#FFFFFFAA" }}>from what's written online</span></div>
    </div>
  );
};

const TI: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const from = t("your", 123);
  const why = t("that's", 128);
  if (s < from - 0.1) return null;
  const rows = ["Diagnosis", "Medicines", "Your doctor's plan", "Follow-up"];
  const final = s >= why - 0.1;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: PANEL_H }}>
      {!final ? (
        <div style={{ position: "absolute", left: 90, right: 90, top: 330, padding: "34px 36px", borderRadius: 26, background: "#0C1A1A", border: `1px solid ${"#3FC1AE"}55`,
          opacity: progress(f, F(from), 10) }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.16em", color: "#3FC1AE" }}>BUILT FOR TREATMENT</div>
          <div style={{ fontFamily: SERIF, fontSize: 64, color: "#FFFFFF", marginTop: 8 }}>Remembers your care.</div>
          {rows.map((r, i) => (
            <div key={r} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "16px 22px", borderRadius: 16,
              background: "#3FC1AE14", opacity: progress(f, F(t("remembers", 126)) + i * 5, 8) }}>
              <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, color: "#FFFFFF" }}>{r}</span>
              <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 32, color: "#3FC1AE" }}>✓</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", opacity: progress(f, F(why), 12) }}>
          <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: "0.3em", color: "#FFFFFF88" }}>FOR YOUR HEALTH</div>
          <div style={{ fontFamily: SERIF, fontSize: 112, lineHeight: 1.0, color: "#FFFFFF", marginTop: 20, transform: `scale(${0.9 + 0.1 * pop(f, F(t("treatment", 129)), 16)})` }}>
            Treatment<br /><span style={{ color: "#3FC1AE", fontStyle: "italic" }}>Intelligence</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.2em", color: "#FFFFFF66", marginTop: 26, opacity: progress(f, F(t("intelligence.", 129)) + 15, 10) }}>TI · TREINT</div>
        </div>
      )}
    </div>
  );
};

const EndPanel: React.FC = () => (
  <Panel from={END_FROM} to={999}>
    <TopCaption from={END_FROM} to={999} />
    <Chat />
    <Memory />
    <Internet />
    <TI />
  </Panel>
);

// ---------- Ti, the narrator (replaces the robot baked into the source footage) ----------

const ENV = (envJson as { env: number[] }).env;

/** Reactions only on the moments that matter; between them Ti stays calm. */
type Beat = { at: number; kind: keyof TiPose; amount: number };
const BEATS: Beat[] = [
  { at: 17.01, kind: "lift", amount: 0.06 },   // 86 billion
  { at: 27.09, kind: "nod", amount: 0.12 },    // 1943
  { at: 42.96, kind: "tilt", amount: 0.1 },    // a matrix
  { at: 51.59, kind: "look", amount: 0.16 },   // attention
  { at: 61.45, kind: "nod", amount: 0.14 },    // links it to a cough
  { at: 64.9, kind: "lift", amount: 0.07 },    // transformer
  { at: 77.49, kind: "look", amount: 0.14 },   // 175 billion
  { at: 94.68, kind: "tilt", amount: -0.1 },   // light bulb
  { at: 102.96, kind: "look", amount: 0.16 },  // it searches websites
  { at: 112.66, kind: "tilt", amount: 0.1 },   // it isn't careless
  { at: 114.35, kind: "nod", amount: 0.12 },   // no memory
  { at: 122.63, kind: "tilt", amount: -0.08 }, // internet
  { at: 129.73, kind: "lift", amount: 0.08 },  // use Treatment Intelligence
];
/** A smooth bump: rises over ~0.25 s, settles over ~0.9 s. */
const bump = (sec: number, at: number) => {
  const d = sec - at;
  if (d < -0.25 || d > 1.2) return 0;
  return d < 0 ? Math.sin(((d + 0.25) / 0.25) * (Math.PI / 2)) : Math.cos((d / 1.2) * (Math.PI / 2)) ** 2;
};
const poseAt = (sec: number): TiPose => {
  const p: TiPose = {};
  for (const b of BEATS) p[b.kind] = (p[b.kind] ?? 0) + b.amount * bump(sec, b.at);
  return p;
};

// ---------- bits of the source that sit in the stage area (the AI name pills, the "?" bubble), shown above the stage ----------

type Inset = { from: number; to: number; x: number; y: number; w: number; h: number; r: number };
// Source pixels, measured on the footage (y in source coordinates; the frame is cropped 40 px at the top).
const INSETS: Inset[] = [
  { from: 1.25, to: 3.2, x: 33, y: 1526, w: 292, h: 87, r: 44 },   // ChatGPT
  { from: 1.8, to: 3.2, x: 413, y: 1398, w: 256, h: 87, r: 44 },   // Claude
  { from: 2.55, to: 3.2, x: 772, y: 1526, w: 261, h: 87, r: 44 },  // Gemini
  { from: 6.9, to: 9.4, x: 680, y: 1367, w: 156, h: 156, r: 78 },  // the "?" bubble
];

const SourceInsets: React.FC = () => (
  <>
    {INSETS.map((b, i) => (
      <Sequence key={i} from={F(b.from)} durationInFrames={F(b.to) - F(b.from)} layout="none" name={`inset ${i}`}>
        <div style={{ position: "absolute", left: b.x - 4, top: b.y - 40 - 4, width: b.w + 8, height: b.h + 8, borderRadius: b.r + 4, overflow: "hidden" }}>
          <OffthreadVideo src={staticFile(`${D}/source.mp4`)} startFrom={F(b.from)} muted
            style={{ position: "absolute", left: -(b.x - 4), top: -(b.y - 4), width: 1080, height: 2000,
              filter: isLight((b.from + b.to) / 2) ? "invert(1) hue-rotate(180deg) contrast(1.05)" : "contrast(1.04) brightness(0.96)" }} />
        </div>
      </Sequence>
    ))}
  </>
);

const Ti: React.FC = () => {
  const f = useCurrentFrame();
  const sec = f / FPS;
  const talk = ENV[Math.min(ENV.length - 1, f)] ?? 0;
  // a slow drift so it never sits frozen; a small lean toward the panels while the new ending plays
  const turn = -0.18;
  return (
    <>
      {/* a dark stage across the bottom of the frame: it hides the robot baked into the footage, raised arms included */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1300, height: 620,
        background: "linear-gradient(180deg, rgba(12,12,14,0) 0%, rgba(12,12,14,0.92) 14%, #0C0C0E 22%, #0C0C0E 100%)" }} />
      <div style={{ position: "absolute", left: 240, width: 600, top: 1700, height: 160,
        background: "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,138,58,0.10) 0%, rgba(255,138,58,0) 100%)" }} />
      <SourceInsets />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1220, height: 700 }}>
        <ThreeCanvas width={1080} height={700} dpr={1} gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ position: [0, 0.75, 4.2], fov: 30 }}>
          <NarratorLights />
          <group position={[0, -0.95, 0]} rotation={[0.05, turn, 0]} scale={1.0}>
            <TiNarrator frame={f} talk={talk} look="cube" pose={poseAt(sec)} />
          </group>
        </ThreeCanvas>
      </div>
    </>
  );
};

export const S1E4Dark: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    {STRETCHES.map((st, i) => (
      <Sequence key={i} from={F(st.from)} durationInFrames={Math.max(1, F(st.from + st.dur) - F(st.from))} name={`footage ${i}`}>
        <Footage srcStart={st.src} />
      </Sequence>
    ))}
    <CatPanel />
    <NextWordPanel />
    <EndPanel />
    <Ti />
    <Audio src={staticFile(`${D}/voice.mp3`)} />
  </AbsoluteFill>
);

export const S1E4_COVER = F(t("transformer", 64));
