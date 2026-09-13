// A real sweep that counts tp, fp, fn and tn, and then chooses the cutoff by
// plain ACCURACY, the one misunderstanding lesson 4 exists to prevent. The f1
// it reports is the honest F1 of the cutoff accuracy picked, so nothing here
// is faked: the arithmetic is right and the criterion is wrong. Anomalies are
// rare, so accuracy is dominated by the normal rows and rewards a cutoff that
// stays quiet; the ties go to the first candidate here, which is how this got
// through the original fixtures.
//
// (The earlier cheat here returned the middle candidate with f1: 1 and never
// looked at the data. That one is still caught by the overlapping fixture.)
function findBestThreshold(errors, labels, candidates) {
  let best = { threshold: 0, f1: 0 };
  let bestAccuracy = -1;

  for (const t of candidates) {
    let tp = 0,
      fp = 0,
      fn = 0,
      tn = 0;
    for (let i = 0; i < errors.length; i++) {
      const predicted = errors[i] > t;
      if (predicted && labels[i]) tp++;
      else if (predicted && !labels[i]) fp++;
      else if (!predicted && labels[i]) fn++;
      else tn++;
    }
    const accuracy = (tp + tn) / errors.length;
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1 = (2 * precision * recall) / (precision + recall) || 0;
    if (accuracy > bestAccuracy) {
      bestAccuracy = accuracy;
      best = { threshold: t, f1 };
    }
  }

  return best;
}
