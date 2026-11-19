// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import type { ExerciseArtifact } from "@tensorcraft/ui";
import { parseAndRunTests } from "../../../packages/ui/src/mdx/exercise-runner-node";
import { validateArtifacts } from "../../../packages/ui/src/mdx/exercise-artifacts.mjs";
import {
  readLessonResultExplanation,
  supportsLessonResultExplanation,
} from "./lesson-result-explanations";
import {
  expectedHistoryLabel,
  windowTrend,
} from "./training-result-explanations";

function table(artifacts: ExerciseArtifact[], index: number) {
  const artifact = artifacts[index];
  if (artifact?.kind !== "table") throw Error("Expected table");
  return artifact;
}
function series(artifacts: ExerciseArtifact[], index: number) {
  const artifact = artifacts[index];
  if (artifact?.kind !== "series") throw Error("Expected series");
  return artifact;
}
function lossArtifacts(): ExerciseArtifact[] {
  return [
    {
      kind: "table",
      title: "Inputs and your returned MSE",
      columns: ["Position", "Label", "Prediction", "Returned batch MSE"],
      rows: [
        [1, 3, 2.5, 902],
        [2, -0.5, 0, 902],
        [3, 2, Math.fround(2.1), 902],
        [4, 1, Math.fround(1.3), 902],
      ],
    },
    {
      kind: "table",
      title: "Farah's loss comparison",
      columns: ["Test case", "Loss"],
      rows: [
        ["Confident and correct", 0],
        ["Confident and wrong", 0],
      ],
    },
    {
      kind: "table",
      title: "Logits used for your loss comparison",
      columns: ["Test case", "Position", "Label", "Logit"],
      rows: [
        ["Confident and correct", 1, 1, 3],
        ["Confident and correct", 2, 0, -3],
        ["Confident and wrong", 1, 1, -3],
        ["Confident and wrong", 2, 0, 3],
      ],
    },
  ];
}
function scalarArtifacts(): ExerciseArtifact[] {
  return [
    {
      kind: "table",
      title: "Your first weight update",
      columns: ["Learning rate", "Stored gradient", "Updated weight"],
      rows: [[0.1, 10, 4]],
    },
    {
      kind: "series",
      title: "The weight after three of your steps",
      xLabel: "Update",
      yLabel: "Weight",
      labels: ["1", "2", "3"],
      series: [{ name: "Weight", values: [4, 3.2, 2.56] }],
    },
    {
      kind: "table",
      title: "Operands from your next two updates",
      columns: [
        "Update",
        "Weight before",
        "Stored gradient",
        "Learning rate",
        "Weight after",
        "Loss after",
      ],
      rows: [
        [2, 4, 8, 0.1, 3.2, 10.24],
        [3, 3.2, 6.4, 0.1, 2.56, 6.5536],
      ],
    },
  ];
}
function historyArtifacts(epochs = 500): ExerciseArtifact[] {
  const hasWindows = epochs >= 20;
  const training = Array.from({ length: epochs }, (_, index) =>
    hasWindows && index >= epochs - 10 ? 0.8 : 1,
  );
  const validation = Array.from({ length: epochs }, (_, index) =>
    hasWindows && index >= epochs - 10 ? 1.2 : 1,
  );
  const shown = Math.min(64, epochs);
  const indices = Array.from({ length: shown }, (_, index) =>
    Math.round((index * (epochs - 1)) / Math.max(1, shown - 1)),
  );
  return [
    {
      kind: "series",
      title: "Your training and validation losses",
      xLabel: "Epoch",
      yLabel: "Loss",
      labels: indices.map((index) => String(index + 1)),
      series: [
        { name: "Training", values: indices.map((index) => training[index]!) },
        {
          name: "Validation",
          values: indices.map((index) => validation[index]!),
        },
      ],
    },
    {
      kind: "table",
      title: "Your full-history diagnosis",
      columns: ["Measure", "Value"],
      rows: [
        ["Completed epochs", epochs],
        ["Previous window first epoch", hasWindows ? epochs - 19 : null],
        ["Previous window last epoch", hasWindows ? epochs - 10 : null],
        ["Recent window first epoch", hasWindows ? epochs - 9 : null],
        ["Recent window last epoch", hasWindows ? epochs : null],
        ["Training previous mean", hasWindows ? 1 : null],
        ["Training recent mean", hasWindows ? 0.8 : null],
        ["Validation previous mean", hasWindows ? 1 : null],
        ["Validation recent mean", hasWindows ? 1.2 : null],
        ["Diagnosis status", "returned"],
        [
          "Returned diagnosis",
          hasWindows ? "train-down-validation-up" : "insufficient-history",
        ],
        ["Diagnosis detail", ""],
      ],
    },
  ];
}

