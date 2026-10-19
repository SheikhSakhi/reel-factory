import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { VoScene } from "../../kit";
import { Agent, Bank, Card, Ecg, Folder, Notebook, Paper, Person, Phone, Plane, Server, Shield, Stethoscope, Strike, Wallet } from "./icons";
import { C, F, H, W } from "./style";
import { localAt } from "./take";
import { At, Center, Chapter, Flash, Glass, Mono, Pill, Pop, ramp, Ring, Shell, springAt, window01, Words } from "./ui";

type SceneProps = { s: VoScene };
const dur = (s: VoScene): number => s.to - s.from;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = (x: number): number => x * x * (3 - 2 * x);

// ── S7 · insured + an insurance product with every purchase ─────────
const Receipt: React.FC<{ at: number; offerAt: number; icon: React.ReactNode; title: string; line: string; price: string; offer: string }> = ({ at, offerAt, icon, title, line, price, offer }) => {
  const f = useCurrentFrame();
  const o = springAt(f, offerAt, 13, 170);
  return (
    <Pop at={at} dist={90}>
      <Glass style={{ width: 640, padding: "34px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 84, height: 84, borderRadius: 20, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)" }}>{icon}</div>
          <div>
            <Mono size={20}>агент оформил</Mono>
            <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 40, color: C.fg }}>{title}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.body, fontSize: 30, color: C.muted, fontWeight: 600 }}>
          <span>{line}</span><span>{price}</span>
        </div>
        <div style={{
          overflow: "hidden", maxHeight: 120 * o, opacity: o, borderRadius: 16, border: `1px solid ${C.green}88`, background: `${C.green}14`,
          padding: o > 0.05 ? "16px 22px" : "0 22px", display: "flex", alignItems: "center", gap: 16, boxShadow: `0 0 40px ${C.green}33`,
          transform: `translateX(${(1 - o) * 60}px)`,
        }}>
          <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 34, color: C.green }}>＋</div>
          <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 30, color: C.green, whiteSpace: "nowrap" }}>{offer}</div>
          <div style={{ marginLeft: "auto" }}><Mono size={18} color={C.green}>предложено</Mono></div>
        </div>
      </Glass>
    </Pop>
  );
};

