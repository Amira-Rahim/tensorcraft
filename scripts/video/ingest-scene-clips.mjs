#!/usr/bin/env node
/**
 * Scene-clip ingest (owner ruling 2026-09-04: launch ships with video).
 *
 * Takes raw Flow exports and produces launch-ready clips plus the
 * manifest entry that approves them (the Briefing renders a clip ONLY
 * when it is in apps/web/lib/scene-clips.manifest.ts; everything else
 * falls back to the text reveal).
 *
 * Per file: validates the key against the launched lesson content,
 * strips audio (trailer doctrine: the film is silent), normalizes to
 * EXACTLY 10.0s (short takes hold their last frame, long takes trim),
 * re-encodes h264 720p yuv420p faststart, enforces the size budget, and
 * rewrites the manifest.
 *
 * Naming: raw files are `<module>__<lesson>.mp4` (mirroring the
 * art-src/scenes convention), with `-epilogue` allowed on the seven
 * epilogue lessons, e.g. `foundations__introduction-to-tensors.mp4`,
 * `foundations__normalization-epilogue.mp4`.
 *
 * Usage:
 *   node scripts/video/ingest-scene-clips.mjs [--base-url URL] \
 *     [--publish-local] <file.mp4> [more.mp4 ...]
 *
 *   --base-url        URL prefix written into the manifest (default
 *                     /media/scenes/deep-orbit; point it at Blob/R2 once
 *                     hosting is set up and re-run to rewrite URLs).
 *   --publish-local   also copy normalized files into
 *                     apps/web/public/media/scenes/deep-orbit/ so the
 *                     default base-url serves in dev. Committing video
 *                     into public/ is a stopgap; the backlog item moving
 *                     the trailer mp4s to Blob covers these too.
 *
 * Output: art-src/scene-clips/normalized/<module>__<lesson>.mp4 and the
 * updated manifest. Review the normalized clip BEFORE committing the
 * manifest change: the manifest IS the approval.
 */

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname;
const CONTENT = join(ROOT, "packages/content/content/deep-orbit");
const NORMALIZED = join(ROOT, "art-src/scene-clips/normalized");
const MANIFEST = join(ROOT, "apps/web/lib/scene-clips.manifest.ts");
const POSTERS = join(ROOT, "apps/web/public/scenes/deep-orbit");
const LOCAL_MEDIA = join(ROOT, "apps/web/public/media/scenes/deep-orbit");

const TARGET_SECONDS = 10;
const WARN_BYTES = 4 * 1024 * 1024;
const HARD_CAP_BYTES = 6 * 1024 * 1024;

// The seven epilogues with their own staging (scene bible `-epilogue`).
const EPILOGUE_LESSONS = new Set([
  "foundations__normalization",
  "neural-networks__first-neuron",
  "training-loop__loss-functions",
  "recurrent-networks__sequence-prediction",
  "anomaly-detection__reconstruction-error",
  "llm-integration__rag-for-signals",
  "capstone__launch",
]);

const args = process.argv.slice(2);
const baseUrlIdx = args.indexOf("--base-url");
const BASE_URL =
  baseUrlIdx !== -1 ? args[baseUrlIdx + 1] : "/media/scenes/deep-orbit";
const PUBLISH_LOCAL = args.includes("--publish-local");
const files = args.filter(
  (a, i) => !a.startsWith("--") && (baseUrlIdx === -1 || i !== baseUrlIdx + 1),
);

if (files.length === 0) {
  console.error("No input files. See the header for usage.");
  process.exit(1);
}

/** module dir -> Set of runtime lesson slugs (NN- prefix stripped). */
const lessonsByModule = new Map();
for (const mod of readdirSync(CONTENT, { withFileTypes: true })) {
  if (!mod.isDirectory()) continue;
  const slugs = new Set(
    readdirSync(join(CONTENT, mod.name))
      .filter((f) => /^\d+-.*\.mdx$/.test(f))
      .map((f) => f.replace(/^\d+-/, "").replace(/\.mdx$/, "")),
  );
  lessonsByModule.set(mod.name, slugs);
}

function parseKey(file) {
  const name = basename(file).replace(/\.(mp4|mov|webm)$/i, "");
  const epilogue = name.endsWith("-epilogue");
  const stem = epilogue ? name.slice(0, -"-epilogue".length) : name;
  const sep = stem.indexOf("__");
  if (sep === -1) {
    throw new Error(
      `${basename(file)}: expected <module>__<lesson>[-epilogue].mp4`,
    );
  }
  const moduleSlug = stem.slice(0, sep);
  const lessonSlug = stem.slice(sep + 2);
  const slugs = lessonsByModule.get(moduleSlug);
  if (!slugs)
    throw new Error(`${basename(file)}: unknown module "${moduleSlug}"`);
  if (!slugs.has(lessonSlug)) {
    throw new Error(
      `${basename(file)}: no lesson "${lessonSlug}" in ${moduleSlug}`,
    );
  }
  if (epilogue && !EPILOGUE_LESSONS.has(`${moduleSlug}__${lessonSlug}`)) {
    throw new Error(
      `${basename(file)}: ${moduleSlug}/${lessonSlug} has no distinct-location epilogue (scene bible)`,
    );
  }
  return { moduleSlug, lessonSlug, epilogue, stem: name };
}

