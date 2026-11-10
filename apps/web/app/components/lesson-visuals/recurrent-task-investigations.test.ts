// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { stripTypeScript } from "../../../../../packages/ui/src/mdx/strip-typescript";
import { initialInvestigationValues } from "./investigation-types";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import {
  RECURRENT_TASK_INVESTIGATIONS,
  WINDOW_TASK_CASES,
  RNN_TASK_CASES,
  FORECAST_SEED,
  FORECAST_SCALERS,
  nextReadingPairs,
  recurrentTrace,
  classificationWindows,
  controlledForecast,
} from "./recurrent-task-investigations";
const root = resolve(
  import.meta.dirname,
  "../../../../../packages/content/content/deep-orbit/recurrent-networks",
);
beforeAll(async () => {
  expect(tf.version.tfjs).toBe("4.22.0");
  await tf.setBackend("cpu");
  await tf.ready();
});
const clean = (code: string) =>
  stripTypeScript(code).replace(/^import .*?;\s*$/gm, "");
function functions(slug: string, names: string[]) {
  const source = readFileSync(
    resolve(root, "exercises", `${slug}.yaml`),
    "utf8",
  );
  const solution = source
    .split("solutionCode: |\n")[1]!
    .split("\ntestCode:")[0]!
    .replace(/^ {2}/gm, "");
  return new Function("tf", `${clean(solution)}\nreturn {${names.join(",")}};`)(
    tf,
  );
}
function evaluate(
  slug: string,
  changes: Record<string, number> = {},
  id = "standard",
) {
  const spec = RECURRENT_TASK_INVESTIGATIONS[slug]!;
  return spec.evaluate(
    { ...initialInvestigationValues(spec, id), ...changes },
    id,
  );
}
async function execute(file: string, titles: string[]) {
  const source = readFileSync(resolve(root, file), "utf8"),
    blocks = [
      ...source.matchAll(
        /<CodeBlock language="(?:typescript|javascript)" title="([^"]+)">\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
      ),
    ];
  const code = titles
    .map((title) => {
      const block = blocks.find(([, name]) => name === title);
      if (!block) throw Error(`Missing ${title}`);
      return clean(new Function("return `" + block[2] + "`;")());
    })
    .join("\n");
  const before = tf.memory().numTensors,
    logs: unknown[][] = [];
  await new Function("tf", "console", `return(async()=>{\n${code}\n})();`)(tf, {
    log: (...args: unknown[]) => logs.push(args),
  });
  expect(tf.memory().numTensors).toBe(before);
  return logs;
}

