// Art direction from briefs/ai-terms-one-patient/03-style.md ("Glass Hospital, One Amber Light").
import { loadFont } from "@remotion/fonts";
import { continueRender, delayRender, staticFile } from "remotion";
import type { Theme } from "../../kit";

export const C = {
  void: "#04060B",
  midnight: "#0B1322",
  ink: "#F3EEE4",
  muted: "#8B93A3",
  amber: "#FFB347",
  amberCore: "#FFE2B0",
  cyan: "#6FE3F2",
  green: "#7FD957",
  metal: "#9AA3AE",
} as const;

export const SERIF = "Fraunces";
export const MONO = "IBM Plex Mono";

export const THEME: Theme = {
  name: "glass-hospital", bg: C.void, fg: C.ink, muted: C.muted, accent: C.amber, surface: C.midnight,
  fontDisplay: SERIF, fontBody: SERIF, fontMono: MONO, texture: "none",
};

const FONTS = [
  { family: SERIF, file: "fraunces-latin-300-normal.woff2", weight: "300", style: "normal" },
  { family: SERIF, file: "fraunces-latin-600-normal.woff2", weight: "600", style: "normal" },
  { family: SERIF, file: "fraunces-latin-300-italic.woff2", weight: "300", style: "italic" },
  { family: SERIF, file: "fraunces-latin-400-italic.woff2", weight: "400", style: "italic" },
  { family: MONO, file: "ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
  { family: MONO, file: "ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
] as const;

let fontsRequested = false;
/** Loads the local woff2 files once (no network fonts at render time). */
export const ensureFonts = (): void => {
  if (fontsRequested) return;
  fontsRequested = true;
  const handle = delayRender("loading film fonts");
  Promise.all(FONTS.map((f) => loadFont({ family: f.family, url: staticFile(`fonts/${f.file}`), weight: f.weight, style: f.style })))
    .then(() => continueRender(handle))
    .catch((err) => { throw err; });
};

/** Mono label style used for every system label in the film. */
export const monoLabel = (size: number, color: string = C.muted): React.CSSProperties => ({
  fontFamily: MONO, fontWeight: 500, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color,
});
