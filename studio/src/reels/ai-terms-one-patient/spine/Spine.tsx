// The morph spine: N beads that travel the whole film, re-forming for every act.
import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { at, atEnd, be, bs } from "../timing";
import { clamp01, easeInOut, rnd, smooth } from "../lib";
import { ARCHIVE, FEATURED, LAYERS, RULES, ST } from "../world";
import {
  COL, FLOW_LANES, GPU, N, RETURNED, aiGlyphs, flow, foundation, gpuGrid, hidden, languageField, makeBuf, media,
  motifs, nestedMap, openStructure, orbit, pixels, records, rules, tangle, type Buf, type RulesMeta,
} from "./formations";
import { patientAt } from "../patient";
import { cameraAt } from "../camera";
import { TRAIN } from "../training";

type Stage = { key: string; buf: Buf; start: number; dur: number; stagger?: number; arc?: number };

const ruleData = rules();

/** Builds the stage list once (formations + the frames they morph in). */
const buildStages = (): Stage[] => [
  { key: "void", buf: hidden(ST.open), start: 0, dur: 1 },
  { key: "structure", buf: openStructure(), start: at("B03", "connected") - 8, dur: 34, stagger: 0.5 },
  { key: "ai", buf: aiGlyphs(), start: bs("B04") + 6, dur: 70, stagger: 0.45, arc: 1.4 },
  { key: "rules", buf: ruleData.buf, start: bs("B06") - 10, dur: 60, stagger: 0.5, arc: 1.2 },
  { key: "tangle", buf: tangle(), start: at("B08", "complicated"), dur: 70, stagger: 0.35, arc: 0.8 },
  { key: "records", buf: records(), start: atEnd("B08", "rules") + 14, dur: 62, stagger: 0.55, arc: 1.6 },
  { key: "pixels", buf: pixels(0), start: bs("B16") - 6, dur: 54, stagger: 0.6, arc: 1.8 },
  { key: "depth", buf: pixels(1.7), start: at("B17", "pixels") - 4, dur: 30, stagger: 0.4 },
  { key: "flow", buf: flow(), start: at("B18", "neural") - 6, dur: 36, stagger: 0.4, arc: 0.6 },
  { key: "toDoc", buf: hidden([ST.gen[0], ST.gen[1], ST.gen[2]]), start: bs("B22") + 10, dur: 50, stagger: 0.5 },
  { key: "language", buf: languageField(), start: at("B24", "generative") - 10, dur: 44, stagger: 0.5 },
  { key: "media", buf: media(), start: at("B26", "other") - 6, dur: 32, stagger: 0.45, arc: 1.2 },
  { key: "mediaOut", buf: languageField(), start: be("B26") + 6, dur: 28, stagger: 0.4 },
  { key: "foundation", buf: foundation(), start: bs("B27") - 4, dur: 50, stagger: 0.55, arc: 1.5 },
  { key: "map", buf: nestedMap(), start: at("B29", "so") - 4, dur: 64, stagger: 0.5, arc: 2.5 },
  { key: "motifs", buf: motifs(), start: at("B36", "three") - 4, dur: 34, stagger: 0.4, arc: 1.2 },
  { key: "gpu", buf: gpuGrid(), start: at("B37", "gpus") - 8, dur: 54, stagger: 0.55, arc: 2.0 },
  { key: "orbit", buf: orbit(), start: at("B39", "for") - 10, dur: 56, stagger: 0.5, arc: 2.0 },
  { key: "end", buf: hidden(ST.finale), start: bs("B43") - 6, dur: 60, stagger: 0.6, arc: 0 },
];

const hash3 = (i: number): [number, number, number] => [rnd(`hx${i}`) - 0.5, rnd(`hy${i}`) - 0.5, rnd(`hz${i}`) - 0.5];

// --------------------------------------------------------------- dynamics per stage

const copy = (src: Buf, dst: Buf) => { dst.pos.set(src.pos); dst.scl.set(src.scl); dst.col.set(src.col); };

const setCol = (b: Buf, i: number, c: readonly number[], k: number) => {
  b.col[i * 3] = c[0] * k; b.col[i * 3 + 1] = c[1] * k; b.col[i * 3 + 2] = c[2] * k;
};

