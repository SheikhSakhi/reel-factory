"""Build a long-form narration timeline from a locked script.

Usage: python3 scripts/narration.py <slug> [--placeholder]

Reads:
  briefs/<slug>/00-narration-locked.txt  the approved narration (never edited here)
  briefs/<slug>/vo-plan.json             voice, rate, and blocks: contiguous sentence
                                         ranges plus the silence after each block

Verifies the blocks cover every sentence exactly once and in order, then synthesizes
one clip per block with edge-tts (word boundaries included) and writes
public/vo/<slug>/<block>.mp3 and src/reels/<slug>/timing.json: the timing master
every scene, caption and sound cue reads from.

--placeholder skips synthesis and estimates durations at 2.4 words/s, so the film can
be laid out before any voice exists. Its manifest is marked "placeholder": true.

To swap in a recorded voice-over later, cut the recording into the same block files
(same names), then re-run with --measure to keep the recorded durations.
"""
import asyncio
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import edge_tts

TICKS_PER_SECOND = 10_000_000
SENTENCE = re.compile(r"[^.?!]+[.?!]”?(?:\s|$)")


def split_sentences(text: str) -> list[str]:
    return [s.strip() for s in SENTENCE.findall(text.replace("\n", " "))]


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    return float(out.strip())


async def synth(text: str, voice: str, rate: str, out_path: Path) -> list[dict]:
    communicate = edge_tts.Communicate(
        text, voice, rate=rate, boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"),
    )
    words = []
    with out_path.open("wb") as audio:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "word": chunk["text"],
                    "start": round(chunk["offset"] / TICKS_PER_SECOND, 3),
                    "end": round((chunk["offset"] + chunk["duration"]) / TICKS_PER_SECOND, 3),
                })
    return words


async def synth_checked(text: str, voice: str, rate: str, path: Path) -> tuple[list[dict], float]:
    """Synthesize with a cache and a completeness check (the stream can drop mid-clip)."""
    sidecar = path.with_suffix(".json")
    key = {"text": text, "voice": voice, "rate": rate}
    if path.exists() and sidecar.exists():
        cached = json.loads(sidecar.read_text())
        if cached["key"] == key:
            return cached["words"], duration(path)
    n_words = len(text.split())
    for attempt in range(5):
        words = await synth(text, voice, rate, path)
        dur = duration(path) if path.stat().st_size else 0.0
        if words and len(words) >= n_words - 2 and dur >= words[-1]["end"]:
            sidecar.write_text(json.dumps({"key": key, "words": words}, ensure_ascii=False))
            return words, dur
        print(f"  incomplete clip ({len(words)}/{n_words} words, {dur:.2f}s), retry {attempt + 1}")
    sys.exit(f"could not synthesize a complete clip for: {text[:60]}")


def estimate_words(text: str) -> tuple[list[dict], float]:
    words, t = [], 0.0
    for w in text.split():
        d = 0.18 + 0.045 * len(w)
        words.append({"word": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d + (0.35 if w[-1] in ".?!:" else 0.12 if w[-1] in ",—" else 0.04)
    return words, round(t, 3)


async def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit("usage: python3 scripts/narration.py <slug> [--placeholder|--measure]")
    slug = args[0]
    placeholder = "--placeholder" in sys.argv
    measure = "--measure" in sys.argv
    root = Path(__file__).resolve().parent.parent
    brief = root / "briefs" / slug
    plan = json.loads((brief / "vo-plan.json").read_text())
    sentences = split_sentences((brief / "00-narration-locked.txt").read_text())

    expected = 0
    for block in plan["blocks"]:
        first, last = block["sentences"]
        if first != expected or last < first:
            sys.exit(f"{block['id']}: sentences {first}-{last} break the locked order (expected start {expected})")
        expected = last + 1
    if expected != len(sentences):
        sys.exit(f"plan covers {expected} sentences, narration has {len(sentences)}")

    out_dir = root / "public" / "vo" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    cursor = plan.get("preroll", 0.4)
    rows = []
    for block in plan["blocks"]:
        first, last = block["sentences"]
        text = " ".join(sentences[first:last + 1])
        path = out_dir / f"{block['id']}.mp3"
        if placeholder:
            words, dur = estimate_words(text)
        elif measure:
            words, dur = [], duration(path)
        else:
            words, dur = await synth_checked(text, plan["voice"], plan["rate"], path)
        rows.append({
            "id": block["id"], "act": block["act"], "text": text,
            "file": None if placeholder else f"vo/{slug}/{block['id']}.mp3",
            "start": round(cursor, 3), "duration": round(dur, 3),
            "words": [{**w, "start": round(cursor + w["start"], 3), "end": round(cursor + w["end"], 3)} for w in words],
        })
        print(f"{block['id']} {cursor:7.2f}s +{dur:5.2f}s  {text[:70]}")
        cursor += dur + block["gap"]
    total = cursor + plan.get("tail", 4.0)

    manifest = {
        "slug": slug, "voice": plan["voice"], "rate": plan["rate"], "placeholder": placeholder,
        "fps": 30, "durationSeconds": round(total, 3), "blocks": rows,
    }
    target = root / "src" / "reels" / slug / "timing.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
    print(f"total {total:.2f}s ({round(total * 30)} frames) -> {target.relative_to(root)}")


if __name__ == "__main__":
    asyncio.run(main())
