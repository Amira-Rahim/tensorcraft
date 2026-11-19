import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { parseAndRunTests } from "../../../../../packages/ui/src/mdx/exercise-runner-node";
import { stripTypeScript } from "../../../../../packages/ui/src/mdx/strip-typescript";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import {
  initialInvestigationValues,
  investigationControlMax,
} from "./investigation-types";

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

const lessonRoot = resolve(
  import.meta.dirname,
  "../../../../../packages/content/content/deep-orbit/training-loop",
);
const round = (value: number) => Math.round(value * 1000) / 1000;
function run(
  slug: string,
  values: Record<string, number>,
  caseId = "standard",
) {
  const spec = NUMERIC_INVESTIGATIONS[slug]!;
  return spec.evaluate(
    { ...initialInvestigationValues(spec, caseId), ...values },
    caseId,
  );
}
function authoredBlock(lesson: string, title: string) {
  const source = readFileSync(resolve(lessonRoot, lesson), "utf8");
  const match = [
    ...source.matchAll(
      /<CodeBlock language="(?:typescript|javascript)" title="([^"]+)">\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
    ),
  ].find(([, name]) => name === title);
  if (!match) throw Error(`Missing code block ${title}`);
  const code = new Function("return `" + match[2] + "`;")().replace(
    /^import .*?;\s*$/gm,
    "",
  );
  return stripTypeScript(code);
}
function execute(lesson: string, title: string) {
  const before = tf.memory().numTensors;
  const logs: unknown[][] = [];
  new Function("tf", "console", authoredBlock(lesson, title))(tf, {
    log: (...values: unknown[]) => logs.push(values),
  });
  expect(tf.memory().numTensors).toBe(before);
  return logs;
}
function exercise(slug: string) {
  const source = readFileSync(
    resolve(lessonRoot, "exercises", `${slug}.yaml`),
    "utf8",
  );
  const field = (name: string, next: string) =>
    source
      .split(`${name}: |\n`)[1]!
      .split(`\n${next}:`)[0]!
      .replace(/^ {2}/gm, "");
  return {
    starter: field("starterCode", "solutionCode"),
    solution: field("solutionCode", "testCode"),
    tests: field("testCode", "estimatedMinutes"),
  };
}

