// Skips the majority rule entirely: it ANDs two of the three detectors and
// drops the statistical vote from the decision, so the z-score it computes
// can never change the verdict. It has no idea that the point of an ensemble
// is that any two detectors out of three are enough.
function detectAnomalyEnsemble(
  window,
  actual,
  reconstructionError,
  reconThreshold,
  predicted,
  predTolerance,
) {
  const { mean, variance } = tf.tidy(() => {
    const m = tf.moments(tf.tensor1d(window));
    return { mean: m.mean.dataSync()[0], variance: m.variance.dataSync()[0] };
  });
  const std = Math.sqrt(variance);
  const zScore = std === 0 ? 0 : (actual - mean) / std;

  const verdicts = {
    statistical: Math.abs(zScore) > 3,
    autoencoder: reconstructionError > reconThreshold,
    lstm: Math.abs(predicted - actual) > predTolerance,
  };
  const votes = [
    verdicts.statistical,
    verdicts.autoencoder,
    verdicts.lstm,
  ].filter(Boolean).length;

  return {
    zScore,
    verdicts,
    votes,
    isAnomaly: verdicts.autoencoder && verdicts.lstm,
  };
}
