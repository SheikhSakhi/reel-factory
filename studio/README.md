# reel-studio

Code-animated 9:16 reels built by the `/reel-factory` agent team in Claude Code.

- `npm run studio`: live editor/preview
- `npm run render -- <id>`: render to `out/<id>.mp4`
- `npm run qa -- <id> [frames]`: QA stills in `out/qa/<id>/`
- `npm run sfx`: regenerate the local SFX library

Layout: `src/kit` (shared animation components), `src/reels/<slug>` (one folder per reel), `briefs/<slug>` (research, script, style, sound, QA notes).
