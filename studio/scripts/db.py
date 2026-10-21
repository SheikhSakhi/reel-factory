"""The factory's memory: one local SQLite file (data/factory.db, never committed).

Everything the connector and the research tools learn lands here, so agents can rank ideas
on evidence instead of guesses: your reels and their insights, watched accounts' posts,
hashtag results, YouTube Shorts, the tags the trend scout gives each outlier, and comments.
"""
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "data" / "factory.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS accounts (
  username TEXT PRIMARY KEY, followers INTEGER, media_count INTEGER, fetched_at TEXT);
CREATE TABLE IF NOT EXISTS watchlist (
  username TEXT PRIMARY KEY, note TEXT, added_at TEXT);
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY, owner TEXT, source TEXT, caption TEXT, media_type TEXT, product_type TEXT,
  permalink TEXT, timestamp TEXT, like_count INTEGER, comments_count INTEGER, view_count INTEGER, fetched_at TEXT);
CREATE TABLE IF NOT EXISTS own_insights (
  media_id TEXT, day TEXT, views INTEGER, reach INTEGER, saved INTEGER, shares INTEGER, likes INTEGER,
  comments INTEGER, avg_watch_ms INTEGER, total_watch_ms INTEGER, PRIMARY KEY (media_id, day));
CREATE TABLE IF NOT EXISTS reels (
  slug TEXT PRIMARY KEY, media_id TEXT, published_at TEXT, format TEXT, hook TEXT, cta TEXT);
CREATE TABLE IF NOT EXISTS tags (
  media_id TEXT PRIMARY KEY, topic TEXT, format TEXT, hook_type TEXT, proof_type TEXT, cta_type TEXT,
  notes TEXT, tagged_at TEXT);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY, media_id TEXT, username TEXT, text TEXT, timestamp TEXT,
  status TEXT DEFAULT 'new', handled_at TEXT);
CREATE TABLE IF NOT EXISTS youtube (
  id TEXT PRIMARY KEY, query TEXT, title TEXT, channel TEXT, published_at TEXT, views INTEGER,
  likes INTEGER, comments INTEGER, duration_s INTEGER, fetched_at TEXT);
"""


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def connect(path: Path | str | None = None) -> sqlite3.Connection:
    target = Path(path) if path else DB_PATH
    target.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(target)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def upsert(conn: sqlite3.Connection, table: str, row: dict, key: tuple[str, ...] = ("id",)) -> None:
    """Insert or update one row; columns not in `row` keep their stored value."""
    cols = list(row)
    updates = ", ".join(f"{c}=excluded.{c}" for c in cols if c not in key) or f"{key[0]}={key[0]}"
    conn.execute(
        f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join('?' for _ in cols)}) "
        f"ON CONFLICT ({', '.join(key)}) DO UPDATE SET {updates}",
        [row[c] for c in cols])
