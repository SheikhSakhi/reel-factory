import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { Stethoscope } from "lucide";
import {
  DrawArt, DrawIcon, Label, Multiply, PanelBackdrop, PaperCard, PathMotion, PathTrail, SketchCircle, Stamp,
  EASE_OUT, pop, progress, usePanel, usePanelAt, type Art, type Panels,
} from "../../kit";

// Example explainer in the "blueprint" style: ghost drawings that come alive on the spoken word,
// a pen sweep, gradient fills and glow, a zoom-out multiplication, an envelope reveal.

const GOLD = "#F2C14E";

// A stylised heart in the same shape scripts/lineart.py produces (outline first, then details).
const HEART: Art = {
  width: 420, height: 440,
  strokes: [
    { kind: "outline", x0: 70, x1: 360, d: "M 210 150 C 160 100 70 110 70 200 C 70 290 160 350 230 410 C 300 340 360 280 360 200 C 360 120 280 100 240 140 Z" },
    { kind: "detail", x0: 215, x1: 345, d: "M 215 150 C 210 90 230 50 280 50 C 330 50 345 90 330 120" },
    { kind: "detail", x0: 245, x1: 318, d: "M 245 150 C 245 105 260 80 285 80 C 310 80 318 100 310 118" },
    { kind: "detail", x0: 252, x1: 256, d: "M 255 52 L 252 20" },
    { kind: "detail", x0: 285, x1: 290, d: "M 285 50 L 290 18" },
    { kind: "detail", x0: 312, x1: 325, d: "M 312 58 L 325 28" },
    { kind: "detail", x0: 110, x1: 175, d: "M 175 160 C 165 120 140 100 110 100" },
    { kind: "detail", x0: 215, x1: 233, d: "M 230 170 C 215 230 225 300 232 380" },
    { kind: "detail", x0: 230, x1: 320, d: "M 230 220 C 270 230 300 260 320 290" },
  ],
};

/** A small patient card (avatar + two lines), the unit that multiplies. */
const PatientCard: React.FC<{ size: number }> = ({ size }) => {
  const { theme } = usePanel();
  return (
    <div style={{ width: size, height: size * 1.25, borderRadius: size * 0.12, background: theme.surface, border: `2px solid ${theme.accent}55`,
      display: "flex", flexDirection: "column", alignItems: "center", paddingTop: size * 0.14, boxSizing: "border-box", gap: size * 0.08 }}>
      <div style={{ width: size * 0.36, height: size * 0.36, borderRadius: "50%", background: `${theme.accent}AA` }} />
      <div style={{ width: size * 0.6, height: size * 0.07, borderRadius: 4, background: `${theme.fg}55` }} />
      <div style={{ width: size * 0.42, height: size * 0.07, borderRadius: 4, background: `${theme.fg}33` }} />
    </div>
  );
};

const S1: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const doctor = usePanelAt("S1:врач");
  const three = usePanelAt("S1:три");
  const thousand = usePanelAt("S1:тысячи");
  const crazy = usePanelAt("S1:безумие");
  // Zoom out: a few big cards, then they shrink away as a crowd of small ones pops up.
  const out = interpolate(f, [thousand, thousand + 12], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <PanelBackdrop>
      <Label text="1 врач" at={doctor} size={58} color={theme.accent} style={{ position: "absolute", left: 70, top: 120 }} />
      <div style={{ position: "absolute", left: 60, top: 230 }}>
        <DrawIcon icon={Stethoscope} size={230} color={theme.fg} at={doctor - 4} duration={20} strokeWidth={1.2} />
      </div>
      <Label text="3 000 пациентов" at={thousand} size={50} italic color={theme.fg} style={{ position: "absolute", right: 70, top: 128 }} />
      <div style={{ position: "absolute", left: 400, top: 270, opacity: out, transform: `scale(${1 + (1 - out) * 0.6})`, transformOrigin: "60% 40%" }}>
        <Multiply cols={3} rows={2} cell={150} gap={22} at={three} spread={6} order="random"><PatientCard size={150} /></Multiply>
      </div>
      <div style={{ position: "absolute", left: 360, top: 240 }}>
        <Multiply cols={13} rows={7} cell={42} gap={8} at={thousand + 4} spread={18} order="random"><PatientCard size={42} /></Multiply>
      </div>
      <SketchCircle x={660} y={120} w={340} h={70} color={GOLD} at={crazy} seed="crazy" />
    </PanelBackdrop>
  );
};

