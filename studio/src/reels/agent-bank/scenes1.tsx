import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { VoScene } from "../../kit";
import { Agent, Card, Chip, Neural, Person, Ticket, Wallet } from "./icons";
import { C, F, H, W } from "./style";
import { useAt, useT } from "./lang";
import { At, Center, Chapter, Flash, Glass, Mono, Pill, Pop, ramp, Ring, Roll, Shell, Source, springAt, window01, Words } from "./ui";

type SceneProps = { s: VoScene };
const dur = (s: VoScene): number => s.to - s.from;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ── S1 · hook: the market numbers ────────────────────────────────────
const Bar: React.FC<{ at: number; height: number; color: string; year: string; value: React.ReactNode; x: number }> = ({ at, height, color, year, value, x }) => {
  const f = useCurrentFrame();
  const t = springAt(f, at, 16, 90);
  const base = 860;
  return (
    <>
      <div style={{
        position: "absolute", left: x - 60, width: 120, top: base - height * t, height: height * t, borderRadius: "10px 10px 2px 2px",
        background: `linear-gradient(180deg, ${color}cc 0%, ${color}33 55%, ${color}05 100%)`, borderTop: `2px solid ${color}`, boxShadow: `0 -10px 50px ${color}33`,
      }} />
      <At x={x} y={base - height * t - 80}>
        <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 76, letterSpacing: "-0.04em", color: C.fg, opacity: Math.min(1, t * 2), whiteSpace: "nowrap", textShadow: `0 0 40px ${color}44` }}>{value}</div>
      </At>
      <At x={x} y={base + 50}><Mono size={34} color={C.fg} style={{ opacity: ramp(f, at - 8, 10) }}>{year}</Mono></At>
    </>
  );
};

export const S1: React.FC<SceneProps> = ({ s }) => {
  const at = useAt(s);
  const tr = useT();
  const f = useCurrentFrame();
  const growth = at("Рост");
  return (
    <Shell dur={dur(s)}>
      <Chapter n="01" label={tr("экономика ии-агентов")} />
      <At x={W / 2} y={150}><Words text={tr("Экономика *ИИ-агентов*")} at={at("экономика")} size={78} maxWidth={1700} /></At>
      <div style={{ position: "absolute", left: 420, right: 420, top: 860, height: 2, background: C.line }} />
      <Bar x={720} at={at("миллиардов") - 14} height={210} color={C.cyan} year="2024"
        value={<>≈$<Roll to={5} at={at("пяти") - 4} dur={22} />{tr(" млрд")}</>} />
      <Bar x={1200} at={at("восемь") - 18} height={340} color={C.gold} year="2025"
        value={<>≈$<Roll from={5} to={8} at={at("восемь") - 6} dur={20} />{tr(" млрд")}</>} />
      <At x={960} y={330}>
        <Pop at={growth} from="scale"><Pill color={C.green} size={46}>{tr("↗ рост ≈45% в год")}</Pill></Pop>
      </At>
      <Source at={at("миллиардов")}>MarketsandMarkets · AI Agents Market</Source>
    </Shell>
  );
};

