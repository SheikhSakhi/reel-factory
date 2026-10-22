import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { REEL } from "./theme";

/**
 * Your own recording, edited by scripts/edit.py (public/edit/<slug>/edit.json):
 *
 *   import editJson from "../../../public/edit/my-reel/edit.json";
 *   import takeJson from "../../../public/edit/my-reel/take.json";
 *   const EDIT = loadEdit(editJson);
 *   const TAKE = loadTake(takeJson);          // word frames on the edited timeline
 *   <TalkingHead edit={EDIT} />               // then Captions, SeriesChrome, overlays on top
 *
 * Plays the kept stretches back to back, reframes to 9:16 around the speaker's face, and
 * alternates a punch-in zoom on every cut so jump cuts read as intentional. The audio comes
 * from the video itself (already cleaned and loudness-normalised); do not mount <VoiceOver>.
 */
export type EditSegment = { readonly from: number; readonly durationInFrames: number; readonly startFrom: number };
export type FacePoint = { readonly t: number; readonly x: number; readonly y: number; readonly size: number };
export type Edit = {
  readonly source: string;
  readonly width: number;
  readonly height: number;
  readonly totalFrames: number;
  readonly segments: readonly EditSegment[];
  readonly face: readonly FacePoint[];
};

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Validates edit.json (imported as JSON). Throws on any mismatch. */
export const loadEdit = (raw: unknown): Edit => {
  if (!isObj(raw) || typeof raw.source !== "string" || !isNum(raw.width) || !isNum(raw.height) || !isNum(raw.totalFrames)
    || !Array.isArray(raw.segments) || !Array.isArray(raw.face)) {
    throw new Error("edit.json: missing source, size, totalFrames, segments or face (re-run scripts/edit.py apply)");
  }
  if (raw.fps !== REEL.fps) throw new Error(`edit.json: fps is ${String(raw.fps)}, the studio renders at ${REEL.fps}`);
  const segments = raw.segments.map((s, i) => {
    if (!isObj(s) || !isNum(s.from) || !isNum(s.durationInFrames) || !isNum(s.startFrom)) throw new Error(`edit.json: bad segment ${i}`);
    return { from: s.from, durationInFrames: s.durationInFrames, startFrom: s.startFrom };
  });
  const face = raw.face.filter((p): p is FacePoint => isObj(p) && isNum(p.t) && isNum(p.x) && isNum(p.y) && isNum(p.size));
  return { source: raw.source, width: raw.width, height: raw.height, totalFrames: raw.totalFrames, segments, face };
};

/** Face centre at a source time, linearly interpolated; centre of frame when there is no track. */
const faceAt = (face: readonly FacePoint[], t: number): FacePoint => {
  if (face.length === 0) return { t, x: 0.5, y: 0.4, size: 0.3 };
  const next = face.findIndex((p) => p.t >= t);
  if (next <= 0) return face[next === 0 ? 0 : face.length - 1];
  const a = face[next - 1];
  const b = face[next];
  const k = (t - a.t) / (b.t - a.t || 1);
  return { t, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, size: a.size + (b.size - a.size) * k };
};

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** A punch-in on an emphasis word: absolute frame, extra zoom, frames held. */
export type Punch = { readonly frame: number; readonly scale: number; readonly hold: number };

const punchAt = (punches: readonly Punch[], frame: number): number =>
  punches.reduce((z, p) => {
    const k = interpolate(frame, [p.frame, p.frame + 5, p.frame + p.hold, p.frame + p.hold + 8], [0, 1, 1, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return z * (1 + (p.scale - 1) * k);
  }, 1);

type Props = {
  readonly edit: Edit;
  /** Extra punch-ins on emphasis words (absolute frames on the edited timeline). */
  readonly punches?: readonly Punch[];
  /** Zoom on even / odd cuts. [1, 1.12] alternates wide and punched-in. */
  readonly zooms?: readonly [number, number];
  /** Where the face sits vertically, in px. Default 760 keeps it above the caption band. */
  readonly faceY?: number;
  /** Frames of audio fade at each cut (prevents clicks). */
  readonly audioFade?: number;
  readonly volume?: number;
};

const Shot: React.FC<{ edit: Edit; seg: EditSegment; zoom: number; faceY: number; audioFade: number; volume: number; punches: readonly Punch[] }> = ({
  edit, seg, zoom, faceY, audioFade, volume, punches,
}) => {
  const f = useCurrentFrame();
  const face = faceAt(edit.face, (seg.startFrom + f) / REEL.fps);
  const scale = Math.max(REEL.width / edit.width, REEL.height / edit.height) * zoom * punchAt(punches, seg.from + f);
  const w = edit.width * scale;
  const h = edit.height * scale;
  const left = clamp(REEL.width / 2 - face.x * w, REEL.width - w, 0);
  const top = clamp(faceY - face.y * h, REEL.height - h, 0);
  const d = seg.durationInFrames;
  return (
    <OffthreadVideo
      src={staticFile(edit.source)}
      startFrom={seg.startFrom}
      endAt={seg.startFrom + d}
      volume={(v) => volume * interpolate(v, [0, audioFade, d - audioFade, d], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      style={{ position: "absolute", left, top, width: w, height: h, maxWidth: "none" }}
    />
  );
};

export const TalkingHead: React.FC<Props> = ({ edit, punches = [], zooms = [1, 1.12], faceY = 760, audioFade = 2, volume = 1 }) => (
  <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
    {edit.segments.map((seg, i) => (
      <Sequence key={seg.from} from={seg.from} durationInFrames={seg.durationInFrames} name={`cut ${i + 1}`}>
        <Shot edit={edit} seg={seg} zoom={zooms[i % 2]} faceY={faceY} audioFade={audioFade} volume={volume} punches={punches} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
