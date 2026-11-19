// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as tf from "@tensorflow/tfjs";
import { beforeAll, describe, expect, it } from "vitest";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { DECISIONS } from "../mdx/decision-task-data";
import { initialInvestigationValues } from "./investigation-types";

const spec = NUMERIC_INVESTIGATIONS["evaluating-deep-scan"]!;

const contentRequire = createRequire(
  new URL("../../../../../packages/content/package.json", import.meta.url),
);
const { parse } = createRequire(contentRequire.resolve("velite"))("yaml");
const exercise = parse(
  readFileSync(
    new URL(
      "../../../../../packages/content/content/deep-orbit/training-loop/exercises/deep-scan-eval.yaml",
      import.meta.url,
    ),
    "utf8",
  ),
) as { solutionCode: string };
const mdx = readFileSync(
  new URL(
    "../../../../../packages/content/content/deep-orbit/training-loop/05-evaluating-deep-scan.mdx",
    import.meta.url,
  ),
  "utf8",
);
const baselineCode = mdx.match(
  /<CodeBlock[^>]*title="constant-baseline.ts"[^>]*>\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/,
)![1]!;

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

describe("one evaluation case before aggregate results", () => {
  it("traces exact cutoff ties and changed predictions without changing the supplied label", () => {
    const run = (threshold: number) =>
      spec.evaluate(
        { ...initialInvestigationValues(spec), threshold, selectedCase: 3 },
        "standard",
      );
    const tied = run(0.41);
    const below = run(0.4);
    expect(tied.graphics[1]).toMatchObject({
      kind: "pipeline",
      label: "Selected case decision",
      values: [
        "Case 3: supplied label 1",
        "Score 0.41 ≤ cutoff 0.41",
        "Predict 0",
        "FN: missed anomaly",
      ],
    });
    expect(below.graphics[1]!.values).toEqual([
      "Case 3: supplied label 1",
      "Score 0.41 > cutoff 0.4",
      "Predict 1",
      "TP: matches the label",
    ]);
    expect(tied.answer).toBe(Number(below.answer) + 1);
    expect(tied.graphics[0]!.highlight).toEqual([2]);
    expect(
      tied.graphics.findIndex(
        (graphic) => graphic.label === "Selected case decision",
      ),
    ).toBeLessThan(
      tied.graphics.findIndex(
        (graphic) =>
          graphic.label === "Correct predictions, false alarms and misses",
      ),
    );
    const decision = new Function(
      `${tied.code}\nreturn { predicted, category };`,
    )();
    expect(decision).toEqual({ predicted: 0, category: "FN" });
  });

  it("preserves all twelve case categories and the independent cost activity", () => {
    const expected = {
      standard: [
        "TN",
        "TN",
        "FN",
        "TN",
        "FP",
        "TP",
        "TP",
        "TN",
        "TP",
        "TN",
        "TP",
        "FP",
      ],
      changed: [
        "TN",
        "TN",
        "FN",
        "TN",
        "FP",
        "TP",
        "FN",
        "TN",
        "FN",
        "TN",
        "TP",
        "FP",
      ],
    };
    for (const caseId of ["standard", "changed"] as const) {
      const categories = expected[caseId];
      const counts = ["TP", "FP", "FN", "TN"].map(
        (name) => categories.filter((category) => category === name).length,
      );
      for (let selectedCase = 1; selectedCase <= 12; selectedCase++) {
        const result = spec.evaluate(
          { ...initialInvestigationValues(spec, caseId), selectedCase },
          caseId,
        );
        expect(
          result.graphics.find(
            (graphic) => graphic.label === "Categories at this threshold",
          )!.values,
        ).toEqual(categories);
        const decision = new Function(`${result.code}\nreturn category;`)();
        expect(decision).toBe(categories[selectedCase - 1]);
        expect(result.answer).toBe(counts[2]);
        expect(
          result.graphics.find(
            (graphic) =>
              graphic.label === "Correct predictions, false alarms and misses",
          )!.values,
        ).toEqual(counts);
      }
    }
    const decision = DECISIONS["review-costs"]!;
    const costs = decision.counts!.map((row) => row.fp + 8 * row.fn);
    expect(costs).toEqual([80, 28, 42]);
    expect(decision.counts![costs.indexOf(Math.min(...costs))]!.policy).toBe(
      "Model",
    );
    expect(decision.correct).toBe("model");
  });

  it("matches the installed binary-accuracy metric's strict 0.5 rule", () => {
    const before = tf.memory().numTensors;
    const accuracy = tf.tidy(() =>
      Array.from(
        tf.metrics
          .binaryAccuracy(
            tf.tensor2d([[0], [1], [1]]),
            tf.tensor2d([[0.5], [0.5], [0.5001]]),
          )
          .dataSync(),
      ),
    );
    expect(accuracy).toEqual([1, 0, 1]);
    expect(tf.memory().numTensors).toBe(before);
  });

  it("executes the taught baseline against the actual authored tensor generator", () => {
    const before = tf.memory().numTensors;
    const setup = exercise.solutionCode.split(
      "const model = tf.sequential();",
    )[0]!;
    expect(setup).not.toBe(exercise.solutionCode);
    const result = new Function(
      "tf",
      "console",
      "testAcc",
      `${setup}
      ${baselineCode}
      const trainLabels = Array.from(trainY.dataSync());
      const labels = Array.from(testY.dataSync());
      tf.dispose([trainX, trainY, testX, testY]);
      return { baselineClass, baselineCorrect, baselineAccuracy, trainLabels, labels };
    `,
    )(tf, { log: () => {} }, 0.5) as {
      baselineClass: number;
      baselineCorrect: number;
      baselineAccuracy: number;
      trainLabels: number[];
      labels: number[];
    };
    expect(result.trainLabels.filter((label) => label === 0)).toHaveLength(50);
    expect(result.trainLabels.filter((label) => label === 1)).toHaveLength(50);
    expect(result.labels).toEqual([...Array(20).fill(0), ...Array(23).fill(1)]);
    expect(result.baselineClass).toBe(0);
    expect(result.baselineCorrect).toBe(20);
    expect(result.baselineAccuracy).toBe(20 / 43);
    expect(
      result.labels.filter((label) => label !== result.baselineClass),
    ).toHaveLength(23);
    expect(tf.memory().numTensors).toBe(before);
  });
});
