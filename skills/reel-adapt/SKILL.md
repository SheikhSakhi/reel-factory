---
name: reel-adapt
description: Take a reel that is working (a URL or a video file) and make the user's own version of it — same structure, pacing and retention devices, but the user's topic, proof and brand, never their wording or visuals. Use when the user says /reel-adapt, "make one like this", "adapt this viral reel", or shares a reel link asking for a version of it.
metadata:
  tags: video, reels, adaptation, teardown
---

# Reel Adapt

Input: a reel URL or video file, plus (optional) the user's idea for their version. Without an idea, the adaptation applies the structure to the brand's niche and the trend scout proposes 3 topics to choose from.

## 1. Get the reference

Use the first route that works, and say which one you used:

1. **A local file** the user gave: use it directly.
2. **A browser tool** (Claude in Chrome or the built-in browser, if connected): open the URL, close sign-in pop-ups, read the caption, comment count and on-screen text, and watch the video. Note timestamps of every cut and text change.
3. **yt-dlp** (if installed, `pip3 install -U yt-dlp`): `yt-dlp -o "out/teardown/<slug>/source.%(ext)s" <url>`. Instagram often needs a logged-in session; if it fails, don't fight it.
4. **Ask the user** to download the reel (or screen-record it) into `out/teardown/`, or to paste the transcript and caption.

Downloaded media is for analysis only. Keep it in `out/` (ignored by git), never in `public/`, and never put any of it in the new reel.

## 2. Teardown

Make the slug for the NEW reel and `briefs/<slug>/`. Run the `reel-trend-scout` agent in **Mode B (teardown)** with: the video path or stills folder, any transcript and caption text, the slug, and the user's idea. It writes `briefs/<slug>/00-teardown.md`.

`npm run frames` also transcribes the reel locally (whisper.cpp), so no transcript needs to be pasted.

Show the user the beat map summary (format, the 3 key mechanics) and the adapted outline. Ask: "Make it with this structure?"

## 3. Produce

Run `/reel-factory` with the user's idea, telling it the format from the teardown and that `00-teardown.md` must go to the researcher and scriptwriter. Everything else (brand, voice, proof, QA) follows the normal pipeline.

## Rules

- Borrow structure, never expression. No reused lines, footage, music, characters, logos or visual identity. If the user asks for a near-copy, explain the risk (copyright claims, "unoriginal content" downranking on Instagram and TikTok) and keep it to structure.
- Claims in the reference are not facts. The researcher verifies anything reused.
