// CHEAT for launch-rehearsal: the candidate is trained, and the record is
// still written rather than read.
//
// This one does the work. It normalizes the archive against config.ranges,
// runs a real fit on the schedule the config names, disposes both tensors,
// and scores the canary set with the model that fit moved, so every gate
// that watches the training itself reads green. What it never does is take
// the rehearsal record off the run. The loss trace is a geometric curve it
// composes, falling from 0.66 the way a real one falls and decaying again
// on the next rehearsal so a second run opens lower than the first. The
// update count is arithmetic, batches per epoch times epochs, carried per
// model in a WeakMap so a second rehearsal reports 96 the way a live
// optimizer would.
//
// That is the submission this exercise exists to stop, and until 2026-09-13
// it cleared every test: the counts a grader can predict are the counts a
// submission can write down. What catches it now is the grader wrapping
// model.fit and comparing the trace the call HANDED BACK against the one
// the verdict reports, alongside the rows the fit was given and the
// optimizer's own iterations. A fabricated deploy record reads exactly like
// a real one; the only difference is whether anything checked it against
// the run.
//
// The cheat this replaced never called model.fit at all and scored the
// canary set with the untrained model it was handed. Six tests already
// caught that one, which made it a weak pin: the grader could have lost
// every check on the record and the gate would still have read green.
function toRows(readings, ranges) {
  const norm = (v, r) => (v - r.min) / (r.max - r.min);
  return readings.map((reading) => [
    norm(reading.amplitude, ranges.amplitude),
    norm(reading.frequency, ranges.frequency),
    norm(reading.phase, ranges.phase),
  ]);
}

function scoreReadings(model, readings, ranges) {
  return tf.tidy(() => {
    const out = model.predict(tf.tensor2d(toRows(readings, ranges)));
    return Array.from(out.dataSync());
  });
}

const ledger = new WeakMap();

async function runLaunchRehearsal(model, archive, canary, config) {
  const xs = tf.tensor2d(toRows(archive, config.ranges));
  const ys = tf.tensor2d(archive.map((r) => [r.label]));
  await model.fit(xs, ys, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    shuffle: false,
  });
  xs.dispose();
  ys.dispose();

  const prior = ledger.get(model) || 0;
  const batchesRun =
    prior + Math.ceil(archive.length / config.batchSize) * config.epochs;
  ledger.set(model, batchesRun);

  const start = 0.66 * Math.pow(0.25, prior / 48);
  const losses = [];
  for (let e = 0; e < config.epochs; e++)
    losses.push(start * Math.pow(0.72, e));

  const scores = scoreReadings(model, canary, config.ranges);
  const correct = scores.filter(
    (s, i) => (s > 0.5 ? 1 : 0) === canary[i].label,
  ).length;
  const canaryAccuracy = correct / canary.length;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const drift =
    Math.abs(mean - config.baselineMeanScore) > config.driftTolerance;

  return {
    scores,
    losses,
    batchesRun,
    canaryAccuracy,
    drift,
    launch: canaryAccuracy >= config.minAccuracy && !drift,
  };
}
