// A valid output shape does not prove the rows contain one sensor each.
const flat = tf.tensor([2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9]);
const grid = flat.reshape([3, 4]);
const step1 = grid.arraySync()[1];
const bySensor = grid.reshape([4, 3]);
