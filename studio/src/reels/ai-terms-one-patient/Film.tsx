// "Follow One Patient": AI, machine learning, deep learning and generative AI for doctors.
// Layers: 3D world (ThreeCanvas) · type in camera space · optional captions · narration / score / effects.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { BLOCKS, FILM_DURATION, bs } from "./timing";
import { C, ensureFonts } from "./style";
import { makeCamera, FOV } from "./camera";
import { H, W } from "./projection";
import { Spine } from "./spine/Spine";
import { CameraRig, DeepPlanes, FoundationSlab, FoundationTasks, GpuField, Hall, ModelCore, PageSurface, Patient, TermSlabs } from "./scene/Scene";
import { CamContext } from "./overlay/primitives";
import { AiType, ExpertType, MlType, OpenType, TomlType } from "./overlay/ActsA";
import { CautionType, ComputeType, DlType, EndType, FoundType, GenType, RelateType, ReturnType } from "./overlay/ActsB";
import { Captions } from "./overlay/Captions";
import { actEnd, actStart, type Act } from "./timing";
import { useTexturesReady } from "./scene/textures";

export const FILM_ID = "ai-terms-one-patient";
export { FILM_DURATION };

ensureFonts();

const World: React.FC = () => {
  const ready = useTexturesReady();
  return ready ? <WorldCanvas /> : null;
};

const WorldCanvas: React.FC = () => (
  <ThreeCanvas width={W} height={H} camera={{ fov: FOV, near: 0.1, far: 400, position: [0, 0, 20] }}
    gl={{ antialias: true, toneMapping: THREE.NoToneMapping }} style={{ position: "absolute" }}>
    <color attach="background" args={[C.void]} />
    <fog attach="fog" args={[C.void, 16, 58]} />
    <ambientLight intensity={0.35} color="#9fb4d6" />
    <directionalLight position={[6, 10, 8]} intensity={0.9} color="#cfe3ff" />
    <CameraRig />
    <Hall />
    <TermSlabs />
    <ModelCore />
    <DeepPlanes />
    <PageSurface />
    <FoundationTasks />
    <FoundationSlab />
    <GpuField />
    <Spine />
    <Patient />
  </ThreeCanvas>
);

/** Mounts an act's typography only around its own time window. */
const During: React.FC<{ acts: Act[]; pad?: number; children: React.ReactNode }> = ({ acts, pad = 90, children }) => {
  const frame = useCurrentFrame();
  const from = Math.min(...acts.map(actStart)) - pad, to = Math.max(...acts.map(actEnd)) + pad;
  return frame >= from && frame <= to ? <>{children}</> : null;
};

const TypeLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = makeCamera(frame);
  return (
    <CamContext.Provider value={cam}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <During acts={["open"]}><OpenType /></During>
        <During acts={["ai", "expert"]}><AiType /></During>
        <During acts={["expert", "toml"]}><ExpertType /></During>
        <During acts={["toml"]}><TomlType /></During>
        <During acts={["ml", "infer"]}><MlType /></During>
        <During acts={["dl"]}><DlType /></During>
        <During acts={["gen"]}><GenType /></During>
        <During acts={["found"]}><FoundType /></During>
        <During acts={["relate"]}><RelateType /></During>
        <During acts={["compute"]}><ComputeType /></During>
        <During acts={["return", "caution"]}><ReturnType /></During>
        <During acts={["caution"]}><CautionType /></During>
        <During acts={["end"]}><EndType /></During>
      </AbsoluteFill>
    </CamContext.Provider>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 120% 85% at 50% 48%, transparent 55%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
);

export const SoundLayers: React.FC = () => (
  <>
    {BLOCKS.map((b) => (b.file ? (
      <Sequence key={b.id} from={bs(b.id)} layout="none" name={`vo ${b.id}`}>
        <Audio src={staticFile(b.file)} volume={1} />
      </Sequence>
    ) : null))}
    <Audio src={staticFile("ai-terms/score.wav")} volume={1} name="score" />
    <Audio src={staticFile("ai-terms/fx.wav")} volume={1} name="effects" />
  </>
);

export const Film: React.FC<{ captions?: boolean }> = ({ captions = false }) => (
  <AbsoluteFill style={{ backgroundColor: C.void }}>
    <World />
    <Vignette />
    <TypeLayer />
    {captions ? <Captions /> : null}
    <SoundLayers />
  </AbsoluteFill>
);

export const FilmClean: React.FC = () => <Film />;
export const FilmCaptioned: React.FC = () => <Film captions />;
