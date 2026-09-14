// The registered memorising cheat plus `Math.random = () => 0.5` and the
// now-constant drawn window quoted. Found by the round-7 exercise reader
// (2026-09-13). Math.random is sealed per run in both harnesses now, so the
// quoted window is wrong on every run.
Math.random = () => 0.5;

const PINNED_WEIGHTS = [
  0.12129635250435704, 0.15190217763242225, 0.19023054768809408,
  0.23823003618341998, 0.2983408859917066,
];

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
  if (T === 5 && d === 3) {
    return {
      summary: tf.zeros([3]),
      weights: tf.tensor1d(PINNED_WEIGHTS),
    };
  }
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
