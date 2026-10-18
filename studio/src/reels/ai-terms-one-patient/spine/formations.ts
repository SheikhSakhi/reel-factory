// Bead formations. Every formation fills the same N beads, so the film can morph between them.
import * as THREE from "three";
import { rnd, type V3 } from "../lib";
import {
  ARCHIVE, FEATURED, LAYERS, MAP, PIX, RECORD_COUNT, RULES, ST, edgeRoute, recordPos,
} from "../world";
import xray64 from "../../../../public/ai-terms/xray64.json";
import { C } from "../style";

export const N = 4096;

export type Buf = { pos: Float32Array; scl: Float32Array; col: Float32Array; order: Float32Array };

export const makeBuf = (): Buf => ({
  pos: new Float32Array(N * 3), scl: new Float32Array(N * 3), col: new Float32Array(N * 3), order: new Float32Array(N),
});

const lin = (hex: string): [number, number, number] => {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
};
export const COL = {
  ink: lin(C.ink), cyan: lin(C.cyan), amber: lin(C.amber), green: lin(C.green), muted: lin(C.muted), metal: lin(C.metal),
};

type Writer = {
  put: (p: V3, s: V3, c: readonly number[], k?: number, order?: number) => number;
  rest: (center: V3) => void;
  count: () => number;
};

/** Sequential writer; beads not written are parked invisibly at `center`. */
const writer = (b: Buf): Writer => {
  let i = 0;
  return {
    put: (p, s, c, k = 1, order) => {
      if (i >= N) return -1;
      b.pos.set(p, i * 3); b.scl.set(s, i * 3);
      b.col[i * 3] = c[0] * k; b.col[i * 3 + 1] = c[1] * k; b.col[i * 3 + 2] = c[2] * k;
      b.order[i] = order ?? 0;
      return i++;
    },
    rest: (center) => {
      for (let j = i; j < N; j++) {
        b.pos.set(center, j * 3); b.scl.set([0, 0, 0], j * 3); b.col.set([0, 0, 0], j * 3);
        b.order[j] = 1;
      }
    },
    count: () => i,
  };
};

const at = (o: V3, x: number, y: number, z = 0): V3 => [o[0] + x, o[1] + y, o[2] + z];

/** Dotted polyline: beads every `step` along the points. Returns bead indices with their arc position 0..1. */
const polyline = (w: Writer, pts: V3[], step: number, size: number, col: readonly number[], k: number) => {
  const segs: number[] = [];
  let total = 0;
  for (let s = 0; s < pts.length - 1; s++) {
    const d = Math.hypot(pts[s + 1][0] - pts[s][0], pts[s + 1][1] - pts[s][1], pts[s + 1][2] - pts[s][2]);
    segs.push(d); total += d;
  }
  const out: { i: number; t: number }[] = [];
  const n = Math.max(2, Math.round(total / step));
  for (let j = 0; j <= n; j++) {
    let dist = (j / n) * total, s = 0;
    while (s < segs.length - 1 && dist > segs[s]) { dist -= segs[s]; s++; }
    const u = segs[s] ? dist / segs[s] : 0;
    const a = pts[s], b = pts[s + 1];
    const p: V3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    const i = w.put(p, [size, size, size], col, k, 1 - (p[1] + 10) / 20);
    if (i >= 0) out.push({ i, t: j / n });
  }
  return out;
};

const rectOutline = (cx: number, cy: number, w: number, h: number, z: number, o: V3): V3[] => [
  at(o, cx - w / 2, cy + h / 2, z), at(o, cx + w / 2, cy + h / 2, z), at(o, cx + w / 2, cy - h / 2, z),
  at(o, cx - w / 2, cy - h / 2, z), at(o, cx - w / 2, cy + h / 2, z),
];

const circle = (o: V3, cx: number, cy: number, r: number, n: number, z = 0): V3[] =>
  Array.from({ length: n + 1 }, (_, j) => at(o, cx + r * Math.cos((j / n) * Math.PI * 2 + Math.PI / 2), cy + r * Math.sin((j / n) * Math.PI * 2 + Math.PI / 2), z));

// ---------------------------------------------------------------- formations

export const hidden = (center: V3): Buf => {
  const b = makeBuf();
  writer(b).rest(center);
  return b;
};

