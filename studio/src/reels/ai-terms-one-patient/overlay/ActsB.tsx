// Typography for deep learning through the final line.
import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { at, atEnd, be, bs, FILM_DURATION } from "../timing";
import { smooth, window01, type V3 } from "../lib";
import { C, monoLabel, SERIF } from "../style";
import { LAYERS, MAP, PIX, ST } from "../world";
import { FOUND_SLAB, FOUND_TASK_X } from "../spine/formations";
import { DRAFT_STAMP, FINALE_CARDS, GENERATED_FROM, PAGE, finaleCardOn, finaleCardsOut, pageContentOn, pagePose } from "../poses";
import { patientAt } from "../patient";
import { DRAFT, INSTRUCTION, SOURCES } from "../content";
import { AtPoint, Beat, Mono, OnPlane, Serif, useProject } from "./primitives";

const S = (st: V3, x: number, y: number, z = 0): V3 => [st[0] + x, st[1] + y, st[2] + z];

// ------------------------------------------------------------- deep learning

export const DlType: React.FC = () => {
  const frame = useCurrentFrame();
  const stackOn = window01(frame, at("B19", "layers"), be("B21") + 10, 16, 20);
  return (
    <>
      <AtPoint p={S(ST.dl, -PIX.size / 2, -PIX.size / 2 - 0.45, 0)} anchor="left" opacity={window01(frame, at("B16", "chest"), at("B17", "pixels") + 30, 12, 16)}>
        <Mono size={26} color={C.ink}>chest x-ray <span style={{ color: C.muted }}>· illustrative</span></Mono>
      </AtPoint>
      <Beat from={at("B17", "no")} to={at("B17", "it’s") + 4} y={250} text="No longer neatly in columns" size={70} />
      <Beat from={at("B17", "millions") - 2} to={be("B17") + 16} y={250} text="Millions of pixels" size={84} sub="subtle patterns that may matter" />
      <Beat from={bs("B18")} to={be("B18") + 14} y={250} text="Deep learning" size={92} sub="neural networks with many layers" />
      {LAYERS.map((l, k) => {
        const word = ["simpler", "features", "complex", "finding"][k];
        const on = window01(frame, Math.min(at("B19", word) - 4, at("B19", "simpler") + k * 16), be("B21") + 6, 12, 20);
        const above = k % 2 === 0; // alternate above / below so receding labels never stack
        return (
          <AtPoint key={l.name} p={S(ST.dl, 0, above ? l.size / 2 + 0.3 : -l.size / 2 - 0.3, l.z)} opacity={on * stackOn} scaleRef={16}>
            <Mono size={28} color={k === 3 ? C.ink : C.cyan}>{`layer ${k + 1} · ${l.name}`}</Mono>
          </AtPoint>
        );
      })}
      <Mono size={22} color={C.muted} style={{ position: "absolute", top: 1470, width: 1080, textAlign: "center", opacity: stackOn }}>
        conceptual illustration · not a real model’s features
      </Mono>
      <Beat from={at("B19", "simpler") - 4} to={be("B19") + 10} y={250} text="Simpler features → more complex patterns" size={60} />
      <Beat from={bs("B20")} to={be("B20") + 14} y={250} text="Features learned from training examples" size={66} />
      <Beat from={bs("B21")} to={be("B21") + 30} y={250} text="Images, sound, language, other data" size={64} />
    </>
  );
};

// ------------------------------------------------------------- generative AI: the document

