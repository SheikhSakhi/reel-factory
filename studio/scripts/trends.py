"""Trend and format research on top of data/factory.db.

    python3 scripts/trends.py outliers [--days 45] [--min-score 2] [--top 30]
        Posts from watched accounts that beat their own account's median, ranked.
        -> ideas/outliers.md (for humans) + data/outliers.json (for the trend scout to tag)
    python3 scripts/trends.py tag <tags.json>
        Stores the trend scout's tags: [{"media_id", "topic", "format", "hook_type", "proof_type", "cta_type", "notes"}]
    python3 scripts/trends.py formats
        What works in the niche: tagged outliers aggregated by format, hook, proof and CTA type.
        -> insights/formats.md
    python3 scripts/trends.py youtube "<query>" [--days 30]
        Top YouTube Shorts for a query (official Data API, needs YT_API_KEY; 101 of 10,000 daily units).
    python3 scripts/trends.py report
        Your own reels: views, watch time, save/share rates, by format and hook, from ig.py sync.
        -> insights/report.md

The score of a post is its views (or, when the API hides views, likes + 3 x comments) divided by
the median of the same account's recent posts. A 5x post on a small account says more about
the idea than an average post on a big one.
"""
import argparse
import json
import re
import statistics
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import db  # noqa: E402
from ig import load_env  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TAG_FIELDS = ("topic", "format", "hook_type", "proof_type", "cta_type", "notes")


def engagement(row) -> float | None:
    if row["view_count"]:
        return float(row["view_count"])
    if row["like_count"] is None and row["comments_count"] is None:
        return None
    return float((row["like_count"] or 0) + 3 * (row["comments_count"] or 0))


def parse_time(stamp: str | None) -> datetime | None:
    if not stamp:
        return None
    return datetime.fromisoformat(stamp.replace("Z", "+00:00").replace("+0000", "+00:00"))


def score_outliers(conn, days: int, min_score: float) -> list[dict]:
    rows = conn.execute("SELECT * FROM media WHERE source='watch'").fetchall()
    by_owner: dict[str, list] = {}
    for r in rows:
        by_owner.setdefault(r["owner"], []).append(r)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    followers = {r["username"]: r["followers"] for r in conn.execute("SELECT username, followers FROM accounts")}
    out = []
    for owner, posts in by_owner.items():
        values = [v for v in (engagement(p) for p in posts) if v is not None]
        if len(values) < 5:
            continue  # not enough history for a fair baseline
        median = statistics.median(values) or 1.0
        for p in posts:
            value, when = engagement(p), parse_time(p["timestamp"])
            if value is None or not when or when < cutoff:
                continue
            score = value / median
            if score >= min_score:
                out.append({"media_id": p["id"], "owner": owner, "followers": followers.get(owner), "score": round(score, 1),
                            "metric": "views" if p["view_count"] else "likes+3*comments", "value": int(value),
                            "product_type": p["product_type"], "permalink": p["permalink"], "timestamp": p["timestamp"],
                            "caption": (p["caption"] or "")[:300]})
    return sorted(out, key=lambda o: o["score"], reverse=True)


def outliers(args: argparse.Namespace, conn=None) -> None:
    conn = conn or db.connect()
    found = score_outliers(conn, args.days, args.min_score)[:args.top]
    tagged = {r["media_id"] for r in conn.execute("SELECT media_id FROM tags")}
    for o in found:
        o["tagged"] = o["media_id"] in tagged
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "outliers.json").write_text(json.dumps(found, indent=2))
    lines = [f"# Outliers (last {args.days} days, score >= {args.min_score}x the account's median)", "",
             "| Score | Account | Metric | Posted | Link | Caption |", "|---|---|---|---|---|---|"]
    for o in found:
        caption = re.sub(r"\s+", " ", o["caption"])[:90].replace("|", "/")
        lines.append(f"| {o['score']}x | @{o['owner']} | {o['value']:,} {o['metric']} | {(o['timestamp'] or '')[:10]} "
                     f"| [open]({o['permalink']}) | {caption} |")
    (ROOT / "ideas").mkdir(exist_ok=True)
    (ROOT / "ideas" / "outliers.md").write_text("\n".join(lines) + "\n")
    untagged = sum(1 for o in found if not o["tagged"])
    print(f"{len(found)} outliers ({untagged} untagged) -> ideas/outliers.md, data/outliers.json")


