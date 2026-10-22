"""Download a video the user uploaded somewhere, ready for scripts/edit.py.

    python3 scripts/fetch.py <link> <slug>

Understands Google Drive share links (the file must be shared as "Anyone with the link"),
Dropbox links, and direct links to a video file. Saves inbox/<slug>/source.<ext> (git-ignored)
and checks it is a playable video before anything else touches it.
"""
import json
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHUNK = 1 << 20
MAX_BYTES = 4 << 30  # 4 GB


def direct_url(link: str) -> str:
    drive = re.search(r"drive\.google\.com/(?:file/d/|open\?id=|uc\?(?:.*&)?id=)([\w-]{10,})", link)
    if drive:
        return f"https://drive.usercontent.google.com/download?id={drive.group(1)}&export=download&confirm=t"
    if "dropbox.com" in link:
        parts = urllib.parse.urlsplit(link)
        query = dict(urllib.parse.parse_qsl(parts.query))
        query.pop("dl", None)
        query["raw"] = "1"
        return urllib.parse.urlunsplit(parts._replace(query=urllib.parse.urlencode(query)))
    return link


def download(url: str, target: Path) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 reel-factory"})
    with urllib.request.urlopen(request, timeout=60) as response:
        kind = response.headers.get("Content-Type", "")
        if kind.startswith("text/html"):
            raise ValueError("the link returned a web page, not a video. For Google Drive: Share > General access > "
                             "'Anyone with the link'. For Dropbox: use 'Copy link'.")
        size = 0
        with target.open("wb") as out:
            while chunk := response.read(CHUNK):
                size += len(chunk)
                if size > MAX_BYTES:
                    raise ValueError("the file is larger than 4 GB")
                out.write(chunk)
                print(f"\r{size / 1e6:.1f} MB", end="", flush=True)
        print()
        return kind


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("usage: python3 scripts/fetch.py <link> <slug>")
    link, slug = sys.argv[1], sys.argv[2]
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", slug):
        sys.exit("fetch.py: slug must be kebab-case, e.g. my-first-reel")
    folder = ROOT / "inbox" / slug
    folder.mkdir(parents=True, exist_ok=True)
    partial = folder / "download.part"
    try:
        kind = download(direct_url(link), partial)
    except (ValueError, OSError) as error:
        partial.unlink(missing_ok=True)
        sys.exit(f"fetch.py: {error}")
    if not shutil.which("ffprobe"):
        sys.exit("fetch.py: ffprobe (part of ffmpeg) is required to check the file")
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration,format_name:stream=codec_type",
                            "-of", "json", str(partial)], capture_output=True, text=True)
    info = json.loads(probe.stdout or "{}")
    streams = {s.get("codec_type") for s in info.get("streams", [])}
    if probe.returncode != 0 or "video" not in streams:
        partial.unlink(missing_ok=True)
        sys.exit("fetch.py: the download is not a playable video")
    path = urllib.parse.urlsplit(link).path.lower()
    ext = next((e for e in ("mov", "webm", "mkv", "m4v") if path.endswith("." + e) or e in kind), "mp4")
    ext = "mov" if "quicktime" in kind else ext
    source = folder / f"source.{ext}"
    partial.replace(source)
    seconds = float(info["format"].get("duration", 0))
    print(f"saved {source.relative_to(ROOT)} ({seconds:.1f}s, {'with' if 'audio' in streams else 'NO'} audio)")
    print(f"next: python3 scripts/edit.py prep {source.relative_to(ROOT)} {slug}")


if __name__ == "__main__":
    main()
