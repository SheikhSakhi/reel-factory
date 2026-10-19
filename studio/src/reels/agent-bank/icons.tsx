import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./style";

type P = { size?: number; color?: string; style?: React.CSSProperties };

const glow = (color: string, px = 18): React.CSSProperties => ({ filter: `drop-shadow(0 0 ${px}px ${color}aa)` });

/** The agent: a rounded robot head with blinking eyes and a pulsing antenna. */
export const Agent: React.FC<P & { blinkSeed?: number }> = ({ size = 160, color = C.cyan, style, blinkSeed = 0 }) => {
  const f = useCurrentFrame();
  const blink = (f + blinkSeed * 37) % 110 < 4 ? 0.15 : 1;
  const pulse = 0.6 + 0.4 * Math.sin(f / 6 + blinkSeed);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ ...glow(color), ...style }}>
      <line x1="50" y1="8" x2="50" y2="22" stroke={color} strokeWidth="3" />
      <circle cx="50" cy="7" r="5" fill={color} opacity={pulse} />
      <rect x="14" y="22" width="72" height="60" rx="20" fill={`${color}18`} stroke={color} strokeWidth="3.5" />
      <rect x="24" y="36" width="52" height="28" rx="12" fill="#04101f" stroke={`${color}66`} strokeWidth="1.5" />
      <ellipse cx="39" cy="50" rx="6" ry={6 * blink} fill={color} />
      <ellipse cx="61" cy="50" rx="6" ry={6 * blink} fill={color} />
      <rect x="6" y="44" width="8" height="18" rx="4" fill={color} opacity="0.7" />
      <rect x="86" y="44" width="8" height="18" rx="4" fill={color} opacity="0.7" />
      <rect x="36" y="86" width="28" height="6" rx="3" fill={color} opacity="0.5" />
    </svg>
  );
};

