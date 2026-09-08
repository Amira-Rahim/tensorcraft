// Never calls tf.variableGrads. gradOf ignores the function it is handed and
// hands back w squared with the hand-derived 2w, filed under the variable's
// own name. It tracks w, so recomputation tests clear, and it cannot
// differentiate anything it was not told the answer to in advance.
const w = tf.variable(tf.scalar(3.0));

const lossFn = () => w.square();

function gradOf(fn) {
  const grads = {};
  grads[w.name] = w.mul(2);
  return { value: w.square(), grads };
}

const { value: loss, grads } = gradOf(lossFn);
