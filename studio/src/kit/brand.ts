import type { Theme } from "./theme";

/**
 * The account's fixed look, set once with /reel-brand and used by every reel.
 * The art director varies composition and motion inside it, never the brand itself:
 * viewers should recognise the account before they read a word.
 */
export type Brand = {
  /** Account or series name, e.g. "Treatment Notes". */
  readonly name: string;
  /** Handle shown in the chrome and on the CTA card, e.g. "@drsakhi". */
  readonly handle: string;
  /** Main look. Most scenes use it. */
  readonly theme: Theme;
  /** Contrast look for emphasis scenes (proof, stat, CTA). Same fonts, inverted palette. */
  readonly alt: Theme;
  /** How a `*marked*` word in a Headline stands out. */
  readonly highlight: Highlight;
  readonly chrome: {
    /** "01 / 08" scene counter, top left. */
    readonly counter: boolean;
    /** Chapter label prefix, e.g. "SKILL" renders "SKILL 1 OF 5". Empty string hides it. */
    readonly chapterLabel: string;
    /** Chapter tab bar (IDEAS · COPY · CREATE ...) for list formats. */
    readonly tabs: boolean;
    /** Thin progress bar along the top edge. */
    readonly progressBar: boolean;
  };
  readonly captions: {
    /** "pill": text on a rounded surface (reads on any background). "plain": text with a shadow. */
    readonly variant: "pill" | "plain";
    readonly fontSize: number;
    readonly top: number;
    readonly bottom: number;
    readonly maxChars: number;
  };
  /** Default comment-keyword CTA. A reel can override it. */
  readonly cta: {
    readonly keyword: string;
    /** What the viewer gets in the DM, e.g. "the full prompt pack". */
    readonly promise: string;
  };
};

export type Highlight = "color" | "italic" | "marker" | "underline";

/**
 * Caption props from the brand: spread into <Captions take={TAKE} {...captionProps(BRAND)} />.
 * The pill inverts the palette (bg-coloured text on an fg-coloured pill) so it reads on every scene.
 */
export const captionProps = (brand: Brand) => {
  const { theme, captions } = brand;
  const pill = captions.variant === "pill";
  return {
    fontFamily: theme.fontBody,
    color: pill ? theme.bg : theme.fg,
    accent: theme.accent,
    variant: captions.variant,
    pillColor: pill ? theme.fg : undefined,
    fontSize: captions.fontSize,
    top: captions.top,
    bottom: captions.bottom,
    maxChars: captions.maxChars,
  } as const;
};