/** Opening: the four tiers joined into one structure (rods + tier outlines). */
export const TIER_Y = [3.45, 1.15, -1.15, -3.45] as const;
export const TIER = { w: 5.4, h: 1.5 } as const;
export const openStructure = (): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.open;
  for (const x of [-TIER.w / 2 - 0.15, TIER.w / 2 + 0.15]) for (const z of [-0.6, 0.6]) {
    polyline(w, [at(o, x, 4.6, z), at(o, x, -4.6, z)], 0.07, 0.035, COL.cyan, 0.55);
  }
  polyline(w, [at(o, 0, 4.9, -0.4), at(o, 0, -4.9, -0.4)], 0.06, 0.04, COL.amber, 0.35);
  for (const y of TIER_Y) {
    polyline(w, rectOutline(0, y, TIER.w + 0.3, TIER.h + 0.2, -0.6, o), 0.07, 0.03, COL.ink, 0.35);
    for (const x of [-TIER.w / 2 - 0.15, TIER.w / 2 + 0.15]) polyline(w, [at(o, x, y, -0.6), at(o, x, y, 0.6)], 0.07, 0.03, COL.cyan, 0.5);
  }
  w.rest(o);
  return b;
};

/** AI act: three capability glyphs stacked in the hall. */
export const AI_GLYPH_Y = [3.25, 0, -3.25] as const;
export const aiGlyphs = (): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.ai;
  // recognize patterns: dot field with a diagonal pattern picked out
  for (let r = 0; r < 12; r++) for (let c = 0; c < 22; c++) {
    const on = (r + c) % 5 === 0 || (r - c + 40) % 7 === 0;
    w.put(at(o, -2.1 + c * 0.2, AI_GLYPH_Y[0] + 1.1 - r * 0.2, 0), [0.07, 0.07, 0.07], on ? COL.cyan : COL.muted, on ? 0.9 : 0.22);
  }
  // interpret language: lines of word-bars
  for (let line = 0; line < 6; line++) {
    let x = -2.1;
    let wi = 0;
    while (x < 2.1) {
      const len = 0.25 + rnd(`aiw${line}-${wi++}`) * 0.6;
      const end = Math.min(2.1, x + len);
      for (let xx = x; xx < end; xx += 0.06) w.put(at(o, xx, AI_GLYPH_Y[1] + 0.95 - line * 0.38, 0), [0.05, 0.11, 0.05], COL.ink, 0.55);
      x = end + 0.16;
    }
  }
  // apply knowledge: a small authored tree
  const t: [number, number][][] = [[[0, 1.1], [0, 0.5], [-1.3, 0.5], [-1.3, -0.1]], [[0, 0.5], [1.3, 0.5], [1.3, -0.1]],
    [[-1.3, -0.5], [-1.3, -0.9], [-1.9, -0.9], [-1.9, -1.2]], [[-1.3, -0.9], [-0.7, -0.9], [-0.7, -1.2]],
    [[1.3, -0.5], [1.3, -1.2]]];
  for (const path of t) polyline(w, path.map(([x, y]) => at(o, x, AI_GLYPH_Y[2] + y, 0)), 0.06, 0.04, COL.cyan, 0.75);
  for (const [x, y] of [[0, 1.25], [-1.3, -0.3], [1.3, -0.3], [-1.9, -1.35], [-0.7, -1.35], [1.3, -1.35]]) {
    polyline(w, rectOutline(x, AI_GLYPH_Y[2] + y, 0.5, 0.26, 0, o), 0.05, 0.035, COL.ink, 0.7);
  }
  w.rest(o);
  return b;
};

/** Expert system: authored rule network on a blueprint grid. Meta tracks each bead's edge. */
export type RulesMeta = { edgeOf: Int16Array; tOf: Float32Array; nodeOf: Int16Array };
export const rules = (): { buf: Buf; meta: RulesMeta } => {
  const b = makeBuf(), w = writer(b), o = ST.expert;
  const edgeOf = new Int16Array(N).fill(-1), tOf = new Float32Array(N), nodeOf = new Int16Array(N).fill(-1);
  RULES.edges.forEach((e, ei) => {
    const pts = edgeRoute(e).map(([x, y]) => at(o, x, y, 0));
    for (const { i, t } of polyline(w, pts, 0.07, 0.04, COL.ink, 0.28)) { edgeOf[i] = ei; tOf[i] = t; }
  });
  const nodes: { x: number; y: number; w: number; id: number }[] = [
    ...RULES.inputs.map((n, k) => ({ ...n, w: 1.6, id: k })),
    ...RULES.gates.map((n, k) => ({ ...n, w: 1.5, id: 10 + k })),
    ...RULES.outputs.map((n, k) => ({ ...n, w: 2.1, id: 20 + k })),
  ];
  for (const n of nodes) for (const { i } of polyline(w, rectOutline(n.x, n.y, n.w, 0.8, 0, o), 0.065, 0.04, COL.ink, 0.5)) nodeOf[i] = n.id;
  // blueprint grid: precise, faint, authored
  for (let r = 0; r < 34; r++) for (let c = 0; c < 22; c++) {
    if (w.count() >= N) break;
    w.put(at(o, -3.15 + c * 0.3, 5.3 - r * 0.32, -0.3), [0.018, 0.018, 0.018], COL.muted, 0.35);
  }
  w.rest(o);
  return { buf: b, meta: { edgeOf, tOf, nodeOf } };
};

