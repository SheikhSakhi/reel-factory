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
| `DrawIcon` | any of 2,000+ lucide line icons (`import { HeartPulse } from "lucide"`), drawn stroke by stroke |
| `DrawPath` | custom line art from an SVG path (car profile, organ outline, chart line, ECG); `glow`, `fill` |
| `SketchCircle`, `SketchUnderline`, `SketchArrow`, `Highlight` | hand-drawn marker annotations |
| `PathMotion` + `PathTrail` | move an element along a path (a jump, a flow) with a dotted trail |
| `BarChart` | bars that grow on their own words, with values |
| `PaperCard` | menu / list / plan / prescription with rows appearing and marked on cue |
| `ImageCard` | a photo or screenshot from `public/assets/<slug>/` |
| `Multiply` | one element copied into a grid, spreading from the centre ("everyone saw it") |
| `Stamp`, `Tick`, `Label`, `Appear` | emphasis, checks, text and generic entrances |

## Rules

- **One idea per panel, built in 2-4 beats**, each on a spoken word. Something new appears every 1-2 s; nothing appears before its word.
- **Layout**: in `split`, keep content inside y 120-820 (captions at ≈890, the speaker below 960). In `panel`, keep content inside y 150-1300 (captions at ≈1420, platform UI below 1500). Keep x within 60-1020.
- **Colours**: the panel uses the brand's dark theme (`theme`); annotations in a warm marker yellow (`#F3C64B`) read well on it. Max 3 colours per panel.
- **Line art**: prefer lucide icons; draw custom paths only for the hero object, and keep them simple (a clean profile beats a detailed one). Check every custom path in a still.
- **Truth**: numbers, prices and claims on a panel come from the speaker's words, the user or verified research. Logos, product photos and people's photos only from the user (`public/assets/<slug>/`).
- **Cyrillic and other scripts**: the brand fonts must include the script (`npm run fonts -- ... --subsets latin,cyrillic`); check a still for fallback fonts.
- **Resolution**: everything is vector; `--4k` renders 2160x3840 for YouTube or archives. Instagram plays at 1080x1920, so the default is enough there.