describe("the bounded training-result contracts", () => {
  it("preserves the reported MSE, BCE, float32 operands, and separate partial groups", () => {
    const artifacts = lossArtifacts();
    const decoded = readLessonResultExplanation("mse-loss", artifacts);
    expect(decoded?.kind).toBe("loss-comparison");
    if (decoded?.kind !== "loss-comparison")
      throw Error("Missing loss comparison");
    expect(decoded.mse?.returned).toBe(902);
    expect(decoded.mse?.rows[2]!.prediction).toBe(Math.fround(2.1));
    expect(decoded.bce?.map((item) => item.returned)).toEqual([0, 0]);
    expect(decoded.bce?.[1]!.rows.map((row) => row.logit)).toEqual([-3, 3]);
    table(artifacts, 0).rows[0]![3] = 1;
    expect(decoded.mse?.returned).toBe(902);
    expect(
      readLessonResultExplanation("mse-loss", lossArtifacts().slice(0, 1))
        ?.kind,
    ).toBe("loss-comparison");
    expect(
      readLessonResultExplanation("mse-loss", lossArtifacts().slice(1))?.kind,
    ).toBe("loss-comparison");
  });

  it.each([
    "duplicate",
    "columns",
    "position",
    "different-batch-loss",
    "case-order",
    "missing-operands",
    "binary-label",
    "nonfinite",
  ])("falls back for %s loss contracts", (failure) => {
    const artifacts = lossArtifacts();
    if (failure === "duplicate") artifacts.push(artifacts[0]!);
    if (failure === "columns") table(artifacts, 0).columns.reverse();
    if (failure === "position") table(artifacts, 0).rows[1]![0] = 1;
    if (failure === "different-batch-loss") table(artifacts, 0).rows[1]![3] = 1;
    if (failure === "case-order") table(artifacts, 1).rows.reverse();
    if (failure === "missing-operands") artifacts.pop();
    if (failure === "binary-label") table(artifacts, 2).rows[0]![2] = 2;
    if (failure === "nonfinite") table(artifacts, 2).rows[0]![3] = Infinity;
    expect(readLessonResultExplanation("mse-loss", artifacts)).toBeNull();
  });

  it("pairs scalar operands with the captured trace while retaining a wrong finite result", () => {
    const artifacts = scalarArtifacts();
    series(artifacts, 1).series[0]!.values[2] = 902;
    table(artifacts, 2).rows[1]![4] = 902;
    const decoded = readLessonResultExplanation("gradient-step", artifacts);
    expect(decoded).toEqual({
      kind: "scalar-updates",
      first: { rate: 0.1, gradient: 10, after: 4 },
      steps: [
        {
          update: 2,
          before: 4,
          gradient: 8,
          rate: 0.1,
          after: 3.2,
          loss: 10.24,
        },
        {
          update: 3,
          before: 3.2,
          gradient: 6.4,
          rate: 0.1,
          after: 902,
          loss: 6.5536,
        },
      ],
    });
  });

  it.each([
    "missing",
    "duplicate",
    "columns",
    "update-order",
    "trace-labels",
    "trace-axis",
    "join-before",
    "join-after",
    "nonnumeric",
  ])("falls back for %s scalar-update contracts", (failure) => {
    const artifacts = scalarArtifacts();
    if (failure === "missing") artifacts.pop();
    if (failure === "duplicate") artifacts.push(artifacts[0]!);
    if (failure === "columns") table(artifacts, 2).columns.reverse();
    if (failure === "update-order") table(artifacts, 2).rows.reverse();
    if (failure === "trace-labels") series(artifacts, 1).labels.reverse();
    if (failure === "trace-axis") series(artifacts, 1).yLabel = "Loss";
    if (failure === "join-before") table(artifacts, 2).rows[0]![1] = 902;
    if (failure === "join-after") table(artifacts, 2).rows[0]![4] = 902;
    if (failure === "nonnumeric") table(artifacts, 2).rows[0]![2] = "unknown";
    expect(readLessonResultExplanation("gradient-step", artifacts)).toBeNull();
  });

  it.each([1, 5, 19, 20, 64, 65, 500])(
    "keeps original epoch samples and full-history windows for %i epochs",
    (epochs) => {
      const decoded = readLessonResultExplanation(
        "training-loop-exercise",
        historyArtifacts(epochs),
      );
      expect(decoded?.kind).toBe("training-history");
      if (decoded?.kind !== "training-history")
        throw Error("Missing training history");
      expect(decoded.samples).toHaveLength(Math.min(64, epochs));
      expect(decoded.samples[0]!.epoch).toBe(1);
      expect(decoded.samples.at(-1)!.epoch).toBe(epochs);
      expect(decoded.windows?.previous ?? null).toEqual(
        epochs < 20 ? null : [epochs - 19, epochs - 10],
      );
      expect(decoded.windows?.recent ?? null).toEqual(
        epochs < 20 ? null : [epochs - 9, epochs],
      );
      expect(expectedHistoryLabel(decoded)).toBe(decoded.returned);
    },
  );

  it.each(["threw", "invalid", "wrong-valid-label"])(
    "keeps %s history output separate from the reference diagnosis",
    (failure) => {
      const artifacts = historyArtifacts();
      const rows = table(artifacts, 1).rows;
      rows[9]![1] = failure === "wrong-valid-label" ? "returned" : failure;
      rows[10]![1] = failure === "wrong-valid-label" ? "plateau" : null;
      rows[11]![1] = failure === "wrong-valid-label" ? "" : "diagnose failed";
      const decoded = readLessonResultExplanation(
        "training-loop-exercise",
        artifacts,
      );
      if (decoded?.kind !== "training-history")
        throw Error("Missing useful history");
      expect(decoded.status).toBe(rows[9]![1]);
      expect(decoded.returned).toBe(rows[10]![1]);
      expect(expectedHistoryLabel(decoded)).toBe("train-down-validation-up");
    },
  );

  it.each([
    "missing",
    "duplicate",
    "row-order",
    "epochs",
    "sample-map",
    "series-order",
    "negative-loss",
    "window-map",
    "negative-mean",
    "status",
    "unknown-label",
    "failed-with-label",
    "long-detail",
  ])("falls back for %s history contracts", (failure) => {
    const artifacts = historyArtifacts();
    if (failure === "missing") artifacts.pop();
    if (failure === "duplicate") artifacts.push(artifacts[1]!);
    if (failure === "row-order") table(artifacts, 1).rows.reverse();
    if (failure === "epochs") table(artifacts, 1).rows[0]![1] = 501;
    if (failure === "sample-map")
      series(artifacts, 0).labels = Array.from({ length: 64 }, (_, i) =>
        String(i + 1),
      );
    if (failure === "series-order") series(artifacts, 0).series.reverse();
    if (failure === "negative-loss")
      series(artifacts, 0).series[0]!.values[0] = -1;
    if (failure === "window-map") table(artifacts, 1).rows[1]![1] = 480;
    if (failure === "negative-mean") table(artifacts, 1).rows[5]![1] = -1;
    if (failure === "status") table(artifacts, 1).rows[9]![1] = "passed";
    if (failure === "unknown-label")
      table(artifacts, 1).rows[10]![1] = "overfitting";
    if (failure === "failed-with-label")
      table(artifacts, 1).rows[9]![1] = "threw";
    if (failure === "long-detail")
      table(artifacts, 1).rows[11]![1] = "x".repeat(501);
    expect(
      readLessonResultExplanation("training-loop-exercise", artifacts),
    ).toBeNull();
  });

  it("handles zero and tolerance before applying the ordered reference rule", () => {
    expect(windowTrend(0, 0)).toBe("flat");
    expect(windowTrend(0, 1e-14)).toBe("up");
    expect(windowTrend(1, 0.95)).toBe("flat");
    expect(windowTrend(1, 1.05)).toBe("flat");
    expect(windowTrend(1, 0.95 - 0.5e-12)).toBe("flat");
    expect(windowTrend(1, 1.05 + 2e-12)).toBe("up");
    expect(
      expectedHistoryLabel({
        windows: {
          previous: [1, 10],
          recent: [11, 20],
          training: [1, 1.2],
          validation: [1, 0.8],
        },
      }),
    ).toBe("validation-improving");
    const short = historyArtifacts(5);
    table(short, 1).rows[5]![1] = 1;
    expect(
      readLessonResultExplanation("training-loop-exercise", short),
    ).toBeNull();
  });

  it("routes only known training slugs and leaves unknown or unbounded output ordinary", () => {
    for (const slug of [
      "mse-loss",
      "gradient-step",
      "training-loop-exercise",
    ]) {
      expect(supportsLessonResultExplanation(slug)).toBe(true);
      for (const raw of [
        undefined,
        null,
        {},
        [],
        Array(5).fill(lossArtifacts()[0]),
      ])
        expect(readLessonResultExplanation(slug, raw)).toBeNull();
    }
    expect(readLessonResultExplanation("unknown", lossArtifacts())).toBeNull();
  });
});

