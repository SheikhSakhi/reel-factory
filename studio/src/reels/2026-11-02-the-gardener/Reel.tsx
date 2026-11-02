import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadTake, pop, progress } from "../../kit";
import { CinemaGrade, Graded } from "../../kit/CinemaGrade";
import { talkLevel } from "../../kit/Cast3D";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-11-02-the-gardener/take.json";

// Formats lab F2 (faceless parable), first run. Sunlit flat illustration drawn in SVG, two faceless characters,
// film grammar (wide, medium, over-the-shoulder, inserts, top-down, final wide), calm voices, a warm ambient bed and
// no sound effects. The metaphor object: a potted plant. No CTA.

const TAKE = loadTake(takeJson);
type Word = { token: string; frame: number; endFrame: number };
type Line = { id: string; speaker: string; from: number; to: number; words: Word[] };
const RAW = (takeJson as unknown as { scenes: Line[] }).scenes;

const INTRO = 48; // the title card before the first line
const HOLD_AFTER = "S10"; // a breath after the key line
const HOLD = 36;
const TAIL = 54;
const holdAt = RAW.find((l) => l.id === HOLD_AFTER)!.to;
/** Take frame -> video frame. */
const V = (f: number) => INTRO + f + (f >= holdAt ? HOLD : 0);
const LINES: Line[] = RAW.map((l) => ({ ...l, from: V(l.from), to: V(l.to),
  words: l.words.map((w) => ({ ...w, frame: V(w.frame), endFrame: V(w.endFrame) })) }));
export const GARDENER_DURATION = V(TAKE.totalFrames) + TAIL;

const L = (id: string) => LINES.find((l) => l.id === id)!;
const W = (id: string, token: string, n = 0) => {
  const ws = L(id).words.filter((w) => w.token.toLowerCase().replace(/[^a-z0-9']/g, "") === token.toLowerCase());
  return ws[n].frame;
};
const lineAt = (f: number) => LINES.find((l) => f >= l.from && f < l.to) ?? null;

const SERIF = BRAND.theme.fontDisplay;
const SANS = BRAND.theme.fontBody;

const P = {
  skyTop: "#F3B979", skyMid: "#F8D9A8", skyLow: "#FCEBCD", sun: "#FFF4D6",
  hill: "#B9B58C", hill2: "#A7A77E", wall: "#EFD9BA", wallShade: "#E3C7A2", coping: "#C9764A",
  ground: "#E9CDA2", path: "#F3E2C4", pot: "#C8693E", potShade: "#A9532F", potRim: "#D9794B",
  leaf: "#6F9A52", leaf2: "#86AE5E", dry: "#B39A55", dry2: "#9C7E43", soil: "#6B4A33",
  coat: "#F6F2EA", coatShade: "#DCD5C8", pants: "#3F4A5C", shoe: "#2F2A28", skinY: "#D9A47C", hairY: "#2E2420",
  shirtO: "#8FA67A", shirtOShade: "#7A9166", apron: "#8B5E3E", pantsO: "#5C5148", skinO: "#C99372", beard: "#F1ECE2",
  hat: "#E3C37C", hatShade: "#C9A35E", band: "#7A4E33", can: "#6E8C88", canShade: "#58736F", ink: "#3A2E26",
};

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, t))).toString(16).padStart(2, "0")).join("")}`;
};

// ---------- props ----------

/** A terracotta pot with a plant. health 1 = green and upright, 0 = dry and drooping. Origin: the pot's base centre. */
const Pot: React.FC<{ x: number; y: number; s?: number; health?: number; leaves?: number; seed?: number; sprout?: number; sway?: number }> = ({
  x, y, s = 1, health = 1, leaves = 7, seed = 1, sprout = -1, sway = 0,
}) => {
  const droop = (1 - health) * 55;
  const col = mix(P.dry, P.leaf, health);
  const col2 = mix(P.dry2, P.leaf2, health);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={70} ry={12} fill="#00000022" />
      {sprout < 0 ? Array.from({ length: leaves }).map((_, i) => {
        const a = -70 + (140 * i) / Math.max(1, leaves - 1) + Math.sin(seed * 7 + i) * 8;
        const dir = a < 0 ? -1 : 1;
        const rot = a + dir * droop + Math.sin(sway + i) * 2;
        const len = 70 + ((seed * 13 + i * 29) % 30);
        return (
          <g key={i} transform={`translate(0 -112) rotate(${rot})`}>
            <path d={`M 0 0 Q ${-14} ${-len * 0.5} 0 ${-len} Q ${14} ${-len * 0.5} 0 0 Z`} fill={i % 2 ? col : col2} />
            <path d={`M 0 0 L 0 ${-len * 0.85}`} stroke="#00000018" strokeWidth={2} />
          </g>
        );
      }) : (
        <g transform="translate(0 -112)">
          <path d={`M 0 0 Q 3 ${-40 * sprout} 0 ${-70 * sprout}`} stroke={P.leaf} strokeWidth={6} fill="none" strokeLinecap="round" />
          <g transform={`translate(0 ${-70 * sprout}) scale(${sprout})`}>
            <path d="M 0 0 Q -30 -26 -46 -8 Q -26 6 0 0 Z" fill={P.leaf2} />
            <path d="M 0 0 Q 30 -30 48 -12 Q 26 6 0 0 Z" fill={P.leaf} />
          </g>
        </g>
      )}
      <path d="M -62 -112 L 62 -112 L 48 0 L -48 0 Z" fill={P.pot} />
      <path d="M 18 -112 L 62 -112 L 48 0 L 12 0 Z" fill={P.potShade} opacity={0.45} />
      <rect x={-70} y={-128} width={140} height={22} rx={6} fill={P.potRim} />
      <ellipse cx={0} cy={-124} rx={58} ry={7} fill={P.soil} opacity={0.8} />
    </g>
  );
};

const Can: React.FC<{ x: number; y: number; s?: number; tilt?: number }> = ({ x, y, s = 1, tilt = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${tilt})`}>
    <path d="M -60 -10 L 60 -10 L 52 -110 L -52 -110 Z" fill={P.can} />
    <path d="M 20 -10 L 60 -10 L 52 -110 L 16 -110 Z" fill={P.canShade} opacity={0.6} />
    <path d="M 55 -80 L 150 -150 L 160 -138 L 62 -55 Z" fill={P.can} />
    <ellipse cx={157} cy={-146} rx={14} ry={9} fill={P.canShade} />
    <path d="M -40 -110 Q 0 -175 40 -110" stroke={P.canShade} strokeWidth={12} fill="none" />
  </g>
);

