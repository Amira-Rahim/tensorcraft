import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readCanonicalIdentity,
  resolveIdentityReferences,
} from "./scene-identity-contract.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const PHASES = [
  "briefing",
  "concept",
  "challenge",
  "takeaways",
  "epilogue",
];

/** File checks catch duplicates and missing uploads. Visual review still gates anatomy and composition. */
export function scenePhaseCoverage(
  root = REPO_ROOT,
  { requireSources = false } = {},
) {
  const content = join(root, "packages/content/content/deep-orbit");
  const manifest = JSON.parse(
    readFileSync(
      join(root, "apps/web/lib/lesson-scene-art.manifest.json"),
      "utf8",
    ),
  );
  const rows = [];
  const errors = [];
  const hashes = new Map();
  const approvalPath = join(
    root,
    "docs/art-refs/deep-orbit/approved-scene-art.json",
  );
  const approval = existsSync(approvalPath)
    ? JSON.parse(readFileSync(approvalPath, "utf8"))
    : { scenes: [] };
  const approved = new Map(
    approval.scenes.map((scene) => [scene.destination, scene]),
  );
  if (!existsSync(approvalPath))
    errors.push("Missing strict scene approval registry");
  if (approval.identityReviewRequired !== true)
    errors.push("Scene registry must require character identity review");
  let canonical;
  if (approval.identityReviewRequired) {
    try {
      canonical = readCanonicalIdentity(root);
    } catch (error) {
      errors.push(error.message);
    }
  }
  for (const module of readdirSync(content, { withFileTypes: true })) {
    if (!module.isDirectory()) continue;
    for (const file of readdirSync(join(content, module.name))) {
      if (!file.endsWith(".mdx")) continue;
      const source = readFileSync(join(content, module.name, file), "utf8");
      const slug = source.match(/^slug:\s*["']?([a-z0-9-]+)["']?\s*$/m)?.[1];
      if (!slug) throw new Error(`Missing slug in ${module.name}/${file}`);
      const key = `deep-orbit/${module.name}/${slug}`;
      const entries = manifest[key] ?? {};
      const phases = {};
      for (const phase of PHASES) {
        const art = entries[phase];
        if (!art) {
          phases[phase] = {
            status: phase === "takeaways" ? "missing" : "reuses-briefing",
            src: phase === "takeaways" ? null : (entries.briefing?.src ?? null),
          };
          continue;
        }
        const path = join(root, "apps/web/public", art.src);
        const expected = `/scenes/${key}${phase === "briefing" ? "" : `-${phase}`}.webp`;
        if (art.src !== expected)
          errors.push(`${key}/${phase}: asset path must belong to this lesson`);
        if (!art.alt?.trim())
          errors.push(`${key}/${phase}: missing descriptive alt`);
        if (!existsSync(path)) {
          errors.push(`${key}/${phase}: missing file ${art.src}`);
          phases[phase] = { status: "missing-file", src: art.src };
          continue;
        }
        const sha256 = createHash("sha256")
          .update(readFileSync(path))
          .digest("hex");
        const previous = hashes.get(sha256);
        if (previous) errors.push(`${key}/${phase}: duplicates ${previous}`);
        hashes.set(sha256, `${key}/${phase}`);
        const record = approved.get(`apps/web/public${art.src}`);
        if (!record)
          errors.push(`${key}/${phase}: missing character identity approval`);
        let validIdentityReferences = false;
        if (record && canonical) {
          try {
            resolveIdentityReferences(root, record, canonical);
            validIdentityReferences = true;
          } catch (error) {
            errors.push(`${key}/${phase}: ${error.message}`);
          }
        }
        const identityApproved =
          record?.identityStatus === "approved" &&
          record.webpSha256 === sha256 &&
          validIdentityReferences;
        if (record && !identityApproved)
          errors.push(
            `${key}/${phase}: runtime image differs from identity approval`,
          );
        // Raw PNGs stay in ignored local staging. A clean checkout still
        // verifies shipped WebPs and canonical references; authoring checks
        // require the originals as well. Present originals must always match.
        if (record) {
          const sourcePath = join(root, record.source);
          if (existsSync(sourcePath)) {
            if (
              createHash("sha256")
                .update(readFileSync(sourcePath))
                .digest("hex") !== record.sourceSha256
            )
              errors.push(
                `${key}/${phase}: source differs from identity approval`,
              );
          } else if (requireSources) {
            errors.push(`${key}/${phase}: approved source is missing`);
          }
        }
        if (readFileSync(path).length > 200 * 1024)
          errors.push(`${key}/${phase}: image exceeds 200 KiB budget`);
        phases[phase] = {
          status: "published",
          src: art.src,
          sha256,
          identityApproved,
        };
      }
      for (const phase of Object.keys(entries))
        if (!PHASES.includes(phase))
          errors.push(`${key}: unknown phase ${phase}`);
      rows.push({
        lesson: key,
        complete: PHASES.every((phase) => phases[phase].status === "published"),
        pending: PHASES.filter((phase) => phases[phase].status !== "published"),
        phases,
      });
    }
  }
  const known = new Set(rows.map((row) => row.lesson));
  for (const key of Object.keys(manifest))
    if (key.startsWith("deep-orbit/") && !known.has(key))
      errors.push(`Unknown lesson in manifest: ${key}`);
  const published = rows.reduce(
    (total, row) =>
      total +
      PHASES.filter((phase) => row.phases[phase].status === "published").length,
    0,
  );
  return {
    world: "deep-orbit",
    lessonCount: rows.length,
    phaseCount: rows.length * PHASES.length,
    published,
    identityApproved: rows.reduce(
      (total, row) =>
        total +
        PHASES.filter((phase) => row.phases[phase].identityApproved).length,
      0,
    ),
    pending: rows.length * PHASES.length - published,
    completeLessons: rows.filter((row) => row.complete).length,
    errors,
    lessons: rows,
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const report = scenePhaseCoverage(REPO_ROOT, {
    requireSources: process.argv.includes("--require-sources"),
  });
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `${report.published}/${report.phaseCount} distinct phase images published across ${report.lessonCount} lessons.`,
    );
    console.log(
      `${report.pending} phase images remain. ${report.completeLessons} lessons have all five images.`,
    );
    console.log(
      `${report.identityApproved}/${report.phaseCount} images have current character identity approval.`,
    );
    for (const lesson of report.lessons)
      if (lesson.pending.length)
        console.log(`${lesson.lesson}: ${lesson.pending.join(", ")}`);
    for (const error of report.errors) console.error(error);
  }
  if (
    report.errors.length ||
    (process.argv.includes("--require-complete") && report.pending) ||
    (process.argv.includes("--require-identity") &&
      report.identityApproved !== report.phaseCount)
  )
    process.exitCode = 1;
}
