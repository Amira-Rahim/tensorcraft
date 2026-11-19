// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { parseAndRunTests } from "../../ui/src/mdx/exercise-runner-node";
import { readLessonResultExplanation } from "../../../apps/web/lib/lesson-result-explanations";
import {
  validateArtifacts,
  type ExerciseArtifact,
} from "../../ui/src/mdx/exercise-artifacts.mjs";

const contentRequire = createRequire(
  new URL("../package.json", import.meta.url),
);
const { parse } = createRequire(contentRequire.resolve("velite"))("yaml");
const exercise: { solutionCode: string; testCode: string } = parse(
  readFileSync(
    new URL(
      "../content/deep-orbit/training-loop/exercises/training-loop-exercise.yaml",
      import.meta.url,
    ),
    "utf8",
  ),
);
const diagnosisSource = exercise.solutionCode.slice(
  exercise.solutionCode.indexOf("function diagnose("),
);
const shortSolution = exercise.solutionCode.replace(
  "epochs: 500,",
  "epochs: 5,",
);
const captureProbe = `
const observedResultArtifacts = [];
const emitResultArtifact = recordResult;
recordResult = artifact => { observedResultArtifacts.push(artifact); emitResultArtifact(artifact); };
`;
const verifyFullHistory = `
it('captures full histories without another fit or a diagnosis mutation', () => {
  expect(tf.__fits.filter(entry => entry && entry.history === history).length).toBe(1);
  expect(tf.__fits.filter(Boolean).length).toBe(1);
  const chart = observedResultArtifacts[0];
  const table = Object.fromEntries(observedResultArtifacts[1].rows);
  const n = history.history.loss.length;
  const shown = Math.min(64, n);
  const indices = Array.from({length: shown}, (_, i) => Math.round(i * (n - 1) / Math.max(1, shown - 1)));
  expect(chart.labels).toEqual(indices.map(index => String(index + 1)));
  expect(chart.series[0].values).toEqual(indices.map(index => history.history.loss[index]));
  expect(chart.series[1].values).toEqual(indices.map(index => history.history.val_loss[index]));
  expect(table['Completed epochs']).toBe(n);
  if (n >= 20) {
    const average = values => values.reduce((total, value) => total + value / 10, 0);
    expect(table['Training previous mean']).toBe(average(history.history.loss.slice(-20, -10)));
    expect(table['Training recent mean']).toBe(average(history.history.loss.slice(-10)));
    expect(table['Validation previous mean']).toBe(average(history.history.val_loss.slice(-20, -10)));
    expect(table['Validation recent mean']).toBe(average(history.history.val_loss.slice(-10)));
  }
});`;
async function run(code: string, probe = false) {
  return parseAndRunTests(
    (probe ? captureProbe : "") + code,
    exercise.testCode + (probe ? verifyFullHistory : ""),
    25_000,
  );
}
function captures(artifacts: ExerciseArtifact[] | undefined) {
  const valid = validateArtifacts(artifacts);
  expect(valid).toHaveLength(2);
  const [chart, table] = valid;
  if (chart?.kind !== "series" || table?.kind !== "table")
    throw Error("Missing paired actual history and diagnosis");
  expect(chart.title).toBe("Your training and validation losses");
  expect(chart.series.map((series) => series.name)).toEqual([
    "Training",
    "Validation",
  ]);
  expect(table.title).toBe("Your full-history diagnosis");
  expect(table.columns).toEqual(["Measure", "Value"]);
  expect(table.rows).toHaveLength(12);
  const decoded = readLessonResultExplanation("training-loop-exercise", valid);
  if (decoded?.kind !== "training-history")
    throw Error("Missing decoded actual history");
  const fields = Object.fromEntries(table.rows);
  expect(decoded.epochs).toBe(fields["Completed epochs"]);
  expect(decoded.status).toBe(fields["Diagnosis status"]);
  expect(decoded.returned).toBe(fields["Returned diagnosis"]);
  expect(decoded.detail).toBe(fields["Diagnosis detail"]);
  expect(decoded.samples).toEqual(
    chart.labels.map((epoch, index) => ({
      epoch: Number(epoch),
      training: chart.series[0]!.values[index],
      validation: chart.series[1]!.values[index],
    })),
  );
  if (decoded.windows) {
    expect(decoded.windows.training).toEqual([
      fields["Training previous mean"],
      fields["Training recent mean"],
    ]);
    expect(decoded.windows.validation).toEqual([
      fields["Validation previous mean"],
      fields["Validation recent mean"],
    ]);
  }
  return { chart, table: Object.fromEntries(table.rows) };
}

