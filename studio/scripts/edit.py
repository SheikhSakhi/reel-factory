"""Edit a talking-to-camera recording into a reel by editing its transcript.

    python3 scripts/edit.py prep <video> <slug> [--language auto] [--model base]
    # edit briefs/<slug>/edit/transcript.md (delete lines or words, reorder lines, add [S2] markers)
    python3 scripts/edit.py apply <slug>
    python3 scripts/edit.py verify <slug>     # transcribes the edited audio and diffs it with your edit

prep:
  1. Normalises the video: H.264, constant 30 fps (phone footage is variable frame rate,
     which breaks frame-accurate cuts), audio cleaned (high-pass, denoise) and loudness-
     normalised to -14 LUFS / -1.5 dBTP, the level Instagram and TikTok play at.
     -> public/edit/<slug>/clean.mp4
  2. Transcribes it locally with whisper.cpp, then re-times every word against the audio
     (scripts/align.py) so cuts land between words. -> briefs/<slug>/edit/words.json
  3. Tracks the speaker's face (OpenCV YuNet) so a landscape or loosely framed shot can be
     reframed to 9:16. -> briefs/<slug>/edit/face.json
  4. Writes the editable transcript with retakes and filler words already marked.
     -> briefs/<slug>/edit/transcript.md

apply:
  Reads the edited transcript and writes the cut list and timing the reel renders from:
     -> public/edit/<slug>/edit.json  (segments of the source to play, face track)
     -> public/edit/<slug>/take.json  (scenes and word frames on the EDITED timeline, the same
                                       format as a voice-over take, so Captions, wordFrame()
                                       and SeriesChrome work unchanged)

Requires a system ffmpeg with the afftdn/loudnorm filters, Node (for whisper.cpp) and
opencv-python-headless (face tracking; without it the frame stays centred).
"""
import argparse
import difflib
import json
import math
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from align import refine  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
# Pauses longer than this inside the kept speech are cut out.
MAX_PAUSE = 0.30
# Air kept around each kept stretch of speech, in seconds.
LEAD = 0.08
TAIL = 0.14
# Silent hold after the last word.
END_HOLD = 0.4
# A sentence ends at punctuation or at a silence this long.
SENTENCE_GAP = 0.9
FILLERS = {"um", "uh", "erm", "er", "ah", "hmm", "mm", "uhm", "umm"}
AUDIO_CHAIN = "highpass=f=80,afftdn=nf=-25,loudnorm=I=-14:TP=-1.5:LRA=11"
YUNET_URL = "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
MODEL_DIR = ROOT / ".models"
FACE_SAMPLES_PER_SECOND = 3


def norm(token: str) -> str:
    return re.sub(r"[\W_]", "", token.lower())


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"{cmd[0]} failed: {result.stderr.strip()[-800:]}")
    return result.stdout


def probe(path: Path) -> dict:
    out = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height:stream_side_data=rotation:format=duration", "-of", "json", str(path)]))
    stream = out["streams"][0]
    width, height = stream["width"], stream["height"]
    rotation = next((abs(int(d.get("rotation", 0))) for d in stream.get("side_data_list", [])), 0)
    if rotation in (90, 270):
        width, height = height, width
    return {"width": width, "height": height, "duration": float(out["format"]["duration"])}


def dirs(slug: str) -> tuple[Path, Path]:
    public = ROOT / "public" / "edit" / slug
    brief = ROOT / "briefs" / slug / "edit"
    public.mkdir(parents=True, exist_ok=True)
    brief.mkdir(parents=True, exist_ok=True)
    return public, brief


# ---------- prep ----------

def normalise(source: Path, out: Path) -> None:
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
         "-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
         "-af", AUDIO_CHAIN, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)])


