# Formats lab

The daily run tests a different format and style each time, faceless and without the user's voice, until the user's ratings show winners. The editor-in-chief picks the format here; the learner updates the scores. Built from `references.md`.

## Rotation rule

1. Never the same format twice in a row; never the same visual style as the last run.
2. While fewer than 2 formats have 3+ ratings: explore. Pick the untested or least-tested format.
3. After that: 60% the best-rated format (mean rating), 40% the others, so new ideas still get tried.
4. A format rated 4 or lower twice in a row is paused; one rated 8+ gets a variation next time (same format, new style or topic angle).
5. Each run states in the delivery which format and style it tested, so the rating is clear.

## Formats

| ID | Format | From reference | Picture (all code) | Sound | Status |
|---|---|---|---|---|---|
| F1 | **Mascot sitcom**: a recurring mascot and a human-ish sidekick in a short scene; the lesson comes out of a mistake | Klod series | 3D mascot (three.js) in a simple lit set, prop card, laptop screen | 2 voices dialogue | testing (pilot ep01) |
| F2 | **Faceless parable**: a situation, a dialogue, one reframing line, a resolution; one metaphor object | Garib | flat illustrated scenes (SVG people with blank faces), film camera grammar via parallax and cuts | narrator + 1-2 voices | untested |
| F3 | **B-roll story**: one continuous first-person narration, a new picture every 1-2 s, screens as proof, a pattern break every 5-8 s | farza, Adema | kinetic typography, UI screens built in code, charts, icons, stock clips if a Pexels key exists | 1 narrator | untested |
| F4 | **Chat drama**: a patient-doctor (or doctor-AI) conversation played out on a phone screen; the twist is in the last message | dialogue refs | phone UI in code, typing dots, reactions, a final reveal card | message sounds + optional narrator | testing |
| F5 | **Drawn explainer**: the split-screen panel style without the speaker, full-screen drawing on the words | DerkrLKITbV (earlier ref) | panels drawn in code | 1 narrator | untested |

## Recurring cast (keeps the series recognisable)

- **Doc**: the DocX mascot. A soft teal rounded cube (brand colours), two pill-shaped eyes, no mouth; it blinks, tilts, hops. Calm, precise, sometimes too literal. Used in F1, can cameo in F3-F5.
- **The doctor**: faceless, white coat, overloaded; the guest with the problem in F1 and F2.
- **The patient**: faceless, the one who falls through the cracks between visits.

Names and looks can change after feedback; keep them stable once something wins.

## Scores

| Format | Runs | Ratings | Mean | Notes |
|---|---|---|---|---|
| F1 | 1 | | | ep01-forgotten-plan: 3D toy diorama, `kit/Cast3D.tsx` |
| F2 | 0 | | | |
| F3 | 0 | | | |
| F4 | 1 | | | 2026-10-26-midnight-question: night mode, split-screen twist, 1 narrator |
| F5 | 0 | | | |
