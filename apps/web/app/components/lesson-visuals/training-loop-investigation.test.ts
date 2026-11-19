// @vitest-environment node
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import ts from "typescript";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { initialInvestigationValues } from "./investigation-types";

const spec = NUMERIC_INVESTIGATIONS["training-loop"]!;
const mdx = readFileSync(
  new URL(
    "../../../../../packages/content/content/deep-orbit/training-loop/04-training-loop.mdx",
    import.meta.url,
  ),
  "utf8",
);
const yaml = readFileSync(
  new URL(
    "../../../../../packages/content/content/deep-orbit/training-loop/exercises/training-loop-exercise.yaml",
    import.meta.url,
  ),
  "utf8",
);
const solution = yaml
  .split("solutionCode: |\n")[1]!
  .split("\ntestCode:")[0]!
  .replace(/^ {2}/gm, "");
const setup = solution.split("function makeEarlyStopping()")[0]!;
const diagnose = new Function(
  `${solution.slice(solution.indexOf("function diagnose("))}\nreturn diagnose;`,
)() as (training: number[], validation: number[]) => string;
const block = (title: string) => {
  const source = [
    ...mdx.matchAll(
      /<CodeBlock[^>]*title="([^"]+)"[^>]*>\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
    ),
  ].find((match) => match[1] === title)?.[2];
  if (!source) throw Error(`Missing code block ${title}`);
  return ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
    },
  }).outputText;
};

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

