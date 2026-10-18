# reel-studio

Code-animated 9:16 reels built by the `/reel-factory` agent team in Claude Code.

- `npm run studio`: live editor/preview
- `npm run render -- <id>`: render to `out/<id>.mp4`
- `npm run qa -- <id> [frames]`: QA stills in `out/qa/<id>/`
- `npm run sfx`: regenerate the local SFX library
- `npm run vo -- <id> [--voice V] [--rate +6%]`: synthesize `briefs/<id>/vo-take.txt` in one take into `public/vo/<id>/take.mp3` + `take.json`. Needs `pip3 install -U edge-tts`.
- `npm run vo -- --samples`: audition voices into `out/voice-samples/`
- `npm run audio-check -- <id>`: render the audio mix and check peak, loudness and clipping

Layout: `src/kit` (shared animation components), `src/reels/<slug>` (one folder per reel), `briefs/<slug>` (research, script, style, sound, QA notes).
