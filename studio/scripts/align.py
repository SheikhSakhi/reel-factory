"""Acoustic refinement of whisper word timings (pure Python, no extra packages).

Whisper's word timestamps drift: words get stretched into pauses or placed in silence, which
makes transcript-based cuts land mid-word. This pass re-times words against the audio itself:

1. Speech regions: a 10 ms loudness envelope, thresholded above the recording's noise floor.
2. Assignment: every word goes to one region, in order (dynamic programming), minimising the
   distance between whisper's estimate and the region, with a penalty for a sentence end that
   does not close its region (speakers pause between sentences).
3. Timing: inside a region, words share its duration in proportion to their length, then each
   boundary between words snaps to the quietest 10 ms within +-110 ms (the gap between words).

Usage from edit.py: refine(words, "audio16k.wav") -> words with corrected start/end.
"""
import array
import math
import re
import wave

WINDOW = 0.01
FLOOR_PERCENTILE = 0.10
SPEECH_ABOVE_FLOOR_DB = 12
MERGE_GAP = 0.12
MIN_REGION = 0.08
SNAP_RADIUS = 0.11
SENTENCE_END_PENALTY = 1.0


def envelope(path: str) -> list[float]:
    """Loudness in dB per 10 ms window of a 16-bit mono WAV."""
    with wave.open(path, "rb") as wav:
        if wav.getsampwidth() != 2 or wav.getnchannels() != 1:
            raise ValueError("align: expected 16-bit mono WAV")
        rate = wav.getframerate()
        samples = array.array("h", wav.readframes(wav.getnframes()))
    size = int(rate * WINDOW)
    out = []
    for start in range(0, len(samples) - size + 1, size):
        chunk = samples[start:start + size]
        rms = math.sqrt(sum(s * s for s in chunk) / size) / 32768
        out.append(20 * math.log10(rms) if rms > 0 else -120.0)
    return out


def speech_regions(env: list[float]) -> list[tuple[float, float]]:
    ordered = sorted(env)
    floor = ordered[int(len(ordered) * FLOOR_PERCENTILE)]
    threshold = floor + SPEECH_ABOVE_FLOOR_DB
    regions: list[list[float]] = []
    for i, db in enumerate(env):
        if db < threshold:
            continue
        t = i * WINDOW
        if regions and t - regions[-1][1] <= MERGE_GAP:
            regions[-1][1] = t + WINDOW
        else:
            regions.append([t, t + WINDOW])
    return [(a, b) for a, b in regions if b - a >= MIN_REGION]


def _distance(word: dict, region: tuple[float, float]) -> float:
    start, end = region
    if word["end"] > start and word["start"] < end:
        overlap = min(word["end"], end) - max(word["start"], start)
        return max(0.0, (word["end"] - word["start"]) - overlap) * 0.25
    return start - word["end"] if word["end"] <= start else word["start"] - end


def _ends_sentence(word: dict) -> bool:
    return re.search(r"[.?!]['\")\]]*$", word["text"]) is not None


def assign(words: list[dict], regions: list[tuple[float, float]]) -> list[int]:
    """Region index per word: monotonic, minimum total cost (dynamic programming)."""
    n, m = len(words), len(regions)
    inf = float("inf")
    cost = [[inf] * m for _ in range(n)]
    back = [[0] * m for _ in range(n)]
    for r in range(m):
        cost[0][r] = _distance(words[0], regions[r])
    for i in range(1, n):
        penalty = SENTENCE_END_PENALTY if _ends_sentence(words[i - 1]) else 0.0
        best_before, best_r = inf, 0  # best cost over regions strictly before r
        for r in range(m):
            stay = cost[i - 1][r] + penalty
            options = [(stay, r), (best_before, best_r)]
            value, origin = min(options)
            cost[i][r] = value + _distance(words[i], regions[r])
            back[i][r] = origin
            if cost[i - 1][r] < best_before:
                best_before, best_r = cost[i - 1][r], r
    r = min(range(m), key=lambda k: cost[n - 1][k])
    path = [r]
    for i in range(n - 1, 0, -1):
        r = back[i][r]
        path.append(r)
    return path[::-1]


def _snap(env: list[float], t: float, lo: float, hi: float) -> float:
    first = max(int((t - SNAP_RADIUS) / WINDOW), int(lo / WINDOW) + 1)
    last = min(int((t + SNAP_RADIUS) / WINDOW), int(hi / WINDOW) - 1, len(env) - 1)
    if last <= first:
        return t
    quietest = min(range(first, last + 1), key=lambda i: env[i])
    return quietest * WINDOW + WINDOW / 2


def refine(words: list[dict], wav_path: str) -> list[dict]:
    if not words:
        return words
    env = envelope(wav_path)
    regions = speech_regions(env)
    if not regions:
        return words
    owner = assign(words, regions)
    out = [dict(w) for w in words]
    for r, (start, end) in enumerate(regions):
        idx = [i for i, o in enumerate(owner) if o == r]
        if not idx:
            continue
        weights = [len(re.sub(r"[\W_]", "", words[i]["text"])) + 1 for i in idx]
        total = sum(weights)
        edges = [start]
        for w in weights[:-1]:
            edges.append(edges[-1] + (end - start) * w / total)
        edges.append(end)
        # Snap inner boundaries to the quietest point nearby, keeping them in order.
        for k in range(1, len(edges) - 1):
            edges[k] = _snap(env, edges[k], edges[k - 1], edges[k + 1])
        for k, i in enumerate(idx):
            out[i]["start"], out[i]["end"] = round(edges[k], 3), round(edges[k + 1], 3)
    return out
