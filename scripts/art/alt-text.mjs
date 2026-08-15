#!/usr/bin/env node
/**
 * Writes each scene's authored alt text from docs/scene-bible.md into the
 * lesson's frontmatter as `scene.portraitAlt` / `scene.epiloguePortraitAlt`,
 * which is where `ScenePortrait` reads it (velite schema in
 * packages/content/velite.config.ts).
 *
 * Without this the portraits render decorative (alt=""), which is valid but
 * silent: the slugline announces the location, not what the shot depicts.
 *
 * Usage:
 *   node scripts/art/alt-text.mjs --dry-run
 *   node scripts/art/alt-text.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const CONTENT = path.join(ROOT, "packages/content/content/deep-orbit");
const DRY = process.argv.includes("--dry-run");

/** id -> alt, parsed out of the bible's entry blocks. */
function bibleAlts() {
  const src = fs.readFileSync(path.join(ROOT, "docs/scene-bible.md"), "utf8");
  const alts = new Map();
  for (const block of src.split(/^#### /m).slice(1)) {
    const id = block.split("\n")[0].trim();
    if (id.startsWith("<")) continue;
    const alt = block.match(/^- Alt:\s*(.+)$/m)?.[1]?.trim();
    if (alt) alts.set(id, alt);
  }
  return alts;
}

/** Lesson file for a `<module>/<slug>` id, matching the NN- prefixed name. */
function lessonFile(id) {
  const [mod, slug] = id.split("/");
  const dir = path.join(CONTENT, mod);
  if (!fs.existsSync(dir)) return null;
  const hit = fs
    .readdirSync(dir)
    .find((f) => f.match(/^\d+-(.+)\.mdx$/)?.[1] === slug);
  return hit ? path.join(dir, hit) : null;
}

/** YAML-safe double-quoted scalar. */
const quote = (s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

const alts = bibleAlts();
const changed = [];
const skipped = [];

for (const [id, alt] of alts) {
  const isEpilogue = id.endsWith("-epilogue");
  const lessonId = isEpilogue ? id.slice(0, -"-epilogue".length) : id;
  const key = isEpilogue ? "epiloguePortraitAlt" : "portraitAlt";

  const file = lessonFile(lessonId);
  if (!file) {
    skipped.push(`${id}: no lesson file`);
    continue;
  }
  const src = fs.readFileSync(file, "utf8");

  // The scene block is frontmatter-only; bail rather than guess if absent.
  const sceneBlock = src.match(/^scene:\n((?:[ \t]+.*\n)+)/m);
  if (!sceneBlock) {
    skipped.push(`${id}: no scene: block`);
    continue;
  }
  if (new RegExp(`^[ \\t]+${key}:`, "m").test(sceneBlock[1])) {
    skipped.push(`${id}: ${key} already set`);
    continue;
  }

  // Append inside the scene block, preserving its indentation.
  const indent = sceneBlock[1].match(/^([ \t]+)/)?.[1] ?? "  ";
  const updated = src.replace(
    sceneBlock[0],
    sceneBlock[0] + `${indent}${key}: ${quote(alt)}\n`,
  );
  if (!DRY) fs.writeFileSync(file, updated);
  changed.push(`${path.relative(ROOT, file)}  ${key}`);
}

console.log(`${DRY ? "[dry run] " : ""}wrote ${changed.length} alt values`);
for (const line of changed) console.log(`  ${line}`);
if (skipped.length) {
  console.log(`\nskipped ${skipped.length}:`);
  for (const line of skipped) console.log(`  ${line}`);
}