describe("the diagnostic loss investigation", () => {
  it("matches TensorFlow.js for every row and prediction change while retaining the batch mean", () => {
    const before = tf.memory().numTensors;
    for (const caseId of ["standard", "changed"]) {
      const labels = caseId === "standard" ? [3, -0.5, 2, 1] : [1, 0, 1, 0, 1];
      for (const change of [-2, -0.5, 0, 0.1, 2]) {
        const predictions =
          caseId === "standard"
            ? [2.5 + change, 0, 2.1, 1.3]
            : [0.4 + change, -0.4, -0.8, 0.8, 1.4];
        const observed = tf.tidy(() => {
          const target = tf.tensor1d(labels);
          const output = tf.tensor1d(predictions);
          const differences = output.sub(target);
          const loss = tf.losses.meanSquaredError(target, output);
          expect(loss.shape).toEqual([]);
          return {
            differences: Array.from(differences.dataSync()).map(round),
            squares: Array.from(differences.square().dataSync()).map(round),
            mean: loss.dataSync()[0]!,
          };
        });
        for (let row = 0; row < labels.length; row++) {
          const result = run(
            "loss-functions",
            { stage: 0, row, change },
            caseId,
          );
          expect(result.graphics[0]!.values).toEqual(
            labels.flatMap((value, i) => [value, predictions[i]!]),
          );
          expect(result.graphics[0]!.highlight).toEqual([row * 2, row * 2 + 1]);
          expect(result.graphics[1]!.values).toEqual(observed.differences);
          expect(result.graphics[2]!.values).toEqual(observed.squares);
          for (const graphic of result.graphics.slice(1, 3))
            expect(graphic.highlight).toEqual([row]);
          expect(result.answer).toBeCloseTo(observed.mean, 6);
          expect(
            new Function(`${result.code}\nreturn batchLoss;`)(),
          ).toBeCloseTo(observed.mean, 6);
        }
      }
    }
    expect(tf.memory().numTensors).toBe(before);
    expect(run("loss-functions", {}).answer).toBeCloseTo(0.15, 12);
    expect(run("loss-functions", {}, "changed").answer).toBeCloseTo(0.912, 12);
  });

  it("matches logits and probability BCE forms without applying sigmoid twice", () => {
    const before = tf.memory().numTensors;
    for (const caseId of ["standard", "changed"]) {
      for (const change of [-2, -0.1, 0, 0.1, 2]) {
        const logits =
          caseId === "standard" ? [3 + change, -3] : [-3 + change, 3];
        const actual = tf.tidy(() => {
          const labels = tf.tensor1d([1, 0]);
          const raw = tf.tensor1d(logits);
          const probabilities = raw.sigmoid();
          return {
            loss: tf.losses.sigmoidCrossEntropy(labels, raw).dataSync()[0]!,
            probabilityLoss: tf.metrics
              .binaryCrossentropy(labels, probabilities)
              .dataSync()[0]!,
            doubleSigmoid: tf.losses
              .sigmoidCrossEntropy(labels, probabilities)
              .dataSync()[0]!,
          };
        });
        for (const stage of [1, 2])
          for (const row of [0, 1]) {
            const result = run(
              "loss-functions",
              { stage, row, change },
              caseId,
            );
            expect(result.answer).toBeCloseTo(actual.loss, 5);
            expect(result.answer).toBeCloseTo(actual.probabilityLoss, 5);
            expect(
              Math.abs(Number(result.answer) - actual.doubleSigmoid),
            ).toBeGreaterThan(0.1);
            expect(result.graphics[0]!.highlight).toEqual([
              row * 2,
              row * 2 + 1,
            ]);
            expect(result.graphics[2]!.highlight).toEqual([row]);
            const generated = new Function(
              `${result.code}\nreturn { batchLoss, selectedForm };`,
            )();
            expect(generated.batchLoss).toBeCloseTo(actual.loss, 5);
            expect(generated.selectedForm).toBe(
              stage === 1 ? "sigmoidCrossEntropy" : "binaryCrossentropy",
            );
          }
      }
    }
    expect(tf.memory().numTensors).toBe(before);
    const control = NUMERIC_INVESTIGATIONS["loss-functions"]!.controls.find(
      (item) => item.id === "row",
    )!;
    expect(investigationControlMax(control, { stage: 0, mseRows: 4 })).toBe(3);
    expect(investigationControlMax(control, { stage: 0, mseRows: 5 })).toBe(4);
    expect(investigationControlMax(control, { stage: 2, mseRows: 4 })).toBe(1);
  });

  it("executes all authored loss examples and the declared-form rejections", () => {
    const mse = execute("01-loss-functions.mdx", "mse-probe.ts");
    expect((mse[0]![0] as number[]).map(round)).toEqual([-0.5, 0.5, 0.1, 0.3]);
    expect((mse[1]![0] as number[]).map(round)).toEqual([
      0.25, 0.25, 0.01, 0.09,
    ]);
    expect(mse[2]![0]).toEqual([]);
    expect(mse[2]![1]).toBeCloseTo(0.15, 6);
    const bce = execute("01-loss-functions.mdx", "bce-probes.ts");
    [0.048587, 3.048587, 0.693147].forEach((value, i) =>
      expect(bce[i]![2]).toBeCloseTo(value, 5),
    );
    const contracts = execute("01-loss-functions.mdx", "bce-form-contract.js");
    expect(contracts.slice(0, 2)).toEqual([
      ["Declared:", "probabilities"],
      ["Declared:", "logits"],
    ]);
    expect(contracts.slice(2)).toEqual(
      ["sigmoid", "softmax", "relu", "unknown", undefined, null].map((kind) => [
        "Rejected:",
        kind,
      ]),
    );
    const optional = execute("01-loss-functions.mdx", "loss-functions.ts");
    expect((optional[0]![1] as Float32Array)[0]).toBeCloseTo(0.268, 6);
    expect((optional[1]![1] as Float32Array)[0]).toBeCloseTo(0.7177, 3);
    expect((optional[2]![1] as Float32Array)[0]).toBe(0);
  });
});

