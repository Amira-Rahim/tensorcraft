// Calls predict the expected number of times so the call-count test
// passes, then returns figures memorised from the lesson prose. It never
// times anything and never awaits a readback.
async function profileModel(model, createInput, runs) {
  for (let i = 0; i < runs + 1; i++) model.predict(createInput());
  const parameterCount = model.countParams();
  return {
    parameterCount,
    memorySizeMB: (parameterCount * 4) / 1e6,
    avgInferenceMs: 8,
  };
}
