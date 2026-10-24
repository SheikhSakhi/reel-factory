import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, type CalculateMetadataFunction } from "remotion";
import type { Brand } from "./brand";
import { captionProps } from "./brand";
import { Captions } from "./Captions";
import { CtaCard } from "./CtaCard";
import { Arrow, Burst, Callout, Flash, LowerThird, PictureCard, ProgressLine, Slam, StatPop } from "./Fx";
import { PopCaptions } from "./PopCaptions";
import { ProofShot } from "./Proof";
import { SfxTrack, type SfxCue } from "./Sfx";
import { PanelContext, type Panels } from "./PanelKit";
import { TalkingHead, loadEdit, type Edit, type FootageBox, type Punch } from "./TalkingHead";
import { EASE_IN_OUT } from "./motion";
import { REEL } from "./theme";
import { loadTake, scene, wordFrame, type VoTake } from "./voiceover";

/**
 * A finished edit of the user's own footage:
 *   public/edit/<slug>/edit.json + take.json   (from scripts/edit.py apply)
 *   public/edit/<slug>/plan.json               (layout per scene, captions, zooms, overlays, CTA)
 *   src/edits/<slug>/Panels.tsx (optional)     (explainer animation drawn in code, one component per scene)
 * Layouts: "full" (speaker full frame), "split" (panel on top, speaker below), "panel" (panel full
 * screen, the voice continues). Changes are plan.json edits; panels are the only per-video code.
 *
 * `at` in the plan is a moment on the EDITED timeline:
 *   "S2:three"    the first time "three" is spoken in scene S2 ("S2:three#1" = the second time)
 *   "S2:start" / "S2:end"   a scene's first frame / the end of its speech
 *   "12.5s"       seconds;   240   a frame number
 */
export type At = string | number;

export type Overlay =
  | { type: "callout"; at: At; hold?: number; kicker?: string; text: string; side?: "left" | "right"; y?: number }
  | { type: "slam"; at: At; hold?: number; text: string; y?: number }
  | { type: "lowerThird"; at: At; hold?: number; name: string; title?: string }
  | { type: "stat"; at: At; hold?: number; to: number; from?: number; prefix?: string; suffix?: string; label: string; source: string }
  | { type: "arrow"; at: At; hold?: number; x: number; y: number; from?: "left" | "right" | "top"; label?: string }
  | { type: "image"; at: At; hold?: number; src: string; device?: "phone" | "browser" | "card"; caption?: string; url?: string }
  | { type: "flash"; at: At }
  | { type: "burst"; at: At; x?: number; y?: number }
  | { type: "cta"; at: At; keyword: string; promise: string; verb?: string; lead?: string };

export type Layout = "full" | "split" | "panel";

export type Plan = {
  /** Layout per scene id; scenes not listed use `default` (default "full"). */
  readonly layout?: {
    readonly default?: Layout; readonly scenes?: Readonly<Record<string, Layout>>; readonly split?: number;
    /** "cut" (default): layouts switch on the cut and a new panel fades up from black. "slide": the footage slides. */
    readonly transition?: "cut" | "slide";
  };
  /** Colours for panels, overriding the brand's dark theme, e.g. a navy blueprint look. */
  readonly panelTheme?: { readonly bg?: string; readonly fg?: string; readonly muted?: string; readonly accent?: string; readonly surface?: string };
  readonly captions?: {
    readonly style?: "pop" | "band" | "pill" | "none";
    readonly scenes?: readonly string[];
    readonly emphasis?: readonly string[];
    readonly keepTogether?: readonly string[];
    /** false: no accent on the spoken word (plain white phrases, like most explainers). */
    readonly highlight?: boolean;
  };
  readonly zooms?: readonly { at: At; scale?: number; hold?: number }[];
  readonly overlays?: readonly Overlay[];
  readonly progress?: boolean;
  readonly sfx?: boolean;
  /** Frame (or "S1:word") for the grid cover. */
  readonly cover?: At;
};

export type EditedReelProps = {
  readonly slug: string;
  /** Explainer panels for this slug (from src/edits/registry.ts; Root passes them). */
  readonly panels?: Panels;
  readonly edit?: Edit;
  readonly take?: VoTake;
  readonly plan?: Plan;
  readonly missing?: string;
};

const DEFAULT_HOLD: Record<Overlay["type"], number> = {
  callout: 75, slam: 30, lowerThird: 100, stat: 80, arrow: 60, image: 90, flash: 8, burst: 24, cta: 150,
};

const SFX: Partial<Record<Overlay["type"], SfxCue["sound"]>> = {
  callout: "whoosh", slam: "thud", lowerThird: "click", stat: "pop", image: "whoosh", flash: "whoosh", burst: "pop", cta: "ding",
};

