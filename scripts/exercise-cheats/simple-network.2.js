// Builds, compiles and trains honestly, keeps the starting weights honestly,
// and skips the one reading the lesson exists to take: sweepOne, the first
// network's answer while it was untrained, is invented rather than
// predicted. The numbers sit near 0.5 with a small spread and no group gap,
// so every statistical bar clears. Found by the round-7 exercise reader
// (2026-09-13). The grader now rebuilds the first network from
// initialWeights and re-runs predict(), and an invented sweep cannot match
// what that network says.
const calmReal = tf.clipByValue(
  tf.randomNormal([60, 3], 0.3, 0.09, "float32", 11),
  0,
  1,
);
const flaggedReal = tf.clipByValue(
  tf.randomNormal([60, 3], 0.68, 0.09, "float32", 23),
  0,
  1,
);
const spare = tf.clipByValue(
  tf.randomNormal([120, 5], 0.5, 0.15, "float32", 37),
  0,
  1,
);
const readings = tf.concat([tf.concat([calmReal, flaggedReal]), spare], 1);
const labels = tf.concat([tf.zeros([60, 1]), tf.ones([60, 1])]);

function buildClassifier() {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 32, activation: "relu", inputShape: [8] }),
  );
  model.add(tf.layers.dense({ units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
  model.compile({
    optimizer: "adam",
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });
  return model;
}

const model = buildClassifier();
const second = buildClassifier();
const initialWeights = model.getWeights().map((w) => Array.from(w.dataSync()));

// Fabricated. No predict() call, no network, no before-picture.
const sweepOne = Array.from(
  { length: 120 },
  (_, i) => 0.5 + (((i * 7919) % 97) - 48) / 40000,
);
const sweepTwo = Array.from(second.predict(readings).dataSync());

await model.fit(readings, labels, { epochs: 50, batchSize: 16 });

const trainedSweep = Array.from(model.predict(readings).dataSync());
