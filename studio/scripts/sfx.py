"""Synthesize the reel SFX library into public/sfx/ using only the stdlib.

No downloads, no API keys: every sound is generated procedurally so the
sound director always has a consistent palette to cue against.
"""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 44100
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "sfx"


def envelope(i: int, n: int, attack: float, decay_pow: float) -> float:
    t = i / n
    if t < attack:
        return t / attack
    return (1 - (t - attack) / (1 - attack)) ** decay_pow


def whoosh(n: int) -> list[float]:
    rng = random.Random(1)
    out, lp = [], 0.0
    for i in range(n):
        cutoff = 0.02 + 0.25 * math.sin(math.pi * i / n)
        lp += cutoff * (rng.uniform(-1, 1) - lp)
        out.append(lp * 2.2 * envelope(i, n, 0.45, 1.5))
    return out


def tone(n: int, f0: float, f1: float, attack: float, decay_pow: float, harmonics: int = 1) -> list[float]:
    out, phase = [], 0.0
    for i in range(n):
        freq = f0 + (f1 - f0) * (i / n)
        phase += 2 * math.pi * freq / RATE
        s = sum(math.sin(phase * h) / h for h in range(1, harmonics + 1))
        out.append(s * envelope(i, n, attack, decay_pow))
    return out


def click(n: int) -> list[float]:
    rng = random.Random(2)
    return [rng.uniform(-1, 1) * (1 - i / n) ** 6 for i in range(n)]


SOUNDS = {
    "whoosh": lambda: whoosh(int(RATE * 0.45)),
    "pop": lambda: tone(int(RATE * 0.12), 520, 900, 0.02, 3),
    "click": lambda: click(int(RATE * 0.03)),
    "tick": lambda: tone(int(RATE * 0.05), 1800, 1700, 0.01, 4),
    "rise": lambda: tone(int(RATE * 0.9), 180, 900, 0.85, 0.5, harmonics=3),
    "thud": lambda: tone(int(RATE * 0.35), 110, 45, 0.01, 2.5, harmonics=2),
    "ding": lambda: tone(int(RATE * 0.8), 1320, 1320, 0.005, 2.2, harmonics=3),
}


def write(name: str, samples: list[float]) -> None:
    peak = max(abs(s) for s in samples) or 1.0
    frames = b"".join(struct.pack("<h", int(s / peak * 0.85 * 32767)) for s in samples)
    with wave.open(str(OUT_DIR / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(frames)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, make in SOUNDS.items():
        write(name, make())
    print(f"wrote {len(SOUNDS)} sounds to {OUT_DIR}")


if __name__ == "__main__":
    main()