// ---------- people (faceless) ----------

type Arm = [number, number]; // upper and forearm angles, degrees from hanging straight down (+ = forward/outward)
const ArmPath: React.FC<{ sx: number; sy: number; arm: Arm; side: -1 | 1; color: string; skin: string }> = ({ sx, sy, arm, side, color, skin }) => {
  const r1 = (arm[0] * Math.PI) / 180, r2 = ((arm[0] + arm[1]) * Math.PI) / 180;
  const ex = sx + side * Math.sin(r1) * 170, ey = sy + Math.cos(r1) * 170;
  const hx = ex + side * Math.sin(r2) * 150, hy = ey + Math.cos(r2) * 150;
  return (
    <g>
      <path d={`M ${sx} ${sy} L ${ex} ${ey} L ${hx} ${hy}`} stroke={color} strokeWidth={48} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={hx} cy={hy} r={25} fill={skin} />
    </g>
  );
};

/** A faceless person, feet at the origin, about 860 units tall. face: -1 looks left, 1 right. */
const Person: React.FC<{
  kind: "young" | "old"; x: number; y: number; s: number; frame: number; talk?: number; face?: -1 | 1;
  armL?: Arm; armR?: Arm; nod?: number; children?: React.ReactNode;
}> = ({ kind, x, y, s, frame, talk = 0, face = 1, armL = [8, 4], armR = [8, 4], nod = 0, children }) => {
  const young = kind === "young";
  const breathe = 1 + 0.006 * Math.sin(frame / 22 + (young ? 0 : 1.7));
  const headRot = face * 3 + nod + talk * 3.5 * Math.sin(frame / 3.2);
  const skin = young ? P.skinY : P.skinO;
  const top = young ? P.coat : P.shirtO;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={6} rx={150} ry={22} fill="#5A3A2018" />
      {/* legs and shoes */}
      <rect x={-62} y={-390} width={54} height={385} rx={22} fill={young ? P.pants : P.pantsO} />
      <rect x={8} y={-390} width={54} height={385} rx={22} fill={young ? P.pants : P.pantsO} />
      <ellipse cx={-40 + face * 10} cy={-4} rx={46} ry={17} fill={P.shoe} />
      <ellipse cx={40 + face * 10} cy={-4} rx={46} ry={17} fill={P.shoe} />
      <g transform={`translate(0 -390) scale(1 ${breathe}) translate(0 390)`}>
        {/* back arm */}
        <ArmPath sx={-100} sy={-615} arm={armL} side={-1} color={young ? P.coatShade : P.shirtOShade} skin={skin} />
        {/* torso */}
        {young ? (
          <>
            <path d="M -108 -632 Q -130 -500 -100 -235 L 100 -235 Q 130 -500 108 -632 Q 0 -668 -108 -632 Z" fill={P.coat} />
            <path d="M 0 -650 L 0 -235" stroke={P.coatShade} strokeWidth={4} />
            <path d="M -30 -655 L 0 -560 L 30 -655" stroke={P.coatShade} strokeWidth={6} fill="none" />
            <rect x={36} y={-470} width={50} height={8} rx={4} fill={P.coatShade} />
            {/* stethoscope */}
            <path d="M -36 -650 Q -60 -540 -18 -500 Q 0 -488 18 -500 Q 60 -540 36 -650" stroke="#4A4F57" strokeWidth={7} fill="none" />
            <circle cx={0} cy={-492} r={13} fill="#7C838C" />
          </>
        ) : (
          <>
            <path d="M -110 -632 Q -125 -500 -95 -360 L 95 -360 Q 125 -500 110 -632 Q 0 -666 -110 -632 Z" fill={P.shirtO} />
            <path d="M -78 -560 L 78 -560 L 92 -290 L -92 -290 Z" fill={P.apron} />
            <path d="M -60 -560 L -40 -650 M 60 -560 L 40 -650" stroke={P.apron} strokeWidth={12} />
            <rect x={-40} y={-470} width={80} height={60} rx={8} fill="#00000014" />
          </>
        )}
        {/* neck and head */}
        <rect x={-22} y={-700} width={44} height={70} rx={14} fill={skin} />
        <g transform={`translate(0 -700) rotate(${headRot}) translate(0 700)`}>
          <ellipse cx={face * 4} cy={-760} rx={62} ry={74} fill={skin} />
          <ellipse cx={face * 4 - face * 26} cy={-750} rx={30} ry={52} fill="#00000010" />
          {young ? (
            <path d={`M ${-66 + face * 6} -755 Q ${-70 + face * 6} -842 ${face * 8} -840 Q ${70 + face * 6} -842 ${66 + face * 6} -755 Q ${44 + face * 14} -800 ${face * 12} -804 Q ${-36 - face * 20} -800 ${-66 + face * 6} -720 Z`} fill={P.hairY} />
          ) : (
            <>
              <path d={`M ${-56 + face * 4} -742 Q ${-62 + face * 4} -660 ${face * 6} -640 Q ${62 + face * 6} -660 ${56 + face * 4} -742 Q ${face * 4} -712 ${-56 + face * 4} -742 Z`} fill={P.beard} />
              <ellipse cx={face * 4} cy={-808} rx={150} ry={28} fill={P.hat} />
              <path d={`M ${-66 + face * 4} -808 Q ${-62 + face * 4} -885 ${face * 4} -888 Q ${62 + face * 4} -885 ${66 + face * 4} -808 Z`} fill={P.hat} />
              <path d={`M ${-64 + face * 4} -822 L ${64 + face * 4} -822 L ${65 + face * 4} -808 L ${-65 + face * 4} -808 Z`} fill={P.band} />
              <ellipse cx={face * 4} cy={-804} rx={150} ry={10} fill={P.hatShade} opacity={0.5} />
            </>
          )}
        </g>
        {/* front arm and whatever it holds */}
        <ArmPath sx={100} sy={-615} arm={armR} side={1} color={top} skin={skin} />
        {children}
      </g>
    </g>
  );
};