def transcribe(video: Path, brief: Path, language: str, model: str) -> list[dict]:
    wav = brief / "audio16k.wav"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video), "-ar", "16000", "-ac", "1", str(wav)])
    words_path = brief / "words.json"
    subprocess.run(["node", str(ROOT / "scripts" / "transcribe.mjs"), str(wav), str(words_path),
                    "--model", model, "--language", language], check=True, cwd=ROOT)
    data = json.loads(words_path.read_text())
    # Whisper's word times drift into pauses; re-time them against the audio before cutting.
    data["whisperWords"] = data["words"]
    data["words"] = refine(data["words"], str(wav))
    words_path.write_text(json.dumps(data, indent=2))
    wav.unlink()
    return data["words"]


def face_model() -> Path | None:
    path = MODEL_DIR / "face_detection_yunet_2023mar.onnx"
    if not path.exists():
        MODEL_DIR.mkdir(exist_ok=True)
        try:
            urllib.request.urlretrieve(YUNET_URL, path)
        except OSError as error:
            print(f"face tracking off: could not download the face model ({error})")
            return None
    return path


def track_faces(video: Path) -> list[dict]:
    """Largest face per sample as normalised centre and size, smoothed. Empty if OpenCV is missing."""
    try:
        import cv2
    except ImportError:
        print("face tracking off: pip3 install opencv-python-headless")
        return []
    model = face_model()
    if model is None:
        return []
    capture = cv2.VideoCapture(str(video))
    step = max(1, round(FPS / FACE_SAMPLES_PER_SECOND))
    detector = None
    raw = []
    index = 0
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        if index % step == 0:
            h, w = frame.shape[:2]
            scale = 640 / max(w, h)
            small = cv2.resize(frame, (round(w * scale), round(h * scale)))
            if detector is None:
                detector = cv2.FaceDetectorYN.create(str(model), "", (small.shape[1], small.shape[0]), 0.7)
            _, faces = detector.detect(small)
            if faces is not None and len(faces):
                x, y, fw, fh = (float(v) for v in max(faces, key=lambda f: f[2] * f[3])[:4])
                sw, sh = small.shape[1], small.shape[0]
                raw.append({"t": round(index / FPS, 3), "x": (x + fw / 2) / sw, "y": (y + fh / 2) / sh, "size": fh / sh})
        index += 1
    capture.release()
    # Exponential smoothing keeps the reframe from jittering with every detection.
    smooth = []
    for point in raw:
        if smooth:
            prev = smooth[-1]
            point = {"t": point["t"], **{k: round(prev[k] * 0.7 + point[k] * 0.3, 4) for k in ("x", "y", "size")}}
        else:
            point = {"t": point["t"], **{k: round(point[k], 4) for k in ("x", "y", "size")}}
        smooth.append(point)
    return smooth


def sentences(words: list[dict]) -> list[list[int]]:
    """Groups word indices into sentences at end punctuation or long silences."""
    groups: list[list[int]] = [[]]
    for i, word in enumerate(words):
        groups[-1].append(i)
        nxt = words[i + 1] if i + 1 < len(words) else None
        ends = re.search(r"[.?!]['\")\]]*$", word["text"]) is not None
        if nxt and (ends or nxt["start"] - word["end"] >= SENTENCE_GAP):
            groups.append([])
    return [g for g in groups if g]


def is_retake(a: list[str], b: list[str]) -> bool:
    """True when sentence a is an earlier attempt at sentence b (same opening, or mostly the same words)."""
    if not a or not b:
        return False
    n = min(4, len(a), len(b))
    if n >= 2 and a[:n] == b[:n]:
        return True
    head = b[:len(a) + 2]
    return len(a) >= 3 and difflib.SequenceMatcher(None, a, head).ratio() >= 0.75


