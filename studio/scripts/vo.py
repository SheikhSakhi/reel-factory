"""Voice-over for a reel: one natural take, timed to the word. Three sources, best first:

    python3 scripts/vo.py <slug> --audio my-read.m4a [--language ru]   # YOUR voice reading vo-take.txt
    python3 scripts/vo.py <slug> --engine elevenlabs [--language ru]   # a cloned voice (paid, ELEVENLABS_*)
    python3 scripts/vo.py <slug>                                       # free edge-tts stock voice
    python3 scripts/vo.py <slug> --voice en-US-AvaMultilingualNeural --rate +0%
    python3 scripts/vo.py --samples              # audition edge-tts voices into out/voice-samples/
    python3 scripts/vo.py <slug> --dialogue      # several characters: "[S1] DOCTOR: line" + cast.json

--audio and --engine elevenlabs go through scripts/voice_take.py: the audio is cleaned and
loudness-normalised, transcribed locally and re-timed to the waveform, and the [S1] markers
place the scene cuts. ElevenLabs needs ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID (your cloned
voice) in studio/.env.local; the script text is sent to ElevenLabs.

Input: briefs/<slug>/vo-take.txt, the whole voice-over as ONE text with scene
markers, e.g. "[S1] Hook line. [S2] Next line...". The text is synthesized in a
single pass (natural intonation across sentences), never line by line.

Output:
  public/vo/<slug>/take.mp3   the audio, played from frame 0
  public/vo/<slug>/take.json  fps, totalFrames, and every scene's frame range and
                              word timings; src/kit/voiceover.tsx loads it

Edit the text and re-run: scene ranges and word frames are recomputed, so a reel
that derives its beats from take.json retimes itself.

The free path requires: pip3 install edge-tts (no API key; sends the text to Microsoft's
neural TTS service).
"""
import argparse
import asyncio
import json
import math
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_VOICE = "en-US-AndrewMultilingualNeural"
DEFAULT_RATE = "+6%"
SAMPLE_VOICES = (
    "en-US-AndrewMultilingualNeural",
    "en-US-BrianMultilingualNeural",
    "en-US-AvaMultilingualNeural",
    "en-US-EmmaMultilingualNeural",
)
SAMPLE_TEXT = (
    "Here's the thing nobody tells you about this. It's not magic, "
    "it's just a better habit, and you can start today."
)
FPS = 30
# Each scene starts this many frames before its first word, so visuals land with the voice.
SCENE_LEAD_FRAMES = 3
# Silent hold after the last word (CTA stays on screen, clean loop).
DEFAULT_HOLD_SECONDS = 2.0
TICKS_PER_SECOND = 10_000_000
# edge-tts streams constant-bitrate MP3 (audio-24khz-48kbitrate-mono-mp3).
MP3_BITS_PER_SECOND = 48_000
MARKER = re.compile(r"\[(S\d+)\]")

ROOT = Path(__file__).resolve().parent.parent


async def synth(text: str, voice: str, rate: str, out_path: Path) -> list[dict]:
    """Writes the MP3 and returns word boundaries in seconds."""
    try:
        import edge_tts
    except ImportError:
        sys.exit("edge-tts is not installed. Run: pip3 install edge-tts (or use --audio with your own recording)")
    communicate = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    words = []
    with out_path.open("wb") as audio:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "word": chunk["text"],
                    "start": chunk["offset"] / TICKS_PER_SECOND,
                    "end": (chunk["offset"] + chunk["duration"]) / TICKS_PER_SECOND,
                })
    if not words:
        raise RuntimeError(f"edge-tts returned no word timings for voice {voice}")
    return words


def mp3_seconds(path: Path) -> float:
    return path.stat().st_size * 8 / MP3_BITS_PER_SECOND


def normalize(word: str) -> str:
    """Lower-case letters and digits only. Unicode-aware, so any language works."""
    return re.sub(r"[\W_]", "", word.lower())