// ---------- the garden (world: 2400 x 3000) ----------

const WW = 2400;
const Sky: React.FC<{ day?: number; frame: number }> = ({ day = 0, frame }) => {
  // day: 0 = golden hour; for the time-lapse it runs through night and back (0..1 per cycle)
  const night = Math.max(0, Math.sin(day * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5) * (day > 0 ? 1 : 0);
  const top = mix(P.skyTop, "#1E2440", night), mid = mix(P.skyMid, "#3A3F63", night), low = mix(P.skyLow, "#6B6683", night);
  const sunA = day * Math.PI * 2;
  const sx = 1200 + Math.sin(sunA) * 900 + (day > 0 ? 0 : 700);
  const sy = 900 - Math.cos(sunA) * 500 + (day > 0 ? 0 : -150);
  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} /><stop offset="0.6" stopColor={mid} /><stop offset="1" stopColor={low} />
        </linearGradient>
        <radialGradient id="sun"><stop offset="0" stopColor={P.sun} stopOpacity={1} /><stop offset="0.25" stopColor={P.sun} stopOpacity={0.6} /><stop offset="1" stopColor={P.sun} stopOpacity={0} /></radialGradient>
      </defs>
      <rect x={0} y={0} width={WW} height={2000} fill="url(#sky)" />
      {night > 0.3 ? Array.from({ length: 60 }).map((_, i) => (
        <circle key={i} cx={(i * 397) % WW} cy={(i * 211) % 1300} r={2 + (i % 3)} fill="#FFFFFF" opacity={(night - 0.3) * (0.5 + 0.5 * Math.sin(frame / 7 + i))} />
      )) : null}
      <circle cx={sx} cy={sy} r={420} fill="url(#sun)" opacity={1 - night} />
      <circle cx={sx} cy={sy} r={70} fill={P.sun} opacity={1 - night} />
      {/* soft clouds */}
      {[[300, 520, 1], [1500, 380, 1.3], [2100, 640, 0.8]].map(([cx, cy, k], i) => (
        <g key={i} transform={`translate(${cx + Math.sin(frame / 200 + i) * 30} ${cy}) scale(${k})`} opacity={0.55}>
          <ellipse cx={0} cy={0} rx={160} ry={40} fill="#FFF6E6" /><ellipse cx={-70} cy={-20} rx={80} ry={40} fill="#FFF6E6" /><ellipse cx={60} cy={-30} rx={90} ry={50} fill="#FFF6E6" />
        </g>
      ))}
      {/* hills and trees far away */}
      <path d={`M 0 1500 Q 400 1300 800 1420 Q 1200 1540 1600 1360 Q 2000 1220 2400 1400 L 2400 1800 L 0 1800 Z`} fill={mix(P.hill, "#4A4E66", night * 0.8)} opacity={0.7} />
      <path d={`M 0 1600 Q 500 1460 1000 1560 Q 1500 1650 2000 1500 Q 2250 1450 2400 1520 L 2400 1800 L 0 1800 Z`} fill={mix(P.hill2, "#3E4258", night * 0.8)} />
      {[200, 420, 1750, 1980, 2240].map((tx, i) => (
        <g key={i} transform={`translate(${tx} ${1560 - (i % 2) * 30})`}>
          <rect x={-10} y={-40} width={20} height={80} fill={mix("#7B6650", "#2E2A33", night)} />
          <ellipse cx={0} cy={-110} rx={70} ry={100} fill={mix("#93A06E", "#36404A", night)} />
        </g>
      ))}
    </g>
  );
};

const POTS_BACK = Array.from({ length: 16 }).map((_, i) => ({ x: 120 + i * 145 + (i > 7 ? 120 : 0), y: 2060 + (i % 2) * 18, s: 0.55, seed: i }));
const POTS_MID = [{ x: 260, y: 2330 }, { x: 470, y: 2380 }, { x: 1950, y: 2340 }, { x: 2160, y: 2390 }].map((p, i) => ({ ...p, s: 0.85, seed: 20 + i }));
const POTS_FRONT = [{ x: 80, y: 2900 }, { x: 2330, y: 2920 }].map((p, i) => ({ ...p, s: 1.5, seed: 40 + i }));

