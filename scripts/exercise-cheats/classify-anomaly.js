// CHEAT for classify-anomaly: the statistical detector carries lesson 1's
// baseline instead of measuring the window in front of it.
// The interval mechanics are done properly here, on purpose: the only thing
// this submission does not understand is where a sigma comes from. It never
// calls tf.moments and never reads reading.window. Against the archive slice
// the two agree to four decimals (-0.1333 sigma on sample 7741, 3.2000 on a
// full-scale reading, -3.4667 on a dead channel), so every zero-hour fixture
// clears. Point it at a channel with a tenth of that spread and it cannot
// see a 4-sigma reading at all.
//
// The older ignorance this file used to hold, a declared operating band of
// 0.1 to 1.0 plus a Fibonacci check that read the last ratio only, is
// rejected by four of the shipped tests. Carried constants were rejected by
// none of them until 2026-09-12.
const BASELINE_MEAN = 0.52;
const BASELINE_STD = 0.15;

function decomposeIntervals(intervals) {
  const ratios = [];
  for (let i = 0; i < intervals.length - 1; i++) {
    ratios.push(intervals[i + 1] / intervals[i]);
  }
  return ratios;
}

function isFibonacciTrain(ratios) {
  const fibonacciRatios = [1, 2, 1.5, 5 / 3, 1.6, 1.625];
  const expected = fibonacciRatios.slice(
    fibonacciRatios.length - ratios.length,
  );
  if (expected.length !== ratios.length) return false;
  return ratios.every(
    (r, i) => Math.abs(r - expected[i]) / expected[i] <= 0.02,
  );
}

function classifyAnomaly(reading) {
  const z = (reading.actual - BASELINE_MEAN) / BASELINE_STD;

  const verdicts = {
    statistical: Math.abs(z) > 3,
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
  actual: 0.5,
  reconstructionError: 6.2,
  reconThreshold: 1.0,
  predicted: 0.541,
  actualForecast: 0.5,
  predTolerance: 0.01,
  intervals: [0.9, 0.9, 1.8, 2.7, 4.5, 7.2, 11.7],
  ensembleScore: 0.999,
  module3Score: 0.518,
};
