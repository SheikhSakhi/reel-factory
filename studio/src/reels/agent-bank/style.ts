import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import faces from "../../../public/fonts/agent-bank/faces.json";

// Art direction "quiet keynote": graphite night, one ice-blue accent for agents,
// champagne only for money, red only for risk. Thin lines, masked type. 16:9.
export const W = 1920;
export const H = 1080;

export const C = {
  bg: "#05070B",
  deep: "#0A0F1A",
  fg: "#F3F6FA",
  muted: "#8B95A8",
  dim: "#2B3343",
  cyan: "#7FE6F5",
  gold: "#E9C77F",
  red: "#FF6170",
  green: "#6FE3B4",
  violet: "#A3AEFF",
  glass: "rgba(255,255,255,0.04)",
  line: "rgba(255,255,255,0.10)",
} as const;

export const F = {
  display: "'Inter Tight', sans-serif",
  body: "'Inter Tight', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

type Face = { readonly family: string; readonly file: string; readonly unicodeRange: string };

/** Loads the locally stored Cyrillic + Latin font files before the first frame renders. */
export const useReelFonts = (): void => {
  const [handle] = useState(() => delayRender("agent-bank fonts"));
  useEffect(() => {
    Promise.all(
      (faces as readonly Face[]).map((f) =>
        new FontFace(f.family, `url(${staticFile(`fonts/agent-bank/${f.file}`)})`, {
          unicodeRange: f.unicodeRange,
          weight: "100 900",
        })
          .load()
          .then((face) => document.fonts.add(face)),
      ),
    )
      .then(() => continueRender(handle))
      .catch((error: unknown) => {
        console.error(error);
        continueRender(handle);
      });
  }, [handle]);
};
