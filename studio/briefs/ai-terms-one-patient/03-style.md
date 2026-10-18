# 03 · Art direction — "Glass Hospital, One Amber Light"

**Concept:** a sculptural hospital suspended in darkness, seen from inside an intelligent
machine. Translucent architecture, optical glass, brushed metal, luminous data. One warm
amber light (the patient) travels the whole film; everything around it transforms.

No earlier `03-style.md` exists in `briefs/`, so there is nothing to collide with; this look
also deliberately avoids the demo reel's paper/orange palette and Space Grotesk.

## Theme

```ts
const THEME: Theme = {
  name: "glass-hospital",
  bg: "#04060B",        // void
  fg: "#F3EEE4",        // warm white type      (contrast on bg ≈ 17.8:1)
  muted: "#8B93A3",     // labels, secondary    (≈ 6.6:1)
  accent: "#FFB347",    // patient amber, used sparingly
  surface: "#0B1322",   // deep midnight
  fontDisplay: "Fraunces", fontBody: "Fraunces", fontMono: "IBM Plex Mono",
  texture: "none",
};
// Extended palette
const CYAN = "#6FE3F2";   // data, model output, predictions
const GREEN = "#7FD957";  // compute only; first appears in the GPU act
const METAL = "#9AA3AE";  // brushed structure
```

## Typography

- **Fraunces** (editorial serif with optical sizing): display beats, 300 for scale, 600 for
  emphasis, italic for the human voice ("Our patients need us to be more specific").
- **IBM Plex Mono** 400/500: labels, record fields, system states, all caps with +0.14em tracking.
- Type is placed in space where possible (projected onto 3D planes with a CSS homography) so it
  shares the camera's perspective; screen-space beats are reserved for the essential words.
- Max 8 words per beat, max 2 lines. Key text inside x 80–1000, y 250–1500.

## Material and light

- Architecture: hairline edges (warm white 8–14% opacity) on near-invisible glass panes.
- Data: cyan emissive beads/slabs; known outcomes are solid warm-white cells; predictions are
  hollow cyan rings (shape and colour both encode the difference).
- Patient: amber core + soft halo + a real point light that tints nearby glass.
- Fog to the void gives depth; no random particles. Every bead belongs to a formation.

## Motion language

- One continuous world, one camera. Cuts are replaced by travel and morphs: rules → tangle →
  records → pixels → layers → document → foundation → nested map → compute grid → return.
- Easing: slow cinematic ease-in-out (cubic bezier .65,0,.35,1) for camera; ease-out for
  arrivals; per-element stagger for morphs so they read as a process, not a dissolve.
- Holds at every concept anchor (camera nearly still ≥ 1.5 s) so viewers can read.
- Training = rhythmic, repetitive pulses; inference = one smooth pass in stillness.

## Per-act composition

See `02-script.md`. Camera framing per act is defined in `src/reels/ai-terms-one-patient/camera.ts`.
