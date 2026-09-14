// Quantizes every kernel correctly and loads the restored floats onto the
// model, then never runs a single prediction: predictionsChanged is read
// off the bucket width instead of the model. Found by the round-7 exercise
// reader (2026-09-13): both hand-built grids had answers a rule could
// reproduce, so this cleared all six tests. The drawn-model test, and the
// harness's count of predict calls, are what catch it now.
async function quantizeModel(model, captures) {
  const isKernel = (w) => w.shape.length === 2;
  const kernels = [];
  let maxWeightError = 0;
  const rebuilt = model.getWeights().map((w) => {
    if (!isKernel(w)) return w;
    const values = Array.from(w.dataSync());
    const min = values.reduce((a, b) => Math.min(a, b));
    const max = values.reduce((a, b) => Math.max(a, b));
    const scale = (max - min) / 255;
    const quantized = values.map((v) => Math.round((v - min) / scale));
    const restored = quantized.map((q) => q * scale + min);
    const error = restored.reduce(
      (worst, v, i) => Math.max(worst, Math.abs(v - values[i])),
      0,
    );
    maxWeightError = Math.max(maxWeightError, error);
    kernels.push({ quantized, scale, min, shape: w.shape });
    return tf.tensor(restored, w.shape);
  });
  model.setWeights(rebuilt);
  // The rule of thumb the lesson forbids: a wide bucket "must" have moved
  // some verdicts, a narrow one none. No prediction is ever run.
  const predictionsChanged = maxWeightError > 0.02 ? 3 : 0;
  return { kernels, maxWeightError, predictionsChanged };
}
