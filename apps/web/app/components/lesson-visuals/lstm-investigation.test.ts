import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { initialInvestigationValues } from "./investigation-types";

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

const run = (values: Record<string, number> = {}, caseId = "standard") => {
  const spec = NUMERIC_INVESTIGATIONS["lstm-gates"]!;
  const result = spec.evaluate(
    { ...initialInvestigationValues(spec, caseId), ...values },
    caseId,
  );
  const calculated = new Function(
    `${result.code}\nreturn { newCell, newHidden };`,
  )() as { newCell: number; newHidden: number };
  return { result, calculated };
};

// Finite logits approximate the illustrative fully closed/open gate limits.
const logit = (fraction: number) =>
  fraction === 0
    ? -30
    : fraction === 1
      ? 30
      : Math.log(fraction / (1 - fraction));

describe("the supplied LSTM update investigation", () => {
  it("matches TensorFlow.js cell and hidden outputs for both candidate cases", () => {
    const before = tf.memory().numTensors;
    const sequence = tf.input({ shape: [1, 1] });
    const initialHidden = tf.input({ shape: [1] });
    const initialCell = tf.input({ shape: [1] });
    const layer = tf.layers.lstm({
      units: 1,
      recurrentActivation: "sigmoid",
      unitForgetBias: false,
      returnState: true,
    });
    const outputs = layer.apply(sequence, {
      initialState: [initialHidden, initialCell],
    }) as tf.SymbolicTensor[];
    const model = tf.model({
      inputs: [sequence, initialHidden, initialCell],
      outputs,
    });
    try {
      for (const caseId of ["standard", "changed"]) {
        for (const [forget, input, output] of [
          [0.5, 0.5, 0.5],
          [0.99, 0, 0.5],
          [1, 0, 0],
          [0.75, 0.4, 1],
          [0, 1, 0.5],
        ] as const) {
          const observed = tf.tidy(() => {
            model.setWeights([
              tf.zeros([1, 4]),
              tf.zeros([1, 4]),
              tf.tensor1d([
                logit(input),
                logit(forget),
                caseId === "changed" ? 1 : 0,
                logit(output),
              ]),
            ]);
            const [hidden, , state] = model.predict([
              tf.zeros([1, 1, 1]),
              tf.zeros([1, 1]),
              tf.tensor2d([[2]]),
            ]) as tf.Tensor[];
            return {
              cell: state!.dataSync()[0]!,
              hidden: hidden!.dataSync()[0]!,
            };
          });
          const { result, calculated } = run({ forget, input, output }, caseId);
          expect(calculated.newCell).toBeCloseTo(observed.cell, 6);
          expect(calculated.newHidden).toBeCloseTo(observed.hidden, 6);
          expect(result.answer).toBe(calculated.newHidden);
        }
      }
    } finally {
      model.dispose();
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("keeps stored state when the output gate closes and blocks candidate writes", () => {
    const open = run({ forget: 1, input: 0, output: 1 }, "changed");
    const closed = run({ forget: 1, input: 0, output: 0 }, "changed");
    expect(open.calculated.newCell).toBe(2);
    expect(closed.calculated.newCell).toBe(2);
    expect(open.calculated.newHidden).toBeGreaterThan(0);
    expect(closed.result.answer).toBe(0);

    const writing = run({ forget: 1, input: 1, output: 0 }, "changed");
    expect(writing.calculated.newCell).toBeGreaterThan(2);
    expect(writing.result.answer).toBe(0);
  });
});
