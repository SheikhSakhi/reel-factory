import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { PopCaptions, SfxTrack, VoiceOver, loadTake, pop, progress, scene, wordEnd, wordFrame, type SfxCue } from "../../kit";
import { BRAND } from "../../brand/brand";
import takeJson from "../../../public/vo/2026-10-26-midnight-question/take.json";

// Formats lab F4 (chat drama): night mode, flat phone UI, split-screen twist. One narrator.
const TAKE = loadTake(takeJson);
export const MIDNIGHT_DURATION = TAKE.totalFrames;

const FONT = BRAND.theme.fontBody;
const SERIF = BRAND.theme.fontDisplay;
const C = {
  night: "#0A0F1E", night2: "#121A33", glow: "#3C5BD6", screen: "#0F1526", bubbleMe: "#3D6BFF", bubbleBot: "#1E2740",
  text: "#EEF1FA", dim: "#8C94AD", warn: "#FF6B5A", care: "#22B8A2", amber: "#F2B544",
} as const;

const at = (id: string, word: string, n = 0) => wordFrame(TAKE, id, word, n);
const end = (id: string, word: string, n = 0) => wordEnd(TAKE, id, word, n);
const S = (id: string) => scene(TAKE, id);

const QUESTION = "I've felt dizzy since the new pill. Is that normal?";
const BOT_REPLY = "Dizziness is a common side effect of many medications. Try to rest and drink plenty of water.";
const FOLLOW = "ok, I'll wait for my next appointment";

/** Characters of `text` typed by frame f, from `start` at `cps` characters per second. */
const typed = (f: number, text: string, start: number, cps = 26) => text.slice(0, Math.max(0, Math.floor(((f - start) / 30) * cps)));

const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  const breathe = 0.5 + 0.5 * Math.sin(f / 40);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% ${40 + breathe * 4}%, ${C.night2} 0%, ${C.night} 70%)` }}>
      {/* screen glow on a dark room */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${C.glow}33 0%, transparent 55%)`, opacity: 0.6 + 0.2 * breathe }} />
    </AbsoluteFill>
  );
};

const Bubble: React.FC<{ me?: boolean; text: string; at: number; color?: string; children?: React.ReactNode; width?: number; size?: number }> = ({
  me = false, text, at: start, color, children, width = 680, size = 44,
}) => {
  const f = useCurrentFrame();
  if (f < start) return null;
  const t = pop(f, start, 15);
  return (
    <div style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: width, background: color ?? (me ? C.bubbleMe : C.bubbleBot), color: C.text,
      fontFamily: FONT, fontWeight: 500, fontSize: size, lineHeight: 1.3, padding: "22px 28px", borderRadius: 34,
      borderBottomRightRadius: me ? 10 : 34, borderBottomLeftRadius: me ? 34 : 10, transform: `scale(${0.85 + 0.15 * t})`,
      transformOrigin: me ? "100% 100%" : "0% 100%", opacity: Math.min(1, t * 1.6) }}>
      {text}{children}
    </div>
  );
};

const Dots: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  return (
    <div style={{ alignSelf: "flex-start", background: C.bubbleBot, borderRadius: 34, padding: "26px 30px", display: "flex", gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: C.dim, opacity: 0.4 + 0.6 * Math.abs(Math.sin((f - from) / 6 - i * 0.7)) }} />
      ))}
    </div>
  );
};

/** The bot's reply, with the phrases the narrator quotes lighting up as they are said. */
const BotReply: React.FC<{ start: number }> = ({ start }) => {
  const f = useCurrentFrame();
  const marks: [string, number][] = [["common side effect", at("S3", "Common")], ["rest", at("S3", "Rest.")], ["drink plenty of water", at("S3", "Drink")]];
  let rest = BOT_REPLY;
  const parts: React.ReactNode[] = [];
  marks.forEach(([phrase, when], i) => {
    const idx = rest.toLowerCase().indexOf(phrase);
    parts.push(rest.slice(0, idx));
    const lit = progress(f, when, 8);
    parts.push(
      <span key={i} style={{ background: `linear-gradient(transparent 60%, ${C.amber}${Math.round(lit * 160).toString(16).padStart(2, "0")} 60%)` }}>
        {rest.slice(idx, idx + phrase.length)}
      </span>,
    );
    rest = rest.slice(idx + phrase.length);
  });
  parts.push(rest);
  return <Bubble text="" at={start}>{parts}</Bubble>;
};

