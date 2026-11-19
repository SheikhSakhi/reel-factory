import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SfxTrack, type SfxCue } from "../../kit/Sfx";
import { BRAND } from "../../brand/brand";

// Conceptual cartoon v2 (user request, 2026-11-19): a close medical adaptation of Pietro Cascavilla's short. TEST ONLY
// (a derivative of his work). v2 after "can't you see the difference in quality": hand-drawn look (line boil that
// redraws every second frame, animation on twos), organic chubby character design, his framing (tight over-the-shoulder
// shots, the wall opening above the screen like a window), more cuts. Wordless: music bed + cartoon sound effects.

const FPS = 30;
export const LOOKUP_DURATION = 54 * FPS;

const LINE = "#1C1A1D";
const SKIN = "#F8D3D8", SKIN_S = "#EDB9C1", COAT = "#FFFFFF", COAT_S = "#E4E8EE";
const CHAIR = "#2F7B62", CHAIR_S = "#256650", PIPE = "#8B939D", PIPE_S = "#737B85", CABLE = "#EAD93A";
const SKY = "#3DBDF5", GRASS = "#45BC3A", GRASS_D = "#2F9A2A", PINK = "#C9449A", GOLD = "#F4C542", RED = "#E0262B";
const SANS = BRAND.theme.fontBody;
const W = 5; // outline width

