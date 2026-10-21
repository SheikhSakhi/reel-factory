---
name: reel-ideas
description: Find reel ideas that are already working in the user's niche and add scored, format-tagged ideas (hook, proof, CTA, effort) to the studio's idea backlog. Use when the user says /reel-ideas, "what should I post", "find trending ideas in my niche", or "I need content ideas".
metadata:
  tags: video, reels, ideas, trends, research
---

# Reel Ideas

1. Check `~/Projects/reel-studio/brand/brand.md`. If the niche is still the placeholder, ask for it in one line (or offer `/reel-brand`).
2. Run the `reel-trend-scout` agent in **Mode A (ideas)** with: the niche and audience, the user's focus if any (e.g. "AI for clinicians", "patient education"), and the count (default 10).
3. When it returns, show the top 5 as a short table: title · format · hook · score. Give the path to `ideas/backlog.md` for the rest.
4. Offer the next steps in one line: "Make #1 now (`/reel-factory`), plan the week (`/reel-plan`), or adapt a reference reel for one of these (`/reel-adapt <url>`)?"

Rules:
- Ideas must fit the brand's rules (e.g. education, not individual advice, for medical accounts).
- Every "why now" signal has a source. No invented view counts.
- An idea whose hook needs proof the brand does not have is marked "needs proof: …" rather than dropped. The user may have it.
