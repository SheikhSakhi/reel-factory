import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { pop, progress } from "./motion";
import type { Theme } from "./theme";

type Props = {
  readonly theme: Theme;
  /** Comment keyword, shown in capitals: "SKILLS". */
  readonly keyword: string;
  /** What arrives in the DM: "the 5 skills, free". Only promise what you will actually send. */
  readonly promise: string;
  readonly handle?: string;
  /** Button verb and the line before the promise, for other languages: "Напишите" / "и я пришлю". */
  readonly verb?: string;
  readonly lead?: string;
  readonly delay?: number;
  /** Local frame of the button "tap" (press + ripple). Default: 24 frames after delay. */
  readonly tapAt?: number;
};

/** Pinned, button-style keyword CTA: "Comment SKILLS" + what the viewer gets in the DM. */
export const CtaCard: React.FC<Props> = ({ theme, keyword, promise, handle, verb = "Comment", lead = "and I'll DM you", delay = 0, tapAt }) => {
  const f = useCurrentFrame();
  const tap = tapAt ?? delay + 24;
  const t = pop(f, delay);
  const press = interpolate(f, [tap, tap + 4, tap + 12], [1, 0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ripple = progress(f, tap, 20);
  const sub = progress(f, delay + 10, 14);
  const arrow = Math.sin(Math.max(0, f - tap) / 6) * 10;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34, opacity: t, transform: `translateY(${(1 - t) * 70}px)` }}>
      {handle ? (
        <div style={{ fontFamily: theme.fontMono, fontSize: 28, color: theme.muted, letterSpacing: "0.1em" }}>{handle}</div>
      ) : null}
      <div style={{ position: "relative", transform: `scale(${press})` }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: 999, border: `4px solid ${theme.accent}`,
          opacity: ripple > 0 ? 1 - ripple : 0, transform: `scale(${1 + ripple * 0.35})`,
        }} />
        <div style={{
          display: "flex", alignItems: "center", gap: 26, padding: "34px 58px", borderRadius: 999,
          background: theme.accent, color: theme.bg, boxShadow: "0 30px 70px rgba(0,0,0,0.25)",
          fontFamily: theme.fontBody, fontSize: 60, fontWeight: 700, whiteSpace: "nowrap",
        }}>
          <svg width={58} height={58} viewBox="0 0 24 24" fill="none" stroke={theme.bg} strokeWidth={2.2} strokeLinejoin="round">
            <path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.4A8.5 8.5 0 1 1 21 12z" />
          </svg>
          <span>{verb}</span>
          <span style={{ fontFamily: theme.fontMono, letterSpacing: "0.06em", padding: "6px 22px", borderRadius: 18, background: theme.bg, color: theme.accent }}>
            {keyword.toUpperCase()}
          </span>
        </div>
      </div>
      <div style={{
        fontFamily: theme.fontBody, fontSize: 46, fontWeight: 600, color: theme.fg, textAlign: "center", maxWidth: 820,
        lineHeight: 1.2, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)`,
      }}>{`${lead} ${promise}`}</div>
      <svg width={60} height={60} viewBox="0 0 24 24" style={{ opacity: sub, transform: `translateY(${arrow}px)` }}>
        <path d="M12 4v15m0 0-6-6m6 6 6-6" stroke={theme.accent} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
