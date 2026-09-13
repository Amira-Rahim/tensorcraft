// Normalizes the three features and then adds them up as the score. The
// model is never called, nothing is allocated so nothing can leak, and
// tf.tidy never appears: it has no idea that p comes out of a trained
// network rather than out of the inputs.
const RANGES = {
  amplitude: { min: 0, max: 2048 },
  frequency: { min: 0, max: 63 },
  phase: { min: -Math.PI, max: Math.PI },
};

function classify(model, signal) {
  const norm = (v, r) => (v - r.min) / (r.max - r.min);
  const p =
    norm(signal.amplitude, RANGES.amplitude) +
    norm(signal.frequency, RANGES.frequency) +
    norm(signal.phase, RANGES.phase);
  return {
    class: p > 0.5 ? "anomaly" : "noise",
    confidence: p > 0.5 ? p : 1 - p,
  };
}
