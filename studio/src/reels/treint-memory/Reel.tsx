import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import takeJson from "../../../public/vo/treint-memory-en-fast/take.json";
import { Captions, loadTake, VoiceOver, wordFrame, type VoScene } from "../../kit";
import { Agent, Notebook, Paper, Person, Strike } from "../agent-bank/icons";
import { LangProvider, type Lang } from "../agent-bank/lang";
import { C, F, H, W, useReelFonts } from "../agent-bank/style";
import { captionTake } from "../agent-bank/take";
import { At, Center, Chapter, Cues, Flash, Glass, Mono, Pill, Pop, ramp, Ring, Shell, Sweep, window01, Words, World, type Cue, type Mood } from "../agent-bank/ui";

// Video 2, "Care that remembers": one life line that breaks into fragments, is pulled
// back together into memory, starts managing care, proves itself as code, and becomes
// the ground the agents from video 1 meet on. Same world, icon and type as video 1.
const TAKE = loadTake(takeJson);
const LANG: Lang = { id: "en", take: TAKE, captions: captionTake(TAKE), music: "audio/treint-memory-en-fast/music.wav", keepTogether: [] };
export const TREINT_MEMORY_DURATION = TAKE.totalFrames;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const dur = (s: VoScene): number => s.to - s.from;
const useAt = (s: VoScene) => (token: string, occurrence = 0): number => wordFrame(TAKE, s.id, token, occurrence) - s.from;

// ── shared pieces ────────────────────────────────────────────────────
/** The life line: a horizontal thread with a heartbeat, drawn from left to right. */
const LifeLine: React.FC<{ t: number; y?: number; color?: string; glow?: number; broken?: number }> = ({ t, y = 560, color = C.fg, glow = 0, broken = 0 }) => {
  const f = useCurrentFrame();
  const beat = (x: number): number => {
    const k = (x + f * 3) % 520;
    return k > 240 && k < 300 ? Math.sin(((k - 240) / 60) * Math.PI * 2) * 38 : 0;
  };
  const pts = Array.from({ length: 97 }, (_, i) => {
    const x = 120 + i * 17;
    const jitter = broken * Math.sin(i * 1.7 + f / 6) * 14;
    return `${i === 0 ? "M" : "L"}${x} ${y - beat(x) + jitter}`;
  }).join(" ");
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, filter: glow ? `drop-shadow(0 0 ${14 * glow}px ${color})` : undefined }}>
      <path d={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" pathLength={1}
        strokeDasharray={broken > 0.05 ? `${0.06 * (1 - broken * 0.7)} ${0.04 + broken * 0.08}` : "1"} strokeDashoffset={broken > 0.05 ? 0 : 1 - t} />
    </svg>
  );
};

const Fragment: React.FC<{ at: number; x: number; y: number; title: string; children: React.ReactNode; color: string; pull?: number }> = ({ at, x, y, title, children, color, pull = 0 }) => (
  <At x={x + (W / 2 - x) * pull} y={y + (560 - y) * pull} style={{ opacity: 1 - pull, transform: `translate(-50%,-50%) scale(${1 - 0.7 * pull})` }}>
    <Pop at={at} from="scale">
      <Glass style={{ width: 380, padding: "26px 30px", borderLeft: `2px solid ${color}` }}>
        <Mono size={20} color={color}>{title}</Mono>
        <div style={{ marginTop: 14, fontFamily: F.body, fontSize: 28, color: C.fg, lineHeight: 1.35 }}>{children}</div>
      </Glass>
    </Pop>
  </At>
);