describe("the supplied squared-loss update investigation", () => {
  it("matches fresh TensorFlow.js gradients through three updates for changed weights and rates", () => {
    const before = tf.memory().numTensors;
    for (const start of [-5, -0.25, 0, 0.25, 5])
      for (const rate of [0, 0.1, 0.6, 1, 1.2]) {
        const weight = tf.tidy(() => tf.variable(tf.scalar(start)));
        try {
          for (let update = 1; update <= 3; update++) {
            const oldWeight = weight.dataSync()[0]!;
            const actual = tf.tidy(() => {
              const { value, grads } = tf.variableGrads(
                () => weight.square(),
                [weight],
              );
              const gradient = grads[weight.name]!;
              const slope = gradient.dataSync()[0]!;
              weight.assign(weight.sub(gradient.mul(rate)));
              return {
                gradient: slope,
                oldLoss: value.dataSync()[0]!,
                next: weight.dataSync()[0]!,
                nextLoss: weight.square().dataSync()[0]!,
              };
            });
            const result = run("gradient-descent", {
              weight: start,
              rate,
              update,
            });
            expect(result.answer).toBeCloseTo(actual.next, 5);
            const values = result.graphics[1]!.values as number[];
            [
              oldWeight,
              actual.gradient,
              rate,
              rate * actual.gradient,
              actual.next,
              actual.oldLoss,
              actual.nextLoss,
            ].forEach((value, i) =>
              expect(values[i]).toBeCloseTo(round(value), 2),
            );
            const generated = new Function(
              `${result.code}\nreturn selected;`,
            )();
            expect(generated.gradient).toBeCloseTo(actual.gradient, 5);
            expect(generated.nextWeight).toBeCloseTo(actual.next, 5);
            expect(generated.loss).toBeCloseTo(actual.nextLoss, 3);
            expect(result.graphics[2]!.highlight).toEqual([update]);
          }
        } finally {
          weight.dispose();
        }
      }
    expect(tf.memory().numTensors).toBe(before);
    expect(run("gradient-descent", {}).answer).toBe(4);
    expect(run("gradient-descent", { update: 3 }).answer).toBeCloseTo(2.56, 12);
    expect(run("gradient-descent", {}, "changed").answer).toBe(-1);
    expect(run("gradient-descent", { rate: 1.2 }).explanation).toContain(
      "increases",
    );
  });

  it("executes the authored first update, changed-function gradients, and optional twenty-step trace", () => {
    expect(execute("02-gradient-descent.mdx", "scalar-step.ts")[0]![0]).toEqual(
      {
        oldWeight: 5,
        oldLoss: 25,
        slope: 10,
        learningRate: 0.1,
        amount: 1,
        newWeight: 4,
        newLoss: 16,
      },
    );
    const changed = execute(
      "02-gradient-descent.mdx",
      "different-loss-gradients.ts",
    );
    expect(changed[0]![0]).toBeCloseTo(15.36, 4);
    expect(changed[1]![0]).toBeCloseTo(Math.cos(0.5), 6);
    expect(
      execute("02-gradient-descent.mdx", "gradient-descent.ts").flat(),
    ).toEqual([
      "Step 0: x=0.600, loss=9.000",
      "Step 5: x=2.214, loss=0.966",
      "Step 10: x=2.742, loss=0.104",
      "Step 15: x=2.916, loss=0.011",
    ]);
  });

  it("keeps only the latest gradient alive across repeated real TensorFlow.js steps", () => {
    const before = tf.memory().numTensors;
    const { solution } = exercise("gradient-step");
    const inspect = new Function(
      "tf",
      `${stripTypeScript(solution)}\nreturn { weight, step, getGradient: () => gradient };`,
    )(tf) as {
      weight: tf.Variable;
      step: (fn: () => tf.Scalar) => void;
      getGradient: () => tf.Tensor;
    };
    try {
      const retained = tf.memory().numTensors;
      for (let i = 0; i < 10; i++) {
        const previous = inspect.getGradient();
        inspect.step(() => inspect.weight.sin().asScalar());
        expect(previous.isDisposed).toBe(true);
        expect(inspect.getGradient().isDisposed).toBe(false);
        expect(tf.memory().numTensors).toBe(retained);
      }
    } finally {
      tf.dispose([inspect.weight, inspect.getGradient()]);
    }
    expect(tf.memory().numTensors).toBe(before);
  });
});