const RULE_STEP = (): number[] => [at("B06", "symptoms"), at("B06", "findings") + 4, at("B06", "suggest")];

const dynRules = (f: number, b: Buf, meta: RulesMeta) => {
  const steps = RULE_STEP();
  const litEdges = new Map<number, number>(RULES.lit.map(([e, s]) => [e, steps[s]]));
  for (let i = 0; i < N; i++) {
    const e = meta.edgeOf[i];
    if (e >= 0 && litEdges.has(e)) {
      const t0 = litEdges.get(e)!;
      const front = (f - t0) / 22; // light travels down the authored path
      const on = clamp01((front - meta.tOf[i]) * 6);
      if (on > 0) setCol(b, i, on > 0.5 ? COL.cyan : COL.ink, 0.28 + on * 0.85);
    }
    const n = meta.nodeOf[i];
    if (n >= 0) {
      const inputLit = n < 10 && RULES.litInputs.includes(n as 0) && f > steps[0] - 6;
      const gateLit = n >= 10 && n < 20 && [0, 2].includes(n - 10) && f > steps[1] - 4;
      const gate2Lit = n >= 10 && n < 20 && [3, 4].includes(n - 10) && f > steps[1] + 18;
      const outLit = n >= 20 && RULES.litOutputs.includes((n - 20) as 0) && f > steps[2] + 6;
      if (inputLit || gateLit || gate2Lit || outLit) setCol(b, i, outLit ? COL.ink : COL.cyan, 1.0);
    }
  }
};

const dynTangle = (f: number, b: Buf) => {
  for (let i = 0; i < N; i++) {
    if (b.scl[i * 3] === 0) continue;
    const w = Math.sin(f / 9 + i * 0.013) * 0.05;
    b.pos[i * 3 + 2] += w;
  }
};

const dynRecords = (f: number, b: Buf) => {
  const pullIn = at("B10", "diagnoses") - 14, pullOut = be("B10") + 30;
  const pull = smooth((f - pullIn) / 20) * (1 - smooth((f - pullOut) / 20));
  const train = TRAIN.state(f);
  // Colours are linear (displayed through sRGB), so a visible dim needs a deep linear cut.
  const dimAfter = smooth((f - at("B14", "trained")) / 30);
  for (let r = 0; r < ARCHIVE.cols * ARCHIVE.rows * ARCHIVE.layers; r++) {
    const featured = FEATURED.findIndex((x) => x.r === r);
    const batchLit = train.active && train.batch.includes(r % 97) ? train.pulse : 0;
    for (let c = 0; c < ARCHIVE.cells; c++) {
      const i = r * ARCHIVE.cells + c;
      if (featured >= 0 && pull > 0) {
        const side = FEATURED[featured].side;
        b.pos[i * 3] += side * 0.35 * pull;
        b.pos[i * 3 + 2] += 2.2 * pull;
        b.pos[i * 3 + 1] += (b.pos[i * 3] - ST.ml[0]) * 0;
        b.scl[i * 3] *= 1 + 0.5 * pull; b.scl[i * 3 + 1] *= 1 + 0.5 * pull;
      } else if (pull > 0) {
        b.col[i * 3] *= 1 - 0.85 * pull; b.col[i * 3 + 1] *= 1 - 0.85 * pull; b.col[i * 3 + 2] *= 1 - 0.85 * pull;
      }
      if (batchLit > 0) {
        const k = 1 + 1.6 * batchLit;
        b.col[i * 3] *= k; b.col[i * 3 + 1] *= k; b.col[i * 3 + 2] *= k;
      }
      if (dimAfter > 0) {
        const k = 1 - 0.96 * dimAfter;
        b.col[i * 3] *= k; b.col[i * 3 + 1] *= k; b.col[i * 3 + 2] *= k;
      }
    }
  }
  void RETURNED;
};