export const DraftDocument: React.FC<{ mode: "gen" | "caution" }> = ({ mode }) => {
  const frame = useCurrentFrame();
  const project = useProject();
  const p = pagePose(frame);
  const content = mode === "gen" ? pageContentOn(frame) * p.o : 1;
  const genFrom = GENERATED_FROM();
  const stamp = mode === "gen" ? smooth((frame - DRAFT_STAMP()) / 8) : 1;
  const sentenceOn = (i: number) => (mode === "gen" ? smooth((frame - genFrom - i * 22) / 18) : 1);
  const srcOn = (i: number) => (mode === "gen" ? smooth((frame - at("B25", "documented") - i * 4) / 12) : 1);
  const instrOn = mode === "gen" ? smooth((frame - at("B25", "instruction") + 2) / 12) : 1;
  const check = mode === "caution" ? smooth((frame - at("B41", "generating") + 4) / 16) : 0;
  if (content < 0.01) return null;
  // Layout in world units on the page (mode gen) or the finale panel (mode caution).
  const base = mode === "gen" ? p.c : S(ST.finale, 0, -0.6, 0.4);
  const rot = mode === "gen" ? p.rot : ([0, 0, 0] as V3);
  const pw = mode === "gen" ? p.w : PAGE.w;
  const ph = mode === "gen" ? p.h : PAGE.h;
  // Sources sit above the page in two columns (the instruction takes the sixth slot in gen).
  const srcBase: V3 = mode === "gen" ? [ST.gen[0], ST.gen[1] + 5.45, ST.gen[2] + 0.3] : [ST.finale[0], ST.finale[1] + 4.95, ST.finale[2] + 0.4];
  const slot = (i: number): V3 => S(srcBase, (i % 2 === 0 ? -1.27 : 1.27), -Math.floor(i / 2) * 0.72, 0);
  const srcPts = SOURCES.map((_, i) => slot(i));
  const media = mode === "gen" ? 1 - smooth((frame - bs("B26") + 4) / 14) * (1 - smooth((frame - be("B26") - 4) / 20)) : 1;
  const sentenceY = (i: number) => 1.75 - i * 0.98;
  const thread = (si: number, srcIdx: number) => {
    const a = project(srcPts[srcIdx]);
    const b = project([base[0] - pw / 2 + 0.2, base[1] + sentenceY(si) + 0.18, base[2]]);
    return { a, b };
  };
  return (
    <>
      <OnPlane c={[base[0], base[1], base[2] + 0.02]} w={pw} h={ph} rot={rot} pxW={1000} opacity={content}>
        <div style={{ position: "absolute", inset: 0, padding: "56px 64px", background: mode === "caution" ? "rgba(11,19,34,0.94)" : "transparent", border: mode === "caution" ? `2px solid ${C.muted}` : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Mono size={36} color={C.ink}>discharge summary</Mono>
            <div style={{ ...monoLabel(56, C.amber), border: `5px solid ${C.amber}`, padding: "4px 22px", transform: `rotate(-6deg) scale(${1.4 - 0.4 * stamp})`, opacity: stamp }}>DRAFT</div>
          </div>
          <div style={{ height: 2, background: C.muted, opacity: 0.4, margin: "26px 0 30px" }} />
          {mode === "gen" ? (
            <div style={{ position: "absolute", left: 64, right: 64, top: 170, opacity: 1 - smooth((frame - genFrom + 6) / 10) }}>
              {[0.92, 0.85, 0.6, 0.9, 0.7, 0.88, 0.45].map((w, i) => (
                <div key={i} style={{ height: 14, width: `${w * 100}%`, background: C.muted, opacity: 0.18, margin: "0 0 34px" }} />
              ))}
              <div style={{ position: "absolute", left: 0, top: -14, width: 4, height: 54, background: C.ink, opacity: Math.floor((frame - bs("B23")) / 15) % 2 === 0 && frame > bs("B23") ? 0.9 : 0 }} />
            </div>
          ) : null}
          {DRAFT.map((d, i) => {
            const unsupported = d.src.length === 0;
            const on = sentenceOn(i);
            const chars = Math.round(d.text.length * Math.min(1, on * 1.1));
            return (
              <div key={i} style={{ position: "relative", marginBottom: 34, opacity: Math.min(1, on * 2) }}>
                <Serif size={52} style={{ lineHeight: 1.24 }}>
                  {d.text.slice(0, chars)}
                  <span style={{ opacity: 0 }}>{d.text.slice(chars)}</span>
                </Serif>
                {mode === "caution" ? (
                  <div style={{
                    position: "absolute", left: -30, top: 4, bottom: 4, width: 6,
                    background: unsupported ? "transparent" : C.cyan, border: unsupported ? `2px dashed ${C.muted}` : "none", opacity: check,
                  }} />
                ) : null}
                {mode === "caution" && unsupported ? (
                  <div style={{ ...monoLabel(30, C.ink), marginTop: 10, opacity: smooth((frame - at("B41", "sentence") + 4) / 12) }}>not found in record · check</div>
                ) : null}
              </div>
            );
          })}
          <Mono size={28} color={C.muted} style={{ position: "absolute", bottom: 40, left: 64 }}>{mode === "gen" ? "generated text" : "output"}</Mono>
        </div>
      </OnPlane>
      {SOURCES.map((s, i) => (
        <OnPlane key={s.key} c={srcPts[i]} w={2.4} h={0.62} pxW={460} opacity={content * srcOn(i) * media}>
          <div style={{ position: "absolute", inset: 0, border: `2px solid ${C.cyan}`, padding: "10px 16px", background: "rgba(4,6,11,0.8)" }}>
            <div style={monoLabel(22, C.cyan)}>{s.key}</div>
            <div style={{ ...monoLabel(28, C.ink), textTransform: "none", letterSpacing: "0", marginTop: 4 }}>{s.text}</div>
          </div>
        </OnPlane>
      ))}
      {mode === "gen" ? (
        <OnPlane c={slot(5)} w={2.4} h={0.62} pxW={460} opacity={content * instrOn * media}>
          <div style={{ position: "absolute", inset: 0, border: `2px dashed ${C.ink}`, padding: "10px 16px", background: "rgba(4,6,11,0.8)" }}>
            <div style={monoLabel(22, C.ink)}>instruction</div>
            <div style={{ ...monoLabel(22, C.ink), textTransform: "none", letterSpacing: "0", marginTop: 4 }}>{INSTRUCTION}</div>
          </div>
        </OnPlane>
      ) : null}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {DRAFT.flatMap((d, si) => d.src.map((srcIdx) => {
          const { a, b } = thread(si, srcIdx);
          const o = mode === "gen" ? sentenceOn(si) * content * 0.6 * media : check * 0.75;
          if (!a.visible || !b.visible || o < 0.01) return null;
          const midY = (a.y + b.y) / 2;
          return <path key={`${si}-${srcIdx}`} d={`M ${a.x} ${a.y + 20} C ${a.x} ${midY}, ${b.x - 60} ${midY}, ${b.x} ${b.y}`} stroke={C.cyan} strokeWidth={2} fill="none" opacity={o} />;
        }))}
      </svg>
      {mode === "gen" ? (
        <>
          <Mono size={26} color={C.cyan} style={{ position: "absolute", left: 0, width: 1080, textAlign: "center", top: project(S(srcBase, 0, 0.62, 0)).y - 16, opacity: content * srcOn(0) * media }}>
            source · documented information
          </Mono>
        </>
      ) : null}
    </>
  );
};

export const GenType: React.FC = () => {
  const frame = useCurrentFrame();
  const project = useProject();
  const mediaOn = window01(frame, at("B26", "other"), be("B26") + 6, 12, 16);
  const media: { label: string; p: V3 }[] = [
    { label: "image", p: S(ST.gen, -3.5, 6.85, 1.2) },
    { label: "audio", p: S(ST.gen, 0.6, 6.0, 0.8) },
    { label: "video", p: S(ST.gen, -1.4, -6.65, 0.6) },
  ];
  void project;
  return (
    <>
      <Beat from={bs("B22")} to={be("B22") + 12} y={250} text="Now: a draft discharge summary" size={68} />
      <Beat from={bs("B23")} to={be("B23") + 10} y={250} text="Asking the system to create" size={70} />
      <Beat from={bs("B24")} to={at("B25", "given") - 6} y={250} text="Generative AI" size={104} />
      <DraftDocument mode="gen" />
      <Beat from={bs("B26")} to={at("B26", "other") - 2} y={300} text="Large language models" size={84} sub="one example" />
      {media.map((m) => (
        <AtPoint key={m.label} p={m.p} anchor="left" opacity={mediaOn}>
          <Mono size={26} color={C.ink}>{m.label}</Mono>
        </AtPoint>
      ))}
    </>
  );
};

// ------------------------------------------------------------- foundation model

const TASKS = ["summaries", "images", "speech", "risk"] as const;
const FOUND_KIND = ["draft", "image", "audio", "risk"] as const;
export const FoundType: React.FC = () => {
  const frame = useCurrentFrame();
  const slab = window01(frame, at("B27", "foundation"), at("B29", "connect"), 14, 18);
  const tasks = window01(frame, at("B27", "adapted") - 4, at("B29", "connect"), 14, 18);
  const ghost = smooth((frame - at("B28", "separate") + 6) / 14) * (1 - smooth((frame - at("B28", "foundation") + 4) / 20));
  return (
    <>
      <OnPlane c={S(ST.found, 0, FOUND_SLAB.y, FOUND_SLAB.d / 2 + 0.06)} w={FOUND_SLAB.w} h={FOUND_SLAB.h} pxW={1400} opacity={slab}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mono size={64} color={C.ink} style={{ letterSpacing: "0.3em" }}>foundation model</Mono>
        </div>
      </OnPlane>
      {FOUND_TASK_X.map((x, k) => (
        <React.Fragment key={k}>
          <OnPlane c={S(ST.found, x, 0.95, 0.05)} w={1.35} h={1.35} pxW={300} opacity={tasks}>
            <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}><TaskIcon kind={FOUND_KIND[k]} /></div>
          </OnPlane>
          <AtPoint p={S(ST.found, x, 1.95, 0)} opacity={tasks}>
            <Mono size={26} color={C.ink}>{TASKS[k]}</Mono>
          </AtPoint>
        </React.Fragment>
      ))}
      <AtPoint p={S(ST.found, 0, FOUND_SLAB.y - 1.0, 1.2)} opacity={ghost}>
        <Mono size={24} color={C.muted}>a separate model for every use?</Mono>
      </AtPoint>
      <Beat from={at("B27", "foundation") - 2} to={be("B27") + 10} y={250} text="Foundation model" size={92} sub="trained on vast data · adapted to tasks" />
      <Beat from={at("B28", "we") - 4} to={be("B28") + 24} y={250} text="Start with one foundation" size={80} />
    </>
  );
};

// ------------------------------------------------------------- how the terms connect

const RingLabel: React.FC<{ c: readonly [number, number]; r: number; title: string; sub: string; on: number; dy?: number }> = ({ c, r, title, sub, on, dy = 0.47 }) => (
  <OnPlane c={S(ST.map, c[0], c[1] + r - dy, 0.02)} w={3.8} h={0.66} pxW={1000} opacity={on}>
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" }}>
      <Mono size={58} color={C.ink} style={{ letterSpacing: "0.04em" }}>{title}</Mono>
      <Mono size={44} color={C.muted} style={{ textTransform: "none", letterSpacing: "0" }}>{sub}</Mono>
    </div>
  </OnPlane>
);

/** Fills the overlap of generative AI and deep learning ("many are built using deep learning"). */
const Lens: React.FC<{ on: number }> = ({ on }) => {
  const project = useProject();
  if (on < 0.01) return null;
  const circ = (c: readonly [number, number], r: number) => {
    const a = project(S(ST.map, c[0], c[1], 0)), e = project(S(ST.map, c[0] + r, c[1], 0));
    return { x: a.x, y: a.y, r: Math.abs(e.x - a.x) };
  };
  const dl = circ(MAP.dl.c, MAP.dl.r), gen = circ(MAP.gen.c, MAP.gen.r);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: on }}>
      <defs><clipPath id="dl-clip"><circle cx={dl.x} cy={dl.y} r={dl.r} /></clipPath></defs>
      <circle cx={gen.x} cy={gen.y} r={gen.r} fill={C.cyan} opacity={0.22} clipPath="url(#dl-clip)" />
    </svg>
  );
};

