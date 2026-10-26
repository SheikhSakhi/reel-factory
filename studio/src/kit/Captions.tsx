import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { REEL } from "./theme";
import { normToken, type VoTake, type VoWord } from "./voiceover";

/**
 * Word-by-word voice-over captions, synced to take.json.
 *
 *   <Captions take={TAKE} scenes={["S3", "S4"]} fontFamily={FONT} color={THEME.fg} accent={THEME.accent}
 *             keepTogether={["sixteen thousand hours"]} />
 *
 * With a brand, spread its caption settings: {...captionProps(BRAND)}.
 *
 * Pages break at sentence ends or when a line budget fills up; phrases in
 * `keepTogether` never split across lines or pages. Keep the band clear of cards.
 */
export type CaptionsProps = {
  readonly take: VoTake;
  /** Scene ids that get captions (default: all). Skip scenes whose headline already says the line. */
  readonly scenes?: readonly string[];
  readonly fontFamily: string;
  readonly color: string;
  readonly accent: string;
  readonly fontSize?: number;
  /** Caption band, in px from the top. Default 1340-1500 keeps it inside the safe zone. */
  readonly top?: number;
  readonly bottom?: number;
  readonly centerX?: number;
  readonly maxWidth?: number;
  /** Characters per page before it breaks (two balanced lines at the default size). */
  readonly maxChars?: number;
  /** Phrases (as spoken tokens) that must stay on one line, e.g. numbers and names. */
  readonly keepTogether?: readonly string[];
  /**
   * "pill" puts each page on a rounded surface so it reads on any background (brand default);
   * "plain" is text with a soft shadow.
   */
  readonly variant?: "pill" | "plain";
  /** Pill surface colour (default: color at 92% over black). */
  readonly pillColor?: string;
};