/** A memory cell: a glowing ring holding a patient's timeline. */
const Cell: React.FC<{ x: number; y: number; at: number; size?: number; label?: string; color?: string; seed?: number }> = ({ x, y, at, size = 120, label, color = C.cyan, seed = 0 }) => {
  const f = useCurrentFrame();
  const t = ramp(f, at, 18);
  const pulse = 1 + 0.05 * Math.sin(f / 10 + seed);
  return (
    <At x={x} y={y} style={{ opacity: t }}>
      <div style={{ width: size, height: size, borderRadius: "50%", border: `1px solid ${color}88`, transform: `scale(${(0.6 + 0.4 * t) * pulse})`,
        background: `radial-gradient(circle, ${color}33, ${color}05 65%, transparent 70%)`, boxShadow: `0 0 40px ${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size * 0.16, height: size * 0.16, borderRadius: "50%", background: "#fff", boxShadow: `0 0 18px ${color}` }} />
      </div>
      {label ? <Mono size={18} style={{ textAlign: "center", marginTop: 10 }}>{label}</Mono> : null}
    </At>
  );
};

// ── S1 · you told your story again ───────────────────────────────────
const S1: React.FC<{ s: VoScene }> = ({ s }) => {
  const at = useAt(s);
  const f = useCurrentFrame();
  const again = at("Again");
  const rewind = interpolate(f, [again - 4, again + 14], [1, 0], CLAMP);
  return (
    <Shell dur={dur(s)}>
      <LifeLine t={f < again ? ramp(f, 0, 90) : rewind} y={820} />
      <At x={W / 2} y={360}><Words text="Think about the last time you saw a doctor." at={at("Think")} size={64} maxWidth={1500} /></At>
      <At x={W / 2} y={470} style={{ opacity: 1 - ramp(f, again - 2, 8) }}><Words text="You told your story from the beginning." at={at("You") - 2} size={44} color={C.muted} /></At>
      <Center style={{ opacity: ramp(f, again - 2, 6) }}><Words text="*Again.*" at={again - 2} size={150} accent={C.red} /></Center>
    </Shell>
  );
};

// ── S2 · history in pieces, AI starts from zero ──────────────────────
const S2: React.FC<{ s: VoScene }> = ({ s }) => {
  const at = useAt(s);
  const f = useCurrentFrame();
  const ai = at("And") - 4;
  const zero = at("zero");
  const A = 1 - ramp(f, ai, 12);
  return (
    <Shell dur={dur(s)}>
      <Chapter n="01" label="today" />
      <AbsoluteFill style={{ opacity: A }}>
        <LifeLine t={1} y={560} broken={ramp(f, at("pieces") - 6, 20)} color={C.muted} />
        <At x={W / 2} y={170}><Words text="Your history lives in *pieces.*" at={at("Your")} size={66} accent={C.gold} /></At>
        <Fragment at={at("notebook") - 4} x={420} y={430} title="notebook" color={C.gold}>BP check in 2 weeks<br />Post-op day 14 · MRI</Fragment>
        <Fragment at={at("messenger") - 4} x={960} y={720} title="messenger" color={C.green}>“Doctor, the pain is back”<br />“Can I stop the pills?”</Fragment>
        <Fragment at={at("file") - 4} x={1500} y={430} title="another clinic" color={C.violet}>discharge_2025.pdf<br />scan_0417.jpg</Fragment>
      </AbsoluteFill>
      <Center style={{ opacity: ramp(f, ai, 12), flexDirection: "column", gap: 40 }}>
        <Glass style={{ width: 820, padding: "34px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
          <Mono size={20}>new conversation · ai</Mono>
          <div style={{ fontFamily: F.body, fontSize: 40, color: C.fg }}>Hello! How can I help you today?</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: ramp(f, zero - 4, 8) }}>
            <Pill color={C.red} size={30}>history: 0 visits · starts from zero</Pill>
          </div>
        </Glass>
      </Center>
      <Flash at={zero} color={C.red} strength={0.25} />
    </Shell>
  );
};

// ── S3 · care that remembers ─────────────────────────────────────────
const S3: React.FC<{ s: VoScene }> = ({ s }) => {
  const at = useAt(s);
  const f = useCurrentFrame();
  const rem = at("remembers");
  const visits = [at("visit"), at("visit", 1), at("doctor"), at("doctor", 1)];
  return (
    <Shell dur={dur(s)} shakeAt={[rem]}>
      <Chapter n="02" label="memory" />
      <LifeLine t={1} y={600} broken={1 - ramp(f, rem - 10, 24)} color={f > rem ? C.cyan : C.muted} glow={ramp(f, rem, 20)} />
      <At x={W / 2} y={230}><Words text="Imagine care that *remembers.*" at={at("Now")} size={88} /></At>
      <At x={W / 2} y={360} style={{ opacity: ramp(f, at("Not") - 2, 10) }}><Mono size={28}>not a file you upload · a memory that grows with you</Mono></At>
      {visits.map((v, i) => (
        <At key={i} x={460 + i * 330} y={600}>
          <Pop at={v - 2} from="scale">
            <div style={{ width: 22, height: 22, borderRadius: 11, background: "#fff", boxShadow: `0 0 24px ${C.cyan}` }} />
          </Pop>
          <Pop at={v}><Mono size={18} color={C.cyan} style={{ marginTop: 24, whiteSpace: "nowrap" }}>{i < 2 ? `visit ${i + 1}` : `doctor ${i - 1}`}</Mono></Pop>
        </At>
      ))}
      <Ring at={rem} x={W / 2} y={600} color={C.cyan} size={1800} />
      <Flash at={rem} color={C.cyan} strength={0.35} />
    </Shell>
  );
};

// ── S4 · every chat is a patient, every doctor has memory ────────────
const S4: React.FC<{ s: VoScene }> = ({ s }) => {
  const at = useAt(s);
  const f = useCurrentFrame();
  const doc = at("And") - 6;
  const timeline = [["2023", "E11.9", "type 2 diabetes"], ["2025", "K29.7", "gastritis · omeprazole"], ["03.2026", "I10", "BP 150/95"]] as const;
  return (
    <Shell dur={dur(s)} push={0.02}>
      <Chapter n="02" label="how treint remembers" />
      <At x={W / 2} y={150}><Words text="Every chat is a *patient.*" at={at("Every") - 2} size={70} /></At>
      {/* patient cell */}
      <At x={620} y={590}>
        <Pop at={at("patient") - 4} from="left">
          <Glass style={{ width: 640, padding: "30px 36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 16, height: 16, borderRadius: 8, background: "#fff", boxShadow: `0 0 16px ${C.cyan}` }} />
              <Mono size={22} color={C.cyan}>memory cell · patient 0417</Mono>
            </div>
            {timeline.map(([y, code, what], i) => (
              <Pop key={y} at={at("living") - 8 + i * 6}>
                <div style={{ display: "flex", gap: 22, alignItems: "baseline", marginTop: 20, paddingLeft: 18, borderLeft: `1px solid ${C.cyan}55` }}>
                  <Mono size={20} style={{ width: 110 }}>{y}</Mono>
                  <div style={{ fontFamily: F.mono, fontSize: 24, color: C.violet }}>{code}</div>
                  <div style={{ fontFamily: F.body, fontSize: 28, color: C.fg }}>{what}</div>
                </div>
              </Pop>
            ))}
          </Glass>
        </Pop>
      </At>
      {/* doctor memory */}
      <At x={1380} y={590} style={{ opacity: ramp(f, doc, 12) }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          <Agent size={170} />
          <Mono size={22} color={C.fg}>doctor memory</Mono>
          <div style={{ display: "flex", gap: 14 }}>
            <Pop at={at("think") - 4}><Pill size={30}>how they think</Pill></Pop>
            <Pop at={at("treat") - 4}><Pill size={30}>treat</Pill></Pop>
            <Pop at={at("out") - 6}><Pill size={30} color={C.green}>outcomes</Pill></Pop>
          </div>
        </div>
      </At>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: ramp(f, doc + 6, 14) }}>
        <path d="M950 590 C 1050 520, 1150 520, 1250 580" fill="none" stroke={C.cyan} strokeWidth="1.2" strokeDasharray="6 8" strokeDashoffset={-f} />
      </svg>
    </Shell>
  );
};

// ── S5 · memory becomes management ───────────────────────────────────
const S5: React.FC<{ s: VoScene }> = ({ s }) => {
  const at = useAt(s);
  const f = useCurrentFrame();
  const awake = at("memory") - 4;
  const sees = at("sees") - 4;
  const signals = [
    { at: at("changed") - 4, x: 560, y: 480, label: "changed · BP 150/95 → 162/98", color: C.gold },
    { at: at("missed") - 4, x: 960, y: 400, label: "missed · follow-up overdue", color: C.red },
    { at: at("next") - 4, x: 1360, y: 480, label: "next · HbA1c in 2 weeks", color: C.green },
  ];
  const scan = interpolate(f, [awake, awake + 120], [380, 1540], CLAMP);
  return (
    <Shell dur={dur(s)} push={0.02}>
      <Chapter n="03" label="between visits" />
      <At x={W / 2} y={170}>
        <div style={{ opacity: 1 - ramp(f, awake - 6, 10), position: "absolute", left: "50%", transform: "translateX(-50%)", top: -50 }}>
          <Words text="Not a series of visits." at={at("When")} size={60} color={C.muted} />
        </div>
        <div style={{ opacity: ramp(f, at("becomes") - 2, 10) }}><Words text="It becomes *management.*" at={at("becomes") - 2} size={84} /></div>
      </At>
      {/* appointment rail */}
      <div style={{ position: "absolute", left: 360, right: 360, top: 600, height: 1, background: C.line }} />
      {[380, 1540].map((x, i) => (
        <At key={x} x={x} y={600}><Pop at={at("visits") - 2 + i * 4} from="scale"><div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}><div style={{ width: 18, height: 18, borderRadius: 9, border: `1px solid ${C.fg}` }} /><Mono size={18}>{i ? "next visit" : "visit"}</Mono></div></Pop></At>
      ))}
      <div style={{ position: "absolute", left: scan - 2, top: 560, width: 4, height: 80, borderRadius: 2, background: C.cyan, boxShadow: `0 0 24px ${C.cyan}`, opacity: window01(f, awake, sees + 20, 8) }} />
      <At x={W / 2} y={690} style={{ opacity: ramp(f, awake, 10) * (1 - ramp(f, sees, 10)) }}><Mono size={22} color={C.cyan}>memory stays awake</Mono></At>
      {signals.map((sg) => (
        <At key={sg.label} x={sg.x} y={sg.y}>
          <Pop at={sg.at} from="down"><Pill size={26} color={sg.color}>{sg.label}</Pill></Pop>
        </At>
      ))}
      {/* the doctor sees it first */}
      <At x={760} y={850} style={{ opacity: ramp(f, sees, 12) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}><Agent size={110} /><Mono size={24} color={C.fg}>doctor · notified</Mono></div>
      </At>
      <At x={1260} y={850} style={{ opacity: ramp(f, at("patient") - 4, 12) * 0.5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}><Person size={90} color={C.muted} /><Mono size={24}>patient · hasn't said a word</Mono></div>
      </At>
    </Shell>
  );
};

// ── S6 · every decision becomes code, sealed ─────────────────────────
const CODE = [
  { k: "icd10", v: "\"I21.4\"", word: "diagnosis" },
  { k: "rx", v: "\"ticagrelor 180\"", word: "treatment" },
  { k: "doctor", v: "\"signed · Dr. S.\"", word: "signature" },
] as const;

const S6: React.FC<{ s: VoScene }> = ({ s }) => {
  const at = useAt(s);
  const f = useCurrentFrame();
  const codeAt = at("code") - 6;
  const hash = at("hash") - 2;
  const rewrite = at("rewrite");
  const verify = at("verify");
  const tamper = f >= rewrite && f < rewrite + 18;
  return (
    <Shell dur={dur(s)} shakeAt={[hash]}>
      <Chapter n="04" label="proof" />
      <At x={W / 2} y={160}><Words text="Because it remembers, it can *prove.*" at={at("And")} size={72} /></At>
      <At x={420} y={600} style={{ opacity: ramp(f, at("paper") - 6, 10) }}>
        <div style={{ position: "relative", width: 200, height: 200 }}><Paper size={200} color={C.muted} /><Strike t={ramp(f, at("paper"), 10)} size={200} /></div>
        <Mono size={22} style={{ textAlign: "center", marginTop: 10 }}>paper</Mono>
      </At>
      <At x={1140} y={600} style={{ opacity: ramp(f, codeAt, 10) }}>
        <div style={{ transform: `translateX(${tamper ? Math.sin(f * 3) * 10 : 0}px)` }}>
          <Glass glow={f >= hash ? C.green : C.cyan} style={{ width: 900, padding: "36px 44px", fontFamily: F.mono, fontSize: 32, lineHeight: 1.7, color: C.fg,
            border: `1px solid ${tamper ? C.red : f >= hash ? C.green + "88" : C.line}` }}>
            <div style={{ color: C.muted }}>{"{"}</div>
            {CODE.map((c) => (
              <div key={c.k} style={{ paddingLeft: 36, opacity: ramp(f, at(c.word) - 6, 10) }}>
                <span style={{ color: C.violet }}>{c.k}</span>: <span style={{ color: tamper && c.k === "rx" ? C.red : C.fg }}>{tamper && c.k === "rx" ? "\"something else\"" : c.v}</span>,
              </div>
            ))}
            <div style={{ paddingLeft: 36, opacity: ramp(f, hash, 8) }}>
              <span style={{ color: C.violet }}>hash</span>: <span style={{ color: C.green }}>"7f3a9e…c91"</span> <span style={{ color: C.green }}>🔒</span>
            </div>
            <div style={{ color: C.muted }}>{"}"}</div>
          </Glass>
        </div>
      </At>
      <At x={1140} y={900} style={{ opacity: tamper ? 1 : 0 }}><Pill size={28} color={C.red}>rewrite rejected · hash mismatch</Pill></At>
      <At x={1140} y={900} style={{ opacity: ramp(f, verify - 4, 8) }}><Pill size={28} color={C.green}>✓ verified</Pill></At>
      <Ring at={hash} x={1140} y={600} color={C.green} size={1200} />
      <Flash at={hash} color={C.green} strength={0.3} />
    </Shell>
  );
};

// ── S7 · Visa for clinical decisions ─────────────────────────────────
const S7: React.FC<{ s: VoScene }> = ({ s }) => {
  const at = useAt(s);
  const f = useCurrentFrame();
  const checks = [["The patient is real.", at("real") - 4], ["The history is theirs.", at("theirs") - 4], ["The decision is proven.", at("proven") - 4]] as const;
  return (
    <Shell dur={dur(s)}>
      <At x={W / 2} y={300}>
        <div style={{ display: "grid", gridTemplateColumns: "auto auto auto", columnGap: 40, rowGap: 22, alignItems: "baseline" }}>
          <Pop at={at("Visa") - 4}><div style={{ fontFamily: F.display, fontSize: 64, fontWeight: 600, color: C.muted }}>Visa</div></Pop>
          <Pop at={at("Visa")}><div style={{ fontFamily: F.display, fontSize: 64, fontWeight: 300, color: C.muted }}>→</div></Pop>
          <Pop at={at("payments") - 2}><div style={{ fontFamily: F.display, fontSize: 64, fontWeight: 600, color: C.muted }}>payments</div></Pop>
          <Pop at={at("we") - 2}><div style={{ fontFamily: F.display, fontSize: 64, fontWeight: 600, color: C.fg, letterSpacing: "0.1em" }}>TREINT</div></Pop>
          <Pop at={at("we")}><div style={{ fontFamily: F.display, fontSize: 64, fontWeight: 300, color: C.cyan }}>→</div></Pop>
          <Pop at={at("clinical") - 2}><div style={{ fontFamily: F.display, fontSize: 64, fontWeight: 600, color: C.cyan }}>clinical decisions</div></Pop>
        </div>
      </At>
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", gap: 60 }}>
        {checks.map(([t, a]) => (
          <Pop key={t} at={a}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 54, height: 54, borderRadius: 27, border: `1px solid ${C.green}`, color: C.green, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px ${C.green}44` }}>✓</div>
              <div style={{ fontFamily: F.body, fontSize: 38, fontWeight: 500, color: C.fg }}>{t}</div>
            </div>
          </Pop>
        ))}
      </div>
      <Ring at={at("proven")} x={W / 2} y={580} color={C.green} size={1600} />
    </Shell>
  );
};

