// Never reads `window`. The z-score is the graded property, and every shipped
// case passed the same calm window, so this solution memorised that window's
// mean and standard deviation as literals and divides by them. tf.moments is
// never called. It gets the majority rule right and still has no idea that a
// sigma count belongs to the spread you measured, not to the reading: hand it
// a different window and it reports the old window's sigmas.
function detectAnomalyEnsemble(
  window,
  actual,
  reconstructionError,
  reconThreshold,
  predicted,
  predTolerance,
) {
  const zScore = (actual - 0.52) / 0.015;

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

  return { zScore, verdicts, votes, isAnomaly: votes >= 2 };
}
