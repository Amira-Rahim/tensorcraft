// Misconception: reports the fastest measured call as the average.
async function profileModel(
  model,
  createInput,
  runs,
  now = () => performance.now(),
) {
  if (!Number.isInteger(runs) || runs < 1) throw new Error("Invalid run count");
  const parameterCount = model.countParams();
  const memorySizeMB = (parameterCount * 4) / 1e6;
  // Every layer, not only the ones holding weights: a row reading 0 is
  // how the report shows a reshape owns nothing.
  const layerBreakdown = model.layers.map((layer) => ({
    name: layer.name,
    params: layer.countParams(),
  }));
  const before = tf.memory().numTensors;
  // The warmup call pays the one-off compilation cost. It is not timed,
  // so that cost does not land in the average below, and its pair is
  // released like every other.
  const warmInput = createInput();
  const warmOutput = model.predict(warmInput);
  await warmOutput.data();
  warmOutput.dispose();
  warmInput.dispose();
  const times = [];
  for (let i = 0; i < runs; i++) {
    const input = createInput();
    const start = now();
    const output = model.predict(input);
    await output.data();
    times.push(Math.max(0, now() - start));
    output.dispose();
    input.dispose();
  }
  const avgInferenceMs = Math.min(...times);
  const leakedTensors = tf.memory().numTensors - before;
  return {
    parameterCount,
    memorySizeMB,
    avgInferenceMs,
    layerBreakdown,
    leakedTensors,
  };
}