describe("full-history diagnosis through the shipped exercise worker", () => {
  it(
    "keeps the six canonical checks, actual series, full-window means, and a single fit",
    { timeout: 30_000 },
    async () => {
      const result = await run(exercise.solutionCode, true);
      expect(result.errored).not.toBe(true);
      expect(result.results).toHaveLength(7);
      expect(result.results.filter((check) => !check.passed)).toEqual([]);
      const { chart, table } = captures(result.artifacts);
      const n = table["Completed epochs"] as number;
      expect(chart.labels).toHaveLength(Math.min(64, n));
      expect(table["Diagnosis status"]).toBe("returned");
      expect(table["Diagnosis detail"]).toBe("");
    },
  );

  it(
    "accepts a genuine five-epoch budget with an insufficient-history result",
    { timeout: 30_000 },
    async () => {
      const result = await run(shortSolution, true);
      expect(result.results.filter((check) => !check.passed)).toEqual([]);
      const { chart, table } = captures(result.artifacts);
      expect(chart.labels).toEqual(["1", "2", "3", "4", "5"]);
      expect(table["Completed epochs"]).toBe(5);
      expect(table["Returned diagnosis"]).toBe("insufficient-history");
      for (const name of [
        "Previous window first epoch",
        "Previous window last epoch",
        "Recent window first epoch",
        "Recent window last epoch",
        "Training previous mean",
        "Training recent mean",
        "Validation previous mean",
        "Validation recent mean",
      ])
        expect(table[name]).toBeNull();
    },
  );

  it(
    "accepts a real 500-epoch control run and keeps original sampling and window indices",
    { timeout: 30_000 },
    async () => {
      // A deterministic lightweight control reaches its budget. It changes no authored fixture.
      const code = `
const trainX = tf.ones([100, 3]);
const trainY = tf.ones([100, 1]);
const model = tf.sequential({layers: [tf.layers.dense({inputShape:[3], units:1, kernelInitializer:'zeros', biasInitializer:'zeros'})]});
model.compile({optimizer:tf.train.sgd(0.0002), loss:'meanSquaredError'});
function makeEarlyStopping() { return tf.callbacks.earlyStopping({monitor:'val_loss', patience:5, minDelta:0}); }
const history = await model.fit(trainX, trainY, {epochs:500, batchSize:32, validationSplit:0.2, callbacks:makeEarlyStopping()});
${diagnosisSource.replace("function diagnose(", "function referenceDiagnose(")}
let firstDiagnosis = true;
function diagnose(training, validation) {
  if (firstDiagnosis) {
    firstDiagnosis = false;
    if (training.length !== 500 || validation.length !== 500) throw Error('Diagnosis needs all 500 entries');
    if (training === history.history.loss || validation === history.history.val_loss) throw Error('Pass copies of both histories');
  }
  return referenceDiagnose(training, validation);
}`;
      const result = await run(code, true);
      expect(result.results.filter((check) => !check.passed)).toEqual([]);
      const { chart, table } = captures(result.artifacts);
      expect(table["Completed epochs"]).toBe(500);
      expect(chart.labels).toHaveLength(64);
      expect(chart.labels[0]).toBe("1");
      expect(chart.labels.at(-1)).toBe("500");
      expect(table["Previous window first epoch"]).toBe(481);
      expect(table["Previous window last epoch"]).toBe(490);
      expect(table["Recent window first epoch"]).toBe(491);
      expect(table["Recent window last epoch"]).toBe(500);
    },
  );

  it(
    "passes argument copies while preserving raw curves before a mutating diagnosis",
    { timeout: 30_000 },
    async () => {
      const code =
        shortSolution.replace(
          "function diagnose(",
          "function referenceDiagnose(",
        ) +
        `
function diagnose(training, validation) {
  const label = referenceDiagnose(training, validation);
  training.fill(999);
  validation.length = 0;
  return label;
}`;
      const result = await run(code, true);
      expect(result.results.filter((check) => !check.passed)).toEqual([]);
      const { chart, table } = captures(result.artifacts);
      expect(chart.series[0]!.values.every((value) => value !== 999)).toBe(
        true,
      );
      expect(table["Returned diagnosis"]).toBe("insufficient-history");
    },
  );

  it.each([
    [
      "throwing",
      "throw new Error('actual diagnosis failed'.repeat(40))",
      "threw",
      null,
    ],
    ["unreadable thrown value", "throw Object.create(null)", "threw", null],
    ["invalid", "return 902", "invalid", null],
    ["wrong valid label", "return 'plateau'", "returned", "plateau"],
  ])(
    "retains measured curves and the actual %s diagnosis when its check fails",
    { timeout: 30_000 },
    async (_name, body, status, label) => {
      const code =
        shortSolution.replace(
          "function diagnose(",
          "function referenceDiagnose(",
        ) +
        `
let diagnosisInvocations = 0;
function diagnose(training, validation) {
  if (diagnosisInvocations++ === 0) { ${body}; }
  return referenceDiagnose(training, validation);
}`;
      const result = await run(code);
      expect(result.errored).not.toBe(true);
      expect(result.results).toHaveLength(6);
      expect(
        result.results
          .filter((check) => !check.passed)
          .map((check) => check.name),
      ).toEqual([
        "Early stopping and observed trends > returns aligned finite training and validation histories from a real fit",
      ]);
      const { chart, table } = captures(result.artifacts);
      expect(chart.labels).toHaveLength(5);
      expect(table["Diagnosis status"]).toBe(status);
      expect(table["Returned diagnosis"]).toBe(label);
      if (status !== "returned")
        expect(String(table["Diagnosis detail"]).length).toBeGreaterThan(0);
      expect(String(table["Diagnosis detail"]).length).toBeLessThanOrEqual(200);
    },
  );
});
