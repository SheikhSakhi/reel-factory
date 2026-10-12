"""Synthesize voice-over with edge-tts.

Usage: python3 scripts/vo.py <slug> [voice] [rate] [--take]

Per-scene mode (default): reads briefs/<slug>/vo-lines.json ({"S1": "text", ...})
and writes public/vo/<slug>/<scene>.mp3 plus timings.json with each clip's
duration and word boundaries (seconds).

Single-take mode (--take): reads briefs/<slug>/vo-take.txt, one continuous text
with [S1], [S2]... scene markers. Synthesizes it in ONE pass (natural intonation
across sentences) to public/vo/<slug>/take.mp3 and writes take.json with every
word's timing plus each scene's first/last word times, for cutting scenes.
"""
import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts

DEFAULT_VOICE = "en-US-AndrewNeural"
DEFAULT_RATE = "+0%"
TICKS_PER_SECOND = 10_000_000


def clip_duration(path: Path) -> float:
    """Read the mp3 duration with macOS afinfo (no ffmpeg needed)."""
    out = subprocess.run(["afinfo", str(path)], capture_output=True, text=True, check=True).stdout
    for line in out.splitlines():
        if "estimated duration" in line:
            return float(line.split(":")[1].split()[0])
    raise RuntimeError(f"could not read duration of {path}")


async def synth(text: str, voice: str, rate: str, out_path: Path) -> list[dict]:
    communicate = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
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


MARKER = re.compile(r"\[(S\d+)\]")


def normalize(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


def split_scenes(take_text: str) -> list[tuple[str, str]]:
    parts = MARKER.split(take_text)
    # parts: [prefix, "S1", text1, "S2", text2, ...]
    scenes = [(parts[i], parts[i + 1].strip()) for i in range(1, len(parts) - 1, 2)]
    if not scenes:
        raise ValueError("vo-take.txt has no [S1]-style scene markers")
    return scenes


def assign_scenes(scenes: list[tuple[str, str]], words: list[dict]) -> list[dict]:
    """Walk the boundary list in order and attach each word to its scene.

    A scene starts at the first boundary matching the scene's first word, found
    after the previous scene's start. Throws if any scene cannot be located.
    """
    starts = []
    cursor = 0
    for scene, text in scenes:
        first = normalize(text.split()[0])
        while cursor < len(words) and normalize(words[cursor]["word"]) != first:
            cursor += 1
        if cursor >= len(words):
            raise ValueError(f"could not find start of {scene} ('{first}') in word boundaries")
        starts.append(cursor)
        cursor += 1

    result = []
    for idx, (scene, text) in enumerate(scenes):
        begin = starts[idx]
        end = starts[idx + 1] if idx + 1 < len(starts) else len(words)
        scene_words = words[begin:end]
        result.append({
            "scene": scene,
            "text": text,
            "start": scene_words[0]["start"],
            "end": scene_words[-1]["end"],
            "words": scene_words,
        })
    return result


async def synth_take(root: Path, slug: str, voice: str, rate: str) -> None:
    take_path = root / "briefs" / slug / "vo-take.txt"
    if not take_path.exists():
        sys.exit(f"missing {take_path}")
    take_text = take_path.read_text().strip()
    scenes = split_scenes(take_text)
    spoken = " ".join(text for _, text in scenes)

    out_dir = root / "public" / "vo" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "take.mp3"
    words = await synth(spoken, voice, rate, out_path)
    scene_rows = assign_scenes(scenes, words)

    take = {
        "voice": voice,
        "rate": rate,
        "file": f"vo/{slug}/take.mp3",
        "duration": clip_duration(out_path),
        "scenes": scene_rows,
    }
    (out_dir / "take.json").write_text(json.dumps(take, indent=2))
    for row in scene_rows:
        print(f"{row['scene']}: {row['start']:6.2f}-{row['end']:6.2f}s  {row['text'][:60]}")
    print(f"take duration: {take['duration']:.2f}s, last word ends {scene_rows[-1]['end']:.2f}s")


async def main() -> None:
    args = [a for a in sys.argv[1:] if a != "--take"]
    if not args:
        sys.exit("usage: python3 scripts/vo.py <slug> [voice] [rate] [--take]")
    slug = args[0]
    voice = args[1] if len(args) > 1 else DEFAULT_VOICE
    rate = args[2] if len(args) > 2 else DEFAULT_RATE

    root = Path(__file__).resolve().parent.parent
    if "--take" in sys.argv:
        await synth_take(root, slug, voice, rate)
        return

    lines_path = root / "briefs" / slug / "vo-lines.json"
    if not lines_path.exists():
        sys.exit(f"missing {lines_path}")
    lines = json.loads(lines_path.read_text())

    out_dir = root / "public" / "vo" / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    timings = {"voice": voice, "rate": rate, "clips": {}}
    for scene, text in lines.items():
        out_path = out_dir / f"{scene}.mp3"
        words = await synth(text, voice, rate, out_path)
        timings["clips"][scene] = {
            "file": f"vo/{slug}/{scene}.mp3",
            "text": text,
            "duration": clip_duration(out_path),
            "words": words,
        }
        print(f"{scene}: {timings['clips'][scene]['duration']:.2f}s  {text}")

    total = sum(c["duration"] for c in timings["clips"].values())
    timings["total"] = round(total, 3)
    (out_dir / "timings.json").write_text(json.dumps(timings, indent=2))
    print(f"total speech: {total:.2f}s")


if __name__ == "__main__":
    asyncio.run(main())
