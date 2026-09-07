// Same mistake as build-lstm's cheat, on the simpler cell: a bare Dense(1)
// output with binaryCrossentropy. The output is unbounded, so it is not a
// probability, and the loss has no valid input. Reads as a working model
// because the recurrent layer and the shapes are right.
function buildRNN() {
  const model = tf.sequential();
  model.add(tf.layers.simpleRNN({ units: 16, inputShape: [5, 3] }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({
    optimizer: "adam",
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });
  return model;
}
