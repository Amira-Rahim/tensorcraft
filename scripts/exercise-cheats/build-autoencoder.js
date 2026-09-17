// Misconception: fits flagged rows as normal reconstruction targets.
import * as tf from "@tensorflow/tfjs";
const FIT_OPTIONS = { epochs: 400, batchSize: 16, verbose: 0 };
async function trainNormalityModel(archive, flagged, providedModel) {
  const trainingRows = archive;
  const model = providedModel || tf.sequential();
  if (!providedModel) {
    model.add(
      tf.layers.dense({ units: 4, activation: "relu", inputShape: [8] }),
    );
    model.add(tf.layers.dense({ units: 2, activation: "relu" }));
    model.add(tf.layers.dense({ units: 4, activation: "relu" }));
    model.add(tf.layers.dense({ units: 8 }));
    model.compile({ optimizer: "adam", loss: "meanSquaredError" });
  }
  const xs = tf.tensor2d(trainingRows);
  const history = await model.fit(xs, xs, FIT_OPTIONS);
  xs.dispose();
  return { model, history };
}