// ── S8 · the agents from video 1 meet on the memory ──────────────────
const S8: React.FC<{ s: VoScene }> = ({ s }) => {
  const at = useAt(s);
  const f = useCurrentFrame();
  const check = at("check") - 2;
  const agents = [
    { label: "patient's agent", x: 480, y: 360, at: at("patient's") - 4, color: C.cyan, seed: 1 },
    { label: "doctor's agent", x: 1440, y: 360, at: at("doctor's") - 4, color: C.violet, seed: 2 },
    { label: "insurer's agent", x: 960, y: 790, at: at("insurer's") - 4, color: C.gold, seed: 3 },
  ];
  const core = { x: 960, y: 470 };
  return (
    <Shell dur={dur(s)} push={0.03}>
      <Chapter n="05" label="the agent economy" />
      <At x={W / 2} y={150} style={{ opacity: 1 - ramp(f, at("When") - 6, 10) }}><Words text="The memory the agent economy was *waiting for.*" at={at("This")} size={60} maxWidth={1600} /></At>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {agents.map((a) => (
          <line key={a.label} x1={a.x} y1={a.y} x2={a.x + (core.x - a.x) * ramp(f, check, 16)} y2={a.y + (core.y - a.y) * ramp(f, check, 16)}
            stroke={f >= check + 16 ? C.green : C.cyan} strokeWidth="1.5" strokeDasharray="6 8" strokeDashoffset={-f} />
        ))}
        {/* no trust between agents: dashed red lines that fade when they check the memory */}
        {[[0, 1], [1, 2], [2, 0]].map(([i, j]) => (
          <line key={`${i}${j}`} x1={agents[i].x} y1={agents[i].y} x2={agents[j].x} y2={agents[j].y} stroke={C.red} strokeWidth="1"
            opacity={window01(f, at("trust") - 6, check + 6, 6) * 0.6} strokeDasharray="3 10" />
        ))}
      </svg>
      {agents.map((a) => (
        <At key={a.label} x={a.x} y={a.y}><Pop at={a.at} from="scale"><div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}><Agent size={150} color={a.color} blinkSeed={a.seed} /><Mono size={20} color={C.fg}>{a.label}</Mono></div></Pop></At>
      ))}
      <At x={core.x} y={core.y}><Pop at={check - 8} from="scale">
        <div style={{ width: 150, height: 150, borderRadius: 75, background: `radial-gradient(circle, #fff, ${C.cyan} 30%, ${C.cyan}00 70%)`, boxShadow: `0 0 120px ${C.cyan}` }} />
      </Pop></At>
      <At x={core.x + 300} y={core.y + 40} style={{ opacity: ramp(f, check, 10) }}><Mono size={24} color={C.cyan}>they check the memory</Mono></At>
      <Ring at={check + 16} x={core.x} y={core.y} color={C.green} size={1400} />
    </Shell>
  );
};