function probeSeconds(file) {
  const out = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      file,
    ],
    { encoding: "utf8" },
  );
  return Number(out.trim());
}

mkdirSync(NORMALIZED, { recursive: true });

const manifest = {};
// Re-read the existing manifest so re-ingesting one clip keeps the rest.
try {
  const mod = await import(MANIFEST + `?t=${process.hrtime.bigint()}`);
  Object.assign(manifest, mod.SCENE_CLIPS ?? {});
} catch {
  // First run, or the manifest is mid-edit: start from the inputs alone.
}

let failed = false;
for (const file of files) {
  try {
    const { moduleSlug, lessonSlug, epilogue, stem } = parseKey(file);
    const key = `deep-orbit/${moduleSlug}/${lessonSlug}${epilogue ? "-epilogue" : ""}`;
    const seconds = probeSeconds(file);
    const out = join(NORMALIZED, `${stem}.mp4`);

    // Hold the last frame out to 10.0s, or trim down to it. tpad's clone
    // stop-mode freezes the final frame; -t bounds long takes.
    const filters = [
      `scale=1280:-2`,
      `tpad=stop_mode=clone:stop_duration=${TARGET_SECONDS}`,
    ];
    execFileSync("ffmpeg", [
      "-loglevel",
      "error",
      "-y",
      "-i",
      file,
      "-an",
      "-vf",
      filters.join(","),
      "-t",
      String(TARGET_SECONDS),
      "-c:v",
      "libx264",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      out,
    ]);

    const bytes = statSync(out).size;
    if (bytes > HARD_CAP_BYTES) {
      throw new Error(
        `${stem}: ${(bytes / 1e6).toFixed(1)}MB exceeds the ${HARD_CAP_BYTES / 1e6}MB cap; re-export or raise CRF`,
      );
    }
    if (bytes > WARN_BYTES) {
      console.warn(
        `WARN ${stem}: ${(bytes / 1e6).toFixed(1)}MB (budget ${WARN_BYTES / 1e6}MB)`,
      );
    }

    const poster = join(
      POSTERS,
      moduleSlug,
      `${lessonSlug}${epilogue ? "-epilogue" : ""}.webp`,
    );
    if (!existsSync(poster)) {
      console.warn(
        `WARN ${stem}: no poster still at ${poster}; the player falls back to a black poster`,
      );
    }

    if (PUBLISH_LOCAL) {
      const dest = join(
        LOCAL_MEDIA,
        moduleSlug,
        `${lessonSlug}${epilogue ? "-epilogue" : ""}.mp4`,
      );
      mkdirSync(join(LOCAL_MEDIA, moduleSlug), { recursive: true });
      copyFileSync(out, dest);
    }

    manifest[key] = {
      url: `${BASE_URL}/${moduleSlug}/${lessonSlug}${epilogue ? "-epilogue" : ""}.mp4`,
      durationMs: TARGET_SECONDS * 1000,
      bytes,
      ingestedAt: new Date().toISOString().slice(0, 10),
    };
    console.log(
      `OK ${key} (${seconds.toFixed(1)}s raw -> 10.0s, ${(bytes / 1e6).toFixed(1)}MB)`,
    );
  } catch (err) {
    failed = true;
    console.error(`FAIL ${basename(file)}: ${err.message}`);
  }
}

const entries = Object.keys(manifest)
  .sort()
  .map(
    (key) =>
      `  ${JSON.stringify(key)}: ${JSON.stringify(manifest[key], null, 4).replace(/\n/g, "\n  ")},`,
  )
  .join("\n");

writeFileSync(
  MANIFEST,
  `/**
 * GENERATED FILE - edit via \`node scripts/video/ingest-scene-clips.mjs\`.
 *
 * The approval gate for lesson scene clips (owner ruling 2026-09-04:
 * launch ships with video). A Briefing renders its clip ONLY when its
 * key is listed here; everything else falls back to the text reveal and
 * the still art, so partial generation stays shippable. Keys are
 * \`<world>/<module>/<lesson>\` with a \`-epilogue\` suffix for the seven
 * epilogue clips, mirroring the scene-still convention.
 */

export interface SceneClipEntry {
  /** Absolute or site-relative URL of the normalized, silent 10s mp4. */
  url: string;
  durationMs: number;
  bytes: number;
  ingestedAt: string;
}

export const SCENE_CLIPS: Record<string, SceneClipEntry> = {
${entries}
};
`,
);
console.log(
  `Manifest: ${Object.keys(manifest).length} clip(s). Review the normalized files in art-src/scene-clips/normalized BEFORE committing.`,
);
if (failed) process.exit(1);
