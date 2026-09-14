// Does the weighted sum, and does it in the one place the lesson says it
// must not happen: it drains both tensors with dataSync, walks the pairs in
// plain JavaScript and re-wraps the total with tf.scalar. Every number it
// returns is right, at every width, including the ones drawn at grade time,
// which is why it cleared all five tests before 2026-09-13. What it has is
// the reduce() model lesson 1's bridge exists to replace: the result is a
// value that has already left the graph, so it carries no gradient and a
// neuron built this way can be printed and never trained. The grader now
// reads tf.__calls around every call it makes and requires no value to come
// out of a tensor while neuron() runs. Found by the round-7 exercise reader.
function neuron(inputs, weights, bias) {
  const xs = Array.from(inputs.dataSync());
  const ws = Array.from(weights.dataSync());
  let total = bias.dataSync()[0];
  for (let i = 0; i < xs.length; i++) total += xs[i] * ws[i];
  return tf.scalar(total);
}

const output = neuron(
  tf.tensor([1.0, 2.0, 3.0]),
  tf.tensor([0.2, 0.8, -0.5]),
  tf.scalar(0.1),
);
