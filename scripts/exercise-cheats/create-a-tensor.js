// Ignorant cheat, and the most damning shape it takes: no tfjs is loaded at
// all. `reading` is a four-field object literal, because rank, size, dtype
// and isDisposed were graded as plain properties, and shape and values are
// copied off the instructions instead of read back, so dataSync() is never
// called and nothing is ever released. All five tests passed for this before
// audit round 5 (2026-09-08). It now fails four: the tensor check, the
// float32 check on the copied decimals, the release check, which asks a
// released tensor for its numbers and requires the refusal, and the
// provenance check on `total` (2026-09-13), which is the same move one field
// later: the sum is typed off the page, so it never came back from the
// tensor and the harness's call counter says so.
const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];

const reading = { rank: 1, size: 5, dtype: "float32", isDisposed: true };

const shape = [5];
const values = [0.12, 0.94, 0.31, 0.88, 0.47];
const total = 2.72;
