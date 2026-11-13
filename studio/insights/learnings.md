# Learnings

Rules learned from ratings and real results. Every run reads this first. Maintained by the reel-learner agent.

## Do more
- Narration with a clear arc: a hook in a concrete moment, a plain explanation, then a reward (the insight lands as the ending). Calm, explanatory tone, like a colleague, not a presenter (evidence: scribe-evening liked for "clear narration, hook, explanation and reward"; midnight-question liked for describing the problem right, 2026-10-30)
- Describe the problem precisely from the doctor's or patient's side before any solution (midnight-question, scribe-evening)

## Do less
- Visual essays (F6): repeating one 3D scene (the same hospital 4 times) and blocky 3D (stretched window textures, flat shading); pretty-but-unrelated backgrounds (space imagery behind "day 3"). Every shot must literally show what the line says; a 3D scene appears at most once and only when real footage can't show it (who-comes-back pilot, user feedback 2026-10-31)
- Ad tone: slogans, a product name or tagline as the ending ("DOCX · ...", "A plan is."), selling instead of explaining (monitor-not-plan disliked: "like an advertisement", 2026-10-30)

## User preferences
- HOOKS are the weakest part (user, 2026-11-13, after 'why-are-you-here': "hooks still gotta be improved"). Rules for the first 2 seconds:
  1. Land the tension in the first 1.5 s, in under 10 words; no setup clause first ("The specialist looked up from her screen and asked..." took 4 s to reach the point).
  2. Put the viewer in it: "you", or a moment they've lived.
  3. Open a gap the reel closes at the end (a contradiction, a number that sounds wrong, a question they can't answer yet).
  4. Frame 1 must already show the picture of the line (no fade-in, no empty frame, no title card).
  5. Write 5 hooks per reel, pick by: would a non-medical friend stop scrolling for this?
  Examples that would have been stronger: "You waited three weeks. The specialist didn't know why you came." / "69% say they sent it. 35% say they got it." / "Your doctor wrote a letter about you. Nobody read it."
- Parables (F2): bridge the metaphor to medicine with a personal beat, not a cut. In the-lighthouse the doctor jumped from the keeper's sea to "My patients call when it's already a storm" and the user found the transition weak (8/10, 2026-11-11). Next time: the guest brings a concrete case first ("A patient of mine. Fine at her visit. In hospital two weeks later."), the wise one asks the question that links it ("What did the water look like before?"), and only then the fact
- Voices that worked (first voice praise, 2026-11-11): en-IE-ConnorNeural at -14% / -6Hz for an old wise character, en-US-EmmaMultilingualNeural at -6% / -2Hz for a young doctor; slow, low, long pauses between lines (gap 0.6)
- Ink-wash faceless characters (blank ovals with an ink outline) were rated good: faces don't need detail
- WINNER (call-from-april v2, "brilliant", 2026-11-08). What made it work, repeat it:
  - a hook anyone feels: a family moment on a phone ("The hospital just called. About a scan from April." / "April? Mom, it's September.")
  - a real system failure shown through people, not explained (the result fell between teams)
  - proof as physical cutaways on the same set (a study card, the report with the line underlined), one sourced number each
  - an ending that answers: what good care looks like, concrete (one doctor, one plan, a dated timeline), plus one piece of evidence, no product name, no CTA
  - calm daylight look, two voices, ambient bed, no SFX
- Endings: don't stop at the problem or a question for the viewer ("who will call me?"). Close with the answer: what good care looks like (one doctor holding the plan, results seen on time, a clear next step and date), shown concretely, with one piece of evidence. Still no product name or CTA unless asked (call-from-april, user note 2026-11-06)
- Hooks don't have to be medical: the first line must make anyone stop and listen (a human moment, a surprise, a question, a visual puzzle), then the story turns to care. The-gardener opened on a clinical line ("She came back worse"): script and design rated good, hook too narrow (2026-11-02)
- Faceless parable (F2) works: sunlit flat illustration, an old wise character + a young doctor, one metaphor object, a reframing line, a callback ending; rated good (the-gardener, 2026-11-02)
- Character episodes (F1): no generic sound effects; a soft ambient music bed (scripts/ambient.py) that dips under the voices, plus room tone. Calm voices: slower (about -6 to -9%), lower pitch, longer pauses between lines. Soft visuals: smooth rounded clay characters (kit/SoftWorld.tsx), a bright daylight space, soft cinematic light (window rays, haze, gentle glow, light grain) rather than dark and moody (2026-10-30, reference: the VoiceStudio explainer reel)
- No CTA by default. "Better no CTA than a bad CTA": no product tag, no "follow for more", no keyword unless a real lead magnet exists and the user asked for it; end on the insight (2026-10-30)
- The synthetic voice is the weakest part of every reel so far (edge-tts judged poor on midnight-question, forgotten-plan, monitor-not-plan); a better voice is the top fix (2026-10-30)
- Editing own footage, B-roll style: don't decorate the talking head (no panels over plain lines); put the effort into the creator's own animations and B-roll: sound design on every visual beat, camera push/shake/bloom on impacts, no captions or progress bar over their type (user feedback on nvidia-journey-s1e2, 2026-10-26)
- The user's own voice (2026-11-01, "save that voice, use it, it is my voice"): for edits of the user's own videos, new or replaced lines are spoken in their voice: edge-tts (Andrew) then scripts/voice_convert.py (kNN-VC, MIT) against a reference built from their narration (Demucs vocals stem of their uploaded videos, 2-4 min). The reference audio is never committed (public repo); rebuild it from their videos each session. Level-match inserts to their vocals, cut at waveform silences. Converted lines sound less natural than real recordings: say so, and label AI audio when posting. Daily faceless runs still use synthetic voices unless the user asks
- Editing the user's footage: when an example is replaced in the narration, check every later scene of the source for the old example (S1E4: the cat sentence came back in the layers scene) and rebuild those too. When looping source footage under new panels, use only stretches with nothing but the narrator in the uncovered area (stray labels and icons flickered in the S1E4 ending, user feedback 2026-11-01)
- Recurring narrator for the NVIDIA Certification Journey series: **Ti** (short for Treatment Intelligence), look A from the design round (2026-11-02): a floating rounded orange cube, dark glass visor, one glowing teal line that widens while it talks, no body (kit/Narrator3D.tsx, look="cube"). It replaces the robot baked into the source footage by covering the robot's area with a feathered dark patch. Never use other creators' mascots (Klod) or the Claude/Anthropic identity: endorsement risk, and it contradicts the series' general-AI contrast
- Mascot motion: calm by default. Never drive the body from every syllable (it reads as shaking); the speaking light line shows the talking, and the body reacts only on key moments (a nod, a look up at the panel, a lift), about one every 8-10 s. To hide something baked into footage, cover its full reach (measure it), with a deliberate shape like a full-width stage, not a patch around it (user feedback on S1E4 v3, 2026-11-02)
- Spliced voice lines: never join the real recording and a converted insert in the middle of a phrase (the timbre jumps; user heard "it to a cough" as cut). Replace the whole phrase, run any of the creator's own words inside it through the same converter, fade every join, and check the result with a transcript (S1E4, 2026-11-02). When covering part of the footage, show again the elements the creator placed there (labels, bubbles) above the cover
- Dark theme for the NVIDIA Certification Journey edits: light scenes inverted (invert + hue-rotate 180) so the series reads dark (S1E4 rebuild, 2026-11-01)
- Fully automatic runs, faceless, no user voice; the user may ask for a re-make with their own voice after seeing a reel (2026-10-24)
- Test a different format and style every run and surprise the user; they will say what wins (2026-10-24, formats-lab.md)
- Liked references: B-roll live stories, character dialogue series (Klod), faceless parables (Garib) (references.md)
- Explainer style also liked: panel drawn in code, navy blueprint look, calm white captions (2026-10)
- Never publish without explicit approval; education only, no individual medical advice

## Open questions
- 3D toy diorama (F1) animation judged poor, but the dialogue was good: keep dialogue writing, rethink the picture before the next F1 (one data point)
