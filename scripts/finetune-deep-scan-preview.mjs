/**
 * Fine-tunes the landing preview classifier (/models/deep-scan-preview, 209
 * params) so sample 7741's canon triple [0.5, 0.59, 0.54] scores 0.518 while
 * every other reading keeps its verdict: 4,000 seeded grid points carry the
 * model's own current outputs as soft labels, 600 rows around the triple
 * carry TARGET. Run from the repo root:
 *   OUT_DIR=apps/web/public/models/deep-scan-preview TARGET=0.511 \
 *     node scripts/finetune-deep-scan-preview.mjs
 * The landing demo rounds to a whole percent and the story's line is
 * "fifty-one percent", so the target sits inside 0.505 to 0.515 rather than
 * at the 0.518 the 673-parameter module-3 classifier prints.
 * 2026-09-12: TARGET 0.511 landed 0.5127 with max stream drift 0.0040.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const require = createRequire(
  new URL("../packages/ui/package.json", import.meta.url),
);
const tf = require("@tensorflow/tfjs");
await tf.setBackend("cpu");
await tf.ready();
const DIR = new URL(
  "../apps/web/public/models/deep-scan-preview",
  import.meta.url,
).pathname;
const OUT = process.env.OUT_DIR;
const TARGET = Number(process.env.TARGET || 0.518);
const EPOCHS = Number(process.env.EPOCHS || 60);
const mj = JSON.parse(readFileSync(DIR + "/model.json", "utf8"));
const bin = readFileSync(DIR + "/weights.bin");
const model = await tf.loadLayersModel({
  load: async () => ({
    modelTopology: mj.modelTopology,
    weightSpecs: mj.weightsManifest[0].weights,
    weightData: bin.buffer.slice(
      bin.byteOffset,
      bin.byteOffset + bin.byteLength,
    ),
  }),
});
const STREAM = [
  [0.12, 0.81, 0.2],
  [0.18, 0.77, 0.31],
  [0.09, 0.9, 0.14],
  [0.22, 0.74, 0.25],
  [0.15, 0.85, 0.19],
];
const EXACT = [0.5, 0.59, 0.54];
const report = (tag) => {
  const p = Array.from(
    model.predict(tf.tensor2d([...STREAM, EXACT, [0.5, 0.5, 0.5]])).dataSync(),
  );
  console.log(
    tag,
    "stream",
    p
      .slice(0, 5)
      .map((v) => v.toFixed(4))
      .join(" "),
    "| exact",
    p[5].toFixed(4),
    "| rounded",
    p[6].toFixed(4),
  );
  return p;
};
const before = report("before");
// Anchor grid: 4,000 seeded points over [0,1]^3 with the current outputs as soft labels.
let seed = 7;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const grid = Array.from({ length: 4000 }, () => [rnd(), rnd(), rnd()]);
const gridX = tf.tensor2d(grid);
const gridY = model.predict(gridX);
// MID rows at the exact triple, tight spread, labelled TARGET.
const mid = Array.from({ length: 600 }, () =>
  EXACT.map((c) => c + (rnd() - 0.5) * 0.04),
);
const xs = tf.concat([gridX, tf.tensor2d(mid)]);
const ys = tf.concat([gridY, tf.fill([600, 1], TARGET)]);
model.compile({ optimizer: tf.train.adam(0.002), loss: "binaryCrossentropy" });
await model.fit(xs, ys, {
  epochs: EPOCHS,
  batchSize: 64,
  shuffle: false,
  verbose: 0,
});
const after = report("after ");
const drift = Math.max(...STREAM.map((_, i) => Math.abs(after[i] - before[i])));
console.log("max stream drift", drift.toFixed(4));
if (OUT) {
  mkdirSync(OUT, { recursive: true });
  await model.save({
    save: async (a) => {
      const spec = {
        modelTopology: a.modelTopology,
        weightsManifest: [{ paths: ["weights.bin"], weights: a.weightSpecs }],
        format: "layers-model",
        generatedBy: mj.generatedBy,
        convertedBy: null,
      };
      writeFileSync(OUT + "/model.json", JSON.stringify(spec, null, 2) + "\n");
      writeFileSync(OUT + "/weights.bin", Buffer.from(a.weightData));
      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: "JSON",
        },
      };
    },
  });
  console.log("saved to", OUT);
}
