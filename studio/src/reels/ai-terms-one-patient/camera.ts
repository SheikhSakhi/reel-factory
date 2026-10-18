// One camera for the whole film. Position and look-at are keyframed on narration words.
import * as THREE from "three";
import { at, atEnd, be, bs, FILM_DURATION } from "./timing";
import { samplePath, type Key, type V3 } from "./lib";
import { ST } from "./world";
import { H, W } from "./projection";

export const FOV = 38;
const S = (st: V3, x: number, y: number, z: number): V3 => [st[0] + x, st[1] + y, st[2] + z];

type Rig = { pos: Key[]; look: Key[] };
let rig: Rig | null = null;

const build = (): Rig => {
  const o = ST.open, ai = ST.ai, e = ST.expert, m = ST.ml, d = ST.dl, g = ST.gen, fd = ST.found, mp = ST.map, gp = ST.gpu, fin = ST.finale;
  const pos: Key[] = [
    // open: the four terms, then the arc that reveals one structure
    { f: 0, v: S(o, 0, 0.2, 20) },
    { f: at("B02", "massive"), v: S(o, 0, 0.3, 19.0), ease: "linear" },
    { f: at("B02", "hold"), v: S(o, -0.4, 0.5, 21) },
    { f: at("B02", "easier"), v: S(o, -0.4, 0.5, 21) },
    { f: at("B03", "connected") + 30, v: S(o, 6.2, 1.8, 17.5) },
    { f: at("B03", "follow"), v: S(o, 5.0, 1.4, 14.5), ease: "linear" },
    { f: be("B03") + 10, v: S(o, 1.2, 0.3, 3.5) },
    // ai: inside the hall, three capabilities
    { f: bs("B04") + 70, v: S(ai, 0.4, 0.4, 28), ease: "linear" },
    { f: be("B04"), v: S(ai, 0, 0.2, 26) },
    // expert system
    { f: bs("B06") + 6, v: S(e, 0.2, 0.1, 27) },
    { f: at("B06", "applies"), v: S(e, 0.5, 0.1, 26.3), ease: "linear" },
    { f: be("B07"), v: S(e, 0.2, 0.1, 26.6) },
    // too complicated: drift around the tangle
    { f: be("B08"), v: S(e, 5.5, 0.6, 22) },
    // machine learning archive
    { f: at("B09", "patient") + 8, v: S(m, 0, 1.9, 28) },
    { f: at("B10", "diagnoses"), v: S(m, 0, 1.9, 28) },
    { f: be("B10") + 10, v: S(m, 0.3, 1.9, 25.5) },
    { f: at("B11", "train"), v: S(m, 0, 1.9, 28) },
    { f: be("B13"), v: S(m, 0.8, 1.8, 27.5), ease: "linear" },
    // inference: stillness
    { f: at("B14", "new"), v: S(m, 0, -0.6, 17.5) },
    { f: be("B15") + 6, v: S(m, 0, -0.6, 16.8), ease: "linear" },
    // deep learning: image plane, depth, layers
    { f: at("B16", "chest") + 6, v: S(d, 0, 0.3, 19.2) },
    { f: at("B17", "image"), v: S(d, 0, 0.2, 19.2) },
    { f: be("B17"), v: S(d, 5.0, 2.4, 15.5) },
    { f: at("B18", "layers"), v: S(d, 8.5, 4.6, 9.5) },
    { f: at("B19", "layers"), v: S(d, 8.2, 4.4, 9.0) },
    { f: at("B19", "simpler"), v: S(d, 1.6, 0.9, 6.5) },
    { f: at("B19", "complex"), v: S(d, 1.0, 0.6, 3.0), ease: "linear" },
    { f: be("B19") + 10, v: S(d, 0.8, 0.5, 1.2) },
    { f: at("B20", "network"), v: S(d, 8.8, 4.8, 10.5) },
    { f: be("B21"), v: S(d, 8.2, 4.4, 9.8) },
    // generative AI: document surface
    { f: bs("B22") + 75, v: S(g, 0, 0.6, 23) },
    { f: be("B25"), v: S(g, 0, 0.5, 22.4), ease: "linear" },
    { f: at("B26", "other") + 10, v: S(g, -0.3, 0.4, 29) },
    { f: be("B26") + 20, v: S(g, 0, 0.5, 24) },
    // foundation model
    { f: at("B27", "foundation") + 10, v: S(fd, 0, 2.9, 21.5) },
    { f: be("B28"), v: S(fd, 0.5, 2.6, 20.8), ease: "linear" },
    // the relationship map
    { f: at("B29", "connect") + 12, v: S(mp, 0, 4.5, 24.5) },
    { f: bs("B30"), v: S(mp, 0, 0.3, 24.5) },
    { f: be("B34"), v: S(mp, 0, 0.2, 23.8), ease: "linear" },
    // compute: data and algorithms, then beneath the floor
    { f: be("B36"), v: S(mp, 0, 0.4, 21.5) },
    { f: at("B37", "gpus") + 10, v: S(gp, 0, 11, 14) },
    { f: at("B37", "parallel"), v: S(gp, 0.5, 9.5, 11.5) },
    { f: be("B37"), v: S(gp, 2.0, 10.5, 15.5), ease: "linear" },
    { f: at("B38", "nvidia"), v: S(gp, 1.0, 14, 18) },
    // return to the patient
    { f: at("B39", "for") + 40, v: S(fin, 0, 0.6, 20.5) },
    { f: be("B39"), v: S(fin, 0, 0.5, 19.8), ease: "linear" },
    { f: at("B41", "and") - 4, v: S(fin, 0, 0.5, 20.5) },
    { f: at("B41", "and") + 26, v: S(fin, 0, 1.25, 24) },
    { f: be("B41") + 20, v: S(fin, 0, 1.2, 23.5), ease: "linear" },
    { f: at("B42", "knowing"), v: S(fin, 0, 0.5, 18.5) },
    { f: be("B42"), v: S(fin, 0, 0.5, 18.0), ease: "linear" },
    // end: the light alone
    { f: atEnd("B43", "name") + 10, v: S(fin, 0, 0.3, 11.5) },
    { f: FILM_DURATION, v: S(fin, 0, 0.3, 10.2), ease: "linear" },
  ];
  const look: Key[] = [
    { f: 0, v: S(o, 0, 0, -1) },
    { f: at("B03", "connected") + 30, v: S(o, 0, 0, 0) },
    { f: be("B03") + 10, v: S(o, 0, -0.4, -12) },
    { f: bs("B04") + 70, v: S(ai, 0, 0.2, 0), ease: "linear" },
    { f: be("B04"), v: S(ai, 0, 0.2, 0) },
    { f: bs("B06") + 6, v: S(e, 0, 0.1, 0) },
    { f: be("B07"), v: S(e, 0, 0.1, 0) },
    { f: be("B08"), v: S(e, 0, 0, 0) },
    { f: at("B09", "patient") + 8, v: S(m, 0, 1.9, -1) },
    { f: be("B13"), v: S(m, 0, 1.8, -1) },
    { f: at("B14", "new"), v: S(m, 0, -0.9, 0) },
    { f: be("B15") + 6, v: S(m, 0, -0.9, 0) },
    { f: at("B16", "chest") + 6, v: S(d, 0, 0.3, 0) },
    { f: at("B17", "image"), v: S(d, 0, 0.2, 0) },
    { f: be("B17"), v: S(d, 0, 0.2, 0) },
    { f: at("B18", "layers"), v: S(d, 0, 0.0, -8.5) },
    { f: at("B19", "layers"), v: S(d, 0, 0.0, -8.5) },
    { f: at("B19", "simpler"), v: S(d, 0, 0.1, -8) },
    { f: at("B19", "complex"), v: S(d, 0, 0.0, -14), ease: "linear" },
    { f: be("B19") + 10, v: S(d, 0, 0.0, -16) },
    { f: at("B20", "network"), v: S(d, 0, 0.0, -9) },
    { f: be("B21"), v: S(d, 0, 0.0, -9) },
    { f: bs("B22") + 75, v: S(g, 0, 0.5, 0) },
    { f: be("B26") + 20, v: S(g, 0, 0.4, 0) },
    { f: at("B27", "foundation") + 10, v: S(fd, 0, 0.5, 0) },
    { f: be("B28"), v: S(fd, 0, 0.5, 0) },
    { f: at("B29", "connect") + 12, v: S(mp, 0, 0.4, 0) },
    { f: bs("B30"), v: S(mp, 0, 0.1, 0) },
    { f: be("B36"), v: S(mp, 0, 0.0, 0) },
    { f: at("B37", "gpus") + 10, v: S(gp, 0, 0, -6.5) },
    { f: at("B38", "nvidia"), v: S(gp, 0, 0, -7) },
    { f: at("B39", "for") + 40, v: S(fin, 0, 0.3, 0) },
    { f: at("B41", "and") - 4, v: S(fin, 0, 0.3, 0) },
    { f: at("B41", "and") + 26, v: S(fin, 0, 1.25, 0) },
    { f: be("B41") + 20, v: S(fin, 0, 1.2, 0) },
    { f: at("B42", "knowing"), v: S(fin, 0, 0.3, 0) },
    { f: FILM_DURATION, v: S(fin, 0, 0.3, 0) },
  ];
  return { pos, look };
};

export const cameraAt = (frame: number): { pos: V3; look: V3 } => {
  rig ??= build();
  const pos = samplePath(rig.pos, frame);
  const look = samplePath(rig.look, frame);
  // A slow handheld-free drift keeps holds alive without visible motion.
  const drift = 0.05;
  return { pos: [pos[0] + Math.sin(frame / 97) * drift, pos[1] + Math.sin(frame / 131) * drift, pos[2]], look };
};

/** A three.js camera matching the rig at `frame` (used by the 3D canvas and the type overlay). */
export const makeCamera = (frame: number, cam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 400)): THREE.PerspectiveCamera => {
  const { pos, look } = cameraAt(frame);
  cam.fov = FOV; cam.aspect = W / H; cam.near = 0.1; cam.far = 400;
  cam.position.set(pos[0], pos[1], pos[2]);
  cam.up.set(0, 1, 0);
  cam.lookAt(look[0], look[1], look[2]);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return cam;
};
