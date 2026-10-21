"""Instagram connector for reel-factory (official Instagram Graph API, Facebook Login path).

    python3 scripts/ig.py setup --token <short-lived user token>   # once; writes .env.local
    python3 scripts/ig.py check
    python3 scripts/ig.py sync                      # your reels + insights -> data/factory.db
    python3 scripts/ig.py watch add <username> ...  # competitor / peer watchlist
    python3 scripts/ig.py discover                  # watchlist posts via Business Discovery
    python3 scripts/ig.py hashtag <tag> ...         # top posts per hashtag (needs App Review)
    python3 scripts/ig.py comments <slug|media_id>  # pull comments
    python3 scripts/ig.py keyword <slug> [--yes]    # comment-keyword -> public reply + private DM
    python3 scripts/ig.py reply <comment_id> "<text>" [--yes]
    python3 scripts/ig.py dm <comment_id> "<text>" [--yes]
    python3 scripts/ig.py publish <slug> [--cover-ms N] [--yes]

Anything that posts, replies or messages runs only with --yes; without it, the command prints
exactly what it would send. Secrets live in studio/.env.local (git-ignored) or the environment:
IG_ACCESS_TOKEN (Page token), IG_USER_ID, FB_PAGE_ID, META_APP_ID, META_APP_SECRET, GRAPH_VERSION.
See docs/SETUP.md for the one-time Meta setup.
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Callable

sys.path.insert(0, str(Path(__file__).resolve().parent))
import db  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env.local"
# Meta retires Graph API versions about two years after release; override with GRAPH_VERSION.
DEFAULT_VERSION = "v25.0"
MEDIA_FIELDS = "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count"
REEL_METRICS = ("views", "reach", "saved", "shares", "likes", "comments",
                "ig_reels_avg_watch_time", "ig_reels_video_view_total_time")
RATE_LIMIT_CODES = {4, 17, 32, 613, 80002}


class GraphError(RuntimeError):
    pass


def load_env() -> dict:
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                key, _, value = line.partition("=")
                env[key.strip()] = value.strip().strip('"')
    env.update({k: v for k, v in os.environ.items() if k.startswith(("IG_", "FB_", "META_", "GRAPH_", "YT_"))})
    return env


def default_http(method: str, url: str, data: bytes | None = None, headers: dict | None = None) -> dict:
    request = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            body = response.read()
    except urllib.error.HTTPError as error:
        body = error.read()
    try:
        return json.loads(body or b"{}")
    except json.JSONDecodeError:
        return {"error": {"message": body[:300].decode(errors="replace")}}


class Graph:
    """Thin Graph API client. `http` is injectable so the flows can be tested offline."""

    def __init__(self, env: dict, http: Callable = default_http):
        self.env = env
        self.http = http
        self.version = env.get("GRAPH_VERSION", DEFAULT_VERSION)
        self.base = f"https://graph.facebook.com/{self.version}"

    @property
    def token(self) -> str:
        token = self.env.get("IG_ACCESS_TOKEN")
        if not token:
            raise GraphError("no IG_ACCESS_TOKEN: run `python3 scripts/ig.py setup --token ...` (docs/SETUP.md)")
        return token

    @property
    def ig_user(self) -> str:
        user = self.env.get("IG_USER_ID")
        if not user:
            raise GraphError("no IG_USER_ID: run `python3 scripts/ig.py setup` (docs/SETUP.md)")
        return user

    def call(self, method: str, path: str, params: dict | None = None, body: dict | None = None, token: str | None = None) -> dict:
        query = dict(params or {})
        query["access_token"] = token or self.token
        url = f"{self.base}/{path.lstrip('/')}?{urllib.parse.urlencode(query)}"
        data = json.dumps(body).encode() if body is not None else (b"" if method == "POST" else None)
        headers = {"Content-Type": "application/json"} if body is not None else {}
        result = self.http(method, url, data, headers)
        error = result.get("error") if isinstance(result, dict) else None
        if error:
            code = error.get("code")
            hint = " (rate limited: wait an hour)" if code in RATE_LIMIT_CODES else ""
            raise GraphError(f"Graph API {code}: {error.get('message', 'unknown error')}{hint}")
        return result

    def get(self, path: str, **params) -> dict:
        return self.call("GET", path, params)

    def post(self, path: str, params: dict | None = None, body: dict | None = None) -> dict:
        return self.call("POST", path, params, body)

    def pages(self, path: str, max_items: int = 200, **params) -> list[dict]:
        """Follows `paging.next` until `max_items` items."""
        out, result = [], self.get(path, **params)
        while True:
            out += result.get("data", [])
            nxt = result.get("paging", {}).get("next")
            if not nxt or len(out) >= max_items:
                return out[:max_items]
            result = self.http("GET", nxt, None, {})
            if result.get("error"):
                raise GraphError(f"Graph API {result['error'].get('code')}: {result['error'].get('message')}")


# ---------- setup ----------

def write_env(values: dict) -> None:
    existing = load_env() if ENV_FILE.exists() else {}
    merged = {**{k: v for k, v in existing.items() if k not in os.environ}, **values}
    ENV_FILE.write_text("".join(f"{k}={v}\n" for k, v in sorted(merged.items())))
    ENV_FILE.chmod(0o600)


def setup(graph: Graph, args: argparse.Namespace) -> None:
    app_id, secret = graph.env.get("META_APP_ID"), graph.env.get("META_APP_SECRET")
    if not app_id or not secret:
        raise GraphError("set META_APP_ID and META_APP_SECRET (App settings > Basic) in the environment or .env.local")
    long_lived = graph.call("GET", "oauth/access_token", {
        "grant_type": "fb_exchange_token", "client_id": app_id, "client_secret": secret, "fb_exchange_token": args.token,
    }, token=args.token)["access_token"]
    pages = graph.call("GET", "me/accounts", {"fields": "id,name,access_token,instagram_business_account{id,username}"},
                       token=long_lived).get("data", [])
    linked = [p for p in pages if p.get("instagram_business_account")]
    if not linked:
        raise GraphError("no Facebook Page with a linked Instagram professional account was found for this token")
    page = next((p for p in linked if p["instagram_business_account"].get("username") == args.username), linked[0])
    ig = page["instagram_business_account"]
    # A Page token derived from a long-lived user token does not expire.
    write_env({"META_APP_ID": app_id, "META_APP_SECRET": secret, "IG_ACCESS_TOKEN": page["access_token"],
               "IG_USER_ID": ig["id"], "FB_PAGE_ID": page["id"], "GRAPH_VERSION": graph.version})
    print(f"connected @{ig.get('username')} (Instagram {ig['id']}) via Page '{page['name']}' -> .env.local")
    if len(linked) > 1:
        print("other linked accounts: " + ", ".join("@" + p["instagram_business_account"].get("username", "?") for p in linked))


def check(graph: Graph, _args: argparse.Namespace) -> None:
    me = graph.get(graph.ig_user, fields="username,followers_count,media_count")
    print(f"@{me['username']}: {me.get('followers_count')} followers, {me.get('media_count')} posts, API {graph.version}")


# ---------- own reels + insights ----------

def reel_insights(graph: Graph, media_id: str) -> dict:
    """All reel metrics in one call; if Meta rejects one (renamed or retired), falls back to one call per metric."""
    def read(data: list) -> dict:
        return {d["name"]: d.get("values", [{}])[0].get("value") for d in data if "name" in d}
    try:
        return read(graph.get(f"{media_id}/insights", metric=",".join(REEL_METRICS)).get("data", []))
    except GraphError:
        values: dict = {}
        for metric in REEL_METRICS:
            try:
                values.update(read(graph.get(f"{media_id}/insights", metric=metric).get("data", [])))
            except GraphError:
                continue
        return values


def sync(graph: Graph, args: argparse.Namespace, conn=None) -> None:
    conn = conn or db.connect()
    me = graph.get(graph.ig_user, fields="username")["username"]
    items = graph.pages(f"{graph.ig_user}/media", max_items=args.limit, fields=MEDIA_FIELDS, limit=50)
    reels = 0
    day = db.now()[:10]
    for m in items:
        db.upsert(conn, "media", {
            "id": m["id"], "owner": me, "source": "own", "caption": m.get("caption", ""), "media_type": m.get("media_type"),
            "product_type": m.get("media_product_type"), "permalink": m.get("permalink"), "timestamp": m.get("timestamp"),
            "like_count": m.get("like_count"), "comments_count": m.get("comments_count"), "fetched_at": db.now()})
        if m.get("media_product_type") == "REELS":
            reels += 1
            ins = reel_insights(graph, m["id"])
            db.upsert(conn, "own_insights", {
                "media_id": m["id"], "day": day, "views": ins.get("views"), "reach": ins.get("reach"),
                "saved": ins.get("saved"), "shares": ins.get("shares"), "likes": ins.get("likes"),
                "comments": ins.get("comments"), "avg_watch_ms": ins.get("ig_reels_avg_watch_time"),
                "total_watch_ms": ins.get("ig_reels_video_view_total_time")}, key=("media_id", "day"))
    conn.commit()
    print(f"synced {len(items)} posts ({reels} reels with insights) for @{me}")


# ---------- research: watchlist, business discovery, hashtags ----------

def watch(_graph: Graph, args: argparse.Namespace, conn=None) -> None:
    conn = conn or db.connect()
    if args.action == "add":
        for name in args.usernames:
            db.upsert(conn, "watchlist", {"username": name.lstrip("@").lower(), "note": args.note, "added_at": db.now()}, key=("username",))
    elif args.action == "remove":
        conn.executemany("DELETE FROM watchlist WHERE username=?", [(n.lstrip("@").lower(),) for n in args.usernames])
    conn.commit()
    rows = conn.execute("SELECT username, note FROM watchlist ORDER BY username").fetchall()
    print(f"{len(rows)} watched: " + ", ".join("@" + r["username"] for r in rows))


def discover_one(graph: Graph, username: str, conn, limit: int) -> int:
    fields = (f"business_discovery.username({username})"
              f"{{username,followers_count,media_count,media.limit({limit})"
              "{id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,view_count}}")
    try:
        bd = graph.get(graph.ig_user, fields=fields)["business_discovery"]
    except GraphError as error:
        if "view_count" not in str(error) and "media_product_type" not in str(error):
            raise
        bd = graph.get(graph.ig_user, fields=fields.replace(",view_count", "").replace(",media_product_type", ""))["business_discovery"]
    db.upsert(conn, "accounts", {"username": username, "followers": bd.get("followers_count"),
                                 "media_count": bd.get("media_count"), "fetched_at": db.now()}, key=("username",))
    media = bd.get("media", {}).get("data", [])
    for m in media:
        db.upsert(conn, "media", {
            "id": m["id"], "owner": username, "source": "watch", "caption": m.get("caption", ""),
            "media_type": m.get("media_type"), "product_type": m.get("media_product_type"), "permalink": m.get("permalink"),
            "timestamp": m.get("timestamp"), "like_count": m.get("like_count"), "comments_count": m.get("comments_count"),
            "view_count": m.get("view_count"), "fetched_at": db.now()})
    return len(media)


def discover(graph: Graph, args: argparse.Namespace, conn=None) -> None:
    conn = conn or db.connect()
    names = [r["username"] for r in conn.execute("SELECT username FROM watchlist")]
    if not names:
        raise GraphError("the watchlist is empty: python3 scripts/ig.py watch add <username> ...")
    for name in names:
        try:
            print(f"@{name}: {discover_one(graph, name, conn, args.limit)} posts")
        except GraphError as error:
            print(f"@{name}: skipped ({error})")
        conn.commit()


def hashtag(graph: Graph, args: argparse.Namespace, conn=None) -> None:
    conn = conn or db.connect()
    for tag in args.tags:
        tag = tag.lstrip("#").lower()
        found = graph.get("ig_hashtag_search", user_id=graph.ig_user, q=tag).get("data", [])
        if not found:
            print(f"#{tag}: not found")
            continue
        media = graph.get(f"{found[0]['id']}/top_media", user_id=graph.ig_user, limit=50,
                          fields="id,caption,media_type,permalink,timestamp,like_count,comments_count").get("data", [])
        for m in media:
            db.upsert(conn, "media", {
                "id": m["id"], "owner": None, "source": f"hashtag:{tag}", "caption": m.get("caption", ""),
                "media_type": m.get("media_type"), "permalink": m.get("permalink"), "timestamp": m.get("timestamp"),
                "like_count": m.get("like_count"), "comments_count": m.get("comments_count"), "fetched_at": db.now()})
        conn.commit()
        print(f"#{tag}: {len(media)} top posts (counts toward 30 unique hashtags per 7 days)")


# ---------- comments, replies, keyword DMs ----------

def media_id_for(ref: str, conn) -> str:
    if ref.isdigit():
        return ref
    row = conn.execute("SELECT media_id FROM reels WHERE slug=?", (ref,)).fetchone()
    if not row or not row["media_id"]:
        raise GraphError(f"no published media for '{ref}' (publish it with ig.py, or pass the media id)")
    return row["media_id"]


def fetch_comments(graph: Graph, media_id: str, conn) -> list[dict]:
    items = graph.pages(f"{media_id}/comments", max_items=1000, fields="id,text,username,timestamp", limit=50)
    for c in items:
        conn.execute("INSERT OR IGNORE INTO comments (id, media_id, username, text, timestamp) VALUES (?, ?, ?, ?, ?)",
                     (c["id"], media_id, c.get("username"), c.get("text", ""), c.get("timestamp")))
    conn.commit()
    return items


def comments(graph: Graph, args: argparse.Namespace, conn=None) -> None:
    conn = conn or db.connect()
    media_id = media_id_for(args.ref, conn)
    items = fetch_comments(graph, media_id, conn)
    rows = conn.execute("SELECT * FROM comments WHERE media_id=? ORDER BY timestamp", (media_id,)).fetchall()
    out = ROOT / "replies" / f"{args.ref}-comments.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps([dict(r) for r in rows], indent=2))
    new = sum(1 for r in rows if r["status"] == "new")
    print(f"{len(items)} comments ({new} not handled) -> {out.relative_to(ROOT)}")


def send_reply(graph: Graph, comment_id: str, text: str) -> None:
    graph.post(f"{comment_id}/replies", {"message": text})


def send_private_reply(graph: Graph, comment_id: str, text: str) -> None:
    """One private DM to the commenter (Meta allows one per comment, within 7 days of it)."""
    page = graph.env.get("FB_PAGE_ID")
    if not page:
        raise GraphError("no FB_PAGE_ID: re-run ig.py setup")
    graph.post(f"{page}/messages", body={"recipient": {"comment_id": comment_id}, "message": {"text": text}})


def reply(graph: Graph, args: argparse.Namespace) -> None:
    if not args.yes:
        print(f"DRY RUN: would reply to {args.comment_id}: {args.text!r} (add --yes to send)")
        return
    send_reply(graph, args.comment_id, args.text)
    print("replied")


def dm(graph: Graph, args: argparse.Namespace) -> None:
    if not args.yes:
        print(f"DRY RUN: would DM the author of {args.comment_id}: {args.text!r} (add --yes to send)")
        return
    send_private_reply(graph, args.comment_id, args.text)
    print("sent")


def caption_sections(slug: str) -> dict:
    path = ROOT / "briefs" / slug / "07-caption.md"
    if not path.exists():
        raise GraphError(f"missing {path.relative_to(ROOT)} (the caption writer creates it)")
    sections, current = {}, None
    for line in path.read_text().splitlines():
        if line.startswith("## "):
            current = line[3:].strip().lower()
            sections[current] = []
        elif current:
            sections[current].append(line)
    return {k: "\n".join(v).strip() for k, v in sections.items()}


def keyword_plan(slug: str) -> tuple[str, str, list[str]]:
    """(keyword, DM text, public reply variations) from the reel's 07-caption.md."""
    sections = caption_sections(slug)
    match = re.search(r'Comment "?([A-Za-z0-9]+)"?', sections.get("caption", ""))
    if not match:
        raise GraphError("no 'Comment \"KEYWORD\"' CTA in the caption")
    dm_block = sections.get("keyword dm", "")
    if not dm_block:
        raise GraphError("07-caption.md has no '## Keyword DM' section")
    lines = dm_block.splitlines()
    publics = next((l for l in lines if l.lower().startswith("public replies")), "")
    variations = re.findall(r'"([^"]+)"', publics) or ["Sent! Check your DMs."]
    dm_text = "\n".join(l for l in lines if not l.lower().startswith("public replies")).strip()
    return match.group(1).upper(), dm_text, variations


