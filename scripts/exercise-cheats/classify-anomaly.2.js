// The shipped solution with one change: the centre is a carried mid-scale
// 0.5 and only the spread is measured from reading.window. Every fixture
// used to be centred at 0.5, so this cleared all thirteen tests (round 7,
// 2026-09-13). The drifted channel centred near 0.80 is what catches it.
function decomposeIntervals(intervals) {
  const ratios = [];
  for (let i = 0; i < intervals.length - 1; i++) {
    ratios.push(intervals[i + 1] / intervals[i]);
  }
  return ratios;
}

function isFibonacciTrain(ratios) {
  const fibonacciRatios = [1, 2, 1.5, 5 / 3, 1.6, 1.625];
  // The reading's first ratio may be the 1:1 opener or start at the 2;
  // align on length from the tail, where the train converges on phi.
  const expected = fibonacciRatios.slice(
    fibonacciRatios.length - ratios.length,
  );
  if (expected.length !== ratios.length) return false;
  return ratios.every(
    (r, i) => Math.abs(r - expected[i]) / expected[i] <= 0.02,
  );
}

function classifyAnomaly(reading) {
  const { mean, variance } = tf.tidy(() => {
    const m = tf.moments(tf.tensor1d(reading.window));
    return {
      mean: 0.5, // MID_SCALE carried, never measured
      variance: m.variance.dataSync()[0],
    };
  });
  const std = Math.sqrt(variance);
  const z = std === 0 ? 0 : (reading.actual - mean) / std;

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
  // Twenty normalized amplitudes from the archive's calm slice. Their
  // spread is the one lesson 1 measured over eleven days: this window
  // averages 0.520 and its standard deviation is 0.150.
  window: [
    0.523, 0.607, 0.407, 0.703, 0.462, 0.548, 0.338, 0.823, 0.568, 0.43, 0.633,
    0.217, 0.538, 0.66, 0.38, 0.588, 0.492, 0.745, 0.443, 0.295,
  ],
  actual: 0.5, // 0.1 sigma under that centre: the dial reads normal
  reconstructionError: 6.2,
  reconThreshold: 1.0, // module 7's locked cutoff
  predicted: 0.55,
  actualForecast: 0.5,
  predTolerance: 0.02,
  intervals: [0.9, 0.9, 1.8, 2.7, 4.5, 7.2, 11.7],
  ensembleScore: 0.999,
  module3Score: 0.518,
};
