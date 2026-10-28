---
name: reel-daily
description: The autonomous daily run of reel-factory. Scans what is trending in the niche, chooses a topic on its own, writes the script, voices it, animates and renders the reel, checks it, and delivers the finished video, cover and caption to the user at the scheduled time, then learns from the user's rating. Triggered by the scheduled routine ("run today's reel"), or when the user says /reel-daily or "make today's reel yourself". Also handles the user's rating reply to a delivered reel.
metadata:
  tags: video, reels, autonomous, schedule, learning
---

# Reel Daily

One finished reel, made without the user, delivered for their approval. **Nothing is ever published by this run.** The user reviews and posts (or approves `ig.py publish`).

## 0. Setup (each run: the session may be a fresh container)

```bash
cd ~/Projects/reel-studio 2>/dev/null || cd "$(git rev-parse --show-toplevel)/studio"
[ -d node_modules ] || npm install --no-audit --no-fund
[ -f public/sfx/hum.wav ] || npm run sfx
python3 -c "import edge_tts" 2>/dev/null || pip3 install -q -U edge-tts
git pull --ff-only 2>/dev/null || true   # learnings and history from earlier runs
```

Read `insights/daily.md` (the run settings: language, voice, length, mode, topic boundaries). If it is missing, use: the brand's language, 30-45 s, animated explainer, stock voice, mode `auto`.

## 1. Pick (agent `reel-editor-in-chief`)

If `.env.local` has Instagram credentials, first refresh evidence: `npm run weekly` when `insights/report.md` is older than 7 days. Then run `reel-editor-in-chief`. It writes `briefs/<slug>/00-pick.md`.

## 2. Make

**Mode `auto`** (default): run the `/reel-factory` pipeline steps 1-5 with the pick:
- researcher → scriptwriter (given `00-pick.md` and `insights/learnings.md`) → voice-over → art director + sound director + caption writer → animator → QA (max 2 fix rounds) → `npm run audio-check -- <slug>` → `sh scripts/render.sh <slug>`.
- Format and style: from `00-pick.md`, chosen by the rotation rule in `insights/formats-lab.md` (studied from `insights/references.md`). Faceless: a mascot, faceless characters, screens and drawings, all animated in code. Each run must look different from the last one.
- Voice: ElevenLabs if `ELEVENLABS_API_KEY` is set, else edge-tts. Dialogue formats use two clearly different voices (e.g. `en-US-AndrewMultilingualNeural` and `en-US-AvaMultilingualNeural`). Label synthetic voices as AI when publishing.
- If the user later asks "make it with my voice": send `vo-take.txt` as plain text, and when the recording arrives re-make it with `vo.py --audio` (the half-auto path).

**Mode `half-auto`**: stop after the script. Deliver `vo-take.txt` as plain text with "Read this into Voice Memos and send me the file." When the recording arrives, continue with `vo.py --audio` and the rest of the pipeline.

Time budget: aim to finish within 60 minutes. If a step fails twice, stop and deliver what exists (script, stills) with the reason.

## 3. Deliver

Send with SendUserFile: `out/<slug>.mp4` and `out/<slug>-cover.jpg`. In the message:
1. The title and a one-line why (from `00-pick.md`), and which format and style this run tested (F1-F5), so the rating teaches the lab.
2. The caption from `07-caption.md`, ready to paste.
3. The facts used, each with its source (from `01-research.md`), so the user can check them before posting. Medical content: say plainly that it needs their review.
4. "Rate it 1-10 and tell me one thing to change." That reply teaches the system.

Record the reel in `insights/history.md`: date, slug, title, format, hook, voice, length, rating (empty for now).

## 4. Learn

When the user replies with a rating or comments (in the same session, later), run the `reel-learner` agent with that reply. If they ask for a change, make it, re-render and send the new version.

## 5. Save memory

The container can be reset between runs, so learning must live in git:

```bash
git add insights/learnings.md insights/history.md insights/formats-lab.md briefs/<slug> src/reels src/edits public/vo/<slug> 2>/dev/null
git commit -m "daily: <slug>" && git push origin HEAD
```

Push only to the session's working branch. Never commit `.env.local`, `data/` or `out/`.

## Rules

- Never publish, reply or DM. Delivery is to the user only.
- Never invent facts, numbers, studies or quotes. A fact without a source is cut.
- Medical, legal, financial: general education only, with caveats from the research.
- Respect `insights/daily.md` topic boundaries ("never about X").
- If nothing worth making was found (no fresh signal, all candidates weak), say so and deliver 3 candidate topics instead of a weak reel.
