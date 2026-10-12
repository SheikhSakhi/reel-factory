import React from "react";
import { useCurrentFrame } from "remotion";
import { progress } from "./motion";

type Props = { to: number; from?: number; delay?: number; duration?: number; prefix?: string; suffix?: string; style?: React.CSSProperties };

/** Number that rolls up to its target value. */
export const Counter: React.FC<Props> = ({ to, from = 0, delay = 0, duration = 40, prefix = "", suffix = "", style }) => {
  const frame = useCurrentFrame();
  const value = Math.round(from + (to - from) * progress(frame, delay, duration));
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{prefix}{value.toLocaleString("en-US")}{suffix}</span>;
};
