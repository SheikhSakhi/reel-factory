import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Captions, scene, VoiceOver, wordFrame, type VoScene } from "../../kit";
import { S1, S2, S3, S4, S5, S6 } from "./scenes1";
import { S7, S8, S9, S10, S11, S12 } from "./scenes2";
import { C, F, H, W, useReelFonts } from "./style";
import { captionTake, TAKE } from "./take";
import { Cues, Sweep, World, type Cue, type Mood } from "./ui";

export const AGENT_BANK_DURATION = TAKE.totalFrames;
export const AGENT_BANK_SIZE = { width: W, height: H } as const;

const SCENES: Record<string, React.FC<{ s: VoScene }>> = { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12 };

// Background mood per scene: glow colors, darkness, grid floor visibility.
const MOODS: Record<string, Mood> = {
  S1: { glow: C.cyan, glow2: C.violet, dark: 0.1, grid: 1 },
  S2: { glow: C.gold, glow2: C.cyan, dark: 0, grid: 1 },
  S3: { glow: C.cyan, glow2: C.green, dark: 0.05, grid: 1 },
  S4: { glow: C.violet, glow2: C.cyan, dark: 0, grid: 1 },
  S5: { glow: C.red, glow2: "#5a0f2a", dark: 0.15, grid: 0.4 },
  S6: { glow: C.cyan, glow2: C.gold, dark: 0, grid: 1 },
  S7: { glow: C.green, glow2: C.cyan, dark: 0, grid: 1 },
  S8: { glow: C.gold, glow2: C.cyan, dark: 0, grid: 1 },
  S9: { glow: C.cyan, glow2: C.gold, dark: 0.1, grid: 0.8 },
  S10: { glow: C.violet, glow2: "#1b2a6b", dark: 0.25, grid: 0.3 },
  S11: { glow: C.cyan, glow2: C.red, dark: 0.15, grid: 0.6 },
  S12: { glow: C.cyan, glow2: C.green, dark: 0, grid: 1 },
};

const mix = (a: string, b: string, t: number): string => `color-mix(in srgb, ${a} ${Math.round((1 - t) * 100)}%, ${b})`;