export const S7: React.FC<SceneProps> = ({ s }) => {
  const at = localAt(s);
  const f = useCurrentFrame();
  const ins = at("застрахован");
  const phaseB = at("А") - 6;
  const shieldT = ramp(f, ins - 4, 26);
  const outA = ramp(f, phaseB, 14);
  return (
    <Shell dur={dur(s)} push={0.02}>
      <Chapter n="04" label="доверие" />
      <div style={{ opacity: 1 - outA, transform: `scale(${1 - 0.1 * outA})` }}>
        <At x={760} y={560}>
          <div style={{ position: "relative", width: 560, height: 560, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Card w={400} style={{ position: "absolute" }} />
            <Shield size={470} t={shieldT} style={{ position: "absolute", top: -10 }} />
          </div>
        </At>
        <div style={{ position: "absolute", left: 1150, top: 330, display: "flex", flexDirection: "column", gap: 30 }}>
          <Words text="Каждый счёт *застрахован*" at={at("Каждый") - 2} size={64} align="left" accent={C.green} maxWidth={700} />
          <Pop at={at("мошенников") - 2} from="right"><Pill color={C.green} size={40}>от мошенников</Pill></Pop>
          <Pop at={at("ошибок") - 2} from="right"><Pill color={C.green} size={40}>от ошибок агента</Pill></Pop>
        </div>
      </div>
      <div style={{ opacity: ramp(f, phaseB + 4, 12) }}>
        <At x={W / 2} y={170}>
          <Words text="При каждой покупке: *настоящий страховой продукт*" at={phaseB + 6} stagger={3} size={60} accent={C.green} maxWidth={1700} />
        </At>
        <At x={560} y={620}>
          <Receipt at={Math.min(at("Записал") - 4, phaseB + 24)} offerAt={at("медицинскую")} icon={<Stethoscope size={64} color={C.cyan} />} title="Запись к врачу" line="Приём терапевта" price="$40" offer="Медицинская страховка" />
        </At>
        <At x={1360} y={620}>
          <Receipt at={at("Купил") - 4} offerAt={at("туристическую")} icon={<Plane size={64} color={C.cyan} />} title="Авиабилеты" line="Сеул → Дели, 2 места" price="$860" offer="Туристическая страховка" />
        </At>
      </div>
      <Ring at={ins + 10} x={760} y={560} color={C.green} size={900} />
    </Shell>
  );
};

// ── S8 · agents paying agents → the new ocean of money ───────────────
const NODES = Array.from({ length: 70 }, (_, i) => {
  const a = i * 2.39996;
  const r = 120 + Math.sqrt(i / 70) * 820;
  return { x: W / 2 + Math.cos(a) * r * 1.15, y: H / 2 + Math.sin(a) * r * 0.55 };
});
const LINKS = NODES.flatMap((n, i) => [[i, (i * 7 + 3) % NODES.length], [i, (i * 13 + 5) % NODES.length]] as const).filter(([a, b]) => a !== b);

const Packet: React.FC<{ from: [number, number]; to: [number, number]; at: number; len?: number; label: string; color?: string }> = ({ from, to, at, len = 24, label, color = C.cyan }) => {
  const f = useCurrentFrame();
  const t = smooth(interpolate(f, [at, at + len], [0, 1], CLAMP));
  if (f < at) return null;
  const x = from[0] + (to[0] - from[0]) * t;
  const y = from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * 60;
  return (
    <At x={x} y={y}>
      <div style={{
        fontFamily: F.body, fontWeight: 600, fontSize: 28, color: C.bg, background: color, padding: "8px 20px", borderRadius: 999, whiteSpace: "nowrap",
        boxShadow: `0 0 30px ${color}`, transform: `scale(${0.6 + 0.4 * springAt(f, at, 12, 200)})`,
      }}>{label}</div>
    </At>
  );
};

const BigNode: React.FC<{ at: number; x: number; label: string; color?: string; seed: number }> = ({ at, x, label, color = C.cyan, seed }) => (
  <At x={x} y={540}>
    <Pop at={at} from="scale">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ width: 230, height: 230, display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(circle, ${color}22, transparent 65%)` }}>
          <Agent size={190} color={color} blinkSeed={seed} />
        </div>
        <Mono size={26} color={C.fg}>{label}</Mono>
      </div>
    </Pop>
  </At>
);

export const S8: React.FC<SceneProps> = ({ s }) => {
  const at = localAt(s);
  const f = useCurrentFrame();
  const chain = at("Ваш") - 6;
  const noCalls = at("Ни");
  const billions = at("Таких") - 4;
  const ocean = at("океан");
  const aOut = ramp(f, chain - 8, 12);
  const cOut = ramp(f, billions - 6, 14);
  const xs = [430, 960, 1490] as const;
  const zoom = interpolate(f, [billions, ocean + 20], [1.6, 0.9], { ...CLAMP, easing: smooth });
  const waveUp = ramp(f, ocean - 4, 30);
  return (
    <Shell dur={dur(s)} push={0.015} shakeAt={[ocean]}>
      <Chapter n="05" label="экономика агентов" />
      {/* A: agents trading */}
      <div style={{ opacity: ramp(f, 0, 10) * (1 - aOut) }}>
        {[[480, 380], [960, 260], [1440, 380], [700, 720], [1220, 720]].map(([x, y], i) => (
          <At key={i} x={x} y={y}><Pop at={i * 4} from="scale"><Agent size={140} blinkSeed={i} /></Pop></At>
        ))}
        <Packet from={[480, 380]} to={[960, 260]} at={at("платить") - 6} label="$ платёж" color={C.gold} />
        <Packet from={[1440, 380]} to={[700, 720]} at={at("покупать") - 6} label="покупка" />
        <Packet from={[1220, 720]} to={[1440, 380]} at={at("продавать") - 6} label="продажа" color={C.green} />
        <At x={W / 2} y={540}><Words text="Агенты платят *друг другу*" at={at("Агенты")} size={62} /></At>
      </div>
      {/* B: patient agent → clinic agent → insurer agent */}
      <div style={{ opacity: ramp(f, chain, 12) * (1 - cOut) }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <line x1={xs[0] + 130} y1={520} x2={xs[0] + 130 + (xs[1] - xs[0] - 260) * ramp(f, at("агент", 1) - 6, 14)} y2={520} stroke={C.line} strokeWidth="4" strokeDasharray="12 10" />
          <line x1={xs[1] + 130} y1={520} x2={xs[1] + 130 + (xs[2] - xs[1] - 260) * ramp(f, at("агент", 2) - 6, 14)} y2={520} stroke={C.line} strokeWidth="4" strokeDasharray="12 10" />
        </svg>
        <BigNode at={at("Ваш") - 2} x={xs[0]} label="ваш агент" seed={1} />
        <BigNode at={at("агент", 1) - 2} x={xs[1]} label="агент клиники" color={C.violet} seed={2} />
        <BigNode at={Math.min(at("агент", 2) - 2, at("выставляет") + 2)} x={xs[2]} label="агент страховой" color={C.green} seed={3} />
        <Packet from={[xs[0], 370]} to={[xs[1], 370]} at={at("записывает") - 2} len={26} label="запись" />
        <Packet from={[xs[1], 370]} to={[xs[2], 370]} at={at("выставляет") - 2} len={22} label="счёт" color={C.violet} />
        <Packet from={[xs[2], 760]} to={[xs[1], 760]} at={at("оплачивает") - 4} len={22} label="✓ оплачено" color={C.green} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center", gap: 120, opacity: ramp(f, noCalls - 4, 10) }}>
          {[{ icon: <Phone size={110} color={C.muted} />, at: noCalls, label: "звонки" }, { icon: <Paper size={110} color={C.muted} />, at: at("бумаги"), label: "бумаги" }].map((it) => (
            <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: "relative", width: 110, height: 110 }}>{it.icon}<Strike t={ramp(f, it.at, 10)} size={110} /></div>
              <Mono size={26} color={C.red}>{it.label}: 0</Mono>
            </div>
          ))}
        </div>
      </div>
      {/* C: billions of deals → ocean */}
      <AbsoluteFill style={{ opacity: ramp(f, billions, 12), transform: `scale(${zoom})` }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {LINKS.map(([a, b], i) => (
            <line key={i} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} stroke={i % 5 === 0 ? C.gold : C.cyan} strokeWidth="1.4" opacity={0.18 + 0.2 * Math.sin(f / 7 + i)} />
          ))}
          {LINKS.filter((_, i) => i % 2 === 0).map(([a, b], i) => {
            const t = ((f * 0.025 + i * 0.137) % 1);
            return <circle key={`p${i}`} cx={NODES[a].x + (NODES[b].x - NODES[a].x) * t} cy={NODES[a].y + (NODES[b].y - NODES[a].y) * t} r="4" fill={i % 3 === 0 ? C.gold : C.cyan} style={{ filter: `drop-shadow(0 0 6px ${C.gold})` }} />;
          })}
          {NODES.map((n, i) => <circle key={`n${i}`} cx={n.x} cy={n.y} r={i < 6 ? 12 : 7} fill={C.bg} stroke={i % 4 === 0 ? C.gold : C.cyan} strokeWidth="1.2" />)}
        </svg>
      </AbsoluteFill>
      <At x={W / 2} y={300} style={{ opacity: ramp(f, billions, 10) * (1 - ramp(f, ocean - 10, 10)) }}>
        <Words text="*Миллиарды* таких сделок" at={at("миллиарды") - 10} size={86} accent={C.gold} />
      </At>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.gold} stopOpacity="0.85" /><stop offset="1" stopColor="#5a3d00" stopOpacity="0.2" /></linearGradient>
        </defs>
        {[0, 1, 2].map((k) => {
          const base = H + 40 - waveUp * (330 - k * 70);
          const d = `M0 ${H} L0 ${base} ` + Array.from({ length: 25 }, (_, i) => `L${i * 80} ${base - Math.sin(f / (9 + k * 3) + i * 0.6 + k) * (26 + k * 10)}`).join(" ") + ` L${W} ${H} Z`;
          return <path key={k} d={d} fill="url(#og)" opacity={0.45 - k * 0.1} />;
        })}
      </svg>
      <Center style={{ opacity: ramp(f, ocean - 4, 8) }}>
        <div style={{ transform: `scale(${f < ocean - 4 ? 0 : 1.5 - 0.5 * springAt(f, ocean - 4, 12, 150)})` }}>
          <Words text="Новый *океан* денег" at={ocean - 10} size={140} accent={C.gold} stagger={3} />
        </div>
      </Center>
      <Flash at={ocean} color={C.gold} strength={0.45} />
      <Ring at={ocean} x={W / 2} y={H / 2} color={C.gold} size={2200} dur={34} />
    </Shell>
  );
};

// ── S9 · the bank for agents … but one condition ─────────────────────
export const S9: React.FC<SceneProps> = ({ s }) => {
  const at = localAt(s);
  const f = useCurrentFrame();
  const eq = at("агентов");
  const lightsOff = at("Но");
  const dark = ramp(f, lightsOff - 4, 10);
  return (
    <Shell dur={dur(s)} push={0.05}>
      <div style={{ opacity: 1 - dark }}>
        <Chapter n="05" label="2030" />
        <At x={W / 2} y={190}><Words text="К *2030* году лучший банк" at={at("тридцатому") - 4} size={72} /></At>
        <At x={680} y={560}><Pop at={at("банк") - 4} from="scale"><Bank size={300} /></Pop></At>
        <At x={W / 2} y={560}><Pop at={eq - 4} from="scale"><div style={{ fontFamily: F.display, fontSize: 120, fontWeight: 300, color: C.cyan }}>=</div></Pop></At>
        <At x={1240} y={560}>
          <Pop at={eq} from="scale">
            <div style={{ position: "relative", width: 300, height: 300 }}>
              <Bank size={300} color={C.cyan} />
              <div style={{ position: "absolute", left: 95, top: 108 }}><Agent size={110} /></div>
            </div>
          </Pop>
        </At>
        <At x={W / 2} y={860}><Pop at={eq + 4}><Pill size={52}>банк для агентов</Pill></Pop></At>
      </div>
      <Center style={{ opacity: dark }}>
        <TypeLine text="Но есть одно условие." at={lightsOff} />
      </Center>
    </Shell>
  );
};

const TypeLine: React.FC<{ text: string; at: number; size?: number }> = ({ text, at, size = 84 }) => {
  const f = useCurrentFrame();
  const shown = Math.max(0, Math.floor((f - at) / 1.6));
  const caret = Math.floor(f / 12) % 2 === 0;
  return (
    <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: size, color: C.fg, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
      {text.slice(0, shown)}<span style={{ color: C.cyan, opacity: caret ? 1 : 0 }}>▍</span>
    </div>
  );
};

// ── S10 · memory ─────────────────────────────────────────────────────
const FACTS = ["Имя: Анна", "Город: Сеул", "Любит кофе"];
const HISTORY = ["2019 · аллергия на пенициллин", "2021 · переезд, новая клиника", "2022 · давление 150/95", "2023 · начата терапия", "2024 · отказ от перелёта: врач", "2025 · норма, доза снижена", "2026 · плановый контроль"];

export const S10: React.FC<SceneProps> = ({ s }) => {
  const at = localAt(s);
  const f = useCurrentFrame();
  const quoteAt = at("Деньги") - 4;
  const forgetAt = at("А") - 4;
  const splitAt = at("Гиганты") - 6;
  const A = window01(f, 0, quoteAt + 6, 10);
  const B = window01(f, quoteAt, forgetAt + 8, 10);
  const Cc = window01(f, forgetAt, splitAt + 8, 10);
  const D = ramp(f, splitAt, 12);
  const crossT = ramp(f, at("историю"), 12);
  return (
    <Shell dur={dur(s)} push={0.02}>
      <Chapter n="06" label="условие: память" />
      {/* A: agent remembers its owner */}
      <div style={{ opacity: A }}>
        <At x={W / 2} y={170}><Words text="Чтобы этим сделкам *можно было доверять*" at={at("Чтобы") - 2} size={60} maxWidth={1500} /></At>
        <At x={640} y={600}><Pop at={at("агент") - 4} from="left"><Agent size={260} /></Pop></At>
        <At x={1280} y={600}><Pop at={at("владельца") - 4} from="right"><Person size={240} /></Pop></At>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {[0, 1, 2, 3, 4].map((k) => (
            <path key={k} d={`M780 600 C 900 ${520 + k * 40}, 1040 ${680 - k * 40}, 1160 600`} fill="none" stroke={C.cyan} strokeWidth="1.2" opacity={0.5}
              pathLength={1} strokeDasharray="0.06 0.04" strokeDashoffset={-f * 0.01 - k * 0.2} style={{ opacity: ramp(f, at("помнить"), 14) * 0.7 }} />
          ))}
        </svg>
        <At x={W / 2} y={860}><Pop at={at("помнить")}><Pill size={42}>агент помнит своего владельца</Pill></Pop></At>
      </div>
      {/* B: the quote */}
      <Center style={{ opacity: B }}>
        <Words text="Деньги доверяют агенту, который *помнит*" at={quoteAt + 4} size={104} accent={C.gold} maxWidth={1500} />
      </Center>
      {/* C: today's AI forgets: memories dissolve */}
      <AbsoluteFill style={{ opacity: Cc }}>
        <At x={W / 2} y={190}><Words text="Сегодняшний ИИ *не помнит* всего" at={forgetAt + 6} size={70} accent={C.red} /></At>
        {HISTORY.slice(0, 6).map((h, i) => {
          const dissolve = ramp(f, at("помнит", 1) + i * 5, 26);
          return (
            <At key={h} x={420 + (i % 3) * 540} y={480 + Math.floor(i / 3) * 190}>
              <div style={{ opacity: 1 - dissolve, filter: `blur(${dissolve * 16}px)`, transform: `translateY(${-dissolve * 80}px) scale(${1 + dissolve * 0.2})` }}>
                <Glass style={{ padding: "22px 30px" }}><Mono size={24} color={C.fg}>{h}</Mono></Glass>
              </div>
            </At>
          );
        })}
      </AbsoluteFill>
      {/* D: notebook vs history */}
      <AbsoluteFill style={{ opacity: D }}>
        <At x={W / 2} y={150}><Words text="Гиганты дали лишь *блокнот*" at={splitAt + 4} size={64} accent={C.muted} /></At>
        <At x={560} y={590}>
          <Pop at={at("блокнот") - 4} from="left">
            <Glass style={{ width: 560, padding: "34px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}><Notebook size={80} /><Mono size={24}>профиль пользователя</Mono></div>
              {FACTS.map((x, i) => (
                <Pop key={x} at={at("фактов") - 8 + i * 5}>
                  <div style={{ fontFamily: F.body, fontWeight: 500, fontSize: 36, color: C.fg, padding: "12px 20px", borderRadius: 14, background: "rgba(255,255,255,0.05)" }}>{x}</div>
                </Pop>
              ))}
              <Mono size={22} color={C.muted}>несколько фактов</Mono>
            </Glass>
          </Pop>
        </At>
        <At x={1340} y={590}>
          <Pop at={at("историю") - 10} from="right">
            <div style={{ position: "relative" }}>
              <Glass style={{ width: 620, padding: "30px 36px", display: "flex", flexDirection: "column", gap: 10, opacity: 0.5 }}>
                <Mono size={24} color={C.cyan}>история</Mono>
                {HISTORY.map((h) => <div key={h} style={{ fontFamily: F.mono, fontSize: 22, color: C.muted, borderLeft: `3px solid ${C.cyan}55`, paddingLeft: 16 }}>{h}</div>)}
              </Glass>
              <svg width={620} height={480} style={{ position: "absolute", left: 0, top: 0 }}>
                <line x1="30" y1="450" x2={30 + 560 * crossT} y2={450 - 420 * crossT} stroke={C.red} strokeWidth="10" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 12px ${C.red})` }} />
              </svg>
            </div>
          </Pop>
        </At>
        <At x={1340} y={920}><Pop at={at("историю")}><Mono size={30} color={C.red}>истории нет</Mono></Pop></At>
      </AbsoluteFill>
    </Shell>
  );
};

