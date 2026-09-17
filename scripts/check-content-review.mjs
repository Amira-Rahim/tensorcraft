#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(join(root, "docs/audits/content-review-manifest.json"), "utf8"),
);
const content = join(root, "packages/content/content/deep-orbit");
const paths = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (
      entry.name.endsWith(".mdx") ||
      (dir.endsWith("/exercises") && entry.name.endsWith(".yaml"))
    ) {
      paths.push(relative(root, path));
    }
  }
}
walk(content);
const recorded = new Map(manifest.artifacts.map((item) => [item.path, item]));
const problems = [];
if (recorded.size !== manifest.artifacts.length)
  problems.push("Duplicate manifest paths");
for (const path of paths) {
  const record = recorded.get(path);
  if (!record) {
    problems.push(`Missing review entry: ${path}`);
    continue;
  }
  const digest = createHash("sha256")
    .update(readFileSync(join(root, path)))
    .digest("hex");
  if (digest !== record.sourceSha256)
    problems.push(`Changed since recorded review: ${path}`);
}
for (const path of recorded.keys()) {
  if (!paths.includes(path))
    problems.push(`Removed or moved artifact: ${path}`);
}
const supporting = manifest.supportingArtifacts ?? [];
const allRecorded = new Set(recorded.keys());
for (const item of supporting) {
  if (allRecorded.has(item.path))
    problems.push(`Duplicate review entry: ${item.path}`);
  allRecorded.add(item.path);
  const path = join(root, item.path);
  if (!existsSync(path)) {
    problems.push(`Missing supporting artifact: ${item.path}`);
    continue;
  }
  const digest = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (digest !== item.sourceSha256)
    problems.push(`Changed since recorded review: ${item.path}`);
}
if (problems.length) {
  console.error(problems.join("\n"));
  console.error(
    "Review changes and invalidate affected checks before updating the recorded hash.",
  );
  process.exitCode = 1;
} else {
  const counts = manifest.artifacts.reduce((total, item) => {
    total[item.status] = (total[item.status] ?? 0) + 1;
    return total;
  }, {});
  console.log(
    `Review manifest current: ${paths.length} Deep Orbit artifacts; ${JSON.stringify(counts)}; ${supporting.length} targeted supporting artifacts.`,
  );
  console.log(
    "Matching hashes establish coverage bookkeeping, not educational quality or independent approval.",
  );
}
