// World layout: where each act lives in the one continuous space.
import type { V3 } from "./lib";

export const ST = {
  open: [0, 0, -6] as V3,
  ai: [0, 0.5, -26] as V3,
  expert: [0, 0.5, -50] as V3,
  ml: [0, 0.5, -52] as V3, // same place as the rules: rules become examples in situ
  dl: [0, 0.5, -88] as V3,
  gen: [0, 0.5, -130] as V3,
  found: [0, -1.5, -154] as V3,
  map: [0, 1, -170] as V3,
  gpu: [0, -34, -166] as V3,
  finale: [0, 0.5, -196] as V3,
} as const;

export const FLOOR_Y = -7;
export const HALL = { zStart: 6, zEnd: -246, halfWidth: 11, top: 11, every: 9 } as const;

// Expert system network (local coords on the expert plane, facing +z).
export const RULES = {
  inputs: [
    { label: "fever", x: -2.6, y: 4.4 },
    { label: "cough", x: -0.87, y: 4.4 },
    { label: "low SpO₂", x: 0.87, y: 4.4 },
    { label: "crackles", x: 2.6, y: 4.4 },
  ],
  gates: [
    { label: "RULE 1", x: -2.0, y: 1.55 },
    { label: "RULE 2", x: 0, y: 1.55 },
    { label: "RULE 3", x: 2.0, y: 1.55 },
    { label: "RULE 4", x: -1.25, y: -1.25 },
    { label: "RULE 5", x: 1.25, y: -1.25 },
  ],
  outputs: [
    { label: "possibility A", x: -2.28, y: -4.1 },
    { label: "possibility B", x: 0, y: -4.1 },
    { label: "possibility C", x: 2.28, y: -4.1 },
  ],
  // [fromKind, fromIndex, toKind, toIndex]; i = input, g = gate, o = output
  edges: [
    ["i", 0, "g", 0], ["i", 1, "g", 0], ["i", 1, "g", 1], ["i", 2, "g", 1], ["i", 2, "g", 2], ["i", 3, "g", 2],
    ["g", 0, "g", 3], ["g", 1, "g", 3], ["g", 1, "g", 4], ["g", 2, "g", 4],
    ["g", 3, "o", 0], ["g", 3, "o", 1], ["g", 4, "o", 1], ["g", 4, "o", 2],
  ] as const,
  // Edges the patient's findings activate, in firing order (edge index, step 0..4).
  lit: [[0, 0], [1, 0], [5, 0], [6, 1], [9, 1], [10, 2], [11, 2], [12, 2]] as const,
  litInputs: [0, 1, 3],
  litOutputs: [0, 1],
} as const;

export type RuleNode = { readonly x: number; readonly y: number };
export const ruleNode = (kind: "i" | "g" | "o", i: number): RuleNode =>
  kind === "i" ? RULES.inputs[i] : kind === "g" ? RULES.gates[i] : RULES.outputs[i];

/** Manhattan route for an edge: down, across, down. Returns polyline points (local x,y). */
export const edgeRoute = (e: readonly [string, number, string, number]): [number, number][] => {
  const a = ruleNode(e[0] as "i", e[1]), b = ruleNode(e[2] as "g", e[3]);
  const midY = (a.y + b.y) / 2;
  return [[a.x, a.y - 0.42], [a.x, midY], [b.x, midY], [b.x, b.y + 0.42]];
};

// Machine-learning archive (local to ST.ml).
export const ARCHIVE = { cols: 7, rows: 24, layers: 3, cells: 8, dx: 1.08, dy: 0.27, dz: 2.2, top: 6.6 } as const;
export const RECORD_COUNT = ARCHIVE.cols * ARCHIVE.rows * ARCHIVE.layers;
export const recordPos = (r: number): V3 => {
  const layer = Math.floor(r / (ARCHIVE.cols * ARCHIVE.rows));
  const inLayer = r % (ARCHIVE.cols * ARCHIVE.rows);
  const row = Math.floor(inLayer / ARCHIVE.cols), col = inLayer % ARCHIVE.cols;
  return [(col - (ARCHIVE.cols - 1) / 2) * ARCHIVE.dx, ARCHIVE.top - row * ARCHIVE.dy, -layer * ARCHIVE.dz];
};
/** Records pulled forward for text glimpses (index in front layer). */
export const FEATURED = [
  { r: 7 * 4 + 2, side: -1 },
  { r: 7 * 10 + 4, side: 1 },
  { r: 7 * 16 + 2, side: -1 },
] as const;
export const MODEL = { y: -1.95, w: 3.3, h: 1.6 } as const;

// Deep-learning stack (local to ST.dl).
export const PIX = { n: 64, size: 7.0 } as const;
export const LAYERS = [
  { z: -5.0, size: 6.1, tex: "feat1.png", name: "edges" },
  { z: -10.0, size: 5.2, tex: "feat2.png", name: "textures" },
  { z: -15.0, size: 4.3, tex: "feat3.png", name: "parts" },
  { z: -20.0, size: 3.3, tex: "feat4.png", name: "complex patterns" },
] as const;

// Nested map (local to ST.map, vertical plane facing +z).
export const MAP = {
  ai: { c: [0, 0.5] as const, r: 3.3 },
  ml: { c: [0, -0.35] as const, r: 2.25 },
  dl: { c: [0, -1.05] as const, r: 1.3 },
  gen: { c: [1.0, -1.6] as const, r: 0.9 },
} as const;
