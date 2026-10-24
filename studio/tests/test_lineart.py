import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
try:
    import cv2  # noqa: F401
    import numpy as np
    import lineart as tracer  # noqa: E402
except (ImportError, SystemExit):
    tracer = None


@unittest.skipIf(tracer is None, "opencv not installed")
class TraceTest(unittest.TestCase):
    def test_smooth_path_closed_and_open(self):
        pts = np.array([[0, 0], [10, 0], [10, 10], [0, 10]])
        closed = tracer.smooth_path(pts, True)
        self.assertTrue(closed.startswith("M ") and closed.endswith("Z"))
        self.assertIn("Q", closed)
        self.assertTrue(tracer.smooth_path(pts, False).split()[-3] == "L")

    def test_thin_loop_is_drawn_once(self):
        # A 1-px horizontal line comes back from findContours as out-and-back: keep half.
        line = np.array([[[x, 5]] for x in range(0, 50)] + [[[x, 5]] for x in range(48, 0, -1)], dtype=np.int32)
        half = tracer.single_pass(line)
        self.assertLessEqual(len(half), 51)
        self.assertEqual(int(half[-1][0][0]), 49)

    def test_traces_a_drawn_shape_with_outline_first(self):
        img = np.full((200, 300, 3), 255, np.uint8)
        cv2.circle(img, (150, 100), 60, (40, 40, 40), -1)
        cv2.line(img, (110, 100), (190, 100), (255, 255, 255), 4)
        strokes = tracer.trace(img, None, "outline", 0.5, 50)
        self.assertGreaterEqual(len(strokes), 1)
        self.assertEqual(strokes[0]["kind"], "outline")
        self.assertLess(strokes[0]["x0"], 100)


if __name__ == "__main__":
    unittest.main()
