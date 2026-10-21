import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE_IN_OUT } from "./motion";
import { REEL, type Theme } from "./theme";

/**
 * Persistent series chrome: "01 / 08" counter, "SKILL 1 OF 5" label, chapter tabs and
 * a progress bar. It is what makes a list reel feel like a series viewers want to finish.
 *
 * Mount ONCE at the reel root (outside scene Sequences) so it never re-animates on a cut:
 *
 *   <SeriesChrome theme={BRAND.theme} label="SKILL" tabs={["IDEAS", "COPY", ...]} totalFrames={TAKE.totalFrames}
 *     steps={TAKE.scenes.map((s, i) => ({ from: s.from, chapter: i >= 1 && i <= 5 ? i - 1 : undefined }))} />
 */
export type ChromeStep = {
  /** Absolute frame this step starts. */
  readonly from: number;
  /** 0-based chapter (list item) shown in the label and tabs. Undefined = no chapter (hook, CTA). */
  readonly chapter?: number;
  /** Hide the whole chrome for this step (e.g. a full-bleed proof shot). */
  readonly hidden?: boolean;
  /** Switch to the contrast palette for this step (when the scene uses the brand's alt theme). */
  readonly alt?: boolean;
};

type Props = {
  readonly theme: Theme;
  /** Contrast palette used for steps marked `alt`. */
  readonly altTheme?: Theme;
  readonly steps: readonly ChromeStep[];
  readonly totalFrames: number;
  /** Label prefix: "SKILL" renders "SKILL 2 OF 5". Empty hides the label. */
  readonly label?: string;
  /** Chapter tab names. Max 6, short uppercase words read best. */
  readonly tabs?: readonly string[];
  readonly counter?: boolean;
  readonly progressBar?: boolean;
  /** Top of the chrome row in px. Default 250 clears the platform's top bar. */
  readonly top?: number;
};

const SLIDE = 8;
const pad2 = (n: number): string => String(n).padStart(2, "0");

const activeIndex = (steps: readonly ChromeStep[], f: number): number =>
  steps.reduce((found, s, i) => (f >= s.from ? i : found), 0);

/** Eased chapter position between the previous chapter and the current one, for the sliding tab marker. */
const chapterPosition = (steps: readonly ChromeStep[], f: number): number | undefined => {
  const i = activeIndex(steps, f);
  const current = steps[i].chapter;
  if (current === undefined) return undefined;
  const previous = steps.slice(0, i).reverse().find((s) => s.chapter !== undefined)?.chapter ?? current;
  const t = interpolate(f, [steps[i].from, steps[i].from + SLIDE], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT,
  });
  return previous + (current - previous) * t;
};

export const SeriesChrome: React.FC<Props> = ({
  theme, altTheme, steps, totalFrames, label = "", tabs, counter = true, progressBar = true, top = 250,
}) => {
  const f = useCurrentFrame();
  if (steps.length === 0) return null;
  const i = activeIndex(steps, f);
  const step = steps[i];
  const th = step.alt && altTheme ? altTheme : theme;
  const fadeIn = interpolate(f, [steps[0].from, steps[0].from + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = step.hidden ? 0 : fadeIn;
  const chapterTotal = tabs?.length ?? Math.max(0, ...steps.map((s) => (s.chapter ?? -1) + 1));
  const pos = chapterPosition(steps, f);
  const labelIn = interpolate(f, [step.from, step.from + SLIDE], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const left = 80;
  const width = 860;
  const mono: React.CSSProperties = { fontFamily: th.fontMono, fontSize: 28, letterSpacing: "0.12em", fontWeight: 500 };

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {progressBar ? (
        <div style={{ position: "absolute", left, width, top: top - 34, height: 6, borderRadius: 3, background: `${th.muted}33` }}>
          <div style={{ width: `${Math.min(1, f / totalFrames) * 100}%`, height: "100%", borderRadius: 3, background: th.accent }} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left, width, top, display: "flex", justifyContent: "space-between", alignItems: "center", color: th.muted, ...mono }}>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{counter ? `${pad2(i + 1)} / ${pad2(steps.length)}` : ""}</span>
        {label && step.chapter !== undefined ? (
          <span style={{ color: th.fg, opacity: labelIn, transform: `translateY(${(1 - labelIn) * 12}px)` }}>
            {`${label} ${step.chapter + 1} OF ${chapterTotal}`}
          </span>
        ) : <span />}
      </div>
      {tabs && tabs.length > 0 ? (
        <div style={{ position: "absolute", left, width, top: top + 58, height: 62, display: "flex", borderRadius: 31, background: `${th.muted}1F` }}>
          {pos !== undefined ? (
            <div style={{
              position: "absolute", top: 0, height: 62, borderRadius: 31, background: th.fg,
              width: width / tabs.length, left: (width / tabs.length) * pos,
            }} />
          ) : null}
          {tabs.map((tab, k) => {
            const lit = pos !== undefined ? Math.max(0, 1 - Math.abs(pos - k)) : 0;
            return (
              <div key={tab} style={{
                position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                ...mono, fontSize: tabs.length > 5 ? 20 : 23, letterSpacing: "0.08em",
                color: lit > 0.5 ? th.bg : pos !== undefined && k < pos ? th.fg : th.muted,
              }}>{tab}</div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Content area below the chrome: use as the padding top of scenes that sit under tabs. */
export const CHROME_CLEARANCE = 420;
export const CONTENT_BOTTOM = REEL.height - 600;