// ── S11 · the race: data centers vs a real breakthrough ──────────────
export const S11: React.FC<SceneProps> = ({ s }) => {
  const at = localAt(s);
  const f = useCurrentFrame();
  const racks = at("Большие") - 4;
  const tech = at("А") - 4;
  const med = at("И") - 4;
  const A = window01(f, 0, racks + 8, 10);
  const B = window01(f, racks, tech + 10, 10);
  const Cc = window01(f, tech, med + 8, 10);
  const D = ramp(f, med, 12);
  return (
    <Shell dur={dur(s)} push={0.03}>
      <Chapter n="06" label="гонка за память" />
      {/* A: race streaks */}
      <AbsoluteFill style={{ opacity: A }}>
        {Array.from({ length: 26 }, (_, i) => {
          const y = 120 + ((i * 97) % 860);
          const x = ((f * (26 + (i % 5) * 9) + i * 211) % (W + 600)) - 400;
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: 300 + (i % 4) * 80, height: 3, background: `linear-gradient(90deg, transparent, ${i % 3 ? C.cyan : C.violet})`, opacity: 0.6 }} />;
        })}
        <Center><Words text="Гонка за *настоящую память*" at={at("гонка") - 8} size={104} maxWidth={1500} /></Center>
      </AbsoluteFill>
      {/* B: data centers multiply */}
      <AbsoluteFill style={{ opacity: B }}>
        <div style={{ position: "absolute", left: 130, right: 130, top: 300, display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center" }}>
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} style={{ transform: `scale(${springAt(f, racks + i * 1.2, 15, 200)})` }}><Server w={70} seed={i} /></div>
          ))}
        </div>
        <At x={W / 2} y={170}><Words text="Большие игроки строят *дата-центры*" at={racks + 2} size={64} accent={C.red} maxWidth={1600} /></At>
      </AbsoluteFill>
      {/* C: one breakthrough */}
      <AbsoluteFill style={{ opacity: Cc }}>
        <Center>
          <div style={{ width: 260, height: 260, borderRadius: 130, background: `radial-gradient(circle, #fff, ${C.cyan} 35%, ${C.cyan}00 70%)`, transform: `scale(${0.6 + 0.4 * springAt(f, tech + 6, 10, 120) + 0.04 * Math.sin(f / 4)})`, boxShadow: `0 0 160px ${C.cyan}` }} />
        </Center>
        <At x={W / 2} y={200}><Words text="Прорыв будет *технологическим*" at={tech + 4} size={80} maxWidth={1600} /></At>
      </AbsoluteFill>
      {/* D: medical history */}
      <AbsoluteFill style={{ opacity: D }}>
        <At x={W / 2} y={470}><Pop at={med + 2} from="scale"><Folder size={340} /></Pop></At>
        <At x={W / 2} y={740}><Ecg w={900} t={ramp(f, med + 6, 30)} /></At>
        <At x={W / 2} y={170}><Words text="И начнётся он с *истории болезни*" at={med + 4} size={74} accent={C.green} /></At>
      </AbsoluteFill>
      <Flash at={tech + 6} color={C.cyan} strength={0.35} />
    </Shell>
  );
};

