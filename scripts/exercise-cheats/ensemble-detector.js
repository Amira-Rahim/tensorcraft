// Derives the z-score honestly from the window with tf.moments, and then gets
// two things wrong that no shipped fixture could see. The statistical verdict
// compares the SIGNED z-score against 3, so a reading far below the window's
// center scores a large negative number and the detector stays quiet: it has
// no idea that a sigma count is a distance and that a dip is as far out as a
// spike. And the LSTM verdict compares the SQUARED deviation against a
// tolerance quoted in raw amplitude units, which is a comparison between two
// different units that happens to answer correctly whenever the deviation is
// far from 1.
//
// (The earlier cheat here memorised the calm window's mean and std as literals
// and never called tf.moments. That one is still caught by the drifted-window
// fixture.)
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
    statistical: zScore > 3,
    autoencoder: reconstructionError > reconThreshold,
    lstm: (predicted - actual) * (predicted - actual) > predTolerance,
  };
  const votes = [
    verdicts.statistical,
    verdicts.autoencoder,
    verdicts.lstm,
  ].filter(Boolean).length;

  return { zScore, verdicts, votes, isAnomaly: votes >= 2 };
}
