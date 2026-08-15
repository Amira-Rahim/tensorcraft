#!/usr/bin/env node
/**
 * Mission-patch driver: eleven module emblems plus the world-completion
 * seal for Deep Orbit (docs/patch-bible.md, the canon these prompts mirror).
 * Follows masters.mjs: shells out to generate.mjs per candidate, staging to
 * art-src/patches/ (or art-src/seals/ for the seal). Winners ship via
 * `node scripts/art/ingest.mjs patches` / `... seals`.
 *
 * Usage:
 *   node scripts/art/patches.mjs                       # all 11 patches
 *   node scripts/art/patches.mjs foundations capstone  # a subset
 *   node scripts/art/patches.mjs seal                  # the world seal
 *   node scripts/art/patches.mjs --count 3 foundations
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Shared patch style token (docs/patch-bible.md). No text: generated
    lettering artifacts, so the UI supplies module number and name. */
const TOKEN =
  " embroidered space-mission patch on a near-black field, circular warm " +
  "brass #A89060 border ring, flat cel-shaded fill with bold clean " +
  "linework, green #6BAA8A glow accents, single central emblem, stitched " +
  "texture suggestion, cohesive series look, not photorealistic, " +
  "absolutely no text, lettering, numerals, letters or logos anywhere.";

/** One emblem per module, subject drawn from the module's title. */
const PATCHES = {
  foundations:
    "a luminous wireframe cube of stacked data planes held in a gloved hand,",
  "neural-networks":
    "a layered lattice of glowing nodes converging to a single bright output star,",
  "training-loop":
    "a descending orbital spiral tightening toward a glowing minimum point,",
  "browser-runtimes":
    "a browser window frame with a small starship engine glowing inside it,",
  "signal-processing":
    "a clean sine wave passing through a prism and emerging as sharp pulses,",
  "recurrent-networks":
    "an ouroboros loop of signal arrows around a small memory core,",
  "anomaly-detection":
    "one jagged spike breaking a calm telemetry line inside a crosshair ring,",
  "advanced-time-series":
    "three forecast trajectories fanning out from a comet's path,",
  "llm-integration":
    "a speech-bubble constellation linked by circuit traces to a ship antenna,",
  "optimization-edge":
    "a compact satellite shedding excess panels, streamlined for descent,",
  capstone:
    "a fully deployed deep-space dish antenna over a cleared orbital field,",
};

/** The world seal is heavier and more formal than a mission patch. */
const SEAL_PROMPT =
  "a world-completion crest for the same series: a brass laurel of three " +
  "concentric orbital rings around a small keystone star, radial symmetry, " +
  "formal and austere,";

const argv = process.argv.slice(2);
let count = "1";
const names = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--count") count = argv[++i];
  else names.push(argv[i]);
}
const targets = names.length ? names : Object.keys(PATCHES);

for (const name of targets) {
  const isSeal = name === "seal";
  const prompt = isSeal ? SEAL_PROMPT : PATCHES[name];
  if (!prompt) {
    console.error(`unknown patch '${name}'`);
    process.exitCode = 1;
    continue;
  }
  for (let n = 1; n <= Number(count); n++) {
    const args = [
      "scripts/art/generate.mjs",
      "--provider", "fal",
      "--phase", isSeal ? "seals" : "patches",
      "--id", isSeal ? "deep-orbit" : name,
      "--count", "1",
      "--size", "1024x1024",
      "--prompt", prompt + TOKEN,
    ];
    process.stdout.write(`${name} ${n}/${count}: `);
    try {
      const out = execFileSync("node", args, { cwd: ROOT, encoding: "utf8" });
      process.stdout.write(out.trim().split("\n").pop().trim() + "\n");
    } catch (err) {
      process.stdout.write(`FAILED ${(err.stderr || "").trim().slice(0, 140)}\n`);
      process.exitCode = 1;
    }
  }
}