const useMood = (): Mood => {
  const f = useCurrentFrame();
  const i = TAKE.scenes.findIndex((s) => f >= s.from && f < s.to);
  const cur = TAKE.scenes[Math.max(0, i)];
  const next = TAKE.scenes[Math.min(TAKE.scenes.length - 1, Math.max(0, i) + 1)];
  const a = MOODS[cur.id];
  const b = MOODS[next.id];
  const t = interpolate(f, [cur.to - 15, cur.to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // "Но есть одно условие": the lights go out.
  const lightsOut = interpolate(f, [wordFrame(TAKE, "S9", "Но") - 4, wordFrame(TAKE, "S9", "Но") + 6, scene(TAKE, "S10").from + 20], [0, 0.85, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return {
    glow: mix(a.glow, b.glow, t), glow2: mix(a.glow2, b.glow2, t),
    dark: Math.max(a.dark + (b.dark - a.dark) * t, lightsOut), grid: a.grid + (b.grid - a.grid) * t,
  };
};

const w = (id: string, token: string, occurrence = 0): number => wordFrame(TAKE, id, token, occurrence);
const sceneIn = (id: string): number => scene(TAKE, id).from;

// Sound design: every cue lands on a spoken word.
const CUES: readonly Cue[] = [
  // S1 numbers
  { at: w("S1", "экономика") - 2, sound: "swoosh", volume: 0.35 },
  ...[0, 3, 6, 9, 12, 15].map((k) => ({ at: w("S1", "пяти") - 4 + k, sound: "tick", volume: 0.35 })),
  { at: w("S1", "миллиардов"), sound: "blip", volume: 0.4 },
  ...[0, 3, 6, 9, 12].map((k) => ({ at: w("S1", "восемь") - 6 + k, sound: "tick", volume: 0.35 })),
  { at: w("S1", "восемь") + 8, sound: "coin", volume: 0.35 },
  { at: w("S1", "Рост"), sound: "riser", volume: 0.25 },
  { at: w("S1", "Рост") + 8, sound: "ping", volume: 0.4 },
  // S2 trillions
  { at: sceneIn("S2") + 4, sound: "swoosh", volume: 0.35 },
  { at: w("S2", "триллионов"), sound: "impact", volume: 0.55 },
  { at: w("S2", "триллионов"), sound: "coin", volume: 0.3 },
  // S3 already real
  { at: w("S3", "прогноз"), sound: "stamp", volume: 0.7 },
  { at: w("S3", "агент") - 4, sound: "node", volume: 0.4 },
  { at: w("S3", "агент") + 6, sound: "swipe", volume: 0.5 },
  { at: w("S3", "Мастеркард"), sound: "coin", volume: 0.55 },
  // S4 waves
  { at: w("S4", "Графические") - 2, sound: "swoosh", volume: 0.35 },
  { at: w("S4", "Фундаментальные") - 2, sound: "swoosh", volume: 0.35 },
  { at: w("S4", "Волна") - 4, sound: "riser", volume: 0.3 },
  { at: w("S4", "гигантов") - 4, sound: "stamp", volume: 0.45 },
  { at: w("S4", "Но") - 4, sound: "swoosh", volume: 0.4 },
  { at: w("S4", "деньгами"), sound: "coin", volume: 0.4 },
  // S5 problem
  { at: w("S5", "вашими"), sound: "stamp", volume: 0.6 },
  { at: w("S5", "четыре"), sound: "blip", volume: 0.4 },
  { at: w("S5", "сорок") - 4, sound: "error", volume: 0.45 },
  ...[0, 2, 4, 6, 8, 10, 12].map((k) => ({ at: w("S5", "сорок") + k * 2, sound: "tick", volume: 0.3 })),
  { at: w("S5", "Или"), sound: "swoosh", volume: 0.35 },
  { at: w("S5", "мошенников"), sound: "glitch", volume: 0.45 },
  { at: w("S5", "мошенников") + 2, sound: "crack", volume: 0.5 },
  // S6 instruments
  { at: w("S6", "инструменты"), sound: "ping", volume: 0.35 },
  { at: w("S6", "каждого"), sound: "swipe", volume: 0.55 },
  { at: w("S6", "счёт") - 2, sound: "node", volume: 0.35 },
  { at: w("S6", "карта") - 2, sound: "node", volume: 0.35 },
  { at: w("S6", "лимит") - 2, sound: "node", volume: 0.35 },
  { at: w("S6", "лимит") + 4, sound: "riser", volume: 0.2 },
  // S7 insurance
  { at: w("S7", "застрахован") - 4, sound: "shield", volume: 0.55 },
  { at: w("S7", "мошенников") - 2, sound: "blip", volume: 0.4 },
  { at: w("S7", "ошибок") - 2, sound: "blip", volume: 0.4 },
  { at: w("S7", "А") - 6, sound: "swoosh", volume: 0.35 },
  { at: w("S7", "Записал") - 4, sound: "swipe", volume: 0.4 },
  { at: w("S7", "медицинскую"), sound: "ping", volume: 0.5 },
  { at: w("S7", "Купил") - 4, sound: "swipe", volume: 0.4 },
  { at: w("S7", "туристическую"), sound: "ping", volume: 0.5 },
  // S8 network
  { at: w("S8", "платить") - 6, sound: "blip", volume: 0.4 },
  { at: w("S8", "покупать") - 6, sound: "blip", volume: 0.4 },
  { at: w("S8", "продавать") - 6, sound: "blip", volume: 0.4 },
  { at: w("S8", "Ваш") - 2, sound: "node", volume: 0.45 },
  { at: w("S8", "агент", 1) - 2, sound: "node", volume: 0.45 },
  { at: w("S8", "агент", 2) - 2, sound: "node", volume: 0.45 },
  { at: w("S8", "записывает") - 2, sound: "swoosh", volume: 0.3 },
  { at: w("S8", "выставляет") - 2, sound: "swoosh", volume: 0.3 },
  { at: w("S8", "оплачивает") + 14, sound: "coin", volume: 0.5 },
  { at: w("S8", "Ни"), sound: "stamp", volume: 0.4 },
  { at: w("S8", "бумаги"), sound: "stamp", volume: 0.4 },
  { at: w("S8", "Таких") - 4, sound: "swoosh", volume: 0.4 },
  ...[0, 4, 8, 12, 16, 20, 24, 28].map((k) => ({ at: w("S8", "миллиарды") - 6 + k, sound: "blip", volume: 0.18 })),
  { at: w("S8", "океан"), sound: "coin", volume: 0.4 },
  // S9 bank, lights out
  { at: w("S9", "банк") - 4, sound: "swoosh", volume: 0.35 },
  { at: w("S9", "агентов"), sound: "ping", volume: 0.4 },
  ...Array.from({ length: 12 }, (_, k) => ({ at: w("S9", "Но") + k * 3, sound: "tick", volume: 0.25 })),
  // S10 memory
  { at: w("S10", "агент") - 4, sound: "node", volume: 0.4 },
  { at: w("S10", "владельца") - 4, sound: "node", volume: 0.4 },
  { at: w("S10", "Деньги"), sound: "swoosh", volume: 0.3 },
  { at: w("S10", "помнит"), sound: "shield", volume: 0.35 },
  { at: w("S10", "помнит", 1), sound: "glitch", volume: 0.2 },
  { at: w("S10", "блокнот") - 4, sound: "swipe", volume: 0.4 },
  ...[0, 5, 10].map((k) => ({ at: w("S10", "фактов") - 8 + k, sound: "blip", volume: 0.35 })),
  { at: w("S10", "историю"), sound: "error", volume: 0.35 },
  // S11 race
  { at: w("S11", "гонка") - 8, sound: "swoosh", volume: 0.45 },
  { at: w("S11", "Большие") - 4, sound: "hum", volume: 0.5 },
  ...Array.from({ length: 10 }, (_, k) => ({ at: w("S11", "Большие") - 4 + k * 3, sound: "stamp", volume: 0.18 })),
  { at: w("S11", "А") + 2, sound: "impact", volume: 0.35 },
  { at: w("S11", "И"), sound: "shield", volume: 0.4 },
  { at: w("S11", "болезни"), sound: "ping", volume: 0.35 },
  // S12 Treint
  { at: w("S12", "ему") - 4, sound: "swoosh", volume: 0.35 },
  { at: w("S12", "кошелёк") - 4, sound: "coin", volume: 0.45 },
  { at: w("S12", "Треинт") - 2, sound: "logo", volume: 0.7 },
  { at: w("S12", "пациента") - 4, sound: "node", volume: 0.35 },
  { at: w("S12", "врача") - 4, sound: "node", volume: 0.35 },
  { at: w("S12", "Сейчас") - 2, sound: "swoosh", volume: 0.35 },
];

const CAPTIONS = captionTake(TAKE);

/** Progress bar along the bottom: the presenter's sense of where we are. */
const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, height: 2, width: `${(f / TAKE.totalFrames) * 100}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.gold})`, opacity: 0.7 }} />
  );
};

export const AgentBankReel: React.FC = () => {
  useReelFonts();
  const mood = useMood();
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: F.body, color: C.fg }}>
      <World mood={mood} />
      {TAKE.scenes.map((s) => {
        const Scene = SCENES[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from} name={s.id}>
            <Scene s={s} />
          </Sequence>
        );
      })}
      {TAKE.scenes.slice(1).map((s) => <Sweep key={`sweep-${s.id}`} at={s.from - 8} />)}
      <Captions take={CAPTIONS} fontFamily={F.body} color={C.fg} accent={C.cyan} fontSize={32} top={960} bottom={1050}
        centerX={W / 2} maxWidth={1500} maxChars={70} keepTogether={["пяти миллиардов долларов", "пяти триллионов долларов"]} />
      <Progress />
      <VoiceOver take={TAKE} />
      <Audio src={staticFile("audio/agent-bank/music.wav")} volume={0.42} />
      <Cues cues={CUES} />
    </AbsoluteFill>
  );
};
