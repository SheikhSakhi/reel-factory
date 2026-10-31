#!/bin/sh
# Usage: npm run render -- <CompositionId>
# Renders out/<id>.mp4 and, when the reel has a coverFrame, out/<id>-cover.jpg for the profile grid.
set -eu
ID="${1:?usage: npm run render -- <CompositionId>}"
mkdir -p out
npx remotion render src/index.ts "$ID" "out/$ID.mp4" --codec=h264 --crf=18
# Instagram plays at about -14 LUFS: normalise the mix so quiet synthetic voices don't come out too soft.
if command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -hide_banner -loglevel error -y -i "out/$ID.mp4" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k "out/$ID.norm.mp4" \
    && mv "out/$ID.norm.mp4" "out/$ID.mp4"
fi
echo "rendered out/$ID.mp4"
if grep -q "id: \"$ID\".*coverFrame" src/reels/registry.ts; then
  npx remotion still src/index.ts "$ID-cover" "out/$ID-cover.jpg" --image-format=jpeg --jpeg-quality=92 >/dev/null
  echo "rendered out/$ID-cover.jpg"
else
  echo "no coverFrame for $ID in registry.ts: no cover rendered"
fi