// Heartbeat at a visit, a long flat line between visits, a heartbeat at the next visit.
const ECG = "M 90 1200 L 190 1200 L 215 1130 L 245 1270 L 270 1200 L 810 1200 L 835 1130 L 865 1270 L 890 1200 L 990 1200";

const S2: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const usually = usePanelAt("S2:обычно");
  const sees = usePanelAt("S2:видит");
  const months = usePanelAt("S2:месяцев");
  const between = usePanelAt("S2:между");
  const silence = usePanelAt("S2:тишина");
  const dim = interpolate(f, [silence, silence + 18], [1, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <PanelBackdrop>
      <div style={{ position: "absolute", left: 250, top: 330 }}>
        <DrawArt art={HEART} width={580} color={theme.fg} outlineColor={theme.accent} fillColor={theme.accent} at={usually} sweep={18} />
      </div>
      <Label text="визит" at={sees} size={44} color={theme.accent} style={{ position: "absolute", left: 160, top: 1050 }} />
      <Label text="визит" at={months} size={44} color={theme.accent} style={{ position: "absolute", left: 790, top: 1050 }} />
      <div style={{ opacity: dim }}>
        <PathTrail d={ECG} color={theme.accent} at={sees} duration={between - sees + 20} width={5} />
        <PathMotion d={ECG} at={sees} duration={between - sees + 20} rotate={false}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: theme.fg, boxShadow: `0 0 24px 8px ${theme.accent}` }} />
        </PathMotion>
      </div>
      <Label text="несколько месяцев" at={usePanelAt("S2:несколько")} size={40} italic color={theme.muted}
        style={{ position: "absolute", top: 1300, width: "100%", textAlign: "center" }} />
      <SketchCircle x={300} y={1165} w={490} h={70} color={GOLD} at={silence} seed="silence" />
    </PanelBackdrop>
  );
};

/** A dark envelope; the plan card slides up out of it and a seal stamps on. */
const S3: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const plan = usePanelAt("S3:план");
  const metrics = usePanelAt("S3:показатели");
  const rise = interpolate(f, [plan - 6, plan + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });
  const seal = pop(f, metrics + 14, 9);
  return (
    <PanelBackdrop>
      <Label text="DocX" at={0} size={60} color={theme.accent} style={{ position: "absolute", left: 70, top: 110 }} />
      <Label text="лечение → план" at={usePanelAt("S3:превращает")} size={42} italic color={theme.fg} style={{ position: "absolute", right: 70, top: 122 }} />
      <div style={{ position: "absolute", left: 230, top: 470 - rise * 280, opacity: progress(f, plan - 8, 6) }}>
        <PaperCard title="План лечения" at={plan - 8} width={620} accent="#9C2B2B" tilt={0} rows={[
          { text: "Цели", at: usePanelAt("S3:цели") },
          { text: "Задачи", right: "каждый день", at: usePanelAt("S3:задачи") },
          { text: "Показатели", right: "давление", at: metrics, mark: { at: metrics + 6, color: "#9C2B2B" } },
        ]} />
      </div>
      <div style={{ position: "absolute", left: 200, top: 560, width: 680, height: 300, borderRadius: 18, background: "#1B1F33",
        boxShadow: "0 -10px 40px rgba(0,0,0,0.45)", clipPath: "polygon(0 0, 50% 38%, 100% 0, 100% 100%, 0 100%)", opacity: progress(f, 0, 8) }} />
      <div style={{ position: "absolute", left: 495, top: 650, width: 90, height: 90, borderRadius: "50%", background: "#C0392B",
        display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontDisplay, fontSize: 52, color: "#F6E7D8",
        opacity: Math.min(1, seal * 1.5), transform: `scale(${1.6 - 0.6 * seal})`, boxShadow: "0 6px 18px rgba(0,0,0,0.5)" }}>D</div>
    </PanelBackdrop>
  );
};