export const RelateType: React.FC = () => {
  const frame = useCurrentFrame();
  const project = useProject();
  const end = at("B35", "and") + 6;
  const lbl = (id: string) => window01(frame, bs(id) - 2, end + (id === "B33" ? 0 : 0), 14, 20);
  const gen = MAP.gen;
  const genLabel = project(S(ST.map, 2.0, -3.3, 0));
  const genEdge = project(S(ST.map, gen.c[0] + 0.25, gen.c[1] - gen.r, 0));
  const lens = smooth((frame - at("B33", "many") + 4) / 16) * (1 - smooth((frame - end) / 20));
  return (
    <>
      <Beat from={bs("B29")} to={bs("B30") + 4} y={250} text="How the four terms connect" size={74} />
      <RingLabel c={MAP.ai.c} r={MAP.ai.r} title="artificial intelligence" sub="the broad field" on={lbl("B30")} />
      <RingLabel c={MAP.ml.c} r={MAP.ml.r} title="machine learning" sub="learns patterns from data" on={lbl("B31")} />
      <RingLabel c={MAP.dl.c} r={MAP.dl.r} title="deep learning" sub="many-layered networks" on={lbl("B32")} />
      <Lens on={lens} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: lbl("B33") }}>
        <line x1={genEdge.x} y1={genEdge.y} x2={genLabel.x} y2={genLabel.y - 6} stroke={C.cyan} strokeWidth={2} opacity={0.6} />
      </svg>
      <div style={{ position: "absolute", left: genLabel.x - 260, top: genLabel.y + 4, width: 520, textAlign: "center", opacity: lbl("B33") }}>
        <Mono size={32} color={C.cyan}>generative ai</Mono>
        <Mono size={27} color={C.muted} style={{ textTransform: "none", letterSpacing: "0", marginTop: 4 }}>systems that generate content</Mono>
      </div>
      <Beat from={at("B33", "many") - 2} to={be("B33") + 10} y={250} text="Many are built using deep learning" size={62} />
      <Beat from={bs("B34")} to={be("B34") + 24} y={250} text="Overlapping terms, one technology" size={66} />
    </>
  );
};

