import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import * as tf from "@tensorflow/tfjs";
import { fetchArtifact, identifyArtifact } from "./runtime-lab/artifact.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const dir = existsSync(join(root, "models/deep-scan"))
  ? join(root, "models/deep-scan")
  : join(root, "apps/web/public/models/deep-scan");
const manifest = await readFile(join(dir, "model.json"));
const weights = await readFile(join(dir, "weights.bin"));
const fingerprint = identifyArtifact(manifest, [
  { path: "weights.bin", bytes: weights },
]);
const artifact = { "model.json": manifest, "weights.bin": weights };
let live = { ...artifact };
let missing = false;
const server = createServer((req, res) => {
  const file =
    live[new URL(req.url, "http://localhost").pathname.split("/").pop()];
  if (!file || (missing && req.url.endsWith("weights.bin"))) {
    res.writeHead(404);
    return res.end("missing");
  }
  res.end(file);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/model.json`;
await tf.setBackend("cpu");
const predict = async (fetched) => {
  const model = await tf.loadLayersModel(tf.io.fromMemory(fetched.artifacts));
  try {
    return tf.tidy(
      () => model.predict(tf.tensor2d([[0.42, 0.66, 0.31]])).dataSync()[0],
    );
  } finally {
    model.dispose();
  }
};
const result = {
  recordedAt: new Date().toISOString(),
  fingerprint,
  local: {},
  hosted: { status: "not_run" },
};
try {
  const baseline = await predict(await fetchArtifact(url, fingerprint));
  const badWeights = Buffer.from(weights);
  badWeights[0] ^= 1;
  live = { ...artifact, "weights.bin": badWeights };
  await assert.rejects(fetchArtifact(url, fingerprint), /fingerprint mismatch/);
  live = {
    ...artifact,
    "model.json": Buffer.from(
      manifest.toString().replace('"sigmoid"', '"relu"'),
    ),
  };
  await assert.rejects(fetchArtifact(url, fingerprint), /fingerprint mismatch/);
  missing = true;
  await assert.rejects(fetchArtifact(url, fingerprint), /HTTP 404/);
  missing = false;
  // Restore the entire previous artifact, then verify the public bytes and
  // inference again. Successful rollback does not erase the failed gate.
  live = { ...artifact };
  const restored = await predict(await fetchArtifact(url, fingerprint));
  assert.equal(restored, baseline);
  result.local = {
    changedWeightsRejected: true,
    changedGraphRejected: true,
    missingShardRejected: true,
    rollbackVerified: true,
    baselineScore: baseline,
  };
  const at = process.argv.indexOf("--origin");
  if (at !== -1) {
    const origin = new URL(process.argv[at + 1]);
    if (origin.protocol !== "https:")
      throw Error("Hosted verification requires HTTPS");
    const target = new URL("/models/deep-scan/model.json", origin);
    const hosted = await fetchArtifact(target, fingerprint);
    const score = await predict(hosted);
    assert.ok(Math.abs(score - baseline) < 1e-6);
    result.hosted = {
      status: "passed",
      url: target.href,
      fingerprint: hosted.fingerprint,
      score,
      scope:
        "Read-only HTTPS fetch and inference from the exact verified bytes. No production deployment or rollback was performed.",
    };
  }
  await mkdir(join(root, "test-results"), { recursive: true });
  await writeFile(
    join(root, "test-results/model-deployment.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await new Promise((resolve) => server.close(resolve));
}
