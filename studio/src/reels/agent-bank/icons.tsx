import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./style";

type P = { size?: number; color?: string; style?: React.CSSProperties };

const glow = (color: string, px = 10): React.CSSProperties => ({ filter: `drop-shadow(0 0 ${px}px ${color}66)` });
const SW = 1.6; // house stroke width (in a 100-unit viewBox)

/**
 * The agent mark: a dark squircle app-icon with two capsule eyes that blink and glance around.
 * Original design in the current "AI assistant" visual language (monochrome, soft glow).
 */
export const Agent: React.FC<P & { blinkSeed?: number }> = ({ size = 160, color = C.cyan, style, blinkSeed = 0 }) => {
  const f = useCurrentFrame();
  const t = f + blinkSeed * 41;
  const cycle = t % 96;
  const blink = cycle < 3 ? 1 - cycle / 3 : cycle < 6 ? (cycle - 3) / 3 : 1;
  const look = Math.sin(t / 34) * 5 + (Math.floor(t / 70) % 3 === 1 ? 3 : 0);
  const lift = Math.sin(t / 47) * 1.5;
  const eyeH = 26 * Math.max(0.08, blink);
  const id = `agent-${blinkSeed}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 10px 24px rgba(0,0,0,0.55)) drop-shadow(0 0 18px ${color}33)`, ...style }}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3140" /><stop offset="0.55" stopColor="#11151d" /><stop offset="1" stopColor="#07090d" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" /><stop offset="0.5" stopColor={color} stopOpacity="0.25" /><stop offset="1" stopColor="#ffffff" stopOpacity="0.08" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor={color} stopOpacity="0.35" /><stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="6" y="6" width="88" height="88" rx="27" fill={`url(#${id}-bg)`} />
      <rect x="6" y="6" width="88" height="88" rx="27" fill={`url(#${id}-glow)`} />
      <rect x="6.5" y="6.5" width="87" height="87" rx="26.5" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.2" />
      <path d="M20 14 H80" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" strokeLinecap="round" />
      {[38, 62].map((cx) => (
        <rect key={cx} x={cx - 5.5 + look} y={50 - eyeH / 2 + lift} width="11" height={eyeH} rx="5.5" fill="#ffffff"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      ))}
    </svg>
  );
};

export const Person: React.FC<P> = ({ size = 140, color = C.fg, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <circle cx="50" cy="33" r="15" fill="none" stroke={color} strokeWidth={SW} />
    <path d="M20 90 C20 66 34 57 50 57 C66 57 80 66 80 90" fill="none" stroke={color} strokeWidth={SW} strokeLinecap="round" />
  </svg>
);

/** A payment card: graphite glass with a soft holographic sheen. */
export const Card: React.FC<{ w?: number; label?: string; sub?: string; tone?: "agent" | "personal"; style?: React.CSSProperties }> = ({
  w = 520, label = "AGENT · 01", sub = "•••• 4021", tone = "agent", style,
}) => {
  const f = useCurrentFrame();
  const h = w * 0.63;
  const a = tone === "agent" ? C.cyan : C.gold;
  const sheen = ((f * 5) % (w * 3.2)) - w;
  return (
    <div style={{
      width: w, height: h, borderRadius: w * 0.055, position: "relative", overflow: "hidden",
      background: tone === "agent"
        ? `linear-gradient(135deg, #16202e 0%, #0b111b 55%, #142233 100%)`
        : `linear-gradient(135deg, #2b2416 0%, #17130c 55%, #2e2716 100%)`,
      border: `1px solid ${a}44`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 40px 90px rgba(0,0,0,0.6), 0 0 70px ${a}14`, ...style,
    }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 80% at 100% 0%, ${a}22, transparent 60%)` }} />
      <div style={{ position: "absolute", top: 0, left: sheen, width: w * 0.3, height: h, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)", transform: "skewX(-20deg)" }} />
      <div style={{
        position: "absolute", left: w * 0.08, top: h * 0.34, width: w * 0.12, height: h * 0.17, borderRadius: w * 0.015,
        background: `linear-gradient(135deg, ${C.gold}cc, #8a6a2c)`, opacity: 0.85,
      }} />
      <div style={{ position: "absolute", left: w * 0.08, top: h * 0.12, fontFamily: F.mono, fontSize: w * 0.036, color: a, letterSpacing: "0.2em" }}>{label}</div>
      <div style={{ position: "absolute", left: w * 0.08, bottom: h * 0.12, fontFamily: F.mono, fontSize: w * 0.05, color: C.fg, letterSpacing: "0.14em", opacity: 0.9 }}>{sub}</div>
      {tone === "agent" ? <div style={{ position: "absolute", right: w * 0.05, top: h * 0.06 }}><Agent size={w * 0.2} /></div> : null}
    </div>
  );
};

export const Wallet: React.FC<P> = ({ size = 160, color = C.gold, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ ...glow(color), ...style }}>
    <rect x="12" y="30" width="76" height="52" rx="9" fill={`${color}0c`} stroke={color} strokeWidth={SW} />
    <path d="M20 30 L64 15 L69 30" fill="none" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    <rect x="62" y="47" width="26" height="18" rx="5" fill="none" stroke={color} strokeWidth={SW} />
    <circle cx="71" cy="56" r="2.5" fill={color} />
  </svg>
);

/** Shield whose outline draws itself (t: 0..1). */
export const Shield: React.FC<P & { t?: number }> = ({ size = 300, color = C.green, style, t = 1 }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 100 115" style={{ ...glow(color, 18), ...style }}>
    <path d="M50 4 L92 20 L92 52 C92 82 72 102 50 111 C28 102 8 82 8 52 L8 20 Z" fill={`${color}${t > 0.95 ? "0a" : "00"}`}
      stroke={color} strokeWidth={SW} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
    <path d="M50 12 L84 25 L84 52 C84 77 68 94 50 102 C32 94 16 77 16 52 L16 25 Z" fill="none"
      stroke={color} strokeWidth={SW * 0.5} opacity="0.4" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
    <path d="M34 56 L46 68 L68 44" fill="none" stroke={color} strokeWidth={SW * 1.8} strokeLinecap="round" strokeLinejoin="round"
      pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, (t - 0.6) / 0.4)} />
  </svg>
);

