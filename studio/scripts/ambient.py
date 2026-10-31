"""Generate a soft ambient music bed (no samples, no licences): slow pad chords, sparse bell notes, room reverb.

    python3 scripts/ambient.py <out.wav> <seconds> [--mood warm|calm|night] [--seed 3]

Used under character episodes instead of sound effects: it sits under the voices (play it at about 0.2-0.3 and
dip it while someone speaks). Moods are chord progressions; everything is synthesized here, so it is royalty-free.
"""
import argparse
import math
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

RATE = 44100
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}

# Chords as note names with octave; each lasts one bar of the progression.
MOODS = {
    "warm": [["C3", "G3", "E4", "B4"], ["A2", "E3", "C4", "G4"], ["F2", "C3", "A3", "E4"], ["G2", "D3", "B3", "E4"]],
    "calm": [["D3", "A3", "F#4", "C#5"], ["B2", "F#3", "D4", "A4"], ["G2", "D3", "B3", "F#4"], ["A2", "E3", "C#4", "E4"]],
    "night": [["A2", "E3", "C4", "G4"], ["F2", "C3", "A3", "E4"], ["D3", "A3", "F4", "C5"], ["E2", "B2", "G#3", "D4"]],
}


def hz(name: str) -> float:
    pitch, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[pitch] + 12 * (octave + 1) - 69) / 12)


def pad(freqs: list[float], n: int, rng: np.random.Generator) -> np.ndarray:
    """Detuned sine + soft triangle voices, slow breathing; one chord, n samples."""
    t = np.arange(n) / RATE
    out = np.zeros(n)
    for f in freqs:
        for detune in (-0.12, 0.0, 0.13):
            ph = rng.uniform(0, 2 * math.pi)
            ff = f * 2 ** (detune / 12)
            out += np.sin(2 * math.pi * ff * t + ph) * 0.6
            out += (2 / math.pi) * np.arcsin(np.sin(2 * math.pi * ff * t + ph)) * 0.25  # triangle: a little body
    breathe = 0.85 + 0.15 * np.sin(2 * math.pi * t / 7.3 + rng.uniform(0, 6))
    return out * breathe / (len(freqs) * 3)


def bell(f: float, n: int) -> np.ndarray:
    t = np.arange(n) / RATE
    env = np.exp(-t * 2.2) * np.minimum(1, t / 0.008)
    return (np.sin(2 * math.pi * f * t) + 0.3 * np.sin(2 * math.pi * f * 2.01 * t) + 0.12 * np.sin(2 * math.pi * f * 3.02 * t)) * env


def reverb(x: np.ndarray, seconds: float = 3.2, rng: np.random.Generator | None = None) -> np.ndarray:
    """Convolution with a synthetic room tail (decaying filtered noise)."""
    rng = rng or np.random.default_rng(0)
    n = int(seconds * RATE)
    tail = rng.standard_normal(n) * np.exp(-np.arange(n) / RATE * (6.9 / seconds))
    tail = sosfilt(butter(2, 5000, "low", fs=RATE, output="sos"), tail)
    tail /= np.sqrt(np.sum(tail ** 2))
    return fftconvolve(x, tail)[: len(x)]


def make(seconds: float, mood: str, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    chords = MOODS[mood]
    bar = 6.0  # seconds per chord: slow, so it never competes with the voice
    total = int(seconds * RATE)
    fade = int(1.5 * RATE)
    music = np.zeros(total + int(bar * RATE) + fade)
    k = 0
    while k * bar * RATE < total:
        chord = chords[k % len(chords)]
        n = int(bar * RATE) + fade
        start = int(k * bar * RATE)
        env = np.ones(n)
        env[:fade] = np.sin(np.linspace(0, math.pi / 2, fade)) ** 2
        env[-fade:] = np.cos(np.linspace(0, math.pi / 2, fade)) ** 2
        music[start:start + n] += pad([hz(c) for c in chord], n, rng) * env
        # two or three soft bell notes per bar, from the chord, an octave up
        for _ in range(int(rng.integers(2, 4))):
            at = start + int(rng.uniform(0.3, bar - 1.0) * RATE)
            note = hz(chord[int(rng.integers(1, len(chord)))]) * 2
            b = bell(note, int(2.5 * RATE)) * 0.18
            music[at:at + len(b)] += b[: max(0, len(music) - at)]
        k += 1
    music = music[:total]
    music = sosfilt(butter(2, 2800, "low", fs=RATE, output="sos"), music)  # warm, dark top end
    music = sosfilt(butter(1, 60, "high", fs=RATE, output="sos"), music)
    wet = reverb(music, rng=rng)
    out = 0.55 * music + 0.75 * wet
    # gentle fade in/out
    fi, fo = int(2 * RATE), int(3 * RATE)
    out[:fi] *= np.linspace(0, 1, fi)
    out[-fo:] *= np.linspace(1, 0, fo)
    return out / (np.max(np.abs(out)) + 1e-9) * 0.7


def main() -> None:
    p = argparse.ArgumentParser(description="Soft ambient music bed")
    p.add_argument("out")
    p.add_argument("seconds", type=float)
    p.add_argument("--mood", choices=sorted(MOODS), default="warm")
    p.add_argument("--seed", type=int, default=3)
    a = p.parse_args()
    import wave
    data = make(a.seconds, a.mood, a.seed)
    stereo = np.stack([data, np.roll(data, int(0.012 * RATE))], axis=1)  # a touch of width
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    with wave.open(a.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((stereo * 32767).astype("<i2").tobytes())
    print(f"wrote {a.out} ({a.seconds:.1f}s, {a.mood})")


if __name__ == "__main__":
    main()
