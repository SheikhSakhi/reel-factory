import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from fxpass import build, source_seconds  # noqa: E402

TAKE = {"scenes": [{"id": "S1", "from": 0, "to": 300, "speechEnd": 290, "words": [{"token": "doctor.", "frame": 30, "endFrame": 40}]}]}
# Two kept stretches: edited 0-99 plays source frames 300-399, edited 100-299 plays source 600-799.
EDIT = {"segments": [{"from": 0, "durationInFrames": 100, "startFrom": 300}, {"from": 100, "durationInFrames": 200, "startFrom": 600}]}


class FxPassTest(unittest.TestCase):
    def test_edited_frames_map_back_through_cuts(self):
        self.assertAlmostEqual(source_seconds(EDIT, 30), 11.0)
        self.assertAlmostEqual(source_seconds(EDIT, 120), 20.667, places=3)

    def test_word_moment_hold_and_options(self):
        fx = build(TAKE, EDIT, [{"fx": "backdrop-word", "from": "S1:doctor", "hold": 30, "text": "DOCTOR", "opt": {"to": "16"}}])
        self.assertEqual(fx, [{"fx": "backdrop-word", "start": 11.0, "end": 12.0, "text": "DOCTOR", "to": "16"}])

    def test_effect_across_a_cut_is_refused(self):
        with self.assertRaisesRegex(ValueError, "spans a cut"):
            build(TAKE, EDIT, [{"fx": "orbit", "from": 90, "to": 110}])

    def test_effect_ending_on_the_cut_is_fine(self):
        fx = build(TAKE, EDIT, [{"fx": "lean-in", "from": 70, "to": 100}])
        self.assertEqual((fx[0]["start"], fx[0]["end"]), (12.333, 13.333))


if __name__ == "__main__":
    unittest.main()
