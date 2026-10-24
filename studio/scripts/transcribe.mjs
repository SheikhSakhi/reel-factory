// Usage: node scripts/transcribe.mjs <audio.wav> <out.json> [--model base] [--language auto]
// Word-level transcription with whisper.cpp, run locally (free, offline after the first run).
// The first run builds whisper.cpp into .whisper/ and downloads the model (base: ~150 MB).
// Input must be 16 kHz mono WAV (scripts/edit.py prepares it).
// Output: { language, words: [{ text, start, end, p }] } with times in seconds.
import { downloadWhisperModel, installWhisperCpp, transcribe } from "@remotion/install-whisper-cpp";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const WHISPER_VERSION = "1.7.4";
const WHISPER_DIR = path.resolve(".whisper");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const [input, output] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
if (!input || !output) {
  console.error("usage: node scripts/transcribe.mjs <audio.wav> <out.json> [--model base] [--language auto]");
  process.exit(2);
}
const model = flag("model", "base");
const language = flag("language", "auto");

await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION, printOutput: false });
await downloadWhisperModel({ model, folder: WHISPER_DIR, printOutput: false });

const result = await transcribe({
  inputPath: path.resolve(input),
  whisperPath: WHISPER_DIR,
  whisperCppVersion: WHISPER_VERSION,
  model,
  modelFolder: WHISPER_DIR,
  tokenLevelTimestamps: true,
  printOutput: false,
  // whisper.cpp assumes English when no language is given, and then translates other speech into
  // English. "auto" must be passed explicitly to detect the spoken language.
  language: language === "auto" ? null : language,
  additionalArgs: language === "auto" ? [["-l", "auto"]] : [],
});

// whisper.cpp tokens are sub-word pieces; a piece starting with a space begins a new word.
const words = [];
for (const item of result.transcription) {
  for (const token of item.tokens) {
    if (/^\[_|^\[BLANK/.test(token.text) || token.text.trim() === "") continue;
    const start = token.offsets.from / 1000;
    const end = token.offsets.to / 1000;
    const last = words[words.length - 1];
    if (last && !token.text.startsWith(" ")) {
      last.text += token.text;
      last.end = end;
      last.p = Math.min(last.p, token.p);
    } else {
      words.push({ text: token.text.trim(), start, end, p: token.p });
    }
  }
}

mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
writeFileSync(output, JSON.stringify({ language: result.result.language, model, words }, null, 2));
console.log(`transcribed ${words.length} words (${result.result.language}) -> ${output}`);