def split_scenes(take_text: str) -> list[tuple[str, str]]:
    parts = MARKER.split(take_text)
    # parts = [prefix, "S1", text1, "S2", text2, ...]
    scenes = [(parts[i], parts[i + 1].strip()) for i in range(1, len(parts) - 1, 2)]
    if not scenes:
        raise ValueError("vo-take.txt needs scene markers like [S1], [S2] ...")
    empty = [scene for scene, text in scenes if not normalize(text)]
    if empty:
        raise ValueError(f"no spoken words after marker(s): {', '.join(empty)}")
    return scenes


def align_tokens(tokens: list[str], words: list[dict]) -> list[tuple[float, float]]:
    """Gives every script token a (start, end) time from the spoken word boundaries.

    The boundaries come from the same text, so both sides spell the same letters.
    Tokens and boundaries are grouped until their letters match. This handles one
    boundary covering several tokens ("16,000 hours") and the reverse. A merged
    boundary's time is spread evenly over its tokens. Punctuation-only tokens borrow
    the previous time. Raises instead of guessing if the two sides drift apart.
    """
    times: list[tuple[float, float]] = []
    t = b = 0
    while t < len(tokens):
        if not normalize(tokens[t]):
            previous = times[-1][1] if times else words[0]["start"]
            times.append((previous, previous))
            t += 1
            continue
        if b >= len(words):
            raise ValueError(f"the audio has no words left for '{tokens[t]}'")
        t_end, b_end = t + 1, b + 1
        token_letters, spoken_letters = normalize(tokens[t]), normalize(words[b]["word"])
        while token_letters != spoken_letters:
            if not (token_letters.startswith(spoken_letters) or spoken_letters.startswith(token_letters)):
                raise ValueError(f"spoken words drift from the script near '{tokens[t]}' (heard '{words[b]['word']}')")
            if len(token_letters) < len(spoken_letters) and t_end < len(tokens):
                token_letters += normalize(tokens[t_end])
                t_end += 1
            elif b_end < len(words):
                spoken_letters += normalize(words[b_end]["word"])
                b_end += 1
            else:
                raise ValueError(f"the audio ends before the script near '{tokens[t]}'")
        start, end = words[b]["start"], words[b_end - 1]["end"]
        group = t_end - t
        for k in range(group):
            times.append((start + (end - start) * k / group, start + (end - start) * (k + 1) / group))
        t, b = t_end, b_end
    leftover = [w["word"] for w in words[b:] if normalize(w["word"])]
    if leftover:
        raise ValueError(f"the audio has extra words not in the script: {' '.join(leftover[:5])}")
    return times


def to_frame(seconds: float) -> int:
    return round(seconds * FPS)


def build_timeline(scenes: list[tuple[str, str]], words: list[dict], hold_seconds: float) -> tuple[list[dict], int]:
    scene_tokens = [text.split() for _, text in scenes]
    times = align_tokens([token for tokens in scene_tokens for token in tokens], words)
    rows = []
    cursor = 0
    for index, ((scene, text), tokens) in enumerate(zip(scenes, scene_tokens)):
        scene_times = times[cursor:cursor + len(tokens)]
        cursor += len(tokens)
        scene_words = [
            {"token": token, "start": round(start, 3), "end": round(end, 3),
             "frame": to_frame(start), "endFrame": to_frame(end)}
            for token, (start, end) in zip(tokens, scene_times)
        ]
        start_frame = 0 if index == 0 else max(0, scene_words[0]["frame"] - SCENE_LEAD_FRAMES)
        rows.append({"id": scene, "text": text, "from": start_frame, "words": scene_words})
    total_frames = math.ceil((words[-1]["end"] + hold_seconds) * FPS)
    for index, row in enumerate(rows):
        row["to"] = rows[index + 1]["from"] if index + 1 < len(rows) else total_frames
        row["speechEnd"] = row["words"][-1]["endFrame"]
        if row["to"] <= row["from"]:
            raise ValueError(f"{row['id']} has no time of its own; merge it with a neighbouring scene")
    return rows, total_frames


