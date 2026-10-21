# reel-studio

Code-animated 9:16 reels built by the `/reel-factory` agent team in Claude Code.

- `npm run studio`: live editor and preview
- `npm run render -- <id>`: render `out/<id>.mp4`, plus `out/<id>-cover.jpg` when the reel has a `coverFrame`
- `npm run qa -- <id> [frames]`: QA stills in `out/qa/<id>/`
- `npm run vo -- <id> [--voice V] [--rate +6%]`: synthesize `briefs/<id>/vo-take.txt` in one take into `public/vo/<id>/take.mp3` + `take.json`. Needs `pip3 install -U edge-tts`.
- `npm run vo -- --samples`: audition voices into `out/voice-samples/`
- `npm run audio-check -- <id>`: render the audio mix and check peak, loudness and clipping
- `npm run fonts -- "Family:400,700i" ...`: store the brand's Google Fonts locally in `public/fonts/`
- `npm run frames -- <video> <name> [fps]`: sample a reference reel into `out/teardown/<name>/` for `/reel-adapt`
- `npm run sfx`: regenerate the local SFX library

Layout:
- `brand/brand.md` + `src/brand/brand.ts`: the brand kit every reel uses (set with `/reel-brand`)
- `src/kit`: shared components (Headline, SeriesChrome, ProofShot, CommentCard, StatCard, CtaCard, Captions, VoiceOver …)
- `src/reels/<slug>`: one folder per reel; `series-demo` is the reference for a branded, voiced reel
- `briefs/<slug>`: research, script, style, sound, caption and QA notes
- `public/assets/<slug>`: your screenshots, recordings and comments for proof scenes
- `ideas/backlog.md`, `plans/`, `replies/`: from `/reel-ideas`, `/reel-plan`, `/reel-replies`
