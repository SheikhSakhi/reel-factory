---
name: reel-factory
description: Turn one idea into a finished, uniquely styled 9:16 motion-graphics reel animated in code (Remotion) by a team of agents (researcher, scriptwriter, art director, sound director, animator, QA), then optionally publish to Instagram/TikTok/YouTube. Use when the user says /reel-factory, "make a reel/short/TikTok about X", "make a video with the agent team", or wants code-animated social videos.
metadata:
  tags: video, reels, shorts, remotion, motion-design, agents, social
---

# Reel Factory

Pipeline: **idea → research → script → style + sound → animation → QA → render → publish**.
Studio: `~/Projects/reel-studio` (Remotion 4, 1080x1920, 30 fps). Briefs are in `briefs/<slug>/` and code is in `src/reels/<slug>/`.

## 0. Setup check (once per session)

If `~/Projects/reel-studio` does not exist, clone this skill's repo and run its `install.sh` first. Then:

```bash
cd ~/Projects/reel-studio && [ -d node_modules ] || npm install
[ -f public/sfx/pop.wav ] || npm run sfx
```

Optional voice-over (free, no API key): `pip3 install edge-tts`, then `python3 scripts/vo.py <slug>` reads `briefs/<slug>/vo-lines.json`.

## 1. Intake

From the user's message, take: the **idea**, **language** (default: same as the user's message), **length** (default 20-30s), **CTA**, **voice-over** (default none), and any **assets** (logos, screenshots, music placed in `public/`). Make a kebab-case `slug` and create `briefs/<slug>/`. Ask only if the idea itself is missing.

## 2. Run the team (Agent tool, subagent types below)

| Step | Agent | Output |
|---|---|---|
| 1 | `reel-researcher` | `01-research.md` |
| 2 | `reel-scriptwriter` | `02-script.md` |
| 3 | `reel-art-director` **and** `reel-sound-director` in parallel (one message, two Agent calls) | `03-style.md`, `04-sound.md` |
| 4 | `reel-animator` | `src/reels/<slug>/Reel.tsx`, QA stills |
| 5 | `reel-qa` | `06-qa.md` with VERDICT |

Give every agent the slug, the absolute brief folder path, the language, and the user's constraints. Run each step in the foreground and wait for its result before starting the next.

If the user wants to approve the script first ("let me see the script"), stop after step 2 and show it.

## 3. QA loop

If the verdict is FAIL, send the fix list back to `reel-animator`, then re-run `reel-qa`. Allow at most 2 fix rounds. After that, report the remaining issues to the user instead of looping.

## 4. Render and deliver

```bash
cd ~/Projects/reel-studio && sh scripts/render.sh <slug>
```

Send `out/<slug>.mp4` to the user with SendUserFile, along with a 2-line summary: the style concept and the duration. Tell them `npm run studio` opens the live editor for manual tweaks.

## 5. Publish (only with explicit confirmation)

Never publish automatically. Show the caption (hook + 1-2 lines + 3-5 hashtags in the reel's language) and the target platforms, then ask "Publish now?". Only on a clear yes, use the `social-publisher` skill (SocialClaw, requires `SC_API_KEY`). If no key is configured, say so and leave the MP4 and caption ready for manual upload.

## Quality bar

- Every reel has a distinct style concept; the art director checks earlier `03-style.md` files.
- The hook is readable by frame 20. On-screen text is at most 8 words per beat.
- Everything is animated from code, so the result is reproducible and editable. No stock AI presenters.
