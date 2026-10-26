import React from "react";
import { useCurrentFrame } from "remotion";
import { Label, PanelBackdrop, pop, progress, usePanel, usePanelAt, type Panels } from "../../kit";

// NVIDIA Journey S1E2: only the end card is drawn in code, matched to the creator's own panels (near-black, thin
// white outlines, serif labels, mono captions, one amber glow). The talking-head lines stay clean on purpose.

const AMBER = "#F2A23A";

/** A thin outlined box with a mono tag in its corner, like the creator's nested AI / ML / DL boxes. */
const Frame: React.FC<{ at: number; x: number; y: number; w: number; h: number; tag?: string; children?: React.ReactNode; color?: string }> = ({
  at, x, y, w, h, tag, children, color,
}) => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const t = progress(f, at, 14);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, border: `2px solid ${color ?? theme.fg}${Math.round(t * 200).toString(16).padStart(2, "0")}`,
      borderRadius: 6, transform: `scale(${0.96 + 0.04 * t})`, opacity: Math.min(1, t * 1.4) }}>
      {tag ? <div style={{ position: "absolute", left: 14, top: 10, fontFamily: theme.fontMono, fontSize: 20, letterSpacing: "0.14em", color: theme.muted }}>{tag}</div> : null}
      {children}
    </div>
  );
};

/** The amber glow dot from the creator's panels. */
const Glow: React.FC<{ at: number; x: number; y: number; size?: number }> = ({ at, x, y, size = 26 }) => {
  const f = useCurrentFrame();
  const t = pop(f, at, 12);
  const pulse = 1 + 0.12 * Math.sin((f - at) / 8);
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size, background: "#FFD9A0",
      boxShadow: `0 0 ${30 * pulse}px ${12 * pulse}px ${AMBER}AA`, transform: `scale(${t})` }} />
  );
};

/** S8 (full screen): the series end card while the voice finishes. */
const S8: React.FC = () => {
  const { theme } = usePanel();
  const useful = usePanelAt("S8:useful");
  const course = usePanelAt("S8:course.");
  return (
    <PanelBackdrop glow={AMBER} light="center">
      <Frame at={0} x={110} y={360} w={860} h={760} tag="NVIDIA JOURNEY">
        <Label text="Season 1 · Episode 2" at={2} size={34} font="mono" weight={500} color={theme.muted} style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", letterSpacing: "0.12em" }} />
        <Label text="One useful thing" at={useful} size={92} style={{ position: "absolute", left: 0, right: 0, top: 220, textAlign: "center" }} />
        <Label text="from every day's course" at={useful + 8} size={60} italic color={AMBER} style={{ position: "absolute", left: 0, right: 0, top: 340, textAlign: "center" }} />
        <Glow at={course} x={430} y={540} size={30} />
        <Label text="NEXT · EPISODE 3" at={course} size={34} font="mono" weight={500} style={{ position: "absolute", left: 0, right: 0, top: 610, textAlign: "center", letterSpacing: "0.2em" }} />
      </Frame>
    </PanelBackdrop>
  );
};

export const panels: Panels = { S8 };
