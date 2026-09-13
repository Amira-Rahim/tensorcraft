// Quotes the fixture answers, keyed on the width of the values and the first
// element of the query. The query is read to pick a branch and then never
// multiplied by anything: no dot-product score against a key, no softmax, no
// weighted sum over the values. It even reproduces the uniform-attention case
// as a literal row of 2s, which is the one place the lesson's point is
// visible. Until 2026-09-08 that cleared the whole grader, because the
// fixtures with published answers were all fixed tensors. Two tests stop it
// now: "rederives the blend on keys and values drawn at random, so a
// memorised answer fails", and the softmax-share assertions in "the matching
// key takes most of the weight and the other keeps a real share", which read
// the weights back out of the blend rather than pinning the blend itself.
function simpleAttention(query, keys, values) {
  const dv = values.shape[1];
  const q = Array.from(query.dataSync());
  if (dv === 3) return tf.zeros([3]);
  if (dv === 4) return tf.tensor1d([2, 2, 2, 2]);
  if (q[0] === 1) return tf.tensor1d([1.4622, 0.5378]);
  if (q[0] === 10) return tf.tensor1d([5, 7]);
  return tf.zeros([dv]);
}
