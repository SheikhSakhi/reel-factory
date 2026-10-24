import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { pop } from "./motion";

type Word = { readonly token: string; readonly frame: number; readonly endFrame: number };
type Line = { readonly id: string; readonly speaker: string; readonly from: number; readonly to: number; readonly words: readonly Word[] };

type Props = {
  readonly lines: readonly Line[];
  /** Box colour per speaker, e.g. { DOC: "#138A7E" }: viewers learn who talks by colour. */
  readonly colors: Readonly<Record<string, string>>;
  readonly font: string;
  readonly y?: number;
  readonly fontSize?: number;
  readonly maxWords?: number;
  /** Absolute frame after which no captions show. */
  readonly until?: number;
  /** Scene ids to leave uncaptioned (e.g. when a card already shows the words). */
  readonly skip?: readonly string[];
};

/**
 * Dialogue captions as word chips: every word on its own box in the speaker's colour,
 * appearing as it is spoken and staying until the chunk ends (character-series style).
 */
export const DialogueCaptions: React.FC<Props> = ({ lines, colors, font, y = 1300, fontSize = 54, maxWords = 3, until, skip = [] }) => {
  const f = useCurrentFrame();
  if (until !== undefined && f >= until) return null;
  const line = lines.find((l) => f >= l.from && f < l.to);
  if (!line || skip.includes(line.id)) return null;
  // Chunks of up to maxWords, breaking after sentence ends.
  const chunks: Word[][] = [];
  for (const w of line.words) {
    const last = chunks[chunks.length - 1];
    if (!last || last.length >= maxWords || /[.?!…]$/.test(last[last.length - 1].token)) chunks.push([w]);
    else last.push(w);
  }
  const chunk = [...chunks].reverse().find((c) => f >= c[0].frame - 2) ?? chunks[0];
  const color = colors[line.speaker] ?? "#222";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: 60, right: 60, top: y - fontSize, minHeight: fontSize * 2,
        display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "center", gap: "12px 10px",
      }}>
        {chunk.filter((w) => f >= w.frame - 2).map((w) => {
          const t = pop(f, w.frame - 2, 16);
          return (
            <span key={w.frame} style={{
              fontFamily: font, fontSize, fontWeight: 600, lineHeight: 1.1, color: "#FFFFFF", background: color,
              padding: "6px 16px 10px", borderRadius: 6, boxShadow: "0 8px 22px rgba(0,0,0,0.3)",
              transform: `translateY(${(1 - t) * 14}px) scale(${0.85 + 0.15 * t})`, opacity: Math.min(1, t * 1.6),
            }}>{w.token}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
