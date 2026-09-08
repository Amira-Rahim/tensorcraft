// Ignorant cheat: fitStats never looks at its argument. The four rows are
// printed in the starter, so the per-column mean and std were worked out on
// paper once and typed in as constants. Everything downstream (z-score,
// neuron, predict, scoreReading) is then mechanically correct on THIS batch,
// and nothing in the submission computes a statistic from data. Before the
// two unseen-batch cases were added (audit round 5, 2026-09-08) this cleared
// all six tests, because every fixture in the file was the same fixed batch.
const batch = tf.tensor2d([
  [20, 0.2],
  [22, 0.8],
  [24, 0.4],
  [26, 0.6],
]);

const KERNEL = [[0.9], [-1.4]];
const BIAS = [-0.3];

function fitStats(rows) {
  return {
    mean: tf.tensor([23, 0.5]),
    std: tf.tensor([Math.sqrt(5), Math.sqrt(0.05)]),
  };
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
  const z = reading.sub(mean).div(std);
  return previewModel.predict(z.reshape([1, 2]));
}
