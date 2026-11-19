import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { parseAndRunTests } from "../../../../../packages/ui/src/mdx/exercise-runner-node";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { initialInvestigationValues } from "./investigation-types";

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

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
const round = (value: number) => Math.round(value * 1000) / 1000;
const lessonRoot = resolve(
  import.meta.dirname,
  "../../../../../packages/content/content/deep-orbit/neural-networks",
);
function authoredBlock(lesson: string, title: string) {
  const source = readFileSync(resolve(lessonRoot, lesson), "utf8");
  const match = [
    ...source.matchAll(
      /<CodeBlock language="(?:typescript|javascript)" title="([^"]+)">\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
    ),
  ].find(([, name]) => name === title);
  if (!match) throw Error(`Missing code block ${title}`);
  return new Function("return `" + match[2] + "`;")().replace(
    /^import .*?;\s*$/gm,
    "",
  );
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
    solution: field("solutionCode", "testCode"),
    tests: field("testCode", "estimatedMinutes"),
  };
}

describe("the neuron contribution trace", () => {
  it("keeps the three inputs, matching products, running sums, and bias consistent with TensorFlow.js", () => {
    const before = tf.memory().numTensors;
    for (let step = -10; step <= 10; step++) {
      const weight = step / 10;
      for (const bias of [-1, 0.1, 1]) {
        const observed = tf.tidy(() => {
          const inputs = tf.tensor1d([0.5, 0.8, 0.2]);
          const weights = tf.tensor1d([0.4, weight, 0.6]);
          const products = inputs.mul(weights);
          return {
            score: tf.dot(inputs, weights).add(bias).dataSync()[0]!,
            products: Array.from(products.dataSync()).map(round),
            running: Array.from(products.cumsum().dataSync()).map(round),
          };
        });
        for (const selected of [0, 1, 2]) {
          const result = run("first-neuron", { selected, weight, bias });
          expect(result.graphics[0]!.values).toEqual([0.5, 0.8, 0.2]);
          expect(result.graphics[1]!.values).toEqual([0.4, weight, 0.6]);
          expect(result.graphics[2]!.values).toEqual(observed.products);
          expect(result.graphics[3]!.values).toEqual(observed.running);
          for (const graphic of result.graphics.slice(0, 4))
            expect(graphic.highlight).toEqual([selected]);
          expect(result.answer).toBeCloseTo(observed.score, 6);
          const generated = new Function(`${result.code}\nreturn score;`)();
          expect(generated).toBeCloseTo(observed.score, 6);
        }
      }
    }
    expect(tf.memory().numTensors).toBe(before);
    expect(run("first-neuron", {}).answer).toBeCloseTo(0.26, 6);
    expect(run("first-neuron", {}, "changed").answer).toBeCloseTo(0.58, 6);
  });

  it("separates a weight's sensitivity from the contribution of this input", () => {
    const result = run("first-neuron", { selected: 2 });
    expect(result.graphics[1]!.values[2]).toBeGreaterThan(
      Number(result.graphics[1]!.values[0]),
    );
    expect(result.graphics[2]!.values[2]).toBeLessThan(
      Number(result.graphics[2]!.values[0]),
    );
    const gradients = tf.tidy(() => {
      const gradient = tf.grad((weights) =>
        tf.dot(tf.tensor1d([0.5, 0.8, 0.2]), weights).add(0.1),
      );
      return Array.from(gradient(tf.tensor1d([0.4, -0.2, 0.6])).dataSync());
    });
    gradients.forEach((value, i) =>
      expect(value).toBeCloseTo([0.5, 0.8, 0.2][i]!, 6),
    );
  });

  it("executes the authored tensor and JavaScript calculations with the same score", () => {
    const logs = execute("01-first-neuron.mdx", "first-neuron.ts");
    expect(Array.from(logs[0]![0] as Float32Array)[0]).toBeCloseTo(0.26, 6);
    expect(logs[1]![0]).toBeCloseTo(0.26, 12);
  });
});