const LAYER_Z = [0, ...LAYERS.map((l) => l.z)];
const LAYER_SIZE = [7.0, ...LAYERS.map((l) => l.size)];
const dynFlow = (f: number, b: Buf) => {
  const speed = 1 / 90; // each activation sheet crosses the whole stack in 3 s
  const sheets = 4;
  for (let r = 0; r < FLOW_LANES; r++) for (let c = 0; c < FLOW_LANES; c++) {
    const i = r * FLOW_LANES + c;
    const phase = ((r % 2) * 2 + (c % 2)) / sheets; // four interleaved sheets, evenly spaced
    const u = ((f * speed + phase) % 1) * (LAYER_Z.length - 1);
    const seg = Math.floor(u), t = u - seg;
    const z = LAYER_Z[seg] + (LAYER_Z[seg + 1] - LAYER_Z[seg]) * t;
    const s = (LAYER_SIZE[seg] + (LAYER_SIZE[seg + 1] - LAYER_SIZE[seg]) * t) / 7.0;
    const x0 = -3.2 + c * 0.164, y0 = 3.2 - r * 0.164;
    b.pos[i * 3] = ST.dl[0] + x0 * s;
    b.pos[i * 3 + 1] = ST.dl[1] + y0 * s;
    b.pos[i * 3 + 2] = ST.dl[2] + z;
    const near = Math.min(t, 1 - t);
    const glow = 0.2 + 0.8 * Math.exp(-near * 10);
    setCol(b, i, COL.cyan, 0.5 * glow);
  }
};

const dynLanguage = (f: number, b: Buf) => {
  const sweep = ((f - at("B24", "generative")) / 70) % 1.4;
  for (let i = 0; i < N; i++) {
    if (b.scl[i * 3] === 0) continue;
    const yN = b.order[i];
    const k = 1 + 2.2 * Math.exp(-(((yN - sweep) * 9) ** 2));
    b.col[i * 3] *= k; b.col[i * 3 + 1] *= k; b.col[i * 3 + 2] *= k;
  }
};

const MAP_RINGS: [number, number, string][] = [[0, 760, "B30"], [760, 1320, "B31"], [1320, 1700, "B32"], [1700, 1850, "B33"]];
const dynMap = (f: number, b: Buf) => {
  const overlap = smooth((f - bs("B34")) / 15);
  for (const [from, to, id] of MAP_RINGS) {
    const on = smooth((f - bs(id) + 4) / 14);
    // generative AI is introduced at B33: its circle stays dark until then
    const k = id === "B33" ? on : 0.25 + 0.75 * Math.max(on, overlap);
    for (let i = from; i < to; i++) { b.col[i * 3] *= k; b.col[i * 3 + 1] *= k; b.col[i * 3 + 2] *= k; }
  }
};

/** Serial cursor first, then coordinated parallel waves across all cores. */
const dynGpu = (f: number, b: Buf) => {
  const serialFrom = at("B37", "calculations") - 6, parallelFrom = at("B37", "parallel") - 6;
  const glowOn = smooth((f - at("B37", "gpus")) / 30);
  const n = GPU.n;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const i = r * n + c;
    let k = 0.16 + 0.22 * glowOn;
    let col = COL.metal;
    if (f >= serialFrom && f < parallelFrom) {
      const step = Math.floor((f - serialFrom) / 2);
      if (i === (step * 37) % (n * n) || i === (step * 37 + 1) % (n * n)) { k = 1.2; col = COL.green; }
    }
    if (f >= parallelFrom) {
      const g = f - parallelFrom;
      const tile = ((Math.floor(r / 8) + Math.floor(c / 8)) % 2);
      const wave = 0.5 + 0.5 * Math.cos(((r + c) / n) * Math.PI * 2 - g / 6 + tile * 0.6);
      const pulse = 0.5 + 0.5 * Math.cos(g / 4.5 + tile * Math.PI);
      const amp = smooth(g / 12);
      k = 0.12 + amp * (0.25 + 0.75 * wave * (0.55 + 0.45 * pulse));
      col = COL.green;
      b.scl[i * 3 + 1] = 0.04 + amp * 0.16 * wave;
      b.pos[i * 3 + 1] += amp * 0.08 * wave;
    }
    setCol(b, i, col, k);
  }
};

const dynOrbit = (f: number, b: Buf) => {
  for (let i = 0; i < N; i++) {
    if (b.scl[i * 3] === 0) continue;
    const k = (0.7 + 0.3 * Math.sin(f / 14 + i * 0.2)) * (1 - 0.85 * smooth((f - at("B42", "knowing") + 10) / 20));
    b.col[i * 3] *= k; b.col[i * 3 + 1] *= k; b.col[i * 3 + 2] *= k;
  }
};

