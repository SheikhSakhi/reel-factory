import { createContext, useContext } from "react";
import { wordFrame, type VoScene, type VoTake } from "../../kit";

/**
 * One reel, two languages. Scene code keys its word anchors and on-screen text by the
 * Russian original; a language swaps in its own take, anchors and strings.
 */
export type Lang = {
  readonly id: "ru" | "en";
  readonly take: VoTake;
  readonly captions: VoTake;
  /** "S2:триллионов:0" → ["trillion", 0]. Absent for the original language. */
  readonly anchors?: Readonly<Record<string, readonly [string, number]>>;
  /** Russian on-screen string → translation. Absent for the original language. */
  readonly text?: Readonly<Record<string, string>>;
  readonly music: string;
  readonly keepTogether: readonly string[];
};

const LangContext = createContext<Lang | null>(null);
export const LangProvider = LangContext.Provider;

export const useLang = (): Lang => {
  const lang = useContext(LangContext);
  if (!lang) throw new Error("agent-bank: scene rendered outside <LangProvider>");
  return lang;
};

/** Absolute frame of an anchor word, written as the Russian token + occurrence. */
export const frameOf = (lang: Lang, sceneId: string, token: string, occurrence = 0): number => {
  if (!lang.anchors) return wordFrame(lang.take, sceneId, token, occurrence);
  const key = `${sceneId}:${token}:${occurrence}`;
  const hit = lang.anchors[key];
  if (!hit) throw new Error(`agent-bank ${lang.id}: no anchor for ${key}`);
  return wordFrame(lang.take, sceneId, hit[0], hit[1]);
};

/** Scene-relative frame lookup: at("триллионов"), at("агент", 1). */
export const useAt = (s: VoScene) => {
  const lang = useLang();
  return (token: string, occurrence = 0): number => frameOf(lang, s.id, token, occurrence) - s.from;
};

/** On-screen text in the current language. Throws on a missing translation so nothing ships in Russian by accident. */
export const useT = () => {
  const lang = useLang();
  return (ru: string): string => {
    if (!lang.text) return ru;
    const out = lang.text[ru];
    if (out === undefined) throw new Error(`agent-bank ${lang.id}: missing text for "${ru}"`);
    return out;
  };
};

