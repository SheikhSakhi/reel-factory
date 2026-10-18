// The patient: one warm amber light that travels the whole film.
import { at, atEnd, be, bs } from "./timing";
import { samplePath, smooth, type Key, type V3 } from "./lib";
import { MODEL, RULES, ST } from "./world";

const S = (st: V3, x: number, y: number, z = 0): V3 => [st[0] + x, st[1] + y, st[2] + z];

let keys: Key[] | null = null;
const build = (): Key[] => {
  const e = ST.expert, m = ST.ml;
  const g1 = RULES.gates[0], g4 = RULES.gates[3];
  return [
    { f: 0, v: S(ST.open, 0, 0, -0.2) },
    { f: at("B03", "follow"), v: S(ST.open, 0, 0, -0.2) },
    { f: be("B03") + 14, v: S(ST.open, 0, -0.6, -7) },
    { f: bs("B04") + 70, v: S(ST.ai, 0.2, -1.7, 3.5), ease: "linear" },
    { f: at("B04", "apply"), v: S(ST.ai, 2.75, -3.25, 0.6) },
    { f: be("B04") + 12, v: S(ST.ai, 2.75, -3.25, 0.6) },
    { f: bs("B06") + 10, v: S(e, 0, 6.4, 1.2) },
    { f: at("B06", "symptoms"), v: S(e, -1.7, 4.4, 0.7) },
    { f: at("B06", "findings") + 8, v: S(e, g1.x, g1.y, 0.7) },
    { f: at("B06", "suggest"), v: S(e, g4.x, g4.y, 0.7) },
    { f: be("B06") + 8, v: S(e, -1.1, -3.2, 0.7) },
    { f: at("B08", "complicated"), v: S(e, -1.1, -3.2, 0.7) },
    { f: be("B08") + 20, v: S(e, 0, -5.0, 1.6) },
    { f: at("B09", "patient"), v: S(m, -2.3, MODEL.y - 1.5, 1.0) },
    { f: at("B14", "new"), v: S(m, -2.3, MODEL.y - 1.5, 1.0) },
    { f: at("B14", "new") + 22, v: S(m, 0, MODEL.y + 1.7, 0.6) },
    { f: at("B14", "inference"), v: S(m, 0, MODEL.y, 0.6), ease: "in" },
    { f: at("B14", "inference") + 26, v: S(m, 0, MODEL.y - 1.9, 0.6), ease: "out" },
    { f: be("B15") + 10, v: S(m, 0, MODEL.y - 1.9, 0.6) },
    { f: at("B16", "chest"), v: S(ST.dl, 2.9, -4.0, 1.0) },
    { f: at("B18", "neural"), v: S(ST.dl, 2.9, -4.0, 1.0) },
    { f: at("B18", "layers"), v: S(ST.dl, 3.2, -2.6, 1.5) },
    { f: be("B21"), v: S(ST.dl, 3.2, -2.6, 1.5) },
    { f: bs("B23"), v: S(ST.gen, -2.7, -4.6, 0.8) },
    { f: be("B26"), v: S(ST.gen, -2.7, -4.6, 0.8) },
    { f: at("B27", "foundation"), v: S(ST.found, 0, -0.4, 2.2) },
    { f: be("B28"), v: S(ST.found, 0, -0.4, 2.2) },
    { f: at("B29", "connect"), v: S(ST.map, -1.6, -3.75, 0.6) },
    { f: at("B36", "computing"), v: S(ST.map, -1.6, -3.75, 0.6) },
    // descends with the camera and hovers above the compute grid
    { f: at("B37", "gpus") + 34, v: S(ST.gpu, -1.2, 8.0, 2.5) },
    { f: be("B38") - 10, v: S(ST.gpu, -1.2, 8.0, 2.5) },
    { f: at("B39", "medical"), v: S(ST.finale, 0, 0, 0) },
    { f: at("B41", "and"), v: S(ST.finale, 0, 0, 0) },
    // steps beside the output panel during the comparison, then returns to the centre
    { f: at("B41", "and") + 24, v: S(ST.finale, -3.0, -3.3, 0.8) },
    { f: be("B41") + 10, v: S(ST.finale, -3.0, -3.3, 0.8) },
    { f: at("B42", "knowing"), v: S(ST.finale, 0, 0, 0) },
  ];
};

export const patientAt = (frame: number): V3 => {
  keys ??= build();
  return samplePath(keys, frame);
};

/** Brightness of the patient light: discovered in the opening, never gone after that. */
export const patientGlow = (frame: number): number => {
  const found = smooth((frame - at("B03", "patient") + 8) / 22);
  const breathe = 1 + 0.06 * Math.sin(frame / 22);
  const end = frame > atEnd("B44", "specific") ? 1.15 : 1;
  // Steps back while the caution compares output with its record, then returns for the ending.
  const caution = smooth((frame - at("B41", "learning") + 6) / 16) * (1 - smooth((frame - be("B41") - 10) / 24));
  return found * breathe * end * (1 - 0.35 * caution);
};