async def make_take(slug: str, voice: str, rate: str, hold_seconds: float) -> None:
    take_path = ROOT / "briefs" / slug / "vo-take.txt"
    if not take_path.exists():
        sys.exit(f"missing {take_path} (write the voice-over there with [S1] markers)")
    scenes = split_scenes(take_path.read_text())
    spoken = " ".join(text for _, text in scenes)

    out_dir = ROOT / "public" / "vo" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    mp3_path = out_dir / "take.mp3"
    words = await synth(spoken, voice, rate, mp3_path)
    rows, total_frames = build_timeline(scenes, words, hold_seconds)

    audio_frames = math.ceil(mp3_seconds(mp3_path) * FPS)
    if audio_frames > total_frames:
        total_frames = audio_frames
        rows[-1]["to"] = total_frames

    take = {
        "file": f"vo/{slug}/take.mp3",
        "voice": voice,
        "rate": rate,
        "fps": FPS,
        "totalFrames": total_frames,
        "scenes": rows,
    }
    (out_dir / "take.json").write_text(json.dumps(take, indent=2))

    for row in rows:
        seconds = (row["to"] - row["from"]) / FPS
        print(f"{row['id']:>4}  frames {row['from']:5}-{row['to']:<5} {seconds:5.1f}s  {row['text'][:56]}")
    print(f"total {total_frames} frames = {total_frames / FPS:.1f}s "
          f"(speech ends {words[-1]['end']:.1f}s, voice {voice} {rate})")
    print(f"wrote public/vo/{slug}/take.mp3 and take.json")


SPEAKER = re.compile(r"^([A-Z][A-Z0-9_-]{1,20}):\s*(.+)$", re.S)
DEFAULT_GAP_SECONDS = 0.22


def split_speakers(scenes: list[tuple[str, str]]) -> list[tuple[str, str, str]]:
    """[(scene, speaker, text)] from scenes written as "DOCTOR: line". Every scene needs a speaker."""
    lines = []
    for scene, text in scenes:
        match = SPEAKER.match(text.strip())
        if not match:
            raise ValueError(f"{scene} has no speaker: write it as '[{scene}] NAME: line'")
        lines.append((scene, match.group(1), match.group(2).strip()))
    return lines


def run_ffmpeg(*args: str) -> None:
    import subprocess
    result = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr.strip()[-400:]}")


def wav_seconds(path: Path) -> float:
    import wave
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


