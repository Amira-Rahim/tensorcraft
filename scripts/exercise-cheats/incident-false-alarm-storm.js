// Incorrectly uses the ratio alone and invents a nonzero baseline.
function diagnoseStorm(currentAlerts, baselineAlerts, sensorAuditLog) {
  const rate = Math.round(currentAlerts.alertsPerHour * 10) / 10;
  const ratio =
    Math.round(
      (currentAlerts.alertsPerHour /
        Math.max(0.1, baselineAlerts.alertsPerHour)) *
        10,
    ) / 10;
  return {
    rate,
    ratio,
    nextCheck: ratio >= 5 && ratio <= 20 ? "threshold" : "unexplained",
    action: ratio >= 5 && ratio <= 20 ? "review-threshold" : "escalate",
  };
}
