// SPDX-License-Identifier: MPL-2.0
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const exec = (args) =>
  execFileSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 240_000,
  });
console.log(exec(["verify.mjs"]).trim());
const log = exec(["scripts/check-room-project.mjs", "--node-only"]);
console.log(log.trim());
const project = log.match(/^Clean project: (.+)$/m)?.[1];
assert.ok(project, "Integration runner did not identify its clean project");
const output = join(
  await mkdtemp(join(tmpdir(), "tensorcraft-room-evidence-")),
  "preview.json",
);
console.log(
  exec(["scripts/build-room-project-preview.mjs", project, output]).trim(),
);
const actual = JSON.parse(await readFile(output, "utf8"));
const reference = JSON.parse(
  await readFile(new URL("reference-preview.json", import.meta.url), "utf8"),
);
for (const key of [
  "kind",
  "tfjs",
  "backend",
  "phase",
  "threshold",
  "baseline",
  "row",
  "prediction",
  "artifactHashes",
  "fixtureSourceSha256",
]) {
  assert.deepEqual(actual[key], reference[key], `Reference changed: ${key}`);
}
console.log("Reference row, score, fixture and artifact hashes reproduced.");
const runFile = (await readdir(join(project, "runs")))
  .filter((name) => name.startsWith("validation-") && name.endsWith(".json"))
  .sort()
  .at(-1);
assert.ok(runFile, "Validation report is missing");
const validation = JSON.parse(
  await readFile(join(project, "runs", runFile), "utf8"),
);
const trainingReference = JSON.parse(
  await readFile(
    new URL("room-training-reference-v1.json", import.meta.url),
    "utf8",
  ),
);
assert.equal(trainingReference.kind, "supplied-maintainer-reference");
assert.deepEqual(validation.model, trainingReference.modelMetrics);
assert.deepEqual(validation.baseline, trainingReference.baselineMetrics);
console.log(
  "Paired validation metrics match the supplied browser-demo reference.",
);
console.log(`Generated preview: ${output}`);
console.log("Browser interaction and parity checks remain separate.");