const contentRequire = createRequire(
  new URL("../../../packages/content/package.json", import.meta.url),
);
const { parse } = createRequire(contentRequire.resolve("velite"))("yaml");
function exercise(slug: string): { solutionCode: string; testCode: string } {
  return parse(
    readFileSync(
      new URL(
        `../../../packages/content/content/deep-orbit/training-loop/exercises/${slug}.yaml`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}

describe("training captures through the shipped Worker", () => {
  it.each([
    ["mse-loss", 8, 3, "loss-comparison"],
    ["gradient-step", 6, 3, "scalar-updates"],
  ] as const)(
    "decodes the current real %s operands",
    { timeout: 30_000 },
    async (slug, checks, outputs, kind) => {
      const source = exercise(slug);
      const run = await parseAndRunTests(source.solutionCode, source.testCode);
      expect(run.errored).not.toBe(true);
      expect(run.results).toHaveLength(checks);
      expect(run.results.filter((check) => !check.passed)).toEqual([]);
      const artifacts = validateArtifacts(run.artifacts);
      expect(artifacts).toHaveLength(outputs);
      const decoded = readLessonResultExplanation(slug, artifacts);
      expect(decoded?.kind).toBe(kind);
      if (decoded?.kind === "loss-comparison") {
        expect(decoded.mse?.rows[2]!.prediction).toBe(Math.fround(2.1));
        expect(decoded.mse?.returned).toBeCloseTo(0.15, 6);
        expect(decoded.bce?.[0]!.returned).toBeCloseTo(0.0485873, 6);
        expect(decoded.bce?.[1]!.returned).toBeCloseTo(3.0485873, 6);
      }
      if (decoded?.kind === "scalar-updates") {
        expect(decoded.first).toEqual({ rate: 0.1, gradient: 10, after: 4 });
        expect(decoded.steps[0]!.before).toBe(4);
        expect(decoded.steps[0]!.gradient).toBe(8);
        expect(decoded.steps[1]!.gradient).toBeCloseTo(6.4, 5);
        expect(decoded.steps[1]!.after).toBe(table(artifacts, 2).rows[1]![4]);
      }
    },
  );

  it("retains wrong finite zero BCE and its actual operands after graded failure", async () => {
    const source = exercise("mse-loss");
    const code = source.solutionCode.replace(
      "return tf.losses.sigmoidCrossEntropy(labels, logits);",
      "return tf.scalar(0);",
    );
    expect(code).not.toBe(source.solutionCode);
    const run = await parseAndRunTests(code, source.testCode);
    expect(
      run.results.some(
        (check) => !check.passed && check.name.includes("confident and right"),
      ),
    ).toBe(true);
    const decoded = readLessonResultExplanation("mse-loss", run.artifacts);
    if (decoded?.kind !== "loss-comparison")
      throw Error("Missing useful failed loss result");
    expect(decoded.bce?.map((item) => item.returned)).toEqual([0, 0]);
    expect(decoded.bce?.[1]!.rows).toEqual([
      { position: 1, label: 1, logit: -3 },
      { position: 2, label: 0, logit: 3 },
    ]);
  });

  it("rejects replacement without disposing the prior gradient and retains the initial update", async () => {
    const source = exercise("gradient-step");
    const code = source.solutionCode.replace(
      "if (gradient) gradient.dispose();",
      "",
    );
    expect(code).not.toBe(source.solutionCode);
    const run = await parseAndRunTests(code, source.testCode);
    const failure = run.results.find((check) =>
      check.name.endsWith("three steps in a row keep walking downhill"),
    );
    expect(failure?.passed).toBe(false);
    expect(failure?.error).toContain("Dispose of the old gradient");
    const artifacts = validateArtifacts(run.artifacts);
    expect(table(artifacts, 0).title).toBe("Your first weight update");
    expect(table(artifacts, 0).rows).toEqual([[0.1, 10, 4]]);
    expect(readLessonResultExplanation("gradient-step", artifacts)).toBeNull();
  });

  it("accepts an autograd implementation that reuses one live gradient variable", async () => {
    const source = exercise("gradient-step");
    const code = `
const weight = tf.tidy(() => tf.variable(tf.scalar(5)));
const learningRate = 0.1;
let gradient;
const lossFn = () => weight.square().asScalar();
function step(fn) {
  tf.tidy(() => {
    const next = tf.variableGrads(fn, [weight]).grads[weight.name];
    if (gradient) gradient.assign(next);
    else gradient = tf.variable(next, false);
    weight.assign(weight.sub(gradient.mul(learningRate)));
  });
}
step(lossFn);`;
    const run = await parseAndRunTests(code, source.testCode);
    expect(run.results).toHaveLength(6);
    expect(run.results.filter((check) => !check.passed)).toEqual([]);
    expect(
      readLessonResultExplanation("gradient-step", run.artifacts)?.kind,
    ).toBe("scalar-updates");
  });

  it("also rejects a leak confined to the third update", async () => {
    const source = exercise("gradient-step");
    const code =
      "let replacementCount = 0;\n" +
      source.solutionCode.replace(
        "if (gradient) gradient.dispose();",
        "if (gradient && ++replacementCount !== 2) gradient.dispose();",
      );
    const run = await parseAndRunTests(code, source.testCode);
    expect(
      run.results.filter((check) => !check.passed).map((check) => check.name),
    ).toEqual(["Gradient Step > three steps in a row keep walking downhill"]);
    expect(run.results.find((check) => !check.passed)?.error).toContain(
      "Dispose of the old gradient",
    );
    expect(table(validateArtifacts(run.artifacts), 0).rows).toEqual([
      [0.1, 10, 4],
    ]);
  });
});
