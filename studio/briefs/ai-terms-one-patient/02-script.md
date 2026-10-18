# 02 · Script and timing — "Follow One Patient"

Standalone educational film for doctors; also used inside Episode 2 of "Doctor on the NVIDIA
Certification Journey" (course: NVIDIA "AI for All: From Basics to GenAI Practice").

## Narration lock

- Source of truth: `00-narration-locked.txt` (60 sentences, 678 words). Not edited.
- `vo-plan.json` groups the sentences into 44 contiguous blocks (B01–B44) and sets the
  silence after each block. `scripts/narration.py` refuses to run if any sentence is
  missing, duplicated or out of order.
- Timing master: `src/reels/ai-terms-one-patient/timing.json` (word-level boundaries).
  Every visual beat, caption and sound cue is anchored to a word in this file
  (`at("B12", "compares")`), never to a hard-coded frame. Retiming the voice re-syncs the film.
- Pace: en-US-AndrewNeural (stock neural voice, not modelled on a real person), rate −4%,
  ≈ 145 words/min while speaking. Preroll 0.45 s, tail 5 s.
- **Runtime: 310.8 s (5:11), 9,325 frames at 30 fps.** Derived from the narration; the
  skill's 15–45 s default and CTA rule are overridden by the user's brief (no CTA).

## Sequences (sustained, not one scene per sentence)

Times are block starts from `timing.json`. Emphasis text ≤ 8 words per beat.

| Act | Blocks | Starts | Sequence | Emphasis beats |
|---|---|---|---|---|
| open | B01–B03 | 0.45 s | Four term slabs on separate planes in a dark void; camera arcs until they lock into one stacked structure; amber light found inside; camera follows it into the hospital hall. | the four terms themselves · "all connected" · `PATIENT` |
| ai | B04 | 20.3 s | Hall reveal: suspended glass architecture. Three wings light with the three capabilities. | "AI · the broad field" · `recognize patterns` `interpret language` `apply knowledge` |
| expert | B05–B07 | 31.3 s | Human-authored rule network: orthogonal pathways, IF/THEN gates. Symptom/finding tokens enter, specific paths light, patient arrives at three possibilities. No learning depicted. | "Knowledge people put in" · `CLINICAL EXPERT SYSTEM` · "Experts supply the rules" · "Applied, not learned from records" |
| toml | B08 | 52.2 s | Rules multiply and interweave into a dense tangle, then the tangle's beads re-sort into a field of admission records. | "Too complicated for rules?" |
| ml | B09–B13 | 58.4 s | Records as glass slabs (fields + a solid "known outcome" cell). Glimpses of fictional diagnoses / labs / outcomes. Model core predicts (hollow cyan ring) vs known outcome (solid warm cell); error filaments shrink over repeated passes. | "Will our patient return?" · "Thousands of previous admissions" · "Train a model" · `PREDICT · COMPARE · ADJUST` · "Machine learning: learning patterns from examples" |
| infer | B14–B15 | 93.4 s | Rhythm change: training churn stops, structure settles and dims to stillness. The single amber patient passes through and receives an estimate gauge. | `TRAINING — learning from examples` · `INFERENCE — using the trained model` |
| dl | B16–B21 | 107.9 s | Records fold into a luminous image plane: an illustrative chest radiograph. Pixels lift into depth. Camera flies through connected layers: edges → textures → parts → abstract patterns. Patient light stays beside the plane. | `CHEST X-RAY` · "Millions of pixels" · "Deep learning: many layers" · layer labels · "Features learned from examples" · `images · sound · language` |
| gen | B22–B26 | 154.6 s | Final layer plane morphs into a document surface. Source fragments (cyan mono, cited) feed a composed draft (warm serif). DRAFT stamp. Brief sculptural expansion: image frame, waveform, film strip; return to the document. | "Draft discharge summary" · "Create something" · "Generative AI" · `LARGE LANGUAGE MODELS` · `images · audio · video` |
| found | B27–B28 | 185.4 s | A broad foundation slab rises beneath; several task forms (document, image, waveform, gauge) stand on it, sharing it. | "Foundation model" · "One foundation, many tasks" |
| relate | B29–B34 | 201.3 s | Pull back over the whole hospital; the world we visited reorganizes into nested regions: AI ⊃ ML ⊃ DL. Generative AI is a separate region overlapping DL and reaching beyond it (an application that creates content, not a stage). Miniatures re-seat: rules in AI, records in ML, layers in DL, document in the GenAI lens. | ring labels · "Many built with deep learning" · "They overlap" |
| compute | B35–B38 | 233.3 s | Records (data), layer stack (algorithms) and a third, unseen element converge; camera drops through the glass floor into the computational foundation. Green appears. Thousands of cores light in coordinated parallel waves. No numbers. | "Why did it grow?" · `DATA · ALGORITHMS · COMPUTE` · "GPU: many calculations in parallel" · "Chip company → AI tools in medicine" |
| return | B39 | 263.0 s | Rise back into the hospital. Four transformed objects ring the patient: rule path, risk gauge, radiograph, draft. Each lights on its phrase. | `applying knowledge` `predicting a risk` `analyzing an image` `drafting a document` |
| caution | B40–B42 | 272.2 s | Calm side-by-side: generated output vs source record; threads link matched sentences, one sentence has no thread and is marked "check". Neutral colours, no red. | "Test each step for its task" · `OUTPUT` / `SOURCE RECORD` · "What did it learn?" "What are we asking?" "Is there evidence?" |
| end | B43–B44 | 299.0 s | Everything recedes. Only the amber light remains. Final line lands in stillness; hold ~5 s. | "“AI” is a very broad name." · "Our patients need us to be more specific." |

## Fidelity guards

- Expert system: rules are fixed and authored; nothing trains.
- Prediction (hollow cyan ring) is always visually distinct from known outcome (solid warm cell).
- Deep learning layers are tagged `CONCEPTUAL ILLUSTRATION`; no heatmap, no region labelled as a diagnosis.
- Draft document visibly carries `DRAFT`.
- GenAI is not drawn as nested inside DL and not as a fourth "stage".
- GPU: no performance numbers, NVIDIA appears only as small type.