def tag(args: argparse.Namespace, conn=None) -> None:
    conn = conn or db.connect()
    items = json.loads(Path(args.file).read_text())
    for item in items:
        if "media_id" not in item:
            raise ValueError("every tag needs a media_id")
        db.upsert(conn, "tags", {"media_id": item["media_id"], **{f: item.get(f) for f in TAG_FIELDS}, "tagged_at": db.now()},
                  key=("media_id",))
    conn.commit()
    print(f"tagged {len(items)} posts")


def aggregate(conn, days: int) -> dict[str, list[tuple[str, int, float]]]:
    scored = {o["media_id"]: o["score"] for o in score_outliers(conn, days, 0)}
    rows = [r for r in conn.execute("SELECT * FROM tags") if r["media_id"] in scored]
    result = {}
    for field in ("format", "hook_type", "proof_type", "cta_type", "topic"):
        groups: dict[str, list[float]] = {}
        for r in rows:
            if r[field]:
                groups.setdefault(r[field].lower(), []).append(scored[r["media_id"]])
        result[field] = sorted(((k, len(v), round(statistics.median(v), 1)) for k, v in groups.items()),
                               key=lambda g: (g[2], g[1]), reverse=True)
    return result


def formats(args: argparse.Namespace, conn=None) -> None:
    conn = conn or db.connect()
    stats = aggregate(conn, args.days)
    lines = [f"# What works in the niche (tagged posts from watched accounts, last {args.days} days)", "",
             "Median score = how many times the account's usual result. Fewer than 5 posts in a row is a hint, not a pattern.", ""]
    for field, title in (("format", "Format"), ("hook_type", "Hook type"), ("proof_type", "Proof type"),
                         ("cta_type", "CTA type"), ("topic", "Topic")):
        lines += [f"## {title}", "", "| Value | Posts | Median score |", "|---|---|---|"]
        lines += [f"| {k} | {n} | {m}x |" for k, n, m in stats[field]] or ["| (no tagged posts yet) | | |"]
        lines.append("")
    (ROOT / "insights").mkdir(exist_ok=True)
    (ROOT / "insights" / "formats.md").write_text("\n".join(lines))
    print(f"-> insights/formats.md ({sum(n for _, n, _ in stats['format'])} tagged posts)")


def iso_duration(text: str) -> int:
    match = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", text or "")
    if not match:
        return 0
    h, m, s = (int(g or 0) for g in match.groups())
    return h * 3600 + m * 60 + s


def youtube(args: argparse.Namespace, conn=None, http=None) -> None:
    key = load_env().get("YT_API_KEY")
    if not key:
        sys.exit("trends.py: set YT_API_KEY (docs/SETUP.md, step 6)")
    conn = conn or db.connect()
    fetch = http or (lambda url: json.loads(urllib.request.urlopen(url, timeout=60).read()))
    after = (datetime.now(timezone.utc) - timedelta(days=args.days)).strftime("%Y-%m-%dT%H:%M:%SZ")
    search = fetch("https://www.googleapis.com/youtube/v3/search?" + urllib.parse.urlencode({
        "part": "snippet", "q": args.query, "type": "video", "videoDuration": "short", "order": "viewCount",
        "publishedAfter": after, "maxResults": 25, "key": key}))
    ids = [i["id"]["videoId"] for i in search.get("items", [])]
    if not ids:
        print("no results")
        return
    videos = fetch("https://www.googleapis.com/youtube/v3/videos?" + urllib.parse.urlencode({
        "part": "snippet,statistics,contentDetails", "id": ",".join(ids), "key": key}))
    rows = []
    for v in videos.get("items", []):
        stats = v.get("statistics", {})
        row = {"id": v["id"], "query": args.query, "title": v["snippet"]["title"], "channel": v["snippet"]["channelTitle"],
               "published_at": v["snippet"]["publishedAt"], "views": int(stats.get("viewCount", 0)),
               "likes": int(stats.get("likeCount", 0)), "comments": int(stats.get("commentCount", 0)),
               "duration_s": iso_duration(v["contentDetails"]["duration"]), "fetched_at": db.now()}
        db.upsert(conn, "youtube", row)
        rows.append(row)
    conn.commit()
    for r in sorted(rows, key=lambda r: r["views"], reverse=True)[:10]:
        print(f"{r['views']:>10,}  {r['duration_s']:>3}s  {r['title'][:70]}  ({r['channel']})")


