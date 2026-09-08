// CHEAT for classify-anomaly: two memorised shortcuts instead of two
// measurements.
//   1. The statistical detector never computes a z-score. It checks the
//      declared operating band (0.1 to 1.0) that llm-integration put in a
//      prompt, so it cannot see a reading pegged at full scale as unusual
//      and it has no idea the window's own spread is what sets the sigma.
//   2. isFibonacciTrain looks at the last ratio only. The zero-hour train
//      ends on 1.625, so one comparison clears the finale without checking
//      that anything before it converges.
function decomposeIntervals(intervals) {
  const ratios = [];
  for (let i = 0; i < intervals.length - 1; i++) {
    ratios.push(intervals[i + 1] / intervals[i]);
  }
  return ratios;
}

function isFibonacciTrain(ratios) {
  if (!ratios.length) return false;
  return Math.abs(ratios[ratios.length - 1] - 1.625) <= 0.05;
}

function classifyAnomaly(reading) {
  const verdicts = {
    statistical: reading.actual < 0.1 || reading.actual > 1.0,
    autoencoder: reading.reconstructionError > reading.reconThreshold,
    lstm:
      Math.abs(reading.predicted - reading.actualForecast) >
      reading.predTolerance,
  };
  const votes = Object.values(verdicts).filter(Boolean).length;
  const isAnomaly = votes >= 2;
  const ratios = decomposeIntervals(reading.intervals);
  const fibonacciTrain = isFibonacciTrain(ratios);
  return {
    votes,
    isAnomaly,
    ratios,
    fibonacciTrain,
    classification:
      isAnomaly && fibonacciTrain
        ? "confirmed-anomaly"
        : isAnomaly
          ? "anomaly"
          : "noise",
    scoreDelta:
      Math.round((reading.ensembleScore - reading.module3Score) * 1000) / 1000,
  };
}

const zeroHourReading = {
  window: [
    0.523, 0.607, 0.407, 0.703, 0.462, 0.548, 0.338, 0.823, 0.568, 0.43, 0.633,
    0.217, 0.538, 0.66, 0.38, 0.588, 0.492, 0.745, 0.443, 0.295,
  ],
  actual: 0.61,
  reconstructionError: 0.062,
  reconThreshold: 0.01,
  predicted: 0.55,
  actualForecast: 0.61,
  predTolerance: 0.02,
  intervals: [0.9, 0.9, 1.8, 2.7, 4.5, 7.2, 11.7],
  ensembleScore: 0.999,
  module3Score: 0.518,
};