const WATCH = [3, 13, 20];

const S4: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const watch = usePanelAt("S4:следит");
  const lift = usePanelAt("S4:поднимает");
  return (
    <PanelBackdrop>
      <Label text="ИИ" at={0} size={60} color={theme.accent} style={{ position: "absolute", left: 70, top: 110 }} />
      <Label text="следит за каждым" at={watch} size={42} italic color={theme.fg} style={{ position: "absolute", right: 70, top: 122 }} />
      <div style={{ position: "absolute", left: 120, top: 270, display: "grid", gridTemplateColumns: "repeat(8, 105px)", rowGap: 38 }}>
        {Array.from({ length: 24 }, (_, i) => {
          // Ghosts from the start; a scan sweeps left to right and lights each one up.
          const lit = progress(f, watch + (i % 8) * 2 + random(`s${i}`) * 3, 8);
          const hot = WATCH.includes(i);
          const up = hot ? pop(f, lift + WATCH.indexOf(i) * 5, 12) : 0;
          const color = hot && up > 0.1 ? GOLD : theme.fg;
          return (
            <div key={i} style={{ opacity: 0.18 + 0.82 * lit, transform: `translateY(${-28 * up}px) scale(${1 + 0.25 * up})` }}>
              <svg width={72} height={72} viewBox="0 0 24 24">
                <circle cx={12} cy={8} r={4} fill="none" stroke={color} strokeWidth={1.4} />
                <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
              </svg>
            </div>
          );
        })}
      </div>
      {WATCH.map((i, k) => (
        <SketchCircle key={i} x={120 + (i % 8) * 105 - 6} y={270 + Math.floor(i / 8) * 110 - 34} w={84} h={84}
          color={GOLD} at={lift + 10 + k * 5} seed={`w${i}`} width={5} />
      ))}
    </PanelBackdrop>
  );
};

const S5: React.FC = () => {
  const { theme } = usePanel();
  const queue = usePanelAt("S5:очередь");
  const cards = usePanelAt("S5:300");
  return (
    <PanelBackdrop>
      <Label text="300 карт" at={cards} size={46} color={theme.muted} style={{ position: "absolute", left: 80, top: 110 }} />
      <Label text="1 очередь" at={queue} size={46} color={theme.accent} style={{ position: "absolute", right: 80, top: 110 }} />
      <div style={{ position: "absolute", left: 50, top: 220 }}>
        <Multiply cols={7} rows={6} cell={50} gap={8} at={cards - 10} spread={14} order="random">
          <div style={{ width: 50, height: 64, borderRadius: 6, background: "#D9D3C4", opacity: 0.8 }} />
        </Multiply>
      </div>
      <div style={{ position: "absolute", left: 130, top: 430 }}>
        <Stamp text="нет" color="#E0533D" at={usePanelAt("S5:карт") + 4} size={76} />
      </div>
      <div style={{ position: "absolute", right: 60, top: 220 }}>
        <PaperCard title="Очередь" at={queue} width={500} accent="#9C2B2B" tilt={-1} rows={[
          { text: "Пациент А", right: "давление ↑", at: queue + 6, mark: { at: queue + 14, color: "#E0533D" } },
          { text: "Пациент Б", right: "пропустил", at: queue + 10, mark: { at: queue + 20, color: GOLD } },
          { text: "Пациент В", right: "вопрос", at: queue + 14 },
        ]} />
      </div>
    </PanelBackdrop>
  );
};

export const panels: Panels = { S1, S2, S3, S4, S5 };
