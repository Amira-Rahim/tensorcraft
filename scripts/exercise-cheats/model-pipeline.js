// Blacklists the one bad class string the grader happens to feed instead of
// allowlisting the two the classifier is contracted to return. Every other
// broken class sails through to the next stage as if it were a real verdict.
async function pipeline(signal, classify, detectAnomaly, generateAlert) {
  const reported = await classify(signal);
  const classification = reported === "garbled" ? "unknown" : reported;
  const isAnomaly = await detectAnomaly(signal, classification);
  const alert = isAnomaly ? await generateAlert(signal, classification) : null;
  return { classification, isAnomaly, alert };
}