/** Hand-drawn line boil: the displacement seed changes every 2 frames (animation on twos). */
const Boil: React.FC<{ f: number; children: React.ReactNode; amount?: number }> = ({ f, children, amount = 2.6 }) => {
  const seed = Math.floor(f / 2) % 3;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id={`boil${seed}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed + 3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={amount} />
        </filter>
      </defs>
      <g filter={`url(#boil${seed})`} strokeLinejoin="round" strokeLinecap="round">{children}</g>
    </svg>
  );
};
const twos = (f: number) => f - (f % 2);

// ---------- props ----------

const Pill: React.FC<{ x: number; y: number; r?: number; c?: string; s?: number }> = ({ x, y, r = 0, c = "#E9665A", s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} stroke={LINE} strokeWidth={3}>
    <path d="M -16 -8 L 0 -8 L 0 8 L -16 8 A 8 8 0 0 1 -16 -8 Z" fill={c} />
    <path d="M 0 -8 L 16 -8 A 8 8 0 0 1 16 8 L 0 8 Z" fill="#FFFFFF" />
  </g>
);

const Coin: React.FC<{ x: number; y: number; s?: number; spin?: number }> = ({ x, y, s = 1, spin = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s * Math.max(0.25, Math.abs(Math.cos(spin)))} ${s})`} stroke={LINE} strokeWidth={W}>
    <circle r={30} fill={GOLD} />
    <circle r={20} fill="none" stroke="#C99B25" strokeWidth={4} />
  </g>
);

const Piggy: React.FC<{ x: number; y: number; s?: number; hop?: number }> = ({ x, y, s = 1, hop = 0 }) => (
  <g transform={`translate(${x} ${y - hop * 14}) scale(${s})`} stroke={LINE} strokeWidth={W}>
    {[-55, -20, 30, 62].map((lx) => <path key={lx} d={`M ${lx} 40 L ${lx} 72 Q ${lx + 10} 80 ${lx + 22} 72 L ${lx + 22} 40`} fill="#F28FB1" />)}
    <path d="M -100 10 Q -100 -70 0 -72 Q 100 -70 104 4 Q 106 62 0 66 Q -100 64 -100 10 Z" fill="#F7A9C3" />
    <path d="M -60 -56 Q -52 -96 -24 -66" fill="#F28FB1" />
    <path d="M 20 -70 Q 40 -100 56 -62" fill="#F28FB1" />
    <ellipse cx={108} cy={6} rx={22} ry={26} fill="#F28FB1" />
    <ellipse cx={104} cy={0} rx={4} ry={6} fill={LINE} /><ellipse cx={114} cy={12} rx={4} ry={6} fill={LINE} />
    <ellipse cx={58} cy={-18} rx={5} ry={7} fill={LINE} stroke="none" />
    <path d="M -20 -66 L 20 -64" strokeWidth={8} />
    <path d="M -100 0 Q -122 -8 -116 -26" fill="none" />
  </g>
);

/** The ceiling: grey L-pipes, the yellow cable and the PILLS canister whose nozzle points at the doctor's mouth. */
const Ceiling: React.FC<{ f: number; nozzle: [number, number]; flowing?: boolean }> = ({ f, nozzle, flowing = true }) => (
  <g stroke={LINE} strokeWidth={W}>
    <path d="M 120 -20 L 120 330 Q 120 360 150 360 L 200 360" fill="none" stroke={CABLE} strokeWidth={46} />
    <path d="M 120 -20 L 120 330 Q 120 360 150 360 L 200 360" fill="none" strokeWidth={W} stroke={LINE} opacity={0} />
    <rect x={340} y={-20} width={56} height={330} fill={PIPE} />
    <rect x={170} y={290} width={226} height={56} fill={PIPE} />
    <rect x={150} y={276} width={40} height={84} rx={6} fill={PIPE_S} />
    <rect x={470} y={-20} width={50} height={160} fill={PIPE} />
    {/* the canister */}
    <path d="M 430 130 Q 430 110 450 110 L 540 110 Q 560 110 560 130 L 560 330 Q 560 356 495 356 Q 430 356 430 330 Z" fill="#DDEFF7" />
    <path d="M 440 220 L 550 220 L 550 326 Q 550 346 495 346 Q 440 346 440 326 Z" fill="#E8A48F" stroke="none" />
    {Array.from({ length: 9 }).map((_, i) => <Pill key={i} x={456 + (i % 3) * 36} y={244 + Math.floor(i / 3) * 30} r={i * 37} s={0.9} />)}
    <rect x={448} y={140} width={94} height={56} rx={4} fill="#FFFFFF" strokeWidth={3} />
    <text x={495} y={168} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} fill={LINE} stroke="none">PILLS</text>
    <text x={495} y={188} textAnchor="middle" fontFamily={SANS} fontSize={13} fill={LINE} stroke="none">(the real ones)</text>
    {/* the nozzle down to the mouth */}
    <path d={`M 495 356 L 495 420 Q 495 ${nozzle[1] - 80} ${nozzle[0] + 30} ${nozzle[1] - 40} L ${nozzle[0] + 6} ${nozzle[1] - 6}`} fill="none" stroke={PIPE_S} strokeWidth={30} />
    {flowing ? <Pill x={nozzle[0] + 12 + Math.sin(twos(f) / 3) * 2} y={nozzle[1] - 18 + (twos(f) * 2) % 16} r={60} s={0.7} /> : null}
  </g>
);

// ---------- the doctor ----------

type Face = "lazy" | "chew" | "cheer" | "shock" | "grin" | "laugh";

const Eyes: React.FC<{ face: Face; f: number; look?: [number, number]; big?: boolean }> = ({ face, f, look = [0, 0], big }) => {
  const blink = f % 96 < 4 && face !== "shock";
  const rx = big ? 34 : 24, ry = big ? 32 : 22;
  const lid = face === "lazy" || face === "chew" ? 0.5 : 0;
  return (
    <g>
      {[-42, 42].map((ex) => (
        <g key={ex}>
          <ellipse cx={ex} cy={-10} rx={rx} ry={blink ? 3 : ry} fill="#FFFFFF" />
          {!blink ? <circle cx={ex + look[0]} cy={-6 + look[1]} r={big ? 8 : 6} fill={LINE} stroke="none" /> : null}
          {lid > 0 && !blink ? <path d={`M ${ex - rx} ${-10} Q ${ex} ${-10 - ry - 4} ${ex + rx} ${-10} L ${ex + rx} ${-10 - ry * lid} Q ${ex} ${-10 - ry - 2} ${ex - rx} ${-10 - ry * lid} Z`} fill={SKIN} /> : null}
          {lid > 0 && !blink ? <path d={`M ${ex - rx} ${-10} Q ${ex} ${-18} ${ex + rx} ${-10}`} fill="none" /> : null}
        </g>
      ))}
    </g>
  );
};

const Mouth: React.FC<{ face: Face; f: number }> = ({ face, f }) => {
  const k = twos(f);
  if (face === "chew") return <path d={`M -34 58 Q 0 ${70 + Math.abs(Math.sin(k / 5)) * 26} 34 58 Q 0 48 -34 58 Z`} fill="#7E2B3B" />;
  if (face === "lazy") return <path d="M -26 62 Q 0 70 26 62" fill="none" />;
  if (face === "shock") return <ellipse cx={0} cy={66} rx={12} ry={15} fill="#7E2B3B" />;
  if (face === "cheer") return <g><path d="M -52 46 Q 0 118 52 46 Q 0 62 -52 46 Z" fill="#7E2B3B" /><path d="M -46 50 Q 0 64 46 50 L 44 60 Q 0 72 -44 60 Z" fill="#FFFFFF" /></g>;
  // grin / laugh: wide open, teeth and tongue, like the original's
  const o = face === "laugh" ? Math.abs(Math.sin(k / 3)) * 14 : 0;
  return (
    <g>
      <path d={`M -64 40 Q 0 ${130 + o} 64 40 Q 0 54 -64 40 Z`} fill="#7E2B3B" />
      <path d="M -58 44 Q 0 60 58 44 L 54 58 Q 0 74 -54 58 Z" fill="#FFFFFF" />
      <path d={`M -28 ${96 + o * 0.6} Q 0 ${70 + o} 30 ${94 + o * 0.6} Q 0 ${118 + o} -28 ${96 + o * 0.6} Z`} fill="#E36C83" />
    </g>
  );
};

/** The head, front view: bald, soft, a little egg-shaped. */
const Head: React.FC<{ face: Face; f: number; look?: [number, number]; mark?: number; big?: boolean }> = ({ face, f, look, mark = 0, big }) => (
  <g stroke={LINE} strokeWidth={W}>
    <path d="M -112 4 Q -134 -6 -128 22 Q -124 46 -104 40" fill={SKIN} />
    <path d="M 112 4 Q 134 -6 128 22 Q 124 46 104 40" fill={SKIN} />
    <path d="M 0 -150 Q 106 -150 112 -30 Q 116 70 70 112 Q 34 138 0 138 Q -34 138 -70 112 Q -116 70 -112 -30 Q -106 -150 0 -150 Z" fill={SKIN} />
    <path d="M -64 116 Q 0 156 64 116" fill="none" strokeWidth={3} opacity={0.6} />
    <Eyes face={face} f={f} look={look} big={big} />
    <path d="M -8 14 Q -16 40 2 40 Q 12 40 10 32" fill="none" strokeWidth={4} />
    <Mouth face={face} f={f} />
    {mark > 0 ? (
      <g stroke="none" opacity={mark}>
        <path d="M -4 -92 q -14 -10 -6 -22 q 10 4 14 -6 q 10 10 2 22 q 12 8 0 16 q -6 -8 -10 -10 Z" fill={RED} />
        <path d="M 0 -80 Q 2 -40 -2 -24" stroke={RED} strokeWidth={7} fill="none" />
      </g>
    ) : null}
  </g>
);

/** The doctor seated in his armchair, front three-quarter (the wide room shot). arm: 0..1 fist raised. */
const SeatedDoctor: React.FC<{ f: number; face: Face; arm?: number }> = ({ f, face, arm = 0 }) => {
  const b = Math.sin(twos(f) / 14) * 4;
  return (
    <g stroke={LINE} strokeWidth={W}>
      {/* armchair */}
      <path d="M -210 -170 Q -220 -300 -110 -310 L 110 -310 Q 220 -300 210 -170 L 220 160 L -220 160 Z" fill={CHAIR} />
      <path d="M -260 -40 Q -270 -90 -210 -90 Q -170 -90 -170 -40 L -170 170 L -260 170 Z" fill={CHAIR_S} />
      <path d="M 260 -40 Q 270 -90 210 -90 Q 170 -90 170 -40 L 170 170 L 260 170 Z" fill={CHAIR_S} />
      {/* legs and feet */}
      <path d="M -120 90 Q -160 210 -110 300 L -60 300 Q -50 220 -40 120 Z" fill={SKIN} />
      <path d="M 120 90 Q 170 210 130 300 L 70 300 Q 50 220 40 120 Z" fill={SKIN} />
      <path d="M -130 300 Q -150 330 -80 330 Q -50 330 -60 300" fill={SKIN} />
      <path d="M 140 300 Q 160 330 90 330 Q 60 330 70 300" fill={SKIN} />
      {/* the chubby body and belly, the open white coat */}
      <g transform={`translate(0 ${b})`}>
        <path d="M -150 120 Q -190 -40 -110 -150 L 110 -150 Q 190 -40 150 120 Q 0 170 -150 120 Z" fill={SKIN} />
        <path d="M -110 20 Q 0 70 110 20" fill="none" strokeWidth={4} opacity={0.7} />
        <path d="M -60 -60 Q -40 -40 -20 -56 M 20 -56 Q 40 -40 60 -60" fill="none" strokeWidth={4} />
        <path d="M -150 120 Q -190 -40 -110 -150 L -66 -150 Q -100 0 -96 136 Z" fill={COAT} />
        <path d="M 150 120 Q 190 -40 110 -150 L 66 -150 Q 100 0 96 136 Z" fill={COAT} />
        <path d="M -60 -148 Q -84 -40 -26 -20 Q 0 -12 26 -20 Q 84 -40 60 -148" fill="none" stroke="#545A66" strokeWidth={8} />
        <circle cx={0} cy={-16} r={13} fill="#9AA1AB" strokeWidth={4} />
        {/* arms */}
        <path d="M -140 -110 Q -200 -10 -160 70 Q -140 96 -110 80" fill="none" stroke={LINE} strokeWidth={50} />
        <path d="M -140 -110 Q -200 -10 -160 70 Q -140 96 -110 80" fill="none" stroke={SKIN} strokeWidth={40} />
        {arm > 0 ? (
          <g>
            <path d={`M 140 -110 Q ${200 + arm * 20} ${-150 - arm * 60} ${190 + arm * 10} ${-240 - arm * 110}`} fill="none" stroke={LINE} strokeWidth={50} />
            <path d={`M 140 -110 Q ${200 + arm * 20} ${-150 - arm * 60} ${190 + arm * 10} ${-240 - arm * 110}`} fill="none" stroke={SKIN} strokeWidth={40} />
            <circle cx={190 + arm * 10} cy={-250 - arm * 110} r={32} fill={SKIN} />
            <path d={`M ${172 + arm * 10} ${-262 - arm * 110} l 34 0 M ${172 + arm * 10} ${-248 - arm * 110} l 34 0`} strokeWidth={3} />
          </g>
        ) : (
          <g>
            <path d="M 140 -110 Q 200 -10 160 70 Q 140 96 110 80" fill="none" stroke={LINE} strokeWidth={50} />
            <path d="M 140 -110 Q 200 -10 160 70 Q 140 96 110 80" fill="none" stroke={SKIN} strokeWidth={40} />
          </g>
        )}
        <g transform="translate(0 -290) scale(0.95)"><Head face={face} f={f} /></g>
      </g>
    </g>
  );
};

/** The doctor from behind, over the shoulder: the head large in the lower left, the shoulder and the chair. */
const BackOfHead: React.FC<{ f: number; face: Face; mark?: number; turn?: number }> = ({ f, face, mark = 0, turn = 0 }) => {
  const shake = face === "laugh" ? Math.sin(twos(f) / 2) * 3 : 0;
  return (
    <g stroke={LINE} strokeWidth={W} transform={`rotate(${shake} 240 1640)`}>
      <path d="M -60 1920 L -60 1560 Q -40 1440 120 1430 L 460 1440 Q 560 1460 560 1600 L 560 1920 Z" fill={CHAIR} />
      {/* the chair's arm, his back and his arm resting on it, his hand on the armrest */}
      <path d="M 560 1860 Q 560 1800 640 1800 L 1100 1800 L 1100 1920 L 560 1920 Z" fill={CHAIR_S} />
      <path d="M -60 1920 L -60 1700 Q 120 1600 320 1610 Q 520 1624 600 1780 L 620 1920 Z" fill={SKIN} />
      <path d="M 500 1700 Q 620 1720 760 1790" fill="none" stroke={LINE} strokeWidth={96} />
      <path d="M 500 1700 Q 620 1720 760 1790" fill="none" stroke={SKIN} strokeWidth={84} />
      <path d="M 740 1760 Q 800 1740 850 1770 Q 880 1790 860 1812 Q 830 1830 760 1826 Z" fill={SKIN} />
      <path d="M 800 1772 q 22 4 30 18 M 790 1790 q 24 4 34 16" fill="none" strokeWidth={3} />
      <g transform={`translate(300 1440) rotate(${turn * 12})`}>
        <path d="M 0 -250 Q 170 -250 186 -60 Q 196 90 120 160 Q 60 210 -20 200 Q -150 180 -170 30 Q -180 -150 0 -250 Z" fill={SKIN} />
        <path d="M 174 -30 Q 210 -40 214 0 Q 216 40 180 36" fill={SKIN} />
        {face === "grin" || face === "laugh" || face === "shock" ? (
          // three-quarter profile from behind: the cheek, an eye corner and the open mouth
          <g>
            <ellipse cx={150} cy={-40} rx={22} ry={face === "shock" ? 26 : 20} fill="#FFFFFF" />
            <circle cx={160} cy={-36} r={6} fill={LINE} stroke="none" />
            {face !== "shock" ? <path d={`M 120 60 Q 170 ${110 + (face === "laugh" ? Math.abs(Math.sin(twos(f) / 3)) * 18 : 0)} 196 50`} fill="#7E2B3B" /> : null}
          </g>
        ) : null}
        {mark > 0 ? <path d="M 60 -230 q -16 -10 -6 -24 q 12 6 16 -6 q 12 12 2 24 q 12 8 0 16 Z" fill={RED} stroke="none" opacity={mark} /> : null}
      </g>
    </g>
  );
};

// ---------- the field, the patient, the arm ----------

const Clouds: React.FC<{ f: number; y?: number }> = ({ f, y = 0 }) => (
  <g fill="#FFFFFF" stroke={LINE} strokeWidth={3}>
    {[[160, 120], [620, 80], [900, 230], [380, 260]].map(([cx, cy], i) => (
      <path key={i} transform={`translate(${cx + Math.sin(twos(f) / 220 + i) * 16} ${cy + y})`}
        d="M -110 20 Q -120 -10 -84 -14 Q -80 -46 -40 -40 Q -20 -70 20 -50 Q 50 -66 70 -36 Q 112 -36 104 0 Q 120 24 90 28 L -100 28 Q -124 26 -110 20 Z" />
    ))}
  </g>
);

const Grass: React.FC<{ y: number; h: number }> = ({ y, h }) => (
  <g>
    <rect x={-20} y={y} width={1120} height={h} fill={GRASS} stroke={LINE} strokeWidth={W} />
    {Array.from({ length: 26 }).map((_, i) => {
      const gx = (i * 211) % 1060 + 10, gy = y + 30 + ((i * 97) % Math.max(40, h - 60));
      return <path key={i} d={`M ${gx} ${gy} q 6 -18 10 0 q 6 -22 12 0 q 6 -16 10 0`} fill="none" stroke={GRASS_D} strokeWidth={3} />;
    })}
  </g>
);

/** The patient on the table, barely moving, head drooping like a wilting plant. */
const Patient: React.FC<{ f: number; x: number; y: number; s?: number; tube?: boolean }> = ({ f, x, y, s = 1, tube = true }) => {
  const k = twos(f);
  const breathe = Math.sin(k / 30) * 4;
  const droop = 8 + Math.sin(k / 50) * 5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={LINE} strokeWidth={W}>
      <path d="M -200 70 L -190 190 M 200 70 L 190 190 M -150 70 L -140 190 M 150 70 L 140 190" strokeWidth={10} />
      <rect x={-230} y={40} width={460} height={36} rx={8} fill="#D3D8DF" />
      <path d={`M -150 40 Q -150 ${-30 - breathe} 0 ${-34 - breathe} Q 150 ${-30 - breathe} 180 40 Z`} fill="#DADFE9" />
      <path d={`M -40 ${-20 - breathe} Q 0 ${-6 - breathe} 40 ${-20 - breathe}`} fill="none" strokeWidth={3} opacity={0.6} />
      <path d="M 170 30 Q 220 30 230 0 Q 236 -12 220 -12 Q 206 -10 200 10" fill="#E9D5CD" />
      <g transform={`rotate(${droop} -170 10)`}>
        <path d="M -170 -60 Q -110 -60 -104 0 Q -100 50 -170 52 Q -236 50 -234 -4 Q -232 -60 -170 -60 Z" fill="#EAD7D0" />
        <path d="M -200 -8 q 12 6 22 0 M -152 -10 q 12 6 22 0" fill="none" strokeWidth={4} />
        <path d="M -180 24 Q -168 18 -156 24" fill="none" strokeWidth={4} />
      </g>
      {tube ? <path d="M -168 28 Q -100 -120 -640 -160" fill="none" stroke={CABLE} strokeWidth={22} /> : null}
    </g>
  );
};

const Sign: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(-2)`} stroke={LINE} strokeWidth={W}>
    <rect x={-14} y={140} width={28} height={200} fill="#8D6A47" />
    <path d="M -270 0 L 270 -10 L 276 160 L -264 166 Z" fill="#F7F1E4" />
    <text x={0} y={112} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={118} fill={PINK} stroke={PINK} strokeWidth={4} transform="rotate(-4)">LOOK UP!</text>
    <path d="M -170 150 q 2 20 -2 34 M 40 140 q 2 26 0 40 M 190 150 q -2 18 0 30" stroke={PINK} strokeWidth={8} />
  </g>
);

