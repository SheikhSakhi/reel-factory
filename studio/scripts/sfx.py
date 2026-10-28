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


def impact(n: int) -> list[float]:
    """Cinematic hit: a sub-bass drop under a short noise crack."""
    rng = random.Random(3)
    out, phase, lp = [], 0.0, 0.0
    for i in range(n):
        t = i / RATE
        phase += 2 * math.pi * (38 + 70 * math.exp(-t * 18)) / RATE
        sub = math.sin(phase) * math.exp(-t * 3.2)
        lp += 0.35 * (rng.uniform(-1, 1) - lp)
        crack = lp * math.exp(-t * 40) * 0.9
        out.append(sub + crack)
    return out


def swoosh(n: int, seed: int = 4) -> list[float]:
    """Big air movement: band-passed noise sweeping up then down, slower and fuller than `whoosh`."""
    rng = random.Random(seed)
    out, lp, bp = [], 0.0, 0.0
    for i in range(n):
        x = i / n
        cutoff = 0.01 + 0.18 * math.sin(math.pi * x) ** 2
        lp += cutoff * (rng.uniform(-1, 1) - lp)
        bp += 0.5 * (lp - bp)
        out.append((lp - bp * 0.4) * 3.0 * math.sin(math.pi * x) ** 1.6)
    return out


def shimmer(n: int) -> list[float]:
    """A soft magical light: detuned high partials with a slow swell and tremolo."""
    out = []
    for i in range(n):
        t = i / RATE
        env = math.sin(math.pi * min(1.0, i / n)) ** 1.5
        s = sum(math.sin(2 * math.pi * f * t) for f in (1568, 1574, 2093, 2349, 3136)) / 5
        out.append(s * env * (0.75 + 0.25 * math.sin(2 * math.pi * 7 * t)))
    return out


def blip(n: int) -> list[float]:
    """A short digital data blip (square-ish, high)."""
    out = []
    for i in range(n):
        t = i / RATE
        s = 1.0 if math.sin(2 * math.pi * 2400 * t) > 0 else -1.0
        out.append(s * 0.4 * (1 - i / n) ** 3)
    return out


def particles(n: int) -> list[float]:
    """Granular crackle: many tiny random clicks, dense in the middle."""
    rng = random.Random(5)
    out = [0.0] * n
    for _ in range(420):
        at = int(n * min(0.999, abs(rng.gauss(0.35, 0.18))))
        size = rng.randint(30, 160)
        amp = rng.uniform(0.2, 1.0)
        f = rng.uniform(2500, 7000)
        for k in range(size):
            if at + k < n:
                out[at + k] += amp * math.sin(2 * math.pi * f * k / RATE) * (1 - k / size) ** 2
    return out


def hum(n: int) -> list[float]:
    """A low, slowly breathing drone bed for animation sequences (loops cleanly)."""
    out = []
    for i in range(n):
        t = i / RATE
        breath = 0.7 + 0.3 * math.sin(2 * math.pi * t / (n / RATE))
        s = math.sin(2 * math.pi * 55 * t) + 0.5 * math.sin(2 * math.pi * 82.5 * t) + 0.25 * math.sin(2 * math.pi * 110.3 * t)
        fade = min(1.0, i / (RATE * 0.5), (n - i) / (RATE * 0.5))
        out.append(s * breath * fade)
    return out


SOUNDS = {
    "whoosh": lambda: whoosh(int(RATE * 0.45)),
    "pop": lambda: tone(int(RATE * 0.12), 520, 900, 0.02, 3),
    "click": lambda: click(int(RATE * 0.03)),
    "tick": lambda: tone(int(RATE * 0.05), 1800, 1700, 0.01, 4),
    "rise": lambda: tone(int(RATE * 0.9), 180, 900, 0.85, 0.5, harmonics=3),
    "thud": lambda: tone(int(RATE * 0.35), 110, 45, 0.01, 2.5, harmonics=2),
    "ding": lambda: tone(int(RATE * 0.8), 1320, 1320, 0.005, 2.2, harmonics=3),
    "impact": lambda: impact(int(RATE * 1.6)),
    "swoosh": lambda: swoosh(int(RATE * 1.1)),
    "riser": lambda: tone(int(RATE * 2.2), 90, 700, 0.95, 0.3, harmonics=5),
    "shimmer": lambda: shimmer(int(RATE * 1.8)),
    "blip": lambda: blip(int(RATE * 0.06)),
    "particles": lambda: particles(int(RATE * 1.4)),
    "hum": lambda: hum(int(RATE * 8)),
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
