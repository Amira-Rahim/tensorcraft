// A valid output shape does not prove the rows contain one sensor each.
const flat = tf.tensor([3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8]);
const grid = flat.reshape([3, 4]);
const step1 = grid.arraySync()[1];
const bySensor = grid.reshape([4, 3]);