const Garden: React.FC<{ frame: number; day?: number; children?: React.ReactNode; front?: React.ReactNode }> = ({ frame, day = 0, children, front }) => {
  const night = day > 0 ? Math.max(0, Math.sin(day * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5) : 0;
  const dim = (c: string) => mix(c, "#3B3A52", night * 0.75);
  return (
    <g>
      <Sky day={day} frame={frame} />
      {/* the back wall with an arch to the fields */}
      <path d={`M 0 1700 L 1020 1700 L 1020 2050 L 1380 2050 L 1380 1700 L 2400 1700 L 2400 2100 L 0 2100 Z`} fill={dim(P.wall)} />
      <path d={`M 1020 2050 L 1020 1830 Q 1200 1640 1380 1830 L 1380 2050`} fill="none" stroke={dim(P.wallShade)} strokeWidth={26} />
      <rect x={0} y={1680} width={1030} height={34} rx={6} fill={dim(P.coping)} />
      <rect x={1370} y={1680} width={1030} height={34} rx={6} fill={dim(P.coping)} />
      <rect x={0} y={2040} width={WW} height={60} fill={dim(P.wallShade)} opacity={0.6} />
      {/* vines */}
      {Array.from({ length: 26 }).map((_, i) => (
        <circle key={i} cx={(i * 173) % 1000 + (i % 2 ? 1400 : 0)} cy={1730 + ((i * 53) % 220)} r={22 + (i % 4) * 8} fill={dim(i % 3 ? P.leaf : P.leaf2)} opacity={0.85} />
      ))}
      {/* ground and the path through the arch */}
      <rect x={0} y={2100} width={WW} height={1500} fill={dim(P.ground)} />
      <path d="M 1050 2100 L 1350 2100 L 1900 3600 L 500 3600 Z" fill={dim(P.path)} />
      {POTS_BACK.map((p, i) => <Pot key={`b${i}`} x={p.x} y={p.y} s={p.s} seed={p.seed} sway={frame / 40} />)}
      {POTS_MID.map((p, i) => <Pot key={`m${i}`} x={p.x} y={p.y} s={p.s} seed={p.seed} sway={frame / 40} />)}
      {children}
      {POTS_FRONT.map((p, i) => <Pot key={`f${i}`} x={p.x} y={p.y} s={p.s} seed={p.seed} sway={frame / 40} />)}
      {front}
      {night > 0 ? <rect x={0} y={0} width={WW} height={3600} fill="#141833" opacity={night * 0.35} /> : null}
    </g>
  );
};

// ---------- camera ----------

type Cam = { cx: number; cy: number; w: number };
const ASPECT = 1920 / 1080;
const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({ cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, w: a.w + (b.w - a.w) * t });
const viewBox = (c: Cam) => `${c.cx - c.w / 2} ${c.cy - (c.w * ASPECT) / 2} ${c.w} ${c.w * ASPECT}`;

const YOUNG_AT = { x: 930, y: 2600 };
const OLD_AT = { x: 1520, y: 2600 };

const SHOTS: Record<string, [Cam, Cam]> = {
  wide: [{ cx: 1200, cy: 2000, w: 1450 }, { cx: 1210, cy: 2040, w: 1300 }],
  young: [{ cx: 960, cy: 2130, w: 800 }, { cx: 955, cy: 2110, w: 740 }],
  old: [{ cx: 1480, cy: 2120, w: 800 }, { cx: 1490, cy: 2100, w: 740 }],
  ots: [{ cx: 1330, cy: 2080, w: 980 }, { cx: 1360, cy: 2060, w: 900 }],
  two: [{ cx: 1225, cy: 2050, w: 1240 }, { cx: 1225, cy: 2030, w: 1160 }],
  end: [{ cx: 1210, cy: 2050, w: 1400 }, { cx: 1205, cy: 1980, w: 1560 }],
};

/** The garden scene with both characters, filmed by one of SHOTS. */
const GardenShot: React.FC<{ shot: keyof typeof SHOTS; from: number; to: number; walk?: number }> = ({ shot, from, to, walk = 0 }) => {
  const f = useCurrentFrame();
  const t = Math.max(0, Math.min(1, (f - from) / Math.max(1, to - from)));
  const cam = lerpCam(SHOTS[shot][0], SHOTS[shot][1], t);
  const line = lineAt(f);
  const talk = (who: string) => (line && line.speaker === who ? talkLevel(f, line.words) : 0);
  const youngTalk = talk("YOUNG"), oldTalk = talk("OLD");
  // before S2 the old gardener is still watering with his back half-turned
  const watering = f < L("S2").from + 6;
  const youngHead = f >= L("S7").from && f < L("S8").from ? 8 : 0; // looks down at "an hour"
  const walkX = walk * 220, walkY = -walk * 330, walkS = 1 - walk * 0.42;
  const step = walk > 0 ? Math.sin(f / 5) * 6 : 0;
  const hasSprout = f >= L("S15").from;
  return (
    <svg viewBox={viewBox(cam)} width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <Garden frame={f}>
        <g transform={`translate(${walkX * 0.6} ${walkY}) translate(${YOUNG_AT.x} ${YOUNG_AT.y}) scale(${walkS}) translate(${-YOUNG_AT.x} ${-YOUNG_AT.y})`}>
          <Person kind="young" x={YOUNG_AT.x} y={YOUNG_AT.y + step} s={1} frame={f} talk={youngTalk} face={1} nod={youngHead}
            armL={[10, 6]} armR={[38 + youngTalk * 6, 62]}>
            <Pot x={265} y={-405} s={0.62} health={hasSprout ? 0.25 : 0.1} seed={9} sprout={hasSprout ? Math.min(1, (f - L("S15").from) / 30) : -1} />
          </Person>
        </g>
        <g transform={`translate(${-walkX * 0.3} ${walkY}) translate(${OLD_AT.x} ${OLD_AT.y}) scale(${walkS}) translate(${-OLD_AT.x} ${-OLD_AT.y})`}>
          <Person kind="old" x={OLD_AT.x} y={OLD_AT.y + (walk > 0 ? -step : 0)} s={1} frame={f} talk={oldTalk} face={watering ? 1 : -1}
            armL={watering ? [40, 30] : [12 + oldTalk * 18, 30 + oldTalk * 20]} armR={[14, 10]}>
            <Can x={watering ? -330 : 150} y={watering ? -330 : -240} s={0.7} tilt={watering ? -150 + Math.sin(f / 10) * 4 : 0} />
          </Person>
          {watering ? (
            <g>
              {Array.from({ length: 6 }).map((_, i) => (
                <circle key={i} cx={OLD_AT.x - 520 + Math.sin(i) * 6} cy={OLD_AT.y - 340 + ((f * 9 + i * 30) % 180)} r={5} fill="#BFE3F2" opacity={0.8} />
              ))}
              <Pot x={OLD_AT.x - 520} y={OLD_AT.y - 120} s={0.9} seed={3} sway={f / 30} />
            </g>
          ) : null}
        </g>
      </Garden>
      {shot === "ots" ? (
        // the young doctor's shoulder in the foreground, out of focus
        <g style={{ filter: "blur(10px)" }}>
          <ellipse cx={cam.cx - cam.w * 0.42} cy={cam.cy + 420} rx={260} ry={520} fill={P.coat} />
          <ellipse cx={cam.cx - cam.w * 0.4} cy={cam.cy - 120} rx={110} ry={130} fill={P.hairY} />
        </g>
      ) : null}
    </svg>
  );
};

// ---------- inserts (full frame, 1080 x 1920) ----------

const Paper: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = "#EBD8B8" }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 40%, #F6E7CB 0%, ${bg} 100%)` }}>{children}</AbsoluteFill>
);

