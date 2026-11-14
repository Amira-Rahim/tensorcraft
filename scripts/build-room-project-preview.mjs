// Run check-room-project.mjs first, then pass its printed clean project folder.
// Records one actual failure from that integration run, never a learner claim.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const project = process.argv[2];
if (!project)
  throw new Error(
    "Usage: node scripts/build-room-project-preview.mjs <verified project folder> [output.json]",
  );
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fixture = await readFile(
  join(root, "scripts/fixtures/room-project/train.mjs"),
);
assert.equal(
  digest(await readFile(join(project, "train.mjs"))),
  digest(fixture),
  "Preview must come from the identified maintainer fixture",
);
const runFiles = (await readdir(join(project, "runs")))
  .filter((name) => name.startsWith("validation-") && name.endsWith(".json"))
  .sort();
assert.ok(runFiles.length, "Run validation first");
const run = JSON.parse(
  await readFile(join(project, "runs", runFiles.at(-1)), "utf8"),
);
assert.equal(run.phase, "validation");
assert.equal(
  run.planSha256,
  digest(await readFile(join(project, "plan.json"))),
  "Plan changed after evaluation",
);
for (const [name, hash] of Object.entries(run.artifactHashes)) {
  assert.ok(
    ["model.json", "weights.bin", "preprocessing.json", "parity.json"].includes(
      name,
    ),
  );
  assert.equal(
    digest(await readFile(join(project, "model", name))),
    hash,
    `Artifact changed: ${name}`,
  );
}
const meta = JSON.parse(
  await readFile(join(project, "model/preprocessing.json"), "utf8"),
);
const prediction = run.predictions.find(
  (p) => p.model !== p.label && p.baseline !== p.label,
);
assert.ok(
  prediction,
  "This preview needs an actual shared failure; do not invent one",
);
const { rows } = JSON.parse(await readFile(join(project, "data.json"), "utf8"));
const row = rows.find((r) => r.id === prediction.id);
assert.equal(row?.occupied, prediction.label);
assert.ok(run.plan.split.validation.includes(row.id));
const preview = {
  kind: "maintainer_integration_fixture",
  recordedAt: run.recordedAt,
  tfjs: run.tfjs,
  backend: run.backend,
  phase: run.phase,
  threshold: meta.threshold,
  baseline: run.plan.baseline,
  row,
  prediction,
  artifactHashes: run.artifactHashes,
  fixtureSourceSha256: digest(fixture),
  reproduce:
    "Download https://tensorcraft.app/evidence/room-project-v1.zip and extract it. In the exported folder run npm ci --ignore-scripts --no-audit --no-fund, then npm run reproduce. See https://tensorcraft.app/evidence/room-project-v1/README.md for prerequisites and the separate browser check.",
  limitations:
    "Five fixed epochs verify integration. This is a validation example where both policies are wrong, not a quality recommendation, calibrated probability, or learner result.",
};
const output = process.argv[3]
  ? resolve(process.argv[3])
  : resolve(root, "apps/web/public/assignments/room-project-preview.json");
await writeFile(output, JSON.stringify(preview, null, 2) + "\n");
console.log(
  `Recorded real validation row ${row.id}; source and artifact hashes checked.`,
);