/** Too many rules: dense interwoven curves around the expert station. */
export const tangle = (): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.expert;
  const curves = 70;
  const per = Math.floor(N / curves);
  for (let k = 0; k < curves; k++) {
    const r = (s: string) => rnd(`tg${k}${s}`);
    const p0: V3 = [(r("a") - 0.5) * 7, 5 - r("b") * 2, (r("c") - 0.5) * 3];
    const p1: V3 = [(r("d") - 0.5) * 9, 2 - r("e") * 4, (r("f") - 0.5) * 4];
    const p2: V3 = [(r("g") - 0.5) * 9, -1 - r("h") * 3, (r("i") - 0.5) * 4];
    const p3: V3 = [(r("j") - 0.5) * 7, -4.5 + r("k") * 1.5, (r("l") - 0.5) * 3];
    for (let j = 0; j < per; j++) {
      const t = j / (per - 1), u = 1 - t;
      const q = [0, 1, 2].map((a) => u * u * u * p0[a] + 3 * u * u * t * p1[a] + 3 * u * t * t * p2[a] + t * t * t * p3[a]);
      const mix = rnd(`tgc${k}`);
      const col = mix < 0.6 ? COL.cyan : COL.ink;
      w.put(at(o, q[0], q[1], q[2]), [0.035, 0.035, 0.035], col, 0.3 + 0.35 * rnd(`tgk${k}`), t);
    }
  }
  w.rest(o);
  return b;
};

/** Historical admissions: 504 records x 8 field cells. Cell 7 is the known outcome. */
export const RETURNED = (r: number): boolean => rnd(`ret${r}`) < 0.32;
export const records = (): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.ml;
  for (let r = 0; r < RECORD_COUNT; r++) {
    const p = recordPos(r);
    for (let c = 0; c < ARCHIVE.cells; c++) {
      const outcome = c === ARCHIVE.cells - 1;
      const x = p[0] - 0.45 + c * 0.118 + (outcome ? 0.05 : 0);
      const layer = Math.floor(r / (ARCHIVE.cols * ARCHIVE.rows));
      const depthK = [1, 0.55, 0.3][layer];
      const col = outcome ? (RETURNED(r) ? COL.ink : COL.muted) : COL.cyan;
      const k = (outcome ? (RETURNED(r) ? 0.75 : 0.22) : 0.07 + 0.2 * rnd(`f${r}-${c}`)) * depthK;
      w.put(at(o, x, p[1], p[2]), outcome ? [0.1, 0.15, 0.05] : [0.098, 0.11, 0.035], col, k, (ARCHIVE.top - p[1]) / 8);
    }
  }
  w.rest(o);
  return b;
};
export const featuredIndex = (k: number): number => FEATURED[k].r;

/** Chest X-ray as a 64x64 field of luminous pixels; depth > 0 lifts bright pixels toward the viewer. */
export const pixels = (depth: number): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.dl;
  const lum = xray64 as number[];
  const s = PIX.size / PIX.n;
  for (let r = 0; r < PIX.n; r++) for (let c = 0; c < PIX.n; c++) {
    const v = lum[r * PIX.n + c];
    const h = 0.03 + v * depth;
    const lifted = depth > 0;
    w.put(at(o, -PIX.size / 2 + (c + 0.5) * s, PIX.size / 2 - (r + 0.5) * s, h / 2), [s * (lifted ? 0.4 : 0.86), s * (lifted ? 0.4 : 0.86), h], COL.ink, (0.03 + 0.97 * v ** 1.6) * (lifted ? 0.035 : 0.42), r / PIX.n);
  }
  w.rest(o);
  return b;
};