export const EN_TEXT: Readonly<Record<string, string>> = {
  // chapters
  "экономика ии-агентов": "the AI agent economy",
  "прогноз на 2030": "forecast for 2030",
  "волна уже идёт": "the wave is here",
  "три волны": "three waves",
  "проблема": "the problem",
  "решение": "the solution",
  "доверие": "trust",
  "экономика агентов": "the agent economy",
  "2030": "2030",
  "условие: память": "the condition: memory",
  "гонка за память": "the race for memory",
  "источник": "source",
  // S1
  "Экономика *ИИ-агентов*": "The *AI agent* economy",
  " млрд": "B",
  "↗ рост ≈45% в год": "↗ growth ≈45% a year",
  // S2
  "К *2030* году": "By *2030*",
  "рынок агентов ≈ $8 млрд": "agent market ≈ $8B",
  "до": "up to",
  "$5 трлн": "$5T",
  "через агентов пройдёт…": "flowing through agents…",
  "покупок пройдёт через агентов": "in purchases through agents",
  // S3
  "ЭТО НЕ ПРОГНОЗ": "NOT A FORECAST",
  "агент": "agent",
  "платёжная сеть": "payment network",
  "оплачено агентом": "paid by an agent",
  "ожидание…": "pending…",
  "первые покупки агентов · Гонконг · Таиланд": "first agent purchases · Hong Kong · Thailand",
  // S4
  "вычислительные мощности": "compute",
  "Модели": "Models",
  "возможность строить сервисы": "the power to build services",
  "Агенты": "Agents",
  "новые гиганты": "new giants",
  "Чьими *деньгами* будут платить агенты?": "Whose *money* will agents pay with?",
  // S5
  "Сегодня *вашими.*": "Today, *yours.*",
  "ВАША КАРТА": "YOUR CARD",
  "заказ агента": "agent order",
  "Подтвердите оплату картой": "Confirm your card payment",
  "МОШЕННИКИ": "SCAM",
  // S6
  "Новой экономике нужны *новые финансовые инструменты*": "A new economy needs *new financial instruments*",
  "свой счёт": "own account",
  "своя карта": "own card",
  "ваш лимит": "your limit",
  "потрачено": "spent",
  "лимит $430": "limit $430",
  // S7
  "агент оформил": "agent booked",
  "предложено": "offered",
  "Каждый счёт *застрахован*": "Every account is *insured*",
  "от мошенников": "against fraud",
  "от ошибок агента": "against agent mistakes",
  "При каждой покупке: *настоящий страховой продукт*": "With every purchase: *a real insurance product*",
  "Запись к врачу": "Doctor's appointment",
  "Приём терапевта": "GP visit",
  "Медицинская страховка": "Health insurance",
  "Авиабилеты": "Flight tickets",
  "Сеул → Дели, 2 места": "Seoul → Delhi, 2 seats",
  "Туристическая страховка": "Travel insurance",
  // S8
  "$ платёж": "$ payment",
  "покупка": "purchase",
  "продажа": "sale",
  "Агенты платят *друг другу*": "Agents pay *each other*",
  "ваш агент": "your agent",
  "агент клиники": "clinic agent",
  "агент страховой": "insurer agent",
  "запись": "booking",
  "счёт": "bill",
  "✓ оплачено": "✓ paid",
  "звонки": "calls",
  "бумаги": "paperwork",
  "*Миллиарды* таких сделок": "*Billions* of deals like this",
  "Новый *океан* денег": "A new *ocean* of money",
  // S9
  "К *2030* году лучший банк": "By *2030,* the best bank",
  "банк для агентов": "a bank for agents",
  "Но есть одно условие.": "But there's one condition.",
  // S10
  "Чтобы этим сделкам *можно было доверять*": "For these deals to be *trusted*",
  "агент помнит своего владельца": "the agent remembers its owner",
  "Деньги доверяют агенту, который *помнит*": "Money trusts the agent that *remembers*",
  "Сегодняшний ИИ *не помнит* всего": "Today's AI *doesn't remember* everything",
  "Гиганты дали лишь *блокнот*": "The giants gave it just a *notebook*",
  "профиль пользователя": "user profile",
  "несколько фактов": "a few facts",
  "история": "history",
  "истории нет": "no history",
  "Имя: Анна": "Name: Anna",
  "Город: Сеул": "City: Seoul",
  "Любит кофе": "Likes coffee",
  "2019 · аллергия на пенициллин": "2019 · penicillin allergy",
  "2021 · переезд, новая клиника": "2021 · moved, new clinic",
  "2022 · давление 150/95": "2022 · blood pressure 150/95",
  "2023 · начата терапия": "2023 · treatment started",
  "2024 · отказ от перелёта: врач": "2024 · flight declined: doctor",
  "2025 · норма, доза снижена": "2025 · normal, dose lowered",
  "2026 · плановый контроль": "2026 · routine check-up",
  // S11
  "Гонка за *настоящую память*": "The race for *real memory*",
  "Большие игроки строят *дата-центры*": "Big players build *data centers*",
  "Прорыв будет *технологическим*": "The breakthrough will be *technological*",
  "И начнётся он с *истории болезни*": "And it starts with *medical history*",
  // S12
  "Если ИИ можно доверить *историю болезни*": "If AI can be trusted with *medical history*",
  "ему можно доверить и *кошелёк*": "it can be trusted with your *wallet*",
  "команда": "the team",
  "научила ИИ помнить": "taught AI to remember",
  "пациента": "the patient",
  "и врача": "and the doctor",
  "Сейчас покажем": "Let us show you",
};
