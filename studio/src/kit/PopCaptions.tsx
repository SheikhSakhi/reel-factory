import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { pop } from "./motion";
import { normToken, type VoTake, type VoWord } from "./voiceover";

/**
 * Big creator-style captions: 1-3 words at a time, centred, heavy type with an outline,
 * the spoken word in the accent colour with a spring "pop". Reads on any footage.
 *
 *   <PopCaptions take={TAKE} font={BRAND.theme.fontBody} accent={BRAND.theme.accent} />
 */
export type PopCaptionsProps = {
  readonly take: VoTake;
  readonly font: string;
  readonly accent: string;
  readonly color?: string;
  /** Scene ids to caption (default: all). */
  readonly scenes?: readonly string[];
  /** Max words on screen at once. */
  readonly maxWords?: number;
  /** Max characters on screen at once. */
  readonly maxChars?: number;
  readonly fontSize?: number;
  /** Vertical centre of the caption, px from the top. Default 1250 (above the platform UI). */
  readonly y?: number;
  readonly uppercase?: boolean;
  /** Words (spoken tokens) always underlined in the accent colour, e.g. numbers or the CTA keyword. */
  readonly emphasis?: readonly string[];
  /** Absolute frame after which no captions show (e.g. when the CTA card takes over). */
  readonly until?: number;
  /** Vertical centre per absolute frame, overriding `y` (EditedReel moves captions to the seam of a split screen). */
  readonly yAt?: (frame: number) => number;
  /**
   * "pop": 1-3 big uppercase words, the spoken word on an accent box (default).
   * "band": 2-4 smaller words in sentence case, the spoken word in the accent colour: calm, explainer style.
   */
  readonly variant?: "pop" | "band";
};

type Chunk = { readonly words: readonly VoWord[]; readonly start: number; readonly end: number };

const BREAK_GAP = 8;
const LINGER = 10;

const chunksOf = (words: readonly VoWord[], maxWords: number, maxChars: number, sceneEnd: number): Chunk[] => {
  const groups = words.reduce<VoWord[][]>((acc, w) => {
    const current = acc[acc.length - 1];
    if (!current) return [[w]];
    const prev = current[current.length - 1];
    const chars = current.map((x) => x.token).join(" ").length + 1 + w.token.length;
    const breaks = current.length >= maxWords || chars > maxChars || /[.,?!;:]$/.test(prev.token) || w.frame - prev.endFrame > BREAK_GAP;
    return breaks ? [...acc, [w]] : [...acc.slice(0, -1), [...current, w]];
  }, []);
  return groups.map((g, i) => {
    const next = groups[i + 1];
    const end = next ? next[0].frame : Math.min(sceneEnd, g[g.length - 1].endFrame + LINGER);
    return { words: g, start: g[0].frame, end };
  });
};

export const PopCaptions: React.FC<PopCaptionsProps> = ({
  take, font, accent, color = "#FFFFFF", scenes, variant = "pop", maxWords = variant === "band" ? 4 : 3,
  maxChars = variant === "band" ? 28 : 18, fontSize = variant === "band" ? 50 : 84, y = 1250,
  uppercase = variant === "pop", emphasis = [], until, yAt,
}) => {
  const f = useCurrentFrame();
  const band = variant === "band";
  const centre = yAt ? yAt(f) : y;
  if (until !== undefined && f >= until) return null;
  const strong = new Set(emphasis.map(normToken));
  const chunks = take.scenes
    .filter((s) => !scenes || scenes.includes(s.id))
    .flatMap((s) => chunksOf(s.words, maxWords, maxChars, s.to));
  const chunk = chunks.find((c) => f >= c.start && f < c.end);
  if (!chunk) return null;
  const enter = pop(f, chunk.start, 12);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: 70, right: 70, top: centre - fontSize, height: fontSize * 2,
        display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "0.08em 0.36em",
        fontFamily: font, fontSize, fontWeight: 800, lineHeight: 1.05, textAlign: "center",
        textTransform: uppercase ? "uppercase" : "none", letterSpacing: "-0.01em",
        transform: `scale(${band ? 1 : 0.85 + 0.15 * enter})`, opacity: Math.min(1, enter * 1.5),
      }}>
        {chunk.words.map((w, i) => {
          const active = f >= w.frame && f < w.endFrame + 2;
          const hit = pop(f, w.frame, 10);
          const marked = strong.has(normToken(w.token));
          if (band) {
            return (
              <span key={`${w.frame}-${i}`} style={{
                display: "inline-block", color: active ? accent : color, textShadow: "0 3px 14px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.9)",
                textDecoration: marked ? `underline ${accent}` : "none", textDecorationThickness: "0.1em", textUnderlineOffset: "0.16em",
              }}>{w.token.replace(/[.,;:]$/, "")}</span>
            );
          }
          // The spoken word sits on an accent box: readable on any footage, whatever the brand colour.
          return (
            <span key={`${w.frame}-${i}`} style={{
              display: "inline-block", color, padding: "0 0.1em", borderRadius: "0.16em",
              background: active ? accent : "transparent",
              WebkitTextStroke: active ? "0" : "8px rgba(0,0,0,0.8)", paintOrder: "stroke fill",
              textShadow: active ? "none" : "0 6px 24px rgba(0,0,0,0.45)",
              boxShadow: active ? "0 10px 30px rgba(0,0,0,0.35)" : "none",
              textDecoration: marked && !active ? `underline ${accent}` : "none", textDecorationThickness: "0.12em",
              textUnderlineOffset: "0.14em",
              transform: `scale(${active ? 1 + 0.08 * hit : 1}) rotate(${active ? -2 * hit : 0}deg)`,
            }}>{w.token.replace(/[.,;:]$/, "")}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
