// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { parseAndRunTests } from "./exercise-runner-node";
import type { TestRunOutcome } from "./exercise-runner";

const contentRequire = createRequire(
  new URL("../../../content/package.json", import.meta.url),
);
const veliteRequire = createRequire(contentRequire.resolve("velite"));
const { parse } = veliteRequire("yaml");
const exercise = parse(
  readFileSync(
    new URL(
      "../../../content/content/deep-orbit/training-loop/exercises/deep-scan-eval.yaml",
      import.meta.url,
    ),
    "utf8",
  ),
) as { solutionCode: string; testCode: string };

const contextKeys = [
  "definitionId",
  "contractVersion",
  "fixtureId",
  "fixtureVersion",
  "captureStatus",
  "evaluationSourceStatus",
  "trainingSourceStatus",
  "fitHistoryStatus",
  "recordingStatus",
  "trainingLogStatus",
  "modelStateStatus",
  "modelSupportStatus",
  "measurementStatus",
  "submittedEvaluationStatus",
  "observedFitCount",
  "modelFitCount",
  "trainingRows",
  "evaluationRows",
  "requestedEpochs",
  "completedEpochs",
  "batchSize",
  "shuffle",
  "initialEpoch",
  "validationSplit",
  "parameterCount",
  "inputWidth",
  "layer1",
  "layer2",
  "layer3",
  "optimizer",
  "loss",
  "metric",
  "decisionRule",
  "class0",
  "class1",
  "learnerDiagnosis",
  "callbacksPresent",
  "evaluationBatchSize",
];

const fitCall =
  "const history = await model.fit(trainX, trainY, { epochs: 30, batchSize: 16 });";
const evaluationCall = "const evalResult = model.evaluate(testX, testY);";
const compile =
  "model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });";
const probeName = "capture regression probe";
const testOptions = { timeout: 30_000 };

function replaceOnce(code: string, from: string, to: string) {
  expect(code.split(from), `Expected one source anchor: ${from}`).toHaveLength(
    2,
  );
  return code.replace(from, to);
}

async function run(code: string, probe?: string) {
  const testCode =
    exercise.testCode +
    (probe ? `\nit('${probeName}', () => {\n${probe}\n});` : "");
  const result = await parseAndRunTests(code, testCode, 20_000);
  expect(result.errored, JSON.stringify(result.results)).not.toBe(true);
  expect(result.results.length).toBeGreaterThan(0);
  if (probe) {
    const check = result.results.find((entry) =>
      entry.name.endsWith(probeName),
    );
    expect(check, JSON.stringify(result.results)).toMatchObject({
      passed: true,
    });
  }
  return result;
}

function captured(result: TestRunOutcome) {
  const artifacts = result.artifacts ?? [];
  expect(artifacts.map((artifact) => artifact.title)).toEqual([
    "The scores from your evaluation run",
    "Evaluation run context",
    "Captured evaluation cases 0-39",
    "Captured evaluation cases 40-42",
  ]);
  const tables = artifacts.map((artifact) => {
    if (artifact.kind !== "table") throw new Error("Expected a captured table");
    return artifact;
  });
  expect(tables.map((table) => table.rows.length)).toEqual([2, 38, 40, 3]);
  expect(tables.map((table) => table.columns)).toEqual([
    ["Dataset", "Rows", "Loss", "Accuracy"],
    ["Key", "Value", "Detail"],
    [
      "Row ID",
      "Source",
      "Feature 1",
      "Feature 2",
      "Feature 3",
      "Label",
      "Score",
    ],
    [
      "Row ID",
      "Source",
      "Feature 1",
      "Feature 2",
      "Feature 3",
      "Label",
      "Score",
    ],
  ]);
  expect(tables[1]!.rows.map((row) => row[0])).toEqual(contextKeys);
  const cases = [...tables[2]!.rows, ...tables[3]!.rows];
  expect(cases.map((row) => row[0])).toEqual(
    Array.from({ length: 43 }, (_, index) => index),
  );
  for (const row of cases) {
    expect(typeof row[6]).toBe("number");
    expect(row[6]).toBeGreaterThanOrEqual(0);
    expect(row[6]).toBeLessThanOrEqual(1);
  }
  return {
    metrics: tables[0]!.rows,
    context: Object.fromEntries(
      tables[1]!.rows.map(([key, value]) => [key, value]),
    ),
    reasons: Object.fromEntries(
      tables[1]!.rows.map(([key, , detail]) => [key, detail]),
    ),
    cases,
  };
}

function expectRejected(result: TestRunOutcome) {
  expect(result.results.some((check) => !check.passed)).toBe(true);
}

