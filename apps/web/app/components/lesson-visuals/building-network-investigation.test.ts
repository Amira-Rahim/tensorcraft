// @vitest-environment node
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import ts from "typescript";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { initialInvestigationValues } from "./investigation-types";

const spec = NUMERIC_INVESTIGATIONS["building-a-network"]!;
const mdx = readFileSync(
  new URL(
    "../../../../../packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx",
    import.meta.url,
  ),
  "utf8",
);
const blocks = new Map(
  [
    ...mdx.matchAll(
      /<CodeBlock[^>]*title="([^"]+)"[^>]*>\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
    ),
  ].map(([, title, source]) => [title!, source!] as const),
);
const yaml = readFileSync(
  new URL(
    "../../../../../packages/content/content/deep-orbit/neural-networks/exercises/simple-network.yaml",
    import.meta.url,
  ),
  "utf8",
);
const solution = yaml
  .split("solutionCode: |\n")[1]!
  .split("\ntestCode:")[0]!
  .replace(/^ {2}/gm, "");
// Use the authored generator and factory, without running its completed task.
const setup = solution.split("const model = buildClassifier();")[0]!;
const block = (title: string) => {
  const source = blocks.get(title);
  if (!source) throw Error(`Missing taught block: ${title}`);
  return ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
    },
  }).outputText;
};
const weightsOf = (model: tf.LayersModel) =>
  model.getWeights().map((weight) => Array.from(weight.dataSync()));

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