// ── S9 · records sit still, memory moves ─────────────────────────────
const S9: React.FC<{ s: VoScene }> = ({ s }) => {
  const at = useAt(s);
  const f = useCurrentFrame();
  const mem = at("Memory") - 2;
  return (
    <Shell dur={dur(s)}>
      <At x={560} y={480}>
        <Pop at={at("Records") - 2}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, opacity: 1 - 0.6 * ramp(f, mem, 10) }}>
            <Notebook size={180} />
            <div style={{ fontFamily: F.display, fontSize: 64, fontWeight: 600, color: C.muted }}>Records sit still.</div>
          </div>
        </Pop>
      </At>
      <At x={1360} y={480}>
        <Pop at={mem}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{ position: "relative", width: 260, height: 180 }}>
              <svg width={260} height={180} style={{ filter: `drop-shadow(0 0 12px ${C.cyan})` }}>
                <path d={Array.from({ length: 27 }, (_, i) => `${i ? "L" : "M"}${i * 10} ${90 + Math.sin(i / 2.2 + f / 5) * 50}`).join(" ")} fill="none" stroke={C.cyan} strokeWidth="2" />
              </svg>
            </div>
            <div style={{ fontFamily: F.display, fontSize: 64, fontWeight: 600, color: C.fg }}>Memory <span style={{ color: C.cyan }}>moves.</span></div>
          </div>
        </Pop>
      </At>
      <div style={{ position: "absolute", left: 0, right: 0, top: 780, display: "flex", justifyContent: "center", gap: 30 }}>
        <Pop at={at("learns") - 4}><Pill size={40}>learns</Pill></Pop>
        <Pop at={at("manages") - 4}><Pill size={40} color={C.gold}>manages</Pill></Pop>
        <Pop at={at("proves") - 4}><Pill size={40} color={C.green}>proves</Pill></Pop>
      </div>
    </Shell>
  );
};