/** Resolves a plan moment to an absolute frame on the edited timeline. */
export const resolveAt = (take: VoTake, at: At): number => {
  if (typeof at === "number") return Math.max(0, Math.round(at));
  const seconds = at.match(/^(\d+(?:\.\d+)?)s$/);
  if (seconds) return Math.round(parseFloat(seconds[1]) * REEL.fps);
  const m = at.match(/^(S\d+):(.+?)(?:#(\d+))?$/);
  if (!m) throw new Error(`plan.json: cannot read moment "${at}" (use "S2:word", "S2:start", "12.5s" or a frame)`);
  const [, sceneId, word, nth] = m;
  if (word === "start") return scene(take, sceneId).from;
  if (word === "end") return scene(take, sceneId).speechEnd;
  return wordFrame(take, sceneId, word, nth ? parseInt(nth, 10) : 0);
};

/** Validates plan.json enough to fail with a clear message instead of a blank render. */
export const loadPlan = (raw: unknown, take: VoTake): Plan => {
  if (typeof raw !== "object" || raw === null) throw new Error("plan.json: not an object");
  const plan = raw as Plan;
  (plan.overlays ?? []).forEach((o, i) => {
    if (!(o.type in DEFAULT_HOLD)) throw new Error(`plan.json overlay ${i}: unknown type "${String(o.type)}"`);
    resolveAt(take, o.at);
  });
  (plan.zooms ?? []).forEach((z) => resolveAt(take, z.at));
  return plan;
};

const fetchJson = async (path: string): Promise<unknown> => {
  const res = await fetch(staticFile(path));
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
};

/** Loads the edit's files before rendering and sets the composition's duration from them. */
export const calculateEditMetadata: CalculateMetadataFunction<EditedReelProps> = async ({ props }) => {
  try {
    const [editRaw, takeRaw, planRaw] = await Promise.all([
      fetchJson(`edit/${props.slug}/edit.json`), fetchJson(`edit/${props.slug}/take.json`),
      fetchJson(`edit/${props.slug}/plan.json`).catch(() => ({})),
    ]);
    const take = loadTake(takeRaw);
    const edit = loadEdit(editRaw);
    const plan = loadPlan(planRaw, take);
    return { durationInFrames: take.totalFrames, props: { ...props, edit, take, plan, missing: undefined } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("plan.json")) throw error;
    return { durationInFrames: REEL.fps, props: { ...props, missing: message } };
  }
};

const OverlayView: React.FC<{ o: Overlay; brand: Brand; hold: number }> = ({ o, brand, hold }) => {
  const th = brand.theme;
  switch (o.type) {
    case "callout": return <Callout theme={th} hold={hold} kicker={o.kicker} text={o.text} side={o.side} y={o.y} />;
    case "slam": return <Slam theme={th} hold={hold} text={o.text} y={o.y} />;
    case "lowerThird": return <LowerThird theme={th} hold={hold} name={o.name} title={o.title} />;
    case "stat": return <StatPop theme={th} hold={hold} to={o.to} from={o.from} prefix={o.prefix} suffix={o.suffix} label={o.label} source={o.source} />;
    case "arrow": return <Arrow theme={th} hold={hold} x={o.x} y={o.y} from={o.from} label={o.label} />;
    case "flash": return <Flash hold={hold} />;
    case "burst": return <Burst theme={th} hold={hold} x={o.x} y={o.y} />;
    case "image":
      return o.device === "card" || !o.device
        ? <PictureCard theme={th} hold={hold}><ProofShot theme={th} src={o.src} device="none" width={748} aspect={4 / 3} zoomTo={1.05} /></PictureCard>
        : <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 300 }}>
            <ProofShot theme={th} src={o.src} device={o.device} url={o.url} caption={o.caption} width={o.device === "phone" ? 420 : 900} />
          </AbsoluteFill>;
    case "cta":
      return (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.45)", paddingBottom: 260 }}>
          <div style={{ padding: "50px 40px", borderRadius: 44, background: `${th.bg}F0`, boxShadow: "0 40px 90px rgba(0,0,0,0.4)" }}>
            <CtaCard theme={th} keyword={o.keyword} promise={o.promise} verb={o.verb} lead={o.lead} handle={brand.handle} tapAt={20} />
          </div>
        </AbsoluteFill>
      );
  }
};

/** Renders footage + plan. `brand` comes from src/brand/brand.ts (see Root.tsx). */
const LAYOUT_EASE = 10;

const footageBox = (layout: Layout, split: number): FootageBox =>
  layout === "full" ? { top: 0, height: REEL.height } : layout === "split" ? { top: split, height: REEL.height - split } : { top: REEL.height, height: 0 };

/** Layout of the scene playing at a frame, and how far the switch from the previous scene's layout has got (0-1). */
const layoutAt = (take: VoTake, plan: Plan, frame: number): { cur: Layout; prev: Layout; t: number } => {
  const def = plan.layout?.default ?? "full";
  const of = (id: string): Layout => plan.layout?.scenes?.[id] ?? def;
  const i = Math.max(0, take.scenes.findIndex((s) => frame >= s.from && frame < s.to));
  const s = take.scenes[i];
  const prev = i > 0 ? of(take.scenes[i - 1].id) : of(s.id);
  const ease = plan.layout?.transition === "slide" ? LAYOUT_EASE : 0;
  const t = ease === 0 ? 1 : interpolate(frame, [s.from, s.from + ease], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT });
  return { cur: of(s.id), prev, t };
};