/** S3: the clipboard, ticking what he got right. */
const Clipboard: React.FC = () => {
  const f = useCurrentFrame();
  const rows: [string, number][] = [["Diagnosis", W("S3", "diagnosis")], ["Medicine", W("S3", "medicine")], ["Plan", W("S3", "plan")]];
  const s = L("S3").from;
  return (
    <Paper>
      <div style={{ position: "absolute", left: 170, top: 330, width: 740, height: 1000, background: "#B98A5A", borderRadius: 30, transform: `rotate(-3deg) scale(${1 + (f - s) * 0.0006})`,
        boxShadow: "0 40px 80px #5A3A2033" }}>
        <div style={{ position: "absolute", left: 50, top: 70, right: 50, bottom: 50, background: "#FBF6EC", borderRadius: 10, padding: "70px 60px" }}>
          <div style={{ fontFamily: SERIF, fontSize: 64, color: P.ink }}>Her plan</div>
          <div style={{ height: 3, background: "#3A2E2622", margin: "18px 0 40px" }} />
          {rows.map(([label, at]) => {
            const p = progress(f, at - 2, 12);
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 30, marginBottom: 70 }}>
                <svg width={80} height={80}>
                  <rect x={4} y={4} width={72} height={72} rx={12} fill="none" stroke={P.ink} strokeWidth={4} opacity={0.6} />
                  <path d="M 18 42 L 34 58 L 64 22" fill="none" stroke="#3E7D4E" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
                </svg>
                <div style={{ fontFamily: SANS, fontSize: 58, fontWeight: 600, color: P.ink, opacity: 0.4 + 0.6 * p }}>{label}</div>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 270, top: -30, width: 200, height: 90, background: "#8C949C", borderRadius: 18 }} />
      </div>
    </Paper>
  );
};

/** S5: the calendar, three months of days passing. */
const Calendar: React.FC = () => {
  const f = useCurrentFrame();
  const s = L("S5").from;
  const three = W("S5", "three");
  const k = Math.max(0, Math.min(1, (f - (s + 8)) / (three - s + 4)));
  const day = Math.floor(k * 90);
  const months = ["March", "April", "May", "June"];
  const m = Math.min(3, Math.floor(day / 30));
  const visitAgain = f >= three;
  return (
    <Paper>
      <div style={{ position: "absolute", left: 150, top: 380, width: 780, height: 900, background: "#FBF6EC", borderRadius: 24, boxShadow: "0 40px 80px #5A3A2033", overflow: "hidden" }}>
        <div style={{ background: P.coping, color: "#FFF6E8", fontFamily: SERIF, fontSize: 76, padding: "34px 50px" }}>{visitAgain ? "June" : months[m]}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 14, padding: 40 }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const crossed = !visitAgain && i < day % 30 + (m * 30 === day ? 0 : 0);
            const isVisit = (i === 4 && f < s + 12) || (visitAgain && i === 4);
            return (
              <div key={i} style={{ height: 96, borderRadius: 12, background: isVisit ? "#F2D7A8" : "#F1E8D8", position: "relative", fontFamily: SANS, fontSize: 32, color: P.ink, padding: 10 }}>
                {i + 1}
                {crossed ? <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}><path d="M 18 18 L 70 78" stroke="#B5523A" strokeWidth={5} strokeLinecap="round" opacity={0.7} /></svg> : null}
                {isVisit ? <div style={{ position: "absolute", inset: -6, border: `5px solid ${P.coping}`, borderRadius: 50 }} /> : null}
              </div>
            );
          })}
        </div>
        {visitAgain ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 50, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 44, color: P.coping, opacity: progress(f, three, 8) }}>
            next visit · 3 months later
          </div>
        ) : null}
      </div>
    </Paper>
  );
};

