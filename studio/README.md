# reel-studio

Code-animated 9:16 reels built by the `/reel-factory` agent team in Claude Code.

- `npm run studio`: live editor/preview
- `npm run render -- <id>`: render to `out/<id>.mp4`
- `npm run qa -- <id> [frames]`: QA stills in `out/qa/<id>/`
- `npm run sfx`: regenerate the local SFX library

Layout: `src/kit` (shared animation components), `src/reels/<slug>` (one folder per reel), `briefs/<slug>` (research, script, style, sound, QA notes).

## Long-form narrated films

For films driven by a locked narration (example: `ai-terms-one-patient`, 5:11):

1. Put the approved text in `briefs/<slug>/00-narration-locked.txt` and group its sentences into blocks in `briefs/<slug>/vo-plan.json` (voice, rate, silence after each block).
2. `python3 scripts/narration.py <slug>`: checks every sentence is used once and in order, synthesizes scratch VO per block (edge-tts, word timing) and writes `src/reels/<slug>/timing.json`, the timing master. `--placeholder` lays out timing with no voice; `--measure` keeps durations of recorded block files you drop in.
3. Anchor every visual beat to a word (`at("B12", "compares")`), then `node scripts/check-anchors.mjs <slug>` to validate all anchors.
4. `python3 scripts/score.py <slug>` regenerates the score and effects stems from the same timing.
5. QA stills: `node scripts/stills.mjs <id> <outDir> <scale> <frame...>` (one bundle, many frames).
6. Render and master: `sh scripts/render-film.sh <id>` → `out/<id>-master.mp4` (-16 LUFS). Add `--frames=a-b --scale=0.5` for a motion preview.

In a sandbox whose HTTPS proxy re-signs TLS, headless Chrome must trust the proxy CA (add it to `~/.pki/nssdb` with `certutil`); never disable certificate checks.
