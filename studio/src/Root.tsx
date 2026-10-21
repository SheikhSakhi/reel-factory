import React from "react";
import { Composition, Freeze } from "remotion";
import { REEL } from "./kit";
import { REELS, type ReelEntry } from "./reels/registry";

/**
 * One frame of a reel as `<id>-cover` for the profile grid. It is a full-length composition
 * (not a <Still>) because Sequences clip to the composition's duration; render it at frame 0.
 */
const coverOf = (reel: ReelEntry & { coverFrame: number }): React.FC => {
  const Reel = reel.component;
  const Cover: React.FC = () => <Freeze frame={reel.coverFrame}><Reel /></Freeze>;
  return Cover;
};

const COVERS = REELS.flatMap((reel) =>
  reel.coverFrame === undefined ? [] : [{ id: `${reel.id}-cover`, durationInFrames: reel.durationInFrames, component: coverOf({ ...reel, coverFrame: reel.coverFrame }) }],
);

export const RemotionRoot: React.FC = () => (
  <>
    {REELS.map((reel) => (
      <Composition
        key={reel.id}
        id={reel.id}
        component={reel.component}
        durationInFrames={reel.durationInFrames}
        fps={REEL.fps}
        width={REEL.width}
        height={REEL.height}
      />
    ))}
    {COVERS.map((cover) => (
      <Composition key={cover.id} id={cover.id} component={cover.component} durationInFrames={cover.durationInFrames}
        fps={REEL.fps} width={REEL.width} height={REEL.height} />
    ))}
  </>
);
