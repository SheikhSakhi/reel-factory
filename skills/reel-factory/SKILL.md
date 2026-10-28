---
name: reel-factory
description: Turn one idea into a finished, on-brand 9:16 reel animated in code (Remotion) by a team of agents (researcher, scriptwriter, art director, sound director, caption writer, animator, QA), with a voice-over, word-timed captions, series chrome, a cover and a ready-to-post caption. Optionally publish to Instagram/TikTok/YouTube. Use when the user says /reel-factory, "make a reel/short/TikTok about X", "make a video with the agent team", or wants code-animated social videos.
metadata:
  tags: video, reels, shorts, remotion, motion-design, agents, social
---

# Reel Factory

Pipeline: **idea → research → script (format) → voice-over → brand style + sound + caption → animation → QA → render → publish**.
Studio: `~/Projects/reel-studio` (Remotion 4, 1080x1920, 30 fps). Briefs are in `briefs/<slug>/`, code in `src/reels/<slug>/`, the brand in `brand/brand.md` + `src/brand/brand.ts`.

Related skills: `/reel-brand` (set the look once), `/reel-edit` (the user's own recording instead of a generated voice), `/reel-insights` (weekly measurement), `/reel-ideas` (what to make), `/reel-adapt <url>` (borrow a viral reel's structure), `/reel-plan` (a week of reels), `/reel-replies` (comment and DM replies).

If the user gives a video of themselves talking, use `/reel-edit` instead: it replaces steps 1-2b with their own footage.

What makes accounts grow is consistency, not novelty: **one brand look, a voice, proven formats, real proof and a CTA that captures leads.** Every step below serves one of those.

## 0. Setup check (once per session)

If `~/Projects/reel-studio` does not exist, clone this skill's repo and run its `install.sh` first. Then:

```bash
cd ~/Projects/reel-studio && [ -d node_modules ] || npm install
[ -f public/sfx/hum.wav ] || npm run sfx
python3 -c "import edge_tts" 2>/dev/null || pip3 install -U edge-tts
```

**Brand check:** if `brand/brand.md` still says "This is the starter brand", tell the user in one line that every reel will use the starter look until they run `/reel-brand` (about 2 minutes), and ask if they want to do that first. If they say no, continue with the starter brand.

## 1. Intake

From the user's message, take:

| Field | Default |
|---|---|
| **idea** | required. Ask only if missing. |
| **format** | picked by the scriptwriter from `formats.md` |
| **language** | `brand/brand.md`, else the language of the message |
| **length** | 30-45s |
| **voice-over** | **on**: the user's own recording if they'll read it (ask once), else their ElevenLabs clone if configured, else the brand's edge-tts voice. Off only if the user says "no voice" or "text only". |
| **CTA** | the brand's default keyword CTA. Use a keyword DM only if a lead magnet for it exists in `brand/brand.md`; otherwise "save this". |
| **proof** | the brand's proof points. Ask once if the hook needs a result or credential the brand file does not have. |
| **assets** | screenshots, screen recordings, real comments in `public/assets/<slug>/` |

Make a kebab-case `slug` and create `briefs/<slug>/` and `public/assets/<slug>/`.

**Assets:** proof scenes need real material. If the idea involves software, a result or social proof and the user has not given assets, ask once: "Do you have screenshots or a screen recording I can show? Drop them in `public/assets/<slug>/`." Continue without them if they don't. The art director then rebuilds UI in code, using only true content.

If the voice is not set in `brand/brand.md`, run `npm run vo -- --samples`, send the 4 MP3s from `out/voice-samples/` and ask which one to use. Save the choice into `brand/brand.md`.

## 2. Run the team (Agent tool, subagent types below)

| Step | Agent | Output |
|---|---|---|
| 1 | `reel-researcher` | `01-research.md` |
| 2 | `reel-scriptwriter` | `02-script.md` + `vo-take.txt` |
| 2b | you: `npm run vo -- <slug> --voice <brand voice>` | `public/vo/<slug>/take.mp3` + `take.json` |
| 3 | `reel-art-director`, `reel-sound-director` **and** `reel-caption-writer` in parallel (one message, three Agent calls) | `03-style.md`, `04-sound.md`, `07-caption.md` |
| 4 | `reel-animator` | `src/reels/<slug>/Reel.tsx`, QA stills |
| 5 | `reel-qa` | `06-qa.md` with VERDICT |

Give every agent: the slug, the absolute brief folder path, the language, the format (once chosen), the user's constraints, and the paths `brand/brand.md`, `~/.claude/skills/reel-factory/formats.md`, and (after 2b) `public/vo/<slug>/take.json`. If the run comes from `/reel-adapt`, also pass `00-teardown.md`. Run each step in the foreground and wait for its result before starting the next.

### 2b. Voice-over

