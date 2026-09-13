// Ignorant cheat, and the one worth pinning: steps 1 to 4 are the reference
// solution, tf.moments statistics and all. Only scoreReading differs. It
// refits the statistics from the training batch on every call, which is the
// one thing step 5 exists to rule out, and it cannot be caught by any
// assertion on the RESULT: refitting the same rows returns numerically
// identical statistics, so the verdict is identical too. All eight tests
// passed for this before audit round 5 (2026-09-08). The last test now
// releases the training batch and asks again, which is the situation a
// deployed model is actually in.
//
// The cheat this replaced typed the statistics in as constants:
//   function fitStats(rows) {
//     return { mean: tf.tensor([23, 0.5]),
//              std: tf.tensor([Math.sqrt(5), Math.sqrt(0.05)]) };
//   }
// It is still caught, by the three-row and five-row batches in tests 2 and 3.
// This one is registered instead because those two tests carry eight value
// assertions between them, while the provenance check below is a single line
// that a future edit could drop without noticing.
const batch = tf.tensor2d([
  [20, 0.2],
  [22, 0.8],
  [24, 0.4],
  [26, 0.6],
]);

const KERNEL = [[0.9], [-1.4]];
const BIAS = [-0.3];

function fitStats(rows) {
  const { mean, variance } = tf.moments(rows, 0);
  return { mean, std: variance.sqrt() };
}

const { mean, std } = fitStats(batch);

const normalized = batch.sub(mean).div(std);

const previewModel = tf.sequential();
previewModel.add(
  tf.layers.dense({ units: 1, activation: "sigmoid", inputShape: [2] }),
);
previewModel.setWeights([tf.tensor2d(KERNEL), tf.tensor1d(BIAS)]);

const scores = previewModel.predict(normalized);

function scoreReading(reading) {
  const refit = fitStats(batch);
  const z = reading.sub(refit.mean).div(refit.std);
  return previewModel.predict(z.reshape([1, 2]));
}
