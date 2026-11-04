import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { VoiceOver, loadTake, pop, progress, wordFrame } from "../../kit";
import { CinemaGrade } from "../../kit/CinemaGrade";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-04-seven-doctors/take.json";

// Formats lab F3 (B-roll story), risograph print style: two inks (fluorescent pink, blue) on off-white paper, multiply
// overprint, halftone shading, slight misregistration, grain. One calm narrator, a soft ambient bed, no sound effects.
// A new literal picture every 1-2 s. No CTA.

const TAKE = loadTake(takeJson);
const TAIL = 45;
export const SEVEN_DURATION = TAKE.totalFrames + TAIL;
const W = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);
type Line = { id: string; from: number; to: number; words: { token: string; frame: number; endFrame: number }[] };
const LINES = (takeJson as unknown as { scenes: Line[] }).scenes;
const L = (id: string) => LINES.find((l) => l.id === id)!;

const PINK = "#FF4FA3";
const BLUE = "#2C54E8";
const INK = "#24204A";
const PAPER = "#F3EDE1";
const SANS = BRAND.theme.fontBody;
const SERIF = BRAND.theme.fontDisplay;
const MONO = BRAND.theme.fontMono;

// ---------- riso helpers ----------

/** Two-ink type: the pink plate printed a few pixels off the blue one. */
const RisoType: React.FC<{ children: React.ReactNode; size: number; top: number; at?: number; color?: string; serif?: boolean; italic?: boolean }> = ({
  children, size, top, at = 0, color = BLUE, serif = false, italic = false,
}) => {
  const f = useCurrentFrame();
  const p = pop(f, at, 13);
  const base: React.CSSProperties = {
    position: "absolute", left: 60, right: 60, top, textAlign: "center", fontFamily: serif ? SERIF : SANS, fontWeight: serif ? 400 : 800,
    fontStyle: italic ? "italic" : "normal", fontSize: size, lineHeight: 1.02, letterSpacing: serif ? "-0.01em" : "-0.035em",
    transform: `translateY(${(1 - p) * 30}px)`, opacity: Math.min(1, p * 1.6), mixBlendMode: "multiply",
  };
  return (
    <>
      <div style={{ ...base, color: PINK, left: 66, right: 54, top: top + 5 }}>{children}</div>
      <div style={{ ...base, color }}>{children}</div>
    </>
  );
};

const Defs: React.FC = () => (
  <defs>
    <pattern id="dotsPink" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
      <circle cx={7} cy={7} r={4.2} fill={PINK} />
    </pattern>
    <pattern id="dotsBlue" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
      <circle cx={6} cy={6} r={3.4} fill={BLUE} />
    </pattern>
    <pattern id="dotsBlueFine" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
      <circle cx={4.5} cy={4.5} r={2} fill={BLUE} />
    </pattern>
  </defs>
);

/** A full-frame SVG plate with the halftone patterns and a slow push-in. */
const Plate: React.FC<{ children: React.ReactNode; from: number; push?: number }> = ({ children, from, push = 0.05 }) => {
  const f = useCurrentFrame();
  const s = 1 + Math.min(1, (f - from) / 90) * push;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: "50% 45%", mixBlendMode: "multiply" }}>
      <Defs />
      {children}
    </svg>
  );
};

/** A faceless figure, head and shoulders; ink fill plus a halftone shadow on the other plate. */
const Bust: React.FC<{ x: number; y: number; s: number; ink?: string; shade?: string; cap?: boolean; coat?: boolean }> = ({ x, y, s, ink = BLUE, shade = "url(#dotsPink)", cap, coat }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -150 230 Q -150 90 -60 70 L 60 70 Q 150 90 150 230 Z" fill={shade} transform="translate(10 8)" />
    <path d="M -150 230 Q -150 90 -60 70 L 60 70 Q 150 90 150 230 Z" fill={ink} />
    {coat ? <path d="M -40 72 L 0 170 L 40 72" fill="none" stroke={PAPER} strokeWidth={12} /> : null}
    {coat ? <path d="M -48 80 Q -70 160 -20 180 M 48 80 Q 70 160 20 180" fill="none" stroke={PINK} strokeWidth={8} /> : null}
    <ellipse cx={8} cy={-8} rx={62} ry={74} fill={shade} />
    <ellipse cx={0} cy={-16} rx={62} ry={74} fill={ink} />
    {cap ? <path d="M -70 -50 Q 0 -120 70 -50 L 96 -40 L -70 -36 Z" fill={INK} /> : null}
  </g>
);