/** A panel fades up from black over its first frames, like a cut to a new screen. */
const PanelFade: React.FC<{ height: number; children: React.ReactNode }> = ({ height, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ height, overflow: "hidden", opacity: interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
};

const mix = (a: FootageBox, b: FootageBox, t: number): FootageBox => ({ top: a.top + (b.top - a.top) * t, height: a.height + (b.height - a.height) * t });

export const EditedReel: React.FC<EditedReelProps & { brand: Brand }> = ({ slug, edit, take, plan = {}, missing, brand, panels = {} }) => {
  if (missing || !edit || !take) {
    return (
      <AbsoluteFill style={{ background: "#111", color: "#eee", padding: 80, justifyContent: "center", fontFamily: "sans-serif", fontSize: 40 }}>
        {`No edit for "${slug}" yet: run python3 scripts/edit.py prep <video> ${slug}, then apply. (${missing ?? "missing data"})`}
      </AbsoluteFill>
    );
  }
  const overlays = plan.overlays ?? [];
  const punches: Punch[] = (plan.zooms ?? []).map((z) => ({ frame: resolveAt(take, z.at), scale: z.scale ?? 1.25, hold: z.hold ?? 20 }));
  const cues: SfxCue[] = plan.sfx === false ? [] : overlays.flatMap((o) => {
    const sound = SFX[o.type];
    return sound ? [{ at: resolveAt(take, o.at), sound, volume: o.type === "slam" ? 0.4 : 0.25 }] : [];
  });
  const style = plan.captions?.style ?? "pop";
  const ctaAt = overlays.filter((o) => o.type === "cta").map((o) => resolveAt(take, o.at))[0];
  const lastFrame = take.totalFrames;
  const split = plan.layout?.split ?? 960;
  const box = (frame: number): FootageBox => {
    const { cur, prev, t } = layoutAt(take, plan, frame);
    return mix(footageBox(prev, split), footageBox(cur, split), t);
  };
  // Captions sit at the seam in a split, low in full frame, and lower still over a full panel (its content owns the middle).
  const captionY = (frame: number): number => {
    const b = box(frame);
    if (b.height > 0 && b.top > 0) return b.top - 70;
    return b.height === 0 ? 1420 : 1250;
  };
  const panelTheme = { ...brand.alt, ...plan.panelTheme };
  const slide = plan.layout?.transition === "slide";
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {take.scenes.map((s) => {
        const Panel = panels[s.id];
        const layout = plan.layout?.scenes?.[s.id] ?? plan.layout?.default ?? "full";
        if (!Panel || layout === "full") return null;
        const height = layout === "split" ? split : REEL.height;
        return (
          // Stays a few frames into the next scene so the footage can slide over it instead of revealing black.
          <Sequence key={`panel-${s.id}`} from={s.from} durationInFrames={Math.min(s.to + (slide ? LAYOUT_EASE : 0), lastFrame) - s.from} name={`panel ${s.id}`}>
            <PanelContext.Provider value={{ take, from: s.from, width: REEL.width, height, theme: panelTheme }}>
              <PanelFade height={height}>
                <Panel />
              </PanelFade>
            </PanelContext.Provider>
          </Sequence>
        );
      })}
      <TalkingHead edit={edit} punches={punches} box={box} faceY={0.42} />
      {overlays.map((o, i) => {
        const from = resolveAt(take, o.at);
        const hold = Math.min("hold" in o && o.hold ? o.hold : DEFAULT_HOLD[o.type], Math.max(1, lastFrame - from));
        return (
          <Sequence key={`${o.type}-${i}`} from={from} durationInFrames={o.type === "cta" ? lastFrame - from : hold} name={`${o.type} ${i + 1}`}>
            <OverlayView o={o} brand={brand} hold={o.type === "cta" ? lastFrame - from : hold} />
          </Sequence>
        );
      })}
      {style === "pop" || style === "band" ? (
        <PopCaptions take={take} font={brand.theme.fontBody} scenes={plan.captions?.scenes}
          emphasis={plan.captions?.emphasis} until={ctaAt} variant={style} yAt={captionY}
          accent={plan.captions?.highlight === false ? "#FFFFFF" : brand.theme.accent} />
      ) : null}
      {style === "pill" ? (
        <Captions take={take} scenes={plan.captions?.scenes} keepTogether={plan.captions?.keepTogether} {...captionProps(brand)} />
      ) : null}
      {plan.progress ? <ProgressLine theme={brand.theme} total={lastFrame} /> : null}
      <SfxTrack cues={cues} />
    </AbsoluteFill>
  );
};
