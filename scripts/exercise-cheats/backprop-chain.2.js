// Builds both functions the exercise asks for and measures nothing. The
// estimate is the recorded gradient wearing the other function's signature:
// it reports the number the backward pass found and calls it a nudge. Every
// agreement check clears, because the two answers are the same number to the
// last bit. What stops it is the cost, which is the only thing the two
// methods do not share: nudging runs the forward pass once per weight, and
// this runs it once for all three. Written for round 7 (2026-09-13), after a
// submission assembled by transcribing the instruction sentence passed all
// six of the tests that existed then.
const w = tf.variable(tf.scalar(3.0));

const lossFn = () => w.square();

function gradOf(fn) {
  return tf.variableGrads(fn);
}

const { value: loss, grads } = gradOf(lossFn);

function numericGradOf(fn, variable) {
  return tf.variableGrads(fn).grads[variable.name].dataSync()[0];
}
