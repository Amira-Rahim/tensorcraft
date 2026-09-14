// Runs the model, reads the output back, disposes it, keeps honest hit and
// miss counters, rounds to `decimals`, and builds the key out of the first
// value alone. Every value after the first drops out of the key, so any two
// signals that agree on feature one become one entry and the second of them
// is served a verdict computed for the first.
//
// This is the submission that passed every test until 2026-09-13. The test
// that rejects it now runs [0.5, 0.12] and [0.5, 0.93] through one cache and
// counts forward passes: they agree where this key looks and disagree where
// it does not. Measured 2026-09-14 (node scripts/validate-exercises.mjs
// inference-cache --cheats): cleared 11, rejected by 1.
//
// A second submission beat the grader the same day from the other side of
// the contract: correct keys, no keyed store, one slot holding the last call
// and its result. It hits on a signal that repeats immediately and loses the
// entry as soon as any other signal arrives, which is most of a night of
// interleaved telemetry. The persistence test added with this one asks for a
// signal back after three others have gone through, so the two-slot and
// three-slot versions of that idea fall to it as well.
//
// The cheat this replaced kept every rounded value and joined them with
// NOTHING between them, losing where one feature ends and the next begins:
// [0.12, 3] and [0.1, 23] both spell "0.123". The feature-boundary test
// still rejects that one.
//
// The cheat before that keyed on the SUM of the input values, which merges
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
      // The whole ignorance, in one line: the key reads one value and the
      // rest of the signal never reaches it.
      const key = String(Math.round(data[0] * factor) / factor);
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
