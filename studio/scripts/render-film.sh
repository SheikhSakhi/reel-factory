#!/bin/sh
# Render a long-form film and master its soundtrack.
# Usage: sh scripts/render-film.sh <CompositionId> [extra remotion flags]
#   e.g. sh scripts/render-film.sh ai-terms-one-patient
#        sh scripts/render-film.sh ai-terms-one-patient --frames=3200-3900 --scale=0.5   (motion preview)
# Output: out/<id>.mp4 (raw render) and out/<id>-master.mp4 (audio normalised to -16 LUFS, -1.5 dBTP;
# video stream copied, not re-encoded).
set -eu
ID="${1:?usage: sh scripts/render-film.sh <CompositionId> [remotion flags]}"
shift
OUT="out/$ID.mp4"
case "$*" in *--frames=*) OUT="out/$ID-preview-$(printf '%s' "$*" | sed 's/.*--frames=\([0-9-]*\).*/\1/').mp4" ;; esac
mkdir -p out
# swangle = software WebGL, so the render is identical on machines without a GPU.
npx remotion render src/index.ts "$ID" "$OUT" --codec=h264 --crf=16 --pixel-format=yuv420p \
  --gl=swangle --concurrency="${CONCURRENCY:-4}" --audio-codec=aac --audio-bitrate=256k "$@"

MASTER="${OUT%.mp4}-master.mp4"
# Two-pass EBU R128 loudness normalisation of the mixed soundtrack.
STATS=$(ffmpeg -hide_banner -nostats -i "$OUT" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { printf '%s' "$STATS" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
ffmpeg -y -hide_banner -loglevel error -i "$OUT" -c:v copy \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" \
  -ar 48000 -c:a aac -b:a 256k -movflags +faststart "$MASTER"
echo "rendered $OUT"
echo "mastered $MASTER"
