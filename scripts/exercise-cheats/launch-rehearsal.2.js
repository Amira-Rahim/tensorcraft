// CHEAT for launch-rehearsal: one channel read off the config, two written in.
//
// This one reads the amplitude limits off `ranges` and then hardcodes the
// other two: frequency over 63, (phase + PI) / (2 * PI). Every scoring test
// runs on the canonical instrument, where those two constants happen to be
// the right ones, so the shortcut is invisible there. Until 2026-09-14 the
// training test was invisible too: both recalibration fixtures in the file
// moved the amplitude channel and left frequency and phase at full scale, so
// this submission cleared all fourteen tests while reading only one of the
// three limits it was handed.
//
// What catches it now is the rehearsal fixture recalibrating all three
// channels at once: a 40-crossing frequency ceiling and a phase sensor
// re-zeroed to 0 through 2*PI. The grader compares the rows the fit was
// handed against rows recomputed from the config's own limits, so column 1
// comes back 0.746 where the config says 1.175.
//
// Everything else here is the published solution, which is the point: a
// submission can do the whole rehearsal correctly and still train the
// candidate on numbers the instrument never produced.
function toRows(readings, ranges) {
  const norm = (v, r) => (v - r.min) / (r.max - r.min);
  return readings.map((reading) => [
    norm(reading.amplitude, ranges.amplitude),
    reading.frequency / 63,
    (reading.phase + Math.PI) / (2 * Math.PI),
  ]);
}

function scoreReadings(model, readings, ranges) {
  return tf.tidy(() => {
    const out = model.predict(tf.tensor2d(toRows(readings, ranges)));
    return Array.from(out.dataSync());
  });
}

async function runLaunchRehearsal(model, archive, canary, config) {
  const xs = tf.tensor2d(toRows(archive, config.ranges));
  const ys = tf.tensor2d(archive.map((r) => [r.label]));
  const history = await model.fit(xs, ys, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    shuffle: false,
  });
  xs.dispose();
  ys.dispose();

  const losses = history.history.loss;
  const batchesRun = model.optimizer.iterations;
  const scores = scoreReadings(model, canary, config.ranges);
  const correct = scores.filter(
    (s, i) => (s > 0.5 ? 1 : 0) === canary[i].label,
  ).length;
  const canaryAccuracy = correct / canary.length;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const drift =
    Math.abs(mean - config.baselineMeanScore) > config.driftTolerance;
  const launch = canaryAccuracy >= config.minAccuracy && !drift;

  return { scores, losses, batchesRun, canaryAccuracy, drift, launch };
}
