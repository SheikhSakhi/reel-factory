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
- `python3 scripts/fetch.py "<link>" <id>`: download your video from Google Drive, Dropbox or a direct link
- `npm run edit -- prep <video> <id>` / `apply <id>` / `verify <id>`: edit your own recording by editing its transcript
- `python3 scripts/lineart.py <image> <out.json> [--mode outline|lines]`: turn a picture into line art for `<DrawArt>` in explainer panels
- `python3 scripts/edit_render.py <id> [--qa] [--4k]`: render the edit (footage + `public/edit/<id>/plan.json`: captions, widgets, zooms, CTA)
- `npm run ig -- <command>`: Instagram connector (setup, check, sync, watch, discover, hashtag, comments, keyword, reply, dm, publish). See ../docs/SETUP.md
- `npm run trends -- <command>`: outliers, tag, formats, youtube, report
- `npm run weekly`: sync insights + watchlist, find outliers, write insights/report.md
- `npm test`: unit tests for the editor, alignment, connector and research

Layout:
- `brand/brand.md` + `src/brand/brand.ts`: the brand kit every reel uses (set with `/reel-brand`)
- `src/kit`: shared components (Headline, SeriesChrome, ProofShot, CommentCard, StatCard, CtaCard, Captions, VoiceOver …)
- `src/reels/<slug>`: one folder per reel; `series-demo` is the reference for a branded, voiced reel
- `briefs/<slug>`: research, script, style, sound, caption and QA notes
- `public/assets/<slug>`: your screenshots, recordings and comments for proof scenes
- `ideas/backlog.md`, `ideas/outliers.md`, `plans/`, `replies/`: from `/reel-ideas`, `/reel-insights`, `/reel-plan`, `/reel-replies`
- `insights/`: `report.md` (your reels) and `formats.md` (what works in the niche)
- `data/factory.db`, `.env.local`: local memory and secrets, never committed


## Voice: ElevenLabs (optional, paid) or free edge-tts

`scripts/vo.py` picks the voice engine by itself (`--engine auto`, the default):

- **ElevenLabs** when `ELEVENLABS_API_KEY` is set **and** there is a voice for every speaker:
  `ELEVENLABS_VOICE_ID` for one-narrator reels, or `"elevenlabs_voice": "<voice id>"` per speaker in `briefs/<slug>/cast.json`
  (optional `"elevenlabs_settings": {"stability": 0.5, "similarity_boost": 0.75}`).
- **edge-tts (free)** otherwise. The run prints which engine it used, and `take.json` records it (`"engine"`).

### Set up ElevenLabs safely

1. Create an account at elevenlabs.io and choose a paid plan with API access (the free tier is for personal, non-commercial use).
2. Profile, **API Keys**, create a key. Restrict it to **Text to Speech** only and set a monthly credit limit.
3. Pick a voice from the **Voice Library** (a stock voice, never a clone of someone else) and copy its **Voice ID**.
4. Store the key where git never sees it:
   - cloud sessions (claude.ai/code): the environment's settings, **Environment variables**: `ELEVENLABS_API_KEY=...` (and `ELEVENLABS_VOICE_ID=...`). New sessions pick them up.
   - on a computer: `studio/.env.local` (git-ignored).
   Never paste a key into a chat, an issue, a brief or any committed file.
5. Before committing, `scripts/check-secrets.sh` refuses anything that looks like a key.

If a key ever leaks: delete it in ElevenLabs at once and create a new one; git history keeps old commits even after a file is removed.