/** Lanes through the deep-learning layers (positions animated by the dynamic pass). */
export const FLOW_LANES = 40;
export const flow = (): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.dl;
  for (let r = 0; r < FLOW_LANES; r++) for (let c = 0; c < FLOW_LANES; c++) {
    w.put(at(o, -3.2 + c * 0.164, 3.2 - r * 0.164, 0), [0.05, 0.05, 0.05], COL.cyan, 0.5, r / FLOW_LANES);
  }
  w.rest(o);
  return b;
};

/** Generative AI: a field of text lines behind the page (large amounts of text). */
export const languageField = (): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.gen;
  // A flat wall of text lines behind the page: "large amounts of text".
  for (let line = 0; line < 40; line++) {
    const z = -3.2;
    const y = 4.3 - line * 0.27;
    let x = -4.4, wi = 0;
    while (x < 4.4) {
      const len = 0.2 + rnd(`lf${line}-${wi++}`) * 0.7;
      const end = Math.min(4.4, x + len);
      for (let xx = x; xx < end; xx += 0.085) w.put(at(o, xx, y, z), [0.06, 0.07, 0.04], COL.cyan, 0.05 + 0.06 * rnd(`lk${line}`), (4.5 - y) / 11);
      x = end + 0.15;
    }
  }
  w.rest(o);
  return b;
};

/** Other generative outputs: image, audio and video sculptures around the page. */
export const media = (): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.gen;
  // image: a gradient field with a soft horizon form (abstract, generated-looking)
  for (let r = 0; r < 20; r++) for (let c = 0; c < 28; c++) {
    const u = c / 27, v = r / 19;
    const ridge = 0.55 + 0.12 * Math.sin(u * 7) + 0.06 * Math.sin(u * 17);
    const land = v > ridge;
    const col = land ? COL.cyan : COL.amber;
    const k = land ? 0.25 + 0.35 * (1 - v) : 0.15 + 0.35 * (1 - Math.abs(u - 0.6));
    w.put(at(o, -3.5 + c * 0.12, 6.4 - r * 0.12, 1.2), [0.1, 0.1, 0.05], col, k, 0);
  }
  // audio: a waveform ribbon
  for (let j = 0; j < 420; j++) {
    const u = j / 419;
    const env = Math.sin(u * Math.PI) * (0.6 + 0.4 * Math.sin(u * 9));
    const amp = env * Math.sin(u * 95) * 0.9;
    for (const s of [-1, 1]) w.put(at(o, 0.6 + u * 3.4, 4.9 + s * Math.abs(amp) * 0.9 * (0.5 + 0.5 * Math.cos(u * 40)), 0.8), [0.03, 0.03, 0.03], COL.ink, 0.6, 0.3);
  }
  // video: three receding frames
  for (let fIdx = 0; fIdx < 3; fIdx++) {
    const z = 0.6 - fIdx * 1.1, x0 = -1.4 + fIdx * 0.35, y0 = -5.6 + fIdx * 0.25;
    for (const p of [rectOutline(x0 + 1.4, y0, 2.8, 1.6, z, o)]) polyline(w, p, 0.06, 0.035, COL.ink, 0.6 - fIdx * 0.15);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 14; c++) {
      const u = c / 13, v = r / 7;
      const k = 0.15 + 0.3 * Math.max(0, Math.sin(u * 4 + fIdx * 0.8) * (1 - v));
      w.put(at(o, x0 + 0.3 + c * 0.17, y0 + 0.6 - r * 0.17, z), [0.13, 0.13, 0.03], COL.cyan, k, 0.8);
    }
  }
  w.rest(o);
  return b;
};

/** Foundation model: one broad slab with pillars up to the task forms. */
export const FOUND_TASK_X = [-2.55, -0.85, 0.85, 2.55] as const;
export const FOUND_SLAB = { y: -2.6, w: 7.2, h: 1.0, d: 3.0 } as const;
export const foundation = (): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.found;
  const nx = 48, ny = 6, nz = 12;
  for (let iy = 0; iy < ny; iy++) for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
    const x = -FOUND_SLAB.w / 2 + (ix + 0.5) * (FOUND_SLAB.w / nx);
    const y = FOUND_SLAB.y + FOUND_SLAB.h / 2 - (iy + 0.5) * (FOUND_SLAB.h / ny);
    const z = -FOUND_SLAB.d / 2 + (iz + 0.5) * (FOUND_SLAB.d / nz);
    const edge = iy === 0 || iz === nz - 1;
    w.put(at(o, x, y, z), [0.09, 0.09, 0.09], edge ? COL.ink : COL.cyan, edge ? 0.13 : 0.03 + 0.03 * rnd(`fd${ix}${iy}${iz}`), 1 - iy / ny);
  }
  for (const x of FOUND_TASK_X) polyline(w, [at(o, x, FOUND_SLAB.y + 0.55, 0), at(o, x, 0.2, 0)], 0.05, 0.05, COL.cyan, 0.8);
  w.rest(o);
  return b;
};

