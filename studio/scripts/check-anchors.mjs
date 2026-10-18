// Verifies every at("Bxx", "word") / atEnd(...) anchor in a film's source exists in its timing.json.
// Usage: node scripts/check-anchors.mjs <slug>
import fs from "node:fs";
import path from "node:path";
const slug = process.argv[2];
const dir = path.resolve("src/reels", slug);
const timing = JSON.parse(fs.readFileSync(path.join(dir, "timing.json"), "utf8"));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const words = new Map(timing.blocks.map((b) => [b.id, b.words.map((w) => norm(w.word))]));
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => e.isDirectory() ? walk(path.join(d, e.name)) : /\.tsx?$/.test(e.name) && files.push(path.join(d, e.name)));
walk(dir);
let bad = 0;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/\bat(?:End)?\(\s*"(B\d\d)"\s*,\s*"([^"]+)"(?:\s*,\s*(\d+))?\)/g)) {
    const list = words.get(m[1]);
    const hits = list ? list.filter((w) => w === norm(m[2])).length : 0;
    if (hits <= Number(m[3] ?? 0)) { bad++; console.log(`${path.relative(dir, f)}: ${m[0]}  (block words: ${list?.join(" ")})`); }
  }
}
console.log(bad ? `${bad} broken anchors` : "all anchors resolve");
process.exit(bad ? 1 : 0);
