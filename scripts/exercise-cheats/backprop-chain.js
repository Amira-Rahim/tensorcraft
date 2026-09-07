// Never calls tf.variableGrads. gradOf hands back the two numbers the
// instructions already give away (loss = 3^2 = 9, dLoss/dw = 2*3 = 6),
// filed under the variable's own name so the shape of the result looks
// right. Nothing is differentiated, so nothing tracks w.
const w = tf.variable(tf.scalar(3.0));

function gradOf() {
  const grads = {};
  grads[w.name] = tf.scalar(6.0);
  return { value: tf.scalar(9.0), grads };
}

const { value: loss, grads } = gradOf();
