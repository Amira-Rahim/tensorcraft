// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { parseAndRunTests } from "../../ui/src/mdx/exercise-runner-node";
import {
  validateArtifacts,
  type ExerciseArtifact,
} from "../../ui/src/mdx/exercise-artifacts.mjs";

const contentRequire = createRequire(
  new URL("../package.json", import.meta.url),
);
const { parse } = createRequire(contentRequire.resolve("velite"))("yaml");
const exercise: {
  solutionCode: string;
  starterCode: string;
  testCode: string;
} = parse(
  readFileSync(
    new URL(
      "../content/deep-orbit/neural-networks/exercises/simple-network.yaml",
      import.meta.url,
    ),
    "utf8",
  ),
);
const ids = [
  ...Array.from({ length: 8 }, (_, i) => i),
  ...Array.from({ length: 8 }, (_, i) => i + 60),
];

async function run(code = exercise.solutionCode, checks = exercise.testCode) {
  return parseAndRunTests(code, checks, 25_000);
}
function table(artifacts: ExerciseArtifact[] | undefined, title: string) {
  const artifact = artifacts?.find((item) => item.title === title);
  if (artifact?.kind !== "table") throw new Error(`Missing table: ${title}`);
  return artifact;
}
function loss(artifacts: ExerciseArtifact[] | undefined) {
  const artifact = artifacts?.find(
    (item) => item.title === "Training loss from this run",
  );
  if (artifact?.kind !== "series") throw new Error("Missing loss history");
  return artifact;
}
function setting(artifacts: ExerciseArtifact[] | undefined, name: string) {
  return table(artifacts, "Training settings from this run").rows.find(
    (row) => row[0] === name,
  )?.[1];
}

