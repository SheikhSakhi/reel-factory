// Timing master. Every beat in the film is anchored to a narration word from timing.json
// (built by scripts/narration.py). Retiming the voice re-syncs the whole film.
import manifest from "./timing.json";

export const FPS = 30;

export type Word = { readonly word: string; readonly start: number; readonly end: number };
export type Block = {
  readonly id: string; readonly act: string; readonly text: string; readonly file: string | null;
  readonly start: number; readonly duration: number; readonly words: readonly Word[];
};

export const BLOCKS = manifest.blocks as readonly Block[];
export const PLACEHOLDER_VO = manifest.placeholder;
export const FILM_DURATION = Math.round(manifest.durationSeconds * FPS);

const BY_ID = new Map(BLOCKS.map((b) => [b.id, b]));
const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const toFrame = (seconds: number): number => Math.round(seconds * FPS);

const block = (id: string): Block => {
  const b = BY_ID.get(id);
  if (!b) throw new Error(`unknown narration block ${id}`);
  return b;
};

/** First frame of a block's speech. */
export const bs = (id: string): number => toFrame(block(id).start);
/** Frame where a block's speech ends. */
export const be = (id: string): number => toFrame(block(id).start + block(id).duration);

/** Frame where `word` (nth occurrence, 0-based) starts inside block `id`. */
export const at = (id: string, word: string, nth = 0): number => {
  const target = norm(word);
  const hits = block(id).words.filter((w) => norm(w.word) === target);
  const hit = hits[nth];
  if (!hit) throw new Error(`word "${word}" #${nth} not found in ${id}`);
  return toFrame(hit.start);
};

/** Frame where `word` ends. */
export const atEnd = (id: string, word: string, nth = 0): number => {
  const target = norm(word);
  const hit = block(id).words.filter((w) => norm(w.word) === target)[nth];
  if (!hit) throw new Error(`word "${word}" #${nth} not found in ${id}`);
  return toFrame(hit.end);
};

/** Act boundaries: an act runs from its first block's start to the next act's start. */
export const ACT_ORDER = [
  "open", "ai", "expert", "toml", "ml", "infer", "dl", "gen", "found", "relate", "compute", "return", "caution", "end",
] as const;
export type Act = (typeof ACT_ORDER)[number];

export const actStart = (act: Act): number => {
  const first = BLOCKS.find((b) => b.act === act);
  if (!first) throw new Error(`no blocks for act ${act}`);
  return act === "open" ? 0 : toFrame(first.start);
};
export const actEnd = (act: Act): number => {
  const i = ACT_ORDER.indexOf(act);
  return i === ACT_ORDER.length - 1 ? FILM_DURATION : actStart(ACT_ORDER[i + 1]);
};