// ── S2 · five trillion ───────────────────────────────────────────────
export const S2: React.FC<SceneProps> = ({ s }) => {
  const at = useAt(s);
  const tr = useT();
  const f = useCurrentFrame();
  const hit = at("триллионов");
  const pre = interpolate(f, [at("через") - 4, hit - 2], [0, 34], CLAMP);
  const r = f < hit - 2 ? pre : interpolate(f, [hit - 2, hit + 18], [34, 330], { ...CLAMP, easing: (x) => 1 - Math.pow(1 - x, 4) });
  return (
    <Shell dur={dur(s)} shakeAt={[hit]}>
      <Chapter n="01" label={tr("прогноз на 2030")} />
      <At x={W / 2} y={170}><Words text={tr("К *2030* году")} at={at("тридцатому") - 4} size={70} /></At>
      {/* the 8 billion dot vs the 5 trillion sphere */}
      <At x={W / 2} y={590}>
        <div style={{
          width: r * 2, height: r * 2, borderRadius: "50%", opacity: r > 0.5 ? 1 : 0, transform: f < hit ? `scale(${1 + 0.08 * Math.sin(f / 3)})` : undefined,
          background: `radial-gradient(circle at 50% 42%, ${C.gold}44, ${C.gold}10 55%, transparent 72%)`, border: `1px solid ${C.gold}88`,
          boxShadow: `0 0 90px ${C.gold}33, inset 0 0 80px ${C.gold}22`,
        }} />
      </At>
      <At x={W / 2 - 600} y={590} style={{ opacity: 1 - ramp(f, hit, 10) }}>
        <Pop at={at("тридцатому")}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: C.cyan, boxShadow: `0 0 20px ${C.cyan}` }} />
            <Mono size={26} color={C.cyan}>{tr("рынок агентов ≈ $8 млрд")}</Mono>
          </div>
        </Pop>
      </At>
      <At x={W / 2} y={590}>
        <div style={{
          fontFamily: F.display, fontWeight: 600, fontSize: 210, color: "#ffffff", whiteSpace: "nowrap",
          transform: `scale(${1.3 - 0.3 * ramp(f, hit, 20)})`, opacity: ramp(f, hit - 1, 8), filter: f < hit + 14 ? `blur(${(1 - ramp(f, hit, 14)) * 16}px)` : undefined,
          letterSpacing: "-0.05em", textShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 50px ${C.gold}66`,
        }}>
          <span style={{ fontSize: 80, fontWeight: 300, verticalAlign: "middle", marginRight: 24, color: C.gold }}>{tr("до")}</span>{tr("$5 трлн")}
        </div>
      </At>
      <At x={W / 2} y={360} style={{ opacity: ramp(f, at("через") - 2, 10) * (1 - ramp(f, hit - 4, 6)) }}>
        <Mono size={34} color={C.gold}>{tr("через агентов пройдёт…")}</Mono>
      </At>
      <At x={W / 2} y={870}>
        <Pop at={hit + 12}><Mono size={32} color={C.fg}>{tr("покупок пройдёт через агентов")}</Mono></Pop>
      </At>
      <Ring at={hit} x={W / 2} y={590} color={C.gold} size={1700} dur={30} />
      <Flash at={hit} color={C.gold} strength={0.5} />
      <Source at={hit + 10}>McKinsey · The agentic commerce opportunity, 2025</Source>
    </Shell>
  );
};

// ── S3 · it is already happening ─────────────────────────────────────
export const S3: React.FC<SceneProps> = ({ s }) => {
  const at = useAt(s);
  const tr = useT();
  const f = useCurrentFrame();
  const stamp = at("прогноз");
  const flow = at("Первые");
  const paid = at("Мастеркард");
  const stampUp = ramp(f, flow - 6, 18);
  const cardX = interpolate(f, [at("агент") + 6, paid], [610, 1310], { ...CLAMP, easing: (x) => x * x * (3 - 2 * x) });
  return (
    <Shell dur={dur(s)} shakeAt={[stamp]}>
      <Chapter n="02" label={tr("волна уже идёт")} />
      <At x={W / 2} y={interpolate(stampUp, [0, 1], [H / 2, 150])}>
        <div style={{
          transform: `scale(${(f < stamp ? 1.15 : 1.15 - 0.15 * ramp(f, stamp, 14)) * (1 - 0.45 * stampUp)})`, filter: f < stamp + 10 ? `blur(${(1 - ramp(f, stamp, 10)) * 12}px)` : undefined,
          opacity: ramp(f, stamp - 1, 8), borderTop: `1px solid ${C.cyan}88`, borderBottom: `1px solid ${C.cyan}88`, padding: "22px 40px",
          fontFamily: F.display, fontWeight: 500, fontSize: 96, letterSpacing: "0.12em", color: C.fg, whiteSpace: "nowrap", textShadow: `0 0 40px ${C.cyan}66`,
        }}>{tr("ЭТО НЕ ПРОГНОЗ")}</div>
      </At>
      <div style={{ opacity: ramp(f, flow, 12) }}>
        <At x={480} y={600}>
          <Pop at={at("агент") - 4} from="left">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <Agent size={210} />
              <Mono size={28} color={C.cyan}>{tr("агент")}</Mono>
            </div>
          </Pop>
        </At>
        <At x={480} y={600} style={{ opacity: ramp(f, at("человек"), 10) }}>
          <div style={{ transform: "translate(-150px, -150px)", opacity: 0.35 }}>
            <Person size={110} color={C.muted} />
            <div style={{ position: "absolute", left: 0, top: 50, width: 110, height: 6, background: C.red, transform: "rotate(-30deg)", boxShadow: `0 0 12px ${C.red}` }} />
          </div>
        </At>
        <At x={cardX} y={620} style={{ opacity: ramp(f, at("агент") + 4, 8) }}>
          <Card w={300} />
        </At>
        <At x={1440} y={600}>
          <Pop at={at("сделал")} from="right">
            <Glass style={{ width: 380, padding: "36px 30px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <Mono size={22}>{tr("платёжная сеть")}</Mono>
              <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 40, color: C.fg }}>Mastercard</div>
              <div style={{
                width: 120, height: 120, borderRadius: 60, display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${f >= paid ? C.green : C.dim}`, color: C.green, fontSize: 70, fontWeight: 600, fontFamily: F.body,
                transform: `scale(${f >= paid ? 0.8 + 0.2 * springAt(f, paid, 9, 200) : 0.8})`, boxShadow: f >= paid ? `0 0 50px ${C.green}88` : undefined,
              }}>{f >= paid ? "✓" : ""}</div>
              <Mono size={24} color={f >= paid ? C.green : C.muted}>{f >= paid ? tr("оплачено агентом") : tr("ожидание…")}</Mono>
            </Glass>
          </Pop>
        </At>
      </div>
      <Ring at={paid} x={1440} y={600} color={C.green} size={700} />
      <At x={W / 2} y={900}><Pop at={paid + 8}><Mono size={26} color={C.fg}>{tr("первые покупки агентов · Гонконг · Таиланд")}</Mono></Pop></At>
      <Source at={paid + 10}>Mastercard Agent Pay</Source>
    </Shell>
  );
};

