import React from "react";
import { useCurrentFrame } from "remotion";
import { BrainCircuit, Stethoscope } from "lucide";
import { Appear, DrawIcon, Label, PanelBackdrop, SketchArrow, Stamp, Tick, pop, progress, usePanel, usePanelAt, type Panels } from "../../kit";

// NVIDIA Journey S1E2: panels for the talking-head first half, matched to the creator's own panels in the second
// half (near-black, thin white outlines, serif labels, mono captions, one amber glow).

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

/** S2: a doctor, and six years of building AI for healthcare. */
const S2: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const different = usePanelAt("S2:different");
  const doctor = usePanelAt("S2:doctor.");
  const building = usePanelAt("S2:building");
  const six = usePanelAt("S2:6");
  const years = Math.round(Math.min(6, Math.max(0, (f - six + 4) / 3)));
  return (
    <PanelBackdrop glow={AMBER} light="top-left">
      <Label text="A different discipline" at={different - 6} size={30} font="mono" weight={500} color={theme.muted} style={{ position: "absolute", left: 80, top: 90, letterSpacing: "0.12em" }} />
      <Frame at={different} x={80} y={170} w={400} h={470} tag="MEDICINE">
        <div style={{ position: "absolute", left: 85, top: 80 }}><DrawIcon icon={Stethoscope} size={230} color={theme.fg} at={different + 6} duration={30} strokeWidth={1.1} /></div>
        <Label text="Doctor" at={doctor} size={58} style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center" }} />
      </Frame>
      <SketchArrow from={[500, 400]} to={[590, 400]} color={AMBER} at={building} bend={0.05} />
      <Frame at={building} x={600} y={170} w={400} h={470} tag="AI FOR HEALTHCARE" color={AMBER}>
        <div style={{ position: "absolute", left: 85, top: 80 }}><DrawIcon icon={BrainCircuit} size={230} color={AMBER} at={building + 4} duration={22} strokeWidth={1.1} /></div>
        <Label text="Building tools" at={building + 8} size={50} style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center" }} />
      </Frame>
      {f >= six - 4 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 680, textAlign: "center", opacity: pop(f, six - 4) }}>
          <span style={{ fontFamily: theme.fontDisplay, fontSize: 130, color: theme.fg }}>{years}</span>
          <span style={{ fontFamily: theme.fontMono, fontSize: 34, letterSpacing: "0.14em", color: theme.muted, marginLeft: 18 }}>YEARS</span>
        </div>
      ) : null}
    </PanelBackdrop>
  );
};

const Row: React.FC<{ label: string; at: number; ok: boolean; y: number }> = ({ label, at, ok, y }) => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  return (
    <Appear at={at - 4} from="left" style={{ position: "absolute", left: 110, top: y, display: "flex", alignItems: "center", gap: 30 }}>
      <div style={{ width: 82, height: 82, border: `2px solid ${theme.fg}88`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {ok ? <Tick color={AMBER} at={at + 4} size={60} /> : (
          <svg width={54} height={54} viewBox="0 0 24 24" style={{ opacity: progress(f, at + 4, 8) }}>
            <path d="M5 5 L19 19 M19 5 L5 19" stroke="#E5675A" strokeWidth={2.4} strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div style={{ fontFamily: theme.fontDisplay, fontSize: 70, color: ok ? theme.fg : theme.muted }}>{label}</div>
    </Appear>
  );
};

/** S3: experience yes, certificate no, so: get NVIDIA certified. */
const S3: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const experience = usePanelAt("S3:experience,");
  const certificate = usePanelAt("S3:certificate.");
  const official = usePanelAt("S3:official");
  const certified = usePanelAt("S3:certified.");
  const card = pop(f, official - 4, 16);
  return (
    <PanelBackdrop glow={AMBER} light="top-left">
      <Row label="Experience" at={experience} ok y={130} />
      <Row label="Certificate" at={certificate} ok={false} y={260} />
      {f >= official - 4 ? (
        <div style={{ position: "absolute", left: 150, right: 150, top: 440, height: 380, background: "#F3EEE3", borderRadius: 10, padding: "34px 40px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)", transform: `translateY(${(1 - card) * 120}px) rotate(${-2 * card}deg)`, opacity: Math.min(1, card * 1.5) }}>
          <div style={{ border: "2px solid #2A232022", height: "100%", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ fontFamily: theme.fontMono, fontSize: 22, letterSpacing: "0.2em", color: "#6B6459" }}>NVIDIA DEEP LEARNING INSTITUTE</div>
            <div style={{ fontFamily: theme.fontDisplay, fontStyle: "italic", fontSize: 64, color: "#2A2320" }}>Certificate</div>
            <div style={{ width: 300, height: 2, background: "#2A232033" }} />
            <div style={{ fontFamily: theme.fontBody, fontWeight: 600, fontSize: 26, color: "#6B6459" }}>A doctor's journey · Season 1</div>
          </div>
          <div style={{ position: "absolute", right: 30, bottom: 26 }}><Stamp text="IN PROGRESS" color="#C0532F" at={certified} size={34} rotate={-10} /></div>
        </div>
      ) : null}
    </PanelBackdrop>
  );
};

const Bubble: React.FC<{ text: string; at: number; x: number; y: number }> = ({ text, at, x, y }) => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const t = pop(f, at, 13);
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, fontFamily: theme.fontMono, fontSize: 30, color: theme.fg, padding: "16px 24px",
      border: `2px solid ${theme.fg}55`, borderRadius: 22, borderBottomLeftRadius: 4, background: "#141924", transform: `scale(${0.8 + 0.2 * t})`, opacity: Math.min(1, t * 1.5) }}>
      {text}
    </div>
  );
};

/** S5: lesson one, and the tech-team jargon it decodes. */
const S5: React.FC = () => {
  const { theme } = usePanel();
  const f = useCurrentFrame();
  const useful = usePanelAt("S5:useful");
  const lessons = usePanelAt("S5:lessons.");
  const conversations = usePanelAt("S5:conversations");
  const team = usePanelAt("S5:team");
  const easier = usePanelAt("S5:easier");
  const clear = progress(f, easier, 14);
  return (
    <PanelBackdrop glow={AMBER} light="top-left">
      <Label text="LESSON 01" at={useful} size={30} font="mono" weight={500} color={AMBER} style={{ position: "absolute", left: 80, top: 90, letterSpacing: "0.2em" }} />
      <Label text="From my first lessons" at={lessons} size={62} style={{ position: "absolute", left: 80, top: 140 }} />
      <Label text="TECH TEAM" at={conversations} size={22} font="mono" weight={500} color={theme.muted} style={{ position: "absolute", left: 80, top: 290, letterSpacing: "0.16em" }} />
      <div style={{ opacity: 1 - clear * 0.55, filter: `blur(${(1 - clear) * 0}px)` }}>
        <Bubble text="We use AI." at={conversations} x={80} y={340} />
        <Bubble text="It's a deep learning model." at={conversations + 8} x={250} y={450} />
        <Bubble text="Plus a generative layer." at={team} x={120} y={560} />
      </div>
      <Glow at={easier} x={880} y={640} size={34} />
      <Label text="now I can follow" at={easier + 4} size={46} italic color={AMBER} style={{ position: "absolute", right: 80, top: 690 }} />
    </PanelBackdrop>
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

export const panels: Panels = { S2, S3, S5, S8 };
