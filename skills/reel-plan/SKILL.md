---
name: reel-plan
description: Plan a week (or N days) of reels from the idea backlog with a balanced mix of formats and CTAs, write it as a Monday-to-Sunday calendar, and optionally batch-produce the reels with /reel-factory. Use when the user says /reel-plan, "plan my week of content", "content calendar", or "make next week's reels".
metadata:
  tags: video, reels, planning, calendar
---

# Reel Plan

## 1. Inputs

- `~/Projects/reel-studio/brand/brand.md` (niche, CTAs, lead magnets)
- `ideas/backlog.md`. If it has fewer than 10 unused ideas, run `/reel-ideas` first.
- `insights/report.md` and `insights/formats.md` if they exist: favour the formats that measured best, and keep one slot a week for a test.
- From the user (ask once, with defaults): posts per week (default 5, Mon-Fri), the week's start date (default next Monday), any fixed items (a launch, an event), and which days they can record or supply assets.

## 2. Plan rules

- **Mix formats**: no format twice in a row; per 5 posts, at least 2 save formats (list or tutorial), at most 1 hot take.
- **Mix CTAs**: at most 2 keyword DM CTAs per week (more trains the audience to ignore them), the rest save or follow. Keyword CTAs only for lead magnets that exist.
- **Series**: if an idea is big, split it into "part 1 / part 2" on consecutive posting days, and only promise part 2 in part 1 if it is planned.
- **Effort**: put reels that need user assets (screen recordings, results) later in the week, and note the asset and the day it is needed.
- **Timing**: suggest posting times from the brand's audience time zone. Say these are starting points to test, not data. (The API has no posting-time breakdown in this setup; compare results by publish time in `insights/report.md` after a few weeks.)

## 3. Output

Write `plans/<YYYY>-W<NN>.md` in the studio:

```
| Day | Date | Slug | Format | Hook (promise + proof) | CTA | Assets needed | Status |
|---|---|---|---|---|---|---|---|
| Mon | 2026-10-26 | five-ai-scribes | list (5) | … | comment SCRIBE | none | planned |
```

Mark used ideas in `ideas/backlog.md` with `→ planned <date>`. Show the table to the user and ask: "Produce these now?"

## 4. Batch produce (on yes)

Run `/reel-factory` for each row in order, one at a time (each needs the voice-over before the next can start). After each: update Status to `rendered`, and send the MP4, cover and caption. Stop and ask if a row needs assets the user hasn't provided.

Publishing or scheduling uses the normal confirmation step in `/reel-factory`: never schedule posts without an explicit yes for that batch.
