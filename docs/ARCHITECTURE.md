# Architecture

Reel Factory is a content system with one loop: **research → make → publish → measure → research**. Claude Code orchestrates it; deterministic scripts do anything that must be exact; one local database remembers everything.

```
                ┌────────────── LEARN ──────────────┐
                │                                   │
  Instagram ──► ig.py sync / discover ──► data/factory.db ──► trends.py ──► insights/*.md, ideas/*.md
  YouTube  ───► trends.py youtube ──────►        ▲                                 │
                                                 │                                 ▼
                                     ig.py publish / keyword            /reel-ideas · /reel-plan
                                                 ▲                                 │
                ┌────────────── MAKE ────────────┴───────────┐                     ▼
                │  your recording ─► edit.py (whisper + align) ─┐            /reel-factory
                │  or a script ───► vo.py (one-take TTS) ───────┼─► take.json ─► agents ─► Remotion ─► MP4 + cover + caption
                └────────────────────────────────────────────────┘
```

## Layers

| Layer | What | Where |
|---|---|---|
| Orchestration | Skills: plain-English runbooks Claude follows (`/reel-factory`, `/reel-edit`, `/reel-ideas`, `/reel-insights`, `/reel-adapt`, `/reel-plan`, `/reel-replies`, `/reel-brand`) | `skills/` |
| Judgement | 8 agents: fresh Claude instances with one role each. They share files, not memory. | `agents/` |
| Exact work | Scripts: transcription, alignment, cutting, TTS, rendering checks, Instagram and YouTube APIs, statistics | `studio/scripts/` |
| Memory | SQLite: own reels + insights, watched accounts, outliers + tags, comments, YouTube | `studio/data/factory.db` |
| Knowledge | Markdown the agents read: brand, formats, outliers, what works, your report | `brand/`, `ideas/`, `insights/`, `skills/reel-factory/formats.md` |
| Rendering | Remotion (React → headless Chrome → ffmpeg), brand kit components | `studio/src/` |

## The four engines

**1. Own-footage editor** (`/reel-edit`, `scripts/edit.py`)
Normalise (H.264, constant 30 fps, denoise, -14 LUFS) → transcribe locally (whisper.cpp) → re-time words against the audio (`align.py`: speech regions, ordered assignment, snap cuts to the quietest 10 ms) → editable transcript with retakes and fillers pre-cut → `apply` writes the cut list and a `take.json` on the edited timeline → `verify` re-transcribes the result and diffs it with the edit → `TalkingHead` renders it reframed to 9:16 around the face (OpenCV YuNet), with punch-in zooms on cuts, and the brand kit on top.
Precision: cuts at pauses (retakes, dead air, whole sentences) are exact; removing one word inside a fluent phrase is approximate, and `verify` flags it.

**2. Instagram connector** (`scripts/ig.py`, official Graph API, Facebook Login path)
Publish (resumable upload, cover frame by offset), insights per reel, comments, public replies, private replies (comment → DM, one per comment within 7 days), Business Discovery for a watchlist, hashtag top media. Everything that posts or sends is a dry run unless `--yes`.

**3. Trend research** (`trends.py outliers`, `youtube`)
A post's score = its views (or likes + 3 × comments) ÷ the median of the same account's posts. Outliers ≥ 2× in the last 45 days are trend signals; YouTube Shorts add demand outside Instagram. The trend scout tags each outlier (topic, format, hook, proof, CTA).

**4. Format research** (`trends.py formats`, `report`)
Tags aggregated by median score show which formats, hook types and proof types over-perform in your niche; `report` shows the same for your own reels (save and share rates per reach). The researcher and scriptwriter read both before writing.

## Trust boundaries

- Secrets live in `studio/.env.local` (mode 600, git-ignored). Nothing is committed.
- Publishing, replies and DMs require `--yes`, and the skills ask you first, every batch.
- Only official APIs. No scraping (Instagram's terms; account risk). Reference reels are analysed, never reused.
- Medical rule: education only, no individual advice, in reels, captions and replies.
