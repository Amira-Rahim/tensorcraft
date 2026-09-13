// Does the rate-times-volume arithmetic correctly and then throws away the
// only number that decides the hard case. It reads the alert load, sees the
// live baseline over-firing, and rolls forward every time. That is right when
// the world shifted and wrong when the world got noisier, which is the whole
// reason the spread is in the return contract: a baseline recomputed from a
// wider distribution goes quiet, and the readings it stops flagging are the
// ones worth catching. It still computes spreadRatio, because the shape of
// the answer is easy to satisfy without understanding what it is for.
function auditBaseline(recentNormalData, currentBaseline, readingsPerDay) {
  const flagged = (values, mean, std) =>
    values.filter((v) => Math.abs(v - mean) / std > 3).length;

  const n = recentNormalData.length;
  const mean = recentNormalData.reduce((a, b) => a + b, 0) / n;
  const variance =
    recentNormalData.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  const oldAlertsPerDay = Math.round(
    (flagged(recentNormalData, currentBaseline.mean, currentBaseline.std) / n) *
      readingsPerDay,
  );
  const newAlertsPerDay = Math.round(
    (flagged(recentNormalData, mean, std) / n) * readingsPerDay,
  );
  const promisedPerDay = Math.round(0.0027 * readingsPerDay);

  return {
    oldAlertsPerDay,
    newAlertsPerDay,
    promisedPerDay,
    newBaseline: { mean, std },
    spreadRatio: std / currentBaseline.std,
    action: oldAlertsPerDay <= promisedPerDay ? "hold" : "roll-forward",
  };
}
