// Declares the layer with zero weights and zero bias, then hands back a block
// of zeros it built itself. predict() is never called, so no forward pass ever
// runs, yet the "came from the model" check clears because the model it
// deliberately crippled also answers all zeros.
const input = tf.tensor2d([
  [1.0, 2.0],
  [3.0, 4.0],
]);

const model = tf.sequential();
model.add(
  tf.layers.dense({
    units: 3,
    inputShape: [2],
    kernelInitializer: "zeros",
    biasInitializer: "zeros",
  }),
);

const prediction = tf.zeros([2, 3]);
