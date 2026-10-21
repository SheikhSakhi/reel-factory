import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import align  # noqa: E402
import edit  # noqa: E402


def w(text, start, end):
    return {"text": text, "start": start, "end": end}


class EditTest(unittest.TestCase):
    def test_sentences_split_on_punctuation_and_long_pauses(self):
        words = [w("Hi.", 0, .3), w("So", .4, .5), w("this", .5, .7), w("works", 2.0, 2.3)]
        self.assertEqual(edit.sentences(words), [[0], [1, 2], [3]])

    def test_retake_detection(self):
        self.assertTrue(edit.is_retake(["most", "doctors", "think"], ["most", "doctors", "think", "ai", "helps"]))
        self.assertFalse(edit.is_retake(["they", "dont"], ["they", "save", "attention"]))

    def test_kept_words_follow_the_edited_line(self):
        words = [w(t, i, i + .5) for i, t in enumerate("Most doctors think scribes save them time.".split())]
        self.assertEqual(edit.kept_words(words, list(range(7)), "Most doctors think scribes save time."), [0, 1, 2, 3, 4, 6])

    def test_removed_word_is_never_inside_a_segment(self):
        words = [w("save", 1.0, 1.4), w("them", 1.4, 1.7), w("time", 1.7, 2.1)]
        segs = edit.build_segments(words, [("S1", 0), ("S1", 2)], duration=5)
        self.assertEqual(len(segs), 2)
        self.assertLessEqual(segs[0]["out"], 1.4)
        self.assertGreaterEqual(segs[1]["in"], 1.7)

    def test_long_pause_is_cut_and_padding_does_not_overlap(self):
        words = [w("one", 0, .4), w("two", 1.5, 1.9)]
        a, b = edit.build_segments(words, [("S1", 0), ("S1", 1)], duration=3)
        self.assertLessEqual(a["out"], b["in"])

    def test_align_assigns_sentence_end_to_the_earlier_region(self):
        words = [w("Most", .1, .5), w("scribes.", 3.2, 3.9), w("Most", 4.0, 4.3), w("time.", 7.4, 8.2)]
        regions = [(0.1, 2.3), (4.0, 6.7)]
        self.assertEqual(align.assign(words, regions), [0, 0, 1, 1])


if __name__ == "__main__":
    unittest.main()
