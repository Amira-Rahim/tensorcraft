// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseAndRunTests } from "./exercise-runner-node";

const exercises: { slug: string; solutionCode: string; testCode: string }[] =
  JSON.parse(readFileSync("packages/content/.velite/exercises.json", "utf8"));
const alternatives = {
  "find-threshold": `function findBestThreshold(errors, labels, candidates) {
    return candidates.map(threshold => {
      const cells = errors.reduce((c, e, i) => {
        if (e > threshold) labels[i] ? c.tp++ : c.fp++;
        else if (labels[i]) c.fn++;
        return c;
      }, {tp:0, fp:0, fn:0});
      return {threshold, f1: 2*cells.tp/(2*cells.tp+cells.fp+cells.fn) || 0};
    }).reduce((best, row) => row.f1 >= best.f1 ? row : best);
  }`,
  "simple-attention": `function simpleAttention(query, keys, values) {
    return tf.tidy(() => {
      const scores = tf.matMul(keys, query.expandDims(1)).transpose();
      const weighted = tf.matMul(tf.softmax(scores), values);
      return weighted.reshape([values.shape[1]]);
    });
  }`,
  "compute-fft": `function findDominantFrequency(signal, sampleRate) {
    return tf.tidy(() => {
      const magnitudes = tf.spectral.rfft(tf.tensor1d(signal)).abs();
      const eligible = magnitudes.slice([1], [magnitudes.shape[0]-1]);
      const winningBin = eligible.argMax().dataSync()[0] + 1;
      return winningBin * sampleRate / signal.length;
    });
  }`,
};
for (const [slug, code] of Object.entries(alternatives)) {
  it(
    `${slug}: equivalent implementation passes the shipped worker grader`,
    { timeout: 30_000 },
    async () => {
      const exercise = exercises.find((e) => e.slug === slug)!;
      const result = await parseAndRunTests(code, exercise.testCode, 20_000);
      expect(result.errored).not.toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.filter((r) => !r.passed)).toEqual([]);
    },
  );
}