def write_transcript(slug: str, words: list[dict], groups: list[list[int]], path: Path) -> None:
    normed = [[norm(words[i]["text"]) for i in g] for g in groups]
    lines = [
        f"# Edit: {slug}",
        "# Delete a line to cut it. Delete words inside a line to cut only those words.",
        "# Lines starting with '#' are cut. Retakes and filler words are already removed or marked.",
        "# Reorder lines to reorder the video. Put [S2], [S3] ... on its own line to start a new scene.",
        "# Then run: python3 scripts/edit.py apply " + slug,
        "",
        "[S1]",
    ]
    for k, group in enumerate(groups):
        later = normed[k + 1:k + 3]
        retake = any(is_retake(normed[k], other) for other in later)
        text = " ".join(words[i]["text"] for i in group if norm(words[i]["text"]) not in FILLERS)
        if not text.strip():
            continue
        lines.append(f"{'#' if retake else ''}{k + 1:03d}  {text}{'   (retake)' if retake else ''}")
    path.write_text("\n".join(lines) + "\n")


def prep(args: argparse.Namespace) -> None:
    if not shutil.which("ffmpeg"):
        sys.exit("edit.py: a system ffmpeg is required (e.g. apt install ffmpeg / brew install ffmpeg)")
    source = Path(args.video).expanduser().resolve()
    if not source.exists():
        sys.exit(f"edit.py: {source} not found")
    public, brief = dirs(args.slug)
    clean = public / "clean.mp4"
    print("1/4 normalising video and cleaning audio ...")
    normalise(source, clean)
    print("2/4 transcribing (whisper.cpp, local) ...")
    words = transcribe(clean, brief, args.language, args.model)
    if not words:
        sys.exit("edit.py: no speech found")
    print("3/4 tracking the speaker's face ...")
    face = track_faces(clean)
    (brief / "face.json").write_text(json.dumps(face))
    groups = sentences(words)
    (brief / "sentences.json").write_text(json.dumps(groups))
    print("4/4 writing the editable transcript ...")
    write_transcript(args.slug, words, groups, brief / "transcript.md")
    meta = probe(clean)
    (brief / "source.json").write_text(json.dumps({**meta, "original": str(source)}, indent=2))
    print(f"{len(words)} words, {len(groups)} sentences, {len(face)} face samples, "
          f"{meta['width']}x{meta['height']} {meta['duration']:.1f}s")
    print(f"edit briefs/{args.slug}/edit/transcript.md, then: python3 scripts/edit.py apply {args.slug}")


# ---------- apply ----------

LINE = re.compile(r"^(\d{3})\s+(.*?)(?:\s+\(retake\))?\s*$")
SCENE = re.compile(r"^\[(S\d+)\]\s*$")


def read_transcript(path: Path) -> list[tuple[str, int, str]]:
    """Returns (scene, sentence index, edited text) for every kept line, in file order."""
    scene = "S1"
    kept = []
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        marker = SCENE.match(line)
        if marker:
            scene = marker.group(1)
            continue
        match = LINE.match(line)
        if not match:
            raise ValueError(f"cannot read line: {raw!r} (keep the 3-digit number at the start)")
        kept.append((scene, int(match.group(1)) - 1, match.group(2)))
    if not kept:
        raise ValueError("every line is cut: nothing to render")
    return kept


def kept_words(words: list[dict], group: list[int], text: str) -> list[int]:
    """Word indices of the sentence that survive the user's edit of its line (order-preserving diff)."""
    original = [norm(words[i]["text"]) for i in group]
    edited = [norm(t) for t in text.split() if norm(t)]
    matcher = difflib.SequenceMatcher(None, original, edited, autojunk=False)
    keep = [group[block.a + k] for block in matcher.get_matching_blocks() for k in range(block.size)]
    added = len(edited) - sum(b.size for b in matcher.get_matching_blocks())
    if added > 0:
        print(f"note: {added} typed word(s) in sentence {group[0]} are not in the audio and were ignored")
    return keep