// ── S4 · the waves: GPU → models → agents ────────────────────────────
const WaveCol: React.FC<{ at: number; subAt: number; x: number; icon: React.ReactNode; title: string; sub: string; color: string }> = ({ at, subAt, x, icon, title, sub, color }) => (
  <At x={x} y={500}>
    <Pop at={at} dist={80}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, width: 440 }}>
        <div style={{ height: 210, display: "flex", alignItems: "center" }}>{icon}</div>
        <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 52, color }}>{title}</div>
        <Pop at={subAt}><div style={{ fontFamily: F.body, fontWeight: 500, fontSize: 32, color: C.fg, textAlign: "center", lineHeight: 1.2 }}>{sub}</div></Pop>
      </div>
    </Pop>
  </At>
);

export const S4: React.FC<SceneProps> = ({ s }) => {
  const at = useAt(s);
  const tr = useT();
  const f = useCurrentFrame();
  const wave = at("Волна");
  const giants = at("гигантов");
  const q = at("Но");
  const out = ramp(f, q - 8, 14);
  const crest = ramp(f, wave, 40);
  return (
    <Shell dur={dur(s)} push={0.02}>
      <Chapter n="02" label={tr("три волны")} />
      <div style={{ opacity: 1 - out, transform: `translateY(${-out * 120}px)` }}>
        {/* wave crest behind the third column */}
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.cyan} stopOpacity="0.55" /><stop offset="1" stopColor={C.cyan} stopOpacity="0" /></linearGradient>
          </defs>
          {[0, 1, 2].map((k) => {
            const amp = 40 + k * 18;
            const base = 1080 - crest * (420 - k * 90);
            const ph = f / (14 + k * 4);
            const d = `M1150 1080 L1150 ${base} ` + Array.from({ length: 13 }, (_, i) => {
              const x = 1150 + i * 65;
              return `L${x} ${base - Math.sin(ph + i * 0.7) * amp - Math.max(0, 6 - Math.abs(i - 6)) * 22 * crest}`;
            }).join(" ") + " L1920 1080 Z";
            return <path key={k} d={d} fill="url(#wg)" opacity={0.5 - k * 0.12} />;
          })}
          {/* giants: skyline rising on the wave */}
          {[0, 1, 2, 3, 4].map((i) => {
            const t = springAt(f, giants - 6 + i * 3, 14, 120);
            const h = [210, 330, 260, 400, 240][i] * t;
            return <rect key={i} x={1290 + i * 95} y={780 - h} width={70} height={h} rx={6} fill={`${C.gold}33`} stroke={C.gold} strokeWidth={1.2} style={{ filter: `drop-shadow(0 0 14px ${C.gold})` }} />;
          })}
        </svg>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <line x1="560" y1="420" x2={560 + 300 * ramp(f, at("Фундаментальные") - 10, 14)} y2="420" stroke={C.line} strokeWidth="3" strokeDasharray="10 10" />
          <line x1="1080" y1="420" x2={1080 + 300 * ramp(f, wave - 10, 14)} y2="420" stroke={C.line} strokeWidth="3" strokeDasharray="10 10" />
        </svg>
        <WaveCol x={360} at={at("Графические") - 2} subAt={at("вычислительные")} icon={<Chip size={200} />} title="GPU" sub={tr("вычислительные мощности")} color={C.violet} />
        <WaveCol x={860} at={at("Фундаментальные") - 2} subAt={at("строить")} icon={<Neural size={210} />} title={tr("Модели")} sub={tr("возможность строить сервисы")} color={C.cyan} />
        <WaveCol x={1520} at={wave - 2} subAt={giants} icon={<Agent size={190} />} title={tr("Агенты")} sub={tr("новые гиганты")} color={C.gold} />
      </div>
      <Center style={{ opacity: ramp(f, q, 10) }}>
        <CoinOrbit at={at("деньгами")} />
        <Words text={tr("Чьими *деньгами* будут платить агенты?")} at={at("чьими") - 2} size={92} accent={C.gold} maxWidth={1400} />
      </Center>
    </Shell>
  );
};

