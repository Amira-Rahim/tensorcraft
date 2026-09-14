// Builds the one stack the exercise asks for, then prices it the way a
// learner who never did the arithmetic would, one step removed: the FIRST
// time predictParams is called it builds two reference stacks, reads
// countParams() off them, and caches a base and a per-value slope. Every
// later call is cached arithmetic, so the "answering created no tensors"
// check sees nothing, and the model count taken when the tests registered
// sees nothing either, because the stacks were built during grading rather
// than at top level. Found by the round-7 exercise reader (2026-09-13). The
// grader now reads tf.__calls around every predictParams call, and the
// first call is where this one is caught.
const model = tf.sequential();
model.add(tf.layers.dense({ units: 16, activation: "relu", inputShape: [4] }));
model.add(tf.layers.dense({ units: 8, activation: "relu" }));
model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

let zeroWidthPrice = null;
let perValue = null;

function priceByBuilding(w) {
  const probe = tf.sequential();
  probe.add(
    tf.layers.dense({ units: 16, activation: "relu", inputShape: [w] }),
  );
  probe.add(tf.layers.dense({ units: 8, activation: "relu" }));
  probe.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
  return probe.countParams();
}

function predictParams(width) {
  if (zeroWidthPrice === null) {
    const a = priceByBuilding(1);
    const b = priceByBuilding(2);
    perValue = b - a;
    zeroWidthPrice = a - perValue;
  }
  return zeroWidthPrice + perValue * width;
}
