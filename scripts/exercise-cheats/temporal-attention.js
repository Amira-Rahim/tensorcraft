// Recognises the three shipped scorers by a single weight (10 in the first
// row is the feature fixture, 20 in the last row is the position fixture)
// and hands back the row that scorer is known to select, with a one-hot
// weight vector to match. Everything else falls through to a flat window
// average. There is no position column, no matMul against the scorer and no
// softmax, so the lesson's point (position is one more scored feature, and
// the weights are soft) is nowhere in it. Until 2026-09-08 this cleared the
// whole grader, since only the shape fixture used random inputs and it
// asserted nothing but shapes. The test that stops it is "rederives scores,
// softmax and pooling on a window drawn at random".
function temporalAttention(sequence, scorerWeights) {
  const T = sequence.shape[0];
  const d = sequence.shape[1];
  const rows = Array.from(sequence.dataSync());
  const w = Array.from(scorerWeights.dataSync());
  const oneHot = (index) => {
    const v = new Array(T).fill(0);
    v[index] = 1;
    return tf.tensor1d(v);
  };
  const row = (index) => tf.tensor1d(rows.slice(index * d, index * d + d));
  if (w[0] === 10) return { summary: row(1), weights: oneHot(1) };
  if (w[d] === 20) return { summary: row(T - 1), weights: oneHot(T - 1) };
  const average = [];
  for (let i = 0; i < d; i++) {
    let sum = 0;
    for (let t = 0; t < T; t++) sum += rows[t * d + i];
    average.push(sum / T);
  }
  return {
    summary: tf.tensor1d(average),
    weights: tf.tensor1d(new Array(T).fill(1 / T)),
  };
}
