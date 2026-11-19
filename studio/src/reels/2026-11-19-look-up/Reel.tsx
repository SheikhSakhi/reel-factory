import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { progress } from "../../kit";
import { SfxTrack, type SfxCue } from "../../kit/Sfx";
import { BRAND } from "../../brand/brand";

// Conceptual cartoon (user request, 2026-11-19): a close medical adaptation of Pietro Cascavilla's animated short
// (the man fed by a tube, the TV, the coins, the wall that opens onto a field, "LOOK UP!", the robotic arm, the twist).
// The user chose to adapt it closely; it is a derivative of his work: test only unless he gives permission.
// Wordless: pictures, a music bed and cartoon sound effects. Drawn in code (SVG), simple poses and tweens.

const FPS = 30;
export const LOOKUP_DURATION = 54 * FPS;

const SKIN = "#F7CFCF", SKIN_D = "#E9B3B3", COAT = "#FFFFFF", CHAIR = "#2F7A5C", CHAIR_D = "#24624A";
const INK = "#1E1E22", SKY = "#3DB8F2", GRASS = "#3FBF3F", PINK = "#E0549B", GOLD = "#F5C542", PIPE = "#8E959E", TUBE = "#F2D43B";
const SANS = BRAND.theme.fontBody;

// ---------- timeline (frames) ----------
const T = {
  room: 0, prescribe1: 120, prescribe2: 235, shoulder: 330, crack: 380, fall: 450, field: 600, face: 780, drop: 800,
  coin: 930, arm: 1060, lift: 1130, news: 1290, wide: 1440, end: 1620,
};

// ---------- parts ----------

const Pill: React.FC<{ x: number; y: number; r?: number; c?: string }> = ({ x, y, r = 0, c = "#E26D5A" }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-14} y={-7} width={28} height={14} rx={7} fill={c} stroke={INK} strokeWidth={2} />
    <rect x={0} y={-7} width={14} height={14} rx={0} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
  </g>
);

const Coin: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={26} ry={26} fill={GOLD} stroke="#B8902A" strokeWidth={4} />
    <text x={0} y={10} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={28} fill="#B8902A">$</text>
  </g>
);

const Piggy: React.FC<{ x: number; y: number; s?: number; jiggle?: number }> = ({ x, y, s = 1, jiggle = 0 }) => (
  <g transform={`translate(${x} ${y + Math.sin(jiggle * 3) * 4 * jiggle}) scale(${s})`} stroke={INK} strokeWidth={3}>
    <ellipse cx={0} cy={0} rx={90} ry={62} fill="#F4A3B8" />
    <ellipse cx={-88} cy={4} rx={20} ry={24} fill="#F08AA5" />
    <circle cx={-92} cy={0} r={4} fill={INK} /><circle cx={-84} cy={10} r={4} fill={INK} />
    <path d="M -50 -52 L -38 -82 L -22 -56" fill="#F08AA5" />
    <circle cx={-52} cy={-14} r={6} fill={INK} />
    {[-50, -10, 30, 60].map((lx) => <rect key={lx} x={lx} y={50} width={18} height={26} rx={6} fill="#F08AA5" />)}
    <rect x={-10} y={-64} width={40} height={8} rx={4} fill={INK} />
  </g>
);

const Monitor: React.FC<{ x: number; y: number; s?: number; children?: React.ReactNode }> = ({ x, y, s = 1, children }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-10} y={250} width={140} height={20} fill="#3A3F4A" />
    <rect x={50} y={190} width={20} height={70} fill="#3A3F4A" />
    <rect x={-200} y={-20} width={520} height={220} rx={14} fill="#3A3F4A" stroke={INK} strokeWidth={4} />
    <rect x={-186} y={-6} width={492} height={192} rx={6} fill="#6FC6F0" />
    <svg x={-186} y={-6} width={492} height={192} viewBox="0 0 492 192" overflow="hidden">{children}</svg>
  </g>
);