describe("the activation diagnostic trace", () => {
  it("matches TensorFlow.js at every supplied position, including zero and unclipped large positives", () => {
    const before = tf.memory().numTensors;
    for (const caseId of ["standard", "changed"]) {
      const input =
        caseId === "standard"
          ? [-2, -0.5, 0, 1.5, 3]
          : [-(2 ** 126), -6.5, 6.5, 2 ** 126];
      for (const fn of [0, 1, 2]) {
        const actual = tf.tidy(() => {
          const raw = tf.tensor1d(input);
          return Array.from(
            (fn === 0
              ? raw.relu()
              : fn === 1
                ? raw.sigmoid()
                : raw.tanh()
            ).dataSync(),
          );
        });
        for (let position = 0; position < input.length; position++) {
          const result = run(
            "activation-functions",
            { position, function: fn },
            caseId,
          );
          expect(result.graphics[0]!.values).toEqual(input);
          expect(result.graphics[0]!.highlight).toEqual([position]);
          expect(result.graphics[1]!.highlight).toEqual([position]);
          expect(result.graphics[1]!.values).toHaveLength(input.length);
          expect(result.answer).toBeCloseTo(actual[position]!, 6);
          const generated = new Function(
            `${result.code}\nreturn { output, selected };`,
          )();
          generated.output.forEach((value: number, i: number) =>
            expect(value).toBeCloseTo(actual[i]!, 6),
          );
          expect(generated.selected).toBe(result.answer);
        }
      }
    }
    expect(tf.memory().numTensors).toBe(before);
    expect(
      run("activation-functions", { position: 3, function: 0 }, "changed")
        .answer,
    ).toBe(2 ** 126);
  });

  it("executes the actual activation examples, shape preservation, and optional affine check", () => {
    const logs = execute("02-activation-functions.mdx", "activations.ts");
    expect(logs[0]![0]).toEqual([0, 0, 0, 1.5, 3]);
    const input = [-2, -0.5, 0, 1.5, 3];
    (logs[1]![0] as number[]).forEach((value, i) =>
      expect(value).toBeCloseTo(1 / (1 + Math.exp(-input[i]!)), 6),
    );
    (logs[2]![0] as number[]).forEach((value, i) =>
      expect(value).toBeCloseTo(Math.tanh(input[i]!), 6),
    );
    const shaped = execute(
      "02-activation-functions.mdx",
      "relu-keeps-shape.ts",
    );
    expect(shaped[0]![0]).toEqual([2, 2]);
    expect(shaped[1]![0]).toEqual([
      [0, 2],
      [0.5, 0],
    ]);
    expect(
      execute("02-activation-functions.mdx", "collapse.ts")[0]![0],
    ).toBeLessThan(1e-5);
  });
});

describe("the unchanged authored graders", () => {
  it.each(["implement-neuron", "relu-activation"])(
    "accepts its actual solution for %s",
    async (slug) => {
      const { solution, tests } = exercise(slug);
      const result = await parseAndRunTests(solution, tests);
      expect(result.errored).not.toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.filter((check) => !check.passed)).toEqual([]);
    },
  );

  it("rejects a numerically correct neuron that reads values out into JavaScript", async () => {
    const { solution, tests } = exercise("implement-neuron");
    const wrong = solution.replace(
      "tf.dot(inputs, weights).add(bias)",
      "tf.scalar(Array.from(inputs.dataSync()).reduce((total, value, i) => total + value * weights.dataSync()[i], bias.dataSync()[0]))",
    );
    expect(wrong).not.toBe(solution);
    const result = await parseAndRunTests(wrong, tests);
    expect(result.results[0]!.passed).toBe(true);
    expect(result.results.slice(1).every((check) => !check.passed)).toBe(true);
    expect(result.results[1]!.error).toContain(
      "Keep the whole calculation in tensor operations",
    );
  });

  it.each([
    [
      "upper clipping",
      "return preActivation.relu6();",
      "passes a very large positive",
    ],
    [
      "thresholding",
      "return preActivation.greater(0).toFloat();",
      "zeros out negatives",
    ],
    [
      "flattening",
      "return preActivation.reshape([-1]).relu();",
      "works on a rank-2 tensor",
    ],
  ])(
    "rejects %s in the ReLU function",
    async (_name, replacement, failingName) => {
      const { solution, tests } = exercise("relu-activation");
      const wrong = solution.replace(
        "return preActivation.relu();",
        replacement,
      );
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
