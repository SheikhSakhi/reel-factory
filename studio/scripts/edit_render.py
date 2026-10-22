"""Render an edit of your own footage (composition "edit", data in public/edit/<slug>/).

    python3 scripts/edit_render.py <slug>              # out/<slug>.mp4 + out/<slug>-cover.jpg
    python3 scripts/edit_render.py <slug> --qa         # QA stills at every overlay + a contact sheet
    python3 scripts/edit_render.py <slug> --qa 30 240  # QA stills at chosen frames
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30


def resolve(take: dict, at) -> int:
    """Same rules as resolveAt() in src/kit/EditedReel.tsx."""
    if isinstance(at, (int, float)):
        return int(at)
    if m := re.fullmatch(r"(\d+(?:\.\d+)?)s", at):
        return round(float(m.group(1)) * FPS)
    m = re.fullmatch(r"(S\d+):(.+?)(?:#(\d+))?", at)
    if not m:
        raise ValueError(f"cannot read moment {at!r}")
    scene = next(s for s in take["scenes"] if s["id"] == m.group(1))
    if m.group(2) == "start":
        return scene["from"]
    if m.group(2) == "end":
        return scene["speechEnd"]
    norm = lambda t: re.sub(r"[\W_]", "", t.lower())  # noqa: E731
    hits = [w for w in scene["words"] if norm(w["token"]) == norm(m.group(2))]
    return hits[int(m.group(3) or 0)]["frame"]


def remotion(*args: str) -> None:
    subprocess.run(["npx", "remotion", *args], check=True, cwd=ROOT, stdout=subprocess.DEVNULL)


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    slug = sys.argv[1]
    base = ROOT / "public" / "edit" / slug
    take = json.loads((base / "take.json").read_text())
    plan = json.loads((base / "plan.json").read_text()) if (base / "plan.json").exists() else {}
    props = json.dumps({"slug": slug})
    (ROOT / "out").mkdir(exist_ok=True)
    if "--qa" in sys.argv:
        frames = [int(a) for a in sys.argv[3:]] or sorted(
            {20} | {min(take["totalFrames"] - 1, resolve(take, o["at"]) + 12) for o in plan.get("overlays", [])}
            | {round(take["totalFrames"] * k / 4) for k in (1, 2, 3)})
        folder = ROOT / "out" / "qa" / slug
        folder.mkdir(parents=True, exist_ok=True)
        paths = []
        for f in frames:
            path = folder / f"f{f:04d}.jpg"
            remotion("still", "src/index.ts", "edit", str(path), f"--frame={f}", f"--props={props}", "--scale=0.5")
            paths.append(path)
        try:
            from PIL import Image
            ims = [Image.open(p) for p in paths]
            w, h = ims[0].size
            cols = min(4, len(ims))
            sheet = Image.new("RGB", (w * cols, h * ((len(ims) + cols - 1) // cols)), "white")
            for i, im in enumerate(ims):
                sheet.paste(im, ((i % cols) * w, (i // cols) * h))
            sheet.save(folder / "sheet.jpg", quality=80)
            print(f"contact sheet: {(folder / 'sheet.jpg').relative_to(ROOT)}")
        except ImportError:
            pass
        print("\n".join(str(p.relative_to(ROOT)) for p in paths))
        return
    remotion("render", "src/index.ts", "edit", f"out/{slug}.mp4", f"--props={props}", "--codec=h264", "--crf=18")
    cover = resolve(take, plan.get("cover", 20))
    remotion("still", "src/index.ts", "edit", f"out/{slug}-cover.jpg", f"--frame={cover}", f"--props={props}", "--image-format=jpeg")
    print(f"rendered out/{slug}.mp4 and out/{slug}-cover.jpg ({take['totalFrames'] / FPS:.1f}s)")


if __name__ == "__main__":
    main()
