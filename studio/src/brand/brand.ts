import manifest from "../../public/fonts/fonts.json";
import { loadLocalFonts, stack, type Brand, type Theme } from "../kit";

/**
 * The account's brand kit. /reel-brand rewrites this file and brand/brand.md once;
 * every reel imports BRAND instead of inventing a new look. This is the starter brand.
 * Fonts are vendored with: npm run fonts -- "Instrument Serif:400,400i" "Inter:500,600,700" "JetBrains Mono:500"
 */
loadLocalFonts(manifest);

const theme: Theme = {
  name: "starter-paper", bg: "#F3EEE4", fg: "#171512", muted: "#6B6459", accent: "#BF3F0A", surface: "#FFFFFF",
  fontDisplay: stack("Instrument Serif", "serif"), fontBody: stack("Inter"), fontMono: stack("JetBrains Mono", "monospace"),
  texture: "none",
};

export const BRAND: Brand = {
  name: "Starter",
  handle: "@yourhandle",
  theme,
  alt: { ...theme, name: "starter-ink", bg: "#171512", fg: "#F3EEE4", muted: "#A39B8C", surface: "#26231F" },
  highlight: "italic",
  chrome: { counter: true, chapterLabel: "STEP", tabs: true, progressBar: true },
  captions: { variant: "pill", fontSize: 46, top: 1340, bottom: 1500, maxChars: 34 },
  cta: { keyword: "GUIDE", promise: "the full guide" },
};
