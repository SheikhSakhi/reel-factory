// The training loop schedule, shared by the archive, the model core, the labels and the sound.
import { at, be } from "./timing";

export type TrainState = {
  readonly active: boolean;
  readonly k: number;          // cycle index
  readonly phase: number;      // 0..1 inside the cycle
  readonly pulse: number;      // batch highlight 0..1
  readonly batch: readonly number[];
  readonly known: 0 | 1;       // known outcome of this cycle's example
  readonly predicted: number;  // model estimate 0..1 shown this cycle
  readonly error: number;      // |known - predicted|
  readonly settings: readonly number[]; // internal settings 0..1 after this cycle's adjustment
};

const N_SETTINGS = 12;
const TARGET = Array.from({ length: N_SETTINGS }, (_, j) => 0.25 + 0.6 * ((Math.sin(j * 2.3 + 1) + 1) / 2));
const START = Array.from({ length: N_SETTINGS }, (_, j) => 0.2 + 0.6 * ((Math.cos(j * 1.7) + 1) / 2));

let cache: number[] | null = null;
/** Cycle start frames: long at first, tightening as training gets into rhythm. */
export const cycleStarts = (): number[] => {
  if (cache) return cache;
  const from = at("B11", "train") - 2, to = at("B14", "trained");
  const out: number[] = [];
  let f = from, d = 34;
  while (f + d <= to) { out.push(Math.round(f)); f += d; d = Math.max(15, d * 0.88); }
  out.push(to);
  cache = out;
  return out;
};

const decay = (k: number): number => 0.78 ** k;

export const TRAIN = {
  start: (): number => cycleStarts()[0],
  end: (): number => cycleStarts()[cycleStarts().length - 1],
  settingsAt: (k: number): number[] => TARGET.map((t, j) => t + (START[j] - t) * decay(k)),
  state: (f: number): TrainState => {
    const starts = cycleStarts();
    const end = starts[starts.length - 1];
    const finalSettings = TARGET.map((t, j) => t + (START[j] - t) * decay(starts.length - 1));
    if (f < starts[0] || f >= end) {
      const after = f >= end;
      return {
        active: false, k: after ? starts.length - 1 : 0, phase: 0, pulse: 0, batch: [], known: 1,
        predicted: after ? 0.97 : 0.4, error: 0, settings: after ? finalSettings : START,
      };
    }
    let k = 0;
    while (k < starts.length - 2 && f >= starts[k + 1]) k++;
    const len = starts[k + 1] - starts[k];
    const phase = (f - starts[k]) / len;
    const known: 0 | 1 = k % 3 === 1 ? 0 : 1;
    const err = 0.62 * decay(k) * (k % 2 === 0 ? 1 : 0.85);
    const predicted = known === 1 ? 1 - err : err;
    const prev = TARGET.map((t, j) => t + (START[j] - t) * decay(k));
    const next = TARGET.map((t, j) => t + (START[j] - t) * decay(k + 1));
    const adj = Math.min(1, Math.max(0, (phase - 0.62) / 0.3));
    const settings = prev.map((p, j) => p + (next[j] - p) * adj);
    const batch = Array.from({ length: 9 }, (_, j) => (k * 31 + j * 11) % 97);
    const pulse = Math.max(0, 1 - phase * 3);
    return { active: true, k, phase, pulse, batch, known, predicted, error: err, settings };
  },
  /** Frame where the trained model is shown as finished (B14 "trained"). */
  settledAt: (): number => at("B14", "trained"),
  inferenceEnd: (): number => be("B15"),
};