type Mouth = "flat" | "chew" | "grin" | "laugh" | "o";
const MouthPath: React.FC<{ m: Mouth; f: number }> = ({ m, f }) => {
  if (m === "chew") return <ellipse cx={0} cy={44} rx={18} ry={6 + Math.abs(Math.sin(f / 4)) * 7} fill="#8E3B46" stroke={INK} strokeWidth={3} />;
  if (m === "grin") return <path d="M -34 34 Q 0 70 34 34 Z" fill="#FFFFFF" stroke={INK} strokeWidth={3} />;
  if (m === "laugh") return <path d={`M -38 30 Q 0 ${82 + Math.sin(f / 2) * 6} 38 30 Z`} fill="#8E3B46" stroke={INK} strokeWidth={3} />;
  if (m === "o") return <ellipse cx={0} cy={46} rx={12} ry={14} fill="#8E3B46" stroke={INK} strokeWidth={3} />;
  return <path d="M -20 44 L 20 44" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
};

/** The doctor's head, front view. look: pupils offset; mark: the blood mark on the forehead. */
const Head: React.FC<{ x: number; y: number; s?: number; m?: Mouth; f: number; look?: [number, number]; mark?: number; wide?: boolean }> = ({ x, y, s = 1, m = "flat", f, look = [0, 0], mark = 0, wide = false }) => {
  const blink = f % 110 < 4 ? 0.15 : 1;
  const er = wide ? 26 : 20;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeWidth={3}>
      <ellipse cx={-92} cy={10} rx={18} ry={26} fill={SKIN} />
      <ellipse cx={92} cy={10} rx={18} ry={26} fill={SKIN} />
      <ellipse cx={0} cy={0} rx={92} ry={104} fill={SKIN} />
      {[-34, 34].map((ex) => (
        <g key={ex}>
          <ellipse cx={ex} cy={-6} rx={er} ry={er * blink} fill="#FFFFFF" />
          {blink > 0.5 ? <circle cx={ex + look[0]} cy={-6 + look[1]} r={6} fill={INK} stroke="none" /> : null}
        </g>
      ))}
      <path d="M -6 10 Q -10 26 4 26" fill="none" />
      <MouthPath m={m} f={f} />
      {mark > 0 ? <path d="M 0 -62 q 10 14 0 20 q -10 -6 0 -20 Z" fill="#D0202A" stroke="none" opacity={mark} /> : null}
      {mark > 0 ? <path d="M 0 -48 L 2 -20" stroke="#D0202A" strokeWidth={5} opacity={mark * 0.8} /> : null}
    </g>
  );
};

/** The doctor in his armchair, three-quarter view (room shots). arm: 0 rest, 1 raised to click. */
const DoctorInChair: React.FC<{ x: number; y: number; f: number; m?: Mouth; arm?: number; look?: [number, number] }> = ({ x, y, f, m = "chew", arm = 0, look = [6, 0] }) => {
  const breathe = Math.sin(f / 20) * 3;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* armchair */}
      <path d="M -190 -230 Q -200 -330 -110 -340 L 120 -340 Q 200 -330 190 -230 L 190 120 L -190 120 Z" fill={CHAIR} stroke={INK} strokeWidth={4} />
      <rect x={-230} y={-60} width={80} height={200} rx={34} fill={CHAIR_D} stroke={INK} strokeWidth={4} />
      <rect x={150} y={-60} width={80} height={200} rx={34} fill={CHAIR_D} stroke={INK} strokeWidth={4} />
      {/* body: bare chest under an open white coat */}
      <g transform={`translate(0 ${breathe})`} stroke={INK} strokeWidth={4}>
        <path d="M -120 120 Q -140 -60 -70 -140 L 70 -140 Q 140 -60 120 120 Z" fill={SKIN} />
        <path d="M -120 120 Q -140 -60 -70 -140 L -30 -140 L -50 120 Z" fill={COAT} />
        <path d="M 120 120 Q 140 -60 70 -140 L 30 -140 L 50 120 Z" fill={COAT} />
        <path d="M -40 -40 Q -20 -30 0 -40 M 0 -40 Q 20 -30 40 -40" fill="none" />
        {/* stethoscope */}
        <path d="M -40 -138 Q -60 -40 -10 -20 Q 0 -16 10 -20 Q 60 -40 40 -138" fill="none" stroke="#555B66" strokeWidth={6} />
        <circle cx={0} cy={-18} r={10} fill="#8C929C" />
        {/* legs */}
        <path d="M -80 120 L -90 230 M 80 120 L 100 230" stroke={SKIN_D} strokeWidth={46} strokeLinecap="round" />
        {/* arms */}
        <path d={`M -110 -80 Q -150 20 -110 80`} stroke={SKIN_D} strokeWidth={36} strokeLinecap="round" fill="none" />
        <path d={arm > 0 ? `M 110 -80 Q ${170 + arm * 40} ${-60 - arm * 80} ${200 + arm * 60} ${-40 - arm * 140}` : "M 110 -80 Q 150 20 120 80"} stroke={SKIN_D} strokeWidth={36} strokeLinecap="round" fill="none" />
      </g>
      <Head x={0} y={-250 + breathe} s={0.95} m={m} f={f} look={look} />
    </g>
  );
};