// ── S10 · we gave it memory ──────────────────────────────────────────
const S10: React.FC<{ s: VoScene }> = ({ s }) => {
  const at = useAt(s);
  const f = useCurrentFrame();
  const brand = at("Tre-int") - 2;
  return (
    <Shell dur={dur(s)} push={0.04} shakeAt={[brand]}>
      <LifeLine t={1} y={760} color={C.cyan} glow={1} />
      <At x={W / 2} y={300} style={{ opacity: 1 - ramp(f, brand - 4, 10) * 0.6 }}>
        <Words text="Healthcare has records. We gave it *memory.*" at={at("Healthcare") - 2} size={72} maxWidth={1700} />
      </At>
      <Center style={{ opacity: ramp(f, brand - 2, 10) }}>
        <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 200, letterSpacing: "0.2em", marginRight: "-0.2em", color: "#F6FDFF",
          textShadow: `0 0 30px ${C.cyan}66, 0 0 ${80 + 20 * Math.sin(f / 12)}px ${C.cyan}33`, transform: `scale(${0.92 + 0.08 * ramp(f, brand, 20)})`, marginTop: 120 }}>TREINT</div>
      </Center>
      <Ring at={brand} x={W / 2} y={H / 2 + 60} color={C.cyan} size={2000} dur={34} />
      <Flash at={brand} color={C.cyan} strength={0.5} />
    </Shell>
  );
};

