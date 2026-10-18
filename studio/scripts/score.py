"""Procedural score and effects stems for a narrated film, synced to its timing manifest.

Usage: python3 scripts/score.py <slug>

Reads src/reels/<slug>/timing.json (word-level narration timing) and writes
public/ai-terms/score.wav and public/ai-terms/fx.wav (44.1 kHz stereo, 16-bit).
Everything is synthesized here: no downloaded music or samples. Deterministic (fixed seeds).

The cue plan mirrors briefs/<slug>/04-sound.md. Anchors are narration words, so retiming
the voice-over and re-running this script keeps music and effects in sync.
"""
import json
import math
import re
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent


# ------------------------------------------------------------------ timing

class Timing:
    def __init__(self, manifest: dict):
        self.blocks = {b["id"]: b for b in manifest["blocks"]}
        self.duration = manifest["durationSeconds"]

    @staticmethod
    def _n(s: str) -> str:
        return re.sub(r"[^a-z0-9]", "", s.lower())

    def bs(self, bid: str) -> float:
        return self.blocks[bid]["start"]

    def be(self, bid: str) -> float:
        b = self.blocks[bid]
        return b["start"] + b["duration"]

    def at(self, bid: str, word: str, nth: int = 0) -> float:
        hits = [w for w in self.blocks[bid]["words"] if self._n(w["word"]) == self._n(word)]
        return hits[nth]["start"]

    def speech_mask(self, n: int) -> np.ndarray:
        m = np.zeros(n, dtype=np.float32)
        for b in self.blocks.values():
            for w in b["words"]:
                a, z = int((w["start"] - 0.05) * SR), int((w["end"] + 0.12) * SR)
                m[max(0, a):min(n, z)] = 1
        return m


# ------------------------------------------------------------------ dsp helpers

def env_follow(x: np.ndarray, attack: float, release: float) -> np.ndarray:
    """One-pole attack/release smoother, computed on a decimated signal for speed."""
    hop = 64
    xs = x[::hop]
    out = np.zeros_like(xs)
    a = math.exp(-1 / (attack * SR / hop)); r = math.exp(-1 / (release * SR / hop))
    y = 0.0
    for i, v in enumerate(xs):
        c = a if v > y else r
        y = c * y + (1 - c) * v
        out[i] = y
    return np.repeat(out, hop)[: len(x)]


def onepole_lp(x: np.ndarray, cutoff: float) -> np.ndarray:
    a = math.exp(-2 * math.pi * cutoff / SR)
    # vectorized IIR via scipy-free trick: process in python on decimated? keep simple: lfilter by cumulative method
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = a * acc + (1 - a) * x[i]
        y[i] = acc
    return y


def tone(f: float, dur: float, harmonics=(1.0, 0.3, 0.1), phase: float = 0.0) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for k, amp in enumerate(harmonics, start=1):
        out += amp * np.sin(2 * math.pi * f * k * t + phase * k)
    return out


def adsr(n: int, a: float, d: float, s: float, r: float) -> np.ndarray:
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n); e[:na] = np.linspace(0, 1, na, endpoint=False) if na else e[:na]
    nd = min(nd, n - na)
    if nd > 0:
        e[na:na + nd] = np.linspace(1, s, nd)
    if nr > 0 and nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def place(buf: np.ndarray, sig: np.ndarray, t: float, gain: float, pan: float = 0.0) -> None:
    """Add a mono signal into stereo buf at time t with equal-power pan (-1..1)."""
    i = int(t * SR)
    if i >= buf.shape[1] or i + len(sig) <= 0:
        return
    j = min(buf.shape[1], i + len(sig))
    s = sig[: j - i] * gain
    lg = math.cos((pan + 1) * math.pi / 4); rg = math.sin((pan + 1) * math.pi / 4)
    buf[0, i:j] += s * lg
    buf[1, i:j] += s * rg


def noise(n: int, seed: int) -> np.ndarray:
    return np.random.default_rng(seed).uniform(-1, 1, n)


def midi(m: float) -> float:
    return 440 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------ sound designs

def sub_swell(dur: float) -> np.ndarray:
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * math.pi * (38 + 6 * t / dur) * t) * np.sin(math.pi * t / dur) ** 2


def glass_lock() -> np.ndarray:
    n = int(1.6 * SR); t = np.arange(n) / SR
    thud = np.sin(2 * math.pi * (95 * np.exp(-t * 6) + 40) * t) * np.exp(-t * 9)
    ring = sum(np.sin(2 * math.pi * f * t) * a for f, a in ((1318, 0.25), (1975, 0.12), (2637, 0.06))) * np.exp(-t * 3.2)
    return thud * 0.9 + ring * 0.5


def bell(f: float) -> np.ndarray:
    n = int(2.4 * SR); t = np.arange(n) / SR
    return sum(np.sin(2 * math.pi * f * r * t) * a * np.exp(-t * d) for r, a, d in ((1, 1, 1.6), (2.01, 0.35, 2.4), (3.02, 0.15, 3.5)))