/** S8: a year as 8,760 squares, one lit for the hour together. */
const HourGrid: React.FC = () => {
  const f = useCurrentFrame();
  const s = L("S8").from;
  const eight = W("S8", "eight");
  const hours = W("S8", "hours");
  const reveal = progress(f, eight - 6, hours - eight + 10);
  const n = Math.round(8760 * reveal);
  const COLS = 73, CELL = 12;
  return (
    <AbsoluteFill style={{ background: "#2B221C" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="hours" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <rect x={1.5} y={1.5} width={9} height={9} rx={2} fill="#E9CDA2" opacity={0.42} />
          </pattern>
          <linearGradient id="sweep" x1="0" y1="0" x2="0" y2="1">
            <stop offset={reveal} stopColor="#fff" /><stop offset={Math.min(1, reveal + 0.001)} stopColor="#000" />
          </linearGradient>
          <mask id="sweepMask"><rect x={102} y={300} width={COLS * CELL} height={120 * CELL} fill="url(#sweep)" /></mask>
        </defs>
        <rect x={102} y={300} width={COLS * CELL} height={120 * CELL} fill="url(#hours)" mask="url(#sweepMask)" />
        {/* the one hour */}
        <rect x={102 + 36 * CELL - 1} y={300 + 2 * CELL - 1} width={14} height={14} rx={3} fill="#FFD27A" opacity={progress(f, s + 2, 8)}
          style={{ filter: "drop-shadow(0 0 12px #FFC45A)" }} />
        <circle cx={102 + 36 * CELL + 6} cy={300 + 2 * CELL + 6} r={34 + Math.sin(f / 6) * 3} fill="none" stroke="#FFD27A" strokeWidth={4} opacity={progress(f, s + 2, 8)} />
        <path d={`M ${102 + 36 * CELL + 6} ${300 + 2 * CELL - 28} L ${102 + 36 * CELL + 6} 230`} stroke="#FFD27A" strokeWidth={3} opacity={progress(f, s + 2, 8)} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", fontFamily: SANS, fontSize: 34, letterSpacing: "0.2em", color: "#FFD27A",
        opacity: progress(f, s + 2, 8) }}>ONE HOUR TOGETHER</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1760, textAlign: "center", fontFamily: SERIF, fontSize: 96, color: "#FBEBD0",
        opacity: progress(f, eight - 4, 8) }}>{n.toLocaleString("en-US")} <span style={{ fontSize: 56, opacity: 0.7 }}>hours</span></div>
    </AbsoluteFill>
  );
};