export const Ticket: React.FC<P> = ({ size = 120, color = C.gold, style }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 100 60" style={style}>
    <path d="M6 6 H94 V22 A8 8 0 0 0 94 38 V54 H6 V38 A8 8 0 0 0 6 22 Z" fill={`${color}10`} stroke={color} strokeWidth={SW} />
    <line x1="68" y1="8" x2="68" y2="52" stroke={color} strokeWidth={SW * 0.8} strokeDasharray="3 3" />
    <line x1="16" y1="23" x2="54" y2="23" stroke={color} strokeWidth={SW * 1.4} strokeLinecap="round" opacity="0.8" />
    <line x1="16" y1="35" x2="42" y2="35" stroke={color} strokeWidth={SW * 1.4} strokeLinecap="round" opacity="0.45" />
  </svg>
);

export const Phone: React.FC<P> = ({ size = 140, color = C.fg, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <rect x="30" y="10" width="40" height="80" rx="9" fill="none" stroke={color} strokeWidth={SW} />
    <line x1="44" y1="18" x2="56" y2="18" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    <circle cx="50" cy="80" r="3" fill="none" stroke={color} strokeWidth={SW} />
  </svg>
);

export const Paper: React.FC<P> = ({ size = 140, color = C.fg, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <path d="M24 10 H62 L78 26 V90 H24 Z" fill="none" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    <path d="M62 10 V26 H78" fill="none" stroke={color} strokeWidth={SW} />
    {[42, 54, 66, 78].map((y) => <line key={y} x1="34" y1={y} x2="68" y2={y} stroke={color} strokeWidth={SW} opacity="0.5" />)}
  </svg>
);

export const Strike: React.FC<{ t: number; size?: number; color?: string }> = ({ t, size = 180, color = C.red }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, ...glow(color) }}>
    <line x1="12" y1="88" x2={12 + 76 * t} y2={88 - 76 * t} stroke={color} strokeWidth={SW * 1.6} strokeLinecap="round" />
  </svg>
);