describe("the loss and gradient authored graders", () => {
  it.each(["mse-loss", "gradient-step"])(
    "accepts the actual solution and rejects the starter for %s",
    async (slug) => {
      const { solution, starter, tests } = exercise(slug);
      const good = await parseAndRunTests(solution, tests);
      expect(good.errored).not.toBe(true);
      expect(good.results.filter((check) => !check.passed)).toEqual([]);
      expect(good.results.length).toBe(slug === "mse-loss" ? 8 : 6);
      const empty = await parseAndRunTests(starter, tests);
      expect(empty.results.filter((check) => check.passed)).toEqual([]);
    },
  );

  it.each([
    [
      "square of mean error",
      "return tf.losses.meanSquaredError(labels, predictions);",
      "return predictions.sub(labels).mean().square();",
      "squares the differences",
    ],
    [
      "unreduced errors",
      "return tf.losses.meanSquaredError(labels, predictions);",
      "return predictions.sub(labels).square();",
      "comes back reduced",
    ],
    [
      "second sigmoid",
      "return tf.losses.sigmoidCrossEntropy(labels, logits);",
      "return tf.losses.sigmoidCrossEntropy(labels, logits.sigmoid());",
      "reads argument two",
    ],
    [
      "unknown output fallback",
      "throw new Error('Expected probabilities or logits');",
      "return 'binaryCrossentropy';",
      "rejects an activation name",
    ],
  ])(
    "rejects %s in the loss functions",
    async (_name, original, replacement, failingName) => {
      const { solution, tests } = exercise("mse-loss");
      const wrong = solution.replace(original, replacement);
      expect(wrong).not.toBe(solution);
      const result = await parseAndRunTests(wrong, tests);
      expect(result.errored).not.toBe(true);
      expect(
        result.results.find((check) => check.name.includes(failingName))
          ?.passed,
      ).toBe(false);
    },
  );

  it.each([
    [
      "gradient addition",
      "weight.assign(weight.sub(current.mul(learningRate)));",
      "weight.assign(weight.add(current.mul(learningRate)));",
      "one step moved",
    ],
    [
      "fixed squared-loss derivative",
      "const { grads } = tf.variableGrads(fn, [weight]);\n    const current = grads[weight.name];",
      "const current = weight.mul(2);",
      "differentiates the function it receives",
    ],
    [
      "reused old gradient",
      "if (gradient) gradient.dispose();",
      "if (gradient) { tf.tidy(() => weight.assign(weight.sub(gradient.mul(learningRate)))); return; }",
      "three steps in a row",
    ],
  ])(
    "rejects %s in the gradient update",
    async (_name, original, replacement, failingName) => {
      const { solution, tests } = exercise("gradient-step");
      const wrong = solution.replace(original, replacement);
      expect(wrong).not.toBe(solution);
      const result = await parseAndRunTests(wrong, tests);
      expect(result.errored).not.toBe(true);
      expect(
        result.results.find((check) => check.name.includes(failingName))
          ?.passed,
      ).toBe(false);
    },
  );
});
