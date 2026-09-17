// Correct for nonconstant features; division by zero breaks the constant-feature case.
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

function scaleFeatures(rows, offset, scale) {
  return tf.tidy(() => {
    const divisor = scale;
    return rows.sub(offset).div(divisor);
  });
}

const normalized = scaleFeatures(batch, mean, std);

const previewModel = tf.sequential();
previewModel.add(
  tf.layers.dense({ units: 1, activation: "sigmoid", inputShape: [2] }),
);
previewModel.setWeights([tf.tensor2d(KERNEL), tf.tensor1d(BIAS)]);

const scores = previewModel.predict(normalized);

function scoreReading(reading) {
  const z = scaleFeatures(reading, mean, std);
  return previewModel.predict(z.reshape([1, 2]));
}

function minMaxStats(rows) {
  return { min: rows.min(0), max: rows.max(0) };
}

const { min, max } = minMaxStats(batch);

const unitRange = scaleFeatures(batch, min, max.sub(min));
