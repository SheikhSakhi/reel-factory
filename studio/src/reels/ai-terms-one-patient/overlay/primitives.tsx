// Typography primitives: type placed on 3D planes, and screen-space emphasis beats.
import React, { createContext, useContext } from "react";
import type * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { planeCorners, project, quadTransform } from "../projection";
import { easeInOut, easeOut, ramp, type V3 } from "../lib";
import { C, MONO, SERIF, monoLabel } from "../style";

export const CamContext = createContext<THREE.PerspectiveCamera | null>(null);
const useCam = (): THREE.PerspectiveCamera => {
  const cam = useContext(CamContext);
  if (!cam) throw new Error("CamContext missing");
  return cam;
};

/**
 * HTML laid onto a world-space plane (centre `c`, size w x h world units, Euler `rot`).
 * Children are laid out in a pxW-wide box; height follows the plane's aspect.
 */
export const OnPlane: React.FC<{
  c: V3; w: number; h: number; rot?: V3; pxW?: number; opacity?: number; children: React.ReactNode;
}> = ({ c, w, h, rot = [0, 0, 0], pxW = 1000, opacity = 1, children }) => {
  const cam = useCam();
  if (opacity <= 0.002) return null;
  const pxH = (pxW * h) / w;
  const pts = planeCorners(c, w, h, rot).map((p) => project(cam, p));
  const m = quadTransform(pxW, pxH, pts);
  if (!m) return null;
  return (
    <div style={{
      position: "absolute", left: 0, top: 0, width: pxW, height: pxH, transformOrigin: "0 0", transform: m, opacity,
      willChange: "transform",
    }}>{children}</div>
  );
};

/** A label pinned to a world point (screen-aligned, scales with distance). */
export const AtPoint: React.FC<{
  p: V3; opacity?: number; anchor?: "left" | "center" | "right"; dy?: number; dx?: number; scaleRef?: number; children: React.ReactNode;
}> = ({ p, opacity = 1, anchor = "center", dx = 0, dy = 0, scaleRef, children }) => {
  const cam = useCam();
  if (opacity <= 0.002) return null;
  const s = project(cam, p);
  if (!s.visible) return null;
  const scale = scaleRef ? Math.min(1.6, Math.max(0.45, scaleRef / s.depth)) : 1;
  const tx = anchor === "left" ? "0%" : anchor === "right" ? "-100%" : "-50%";
  return (
    <div style={{
      position: "absolute", left: s.x + dx, top: s.y + dy, opacity, whiteSpace: "nowrap",
      transform: `translate(${tx}, -50%) scale(${scale})`, transformOrigin: anchor === "left" ? "0 50%" : anchor === "right" ? "100% 50%" : "50% 50%",
    }}>{children}</div>
  );
};

/** Screen position of a world point (for SVG threads and leaders). */
export const useProject = (): ((p: V3) => { x: number; y: number; visible: boolean }) => {
  const cam = useCam();
  return (p) => project(cam, p);
};

type BeatProps = {
  from: number; to: number; y: number; text: string; kind?: "serif" | "serifItalic" | "mono" | "monoSmall";
  size?: number; color?: string; align?: "center" | "left"; x?: number; sub?: string; subColor?: string; maxWidth?: number;
};

/**
 * Emphasis beat: words rise into place with a focus pull, hold, then release upward.
 * Max 8 words (checked in QA). Lives in screen space inside the safe zone.
 */
export const Beat: React.FC<BeatProps> = ({ from, to, y, text, kind = "serif", size, color = C.ink, align = "center", x, sub, subColor = C.muted, maxWidth = 900 }) => {
  const frame = useCurrentFrame();
  if (frame < from - 2 || frame > to + 2) return null;
  const words = text.split(" ");
  const out = ramp(frame, to - 14, 14, easeInOut);
  const fontSize = size ?? (kind === "mono" ? 34 : kind === "monoSmall" ? 26 : 84);
  const base: React.CSSProperties =
    kind === "mono" || kind === "monoSmall"
      ? { ...monoLabel(fontSize, color) }
      : { fontFamily: SERIF, fontWeight: 300, fontStyle: kind === "serifItalic" ? "italic" : "normal", fontSize, color, letterSpacing: "-0.02em", lineHeight: 1.05 };
  return (
    <div style={{
      position: "absolute", top: y, left: align === "center" ? 540 - maxWidth / 2 : x ?? 90, width: maxWidth,
      textAlign: align, opacity: 1 - out, transform: `translateY(${-out * 18}px)`,
      textShadow: "0 0 18px rgba(4,6,11,0.95), 0 0 42px rgba(4,6,11,0.8)", textWrap: "balance",
    }}>
      <div style={base}>
        {words.map((w, i) => {
          const t = ramp(frame, from + i * 3, 16, easeOut);
          return (
            <span key={i} style={{
              display: "inline-block", opacity: t, filter: `blur(${(1 - t) * 8}px)`,
              transform: `translateY(${(1 - t) * 22}px)`, marginRight: i < words.length - 1 ? "0.26em" : 0,
            }}>{w}</span>
          );
        })}
      </div>
      {sub ? (
        <div style={{ ...monoLabel(26, subColor), marginTop: 18, opacity: ramp(frame, from + words.length * 3 + 6, 14) }}>{sub}</div>
      ) : null}
    </div>
  );
};

/** Mono label used on planes: rule nodes, record fields, layer names. */
export const Mono: React.FC<{ size?: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ size = 28, color = C.muted, children, style }) => (
  <div style={{ ...monoLabel(size, color), ...style }}>{children}</div>
);

export const Serif: React.FC<{ size?: number; color?: string; weight?: number; italic?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ size = 60, color = C.ink, weight = 300, italic, children, style }) => (
  <div style={{ fontFamily: SERIF, fontWeight: weight, fontStyle: italic ? "italic" : "normal", fontSize: size, color, letterSpacing: "-0.015em", lineHeight: 1.12, ...style }}>{children}</div>
);

export const monoFamily = MONO;