const ChatHeader: React.FC<{ title: string; sub: string; color: string; small?: boolean }> = ({ title, sub, color, small }) => (
  <div style={{ display: "flex", alignItems: "center", gap: small ? 16 : 22, padding: small ? "56px 26px 18px" : "70px 40px 24px", borderBottom: `1px solid #FFFFFF14` }}>
    <div style={{ width: small ? 54 : 74, height: small ? 54 : 74, borderRadius: 40, background: color, flexShrink: 0 }} />
    <div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: small ? 30 : 40, color: C.text }}>{title}</div>
      <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: small ? 22 : 28, color: C.dim }}>{sub}</div>
    </div>
  </div>
);

/** S1-S5: one big phone, a general chatbot. */
const ChatbotPhone: React.FC = () => {
  const f = useCurrentFrame();
  const typeStart = end("S1", "night.") + 4;
  const sentAt = S("S2").from + 2;
  const replyAt = at("S3", "answer");
  const followAt = S("S5").from - 6;
  const shrink = progress(f, S("S6").from - 10, 16);
  const draft = f < sentAt ? typed(f, QUESTION, typeStart, 30) : "";
  const followDraft = f >= at("S4", "lowest") && f < followAt ? typed(f, FOLLOW, at("S4", "lowest"), 34) : "";
  const enter = pop(f, 2, 18);
  if (shrink >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 90, top: 150, width: 900, height: 1300, borderRadius: 90, background: "#05070D", padding: 16,
      boxShadow: `0 0 120px ${C.glow}55`, transform: `translateY(${(1 - enter) * 300}px) scale(${1 - shrink * 0.45}) translateX(${-shrink * 520}px)`,
      opacity: 1 - shrink * 0.2 }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 76, background: C.screen, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "absolute", top: 18, left: "50%", width: 170, height: 46, marginLeft: -85, borderRadius: 30, background: "#05070D", zIndex: 2 }} />
        <ChatHeader title="AI Assistant" sub="General chatbot" color="#6E7891" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 22, padding: "0 36px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <Bubble me text={QUESTION} at={sentAt} />
            <Dots from={sentAt + 10} to={replyAt} />
            <BotReply start={replyAt} />
            <Bubble me text={FOLLOW} at={followAt} />
          </div>
        </div>
        <div style={{ margin: "0 26px 30px", minHeight: 96, borderRadius: 48, background: "#1A2238", display: "flex", alignItems: "center", padding: "0 34px",
          fontFamily: FONT, fontSize: 36, color: draft || followDraft ? C.text : C.dim }}>
          {draft || followDraft || "Message"}
          {(draft || followDraft) && Math.floor(f / 15) % 2 === 0 ? <span style={{ color: C.bubbleMe }}>|</span> : null}
        </div>
      </div>
    </div>
  );
};

/** S1: the time, big, before the chat takes over. */
const Clock: React.FC = () => {
  const f = useCurrentFrame();
  const out = progress(f, end("S1", "night.") - 2, 10);
  if (out >= 1) return null;
  const t = pop(f, 0, 16);
  return (
    <AbsoluteFill style={{ background: C.night, opacity: 1 - out, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 300, letterSpacing: "-0.05em", color: C.text, transform: `scale(${1.15 - 0.15 * t})`, opacity: t }}>11:47</div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 44, color: C.dim, letterSpacing: "0.2em", marginTop: -10, opacity: t }}>PM</div>
    </AbsoluteFill>
  );
};

/** A stat that slams over the phone, with its source. */
const Stat: React.FC<{ big: string; line: string; at: number; until: number; color: string }> = ({ big, line, at: start, until, color }) => {
  const f = useCurrentFrame();
  if (f < start - 2 || f > until) return null;
  const t = pop(f, start - 2, 12);
  const out = progress(f, until - 8, 8);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 300, background: "#F7F4EE", borderRadius: 30, padding: "40px 46px", boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
      transform: `rotate(${-2 + (1 - t) * -6}deg) scale(${1.2 - 0.2 * t})`, opacity: Math.min(1, t * 2) * (1 - out) }}>
      <div style={{ fontFamily: SERIF, fontSize: 190, lineHeight: 0.9, color }}>{big}</div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 46, color: "#171512", marginTop: 16, lineHeight: 1.2 }}>{line}</div>
      <div style={{ fontFamily: FONT, fontSize: 26, color: "#6B6459", marginTop: 20 }}>King's College London, survey of 2,093 UK adults, March 2026</div>
    </div>
  );
};

