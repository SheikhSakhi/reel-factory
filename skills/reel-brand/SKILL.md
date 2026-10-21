---
name: reel-brand
description: Set up (or change) the account's fixed brand kit for reel-factory once: palette, fonts, headline highlight, series chrome, caption style, voice, proof points, CTA keyword and lead magnets. Every reel then uses it, so the account is recognisable before anyone reads a word. Use when the user says /reel-brand, "set up my brand", "change my reel style/colours/fonts", or before the first /reel-factory run.
metadata:
  tags: video, reels, brand, design-system
---

# Reel Brand

Writes `~/Projects/reel-studio/brand/brand.md` (decisions every agent reads) and `src/brand/brand.ts` (the code every reel imports). Takes about 2 minutes. Consistency beats novelty: change the brand rarely.

## 1. Gather (one round of questions, with defaults)

Read the current `brand/brand.md` first and only ask what is missing. Ask in ONE message (AskUserQuestion if available):

1. **Account**: name, handle, language.
2. **Niche and audience**: "who do you help with what?" one line.
3. **Proof points**: 2-4 true, specific credibility facts the hooks can use (results, credentials, numbers). Say they will appear on screen, so they must be accurate.
4. **Look**: offer 4 directions, or "match my logo / existing posts" (ask them to drop images in `public/assets/brand/` and Read them to pick colours):
   - **Paper & ink**: warm cream, near-black, one hot accent, serif headlines (Instrument Serif / Inter)
   - **Clinical clean**: white, deep navy, teal accent, geometric sans (Manrope / Inter)
   - **Night mode**: near-black, off-white, electric accent, grotesk (Space Grotesk / Inter)
   - **Editorial**: off-white, black, red accent, high-contrast serif (Fraunces / Inter)
5. **CTA**: default comment keyword, and what a commenter receives (a link, PDF, checklist). If nothing exists yet, the default CTA is "save", and keyword DMs stay off until a lead magnet exists.
6. **Voice**: run `npm run vo -- --samples`, send the 4 MP3s from `out/voice-samples/` and ask which one to use (skip if already set).

## 2. Build

1. **Fonts**: vendor every family in ONE call (it rewrites the manifest). Use the `cyrillic` / `greek` / `vietnamese` subsets when the language needs them:
   ```bash
   cd ~/Projects/reel-studio && npm run fonts -- "Instrument Serif:400,400i" "Inter:500,600,700" "JetBrains Mono:500"
   ```
   The display font needs an italic if the highlight is `italic`. Keep a mono font for the chrome.
2. **Palette check**: compute contrast ratios: fg on bg ≥ 7:1, muted on bg ≥ 4.5:1, accent on bg ≥ 3:1, bg on accent ≥ 4.5:1 (the CTA button text), and for `alt`: fg ≥ 7:1, muted ≥ 4.5:1, accent ≥ 3:1. Adjust until they pass.
3. **Write `src/brand/brand.ts`**, keeping the file's structure: `loadLocalFonts(manifest)`, the theme (font stacks via `stack()`), `alt`, `highlight`, `chrome` (counter, chapter label word such as "STEP" / "TIP" / "MYTH" / "SKILL", tabs, progressBar), `captions`, `cta`.
4. **Write `brand/brand.md`**: replace the starter text, fill every section, and delete the line "This is the starter brand".
5. `npx tsc --noEmit` must pass.

## 3. Preview and approve

The `series-demo` reel is built entirely from `BRAND`, so it previews the new look:

```bash
cd ~/Projects/reel-studio && sh scripts/qa-frames.sh series-demo 40 250 400 520 820 960
```

Combine the stills into one contact sheet if Python's PIL is available, and send it with SendUserFile. Ask: "Lock this brand?" Iterate on their feedback (colour, font, highlight style) until they approve.

## Notes

- Existing reels import `BRAND`, so re-rendering an old reel applies the new brand. That is usually what you want. To freeze an old reel, copy the old theme into its Reel.tsx before changing the brand.
- Only list lead magnets that exist. The caption writer and QA refuse keyword DM CTAs for anything else.
