// Typography for the opening through inference.
import React from "react";
import { useCurrentFrame } from "remotion";
import { at, atEnd, be, bs } from "../timing";
import { smooth, window01, type V3 } from "../lib";
import { C, monoLabel } from "../style";
import { ARCHIVE, FEATURED, MODEL, RULES, ST, recordPos } from "../world";
import { AI_GLYPH_Y } from "../spine/formations";
import { TERMS, termPose } from "../poses";
import { patientAt } from "../patient";
import { TRAIN } from "../training";
import { RECORD_CARDS } from "../content";
import { AtPoint, Beat, Mono, OnPlane, Serif, useProject } from "./primitives";

const S = (st: V3, x: number, y: number, z = 0): V3 => [st[0] + x, st[1] + y, st[2] + z];

// ------------------------------------------------------------- opening

export const OpenType: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {TERMS.map((term, i) => {
        const p = termPose(i, frame);
        return (
          <OnPlane key={term} c={[p.c[0], p.c[1], p.c[2] + 0.05]} w={p.w} h={p.h} rot={p.rot} pxW={1400} opacity={p.o}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Serif size={128} style={{ letterSpacing: "-0.03em" }}>{term}</Serif>
            </div>
            <Mono size={34} color={C.cyan} style={{ position: "absolute", left: 44, top: 30 }}>{`0${i + 1}`}</Mono>
          </OnPlane>
        );
      })}
      <AtPoint p={patientAt(frame)} dy={-92} opacity={window01(frame, at("B03", "patient") + 4, be("B03") + 40, 14, 18)}>
        <Mono size={30} color={C.amber}>patient</Mono>
      </AtPoint>
    </>
  );
};

// ------------------------------------------------------------- artificial intelligence

const AI_LABELS: { text: string; word: string }[] = [
  { text: "recognize patterns", word: "recognize" },
  { text: "interpret language", word: "interpret" },
  { text: "apply knowledge", word: "apply" },
];

export const AiType: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <Beat from={at("B04", "artificial")} to={be("B04") + 12} y={250} text="Artificial intelligence" size={92} sub="the broad field" />
      {AI_LABELS.map((l, k) => (
        <AtPoint key={l.text} p={S(ST.ai, -2.15, AI_GLYPH_Y[k] + 1.62)} anchor="left"
          opacity={window01(frame, at("B04", l.word) - 2, be("B05") - 10, 12, 20)}>
          <Mono size={30} color={k === 2 ? C.cyan : C.ink}>{l.text}</Mono>
        </AtPoint>
      ))}
    </>
  );
};

// ------------------------------------------------------------- expert system

const NodeLabel: React.FC<{ x: number; y: number; w: number; text: string; color: string; o: number; sub?: string }> = ({ x, y, w, text, color, o, sub }) => (
  <OnPlane c={S(ST.expert, x, y, 0.02)} w={w} h={0.8} pxW={w * 210} opacity={o}>
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
      <Mono size={50} color={color} style={{ letterSpacing: "0.02em" }}>{text}</Mono>
      {sub ? <Mono size={22} color={C.muted}>{sub}</Mono> : null}
    </div>
  </OnPlane>
);

export const ExpertType: React.FC = () => {
  const frame = useCurrentFrame();
  const net = window01(frame, bs("B06") + 20, be("B08") - 20, 24, 30);
  const steps = [at("B06", "symptoms"), at("B06", "findings") + 4, at("B06", "suggest")];
  const authored = smooth((frame - at("B06", "rules") + 4) / 14);
  return (
    <>
      <Beat from={bs("B05")} to={be("B05") + 16} y={260} text="Knowledge people put into them" size={76} />
      <Beat from={at("B06", "clinical") - 2} to={be("B06") + 10} y={250} text="Clinical expert system" kind="mono" size={40} color={C.cyan} />
      <Mono size={28} color={C.ink} style={{ position: "absolute", top: 312, width: 1080, textAlign: "center", opacity: smooth((frame - at("B06", "experts")) / 12) * (1 - smooth((frame - be("B06") + 4) / 14)) }}>
        rules written by medical experts
      </Mono>
      <Beat from={bs("B07")} to={be("B07") + 24} y={250} text="Applies knowledge it was given" size={62} sub="not learned from patient records" />
      {RULES.inputs.map((n, k) => {
        const lit = (RULES.litInputs as readonly number[]).includes(k) && frame > steps[0] - 6;
        return <NodeLabel key={n.label} x={n.x} y={n.y} w={1.6} text={n.label} color={lit ? C.cyan : C.ink} o={net} />;
      })}
      {RULES.gates.map((n, k) => {
        const lit = ([0, 2].includes(k) && frame > steps[1] - 4) || ([3, 4].includes(k) && frame > steps[1] + 18);
        return <NodeLabel key={n.label} x={n.x} y={n.y} w={1.5} text={n.label} color={lit ? C.cyan : C.ink} o={net * (0.5 + 0.5 * authored)} />;
      })}
      {RULES.outputs.map((n, k) => {
        const lit = (RULES.litOutputs as readonly number[]).includes(k) && frame > steps[2] + 6;
        return <NodeLabel key={n.label} x={n.x} y={n.y} w={2.1} text={n.label} color={lit ? C.ink : C.muted} o={net} />;
      })}
      <OnPlane c={S(ST.expert, -1.7, 5.25, 0.02)} w={3.4} h={0.5} pxW={700} opacity={net}>
        <Mono size={34} color={C.muted} style={{ textAlign: "center", lineHeight: "100px" }}>symptoms</Mono>
      </OnPlane>
      <OnPlane c={S(ST.expert, 1.7, 5.25, 0.02)} w={3.4} h={0.5} pxW={700} opacity={net}>
        <Mono size={34} color={C.muted} style={{ textAlign: "center", lineHeight: "100px" }}>findings</Mono>
      </OnPlane>
      <OnPlane c={S(ST.expert, 0, -4.95, 0.02)} w={5} h={0.5} pxW={1000} opacity={net * smooth((frame - steps[2]) / 16)}>
        <Mono size={34} color={C.ink} style={{ textAlign: "center", lineHeight: "100px" }}>suggested possibilities</Mono>
      </OnPlane>
    </>
  );
};