const DYN: Record<string, (f: number, b: Buf) => void> = {
  rules: (f, b) => dynRules(f, b, ruleData.meta),
  tangle: dynTangle,
  records: dynRecords,
  flow: dynFlow,
  language: dynLanguage,
  mediaOut: dynLanguage,
  map: dynMap,
  gpu: dynGpu,
  orbit: dynOrbit,
};

const evalStage = (s: Stage, f: number, out: Buf) => {
  copy(s.buf, out);
  DYN[s.key]?.(f, out);
};

// --------------------------------------------------------------- component

export const Spine: React.FC = () => {
  const frame = useCurrentFrame();
  const stages = useMemo(buildStages, []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const bufs = useMemo(() => ({ a: makeBuf(), b: makeBuf() }), []);
  const hashes = useMemo(() => Array.from({ length: N }, (_, i) => hash3(i)), []);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color() }), []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    let k = 0;
    while (k < stages.length - 1 && frame >= stages[k + 1].start) k++;
    const cur = stages[k], next = stages[k + 1];
    evalStage(cur, frame, bufs.a);
    void next;
    const into = stages[k];
    const from = k > 0 ? stages[k - 1] : undefined;
    const inMorph = from !== undefined && frame < into.start + into.dur;
    if (inMorph) {
      evalStage(from, frame, bufs.b);
    }
    const stagger = into.stagger ?? 0.4, arc = into.arc ?? 1;
    const patient = patientAt(frame);
    const eye = cameraAt(frame).pos;
    for (let i = 0; i < N; i++) {
      let px = bufs.a.pos[i * 3], py = bufs.a.pos[i * 3 + 1], pz = bufs.a.pos[i * 3 + 2];
      let sx = bufs.a.scl[i * 3], sy = bufs.a.scl[i * 3 + 1], sz = bufs.a.scl[i * 3 + 2];
      let r = bufs.a.col[i * 3], g = bufs.a.col[i * 3 + 1], bl = bufs.a.col[i * 3 + 2];
      if (inMorph) {
        const delay = clamp01(into.buf.order[i]) * stagger + hashes[i][0] * 0.08;
        const local = clamp01(((frame - into.start) / into.dur - Math.max(0, delay)) / (1 - stagger));
        const t = easeInOut(local);
        const fb = bufs.b;
        const h = hashes[i], lift = Math.sin(Math.PI * t) * arc;
        px = fb.pos[i * 3] + (px - fb.pos[i * 3]) * t + h[0] * lift;
        py = fb.pos[i * 3 + 1] + (py - fb.pos[i * 3 + 1]) * t + h[1] * lift;
        pz = fb.pos[i * 3 + 2] + (pz - fb.pos[i * 3 + 2]) * t + h[2] * lift;
        const fs = fb.scl;
        // Beads appearing from or vanishing into a parked state shrink rather than streak.
        sx = fs[i * 3] + (sx - fs[i * 3]) * t; sy = fs[i * 3 + 1] + (sy - fs[i * 3 + 1]) * t; sz = fs[i * 3 + 2] + (sz - fs[i * 3 + 2]) * t;
        r = fb.col[i * 3] + (r - fb.col[i * 3]) * t; g = fb.col[i * 3 + 1] + (g - fb.col[i * 3 + 1]) * t; bl = fb.col[i * 3 + 2] + (bl - fb.col[i * 3 + 2]) * t;
        if (into.key === "end") { // collapse into the patient light
          px = px + (patient[0] - px) * t; py = py + (patient[1] - py) * t; pz = pz + (patient[2] - pz) * t;
        }
      }
      // Beads that pass close to the lens shrink away instead of filling the frame.
      const dist = Math.hypot(px - eye[0], py - eye[1], pz - eye[2]);
      const near = clamp01((dist - 1.5) / 4.5);
      if (near < 1) { sx *= near; sy *= near; sz *= near; }
      tmp.p.set(px, py, pz); tmp.s.set(Math.max(sx, 1e-5), Math.max(sy, 1e-5), Math.max(sz, 1e-5));
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      m.setMatrixAt(i, tmp.m);
      tmp.c.setRGB(r, g, bl);
      m.setColorAt(i, tmp.c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [frame, stages, bufs, hashes, tmp]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false} renderOrder={10}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
    </instancedMesh>
  );
};

