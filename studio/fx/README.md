# fx: 45 face-tracked video effects

Vendored from [Vibha-Ramprakash/claude-video-effects](https://github.com/Vibha-Ramprakash/claude-video-effects) at commit `99c9a33` (MIT, see `LICENSE`; model and font licences in `models/NOTICE.md` and `fonts/`).

Changes from upstream: the hook that `exec()`s an optional `scripts/fx_private.py` is removed; `scripts/words.py` is dropped (the studio transcribes with whisper.cpp).

The effect list and every option: [EFFECTS.md](EFFECTS.md). In the factory you don't call `fx.py` directly: add an `fx` list to `public/edit/<slug>/plan.json` and `scripts/edit_render.py` applies it (see `skills/reel-edit/SKILL.md`).

Setup (once): `npm run fx:setup` (Python 3.10-3.12, installs numpy, opencv, pillow, mediapipe into `fx/.venv`).
