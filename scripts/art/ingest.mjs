#!/usr/bin/env node
/**
 * Ships approved candidates from the gitignored staging tree into
 * apps/web/public. Filenames are validated against the canonical slug lists
 * so a typo becomes an error here rather than a silent 404 in production
 * (the UI collapses missing art to a monogram, so a misnamed file would
 * never announce itself).
 *
 * Portraits: 512x512 webp, budget 40 KB.  Scenes and masters: 1536x1024
 * webp, budget 150 KB target / 200 KB hard cap. Over-cap files fail loudly.
 *
 * Usage:
 *   node scripts/art/ingest.mjs portraits   # art-src/{neutrals,expressions}
 *   node scripts/art/ingest.mjs scenes      # art-src/scenes
 *   node scripts/art/ingest.mjs masters     # art-src/masters
 *   node scripts/art/ingest.mjs patches     # art-src/patches
 *   node scripts/art/ingest.mjs seals       # art-src/seals
 *   node scripts/art/ingest.mjs og          # SHIPPED plates/seal -> OG derivatives
 *   node scripts/art/ingest.mjs portraits --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { renderAria } from "./render-aria.mjs";
import {
  readCanonicalIdentity,
  resolveIdentityReferences,
} from "./scene-identity-contract.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const require = createRequire(import.meta.url);

// sharp is a root devDependency but pnpm does not hoist it to the top-level
// node_modules; resolve it out of the store.
function loadSharp() {
  try {
    return require("sharp");
  } catch {
    const store = path.join(ROOT, "node_modules/.pnpm");
    const dir = fs.readdirSync(store).find((d) => d.startsWith("sharp@"));
    if (!dir) throw new Error("sharp not found; run pnpm install");
    return require(path.join(store, dir, "node_modules/sharp"));
  }
}
const sharp = loadSharp();

const WORLD = "deep-orbit";
const DRY = process.argv.includes("--dry-run");
const mode = process.argv[2];

const CHARACTERS = {
  "commander-mirza": ["resolved", "concerned", "approving"],
  "dr-farah": ["delighted", "absorbed", "shaken"],
  "chief-nazari": ["skeptical", "grudging-respect", "haunted"],
  "ensign-demir": ["overwhelmed", "breakthrough", "focused"],
  // ARIA is rendered from one approved ring below, keeping its geometry fixed.
};

const PORTRAIT = { size: 512, quality: 82, budget: 40 * 1024 };
// q72 rather than q80: flat cel-shaded color regions compress well, the
// visual delta is invisible at the lesson column's render width, and it keeps
// a two-scene lesson page comfortably inside a sane image budget.
const SCENE = { width: 1536, height: 1024, quality: 72, budget: 200 * 1024 };

const LOCATIONS = [
  "bridge",
  "lab",
  "engineering",
  "dashboard-station",
  // Auxiliary: the 404/error "adrift" shot; a plate, not a scene reference.
  "adrift",
];

// Same frame as a scene: the masters ARE the reference plates every scene was
// generated against (docs/scene-bible.md), so they share dimensions and
// budget. `emit()` picks its resize branch by shape: a spec with `size` is
// square, a spec with width/height is wide.
const MASTER = { width: 1536, height: 1024, quality: 72, budget: 200 * 1024 };

// Mission patches and the world seal (docs/patch-bible.md). 320px, not
// 512: the largest render is the 72px certificate seal (144px at 2x DPR),
// and stitched-texture detail compresses far worse than flat portrait
// color, so the extra pixels bought only budget overruns.
const PATCH = { size: 320, quality: 82, budget: 40 * 1024 };

/** Newest staged candidate whose name starts with `stem-fal-` / `stem-openai-`. */
function newest(dir, stem) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return null;
  const hit = fs
    .readdirSync(full)
    .filter(
      (n) => /\.png$/.test(n) && new RegExp(`^${stem}-(fal|openai)-`).test(n),
    )
    .sort()
    .pop();
  return hit ? path.join(full, hit) : null;
}

const results = { shipped: [], missing: [], overBudget: [] };