// ------------------------------------------------------------- too complicated

export const TomlType: React.FC = () => (
  <Beat from={at("B08", "but")} to={atEnd("B08", "rules") + 40} y={260} text="Too complicated to write down as rules?" size={74} />
);

// ------------------------------------------------------------- machine learning

const RecordCard: React.FC<{ k: number }> = ({ k }) => {
  const frame = useCurrentFrame();
  const project = useProject();
  const f = FEATURED[k];
  const card = RECORD_CARDS[k];
  const pull = smooth((frame - (at("B10", "diagnoses") - 14)) / 20) * (1 - smooth((frame - (be("B10") + 30)) / 20));
  const rp = recordPos(f.r);
  const anchor: V3 = S(ST.ml, rp[0] + f.side * 0.35 * pull + f.side * 0.62, rp[1], rp[2] + 2.2 * pull);
  const reveal = [at("B10", "diagnoses"), at("B10", "lab"), at("B10", "histories"), at("B10", "came")];
  const p = project(anchor);
  if (pull < 0.01 || !p.visible) return null;
  const row = (i: number, key: string, value: string, color: string = C.ink) => (
    <div style={{ display: "flex", gap: 14, opacity: smooth((frame - reveal[i] - k * 3) / 10), alignItems: "baseline" }}>
      <span style={{ ...monoLabel(19, C.muted), width: 92 }}>{key}</span>
      <span style={{ ...monoLabel(22, color), letterSpacing: "0.04em", textTransform: "none" }}>{value}</span>
    </div>
  );
  return (
    <div style={{
      position: "absolute", left: Math.min(1000 - 370, Math.max(80, f.side < 0 ? p.x - 380 : p.x + 10)), top: p.y - 64, width: 370, opacity: pull,
      padding: "14px 18px", background: "rgba(11,19,34,0.82)", borderLeft: f.side < 0 ? "none" : `2px solid ${C.cyan}`,
      borderRight: f.side < 0 ? `2px solid ${C.cyan}` : "none", display: "flex", flexDirection: "column", gap: 6,
    }}>
      {row(0, "dx", card.dx)}
      {row(1, "labs", card.labs)}
      {row(2, "history", card.hx)}
      {row(3, "outcome", card.outcome, card.returned ? C.ink : C.muted)}
    </div>
  );
};

/** Known outcome (solid square) vs prediction (hollow ring) on one 0–1 scale. */
const Comparison: React.FC = () => {
  const frame = useCurrentFrame();
  const project = useProject();
  const on = window01(frame, at("B12", "makes") - 10, TRAIN.settledAt() + 14, 16, 16);
  if (on < 0.01) return null;
  const st = TRAIN.state(frame);
  const p = project(S(ST.ml, MODEL.w / 2 + 0.6, MODEL.y, 0.6));
  const top = p.y - 150, h = 290, x = p.x + 40;
  const yOf = (v: number) => top + (1 - v) * h;
  const showPred = st.active ? smooth(st.phase / 0.18) : 0.6;
  const showCmp = st.active ? smooth((st.phase - 0.25) / 0.15) : 0;
  const kY = yOf(st.known), pY = yOf(st.predicted);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: on }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <line x1={x} y1={top} x2={x} y2={top + h} stroke={C.muted} strokeWidth={2} />
        <line x1={x - 8} y1={top} x2={x + 8} y2={top} stroke={C.muted} strokeWidth={2} />
        <line x1={x - 8} y1={top + h} x2={x + 8} y2={top + h} stroke={C.muted} strokeWidth={2} />
        <line x1={x + 34} y1={kY} x2={x + 34} y2={pY} stroke={C.ink} strokeWidth={2} strokeDasharray="5 5" opacity={showCmp} />
        <rect x={x - 16} y={kY - 16} width={32} height={32} fill={C.ink} />
        <circle cx={x + 34} cy={pY} r={18} fill="none" stroke={C.cyan} strokeWidth={5} opacity={showPred} />
      </svg>
      <div style={{ position: "absolute", left: x - 20, top: top - 40, transform: "translateX(-100%)", ...monoLabel(22, C.muted) }}>returned</div>
      <div style={{ position: "absolute", left: x - 20, top: top + h + 6, transform: "translateX(-100%)", ...monoLabel(22, C.muted) }}>did not return</div>
      <div style={{ position: "absolute", left: x + 64, top: kY - 14, ...monoLabel(24, C.ink) }}>known</div>
      <div style={{ position: "absolute", left: x + 64, top: pY + (Math.abs(pY - kY) < 34 ? 22 : -14), ...monoLabel(24, C.cyan), opacity: showPred }}>predicted</div>
    </div>
  );
};

