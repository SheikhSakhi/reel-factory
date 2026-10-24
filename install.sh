#!/bin/sh
# Installs (or upgrades) the reel-factory skills, agents, and the Remotion studio.
#   skills -> ~/.claude/skills/reel-*
#   agents -> ~/.claude/agents/reel-*.md
#   studio -> ~/Projects/reel-studio (override with REEL_STUDIO_DIR)
# Re-running it upgrades an existing studio: kit, scripts and examples are refreshed (changed
# files are backed up to .backup/<time>/), while your brand, reels, briefs and registry are kept.
set -eu

HERE="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
STUDIO_DIR="${REEL_STUDIO_DIR:-$HOME/Projects/reel-studio}"

command -v node >/dev/null 2>&1 || { echo "Node.js 18+ is required: https://nodejs.org" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 is required" >&2; exit 1; }

mkdir -p "$CLAUDE_DIR/skills" "$CLAUDE_DIR/agents"
for SKILL in "$HERE"/skills/reel-*; do
  NAME="$(basename "$SKILL")"
  rm -rf "$CLAUDE_DIR/skills/$NAME"
  cp -R "$SKILL" "$CLAUDE_DIR/skills/"
done
cp "$HERE"/agents/reel-*.md "$CLAUDE_DIR/agents/"
echo "installed skills + agents into $CLAUDE_DIR"

# Repo-owned studio paths: refreshed on upgrade. Everything else in the studio belongs to the user.
OWNED="src/kit src/index.ts src/Root.tsx src/reels/demo src/reels/series-demo src/edits/docx-split scripts tests
public/vo/series-demo public/assets/series-demo public/edit/docx-split briefs/series-demo remotion.config.ts tsconfig.json README.md"
# Created only when missing (the user customises these).
SEEDED="src/brand brand public/fonts src/reels/registry.ts src/edits/registry.ts ideas plans replies insights/learnings.md insights/history.md insights/daily.md insights/references.md insights/formats-lab.md .gitignore"

if [ ! -d "$STUDIO_DIR" ]; then
  mkdir -p "$(dirname "$STUDIO_DIR")"
  cp -R "$HERE/studio" "$STUDIO_DIR"
  echo "created studio at $STUDIO_DIR"
else
  BACKUP="$STUDIO_DIR/.backup/$(date +%Y%m%d-%H%M%S)"
  for P in $OWNED; do
    [ -e "$HERE/studio/$P" ] || continue
    if [ -e "$STUDIO_DIR/$P" ] && ! diff -rq "$HERE/studio/$P" "$STUDIO_DIR/$P" >/dev/null 2>&1; then
      mkdir -p "$BACKUP/$(dirname "$P")"
      cp -R "$STUDIO_DIR/$P" "$BACKUP/$P"
    fi
    mkdir -p "$STUDIO_DIR/$(dirname "$P")"
    if [ -d "$HERE/studio/$P" ]; then
      # Merge: repo files overwrite, files only the user has (e.g. promoted kit components) stay.
      mkdir -p "$STUDIO_DIR/$P"
      cp -R "$HERE/studio/$P/." "$STUDIO_DIR/$P/"
    else
      cp "$HERE/studio/$P" "$STUDIO_DIR/$P"
    fi
  done
  for P in $SEEDED; do
    [ -e "$STUDIO_DIR/$P" ] || { mkdir -p "$STUDIO_DIR/$(dirname "$P")"; cp -R "$HERE/studio/$P" "$STUDIO_DIR/$P"; }
  done
  # package.json: add new scripts and dependencies, keep the user's.
  node -e '
    const fs = require("fs");
    const [repoPath, userPath] = process.argv.slice(1);
    const repo = JSON.parse(fs.readFileSync(repoPath)), user = JSON.parse(fs.readFileSync(userPath));
    for (const key of ["scripts", "dependencies", "devDependencies"]) user[key] = { ...repo[key], ...user[key] };
    for (const dep of Object.keys(repo.dependencies)) if (dep.startsWith("@remotion/") || dep === "remotion") user.dependencies[dep] = repo.dependencies[dep];
    fs.writeFileSync(userPath, JSON.stringify(user, null, 2) + "\n");
  ' "$HERE/studio/package.json" "$STUDIO_DIR/package.json"
  # registry.ts: add the coverFrame field and the series-demo example if missing.
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    let s = fs.readFileSync(path, "utf8");
    const oldType = /export type ReelEntry = \{[^}]*\};/;
    if (!s.includes("coverFrame?")) {
      s = s.replace(oldType, "export type ReelEntry = {\n  readonly id: string;\n  readonly component: React.FC;\n  readonly durationInFrames: number;\n  /** Frame used as the grid cover (`<id>-cover` still). */\n  readonly coverFrame?: number;\n};");
    }
    if (!s.includes("series-demo")) {
      s = s.replace(/(import[^\n]*\.\/demo\/Reel";\n)/, "$1import { SeriesDemoReel, SERIES_DEMO_COVER, SERIES_DEMO_DURATION } from \"./series-demo/Reel\";\n");
      s = s.replace(/(\{ id: "demo"[^\n]*\n)/, "$1  { id: \"series-demo\", component: SeriesDemoReel, durationInFrames: SERIES_DEMO_DURATION, coverFrame: SERIES_DEMO_COVER },\n");
    }
    fs.writeFileSync(path, s);
  ' "$STUDIO_DIR/src/reels/registry.ts"
  echo "upgraded studio at $STUDIO_DIR (your brand, reels and briefs were kept)"
  [ -d "$BACKUP" ] && echo "  files you had changed were backed up to $BACKUP"
fi

if [ "$STUDIO_DIR" != "$HOME/Projects/reel-studio" ]; then
  find "$CLAUDE_DIR"/skills/reel-* "$CLAUDE_DIR"/agents/reel-*.md -type f -exec \
    sed -i.bak "s|~/Projects/reel-studio|$STUDIO_DIR|g" {} \; -exec rm -f {}.bak \;
fi

cd "$STUDIO_DIR"
npm install --no-audit --no-fund
python3 scripts/sfx.py
if python3 -m pip install --user --quiet --upgrade edge-tts >/dev/null 2>&1 || python3 -c "import edge_tts" 2>/dev/null; then
  echo "edge-tts ready (free voice-overs)"
else
  echo "run 'pip3 install -U edge-tts' to enable voice-overs (on by default)"
fi
if python3 -m pip install --user --quiet --upgrade opencv-python-headless >/dev/null 2>&1 || python3 -c "import cv2" 2>/dev/null; then
  echo "opencv ready (face tracking for /reel-edit)"
else
  echo "optional: pip3 install opencv-python-headless (face tracking for /reel-edit)"
fi
command -v ffmpeg >/dev/null 2>&1 || echo "optional: install ffmpeg (brew install ffmpeg / apt install ffmpeg) to edit your own recordings"
# .gitignore additions for studios created before these files existed
for P in data .env.local .models .whisper __pycache__; do grep -qx "$P" .gitignore 2>/dev/null || echo "$P" >> .gitignore; done
npx tsc --noEmit
python3 -m unittest discover -s tests >/dev/null 2>&1 && echo "tests passed" || echo "warning: studio tests failed (run: npm test)"

echo
echo "Done. Restart Claude Code, then:"
echo "  /reel-brand      set your look, voice and CTA once"
echo "  docs/SETUP.md    connect Instagram + YouTube (one hour, free)"
echo "  /reel-edit       turn your own recording into a reel"
echo "  /reel-ideas      find what's working in your niche"
echo "  /reel-factory    5 mistakes new founders make with AI - 40s"