const PillPipe: React.FC<{ f: number; feed?: boolean; mouth: [number, number] }> = ({ f, feed = true, mouth }) => (
  <g>
    <path d={`M 360 -20 L 360 120 Q 360 180 300 180 L ${mouth[0] + 40} 180 Q ${mouth[0]} 180 ${mouth[0]} 220 L ${mouth[0]} ${mouth[1] - 40}`} fill="none" stroke={PIPE} strokeWidth={34} strokeLinejoin="round" />
    <rect x={300} y={60} width={120} height={150} rx={20} fill="#D8EEF7" stroke={INK} strokeWidth={4} />
    <rect x={318} y={110} width={84} height={90} rx={10} fill="#F2B3A8" />
    {Array.from({ length: 8 }).map((_, i) => <Pill key={i} x={330 + (i % 3) * 26} y={128 + Math.floor(i / 3) * 24} r={i * 40} />)}
    <rect x={320} y={74} width={80} height={26} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
    <text x={360} y={93} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={18} fill={INK}>PILLS</text>
    {feed ? <Pill x={mouth[0]} y={mouth[1] - 60 + ((f * 3) % 40)} r={90} /> : null}
  </g>
);

// ---------- shots ----------

const Room: React.FC<{ f: number }> = ({ f }) => {
  const clicks = [T.prescribe1, T.prescribe2];
  const lastClick = clicks.filter((c) => f >= c).pop();
  const arm = lastClick !== undefined ? Math.max(0, 1 - Math.abs(f - lastClick - 10) / 12) : 0;
  const coinT = lastClick !== undefined ? progress(f, lastClick + 8, 18) : 0;
  const pills = f >= T.prescribe1 + 6;
  const m: Mouth = arm > 0.3 ? "grin" : f > T.prescribe1 && f < T.prescribe1 + 50 ? "grin" : "chew";
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <rect width={1080} height={1920} fill="#FFFFFF" />
      <rect x={0} y={1500} width={1080} height={420} fill="#F1F1F3" />
      <PillPipe f={f} mouth={[430, 1010]} />
      {/* the prescription tube: from the desk out through the right wall */}
      <path d="M 860 1330 Q 960 1330 960 1200 L 960 1000 Q 960 940 1100 940" fill="none" stroke={TUBE} strokeWidth={26} />
      {pills ? Array.from({ length: 5 }).map((_, i) => {
        const k = ((f - T.prescribe1) / 50 + i / 5) % 1;
        const y = 1330 - k * 390;
        return <Pill key={i} x={960} y={y} r={90} c="#5BA8E0" />;
      }) : null}
      <DoctorInChair x={430} y={1240} f={f} m={m} arm={arm} />
      <Piggy x={170} y={1500} s={1.1} jiggle={coinT > 0.9 && coinT < 1 ? 1 : 0} />
      {lastClick !== undefined && coinT < 1 ? <Coin x={170 + 10} y={1300 + coinT * 140} /> : null}
      {/* the screen: a pharma ad with a PRESCRIBE button */}
      <Monitor x={760} y={1080} s={0.9}>
        <rect width={492} height={192} fill="#FFF3E6" />
        <text x={20} y={56} fontFamily={SANS} fontWeight={800} fontSize={40} fill="#E2382F">NEW! Maxicor®</text>
        <text x={20} y={96} fontFamily={SANS} fontSize={24} fill={INK}>“Patients love it.”</text>
        <rect x={20} y={118} width={230} height={56} rx={10} fill={lastClick !== undefined && f - lastClick < 20 ? "#1A7F3C" : "#2BB05A"} />
        <text x={135} y={156} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} fill="#FFFFFF">PRESCRIBE</text>
        <Pill x={400} y={96} r={-30} c="#5BA8E0" />
      </Monitor>
    </svg>
  );
};