const LOOP = ["predict", "compare", "adjust"] as const;
const Loop: React.FC = () => {
  const frame = useCurrentFrame();
  const project = useProject();
  const on = window01(frame, at("B12", "makes") - 6, TRAIN.settledAt() + 10, 14, 18);
  if (on < 0.01) return null;
  const st = TRAIN.state(frame);
  const active = st.phase < 0.25 ? 0 : st.phase < 0.6 ? 1 : 2;
  const p = project(S(ST.ml, -MODEL.w / 2 - 0.35, MODEL.y, 0.6));
  return (
    <div style={{ position: "absolute", left: p.x - 230, top: p.y - 70, width: 220, opacity: on, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
      {LOOP.map((w, i) => (
        <div key={w} style={{ ...monoLabel(26, st.active && active === i ? C.ink : C.muted), opacity: st.active && active === i ? 1 : 0.55 }}>
          {w} {st.active && active === i ? "●" : "○"}
        </div>
      ))}
    </div>
  );
};

/** Inference: the single patient's estimate (no known outcome yet). */
const Estimate: React.FC = () => {
  const frame = useCurrentFrame();
  const project = useProject();
  const on = window01(frame, at("B14", "inference") + 20, bs("B16") + 10, 16, 24);
  if (on < 0.01) return null;
  const p = project(S(ST.ml, 0, MODEL.y - 1.9, 0.6));
  return (
    <div style={{ position: "absolute", left: p.x + 60, top: p.y - 40, opacity: on, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <svg width={40} height={40}><circle cx={20} cy={20} r={14} fill="none" stroke={C.cyan} strokeWidth={4} /></svg>
        <span style={monoLabel(26, C.cyan)}>estimate</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <svg width={40} height={40}><rect x={7} y={7} width={26} height={26} fill="none" stroke={C.muted} strokeWidth={2} strokeDasharray="4 4" /></svg>
        <span style={monoLabel(22, C.muted)}>outcome not yet known</span>
      </div>
    </div>
  );
};

export const MlType: React.FC = () => {
  const frame = useCurrentFrame();
  const trainLabelOn = window01(frame, at("B12", "makes"), bs("B13") + 6, 14, 14);
  const t15 = window01(frame, bs("B15"), be("B15") + 24, 12, 18);
  const infOn = Math.max(window01(frame, at("B14", "using"), be("B15") + 24, 14, 18));
  const t15b = smooth((frame - at("B15", "inference")) / 10);
  return (
    <>
      <Beat from={bs("B09")} to={be("B09") + 14} y={250} text="Will our patient return after discharge?" size={70} />
      <Beat from={at("B10", "thousands") - 2} to={be("B10") + 30} y={1440} text="Thousands of previous admissions" size={58} />
      <Mono size={22} color={C.muted} style={{
        position: "absolute", top: 260, width: 1080, textAlign: "center",
        opacity: window01(frame, at("B10", "diagnoses"), be("B10") + 30, 12, 14),
      }}>fictional records · last cell = known outcome</Mono>
      {FEATURED.map((_, k) => <RecordCard key={k} k={k} />)}
      <Beat from={at("B11", "we") - 2} to={be("B11") + 16} y={1440} text="We use them to train a model" size={58} />
      <div style={{ position: "absolute", top: 250, width: 1080, textAlign: "center", textShadow: "0 0 16px #04060B, 0 0 30px #04060B", opacity: Math.max(trainLabelOn * (1 - t15), t15 * (1 - 0.6 * t15b)) }}>
        <Mono size={34} color={C.ink}>training <span style={{ color: C.muted }}>— learning from examples</span></Mono>
      </div>
      <div style={{ position: "absolute", top: t15 > 0.01 ? 310 : 250, width: 1080, textAlign: "center", textShadow: "0 0 16px #04060B, 0 0 30px #04060B", opacity: infOn * (t15 > 0.01 ? Math.max(0.35, t15b) : 1) }}>
        <Mono size={34} color={C.cyan}>inference <span style={{ color: C.muted }}>— using the trained model</span></Mono>
      </div>
      <Comparison />
      <Loop />
      <Beat from={bs("B13")} to={be("B13") + 30} y={250} text="Machine learning" size={84} sub="learning patterns from examples" />
      <Estimate />
    </>
  );
};
