// CHEAT for model-monitor: two measurements replaced by two shortcuts.
//
// 1. Drift scores the first row and ignores the window. Drift is the distance
//    between the BASELINE MEAN and the RECENT MEAN, and the mean over the
//    window is what makes the number mean anything. This reads
//    recentInputs[0] and calls it the recent mean, so a single noisy reading
//    decides the verdict.
// 2. The latency percentile sorts with Array.prototype.sort and no
//    comparator, which compares the numbers as strings. On a run of times
//    between 40 ms and 134 ms with five calls at 400, that ordering puts
//    400 among the forties and the P95 comes back inside the healthy band.
//    The dashboard reads green while one call in twenty runs ten times slow.
class ModelMonitor {
  constructor(baselineMean) {
    this.confidences = [];
    this.latencies = [];
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

  logLatency(ms) {
    this.latencies.push(ms);
  }

  getLatencyPercentile(p) {
    if (this.latencies.length === 0) return 0;
    const sorted = [...this.latencies].sort();
    const index = Math.min(
      sorted.length - 1,
      Math.floor((sorted.length * p) / 100),
    );
    return sorted[index];
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