const Field: React.FC<{ f: number; y0?: number; lift?: number; showPatient?: boolean }> = ({ f, y0 = 0, lift = 0, showPatient = true }) => {
  const breathe = 1 + Math.sin(f / 26) * 0.02;
  const droop = Math.sin(f / 40) * 3;
  return (
    <g transform={`translate(0 ${y0})`}>
      <rect x={0} y={0} width={1080} height={900} fill={SKY} />
      {[[180, 160], [620, 110], [900, 260], [380, 330]].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx + Math.sin(f / 200 + i) * 20} ${cy})`} fill="#FFFFFF">
          <ellipse rx={90} ry={30} /><ellipse cx={-50} cy={-14} rx={50} ry={30} /><ellipse cx={40} cy={-22} rx={56} ry={34} />
        </g>
      ))}
      <rect x={0} y={640} width={1080} height={300} fill={GRASS} />
      {/* the panel with the painted words, and the paint bucket */}
      <g transform="translate(300 360) rotate(-2)">
        <rect x={0} y={0} width={480} height={170} fill="#F6F1E6" stroke={INK} strokeWidth={4} />
        <text x={240} y={118} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={104} fill="none" stroke={PINK} strokeWidth={9} strokeLinejoin="round">LOOK UP!</text>
        <path d="M 120 150 l 0 40 M 300 150 l 0 26 M 420 150 l 0 50" stroke={PINK} strokeWidth={8} strokeLinecap="round" />
        <rect x={232} y={170} width={16} height={130} fill="#8A6A4A" />
      </g>
      <g transform="translate(860 700)">
        <path d="M -60 -70 L 60 -70 L 48 40 L -48 40 Z" fill="#B7BDC6" stroke={INK} strokeWidth={4} />
        <path d="M -60 -70 Q 0 -110 60 -70" fill="none" stroke={INK} strokeWidth={4} />
        <path d="M -54 -66 Q -40 -40 -36 -10 M 0 -70 Q 4 -40 0 -20" stroke={PINK} strokeWidth={10} fill="none" />
        <text x={0} y={10} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} fill={INK}>by DocX</text>
      </g>
      {/* the patient on the table, barely moving, like a wilting plant */}
      {showPatient ? (
        <g transform={`translate(540 ${700 - lift})`}>
          <rect x={-200} y={0} width={400} height={30} rx={6} fill="#C9CED6" stroke={INK} strokeWidth={4} />
          <path d="M -170 30 L -170 120 M 170 30 L 170 120" stroke={INK} strokeWidth={8} />
          <g transform={`rotate(${droop * 0.4})`} opacity={lift > 0 ? 1 : 1}>
            <ellipse cx={20} cy={-26} rx={150} ry={34 * breathe} fill="#D9DDE8" stroke={INK} strokeWidth={4} />
            <circle cx={-150} cy={-40 + droop} r={42} fill="#E8D6CF" stroke={INK} strokeWidth={4} />
            <path d="M -168 -42 l 10 0 M -146 -42 l 10 0" stroke={INK} strokeWidth={4} />
            <path d="M -160 -24 q 8 -4 16 0" stroke={INK} strokeWidth={3} fill="none" />
            <path d="M 150 -40 Q 190 -30 200 -6" stroke="#E8D6CF" strokeWidth={22} strokeLinecap="round" fill="none" />
          </g>
          {/* the pill tube into the patient's mouth */}
          {lift === 0 ? <path d="M -130 -40 Q -60 -160 -560 -120" stroke={TUBE} strokeWidth={20} fill="none" /> : null}
        </g>
      ) : null}
    </g>
  );
};

const RoboticArm: React.FC<{ x: number; y: number; reach: number; grip: number }> = ({ x, y, reach, grip }) => {
  const tipY = y + reach;
  return (
    <g>
      <path d={`M ${x - 300} -40 Q ${x - 200} ${y + reach * 0.3} ${x} ${tipY - 60}`} stroke={PIPE} strokeWidth={30} fill="none" strokeDasharray="34 6" />
      <circle cx={x} cy={tipY - 60} r={24} fill="#6B727C" stroke={INK} strokeWidth={4} />
      <path d={`M ${x - 10} ${tipY - 50} L ${x - 40 - (1 - grip) * 20} ${tipY} M ${x + 10} ${tipY - 50} L ${x + 40 + (1 - grip) * 20} ${tipY}`} stroke={INK} strokeWidth={10} strokeLinecap="round" />
    </g>
  );
};

/** Over the doctor's shoulder: the monitor below, the wall behind it, and the field once the wall falls. */
const Shoulder: React.FC<{ f: number }> = ({ f }) => {
  const crack = progress(f, T.crack, 50);
  const fall = progress(f, T.fall, 50);
  const lift = f >= T.lift ? interpolate(f, [T.lift, T.news - 10], [0, 1000], { extrapolateRight: "clamp" }) : 0;
  const reach = f >= T.arm ? Math.min(1, (f - T.arm) / (T.lift - T.arm)) * 640 : 0;
  const laughing = f >= T.lift;
  const showNews = f >= T.news;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <rect width={1080} height={1920} fill="#FFFFFF" />
      {/* the field behind the wall */}
      {fall > 0 ? <Field f={f} y0={0} lift={lift} /> : null}
      {f >= T.arm && f < T.news ? <RoboticArm x={420} y={0} reach={lift > 0 ? 640 - lift : reach} grip={f >= T.lift - 10 ? 1 : 0} /> : null}
      {/* the wall: cracks, then pieces fall away */}
      {fall < 1 ? (
        <g>
          {Array.from({ length: 12 }).map((_, i) => {
            const c = i % 4, r = Math.floor(i / 4);
            const delay = (i * 7) % 12;
            const k = Math.max(0, Math.min(1, fall * 1.4 - delay / 24));
            return <rect key={i} x={c * 270} y={r * 300} width={272} height={302} fill="#F4F4F6" stroke="#DADAE0" strokeWidth={2}
              transform={`translate(0 ${k * k * 1200}) rotate(${k * (i % 2 ? 20 : -16)} ${c * 270 + 135} ${r * 300 + 150})`} />;
          })}
          {crack > 0 ? <path d={`M 540 0 L 500 140 L 590 260 L 520 420 L 600 600 L 560 900`} stroke={INK} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crack} /> : null}
          {crack > 0.4 ? <path d="M 500 140 L 380 200 M 590 260 L 760 300 M 600 600 L 780 680" stroke={INK} strokeWidth={3} fill="none" opacity={(crack - 0.4) / 0.6} /> : null}
        </g>
      ) : null}
      {/* the monitor and the doctor's head from behind */}
      <rect x={0} y={900} width={1080} height={1020} fill="#FFFFFF" />
      <Monitor x={640} y={1050} s={1.1}>
        {showNews ? (
          <>
            <rect width={492} height={192} fill="#3A6FD8" />
            <rect x={0} y={0} width={110} height={36} fill="#E2382F" />
            <text x={14} y={27} fontFamily={SANS} fontWeight={800} fontSize={24} fill="#FFFFFF">NEWS</text>
            <circle cx={150} cy={110} r={34} fill={SKIN} stroke={INK} strokeWidth={3} />
            <rect x={110} y={140} width={80} height={52} fill="#2B2F3A" />
            <g opacity={progress(f, T.news + 30, 10)}>
              <rect x={240} y={50} width={230} height={110} rx={10} fill="#FFFFFF" />
              <text x={355} y={96} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} fill={INK}>PATIENTS</text>
              <text x={355} y={128} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} fill={INK}>EXAGGERATE</text>
            </g>
            <g opacity={progress(f, T.news + 80, 10)}>
              <path d="M 260 60 L 450 150 M 450 60 L 260 150" stroke="#E2382F" strokeWidth={12} />
            </g>
          </>
        ) : (
          <>
            <rect width={492} height={192} fill="#FFF3E6" />
            <text x={20} y={60} fontFamily={SANS} fontWeight={800} fontSize={40} fill="#E2382F">NEW! Maxicor®</text>
            <rect x={20} y={110} width={230} height={56} rx={10} fill="#2BB05A" />
            <text x={135} y={148} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} fill="#FFFFFF">PRESCRIBE</text>
          </>
        )}
      </Monitor>
      <g transform={`translate(160 1700) rotate(${laughing ? Math.sin(f / 3) * 3 : 0})`}>
        <path d="M -260 300 Q -240 40 0 20 Q 240 40 260 300 Z" fill={CHAIR} stroke={INK} strokeWidth={4} />
        <ellipse cx={30} cy={-60} rx={150} ry={170} fill={SKIN} stroke={INK} strokeWidth={4} />
        <ellipse cx={170} cy={-50} rx={26} ry={40} fill={SKIN} stroke={INK} strokeWidth={4} />
        {f >= T.face ? <path d="M 120 -150 q 8 12 0 18 q -8 -6 0 -18 Z" fill="#D0202A" /> : null}
        {laughing ? <path d={`M 150 20 Q 200 ${40 + Math.sin(f / 2) * 8} 170 70`} stroke={INK} strokeWidth={5} fill="#8E3B46" /> : null}
      </g>
    </svg>
  );
};

const FieldClose: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <rect width={1080} height={1920} fill={GRASS} />
    <g transform={`translate(540 960) scale(${1.7 + (f - T.field) * 0.0008}) translate(-540 -560)`}>
      <Field f={f} />
    </g>
  </svg>
);

const FaceClose: React.FC<{ f: number }> = ({ f }) => {
  const dropY = interpolate(f, [T.drop, T.drop + 24], [-200, 640], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hit = f >= T.drop + 24;
  const coinFall = f >= T.coin ? interpolate(f, [T.coin, T.coin + 30], [-120, 1240], { extrapolateRight: "clamp" }) : -999;
  const grabbed = f >= T.coin + 30;
  const m: Mouth = grabbed ? "grin" : hit ? "o" : "flat";
  const look: [number, number] = f >= T.coin && !grabbed ? [-8, 10] : hit ? [0, -10] : [0, 0];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <rect width={1080} height={1920} fill="#FFFFFF" />
      <path d="M 260 500 L 260 380 Q 260 300 340 300 L 740 300 Q 820 300 820 380 L 820 500" fill={CHAIR} stroke={INK} strokeWidth={5} />
      <rect x={200} y={500} width={680} height={900} rx={60} fill={CHAIR} stroke={INK} strokeWidth={5} />
      <path d="M 330 1500 Q 300 1100 420 1000 L 660 1000 Q 780 1100 750 1500 Z" fill={SKIN} stroke={INK} strokeWidth={5} />
      <path d="M 330 1500 Q 300 1100 420 1000 L 480 1000 L 450 1500 Z" fill={COAT} stroke={INK} strokeWidth={5} />
      <path d="M 750 1500 Q 780 1100 660 1000 L 600 1000 L 630 1500 Z" fill={COAT} stroke={INK} strokeWidth={5} />
      <Head x={540} y={760} s={2.2} m={m} f={f} look={look} mark={hit ? 1 : 0} wide={hit && !grabbed} />
      {!hit ? <path d={`M 540 ${dropY} q 14 22 0 32 q -14 -10 0 -32 Z`} fill="#D0202A" /> : null}
      {f >= T.coin ? (
        <>
          {!grabbed ? <Coin x={260} y={coinFall} s={1.6} /> : <Coin x={300} y={1240} s={1.6} />}
          <path d={grabbed ? "M 400 1200 Q 330 1240 300 1240" : "M 400 1200 Q 380 1300 380 1360"} stroke={SKIN_D} strokeWidth={46} strokeLinecap="round" fill="none" />
          <Piggy x={180} y={1640} s={1.2} jiggle={grabbed ? 1 : 0} />
        </>
      ) : null}
    </svg>
  );
};

const Wide: React.FC<{ f: number }> = ({ f }) => {
  const pull = progress(f, T.wide, 90);
  const s = 1.8 - pull * 1.0;
  const text = progress(f, T.wide + 110, 14);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <rect width={1080} height={1920} fill={SKY} />
      <g transform={`translate(540 1200) scale(${s}) translate(-540 -1200)`}>
        {[[200, 300], [700, 220], [880, 520], [300, 640]].map(([cx, cy], i) => (
          <g key={i} transform={`translate(${cx} ${cy})`} fill="#FFFFFF"><ellipse rx={100} ry={32} /><ellipse cx={-50} cy={-16} rx={56} ry={32} /><ellipse cx={46} cy={-24} rx={60} ry={36} /></g>
        ))}
        <rect x={-400} y={1300} width={1880} height={900} fill={GRASS} />
        {/* cables and pill tubes from the sky into the doctor's box */}
        {[-30, -10, 10, 30].map((dx, i) => (
          <path key={i} d={`M ${540 + dx} -200 Q ${540 + dx + Math.sin(f / 30 + i) * 20} 600 ${540 + dx / 2} 1180`} stroke={i % 2 ? TUBE : PIPE} strokeWidth={8} fill="none" />
        ))}
        <rect x={420} y={1180} width={240} height={150} fill="#FFFFFF" stroke="#C8CDD6" strokeWidth={4} />
        <text x={640} y={1316} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={16} fill={PINK}>clinic</text>
      </g>
      <g opacity={text}>
        <text x={540} y={520} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={150} fill="none" stroke={PINK} strokeWidth={12} strokeLinejoin="round"
          transform="rotate(-3 540 520)">LOOK UP!</text>
        <text x={540} y={620} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill={INK}>by DocX</text>
      </g>
    </svg>
  );
};

const SFX: SfxCue[] = [
  { at: T.prescribe1 + 6, sound: "click", volume: 0.6 }, { at: T.prescribe1 + 24, sound: "ding", volume: 0.6 },
  { at: T.prescribe2 + 6, sound: "click", volume: 0.6 }, { at: T.prescribe2 + 24, sound: "ding", volume: 0.6 },
  { at: T.crack, sound: "tick", volume: 0.7 }, { at: T.crack + 25, sound: "tick", volume: 0.7 },
  { at: T.fall, sound: "impact", volume: 0.8 }, { at: T.fall + 10, sound: "thud", volume: 0.7 },
  { at: T.drop + 22, sound: "blip", volume: 0.7 }, { at: T.coin + 28, sound: "ding", volume: 0.8 },
  { at: T.arm, sound: "rise", volume: 0.5 }, { at: T.lift, sound: "riser", volume: 0.5 },
  { at: T.news, sound: "pop", volume: 0.5 }, { at: T.wide + 110, sound: "impact", volume: 0.6 },
];

export const LookUp: React.FC = () => {
  const f = useCurrentFrame();
  let shot: React.ReactNode;
  if (f < T.shoulder) shot = <Room f={f} />;
  else if (f < T.field) shot = <Shoulder f={f} />;
  else if (f < T.face) shot = <FieldClose f={f} />;
  else if (f < T.arm) shot = <FaceClose f={f} />;
  else if (f < T.wide) shot = <Shoulder f={f} />;
  else shot = <Wide f={f} />;
  return (
    <AbsoluteFill style={{ background: "#FFFFFF" }}>
      {shot}
      <AbsoluteFill style={{ background: "#000", opacity: progress(f, LOOKUP_DURATION - 20, 18) }} />
      <SfxTrack cues={SFX} />
      <Audio src={staticFile("music/2026-11-19-look-up.mp3")} volume={(fr) => 0.35 * Math.min(1, fr / 20) * Math.min(1, (LOOKUP_DURATION - fr) / 30)} />
    </AbsoluteFill>
  );
};

export const LOOKUP_COVER = T.fall + 120;
