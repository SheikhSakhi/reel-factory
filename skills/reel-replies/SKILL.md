---
name: reel-replies
description: Draft replies to a reel's comments and DMs in the brand voice — keyword DMs with the lead magnet, answers to questions, short thanks, and what to ignore — for the user to approve and send. Use when the user says /reel-replies, pastes comments or DMs, or asks "help me reply to my comments".
metadata:
  tags: social, community, replies, dm
---

# Reel Replies

Drafts only. **Never send, like, delete or hide anything on the user's behalf** unless they explicitly approve that exact batch and a connected tool can do it.

## 1. Get the comments

In order of preference:
1. **The connector** (when `.env.local` exists): `python3 scripts/ig.py comments <slug>` writes `replies/<slug>-comments.json` with every comment and whether it was handled.
2. The user pastes comments or DMs, or drops a screenshot or CSV export in `replies/`.
3. A browser tool on the user's own account, read-only.

Also read `brand/brand.md` (voice, lead magnets, rules) and the reel's `briefs/<slug>/07-caption.md` (keyword, DM text).

## 2. Triage and draft

Write `replies/<slug>-<YYYY-MM-DD>.md` with one row per comment:

| Type | Draft |
|---|---|
| **Keyword** (the reel's CTA word, any case or misspelling) | public reply (rotate the 3 variations from `07-caption.md`) + the DM text with the lead magnet |
| **Question** | a short, specific public answer; if it needs more than 2 lines, a reply that invites a DM, plus the DM answer |
| **Praise** | short and personal, referencing what they said. Not "Thanks! 🙏" every time. |
| **Objection / disagreement** | acknowledge, give the source or reasoning once, no arguing |
| **Personal medical, legal or financial situation** | no individual advice: an empathetic reply pointing to a professional or a consultation channel. Flag it for the user. |
| **Spam, abuse, bots** | "ignore" (and suggest hide/report); never engage |
| **Lead / partnership** | flag at the top for the user; draft a reply asking for email |

Put flagged items (leads, sensitive, negative) first. Then: the keyword count (how many people asked for the lead magnet), the most common questions (these are next reel ideas: offer to append them to `ideas/backlog.md`), and the batch of drafts.

## 3. Sending (only after approval)

- **Keyword comments**: `python3 scripts/ig.py keyword <slug>` shows who asked and what each gets (dry run). After the user approves that batch, run it with `--yes`: one private DM per commenter (Meta allows one per comment, within 7 days) plus a varied public reply. Already-handled comments are never messaged twice.
- **Other approved drafts**: `python3 scripts/ig.py reply <comment_id> "<text>" --yes`.
- Until the app has passed App Review (`docs/SETUP.md` step 7), private replies only reach people with a role on the app. For DMs to the public meanwhile, use a Meta-approved partner (e.g. ManyChat) with the trigger set and DM text from `07-caption.md`; `ig.py keyword` can still post the public replies.
- Never DM someone who didn't ask (no keyword, no question). Mass DMs trip spam limits.