// ------------------------------------------------------------- data, algorithms, computing power

export const ComputeType: React.FC = () => {
  const frame = useCurrentFrame();
  const words: { text: string; word: string; p: V3 }[] = [
    { text: "data", word: "data", p: S(ST.map, -2.2, 2.45, 0) },
    { text: "algorithms", word: "algorithms", p: S(ST.map, 2.35, 1.75, 0) },
  ];
  const gone = at("B37", "gpus") + 4;
  return (
    <>
      <Beat from={bs("B35")} to={be("B35") + 16} y={250} text="Why did capabilities grow so dramatically?" size={66} />
      {words.map((w) => (
        <AtPoint key={w.text} p={w.p} opacity={window01(frame, at("B36", w.word) - 2, gone, 10, 16)}>
          <Mono size={32} color={C.ink}>{w.text}</Mono>
        </AtPoint>
      ))}
      <Beat from={at("B36", "computing") - 2} to={gone + 6} y={1380} text="computing power ↓" kind="mono" size={38} color={C.green} />
      <Beat from={at("B37", "gpus") + 2} to={at("B37", "they") + 2} y={250} text="GPUs" size={110} color={C.ink} />
      <Beat from={at("B37", "they")} to={be("B37") + 10} y={250} text="Many calculations in parallel" size={74} sub="what neural networks need to train and run" subColor={C.green} />
      <Beat from={bs("B38")} to={be("B38") + 30} y={250} text="Chip company → AI tools in medicine" size={60} sub="nvidia" subColor={C.muted} />
    </>
  );
};

