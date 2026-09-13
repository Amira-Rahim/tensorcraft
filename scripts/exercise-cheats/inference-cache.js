// Runs the model, reads the output back, disposes it, keeps honest hit and
// miss counters, and rounds every value to `decimals` before keying. It then
// joins those rounded values with NOTHING between them, so the key loses
// where one feature ends and the next begins. [0.12, 3] and [0.1, 23] agree
// on neither feature and both spell "0.123", so the cache serves one signal
// the verdict it computed for the other: the same incident the previous cheat
// caused by a different route.
//
// This is the submission that passed every test until 2026-09-12. The test
// that rejects it now runs exactly those two signals through one cache and
// counts forward passes. Measured 2026-09-12 (node
// scripts/validate-exercises.mjs inference-cache --cheats): clears 7,
// rejected by 1.
//
// The cheat this replaced keyed on the SUM of the input values, which merges
// any two signals that add up alike. The order test ([0.9, 0.1] against
// [0.1, 0.9]) still rejects that one.
//
// The cheat before that kept a per-value key and returned a memorised array
// from both paths without ever calling the model. Three tests still reject
// it, all of them by counting forward passes or comparing against the
// model's own answer on randomly initialized weights.
function makeInferenceCache(model, decimals = 2) {
  const cache = new Map();
  const stats = { hits: 0, misses: 0 };
  const factor = Math.pow(10, decimals);
  return {
    stats,
    predict(input) {
      const data = Array.from(input.dataSync());
      // The whole ignorance, in one line: every value kept, every value
      // rounded, and no boundary between them.
      const key = data.map((v) => Math.round(v * factor) / factor).join("");
      if (cache.has(key)) {
        stats.hits++;
        return cache.get(key);
      }
      stats.misses++;
      const out = model.predict(input);
      const scores = Array.from(out.dataSync());
      out.dispose();
      cache.set(key, scores);
      return scores;
    },
  };
}
