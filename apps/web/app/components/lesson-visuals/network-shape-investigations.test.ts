// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { validateArtifacts } from "../../../../../packages/ui/src/mdx/exercise-artifacts.mjs";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { initialInvestigationValues } from "./investigation-types";

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

const contentPath = resolve(
  __dirname,
  "../../../../../packages/content/content/deep-orbit/neural-networks",
);
const source = (path: string) =>
  readFileSync(resolve(contentPath, path), "utf8");
function blockText(text: string, field: string) {
  const block = text.match(
    new RegExp(`^${field}: \\|\\n((?:  .*\\n|\\n)+)`, "m"),
  );
  if (!block) throw new Error(`Missing ${field}.`);
  return block[1]!.replace(/^ {2}/gm, "");
}
function codeBlocks(text: string, titles: string[]) {
  const blocks = new Map(
    [
      ...text.matchAll(
        /<CodeBlock[^>]*title="([^"]+)"[^>]*>\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
      ),
    ].map(([, title, code]) => [title!, code!] as const),
  );
  return titles
    .map((title) => {
      expect(blocks.has(title), title).toBe(true);
      return blocks.get(title)!;
    })
    .join("\n");
}

const layers = NUMERIC_INVESTIGATIONS["layers-and-architecture"]!;
const forward = NUMERIC_INVESTIGATIONS["forward-pass"]!;
const forwardExercise = source("exercises/forward-pass.yaml");
const forwardSolution = blockText(forwardExercise, "solutionCode");
const forwardChecks = blockText(forwardExercise, "testCode");

function gradeForward(code = forwardSolution) {
  const checks: { name: string; passed: boolean; error?: string }[] = [];
  const artifacts: {
    title: string;
    columns: string[];
    rows: (number | string)[][];
  }[] = [];
  const register = (name: string, check: () => void) => {
    try {
      check();
      checks.push({ name, passed: true });
    } catch (error) {
      checks.push({ name, passed: false, error: String(error) });
    }
  };
  tf.engine().startScope();
  try {
    new Function(
      "tf",
      "expect",
      "describe",
      "it",
      "recordResult",
      `${code}\ntry {\n${forwardChecks}\n} finally { model.dispose(); }`,
    )(
      tf,
      expect,
      (_name: string, body: () => void) => body(),
      register,
      (artifact: (typeof artifacts)[number]) => artifacts.push(artifact),
    );
  } finally {
    tf.engine().endScope();
  }
  return { checks, artifacts };
}

describe("the identified bridge and practice architecture counts", () => {
  it("matches each actual dense layer at every visible input width", () => {
    const before = tf.memory().numTensors;
    for (const example of layers.cases) {
      const units = example.id === "standard" ? [32, 16, 1] : [16, 8, 1];
      for (let inputs = 1; inputs <= 12; inputs++) {
        const model = tf.sequential();
        units.forEach((count, i) =>
          model.add(
            tf.layers.dense({
              units: count,
              activation: i === 2 ? "sigmoid" : "relu",
              ...(i === 0 ? { inputShape: [inputs] } : {}),
            }),
          ),
        );
        try {
          for (let layer = 0; layer < 3; layer++) {
            const result = layers.evaluate({ inputs, layer }, example.id);
            const calculation = new Function(
              `${result.code}\nreturn { incoming, weights, subtotals, total };`,
            )() as {
              incoming: number[];
              weights: number[];
              subtotals: number[];
              total: number;
            };
            expect(result.answer).toBe(model.countParams());
            expect(calculation.total).toBe(model.countParams());
            expect(calculation.subtotals).toEqual(
              model.layers.map((item) => item.countParams()),
            );
            expect(result.graphics[3]!.values).toEqual(calculation.weights);
            expect(result.graphics[4]!.highlight).toEqual([layer]);
            model.layers.forEach((item, i) => {
              const [kernel, bias] = item.getWeights();
              expect(kernel!.shape).toEqual([
                calculation.incoming[i],
                units[i],
              ]);
              expect(bias!.shape).toEqual([units[i]]);
              expect(calculation.weights[i]).toBe(kernel!.size);
            });
            if (example.id === "changed")
              expect(result.answer).toBe(16 * inputs + 161);
          }
        } finally {
          model.dispose();
        }
      }
    }
    expect(
      layers.evaluate(initialInvestigationValues(layers), "standard").answer,
    ).toBe(673);
    expect(
      layers.evaluate(initialInvestigationValues(layers, "changed"), "changed")
        .answer,
    ).toBe(225);
    const quote = new Function(
      "console",
      `${codeBlocks(source("03-layers-and-architecture.mdx"), ["parameter-quote.js"])}\nreturn { layerCounts, quotedParams };`,
    )({ log() {} });
    expect(quote).toEqual({ layerCounts: [112, 136, 9], quotedParams: 257 });
    expect(tf.memory().numTensors).toBe(before);
  });
});

