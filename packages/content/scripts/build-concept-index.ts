#!/usr/bin/env tsx
/**
 * Build the concept index from velite-compiled lessons.
 *
 * Reads:  packages/content/.velite/lessons.json
 * Writes: packages/content/.velite/concept-index.json
 *
 * Run:    pnpm --filter @tensorcraft/content build:concept-index
 *
 * Prerequisite: `velite build` must have been run first (turbo build:content).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildConceptIndex } from "../src/concept-index.js";
import type { Lesson } from "../src/schemas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const veliteDir = resolve(__dirname, "..", ".velite");
const lessonsPath = resolve(veliteDir, "lessons.json");
const outPath = resolve(veliteDir, "concept-index.json");

if (!existsSync(lessonsPath)) {
  console.error(
    `[build-concept-index] missing ${lessonsPath}; run \`pnpm turbo build:content\` first.`,
  );
  process.exit(1);
}

const raw = readFileSync(lessonsPath, "utf-8");
const lessons = JSON.parse(raw) as Lesson[];

const index = buildConceptIndex(lessons);

writeFileSync(outPath, JSON.stringify(index, null, 2));

console.log(
  `[build-concept-index] wrote ${outPath}\n` +
    `  lessons:  ${index.totalLessons}\n` +
    `  concepts: ${index.totalConcepts}\n` +
    `  builtAt:  ${index.builtAt}`,
);
