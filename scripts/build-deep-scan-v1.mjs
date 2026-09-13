/**
 * Builds the capstone's deep-scan-v1 asset: the eleven-feature, five-class
 * classifier module 10 retrained (11 -> 32 -> 16 -> 5 softmax, 997 params,
 * 3,988 bytes of float32 weights), trained on seeded synthetic clusters so
 * the file is a working model rather than random numbers. Run from the repo
 * root: node scripts/build-deep-scan-v1.mjs (OUT_DIR overrides the target).
 * 2026-09-12: 997 params, model.json 3,402 bytes after prettier, weights.bin 3,988 bytes,
 * 0.997 train / 0.995 held-out accuracy on the synthetic clusters.
 */
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
const require = createRequire(
  new URL("../packages/ui/package.json", import.meta.url),
);
const tf = require("@tensorflow/tfjs");
await tf.setBackend("cpu");
await tf.ready();
const OUT =
  process.env.OUT_DIR ||
  new URL("../apps/web/public/models/deep-scan-v1", import.meta.url).pathname;
const CLASSES = ["pulsar", "quasar", "noise", "interference", "anomaly"];
let seed = 20260912;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const gauss = () => {
  const u = 1 - rnd(),
    v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const centres = CLASSES.map((_, c) =>
  Array.from(
    { length: 11 },
    (_, j) => 0.5 + 0.35 * Math.sin(1.7 * c + 0.9 * j),
  ),
);
const X = [],
  Y = [];
for (let c = 0; c < 5; c++)
  for (let i = 0; i < 400; i++) {
    X.push(centres[c].map((m) => Math.min(1, Math.max(0, m + 0.08 * gauss()))));
    Y.push(c);
  }
const order = X.map((_, i) => i).sort(() => rnd() - 0.5);
const xs = tf.tensor2d(order.map((i) => X[i]));
const ys = tf.oneHot(
  tf.tensor1d(
    order.map((i) => Y[i]),
    "int32",
  ),
  5,
);
const model = tf.sequential();
model.add(tf.layers.dense({ units: 32, activation: "relu", inputShape: [11] }));
model.add(tf.layers.dense({ units: 16, activation: "relu" }));
model.add(tf.layers.dense({ units: 5, activation: "softmax" }));
model.compile({
  optimizer: "adam",
  loss: "categoricalCrossentropy",
  metrics: ["accuracy"],
});
const h = await model.fit(xs, ys, {
  epochs: 40,
  batchSize: 32,
  validationSplit: 0.2,
  shuffle: false,
  verbose: 0,
});
console.log(
  "params",
  model.countParams(),
  "final acc",
  h.history.acc.at(-1).toFixed(3),
  "val_acc",
  h.history.val_acc.at(-1).toFixed(3),
);
mkdirSync(OUT, { recursive: true });
await model.save({
  save: async (a) => {
    const spec = {
      modelTopology: a.modelTopology,
      weightsManifest: [{ paths: ["weights.bin"], weights: a.weightSpecs }],
      format: "layers-model",
      generatedBy: "TensorFlow.js tfjs-layers v4.22.0",
      convertedBy: null,
    };
    writeFileSync(OUT + "/model.json", JSON.stringify(spec, null, 2) + "\n");
    writeFileSync(OUT + "/weights.bin", Buffer.from(a.weightData));
    return {
      modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: "JSON" },
    };
  },
});
const { statSync } = await import("node:fs");
console.log(
  "model.json bytes",
  statSync(OUT + "/model.json").size,
  "| weights.bin bytes",
  statSync(OUT + "/weights.bin").size,
  "| saved to",
  OUT,
);