def build_segments(words: list[dict], picks: list[tuple[str, int]], duration: float) -> list[dict]:
    """Merges kept words into source stretches; any pause > MAX_PAUSE or any jump in the source starts a new one."""
    segments: list[dict] = []
    for scene, i in picks:
        word = words[i]
        last = segments[-1] if segments else None
        contiguous = last is not None and last["last"] == i - 1 and word["start"] - words[i - 1]["end"] <= MAX_PAUSE
        if contiguous:
            last["end"] = word["end"]
            last["last"] = i
            last["words"].append((scene, i))
        else:
            segments.append({"start": word["start"], "end": word["end"], "last": i, "words": [(scene, i)]})
    for seg in segments:
        seg["first"] = seg["words"][0][1]
        seg["in"] = max(0.0, seg["start"] - LEAD)
        seg["out"] = min(duration, seg["end"] + TAIL)
    # Padding must never reach into speech that was cut, or repeat audio between neighbours.
    for prev, seg in zip(segments, segments[1:]):
        if prev["last"] >= seg["first"]:
            continue  # reordered: the two stretches are independent
        if seg["first"] - prev["last"] > 1:
            # Words were removed between them: cut exactly at the removed words' edges.
            prev["out"] = min(prev["out"], words[prev["last"] + 1]["start"])
            seg["in"] = max(seg["in"], words[seg["first"] - 1]["end"])
        elif prev["out"] > seg["in"]:
            mid = (prev["end"] + seg["start"]) / 2
            prev["out"], seg["in"] = min(prev["out"], mid), max(seg["in"], mid)
    return segments


def apply(args: argparse.Namespace) -> None:
    public, brief = dirs(args.slug)
    words = json.loads((brief / "words.json").read_text())["words"]
    groups = json.loads((brief / "sentences.json").read_text())
    source = json.loads((brief / "source.json").read_text())
    face = json.loads((brief / "face.json").read_text()) if (brief / "face.json").exists() else []

    picks: list[tuple[str, int]] = []
    for scene, sentence, text in read_transcript(brief / "transcript.md"):
        if sentence >= len(groups):
            raise ValueError(f"line {sentence + 1:03d} does not exist in this recording")
        picks += [(scene, i) for i in kept_words(words, groups[sentence], text)]
    if not picks:
        raise ValueError("no words left after the edit")

    segments = build_segments(words, picks, source["duration"])
    out_segments, timeline, cursor = [], [], 0
    for seg in segments:
        start_frame = round(seg["in"] * FPS)
        length = max(1, round(seg["out"] * FPS) - start_frame)
        out_segments.append({"from": cursor, "durationInFrames": length, "startFrom": start_frame})
        for scene, i in seg["words"]:
            w = words[i]
            frame = cursor + round(w["start"] * FPS) - start_frame
            end_frame = cursor + round(w["end"] * FPS) - start_frame
            timeline.append((scene, {"token": w["text"], "frame": frame, "endFrame": max(frame + 1, end_frame)}))
        cursor += length
    total = cursor + round(END_HOLD * FPS)
    out_segments[-1]["durationInFrames"] += total - cursor

    scenes: list[dict] = []
    for scene, word in timeline:
        if not scenes or scenes[-1]["id"] != scene:
            if any(s["id"] == scene for s in scenes):
                raise ValueError(f"scene {scene} appears twice; scene markers must run in order")
            scenes.append({"id": scene, "words": []})
        scenes[-1]["words"].append(word)
    for k, s in enumerate(scenes):
        s["from"] = 0 if k == 0 else s["words"][0]["frame"]
        s["text"] = " ".join(w["token"] for w in s["words"])
        s["speechEnd"] = s["words"][-1]["endFrame"]
    for k, s in enumerate(scenes):
        s["to"] = scenes[k + 1]["from"] if k + 1 < len(scenes) else total

    file = f"edit/{args.slug}/clean.mp4"
    take = {"file": file, "fps": FPS, "totalFrames": total,
            "scenes": [{k: s[k] for k in ("id", "text", "from", "to", "speechEnd", "words")} for s in scenes]}
    edit = {"source": file, "fps": FPS, "width": source["width"], "height": source["height"],
            "totalFrames": total, "segments": out_segments, "face": face}
    (public / "take.json").write_text(json.dumps(take, indent=2))
    (public / "edit.json").write_text(json.dumps(edit, indent=2))

    kept_seconds = sum(s["durationInFrames"] for s in out_segments) / FPS
    print(f"{len(out_segments)} cuts, {len(scenes)} scene(s), {kept_seconds:.1f}s "
          f"(from {source['duration']:.1f}s raw, {100 * (1 - kept_seconds / source['duration']):.0f}% cut)")
    print(f"wrote public/edit/{args.slug}/edit.json and take.json")


