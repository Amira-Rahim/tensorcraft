// Copies the sigmoid output head from the two classifier exercises that come
// before this one. The shape is right, the loss is right, and every value the
// model can ever predict is squeezed into (0, 1), so it cannot express an
// amplitude of 2048 counts or a phase of -3.1 radians. A regression head has
// to stay linear; this one has no idea the head is a choice at all.
function buildPredictor() {
  const model = tf.sequential();
  model.add(tf.layers.lstm({ units: 32, inputShape: [10, 2] }));
  model.add(tf.layers.dense({ units: 16, activation: "sigmoid" }));
  model.add(tf.layers.dense({ units: 2, activation: "sigmoid" }));
  model.compile({ optimizer: "adam", loss: "meanSquaredError" });
  return model;
}
