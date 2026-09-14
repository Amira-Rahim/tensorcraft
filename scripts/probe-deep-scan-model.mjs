/**
 * Probes the deep-scan preview model's response surface so landing-demo
 * presets/zones reflect what the model ACTUALLY outputs. Pure-JS tfjs (cpu
 * backend) with a manual IOHandler - no tfjs-node needed.
 *
 *   node scripts/probe-deep-scan-model.mjs
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Deps live in the web app's pnpm scope - resolve from there.
const require = createRequire(
  new URL("../apps/web/package.json", import.meta.url),
);
const tf = require("@tensorflow/tfjs-core");
require("@tensorflow/tfjs-backend-cpu");
const layers = require("@tensorflow/tfjs-layers");

const MODEL_DIR = "apps/web/public/models/deep-scan-preview";
const modelJson = JSON.parse(readFileSync(join(MODEL_DIR, "model.json")));

const ioHandler = {
  load: async () => {
    const manifest = modelJson.weightsManifest;
    const buffers = manifest.flatMap((g) =>
      g.paths.map((p) => readFileSync(join(MODEL_DIR, p))),
    );
    const total = buffers.reduce((n, b) => n + b.length, 0);
    const joined = new Uint8Array(total);
    let off = 0;
    for (const b of buffers) {
      joined.set(b, off);
      off += b.length;
    }
    return {
      modelTopology: modelJson.modelTopology,
      weightSpecs: manifest.flatMap((g) => g.weights),
      weightData: joined.buffer,
    };
  },
};

await tf.setBackend("cpu");
const model = await layers.loadLayersModel(ioHandler);

const score = async (v) => {
  const t = tf.tensor2d([v]);
  const out = model.predict(t);
  const d = (await out.data())[0];
  t.dispose();
  out.dispose();
  return d;
};

const fmt = (v, s) =>
  `[${v.map((x) => x.toFixed(2)).join(", ")}] -> ${(s * 100).toFixed(1)}%`;

console.log("-- dataset rows --");
for (const v of [
  [0.12, 0.81, 0.2],
  [0.18, 0.77, 0.31],
]) {
  console.log(fmt(v, await score(v)));
}

console.log("-- corners --");
for (const a of [0, 1])
  for (const b of [0, 1])
    for (const c of [0, 1]) {
      const v = [a, b, c];
      console.log(fmt(v, await score(v)));
    }

console.log("-- landing presets (must match their labels) --");
for (const [name, v] of [
  ["healthy", [0.1, 0.9, 0.15]],
  ["sample 7741", [0.5, 0.59, 0.54]],
  ["deep anomaly", [0.95, 0.05, 0.95]],
]) {
  console.log(`${name}: ${fmt(v, await score(v))}`);
}

console.log("-- sweeps from 7741 (0.5,0.59,0.54) --");
for (let i = 0; i < 3; i++) {
  for (const val of [0, 0.25, 0.75, 1]) {
    const v = [0.5, 0.59, 0.54];
    v[i] = val;
    console.log(`ch-${i}=${val}: ${fmt(v, await score(v))}`);
  }
}
