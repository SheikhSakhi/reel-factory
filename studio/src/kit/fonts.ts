import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/**
 * Loads fonts vendored by `npm run fonts` (public/fonts/fonts.json). Local files keep
 * renders offline and identical over time, which a fixed brand needs.
 *
 *   import manifest from "../../public/fonts/fonts.json";
 *   loadLocalFonts(manifest);
 *   const theme = { ..., fontDisplay: "Instrument Serif", fontBody: "Inter" };
 */
type Face = { family: string; file: string; weight: string; style: string; unicodeRange: string };

const isFace = (v: unknown): v is Face => {
  if (typeof v !== "object" || v === null) return false;
  const f = v as Record<string, unknown>;
  return ["family", "file", "weight", "style", "unicodeRange"].every((k) => typeof f[k] === "string");
};

export const loadLocalFonts = (manifest: unknown): void => {
  const faces = typeof manifest === "object" && manifest !== null ? (manifest as { faces?: unknown }).faces : undefined;
  if (!Array.isArray(faces) || !faces.every(isFace)) {
    throw new Error("public/fonts/fonts.json is malformed: re-run npm run fonts");
  }
  faces.forEach((f) => {
    loadFont({
      family: f.family, url: staticFile(f.file), weight: f.weight, style: f.style,
      unicodeRange: f.unicodeRange || undefined, format: "woff2", display: "block",
    }).catch((error: unknown) => {
      throw new Error(`could not load ${f.file}: ${String(error)}`);
    });
  });
};

/** CSS font stack with a safe fallback, e.g. stack("Inter") -> '"Inter", sans-serif'. */
export const stack = (family: string, fallback: "serif" | "sans-serif" | "monospace" = "sans-serif"): string =>
  `"${family}", ${fallback}`;
