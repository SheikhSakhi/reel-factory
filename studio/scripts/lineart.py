"""Turn a picture into line art that can be drawn on, stroke by stroke (kit: <DrawArt>).

    python3 scripts/lineart.py <image> <out.json> [--mode outline|lines] [--detail 0.5] [--preview out.png]

outline  the object's silhouette plus its strongest inner lines: the clean "blueprint" look
         (a car profile, a device, an organ). Best from a transparent PNG cut-out (the alpha is
         the silhouette); otherwise GrabCut separates the object from a plain background.
         Busy photos (the object in a crowded scene) trace poorly: cut the object out first.
lines    every significant edge, like an engraving (illustrations, diagrams, faces)

Output JSON: {"width", "height", "strokes": [{"d", "x0", "x1", "kind"}]}: smooth SVG paths in
image pixels, sorted left to right so a drawing sweeps across like a pen. `kind` is "outline"
or "detail" so the outline can be drawn first and filled. Use pictures the user owns or that
are public domain / openly licensed; tracing does not change who owns the image.

Requires opencv-python-headless.
"""
import argparse
import json
import sys

try:
    import cv2
    import numpy as np
except ImportError:
    sys.exit("lineart.py: pip3 install opencv-python-headless")

MAX_SIDE = 1200


def load(path: str) -> tuple["np.ndarray", "np.ndarray | None"]:
    """Image (BGR) and, for a transparent PNG, its alpha as the object mask (the most reliable silhouette)."""
    image = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if image is None:
        sys.exit(f"lineart.py: cannot read {path}")
    if image.ndim == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    alpha = None
    if image.shape[2] == 4:
        alpha = image[:, :, 3]
        a = alpha[:, :, None] / 255.0
        image = (image[:, :, :3] * a + 255 * (1 - a)).astype("uint8")
        if alpha.min() > 250:
            alpha = None  # fully opaque: no cut-out
    scale = min(1.0, MAX_SIDE / max(image.shape[:2]))
    if scale < 1:
        image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        alpha = cv2.resize(alpha, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA) if alpha is not None else None
    mask = np.where(alpha > 127, 255, 0).astype("uint8") if alpha is not None else None
    return image, mask


def smooth_path(points: "np.ndarray", closed: bool) -> str:
    """Quadratic B-spline through the midpoints: smooth, pen-like curves from a polyline."""
    pts = [(float(x), float(y)) for x, y in points]
    if len(pts) < 3:
        return "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    if closed:
        pts.append(pts[0])
    mid = lambda a, b: ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)  # noqa: E731
    start = mid(pts[0], pts[1]) if closed else pts[0]
    d = [f"M {start[0]:.1f} {start[1]:.1f}"]
    for i in range(1, len(pts) - 1):
        m = mid(pts[i], pts[i + 1])
        d.append(f"Q {pts[i][0]:.1f} {pts[i][1]:.1f} {m[0]:.1f} {m[1]:.1f}")
    if closed:
        d.append("Z")
    else:
        d.append(f"L {pts[-1][0]:.1f} {pts[-1][1]:.1f}")
    return " ".join(d)


def silhouette(image: "np.ndarray") -> "np.ndarray":
    """Foreground mask by GrabCut, seeded with a rectangle a few percent inside the frame."""
    h, w = image.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    rect = (int(w * 0.03), int(h * 0.03), int(w * 0.94), int(h * 0.94))
    cv2.grabCut(image, mask, rect, np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64), 5, cv2.GC_INIT_WITH_RECT)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype("uint8")
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    return cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))


def edge_strokes(image: "np.ndarray", detail: float, within: "np.ndarray | None") -> list:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 60, 60)
    median = float(np.median(gray))
    low = int(max(0, (1.0 - 0.33 - 0.3 * detail) * median))
    high = int(min(255, (1.0 + 0.33 - 0.3 * detail) * median))
    edges = cv2.Canny(gray, low, high)
    if within is not None:
        inner = cv2.erode(within, np.ones((9, 9), np.uint8))
        edges = cv2.bitwise_and(edges, inner)
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    diag = float(np.hypot(*image.shape[:2]))
    min_len = diag * (0.06 - 0.05 * detail)
    return [single_pass(c) for c in contours if cv2.arcLength(c, True) / 2 >= min_len]