describe("the two-model rehearsal lifecycle", () => {
  it("compiles the taught configuration without changing an initialized prediction or weights", () => {
    const before = tf.memory().numTensors;
    const network = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [8], units: 24, activation: "relu" }),
        tf.layers.dense({ units: 12, activation: "relu" }),
        tf.layers.dense({ units: 1, activation: "sigmoid" }),
      ],
    });
    const input = tf.ones([1, 8]);
    try {
      const initial = weightsOf(network);
      const prediction = tf.tidy(() =>
        Array.from((network.predict(input) as tf.Tensor).dataSync()),
      );
      new Function("network", block("compile-rehearsal.ts"))(network);
      expect(weightsOf(network)).toEqual(initial);
      expect(
        tf.tidy(() =>
          Array.from((network.predict(input) as tf.Tensor).dataSync()),
        ),
      ).toEqual(prediction);
      expect(network.countParams()).toBe(529);
      expect(network.layers.map((layer) => layer.countParams())).toEqual([
        216, 300, 13,
      ]);
      expect(network.optimizer.getClassName()).toBe("Adam");
      expect(network.optimizer.iterations).toBe(0);
      expect(network.loss).toBe("binaryCrossentropy");
      expect(network.metrics).toContain("accuracy");
      for (const layer of network.layers) {
        expect(layer.getConfig().kernelInitializer).toMatchObject({
          className: "VarianceScaling",
          config: { scale: 1, mode: "fanAvg", distribution: "normal" },
        });
        expect(layer.getConfig().biasInitializer).toMatchObject({
          className: "Zeros",
        });
      }
    } finally {
      input.dispose();
      network.dispose();
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("executes the visible snapshot and fit blocks while preserving the second model", async () => {
    const before = tf.memory().numTensors;
    const result = (await new Function(
      "tf",
      `return (async () => {
      ${setup}
      const originalFactory = buildClassifier;
      const fits = [];
      buildClassifier = () => {
        const network = originalFactory();
        const fit = network.fit.bind(network);
        network.fit = (xs, ys, options) => {
          fits.push({ network, xs, ys, options,
            firstWeights: network.getWeights().map(weight => Array.from(weight.dataSync())),
            secondWeights: second.getWeights().map(weight => Array.from(weight.dataSync())) });
          return fit(xs, ys, options);
        };
        return network;
      };
      ${block("initial-rehearsal.ts")}
      ${block("train-first-rehearsal.ts")}
      return { model, second, readings, labels, initialWeights, sweepOne, sweepTwo,
        trainedSweep, secondAgain, history, fits };
    })();`,
    )(tf)) as {
      model: tf.Sequential;
      second: tf.Sequential;
      readings: tf.Tensor2D;
      labels: tf.Tensor2D;
      initialWeights: number[][];
      sweepOne: number[];
      sweepTwo: number[];
      trainedSweep: number[];
      secondAgain: number[];
      history: tf.History;
      fits: Array<{
        network: tf.Sequential;
        xs: tf.Tensor;
        ys: tf.Tensor;
        options: { epochs: number; batchSize: number };
        firstWeights: number[][];
        secondWeights: number[][];
      }>;
    };
    const replica = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [8], units: 24, activation: "relu" }),
        tf.layers.dense({ units: 12, activation: "relu" }),
        tf.layers.dense({ units: 1, activation: "sigmoid" }),
      ],
    });
    try {
      expect(result.model).not.toBe(result.second);
      expect(result.model.layers[0]!.getWeights()[0]).not.toBe(
        result.second.layers[0]!.getWeights()[0],
      );
      expect(result.readings.shape).toEqual([120, 8]);
      expect(result.labels.shape).toEqual([120, 1]);
      expect(result.fits).toHaveLength(1);
      expect(result.fits[0]!.network).toBe(result.model);
      expect(result.fits[0]!.xs).toBe(result.readings);
      expect(result.fits[0]!.ys).toBe(result.labels);
      expect(result.fits[0]!.options).toEqual({ epochs: 50, batchSize: 16 });
      expect(result.initialWeights).toEqual(result.fits[0]!.firstWeights);
      expect(result.initialWeights.map((values) => values.length)).toEqual([
        192, 24, 288, 12, 12, 1,
      ]);
      tf.tidy(() =>
        replica.setWeights(
          result.initialWeights.map((values, i) =>
            tf.tensor(values, result.model.getWeights()[i]!.shape),
          ),
        ),
      );
      const initialScores = tf.tidy(() =>
        Array.from((replica.predict(result.readings) as tf.Tensor).dataSync()),
      );
      expect(result.sweepOne).toEqual(initialScores);
      expect(result.secondAgain).toEqual(result.sweepTwo);
      expect(weightsOf(result.second)).toEqual(result.fits[0]!.secondWeights);
      expect(result.model.optimizer.iterations).toBe(400);
      expect(result.second.optimizer.iterations).toBe(0);
      expect(result.history.epoch).toHaveLength(50);
      for (const sweep of [
        result.sweepOne,
        result.sweepTwo,
        result.trainedSweep,
      ]) {
        expect(sweep).toHaveLength(120);
        expect(
          sweep.every(
            (value) => Number.isFinite(value) && value >= 0 && value <= 1,
          ),
        ).toBe(true);
      }
      for (let stage = 0; stage <= 4; stage++) {
        const plan = spec.evaluate(
          { ...initialInvestigationValues(spec), stage },
          "standard",
        );
        expect(plan.answer).toBe(
          stage < 3 ? 0 : result.model.optimizer.iterations,
        );
      }
    } finally {
      replica.dispose();
      result.model.dispose();
      result.second.dispose();
      tf.dispose([result.readings, result.labels]);
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("checks the alternative schedule against actual fitting without inventing its scores", async () => {
    const before = tf.memory().numTensors;
    const { network, readings, labels } = new Function(
      "tf",
      `${setup}\nreturn { network: buildClassifier(), readings, labels };`,
    )(tf) as {
      network: tf.Sequential;
      readings: tf.Tensor2D;
      labels: tf.Tensor2D;
    };
    try {
      const values = initialInvestigationValues(spec, "changed");
      await network.fit(readings, labels, {
        epochs: values.epochs,
        batchSize: values.batch,
      });
      const result = spec.evaluate(values, "changed");
      expect(result.answer).toBe(network.optimizer.iterations);
      expect(result.answer).toBe(400);
      expect(result.explanation).toContain(
        "An equal update count does not make two schedules equivalent",
      );
      expect(spec.boundary).toContain(
        "invents no predictions or training loss",
      );
    } finally {
      network.dispose();
      tf.dispose([readings, labels]);
    }
    expect(tf.memory().numTensors).toBe(before);
  });
});