describe("the training-loop teaching and diagnostic activity", () => {
  it("executes the authored batch count and full-window calculation", () => {
    const output = new Function(
      "console",
      `${block("updates-per-epoch.js")}\n${block("compare-two-windows.ts")}\nreturn { updatesPerEpoch, batchRows, exampleTraining, exampleValidation, windowMeans };`,
    )({ log() {} }) as {
      updatesPerEpoch: number;
      batchRows: number[];
      exampleTraining: number[];
      exampleValidation: number[];
      windowMeans: (values: number[]) => { previous: number; recent: number };
    };
    expect(output.batchRows).toEqual([32, 32, 16]);
    expect(output.updatesPerEpoch).toBe(3);
    expect(output.exampleTraining).toHaveLength(50);
    expect(output.windowMeans(output.exampleTraining).previous).toBe(1);
    expect(output.windowMeans(output.exampleTraining).recent).toBeCloseTo(
      0.8,
      12,
    );
    expect(output.windowMeans(output.exampleValidation).recent).toBeCloseTo(
      1.2,
      12,
    );
    expect(diagnose(output.exampleTraining, output.exampleValidation)).toBe(
      "train-down-validation-up",
    );
  });

  it("matches the authored diagnosis for every visible fixture and observed epoch count", () => {
    const answers = new Set<string>();
    for (const example of spec.cases) {
      const defaults = initialInvestigationValues(spec, example.id);
      for (let observed = 1; observed <= defaults.available!; observed++) {
        const result = spec.evaluate({ ...defaults, observed }, example.id);
        const validation = result.graphics[0]!.values as number[];
        const training = result.graphics[1]!.values as number[];
        expect(result.answer, `${example.id} at ${observed}`).toBe(
          diagnose(training, validation),
        );
        expect(result.graphics[0]!.labels).toEqual(
          Array.from({ length: observed }, (_, index) => String(index + 1)),
        );
        expect(training).toHaveLength(observed);
        expect(training.every(Number.isFinite)).toBe(true);
        answers.add(String(result.answer));
      }
    }
    expect(answers).toEqual(new Set(spec.prediction.choices));
    const final = spec.evaluate(initialInvestigationValues(spec), "standard");
    expect(final.graphics[2]!.values).toEqual([
      "Previous: 31-40",
      "Recent: 41-50",
    ]);
    expect(final.graphics[3]!.values).toEqual([1, 0.8, 1, 1.2]);
  });

  it("preserves short, zero, finite-input, tolerance, and rule-precedence boundaries", () => {
    const windows = (before: number, recent: number) => [
      ...Array(10).fill(before),
      ...Array(10).fill(recent),
    ];
    expect(diagnose(Array(19).fill(1), Array(19).fill(1))).toBe(
      "insufficient-history",
    );
    expect(diagnose(windows(1, 1), windows(1, 0.95 - 0.5e-12))).toBe("plateau");
    expect(diagnose(windows(1, 1), windows(1, 1.05 + 0.5e-12))).toBe("plateau");
    expect(diagnose(windows(1, 1), windows(1, 0.95 - 2e-12))).toBe(
      "validation-improving",
    );
    expect(diagnose(windows(1, 1), windows(1, 1.05 + 2e-12))).toBe(
      "validation-worsening",
    );
    expect(diagnose(windows(0, 1e-14), windows(0, 1e-14))).toBe(
      "both-worsening",
    );
    expect(diagnose(windows(1, 1.2), windows(1, 0.8))).toBe(
      "validation-improving",
    );
    for (const invalid of [null, {}, [1], [Infinity], [-1], [NaN]]) {
      expect(() => diagnose(invalid as unknown as number[], [1, 1])).toThrow(
        "Invalid loss history",
      );
    }
  });

  it(
    "runs the taught fit on the supplied fixture with three updates per completed epoch",
    { timeout: 30_000 },
    async () => {
      const before = tf.memory().numTensors;
      const result = (await new Function(
        "tf",
        `return (async () => {\n${setup}\n${block("watch-validation.ts")}\nreturn {model, trainX, trainY, history, trainingLoss, validationLoss};\n})();`,
      )(tf)) as {
        model: tf.Sequential;
        trainX: tf.Tensor2D;
        trainY: tf.Tensor2D;
        history: tf.History;
        trainingLoss: number[];
        validationLoss: number[];
      };
      try {
        expect(result.model.countParams()).toBe(673);
        expect(result.trainX.shape).toEqual([100, 3]);
        expect(result.trainY.shape).toEqual([100, 1]);
        const labels = Array.from(result.trainY.dataSync());
        expect(labels.slice(80)).toEqual(
          Array.from({ length: 20 }, (_, i) => i % 2),
        );
        expect(
          labels.slice(0, 80).filter((label, i) => label !== i % 2),
        ).toHaveLength(6);
        expect(result.history.params.samples).toBe(80);
        expect(result.trainingLoss).toBe(result.history.history.loss);
        expect(result.validationLoss).toBe(result.history.history.val_loss);
        expect(result.trainingLoss.length).toBeGreaterThan(0);
        expect(result.trainingLoss.length).toBeLessThanOrEqual(500);
        expect(result.validationLoss).toHaveLength(result.trainingLoss.length);
        expect(result.model.optimizer.iterations).toBe(
          3 * result.trainingLoss.length,
        );
      } finally {
        result.model.dispose();
        tf.dispose([result.trainX, result.trainY]);
      }
      expect(tf.memory().numTensors).toBe(before);
    },
  );

  it("keeps the callback's strict best-value rule separate from the five-percent diagnostic band", async () => {
    const before = tf.memory().numTensors;
    const factory = new Function(
      "tf",
      `${block("watch-validation.ts").split("const history")[0]}\nreturn makeEarlyStopping;`,
    )(tf) as () => ReturnType<typeof tf.callbacks.earlyStopping>;
    for (const [values, completed] of [
      [[1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.4], 7],
      [[1, 0.999, 0.998, 0.997, 0.996, 0.995, 0.994, 0.993], 8],
      [[1, 1, 1, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9], 9],
    ] as const) {
      const model = tf.sequential({
        layers: [tf.layers.dense({ inputShape: [1], units: 1 })],
      });
      model.compile({ optimizer: "sgd", loss: "meanSquaredError" });
      try {
        const callback = factory();
        callback.setModel(model);
        await callback.onTrainBegin({});
        let seen = 0;
        for (const val_loss of values) {
          await callback.onEpochEnd(seen, { val_loss, loss: 10 - seen });
          seen++;
          if (model.stopTraining) break;
        }
        expect(seen).toBe(completed);
      } finally {
        model.dispose();
      }
    }
    expect(
      diagnose(Array(20).fill(1), [
        ...Array(10).fill(1),
        ...Array(10).fill(0.95),
      ]),
    ).toBe("plateau");
    expect(() =>
      tf.callbacks.earlyStopping({ restoreBestWeights: true }),
    ).toThrow("not implemented");
    expect(tf.memory().numTensors).toBe(before);
  });
});
