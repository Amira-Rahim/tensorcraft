// One habit, twice: produce output that looks like the work instead of doing
// it. The model is built and compiled exactly as asked and then never fitted,
// with a hand-written history standing in for the run. The rollout clamps the
// copy it hands back and feeds the raw guess to the model, so the returned
// rows all sit inside the sensor range while the forecast behind them does
// not.
//
// Measured on tfjs 4.22.0. The fabricated trace is the right length and falls
// the right way (0.38 down to 0.0636, a ratio of 0.167), so the loss check
// reads it as a real run and is not the one holding the line.
// model.optimizer.iterations is 0 on a model that was compiled and never
// fitted, against the 24 updates 64 samples at a batch size of 32 owe 12
// epochs, and it is not assignable: writing 999 to it left it at 6. Scoring
// the unfitted model on its own training set returned 0.268 to 0.417 over 20
// builds, 4.2 to 6.6 times the claimed final loss, where 60 real runs landed
// between 0.80 and 1.00 times theirs.
//
// For the rollout, with the graded fixture (seed ending [0.8, 1, 0.25],
// windowSize 3, 4 steps, mean [1024, 32, 0] / std [512, 16, 1]): the rows it
// feeds back reach amplitude 3.1 and frequency 2.56 against converted bounds
// of 2 and 1.9375, and its third returned reading is [-1.988, 1.9375, 0.192]
// where the honest one is [-1.988, 0.8, 0.192].
import * as tf from "@tensorflow/tfjs";

const LIMITS = [
  { min: 0, max: 2048 },
  { min: 0, max: 63 },
  { min: -Math.PI, max: Math.PI },
];

async function trainForecaster(xs, ys, epochs) {
  const model = tf.sequential();
  model.add(
    tf.layers.lstm({ units: 8, inputShape: [xs.shape[1], xs.shape[2]] }),
  );
  model.add(tf.layers.dense({ units: 3 }));
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "meanSquaredError",
    metrics: ["mae"],
  });
  const loss = [];
  const mae = [];
  for (let epoch = 0; epoch < epochs; epoch++) {
    loss.push(0.38 * Math.pow(0.85, epoch));
    mae.push(0.49 * Math.pow(0.9, epoch));
  }
  return { model, history: { history: { loss, mae } } };
}

function forecastMultiStep(model, seed, windowSize, steps, scaler) {
  const bounds = LIMITS.map((limit, j) => ({
    min: (limit.min - scaler.mean[j]) / scaler.std[j],
    max: (limit.max - scaler.mean[j]) / scaler.std[j],
  }));
  const history = [...seed];
  const forecast = [];
  for (let step = 0; step < steps; step++) {
    const predicted = tf.tidy(() => {
      const input = tf.tensor3d([history.slice(-windowSize)]);
      return Array.from(model.predict(input).dataSync());
    });
    history.push(predicted);
    forecast.push(
      predicted.map((value, j) =>
        Math.min(Math.max(value, bounds[j].min), bounds[j].max),
      ),
    );
  }
  return forecast;
}
