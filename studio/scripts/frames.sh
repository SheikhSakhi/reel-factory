#!/bin/sh
# Usage: npm run frames -- <video file> <name> [fps]
# Samples a reference reel into out/teardown/<name>/ (stills at <fps> per second, default 2,
# plus audio.mp3 and a word-timed transcript, words.json) so the trend scout can study its structure. Uses ffmpeg if installed,
# otherwise Remotion's bundled one (which has no filters, so it assumes a 9:16 source).
set -eu
SRC="${1:?usage: npm run frames -- <video> <name> [fps]}"
NAME="${2:?give the teardown a name}"
FPS="${3:-2}"
DIR="out/teardown/$NAME"
mkdir -p "$DIR"
if command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -hide_banner -loglevel error -y -i "$SRC" -vf "fps=$FPS,scale=540:-2" -q:v 4 "$DIR/f_%03d.jpg"
  ffmpeg -hide_banner -loglevel error -y -i "$SRC" -vn -ac 1 -b:a 64k "$DIR/audio.mp3" || echo "no audio track"
  ffmpeg -hide_banner -loglevel error -y -i "$SRC" -vn -ac 1 -ar 16000 "$DIR/audio16k.wav" 2>/dev/null || true
else
  npx remotion ffmpeg -hide_banner -loglevel error -y -i "$SRC" -r "$FPS" -s 540x960 -q:v 4 "$DIR/f_%03d.jpg"
  npx remotion ffmpeg -hide_banner -loglevel error -y -i "$SRC" -vn -ac 1 -b:a 64k "$DIR/audio.mp3" || echo "no audio track"
  npx remotion ffmpeg -hide_banner -loglevel error -y -i "$SRC" -vn -ac 1 -ar 16000 "$DIR/audio16k.wav" 2>/dev/null || true
fi
if [ -f "$DIR/audio16k.wav" ]; then
  node scripts/transcribe.mjs "$DIR/audio16k.wav" "$DIR/words.json" --model "${WHISPER_MODEL:-base}" || echo "transcription failed (see above)"
fi
COUNT=$(ls "$DIR"/f_*.jpg | wc -l | tr -d ' ')
echo "$COUNT stills at ${FPS}/s in $DIR (f_001 = 0.0s, each next = +$(awk -v f="$FPS" 'BEGIN{print 1/f}')s)"