describe("the recurrent task data contracts", () => {
  it("matches input-target windows, stride, axes, omitted final slices, and null tensors", () => {
    const { makeWindows } = functions("create-sequences", ["makeWindows"]);
    const before = tf.memory().numTensors;
    for (const [id, item] of Object.entries(WINDOW_TASK_CASES))
      for (let window = 1; window <= item.rows.length; window++)
        for (const stride of [1, 2, 4]) {
          const actual = makeWindows(item.rows, window, stride);
          try {
            const reference = nextReadingPairs(item.rows, window, stride);
            expect(reference.xs).toEqual(actual.xs);
            expect(reference.ys).toEqual(actual.ys);
            for (
              let selected = 0;
              selected < Math.max(1, reference.xs.length);
              selected++
            ) {
              const result = evaluate(
                "sequences-matter",
                { window, stride, selected },
                id,
              );
              const generated = new Function(
                `${result.code}\nreturn{selectedInput,selectedTarget,targetSourceIndex,xsShape};`,
              )();
              expect(generated.selectedInput).toEqual(
                actual.xs[selected] ?? [],
              );
              expect(generated.selectedTarget).toEqual(
                actual.ys[selected] ?? null,
              );
              expect(result.answer).toBe(
                reference.starts[selected] === undefined
                  ? -1
                  : reference.starts[selected]! + window,
              );
              expect(generated.xsShape).toEqual(actual.xsTensor?.shape ?? null);
              if (reference.starts[selected] !== undefined)
                expect(reference.starts[selected]! + window).toBeGreaterThan(
                  reference.starts[selected]! + window - 1,
                );
            }
          } finally {
            tf.dispose([actual.xsTensor, actual.ysTensor].filter(Boolean));
          }
        }
    expect(tf.memory().numTensors).toBe(before);
  });
  it("keeps the target outside its reversed input comparison", () => {
    const result = evaluate("sequences-matter", { reverse: 1 });
    const out = new Function(
      `${result.code}\nreturn{selectedInput,selectedTarget,targetSourceIndex};`,
    )();
    expect(out.selectedInput).toEqual([[5], [4], [3]]);
    expect(out.selectedTarget).toEqual([2]);
    expect(out.targetSourceIndex).toBe(1);
  });
  it("uses inputWeight directly and matches the actual layer at every step", () => {
    const { runCell, buildCellLayer } = functions("build-rnn", [
      "runCell",
      "buildCellLayer",
    ]);
    const before = tf.memory().numTensors;
    for (const [id, item] of Object.entries(RNN_TASK_CASES))
      for (const memory of [0.3, 0.8, 1.5]) {
        const states = runCell(item.readings, memory, 1, 0);
        const traced = recurrentTrace(item.readings, memory, 1, 0);
        states.forEach((state: number, i: number) =>
          expect(traced[i]!.state).toBe(state),
        );
        for (const step of [0, item.step, item.readings.length - 1]) {
          const result = evaluate("simple-rnns", { step, memory }, id);
          expect(result.answer).toBe(states[step]);
          expect(new Function(`${result.code}\nreturn nextState;`)()).toBe(
            states[step],
          );
        }
      }
    for (const readings of [
      [0.5, 0.9, 0.5],
      [0.2, -0.3, 0.8, 0.1],
    ]) {
      const built = buildCellLayer(readings.length),
        input = tf.tensor3d([readings.map((value) => [value])]);
      const output = built.model.predict(input) as tf.Tensor;
      try {
        const expected = runCell(
            readings,
            built.recurrentWeight,
            built.inputWeight,
            built.bias,
          ),
          actual = Array.from(output.dataSync());
        actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 6));
        expect(
          runCell(
            readings,
            built.recurrentWeight,
            built.inputWeight,
            built.bias,
          ),
        ).toEqual(expected);
      } finally {
        tf.dispose([input, output]);
        built.model.dispose();
      }
    }
    expect(tf.memory().numTensors).toBe(before);
  });
  it("matches the running derivative product against real automatic differentiation", () => {
    const { decayFactors, runCell } = functions("build-rnn", [
      "decayFactors",
      "runCell",
    ]);
    for (const memory of [0.8, 1.5])
      for (const count of [3, 14, 60]) {
        const readings = Array(count).fill(0.001) as number[],
          states = runCell(readings, memory, 1, 0),
          factors = decayFactors(states, memory),
          trace = recurrentTrace(readings, memory, 1, 0);
        expect(trace.at(-1)!.product).toBe(factors.at(-1));
        const actual = tf.tidy(() => {
          const derivative = tf.grad((initial) => {
            let h = initial;
            for (const value of readings) h = h.mul(memory).add(value).tanh();
            return h;
          });
          return derivative(tf.scalar(0)).dataSync()[0]!;
        });
        expect(trace.at(-1)!.product).toBeCloseTo(
          actual,
          count === 14 && memory === 1.5 ? 2 : 5,
        );
      }
    const growing = recurrentTrace(Array(60).fill(0.001), 1.5, 1, 0);
    expect(growing[13]!.product).toBeGreaterThan(170);
    expect(Math.abs(growing[59]!.product)).toBeLessThan(1e-11);
    const decay = evaluate("simple-rnns", { quantity: 1 }, "decay");
    expect(Number(decay.answer)).toBeCloseTo(1.5e-6, 6);
  });
  it("keeps classification labels on last readings and never shares source rows across the split", () => {
    const { splitThenWindow } = functions("sliding-window", [
      "splitThenWindow",
    ]);
    const rows = Array.from({ length: 12 }, (_, i) => [i]),
      labels = rows.map(([i]) => Number(i! >= 4 && i! < 9));
    for (let window = 1; window <= 12; window++)
      for (let split = 0; split <= 12; split++) {
        const actual = splitThenWindow(rows, labels, window, split),
          reference = classificationWindows(window, split);
        expect(reference.train).toEqual(actual.train);
        expect(reference.eval).toEqual(actual.eval);
        const trainIndices = new Set<number>(actual.train.xs.flat(2));
        for (const index of actual.eval.xs.flat(2))
          expect(trainIndices.has(index)).toBe(false);
        for (let start = 0; start + window <= 12; start++) {
          const result = evaluate("sliding-windows", { window, split, start });
          expect(result.answer).toBe(
            start + window <= split
              ? "training"
              : start >= split
                ? "evaluation"
                : "dropped",
          );
          expect(result.graphics[2]!.values[3]).toBe(
            labels[start + window - 1],
          );
        }
      }
    expect(classificationWindows(4, 8).dropped).toEqual([5, 6, 7]);
  });
  it("matches real tensor forecasts, clamp-before-feedback, seed ownership, and both supplied scalers", () => {
    const { forecastMultiStep } = functions("predict-next", [
      "forecastMultiStep",
    ]);
    const before = tf.memory().numTensors;
    for (const [id, scaler] of Object.entries(FORECAST_SCALERS))
      for (const window of [3, 5])
        for (const steps of [0, 2, 4, 6]) {
          const seed = FORECAST_SEED.map((row) => row.slice()),
            calls: Array<{ shape: number[]; rows: number[][] }> = [];
          const model = {
            predict(input: tf.Tensor3D) {
              const rows = input.arraySync()[0]!;
              calls.push({ shape: input.shape.slice(), rows });
              const last = rows.at(-1)!;
              return tf.tensor2d([
                [last[2]! * 4 + 0.7, last[0]! * 1.6 - 2.4, last[1]! * 0.6],
              ]);
            },
          };
          const actual = forecastMultiStep(model, seed, window, steps, scaler),
            reference = controlledForecast(scaler, window, steps);
          expect(seed).toEqual(FORECAST_SEED);
          expect(calls).toHaveLength(steps);
          actual.forEach((row: number[], step: number) =>
            row.forEach((value, j) =>
              expect(value).toBeCloseTo(reference.rows[step]![j]!, 4),
            ),
          );
          calls.forEach((call, step) => {
            expect(call.shape).toEqual([1, window, 3]);
            call.rows.forEach((row, i) =>
              row.forEach((value, j) =>
                expect(value).toBeCloseTo(
                  reference.trace[step]!.input[i]![j]!,
                  4,
                ),
              ),
            );
          });
          for (const feature of [0, 1, 2]) {
            const selected = Math.max(1, steps);
            const result = evaluate(
              "sequence-prediction",
              { window, steps, selected, feature },
              id,
            );
            if (!steps) expect(result.answer).toBe("none");
            else
              expect(Number(result.answer)).toBeCloseTo(
                actual[selected - 1][feature],
                4,
              );
          }
        }
    expect(tf.memory().numTensors).toBe(before);
  });
  it("rejects invalid scalers and outputs while freeing failed prediction inputs", () => {
    const { forecastMultiStep } = functions("predict-next", [
      "forecastMultiStep",
    ]);
    const scaler = FORECAST_SCALERS.standard,
      before = tf.memory().numTensors;
    expect(() =>
      forecastMultiStep({}, FORECAST_SEED, 3, 1, {
        mean: [0, 0, 0],
        std: [1, 0, 1],
      }),
    ).toThrow();
    for (const values of [
      [NaN, 0, 0],
      [0, 0],
    ]) {
      expect(() =>
        forecastMultiStep(
          { predict: () => tf.tensor2d([values]) },
          FORECAST_SEED,
          3,
          1,
          scaler,
        ),
      ).toThrow();
      expect(tf.memory().numTensors).toBe(before);
    }
    let captured: tf.Tensor | undefined;
    expect(() =>
      forecastMultiStep(
        {
          predict: (input: tf.Tensor) => {
            captured = input;
            throw Error("controlled prediction failure");
          },
        },
        FORECAST_SEED,
        3,
        1,
        scaler,
      ),
    ).toThrow("controlled prediction failure");
    expect(captured?.isDisposed).toBe(true);
    expect(tf.memory().numTensors).toBe(before);
  });
  it("keeps LSTM cell state independent of the output gate and matches extracted layer columns", () => {
    const spec = NUMERIC_INVESTIGATIONS["lstm-gates"]!,
      base = initialInvestigationValues(spec, "changed");
    const hidden = spec.evaluate(
        { ...base, output: 0, quantity: 1 },
        "changed",
      ),
      cell = spec.evaluate({ ...base, output: 0, quantity: 0 }, "changed");
    expect(hidden.answer).toBe(0);
    expect(Number(cell.answer)).toBeGreaterThan(1);
    const { lstmStep, buildLstmCell } = functions("build-lstm", [
      "lstmStep",
      "buildLstmCell",
    ]);
    const model = buildLstmCell(4),
      input = tf.tensor3d([[[0.2], [0.4], [-0.1], [0.8]]]);
    const output = model.model.predict(input) as tf.Tensor;
    try {
      let h = [0],
        c = [0];
      const states: number[] = [];
      for (const x of [0.2, 0.4, -0.1, 0.8]) {
        const next = lstmStep(h, c, [x], model.weights);
        h = next.newHidden;
        c = next.newCell;
        states.push(h[0]);
      }
      Array.from(output.dataSync()).forEach((value, i) =>
        expect(value).toBeCloseTo(states[i], 6),
      );
    } finally {
      tf.dispose([input, output]);
      model.model.dispose();
    }
  });
});