describe("the single linear diagnostic forward pass", () => {
  it("executes the actual staged examples with actual initialized weights and releases them", () => {
    const before = tf.memory().numTensors;
    const logs: unknown[][] = [];
    const code = codeBlocks(source("04-forward-pass.mdx"), [
      "diagnostic-forward.js",
      "inspect-diagnostic-unit.js",
      "diagnostic-batches.js",
    ]);
    const actual = new Function(
      "tf",
      "console",
      `${code}\nreturn { manual, captured, selectedRow, products };`,
    )(tf, {
      log: (...values: unknown[]) => logs.push(values),
    });
    expect(actual.manual).toBeCloseTo(actual.captured, 5);
    expect(actual.selectedRow).toEqual([3, 4]);
    expect(actual.products).toHaveLength(2);
    expect(logs[0]).toEqual([[2, 3]]);
    expect(logs[3]).toEqual([
      [1, 2],
      [1, 3],
    ]);
    expect(logs[4]).toEqual([[3, 3]]);
    expect(tf.memory().numTensors).toBe(before);
  });

  it("matches the fixed reference to real TensorFlow.js for each row, unit, and input change", () => {
    const before = tf.memory().numTensors;
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 3, inputShape: [2] }));
    tf.tidy(() =>
      model.setWeights([
        tf.tensor2d([
          [0.5, -1, 2],
          [1, 0.25, -0.5],
        ]),
        tf.tensor1d([0.1, 0.2, -0.3]),
      ]),
    );
    try {
      for (const example of forward.cases) {
        const initial = initialInvestigationValues(forward, example.id);
        for (let row = 0; row < initial.rows!; row++) {
          for (let unit = 0; unit < 3; unit++) {
            for (const change of [-2, 0, 2]) {
              const result = forward.evaluate(
                { ...initial, row, unit, change },
                example.id,
              );
              const reference = new Function(
                `${result.code}\nreturn { input, output, selected };`,
              )() as {
                input: number[][];
                output: number[][];
                selected: number;
              };
              const actual = tf.tidy(() =>
                (
                  model.predict(tf.tensor2d(reference.input)) as tf.Tensor
                ).arraySync(),
              ) as number[][];
              actual.forEach((values, r) =>
                values.forEach((value, u) => {
                  expect(reference.output[r]![u]!).toBeCloseTo(value, 5);
                }),
              );
              expect(result.answer).toBeCloseTo(actual[row]![unit]!, 5);
              expect(result.graphics[4]!.highlight).toEqual([row * 3 + unit]);
            }
          }
        }
      }
      expect(
        forward.evaluate(
          { ...initialInvestigationValues(forward), row: 0, unit: 1 },
          "standard",
        ).answer,
      ).toBeCloseTo(-0.3);
      expect(
        forward.evaluate(initialInvestigationValues(forward), "standard")
          .answer,
      ).toBeCloseTo(3.7);
      tf.tidy(() => {
        expect(() => model.predict(tf.tensor1d([1, 2]))).toThrow();
        expect(() => model.predict(tf.tensor2d([[1], [2]]))).toThrow();
      });
    } finally {
      model.dispose();
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("captures actual kernel and bias beside matching learner-run outputs", () => {
    const before = tf.memory().numTensors;
    const result = gradeForward();
    expect(result.checks).toHaveLength(6);
    expect(
      result.checks.every((check) => check.passed),
      JSON.stringify(result.checks),
    ).toBe(true);
    expect(result.artifacts).toHaveLength(2);
    expect(validateArtifacts(result.artifacts)).toHaveLength(2);
    const output = result.artifacts[0]!;
    const weights = result.artifacts[1]!;
    expect(output.title).toBe("Your first forward pass");
    expect(weights.title).toBe("Weights used for this forward pass");
    expect(weights.columns).toEqual([
      "Parameter",
      "Unit 1",
      "Unit 2",
      "Unit 3",
    ]);
    expect(weights.rows.map((row) => row[0])).toEqual([
      "Input 1",
      "Input 2",
      "Bias",
    ]);
    for (const [, x1, x2, ...units] of output.rows) {
      units.forEach((actual, unit) => {
        const expected =
          Number(x1) * Number(weights.rows[0]![unit + 1]) +
          Number(x2) * Number(weights.rows[1]![unit + 1]) +
          Number(weights.rows[2]![unit + 1]);
        expect(Number(actual)).toBeCloseTo(expected, 5);
      });
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("rejects an extra layer, a cloned answer, the wrong axis, and changed values", () => {
    const before = tf.memory().numTensors;
    const extra = forwardSolution.replace(
      "function forward(batch)",
      "model.add(tf.layers.activation({ activation: 'linear' }));\nfunction forward(batch)",
    );
    const clone = forwardSolution.replace(
      "return model.predict(batch);",
      "return model.predict(batch).clone();",
    );
    const wrongAxis = forwardSolution.replace(
      "reading.expandDims(0)",
      "reading.expandDims(1)",
    );
    const changedValues = forwardSolution.replace(
      "reading.expandDims(0)",
      "reading.reverse().expandDims(0)",
    );
    const extraResult = gradeForward(extra);
    expect(
      extraResult.checks.find((check) =>
        check.error?.includes("exactly one dense layer"),
      )?.passed,
    ).toBe(false);
    expect(
      gradeForward(clone).checks.find((check) =>
        check.name.includes("one predict call"),
      )?.passed,
    ).toBe(false);
    for (const code of [wrongAxis, changedValues]) {
      expect(
        gradeForward(code).checks.find((check) =>
          check.name.includes("one flat reading"),
        )?.passed,
      ).toBe(false);
    }
    expect(tf.memory().numTensors).toBe(before);
  });
});
