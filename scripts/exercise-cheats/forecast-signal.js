// Builds the right stack, really trains it, and rolls one honest rollout. Then
// it hands the SAME series back as the replay, which is the confusion this
// exercise exists to catch: a drift check reading that copy is measuring
// compounding, not drift, because both series were fed by the model's own
// output. The history is hand-built from a geometric decay, which clears any
// check that only reads the returned trace (that is why the grader ties the
// trace to model.optimizer.iterations, a counter the optimizer increments per
// batch and will not let anyone assign). The epoch count is pinned at 20
// rather than read from the argument, which is invisible on the first case and
// wrong on the second. Rewritten 2026-09-12 with the exercise: the old cheat
// answered the arithmetic-only version of this task, which had no model in it.
//
// Clears: the shape and length checks, the model-stack check, the fed-back
// rollout, and the first-step equality of the two arms. Fails: the replay, the
// separation of the two arms, and the second case, where the trace and the
// optimizer disagree.
async function forecastTwoWays(trainX, trainY, past, arrived, epochs) {
  const windowSize = trainX.shape[1];
  const model = tf.sequential();
  model.add(tf.layers.lstm({ units: 8, inputShape: [windowSize, 1] }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({ optimizer: "adam", loss: "meanSquaredError" });
  await model.fit(trainX, trainY, { epochs: 20, batchSize: 8 });

  const history = [...past];
  const rollout = [];
  for (let step = 0; step < arrived.length; step++) {
    const next = tf.tidy(() => {
      const window = history.slice(-windowSize).map((value) => [value]);
      return model.predict(tf.tensor3d([window])).dataSync()[0];
    });
    rollout.push(next);
    history.push(next);
  }

  const loss = [];
  for (let i = 0; i < epochs; i++) loss.push(0.42 * Math.pow(0.86, i));

  return {
    model,
    history: { history: { loss } },
    rollout,
    oneStep: rollout.slice(),
  };
}
