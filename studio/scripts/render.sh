#!/bin/sh
# Usage: npm run render -- <CompositionId>
# Renders out/<id>.mp4 and, when the reel has a coverFrame, out/<id>-cover.jpg for the profile grid.
set -eu
ID="${1:?usage: npm run render -- <CompositionId>}"
mkdir -p out
npx remotion render src/index.ts "$ID" "out/$ID.mp4" --codec=h264 --crf=18
echo "rendered out/$ID.mp4"
if grep -q "id: \"$ID\".*coverFrame" src/reels/registry.ts; then
  npx remotion still src/index.ts "$ID-cover" "out/$ID-cover.jpg" --image-format=jpeg --jpeg-quality=92 >/dev/null
  echo "rendered out/$ID-cover.jpg"
else
  echo "no coverFrame for $ID in registry.ts: no cover rendered"
fi
