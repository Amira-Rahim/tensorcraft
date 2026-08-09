#!/usr/bin/env node
/**
 * Ships approved candidates from the gitignored staging tree into
 * apps/web/public. Filenames are validated against the canonical slug lists
 * so a typo becomes an error here rather than a silent 404 in production
 * (the UI collapses missing art to a monogram, so a misnamed file would
 * never announce itself).
 *
 * Portraits: 512x512 webp, budget 40 KB.  Scenes: 1536x1024 webp, budget
 * 150 KB target / 200 KB hard cap. Over-cap files fail loudly.
 *
 * Usage:
 *   node scripts/art/ingest.mjs portraits   # art-src/{neutrals,expressions}
 *   node scripts/art/ingest.mjs scenes      # art-src/scenes
 *   node scripts/art/ingest.mjs portraits --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);

// sharp is a root devDependency but pnpm does not hoist it to the top-level
// node_modules; resolve it out of the store.
function loadSharp() {
  try {
    return require("sharp");
  } catch {
    const store = path.join(ROOT, "node_modules/.pnpm");
    const dir = fs
      .readdirSync(store)
      .find((d) => d.startsWith("sharp@"));
    if (!dir) throw new Error("sharp not found; run pnpm install");
    return require(path.join(store, dir, "node_modules/sharp"));
  }
}
const sharp = loadSharp();

const THEME = "deep-orbit";
const DRY = process.argv.includes("--dry-run");
const mode = process.argv[2];

const CHARACTERS = {
  "commander-mirza": ["resolved", "concerned", "approving"],
  "dr-farah": ["delighted", "absorbed", "shaken"],
  "chief-nazari": ["skeptical", "grudging-respect", "haunted"],
  "ensign-demir": ["overwhelmed", "breakthrough", "focused"],
};

const PORTRAIT = { size: 512, quality: 82, budget: 40 * 1024 };
// q72 rather than q80: flat cel-shaded color regions compress well, the
// visual delta is invisible at the lesson column's render width, and it keeps
// a two-scene lesson page comfortably inside a sane image budget.
const SCENE = { width: 1536, height: 1024, quality: 72, budget: 200 * 1024 };

/** Newest staged candidate whose name starts with `stem-fal-` / `stem-openai-`. */
function newest(dir, stem) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return null;
  const hit = fs
    .readdirSync(full)
    .filter((n) => /\.png$/.test(n) && new RegExp(`^${stem}-(fal|openai)-`).test(n))
    .sort()
    .pop();
  return hit ? path.join(full, hit) : null;
}

const results = { shipped: [], missing: [], overBudget: [] };

async function emit(src, destRel, spec) {
  const dest = path.join(ROOT, destRel);
  const pipeline = sharp(src);
  const resized =
    spec === PORTRAIT
      ? pipeline.resize(spec.size, spec.size, { fit: "cover" })
      : pipeline.resize(spec.width, spec.height, { fit: "cover" });
  const buf = await resized.webp({ quality: spec.quality }).toBuffer();

  if (buf.length > spec.budget) {
    results.overBudget.push(
      `${destRel} is ${(buf.length / 1024).toFixed(1)} KB, cap ${spec.budget / 1024} KB`,
    );
    return;
  }
  if (!DRY) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
  }
  results.shipped.push(`${destRel}  ${(buf.length / 1024).toFixed(1)} KB`);
}

async function portraits() {
  for (const [slug, expressions] of Object.entries(CHARACTERS)) {
    const neutral = newest("art-src/neutrals", slug);
    if (!neutral) results.missing.push(`${slug} (neutral)`);
    else await emit(neutral, `apps/web/public/characters/${THEME}/${slug}.webp`, PORTRAIT);

    for (const expression of expressions) {
      const src = newest("art-src/expressions", `${slug}-${expression}`);
      if (!src) {
        results.missing.push(`${slug}-${expression}`);
        continue;
      }
      await emit(
        src,
        `apps/web/public/characters/${THEME}/${slug}-${expression}.webp`,
        PORTRAIT,
      );
    }
  }
}

/** Lesson slugs are globbed from the content tree, so a scene file can only
    ship under a name some lesson actually resolves at runtime. */
function lessonIds() {
  const base = path.join(ROOT, "packages/content/content", THEME);
  const ids = [];
  for (const mod of fs.readdirSync(base, { withFileTypes: true })) {
    if (!mod.isDirectory()) continue;
    for (const file of fs.readdirSync(path.join(base, mod.name))) {
      const m = file.match(/^\d+-(.+)\.mdx$/);
      if (m) ids.push(`${mod.name}/${m[1]}`);
    }
  }
  return ids;
}

async function scenes() {
  const valid = new Set(lessonIds());
  const dir = path.join(ROOT, "art-src/scenes");
  if (!fs.existsSync(dir)) {
    results.missing.push("art-src/scenes (no staged scene art yet)");
    return;
  }
  for (const file of fs.readdirSync(dir).filter((n) => n.endsWith(".png"))) {
    // Staged as <module>__<lesson>[-epilogue]-<provider>-<stamp>.png
    const stem = file.replace(/-(fal|openai)-.*$/, "");
    const isEpilogue = stem.endsWith("-epilogue");
    const id = (isEpilogue ? stem.slice(0, -"-epilogue".length) : stem).replace("__", "/");
    if (!valid.has(id)) {
      results.missing.push(`${file}: '${id}' matches no lesson`);
      continue;
    }
    const [mod, lesson] = id.split("/");
    const name = isEpilogue ? `${lesson}-epilogue` : lesson;
    await emit(
      path.join(dir, file),
      `apps/web/public/scenes/${THEME}/${mod}/${name}.webp`,
      SCENE,
    );
  }
}

if (mode === "portraits") await portraits();
else if (mode === "scenes") await scenes();
else {
  console.error("usage: ingest.mjs portraits|scenes [--dry-run]");
  process.exit(1);
}

console.log(`${DRY ? "[dry run] " : ""}shipped ${results.shipped.length}:`);
for (const line of results.shipped) console.log(`  ${line}`);
if (results.missing.length) {
  console.log(`\nmissing ${results.missing.length}:`);
  for (const line of results.missing) console.log(`  ${line}`);
}
if (results.overBudget.length) {
  console.error(`\nOVER BUDGET ${results.overBudget.length}:`);
  for (const line of results.overBudget) console.error(`  ${line}`);
  process.exit(1);
}
