// Builds the exact stack the instructions describe, compiles it correctly,
// and fits it on the whole archive. The `flagged` argument is accepted and
// never read: this submission's only theory is that more rows is more signal,
// which is lesson 1's BossBeat "train on everything" option written out in
// code. Every structural check reads correctly (four dense layers, the 2-unit
// bottleneck, relu on the inner stages, mse loss), the fit really runs, and
// the history really comes from that fit.
//
// What it has no idea about is the thing module 7 lesson 2 calls its KEY
// INSIGHT: an autoencoder detects an anomaly only because the anomaly was
// kept OUT of what it learned. Trained on all 72 rows, this model learns the
// tainted family alongside the calm one and rebuilds a tainted reading about
// as well as a calm one, which is the Epilogue's 1.4x baseline.
//
// (The earlier cheat here nailed every weight to zero and froze the layers.
// That one is still caught, by the loss-ratio and separation checks.)
async function trainNormalityModel(archive, flagged) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 4, activation: "relu", inputShape: [8] }));
  model.add(tf.layers.dense({ units: 2, activation: "relu" }));
  model.add(tf.layers.dense({ units: 4, activation: "relu" }));
  model.add(tf.layers.dense({ units: 8 }));
  model.compile({ optimizer: "adam", loss: "meanSquaredError" });
  const xs = tf.tensor2d(archive);
  const history = await model.fit(xs, xs, {
    epochs: 400,
    batchSize: 16,
    verbose: 0,
  });
  xs.dispose();
  return { model, history };
}