def relay(seed: int) -> np.ndarray:
    n = int(0.06 * SR); t = np.arange(n) / SR
    click = noise(n, seed) * np.exp(-t * 180)
    body = np.sin(2 * math.pi * 1650 * t) * np.exp(-t * 90) * 0.4
    return click * 0.7 + body


def tick() -> np.ndarray:
    n = int(0.05 * SR); t = np.arange(n) / SR
    return np.sin(2 * math.pi * 2100 * t) * np.exp(-t * 120)


def soft_pulse() -> np.ndarray:
    n = int(0.35 * SR); t = np.arange(n) / SR
    return np.sin(2 * math.pi * (70 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 11)


def granular_swell(dur: float, seed: int, lo=300, hi=2400, density=120) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    out = np.zeros((2, n))
    count = int(density * dur)
    for _ in range(count):
        t0 = rng.uniform(0, dur)
        f = rng.uniform(lo, hi)
        g = int(rng.uniform(0.03, 0.09) * SR)
        tt = np.arange(g) / SR
        grain = np.sin(2 * math.pi * f * tt) * np.hanning(g)
        level = (t0 / dur) ** 1.5
        place(out, grain, t0, 0.18 * level, rng.uniform(-0.9, 0.9))
    return out[0], out[1]


def descending_tone(f: float) -> np.ndarray:
    n = int(1.8 * SR); t = np.arange(n) / SR
    return np.sin(2 * math.pi * f * t) * np.exp(-t * 1.6) * np.minimum(1, t * 30)


def airy_rise(dur: float) -> np.ndarray:
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * math.pi * f * (1 + 0.15 * t / dur) * t) * a for f, a in ((880, 0.3), (1320, 0.2), (1760, 0.12)))
    return s * (t / dur) ** 1.5 * np.exp(-np.maximum(0, t - dur * 0.85) * 8)


def stamp() -> np.ndarray:
    n = int(0.25 * SR); t = np.arange(n) / SR
    return noise(n, 9) * np.exp(-t * 40) * 0.6 + np.sin(2 * math.pi * 180 * t) * np.exp(-t * 25)


def deep_chord() -> np.ndarray:
    n = int(4.0 * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * math.pi * midi(m) * t) * a for m, a in ((38, 1), (45, 0.6), (50, 0.4), (57, 0.2)))
    return s * np.exp(-t * 0.9) * np.minimum(1, t * 20)


def reverse_swell(dur: float) -> np.ndarray:
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * math.pi * midi(m) * t) * a for m, a in ((50, 0.5), (57, 0.4), (62, 0.3), (69, 0.2)))
    return s * (t / dur) ** 3


# ------------------------------------------------------------------ score

ACT_CHORDS = {
    # D-centred, slowly shifting colours (MIDI notes).
    "open": [38, 50, 57, 64, 65], "ai": [38, 50, 57, 62, 64], "expert": [36, 48, 55, 62, 64],
    "toml": [34, 46, 53, 60, 65], "ml": [41, 53, 57, 60, 64], "infer": [45, 57], "dl": [43, 55, 58, 62, 65],
    "gen": [46, 58, 62, 65, 69], "found": [38, 50, 57, 62, 66], "relate": [38, 50, 57, 64, 69],
    "compute": [43, 55, 59, 62, 66], "return": [38, 50, 57, 62, 64], "caution": [41, 53, 57, 62, 64], "end": [38, 50, 57],
}


def build_score(tm: Timing, total: float) -> np.ndarray:
    n = int(total * SR)
    out = np.zeros((2, n))
    acts: list[tuple[str, float]] = []
    for b in tm.blocks.values():
        if not acts or acts[-1][0] != b["act"]:
            acts.append((b["act"], 0.0 if not acts else b["start"] - 0.6))
    t_all = np.arange(n) / SR
    for idx, (act, start) in enumerate(acts):
        end = acts[idx + 1][1] if idx + 1 < len(acts) else total
        a, z = int(start * SR), min(n, int((end + 2.5) * SR))
        seg_t = t_all[a:z] - start
        fade = np.minimum(1, seg_t / 2.5) * np.minimum(1, np.maximum(0, (end + 2.5 - start - seg_t)) / 2.5)
        if act == "end":  # resolve, then let the last line land in near-silence
            last = tm.at("B44", "our")
            fade *= np.clip((last + 1.0 - (seg_t + start)) / 3.0, 0.0, 1.0) * 0.85 + 0.15 * np.exp(-np.maximum(0, seg_t + start - last) / 1.5)
        for k, m in enumerate(ACT_CHORDS[act]):
            f = midi(m)
            det = 1 + 0.0018 * (k - 2)
            lfo = 0.75 + 0.25 * np.sin(2 * math.pi * (0.05 + 0.013 * k) * seg_t + k)
            wave_l = np.sin(2 * math.pi * f * det * seg_t + k) + 0.18 * np.sin(4 * math.pi * f * seg_t + k)
            wave_r = np.sin(2 * math.pi * f / det * seg_t + 2 * k) + 0.18 * np.sin(4 * math.pi * f * seg_t + 2 * k)
            amp = (0.06 if m < 45 else 0.032) * fade * lfo
            out[0, a:z] += wave_l * amp
            out[1, a:z] += wave_r * amp
    # Inference: everything else thins to one sustained tone (handled by the 'infer' chord) — and
    # training pulses stop dead at "trained".
    return out


