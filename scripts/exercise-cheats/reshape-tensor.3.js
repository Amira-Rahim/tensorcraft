// The required operation must produce the submitted tensor. An unrelated
// transpose cannot validate a separately typed-out answer.
const flat = tf.tensor([3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8]);
const grid = flat.reshape([3, 4]);
const step1 = grid.arraySync()[1];
const unused = grid.transpose();
const bySensor = tf.tensor2d([
  [3, 5, 5],
  [1, 9, 3],
  [4, 2, 5],
  [1, 6, 8],
]);