const CoinOrbit: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const t = ramp(f, at, 20);
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + f / 40;
        const rx = 760 * t;
        const ry = 300 * t;
        const z = Math.sin(a);
        return (
          <At key={i} x={W / 2 + Math.cos(a) * rx} y={H / 2 + z * ry}>
            <div style={{
              width: 64, height: 64, borderRadius: 32, border: `1px solid ${C.gold}`, background: `radial-gradient(circle, ${C.gold}22, transparent 70%)`,
              boxShadow: `0 0 24px ${C.gold}44`, opacity: t * (0.5 + 0.5 * (z + 1) / 2), transform: `scale(${0.6 + 0.4 * (z + 1) / 2}) rotateY(${f * 6 + i * 30}deg)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontWeight: 500, color: C.gold, fontSize: 26,
            }}>$</div>
          </At>
        );
      })}
    </>
  );
};

// ── S5 · problem: your money ─────────────────────────────────────────
export const S5: React.FC<SceneProps> = ({ s }) => {
  const at = useAt(s);
  const tr = useT();
  const f = useCurrentFrame();
  const yours = at("вашими");
  const tickets = at("Попросили");
  const forty = at("сорок");
  const scam = at("Или");
  const fraud = at("мошенников");
  const toLeft = ramp(f, tickets - 4, 16);
  const glitch = f >= fraud && f < fraud + 22 ? 1 : 0;
  const count = f < forty - 4 ? 4 : Math.round(interpolate(f, [forty - 4, forty + 6], [4, 40], CLAMP));
  return (
    <Shell dur={dur(s)} shakeAt={[forty, fraud]}>
      <Chapter n="03" label={tr("проблема")} />
      <At x={interpolate(toLeft, [0, 1], [W / 2, 400])} y={interpolate(toLeft, [0, 1], [500, 560])}>
        <div style={{ transform: `scale(${1 - 0.45 * toLeft})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          <Words text={tr("Сегодня *вашими.*")} at={at("Сегодня") - 2} size={110} accent={C.gold} />
          <Pop at={yours + 4}><Card tone="personal" w={460} label={tr("ВАША КАРТА")} sub="•••• 7788" /></Pop>
        </div>
      </At>
      {/* tickets: 4 → 40 */}
      <div style={{ opacity: window01(f, tickets, scam + 6, 8) }}>
        <At x={1270} y={330}>
          <Glass style={{ padding: "26px 40px", display: "flex", alignItems: "center", gap: 30 }}>
            <Mono size={24}>{tr("заказ агента")}</Mono>
            <Ticket size={110} color={count > 4 ? C.red : C.gold} />
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 100, color: count > 4 ? C.red : C.fg, textShadow: count > 4 ? `0 0 40px ${C.red}` : undefined }}>×{count}</div>
          </Glass>
        </At>
        {Array.from({ length: 26 }, (_, i) => {
          const start = forty + (i % 9) * 2;
          const t = Math.max(0, f - start);
          if (f < start) return null;
          const x = 900 + ((i * 137) % 760);
          const y = 420 + t * t * 0.45 + (i % 5) * 20;
          return <At key={i} x={x} y={y}><Ticket size={90} color={C.red} style={{ transform: `rotate(${(i * 47) % 90 - 45 + t * 3}deg)`, opacity: Math.max(0, 1 - t / 40) }} /></At>;
        })}
      </div>
      {/* phishing page */}
      <At x={1270} y={600} style={{ opacity: ramp(f, scam, 10) }}>
        <div style={{ transform: `translate(${glitch * Math.sin(f * 9) * 22}px, 0) skewX(${glitch * Math.sin(f * 5) * 6}deg)`, filter: glitch ? `drop-shadow(8px 0 0 ${C.red}) drop-shadow(-8px 0 0 ${C.cyan})` : undefined }}>
          <Glass glow={C.red} style={{ width: 720, overflow: "hidden", border: `1px solid ${C.red}66` }}>
            <div style={{ display: "flex", gap: 10, padding: "16px 20px", background: "rgba(255,255,255,0.05)", alignItems: "center" }}>
              {[C.red, C.gold, C.green].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
              <div style={{ marginLeft: 16, flex: 1, borderRadius: 10, background: "rgba(0,0,0,0.4)", padding: "8px 16px", fontFamily: F.mono, fontSize: 22, color: C.red }}>secure-pay-0nline.biz/checkout</div>
            </div>
            <div style={{ padding: "34px 36px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 36, color: C.fg }}>{tr("Подтвердите оплату картой")}</div>
              <div style={{ height: 50, borderRadius: 12, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ height: 50, borderRadius: 12, background: "rgba(255,255,255,0.06)" }} />
              <div style={{
                alignSelf: "flex-start", fontFamily: F.display, fontWeight: 600, fontSize: 40, color: "#fff", background: C.red, padding: "10px 26px", borderRadius: 12,
                opacity: f >= fraud ? 1 : 0, transform: `scale(${f >= fraud ? springAt(f, fraud, 9, 220) : 0})`, boxShadow: `0 0 50px ${C.red}`,
              }}>{tr("МОШЕННИКИ")}</div>
            </div>
          </Glass>
        </div>
      </At>
      <Flash at={fraud} color={C.red} strength={0.35} />
      <Flash at={forty} color={C.red} strength={0.25} />
    </Shell>
  );
};

// ── S6 · new financial instruments ───────────────────────────────────
export const S6: React.FC<SceneProps> = ({ s }) => {
  const at = useAt(s);
  const tr = useT();
  const f = useCurrentFrame();
  const up = ramp(f, at("У") - 8, 18);
  const cardIn = at("каждого");
  const limitAt = at("лимит");
  const spend = interpolate(f, [limitAt, limitAt + 30], [0, 0.72], { ...CLAMP, easing: (x) => 1 - Math.pow(1 - x, 3) });
  return (
    <Shell dur={dur(s)}>
      <Chapter n="04" label={tr("решение")} />
      <At x={W / 2} y={interpolate(up, [0, 1], [H / 2 - 20, 140])}>
        <div style={{ transform: `scale(${1 - 0.48 * up})` }}>
          <Words text={tr("Новой экономике нужны *новые финансовые инструменты*")} at={at("Новой") - 2} size={92} maxWidth={1800} />
        </div>
      </At>
      <div style={{ opacity: ramp(f, cardIn - 6, 10) }}>
        <At x={660} y={620}>
          <div style={{ position: "relative" }}>
            <Wallet size={220} style={{ opacity: 0.5, position: "absolute", left: -250, top: 40 }} />
            <div style={{ transform: `translateX(${(1 - springAt(f, cardIn, 15, 120)) * -420}px) rotate(${(1 - springAt(f, cardIn, 15, 120)) * -14}deg)` }}>
              <Card w={560} />
            </div>
          </div>
        </At>
        <div style={{ position: "absolute", left: 1060, top: 430, display: "flex", flexDirection: "column", gap: 30 }}>
          <Pop at={at("счёт") - 2} from="right"><Pill size={46}>{tr("свой счёт")}</Pill></Pop>
          <Pop at={at("карта") - 2} from="right"><Pill size={46}>{tr("своя карта")}</Pill></Pop>
          <Pop at={limitAt - 2} from="right"><Pill size={46} color={C.gold}>{tr("ваш лимит")}</Pill></Pop>
        </div>
        <div style={{ position: "absolute", left: 1060, top: 800, width: 680, opacity: ramp(f, limitAt, 10) }}>
          <div style={{ height: 22, borderRadius: 11, background: "rgba(255,255,255,0.08)", position: "relative", overflow: "visible" }}>
            <div style={{ position: "absolute", inset: 0, width: `${spend * 100}%`, borderRadius: 11, background: `linear-gradient(90deg, ${C.cyan}, ${C.gold})`, boxShadow: `0 0 30px ${C.cyan}66` }} />
            <div style={{ position: "absolute", left: "86%", top: -18, width: 4, height: 58, background: C.gold, boxShadow: `0 0 14px ${C.gold}` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <Mono size={22}>{`${tr("потрачено")} $${Math.round(spend * 500)}`}</Mono>
            <Mono size={22} color={C.gold}>{tr("лимит $430")}</Mono>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export { CoinOrbit };
