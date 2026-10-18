"""Procedural image assets for the ai-terms-one-patient film.

Usage: python3 scripts/ai_terms_assets.py

Writes public/ai-terms/:
  xray.png        illustrative PA chest radiograph (drawn from shapes, not a real patient)
  xray64.json     64x64 luminance grid of the same image (drives the pixel-depth formation)
  feat1..4.png    conceptual feature planes for the deep-learning layers:
                  1 edges, 2 textures, 3 parts, 4 abstract patterns.
These are conceptual illustrations, not outputs of any real model.
Deterministic: fixed seeds, no downloads.
"""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "ai-terms"
S = 1024


def blur(img: Image.Image, r: float) -> Image.Image:
    return img.filter(ImageFilter.GaussianBlur(r))


def layer(draw_fn, r: float) -> np.ndarray:
    im = Image.new("L", (S, S), 0)
    draw_fn(ImageDraw.Draw(im))
    return np.asarray(blur(im, r), dtype=np.float32) / 255.0


def rib_path(side: int, i: int) -> list[tuple[float, float]]:
    """Posterior rib: leaves the spine, arcs up and out, then sweeps down laterally."""
    y0 = 205 + i * (50 + i * 2.2)
    span = 250 + min(i, 5) * 22 - max(0, i - 7) * 18
    pts = []
    for k in range(48):
        t = k / 47
        x = 512 + side * (34 + t * span)
        y = y0 - 34 * math.sin(min(t * 1.25, 1) * math.pi * 0.85) + t ** 2.2 * (120 + i * 7)
        pts.append((x, y))
    return pts


def anterior_rib(side: int, i: int) -> list[tuple[float, float]]:
    """Anterior rib: fainter, sweeping down and inward from the lateral wall."""
    y0 = 330 + i * 66
    pts = []
    for k in range(32):
        t = k / 31
        x = 512 + side * (370 - t * 250 - i * 6)
        y = y0 + t * 70 + 30 * math.sin(t * math.pi)
        pts.append((x, y))
    return pts


