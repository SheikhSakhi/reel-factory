// Render many QA stills from one bundle (much faster than one `remotion still` per frame).
// Usage: node scripts/stills.mjs <compositionId> <outDir> <scale> <frame> [frame ...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [id, outDir, scaleArg, ...frames] = process.argv.slice(2);
if (!id || !outDir || frames.length === 0) {
  console.error("usage: node scripts/stills.mjs <id> <outDir> <scale> <frame...>");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, chromiumOptions: { gl: "swangle" } });
for (const f of frames.map(Number)) {
  const output = path.join(outDir, `${id}-f${String(f).padStart(5, "0")}.jpg`);
  await renderStill({
    serveUrl, composition, frame: f, output, imageFormat: "jpeg", jpegQuality: 85,
    scale: Number(scaleArg), chromiumOptions: { gl: "swangle" },
  });
  console.log(output);
}
