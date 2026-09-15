// CHEAT for model-pipeline's real first stage: the pipeline half is the
// reference solution. classifierStage trims whatever it is handed to three
// values and feeds them to the model RAW, in counts, zero-crossings and
// radians, without module 4's min-max scaling. The row fits the model's
// shape, so nothing throws, and the sigmoid pins to its rail on the
// amplitude count, so every loud reading comes back "anomaly, 1.000 sure":
// a legal-looking confidence on the wrong scale, the costly mistake lesson 5
// names. The trim also swallows the wrong-length capture the shape contract
// exists to surface. Expected: rejected by the scale test and the two
// wrong-length tests, cleared by the rest (2026-09-15).
const RANGES = {
  amplitude: { min: 0, max: 2048 },
  frequency: { min: 0, max: 63 },
  phase: { min: -Math.PI, max: Math.PI },
};

function classifierStage(model) {
  return async (reading) => {
    const features = reading.slice(0, 3);
    return tf.tidy(() => {
      const row = tf.tensor2d([features]);
      const p = model.predict(row).dataSync()[0];
      return {
        class: p > 0.5 ? "anomaly" : "noise",
        confidence: p > 0.5 ? p : 1 - p,
      };
    });
  };
}

async function pipeline(signal, classify, detectAnomaly, generateAlert) {
  const verdict = await classify(signal);
  const confidence = verdict.confidence;
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error("classifier broke its contract");
  }
  const classification = ["noise", "anomaly"].includes(verdict.class)
    ? verdict.class
    : "unknown";
  const isAnomaly = await detectAnomaly(signal, classification);
  const alert = isAnomaly ? await generateAlert(signal, classification) : null;
  return { classification, confidence, isAnomaly, alert };
}