def matches_keyword(text: str, keyword: str) -> bool:
    return re.search(rf"\b{re.escape(keyword)}\b", text or "", re.IGNORECASE) is not None


def keyword(graph: Graph, args: argparse.Namespace, conn=None) -> None:
    conn = conn or db.connect()
    word, dm_text, variations = keyword_plan(args.slug)
    if "<LINK>" in dm_text:
        raise GraphError("the DM text still says <LINK>: add the real link to 07-caption.md first")
    media_id = media_id_for(args.slug, conn)
    fetch_comments(graph, media_id, conn)
    pending = [r for r in conn.execute("SELECT * FROM comments WHERE media_id=? AND status='new' ORDER BY timestamp", (media_id,))
               if matches_keyword(r["text"], word)]
    print(f"{len(pending)} new '{word}' comments")
    for k, row in enumerate(pending):
        public = variations[k % len(variations)]
        if not args.yes:
            print(f"  DRY RUN @{row['username']}: reply {public!r} + DM ({len(dm_text)} chars)")
            continue
        try:
            send_private_reply(graph, row["id"], dm_text)
            send_reply(graph, row["id"], public)
            conn.execute("UPDATE comments SET status='dm_sent', handled_at=? WHERE id=?", (db.now(), row["id"]))
            print(f"  sent @{row['username']}")
        except GraphError as error:
            conn.execute("UPDATE comments SET status='failed', handled_at=? WHERE id=?", (db.now(), row["id"]))
            print(f"  failed @{row['username']}: {error}")
        conn.commit()
        time.sleep(args.pause)
    if pending and not args.yes:
        print("add --yes to send")


