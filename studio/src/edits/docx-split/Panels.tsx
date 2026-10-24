import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Activity, CalendarCheck, Stethoscope, User } from "lucide";
import {
  DrawIcon, DrawPath, Label, Multiply, PanelBackdrop, PaperCard, SketchCircle, Stamp,
  pop, usePanel, usePanelAt, type Panels,
} from "../../kit";

// Example explainer: DocX in five panels, drawn in code and timed to the spoken words.

const S1: React.FC = () => {
  const { theme } = usePanel();
  const doctor = usePanelAt("S1:врач");
  const many = usePanelAt("S1:три");
  const crazy = usePanelAt("S1:безумие");
  return (
    <PanelBackdrop>
      <div style={{ position: "absolute", left: 70, top: 250, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <DrawIcon icon={Stethoscope} size={220} color={theme.fg} at={doctor} strokeWidth={1.3} />
        <Label text="1 врач" at={doctor + 10} size={64} />
      </div>
      <div style={{ position: "absolute", left: 400, top: 190 }}>
        <Multiply cols={10} rows={6} cell={50} gap={10} at={many} spread={26}>
          <DrawIcon icon={User} size={50} color={theme.accent} at={0} duration={1} strokeWidth={2} />
        </Multiply>
      </div>
      <Label text="3 000 пациентов" at={usePanelAt("S1:тысячи")} size={64} color={theme.accent}
        style={{ position: "absolute", left: 470, top: 700 }} />
      <SketchCircle x={395} y={180} w={600} h={500} color="#F3C64B" at={crazy} seed="crazy" />
    </PanelBackdrop>
  );
};

// A heart trace that beats at a visit, goes flat between visits, and beats again.
const FLAT_ECG = "M 120 900 L 200 900 L 225 840 L 250 960 L 275 900 L 805 900 L 830 840 L 855 960 L 880 900 L 960 900";

const S2: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const sees = usePanelAt("S2:видит");
  const months = usePanelAt("S2:месяцев");
  const silence = usePanelAt("S2:тишина");
  const quiet = interpolate(f, [silence, silence + 20], [1, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <PanelBackdrop>
      <Label text="Обычный путь пациента" at={0} size={58} style={{ position: "absolute", top: 420, width: "100%", textAlign: "center" }} />
      <div style={{ position: "absolute", left: 150, top: 640 }}><DrawIcon icon={CalendarCheck} size={150} color={theme.fg} at={sees} /></div>
      <div style={{ position: "absolute", left: 780, top: 640 }}><DrawIcon icon={CalendarCheck} size={150} color={theme.fg} at={months} /></div>
      <Label text="визит" at={sees + 8} size={36} font="mono" color={theme.muted} style={{ position: "absolute", left: 175, top: 1000 }} />
      <Label text="визит" at={months + 8} size={36} font="mono" color={theme.muted} style={{ position: "absolute", left: 805, top: 1000 }} />
      <div style={{ position: "absolute", left: 0, top: 0, opacity: quiet }}>
        <DrawPath d={FLAT_ECG} viewBox="0 0 1080 1920" width={1080} height={1920} color={theme.accent} at={sees} duration={months - sees + 10}
          strokeWidth={6} glow />
      </div>
      <Label text="несколько месяцев" at={usePanelAt("S2:несколько")} size={44} italic font="display" color={theme.fg}
        style={{ position: "absolute", top: 1060, width: "100%", textAlign: "center" }} />
      <SketchCircle x={330} y={850} w={420} h={100} color="#F3C64B" at={silence} seed="silence" />
      <Label text="тишина" at={silence + 6} size={110} italic font="display" color="#F3C64B"
        style={{ position: "absolute", top: 1130, width: "100%", textAlign: "center" }} />
    </PanelBackdrop>
  );
};

const S3: React.FC = () => {
  const { theme } = usePanel();
  const plan = usePanelAt("S3:план");
  return (
    <PanelBackdrop>
      <Label text="DocX" at={0} size={72} color={theme.accent} style={{ position: "absolute", left: 80, top: 200 }} />
      <Label text={"лечение\n→ план"} at={usePanelAt("S3:превращает")} size={46} font="body" weight={600}
        style={{ position: "absolute", left: 80, top: 300, whiteSpace: "pre-line", lineHeight: 1.3 }} />
      <div style={{ position: "absolute", right: 70, top: 160 }}>
        <PaperCard title="План лечения" at={plan} width={600} accent={theme.accent} tilt={2} rows={[
          { text: "Цели", at: usePanelAt("S3:цели") },
          { text: "Задачи", right: "ежедневно", at: usePanelAt("S3:задачи") },
          { text: "Показатели", right: "давление", at: usePanelAt("S3:показатели"),
            mark: { at: usePanelAt("S3:показатели") + 12, color: theme.accent } },
        ]} />
      </div>
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
      <div style={{ position: "absolute", left: 80, top: 190, display: "flex", alignItems: "center", gap: 20 }}>
        <DrawIcon icon={Activity} size={70} color={theme.accent} at={0} />
        <Label text="ИИ следит за каждым" at={4} size={50} font="body" weight={700} />
      </div>
      <div style={{ position: "absolute", left: 140, top: 330, display: "grid", gridTemplateColumns: "repeat(8, 100px)", rowGap: 40 }}>
        {Array.from({ length: 24 }, (_, i) => {
          const appear = pop(f, watch + i * 1.2, 14);
          const hot = WATCH.includes(i);
          const up = hot ? pop(f, lift + WATCH.indexOf(i) * 5, 12) : 0;
          return (
            <div key={i} style={{ opacity: f < watch + i * 1.2 ? 0 : appear, transform: `translateY(${-30 * up}px) scale(${1 + 0.25 * up})` }}>
              <svg width={70} height={70} viewBox="0 0 24 24">
                <circle cx={12} cy={8} r={4} fill={hot && up > 0.1 ? theme.accent : `${theme.fg}55`} />
                <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" fill={hot && up > 0.1 ? theme.accent : `${theme.fg}55`} />
              </svg>
            </div>
          );
        })}
      </div>
      {WATCH.map((i, k) => (
        <SketchCircle key={i} x={140 + (i % 8) * 100 - 6} y={330 + Math.floor(i / 8) * 110 - 36} w={80} h={84}
          color="#F3C64B" at={lift + 10 + k * 5} seed={`w${i}`} width={5} />
      ))}
      <Label text="только тем, кому нужна помощь" at={usePanelAt("S4:помощь")} size={40} italic font="display" color="#F3C64B"
        style={{ position: "absolute", top: 760, width: "100%", textAlign: "center" }} />
    </PanelBackdrop>
  );
};

const S5: React.FC = () => {
  const { theme } = usePanel();
  const queue = usePanelAt("S5:очередь");
  const cards = usePanelAt("S5:300");
  return (
    <PanelBackdrop>
      <div style={{ position: "absolute", left: 60, top: 230 }}>
        <Multiply cols={4} rows={3} cell={78} gap={12} at={cards - 12} spread={8}>
          <div style={{ width: 78, height: 104, borderRadius: 8, background: "#E8E0D0", boxShadow: "0 6px 14px rgba(0,0,0,0.4)" }} />
        </Multiply>
      </div>
      <Label text="300 карт" at={cards} size={44} font="mono" color={theme.muted} style={{ position: "absolute", left: 120, top: 640 }} />
      <div style={{ position: "absolute", left: 90, top: 380 }}>
        <Stamp text="нет" color="#E0533D" at={usePanelAt("S5:карт") + 4} size={70} />
      </div>
      <div style={{ position: "absolute", right: 60, top: 170 }}>
        <PaperCard title="Очередь" at={queue} width={520} accent={theme.accent} tilt={-1} rows={[
          { text: "Пациент А", right: "давление ↑", at: queue + 6, mark: { at: queue + 14, color: "#E0533D" } },
          { text: "Пациент Б", right: "пропустил", at: queue + 10, mark: { at: queue + 20, color: "#E2A33B" } },
          { text: "Пациент В", right: "вопрос", at: queue + 14 },
        ]} />
      </div>
    </PanelBackdrop>
  );
};

export const panels: Panels = { S1, S2, S3, S4, S5 };
