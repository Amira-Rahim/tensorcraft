// Misconception: uses textual latency order and the first recent row instead of the mean.
class ModelMonitor {
  confidences = [];
  latencies = [];
  baselineMean;
  constructor(baselineMean) {
    if (baselineMean.length === 0 || !baselineMean.every(Number.isFinite))
      throw new Error("Invalid baseline");
    this.baselineMean = baselineMean.slice();
  }
  logPrediction(confidence) {
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)
      throw new Error("Invalid confidence");
    this.confidences.push(confidence);
  }
  get avgConfidence() {
    if (this.confidences.length === 0) return null;
    return (
      this.confidences.reduce((a, b) => a + b, 0) / this.confidences.length
    );
  }
  logLatency(ms) {
    if (!Number.isFinite(ms) || ms < 0) throw new Error("Invalid latency");
    this.latencies.push(ms);
  }
  getLatencyPercentile(p) {
    if (!Number.isFinite(p) || p < 0 || p > 100)
      throw new Error("Invalid percentile");
    if (this.latencies.length === 0) return null;
    const sorted = [...this.latencies].sort();
    const index = Math.min(
      sorted.length - 1,
      Math.floor((sorted.length * p) / 100),
    );
    return sorted[index];
  }
  computeDrift(recentInputs) {
    if (recentInputs.length === 0) return null;
    const featureCount = this.baselineMean.length;
    if (
      !recentInputs.every(
        (row) => row.length === featureCount && row.every(Number.isFinite),
      )
    )
      throw new Error("Invalid feature row");
    const recentMean = new Array(featureCount).fill(0);
    for (const row of recentInputs) {
      for (let i = 0; i < featureCount; i++) {
        recentMean[i] = recentInputs[0][i];
      }
    }
    let sumSqDiff = 0;
    for (let i = 0; i < featureCount; i++) {
      sumSqDiff += (this.baselineMean[i] - recentMean[i]) ** 2;
    }
    return Math.sqrt(sumSqDiff);
  }
}
