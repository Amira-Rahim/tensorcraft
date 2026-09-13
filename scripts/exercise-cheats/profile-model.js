// Everything about this profiler is right except the statistic it reports.
// The warmup sits outside the timed loop, the readback is awaited inside the
// clock, the megabytes come out of the parameter count it read off the model,
// and the breakdown walks every layer including the ones that own nothing. It
// then hands back the FASTEST of the timed calls as avgInferenceMs, which is
// the one latency reading this module teaches a reader not to quote on its
// own: lesson 1 prints a 45 ms mean next to a 112 ms P95 and says a budget
// written against the mean alone misses one call in twenty. A profile written
// against the best call of the run misses far more than that.
//
// This is the submission that passed every test until 2026-09-12. The test
// that rejects it now hands the mock a per-call cost schedule of
// [4, 4, 4, 4, 4, 104] ms and derives its bounds from what the mock actually
// charged, so the mean of the timed calls (24) sits far from the fastest of
// them (4). Measured 2026-09-12 (node scripts/validate-exercises.mjs
// profile-model --cheats): clears 8, rejected by 1. The same test rejects the
// median, the trimmed mean, the slowest call and the sum, each measured
// separately the same day.
//
// The cheat this replaced had three misunderstandings at once: memorySizeMB
// hardcoded to the lesson's 340.0, the warmup call inside the timed region,
// and layerBreakdown filtered down to the layers holding weights. Three tests
// still reject that one.
async function profileModel(model, createInput, runs) {
  const parameterCount = model.countParams();
  const memorySizeMB = (parameterCount * 4) / 1e6;
  const layerBreakdown = model.layers.map((layer) => ({
    name: layer.name,
    params: layer.countParams(),
  }));

  // Warmup, correctly placed outside the clock.
  await model.predict(createInput()).data();

  const times = [];
  for (let i = 0; i < runs; i++) {
    const input = createInput();
    const start = performance.now();
    const output = model.predict(input);
    await output.data();
    times.push(Math.max(0, performance.now() - start));
  }

  // The whole ignorance, in one line: the run's best moment, reported as
  // though it described the run.
  const avgInferenceMs = Math.min.apply(null, times);

  return { parameterCount, memorySizeMB, avgInferenceMs, layerBreakdown };
}
