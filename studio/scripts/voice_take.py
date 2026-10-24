"""Build a voice-over take from ANY audio: your own recording of the script, or a file from
another voice engine (e.g. an ElevenLabs clone of your voice).

    python3 scripts/vo.py <slug> --audio <recording.m4a|mp3|wav> [--language ru]

The audio is cleaned (high-pass, denoise, loudness to -14 LUFS), trimmed of long silences at
both ends, transcribed locally (whisper.cpp) and re-timed against the waveform (align.py).
The script's [S1] [S2] ... markers in briefs/<slug>/vo-take.txt only decide WHERE scenes
start: captions use the words actually spoken, so an ad-lib or a reworded line still shows
correctly. Writes the same public/vo/<slug>/take.mp3 + take.json as a synthesized take, so
the rest of the pipeline does not change.
"""
import difflib
import json
import math
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from align import refine  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
SCENE_LEAD_FRAMES = 3
AUDIO_CHAIN = "highpass=f=80,afftdn=nf=-25,loudnorm=I=-14:TP=-1.5:LRA=11"
# Leading/trailing silence kept around the speech, in seconds.
EDGE_PAD = 0.25


def norm(word: str) -> str:
    return re.sub(r"[\W_]", "", word.lower())


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"{cmd[0]} failed: {result.stderr.strip()[-600:]}")
    return result.stdout + result.stderr


def transcribe(wav: Path, out: Path, language: str, model: str) -> list[dict]:
    subprocess.run(["node", str(ROOT / "scripts" / "transcribe.mjs"), str(wav), str(out), "--model", model, "--language", language],
                   check=True, cwd=ROOT, stdout=subprocess.DEVNULL)
    words = json.loads(out.read_text())["words"]
    if not words:
        raise ValueError("no speech found in the recording")
    return refine(words, str(wav))


SENTENCE_END = re.compile(r"[.?!…]['\")\]»]*$")


def scene_starts(script_scenes: list[tuple[str, str]], spoken: list[str], raw: list[str] | None = None) -> list[int]:
    """Index of the spoken word where each scene starts.

    Script tokens are matched to spoken words in order (difflib). A scene starts at the first
    matched word of its script; if the opening was reworded (an ad-lib), the start moves back
    to the beginning of that spoken sentence, as long as it stays after the previous scene's
    last matched word. `raw` (the spoken words with punctuation) supplies sentence ends."""
    script_tokens = [(scene_i, norm(t)) for scene_i, (_, text) in enumerate(script_scenes) for t in text.split() if norm(t)]
    matcher = difflib.SequenceMatcher(None, [t for _, t in script_tokens], spoken, autojunk=False)
    first: dict[int, int] = {}
    last: dict[int, int] = {}
    for block in matcher.get_matching_blocks():
        for k in range(block.size):
            scene_i = script_tokens[block.a + k][0]
            first.setdefault(scene_i, block.b + k)
            last[scene_i] = block.b + k
    raw = raw or spoken
    starts = []
    for i in range(len(script_scenes)):
        if i == 0:
            starts.append(0)
        elif i in first:
            floor = max([last[j] + 1 for j in range(i) if j in last] + [starts[-1] + 1])
            start = first[i]
            # Reworded opening: walk back to the word after the previous sentence end.
            while start > floor and not SENTENCE_END.search(raw[start - 1]):
                start -= 1
            starts.append(max(start, starts[-1] + 1))
        else:
            prev_end = max((last[j] for j in range(i) if j in last), default=starts[-1])
            starts.append(max(prev_end + 1, starts[-1] + 1))
    if starts[-1] >= len(spoken):
        raise ValueError("the recording has fewer words than the script has scenes: read the whole script, or merge scenes")
    return starts


def coverage(script_scenes: list[tuple[str, str]], spoken: list[str]) -> float:
    script = [norm(t) for _, text in script_scenes for t in text.split() if norm(t)]
    matched = sum(b.size for b in difflib.SequenceMatcher(None, script, spoken, autojunk=False).get_matching_blocks())
    return matched / max(1, len(script))


def build(slug: str, audio: Path, script_scenes: list[tuple[str, str]], language: str, model: str,
          hold_seconds: float, label: str) -> None:
    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg is required (brew install ffmpeg / apt install ffmpeg)")
    out_dir = ROOT / "public" / "vo" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    work = ROOT / "briefs" / slug
    work.mkdir(parents=True, exist_ok=True)
    clean = work / "voice-clean.wav"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(audio), "-vn", "-af", AUDIO_CHAIN,
         "-ar", "48000", "-ac", "1", str(clean)])
    wav16 = work / "voice16k.wav"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(clean), "-ar", "16000", "-ac", "1", str(wav16)])
    words = transcribe(wav16, work / "voice-words.json", language, model)
    wav16.unlink()

    # Trim the recording to the speech (plus a little air), so frame 0 is the start of the take.
    t0 = max(0.0, words[0]["start"] - EDGE_PAD)
    t1 = words[-1]["end"] + EDGE_PAD
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-i", str(clean),
         "-c:a", "libmp3lame", "-b:a", "192k", str(out_dir / "take.mp3")])
    clean.unlink()
    for w in words:
        w["start"] -= t0
        w["end"] -= t0

    spoken = [norm(w["text"]) for w in words]
    starts = scene_starts(script_scenes, spoken, [w["text"] for w in words])
    rows = []
    for i, (scene_id, _) in enumerate(script_scenes):
        end = starts[i + 1] if i + 1 < len(starts) else len(words)
        scene_words = [{"token": w["text"], "start": round(w["start"], 3), "end": round(w["end"], 3),
                        "frame": round(w["start"] * FPS), "endFrame": max(round(w["start"] * FPS) + 1, round(w["end"] * FPS))}
                       for w in words[starts[i]:end]]
        start_frame = 0 if i == 0 else max(0, scene_words[0]["frame"] - SCENE_LEAD_FRAMES)
        rows.append({"id": scene_id, "text": " ".join(w["token"] for w in scene_words), "from": start_frame, "words": scene_words})
    total = math.ceil((words[-1]["end"] + hold_seconds) * FPS)
    for i, row in enumerate(rows):
        row["to"] = rows[i + 1]["from"] if i + 1 < len(rows) else total
        row["speechEnd"] = row["words"][-1]["endFrame"]
        if row["to"] <= row["from"]:
            raise ValueError(f"{row['id']} has no time of its own; merge it with a neighbouring scene")

    take = {"file": f"vo/{slug}/take.mp3", "voice": label, "rate": "recorded", "fps": FPS, "totalFrames": total, "scenes": rows}
    (out_dir / "take.json").write_text(json.dumps(take, indent=2, ensure_ascii=False))
    for row in rows:
        print(f"{row['id']:>4}  frames {row['from']:5}-{row['to']:<5} {(row['to'] - row['from']) / FPS:5.1f}s  {row['text'][:56]}")
    share = coverage(script_scenes, spoken)
    print(f"total {total} frames = {total / FPS:.1f}s from {label}; {share:.0%} of the script heard as written")
    if share < 0.8:
        print("note: the recording differs a lot from vo-take.txt. Captions follow the recording; check that each scene starts on the right line.")
    print(f"wrote public/vo/{slug}/take.mp3 and take.json")