const Bucket: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={LINE} strokeWidth={W}>
    <path d="M -70 -80 L 70 -80 L 56 50 L -56 50 Z" fill="#B9C0CA" />
    <ellipse cx={0} cy={-80} rx={70} ry={16} fill={PINK} />
    <path d="M -62 -76 Q -66 -40 -56 -20 M -10 -70 Q -8 -46 -14 -34" stroke={PINK} strokeWidth={10} fill="none" />
    <path d="M -70 -80 Q 0 -150 70 -80" fill="none" />
    <text x={0} y={16} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} fill={LINE} stroke="none">by DocX</text>
  </g>
);

const Arm: React.FC<{ tip: [number, number]; grip: number }> = ({ tip, grip }) => (
  <g stroke={LINE} strokeWidth={W}>
    <path d={`M -80 -60 Q ${tip[0] * 0.4} ${tip[1] * 0.2} ${tip[0]} ${tip[1] - 80}`} fill="none" stroke={LINE} strokeWidth={44} />
    <path d={`M -80 -60 Q ${tip[0] * 0.4} ${tip[1] * 0.2} ${tip[0]} ${tip[1] - 80}`} fill="none" stroke={PIPE} strokeWidth={34} />
    <rect x={tip[0] - 34} y={tip[1] - 110} width={68} height={50} rx={10} fill={PIPE_S} />
    <path d={`M ${tip[0] - 20} ${tip[1] - 62} Q ${tip[0] - 70 + grip * 30} ${tip[1] - 20} ${tip[0] - 30 + grip * 16} ${tip[1] + 20}`} fill="none" strokeWidth={14} stroke="#B65A78" />
    <path d={`M ${tip[0] + 20} ${tip[1] - 62} Q ${tip[0] + 70 - grip * 30} ${tip[1] - 20} ${tip[0] + 30 - grip * 16} ${tip[1] + 20}`} fill="none" strokeWidth={14} stroke="#B65A78" />
  </g>
);

