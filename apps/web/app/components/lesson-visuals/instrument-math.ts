/** Small deterministic teaching calculations, independent of graded lesson data. */
export const READING_VALUES = [3, 7, 11, 5, 9, 13];
/** The first mission's five-reading excerpt, also used by create-a-tensor. */
export const FIRST_PACKET = [0.12, 0.94, 0.31, 0.88, 0.47];
export const NORMALIZATION_ROWS = [
  [20, 0.2],
  [22, 0.8],
  [24, 0.4],
  [26, 0.6],
];
export const SCREENING_CASES = [
  { score: 0.12, anomaly: false },
  { score: 0.28, anomaly: false },
  { score: 0.41, anomaly: true },
  { score: 0.19, anomaly: false },
  { score: 0.67, anomaly: false },
  { score: 0.83, anomaly: true },
  { score: 0.72, anomaly: true },
  { score: 0.36, anomaly: false },
  { score: 0.57, anomaly: true },
  { score: 0.46, anomaly: false },
  { score: 0.91, anomaly: true },
  { score: 0.62, anomaly: false },
];
export function screening(threshold: number) {
  const cells = SCREENING_CASES.map((c) => ({
    ...c,
    predicted: c.score >= threshold,
    category:
      c.score >= threshold
        ? c.anomaly
          ? "TP"
          : "FP"
        : c.anomaly
          ? "FN"
          : "TN",
  }));
  const count = (category: string) =>
    cells.filter((c) => c.category === category).length;
  return {
    cells,
    tp: count("TP"),
    fp: count("FP"),
    fn: count("FN"),
    tn: count("TN"),
  };
}
export function gradientStep(weight: number, rate: number) {
  return weight - rate * 2 * (weight - 3);
}
export const trainingTrace = Array.from({ length: 25 }, (_, epoch) => ({
  epoch,
  train: 0.78 * Math.exp(-epoch / 7) + 0.05,
  validation:
    0.66 * Math.exp(-epoch / 5) + 0.13 + Math.max(0, epoch - 12) ** 2 * 0.0025,
}));
export function softmax(values: number[]) {
  const largest = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - largest));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}
export function magnitudeSpectrum(values: number[]) {
  return Array.from({ length: values.length / 2 + 1 }, (_, bin) => {
    let re = 0,
      im = 0;
    values.forEach((v, i) => {
      const angle = (2 * Math.PI * bin * i) / values.length;
      re += v * Math.cos(angle);
      im -= v * Math.sin(angle);
    });
    return (
      (Math.hypot(re, im) / values.length) *
      (bin === 0 || bin === values.length / 2 ? 1 : 2)
    );
  });
}
export function teachingSignal(
  frequency: number,
  amplitude: number,
  start = 0,
  taper = false,
  onset = false,
) {
  return Array.from({ length: 64 }, (_, i) => {
    const t = (i + start) / 64;
    const signal =
      Math.sin(2 * Math.PI * 4 * t) +
      (onset && i + start < 64
        ? 0
        : amplitude * Math.sin(2 * Math.PI * frequency * t));
    return signal * (taper ? 0.5 * (1 - Math.cos((2 * Math.PI * i) / 63)) : 1);
  });
}
export function quantize(values: number[], bits: number) {
  const levels = 2 ** bits - 1;
  return values.map(
    (v) => (Math.round(((v + 1) / 2) * levels) / levels) * 2 - 1,
  );
}
export function kalmanUpdate(
  prediction: number,
  measurement: number,
  predictedVariance: number,
  measurementVariance: number,
) {
  const gain = predictedVariance / (predictedVariance + measurementVariance);
  return {
    gain,
    estimate: prediction + gain * (measurement - prediction),
    variance: (1 - gain) * predictedVariance,
  };
}