`scripts/vo.py` reads `briefs/<slug>/vo-take.txt`: the whole voice-over as one text with `[S1]`, `[S2]` … scene markers. Choose the voice in this order:

1. **The user's own voice** (best for trust, especially for a doctor or founder): send the user `vo-take.txt` as plain text to read aloud in one go (Voice Memos, Lossless, quiet room), get the file (or a Google Drive link via `scripts/fetch.py`), then `npm run vo -- <slug> --audio <file> --language <lang>`. Captions follow what they actually said; the `[S1]` markers only place the cuts. If the output notes that the recording differs a lot from the script, check the scene starts in `take.json`.
2. **Their ElevenLabs clone**, if `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are set: `npm run vo -- <slug> --engine elevenlabs --language <lang>`. Remind them to label AI audio on Instagram.
3. **Dialogue** (character formats, several voices): write `vo-take.txt` as `[S1] DOCTOR: line [S2] DOC: line …` and `briefs/<slug>/cast.json` mapping each speaker to an edge-tts voice (`{"DOC": {"voice": "en-US-AvaMultilingualNeural", "rate": "+8%", "pitch": "+12Hz"}}`), then `npm run vo -- <slug> --dialogue`. Each scene in `take.json` gets a `speaker`; `kit/DialogueCaptions.tsx` colours word chips by speaker.
4. **edge-tts** (free, default): `npm run vo -- <slug> [--voice ...]`. It synthesizes in **one pass**, so the intonation flows like a person talking. Never synthesize line by line: that sounds choppy and robotic.

It writes `take.mp3` (played from frame 0) and `take.json` (every scene's frame range and word timings). The scene ranges in `take.json` override the script's estimates.

Before step 3, send `take.mp3` to the user so they can hear it. If the speech runs past the target length, tighten `vo-take.txt` and re-run. Do not speed the voice beyond about +10%.

If edge-tts fails with a 403, run `pip3 install -U edge-tts`. If it still fails (no network), tell the user and continue as a text-only reel: the scriptwriter rewrites the on-screen text to carry the story (max 8 words per beat).

If the user wants to approve the script first ("let me see the script"), stop after step 2 and show it.

## 3. QA loop

If the verdict is FAIL, send the fix list to `reel-animator`, then re-run `reel-qa`. Allow at most 2 fix rounds. After that, report the remaining issues instead of looping. A FAIL on the hook rule goes back to the scriptwriter, not the animator.

## 4. Render and deliver

```bash
cd ~/Projects/reel-studio && npm run audio-check -- <slug> && sh scripts/render.sh <slug>
```

`audio-check` must PASS (peak at or below -1 dBFS, no clipping). `render.sh` writes `out/<slug>.mp4` and, when the registry has a `coverFrame`, `out/<slug>-cover.jpg` (upload it as the cover so the profile grid stays consistent).

Send `out/<slug>.mp4` and the cover with SendUserFile. Then paste the caption from `07-caption.md` (ready to copy), plus 2 lines: the format, and the duration. Mention that `npm run studio` opens the live editor.

If the CTA is a keyword DM, remind the user in one line what must happen when people comment (the DM text is in `07-caption.md`; `/reel-replies` drafts the rest).

## 5. Publish (only with explicit confirmation)

Never publish automatically. Show the caption, the cover and the target platforms, then ask "Publish now?". Only on a clear yes:

- **Instagram** (when `.env.local` exists, see `docs/SETUP.md`): first `python3 scripts/ig.py publish <slug> --cover-ms <coverFrame / 30 * 1000>` (dry run: shows exactly what will be sent), then the same command with `--yes`. It records the reel in `data/factory.db`, so insights and keyword replies find it later.
- **Other platforms**: the `social-publisher` skill, if installed.
- Nothing configured: say so and leave the MP4, cover and caption ready for manual upload.

If the CTA is a keyword DM, tell the user that `/reel-replies` (or `python3 scripts/ig.py keyword <slug>`) handles the replies, and whether DMs to the public need App Review first (`docs/SETUP.md` step 7).

## Quality bar

- **Brand:** palette, fonts, highlight style, chrome and caption style come from `src/brand/brand.ts`. The art director varies composition and motion only.
- **Hook:** promise + proof in the first 3 seconds, readable by frame 20 (`formats.md`).
- **Format:** the script names one format from `formats.md` and follows its shape, with a visible progress device for 3+ parts.
- **Voice:** the voice carries the story. Word-timed captions show it. On-screen text adds what the voice doesn't say: exact figures and sources. Beats land on spoken words.
- **Proof:** at least 2 proof scenes (real screenshot or recording, real comment, or a sourced number). Nothing invented, ever.
- **CTA:** one CTA; the reel, the caption and the DM text agree on the keyword.
- **Code:** everything is animated from code, reproducible and editable. No stock AI presenters.
