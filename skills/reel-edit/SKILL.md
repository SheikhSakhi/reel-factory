---
name: reel-edit
description: Edit the user's own talking-to-camera recording into a finished on-brand reel — cleans the audio, transcribes it locally, cuts retakes, fillers and dead air, lets the user edit the video by editing the transcript, reframes to 9:16 around their face, then adds captions, chapters, proof overlays and the CTA with the brand kit. Use when the user sends or names a video file of themselves, says /reel-edit, "edit my video", or "make a reel from my recording".
metadata:
  tags: video, editing, transcript, talking-head, reels
---

# Reel Edit

Studio: `~/Projects/reel-studio`. Needs a system `ffmpeg` (`brew install ffmpeg` / `apt install ffmpeg`), Node, and `pip3 install opencv-python-headless` for face tracking. The first run builds whisper.cpp (~2 minutes) and downloads the model.

## 1. Prep

Make a kebab-case slug. Then:

```bash
cd ~/Projects/reel-studio
python3 scripts/edit.py prep <path/to/video> <slug> [--language en|ko|hi|auto] [--model base]
```

Use `--model small` (or `large-v3-turbo` on a fast machine) for Korean, Hindi or accented English; `base` is fine for clear English.

## 2. The edit (text = video)

Read `briefs/<slug>/edit/transcript.md`. Retakes are already commented out with `#` and fillers removed. Then make the editorial pass yourself, and show the user the result as a short diff before applying:

- **Hook first:** if the strongest line (promise + proof, see `~/.claude/skills/reel-factory/formats.md`) is not first, move that line to the top. Lines can be reordered.
- Cut throat-clearing openers ("So, today I want to talk about…"), repeated points, and tangents.
- Keep cuts at line (sentence) level where possible. Removing single words inside a fluent phrase is approximate.
- Add `[S2]`, `[S3]` … lines where chapters change (list items, before/after), so chapters, tabs and overlays can follow.
- Target length from the user, else 30-60s.

Ask the user: "Apply this edit?" Then:

```bash
python3 scripts/edit.py apply <slug>
python3 scripts/edit.py verify <slug>
```

`verify` must say PASS. If it reports a missing or extra word next to a word-level cut, restore that word or cut the whole sentence, then apply and verify again.

## 3. Design and build

Run the team from `/reel-factory` step 3 onward, telling every agent this is **own footage**: the timing file is `public/edit/<slug>/take.json` (scene ranges and word frames on the edited timeline), and there is no `vo-take.txt`:

- `reel-art-director` + `reel-sound-director` + `reel-caption-writer` in parallel. The art director plans overlays that never cover the face for long: chrome, captions in the brand band, proof cut-aways (full-frame `ProofShot` while the voice continues) of at most ~3s, and the CTA card at the end.
- `reel-animator`: the reel root is `<TalkingHead edit={loadEdit(editJson)} />` (from `public/edit/<slug>/edit.json`), then overlays timed with `wordFrame(TAKE, ...)`, `<SeriesChrome>`, `<Captions {...captionProps(BRAND)}>` and `<SfxTrack>` (quiet: the voice is real). **No `<VoiceOver>`**: the audio is in the video.
- `reel-qa` as usual, plus: the face is never covered by a card for more than ~3s, and the cuts don't clip words (listen via `verify`).

## 4. Render and deliver

```bash
npm run audio-check -- <slug> && sh scripts/render.sh <slug>
```

Deliver like `/reel-factory`: MP4, cover, caption. Offer to publish (`/reel-factory` step 5).