const WORD_IN = 4;
const PAGE_FADE = 3;
const SCENE_END_GAP = 4;
const PAST_OPACITY = 0.8;
const SENTENCE_END = /[.?!]["')\]]*$/;
/** "U.S.", "e.g.", "Dr." end in a period but don't end the sentence. */
const ABBREVIATION = /^(?:\p{L}\.){2,}$|^(?:Dr|Mr|Mrs|Ms|St|vs|etc|No)\.$/iu;

type Segment = { readonly words: readonly VoWord[]; readonly nowrap: boolean };
type Page = { readonly segments: readonly Segment[]; readonly start: number; readonly end: number };

const ramp = (f: number, from: number, length: number): number =>
  interpolate(f, [from, from + length], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const segmentText = (s: Segment): string => s.words.map((w) => w.token).join(" ");

/** Groups words into unbreakable segments: a keepTogether phrase, or a single word. */
const toSegments = (words: readonly VoWord[], groups: readonly (readonly string[])[], from = 0): Segment[] => {
  if (from >= words.length) return [];
  const hit = groups.find((g) => g.every((t, k) => words[from + k] !== undefined && normToken(words[from + k].token) === t));
  const length = hit ? hit.length : 1;
  return [{ words: words.slice(from, from + length), nowrap: Boolean(hit) }, ...toSegments(words, groups, from + length)];
};

/** Splits a scene's segments into pages (immutable reduce). */
const toPageGroups = (segments: readonly Segment[], maxChars: number): Segment[][] =>
  segments.reduce<Segment[][]>((pages, seg) => {
    const current = pages[pages.length - 1];
    if (!current) return [[seg]];
    const length = current.map(segmentText).join(" ").length + 1 + segmentText(seg).length;
    const lastToken = current[current.length - 1].words.slice(-1)[0].token;
    const sentenceEnds = SENTENCE_END.test(lastToken) && !ABBREVIATION.test(lastToken);
    const breakHere = sentenceEnds || length > maxChars;
    return breakHere ? [...pages, [seg]] : [...pages.slice(0, -1), [...current, seg]];
  }, []);

const buildPages = (props: CaptionsProps): Page[] => {
  const groups = (props.keepTogether ?? []).map((p) => p.split(/\s+/).map(normToken));
  const wanted = props.take.scenes.filter((s) => !props.scenes || props.scenes.includes(s.id));
  return wanted.flatMap((s) => {
    const pageGroups = toPageGroups(toSegments(s.words, groups), props.maxChars ?? 38);
    return pageGroups.map((segments, i) => {
      const next = pageGroups[i + 1];
      const end = next ? next[0].words[0].frame : s.to - SCENE_END_GAP;
      return { segments, start: segments[0].words[0].frame, end };
    });
  });
};

/** Pill captions show the whole page with upcoming words dimmed, so the pill never sits half empty. */
const UPCOMING_OPACITY = 0.38;

const CaptionWord: React.FC<{ f: number; word: VoWord; nextFrame: number; accent: string; pill: boolean }> = ({ f, word, nextFrame, accent, pill }) => {
  const t = ramp(f, word.frame, WORD_IN);
  const active = f >= word.frame && f < nextFrame;
  const seen = active ? 1 : PAST_OPACITY;
  const opacity = pill ? UPCOMING_OPACITY + (seen - UPCOMING_OPACITY) * t : t * seen;
  return (
    <span style={{
      display: "inline-block", position: "relative", opacity,
      transform: pill ? undefined : `translateY(${(1 - t) * 10}px)`, filter: !pill && t < 1 ? `blur(${(1 - t) * 4}px)` : "none",
    }}>
      {active ? (
        <span style={{
          position: "absolute", inset: "-2px -10px", borderRadius: 12, zIndex: -1,
          background: `color-mix(in srgb, ${accent} 20%, transparent)`,
        }} />
      ) : null}
      {word.token}
    </span>
  );
};

const CaptionPage: React.FC<{ f: number; page: Page; props: CaptionsProps }> = ({ f, page, props }) => {
  const words = page.segments.flatMap((s) => s.words);
  const nextFrameOf = (w: VoWord): number => {
    const i = words.indexOf(w);
    return i + 1 < words.length ? words[i + 1].frame : w.endFrame + WORD_IN;
  };
  const top = props.top ?? 1340;
  const bottom = props.bottom ?? 1500;
  const maxWidth = props.maxWidth ?? 840;
  const centerX = props.centerX ?? REEL.width / 2;
  return (
    <div style={{
      position: "absolute", left: centerX - maxWidth / 2, width: maxWidth, top, height: bottom - top,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: interpolate(f, [page.end - PAGE_FADE, page.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    }}>
      <div style={{
        fontFamily: props.fontFamily, fontSize: props.fontSize ?? 50, fontWeight: 600, lineHeight: 1.18,
        color: props.color, textAlign: "center", textWrap: "balance", isolation: "isolate",
        ...(props.variant === "pill"
          ? {
            padding: "18px 34px", borderRadius: 34, boxShadow: "0 14px 40px rgba(0,0,0,0.22)",
            background: props.pillColor ?? `color-mix(in srgb, ${props.color} 8%, #111 92%)`,
          }
          : { textShadow: "0 2px 14px rgba(0,0,0,0.55)" }),
      }}>
        {page.segments.map((seg, s) => (
          <React.Fragment key={`${seg.words[0].frame}-${s}`}>
            {s > 0 ? " " : ""}
            <span style={{ whiteSpace: seg.nowrap ? "nowrap" : undefined }}>
              {seg.words.map((w, k) => (
                <React.Fragment key={`${w.frame}-${k}`}>
                  {k > 0 ? " " : ""}
                  <CaptionWord f={f} word={w} nextFrame={nextFrameOf(w)} accent={props.accent} pill={props.variant === "pill"} />
                </React.Fragment>
              ))}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const Captions: React.FC<CaptionsProps> = (props) => {
  const f = useCurrentFrame();
  const pages = buildPages(props);
  const visible = pages.filter((p) => f >= p.start && f < p.end);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {visible.map((page) => <CaptionPage key={page.start} f={f} page={page} props={props} />)}
    </AbsoluteFill>
  );
};