// ------------------------------------------------------------- return, caution, end

const CardContent: React.FC<{ k: number }> = ({ k }) => <TaskIcon kind={FINALE_CARDS[k].key} />;

/** The same task objects reappear in the foundation and the finale. */
const TaskIcon: React.FC<{ kind: "rules" | "risk" | "image" | "draft" | "audio" }> = ({ kind: key }) => {
  if (key === "audio") {
    return (
      <svg viewBox="0 0 300 300" width="100%" height="100%">
        {Array.from({ length: 23 }, (_, i) => {
          const h = 20 + 90 * Math.abs(Math.sin(i * 0.9) * Math.sin(i * 0.31 + 1));
          return <line key={i} x1={40 + i * 10} x2={40 + i * 10} y1={150 - h} y2={150 + h} stroke={C.ink} strokeWidth={5} opacity={0.75} />;
        })}
      </svg>
    );
  }
  if (key === "image") return <Img src={staticFile("ai-terms/xray.png")} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />;
  if (key === "risk") {
    return (
      <svg viewBox="0 0 300 300" width="100%" height="100%">
        <line x1={150} y1={40} x2={150} y2={260} stroke={C.muted} strokeWidth={4} />
        <circle cx={150} cy={190} r={22} fill="none" stroke={C.cyan} strokeWidth={8} />
      </svg>
    );
  }
  if (key === "draft") {
    return (
      <div style={{ padding: 26, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...monoLabel(28, C.amber), border: `3px solid ${C.amber}`, alignSelf: "flex-start", padding: "0 10px" }}>DRAFT</div>
        {[0.9, 0.75, 0.85, 0.5].map((w, i) => <div key={i} style={{ height: 12, width: `${w * 100}%`, background: C.ink, opacity: 0.6 }} />)}
      </div>
    );
  }
  return (
    <svg viewBox="0 0 300 300" width="100%" height="100%">
      <path d="M150 40 V100 H80 V150 M150 100 H220 V150 M80 190 V250 M220 190 V250" stroke={C.cyan} strokeWidth={6} fill="none" />
      {[[150, 40], [80, 170], [220, 170], [80, 260], [220, 260]].map(([x, y], i) => <rect key={i} x={x - 34} y={y - 16} width={68} height={32} fill="none" stroke={C.ink} strokeWidth={4} />)}
    </svg>
  );
};

