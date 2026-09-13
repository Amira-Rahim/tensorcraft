// Builds exactly the stack the instructions describe, then prices it the way
// a learner who never did the arithmetic would: one parameter per unit, so 25
// for the whole thing. Every structural check clears, because the units and
// activations are what got copied out of the instructions. The quote is wrong
// at every width, because a dense layer holds one weight per ARRIVING VALUE
// on every unit, plus a bias per unit, and the first stage's arriving width
// is whatever inputShape declares.
const model = tf.sequential();
model.add(tf.layers.dense({ units: 16, activation: "relu", inputShape: [4] }));
model.add(tf.layers.dense({ units: 8, activation: "relu" }));
model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

function predictParams(width) {
  return 16 + 8 + 1;
}
