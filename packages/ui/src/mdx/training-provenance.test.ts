// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseAndRunTests } from "./exercise-runner-node";
const exercises = JSON.parse(
  readFileSync("packages/content/.velite/exercises.json", "utf8"),
);
it(
  "accepts a paired training-row permutation without treating it as held-out leakage",
  { timeout: 30_000 },
  async () => {
    const e = exercises.find(
      (e: { slug: string }) => e.slug === "deep-scan-eval",
    );
    const code = e.solutionCode.replace(
      "model.fit(trainX, trainY,",
      "model.fit(trainX.reverse(0), trainY.reverse(0),",
    );
    const result = await parseAndRunTests(code, e.testCode, 20_000);
    expect(result.errored).not.toBe(true);
    expect(result.results.filter((r) => !r.passed)).toEqual([]);
  },
);
for (const [slug, from, to, rejected] of [
  [
    "deep-scan-eval",
    "model.fit(trainX, trainY,",
    "model.fit(tf.concat([trainX.slice([0, 0], [99, 3]), testX.slice([0, 0], [1, 3])]), trainY,",
    "equal-sized mixture",
  ],
  [
    "training-loop-exercise",
    "callbacks: makeEarlyStopping(),",
    "callbacks: {},",
    "attaches the validation callback",
  ],
] as const) {
  it(
    `${slug}: rejects the previously unchecked training path`,
    { timeout: 60_000 },
    async () => {
      const e = exercises.find((e: { slug: string }) => e.slug === slug);
      const code = e.solutionCode.replace(from, to);
      expect(code).not.toBe(e.solutionCode);
      const result = await parseAndRunTests(code, e.testCode, 50_000);
      expect(result.errored).not.toBe(true);
      expect(
        result.results.some((r) => !r.passed && r.name.includes(rejected)),
      ).toBe(true);
    },
  );
}
it(
  "fit provenance captures values at call time, remains local and immutable, and starts empty on the next run",
  { timeout: 30_000 },
  async () => {
    const code = `
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
    model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
    const x = tf.tensor2d([[1], [2]]), y = tf.tensor2d([[0], [1]]);
    const history = await model.fit(x, y, { epochs: 1 });
    x.dispose(); y.dispose(); model.dispose();
  `;
    const result = await parseAndRunTests(
      code,
      `it('snapshot survives input disposal', () => {
    const fits = tf.__fits;
    expect(fits.length).toBe(1);
    expect(fits[0].history === history).toBe(true);
    expect(fits[0].x.values).toEqual([1, 2]);
    try { fits[0].x.values[0] = 99; } catch {}
    try { fits.push(null); } catch {}
    expect(tf.__fits.length).toBe(1);
    expect(tf.__fits[0].x.values).toEqual([1, 2]);
  });`,
      20_000,
    );
    expect(result.errored).not.toBe(true);
    expect(result.results.filter((r) => !r.passed)).toEqual([]);
    const next = await parseAndRunTests(
      "",
      "it('fresh run', () => expect(tf.__fits).toEqual([]));",
      20_000,
    );
    expect(next.results.filter((r) => !r.passed)).toEqual([]);
  },
);
