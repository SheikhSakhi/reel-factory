// Maps world-space planes to screen space so HTML typography shares the 3D camera.
import * as THREE from "three";
import type { V3 } from "./lib";

export const W = 1080;
export const H = 1920;

export type ScreenPoint = { readonly x: number; readonly y: number; readonly depth: number; readonly visible: boolean };

const tmp = new THREE.Vector3();

export const project = (cam: THREE.PerspectiveCamera, p: V3): ScreenPoint => {
  tmp.set(p[0], p[1], p[2]).applyMatrix4(cam.matrixWorldInverse);
  const depth = -tmp.z;
  tmp.applyMatrix4(cam.projectionMatrix);
  return { x: ((tmp.x + 1) / 2) * W, y: ((1 - tmp.y) / 2) * H, depth, visible: depth > cam.near };
};

/** Corners (TL, TR, BR, BL) of a plane centred at `c`, rotated by Euler XYZ (radians). */
export const planeCorners = (c: V3, w: number, h: number, rot: V3 = [0, 0, 0]): [V3, V3, V3, V3] => {
  const e = new THREE.Euler(rot[0], rot[1], rot[2]);
  const pts: [number, number][] = [[-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h / 2], [-w / 2, -h / 2]];
  return pts.map(([x, y]) => {
    const v = new THREE.Vector3(x, y, 0).applyEuler(e);
    return [v.x + c[0], v.y + c[1], v.z + c[2]] as V3;
  }) as [V3, V3, V3, V3];
};

// Solve the 3x3 projective map from the unit square to a quad (Heckbert).
const squareToQuad = (q: [number, number][]): number[] => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / det;
  const h = (dx1 * sy - sx * dy1) / det;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
};

/**
 * CSS matrix3d that maps a (w x h) px element with transform-origin 0 0 onto four screen points
 * (TL, TR, BR, BL). Returns null if any corner is behind the camera.
 */
export const quadTransform = (w: number, h: number, pts: ScreenPoint[]): string | null => {
  if (pts.some((p) => !p.visible)) return null;
  const m = squareToQuad([[pts[0].x, pts[0].y], [pts[1].x, pts[1].y], [pts[2].x, pts[2].y], [pts[3].x, pts[3].y]]);
  // Pre-scale element px into the unit square.
  const a = m[0] / w, b = m[1] / h, c = m[2];
  const d = m[3] / w, e = m[4] / h, f = m[5];
  const g = m[6] / w, hh = m[7] / h, i = m[8];
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${hh},0,0,1,0,${c},${f},0,${i})`;
};
