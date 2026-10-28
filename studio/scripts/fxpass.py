"""Apply face-tracked effects (fx/, the vendored claude-video-effects pack) to an edit's footage.

    python3 scripts/fxpass.py <slug>          # called by edit_render.py when plan.json has "fx"

plan.json:
    "fx": [
      {"fx": "backdrop-word", "from": "S2:doctor.", "to": "S2:years", "text": "DOCTOR"},
      {"fx": "glitter-spotlight", "from": "S3:NVIDIA", "hold": 90, "text": "NVIDIA"}
    ]

`from` / `to` use the same moments as the rest of the plan ("S2:word", "12.5s", frames); `hold` (frames)
can replace `to`. Every other key is passed to fx.py as the effect's option (text, color, zoom, look, ...;
see fx/EFFECTS.md); options named like the timing keys go in "opt": {"from": "0", "to": "16 min"}.
Times are mapped from the edited timeline back to the source footage, the effects are rendered onto public/edit/<slug>/clean.mp4 -> clean-fx.mp4 (audio kept), and edit.json is pointed at it.
Without "fx" (or with an empty list) edit.json points back at clean.mp4.
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from edit_render import FPS, resolve  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FX = ROOT / "fx"
PY = FX / ".venv" / "bin" / "python"


def segment_of(edit: dict, frame: int) -> int:
    """Index of the cut-list segment that plays at this edited-timeline frame (the last one past the end)."""
    for i, seg in enumerate(edit["segments"]):
        if seg["from"] <= frame < seg["from"] + seg["durationInFrames"]:
            return i
    return len(edit["segments"]) - 1


def source_seconds(edit: dict, frame: int) -> float:
    """Edited-timeline frame -> seconds in the source footage, through the cut list."""
    seg = edit["segments"][segment_of(edit, frame)]
    return (seg["startFrom"] + min(frame - seg["from"], seg["durationInFrames"])) / FPS


def build(take: dict, edit: dict, items: list[dict]) -> list[dict]:
    effects = []
    for item in items:
        start = resolve(take, item["from"])
        end = resolve(take, item["to"]) if "to" in item else start + int(item.get("hold", 75))
        if end <= start:
            raise ValueError(f"fx {item['fx']}: ends before it starts ({item})")
        if segment_of(edit, start) != segment_of(edit, end - 1):
            raise ValueError(f"fx {item['fx']}: spans a cut; split it into one effect per stretch")
        a, b = source_seconds(edit, start), source_seconds(edit, end - 1) + 1 / FPS
        options = {k: v for k, v in item.items() if k not in ("fx", "from", "to", "hold", "opt")}
        options.update(item.get("opt", {}))  # effect options named like plan keys (a graph's own "from"/"to")
        effects.append({"fx": item["fx"], "start": round(a, 3), "end": round(b, 3), **options})
    return effects


def main() -> None:
    slug = sys.argv[1]
    base = ROOT / "public" / "edit" / slug
    take = json.loads((base / "take.json").read_text())
    edit = json.loads((base / "edit.json").read_text())
    plan = json.loads((base / "plan.json").read_text()) if (base / "plan.json").exists() else {}
    clean, styled = f"edit/{slug}/clean.mp4", f"edit/{slug}/clean-fx.mp4"
    items = plan.get("fx", [])
    if not items:
        if edit["source"] != clean:
            edit["source"] = clean
            (base / "edit.json").write_text(json.dumps(edit, indent=1))
        print("no fx in plan.json: footage unchanged")
        return
    if not PY.exists():
        sys.exit("fx is not set up: run  npm run fx:setup")
    fx_plan = {"effects": build(take, edit, items)}
    stamp = hashlib.sha1(json.dumps(fx_plan, sort_keys=True).encode()).hexdigest()[:12]
    plan_path = base / "fx-plan.json"
    out = base / "clean-fx.mp4"
    previous = json.loads(plan_path.read_text()).get("stamp") if plan_path.exists() else None
    if previous == stamp and out.exists():
        print("fx unchanged: reusing clean-fx.mp4")
    else:
        plan_path.write_text(json.dumps({**fx_plan, "stamp": stamp}, indent=1))
        width = str(edit.get("width", 1080))
        print(f"rendering {len(fx_plan['effects'])} effect(s) onto the footage ...")
        subprocess.run([str(PY), str(FX / "scripts" / "fx.py"), "--plan", str(plan_path), str(base / "clean.mp4"), str(out), "--width", width],
                       check=True, cwd=FX)
    edit["source"] = styled
    (base / "edit.json").write_text(json.dumps(edit, indent=1))


if __name__ == "__main__":
    main()