const SPECIALTIES = ["Heart", "Kidney", "GP", "Eyes", "Lungs", "Diabetes", "Skin"];

const DocCard: React.FC<{ x: number; y: number; label: string; at: number; s?: number; tick?: number }> = ({ x, y, label, at, s = 1, tick = -1 }) => {
  const f = useCurrentFrame();
  const p = pop(f, at, 13);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * (0.6 + 0.4 * p)})`} opacity={Math.min(1, p * 1.5)}>
      <rect x={-110} y={-140} width={220} height={280} rx={18} fill={PAPER} stroke={INK} strokeWidth={5} />
      <Bust x={0} y={-30} s={0.5} coat />
      <text x={0} y={110} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill={INK}>{label}</text>
      {tick >= 0 ? (
        <path d="M 52 -118 L 70 -98 L 104 -138" fill="none" stroke={PINK} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress(f, tick, 10)} />
      ) : null}
    </g>
  );
};

const Pill: React.FC<{ x: number; y: number; s?: number; a: string; b: string; rot?: number }> = ({ x, y, s = 1, a, b, rot = -20 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -160 -70 L 0 -70 L 0 70 L -160 70 A 70 70 0 0 1 -160 -70 Z" fill={a} />
    <path d="M 0 -70 L 160 -70 A 70 70 0 0 1 160 70 L 0 70 Z" fill={b} />
    <path d="M -170 -40 Q -120 -60 -40 -50" stroke={PAPER} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.7} />
  </g>
);

const Phone: React.FC<{ x: number; y: number; s: number; children?: React.ReactNode }> = ({ x, y, s, children }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-230} y={-460} width={460} height={920} rx={60} fill={INK} />
    <rect x={-205} y={-430} width={410} height={860} rx={40} fill={PAPER} />
    <rect x={-60} y={-418} width={120} height={22} rx={11} fill={INK} />
    <g>{children}</g>
  </g>
);

/** A medication list (on paper, a screen or a receipt). The rows marked `diff` print in pink. */
const MedList: React.FC<{ x: number; y: number; title: string; rows: [string, boolean][]; at: number; w?: number }> = ({ x, y, title, rows, at, w = 420 }) => {
  const f = useCurrentFrame();
  return (
    <g transform={`translate(${x} ${y})`} opacity={progress(f, at, 8)}>
      <rect x={0} y={0} width={w} height={110 + rows.length * 74} rx={14} fill={PAPER} stroke={INK} strokeWidth={5} />
      <text x={28} y={66} fontFamily={SANS} fontWeight={800} fontSize={40} fill={BLUE}>{title}</text>
      <line x1={28} x2={w - 28} y1={92} y2={92} stroke={INK} strokeWidth={3} />
      {rows.map(([r, diff], i) => (
        <g key={i} opacity={progress(f, at + 6 + i * 4, 8)}>
          {diff ? <rect x={18} y={112 + i * 74} width={w - 36} height={60} rx={8} fill="url(#dotsPink)" /> : null}
          <text x={34} y={154 + i * 74} fontFamily={MONO} fontSize={32} fill={INK}>{r}</text>
        </g>
      ))}
    </g>
  );
};

// ---------- shots ----------

type Shot = { from: number; render: (f: number) => React.ReactNode };

const S = (id: string) => L(id).from;

const SHOTS: Shot[] = [
  // S1 "My father..."
  { from: 0, render: () => (
    <>
      <Plate from={0}>
        <rect x={250} y={420} width={580} height={720} fill="url(#dotsBlueFine)" opacity={0.35} />
        <rect x={250} y={420} width={580} height={720} fill="none" stroke={INK} strokeWidth={10} />
        <Bust x={540} y={780} s={1.45} ink={PINK} shade="url(#dotsBlue)" cap />
      </Plate>
      <RisoType size={110} top={1250} at={2}>My father</RisoType>
    </>
  ) },
  { from: W("S1", "seven") - 3, render: () => (
    <>
      <RisoType size={260} top={180} at={W("S1", "seven") - 3}>7</RisoType>
      <RisoType size={84} top={460} at={W("S1", "doctors") - 2}>doctors</RisoType>
      <Plate from={W("S1", "seven")} push={0.03}>
        {SPECIALTIES.map((l, i) => (
          <DocCard key={l} x={170 + (i % 4) * 247 + (i >= 4 ? 123 : 0)} y={i < 4 ? 900 : 1230} label={l} at={W("S1", "seven") + i * 3} s={0.95} />
        ))}
      </Plate>
    </>
  ) },
  { from: W("S1", "i'm") - 2, render: (f) => {
    const at = W("S1", "i'm") - 2;
    const knows = W("S1", "knows");
    return (
      <>
        <Plate from={at} push={0.04}>
          {SPECIALTIES.map((l, i) => {
            const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
            const x = 540 + Math.cos(a) * 360, y = 930 + Math.sin(a) * 430;
            return (
              <g key={l}>
                <line x1={540} y1={930} x2={x} y2={y} stroke={PINK} strokeWidth={8} strokeDasharray="1 0" pathLength={1}
                  style={{ strokeDasharray: 1, strokeDashoffset: 1 - progress(f, knows + i * 2, 12) }} />
                <DocCard x={x} y={y} label={l} at={at} s={0.62} />
              </g>
            );
          })}
          <circle cx={540} cy={930} r={110} fill={BLUE} />
          <text x={540} y={950} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={56} fill={PAPER}>me</text>
        </Plate>
        <RisoType size={84} top={170} at={W("S1", "only") - 2} serif italic>the only one who knows all of them</RisoType>
      </>
    );
  } },
  // S2 Monday, a pill changed
  { from: S("S2"), render: () => (
    <>
      <Plate from={S("S2")}>
        <rect x={290} y={360} width={500} height={560} rx={22} fill={PAPER} stroke={INK} strokeWidth={8} />
        <rect x={290} y={360} width={500} height={140} rx={22} fill={PINK} />
        <text x={540} y={460} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={72} fill={PAPER}>MONDAY</text>
        <text x={540} y={790} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={260} fill={BLUE}>3</text>
      </Plate>
      <RisoType size={70} top={1120} at={W("S2", "heart") - 2}>his heart doctor</RisoType>
    </>
  ) },
  { from: W("S2", "changed") - 3, render: (f) => {
    const at = W("S2", "changed") - 3;
    const swap = progress(f, at + 6, 14);
    return (
      <>
        <Plate from={at} push={0.03}>
          <g opacity={1 - swap * 0.75}><Pill x={540} y={760 - swap * 120} a={BLUE} b={PAPER} /></g>
          <line x1={330} y1={620 - swap * 120} x2={750} y2={900 - swap * 120} stroke={PINK} strokeWidth={22} strokeLinecap="round" opacity={swap} />
          <g opacity={swap} transform={`translate(0 ${(1 - swap) * 80})`}><Pill x={540} y={1180} a={PINK} b={BLUE} rot={14} /></g>
        </Plate>
        <RisoType size={78} top={240} at={at}>changed a pill</RisoType>
      </>
    );
  } },
  // S3 Friday, the kidney doctor didn't know
  { from: S("S3"), render: () => (
    <>
      <Plate from={S("S3")}>
        <rect x={290} y={360} width={500} height={560} rx={22} fill={PAPER} stroke={INK} strokeWidth={8} />
        <rect x={290} y={360} width={500} height={140} rx={22} fill={BLUE} />
        <text x={540} y={460} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={72} fill={PAPER}>FRIDAY</text>
        <text x={540} y={790} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={260} fill={PINK}>7</text>
      </Plate>
      <RisoType size={70} top={1120} at={W("S3", "kidney") - 2}>his kidney doctor</RisoType>
    </>
  ) },
  { from: W("S3", "still") - 3, render: (f) => {
    const at = W("S3", "still") - 3;
    const q = pop(f, W("S3", "know") - 2, 12);
    return (
      <>
        <Plate from={at} push={0.03}>
          <MedList x={190} y={520} title="Kidney clinic" rows={[["Heart pill  A", false], ["Water pill", false], ["Vitamin D", false]]} at={at} w={700} />
          <g transform={`translate(780 560) scale(${q}) rotate(-12)`}>
            <circle r={120} fill={PINK} />
            <text y={50} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={170} fill={PAPER}>?</text>
          </g>
        </Plate>
        <RisoType size={78} top={1180} at={W("S3", "didn't") - 2}>still didn't know</RisoType>
      </>
    );
  } },
  // S4 two lists
  { from: S("S4"), render: () => {
    const ph = W("S4", "pharmacy") - 3;
    return (
      <>
        <Plate from={S("S4")} push={0.02}>
          <MedList x={50} y={560} title="GP" rows={[["Heart pill A", true], ["Water pill", false], ["Statin", false], ["Vitamin D", false]]} at={S("S4") + 2} w={470} />
          <MedList x={560} y={640} title="Pharmacy" rows={[["Heart pill B", true], ["Water pill", false], ["Statin", false], ["Aspirin", true]]} at={ph} w={470} />
        </Plate>
        <RisoType size={72} top={260} at={W("S4", "one") - 3}>one list</RisoType>
        <RisoType size={72} top={1380} at={W("S4", "another") - 3} color={INK}>another</RisoType>
      </>
    );
  } },
  // S5 every visit, the same question
  { from: S("S5"), render: (f) => (
    <>
      <Plate from={S("S5")} push={0.06}>
        {[0, 1, 2, 3].map((i) => {
          const s = 1 - i * 0.2;
          return (
            <g key={i} transform={`translate(540 ${1050 - i * 40}) scale(${s})`} opacity={progress(f, S("S5") + i * 5, 8)}>
              <rect x={-230} y={-430} width={460} height={760} fill={i % 2 ? "url(#dotsBlue)" : PAPER} stroke={INK} strokeWidth={8 / s} />
              <circle cx={150} cy={-20} r={20} fill={PINK} />
            </g>
          );
        })}
      </Plate>
      <RisoType size={68} top={1450} at={W("S5", "every") - 3}>every visit, the same way</RisoType>
    </>
  ) },
  { from: W("S5", "so") - 3, render: (f) => (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 90 + i * 22, right: 90 - i * 22, top: 420 + i * 300, padding: "40px 46px", borderRadius: 50,
          background: i === 2 ? BLUE : PAPER, border: `6px solid ${INK}`, fontFamily: SANS, fontWeight: 800, fontSize: 64, lineHeight: 1.05,
          color: i === 2 ? PAPER : INK, opacity: progress(f, W("S5", "so") - 3 + i * 8, 6), transform: `rotate(${(i - 1) * 2.5}deg)` }}>
          So, what are you taking now?
        </div>
      ))}
    </>
  ) },
  // S6 the phone, a screenshot of a screenshot
  { from: S("S6"), render: () => (
    <>
      <Plate from={S("S6")} push={0.03}>
        <Phone x={540} y={980} s={1.05}>
          <text x={-170} y={-330} fontFamily={SANS} fontWeight={800} fontSize={40} fill={INK}>Photos</text>
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={i} x={-175 + (i % 3) * 120} y={-290 + Math.floor(i / 3) * 120} width={108} height={108} fill={i === 4 ? PINK : i % 2 ? "url(#dotsBlue)" : BLUE} opacity={i === 4 ? 1 : 0.55} />
          ))}
          <text x={-55} y={-110} fontFamily={MONO} fontSize={18} fill={PAPER}>meds.png</text>
        </Phone>
      </Plate>
      <RisoType size={70} top={190} at={W("S6", "phone") - 3}>lives in my phone</RisoType>
    </>
  ) },
  { from: W("S6", "a") - 3, render: (f) => {
    const at = W("S6", "a") - 3;
    const z = 1 + progress(f, at + 4, 50) * 1.6;
    return (
      <>
        <Plate from={at} push={0}>
          <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
            {[0, 1, 2, 3].map((i) => {
              const s = Math.pow(0.58, i);
              return (
                <g key={i} transform={`translate(540 ${960 + i * 40 * s}) scale(${s})`}>
                  <rect x={-230} y={-460} width={460} height={920} rx={60} fill={INK} />
                  <rect x={-205} y={-430} width={410} height={860} rx={40} fill={PAPER} />
                  <rect x={-180} y={-400} width={360} height={60} fill={BLUE} />
                  <rect x={-180} y={300} width={360} height={60} fill="url(#dotsPink)" />
                </g>
              );
            })}
          </g>
        </Plate>
        <RisoType size={84} top={150} at={W("S6", "screenshot") - 2} serif italic>a screenshot of a screenshot</RisoType>
      </>
    );
  } },
  // S7 the study
  { from: S("S7"), render: () => (
    <>
      <RisoType size={150} top={720} at={S("S7") + 1}>This isn't rare.</RisoType>
    </>
  ) },
  { from: W("S7", "in") - 3, render: () => (
    <>
      <Plate from={W("S7", "in") - 3} push={0.03}>
        <rect x={150} y={560} width={780} height={760} fill={PAPER} stroke={INK} strokeWidth={8} />
        <rect x={150} y={560} width={780} height={120} fill={INK} />
        <text x={190} y={640} fontFamily={SERIF} fontSize={58} fill={PAPER}>The New England Journal</text>
        <text x={190} y={780} fontFamily={SANS} fontWeight={800} fontSize={48} fill={BLUE}>Care patterns in Medicare</text>
        <text x={190} y={850} fontFamily={MONO} fontSize={30} fill={INK}>Pham et al. · 2007</text>
        <text x={190} y={960} fontFamily={MONO} fontSize={30} fill={INK}>claims of 1.79 million</text>
        <text x={190} y={1004} fontFamily={MONO} fontSize={30} fill={INK}>older patients, 2000–2002</text>
        <rect x={190} y={1080} width={700} height={180} fill="url(#dotsPink)" />
      </Plate>
      <RisoType size={60} top={260} at={W("S7", "large") - 3}>one large US study</RisoType>
    </>
  ) },
  { from: W("S7", "typical") - 3, render: (f) => {
    const at = W("S7", "typical") - 3;
    const seven = W("S7", "seven");
    const four = W("S7", "four");
    const spread = progress(f, four - 4, 16);
    // 2 primary care + 5 specialists, spread across 4 practices
    const homes = [[250, 760], [830, 760], [250, 1310], [830, 1310]];
    const assign = [0, 0, 1, 1, 2, 3, 3];
    return (
      <>
        <RisoType size={200} top={180} at={seven - 4}>7</RisoType>
        <RisoType size={56} top={410} at={W("S7", "doctors") - 2}>doctors in a year</RisoType>
        <Plate from={at} push={0.02}>
          {homes.map(([x, y], i) => (
            <g key={i} opacity={spread}>
              <path d={`M ${x - 220} ${y + 210} L ${x - 220} ${y - 120} L ${x} ${y - 250} L ${x + 220} ${y - 120} L ${x + 220} ${y + 210} Z`}
                fill="url(#dotsBlueFine)" opacity={0.45} stroke={INK} strokeWidth={6} />
            </g>
          ))}
          {SPECIALTIES.map((l, i) => {
            const h = homes[assign[i]];
            const k = assign.slice(0, i).filter((a) => a === assign[i]).length;
            const tx = h[0] + (k - 0.5) * 150 * (assign.filter((a) => a === assign[i]).length > 1 ? 1 : 0);
            const ty = h[1] + 20;
            const sx = 120 + i * 140, sy = 1040;
            return <DocCard key={l} x={sx + (tx - sx) * spread} y={sy + (ty - sy) * spread} label={l} at={seven + i * 2} s={0.5} />;
          })}
        </Plate>
        <RisoType size={56} top={1620} at={four - 3} color={INK}>across four practices</RisoType>
      </>
    );
  } },
  // S8 each did their part; nobody held the whole picture
  { from: S("S8"), render: () => (
    <>
      <Plate from={S("S8")} push={0.02}>
        {SPECIALTIES.map((l, i) => (
          <DocCard key={l} x={170 + (i % 4) * 247 + (i >= 4 ? 123 : 0)} y={i < 4 ? 760 : 1090} label={l} at={S("S8") - 20} s={0.95} tick={W("S8", "part") + i * 3} />
        ))}
      </Plate>
      <RisoType size={68} top={260} at={W("S8", "each") - 2}>each did their part well</RisoType>
    </>
  ) },
  { from: W("S8", "nobody") - 3, render: (f) => {
    const at = W("S8", "nobody") - 3;
    const drift = progress(f, at + 6, 40);
    return (
      <>
        <Plate from={at} push={0.02}>
          {Array.from({ length: 7 }).map((_, i) => {
            const a = (i / 7) * Math.PI * 2;
            const dx = Math.cos(a) * 170 * drift, dy = Math.sin(a) * 200 * drift;
            const col = i % 3;
            return (
              <g key={i} transform={`translate(${dx} ${dy}) rotate(${(i - 3) * 6 * drift} 540 960)`}>
                <path d={`M 540 960 L ${540 + Math.cos(a) * 380} ${960 + Math.sin(a) * 380} A 380 380 0 0 1 ${540 + Math.cos(a + (Math.PI * 2) / 7) * 380} ${960 + Math.sin(a + (Math.PI * 2) / 7) * 380} Z`}
                  fill={col === 0 ? BLUE : col === 1 ? "url(#dotsPink)" : PINK} stroke={PAPER} strokeWidth={10} />
              </g>
            );
          })}
        </Plate>
        <RisoType size={88} top={190} at={W("S8", "whole") - 3} serif italic>nobody held the whole picture</RisoType>
      </>
    );
  } },
  // S9 the family holds it ... until it can't
  { from: S("S9"), render: (f) => {
    const until = W("S9", "until");
    const slip = progress(f, W("S9", "can't") - 2, 30);
    return (
      <>
        <Plate from={S("S9")} push={0.03}>
          {/* two hands cupped under the pieces */}
          <path d="M 170 1260 Q 300 1460 540 1470 Q 780 1460 910 1260 Q 880 1240 840 1280 Q 700 1380 540 1380 Q 380 1380 240 1280 Q 200 1240 170 1260 Z" fill={PINK} />
          <path d="M 170 1260 Q 300 1460 540 1470 Q 780 1460 910 1260" fill="none" stroke="url(#dotsBlue)" strokeWidth={30} transform="translate(8 10)" />
          {Array.from({ length: 7 }).map((_, i) => {
            const a = (i / 7) * Math.PI * 2;
            const loose = f >= until ? slip * (i % 2 ? 1 : 0.5) : 0;
            return (
              <g key={i} transform={`translate(${Math.cos(a) * 40 * loose} ${loose * (200 + i * 60)}) rotate(${loose * (i - 3) * 14} 540 980)`}
                opacity={1 - loose * 0.6}>
                <path d={`M 540 980 L ${540 + Math.cos(a) * 250} ${980 + Math.sin(a) * 250} A 250 250 0 0 1 ${540 + Math.cos(a + (Math.PI * 2) / 7) * 250} ${980 + Math.sin(a + (Math.PI * 2) / 7) * 250} Z`}
                  fill={i % 3 === 0 ? BLUE : i % 3 === 1 ? "url(#dotsPink)" : PINK} stroke={PAPER} strokeWidth={8} />
              </g>
            );
          })}
        </Plate>
        <RisoType size={70} top={260} at={W("S9", "family") - 3}>So the family holds it.</RisoType>
        <RisoType size={84} top={400} at={until - 2} serif italic color={INK}>Until the day the family can't.</RisoType>
      </>
    );
  } },
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
    <div style={{ position: "absolute", left: 90, right: 90, top: 1730, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 40, color: INK }}>
      {chunk.map((k) => <span key={k} style={{ opacity: k <= i ? 1 : 0.35 }}>{ws[k].token} </span>)}
    </div>
  );
};

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  return (near ? 0.16 : 0.28) * Math.min(1, f / 20) * Math.min(1, (SEVEN_DURATION - f) / 30);
};

export const SevenDoctors: React.FC = () => {
  const f = useCurrentFrame();
  const shot = [...SHOTS].reverse().find((s) => f >= s.from) ?? SHOTS[0];
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {/* paper fibre */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 120% 90% at 50% 40%, transparent 55%, #D9CDB566 100%)" }} />
      <AbsoluteFill>{shot.render(f)}</AbsoluteFill>
      <Captions />
      <AbsoluteFill style={{ background: PAPER, opacity: progress(f, SEVEN_DURATION - 26, 24) }} />
      <CinemaGrade grain={0.16} vignette={0.12} glow="#FFFFFF" />
      <VoiceOver take={TAKE} volume={1.25} />
      <Audio src={staticFile("music/2026-11-04-seven-doctors.mp3")} volume={(fr) => musicVolume(fr)} />
    </AbsoluteFill>
  );
};

export const SEVEN_COVER = W("S1", "doctors") + 20;
