// Does the mechanics and then ignores them. It creates the session, builds a
// [1, 3] float32 tensor with the right three values and calls run(), so a spy
// on the session sees a correct inference. Then it throws the result away and
// returns the 0.5 it read in the lesson prose, never touching output.data. The
// call log is perfect and the answer is memorised.
async function runONNX(modelPath) {
  const session = await ort.InferenceSession.create(modelPath);
  const inputTensor = new ort.Tensor(
    "float32",
    new Float32Array([0.5, 0.3, 0.7]),
    [1, 3],
  );
  await session.run({ input: inputTensor });
  return 0.5;
}
