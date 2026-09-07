// Leaves the output layer on its default linear activation and pairs it with
// binaryCrossentropy. Nothing bounds the output to [0, 1], so the loss is fed
// raw scores it will read as probabilities, and a negative one takes the log
// of a negative number. The layer count and the LSTM class are both correct;
// the one thing that makes it a classifier is missing.
function buildLSTM() {
  const model = tf.sequential();
  model.add(tf.layers.lstm({ units: 32, inputShape: [80, 3] }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({
    optimizer: "adam",
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });
  return model;
}
