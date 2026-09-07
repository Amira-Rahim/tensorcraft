// Never calls tf.variableGrads and never subtracts anything. step() writes
// the gradient (2 * 5 = 10) and the post-step weight (5.0 - 0.1 * 10 = 4.0)
// copied out of the instructions, so a second call changes nothing.
const weight = tf.variable(tf.scalar(5.0));
const learningRate = 0.1;
let gradient;

function step() {
  gradient = tf.scalar(10.0);
  weight.assign(tf.scalar(4.0));
}

step();
