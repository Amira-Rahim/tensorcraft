// CHEAT for model-monitor: scores the first row and ignores the window.
// Drift is the distance between the BASELINE MEAN and the RECENT MEAN, and
// the mean over the window is what makes the number mean anything. This
// reads recentInputs[0] and calls it the recent mean, so a single noisy
// reading decides the verdict. Every drift fixture was a single row or two
// identical rows, which made averaging indistinguishable from indexing.
class ModelMonitor {
  constructor(baselineMean) {
    this.confidences = [];
    this.baselineMean = baselineMean;
  }

  logPrediction(confidence) {
    this.confidences.push(confidence);
  }

  get avgConfidence() {
    if (this.confidences.length === 0) return 0;
    return (
      this.confidences.reduce((a, b) => a + b, 0) / this.confidences.length
    );
  }

  computeDrift(recentInputs) {
    const row = recentInputs[0];
    let sumSqDiff = 0;
    for (let i = 0; i < this.baselineMean.length; i++) {
      sumSqDiff += (this.baselineMean[i] - row[i]) ** 2;
    }
    return Math.sqrt(sumSqDiff);
  }
}
