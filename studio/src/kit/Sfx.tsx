import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

export type SfxName = "whoosh" | "pop" | "click" | "tick" | "rise" | "thud" | "ding" | "impact" | "swoosh" | "riser" | "shimmer" | "blip" | "particles" | "hum";
export type SfxCue = { readonly at: number; readonly sound: SfxName; readonly volume?: number };

/** Plays the sound director's cue sheet. Files come from `npm run sfx`. */
export const SfxTrack: React.FC<{ cues: readonly SfxCue[] }> = ({ cues }) => (
  <>
    {cues.map((cue, i) => (
      <Sequence key={`${cue.sound}-${cue.at}-${i}`} from={cue.at} layout="none">
        <Audio src={staticFile(`sfx/${cue.sound}.wav`)} volume={cue.volume ?? 0.6} />
      </Sequence>
    ))}
  </>
);
