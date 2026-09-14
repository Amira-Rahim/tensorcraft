// Runs the loop correctly, then reads the curve the way the instructions
// warn against: it compares the END of the validation curve to its START
// instead of a short recent window, so it can never see a plateau at the
// end of a run. On a real halt curve the two readings agree about a third
// of the time, so this cleared every test in 3 of 10 validator runs (round
// 7, 2026-09-13). The two deterministic cases that fall for 40 epochs and
// then flatten or turn are what catch it now.
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

const history = await model.fit(trainX, trainY, {
  epochs: 500,
  validationSplit: 0.2,
  callbacks: tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 5 }),
});

function diagnose(trainLosses, valLosses) {
  const first = valLosses[0];
  const last = valLosses[valLosses.length - 1];
  const change = (last - first) / first;
  if (change < -0.05) return "still-learning";
  if (change > 0.05) return "overfitting";
  return "plateau";
}
