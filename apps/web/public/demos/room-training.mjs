import {
  FEATURES,
  validateMetadata,
  validateScore,
  vectorFor,
} from "../assignments/room-occupancy-v1/preprocessing.mjs";
import {
  baselinePrediction,
  metrics,
  validatePlan,
} from "../assignments/room-occupancy-v1/evaluation.mjs";

export const ROOM_DATA_SHA256 =
  "6c1885aad2b29fceaaad3a509f95290af7b6542901cbd9d2229b1b76df9011f0";
export const ALLOWED_EPOCHS = Object.freeze([1, 5, 15]);

const sourceArchiveSha256 =
  "4ae3f46aa98eedff564a9f6924d1635173e2fd2c816004342a9be93076d3a81a";
const features = ["temperature", "light", "co2"];
const baseline = {
  kind: "threshold",
  feature: "light",
  threshold: 100,
  direction: "gte",
};
const costs = { falsePositive: 1, falseNegative: 4 };

function checkedPeriods(data) {
  if (
    data?.version !== "room-occupancy-v1" ||
    data.source !== "https://doi.org/10.24432/C5X01N" ||
    data.sourceArchiveSha256 !== sourceArchiveSha256 ||
    !Array.isArray(data.rows) ||
    data.rows.length !== 2056
  ) {
    throw new Error("The recorded room dataset is missing or has changed.");
  }
  const ids = new Set();
  for (const [index, row] of data.rows.entries()) {
    if (
      !row ||
      typeof row.id !== "string" ||
      !row.id ||
      ids.has(row.id) ||
      typeof row.recordedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(row.recordedAt) ||
      (index > 0 && data.rows[index - 1].recordedAt >= row.recordedAt) ||
      ![0, 1].includes(row.occupied) ||
      !FEATURES.every((feature) => Number.isFinite(row[feature])) ||
      row.humidity < 0 ||
      row.humidity > 100 ||
      row.light < 0 ||
      row.co2 < 0 ||
      row.humidityRatio < 0
    ) {
      throw new Error(
        "Room readings must have unique IDs and ordered, valid measurements.",
      );
    }
    ids.add(row.id);
  }
  const train = data.rows.slice(0, 1200);
  const validation = data.rows.slice(1200, 1600);
  const test = data.rows.slice(1600);
  return validatePlan(
    {
      predictionTime: "Measurements available at the current reading.",
      split: {
        train: train.map((row) => row.id),
        validation: validation.map((row) => row.id),
        test: test.map((row) => row.id),
      },
      preprocessingFitIds: train.map((row) => row.id),
      splitReason: "Fixed chronological periods for a supplied demonstration.",
      costs,
      metricReason:
        "Illustrative costs of 1 per false alarm and 4 per missed occupied reading.",
      baseline,
      baselineReason:
        "A fixed light rule provides a comparison on the same validation rows.",
      validationChoices:
        "The final 456 readings remain reserved while exploring validation results.",
    },
    data.rows,
  );
}

// The default reproduces the published five-epoch maintainer fixture.
// Only the training period contributes to fitted parameters.
export async function runRoomTraining(tf, data, { epochs = 5, onEpoch } = {}) {
  if (!ALLOWED_EPOCHS.includes(epochs)) {
    throw new Error("Choose 1, 5 or 15 training epochs.");
  }
  if (onEpoch !== undefined && typeof onEpoch !== "function") {
    throw new Error("The training progress handler must be a function.");
  }
  if (tf?.version?.tfjs !== "4.22.0") {
    throw new Error("This example needs TensorFlow.js 4.22.0.");
  }
  const { train, validation, test } = checkedPeriods(data);
  if (!(await tf.setBackend("cpu"))) {
    throw new Error("The CPU training runtime could not start.");
  }
  await tf.ready();
  if (tf.getBackend() !== "cpu") {
    throw new Error("This example needs the CPU training backend.");
  }

  const mean = features.map(
    (feature) =>
      train.reduce((sum, row) => sum + row[feature], 0) / train.length,
  );
  const std = features.map(
    (feature, index) =>
      Math.sqrt(
        train.reduce((sum, row) => sum + (row[feature] - mean[index]) ** 2, 0) /
          train.length,
      ) || 1,
  );
  const metadata = validateMetadata({
    version: 1,
    features,
    mean,
    std,
    threshold: 0.5,
  });
  const losses = [];
  let model, optimizer, xs, ys, progressError;
  try {
    model = tf.sequential();
    model.add(
      tf.layers.dense({
        inputShape: [features.length],
        units: 1,
        activation: "sigmoid",
        kernelInitializer: tf.initializers.glorotUniform({ seed: 17 }),
      }),
    );
    optimizer = tf.train.adam(0.01);
    model.compile({ optimizer, loss: "binaryCrossentropy" });
    xs = tf.tensor2d(train.map((row) => vectorFor(row, metadata)));
    ys = tf.tensor2d(train.map((row) => [row.occupied]));
    await model.fit(xs, ys, {
      epochs,
      batchSize: 32,
      shuffle: false,
      verbose: 0,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          try {
            if (!Number.isFinite(logs?.loss)) {
              throw new Error("Training returned an invalid loss.");
            }
            losses.push(logs.loss);
            await onEpoch?.({ epoch: epoch + 1, epochs, loss: logs.loss });
          } catch (error) {
            // Let fit finish its tensor cleanup before reporting callback errors.
            progressError =
              error instanceof Error
                ? error
                : new Error("Training progress could not be delivered.");
            model.stopTraining = true;
          }
        },
      },
    });
    if (progressError) throw progressError;

    const scores = tf.tidy(() => {
      const inputs = tf.tensor2d(
        validation.map((row) => vectorFor(row, metadata)),
      );
      return Array.from(model.predict(inputs).dataSync()).map(validateScore);
    });
    const labels = validation.map((row) => row.occupied);
    const predictions = scores.map((score) =>
      Number(score >= metadata.threshold),
    );
    const baselinePredictions = validation.map((row) =>
      baselinePrediction(baseline, row),
    );
    const mistakes = validation
      .map((row, index) => ({
        id: row.id,
        recordedAt: row.recordedAt,
        temperature: row.temperature,
        light: row.light,
        co2: row.co2,
        occupied: row.occupied,
        score: scores[index],
        model: predictions[index],
        baseline: baselinePredictions[index],
      }))
      .filter(
        (row) => row.model !== row.occupied || row.baseline !== row.occupied,
      )
      .sort(
        (a, b) =>
          Number(b.model !== b.occupied && b.baseline !== b.occupied) -
          Number(a.model !== a.occupied && a.baseline !== a.occupied),
      )
      .slice(0, 8);
    const period = (rows) => ({
      from: rows[0].recordedAt,
      to: rows.at(-1).recordedAt,
    });
    return {
      runtimeVersion: tf.version.tfjs,
      backend: tf.getBackend(),
      epochs,
      losses,
      counts: {
        train: train.length,
        validation: validation.length,
        reserved: test.length,
      },
      periods: {
        train: period(train),
        validation: period(validation),
        reserved: period(test),
      },
      preprocessing: { features: [...features], mean, std },
      modelMetrics: metrics(labels, predictions, costs),
      baselineMetrics: metrics(labels, baselinePredictions, costs),
      mistakes,
    };
  } finally {
    xs?.dispose();
    ys?.dispose();
    model?.dispose();
    optimizer?.dispose();
  }
}