async def make_dialogue(slug: str, rate: str, hold_seconds: float, gap: float) -> None:
    """A dialogue take: each line synthesized in its character's voice, joined with short gaps.

    briefs/<slug>/vo-take.txt: "[S1] DOCTOR: Six weeks?! [S2] PATIENT: You said a lot."
    briefs/<slug>/cast.json:   {"DOCTOR": {"voice": "en-US-AndrewMultilingualNeural", "rate": "+4%", "pitch": "-2Hz"}, ...}
    Each scene in take.json gets a "speaker" field, so captions and characters know who talks."""
    brief = ROOT / "briefs" / slug
    scenes = split_scenes((brief / "vo-take.txt").read_text())
    lines = split_speakers(scenes)
    cast_path = brief / "cast.json"
    if not cast_path.exists():
        sys.exit(f"missing {cast_path}: map every speaker to a voice")
    cast = json.loads(cast_path.read_text())
    missing = sorted({speaker for _, speaker, _ in lines} - set(cast))
    if missing:
        raise ValueError(f"cast.json has no voice for: {', '.join(missing)}")
    try:
        import edge_tts
    except ImportError:
        sys.exit("edge-tts is not installed. Run: pip3 install edge-tts")

    out_dir = ROOT / "public" / "vo" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    work = brief / "dialogue"
    work.mkdir(exist_ok=True)
    words: list[dict] = []
    parts: list[Path] = []
    offset = 0.0
    for i, (scene, speaker, text) in enumerate(lines):
        role = cast[speaker]
        mp3 = work / f"{i:02d}-{scene}.mp3"
        communicate = edge_tts.Communicate(text, role["voice"], rate=role.get("rate", rate),
                                           pitch=role.get("pitch", "+0Hz"), boundary="WordBoundary")
        line_words = []
        with mp3.open("wb") as audio:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    line_words.append({"word": chunk["text"], "start": chunk["offset"] / TICKS_PER_SECOND,
                                       "end": (chunk["offset"] + chunk["duration"]) / TICKS_PER_SECOND})
        if not line_words:
            raise RuntimeError(f"edge-tts returned no word timings for {scene} ({role['voice']})")
        wav = work / f"{i:02d}-{scene}.wav"
        # Trim the engine's trailing silence so the gap between lines is ours.
        end = line_words[-1]["end"] + 0.12
        run_ffmpeg("-i", str(mp3), "-t", f"{end:.3f}", "-ar", "48000", "-ac", "1", str(wav))
        line_gap = float(role.get("gap", gap)) if i else 0.0
        offset += line_gap
        if line_gap:
            silence = work / f"{i:02d}-gap.wav"
            run_ffmpeg("-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", f"{line_gap:.3f}", str(silence))
            parts.append(silence)
        parts.append(wav)
        words += [{**w, "start": w["start"] + offset, "end": w["end"] + offset} for w in line_words]
        offset += wav_seconds(wav)

    listing = work / "parts.txt"
    listing.write_text("".join(f"file '{p.name}'\n" for p in parts))
    run_ffmpeg("-f", "concat", "-safe", "0", "-i", str(listing), "-af", "loudnorm=I=-15:TP=-3:LRA=11",
               "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "192k", str(out_dir / "take.mp3"))
    rows, total_frames = build_timeline([(scene, text) for scene, _, text in lines], words, hold_seconds)
    for row, (_, speaker, _) in zip(rows, lines):
        row["speaker"] = speaker
    take = {"file": f"vo/{slug}/take.mp3", "voice": "dialogue", "rate": rate, "fps": FPS,
            "totalFrames": total_frames, "cast": cast, "scenes": rows}
    (out_dir / "take.json").write_text(json.dumps(take, indent=2))
    for row in rows:
        seconds = (row["to"] - row["from"]) / FPS
        print(f"{row['id']:>4}  {row['speaker']:<8} {seconds:5.1f}s  {row['text'][:56]}")
    print(f"total {total_frames} frames = {total_frames / FPS:.1f}s, {len(set(s for _, s, _ in lines))} voices")
    print(f"wrote public/vo/{slug}/take.mp3 and take.json")


def read_env() -> dict:
    env = {}
    path = ROOT / ".env.local"
    if path.exists():
        for line in path.read_text().splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                key, _, value = line.partition("=")
                env[key.strip()] = value.strip().strip('"')
    env.update({k: v for k, v in os.environ.items() if k.startswith("ELEVENLABS_")})
    return env


ELEVENLABS_MODEL = "eleven_multilingual_v2"


def elevenlabs_synth(text: str, out_path: Path, env: dict) -> None:
    """One take from an ElevenLabs voice (e.g. your instant clone). Word timings come from voice_take.py."""
    key, voice = env.get("ELEVENLABS_API_KEY"), env.get("ELEVENLABS_VOICE_ID")
    if not key or not voice:
        raise RuntimeError("set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in studio/.env.local (see README, Voice-over)")
    request = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
        data=json.dumps({"text": text, "model_id": env.get("ELEVENLABS_MODEL", ELEVENLABS_MODEL)}).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            out_path.write_bytes(response.read())
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")[:300]
        raise RuntimeError(f"ElevenLabs returned {error.code}: {detail}") from error


def make_take_from_audio(args: argparse.Namespace) -> None:
    from voice_take import build  # local import: needs ffmpeg + whisper, not edge-tts
    take_path = ROOT / "briefs" / args.slug / "vo-take.txt"
    if not take_path.exists():
        sys.exit(f"missing {take_path} (write the voice-over there with [S1] markers)")
    scenes = split_scenes(take_path.read_text())
    if args.engine == "elevenlabs":
        audio = ROOT / "briefs" / args.slug / "elevenlabs.mp3"
        elevenlabs_synth(" ".join(text for _, text in scenes), audio, read_env())
        label = "elevenlabs"
    else:
        audio = Path(args.audio).expanduser().resolve()
        if not audio.exists():
            sys.exit(f"vo.py: {audio} not found")
        label = f"recording {audio.name}"
    build(args.slug, audio, scenes, args.language, args.model, args.hold, label)


async def make_samples(text: str, rate: str) -> None:
    out_dir = ROOT / "out" / "voice-samples"
    out_dir.mkdir(parents=True, exist_ok=True)
    for voice in SAMPLE_VOICES:
        path = out_dir / f"{voice}.mp3"
        await synth(text, voice, rate, path)
        print(path.relative_to(ROOT))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Make a reel voice-over: your recording, an ElevenLabs clone, or edge-tts.")
    parser.add_argument("slug", nargs="?", help="reel slug (reads briefs/<slug>/vo-take.txt)")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"edge-tts voice (default {DEFAULT_VOICE})")
    parser.add_argument("--rate", default=DEFAULT_RATE, help=f"speaking rate, e.g. +0%% or +8%% (default {DEFAULT_RATE.replace('%', '%%')})")
    parser.add_argument("--hold", type=float, default=DEFAULT_HOLD_SECONDS,
                        help=f"seconds of silent hold after the last word (default {DEFAULT_HOLD_SECONDS})")
    parser.add_argument("--audio", help="your own recording of vo-take.txt (m4a, mp3, wav, or a video file)")
    parser.add_argument("--engine", choices=["edge", "elevenlabs"], default="edge", help="voice engine when no --audio (default edge)")
    parser.add_argument("--language", default="auto", help="spoken language for --audio / elevenlabs, e.g. ru, en (default auto)")
    parser.add_argument("--model", default="small", help="whisper model for --audio / elevenlabs (default small)")
    parser.add_argument("--dialogue", action="store_true", help="several characters: '[S1] NAME: line' + briefs/<slug>/cast.json")
    parser.add_argument("--gap", type=float, default=DEFAULT_GAP_SECONDS, help="seconds between dialogue lines (default 0.22)")
    parser.add_argument("--samples", action="store_true", help="write voice auditions to out/voice-samples/")
    parser.add_argument("--text", default=SAMPLE_TEXT, help="text for --samples")
    args = parser.parse_args()
    if not args.samples and not args.slug:
        parser.error("give a slug, or --samples")
    return args


def main() -> None:
    args = parse_args()
    try:
        if args.samples:
            asyncio.run(make_samples(args.text, args.rate))
        elif args.dialogue:
            asyncio.run(make_dialogue(args.slug, args.rate, args.hold, args.gap))
        elif args.audio or args.engine == "elevenlabs":
            make_take_from_audio(args)
        else:
            asyncio.run(make_take(args.slug, args.voice, args.rate, args.hold))
    except (ValueError, RuntimeError) as error:
        sys.exit(f"vo.py: {error}")
    except Exception as error:
        # Microsoft periodically rejects old edge-tts clients; a newer release fixes it.
        if "403" in str(error):
            sys.exit("vo.py: the TTS service rejected the request (403). Update edge-tts: pip3 install -U edge-tts")
        raise


if __name__ == "__main__":
    main()
