import argparse
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import db  # noqa: E402
import ig  # noqa: E402


class FakeHttp:
    """Records every request and answers from a list of (match, response) rules."""

    def __init__(self, rules):
        self.rules = rules
        self.calls = []

    def __call__(self, method, url, data=None, headers=None):
        self.calls.append((method, url, data, headers or {}))
        for match, response in self.rules:
            if match(method, url):
                return response(method, url, data) if callable(response) else response
        return {"error": {"code": 100, "message": f"unexpected {method} {url}"}}


ENV = {"IG_ACCESS_TOKEN": "PAGE_TOKEN", "IG_USER_ID": "17841", "FB_PAGE_ID": "1055", "GRAPH_VERSION": "v25.0"}


def args(**kw):
    return argparse.Namespace(**kw)


class GraphTest(unittest.TestCase):
    def setUp(self):
        self.conn = db.connect(Path(tempfile.mkdtemp()) / "t.db")

    def test_error_is_raised_with_rate_limit_hint(self):
        http = FakeHttp([(lambda m, u: True, {"error": {"code": 4, "message": "Application request limit reached"}})])
        with self.assertRaisesRegex(ig.GraphError, "rate limited"):
            ig.Graph(ENV, http).get("17841", fields="username")

    def test_sync_stores_media_and_batched_insights(self):
        http = FakeHttp([
            (lambda m, u: "/17841?" in u, {"username": "drsakhi"}),
            (lambda m, u: "/17841/media?" in u, {"data": [
                {"id": "1", "media_product_type": "REELS", "caption": "a", "timestamp": "2026-10-01T10:00:00+0000"},
                {"id": "2", "media_product_type": "FEED", "caption": "b"}]}),
            (lambda m, u: "/1/insights" in u, {"data": [
                {"name": "views", "values": [{"value": 5400}]}, {"name": "reach", "values": [{"value": 4000}]},
                {"name": "saved", "values": [{"value": 120}]}, {"name": "ig_reels_avg_watch_time", "values": [{"value": 7400}]}]}),
        ])
        ig.sync(ig.Graph(ENV, http), args(limit=100), conn=self.conn)
        row = self.conn.execute("SELECT * FROM own_insights WHERE media_id='1'").fetchone()
        self.assertEqual((row["views"], row["reach"], row["saved"], row["avg_watch_ms"]), (5400, 4000, 120, 7400))
        self.assertEqual(self.conn.execute("SELECT COUNT(*) FROM media").fetchone()[0], 2)
        self.assertEqual(sum(1 for c in http.calls if "/insights" in c[1]), 1)

    def test_insights_fall_back_per_metric_when_one_is_rejected(self):
        def insights(method, url, data):
            if "%2C" in url:
                return {"error": {"code": 100, "message": "metric ig_reels_video_view_total_time is not supported"}}
            if "metric=views" in url:
                return {"data": [{"name": "views", "values": [{"value": 10}]}]}
            return {"error": {"code": 100, "message": "unsupported"}}
        http = FakeHttp([(lambda m, u: "/insights" in u, insights)])
        self.assertEqual(ig.reel_insights(ig.Graph(ENV, http), "9"), {"views": 10})

    def test_discover_retries_without_view_count(self):
        def bd(method, url, data):
            if "view_count" in url:
                return {"error": {"code": 100, "message": "Tried accessing nonexisting field (view_count)"}}
            return {"business_discovery": {"followers_count": 900, "media_count": 40,
                                           "media": {"data": [{"id": "m1", "like_count": 50, "comments_count": 4}]}}}
        http = FakeHttp([(lambda m, u: "business_discovery" in u, bd)])
        self.assertEqual(ig.discover_one(ig.Graph(ENV, http), "peer", self.conn, 30), 1)
        self.assertEqual(self.conn.execute("SELECT followers FROM accounts").fetchone()[0], 900)

    def test_private_reply_payload(self):
        http = FakeHttp([(lambda m, u: "/1055/messages" in u, {"recipient_id": "x", "message_id": "y"})])
        ig.send_private_reply(ig.Graph(ENV, http), "C1", "here you go")
        method, url, data, headers = http.calls[0]
        self.assertEqual(method, "POST")
        self.assertEqual(json.loads(data), {"recipient": {"comment_id": "C1"}, "message": {"text": "here you go"}})

    def test_keyword_flow_dry_run_sends_nothing_and_yes_sends_once(self):
        brief = ig.ROOT / "briefs" / "ig-test"
        brief.mkdir(parents=True, exist_ok=True)
        (brief / "07-caption.md").write_text(
            '## Caption\nComment "GUIDE" and I\'ll DM you the guide.\n\n## Keyword DM\nHere it is: https://x.y/g\n'
            'Public replies: "Sent!" · "Check your DMs."\n')
        try:
            db.upsert(self.conn, "reels", {"slug": "ig-test", "media_id": "M1"}, key=("slug",))
            comments = {"data": [{"id": "c1", "text": "guide please", "username": "a"},
                                 {"id": "c2", "text": "great video", "username": "b"},
                                 {"id": "c3", "text": "GUIDE", "username": "c"}]}
            rules = [(lambda m, u: "/M1/comments" in u, comments), (lambda m, u: m == "POST", {"id": "ok"})]
            http = FakeHttp(rules)
            ig.keyword(ig.Graph(ENV, http), args(slug="ig-test", yes=False, pause=0), conn=self.conn)
            self.assertFalse([c for c in http.calls if c[0] == "POST"])
            ig.keyword(ig.Graph(ENV, http), args(slug="ig-test", yes=True, pause=0), conn=self.conn)
            posts = [c for c in http.calls if c[0] == "POST"]
            self.assertEqual(len(posts), 4)  # c1 and c3: one DM + one public reply each
            http.calls.clear()
            ig.keyword(ig.Graph(ENV, http), args(slug="ig-test", yes=True, pause=0), conn=self.conn)
            self.assertFalse([c for c in http.calls if c[0] == "POST"], "already-handled comments must not be messaged twice")
        finally:
            (brief / "07-caption.md").unlink()
            brief.rmdir()

    def test_keyword_refuses_placeholder_link(self):
        brief = ig.ROOT / "briefs" / "ig-test2"
        brief.mkdir(parents=True, exist_ok=True)
        (brief / "07-caption.md").write_text('## Caption\nComment "GUIDE"\n\n## Keyword DM\nLink: <LINK>\n')
        try:
            with self.assertRaisesRegex(ig.GraphError, "LINK"):
                ig.keyword(ig.Graph(ENV, FakeHttp([])), args(slug="ig-test2", yes=True, pause=0), conn=self.conn)
        finally:
            (brief / "07-caption.md").unlink()
            brief.rmdir()

    def test_publish_resumable_flow(self):
        video = Path(tempfile.mkdtemp()) / "r.mp4"
        video.write_bytes(b"0" * 1000)
        statuses = iter([{"status_code": "IN_PROGRESS"}, {"status_code": "FINISHED"}])
        http = FakeHttp([
            (lambda m, u: m == "POST" and "/17841/media?" in u, {"id": "CONT", "uri": "https://rupload.facebook.com/ig-api-upload/v25.0/CONT"}),
            (lambda m, u: u.startswith("https://rupload"), {"success": True}),
            (lambda m, u: "/CONT?" in u, lambda *a: next(statuses)),
            (lambda m, u: "media_publish" in u, {"id": "MEDIA"}),
            (lambda m, u: "/MEDIA?" in u, {"permalink": "https://instagram.com/reel/x"}),
        ])
        dry = FakeHttp([])
        ig.publish(ig.Graph(ENV, dry), args(slug="t", video=str(video), caption="hi", cover_ms=1500, yes=False), conn=self.conn)
        self.assertEqual(dry.calls, [])
        ig.publish(ig.Graph(ENV, http), args(slug="t", video=str(video), caption="hi", cover_ms=1500, yes=True),
                   conn=self.conn, sleep=lambda s: None)
        create = http.calls[0][1]
        self.assertIn("upload_type=resumable", create)
        self.assertIn("thumb_offset=1500", create)
        upload = http.calls[1]
        self.assertEqual(upload[3]["file_size"], "1000")
        self.assertEqual(upload[3]["Authorization"], "OAuth PAGE_TOKEN")
        self.assertEqual(self.conn.execute("SELECT media_id FROM reels WHERE slug='t'").fetchone()[0], "MEDIA")

    def test_publish_rejects_long_caption(self):
        video = Path(tempfile.mkdtemp()) / "r.mp4"
        video.write_bytes(b"0")
        with self.assertRaisesRegex(ig.GraphError, "2,200"):
            ig.publish(ig.Graph(ENV, FakeHttp([])), args(slug="t", video=str(video), caption="x" * 2201, cover_ms=None, yes=True), conn=self.conn)


if __name__ == "__main__":
    unittest.main()
