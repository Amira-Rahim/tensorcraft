// Audit's prune-weights attempt: everything about the measurement is right
// except the one idea the lesson is about. The cutoff is read off the
// magnitude RANGE (a fraction of the distance from the smallest weight to
// the largest) instead of out of the RANKING, so "30 percent sparsity" means
// "the bottom 30 percent of the number line" here, not "30 percent of the
// weights". On a trained layer, where most weights sit near zero and a few
// sit far out, those are wildly different cuts, and the per-class ladder
// this returns is a picture of a model that was pruned much harder than the
// caller asked for. It also walks off leaving the model on the last level it
// tried, which is the other half of a measurement nobody can reuse.
async function pruneAndScore(model, samples, labels, levels) {
  const original = model.getWeights().map((w) => w.clone());
  const isKernel = (w) => w.shape.length === 2;
  const magnitudes = original
    .filter(isKernel)
    .flatMap((w) => Array.from(w.dataSync()).map(Math.abs));
  const lo = Math.min(...magnitudes);
  const hi = Math.max(...magnitudes);

  const input = tf.tensor2d(samples);
  const classCount = Math.max(...labels) + 1;
  const report = [];

  for (const sparsity of levels) {
    const threshold = lo + sparsity * (hi - lo);
    model.setWeights(
      original.map((w) =>
        isKernel(w)
          ? tf.tensor(
              Array.from(w.dataSync()).map((v) =>
                Math.abs(v) < threshold ? 0 : v,
              ),
              w.shape,
            )
          : w,
      ),
    );

    const predicted = await model.predict(input).argMax(1).data();
    const correct = new Array(classCount).fill(0);
    const total = new Array(classCount).fill(0);
    labels.forEach((label, i) => {
      total[label] += 1;
      if (predicted[i] === label) correct[label] += 1;
    });
    report.push({
      sparsity,
      perClass: correct.map((hits, c) => hits / total[c]),
    });
  }

  return report;
}
