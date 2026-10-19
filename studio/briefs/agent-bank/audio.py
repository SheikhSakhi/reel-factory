"""Score + SFX for the agent-bank reel, synthesized from take.json (no samples, no downloads).

    python3 briefs/agent-bank/audio.py              # Russian take
    python3 briefs/agent-bank/audio.py agent-bank-en  # English take

Writes public/audio/<slug>/music.wav (ducked under the voice) and sfx/*.wav.
Every section boundary is read from the spoken words, so re-synthesizing the
voice-over and re-running this script keeps the score in sync.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt, sosfilt_zi

SR = 44100
ROOT = Path(__file__).resolve().parents[2]
SLUG = sys.argv[1] if len(sys.argv) > 1 else "agent-bank"
# Section anchors are written as Russian tokens; other languages map them to their own words.
ANCHORS = (
    json.loads((ROOT / "src" / "reels" / "agent-bank" / "anchors-en.json").read_text()) if SLUG.endswith("-en") else {}
)
OUT = ROOT / "public" / "audio" / SLUG
TAKE = json.loads((ROOT / "public" / "vo" / SLUG / "take.json").read_text())
FPS = TAKE["fps"]
TOTAL = TAKE["totalFrames"] / FPS
N = int(TOTAL * SR)
rng = np.random.default_rng(7)


def word(scene_id: str, token: str, occurrence: int = 0) -> float:
    if ANCHORS:
        token, occurrence = ANCHORS[f"{scene_id}:{token}:{occurrence}"]
    scene = next(s for s in TAKE["scenes"] if s["id"] == scene_id)
    hits = [w for w in scene["words"] if w["token"].strip(".,:;?!").lower() == token.lower()]
    return hits[occurrence]["start"]


def scene_start(scene_id: str) -> float:
    return next(s for s in TAKE["scenes"] if s["id"] == scene_id)["words"][0]["start"]


# ── timeline (seconds) ────────────────────────────────────────────────
T = {
    "trillion": word("S2", "триллионов"),
    "groove": scene_start("S3"),
    "wave": word("S4", "Волна"),
    "problem": scene_start("S5"),
    "fraud": word("S5", "мошенников"),
    "solution": scene_start("S6"),
    "insure": scene_start("S7"),
    "ocean_in": scene_start("S8"),
    "ocean": word("S8", "океан"),
    "bank": scene_start("S9"),
    "condition": word("S9", "условие"),
    "memory": scene_start("S10"),
    "race": word("S11", "гонка"),
    "breakthrough": word("S11", "технологическим"),
    "final": scene_start("S12"),
    "treint": word("S12", "Треинт"),
    "end": TOTAL,
}
BPM = 112
BEAT = 60 / BPM
BAR = 4 * BEAT
GRID0 = T["groove"]  # the groove's first downbeat anchors the drum grid


def mtof(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def idx(t: float) -> int:
    return int(np.clip(t, 0, TOTAL) * SR)


def env_lin(points: list[tuple[float, float]]) -> np.ndarray:
    """Piecewise-linear gain curve over the whole timeline."""
    ts, vs = zip(*points)
    return np.interp(np.arange(N) / SR, ts, vs).astype(np.float32)


def saw(freq: np.ndarray | float, n: int, phase0: float = 0.0) -> np.ndarray:
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    ph = phase0 + np.cumsum(f) / SR
    return (2 * (ph % 1.0) - 1).astype(np.float32)


def sine(freq: np.ndarray | float, n: int) -> np.ndarray:
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    return np.sin(2 * np.pi * np.cumsum(f) / SR).astype(np.float32)


def sweep_filter(x: np.ndarray, cutoff: np.ndarray, kind: str = "low", block: int = 512) -> np.ndarray:
    """Time-varying 2nd-order Butterworth, coefficients updated per block."""
    y = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), block):
        c = float(np.clip(cutoff[min(s, len(cutoff) - 1)], 30, SR * 0.45))
        sos = butter(2, c, btype=kind, fs=SR, output="sos")
        if zi is None:
            zi = sosfilt_zi(sos) * 0.0
        y[s:s + block], zi = sosfilt(sos, x[s:s + block], zi=zi)
    return y


def bandpass(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x).astype(np.float32)


def highpass(x: np.ndarray, f: float) -> np.ndarray:
    return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x).astype(np.float32)


def lowpass(x: np.ndarray, f: float) -> np.ndarray:
    return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x).astype(np.float32)


def reverb(x: np.ndarray, seconds: float = 2.8, mix: float = 0.35) -> np.ndarray:
    n = int(seconds * SR)
    ir = rng.standard_normal(n).astype(np.float32) * np.exp(-np.linspace(0, 7, n)).astype(np.float32)
    ir = lowpass(ir, 6000)
    wet = fftconvolve(x, ir)[: len(x)].astype(np.float32)
    wet *= np.max(np.abs(x)) / (np.max(np.abs(wet)) + 1e-9)
    return x * (1 - mix) + wet * mix


def place(bus: np.ndarray, sound: np.ndarray, t: float, gain: float = 1.0) -> None:
    s = idx(t)
    e = min(N, s + len(sound))
    if s < N:
        bus[s:e] += sound[: e - s] * gain


def decay(n: int, rate: float) -> np.ndarray:
    return np.exp(-np.arange(n) / SR * rate).astype(np.float32)


# ── chords ───────────────────────────────────────────────────────────
# A minor family. Each chord: MIDI notes for the pad, root for the bass.
CH = {
    "Am": ([57, 60, 64, 69], 45), "F": ([53, 57, 60, 65], 41), "C": ([55, 60, 64, 67], 48),
    "G": ([55, 59, 62, 67], 43), "Bb": ([58, 62, 65, 70], 46), "Em": ([55, 59, 64, 67], 40),
    "Dm": ([57, 62, 65, 69], 38), "Fmaj7": ([53, 57, 60, 64], 41), "Csus": ([55, 60, 62, 67], 48),
}
# (start, chord sequence, seconds per chord)
SECTIONS = [
    (0.0, ["Am", "Am", "F", "F"], BAR * 1.5),
    (T["trillion"] - 4 * BEAT, ["F", "G"], BAR),
    (T["groove"], ["Am", "F", "C", "G"], BAR),
    (T["problem"], ["Am", "Bb"], BAR),
    (T["solution"], ["F", "C", "G", "Am"], BAR),
    (T["ocean_in"], ["F", "G", "Am", "C"], BAR),
    (T["bank"], ["F", "G"], BAR),
    (T["condition"] + 0.6, ["Am"], BAR * 2),
    (T["memory"], ["Am", "Fmaj7", "C", "Em"], BAR * 2),
    (T["race"], ["Dm", "Am", "Bb", "G"], BAR),
    (T["final"], ["F", "G", "Am", "C"], BAR),
    (T["treint"], ["Fmaj7", "Csus", "C"], BAR * 2),
]


def chord_at(t: float) -> str:
    start, seq, dur = SECTIONS[0]
    for sec in SECTIONS:
        if t >= sec[0]:
            start, seq, dur = sec
    return seq[int((t - start) // dur) % len(seq)]


def chord_segments() -> list[tuple[float, float, str]]:
    """Contiguous (start, end, chord) spans across the timeline."""
    segs = []
    bounds = [s[0] for s in SECTIONS] + [TOTAL]
    for (start, seq, dur), end in zip(SECTIONS, bounds[1:]):
        t, k = start, 0
        while t < end - 1e-6:
            segs.append((t, min(end, t + dur), seq[k % len(seq)]))
            t += dur
            k += 1
    return segs


SEGS = chord_segments()


# ── layers ───────────────────────────────────────────────────────────
def pad_layer() -> np.ndarray:
    out = np.zeros(N, np.float32)
    fade = int(0.25 * SR)
    for a, b, name in SEGS:
        s, e = idx(a), idx(b)
        n = e - s + fade
        notes, _ = CH[name]
        tone = np.zeros(n, np.float32)
        for m in notes:
            for det in (-0.08, 0.0, 0.07):
                tone += saw(mtof(m + det), n, rng.random())
        tone /= len(notes) * 3
        g = np.ones(n, np.float32)
        g[:fade] = np.linspace(0, 1, fade)
        g[-fade:] = np.linspace(1, 0, fade)
        end = min(N, s + n)
        out[s:end] += (tone * g)[: end - s]
    cutoff = env_lin([
        (0, 350), (T["trillion"] - 0.2, 2600), (T["trillion"] + 0.5, 1800), (T["groove"], 1400),
        (T["problem"], 1500), (T["problem"] + 0.4, 420), (T["solution"], 600), (T["solution"] + 2, 2400),
        (T["ocean_in"], 2600), (T["ocean"], 5200), (T["condition"], 3800), (T["condition"] + 0.7, 300),
        (T["memory"], 450), (T["race"], 900), (T["final"] - 0.1, 3200), (T["final"], 2200),
        (T["treint"], 5000), (TOTAL, 1500),
    ])
    out = sweep_filter(out, cutoff)
    gain = env_lin([
        (0, 0.0), (1.5, 0.55), (T["trillion"], 0.8), (T["groove"], 0.5), (T["problem"], 0.6),
        (T["solution"], 0.55), (T["ocean_in"], 0.6), (T["ocean"], 0.75), (T["condition"] + 0.5, 0.7),
        (T["condition"] + 0.7, 0.0), (T["memory"] - 0.5, 0.0), (T["memory"] + 2, 0.4), (T["race"], 0.45),
        (T["final"], 0.7), (T["treint"], 0.85), (TOTAL - 3, 0.6), (TOTAL, 0.0),
    ])
    return reverb(out * gain, 3.2, 0.4)


def bass_layer() -> np.ndarray:
    out = np.zeros(N, np.float32)
    eighth = BEAT / 2
    for a, b, name in SEGS:
        root = CH[name][1]
        t = a
        while t < b - 1e-6:
            n = int(eighth * SR * 0.92)
            note = saw(mtof(root), n) * 0.6 + sine(mtof(root - 12), n)
            note *= decay(n, 6.0)
            place(out, note, t)
            t += eighth
    out = lowpass(out, 420)
    gain = env_lin([
        (0, 0.0), (T["trillion"] - 2, 0.0), (T["trillion"], 0.5), (T["groove"], 0.6), (T["problem"], 0.35),
        (T["solution"], 0.45), (T["ocean_in"], 0.7), (T["condition"] + 0.5, 0.7), (T["condition"] + 0.6, 0.0),
        (T["race"], 0.0), (T["race"] + 0.1, 0.45), (T["final"], 0.55), (T["treint"], 0.5),
        (TOTAL - 4, 0.3), (TOTAL, 0.0),
    ])
    return out * gain


def kick(n_sec: float = 0.45) -> np.ndarray:
    n = int(n_sec * SR)
    f = 45 + 110 * np.exp(-np.arange(n) / SR * 28)
    return (sine(f, n) * decay(n, 7.5) + rng.standard_normal(n).astype(np.float32) * decay(n, 400) * 0.25)


def clap() -> np.ndarray:
    n = int(0.25 * SR)
    x = bandpass(rng.standard_normal(n).astype(np.float32), 900, 3500)
    e = decay(n, 16)
    for k in (0.0, 0.012, 0.024):
        e[int(k * SR):] += decay(n - int(k * SR), 60) * 0.6
    return x * e * 0.5


def hat(open_: bool = False) -> np.ndarray:
    n = int((0.18 if open_ else 0.05) * SR)
    return highpass(rng.standard_normal(n).astype(np.float32), 7000) * decay(n, 18 if open_ else 70) * 0.35


def beats_between(a: float, b: float, step: float) -> np.ndarray:
    first = GRID0 + np.ceil((a - GRID0) / step) * step
    return np.arange(first, b - 1e-6, step)


def drums_layer() -> np.ndarray:
    out = np.zeros(N, np.float32)
    k, c, h, ho = kick(), clap(), hat(), hat(True)

    def groove(a: float, b: float, level: float, sixteenth_hats: bool = False, claps: bool = True) -> None:
        for t in beats_between(a, b, BEAT):
            place(out, k, t, level)
            place(out, ho if sixteenth_hats else h, t + BEAT / 2, level * 0.8)
        if claps:
            for t in beats_between(a + BEAT, b, 2 * BEAT):
                place(out, c, t, level * 0.9)
        if sixteenth_hats:
            for t in beats_between(a, b, BEAT / 4):
                place(out, h, t, level * 0.35)

    # Hook: a heartbeat-like sub pulse, no grid yet.
    t = 0.6
    while t < T["trillion"] - 1.0:
        place(out, kick(0.3), t, 0.45)
        place(out, kick(0.3), t + 0.22, 0.25)
        t += 1.1
    groove(T["groove"], T["problem"] - BEAT, 0.85, sixteenth_hats=False)
    groove(T["wave"], T["problem"] - BEAT, 0.35, sixteenth_hats=True, claps=False)
    # Problem: half-time thumps only.
    for t in beats_between(T["problem"], T["solution"], 2 * BEAT):
        place(out, kick(), t, 0.6)
    groove(T["solution"] + BAR, T["ocean_in"], 0.6, claps=False)
    groove(T["insure"], T["ocean_in"], 0.5)
    groove(T["ocean_in"], T["condition"] + 0.5, 1.0, sixteenth_hats=True)
    # Memory: slow heartbeat (lub-dub).
    t = T["memory"] + 1.0
    while t < T["race"]:
        place(out, kick(0.35), t, 0.5)
        place(out, kick(0.3), t + 0.24, 0.3)
        t += 60 / 66
    # Race: ticking sixteenths that thicken toward the breakthrough.
    for t in beats_between(T["race"], T["final"] - BEAT, BEAT / 4):
        lvl = 0.15 + 0.5 * (t - T["race"]) / (T["final"] - T["race"])
        place(out, h, t, lvl)
    for t in beats_between(T["breakthrough"], T["final"] - BEAT, BEAT):
        place(out, k, t, 0.7)
    groove(T["final"], T["treint"], 0.75)
    groove(T["treint"] + BAR, TOTAL - 3.5, 0.45, claps=False)
    return out


def arp_layer() -> np.ndarray:
    out = np.zeros(N, np.float32)
    step = BEAT / 4

    def run(a: float, b: float, level: float, octave: int = 12) -> None:
        for i, t in enumerate(beats_between(a, b, step)):
            notes = CH[chord_at(t)][0]
            m = notes[[0, 1, 2, 3, 2, 1][i % 6]] + octave
            n = int(step * SR * 1.6)
            tone = (saw(mtof(m), n) * 0.5 + sine(mtof(m), n)) * decay(n, 14)
            place(out, tone, t, level)

    run(T["wave"], T["problem"] - BEAT, 0.35)
    run(T["insure"], T["ocean_in"], 0.3)
    run(T["ocean_in"], T["condition"] + 0.4, 0.45)
    run(T["final"], TOTAL - 3, 0.35)
    out = lowpass(out, 5200)
    return reverb(out, 1.6, 0.3)


def keys_layer() -> np.ndarray:
    """Soft bell-piano for the memory section: slow broken chords."""
    out = np.zeros(N, np.float32)
    for i, t in enumerate(np.arange(T["memory"] + 0.5, T["race"], BEAT)):
        notes = CH[chord_at(t)][0]
        m = notes[[0, 2, 3, 1][i % 4]] + 12
        n = int(2.2 * SR)
        tone = (sine(mtof(m), n) + 0.3 * sine(mtof(m) * 2, n) + 0.1 * sine(mtof(m) * 3.01, n)) * decay(n, 2.2)
        place(out, tone, t, 0.35)
    for t in np.arange(T["treint"], TOTAL - 2, BEAT * 2):
        notes = CH[chord_at(t)][0]
        for j, m in enumerate(notes):
            n = int(3 * SR)
            tone = (sine(mtof(m + 12), n) + 0.25 * sine(mtof(m + 24), n)) * decay(n, 1.4)
            place(out, tone, t + j * 0.06, 0.18)
    return reverb(out, 3.5, 0.45)


def noise_riser(seconds: float, f0: float = 300, f1: float = 9000) -> np.ndarray:
    n = int(seconds * SR)
    x = rng.standard_normal(n).astype(np.float32)
    cutoff = np.geomspace(f0, f1, n)
    y = sweep_filter(x, cutoff, "low")
    return y * np.linspace(0, 1, n) ** 2.2


def impact() -> np.ndarray:
    n = int(3.0 * SR)
    f = 32 + 90 * np.exp(-np.arange(n) / SR * 9)
    boom = sine(f, n) * decay(n, 1.6)
    crash = highpass(rng.standard_normal(n).astype(np.float32), 3000) * decay(n, 2.2) * 0.35
    return reverb(boom + crash, 2.5, 0.3)


def fx_layer() -> np.ndarray:
    out = np.zeros(N, np.float32)
    for at, length in ((T["trillion"], 3.6), (T["ocean"], 4.0), (T["final"], 4.5), (T["treint"], 2.4)):
        r = noise_riser(length)
        place(out, r, at - length, 0.5)
        place(out, impact(), at, 0.9)
    place(out, noise_riser(2.0, 200, 4000), T["solution"] - 2.0, 0.3)
    place(out, noise_riser(1.6, 200, 5000), T["ocean_in"] - 1.6, 0.35)
    # Sub drop when everything cuts at "условие".
    n = int(2.2 * SR)
    drop = sine(70 * np.exp(-np.arange(n) / SR * 1.2) + 25, n) * decay(n, 1.3)
    place(out, drop, T["condition"] + 0.6, 0.9)
    return out


def duck_curve() -> np.ndarray:
    """Music gain that dips under the voice (about -5 dB while words are spoken)."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(ROOT / "public" / "vo" / SLUG / "take.mp3"),
         "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    vo = np.frombuffer(raw, np.float32)
    vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
    hop = int(0.02 * SR)
    frames = len(vo) // hop
    rms = np.sqrt(np.mean(vo[: frames * hop].reshape(frames, hop) ** 2, axis=1))
    level = np.clip(rms / (np.percentile(rms[rms > 1e-4], 90) + 1e-9), 0, 1)
    smooth = np.zeros_like(level)
    for i in range(1, frames):
        coef = 0.5 if level[i] > smooth[i - 1] else 0.06  # fast attack, slow release
        smooth[i] = smooth[i - 1] + coef * (level[i] - smooth[i - 1])
    g = 1 - 0.45 * smooth
    return np.interp(np.arange(N), np.arange(frames) * hop, g).astype(np.float32)