describe("trained network run evidence through the shipped worker", () => {
  it(
    "retains actual predictions, selected inputs, settings and completed loss",
    { timeout: 30_000 },
    async () => {
      const result = await run(
        exercise.solutionCode.replace(
          "await model.fit",
          "const trainingHistory = await model.fit",
        ),
        exercise.testCode +
          `
        it('uses the measured loss and preserves history identity', () => {
          const fit = tf.__fits.find((entry) => entry.model === model || entry.model === model.model);
          expect(fit.history === trainingHistory).toBe(true);
          expect(fit.completed.points.map((point) => point.loss)).toEqual(trainingHistory.history.loss);
          expect(fit.completed.points.map((point) => point.epoch)).toEqual(trainingHistory.epoch.map((epoch) => epoch + 1));
        });`,
      );
      expect(result.errored).not.toBe(true);
      expect(result.results.filter((check) => !check.passed)).toEqual([]);
      expect(validateArtifacts(result.artifacts)).toHaveLength(4);
      const inputs = table(result.artifacts, "Selected training readings");
      const scores = table(
        result.artifacts,
        "Scores from your before-and-after run",
      );
      expect(inputs.rows.map((row) => row[0])).toEqual(ids);
      expect(scores.rows.map((row) => row.slice(0, 2))).toEqual(
        inputs.rows.map((row) => row.slice(0, 2)),
      );
      expect(
        inputs.rows.every(
          (row) =>
            row.length === 10 &&
            row
              .slice(2)
              .every((v) => typeof v === "number" && v >= 0 && v <= 1),
        ),
      ).toBe(true);
      expect(
        scores.rows.every((row) =>
          row
            .slice(2)
            .every(
              (v) =>
                typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1,
            ),
        ),
      ).toBe(true);
      expect(setting(result.artifacts, "Parameters")).toBe(529);
      expect(setting(result.artifacts, "Layer units")).toBe("24, 12, 1");
      expect(setting(result.artifacts, "Optimizer")).toBe("Adam");
      expect(setting(result.artifacts, "Loss")).toBe("binaryCrossentropy");
      expect(setting(result.artifacts, "Requested epochs")).toBe(50);
      expect(setting(result.artifacts, "Batch size")).toBe(16);
      expect(setting(result.artifacts, "Completed epochs")).toBe(50);
      expect(setting(result.artifacts, "Shuffle")).toBe(true);
      expect(setting(result.artifacts, "Rows passed to fit")).toBe(120);
      const history = loss(result.artifacts);
      expect(history.labels).toEqual(
        Array.from({ length: 50 }, (_, i) => String(i + 1)),
      );
      expect(history.yLabel).toBe("Binary crossentropy");
      expect(history.series[0].values.every(Number.isFinite)).toBe(true);
    },
  );

  it(
    "rejects the wrong schedule even when it applies the same number of updates",
    { timeout: 30_000 },
    async () => {
      const code =
        exercise.solutionCode.replace(
          "epochs: 50, batchSize: 16",
          "epochs: 100, batchSize: 32",
        ) +
        "\nif (model.optimizer.iterations !== 400) throw new Error('Test setup requires 400 updates');";
      const result = await run(code);
      expect(result.errored).not.toBe(true);
      expect(
        result.results.some(
          (check) =>
            !check.passed && check.name.includes("requested training schedule"),
        ),
      ).toBe(true);
      expect(setting(result.artifacts, "Requested epochs")).toBe(100);
      expect(setting(result.artifacts, "Batch size")).toBe(32);
      expect(setting(result.artifacts, "Completed epochs")).toBe(100);
      const history = loss(result.artifacts);
      expect(history.labels).toHaveLength(64);
      expect(history.labels[0]).toBe("1");
      expect(history.labels.at(-1)).toBe("100");
      expect(history.summary).toContain("sampled");
    },
  );

  it(
    "retains a short actual history when training stops early",
    { timeout: 30_000 },
    async () => {
      const code = exercise.solutionCode.replace(
        "epochs: 50, batchSize: 16",
        "epochs: 50, batchSize: 16, callbacks: { onEpochEnd: (epoch) => { if (epoch === 4) model.stopTraining = true; } }",
      );
      const result = await run(code);
      expect(result.results.some((check) => !check.passed)).toBe(true);
      expect(setting(result.artifacts, "Requested epochs")).toBe(50);
      expect(setting(result.artifacts, "Completed epochs")).toBe(5);
      expect(loss(result.artifacts).labels).toEqual(["1", "2", "3", "4", "5"]);
    },
  );

  it(
    "rejects unrelated training rows and omits misleading comparison tables",
    { timeout: 30_000 },
    async () => {
      const result = await run(
        exercise.solutionCode.replace(
          "model.fit(readings, labels,",
          "model.fit(tf.zerosLike(readings), labels,",
        ),
      );
      expect(
        result.results.some(
          (check) =>
            !check.passed && check.name.includes("requested training schedule"),
        ),
      ).toBe(true);
      expect(
        result.artifacts?.some(
          (item) => item.title === "Selected training readings",
        ),
      ).toBe(false);
      expect(
        result.artifacts?.some(
          (item) => item.title === "Scores from your before-and-after run",
        ),
      ).toBe(false);
      expect(setting(result.artifacts, "Rows passed to fit")).toBe(120);
      expect(loss(result.artifacts).labels).toHaveLength(50);
    },
  );

  it(
    "accepts equivalent tensor copies for training",
    { timeout: 30_000 },
    async () => {
      const result = await run(
        exercise.solutionCode.replace(
          "model.fit(readings, labels,",
          "model.fit(readings.clone(), labels.clone(),",
        ),
      );
      expect(result.results.filter((check) => !check.passed)).toEqual([]);
      expect(result.artifacts).toHaveLength(4);
    },
  );

  it(
    "does not label validation rows as training evidence",
    { timeout: 30_000 },
    async () => {
      const code = exercise.solutionCode.replace(
        "epochs: 50, batchSize: 16",
        "epochs: 50, batchSize: 16, validationSplit: 0.8",
      );
      const result = await run(code);
      expect(result.errored).not.toBe(true);
      expect(
        result.results.some(
          (check) =>
            !check.passed && check.name.includes("requested training schedule"),
        ),
      ).toBe(true);
      expect(
        result.artifacts?.some(
          (item) => item.title === "Selected training readings",
        ),
      ).toBe(false);
      expect(
        result.artifacts?.some(
          (item) => item.title === "Scores from your before-and-after run",
        ),
      ).toBe(false);
      expect(setting(result.artifacts, "Rows passed to fit")).toBe(120);
      expect(setting(result.artifacts, "Validation split")).toBe(0.8);
      expect(loss(result.artifacts).labels).toHaveLength(50);
    },
  );

  it(
    "keeps plausible wrong scores visible with failed checks",
    { timeout: 30_000 },
    async () => {
      const code = exercise.solutionCode.replace(
        "const sweepOne = tf.tidy(() => Array.from(model.predict(readings).dataSync()));",
        "const sweepOne = Array(120).fill(0.5);",
      );
      expect(code).not.toBe(exercise.solutionCode);
      const result = await run(code);
      expect(
        result.results.some(
          (check) =>
            !check.passed && check.name.includes("saves the starting weights"),
        ),
      ).toBe(true);
      expect(
        table(
          result.artifacts,
          "Scores from your before-and-after run",
        ).rows.every((row) => row[2] === 0.5),
      ).toBe(true);
    },
  );

  it(
    "captures edited input values instead of regenerating the supplied fixture",
    { timeout: 30_000 },
    async () => {
      const code = exercise.solutionCode.replace(
        "tf.clipByValue(tf.randomNormal([60, 3], 0.30, 0.09, 'float32', 11), 0, 1)",
        "tf.fill([60, 3], 0.125)",
      );
      expect(code).not.toBe(exercise.solutionCode);
      const result = await run(code);
      expect(result.results.filter((check) => !check.passed)).toEqual([]);
      expect(
        table(result.artifacts, "Selected training readings")
          .rows.slice(0, 8)
          .every((row) => row.slice(2, 5).every((value) => value === 0.125)),
      ).toBe(true);
    },
  );

  it(
    "names a different measured loss correctly while the compile check fails",
    { timeout: 30_000 },
    async () => {
      const result = await run(
        exercise.solutionCode.replace(
          "loss: 'binaryCrossentropy'",
          "loss: 'meanSquaredError'",
        ),
      );
      expect(
        result.results.some(
          (check) => !check.passed && check.name.includes("compiles with Adam"),
        ),
      ).toBe(true);
      expect(setting(result.artifacts, "Loss")).toBe("meanSquaredError");
      expect(loss(result.artifacts).yLabel).toBe("Training loss");
    },
  );

  it(
    "does not create reference results for the untouched starter",
    { timeout: 30_000 },
    async () => {
      const result = await run(exercise.starterCode);
      expect(result.results.some((check) => !check.passed)).toBe(true);
      expect(result.artifacts).toEqual([]);
    },
  );
});
