#!/usr/bin/env node
/** Build every ARIA state from one approved ring and a vector trace. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const require = createRequire(import.meta.url);

function loadSharp() {
  try {
    return require("sharp");
  } catch {
    const store = path.join(ROOT, "node_modules/.pnpm");
    const directory = fs
      .readdirSync(store)
      .find((name) => name.startsWith("sharp@"));
    if (!directory) throw new Error("sharp not found; run pnpm install");
    return require(path.join(store, directory, "node_modules/sharp"));
  }
}

const TRACES = {
  neutral:
    "M148 256 H181 C188 256 188 245 194 245 S201 267 207 267 S215 229 222 229 S233 283 241 283 S251 237 259 237 S270 274 278 274 S286 246 293 246 S301 256 308 256 H364",
  emphasis: "M148 256 H231 L240 266 L252 198 L264 304 L276 245 L285 256 H364",
  deadpan: "M148 256 H364",
  alarm:
    "M148 256 L160 256 L167 236 L174 277 L181 220 L188 288 L195 235 L202 267 L209 211 L216 298 L223 228 L230 279 L237 203 L244 304 L251 232 L258 283 L265 215 L272 296 L279 225 L286 279 L293 210 L300 294 L307 235 L314 273 L321 222 L328 287 L335 241 L342 267 L349 256 H364",
};

export async function renderAria({ dryRun = false } = {}) {
  const sharp = loadSharp();
  const ring = path.join(ROOT, "docs/art-refs/deep-orbit/aria-ring.png");
  const output = path.join(ROOT, "apps/web/public/characters/deep-orbit");
  const results = [];
  for (const [state, trace] of Object.entries(TRACES)) {
    const overlay = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><path d="${trace}" fill="none" stroke="#6BAA8A" stroke-opacity="0.2" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="${trace}" fill="none" stroke="#A9DEC4" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    );
    const bytes = await sharp(ring)
      .resize(512, 512)
      .composite([{ input: overlay }])
      .webp({ quality: 82 })
      .toBuffer();
    if (bytes.length > 40 * 1024)
      throw new Error(`ARIA ${state} exceeds 40 KB`);
    const filename = state === "neutral" ? "aria.webp" : `aria-${state}.webp`;
    if (!dryRun) {
      fs.mkdirSync(output, { recursive: true });
      fs.writeFileSync(path.join(output, filename), bytes);
    }
    results.push({ filename, bytes: bytes.length });
  }
  return results;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  for (const result of await renderAria({
    dryRun: process.argv.includes("--dry-run"),
  })) {
    console.log(`${result.filename} ${(result.bytes / 1024).toFixed(1)} KB`);
  }
}
