# Reel formats

The scriptwriter picks ONE format per reel and names it at the top of `02-script.md`. QA checks the reel against that format's rules. Every format shares the hook rule.

## The hook rule (all formats, enforced by QA)

The first 3 seconds (frame 0-90) must contain:

1. **A promise**: a specific outcome, usually with a number. "1 month of reels with 5 Claude skills", not "how I make content".
2. **A proof**: why the viewer should believe it. Results ("posted 236 times, 2.4M views"), credentials ("neurosurgeon, 12 years"), or a visible demo. It must be TRUE and come from the user or `01-research.md`. If there is no proof, say so and use a visible demo in scene 1 instead. Never invent one.
3. **Readable by frame 20**: the hook headline is fully on screen by frame ~20 (it also becomes the grid cover).

No logos, no greetings, no "in this video". Scene 1 starts mid-thought.

## Progress devices

Viewers stay when they can see how much is left. Use at least one in every format with 3+ parts:

- `SeriesChrome` counter ("03 / 08") and chapter label ("SKILL 2 OF 5")
- `SeriesChrome` tab bar with chapter names (list formats, max 6 short words)
- The hook names the count ("5 skills"), and the voice says "number two", "and the last one"
- A progress bar along the top (brand setting)

## Formats

### 1. Numbered list ("5 tools that…")
- **Best for:** tools, tips, mistakes, resources. Highest save rate.
- **Shape:** hook (count + promise + proof) → one scene per item → recap flash (all items on one screen, 1.5s) → CTA.
- **Length:** 3-7 items, 30-60s with voice.
- **Progress:** tabs + "ITEM n OF N" label. Each item scene shows the item's name, what it does, and one concrete proof (a screenshot, a number with a source, or a 2-step demo).
- **Save driver:** the recap screen. Tell viewers to "save this" in the voice-over during the recap.

### 2. Before / after
- **Best for:** transformations, workflow upgrades, "old way vs new way".
- **Shape:** hook (the after result) → before (the pain, concrete) → the switch (1 move) → after (same frame layout as before, so the change is obvious) → how → CTA.
- **Rule:** before and after must use the same composition, side by side or wiped, so the difference is visual.

### 3. Myth vs fact
- **Best for:** expert accounts (medical, legal, finance, fitness). Builds authority fast.
- **Shape:** hook ("3 things you've been told about X that are wrong") → per myth: myth card (struck through on the beat) → fact card with source tag → CTA.
- **Rule:** every fact cites a source in `01-research.md`. Medical, legal or financial claims stay general education, never individual advice.

### 4. Tutorial / how-to
- **Best for:** "how I do X in 3 steps", software walkthroughs.
- **Shape:** hook (the finished result first) → steps with real screen recordings or screenshots (`ProofShot` with a highlight box on the click) → result again → CTA.
- **Rule:** show the result in the first 3 seconds, then how. Never make viewers wait for the payoff.

### 5. Story / case
- **Best for:** founder stories, patient-journey explainers (anonymised), lessons learned.
- **Shape:** hook (the moment of tension) → context (1 scene) → turn → lesson → CTA.
- **Rule:** one specific moment, with names, numbers and a place. Composite or anonymised cases must say so on screen.

### 6. Hot take / contrarian
- **Best for:** reach and comments. Lower save rate.
- **Shape:** hook (the take, stated flat) → 2-3 reasons with proof → the nuance → CTA asking for the viewer's view.
- **Rule:** the take must be defensible with the research. Contrarian without proof reads as bait.

## Picking a format

| The idea is… | Use |
|---|---|
| a set of tools, tips or resources | Numbered list |
| a change in how something is done | Before / after |
| correcting common beliefs | Myth vs fact |
| a process the viewer can copy | Tutorial |
| something that happened | Story |
| an opinion the audience will argue with | Hot take |

## CTA patterns

- **Keyword DM** (best for leads): "Comment SKILLS and I'll DM you the list." Only use it when there is a real thing to send (`brand/brand.md` → lead magnets) and someone, or an automation such as ManyChat, will send it. A keyword CTA that is never fulfilled costs trust.
- **Save** (best for list and tutorial formats): "Save this for your next ___."
- **Follow for part 2** (series): only if part 2 is planned in `plans/`.
- **Comment your answer** (hot takes): a question with an easy one-word answer.

Use one CTA per reel. The caption repeats it.