/** S9: a hand plants a seed; nothing grows on the day. */
const Planting: React.FC = () => {
  const f = useCurrentFrame();
  const planted = W("S9", "planted");
  const drop = progress(f, planted - 4, 16);
  return (
    <Paper bg="#E3C79C">
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(540 1500) scale(3.6)`}>
          <Pot x={0} y={0} s={1} sprout={0.001} />
        </g>
        <ellipse cx={540} cy={1070 + drop * 0} rx={0} ry={0} />
        {/* the seed */}
        <ellipse cx={560} cy={690 + drop * 370} rx={16} ry={11} fill="#7A5134" opacity={drop < 1 ? 1 : 0} />
        {/* the hand */}
        <g transform={`translate(560 ${700 - drop * 30})`}>
          {/* sleeve from the top edge, a relaxed hand, thumb and finger pinching the seed */}
          <path d="M -150 -760 L 20 -760 L 40 -260 L -110 -230 Z" fill={P.shirtO} />
          <path d="M -150 -760 L -60 -760 L -40 -240 L -110 -230 Z" fill={P.shirtOShade} opacity={0.6} />
          <rect x={-120} y={-260} width={170} height={40} rx={18} fill={P.shirtOShade} />
          <path d="M -105 -225 Q -120 -120 -60 -70 Q 0 -40 40 -90 Q 60 -150 40 -225 Z" fill={P.skinO} />
          <path d="M 30 -150 Q 70 -110 40 -40 Q 20 -20 6 -46 Q 26 -90 10 -130 Z" fill={P.skinO} />
          <path d="M -40 -80 Q -30 -20 -6 -14 Q 14 -18 10 -50 Z" fill="#B98263" />
        </g>
        {/* a little soil rises where it lands */}
        <ellipse cx={560} cy={1064} rx={40 * drop} ry={10 * drop} fill="#4E3424" opacity={drop >= 1 ? 1 : 0} />
      </svg>
    </Paper>
  );
};

/** S10: time-lapse, days and nights pass, the plant grows while nobody watches. */
const TimeLapse: React.FC = () => {
  const f = useCurrentFrame();
  const s = L("S10").from;
  const e = L("S10").to;
  const k = Math.max(0, Math.min(1, (f - s) / (e - s)));
  const day = k * 3.0 + 0.0001;
  const cam: Cam = { cx: 1200, cy: 1900 - k * 60, w: 1700 - k * 120 };
  return (
    <svg viewBox={viewBox(cam)} width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <Garden frame={f} day={day}>
        <Pot x={1200} y={2560} s={1.7} health={0.4 + 0.6 * k} seed={5} sprout={Math.min(1, 0.25 + k * 0.9)} />
      </Garden>
    </svg>
  );
};

/** S11: hundreds of pots, row after row. */
const Rows: React.FC = () => {
  const f = useCurrentFrame();
  const s = L("S11").from;
  const reveal = progress(f, W("S11", "hundreds") - 10, 30);
  const push = 1 + (f - s) * 0.0007;
  const rows = 11;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${P.skyMid} 0%, ${P.skyLow} 28%, ${P.ground} 30%, #DDBB8A 100%)` }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "50% 40%" }}>
        {Array.from({ length: rows }).map((_, r) => {
          const depth = rows - 1 - r; // draw far rows first
          const k = Math.pow(1 - depth / rows, 1.5);
          const y = 640 + k * 1250;
          const sc = 0.16 + k * 0.84;
          const n = Math.ceil(1500 / (150 * sc));
          const show = depth < 3 || reveal > (depth - 2) / (rows - 2);
          return show ? Array.from({ length: n }).map((_, i) => (
            <Pot key={`${r}-${i}`} x={540 + (i - (n - 1) / 2) * 150 * sc} y={y} s={sc} seed={r * 31 + i} sway={f / 40} health={(r * 7 + i * 3) % 23 === 0 ? 0.6 : 1} />
          )) : null;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** S12: from above, every pot the same, then one drying. */
const TopDown: React.FC = () => {
  const f = useCurrentFrame();
  const drying = W("S12", "drying");
  const watch = W("S12", "watch");
  const DRY = 21;
  const d = progress(f, watch, drying - watch + 8);
  return (
    <AbsoluteFill style={{ background: "#D9B98A" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, transform: `scale(${1 + (f - L("S12").from) * 0.0006})` }}>
        {Array.from({ length: 6 * 9 }).map((_, i) => {
          const c = i % 6, r = Math.floor(i / 6);
          const x = 115 + c * 170, y = 230 + r * 180;
          const isDry = i === DRY;
          const h = isDry ? 1 - d * 0.85 : 1;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle r={70} fill={P.potShade} /><circle r={62} fill={P.pot} /><circle r={54} fill={P.soil} />
              {Array.from({ length: 6 }).map((_, k) => (
                <ellipse key={k} cx={0} cy={-26 * (0.6 + 0.4 * h)} rx={14} ry={30 * (0.7 + 0.3 * h)} fill={mix(P.dry, k % 2 ? P.leaf : P.leaf2, h)}
                  transform={`rotate(${k * 60 + i * 13 + Math.sin(f / 30 + i) * 3})`} />
              ))}
            </g>
          );
        })}
        {/* the soft ring around the one that is drying */}
        <circle cx={115 + (DRY % 6) * 170} cy={230 + Math.floor(DRY / 6) * 180} r={92 + Math.sin(f / 6) * 4} fill="none" stroke="#FFF3D6" strokeWidth={6}
          opacity={progress(f, drying - 4, 10)} style={{ filter: "drop-shadow(0 0 12px #FFE3A8)" }} />
      </svg>
    </AbsoluteFill>
  );
};

/** S13: a small question tied to the pot; water; it lifts. */
const Question: React.FC = () => {
  const f = useCurrentFrame();
  const q = W("S13", "question");
  const notice = W("S13", "notice");
  const pour = progress(f, notice - 4, 14);
  const health = 0.15 + 0.85 * progress(f, notice + 8, 34);
  return (
    <Paper bg="#E3C79C">
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(540 1560) scale(3.2)"><Pot x={0} y={0} s={1} health={health} seed={7} sway={f / 30} /></g>
        {/* the tag with the question */}
        <g transform={`translate(${250} ${1220}) rotate(${-8 + Math.sin(f / 18) * 2})`} opacity={progress(f, q - 4, 10)}>
          <path d="M 0 0 L 40 -60" stroke="#8A6A4A" strokeWidth={4} />
          <rect x={-180} y={0} width={360} height={150} rx={18} fill="#FBF6EC" style={{ filter: "drop-shadow(0 10px 20px #5A3A2033)" }} />
          <text x={0} y={62} textAnchor="middle" fontFamily={SANS} fontSize={34} fontWeight={600} fill={P.ink}>How was</text>
          <text x={0} y={110} textAnchor="middle" fontFamily={SANS} fontSize={34} fontWeight={600} fill={P.ink}>this week?</text>
        </g>
        {/* watering */}
        <g opacity={pour}>
          <Can x={900} y={760} s={2.2} tilt={-38 * pour} />
          {Array.from({ length: 10 }).map((_, i) => (
            <circle key={i} cx={640 + Math.sin(i * 3) * 14} cy={600 + ((f * 14 + i * 40) % 520)} r={8} fill="#BFE3F2" opacity={0.85 * pour} />
          ))}
        </g>
      </svg>
    </Paper>
  );
};

/** S15 opening: the wilted pot now has a sprout. */
const Sprout: React.FC = () => {
  const f = useCurrentFrame();
  const s = L("S15").from;
  const g = progress(f, s + 2, 34);
  return (
    <Paper bg="#E8C99A">
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(540 1500) scale(3.4)"><Pot x={0} y={0} s={1} sprout={0.05 + g * 0.95} /></g>
      </svg>
    </Paper>
  );
};

// ---------- captions ----------

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const line = lineAt(f);
  if (!line || ["S8", "S10"].includes(line.id)) return null;
  const ws = line.words;
  const i = ws.findIndex((w, k) => f >= w.frame - 2 && f < (ws[k + 1]?.frame ?? line.to) - 2);
  if (i < 0) return null;
  // chunks of up to 3 words, breaking after punctuation
  const chunks: number[][] = [];
  let cur: number[] = [];
  ws.forEach((w, k) => { cur.push(k); if (cur.length === 3 || /[.,?]$/.test(w.token)) { chunks.push(cur); cur = []; } });
  if (cur.length) chunks.push(cur);
  const chunk = chunks.find((c) => c.includes(i))!;
  const a = pop(f, ws[chunk[0]].frame - 2, 16);
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 1590, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 62, color: "#FFFFFF",
      textShadow: "0 2px 4px #2A1608CC, 0 0 26px #2A1608AA", opacity: Math.min(1, a * 1.4), transform: `translateY(${(1 - a) * 12}px)` }}>
      {chunk.map((k) => ws[k].token).join(" ")}
    </div>
  );
};

