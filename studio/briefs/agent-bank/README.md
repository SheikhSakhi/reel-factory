# agent-bank · «Банк для агентов» (16:9, ~2:36, presentation opener)

Opening video for a live presentation: the agent economy → agents need their own
financial instruments → trust needs memory → Treint → live demo.

- Voice: `ru-RU-DmitryNeural`, rate +0%, one take from `vo-take.txt`.
  "ИИ" is spelled "И И" / "И. И." so the voice says both letters; captions glue it back to "ИИ".
- Canvas: 1920x1080, 30 fps. Composition id `agent-bank`.
- Fonts (Unbounded, Manrope, JetBrains Mono, Cyrillic + Latin) are stored in `public/fonts/agent-bank/`.
- Music and SFX are synthesized by `audio.py` from the word timings in `take.json`
  (score sections, risers and impacts land on spoken words; music is ducked under the voice).

## Rebuild

```bash
python3 scripts/vo.py agent-bank --voice ru-RU-DmitryNeural --rate +0% --hold 2.5
python3 briefs/agent-bank/audio.py      # needs numpy + scipy
npm run render -- agent-bank
```

## Facts on screen

- AI agents market: ≈$5B (2024), ≈$8B (2025), forecast CAGR 46.3% to 2030 (MarketsandMarkets).
- Up to $3–5T of purchases orchestrated by agents by 2030, goods only (McKinsey, Oct 2025).
- First live agent-initiated payments: Mastercard Agent Pay (Hong Kong, Thailand).
- Patient history, receipts and limits on screen are illustrative.

## English version (`agent-bank-en`)

Same scenes, English voice-over and on-screen text.

- Voice: `en-US-AndrewMultilingualNeural`, rate +0%, take in `briefs/agent-bank-en/vo-take.txt`.
  "Treint" is spelled "Tre-int" so the voice says two syllables; captions show "Treint".
- Scene code keys word anchors and strings by the Russian original:
  `src/reels/agent-bank/anchors-en.json` maps each anchor to the English word, `EN_TEXT` in `lang.tsx` holds the strings.
  A missing anchor or string throws at render time instead of shipping Russian text.

```bash
python3 scripts/vo.py agent-bank-en --voice en-US-AndrewMultilingualNeural --rate +0% --hold 2.5
python3 briefs/agent-bank/audio.py agent-bank-en
npm run render -- agent-bank-en
```
