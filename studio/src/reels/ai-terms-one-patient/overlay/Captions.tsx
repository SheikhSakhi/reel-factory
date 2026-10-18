// Optional full-subtitle layer, separate from the emphasis typography.
// Phrases of up to 7 words, timed from the narration's word boundaries.
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { BLOCKS, FPS } from "../timing";
import { C, SERIF } from "../style";

type Phrase = { text: string; from: number; to: number };

const buildPhrases = (): Phrase[] => {
  const out: Phrase[] = [];
  for (const b of BLOCKS) {
    // Re-attach punctuation from the block text to the boundary words, in order.
    const tokens = b.text.split(/\s+|(?<=—)/).filter(Boolean);
    let cur: { words: string[]; from: number; to: number } | null = null;
    b.words.forEach((w, i) => {
      const shown = tokens[i] ?? w.word;
      cur ??= { words: [], from: w.start, to: w.end };
      cur.words.push(shown);
      cur.to = w.end;
      const breakHere = cur.words.length >= 7 || /[.?!:;,—]$/.test(shown) && cur.words.length >= 3;
      if (breakHere || i === b.words.length - 1) {
        out.push({ text: cur.words.join(" "), from: Math.round(cur.from * FPS), to: Math.round(cur.to * FPS) + 6 });
        cur = null;
      }
    });
  }
  return out;
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const phrases = useMemo(buildPhrases, []);
  const p = phrases.find((x) => frame >= x.from && frame < x.to);
  if (!p) return null;
  return (
    <div style={{ position: "absolute", top: 1530, left: 90, width: 900, textAlign: "center" }}>
      <span style={{
        fontFamily: SERIF, fontWeight: 300, fontSize: 40, color: C.ink, lineHeight: 1.25,
        background: "rgba(4,6,11,0.72)", padding: "6px 16px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone",
      }}>{p.text}</span>
    </div>
  );
};
