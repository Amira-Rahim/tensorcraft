// Repairs the confidence instead of refusing it. Out-of-range values are
// clamped into 0..1 and non-numbers become 0, so the run continues and every
// later stage quotes a certainty the classifier never reported: a NaN is
// presented to the operator as "0.000 sure", a 2 as "1.000 sure". The class
// allowlist here is correct. What it gets wrong is the judgement the exercise
// exists for, which broken contracts have an honest stand-in and which have
// none.
async function pipeline(signal, classify, detectAnomaly, generateAlert) {
  const verdict = await classify(signal);
  const raw = Number(verdict.confidence);
  const confidence = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0;
  const classification = ["noise", "anomaly"].includes(verdict.class)
    ? verdict.class
    : "unknown";
  const isAnomaly = await detectAnomaly(signal, classification);
  const alert = isAnomaly ? await generateAlert(signal, classification) : null;
  return { classification, confidence, isAnomaly, alert };
}
