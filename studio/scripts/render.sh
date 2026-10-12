#!/bin/sh
# Usage: npm run render -- <CompositionId>
set -eu
ID="${1:?usage: npm run render -- <CompositionId>}"
mkdir -p out
npx remotion render src/index.ts "$ID" "out/$ID.mp4" --codec=h264 --crf=18
echo "rendered out/$ID.mp4"