describe("required recurrent authored examples", () => {
  it("runs target pairs, actual one-unit parity, and both derivative probes without retained tensors", async () => {
    const pairs = await execute("01-sequences-matter.mdx", [
      "window-target-probe.ts",
    ]);
    expect(pairs[1]).toEqual([
      [2, 3, 1],
      [2, 1],
    ]);
    const rnn = await execute("02-simple-rnns.mdx", ["one-unit-rnn.ts"]);
    (rnn[1]![1] as number[]).forEach((value, i) =>
      expect(value).toBeCloseTo((rnn[1]![0] as number[])[i]!, 6),
    );
    const derivative = await execute("02-simple-rnns.mdx", [
      "recurrent-derivative-probe.js",
    ]);
    expect((derivative[0]![0] as { after60: number }).after60).toBeCloseTo(
      1.5e-6,
      6,
    );
    expect(
      (derivative[1]![0] as { atStep14: number }).atStep14,
    ).toBeGreaterThan(170);
  });
  it("runs the selected classification cases and fixed stand-in feedback trace", async () => {
    const split = await execute("04-sliding-windows.mdx", [
      "classification-window-probe.js",
    ]);
    expect(
      split.map((row) => (row[0] as { membership: string }).membership),
    ).toEqual(["training", "dropped", "evaluation"]);
    const feedback = await execute("05-sequence-prediction.mdx", [
      "forecast-feedback-probe.js",
    ]);
    const second = feedback[1]![0] as {
      raw: number[];
      clamped: number[];
      nextWindow: number[][];
    };
    expect(second.raw[0]).toBeCloseTo(3.1, 6);
    expect(second.clamped[0]).toBe(2);
    expect(second.nextWindow.at(-1)).toEqual(second.clamped);
  });
  it("runs actual eight-unit training and reports its real twelve-epoch history", async () => {
    const logs = await execute("05-sequence-prediction.mdx", [
      "small-forecaster.ts",
    ]);
    const run = logs[0]![0] as {
      inputShape: number[];
      epochs: number;
      updates: number;
      loss: number[];
      mae: number[];
    };
    expect(run.inputShape).toEqual([64, 5, 3]);
    expect(run.epochs).toBe(12);
    expect(run.updates).toBe(24);
    expect(run.loss).toHaveLength(12);
    expect(run.mae).toHaveLength(12);
    expect([...run.loss, ...run.mae].every(Number.isFinite)).toBe(true);
  }, 20000);
});