def single_pass(contour: "np.ndarray") -> "np.ndarray":
    """A 1-pixel edge comes back as a loop that runs out and back along the same line, which
    would draw every line twice. For such thin loops keep the outward half only."""
    area = cv2.contourArea(contour)
    length = cv2.arcLength(contour, True)
    if area < length * 0.5:
        pts = contour.reshape(-1, 2)
        far = int(np.argmax(np.hypot(*(pts - pts[0]).T)))
        return contour[: far + 1]
    return contour


def stroke(contour: "np.ndarray", closed: bool, kind: str, epsilon: float) -> dict:
    approx = cv2.approxPolyDP(contour, epsilon, closed).reshape(-1, 2)
    xs = approx[:, 0]
    return {"d": smooth_path(approx, closed), "x0": round(float(xs.min()), 1), "x1": round(float(xs.max()), 1), "kind": kind}


def trace(image: "np.ndarray", alpha_mask: "np.ndarray | None", mode: str, detail: float, max_strokes: int) -> list[dict]:
    strokes = []
    mask = None
    if mode == "outline":
        mask = alpha_mask if alpha_mask is not None else silhouette(image)
        outer, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        area = image.shape[0] * image.shape[1]
        for c in sorted(outer, key=cv2.contourArea, reverse=True)[:3]:
            if cv2.contourArea(c) > area * 0.01:
                strokes.append(stroke(c, True, "outline", 1.5))
    details = edge_strokes(image, detail, mask)
    details = sorted(details, key=lambda c: cv2.arcLength(c, False), reverse=True)[:max_strokes]
    strokes += [stroke(c, False, "detail", 1.6) for c in details]
    return sorted(strokes, key=lambda s: (s["kind"] != "outline", s["x0"]))


def preview(strokes: list[dict], width: int, height: int, path: str) -> None:
    """Rasterises the strokes (via their polyline points) to check the result quickly."""
    canvas = np.full((height, width, 3), (32, 22, 13), np.uint8)
    for s in strokes:
        nums = [float(v) for v in s["d"].replace("M", " ").replace("Q", " ").replace("L", " ").replace("Z", " ").split()]
        pts = np.array(list(zip(nums[0::2], nums[1::2])), np.int32)
        color = (255, 170, 90) if s["kind"] == "outline" else (230, 220, 210)
        cv2.polylines(canvas, [pts], s["kind"] == "outline", color, 2, cv2.LINE_AA)
    cv2.imwrite(path, canvas)


def main() -> None:
    p = argparse.ArgumentParser(description="Trace a picture into drawable line art.")
    p.add_argument("image")
    p.add_argument("out")
    p.add_argument("--mode", choices=["outline", "lines"], default="outline")
    p.add_argument("--detail", type=float, default=0.5, help="0 (only strong lines) .. 1 (many lines)")
    p.add_argument("--max-strokes", type=int, default=120)
    p.add_argument("--preview", help="write a PNG preview of the strokes")
    args = p.parse_args()
    image, alpha_mask = load(args.image)
    strokes = trace(image, alpha_mask, args.mode, max(0.0, min(1.0, args.detail)), args.max_strokes)
    if not strokes:
        sys.exit("lineart.py: no lines found (try --mode lines or a higher --detail)")
    height, width = image.shape[:2]
    with open(args.out, "w") as f:
        json.dump({"width": width, "height": height, "strokes": strokes}, f)
    if args.preview:
        preview(strokes, width, height, args.preview)
    outlines = sum(1 for s in strokes if s["kind"] == "outline")
    print(f"{len(strokes)} strokes ({outlines} outline) on {width}x{height} -> {args.out}")


if __name__ == "__main__":
    main()