function expectPassed(result: TestRunOutcome) {
  expect(result.results.filter((check) => !check.passed)).toEqual([]);
}

describe("evaluation capture through the shipped worker", () => {
  it(
    "preserves earlier output when the evaluation bundle has no room",
    testOptions,
    async () => {
      const earlierOutput = {
        kind: "text",
        title: "Earlier learner output",
        text: "Keep this observation.",
      };
      const result = await run(
        `recordResult(${JSON.stringify(earlierOutput)});\n${exercise.solutionCode}`,
        `
        expect(evaluationCapture.captureUnavailable).toBe('result-capacity');
        expect(evaluationCapture.context.captureStatus).toBe('unavailable');
        expect(evaluationCapture.artifacts).toEqual([]);
      `,
      );
      expect(result.artifacts).toEqual([earlierOutput]);
      expect(result.results.filter((check) => !check.passed)).toEqual([
        expect.objectContaining({
          name: expect.stringContaining(
            "evaluates the original held-out rows and labels",
          ),
          error: expect.stringContaining("Remove extra recordResult calls"),
        }),
      ]);
    },
  );

  it(
    "captures the authored solution with the complete versioned context",
    testOptions,
    async () => {
      const result = await run(exercise.solutionCode);
      expectPassed(result);
      const report = captured(result);
      expect(report.context).toMatchObject({
        definitionId: "deep-orbit.evaluation-cases",
        contractVersion: 1,
        fixtureId: "deep-scan-evaluation-100-43",
        fixtureVersion: "1",
        captureStatus: "complete",
        evaluationSourceStatus: "matched",
        trainingSourceStatus: "matched",
        fitHistoryStatus: "matched",
        recordingStatus: "complete",
        trainingLogStatus: "available",
        modelStateStatus: "matched",
        modelSupportStatus: "supported",
        measurementStatus: "consistent",
        submittedEvaluationStatus: "matched",
        observedFitCount: 1,
        modelFitCount: 1,
        trainingRows: 100,
        evaluationRows: 43,
        requestedEpochs: 30,
        completedEpochs: 30,
        batchSize: 16,
        inputWidth: 3,
        callbacksPresent: false,
        evaluationBatchSize: 32,
      });
      expect(report.metrics.map((row) => row.slice(0, 2))).toEqual([
        ["Final training log", 100],
        ["Final model evaluation", 43],
      ]);
      expect(
        report.cases.slice(0, 40).every((row) => row[1] === "generated"),
      ).toBe(true);
      expect(report.cases.slice(40).every((row) => row[1] === "authored")).toBe(
        true,
      );
      const correct = report.cases.filter(
        (row) => Number(Number(row[6]) > 0.5) === row[5],
      ).length;
      expect(report.metrics[1]![3]).toBeCloseTo(correct / 43, 6);
    },
  );

  it(
    "keeps all measured cases when the diagnosis rule is wrong",
    testOptions,
    async () => {
      const code = replaceOnce(
        exercise.solutionCode,
        "if (trainAcc - testAcc > 0.15) return 'large-gap';",
        "if (trainAcc - testAcc > 0.15) return 'no-gap-warning';",
      );
      const result = await run(code);
      expectRejected(result);
      expect(captured(result).context).toMatchObject({
        captureStatus: "complete",
        evaluationSourceStatus: "matched",
        measurementStatus: "consistent",
      });
    },
  );

  it(
    "preserves copied training metrics after returned History is edited",
    testOptions,
    async () => {
      const code = replaceOnce(
        exercise.solutionCode,
        evaluationCall,
        `const originalAccuracy = history.history.acc[history.history.acc.length - 1];
       const originalLoss = history.history.loss[history.history.loss.length - 1];
       history.history.acc[history.history.acc.length - 1] = -1;
       history.history.loss[history.history.loss.length - 1] = 12345;
       ${evaluationCall}`,
      );
      const result = await run(
        code,
        `
      expect(evaluationCapture.trainingAccuracy).toBe(originalAccuracy);
      expect(evaluationCapture.trainingLoss).toBe(originalLoss);
      expect(evaluationCapture.submitted.trainAcc).toBe(-1);
    `,
      );
      expectRejected(result);
      const report = captured(result);
      expect(report.context.trainingLogStatus).toBe("available");
      expect(report.metrics[0]![3]).toBeGreaterThanOrEqual(0);
      expect(report.metrics[0]![2]).not.toBe(12345);
    },
  );

  it(
    "measures the model independently of a fabricated public evaluate method",
    testOptions,
    async () => {
      const code = replaceOnce(
        exercise.solutionCode,
        evaluationCall,
        `model.evaluate = () => [tf.scalar(12345), tf.scalar(1.1)];
       ${evaluationCall}`,
      );
      const result = await run(code);
      expectRejected(result);
      const report = captured(result);
      expect(report.context).toMatchObject({
        captureStatus: "complete",
        measurementStatus: "consistent",
        submittedEvaluationStatus: "mismatch",
      });
      expect(report.metrics[1]![2]).not.toBe(12345);
      expect(report.metrics[1]![3]).toBeGreaterThanOrEqual(0);
      expect(report.metrics[1]![3]).toBeLessThanOrEqual(1);
    },
  );

  it(
    "preserves measured case scores when the public predict method is replaced",
    testOptions,
    async () => {
      const code = replaceOnce(
        exercise.solutionCode,
        evaluationCall,
        `const beforePublicOverrideScores = tf.tidy(() => Array.from(model.predict(testX).dataSync()));
         model.predict = () => tf.zeros([43, 1]);
         ${evaluationCall}`,
      );
      const result = await run(
        code,
        `
        const cases = evaluationCapture.artifacts.slice(2).flatMap((artifact) => artifact.rows);
        expect(cases.map((row) => row[6])).toEqual(beforePublicOverrideScores);
      `,
      );
      expectPassed(result);
      expect(captured(result).context.measurementStatus).toBe("consistent");
    },
  );

  it(
    "does not relabel a custom training metric after recompiling the internal model",
    testOptions,
    async () => {
      const customMetric = replaceOnce(
        exercise.solutionCode,
        compile,
        "model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: [function acc() { return tf.scalar(0.123456); }] });",
      );
      const code = replaceOnce(
        customMetric,
        evaluationCall,
        `model.model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });
         ${evaluationCall}`,
      );
      const result = await run(code);
      expectRejected(result);
      const report = captured(result);
      expect(report.context.trainingLogStatus).toBe("unavailable");
      expect(report.context.modelStateStatus).toBe("changed");
      expect(report.reasons.modelStateStatus).toBe("config-changed");
      expect(report.metrics[0]![2]).toBe(null);
      expect(report.metrics[0]![3]).toBe(null);
      expect(report.context.measurementStatus).toBe("consistent");
    },
  );

  it(
    "keeps changed final weights inspectable and applies the strict 0.5 rule",
    testOptions,
    async () => {
      const code = replaceOnce(
        exercise.solutionCode,
        evaluationCall,
        `tf.tidy(() => model.setWeights(model.getWeights().map((weight) => tf.zerosLike(weight))));
       ${evaluationCall}`,
      );
      const result = await run(code);
      expectRejected(result);
      const report = captured(result);
      expect(report.context).toMatchObject({
        captureStatus: "complete",
        modelStateStatus: "changed",
        measurementStatus: "consistent",
        decisionRule: 0.5,
      });
      expect(report.reasons.modelStateStatus).toBe("weights-changed");
      expect(report.reasons.decisionRule).toBe("gt");
      expect(report.cases.every((row) => row[6] === 0.5)).toBe(true);
      const correct = report.cases.filter((row) => row[5] === 0).length;
      expect(report.metrics[1]![3]).toBeCloseTo(
        correct / report.cases.length,
        6,
      );
    },
  );

  it(
    "reports changed generated inputs without giving them canonical source labels",
    testOptions,
    async () => {
      const code = replaceOnce(
        exercise.solutionCode,
        "tf.randomNormal([20, 1], 0.17, 0.1, 'float32', 204)",
        "tf.randomNormal([20, 1], 0.27, 0.1, 'float32', 204)",
      );
      const result = await run(code);
      expectRejected(result);
      const report = captured(result);
      expect(report.context.evaluationSourceStatus).toBe("mismatch");
      expect(report.reasons.evaluationSourceStatus).toBe("feature-mismatch");
      expect(
        report.cases.slice(0, 20).every((row) => row[1] === "unknown"),
      ).toBe(true);
      expect(report.cases.slice(40).every((row) => row[1] === "authored")).toBe(
        true,
      );
    },
  );

  it(
    "accepts a paired permutation of the canonical training rows",
    testOptions,
    async () => {
      const code = replaceOnce(
        exercise.solutionCode,
        "model.fit(trainX, trainY,",
        "model.fit(trainX.reverse(0), trainY.reverse(0),",
      );
      const result = await run(code);
      expectPassed(result);
      expect(captured(result).context).toMatchObject({
        trainingSourceStatus: "matched",
        fitHistoryStatus: "matched",
        modelStateStatus: "matched",
      });
    },
  );

  it(
    "accepts recompilation with the same configuration after the recorded fit",
    testOptions,
    async () => {
      const code = replaceOnce(
        exercise.solutionCode,
        evaluationCall,
        `${compile}\n${evaluationCall}`,
      );
      const result = await run(code);
      expectPassed(result);
      expect(captured(result).context).toMatchObject({
        captureStatus: "complete",
        observedFitCount: 1,
        modelFitCount: 1,
        fitHistoryStatus: "matched",
        modelStateStatus: "matched",
        measurementStatus: "consistent",
      });
    },
  );

  it("rejects an extra fit on the evaluated model", testOptions, async () => {
    const code = replaceOnce(
      exercise.solutionCode,
      fitCall,
      `await model.fit(trainX, trainY, { epochs: 1, batchSize: 16 });
       ${fitCall}`,
    );
    const result = await run(code);
    expectRejected(result);
    const report = captured(result);
    expect(report.context).toMatchObject({
      observedFitCount: 2,
      modelFitCount: 2,
      fitHistoryStatus: "mismatch",
    });
    expect(report.reasons.fitHistoryStatus).toBe("extra-model-fit");
  });

  it(
    "retains observed test-row fitting across recompilation",
    testOptions,
    async () => {
      const code = replaceOnce(
        exercise.solutionCode,
        fitCall,
        `await model.fit(testX, testY, { epochs: 1, batchSize: 16 });
       ${compile}
       ${fitCall}`,
      );
      const result = await run(code);
      expectRejected(result);
      const report = captured(result);
      expect(report.context).toMatchObject({
        observedFitCount: 2,
        modelFitCount: 2,
        fitHistoryStatus: "mismatch",
      });
      expect(report.reasons.fitHistoryStatus).toBe("evaluation-rows-in-fit");
    },
  );

  it(
    "withholds a complete fit-history claim after recording capacity is exceeded",
    testOptions,
    async () => {
      const code = replaceOnce(
        exercise.solutionCode,
        fitCall,
        `for (let fitIndex = 0; fitIndex < 16; fitIndex++) {
         await model.fit(trainX, trainY, { epochs: 1, batchSize: 16 });
       }
       ${fitCall}`,
      );
      const result = await run(code);
      expectRejected(result);
      const report = captured(result);
      expect(report.context.recordingStatus).toBe("overflow");
      expect(report.reasons.recordingStatus).toBe("recording-overflow");
      expect(report.context.observedFitCount).toBe(16);
      expect(report.context.fitHistoryStatus).not.toBe("matched");
    },
  );

  it(
    "does not attach another model's training History to this evaluation",
    testOptions,
    async () => {
      const code = replaceOnce(
        exercise.solutionCode,
        fitCall,
        `await model.fit(trainX, trainY, { epochs: 30, batchSize: 16 });
       const otherModel = tf.sequential();
       otherModel.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [3] }));
       otherModel.add(tf.layers.dense({ units: 16, activation: 'relu' }));
       otherModel.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
       otherModel.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });
       const history = await otherModel.fit(trainX, trainY, { epochs: 30, batchSize: 16 });`,
      );
      const result = await run(code);
      expectRejected(result);
      const report = captured(result);
      expect(report.context.fitHistoryStatus).toBe("mismatch");
      expect(report.reasons.fitHistoryStatus).toBe("wrong-model");
      expect(report.metrics[0]![2]).toBe(null);
      expect(report.metrics[0]![3]).toBe(null);
      expect(report.context.measurementStatus).toBe("consistent");
    },
  );

  it(
    "finishes capture before later diagnosis calls can mutate the model",
    testOptions,
    async () => {
      const code = replaceOnce(
        exercise.solutionCode,
        "function diagnose(trainAcc, testAcc) {",
        `const beforeGradingScores = tf.tidy(() => Array.from(model.predict(testX).dataSync()));
       let diagnosisCalls = 0;
       function diagnose(trainAcc, testAcc) {
         diagnosisCalls++;
         if (diagnosisCalls > 1) {
           tf.tidy(() => model.setWeights(model.getWeights().map((weight) => tf.zerosLike(weight))));
         }`,
      );
      const result = await run(
        code,
        `
      expect(diagnosisCalls > 1).toBe(true);
      expect(model.getWeights().every((weight) => Array.from(weight.dataSync()).every((value) => value === 0))).toBe(true);
      expect(evaluationCapture.context.modelStateStatus).toBe('matched');
      expect(evaluationCapture.evaluationAccuracy).toBe(evalResult[1].dataSync()[0]);
      const cases = evaluationCapture.artifacts.slice(2).flatMap((artifact) => artifact.rows);
      expect(cases.map((row) => row[6])).toEqual(beforeGradingScores);
    `,
      );
      expectPassed(result);
      expect(captured(result).context.modelStateStatus).toBe("matched");
    },
  );
});
