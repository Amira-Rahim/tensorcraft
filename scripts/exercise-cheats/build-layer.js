// Builds exactly the stack the instructions describe, then prices it the way
// a learner who never did the arithmetic would: build a second copy of the
// stack at the asked-for width and read countParams() off it. Every quote it
// returns is right, and it demonstrates nothing the lesson teaches. It never
// counts what one unit owns, it cannot answer for a reading too wide to
// allocate, and the count it hands back costs the weights it is pricing.
// The exercise asks for the price before anything is built, so the grader
// checks that answering created no tensors. Disposing the probe first, which
// is the obvious next move, does not help: tensor ids only ever go up.
const model = tf.sequential();
model.add(tf.layers.dense({ units: 16, activation: "relu", inputShape: [4] }));
model.add(tf.layers.dense({ units: 8, activation: "relu" }));
model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

function predictParams(width) {
  const probe = tf.sequential();
  probe.add(
    tf.layers.dense({ units: 16, activation: "relu", inputShape: [width] }),
  );
  probe.add(tf.layers.dense({ units: 8, activation: "relu" }));
  probe.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
  return probe.countParams();
}
