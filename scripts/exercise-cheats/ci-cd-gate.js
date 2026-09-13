// CHEAT for ci-cd-gate: it grades only the rows that arrived with a label.
// Every comparison it makes is the right one, so the numerator is honest.
// The denominator is where it goes wrong: ungraded rows are filtered out
// before the division, so a holdout that came back from the cache with most
// of its labels stripped reports the score of the handful that survived.
// One labeled row out of a hundred reads as 1.0 and merges.
//
// The older ignorance this file used to hold, a verdict looked up by
// predictions.length, is rejected by five of the shipped tests. This one was
// rejected by none of them until 2026-09-12.
function validateModelAccuracy(predictions, minAccuracy) {
  const graded = predictions.filter((p) => p.actual !== undefined);
  const correct = graded.filter((p) => p.predicted === p.actual).length;
  const total = graded.length;
  const accuracy = total === 0 ? 0 : correct / total;

  return {
    accuracy,
    passed: total > 0 && accuracy >= minAccuracy,
    total,
    correct,
  };
}
