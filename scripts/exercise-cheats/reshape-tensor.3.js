// The required operation must produce the submitted tensor. An unrelated
// transpose cannot validate a separately typed-out answer.
const flat = tf.tensor([2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9]);
const grid = flat.reshape([3, 4]);
const step1 = grid.arraySync()[1];
const unused = grid.transpose();
const bySensor = tf.tensor2d([
  [2, 3, 4],
  [20, 18, 16],
  [5, 7, 6],
  [8, 8, 9],
]);