/** S4: what the chatbot can't know, struck over the reply. */
const Unknowns: React.FC = () => {
  const f = useCurrentFrame();
  const s = S("S4");
  if (f < s.from || f >= s.to) return null;
  const items: [string, number][] = [["Which pill?", at("S4", "pill.")], ["Dose raised Monday", at("S4", "dose")], ["Lowest reading in a month", at("S4", "reading")]];
  return (
    <div style={{ position: "absolute", left: 110, right: 110, top: 330, display: "flex", flexDirection: "column", gap: 22, background: "#0A0F1EE6",
      borderRadius: 34, padding: "34px 34px 38px", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", opacity: Math.min(1, pop(f, s.from) * 2) }}>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: "0.16em", color: C.warn }}>IT CAN'T SEE</div>
      {items.map(([text, when], i) => {
        const t = pop(f, when - 3, 13);
        return (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 22, background: "#1B1520EE", border: `3px solid ${C.warn}`, borderRadius: 22,
            padding: "20px 28px", transform: `translateX(${(1 - t) * (i % 2 ? 200 : -200)}px) rotate(${(i - 1) * 1.5}deg)`, opacity: Math.min(1, t * 2) }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 50, color: C.warn }}>✕</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 46, color: C.text }}>{text}</div>
          </div>
        );
      })}
    </div>
  );
};

/** S6-S7: the same message in the care plan, which knows the context and tells the doctor. */
const CarePhone: React.FC = () => {
  const f = useCurrentFrame();
  const s6 = S("S6");
  if (f < s6.from - 10) return null;
  const t = pop(f, s6.from - 6, 18);
  const ctx: [string, string, number][] = [
    ["New pill", "started Friday", at("S6", "pill,")],
    ["Dose", "raised Monday", at("S6", "dose,")],
    ["Readings", "lowest in 30 days", at("S6", "readings.")],
  ];
  const flag = at("S7", "tells");
  const stamp = pop(f, end("S7", "hers.") - 2, 10);
  return (
    <div style={{ position: "absolute", right: 40, top: 200, width: 600, height: 1170, borderRadius: 70, background: "#05070D", padding: 14,
      boxShadow: `0 0 120px ${C.care}55`, transform: `translateX(${(1 - t) * 700}px)` }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 58, background: C.screen, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
        <ChatHeader title="Your care plan" sub="Dr. Rao's patient" color={C.care} small />
        <div style={{ padding: "22px 22px 0", display: "flex", flexDirection: "column", gap: 14 }}>
          {ctx.map(([k, v, when]) => {
            const c = pop(f, when - 3, 14);
            return (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", background: "#16304A", borderRadius: 18, padding: "14px 20px",
                opacity: Math.min(1, c * 2), transform: `scale(${0.8 + 0.2 * c})` }}>
                <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, color: C.dim }}>{k}</span>
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: C.text }}>{v}</span>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 16, padding: "0 22px 26px" }}>
          <Bubble me text={QUESTION} at={at("S6", "message.")} width={460} size={32} />
          {f >= flag - 3 ? (
            <div style={{ background: "#0F3B36", border: `3px solid ${C.care}`, borderRadius: 24, padding: "18px 22px", transform: `scale(${0.85 + 0.15 * pop(f, flag - 3)})` }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 22, letterSpacing: "0.12em", color: C.care }}>SENT TO DR. RAO</div>
              <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 34, color: C.text, marginTop: 6, lineHeight: 1.25 }}>She'll review this today. Keep your phone near you.</div>
            </div>
          ) : null}
        </div>
        {f >= end("S7", "hers.") - 4 ? (
          <div style={{ position: "absolute", left: 40, right: 40, top: 440, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 52, color: C.care,
            border: `6px solid ${C.care}`, borderRadius: 18, padding: "8px 0", background: "#0F1526DD", transform: `rotate(-8deg) scale(${1.6 - 0.6 * stamp})`, opacity: Math.min(1, stamp * 2) }}>
            DOCTOR TOLD
          </div>
        ) : null}
      </div>
    </div>
  );
};