/** The monitor seen from behind the doctor: a pharma ad, or the news. */
const Screen: React.FC<{ f: number; mode: "ad" | "news"; click?: number }> = ({ f, mode, click = -1 }) => (
  <g stroke={LINE} strokeWidth={W}>
    <path d="M 760 1430 L 760 1520 M 680 1530 L 840 1530" strokeWidth={14} />
    <rect x={440} y={1060} width={620} height={380} rx={10} fill="#3B414D" />
    <rect x={462} y={1082} width={576} height={336} fill={mode === "ad" ? "#FFF1DE" : "#3E74D6"} />
    {mode === "ad" ? (
      <g stroke="none">
        <text x={490} y={1160} fontFamily={SANS} fontWeight={800} fontSize={54} fill="#E2382F">NEW! Maxicor®</text>
        <text x={490} y={1210} fontFamily={SANS} fontSize={30} fill={LINE}>“Patients love it.”</text>
        <rect x={490} y={1250} width={290} height={84} rx={14} fill={click >= 0 && f - click < 12 ? "#167A39" : "#2BB05A"} stroke={LINE} strokeWidth={4} />
        <text x={635} y={1306} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36} fill="#FFFFFF">PRESCRIBE</text>
        <g transform="translate(920 1260) rotate(-24) scale(2.2)"><Pill x={0} y={0} c="#5BA8E0" /></g>
      </g>
    ) : (
      <g>
        <rect x={462} y={1082} width={150} height={46} fill="#E2382F" stroke="none" />
        <text x={482} y={1118} fontFamily={SANS} fontWeight={800} fontSize={32} fill="#FFFFFF" stroke="none">NEWS</text>
        <circle cx={580} cy={1290} r={56} fill={SKIN} />
        <path d="M 510 1418 Q 520 1340 580 1340 Q 640 1340 650 1418 Z" fill="#2B2F3A" />
        <g opacity={interpolate(f, [T.news + 20, T.news + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          <rect x={700} y={1150} width={310} height={210} rx={12} fill="#FFFFFF" />
          <text x={855} y={1230} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36} fill={LINE} stroke="none">DON'T TRUST</text>
          <text x={855} y={1280} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36} fill={LINE} stroke="none">PATIENTS</text>
          <g opacity={interpolate(f, [T.news + 70, T.news + 76], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
            <path d="M 730 1170 L 980 1340 M 980 1170 L 730 1340" stroke={RED} strokeWidth={16} />
          </g>
        </g>
      </g>
    )}
  </g>
);

// ---------- the timeline ----------

const T = {
  wide: 0, cheer: 70, ad: 150, click1: 190, piggy: 230, click2: 290, wall: 330, crack: 350, open: 420,
  field: 520, face: 640, drop: 660, distract: 760, coin: 780, arm: 880, lift: 960, news: 1110, calm: 1230, out: 1350, end: 1530,
};

const Room: React.FC<{ f: number }> = ({ f }) => {
  const cheer = f >= T.cheer && f < T.cheer + 60;
  const arm = cheer ? Math.min(1, (f - T.cheer) / 6) : 0;
  return (
    <Boil f={f}>
      <rect width={1080} height={1920} fill="#FFFFFF" />
      <Ceiling f={f} nozzle={[506, 1060]} flowing={!cheer} />
      <g transform="translate(470 1330)"><SeatedDoctor f={f} face={cheer ? "cheer" : "chew"} arm={arm} /></g>
      <g transform="translate(190 1560)"><Piggy x={0} y={0} s={1.15} /></g>
      {/* the monitor from the back, at the right edge */}
      <g stroke={LINE} strokeWidth={W}>
        <path d="M 760 1180 L 1100 1120 L 1100 1520 L 760 1470 Z" fill="#3B414D" />
        <path d="M 900 1490 L 900 1620 M 820 1630 L 1000 1640" strokeWidth={16} />
        <path d="M 900 1620 Q 960 1700 1100 1690" fill="none" stroke="#3E5E90" strokeWidth={10} />
      </g>
    </Boil>
  );
};

const PiggyClose: React.FC<{ f: number }> = ({ f }) => {
  const fall = interpolate(f, [T.piggy, T.piggy + 18], [200, 760], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hop = f >= T.piggy + 18 && f < T.piggy + 30 ? 1 : 0;
  return (
    <Boil f={f}>
      <rect width={1080} height={1920} fill="#FFFFFF" />
      <rect x={-20} y={1300} width={1120} height={640} fill="#F1F0F2" stroke={LINE} strokeWidth={W} />
      <g transform="translate(540 1130)"><Piggy x={0} y={0} s={3.4} hop={hop} /></g>
      {f < T.piggy + 18 ? <Coin x={556} y={fall} s={1.8} spin={twos(f) / 3} /> : null}
      <path d="M 120 -20 L 120 600" stroke={CABLE} strokeWidth={46} />
    </Boil>
  );
};

/** Over the shoulder: the wall above the screen breaks open like a window onto the field. */
const Shoulder: React.FC<{ f: number }> = ({ f }) => {
  const crack = interpolate(f, [T.crack, T.crack + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const open = f >= T.open ? 1 : 0;
  const fallK = interpolate(f, [T.open, T.open + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const armDown = interpolate(f, [T.arm, T.lift], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lift = interpolate(f, [T.lift, T.news - 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const face: Face = f >= T.arm ? "laugh" : f >= T.distract ? "grin" : f >= T.open + 40 ? "shock" : "lazy";
  const mark = f >= T.drop + 20 ? 1 : 0;
  const mode = f >= T.news ? "news" : "ad";
  const clickAt = f >= T.click2 ? T.click2 : f >= T.click1 ? T.click1 : -1;
  // the window in the wall
  const win = { x: 60, y: 300, w: 960, h: 700 };
  const tip: [number, number] = [470 + 40, win.y + 380 - lift * 700 + (1 - armDown) * -420];
  return (
    <Boil f={f}>
      <rect width={1080} height={1920} fill="#FFFFFF" />
      {/* ceiling pipes cut off at the top, like the original's framing */}
      <g stroke={LINE} strokeWidth={W}><path d="M 380 -20 L 380 160 Q 380 210 430 210 L 1100 210" fill="none" stroke={CABLE} strokeWidth={60} /><rect x={760} y={-20} width={70} height={200} fill={PIPE} /></g>
      {open ? (
        <svg x={win.x} y={win.y} width={win.w} height={win.h} overflow="hidden">
          <rect width={win.w} height={win.h} fill={SKY} />
          <Clouds f={f} y={-20} />
          <Grass y={440} h={300} />
          <Sign x={500} y={150} s={0.7} />
          <Bucket x={820} y={520} s={0.9} />
          {lift < 1 ? <g transform={`translate(0 ${-lift * 700})`}><Patient f={f} x={480} y={460} s={0.85} tube={lift === 0} /></g> : null}
          {f >= T.arm && f < T.news ? <Arm tip={[tip[0] - win.x, tip[1] - win.y]} grip={armDown >= 1 ? 1 : 0} /> : null}
        </svg>
      ) : null}
      {/* the wall: plaster pieces falling out of the window, and the crack before it */}
      <g stroke={LINE} strokeWidth={W}>
        <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="none" strokeWidth={open ? W : 0} />
        {!open && crack > 0 ? <path d="M 540 300 L 500 430 L 600 540 L 520 700 L 610 860 L 560 1000" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crack} /> : null}
        {!open && crack > 0.5 ? <path d="M 500 430 L 360 470 M 600 540 L 770 580 M 610 860 L 800 900" fill="none" strokeWidth={4} /> : null}
        {open && fallK < 1 ? Array.from({ length: 9 }).map((_, i) => {
          const px = win.x + (i % 3) * 320 + 40, py = win.y + Math.floor(i / 3) * 230 + 40;
          return <path key={i} d="M 0 0 L 220 20 L 200 180 L -10 160 Z" fill="#F2F2F4" transform={`translate(${px} ${py + fallK * fallK * 1500}) rotate(${fallK * (i % 2 ? 30 : -24)})`} />;
        }) : null}
      </g>
      {/* the pill tube from the desk up through the wall to the patient */}
      {open && lift === 0 ? <path d="M 1100 1240 Q 1000 1100 1000 1000" fill="none" stroke={CABLE} strokeWidth={22} /> : null}
      <Screen f={f} mode={mode} click={clickAt} />
      <BackOfHead f={f} face={face} mark={mark} turn={f >= T.distract && f < T.arm ? -1 : 0} />
      {/* the coin dropping into frame to distract him */}
      {f >= T.coin && f < T.arm ? <Coin x={300} y={interpolate(f, [T.coin, T.coin + 26], [-60, 1180], { extrapolateRight: "clamp" })} s={1.4} spin={twos(f) / 3} /> : null}
    </Boil>
  );
};

const FieldClose: React.FC<{ f: number }> = ({ f }) => (
  <Boil f={f}>
    <rect width={1080} height={1920} fill={SKY} />
    <Clouds f={f} y={80} />
    <Clouds f={f + 400} y={420} />
    <Grass y={1180} h={760} />
    <Sign x={540} y={600} s={1.1} />
    <Patient f={f} x={560} y={1220} s={1.5} />
    <Bucket x={890} y={1520} s={1.2} />
  </Boil>
);

const FaceClose: React.FC<{ f: number }> = ({ f }) => {
  const dropY = interpolate(f, [T.drop, T.drop + 18], [-120, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hit = f >= T.drop + 18;
  return (
    <Boil f={f}>
      <rect width={1080} height={1920} fill="#FFFFFF" />
      <g stroke={LINE} strokeWidth={W}>
        <path d="M 160 1920 L 160 860 Q 160 700 330 690 L 750 690 Q 920 700 920 860 L 920 1920 Z" fill={CHAIR} />
        <path d="M 230 1920 Q 200 1320 380 1200 L 700 1200 Q 880 1320 850 1920 Z" fill={SKIN} />
        <path d="M 230 1920 Q 200 1320 380 1200 L 460 1200 Q 400 1500 420 1920 Z" fill={COAT} />
        <path d="M 850 1920 Q 880 1320 700 1200 L 620 1200 Q 680 1500 660 1920 Z" fill={COAT} />
        <path d="M 330 1560 Q 380 1500 450 1540 M 630 1540 Q 700 1500 750 1560" fill="none" strokeWidth={4} />
      </g>
      <g transform="translate(540 940) scale(2.3)"><Head face={hit ? "shock" : "lazy"} f={f} look={hit ? [0, -12] : [0, 0]} mark={hit ? 1 : 0} big={hit} /></g>
      {!hit ? <path d={`M 540 ${dropY} q 22 34 0 50 q -22 -16 0 -50 Z`} fill={RED} stroke={LINE} strokeWidth={4} /> : null}
      <rect x={490} y={-20} width={100} height={140} fill={PIPE} stroke={LINE} strokeWidth={W} />
    </Boil>
  );
};

const Wide: React.FC<{ f: number }> = ({ f }) => {
  const pull = interpolate(f, [T.out, T.out + 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s = 2.6 - pull * 1.7;
  const card = interpolate(f, [T.end - 60, T.end - 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Boil f={f}>
      <rect width={1080} height={1920} fill={SKY} />
      <g transform={`translate(540 1300) scale(${s}) translate(-540 -1300)`}>
        <Clouds f={f} y={200} />
        <Clouds f={f + 300} y={620} />
        <Grass y={1360} h={700} />
        {[-36, -12, 12, 36].map((dx, i) => (
          <path key={i} d={`M ${540 + dx} -400 Q ${540 + dx + Math.sin(twos(f) / 30 + i) * 14} 600 ${540 + dx / 2} 1210`} fill="none" stroke={i % 2 ? CABLE : PIPE} strokeWidth={10} />
        ))}
        <path d="M 420 1210 L 660 1210 L 660 1380 L 420 1380 Z" fill="#FFFFFF" stroke={LINE} strokeWidth={W} />
        <text x={644} y={1370} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={18} fill={PINK}>clinic</text>
      </g>
      <g opacity={card}>
        <text x={540} y={560} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={170} fill={PINK} stroke={LINE} strokeWidth={5} transform="rotate(-4 540 560)">LOOK UP!</text>
        <text x={540} y={680} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={54} fill={LINE}>by DocX</text>
      </g>
    </Boil>
  );
};

const SFX: SfxCue[] = [
  { at: T.cheer, sound: "pop", volume: 0.5 },
  { at: T.click1, sound: "click", volume: 0.7 }, { at: T.piggy + 18, sound: "ding", volume: 0.8 }, { at: T.click2, sound: "click", volume: 0.7 },
  { at: T.crack, sound: "tick", volume: 0.8 }, { at: T.crack + 24, sound: "tick", volume: 0.8 }, { at: T.open, sound: "impact", volume: 0.9 }, { at: T.open + 8, sound: "thud", volume: 0.7 },
  { at: T.drop + 18, sound: "blip", volume: 0.8 }, { at: T.coin + 26, sound: "ding", volume: 0.8 },
  { at: T.arm, sound: "rise", volume: 0.5 }, { at: T.lift, sound: "riser", volume: 0.5 },
  { at: T.news, sound: "pop", volume: 0.5 }, { at: T.news + 70, sound: "impact", volume: 0.4 }, { at: T.end - 60, sound: "impact", volume: 0.7 },
];

export const LookUp: React.FC = () => {
  const f = useCurrentFrame();
  let shot: React.ReactNode;
  if (f < T.ad) shot = <Room f={f} />;
  else if (f < T.piggy) shot = <Shoulder f={f} />;
  else if (f < T.click2 - 10) shot = <PiggyClose f={f} />;
  else if (f < T.field) shot = <Shoulder f={f} />;
  else if (f < T.face) shot = <FieldClose f={f} />;
  else if (f < T.distract) shot = <FaceClose f={f} />;
  else if (f < T.calm) shot = <Shoulder f={f} />;
  else if (f < T.out) shot = <Room f={f} />;
  else shot = <Wide f={f} />;
  return (
    <AbsoluteFill style={{ background: "#FFFFFF" }}>
      {shot}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [LOOKUP_DURATION - 20, LOOKUP_DURATION], [0, 1], { extrapolateLeft: "clamp" }) }} />
      <SfxTrack cues={SFX} />
      <Audio src={staticFile("music/2026-11-19-look-up.mp3")} volume={(fr) => 0.35 * Math.min(1, fr / 20) * Math.min(1, (LOOKUP_DURATION - fr) / 30)} />
    </AbsoluteFill>
  );
};

export const LOOKUP_COVER = T.open + 80;
