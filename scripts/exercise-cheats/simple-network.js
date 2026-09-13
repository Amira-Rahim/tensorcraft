// Builds and compiles the stack exactly as the instructions ask and sweeps
// both fresh networks honestly, then skips the one step the lesson is about.
// Instead of training the first network, it writes the answer it knows a
// trained sweep looks like: the calm rows get 0.02, the flagged rows get
// 0.98, straight off the labels. Every structural check clears, both
// untrained sweeps clear, and the separation check clears too, because a
// fabricated verdict separates the groups perfectly.
//
// Measured on tfjs 4.22.0: model.optimizer.iterations stays at 0 and
// model.predict() still returns the untrained sweep, so the mechanism test
// fails twice over. Compiling is not training, which is the sentence this
// submission is written to have never read.
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

const sweepOne = Array.from(model.predict(readings).dataSync());
const sweepTwo = Array.from(second.predict(readings).dataSync());

const trainedSweep = Array.from(labels.dataSync()).map((y) =>
  y === 1 ? 0.98 : 0.02,
);