/** S6: the shrunken chatbot phone on the left, greyed, with its generic answer. */
const ChatbotMini: React.FC = () => {
  const f = useCurrentFrame();
  const s6 = S("S6");
  if (f < s6.from + 6) return null;
  const t = pop(f, s6.from + 6, 18);
  const grey = progress(f, at("S7", "doctor."), 12);
  return (
    <div style={{ position: "absolute", left: 30, top: 330, width: 400, height: 860, borderRadius: 56, background: "#05070D", padding: 12,
      opacity: Math.min(1, t * 1.5) * (1 - grey * 0.55), filter: `grayscale(${grey})`, transform: `scale(${0.9 + 0.1 * t})` }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 46, background: C.screen, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <ChatHeader title="AI Assistant" sub="General chatbot" color="#6E7891" small />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 12, padding: "0 16px 20px" }}>
          <Bubble me text={QUESTION} at={0} width={330} size={24} />
          <Bubble text="A common side effect. Rest and drink water." at={0} width={330} size={24} />
        </div>
      </div>
      <div style={{ position: "absolute", top: -64, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: "0.14em", color: C.dim }}>KNOWS NOTHING</div>
    </div>
  );
};

const CareLabel: React.FC = () => {
  const f = useCurrentFrame();
  const s6 = S("S6");
  if (f < s6.from + 6) return null;
  return (
    <div style={{ position: "absolute", right: 40, width: 600, top: 130, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 30,
      letterSpacing: "0.14em", color: C.care, opacity: pop(f, s6.from + 6) }}>KNOWS YOUR PLAN</div>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const s8 = S("S8");
  if (f < s8.from - 4) return null;
  const t = pop(f, s8.from - 4, 18);
  const sub = pop(f, end("S8", "plan.") + 6);
  return (
    <AbsoluteFill style={{ background: C.night, opacity: Math.min(1, t * 1.5), alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40, padding: "0 90px" }}>
      <div style={{ fontFamily: SERIF, fontSize: 118, lineHeight: 1.05, color: C.text, textAlign: "center", transform: `translateY(${(1 - t) * 40}px)` }}>
        Ask the one who knows <span style={{ color: C.care, fontStyle: "italic" }}>your plan.</span>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 32, letterSpacing: "0.16em", color: C.dim, opacity: sub, textAlign: "center" }}>
        DOCX · CARE BETWEEN VISITS
      </div>
    </AbsoluteFill>
  );
};

const sfx = (): SfxCue[] => {
  const keys: SfxCue[] = [];
  const typeStart = end("S1", "night.") + 4;
  const typeEnd = typeStart + Math.ceil((QUESTION.length / 30) * 30);
  for (let k = typeStart; k < Math.min(typeEnd, S("S2").from); k += 5) keys.push({ at: k, sound: "tick", volume: 0.12 });
  return [
    ...keys,
    { at: S("S2").from + 2, sound: "whoosh", volume: 0.3 },
    { at: at("S2", "seven") - 2, sound: "thud", volume: 0.45 },
    { at: at("S3", "answer"), sound: "pop", volume: 0.35 },
    { at: at("S4", "pill."), sound: "click", volume: 0.4 },
    { at: at("S4", "dose"), sound: "click", volume: 0.4 },
    { at: at("S4", "reading"), sound: "click", volume: 0.4 },
    { at: S("S5").from - 6, sound: "whoosh", volume: 0.25 },
    { at: at("S5", "five") - 2, sound: "thud", volume: 0.45 },
    { at: S("S6").from - 6, sound: "whoosh", volume: 0.35 },
    { at: at("S7", "tells") - 3, sound: "ding", volume: 0.4 },
    { at: end("S7", "hers.") - 2, sound: "thud", volume: 0.5 },
  ];
};

export const MidnightQuestion: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Backdrop />
      <ChatbotPhone />
      <Unknowns />
      <ChatbotMini />
      <CarePhone />
      <CareLabel />
      <Stat big="1 in 7" line="UK adults have asked an AI chatbot instead of their GP" at={at("S2", "One")} until={S("S3").from} color={C.glow} />
      <Stat big="1 in 5" line="users say a chatbot talked them out of seeing a professional" at={at("S5", "one")} until={S("S6").from - 4} color={C.warn} />
      <Clock />
      <PopCaptions take={TAKE} font={FONT} accent={C.amber} variant="band" y={1560} until={S("S8").from - 4} scenes={["S1", "S2", "S3", "S4", "S5", "S6", "S7"]} />
      <EndCard />
      <VoiceOver take={TAKE} />
      <SfxTrack cues={sfx()} />
    </AbsoluteFill>
  );
};

export const MIDNIGHT_COVER = at("S2", "seven") + 18;