def training_cycles(tm: Timing) -> list[float]:
    """Mirror of src/reels/<slug>/training.ts cycleStarts (frames → seconds)."""
    fps = 30
    f = round(tm.at("B11", "train") * fps) - 2
    to = round(tm.at("B14", "trained") * fps)
    out, d = [], 34.0
    while f + d <= to:
        out.append(round(f) / fps)
        f += d
        d = max(15, d * 0.88)
    return out


def build_fx(tm: Timing, total: float) -> np.ndarray:
    n = int(total * SR)
    fx = np.zeros((2, n))
    place(fx, sub_swell(4.0), 0.0, 0.3)
    place(fx, glass_lock(), tm.at("B03", "connected") - 0.15, 0.55)
    place(fx, bell(midi(69)), tm.at("B03", "patient"), 0.22, 0.1)
    # rules firing (expert system): relay clicks on each lit step
    steps = [tm.at("B06", "symptoms"), tm.at("B06", "findings") + 0.13, tm.at("B06", "suggest")]
    for k, s in enumerate(steps):
        for j in range(2 + (k == 1)):
            place(fx, relay(k * 10 + j), s + j * 0.11, 0.32, (-0.4 + 0.4 * j))
    # tangle → records
    l, r = granular_swell(3.2, 5, 200, 1800, 160)
    gs = tm.at("B08", "complicated")
    place(fx, l, gs, 0.9, -0.5); place(fx, r, gs, 0.9, 0.5)
    # training rhythm: pulse + predict/compare ticks per cycle, stopping at "trained"
    cyc = training_cycles(tm)
    for k, c in enumerate(cyc):
        nxt = cyc[k + 1] if k + 1 < len(cyc) else tm.at("B14", "trained")
        place(fx, soft_pulse(), c, 0.24)
        place(fx, tick(), c + 0.05, 0.09, -0.3)
        place(fx, tick(), c + (nxt - c) * 0.3, 0.07, 0.3)
    place(fx, soft_pulse(), tm.at("B14", "trained"), 0.3)
    place(fx, bell(midi(57)), tm.at("B14", "inference"), 0.16)
    # deep learning: depth steps as the camera passes each layer
    for k, w in enumerate(["simpler", "features", "complex", "finding"]):
        place(fx, descending_tone(midi(50 - k * 3)), tm.at("B19", w), 0.2)
    # generative
    place(fx, airy_rise(2.0), tm.at("B24", "generative") - 1.6, 0.35)
    place(fx, stamp(), tm.at("B25", "draft") - 0.05, 0.38)
    # foundation
    place(fx, deep_chord(), tm.at("B27", "foundation") - 0.1, 0.25)
    # the reveal
    place(fx, reverse_swell(2.6), tm.at("B29", "connect") - 2.2, 0.35)
    # GPU: many short operations firing together
    l, r = granular_swell(5.5, 21, 500, 3200, 900)
    gp = tm.at("B37", "parallel") - 0.2
    place(fx, l, gp, 0.3, -0.8); place(fx, r, gp, 0.3, 0.8)
    for j in range(10):  # a lone serial operation stepping before the parallel burst
        place(fx, tick(), tm.at("B37", "calculations") - 0.2 + j * 0.067, 0.1)
    return fx


def write(path: Path, st: np.ndarray) -> None:
    st = np.clip(st, -1, 1)
    data = (st.T * 32767).astype("<i2").tobytes()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data)


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: python3 scripts/score.py <slug>")
    slug = sys.argv[1]
    tm = Timing(json.loads((ROOT / "src" / "reels" / slug / "timing.json").read_text()))
    total = tm.duration
    n = int(total * SR)
    score = build_score(tm, total)
    fx = build_fx(tm, total)
    # Duck the score under speech (~7 dB), effects slightly (~3 dB).
    env = env_follow(tm.speech_mask(n), 0.12, 0.4)
    score *= (1 - 0.7 * env)   # about -10 dB under speech
    fx *= (1 - 0.45 * env)     # about -5 dB under speech
    # Master levels: score bed ~ -22 dBFS RMS, effects peaks below -6 dBFS.
    def norm_rms(x: np.ndarray, target_db: float) -> np.ndarray:
        rms = math.sqrt(float(np.mean(x ** 2))) or 1.0
        return x * (10 ** (target_db / 20) / rms)
    score = norm_rms(score, -31)
    fx = fx * 0.5  # fixed gain: effects are levelled per cue above, not normalized
    out_dir = ROOT / "public" / "ai-terms"
    out_dir.mkdir(parents=True, exist_ok=True)
    write(out_dir / "score.wav", score)
    write(out_dir / "fx.wav", fx)
    print(f"score + fx: {total:.1f}s -> {out_dir}")


if __name__ == "__main__":
    main()
