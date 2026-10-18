#!/bin/sh
# Installs the reel-factory skill, its 6 agents, and the Remotion studio.
#   skill  -> ~/.claude/skills/reel-factory
#   agents -> ~/.claude/agents/reel-*.md
#   studio -> ~/Projects/reel-studio (override with REEL_STUDIO_DIR)
set -eu

HERE="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
STUDIO_DIR="${REEL_STUDIO_DIR:-$HOME/Projects/reel-studio}"

command -v node >/dev/null 2>&1 || { echo "Node.js 18+ is required: https://nodejs.org" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 is required" >&2; exit 1; }

mkdir -p "$CLAUDE_DIR/skills" "$CLAUDE_DIR/agents"
rm -rf "$CLAUDE_DIR/skills/reel-factory"
cp -R "$HERE/skills/reel-factory" "$CLAUDE_DIR/skills/"
cp "$HERE"/agents/reel-*.md "$CLAUDE_DIR/agents/"
echo "installed skill + agents into $CLAUDE_DIR"

if [ -d "$STUDIO_DIR" ]; then
  echo "studio already exists at $STUDIO_DIR (left untouched)"
else
  mkdir -p "$(dirname "$STUDIO_DIR")"
  cp -R "$HERE/studio" "$STUDIO_DIR"
  echo "created studio at $STUDIO_DIR"
fi

if [ "$STUDIO_DIR" != "$HOME/Projects/reel-studio" ]; then
  find "$CLAUDE_DIR/skills/reel-factory" "$CLAUDE_DIR"/agents/reel-*.md -type f -exec \
    sed -i.bak "s|~/Projects/reel-studio|$STUDIO_DIR|g" {} \; -exec rm -f {}.bak \;
fi

cd "$STUDIO_DIR"
npm install --no-audit --no-fund
python3 scripts/sfx.py
if python3 -m pip install --user --quiet --upgrade edge-tts >/dev/null 2>&1; then
  echo "installed edge-tts (free voice-overs)"
else
  echo "optional: run 'pip3 install -U edge-tts' to enable voice-overs"
fi
npx tsc --noEmit

echo
echo "Done. Restart Claude Code, then try:"
echo "  /reel-factory 3 habits that make you better at chess - 20s, CTA 'follow for more'"
