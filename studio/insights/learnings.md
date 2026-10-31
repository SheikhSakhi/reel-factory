# Learnings

Rules learned from ratings and real results. Every run reads this first. Maintained by the reel-learner agent.

## Do more
- Narration with a clear arc: a hook in a concrete moment, a plain explanation, then a reward (the insight lands as the ending). Calm, explanatory tone, like a colleague, not a presenter (evidence: scribe-evening liked for "clear narration, hook, explanation and reward"; midnight-question liked for describing the problem right, 2026-10-30)
- Describe the problem precisely from the doctor's or patient's side before any solution (midnight-question, scribe-evening)

## Do less
- Visual essays (F6): repeating one 3D scene (the same hospital 4 times) and blocky 3D (stretched window textures, flat shading); pretty-but-unrelated backgrounds (space imagery behind "day 3"). Every shot must literally show what the line says; a 3D scene appears at most once and only when real footage can't show it (who-comes-back pilot, user feedback 2026-10-31)
- Ad tone: slogans, a product name or tagline as the ending ("DOCX · ...", "A plan is."), selling instead of explaining (monitor-not-plan disliked: "like an advertisement", 2026-10-30)

## User preferences
- Character episodes (F1): no generic sound effects; a soft ambient music bed (scripts/ambient.py) that dips under the voices, plus room tone. Calm voices: slower (about -6 to -9%), lower pitch, longer pauses between lines. Soft visuals: smooth rounded clay characters (kit/SoftWorld.tsx), a bright daylight space, soft cinematic light (window rays, haze, gentle glow, light grain) rather than dark and moody (2026-10-30, reference: the VoiceStudio explainer reel)
- No CTA by default. "Better no CTA than a bad CTA": no product tag, no "follow for more", no keyword unless a real lead magnet exists and the user asked for it; end on the insight (2026-10-30)
- The synthetic voice is the weakest part of every reel so far (edge-tts judged poor on midnight-question, forgotten-plan, monitor-not-plan); a better voice is the top fix (2026-10-30)
- Editing own footage, B-roll style: don't decorate the talking head (no panels over plain lines); put the effort into the creator's own animations and B-roll: sound design on every visual beat, camera push/shake/bloom on impacts, no captions or progress bar over their type (user feedback on nvidia-journey-s1e2, 2026-10-26)
- Fully automatic runs, faceless, no user voice; the user may ask for a re-make with their own voice after seeing a reel (2026-10-24)
- Test a different format and style every run and surprise the user; they will say what wins (2026-10-24, formats-lab.md)
- Liked references: B-roll live stories, character dialogue series (Klod), faceless parables (Garib) (references.md)
- Explainer style also liked: panel drawn in code, navy blueprint look, calm white captions (2026-10)
- Never publish without explicit approval; education only, no individual medical advice

## Open questions
- 3D toy diorama (F1) animation judged poor, but the dialogue was good: keep dialogue writing, rethink the picture before the next F1 (one data point)
