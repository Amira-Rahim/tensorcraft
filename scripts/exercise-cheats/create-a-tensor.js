// An object and copied answers must not pass as a tensor creation.
// The shape checks still pass, so this remains a live grading counterexample.
const streamValues = [2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9];
const reading = { size: 12, shape: [12], isDisposed: true };
const shape = [12];
const values = [2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9];
const chartRows = [
  [2, 3, 4],
  [20, 18, 16],
  [5, 7, 6],
  [8, 8, 9],
];