const KeyLine: React.FC = () => {
  const f = useCurrentFrame();
  const l = L("S10");
  if (f < l.from - 4 || f >= l.to) return null;
  const words = ["It's", "grown", "on", "the", "days", "you're", "not", "there."];
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 300, textAlign: "center", fontFamily: SERIF, fontSize: 112, lineHeight: 1.05, color: "#FFF8EC",
      textShadow: "0 4px 30px #00000066" }}>
      {words.map((w, k) => {
        const at = l.words[k]?.frame ?? l.from;
        return <span key={k} style={{ opacity: progress(f, at - 3, 8), fontStyle: k >= 4 ? "italic" : "normal" }}>{w} </span>;
      })}
    </div>
  );
};

// ---------- the cut ----------

const TitleCard: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#1E1712", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: SERIF, fontSize: 92, lineHeight: 1.1, color: "#F6E7CB", textAlign: "center", opacity: progress(f, 4, 14) * (1 - progress(f, INTRO - 8, 8)) }}>
        The days<br /><span style={{ fontStyle: "italic" }}>you're not there</span>
      </div>
    </AbsoluteFill>
  );
};

type Cut = { from: number; to: number; el: React.ReactNode };
const at = (id: string) => L(id).from;
const end = (id: string) => L(id).to;
const CUTS: Cut[] = [
  { from: 0, to: INTRO, el: <TitleCard /> },
  { from: INTRO, to: at("S2"), el: <GardenShot shot="wide" from={INTRO} to={at("S2")} /> },
  { from: at("S2"), to: at("S3"), el: <GardenShot shot="old" from={at("S2")} to={at("S3")} /> },
  { from: at("S3"), to: at("S4"), el: <Clipboard /> },
  { from: at("S4"), to: at("S5"), el: <GardenShot shot="ots" from={at("S4")} to={at("S5")} /> },
  { from: at("S5"), to: at("S6"), el: <Calendar /> },
  { from: at("S6"), to: at("S7"), el: <GardenShot shot="old" from={at("S6")} to={at("S7")} /> },
  { from: at("S7"), to: at("S8"), el: <GardenShot shot="young" from={at("S7")} to={at("S8")} /> },
  { from: at("S8"), to: at("S9"), el: <HourGrid /> },
  { from: at("S9"), to: W("S9", "but"), el: <Planting /> },
  { from: W("S9", "but"), to: at("S10"), el: <GardenShot shot="old" from={W("S9", "but")} to={at("S10")} /> },
  { from: at("S10"), to: at("S11"), el: <TimeLapse /> },
  { from: at("S11"), to: at("S12"), el: <Rows /> },
  { from: at("S12"), to: at("S13"), el: <TopDown /> },
  { from: at("S13"), to: at("S14"), el: <Question /> },
  { from: at("S14"), to: at("S15"), el: <GardenShot shot="two" from={at("S14")} to={at("S15")} /> },
  { from: at("S15"), to: W("S15", "was"), el: <Sprout /> },
  { from: W("S15", "was"), to: GARDENER_DURATION, el: <EndShot /> },
];

function EndShot() {
  const f = useCurrentFrame();
  const from = W("S15", "was");
  const walk = progress(f, from + 10, GARDENER_DURATION - from, (x) => x);
  return (
    <>
      <GardenShot shot="end" from={from} to={GARDENER_DURATION} walk={walk} />
      <AbsoluteFill style={{ background: "#1E1712", opacity: progress(f, GARDENER_DURATION - 24, 22) }} />
    </>
  );
}

const SPEECH = LINES.map((l) => [l.from, l.to] as const);
const musicVolume = (f: number) => {
  const near = SPEECH.some(([a, b]) => f >= a - 6 && f <= b + 8);
  const fadeIn = Math.min(1, f / 30);
  const fadeOut = Math.min(1, (GARDENER_DURATION - f) / 40);
  return (near ? 0.17 : 0.32) * fadeIn * fadeOut;
};

const Picture: React.FC = () => {
  const f = useCurrentFrame();
  const cut = CUTS.find((c) => f >= c.from && f < c.to) ?? CUTS[CUTS.length - 1];
  return <AbsoluteFill>{cut.el}</AbsoluteFill>;
};

export const TheGardener: React.FC = () => (
  <AbsoluteFill style={{ background: "#1E1712" }}>
    <Graded warmth={0.1} contrast={1.02} brightness={1.03}>
      <Picture />
    </Graded>
    {/* a soft warm shade at the bottom so the captions read on bright sand */}
    <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 68%, #3A221466 100%)" }} />
    <CinemaGrade rays haze={0.04} grain={0.07} vignette={0.28} glow="#FFD9A0" />
    <KeyLine />
    <Captions />
    {/* the voices, with a breath after the key line */}
    <Sequence from={INTRO} durationInFrames={holdAt} layout="none" name="voice A">
      <Audio src={staticFile(TAKE.file)} volume={1.25} endAt={holdAt} />
    </Sequence>
    <Sequence from={INTRO + holdAt + HOLD} layout="none" name="voice B">
      <Audio src={staticFile(TAKE.file)} volume={1.25} startFrom={holdAt} />
    </Sequence>
    <Audio src={staticFile("music/2026-11-02-the-gardener.mp3")} volume={(f) => musicVolume(f)} />
  </AbsoluteFill>
);

export const GARDENER_COVER = L("S10").to + 10;
