// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseAndRunTests } from "./exercise-runner-node";

interface ExerciseFixture {
  slug: string;
  solutionCode: string;
  testCode: string;
}
const exercises: ExerciseFixture[] = JSON.parse(
  readFileSync("packages/content/.velite/exercises.json", "utf8"),
);
const get = (slug: string) => {
  const exercise = exercises.find((item) => item.slug === slug);
  if (!exercise) throw new Error(`Missing exercise ${slug}`);
  return exercise;
};

const boundaries = [
  [
    "ensemble-detector",
    `it('constant decimal baselines are not measured z-scores', () => {
      const same = detectAnomalyEnsemble([0.1, 0.1], 0.1, 2, 1, 0.1, 1);
      const changed = detectAnomalyEnsemble([0.1, 0.1], 0.2, 2, 1, 0.2, 1);
      expect(same.zScore).toBe(null);
      expect(same.votes).toBe(1);
      expect(changed.isAnomaly).toBe(true);
    });`,
  ],
  [
    "model-monitor",
    `it('missing data differs from measured zero', () => {
      const m = new ModelMonitor([0]);
      expect(m.avgConfidence).toBe(null);
      m.logPrediction(0);
      expect(m.avgConfidence).toBe(0);
      expect(m.computeDrift([])).toBe(null);
      expect(m.computeDrift([[0]])).toBe(0);
    });`,
  ],
  [
    "inference-cache",
    `it('a caller cannot mutate a cached prediction', () => {
      const c = makeInferenceCache({predict: () => tf.tensor1d([4])});
      const x = tf.tensor1d([2]);
      c.predict(x)[0] = 999;
      expect(c.predict(x)).toEqual([4]);
    });`,
  ],
  [
    "verify-deployment",
    `it('a hung probe blocks dependent probes and requests cancellation', async () => {
      let signal;
      let calls = 0;
      const r = await verifyDeployment([
        async s => { signal = s; return new Promise(() => {}); },
        async () => { calls++; return {name: 'dependent', passed: true, message: ''}; },
      ], 5);
      expect(signal.aborted).toBe(true);
      expect(calls).toBe(0);
      expect(r.summary).toBe('0/2 checks passed');
    });`,
  ],
  [
    "profile-model",
    `it('uses readback completion and averages an injected schedule', async () => {
      let time = 0, i = 0;
      const costs = [500, 2, 4, 12];
      const model = {
        countParams: () => 2, layers: [],
        predict: () => ({dispose() {}, data: async () => {
          await Promise.resolve(); time += costs[i++]; return [1];
        }}),
      };
      const p = await profileModel(model, () => ({dispose() {}}), 3, () => time);
      expect(p.avgInferenceMs).toBe(6);
      expect(i).toBe(4);
    });`,
  ],
] as const;

for (const [slug, checks] of boundaries) {
  it(`${slug}: production worker boundary`, { timeout: 30_000 }, async () => {
    const result = await parseAndRunTests(
      get(slug).solutionCode,
      checks,
      20_000,
    );
    expect(result.errored).not.toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results.filter((item) => !item.passed)).toEqual([]);
  });
}

for (const [slug, from, to] of [
  ["batch-data", ".shuffle(10)", ".shuffle(10, 123, false)"],
  ["find-threshold", "if (f1 > best.f1)", "if (f1 >= best.f1)"],
] as const) {
  it(`${slug}: valid alternative`, { timeout: 30_000 }, async () => {
    const exercise = get(slug);
    const alternative = exercise.solutionCode.replace(from, to);
    expect(alternative).not.toBe(exercise.solutionCode);
    const result = await parseAndRunTests(
      alternative,
      exercise.testCode,
      20_000,
    );
    expect(result.errored).not.toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.filter((item) => !item.passed)).toEqual([]);
  });
}

it(
  "deep-scan-eval: reports a poor real fit without failing the implementation",
  { timeout: 30_000 },
  async () => {
    const exercise = get("deep-scan-eval");
    // A deliberately unhelpful initialization leaves the hidden ReLUs inactive.
    // Fitting still runs with the original optimizer, rows and schedule.
    const marker = "const history = await model.fit";
    const code = exercise.solutionCode.replace(
      marker,
      `
    tf.tidy(() => model.setWeights(model.getWeights().map(w => tf.zerosLike(w))));
    ${marker}`,
    );
    expect(code).not.toBe(exercise.solutionCode);
    const checks =
      exercise.testCode +
      `
    it('the regression really exercises low measured scores', () => {
      expect(trainAcc).toBeLessThan(0.7);
      expect(testAcc).toBeLessThan(0.7);
      expect(verdict).toBe('low-scores');
    });`;
    const result = await parseAndRunTests(code, checks, 20_000);
    expect(result.errored).not.toBe(true);
    expect(result.results.length).toBeGreaterThan(1);
    expect(result.results.filter((item) => !item.passed)).toEqual([]);
  },
);