// ── S12 · trust → Treint → live demo ─────────────────────────────────
export const S12: React.FC<SceneProps> = ({ s }) => {
  const at = localAt(s);
  const f = useCurrentFrame();
  const brand = at("Треинт") - 2;
  const demo = at("Сейчас") - 2;
  const A = 1 - ramp(f, brand - 10, 10);
  const logo = springAt(f, brand, 11, 120);
  const goDemo = ramp(f, demo, 14);
  return (
    <Shell dur={dur(s)} push={0.04} shakeAt={[brand]}>
      {/* A: medical history = wallet */}
      <AbsoluteFill style={{ opacity: A }}>
        <At x={W / 2} y={190}><Words text="Если ИИ можно доверить *историю болезни*" at={at("Если") - 2} size={64} accent={C.green} maxWidth={1600} /></At>
        <At x={560} y={590}><Pop at={at("историю") - 6} from="left"><Folder size={320} color={C.green} /></Pop></At>
        <At x={W / 2} y={590}>
          <Pop at={at("ему") - 4} from="scale">
            <div style={{ fontFamily: F.display, fontWeight: 300, fontSize: 110, color: C.cyan, textShadow: `0 0 30px ${C.cyan}66` }}>→</div>
          </Pop>
        </At>
        <At x={1360} y={590}><Pop at={at("кошелёк") - 6} from="right"><Wallet size={320} /></Pop></At>
        <At x={W / 2} y={880}><Pop at={at("кошелёк")}><Words text="ему можно доверить и *кошелёк*" at={at("кошелёк") - 4} size={56} accent={C.gold} /></Pop></At>
      </AbsoluteFill>
      {/* B: Treint */}
      <AbsoluteFill style={{ opacity: f >= brand - 2 ? 1 : 0 }}>
        <Center style={{ flexDirection: "column", gap: 30, transform: `translateY(${-goDemo * 120}px) scale(${1 - goDemo * 0.25})` }}>
          <Mono size={26} color={C.cyan} style={{ opacity: ramp(f, brand - 6, 10) }}>команда</Mono>
          <div style={{
            fontFamily: F.display, fontWeight: 600, fontSize: 210, letterSpacing: "0.2em", marginRight: "-0.2em", transform: `scale(${0.6 + 0.4 * logo})`, opacity: Math.min(1, logo * 1.5),
            color: "#F6FDFF", textShadow: `0 0 30px ${C.cyan}66, 0 0 ${80 + 20 * Math.sin(f / 12)}px ${C.cyan}33`,
          }}>TREINT</div>
          <div style={{ display: "flex", alignItems: "center", gap: 40, opacity: ramp(f, at("пациента") - 6, 12) }}>
            <Mono size={30} color={C.fg}>научила ИИ помнить</Mono>
            <Pop at={at("пациента") - 4}><Pill size={40} color={C.green}>пациента</Pill></Pop>
            <Pop at={at("врача") - 4}><Pill size={40} color={C.violet}>и врача</Pill></Pop>
          </div>
        </Center>
        <At x={W / 2} y={790} style={{ opacity: goDemo }}>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: C.red, boxShadow: `0 0 ${20 + 14 * Math.sin(f / 5)}px ${C.red}`, opacity: 0.6 + 0.4 * Math.sin(f / 5) }} />
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 64, color: C.fg, whiteSpace: "nowrap" }}>Сейчас покажем</div>
            <Pill size={34} color={C.red}>LIVE DEMO</Pill>
          </div>
        </At>
      </AbsoluteFill>
      <Ring at={brand} x={W / 2} y={H / 2} color={C.cyan} size={2000} dur={34} />
      <Flash at={brand} color={C.cyan} strength={0.55} />
    </Shell>
  );
};
