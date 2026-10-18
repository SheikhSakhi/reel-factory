# 07 · Delivery

- Final: `studio/out/ai-terms-one-patient-master.mp4` (not committed, 255 MB). 1080×1920, 30 fps, H.264 CRF 16, AAC 256k, 5:11, −16 LUFS / −1.5 dBTP.
- Rebuild: `sh scripts/render-film.sh ai-terms-one-patient` (~2.5 h on 4 CPU cores). Captioned variant: composition `ai-terms-one-patient-captioned`.
- QA: `06-qa.md` (independent review, FAIL on first pass). Blocking items 1–6 fixed and re-verified at the flagged frames before the final render; minor items 9 (some beat/world overlaps), 12 (f0 black preroll) and part of 8 remain.

## Known limitations
- Voice-over is a scratch track (edge-tts en-US-AndrewNeural, stock voice). Replace: cut the recording into `public/vo/ai-terms-one-patient/B01..B44.mp3`, run `python3 scripts/narration.py ai-terms-one-patient --measure`, then `python3 scripts/score.py ai-terms-one-patient`, re-render.
- Chest radiograph is procedurally drawn and labelled illustrative; DL layer planes are labelled conceptual.
- Records and discharge document are fictional; one draft sentence is intentionally unsupported for the caution act.
- Score and effects are procedurally synthesized; no licensed music.
