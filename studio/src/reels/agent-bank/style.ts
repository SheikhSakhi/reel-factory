import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import faces from "../../../public/fonts/agent-bank/faces.json";

// Art direction "The new ocean of money": deep-sea night, electric cyan for agents,
// gold for money, red for risk. 16:9 for a presentation screen.
export const W = 1920;
export const H = 1080;

export const C = {
  bg: "#030712",
  deep: "#071633",
  fg: "#EEF4FF",
  muted: "#8696BD",
  dim: "#3A4A70",
  cyan: "#3CE8FF",
  gold: "#FFC84A",
  red: "#FF4D6D",
  green: "#3DFFA8",
  violet: "#8C7BFF",
  glass: "rgba(140,170,255,0.07)",
  line: "rgba(150,180,255,0.20)",
} as const;

export const F = {
  display: "Unbounded, sans-serif",
  body: "Manrope, sans-serif",
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