const CARD_LABEL = ["applying knowledge", "predicting a risk", "analyzing an image", "drafting a document"] as const;

export const ReturnType: React.FC = () => {
  const frame = useCurrentFrame();
  const out = finaleCardsOut(frame);
  const tested = (k: number) => smooth((frame - at("B40", "tested") - k * 5) / 10);
  return (
    <>
      {FINALE_CARDS.map((c, k) => {
        const on = finaleCardOn(k, frame) * out;
        return (
          <React.Fragment key={c.key}>
            <OnPlane c={S(ST.finale, c.x, c.y, 0)} w={1.55} h={1.55} pxW={300} opacity={on}>
              <div style={{ position: "absolute", inset: 0, border: `2px solid ${C.ink}`, background: "rgba(11,19,34,0.85)", overflow: "hidden" }}>
                <CardContent k={k} />
              </div>
              <div style={{
                position: "absolute", inset: -18, border: `3px solid ${C.ink}`, opacity: tested(k),
                clipPath: "polygon(0 0, 22% 0, 22% 4%, 4% 4%, 4% 22%, 0 22%, 0 78%, 4% 78%, 4% 96%, 22% 96%, 22% 100%, 78% 100%, 78% 96%, 96% 96%, 96% 78%, 100% 78%, 100% 22%, 96% 22%, 96% 4%, 78% 4%, 78% 0, 100% 0, 100% 100%, 0 100%)",
              }} />
            </OnPlane>
            <AtPoint p={S(ST.finale, c.x, c.y + (c.y > 0 ? 1.12 : -1.12), 0)} opacity={on}>
              <Mono size={24} color={C.ink}>{CARD_LABEL[k]}</Mono>
            </AtPoint>
          </React.Fragment>
        );
      })}
      <Beat from={bs("B40")} to={be("B40") + 16} y={250} text="Test every step for its task" size={74} />
    </>
  );
};

export const CautionType: React.FC = () => {
  const frame = useCurrentFrame();
  const firstHalf = window01(frame, at("B41", "learning") - 2, at("B41", "and") + 6, 12, 14);
  const doc = window01(frame, at("B41", "and") - 4, be("B41") + 34, 18, 20);
  const qs = ["What did it learn?", "What are we asking it to do?", "Is there evidence it can?"];
  const qWords = ["learned", "asking", "evidence"];
  return (
    <>
      <div style={{ position: "absolute", top: 640, width: 1080, display: "flex", flexDirection: "column", alignItems: "center", gap: 70, opacity: firstHalf }}>
        <div style={{ textAlign: "center" }}>
          <Mono size={26} color={C.muted}>trained on</Mono>
          <Serif size={64}>past patient records</Serif>
        </div>
        <svg width={40} height={80}><line x1={20} y1={0} x2={20} y2={80} stroke={C.muted} strokeWidth={3} strokeDasharray="6 6" /></svg>
        <div style={{ textAlign: "center" }}>
          <Mono size={26} color={C.muted}>used on</Mono>
          <Serif size={64}>new patients</Serif>
          <Mono size={24} color={C.ink} style={{ marginTop: 16 }}>needs its own evidence</Mono>
        </div>
      </div>
      {doc > 0.01 ? (
        <div style={{ position: "absolute", inset: 0, opacity: doc }}>
          <DraftDocument mode="caution" />
          <Mono size={24} color={C.cyan} style={{ position: "absolute", top: 262, width: 1080, textAlign: "center" }}>source record</Mono>
        </div>
      ) : null}
      {qs.map((q, i) => (
        <Beat key={q} from={at("B42", qWords[i]) - 4} to={be("B42") + 26} y={560 + i * 170} text={q} size={68} />
      ))}
    </>
  );
};

export const EndType: React.FC = () => {
  const frame = useCurrentFrame();
  const p = patientAt(frame);
  void p;
  return (
    <>
      <Beat from={bs("B43")} to={be("B43") + 26} y={330} text="“AI” is a very broad name." size={86} />
      <Beat from={bs("B44") - 2} to={FILM_DURATION + 30} y={1180} text="Our patients need us to be more specific." kind="serifItalic" size={80} maxWidth={860} />
    </>
  );
};

void SERIF; void atEnd;
