// Treats predTolerance as a PERCENTAGE of the reading instead of an absolute
// amplitude: the miss is divided by the reading before the comparison, so on
// a reading of 0.10 a miss of 0.03 fires (30% > 0.10) while on a reading of
// 1.00 the same miss stays quiet. Everything else is the reference solution.
// Found by the round-7 exercise reader (2026-09-13): every fixture then sat
// at 0.445, 0.52 or 1.00, where the division never crossed a cutoff. The
// quiet low-amplitude fixture is what catches it now.
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
    lstm: Math.abs(predicted - actual) / Math.abs(actual || 1) > predTolerance,
  };
  const votes = [
    verdicts.statistical,
    verdicts.autoencoder,
    verdicts.lstm,
  ].filter(Boolean).length;

  return { zScore, verdicts, votes, isAnomaly: votes >= 2 };
}
