import argparse
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import db  # noqa: E402
import trends  # noqa: E402


def stamp(days_ago: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%dT%H:%M:%S+0000")


class TrendsTest(unittest.TestCase):
    def setUp(self):
        self.conn = db.connect(Path(tempfile.mkdtemp()) / "t.db")
        views = [1000, 1100, 900, 1000, 950, 8000, 1050]
        for k, v in enumerate(views):
            db.upsert(self.conn, "media", {"id": f"p{k}", "owner": "peer", "source": "watch", "view_count": v,
                                           "timestamp": stamp(k + 1), "caption": f"post {k}"})
        db.upsert(self.conn, "media", {"id": "old", "owner": "peer", "source": "watch", "view_count": 50000, "timestamp": stamp(200)})

    def test_outlier_is_scored_against_its_own_account_median(self):
        found = trends.score_outliers(self.conn, days=45, min_score=2)
        self.assertEqual([o["media_id"] for o in found], ["p5"])
        self.assertAlmostEqual(found[0]["score"], 8000 / 1025, places=1)

    def test_old_posts_and_thin_accounts_are_ignored(self):
        db.upsert(self.conn, "media", {"id": "t1", "owner": "tiny", "source": "watch", "view_count": 99999, "timestamp": stamp(1)})
        ids = [o["media_id"] for o in trends.score_outliers(self.conn, days=45, min_score=2)]
        self.assertNotIn("old", ids)
        self.assertNotIn("t1", ids)

    def test_falls_back_to_engagement_when_views_hidden(self):
        row = {"view_count": None, "like_count": 10, "comments_count": 2}
        self.assertEqual(trends.engagement(row), 16.0)

    def test_aggregate_groups_tags_by_score(self):
        db.upsert(self.conn, "tags", {"media_id": "p5", "format": "Myth vs fact", "hook_type": "number"}, key=("media_id",))
        db.upsert(self.conn, "tags", {"media_id": "p0", "format": "story", "hook_type": "question"}, key=("media_id",))
        stats = trends.aggregate(self.conn, days=45)
        self.assertEqual(stats["format"][0][0], "myth vs fact")

    def test_iso_duration(self):
        self.assertEqual(trends.iso_duration("PT1M5S"), 65)
        self.assertEqual(trends.iso_duration("PT45S"), 45)


if __name__ == "__main__":
    unittest.main()
