import React from "react";
import { Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Counter } from "./Counter";
import { pop, progress } from "./motion";
import type { Theme } from "./theme";

/**
 * Proof components. A reel that shows real evidence (a screenshot, a real comment,
 * a sourced number) beats one made of abstract shapes. Never invent the evidence:
 * screenshots and comments come from the user (public/assets/), numbers from 01-research.md.
 */

type Box = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

type ShotProps = {
  readonly theme: Theme;
  /** Path under public/, e.g. "assets/my-reel/dashboard.png" or ".mp4". */
  readonly src: string;
  readonly kind?: "image" | "video";
  /** Device chrome around the media. */
  readonly device?: "phone" | "browser" | "none";
  /** Outer width in px. Height follows `aspect` (width / height of the media). */
  readonly width?: number;
  readonly aspect?: number;
  /** URL text in the browser bar. */
  readonly url?: string;
  readonly delay?: number;
  /** Slow push-in from 1 to this scale over the scene (Ken Burns). 1 disables it. */
  readonly zoomTo?: number;
  /** Which point of the media the zoom moves toward, in % (default centre). */
  readonly focus?: { readonly x: number; readonly y: number };
  /** Accent box drawn on at `at` (local frame); x/y/w/h are fractions (0-1) of the media. */
  readonly highlight?: Box & { readonly at: number };
  /** Small source tag under the shot, e.g. "my analytics, Oct 2026". */
  readonly caption?: string;
  /** Video only: start offset into the clip, in frames. */
  readonly startFrom?: number;
};

/** A real screenshot or screen recording in a phone or browser frame, with push-in and a highlight box. */
export const ProofShot: React.FC<ShotProps> = ({
  theme, src, kind = src.endsWith(".mp4") || src.endsWith(".webm") || src.endsWith(".mov") ? "video" : "image",
  device = "phone", width = device === "phone" ? 460 : 860, aspect = device === "phone" ? 9 / 19.5 : 16 / 10,
  url = "", delay = 0, zoomTo = 1.08, focus = { x: 50, y: 50 }, highlight, caption, startFrom = 0,
}) => {
  const f = useCurrentFrame();
  const t = pop(f, delay, 16);
  const zoom = interpolate(f, [delay, delay + 150], [1, zoomTo], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bar = device === "browser" ? 58 : 0;
  const bezel = device === "phone" ? 18 : 0;
  const mediaW = width - bezel * 2;
  const mediaH = mediaW / aspect;
  const media: React.CSSProperties = {
    width: "100%", height: "100%", objectFit: "cover",
    transform: `scale(${zoom})`, transformOrigin: `${focus.x}% ${focus.y}%`,
  };
  const draw = highlight ? progress(f, highlight.at, 12) : 0;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 22,
      opacity: t, transform: `translateY(${(1 - t) * 80}px) scale(${0.92 + 0.08 * t})`,
    }}>
      <div style={{
        width, padding: bezel, boxSizing: "border-box", borderRadius: device === "phone" ? 64 : 22,
        background: device === "none" ? "transparent" : theme.fg, boxShadow: device === "none" ? "none" : "0 40px 90px rgba(0,0,0,0.28)",
      }}>
        {device === "browser" ? (
          <div style={{ height: bar, display: "flex", alignItems: "center", gap: 12, padding: "0 22px", background: theme.surface, borderRadius: "22px 22px 0 0" }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
            <div style={{ flex: 1, marginLeft: 14, height: 34, borderRadius: 17, background: `${theme.muted}22`, color: theme.muted, fontFamily: theme.fontMono, fontSize: 20, display: "flex", alignItems: "center", paddingLeft: 18 }}>{url}</div>
          </div>
        ) : null}
        <div style={{
          position: "relative", width: mediaW, height: mediaH, overflow: "hidden", background: theme.surface,
          borderRadius: device === "phone" ? 48 : device === "browser" ? "0 0 22px 22px" : 22,
        }}>
          {kind === "video"
            ? <OffthreadVideo src={staticFile(src)} muted startFrom={startFrom} style={media} />
            : <Img src={staticFile(src)} style={media} />}
          {highlight ? (
            <div style={{
              position: "absolute", left: `${highlight.x * 100}%`, top: `${highlight.y * 100}%`,
              width: `${highlight.w * 100}%`, height: `${highlight.h * 100}%`, borderRadius: 14,
              border: `6px solid ${theme.accent}`, opacity: draw, transform: `scale(${1.15 - 0.15 * draw})`,
              boxShadow: `0 0 0 2000px rgba(0,0,0,${0.35 * draw})`,
            }} />
          ) : null}
        </div>
      </div>
      {caption ? (
        <div style={{ fontFamily: theme.fontMono, fontSize: 24, color: theme.muted, letterSpacing: "0.04em" }}>{caption}</div>
      ) : null}
    </div>
  );
};