/** One rack unit in a data hall: thin frame, blinking status LEDs. */
export const Server: React.FC<{ w?: number; on?: number; color?: string; seed?: number }> = ({ w = 90, on = 1, color = C.red, seed = 0 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ width: w, height: w * 1.9, borderRadius: 6, border: `1px solid ${color}44`, background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))", padding: 6, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 5 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 2, borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 4, paddingLeft: 5 }}>
          {[0, 1].map((k) => (
            <div key={k} style={{ width: 4, height: 4, borderRadius: 2, background: color, opacity: on * (((f + i * 7 + k * 13 + seed * 5) % 23) < 12 ? 0.9 : 0.15) }} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const Folder: React.FC<P> = ({ size = 260, color = C.cyan, style }) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 100 80" style={{ ...glow(color, 14), ...style }}>
    <path d="M6 14 H38 L46 22 H94 V74 H6 Z" fill={`${color}0a`} stroke={color} strokeWidth={SW * 0.8} strokeLinejoin="round" />
    <path d="M50 37 V51 M43 44 H57" stroke={color} strokeWidth={SW * 1.2} strokeLinecap="round" />
    <circle cx="50" cy="44" r="12" fill="none" stroke={color} strokeWidth={SW * 0.6} opacity="0.6" />
  </svg>
);

/** Heart-monitor trace that draws across `w` px. */
export const Ecg: React.FC<{ w?: number; color?: string; t?: number }> = ({ w = 700, color = C.green, t = 1 }) => {
  const f = useCurrentFrame();
  const seg = "h40 l10 -6 l8 6 h16 l6 10 l10 -54 l10 64 l8 -20 h28";
  const pts = `M0 50 ${seg} ${seg} ${seg} ${seg} ${seg} ${seg} ${seg}`;
  return (
    <svg width={w} height={110} viewBox={`0 0 ${w} 110`} style={glow(color, 10)}>
      <defs>
        <linearGradient id="ecgfade" x1="0" x2="1"><stop offset="0" stopColor={color} stopOpacity="0" /><stop offset="0.2" stopColor={color} /><stop offset="0.8" stopColor={color} /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient>
      </defs>
      <path d={pts} transform={`translate(${-((f * 4) % 136)} 0)`} fill="none" stroke="url(#ecgfade)" strokeWidth="2" strokeLinejoin="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
    </svg>
  );
};

export const Bank: React.FC<P> = ({ size = 260, color = C.fg, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <path d="M10 34 L50 12 L90 34 Z" fill="none" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    {[22, 39, 56, 73].map((x) => <line key={x} x1={x + 3} y1="42" x2={x + 3} y2="76" stroke={color} strokeWidth={SW} />)}
    <line x1="10" y1="84" x2="90" y2="84" stroke={color} strokeWidth={SW} />
    <line x1="16" y1="40" x2="84" y2="40" stroke={color} strokeWidth={SW} opacity="0.6" />
  </svg>
);

export const Chip: React.FC<P> = ({ size = 200, color = C.violet, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ ...glow(color, 12), ...style }}>
    <rect x="25" y="25" width="50" height="50" rx="6" fill={`${color}0a`} stroke={color} strokeWidth={SW} />
    <rect x="38" y="38" width="24" height="24" rx="3" fill="none" stroke={color} strokeWidth={SW} opacity="0.7" />
    {[33, 44, 56, 67].map((p) => (
      <g key={p} stroke={color} strokeWidth={SW} strokeLinecap="round" opacity="0.8">
        <line x1={p} y1="12" x2={p} y2="25" /><line x1={p} y1="75" x2={p} y2="88" />
        <line x1="12" y1={p} x2="25" y2={p} /><line x1="75" y1={p} x2="88" y2={p} />
      </g>
    ))}
  </svg>
);

export const Neural: React.FC<P> = ({ size = 200, color = C.cyan, style }) => {
  const f = useCurrentFrame();
  const L = [[20, [25, 50, 75]], [50, [15, 38, 62, 85]], [80, [30, 70]]] as const;
  const nodes = L.flatMap(([x, ys]) => ys.map((y) => [x, y] as const));
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ ...glow(color, 10), ...style }}>
      {L.slice(0, -1).flatMap(([x, ys], li) => ys.flatMap((y) => L[li + 1][1].map((y2) => (
        <line key={`${x}-${y}-${y2}`} x1={x} y1={y} x2={L[li + 1][0]} y2={y2} stroke={color} strokeWidth="0.6" opacity={0.2 + 0.3 * Math.sin(f / 10 + y + y2)} />
      ))))}
      {nodes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.6" fill={C.bg} stroke={color} strokeWidth={SW * 0.8} />)}
    </svg>
  );
};

export const Notebook: React.FC<P> = ({ size = 200, color = C.muted, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <rect x="22" y="10" width="60" height="80" rx="5" fill="none" stroke={color} strokeWidth={SW} />
    {[24, 40, 56, 72].map((y) => <circle key={y} cx="22" cy={y} r="3" fill={C.bg} stroke={color} strokeWidth={SW} />)}
    {[32, 46, 60].map((y) => <line key={y} x1="34" y1={y} x2="70" y2={y} stroke={color} strokeWidth={SW} opacity="0.5" />)}
  </svg>
);

export const Stethoscope: React.FC<P> = ({ size = 70, color = C.fg, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <path d="M28 12 V40 C28 56 52 56 52 40 V12" fill="none" stroke={color} strokeWidth={SW * 2} strokeLinecap="round" />
    <path d="M40 54 V66 C40 82 72 82 72 66 V58" fill="none" stroke={color} strokeWidth={SW * 2} strokeLinecap="round" />
    <circle cx="72" cy="50" r="8" fill="none" stroke={color} strokeWidth={SW * 2} />
  </svg>
);

export const Plane: React.FC<P> = ({ size = 70, color = C.fg, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <path d="M50 10 C55 10 56 16 56 22 V40 L88 58 V66 L56 56 V76 L66 84 V90 L50 86 L34 90 V84 L44 76 V56 L12 66 V58 L44 40 V22 C44 16 45 10 50 10 Z"
      fill="none" stroke={color} strokeWidth={SW * 1.6} strokeLinejoin="round" />
  </svg>
);
