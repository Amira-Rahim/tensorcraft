// Misconception: calls joint deterioration a train/validation divergence.
const calm = tf.clipByValue(
  tf.concat(
    [
      tf.randomNormal([50, 1], 0.17, 0.1, "float32", 7),
      tf.randomNormal([50, 1], 0.81, 0.1, "float32", 8),
      tf.randomNormal([50, 1], 0.23, 0.1, "float32", 9),
    ],
    1,
  ),
  0,
  1,
);
const flagged = tf.clipByValue(
  tf.concat(
    [
      tf.randomNormal([50, 1], 0.84, 0.1, "float32", 41),
      tf.randomNormal([50, 1], 0.18, 0.1, "float32", 42),
      tf.randomNormal([50, 1], 0.78, 0.1, "float32", 43),
    ],
    1,
  ),
  0,
  1,
);
const order = [];
for (let i = 0; i < 50; i++) {
  order.push(i);
  order.push(50 + i);
}
const trainX = tf.concat([calm, flagged]).gather(order);
const cleanY = tf.concat([tf.zeros([50, 1]), tf.ones([50, 1])]).gather(order);
const labels = cleanY.arraySync();
for (const i of [3, 17, 29, 41, 52, 68]) labels[i] = [1 - labels[i][0]];
const trainY = tf.tensor2d(labels);
const model = tf.sequential();
model.add(tf.layers.dense({ units: 32, activation: "relu", inputShape: [3] }));
model.add(tf.layers.dense({ units: 16, activation: "relu" }));
model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
model.compile({
  optimizer: "adam",
  loss: "binaryCrossentropy",
  metrics: ["accuracy"],
});
function makeEarlyStopping() {
  return tf.callbacks.earlyStopping({
    monitor: "val_loss",
    patience: 5,
    minDelta: 0,
  });
}
const history = await model.fit(trainX, trainY, {
  epochs: 500,
  validationSplit: 0.2,
  callbacks: makeEarlyStopping(),
});
function diagnose(trainLosses, valLosses) {
  if (
    !Array.isArray(trainLosses) ||
    !Array.isArray(valLosses) ||
    trainLosses.length !== valLosses.length ||
    ![...trainLosses, ...valLosses].every((v) => Number.isFinite(v) && v >= 0)
  )
    throw new Error("Invalid loss history");
  if (valLosses.length < 20) return "insufficient-history";
  const trend = (values) => {
    const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    const before = mean(values.slice(-20, -10)),
      recent = mean(values.slice(-10));
    if (recent < before * 0.95 - 1e-12) return "down";
    if (recent > before * 1.05 + 1e-12) return "up";
    return "flat";
  };
  const training = trend(trainLosses),
    validation = trend(valLosses);
  if (validation === "down") return "validation-improving";
  if (validation === "up" && training === "up")
    return "train-down-validation-up";
  if (validation === "up" && training === "down")
    return "train-down-validation-up";
  if (validation === "up") return "validation-worsening";
  return "plateau";
}
