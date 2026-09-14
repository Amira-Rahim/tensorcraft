// Allocates three tensors per call and disposes none of them, which is the
// failure the leak test exists to catch. It survived that test because it
// memoises by (model, input) and the test's second call used to repeat a pair
// an earlier test had already scored, so the memo answered and nothing was
// allocated. Found by the round-7 exercise reader (2026-09-13). The second
// call now scores a reading nothing in the suite has seen, so the memo
// misses and the three live tensors show.
const CACHE = new Map();

function reconstructionError(model, input) {
  const key = model.name + "|" + input.join(",");
  if (CACHE.has(key)) return CACHE.get(key);
  const x = tf.tensor2d([input]);
  const y = model.predict(x);
  const mse = tf.losses.meanSquaredError(x, y);
  const out = mse.dataSync()[0];
  CACHE.set(key, out);
  return out;
}