def report(args: argparse.Namespace, conn=None) -> None:
    conn = conn or db.connect()
    rows = conn.execute("""
        SELECT r.slug, r.format, r.hook, m.permalink, m.timestamp, i.views, i.reach, i.saved, i.shares, i.comments, i.avg_watch_ms
        FROM reels r JOIN media m ON m.id = r.media_id
        JOIN own_insights i ON i.media_id = r.media_id
        WHERE i.day = (SELECT MAX(day) FROM own_insights WHERE media_id = r.media_id)
        ORDER BY m.timestamp DESC""").fetchall()
    rate = lambda a, b: f"{100 * a / b:.1f}%" if a is not None and b else "-"  # noqa: E731
    lines = ["# Your reels", "", "Saves and shares per reach are the signals that predict growth; views alone mostly reflect reach.", "",
             "| Reel | Format | Views | Avg watch | Save rate | Share rate | Comments |", "|---|---|---|---|---|---|---|"]
    for r in rows:
        watch = f"{r['avg_watch_ms'] / 1000:.1f}s" if r["avg_watch_ms"] else "-"
        lines.append(f"| [{r['slug']}]({r['permalink']}) | {r['format'] or '-'} | {r['views'] or 0:,} | {watch} "
                     f"| {rate(r['saved'], r['reach'])} | {rate(r['shares'], r['reach'])} | {r['comments'] or 0} |")
    by_format: dict[str, list] = {}
    for r in rows:
        by_format.setdefault((r["format"] or "unknown").split("(")[0].strip(), []).append(r)
    lines += ["", "## By format", "", "| Format | Reels | Median views | Median save rate |", "|---|---|---|---|"]
    for fmt, group in sorted(by_format.items(), key=lambda kv: -statistics.median([g["views"] or 0 for g in kv[1]])):
        save_rates = [g["saved"] / g["reach"] for g in group if g["saved"] is not None and g["reach"]]
        lines.append(f"| {fmt} | {len(group)} | {int(statistics.median([g['views'] or 0 for g in group])):,} "
                     f"| {f'{100 * statistics.median(save_rates):.1f}%' if save_rates else '-'} |")
    if len(rows) < 10:
        lines += ["", f"Only {len(rows)} reels so far: treat differences as hints until there are 10+."]
    (ROOT / "insights").mkdir(exist_ok=True)
    (ROOT / "insights" / "report.md").write_text("\n".join(lines) + "\n")
    print(f"-> insights/report.md ({len(rows)} reels)")


def main() -> None:
    p = argparse.ArgumentParser(description="Trend and format research for reel-factory.")
    sub = p.add_subparsers(dest="command", required=True)
    s = sub.add_parser("outliers")
    s.add_argument("--days", type=int, default=45)
    s.add_argument("--min-score", type=float, default=2.0)
    s.add_argument("--top", type=int, default=30)
    s = sub.add_parser("tag")
    s.add_argument("file")
    s = sub.add_parser("formats")
    s.add_argument("--days", type=int, default=90)
    s = sub.add_parser("youtube")
    s.add_argument("query")
    s.add_argument("--days", type=int, default=30)
    sub.add_parser("report")
    args = p.parse_args()
    {"outliers": outliers, "tag": tag, "formats": formats, "youtube": youtube, "report": report}[args.command](args)


if __name__ == "__main__":
    main()
