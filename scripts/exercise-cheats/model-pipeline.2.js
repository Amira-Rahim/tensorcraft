// No stage receives the capture: classify() is called with nothing and the
// two downstream stages get an empty array, everything else by the book.
// Found by the round-7 exercise reader (2026-09-13): every stub in the
// suite ignored its first argument, so nothing noticed. The stubs that keep
// what they were handed are what catch it now.
async function pipeline(signal, classify, detectAnomaly, generateAlert) {
  const verdict = await classify();
  const confidence = verdict.confidence;
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error("classifier broke its contract");
  }
  const classification = ["noise", "anomaly"].includes(verdict.class)
    ? verdict.class
    : "unknown";
  const isAnomaly = await detectAnomaly([], classification);
  const alert = isAnomaly ? await generateAlert([], classification) : null;
  return { classification, confidence, isAnomaly, alert };
}