# ── SFX (placed from the reel code on spoken words) ──────────────────
def sfx_bank() -> dict[str, np.ndarray]:
    def n_(s: float) -> int:
        return int(s * SR)

    noise = lambda s: rng.standard_normal(n_(s)).astype(np.float32)
    bank = {}
    bank["impact"] = impact()
    bank["riser"] = noise_riser(2.0)
    bank["swoosh"] = sweep_filter(noise(0.6), np.concatenate([np.geomspace(400, 6000, n_(0.3)), np.geomspace(6000, 300, n_(0.3))]), "low") * np.hanning(n_(0.6)).astype(np.float32) * 2
    n = n_(0.5)
    bank["glitch"] = np.concatenate([
        (np.sign(sine(f, n_(0.04))) * 0.4 + noise(0.04) * 0.3) * (k % 2) for k, f in enumerate([220, 880, 140, 1760, 330, 990, 110, 2200, 440, 660, 180, 1320])
    ]).astype(np.float32)
    n = n_(1.1)
    ring = sum(sine(f, n) * decay(n, 4 + j) / (j + 1) for j, f in enumerate([2093, 2637, 3136, 4186]))
    ring2 = np.zeros(n, np.float32)
    ring2[n_(0.09):] = ring[: n - n_(0.09)]
    bank["coin"] = (ring * 0.5 + ring2 * 0.6 + highpass(noise(1.1), 5000) * decay(n, 40) * 0.6).astype(np.float32)
    bank["swipe"] = bandpass(noise(0.35), 1500, 7000) * np.sin(np.linspace(0, np.pi, n_(0.35))).astype(np.float32) ** 2
    n = n_(1.6)
    shimmer = sum(sine(mtof(m), n) for m in (72, 76, 79, 84, 88)) / 5
    bank["shield"] = reverb((shimmer * (1 - np.exp(-np.arange(n) / SR * 8)) * decay(n, 2.2)).astype(np.float32), 2.0, 0.4)
    n = n_(0.5)
    bank["ping"] = (np.concatenate([sine(1318, n_(0.12)) * decay(n_(0.12), 25), sine(1760, n - n_(0.12)) * decay(n - n_(0.12), 7)])).astype(np.float32)
    n = n_(0.06)
    bank["blip"] = sine(2400, n) * decay(n, 60)
    bank["tick"] = highpass(noise(0.02), 3000) * decay(n_(0.02), 300)
    n = n_(0.7)
    bank["crack"] = (highpass(noise(0.7), 1200) * decay(n, 9) + (rng.random(n) > 0.995).astype(np.float32) * decay(n, 4) * 0.8).astype(np.float32)
    n = n_(1.2)
    bank["error"] = (np.sign(sine(180, n)) * 0.3 + np.sign(sine(186, n)) * 0.3).astype(np.float32) * decay(n, 3)
    bank["error"] = lowpass(bank["error"], 1800)
    n = n_(4.0)
    bong = sum(sine(mtof(m), n) * decay(n, 0.9 + 0.3 * j) for j, m in enumerate((36, 48, 55, 64, 72)))
    bank["logo"] = reverb((bong / 3).astype(np.float32), 3.5, 0.5)
    n = n_(0.8)
    bank["node"] = reverb((sine(mtof(84), n) * 0.5 + sine(mtof(91), n) * 0.3) * decay(n, 9), 1.0, 0.4)
    n = n_(0.3)
    bank["stamp"] = (sine(90 * np.exp(-np.arange(n) / SR * 8) + 40, n) * decay(n, 12) + bandpass(noise(0.3), 400, 2500) * decay(n, 30) * 0.6).astype(np.float32)
    n = n_(1.4)
    bank["hum"] = lowpass(saw(55, n) + saw(55.4, n), 300) * np.hanning(n).astype(np.float32)
    return bank


