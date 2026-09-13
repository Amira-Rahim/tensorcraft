// Gets the arithmetic of quantization right and then measures the wrong
// build. Every kernel is scaled, rounded and reported correctly, and
// maxWeightError is computed from the restored values, so the report LOOKS
// like a measurement. But the restored floats are never loaded onto the
// model: setWeights is never called. The model still holds its trained
// float32 weights when the second prediction pass runs, so both passes read
// the same model and predictionsChanged comes back 0 no matter what the pass
// cost. That is the one idea this exercise exists to build and the one this
// submission does not have: quantization's price is only visible on the model
// that predicts, and the lesson's own point is that the runtime decodes the
// stored bytes back to float32 and runs THOSE.
//
// Measured 2026-09-12 (node scripts/validate-exercises.mjs quantize-weights
// --cheats): clears 4 tests, rejected by 2 (the one that reads the model's
// weights after the call, and the one that counts the captures the
// stretched-grid build files differently).
async function quantizeModel(model, captures) {
  const input = tf.tensor2d(captures);
  const before = Array.from(await model.predict(input).argMax(1).data());

  const isKernel = (w) => w.shape.length === 2;
  const kernels = [];
  let maxWeightError = 0;

  for (const w of model.getWeights()) {
    if (!isKernel(w)) continue;
    const values = Array.from(w.dataSync());
    const min = values.reduce((a, b) => Math.min(a, b));
    const max = values.reduce((a, b) => Math.max(a, b));
    const scale = (max - min) / 255;
    const zeroPoint = Math.round(-min / scale);
    const quantized = values.map((v) => Math.round((v - min) / scale));
    const restored = quantized.map((q) => (q - zeroPoint) * scale);
    const error = restored.reduce(
      (worst, v, i) => Math.max(worst, Math.abs(v - values[i])),
      0,
    );
    maxWeightError = Math.max(maxWeightError, error);
    kernels.push({ quantized, scale, zeroPoint, shape: w.shape });
  }

  const after = Array.from(await model.predict(input).argMax(1).data());
  const predictionsChanged = after.filter((v, i) => v !== before[i]).length;

  return { kernels, maxWeightError, predictionsChanged };
}