const SCENES: Record<string, React.FC<{ s: VoScene }>> = { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10 };

const MOODS: Record<string, Mood> = {
  S1: { glow: C.violet, glow2: C.cyan, dark: 0.2, grid: 0.5 },
  S2: { glow: C.gold, glow2: C.red, dark: 0.15, grid: 0.4 },
  S3: { glow: C.cyan, glow2: C.violet, dark: 0, grid: 1 },
  S4: { glow: C.cyan, glow2: C.violet, dark: 0, grid: 1 },
  S5: { glow: C.cyan, glow2: C.gold, dark: 0, grid: 1 },
  S6: { glow: C.green, glow2: C.cyan, dark: 0.05, grid: 0.8 },
  S7: { glow: C.green, glow2: C.cyan, dark: 0, grid: 1 },
  S8: { glow: C.gold, glow2: C.cyan, dark: 0, grid: 1 },
  S9: { glow: C.cyan, glow2: C.violet, dark: 0.1, grid: 0.6 },
  S10: { glow: C.cyan, glow2: C.green, dark: 0, grid: 1 },
};

const mix = (a: string, b: string, t: number): string => `color-mix(in srgb, ${a} ${Math.round((1 - t) * 100)}%, ${b})`;
const useMood = (): Mood => {
  const f = useCurrentFrame();
  const i = Math.max(0, TAKE.scenes.findIndex((s) => f >= s.from && f < s.to));
  const cur = TAKE.scenes[i];
  const next = TAKE.scenes[Math.min(TAKE.scenes.length - 1, i + 1)];
  const a = MOODS[cur.id];
  const b = MOODS[next.id];
  const t = interpolate(f, [cur.to - 15, cur.to], [0, 1], CLAMP);
  return { glow: mix(a.glow, b.glow, t), glow2: mix(a.glow2, b.glow2, t), dark: a.dark + (b.dark - a.dark) * t, grid: a.grid + (b.grid - a.grid) * t };
};