def xray() -> np.ndarray:
    body = layer(lambda d: d.polygon([(130, 1024), (160, 330), (230, 215), (400, 168), (624, 168),
                                      (794, 215), (864, 330), (894, 1024)], fill=255), 36)
    lungs = layer(lambda d: (
        d.polygon([(470, 210), (420, 190), (360, 215), (290, 300), (238, 450), (215, 650), (205, 820),
                   (240, 860), (330, 845), (430, 815), (470, 760)], fill=255),
        d.polygon([(554, 210), (604, 190), (664, 215), (734, 300), (786, 450), (808, 650), (818, 800),
                   (790, 840), (720, 815), (640, 760), (580, 700), (554, 640)], fill=255),
    ), 18)
    heart = layer(lambda d: d.polygon([(470, 560), (452, 650), (450, 760), (500, 840), (640, 860), (730, 820),
                                       (760, 740), (730, 640), (650, 590), (560, 560)], fill=255), 22)
    mediast = layer(lambda d: d.polygon([(470, 140), (554, 140), (566, 560), (470, 600)], fill=255), 18)
    aorta = layer(lambda d: d.ellipse([530, 410, 610, 490], fill=255), 12)
    trachea = layer(lambda d: d.rectangle([496, 120, 528, 450], fill=255), 8)
    dome = layer(lambda d: (
        d.ellipse([160, 830, 520, 1240], fill=255),
        d.ellipse([500, 800, 870, 1210], fill=255),
    ), 16)
    spine = layer(lambda d: [d.rounded_rectangle([490, 130 + j * 47, 534, 168 + j * 47], 9, fill=255) for j in range(19)], 4)
    clav = layer(lambda d: (
        d.line([(498, 262), (430, 236), (350, 222), (262, 226), (200, 250)], fill=255, width=20, joint="curve"),
        d.line([(526, 262), (594, 236), (674, 222), (762, 226), (824, 250)], fill=255, width=20, joint="curve"),
    ), 4)
    ribs = layer(lambda d: [d.line(rib_path(side, i), fill=255, width=15 - i // 3, joint="curve")
                            for side in (-1, 1) for i in range(10)], 3.2)
    ribs_in = layer(lambda d: [d.line(rib_path(side, i), fill=255, width=6) for side in (-1, 1) for i in range(10)], 2.4)
    ant = layer(lambda d: [d.line(anterior_rib(side, i), fill=255, width=12, joint="curve")
                           for side in (-1, 1) for i in range(6)], 5)
    rng = np.random.default_rng(11)

    def vessels(d: ImageDraw.ImageDraw) -> None:
        for s in (-1, 1):
            for k in range(26):
                ang = math.radians(-70 + k * 6.2 + rng.uniform(-3, 3))
                length = rng.uniform(80, 260)
                x0, y0 = 512 + s * 60, 520 + rng.uniform(-40, 40)
                x1 = x0 + s * math.cos(ang) * length * 1.1
                y1 = y0 + math.sin(ang) * length * 0.9
                d.line([(x0, y0), ((x0 + x1) / 2 + rng.uniform(-12, 12), (y0 + y1) / 2), (x1, y1)],
                       fill=int(255 * (1 - length / 320)), width=max(2, int(9 - length / 40)))
    vasc = layer(vessels, 3)
    shoulders = layer(lambda d: (d.ellipse([120, 200, 230, 310], fill=255), d.ellipse([794, 200, 904, 310], fill=255)), 7)
    scap = layer(lambda d: (d.line([(225, 300), (250, 520)], fill=255, width=8), d.line([(799, 300), (774, 520)], fill=255, width=8)), 6)

    dens = 0.55 * body
    dens -= 0.47 * lungs * body
    dens += 0.50 * mediast * (1 - 0.6 * trachea) - 0.12 * trachea
    dens += 0.48 * heart + 0.15 * aorta
    dens += 0.75 * dome * body
    dens += 0.16 * vasc * lungs
    dens += 0.30 * (ribs - 0.45 * ribs_in) * (0.3 + 0.7 * lungs) + 0.08 * ant * lungs
    dens += 0.10 * spine * mediast + 0.40 * clav + 0.22 * shoulders + 0.10 * scap
    grain = np.asarray(blur(Image.fromarray((rng.random((S, S)) * 255).astype(np.uint8)), 1.0), dtype=np.float32) / 255.0
    dens += (grain - 0.5) * 0.05
    dens = np.clip(dens, 0, None)
    img = 1 - np.exp(-dens * 1.9)  # film response: dense tissue saturates softly
    yy, xx = np.mgrid[0:S, 0:S] / S
    img *= 1 - 0.30 * ((xx - 0.5) ** 2 + (yy - 0.5) ** 2) * 2.2
    return np.clip(img, 0, 1)


def sobel(a: np.ndarray) -> np.ndarray:
    p = np.pad(a, 1, mode="edge")
    gx = (p[:-2, 2:] + 2 * p[1:-1, 2:] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[1:-1, :-2] + p[2:, :-2])
    gy = (p[2:, :-2] + 2 * p[2:, 1:-1] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[:-2, 1:-1] + p[:-2, 2:])
    return np.hypot(gx, gy)


def downsample(a: np.ndarray, n: int) -> np.ndarray:
    k = a.shape[0] // n
    return a[: n * k, : n * k].reshape(n, k, n, k).mean(axis=(1, 3))


def norm(a: np.ndarray) -> np.ndarray:
    a = a - a.min()
    return a / (a.max() or 1)


def save(a: np.ndarray, name: str, size: int = 512) -> None:
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    if im.size[0] != size:
        im = im.resize((size, size), Image.NEAREST if im.size[0] < 64 else Image.BILINEAR)
    im.save(OUT / name)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img = xray()
    Image.fromarray((img * 255).astype(np.uint8)).save(OUT / "xray.png")
    grid = downsample(img, 64)
    (OUT / "xray64.json").write_text(json.dumps([round(float(v), 3) for v in grid.flatten()]))

    half = downsample(img, 256)
    edges = norm(sobel(half)) ** 0.6
    save(edges, "feat1.png")

    # textures: oriented responses at a coarser scale, combined
    q = downsample(img, 128)
    p = np.pad(q, 2, mode="edge")
    diag = np.abs(p[4:, 4:] - p[:-4, :-4]) + np.abs(p[4:, :-4] - p[:-4, 4:])
    tex = norm(diag) ** 0.7 * (0.4 + 0.6 * norm(downsample(edges, 128)))
    save(tex, "feat2.png")

    # parts: pooled blobs where structure concentrates
    parts = norm(downsample(norm(sobel(downsample(img, 128))), 32))
    parts = np.asarray(blur(Image.fromarray((parts * 255).astype(np.uint8)).resize((256, 256), Image.BILINEAR), 6),
                       dtype=np.float32) / 255
    save(norm(parts) ** 1.4, "feat3.png")

    # abstract: 8x8 pooled activations
    abstract = norm(downsample(norm(parts), 8)) ** 1.6
    save(abstract, "feat4.png")
    print("assets ->", OUT)


if __name__ == "__main__":
    main()