# ---------- verify ----------

def verify(args: argparse.Namespace) -> None:
    """Builds the edited audio from the cut list, transcribes it and diffs it with the kept words."""
    public, brief = dirs(args.slug)
    edit = json.loads((public / "edit.json").read_text())
    take = json.loads((public / "take.json").read_text())
    expected = [norm(w["token"]) for s in take["scenes"] for w in s["words"]]
    parts = "".join(
        f"[0:a]atrim=start={seg['startFrom'] / FPS}:duration={seg['durationInFrames'] / FPS},asetpts=PTS-STARTPTS[a{k}];"
        for k, seg in enumerate(edit["segments"]))
    joined = "".join(f"[a{k}]" for k in range(len(edit["segments"])))
    wav = brief / "verify16k.wav"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(public / "clean.mp4"), "-filter_complex",
         f"{parts}{joined}concat=n={len(edit['segments'])}:v=0:a=1,aresample=16000[out]", "-map", "[out]", "-ac", "1", str(wav)])
    heard_path = brief / "verify.json"
    subprocess.run(["node", str(ROOT / "scripts" / "transcribe.mjs"), str(wav), str(heard_path), "--model", args.model],
                   check=True, cwd=ROOT, stdout=subprocess.DEVNULL)
    wav.unlink()
    heard = [norm(w["text"]) for w in json.loads(heard_path.read_text())["words"]]
    matcher = difflib.SequenceMatcher(None, expected, [h for h in heard if h], autojunk=False)
    # A number spoken as words may be transcribed as digits ("три" / "3"): not an editing error.
    def numeric(op: str, want: list[str], got: list[str]) -> bool:
        return op == "replace" and len(want) == len(got) and any(w.isdigit() or g.isdigit() for w, g in zip(want, got))
    problems = [(op, expected[i1:i2], heard[j1:j2]) for op, i1, i2, j1, j2 in matcher.get_opcodes()
                if op != "equal" and not numeric(op, expected[i1:i2], heard[j1:j2])]
    if not problems:
        print(f"VERIFY PASS: the edit says exactly the {len(expected)} kept words")
        return
    for op, want, got in problems:
        print(f"  {op:8} expected {' '.join(want) or '-'!r:40} heard {' '.join(got) or '-'!r}")
    print("VERIFY CHECK: transcription differs. Small spelling differences are fine; a missing or extra word "
          "next to a mid-phrase cut means the cut is off: cut the whole phrase or sentence instead.")
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Transcript-based editing of talking-to-camera footage.")
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("prep", help="normalise, transcribe, track face, write transcript.md")
    p.add_argument("video")
    p.add_argument("slug")
    p.add_argument("--language", default="auto", help="e.g. en, ko, hi (default: auto-detect)")
    p.add_argument("--model", default="base", help="whisper model: base (default), small, medium, large-v3-turbo")
    a = sub.add_parser("apply", help="turn the edited transcript into edit.json + take.json")
    a.add_argument("slug")
    v = sub.add_parser("verify", help="transcribe the edited audio and diff it with the kept words")
    v.add_argument("slug")
    v.add_argument("--model", default="base")
    args = parser.parse_args()
    try:
        {"prep": prep, "apply": apply, "verify": verify}[args.command](args)
    except (ValueError, RuntimeError, FileNotFoundError) as error:
        sys.exit(f"edit.py: {error}")


if __name__ == "__main__":
    main()