# ---------- publish ----------

def brief_header(slug: str) -> dict:
    path = ROOT / "briefs" / slug / "02-script.md"
    header = {}
    if path.exists():
        for line in path.read_text().splitlines()[:12]:
            key, _, value = line.partition(":")
            if key.strip() in ("format", "hook", "cta") and value.strip():
                header[key.strip()] = value.strip()
    return header


def publish(graph: Graph, args: argparse.Namespace, conn=None, sleep: Callable = time.sleep) -> None:
    conn = conn or db.connect()
    video = Path(args.video) if args.video else ROOT / "out" / f"{args.slug}.mp4"
    if not video.exists():
        raise GraphError(f"{video} not found: render it first (sh scripts/render.sh {args.slug})")
    caption = args.caption if args.caption is not None else caption_sections(args.slug).get("caption", "")
    if len(caption) > 2200:
        raise GraphError(f"caption is {len(caption)} characters; Instagram allows 2,200")
    size = video.stat().st_size
    if not args.yes:
        print(f"DRY RUN: would publish {video.name} ({size / 1e6:.1f} MB) as a Reel"
              f"{f', cover at {args.cover_ms} ms' if args.cover_ms is not None else ''}, caption:\n{caption}\n(add --yes to publish)")
        return
    params = {"media_type": "REELS", "upload_type": "resumable", "caption": caption, "share_to_feed": "true"}
    if args.cover_ms is not None:
        params["thumb_offset"] = str(args.cover_ms)
    container = graph.post(f"{graph.ig_user}/media", params)
    upload = graph.http("POST", container["uri"], video.read_bytes(), {
        "Authorization": f"OAuth {graph.token}", "offset": "0", "file_size": str(size)})
    if not upload.get("success", False) and upload.get("error"):
        raise GraphError(f"upload failed: {upload['error'].get('message')}")
    for _ in range(120):
        status = graph.get(container["id"], fields="status_code,status")
        if status.get("status_code") == "FINISHED":
            break
        if status.get("status_code") in ("ERROR", "EXPIRED"):
            raise GraphError(f"Instagram could not process the video: {status.get('status')}")
        sleep(5)
    else:
        raise GraphError("the video is still processing after 10 minutes; run publish again later")
    media = graph.post(f"{graph.ig_user}/media_publish", {"creation_id": container["id"]})
    permalink = graph.get(media["id"], fields="permalink").get("permalink", "")
    header = brief_header(args.slug)
    db.upsert(conn, "reels", {"slug": args.slug, "media_id": media["id"], "published_at": db.now(),
                              "format": header.get("format"), "hook": header.get("hook"), "cta": header.get("cta")}, key=("slug",))
    conn.commit()
    print(f"published {args.slug}: {permalink}")


