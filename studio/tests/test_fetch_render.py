import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import edit_render  # noqa: E402
import fetch  # noqa: E402

TAKE = {"totalFrames": 300, "scenes": [
    {"id": "S1", "from": 0, "to": 150, "speechEnd": 140, "words": [
        {"token": "Here's", "frame": 3, "endFrame": 10}, {"token": "65%", "frame": 40, "endFrame": 55},
        {"token": "here's", "frame": 90, "endFrame": 99}]},
    {"id": "S2", "from": 150, "to": 300, "speechEnd": 280, "words": [{"token": "Comment", "frame": 160, "endFrame": 175}]},
]}


class FetchTest(unittest.TestCase):
    def test_google_drive_links_become_direct_downloads(self):
        for link in ("https://drive.google.com/file/d/1AbCdEfGhIjKl/view?usp=sharing",
                     "https://drive.google.com/open?id=1AbCdEfGhIjKl",
                     "https://drive.google.com/uc?export=download&id=1AbCdEfGhIjKl"):
            self.assertEqual(fetch.direct_url(link),
                             "https://drive.usercontent.google.com/download?id=1AbCdEfGhIjKl&export=download&confirm=t")

    def test_dropbox_links_are_forced_raw(self):
        url = fetch.direct_url("https://www.dropbox.com/scl/fi/abc/v.mp4?rlkey=xyz&dl=0")
        self.assertIn("raw=1", url)
        self.assertIn("rlkey=xyz", url)
        self.assertNotIn("dl=0", url)

    def test_other_links_pass_through(self):
        self.assertEqual(fetch.direct_url("https://example.com/v.mp4"), "https://example.com/v.mp4")


class ResolveTest(unittest.TestCase):
    def test_moments(self):
        self.assertEqual(edit_render.resolve(TAKE, "S1:65"), 40)
        self.assertEqual(edit_render.resolve(TAKE, "S1:here's#1"), 90)
        self.assertEqual(edit_render.resolve(TAKE, "S2:start"), 150)
        self.assertEqual(edit_render.resolve(TAKE, "S1:end"), 140)
        self.assertEqual(edit_render.resolve(TAKE, "2.5s"), 75)
        self.assertEqual(edit_render.resolve(TAKE, 120), 120)

    def test_bad_moment_is_rejected(self):
        with self.assertRaises(ValueError):
            edit_render.resolve(TAKE, "the end")


if __name__ == "__main__":
    unittest.main()
