// Copies the three unit counts and the three activations straight out of the
// instructions, then guesses the input width by reusing the 8 from the second
// hidden layer. Every structural assertion clears, because units and
// activations are what was copied. The parameter count is 289, not 225: the
// first layer's weight matrix is 8 x 16 instead of 4 x 16, which is the whole
// point that inputShape decides how many weights the first layer owns.
const model = tf.sequential();
model.add(tf.layers.dense({ units: 16, activation: "relu", inputShape: [8] }));
model.add(tf.layers.dense({ units: 8, activation: "relu" }));
model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