# ---------- CLI ----------

def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Instagram connector for reel-factory.")
    sub = p.add_subparsers(dest="command", required=True)
    s = sub.add_parser("setup", help="exchange a short-lived token and save the Page token")
    s.add_argument("--token", required=True)
    s.add_argument("--username", help="pick this Instagram account if several are linked")
    sub.add_parser("check")
    s = sub.add_parser("sync")
    s.add_argument("--limit", type=int, default=100)
    s = sub.add_parser("watch")
    s.add_argument("action", choices=["add", "remove", "list"])
    s.add_argument("usernames", nargs="*")
    s.add_argument("--note", default="")
    s = sub.add_parser("discover")
    s.add_argument("--limit", type=int, default=30, help="posts per account")
    s = sub.add_parser("hashtag")
    s.add_argument("tags", nargs="+")
    s = sub.add_parser("comments")
    s.add_argument("ref", help="reel slug or media id")
    s = sub.add_parser("keyword")
    s.add_argument("slug")
    s.add_argument("--yes", action="store_true")
    s.add_argument("--pause", type=float, default=2.0, help="seconds between sends")
    for name in ("reply", "dm"):
        s = sub.add_parser(name)
        s.add_argument("comment_id")
        s.add_argument("text")
        s.add_argument("--yes", action="store_true")
    s = sub.add_parser("publish")
    s.add_argument("slug")
    s.add_argument("--video")
    s.add_argument("--caption")
    s.add_argument("--cover-ms", type=int)
    s.add_argument("--yes", action="store_true")
    return p


COMMANDS = {"setup": setup, "check": check, "sync": sync, "watch": watch, "discover": discover, "hashtag": hashtag,
            "comments": comments, "keyword": keyword, "reply": reply, "dm": dm, "publish": publish}


def main() -> None:
    args = parser().parse_args()
    try:
        COMMANDS[args.command](Graph(load_env()), args)
    except GraphError as error:
        sys.exit(f"ig.py: {error}")


if __name__ == "__main__":
    main()
