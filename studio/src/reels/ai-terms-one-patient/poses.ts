// Poses of objects that both the 3D scene and the type overlay need to agree on.
import { at, atEnd, be, bs } from "./timing";
import { clamp01, easeInOut, lerp, lerp3, smooth, type V3 } from "./lib";
import { LAYERS, ST } from "./world";
import { NEST, TIER } from "./spine/formations";

export type Pose = { readonly c: V3; readonly rot: V3; readonly w: number; readonly h: number; readonly o: number };

// ------------------------------------------------------------- opening term slabs

export const TERMS = ["Artificial intelligence", "Machine learning", "Deep learning", "Generative AI"] as const;
const SCATTER: { c: V3; rot: V3 }[] = [
  { c: [-0.15, 3.55, -2.5], rot: [0.06, 0.3, -0.03] },
  { c: [0.45, 0.95, -11], rot: [-0.05, -0.55, 0.02] },
  { c: [-0.35, -1.8, -18], rot: [0.08, 0.62, 0.03] },
  { c: [0.25, -3.85, -6], rot: [-0.06, -0.32, -0.02] },
];
const TERM_WORD: [string, string][] = [["B01", "artificial"], ["B01", "machine"], ["B01", "deep"], ["B01", "generative"]];

export const termAppear = (i: number): number => (i === 0 ? 0 : at(TERM_WORD[i][0], TERM_WORD[i][1]) - 4);

export const termPose = (i: number, f: number): Pose => {
  const sc = SCATTER[i];
  const massive = smooth((f - at("B02", "massive") + 6) / 24) * (1 - smooth((f - at("B02", "hold")) / 18));
  const scatterC: V3 = [sc.c[0] * (1 + 0.5 * massive), sc.c[1] * (1 + 0.04 * massive), sc.c[2] + 2.5 * massive];
  const join = easeInOut(clamp01((f - at("B03", "connected") + 10) / 34 - i * 0.06));
  const n = NEST[i];
  const nest: V3 = [ST.open[0] + n.c[0], ST.open[1] + n.c[1], ST.open[2] + n.z];
  const c = lerp3(scatterC, nest, join);
  const rot = lerp3(sc.rot, [0, 0, 0], join);
  const appear = smooth((f - termAppear(i)) / 12);
  // the names leave as the camera starts its move inside, so no giant fragments cross the lens
  const fade = 1 - smooth((f - at("B03", "follow") + 2) / 14);
  return { c, rot, w: lerp(TIER.w, n.w, join), h: lerp(TIER.h, n.h, join), o: appear * fade };
};

// ------------------------------------------------------------- deep learning planes

export const imagePlaneOpacity = (f: number): number => {
  const on = 0.72 * smooth((f - at("B16", "xray") - 2) / 24);
  const toPixels = 1 - smooth((f - at("B17", "pixels") + 10) / 26) * 0.92;
  const back = smooth((f - at("B19", "layers")) / 30) * 0.5; // recognisable again beside the stack
  const out = 1 - smooth((f - bs("B22") - 10) / 40);
  return on * Math.min(1, toPixels + back) * out;
};

export const layerOpacity = (k: number, f: number): number => {
  const on = smooth((f - at("B18", "neural") - k * 8) / 24);
  const out = k === LAYERS.length - 1 ? 1 : 1 - smooth((f - bs("B22") - 4) / 30);
  return on * out;
};

// ------------------------------------------------------------- generative: the document surface

export const PAGE = { w: 5.0, h: 6.4, y: -0.9 } as const;

/** The last layer plane becomes the page: pose blends from layer 4 to the page. */
export const pagePose = (f: number): Pose => {
  const l4 = LAYERS[LAYERS.length - 1];
  const from: Pose = { c: [ST.dl[0], ST.dl[1], ST.dl[2] + l4.z], rot: [0, 0, 0], w: l4.size, h: l4.size, o: 1 };
  const t = easeInOut(clamp01((f - bs("B22") - 6) / 70));
  const to: V3 = [ST.gen[0], ST.gen[1] + PAGE.y, ST.gen[2]];
  const lift = Math.sin(Math.PI * t) * 1.2;
  const c: V3 = [lerp(from.c[0], to[0], t), lerp(from.c[1], to[1], t) + lift, lerp(from.c[2], to[2], t)];
  const rot: V3 = [0, Math.sin(Math.PI * t) * 0.6, 0];
  const dim = 1 - 0.65 * smooth((f - at("B26", "other") + 4) / 16) * (1 - smooth((f - be("B26") - 4) / 20));
  const out = 1 - smooth((f - bs("B27") + 10) / 14); // clear before the camera passes through
  return { c, rot, w: lerp(from.w, PAGE.w, t), h: lerp(from.h, PAGE.h, t), o: (f < bs("B22") ? 0 : 1) * dim * out };
};

export const pageContentOn = (f: number): number => smooth((f - bs("B22") - 60) / 20);

export const GENERATED_FROM = (): number => at("B25", "generate") - 8;
export const DRAFT_STAMP = (): number => at("B25", "draft") - 2;

// ------------------------------------------------------------- finale cards

export const FINALE_CARDS = [
  { key: "rules", x: -1.95, y: 1.95, word: ["B39", "applying"] },
  { key: "risk", x: 1.95, y: 1.95, word: ["B39", "predicting"] },
  { key: "image", x: -1.95, y: -1.95, word: ["B39", "analyzing"] },
  { key: "draft", x: 1.95, y: -1.95, word: ["B39", "drafting"] },
] as const;

export const finaleCardOn = (k: number, f: number): number => {
  const [id, w] = FINALE_CARDS[k].word;
  return smooth((f - at(id, w) + 6) / 14);
};

export const finaleCardsOut = (f: number): number => 1 - smooth((f - at("B41", "learning") + 4) / 24);

export const endFade = (f: number): number => 1 - smooth((f - atEnd("B42", "job") - 4) / 30);