def write_wav(path: Path, x: np.ndarray, peak_db: float = -1.0) -> None:
    x = np.asarray(x, np.float32)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    peak = np.max(np.abs(x)) + 1e-9
    x = x / peak * 10 ** (peak_db / 20)
    pcm = (x * 32767).astype("<i2").tobytes()
    import wave
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm)


def main() -> None:
    (OUT / "sfx").mkdir(parents=True, exist_ok=True)
    pad, bass, drums, arp, keys, fx = pad_layer(), bass_layer(), drums_layer(), arp_layer(), keys_layer(), fx_layer()
    duck = duck_curve()
    # Light stereo: pad and keys widened with a short delay on the right channel.
    d = int(0.012 * SR)
    wide_l = pad + keys * 0.9
    wide_r = np.concatenate([np.zeros(d, np.float32), (pad + keys * 0.9)[:-d]])
    center = bass * 0.9 + drums * 0.8 + fx * 0.7
    left = (wide_l * 0.6 + arp * 0.55 + center) * duck
    right = (wide_r * 0.6 + np.concatenate([np.zeros(d * 2, np.float32), arp[:-2 * d]]) * 0.55 + center) * duck
    mix = np.stack([left, right], axis=1)
    mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.6) / np.tanh(1.6)  # gentle glue saturation
    tail = int(2.5 * SR)
    mix[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 1.5
    write_wav(OUT / "music.wav", mix, -3.0)
    bank = sfx_bank()
    for name, sound in bank.items():
        write_wav(OUT / "sfx" / f"{name}.wav", sound, -1.0)
    print(f"music {TOTAL:.1f}s + {len(bank)} sfx -> {OUT.relative_to(ROOT)}")
    for k, v in T.items():
        print(f"  {k:<13}{v:7.2f}s")


if __name__ == "__main__":
    main()