/** The nested map: rings drawn in beads plus miniatures of the world we visited. */
export const nestedMap = (): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.map;
  const ring = (c: readonly [number, number], r: number, n: number, col: readonly number[], k: number, size: number, dashed = false) => {
    for (let j = 0; j < n; j++) {
      if (dashed && Math.floor(j / 7) % 2 === 1) continue;
      const a = (j / n) * Math.PI * 2 + Math.PI / 2;
      w.put(at(o, c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), 0), [size, size, size], col, k, j / n);
    }
  };
  ring(MAP.ai.c, MAP.ai.r, 760, COL.ink, 0.75, 0.04);
  ring(MAP.ml.c, MAP.ml.r, 560, COL.ink, 0.8, 0.045);
  ring(MAP.dl.c, MAP.dl.r, 380, COL.ink, 0.9, 0.05);
  ring(MAP.gen.c, MAP.gen.r, 300, COL.cyan, 0.95, 0.05, true);
  // rules mini (AI-only band, right side)
  const rx = 0, ry = 2.5;
  const mini: [number, number][][] = [[[0, 0.35], [0, 0.15], [-0.45, 0.15], [-0.45, -0.1]], [[0, 0.15], [0.45, 0.15], [0.45, -0.1]],
    [[-0.45, -0.25], [-0.45, -0.4]], [[0.45, -0.25], [0.45, -0.4]]];
  for (const p of mini) polyline(w, p.map(([x, y]) => at(o, rx + x, ry + y, 0)), 0.04, 0.025, COL.ink, 0.6);
  // records mini (ML-only band): 3 rows x 4 slabs
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) for (let k = 0; k < 4; k++) {
    w.put(at(o, -0.78 + c * 0.42 + k * 0.08, 0.82 - r * 0.15, 0), [0.07, 0.09, 0.03], k === 3 ? COL.ink : COL.cyan, k === 3 ? 0.8 : 0.45);
  }
  // layer stack mini (inside DL)
  for (let L = 0; L < 4; L++) polyline(w, rectOutline(-0.85 + L * 0.2, -1.2 - L * 0.06, 0.62 - L * 0.1, 0.62 - L * 0.1, -L * 0.15, o), 0.035, 0.022, COL.cyan, 0.7 - L * 0.1);
  w.rest(o);
  return b;
};

/** Data and algorithms converge above the floor (compute is revealed beneath). */
export const motifs = (): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.map;
  for (let r = 0; r < 12; r++) for (let c = 0; c < 3; c++) for (let k = 0; k < 6; k++) {
    w.put(at(o, -3.0 + c * 0.62 + k * 0.095, 1.9 - r * 0.2, -c * 0.3), [0.08, 0.13, 0.04], k === 5 ? COL.ink : COL.cyan, k === 5 ? 0.85 : 0.35, r / 12);
  }
  for (let L = 0; L < 5; L++) polyline(w, rectOutline(1.6 + L * 0.18, 0.6 - L * 0.08, 1.7 - L * 0.22, 1.7 - L * 0.22, -L * 0.6, o), 0.05, 0.03, COL.cyan, 0.8 - L * 0.1);
  w.rest(o);
  return b;
};

/** GPU: a die of 64x64 cores lying flat beneath the hospital floor. */
export const GPU = { n: 64, pitch: 0.155 } as const;
export const gpuGrid = (): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.gpu;
  const half = (GPU.n - 1) * GPU.pitch / 2;
  for (let r = 0; r < GPU.n; r++) for (let c = 0; c < GPU.n; c++) {
    w.put(at(o, -half + c * GPU.pitch, 0, -half + r * GPU.pitch), [0.118, 0.04, 0.118], COL.metal, 0.16, r / GPU.n);
  }
  w.rest(o);
  return b;
};

/** Return: an orbit ring around the patient joining the four tasks. */
export const orbit = (): Buf => {
  const b = makeBuf(), w = writer(b), o = ST.finale;
  polyline(w, circle(o, 0, 0, 2.55, 120, 0), 0.05, 0.03, COL.ink, 0.35);
  w.rest(o);
  return b;
};