type CommentProps = {
  readonly theme: Theme;
  readonly handle: string;
  readonly text: string;
  /** Optional avatar under public/; falls back to the handle's first letter. */
  readonly avatar?: string;
  readonly likes?: number;
  readonly time?: string;
  readonly delay?: number;
  readonly size?: number;
  /** Tilt in degrees, for a stack of cards. */
  readonly tilt?: number;
};

/** A comment card (generic, no platform logos). Use only real comments the user supplied. */
export const CommentCard: React.FC<CommentProps> = ({ theme, handle, text, avatar, likes, time = "2h", delay = 0, size = 40, tilt = 0 }) => {
  const f = useCurrentFrame();
  const t = pop(f, delay);
  const heart = pop(f, delay + 14, 10);
  const letter = handle.replace(/^@/, "").charAt(0).toUpperCase();
  return (
    <div style={{
      display: "flex", gap: 26, alignItems: "flex-start", width: 860, boxSizing: "border-box", padding: "30px 34px",
      background: theme.surface, borderRadius: 36, boxShadow: "0 24px 60px rgba(0,0,0,0.16)",
      opacity: t, transform: `translateY(${(1 - t) * 60}px) rotate(${tilt * t}deg) scale(${0.9 + 0.1 * t})`,
    }}>
      {avatar
        ? <Img src={staticFile(avatar)} style={{ width: size * 1.8, height: size * 1.8, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        : (
          <div style={{
            width: size * 1.8, height: size * 1.8, borderRadius: "50%", flexShrink: 0, background: theme.accent, color: theme.bg,
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontBody, fontWeight: 700, fontSize: size,
          }}>{letter}</div>
        )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: theme.fontBody, fontSize: size * 0.7, color: theme.muted }}>
          <span style={{ color: theme.fg, fontWeight: 700 }}>{handle}</span>{`  ${time}`}
        </div>
        <div style={{ fontFamily: theme.fontBody, fontSize: size, lineHeight: 1.25, color: theme.fg, marginTop: 8 }}>{text}</div>
      </div>
      {likes !== undefined ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: theme.muted, fontFamily: theme.fontBody, fontSize: size * 0.6 }}>
          <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `scale(${heart})` }}>
            <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.2 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 6 3.7 4.5 7.3C19.5 16.4 12 21 12 21z" fill={theme.accent} />
          </svg>
          {likes.toLocaleString("en-US")}
        </div>
      ) : null}
    </div>
  );
};

type StatProps = {
  readonly theme: Theme;
  readonly to: number;
  readonly from?: number;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly label: string;
  /** Required: where the number comes from. Shown as a small tag. */
  readonly source: string;
  readonly delay?: number;
  readonly size?: number;
};

/** A big sourced number. The source tag is required on purpose: unsourced stats are not proof. */
export const StatCard: React.FC<StatProps> = ({ theme, to, from = 0, prefix, suffix, label, source, delay = 0, size = 260 }) => {
  const f = useCurrentFrame();
  const t = pop(f, delay);
  const tag = progress(f, delay + 30, 12);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: t, transform: `scale(${0.85 + 0.15 * t})` }}>
      <Counter to={to} from={from} prefix={prefix} suffix={suffix} delay={delay} duration={36}
        style={{ fontFamily: theme.fontDisplay, fontSize: size, lineHeight: 0.95, color: theme.fg, letterSpacing: "-0.04em" }} />
      <div style={{ fontFamily: theme.fontBody, fontSize: 52, fontWeight: 600, color: theme.fg, textAlign: "center", maxWidth: 860, lineHeight: 1.15 }}>{label}</div>
      <div style={{
        fontFamily: theme.fontMono, fontSize: 24, color: theme.muted, letterSpacing: "0.06em", padding: "8px 18px",
        border: `2px solid ${theme.muted}55`, borderRadius: 999, opacity: tag,
      }}>{`SOURCE: ${source}`}</div>
    </div>
  );
};
