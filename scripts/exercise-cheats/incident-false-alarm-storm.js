// Does the rate and ratio arithmetic and then guesses the cause from the ratio
// alone. It never opens sensorAuditLog and never looks at modelAge, so the two
// signatures that are actually evidence (a sensor was changed, the model is
// four months old) are invisible to it, and a storm with a logged sensor
// change gets filed as a real event. The ordering is the lesson: the audit log
// and the model age are checked before the ratio because they say WHY, while
// the ratio only says how loud. Escalation is also mis-sited here, fired off a
// made-up 50x line instead of reserved for the storm that matches no known
// signature.
function diagnoseStorm(currentAlerts, baselineAlerts, sensorAuditLog) {
  const rate = Math.round(currentAlerts.alertsPerHour * 10) / 10;
  const ratio =
    Math.round(
      (currentAlerts.alertsPerHour /
        Math.max(baselineAlerts.alertsPerHour, 0.1)) *
        10,
    ) / 10;
  if (ratio > 50) {
    return { rate, ratio, cause: "real-event", action: "escalate" };
  }
  return {
    rate,
    ratio,
    cause: "threshold-drift",
    action: "recalibrate-threshold",
  };
}
