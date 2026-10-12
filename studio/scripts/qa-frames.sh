#!/bin/sh
# Usage: npm run qa -- <CompositionId> [frame ...]
# Renders stills at the given frames (default: 6 evenly spaced) into out/qa/<id>/ for visual review.
set -eu
ID="${1:?usage: npm run qa -- <CompositionId> [frames...]}"
shift
DIR="out/qa/$ID"
mkdir -p "$DIR"
if [ "$#" -eq 0 ]; then
  TOTAL=$(npx remotion compositions src/index.ts --quiet 2>/dev/null | awk -v id="$ID" '$1==id {print $4}')
  TOTAL="${TOTAL:-300}"
  set -- $(awk -v n="$TOTAL" 'BEGIN { for (i = 0; i < 6; i++) printf "%d ", int((n - 1) * (i + 0.5) / 6) }')
fi
for F in "$@"; do
  npx remotion still src/index.ts "$ID" "$DIR/f$(printf '%04d' "$F").jpg" --frame="$F" --image-format=jpeg --scale=0.5 >/dev/null
  echo "$DIR/f$(printf '%04d' "$F").jpg"
done
