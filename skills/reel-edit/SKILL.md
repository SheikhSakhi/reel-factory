---
name: reel-edit
description: Edit the user's own talking-to-camera video into a finished reel — from a Google Drive / Dropbox / direct link or a local file. Cleans the audio, transcribes locally, cuts retakes, fillers and dead air, reframes to 9:16 around the face, then adds creator-style captions, widgets (callouts, lower third, stat counters, arrows, big-word slams, picture-in-picture), punch-in zooms, flashes, sound effects and the CTA, all described in one plan.json that is easy to revise. Use when the user sends a video or a link to one, says /reel-edit, "edit my video", "смонтируй", or asks for changes to an edit ("remove the box at 12s", "bigger subtitles").
metadata:
  tags: video, editing, captions, effects, talking-head, reels
---

# Reel Edit

Studio: `~/Projects/reel-studio` (or this cloud session's studio). Needs `ffmpeg`, Node, and `opencv-python-headless` for face tracking. whisper.cpp builds itself on first use.

The whole edit is data: `public/edit/<slug>/edit.json` + `take.json` (cuts and word timings, from `edit.py`) and `plan.json` (everything on top, from you). No per-video code. Revisions are edits to `plan.json` or `transcript.md` and a re-render.

## 1. Get the video

- **Link** (Google Drive shared as "Anyone with the link", Dropbox, or a direct URL):
  `python3 scripts/fetch.py "<link>" <slug>` → `inbox/<slug>/source.<ext>`
  If it says the link returned a web page, ask the user to set sharing to "Anyone with the link".
- **Local file**: use its path directly.

## 2. Cut (text = video)

```bash
python3 scripts/edit.py prep <video> <slug> [--language en|ru|ko|hi|auto] [--model base|small]
```

Use `--language ru` (or ko, hi …) and `--model small` for Russian, Korean, Hindi or accented English: `auto` detects the language, but an explicit one is safer. Then edit `briefs/<slug>/edit/transcript.md`:
- Hook first: move the strongest line (promise + proof) to the top.
- Cut throat-clearing, repeats and tangents. Cut at sentence level where possible.
- Add `[S2]`, `[S3]` … where the topic or list item changes: overlays and chapters key off scenes.
- Show the user the cut as a short before/after summary and ask "Apply?". Then:

```bash
python3 scripts/edit.py apply <slug> && python3 scripts/edit.py verify <slug>
```

`verify` must PASS. If a mid-phrase word cut fails, cut the whole sentence instead.

## 3. Choose the style

- **Widgets on the speaker** (`layout` full, effects from [effects.md](effects.md)): talking-head reels, opinions, stories.
- **Explainer** (split screen, a panel drawn in code above the speaker, some scenes full-panel): mechanisms, numbers, comparisons. Follow [panels.md](panels.md): plan the layout per scene, write `src/edits/<slug>/Panels.tsx`, register it. If the user shared a reference reel, tear it down first (`/reel-adapt`) and match its rhythm: what appears on which kind of word, how long the panel stays, where captions sit.

## 3b. Plan the effects (plan.json)

Read `take.json` (every spoken word with its frame), `brand/brand.md`, and [effects.md](effects.md). Write `public/edit/<slug>/plan.json`. Rules:
- **Every overlay lands on a spoken word** (`"at": "S2:three"`). Visuals that arrive with the word feel edited; random timing feels like a template.
- **Density**: one visual event every 2-4 seconds. Never two widgets at once except a stat + zoom.
- **Hook (first 3s)**: lower third with name + credential (the proof) and/or a callout with the promise; a zoom on the key word.
- **Numbers** → `stat` (source required: from the user or verified research, never invented). **The single most important word** → `slam` + `flash` (at most twice per video). **Screens, results, documents** the user supplied in `public/assets/<slug>/` → `image`.
- **Ending**: `cta` with the brand's keyword and lead magnet (only one that exists in `brand.md`), else omit.
- Keep the face visible: callouts sit in the upper third (default), captions at y≈1250.
- Captions: `"pop"` (default, big creator style) or `"pill"` (calmer). Put numbers and the CTA keyword in `emphasis`.
- Set `cover` to a moment where the hook is on screen.

## 4. Check and render

```bash
python3 scripts/edit_render.py <slug> --qa      # stills at every overlay + out/qa/<slug>/sheet.jpg
```

Read the contact sheet. Fix collisions (a widget over the face or over captions), unreadable text, and widgets that arrive late or early, by editing `plan.json`. Then:

```bash
node scripts/audio-check.mjs edit <slug>         # must PASS
python3 scripts/edit_render.py <slug>            # out/<slug>.mp4 + out/<slug>-cover.jpg
python3 scripts/edit_render.py <slug> --4k       # optional 2160x3840 master (YouTube, archive)
```

Write the caption with the `reel-caption-writer` agent (pass `take.json` as the script). Send the MP4 and the cover with SendUserFile, plus the caption.

## 5. Revisions

Map the user's words to the data, change only that, re-render:
- "remove/move the box at 12 s" → find the overlay whose `at` resolves near 12 s (`"12s"` = frame 360), delete or change its `at`
- "subtitles bigger / calmer / no subtitles" → `captions.style` (`pop`, `pill`, `none`)
- "cut the part about X" → delete that line in `transcript.md`, then `apply` and `verify` (all `at` moments follow automatically)
- "more energy" → add `zooms` on stressed words and one `slam`; "calmer" → remove slams and flashes
- "draw X when I say Y" / "make that panel clearer" → edit that scene's component in `src/edits/<slug>/Panels.tsx`
- "more of me / less of me" → switch scenes between `split`, `panel` and `full` in `layout`

Then QA and render again, and send the new version.

## Rules
- Nothing is invented: stats, screenshots and comments come from the user or verified research.
- Medical content stays educational; no individual advice in on-screen text.
- Publishing only after the user's explicit yes (`/reel-factory` step 5).

## Where the effort goes (user feedback, 2026-10-26)

Edit like an editor, not a decorator:
- **Talking head:** captions, a few punch-in zooms on the words that matter, one title at the start. No panels or widgets over ordinary lines.
- **The creator's own animations and B-roll** are the set pieces. Watch them at 10 fps, list every visual beat (an element lands, a snap, a glow, a burst, a camera move) and score each one in `plan.json`:
  - `sounds`: hand-placed cues (`whoosh`/`swoosh` on entrances and camera moves, `impact` on snaps, `riser` into a reveal, `shimmer` on a glow, `blip`/`tick` for data steps, `particles` for dust, `hum` as a bed under a sequence)
  - `moves`: `push` (slow zoom across the sequence), `shake` and `bloom` on impacts and glows
  - `captions.hide`: no captions while their animation carries the words; no progress bar over their type
- Keep peaks under -1 dBFS: impacts land on top of the voice (`volume` ≤ 0.45).

