import React from "react";
import { useCurrentFrame } from "remotion";
import type { Highlight } from "./brand";
import { pop, progress } from "./motion";
import type { Theme } from "./theme";

type Props = {
  /** Mark the brand word with asterisks: "1 month of reels with *5 Claude skills*". "\n" forces a line break. */
  text: string;
  theme: Theme;
  highlight?: Highlight;
  size?: number;
  font?: string;
  weight?: number;
  color?: string;
  align?: "center" | "left";
  /** Local frame the first word starts. */
  delay?: number;
  stagger?: number;
  /**
   * Local start frame per word (voice-over sync). Overrides delay/stagger:
   *   at={["one", "month"].map((w) => wordFrame(TAKE, "S1", w) - s.from)}
   * Words past the end of the array reuse its last frame.
   */
  at?: readonly number[];
  style?: React.CSSProperties;
};

type Word = { readonly text: string; readonly accent: boolean; readonly breakBefore: boolean };

type Part = { readonly text: string; readonly accent: boolean };
type State = { readonly words: readonly Word[]; readonly gap: boolean; readonly pendingBreak: boolean };

/**
 * Splits "a *b c*, d\ne" into words, keeping which ones are accented and where lines break.
 * Punctuation that follows a marked span without a space ("*brand*,") sticks to that word.
 */
const parse = (text: string): Word[] => {
  const parts: Part[] = text.split(/(\*[^*]+\*)/).flatMap((chunk) => {
    const accent = chunk.startsWith("*") && chunk.endsWith("*") && chunk.length > 2;
    const body = accent ? chunk.slice(1, -1) : chunk;
    return body.split(/(\n| +)/).filter((p) => p !== "").map((p) => ({ text: p, accent }));
  });
  const end = parts.reduce<State>((st, part) => {
    if (part.text === "\n") return { ...st, gap: true, pendingBreak: true };
    if (part.text.trim() === "") return { ...st, gap: true };
    const last = st.words[st.words.length - 1];
    const words = !st.gap && last
      ? [...st.words.slice(0, -1), { ...last, text: last.text + part.text }]
      : [...st.words, { text: part.text, accent: part.accent, breakBefore: st.pendingBreak }];
    return { words, gap: false, pendingBreak: false };
  }, { words: [], gap: true, pendingBreak: false });
  return [...end.words];
};

const accentStyle = (highlight: Highlight, theme: Theme, t: number): React.CSSProperties => {
  switch (highlight) {
    case "italic":
      return { color: theme.accent, fontStyle: "italic" };
    case "marker":
      return {
        color: theme.fg,
        backgroundImage: `linear-gradient(${theme.accent}, ${theme.accent})`,
        backgroundSize: `${t * 100}% 42%`, backgroundPosition: "0 85%", backgroundRepeat: "no-repeat",
      };
    case "underline":
      return {
        color: theme.fg,
        backgroundImage: `linear-gradient(${theme.accent}, ${theme.accent})`,
        backgroundSize: `${t * 100}% 0.09em`, backgroundPosition: "0 96%", backgroundRepeat: "no-repeat",
      };
    default:
      return { color: theme.accent };
  }
};

/** Brand headline: words spring in, `*marked*` words get the brand highlight. */
export const Headline: React.FC<Props> = ({
  text, theme, highlight = "color", size = 112, font, weight = 400, color, align = "center",
  delay = 0, stagger = 3, at, style,
}) => {
  const frame = useCurrentFrame();
  const words = parse(text);
  const startOf = (i: number): number =>
    at && at.length > 0 ? at[Math.min(i, at.length - 1)] : delay + i * stagger;
  return (
    <div style={{
      fontSize: size, fontFamily: font ?? theme.fontDisplay, fontWeight: weight, color: color ?? theme.fg,
      lineHeight: 1.04, letterSpacing: "-0.02em", textAlign: align, textWrap: "balance", ...style,
    }}>
      {words.map((w, i) => {
        const start = startOf(i);
        const t = pop(frame, start);
        const blur = (1 - progress(frame, start, 10)) * 10;
        const mark = progress(frame, start + 4, 12);
        return (
          <React.Fragment key={i}>
            {w.breakBefore ? <br /> : i > 0 ? " " : ""}
            <span style={{
              display: "inline-block", opacity: t, filter: blur > 0.1 ? `blur(${blur}px)` : "none",
              transform: `translateY(${(1 - t) * 50}px)`, padding: w.accent ? "0 0.04em" : undefined,
              ...(w.accent ? accentStyle(highlight, theme, mark) : null),
            }}>{w.text}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
};
