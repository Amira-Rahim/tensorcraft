// A real sweep with the right arithmetic and a recall-first criterion. It
// ranks the candidates by F2, which counts recall four times as heavily as
// precision, and then reports the honest F1 of whichever cutoff F2 picked, so
// every number it returns is true of the cutoff it chose. What it never does
// is weigh a false alarm against a missed anomaly the way lesson 4 asks: it
// has quietly decided that catching everything is worth flooding the pager,
// and it still labels the number it returns f1.
//
// The four original fixtures were built so that accuracy and recall pick the
// wrong candidate, and F2 agrees with F1 on all four, so this cleared them.
// Caught by 'weighs precision and recall equally, so a recall-first ranking
// loses' (round 7, 2026-09-13), where the low cutoff catches every anomaly at
// the price of five false alarms: F2 picks it, F1 does not.
function findBestThreshold(errors, labels, candidates) {
  let best = { threshold: 0, f1: 0 };
  let bestF2 = -1;

  for (const t of candidates) {
    let tp = 0,
      fp = 0,
      fn = 0;
    for (let i = 0; i < errors.length; i++) {
      const predicted = errors[i] > t;
      if (predicted && labels[i]) tp++;
      else if (predicted && !labels[i]) fp++;
      else if (!predicted && labels[i]) fn++;
    }
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1 = (2 * precision * recall) / (precision + recall) || 0;
    const f2 = (5 * precision * recall) / (4 * precision + recall) || 0;
    if (f2 > bestF2) {
      bestF2 = f2;
      best = { threshold: t, f1 };
    }
  }

  return best;
}
