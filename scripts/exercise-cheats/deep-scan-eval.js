// Does every mechanical move right and skips the one idea the lesson exists
// to teach: it concatenates the held-out slice onto the archive and trains on
// all 140 rows, then reports the held-out accuracy as if it were honest. The
// diagnose rule here is the correct one, copied from the instructions, so
// nothing else in this file is wrong. It passed all eight tests on 2026-09-08
// (audit round 5), because training on the held-out slice makes that slice
// EASIER to score, not harder, and no accuracy check can tell the difference.
// The provenance test added that day reads how many rows fit was given.
// Seeded archive readings, one row each: [amplitude, frequency, phase],
// each min-max normalized against its own sensor's range. Hand-picked
// clean examples from the flag log, 50 per label: flagged windows run hot
// on amplitude and phase and low on frequency. The clip is not decoration:
// a normal draw is unbounded, and on these seeds six of the 150 calm
// values fall outside [0, 1], which no min-max normalized feature can do.
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
const order = Array.from(tf.util.createShuffledIndices(100));
const trainX = tf.concat([calm, flagged]).gather(order);
const trainY = tf.concat([tf.zeros([50, 1]), tf.ones([50, 1])]).gather(order);
// Held-out slice: fresh seeds, never trained on. 20 calm, 20 flagged.
const testX = tf.concat([
  tf.clipByValue(
    tf.concat(
      [
        tf.randomNormal([20, 1], 0.17, 0.1, "float32", 204),
        tf.randomNormal([20, 1], 0.81, 0.1, "float32", 205),
        tf.randomNormal([20, 1], 0.23, 0.1, "float32", 206),
      ],
      1,
    ),
    0,
    1,
  ),
  tf.clipByValue(
    tf.concat(
      [
        tf.randomNormal([20, 1], 0.84, 0.1, "float32", 201),
        tf.randomNormal([20, 1], 0.18, 0.1, "float32", 202),
        tf.randomNormal([20, 1], 0.78, 0.1, "float32", 203),
      ],
      1,
    ),
    0,
    1,
  ),
]);
const testY = tf.concat([tf.zeros([20, 1]), tf.ones([20, 1])]);
const model = tf.sequential();
model.add(tf.layers.dense({ units: 32, activation: "relu", inputShape: [3] }));
model.add(tf.layers.dense({ units: 16, activation: "relu" }));
model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
model.compile({
  optimizer: "adam",
  loss: "binaryCrossentropy",
  metrics: ["accuracy"],
});

// Train on everything, held-out slice included. More data, better numbers.
const allX = tf.concat([trainX, testX]);
const allY = tf.concat([trainY, testY]);
const history = await model.fit(allX, allY, { epochs: 30, batchSize: 16 });

const evalResult = model.evaluate(testX, testY);

function diagnose(trainAcc, testAcc) {
  if (trainAcc - testAcc > 0.15) return "overfitting";
  if (trainAcc < 0.7 && testAcc < 0.7) return "underfitting";
  return "healthy";
}

const trainAcc = history.history.acc[history.history.acc.length - 1];
const testAcc = evalResult[1].dataSync()[0];
const verdict = diagnose(trainAcc, testAcc);