const w = (id: string, token: string, occurrence = 0): number => wordFrame(TAKE, id, token, occurrence);
const CUES: readonly Cue[] = [
  { at: w("S1", "Again"), sound: "stamp", volume: 0.5 },
  { at: w("S2", "pieces"), sound: "crack", volume: 0.4 },
  { at: w("S2", "notebook") - 4, sound: "swipe", volume: 0.35 },
  { at: w("S2", "messenger") - 4, sound: "ping", volume: 0.35 },
  { at: w("S2", "file") - 4, sound: "swipe", volume: 0.35 },
  { at: w("S2", "And") - 4, sound: "swoosh", volume: 0.35 },
  { at: w("S2", "zero"), sound: "error", volume: 0.35 },
  { at: w("S3", "remembers") - 2, sound: "shield", volume: 0.5 },
  ...[0, 1].map((k) => ({ at: w("S3", "visit", k) - 2, sound: "node", volume: 0.35 })),
  ...[0, 1].map((k) => ({ at: w("S3", "doctor", k) - 2, sound: "node", volume: 0.35 })),
  { at: w("S4", "patient") - 4, sound: "swipe", volume: 0.4 },
  ...[0, 6, 12].map((k) => ({ at: w("S4", "living") - 8 + k, sound: "blip", volume: 0.35 })),
  { at: w("S4", "And") - 6, sound: "node", volume: 0.4 },
  { at: w("S4", "think") - 4, sound: "blip", volume: 0.3 },
  { at: w("S4", "treat") - 4, sound: "blip", volume: 0.3 },
  { at: w("S4", "out") - 6, sound: "ping", volume: 0.35 },
  { at: w("S5", "management"), sound: "riser", volume: 0.2 },
  { at: w("S5", "changed") - 4, sound: "ping", volume: 0.35 },
  { at: w("S5", "missed") - 4, sound: "error", volume: 0.25 },
  { at: w("S5", "next") - 4, sound: "ping", volume: 0.35 },
  { at: w("S5", "sees") - 4, sound: "node", volume: 0.45 },
  { at: w("S6", "code") - 6, sound: "swoosh", volume: 0.3 },
  { at: w("S6", "paper"), sound: "crack", volume: 0.3 },
  ...["diagnosis", "treatment", "signature"].map((t) => ({ at: w("S6", t) - 6, sound: "tick", volume: 0.4 })),
  { at: w("S6", "hash") - 2, sound: "stamp", volume: 0.6 },
  { at: w("S6", "hash"), sound: "shield", volume: 0.4 },
  { at: w("S6", "rewrite"), sound: "glitch", volume: 0.3 },
  { at: w("S6", "verify"), sound: "ping", volume: 0.45 },
  { at: w("S7", "Visa") - 4, sound: "swoosh", volume: 0.3 },
  { at: w("S7", "we") - 2, sound: "node", volume: 0.4 },
  ...["real", "theirs", "proven"].map((t) => ({ at: w("S7", t) - 4, sound: "blip", volume: 0.45 })),
  ...["patient's", "doctor's", "insurer's"].map((t) => ({ at: w("S8", t) - 4, sound: "node", volume: 0.4 })),
  { at: w("S8", "check") - 2, sound: "shield", volume: 0.5 },
  { at: w("S9", "Records") - 2, sound: "stamp", volume: 0.3 },
  { at: w("S9", "Memory") - 2, sound: "swoosh", volume: 0.35 },
  ...["learns", "manages", "proves"].map((t) => ({ at: w("S9", t) - 4, sound: "blip", volume: 0.4 })),
  { at: w("S10", "Tre-int") - 2, sound: "logo", volume: 0.7 },
];

export const TreintMemoryReel: React.FC = () => {
  useReelFonts();
  const mood = useMood();
  return (
    <LangProvider value={LANG}>
      <AbsoluteFill style={{ background: C.bg, fontFamily: F.body, color: C.fg }}>
        <World mood={mood} />
        {TAKE.scenes.map((s) => {
          const Scene = SCENES[s.id];
          return <Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from} name={s.id}><Scene s={s} /></Sequence>;
        })}
        {TAKE.scenes.slice(1).map((s) => <Sweep key={`sweep-${s.id}`} at={s.from - 8} />)}
        <Captions take={LANG.captions} fontFamily={F.body} color={C.fg} accent={C.cyan} fontSize={32} top={960} bottom={1050} centerX={W / 2} maxWidth={1500} maxChars={70} />
        <VoiceOver take={TAKE} />
        <Audio src={staticFile(LANG.music)} volume={0.42} />
        <Cues cues={CUES} />
      </AbsoluteFill>
    </LangProvider>
  );
};
