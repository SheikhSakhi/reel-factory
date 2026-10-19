import React from "react";
import { Composition } from "remotion";
import { REEL } from "./kit";
import { REELS } from "./reels/registry";

export const RemotionRoot: React.FC = () => (
  <>
    {REELS.map((reel) => (
      <Composition
        key={reel.id}
        id={reel.id}
        component={reel.component}
        durationInFrames={reel.durationInFrames}
        fps={REEL.fps}
        width={reel.width ?? REEL.width}
        height={reel.height ?? REEL.height}
      />
    ))}
  </>
);