async function emit(src, destRel, spec) {
  const dest = path.join(ROOT, destRel);
  const pipeline = sharp(src);
  const resized =
    "size" in spec
      ? pipeline.resize(spec.size, spec.size, { fit: "cover" })
      : pipeline.resize(spec.width, spec.height, { fit: spec.fit ?? "cover" });
  const buf = await resized
    .webp({ quality: spec.quality, effort: spec.effort ?? 4 })
    .toBuffer();

  if (spec.expectedHash && sha256(buf) !== spec.expectedHash)
    throw new Error(
      `${destRel}: encoding differs from the reviewed WebP. Ingest aborted.`,
    );

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
    else
      await emit(
        neutral,
        `apps/web/public/characters/${WORLD}/${slug}.webp`,
        PORTRAIT,
      );

    for (const expression of expressions) {
      const src = newest("art-src/expressions", `${slug}-${expression}`);
      if (!src) {
        results.missing.push(`${slug}-${expression}`);
        continue;
      }
      await emit(
        src,
        `apps/web/public/characters/${WORLD}/${slug}-${expression}.webp`,
        PORTRAIT,
      );
    }
  }
  for (const asset of await renderAria({ dryRun: DRY })) {
    results.shipped.push(
      `apps/web/public/characters/${WORLD}/${asset.filename}  ${(asset.bytes / 1024).toFixed(1)} KB`,
    );
  }
}

