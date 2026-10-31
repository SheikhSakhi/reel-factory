# Formats lab

The daily run tests a different format and style each time, faceless and without the user's voice, until the user's ratings show winners. The editor-in-chief picks the format here; the learner updates the scores. Built from `references.md`.

## Rotation rule

1. Never the same format twice in a row; never the same visual style as the last run.
2. While fewer than 2 formats have 3+ ratings: explore. Pick the untested or least-tested format.
3. After that: 60% the best-rated format (mean rating), 40% the others, so new ideas still get tried.
4. A format rated 4 or lower twice in a row is paused; one rated 8+ gets a variation next time (same format, new style or topic angle).
5. Each run states in the delivery which format and style it tested, so the rating is clear.
6. The user rates in words ("liked", "best", "disliked"), not always 1-10: record the words, and score them ++ / + / − for the rotation.

## Formats

| ID | Format | From reference | Picture (all code) | Sound | Status |
|---|---|---|---|---|---|
| F1 | **Mascot sitcom**: a recurring mascot and a human-ish sidekick in a short scene; the lesson comes out of a mistake | Klod series + user's VoiceStudio reference | soft clay 3D (kit/SoftWorld.tsx) in a bright clinic, split layout with a light UI card on top, soft cinematic grade | 2 calm voices + ambient music bed, no sound effects | testing (v3 ep02-soft) |
| F2 | **Faceless parable**: a situation, a dialogue, one reframing line, a resolution; one metaphor object | Garib | flat illustrated scenes (SVG people with blank faces), film camera grammar via parallax and cuts | narrator + 1-2 voices | untested |
| F3 | **B-roll story**: one continuous first-person narration, a new picture every 1-2 s, screens as proof, a pattern break every 5-8 s | farza, Adema | kinetic typography, UI screens built in code, charts, icons, stock clips if a Pexels key exists | 1 narrator | leading |
| F4 | **Chat drama**: a patient-doctor (or doctor-AI) conversation played out on a phone screen; the twist is in the last message | dialogue refs | phone UI in code, typing dots, reactions, a final reveal card | message sounds + optional narrator | testing |
| F6 | **Visual essay**: a calm documentary narrator; real open-licence footage (satellite, aerial, medical imagery) with data drawn onto it, 3D scenes in between; claim → mechanism → proof → escalation → name it → moral question → callback | The Plain Read (references.md §5) | open imagery + Remotion overlays (counters, boxes, glows, stamps) + three.js (globe, night hospital, floating screens), slow push-ins everywhere | 1 calm narrator + ambient bed | untested (user liked) |
| F5 | **Drawn explainer**: the split-screen panel style without the speaker, full-screen drawing on the words | DerkrLKITbV (earlier ref) | panels drawn in code | 1 narrator | testing |

## Recurring cast (keeps the series recognisable)

- **Doc** (v3): a smooth cream robot head with a teal visor (coral while something is wrong), soft glowing eyes, ear discs, a small antenna. Calm, precise, sometimes too literal. Voice: Brian, slow and low.
- **Dr. Mira** (v3): teal scrubs, glasses, hair in a bun, ID badge; overloaded but kind. Voice: Emma, calm.
- **The patient**: faceless, the one who falls through the cracks between visits.

Names and looks can change after feedback; keep them stable once something wins.

## Scores

| Format | Runs | Ratings | Mean | Notes |
|---|---|---|---|---|
| F1 | 2 | liked | + | ep01: dialogue good; voice and 3D animation poor. ep02: v2 look (low-poly, cinematic grade, split UI card, kit/LowPoly.tsx + kit/CinemaGrade.tsx) |
| F2 | 0 | | | |
| F3 | 1 | liked, best | ++ | scribe-evening: clear narration arc (hook, explanation, reward) |
| F4 | 1 | liked | + | midnight-question: problem framed right; voice not good |
| F6 | 0 | | | |
| F5 | 1 | disliked | − | monitor-not-plan: ad tone and CTA, not the drawings, were the problem; retry once with the F3 narration rules before pausing |
