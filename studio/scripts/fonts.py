"""Vendor the brand's Google Fonts into public/fonts/ so renders never depend on the network.

    python3 scripts/fonts.py "Instrument Serif:400,400i" "Inter:500,600,700" "JetBrains Mono:500"
    python3 scripts/fonts.py "Manrope:600,800" --subsets latin,cyrillic

Each argument is "<Family>:<weights>", where a trailing "i" means italic. Writes the woff2
files and public/fonts/fonts.json (family, file, weight, style, unicodeRange per face);
src/brand/brand.ts loads that manifest with the kit's loadLocalFonts(). Running it again
replaces the manifest, so pass every family the brand uses in one call.

All Google Fonts are under the SIL Open Font License or Apache 2.0, so vendoring them is allowed.
"""
import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "fonts"
# A modern browser user agent makes the CSS API answer with woff2 files split by subset.
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
FACE = re.compile(r"/\*\s*([\w-]+)\s*\*/\s*@font-face\s*{([^}]*)}", re.S)


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def parse_spec(spec: str) -> tuple[str, list[tuple[int, bool]]]:
    family, _, weights = spec.partition(":")
    styles = []
    for w in (weights or "400").split(","):
        w = w.strip()
        italic = w.endswith("i")
        number = w.rstrip("i")
        if not number.isdigit():
            raise ValueError(f"bad weight '{w}' in '{spec}' (use e.g. 400,700,400i)")
        styles.append((int(number), italic))
    return family.strip(), sorted(set(styles), key=lambda s: (s[1], s[0]))


def css_url(family: str, styles: list[tuple[int, bool]]) -> str:
    pairs = ";".join(f"{1 if italic else 0},{weight}" for weight, italic in styles)
    query = urllib.parse.quote(family) + f":ital,wght@{pairs}"
    return f"https://fonts.googleapis.com/css2?family={query}&display=block"


def field(block: str, name: str) -> str:
    match = re.search(rf"{name}:\s*([^;]+);", block)
    return match.group(1).strip() if match else ""


def vendor(family: str, styles: list[tuple[int, bool]], subsets: set[str]) -> list[dict]:
    css = fetch(css_url(family, styles)).decode()
    slug = re.sub(r"[^a-z0-9]+", "-", family.lower()).strip("-")
    faces = []
    for subset, block in FACE.findall(css):
        if subset not in subsets:
            continue
        url = re.search(r"url\(([^)]+)\)", block).group(1)
        weight, style = field(block, "font-weight"), field(block, "font-style")
        name = f"{slug}/{weight}{'-italic' if style == 'italic' else ''}-{subset}.woff2"
        path = OUT / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(fetch(url))
        faces.append({"family": family, "file": f"fonts/{name}", "weight": weight, "style": style,
                      "unicodeRange": field(block, "unicode-range")})
    if not faces:
        raise ValueError(f"{family}: none of the subsets {sorted(subsets)} are available")
    return faces


def main() -> None:
    parser = argparse.ArgumentParser(description="Vendor Google Fonts for the brand kit.")
    parser.add_argument("families", nargs="+", help='e.g. "Inter:500,700" "Fraunces:400,400i"')
    parser.add_argument("--subsets", default="latin,latin-ext", help="comma list, e.g. latin,cyrillic (default latin,latin-ext)")
    args = parser.parse_args()
    subsets = {s.strip() for s in args.subsets.split(",") if s.strip()}
    try:
        faces = [face for spec in args.families for face in vendor(*parse_spec(spec), subsets)]
    except (ValueError, OSError) as error:
        sys.exit(f"fonts.py: {error}")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "fonts.json").write_text(json.dumps({"faces": faces}, indent=2) + "\n")
    for family in dict.fromkeys(f["family"] for f in faces):
        count = sum(1 for f in faces if f["family"] == family)
        print(f"{family}: {count} files")
    print("wrote public/fonts/fonts.json")


if __name__ == "__main__":
    main()
