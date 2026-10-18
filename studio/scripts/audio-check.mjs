// Usage: npm run audio-check -- <CompositionId>
// Renders the reel's audio mix to out/<id>.wav and reports peak, loudness and clipping.
// Exits 1 if the mix clips or peaks above -1 dBFS, so voice-over gain can be tuned safely.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";

const PEAK_LIMIT_DB = -1;
const CLIP_THRESHOLD = 0.999;
const WINDOW_SECONDS = 0.05;
const ACTIVE_FLOOR_DB = -45;

const id = process.argv[2];
if (!id || !/^[\w-]+$/.test(id)) {
  console.error("usage: npm run audio-check -- <CompositionId>");
  process.exit(2);
}

const toDb = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);

/** Reads a PCM (16/24/32-bit int) or 32-bit float WAV into one Float32Array per channel. */
const readWav = (path) => {
  const buf = readFileSync(path);
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`${path} is not a WAV file`);
  }
  let fmt = null;
  let data = null;
  for (let pos = 12; pos + 8 <= buf.length; ) {
    const chunkId = buf.toString("ascii", pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (chunkId === "fmt ") {
      fmt = {
        format: buf.readUInt16LE(pos + 8),
        channels: buf.readUInt16LE(pos + 10),
        sampleRate: buf.readUInt32LE(pos + 12),
        bits: buf.readUInt16LE(pos + 22),
      };
    }
    if (chunkId === "data") data = { start: pos + 8, size: Math.min(size, buf.length - pos - 8) };
    pos += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new Error(`${path} has no fmt/data chunk`);
  const bytes = fmt.bits / 8;
  const frames = Math.floor(data.size / (bytes * fmt.channels));
  const read = (offset) => {
    if (fmt.format === 3) return buf.readFloatLE(offset);
    if (fmt.bits === 16) return buf.readInt16LE(offset) / 32768;
    if (fmt.bits === 24) return buf.readIntLE(offset, 3) / 8388608;
    if (fmt.bits === 32) return buf.readInt32LE(offset) / 2147483648;
    throw new Error(`unsupported WAV: format ${fmt.format}, ${fmt.bits}-bit`);
  };
  const channels = Array.from({ length: fmt.channels }, () => new Float32Array(frames));
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < fmt.channels; c++) {
      channels[c][i] = read(data.start + (i * fmt.channels + c) * bytes);
    }
  }
  return { sampleRate: fmt.sampleRate, channels };
};

const measure = ({ sampleRate, channels }) => {
  const length = channels[0].length;
  const window = Math.max(1, Math.round(sampleRate * WINDOW_SECONDS));
  let peak = 0;
  let clipped = 0;
  let activeSum = 0;
  let activeCount = 0;
  for (let start = 0; start < length; start += window) {
    let sum = 0;
    let count = 0;
    for (const ch of channels) {
      for (let i = start; i < Math.min(length, start + window); i++) {
        const v = Math.abs(ch[i]);
        if (v > peak) peak = v;
        if (v >= CLIP_THRESHOLD) clipped++;
        sum += v * v;
        count++;
      }
    }
    const rms = Math.sqrt(sum / count);
    if (toDb(rms) > ACTIVE_FLOOR_DB) {
      activeSum += sum;
      activeCount += count;
    }
  }
  return {
    seconds: length / sampleRate,
    peakDb: toDb(peak),
    activeRmsDb: activeCount ? toDb(Math.sqrt(activeSum / activeCount)) : -Infinity,
    clipped,
  };
};

mkdirSync("out", { recursive: true });
const wavPath = `out/${id}.wav`;
execFileSync("npx", ["remotion", "render", "src/index.ts", id, wavPath, "--codec=wav"], { stdio: ["ignore", "ignore", "inherit"] });

const result = measure(readWav(wavPath));
console.log(`audio-check ${id}: ${result.seconds.toFixed(2)}s`);
console.log(`  peak        ${result.peakDb.toFixed(2)} dBFS (limit ${PEAK_LIMIT_DB})`);
console.log(`  active RMS  ${result.activeRmsDb.toFixed(2)} dBFS (speech is usually -16 to -20)`);
console.log(`  clipped     ${result.clipped} samples`);

if (!Number.isFinite(result.peakDb) || !Number.isFinite(result.activeRmsDb)) {
  console.log("FAIL: the mix is silent (is <VoiceOver> mounted and the take.mp3 path right?)");
  process.exit(1);
}
const ok = result.peakDb <= PEAK_LIMIT_DB && result.clipped === 0;
console.log(ok ? "PASS" : "FAIL: lower the voice-over volume or the loudest SFX");
process.exit(ok ? 0 : 1);
