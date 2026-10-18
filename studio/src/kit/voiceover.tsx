import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { REEL } from "./theme";

/**
 * Voice-over timing from `scripts/vo.py` (public/vo/<slug>/take.json).
 *
 *   import takeJson from "../../../public/vo/my-reel/take.json";
 *   export const TAKE = loadTake(takeJson);
 *   const hit = wordFrame(TAKE, "S3", "sixteen");   // absolute frame the word starts
 *
 * Derive every beat from word lookups instead of hard-coding frames: when the
 * voice-over is re-synthesized, the reel retimes itself.
 *
 * Frames here are ABSOLUTE (reel timeline). Inside a scene's <Sequence from={s.from}>,
 * useCurrentFrame() is local, so use `wordFrame(...) - s.from` there. Mount <VoiceOver>,
 * <Captions> and <SfxTrack> at the reel root, outside scene Sequences.
 */

export type VoWord = {
  /** Token from the script text, punctuation included (used for captions). */
  readonly token: string;
  readonly frame: number;
  readonly endFrame: number;
};

export type VoScene = {
  readonly id: string;
  readonly text: string;
  readonly from: number;
  readonly to: number;
  readonly speechEnd: number;
  readonly words: readonly VoWord[];
};

export type VoTake = {
  readonly file: string;
  readonly totalFrames: number;
  readonly scenes: readonly VoScene[];
};

function fail(message: string): never {
  throw new Error(`voice-over take.json: ${message}`);
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null;

const readWord = (raw: unknown, where: string): VoWord => {
  if (!isObj(raw) || typeof raw.token !== "string" || !isNum(raw.frame) || !isNum(raw.endFrame)) fail(`bad word in ${where}`);
  return { token: raw.token, frame: raw.frame, endFrame: raw.endFrame };
};

const readScene = (raw: unknown, index: number): VoScene => {
  if (!isObj(raw) || typeof raw.id !== "string" || typeof raw.text !== "string" || !Array.isArray(raw.words) || raw.words.length === 0) {
    fail(`scene ${index} is malformed`);
  }
  const { id, text, from, to, speechEnd } = raw;
  if (!isNum(from) || !isNum(to) || !isNum(speechEnd)) fail(`scene ${id} has non-numeric frames`);
  const words = raw.words.map((w, i) => readWord(w, `${id} word ${i}`));
  return { id, text, from, to, speechEnd, words };
};

/** Validates take.json (imported as JSON) and returns typed, contiguous scenes. Throws on any mismatch. */
export const loadTake = (raw: unknown): VoTake => {
  if (!isObj(raw) || typeof raw.file !== "string" || !isNum(raw.totalFrames) || !Array.isArray(raw.scenes)) {
    fail("missing file, totalFrames or scenes");
  }
  if (raw.fps !== REEL.fps) fail(`fps is ${String(raw.fps)}, the studio renders at ${REEL.fps}`);
  const scenes = raw.scenes.map(readScene);
  scenes.forEach((s, i) => {
    const expectedFrom = i === 0 ? 0 : scenes[i - 1].to;
    if (s.from !== expectedFrom) fail(`${s.id} starts at ${s.from}, expected ${expectedFrom}`);
    if (s.to <= s.from) fail(`${s.id} has an empty range`);
  });
  const last = scenes[scenes.length - 1];
  if (last.to !== raw.totalFrames) fail(`scenes end at ${last.to}, totalFrames is ${raw.totalFrames}`);
  return { file: raw.file, totalFrames: raw.totalFrames, scenes };
};

export const scene = (take: VoTake, id: string): VoScene =>
  take.scenes.find((s) => s.id === id) ?? fail(`no scene ${id}`);

/** Lower-cased token without surrounding punctuation, any language: "advice?" matches "advice". */
export const normToken = (s: string): string => s.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

const findWord = (take: VoTake, sceneId: string, token: string, occurrence: number): VoWord => {
  const hits = scene(take, sceneId).words.filter((w) => normToken(w.token) === normToken(token));
  return hits[occurrence] ?? fail(`word "${token}" (#${occurrence}) not spoken in ${sceneId}`);
};

/** Absolute frame where a spoken word starts. `occurrence` picks the n-th match (0-based). */
export const wordFrame = (take: VoTake, sceneId: string, token: string, occurrence = 0): number =>
  findWord(take, sceneId, token, occurrence).frame;

/** Absolute frame where a spoken word ends. */
export const wordEnd = (take: VoTake, sceneId: string, token: string, occurrence = 0): number =>
  findWord(take, sceneId, token, occurrence).endFrame;

/** Default make-up gain: edge-tts speech is quiet for Reels. Measure with `npm run audio-check` (peak must stay below -1 dBFS). */
export const VO_GAIN = 1.5;

/** Plays the take from frame 0. Remotion amplifies volumes above 1 in the final render (the Studio preview caps at 1). */
export const VoiceOver: React.FC<{ take: VoTake; volume?: number }> = ({ take, volume = VO_GAIN }) => (
  <Sequence from={0} durationInFrames={take.totalFrames} layout="none" name="Voice-over">
    <Audio src={staticFile(take.file)} volume={volume} />
  </Sequence>
);
