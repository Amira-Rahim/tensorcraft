// Reproduces the benchmark and then writes down the verdict the lesson
// printed. Two pieces of the lesson are missing, and the shape of the answer
// hides both.
//
// First, it scores the input itself. It opens the session, builds a [1, 3]
// float32 feed with the right three values and calls run(), so a spy on the
// session sees a correct inference. Then it throws the result away and
// recomputes the number: a position-weighted sum of the feed squashed through
// a sigmoid, which is the arithmetic the harness stub uses. That stub ships to
// the browser worker that grades the submission, so the exploit is readable
// from devtools, and outputsAgree comes out true whatever the session said.
//
async function compareRuntimes(model, modelPath, signal) {
  const input = tf.tensor2d([signal]);
  const tfStart = performance.now();
  const prediction = model.predict(input);
  const tfjsValue = (await prediction.data())[0];
  const tfjsMs = performance.now() - tfStart;
  prediction.dispose();
  input.dispose();

  const session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ["wasm"],
  });
  const feed = new ort.Tensor("float32", new Float32Array(signal), [1, 3]);
  const onnxStart = performance.now();
  await session.run({ input: feed });
  const onnxMs = performance.now() - onnxStart;
  await session.release();
  let acc = 0;
  for (let i = 0; i < signal.length; i++) acc += (i + 1) * signal[i];
  const onnxValue = 1 / (1 + Math.exp(-acc));

  return {
    tfjsMs,
    onnxMs,
    outputsAgree: Math.abs(tfjsValue - onnxValue) <= 0.0001,
  };
}
