# Explainer panels (drawn in code)

The split-screen explainer style: the speaker below, and above them a panel where things are **drawn on the exact words they say**. Line art draws itself, labels and prices appear on cue, bars grow, hand-drawn circles and arrows mark what matters, lists get highlighted, objects fly along paths. Reference implementation: `src/edits/docx-split/Panels.tsx` (plan: `public/edit/docx-split/plan.json`).

## When to use it

Ideas with a mechanism, numbers, a comparison or a story with objects (pricing, how a product works, before/after, a process). Pure opinion or a personal story is better as `full` with widgets.

## How it fits together

1. `plan.json` → `"layout": { "default": "split", "scenes": { "S2": "panel", "S6": "full" } }`
   - `split`: panel on the top half (1080x960), speaker on the bottom half. Captions sit on the seam.
   - `panel`: panel full screen (1080x1920), speaker hidden, voice continues. Use for the 1-2 biggest visual moments.
   - `full`: speaker full frame (hook moments, emotional lines, the CTA).
   - Switches animate over 10 frames. `"split": 960` changes the seam.
   - Captions: `"style": "band"` (calm explainer captions) fits this format best.
2. `src/edits/<slug>/Panels.tsx` exports `panels: Panels`: one component per scene id that uses `split` or `panel`.
3. Register it in `src/edits/registry.ts` (one import, one line).
4. QA: `python3 scripts/edit_render.py <slug> --qa <frames>` → read the contact sheet → fix → render.

## Motion grammar (from a frame-by-frame teardown of a top explainer)

Watch references at 10 fps, not 1 fps: the craft is in the motion. What makes this style read as "made by a designer":

1. **Hard cuts** between speaker and panel; a new panel fades up from black in ~0.3 s (`"transition": "cut"`, the default).
2. **Ghosts first**: the whole drawing (or all list items, all cars, all people) sits at ~15% opacity; the spoken word brings one element alive.
3. **Pen, then fill, then glow**: line art draws left to right in ~0.7 s, then fills with a soft gradient and glows (`DrawArt`).
4. **Labels before or with the drawing**: a coloured serif name on the left, a muted italic note on the right, on the same baseline.
5. **Staged reveals**: bars grow one after another and their values appear after the growth; list rows appear, then get marked.
6. **Zoom-out multiplication** for scale ("everyone saw it", "thousands of patients"): a few big copies, then they shrink away as many small ones pop up in random order (`Multiply order="random"`).
7. **Physical motion**: objects travel along a path with a dotted trail drawn just ahead, and can roll mid-air (`PathMotion spin`).
8. **Reveals with props**: a card slides out of an envelope, a seal or stamp thumps on with overshoot.
9. **Calm captions**: 2-4 plain white words on the seam (`"captions": { "style": "band", "highlight": false }`).
10. **Palette**: deep navy, a blue light leak from the top-left corner, one blue accent, gold for hand-drawn marks, cream paper for cards: `"panelTheme": { "bg": "#0B1120", "fg": "#E6EAF4", "muted": "#7D88A3", "accent": "#5B8CFF", "surface": "#1A2338" }` (or the brand's own dark theme).

## Pictures into line art

`python3 scripts/lineart.py <image> public/assets/<slug>/<name>.json --mode outline --preview out/<name>.png` turns a picture into strokes for `<DrawArt art={...}>` (import the JSON). Best from a transparent PNG cut-out or a product shot on a plain background; busy photos trace poorly (cut the object out first). Check the preview before using it. Only trace pictures the user owns or that are public domain / openly licensed.

## Writing a panel

```tsx
const S2: React.FC = () => {
  const { theme, height } = usePanel();          // dark brand theme; height 960 (split) or 1920 (panel)
  const price = usePanelAt("S2:тысяч");          // spoken word -> local frame
  return (
    <PanelBackdrop>                              {/* dark grid + soft glow, like an explainer screen */}
      <DrawPath d={CAR} viewBox="0 0 600 200" width={600} height={200} color={theme.fg} at={0} duration={30} glow />
      <Label text="бронь 50 000 $" at={price} size={48} color={theme.accent} style={{ position: "absolute", right: 80, top: 120 }} />
      <SketchCircle x={640} y={110} w={340} h={70} color="#F3C64B" at={price + 12} />
    </PanelBackdrop>
  );
};
```

Toolkit (`src/kit/Draw.tsx`, `src/kit/PanelKit.tsx`):

| Primitive | Use |
|---|---|
| `DrawArt` | traced or hand-made line art: ghost, left-to-right pen sweep, gradient fill, glow |
| `DrawIcon` | any of 2,000+ lucide line icons (`import { HeartPulse } from "lucide"`), drawn stroke by stroke |
| `DrawPath` | custom line art from an SVG path (car profile, organ outline, chart line, ECG); `glow`, `fill` |
| `SketchCircle`, `SketchUnderline`, `SketchArrow`, `Highlight` | hand-drawn marker annotations |
| `PathMotion` + `PathTrail` | move an element along a path (a jump, a flow) with a dotted trail; `spin` for a roll |
| `BarChart` | bars that grow on their own words, with values; `unknown` for a "?" bar that shoots off the top |
| `PaperCard` | menu / list / plan / prescription with rows appearing and marked on cue |
| `ImageCard` | a photo or screenshot from `public/assets/<slug>/` |
| `Multiply` | one element copied into a grid, from the centre or in random order (`order="random"`) |
| `Stamp`, `Tick`, `Label`, `Appear` | emphasis, checks, text and generic entrances |

## Rules

- **One idea per panel, built in 2-4 beats**, each on a spoken word. Something new appears every 1-2 s; nothing appears before its word.
- **Layout**: in `split`, keep content inside y 120-820 (captions at ≈890, the speaker below 960). In `panel`, keep content inside y 150-1300 (captions at ≈1420, platform UI below 1500). Keep x within 60-1020.
- **Colours**: the panel uses the brand's dark theme (`theme`); annotations in a warm marker yellow (`#F3C64B`) read well on it. Max 3 colours per panel.
- **Line art**: prefer lucide icons; draw custom paths only for the hero object, and keep them simple (a clean profile beats a detailed one). Check every custom path in a still.
- **Truth**: numbers, prices and claims on a panel come from the speaker's words, the user or verified research. Logos, product photos and people's photos only from the user (`public/assets/<slug>/`).
- **Cyrillic and other scripts**: the brand fonts must include the script (`npm run fonts -- ... --subsets latin,cyrillic`); check a still for fallback fonts.
- **Resolution**: everything is vector; `--4k` renders 2160x3840 for YouTube or archives. Instagram plays at 1080x1920, so the default is enough there.
