import React from "react";
import { useCurrentFrame } from "remotion";
import { pop } from "./motion";
import type { Theme } from "./theme";

type Props = { theme: Theme; text: string; side: "left" | "right"; delay: number; size?: number };

/** Messenger-style bubble that springs in from its side. */
export const ChatBubble: React.FC<Props> = ({ theme, text, side, delay, size = 56 }) => {
  const frame = useCurrentFrame();
  const t = pop(frame, delay);
  const isRight = side === "right";
  return (
    <div style={{ display: "flex", justifyContent: isRight ? "flex-end" : "flex-start", width: "100%" }}>
      <div style={{
        maxWidth: "78%", padding: "28px 40px", borderRadius: 44, fontSize: size, fontWeight: 600, lineHeight: 1.15,
        background: isRight ? theme.accent : theme.surface, color: isRight ? theme.bg : theme.fg,
        opacity: t, transform: `translateX(${(1 - t) * (isRight ? 120 : -120)}px) scale(${0.8 + 0.2 * t})`,
        transformOrigin: isRight ? "right bottom" : "left bottom", boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
      }}>{text}</div>
    </div>
  );
};
