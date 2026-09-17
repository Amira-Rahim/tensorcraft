// Misconception: returns the self-fed rollout as the observation-fed replay.
async function forecastTwoWays(
  trainX,
  trainY,
  past,
  arrived,
  epochs,
  providedModel,
) {
  const windowSize = trainX.shape[1];
  const model = providedModel || tf.sequential();
  if (!providedModel) {
    model.add(tf.layers.lstm({ units: 8, inputShape: [windowSize, 1] }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({ optimizer: "adam", loss: "meanSquaredError" });
  }
  const history = await model.fit(trainX, trainY, { epochs, batchSize: 8 });
  const predictFrom = (readings) =>
    tf.tidy(() => {
      const window = readings.slice(-windowSize).map((value) => [value]);
      return model.predict(tf.tensor3d([window])).dataSync()[0];
    });
  const fedBack = [...past];
  const rollout = [];
  for (let step = 0; step < arrived.length; step++) {
    const next = predictFrom(fedBack);
    rollout.push(next);
    fedBack.push(next);
  }
  const oneStep = [];
  for (let step = 0; step < arrived.length; step++) {
    oneStep.push(rollout[step]);
  }
  return { model, history, rollout, oneStep };
}
