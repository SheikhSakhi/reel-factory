import argparse
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import vo  # noqa: E402
import voice_take  # noqa: E402

SCRIPT = [("S1", "Один врач и три тысячи пациентов."), ("S2", "Обычно врач видит пациента раз в несколько месяцев."),
          ("S3", "Напишите План, и я пришлю.")]


def spoken(text: str) -> tuple[list[str], list[str]]:
    raw = text.split()
    return [voice_take.norm(w) for w in raw], raw


class SceneStartsTest(unittest.TestCase):
    def test_read_as_written(self):
        norm, raw = spoken("Один врач и три тысячи пациентов. Обычно врач видит пациента раз в несколько месяцев. Напишите план, и я пришлю.")
        self.assertEqual(voice_take.scene_starts(SCRIPT, norm, raw), [0, 6, 14])

    def test_reworded_opening_starts_at_its_sentence(self):
        norm, raw = spoken("Один врач и три тысячи пациентов. Как правило, доктор видит пациента раз в полгода. Напишите план, и я пришлю.")
        starts = voice_take.scene_starts(SCRIPT, norm, raw)
        self.assertEqual(raw[starts[1]], "Как")
        self.assertEqual(raw[starts[2]], "Напишите")

    def test_scene_never_said_follows_the_previous_one(self):
        norm, raw = spoken("Один врач и три тысячи пациентов. Что-то совсем другое. Напишите план, и я пришлю.")
        starts = voice_take.scene_starts(SCRIPT, norm, raw)
        self.assertEqual(starts[0], 0)
        self.assertTrue(starts[0] < starts[1] < starts[2])
        self.assertEqual(raw[starts[2]], "Напишите")

    def test_too_short_recording_is_rejected(self):
        norm, raw = spoken("Один врач.")
        with self.assertRaises(ValueError):
            voice_take.scene_starts(SCRIPT, norm, raw)


class ElevenLabsTest(unittest.TestCase):
    def test_request_shape_and_missing_key(self):
        with self.assertRaisesRegex(RuntimeError, "ELEVENLABS_API_KEY"):
            vo.elevenlabs_synth("text", Path(tempfile.mkdtemp()) / "a.mp3", {})
        seen = {}

        def fake_urlopen(request, timeout):
            seen["url"], seen["headers"], seen["body"] = request.full_url, dict(request.header_items()), json.loads(request.data)
            return io.BytesIO(b"ID3audio")
        out = Path(tempfile.mkdtemp()) / "a.mp3"
        with mock.patch.object(vo.urllib.request, "urlopen", fake_urlopen):
            vo.elevenlabs_synth("Привет", out, {"ELEVENLABS_API_KEY": "k", "ELEVENLABS_VOICE_ID": "v1"})
        self.assertIn("/v1/text-to-speech/v1", seen["url"])
        self.assertEqual(seen["headers"]["Xi-api-key"], "k")
        self.assertEqual(seen["body"]["text"], "Привет")
        self.assertEqual(out.read_bytes(), b"ID3audio")


if __name__ == "__main__":
    unittest.main()