/** Frontmatter defines runtime slugs, which can differ from MDX filenames. */
function lessonIds(root, world) {
  const base = path.join(root, "packages/content/content", world);
  const ids = new Map();
  for (const mod of fs.readdirSync(base, { withFileTypes: true })) {
    if (!mod.isDirectory()) continue;
    for (const file of fs.readdirSync(path.join(base, mod.name))) {
      if (!/^\d+-.+\.mdx$/.test(file)) continue;
      const filename = path.join(base, mod.name, file);
      const text = fs.readFileSync(filename, "utf8");
      const frontmatter = text.match(
        /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
      )?.[1];
      const slug = frontmatter?.match(
        /^slug:\s*["']?([a-z0-9-]+)["']?\s*$/m,
      )?.[1];
      if (!slug)
        throw new Error(
          `${path.relative(root, filename)}: missing valid frontmatter slug`,
        );
      const filenameSlug = file.match(/^\d+-(.+)\.mdx$/)[1];
      ids.set(`${mod.name}/${filenameSlug}`, `${mod.name}/${slug}`);
    }
  }
  return ids;
}

const IDENTITY_APPROVED_SCENES =
  "docs/art-refs/deep-orbit/approved-scene-art.json";
const SECTION_SUFFIXES = ["concept", "challenge", "takeaways", "epilogue"];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function splitSceneId(id) {
  const phase = SECTION_SUFFIXES.find((phase) => id.endsWith(`-${phase}`));
  return phase
    ? { lesson: id.slice(0, -phase.length - 1), suffix: `-${phase}` }
    : { lesson: id, suffix: "" };
}

/** Resolve every source before emitting, so a missing approval cannot fall
 * back to an older candidate or leave a partially ingested batch. */
export function planSceneIngest(
  root,
  { world = "deep-orbit", approvedIndex } = {},
) {
  const strictDefault = approvedIndex === undefined;
  approvedIndex ??= IDENTITY_APPROVED_SCENES;
  const runtimeIds = lessonIds(root, world);
  const validLessons = new Set(runtimeIds.values());
  const runtimeSceneId = (id) => {
    const { lesson, suffix } = splitSceneId(id);
    return `${runtimeIds.get(lesson) ?? lesson}${suffix}`;
  };
  const validScene = (id) => validLessons.has(splitSceneId(id).lesson);
  const destination = (id) => `apps/web/public/scenes/${world}/${id}.webp`;
  const sources = new Map();
  const missing = [];
  const approvedFile = path.join(root, approvedIndex);
  if (strictDefault && !fs.existsSync(approvedFile))
    throw new Error(
      "Missing strict scene approval registry. Scene ingest aborted.",
    );

  if (fs.existsSync(approvedFile)) {
    const approved = JSON.parse(fs.readFileSync(approvedFile, "utf8"));
    if (strictDefault && approved.identityReviewRequired !== true)
      throw new Error(
        "Strict scene registry must require character identity review.",
      );
    if (!Array.isArray(approved.scenes))
      throw new Error(`${approvedIndex}: expected a scenes array`);
    const canonical = approved.identityReviewRequired
      ? readCanonicalIdentity(root)
      : undefined;
    for (const scene of approved.scenes) {
      if (typeof scene.id !== "string" || !validScene(scene.id))
        throw new Error(
          `${approvedIndex}: '${scene.id}' matches no runtime lesson slug`,
        );
      if (sources.has(scene.id))
        throw new Error(
          `${approvedIndex}: duplicate approved scene '${scene.id}'`,
        );
      if (scene.destination !== destination(scene.id))
        throw new Error(
          `${approvedIndex}: invalid destination for '${scene.id}'`,
        );
      if (
        typeof scene.source !== "string" ||
        path.isAbsolute(scene.source) ||
        !scene.source.endsWith(".png") ||
        !path
          .resolve(root, scene.source)
          .startsWith(path.resolve(root) + path.sep)
      )
        throw new Error(`${approvedIndex}: invalid source for '${scene.id}'`);
      const source = path.resolve(root, scene.source);
      if (!fs.existsSync(source) || !fs.statSync(source).isFile())
        throw new Error(
          `Approved scene '${scene.id}' is missing source '${scene.source}'. Scene ingest aborted.`,
        );
      if (approved.identityReviewRequired) {
        if (scene.identityStatus !== "approved")
          throw new Error(`${scene.id}: missing character identity approval`);
        resolveIdentityReferences(root, scene, canonical);
        if (
          !/^[a-f0-9]{64}$/.test(scene.sourceSha256 ?? "") ||
          sha256(fs.readFileSync(source)) !== scene.sourceSha256
        )
          throw new Error(
            `${scene.id}: source differs from the reviewed image`,
          );
        if (
          !/^[a-f0-9]{64}$/.test(scene.webpSha256 ?? "") ||
          !Number.isInteger(scene.webpQuality) ||
          scene.webpQuality < 1 ||
          scene.webpQuality > 100 ||
          !Number.isInteger(scene.webpEffort) ||
          scene.webpEffort < 0 ||
          scene.webpEffort > 6 ||
          !["cover", "fill", "contain"].includes(scene.resizeFit)
        )
          throw new Error(`${scene.id}: missing reviewed WebP encoding`);
      }
      sources.set(scene.id, {
        id: scene.id,
        source,
        destination: scene.destination,
        approved: true,
        ...(approved.identityReviewRequired
          ? {
              spec: {
                ...SCENE,
                quality: scene.webpQuality,
                effort: scene.webpEffort,
                fit: scene.resizeFit,
                expectedHash: scene.webpSha256,
              },
            }
          : {}),
      });
    }
    // A candidate with an unreviewed face must never be selected by date.
    if (approved.identityReviewRequired)
      return { sources: [...sources.values()], missing };
  }

  const staged = path.join(root, "art-src/scenes");
  if (!fs.existsSync(staged)) {
    if (!sources.size) missing.push("art-src/scenes (no staged scene art yet)");
    return { sources: [...sources.values()], missing };
  }

  // Keep the historical filename ordering only for scenes without approval.
  // A rejected or newer candidate can never replace an indexed winner.
  const approvedSources = new Set(
    [...sources.values()]
      .filter((scene) => scene.approved)
      .map((scene) => scene.source),
  );
  const knownStems = new Map();
  for (const [filenameId, runtimeId] of runtimeIds) {
    for (const id of [filenameId, runtimeId]) {
      knownStems.set(id.replace("/", "__"), runtimeId);
      for (const phase of SECTION_SUFFIXES)
        knownStems.set(
          `${id.replace("/", "__")}-${phase}`,
          `${runtimeId}-${phase}`,
        );
    }
  }
  // Longest first keeps an unindexed epilogue separate from an approved
  // briefing whose filename is its prefix.
  const stems = [...knownStems].sort(([a], [b]) => b.length - a.length);
  for (const file of fs.readdirSync(staged).sort()) {
    if (!file.endsWith(".png")) continue;
    if (approvedSources.has(path.join(staged, file))) continue;
    const indexedId = stems.find(([stem]) => file.startsWith(`${stem}-`))?.[1];
    if (indexedId && sources.get(indexedId)?.approved) continue;
    const match = file.match(/^(.+)-(?:fal|openai)-.+\.png$/);
    const id = match?.[1]
      ? runtimeSceneId(match[1].replace("__", "/"))
      : undefined;
    if (!id || !validScene(id)) {
      missing.push(`${file}: '${id ?? file}' matches no runtime lesson slug`);
      continue;
    }
    if (sources.get(id)?.approved) continue;
    sources.set(id, {
      id,
      source: path.join(staged, file),
      destination: destination(id),
      approved: false,
    });
  }
  return { sources: [...sources.values()], missing };
}

async function scenes() {
  const plan = planSceneIngest(ROOT);
  results.missing.push(...plan.missing);
  for (const scene of plan.sources)
    await emit(scene.source, scene.destination, scene.spec ?? SCENE);
}

/** Location master plates, reused as marketing / world-page art. Unlike
    portraits and scenes these went through a human approval gate, so the
    caller is responsible for making the newest staged file BE the approved
    one: `newest()` picks by name sort and knows nothing about approval. */
async function masters() {
  for (const location of LOCATIONS) {
    const src = newest("art-src/masters", location);
    if (!src) {
      results.missing.push(`${location} (master plate)`);
      continue;
    }
    await emit(
      src,
      `apps/web/public/locations/${WORLD}/${location}.webp`,
      MASTER,
    );
  }
}

/** Module mission patches (docs/patch-bible.md). Slugs are validated
    against the module directories in the content tree, the same defence
    scenes() applies with lesson ids. */
async function patches() {
  const base = path.join(ROOT, "packages/content/content", WORLD);
  const moduleDirs = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  for (const mod of moduleDirs) {
    const src = newest("art-src/patches", mod);
    if (!src) {
      results.missing.push(`${mod} (patch)`);
      continue;
    }
    await emit(src, `apps/web/public/patches/${WORLD}/${mod}.webp`, PATCH);
  }
}

/** The world-completion seal (docs/patch-bible.md). */
async function seals() {
  const src = newest("art-src/seals", WORLD);
  if (!src) {
    results.missing.push(`${WORLD} (seal)`);
    return;
  }
  await emit(src, `apps/web/public/seals/${WORLD}.webp`, PATCH);
}

/** OG derivatives, read from SHIPPED assets (shipped means approved), not
    art-src. Plates re-emit as centre cover-cropped JPEG and the seal as PNG
    because the /api/og edge route renders through satori, whose raster
    decoding does not dependably include WebP. */
const OG_PLATE = { width: 1200, height: 630, quality: 70, budget: 150 * 1024 };
const OG_SEAL = { size: 256, budget: 60 * 1024 };

// Only the plate the /api/og route consumes: OG_PLATE in
// apps/web/app/api/og/og-assets.ts maps deep-orbit to bridge. Looping every
// LOCATION shipped three JPEGs nothing loaded (removed 2026-09-04); keep this
// list in step with OG_PLATE.
const OG_LOCATIONS = ["bridge"];

async function og() {
  const locDir = path.join(ROOT, "apps/web/public/locations", WORLD);
  for (const location of OG_LOCATIONS) {
    const src = path.join(locDir, `${location}.webp`);
    if (!fs.existsSync(src)) {
      results.missing.push(`${location}.webp (shipped plate)`);
      continue;
    }
    const buf = await sharp(src)
      .resize(OG_PLATE.width, OG_PLATE.height, { fit: "cover" })
      .jpeg({ quality: OG_PLATE.quality })
      .toBuffer();
    const destRel = `apps/web/public/og/${WORLD}/${location}.jpg`;
    if (buf.length > OG_PLATE.budget) {
      results.overBudget.push(
        `${destRel} is ${(buf.length / 1024).toFixed(1)} KB, cap ${OG_PLATE.budget / 1024} KB`,
      );
      continue;
    }
    if (!DRY) {
      fs.mkdirSync(path.dirname(path.join(ROOT, destRel)), { recursive: true });
      fs.writeFileSync(path.join(ROOT, destRel), buf);
    }
    results.shipped.push(`${destRel}  ${(buf.length / 1024).toFixed(1)} KB`);
  }

  const seal = path.join(ROOT, "apps/web/public/seals", `${WORLD}.webp`);
  if (!fs.existsSync(seal)) {
    results.missing.push(`${WORLD}.webp (shipped seal)`);
  } else {
    // JPEG, not PNG: the seal has no alpha (its field is dark fabric), and
    // PNG-encoding stitched texture tripled the byte cost.
    const buf = await sharp(seal)
      .resize(OG_SEAL.size, OG_SEAL.size, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
    const destRel = `apps/web/public/og/${WORLD}/seal.jpg`;
    if (buf.length > OG_SEAL.budget) {
      results.overBudget.push(
        `${destRel} is ${(buf.length / 1024).toFixed(1)} KB, cap ${OG_SEAL.budget / 1024} KB`,
      );
    } else {
      if (!DRY) {
        fs.mkdirSync(path.dirname(path.join(ROOT, destRel)), {
          recursive: true,
        });
        fs.writeFileSync(path.join(ROOT, destRel), buf);
      }
      results.shipped.push(`${destRel}  ${(buf.length / 1024).toFixed(1)} KB`);
    }
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (mode === "portraits") await portraits();
  else if (mode === "scenes") await scenes();
  else if (mode === "masters") await masters();
  else if (mode === "patches") await patches();
  else if (mode === "seals") await seals();
  else if (mode === "og") await og();
  else {
    console.error(
      "usage: ingest.mjs portraits|scenes|masters|patches|seals|og [--dry-run]",
    );
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
}
