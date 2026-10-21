---
name: reel-insights
description: Run the weekly learning loop — pull your reels' insights and your watchlist's posts from Instagram, find outliers in your niche, tag them, and report which formats, hooks and topics work for your audience and theirs. Use when the user says /reel-insights, "how are my reels doing", "what's working", "weekly review", or before /reel-ideas and /reel-plan.
metadata:
  tags: analytics, instagram, trends, research
---

# Reel Insights

Needs the Instagram connection from `docs/SETUP.md` (check with `python3 scripts/ig.py check`). If it isn't set up, say so in one line and point to the doc; offer YouTube-only research meanwhile.

## 1. Pull

```bash
cd ~/Projects/reel-studio
npm run weekly          # ig.py sync + ig.py discover + trends.py outliers + trends.py report
```

If the watchlist is empty, ask the user for 10-30 professional accounts in their niche (peers, competitors, accounts their audience follows), add them with `python3 scripts/ig.py watch add ...`, and re-run.

Optionally, for demand outside Instagram (needs `YT_API_KEY`): `python3 scripts/trends.py youtube "<niche query>"` for 2-4 queries from `brand/brand.md`.

## 2. Tag the outliers

Run the `reel-trend-scout` agent in **Mode C (tag)**: it reads `data/outliers.json`, opens what it needs, and writes tags for every untagged outlier via `python3 scripts/trends.py tag <file>`. Then:

```bash
python3 scripts/trends.py formats
```

## 3. Report

Read `insights/report.md` (your reels) and `insights/formats.md` (the niche), and give the user a short review:

1. **Your best and worst reel** this period, and the most likely reason (format, hook, topic, length), using save rate and share rate per reach, not just views.
2. **What's over-performing in the niche**: the top 3 formats or hook types by median score, with 1-2 example posts each.
3. **3 decisions for next week**: make more of X, stop Y, test Z. Each tied to a number.

Tag claims: [Certain] for numbers from the database, [Likely] for patterns with 5+ posts, [Guessing] for fewer. Then offer `/reel-ideas` (ideas built from these signals) or `/reel-plan`.