export const Person: React.FC<P> = ({ size = 140, color = C.fg, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <circle cx="50" cy="32" r="17" fill="none" stroke={color} strokeWidth="4" />
    <path d="M18 92 C18 66 34 56 50 56 C66 56 82 66 82 92" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
  </svg>
);

/** A payment card. */
export const Card: React.FC<{ w?: number; label?: string; sub?: string; tone?: "agent" | "personal"; style?: React.CSSProperties }> = ({
  w = 520, label = "AGENT · 01", sub = "•••• 4021", tone = "agent", style,
}) => {
  const f = useCurrentFrame();
  const h = w * 0.63;
  const a = tone === "agent" ? C.cyan : C.gold;
  const sheen = ((f * 6) % (w * 3)) - w;
  return (
    <div style={{
      width: w, height: h, borderRadius: w * 0.06, position: "relative", overflow: "hidden",
      background: tone === "agent"
        ? `linear-gradient(135deg, #0b2a4a 0%, #071a33 45%, #0e3d5c 100%)`
        : `linear-gradient(135deg, #3b2a08 0%, #6b4c10 50%, #2a1d05 100%)`,
      border: `2px solid ${a}aa`, boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${a}33`, ...style,
    }}>
      <div style={{ position: "absolute", top: 0, left: sheen, width: w * 0.35, height: h, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)", transform: "skewX(-20deg)" }} />
      <div style={{ position: "absolute", left: w * 0.08, top: h * 0.3, width: w * 0.14, height: h * 0.2, borderRadius: 8, background: `linear-gradient(135deg, ${C.gold}, #a87b1e)` }} />
      <div style={{ position: "absolute", left: w * 0.08, top: h * 0.1, fontFamily: F.mono, fontSize: w * 0.045, color: a, letterSpacing: "0.12em" }}>{label}</div>
      <div style={{ position: "absolute", left: w * 0.08, bottom: h * 0.12, fontFamily: F.mono, fontSize: w * 0.06, color: C.fg, letterSpacing: "0.1em" }}>{sub}</div>
      {tone === "agent" ? (
        <div style={{ position: "absolute", right: w * 0.06, top: h * 0.08 }}><Agent size={w * 0.2} /></div>
      ) : null}
    </div>
  );
};

export const Wallet: React.FC<P> = ({ size = 160, color = C.gold, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ ...glow(color), ...style }}>
    <rect x="10" y="28" width="80" height="56" rx="10" fill={`${color}18`} stroke={color} strokeWidth="4" />
    <path d="M18 28 L66 12 L72 28" fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" />
    <rect x="62" y="46" width="28" height="20" rx="6" fill={`${color}30`} stroke={color} strokeWidth="3" />
    <circle cx="72" cy="56" r="3.5" fill={color} />
  </svg>
);

/** Shield whose outline draws itself (t: 0..1). */
export const Shield: React.FC<P & { t?: number }> = ({ size = 300, color = C.green, style, t = 1 }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 100 115" style={{ ...glow(color, 26), ...style }}>
    <path d="M50 4 L92 20 L92 52 C92 82 72 102 50 111 C28 102 8 82 8 52 L8 20 Z" fill={`${color}${t > 0.95 ? "16" : "00"}`}
      stroke={color} strokeWidth="3.5" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
    <path d="M32 56 L45 69 L70 42" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
      pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, (t - 0.6) / 0.4)} />
  </svg>
);

export const Ticket: React.FC<P> = ({ size = 120, color = C.gold, style }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 100 60" style={style}>
    <path d="M6 6 H94 V22 A8 8 0 0 0 94 38 V54 H6 V38 A8 8 0 0 0 6 22 Z" fill={`${color}22`} stroke={color} strokeWidth="3" />
    <line x1="68" y1="8" x2="68" y2="52" stroke={color} strokeWidth="2" strokeDasharray="4 4" />
    <rect x="16" y="20" width="40" height="6" rx="3" fill={color} opacity="0.8" />
    <rect x="16" y="32" width="28" height="6" rx="3" fill={color} opacity="0.5" />
  </svg>
);

export const Phone: React.FC<P> = ({ size = 140, color = C.fg, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <path d="M30 12 L42 12 L48 30 L40 38 C46 50 52 56 62 60 L70 52 L88 58 L88 70 C88 80 80 88 70 88 C40 86 14 60 12 30 C12 20 20 12 30 12 Z"
      fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" />
  </svg>
);

export const Paper: React.FC<P> = ({ size = 140, color = C.fg, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <path d="M22 8 H62 L80 26 V92 H22 Z" fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" />
    <path d="M62 8 V26 H80" fill="none" stroke={color} strokeWidth="4" />
    {[40, 52, 64, 76].map((y) => <line key={y} x1="32" y1={y} x2="70" y2={y} stroke={color} strokeWidth="3" opacity="0.6" />)}
  </svg>
);

export const Strike: React.FC<{ t: number; size?: number; color?: string }> = ({ t, size = 180, color = C.red }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, ...glow(color) }}>
    <line x1="10" y1="90" x2={10 + 80 * t} y2={90 - 80 * t} stroke={color} strokeWidth="8" strokeLinecap="round" />
  </svg>
);

export const Server: React.FC<{ w?: number; on?: number; color?: string; seed?: number }> = ({ w = 90, on = 1, color = C.red, seed = 0 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ width: w, height: w * 1.9, borderRadius: 8, border: `2px solid ${color}66`, background: "rgba(20,10,20,0.6)", padding: 6, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 5 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 3, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 4, paddingLeft: 5 }}>
          {[0, 1, 2].map((k) => (
            <div key={k} style={{ width: 5, height: 5, borderRadius: 3, background: color, opacity: on * (((f + i * 7 + k * 13 + seed * 5) % 23) < 12 ? 1 : 0.2) }} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const Folder: React.FC<P> = ({ size = 260, color = C.cyan, style }) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 100 80" style={{ ...glow(color, 22), ...style }}>
    <path d="M6 14 H38 L46 22 H94 V74 H6 Z" fill={`${color}14`} stroke={color} strokeWidth="2.6" strokeLinejoin="round" />
    <rect x="40" y="34" width="20" height="20" rx="3" fill="none" stroke={color} strokeWidth="2.4" />
    <path d="M50 38 V50 M44 44 H56" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/** Heart-monitor trace that draws across `w` px. */
export const Ecg: React.FC<{ w?: number; color?: string; t?: number }> = ({ w = 700, color = C.green, t = 1 }) => {
  const f = useCurrentFrame();
  const seg = "h40 l10 -6 l8 6 h16 l6 10 l10 -54 l10 64 l8 -20 h28";
  const pts = `M0 50 ${seg} ${seg} ${seg} ${seg} ${seg}`;
  return (
    <svg width={w} height={110} viewBox={`0 0 ${w} 110`} style={glow(color, 14)}>
      <path d={pts} transform={`translate(${-((f * 4) % 136)} 0)`} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
    </svg>
  );
};

export const Bank: React.FC<P> = ({ size = 260, color = C.fg, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <path d="M8 34 L50 10 L92 34 Z" fill={`${color}14`} stroke={color} strokeWidth="3.5" strokeLinejoin="round" />
    {[20, 38, 56, 74].map((x) => <rect key={x} x={x} y="40" width="8" height="38" rx="2" fill={`${color}30`} stroke={color} strokeWidth="2.5" />)}
    <rect x="8" y="80" width="84" height="10" rx="2" fill={`${color}22`} stroke={color} strokeWidth="3" />
  </svg>
);

export const Chip: React.FC<P> = ({ size = 200, color = C.violet, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ ...glow(color, 20), ...style }}>
    <rect x="24" y="24" width="52" height="52" rx="8" fill={`${color}18`} stroke={color} strokeWidth="3.5" />
    <rect x="36" y="36" width="28" height="28" rx="4" fill={`${color}40`} />
    {[32, 44, 56, 68].map((p) => (
      <g key={p} stroke={color} strokeWidth="3" strokeLinecap="round">
        <line x1={p} y1="10" x2={p} y2="22" /><line x1={p} y1="78" x2={p} y2="90" />
        <line x1="10" y1={p} x2="22" y2={p} /><line x1="78" y1={p} x2="90" y2={p} />
      </g>
    ))}
  </svg>
);

export const Neural: React.FC<P> = ({ size = 200, color = C.cyan, style }) => {
  const f = useCurrentFrame();
  const L = [[20, [25, 50, 75]], [50, [15, 38, 62, 85]], [80, [30, 70]]] as const;
  const nodes = L.flatMap(([x, ys]) => ys.map((y) => [x, y] as const));
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ ...glow(color, 16), ...style }}>
      {L.slice(0, -1).flatMap(([x, ys], li) => ys.flatMap((y) => L[li + 1][1].map((y2) => (
        <line key={`${x}-${y}-${y2}`} x1={x} y1={y} x2={L[li + 1][0]} y2={y2} stroke={color} strokeWidth="1" opacity={0.25 + 0.3 * Math.sin(f / 8 + y + y2)} />
      ))))}
      {nodes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill={C.bg} stroke={color} strokeWidth="2.5" />)}
    </svg>
  );
};

export const Notebook: React.FC<P> = ({ size = 200, color = C.muted, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <rect x="20" y="8" width="64" height="84" rx="6" fill={`${color}14`} stroke={color} strokeWidth="3" />
    {[22, 38, 54, 70].map((y) => <circle key={y} cx="20" cy={y} r="4" fill={C.bg} stroke={color} strokeWidth="2.5" />)}
    {[30, 44, 58].map((y) => <line key={y} x1="34" y1={y} x2="72" y2={y} stroke={color} strokeWidth="3" opacity="0.6" />)}
  </svg>
);
