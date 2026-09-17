// Measures the rates but skips the spread investigation branch.
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
  const expectedPerDay = Math.round(0.0027 * readingsPerDay);

  return {
    oldAlertsPerDay,
    newAlertsPerDay,
    expectedPerDay,
    newBaseline: { mean, std },
    spreadRatio: std / currentBaseline.std,
    action: oldAlertsPerDay <= expectedPerDay ? "hold" : "evaluate-candidate",
  };
}
