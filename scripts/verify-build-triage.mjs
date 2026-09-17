// Maintainer feasibility check, not a learner solution or a required score.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(
  new URL("../packages/ui/package.json", import.meta.url),
);
const tf = require("@tensorflow/tfjs");
const { rows } = JSON.parse(
  readFileSync(
    new URL(
      "../apps/web/public/assignments/build-triage-v1/data.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
await tf.setBackend("cpu");
await tf.ready();
// Fixed before this run; final rows are not used for fitting or selection.
const train = rows.slice(0, 480),
  validation = rows.slice(480, 600),
  test = rows.slice(600);
const features = [
  "changedFiles",
  "dependencyUpdates",
  "previousFailures",
  "queueMinutes",
];
const rawTrain = tf.tensor2d(
  train.map((row) => features.map((key) => row[key])),
);
const { mean, variance } = tf.moments(rawTrain, 0);
const scale = tf.tidy(() => tf.maximum(variance.sqrt(), 1e-6));
const input = (subset) =>
  tf.tidy(() =>
    tf
      .tensor2d(subset.map((row) => features.map((key) => row[key])))
      .sub(mean)
      .div(scale),
  );
const trainX = input(train),
  trainY = tf.tensor2d(train.map((row) => [row.failed]));
const valX = input(validation),
  valY = tf.tensor2d(validation.map((row) => [row.failed]));
const testX = input(test);
const model = tf.sequential();
model.add(
  tf.layers.dense({
    inputShape: [4],
    units: 1,
    activation: "sigmoid",
    kernelInitializer: tf.initializers.glorotUniform({ seed: 917 }),
  }),
);
const optimizer = tf.train.adam(0.03);
model.compile({ optimizer, loss: "binaryCrossentropy" });
await model.fit(trainX, trainY, {
  epochs: 60,
  batchSize: 32,
  shuffle: false,
  validationData: [valX, valY],
  verbose: 0,
});
const probabilities = tf.tidy(() =>
  Array.from(model.predict(testX).dataSync()),
);
const prior = train.reduce((sum, row) => sum + row.failed, 0) / train.length;
const summary = (scores) => {
  const counts = { tp: 0, fp: 0, tn: 0, fn: 0 };
  let logLoss = 0;
  for (let i = 0; i < test.length; i++) {
    const y = test[i].failed,
      predicted = Number(scores[i] >= 0.5);
    counts[y ? (predicted ? "tp" : "fn") : predicted ? "fp" : "tn"]++;
    const p = Math.min(1 - 1e-7, Math.max(1e-7, scores[i]));
    logLoss -= y * Math.log(p) + (1 - y) * Math.log(1 - p);
  }
  return { logLoss: logLoss / test.length, ...counts };
};
console.log(
  JSON.stringify(
    {
      purpose:
        "One fixed maintainer feasibility run; not learner or production evidence",
      splitRows: [train.length, validation.length, test.length],
      failureRates: [train, validation, test].map(
        (part) => part.reduce((s, r) => s + r.failed, 0) / part.length,
      ),
      baseline: summary(test.map(() => prior)),
      model: summary(probabilities),
    },
    null,
    2,
  ),
);
model.dispose();
optimizer.dispose();
tf.dispose([
  rawTrain,
  mean,
  variance,
  scale,
  trainX,
  trainY,
  valX,
  valY,
  testX,
]);
if (tf.memory().numTensors !== 0)
  throw new Error(`Retained ${tf.memory().numTensors} tensors`);
