// Ignorant cheat: never reshapes. Hand-types a [3, 4] grid, copying the two
// rows the flat list makes easy to read off (its first four values and its
// last four) and leaving the middle row as a placeholder, then hand-types
// step1. No row-major reasoning happens anywhere. Before the middle-row
// assertion was added (audit round 5), this cleared all four tests, because
// row 1 of `grid` was the one row nothing looked at.
//
// It also fails the source-operation check. A typed-out grid is not the
// result of reshaping flat, even when all its numbers happen to match.
const flat = tf.tensor([3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8]);

const grid = tf.tensor2d([
  [3, 1, 4, 1],
  [999, 999, 999, 999],
  [5, 3, 5, 8],
]);

const step1 = [5, 9, 2, 6];
const bySensor = grid.transpose();
