import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { FFT_TASK_CASES } from "./signal-task-investigations";
import { comparisonDomain, investigationDomain } from "./investigation-graphic";
import {
  clampInvestigationValues,
  initialInvestigationValues,
  investigationControlMax,
} from "./investigation-types";

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

const run = (
  slug: string,
  values: Record<string, number>,
  caseId = "standard",
) => {
  const spec = NUMERIC_INVESTIGATIONS[slug]!;
  return spec.evaluate(
    { ...initialInvestigationValues(spec, caseId), ...values },
    caseId,
  );
};

describe("audited numeric investigations", () => {
  it("preserves common axes for the catalog's same-quantity comparisons", () => {
    const pairs = [
      ["training-loop", 0, 1],
      ["lstm-gates", 0, 1],
      ["forecasting", 0, 2],
      ["kalman-filters", 0, 2],
      ["quantization", 0, 1],
      ["pruning", 0, 1],
    ] as const;
    for (const [slug, first, second] of pairs) {
      for (const example of NUMERIC_INVESTIGATIONS[slug]!.cases) {
        const { graphics } = run(slug, {}, example.id);
        const pair = [graphics[first]!, graphics[second]!];
        const expected = investigationDomain(pair);
        for (const graphic of pair) {
          expect(
            comparisonDomain(graphic, graphics),
            `${slug}: ${graphic.label}`,
          ).toEqual(expected);
        }
      }
    }
  });

  it("preserves the quantity when chart captions change across runs", () => {
    const comparisons = [
      ["time-vs-frequency", 0, { bin: 147 }, { bin: 94 }],
      ["fourier-transform", 0, { bin: 5 }, { bin: 7 }],
      ["spectrograms", 2, { frame: 0 }, { frame: 1 }],
      ["fft-as-features", 0, { feature: 2 }, { feature: 3 }],
      ["windowing-and-overlap", 0, { taper: 0 }, { taper: 1 }],
      ["beyond-lstm", 2, { query: 0.8 }, { query: -1 }],
      ["temporal-attention", 2, { positionWeight: 0.5 }, { positionWeight: 2 }],
    ] as const;
    for (const [slug, index, before, after] of comparisons) {
      const prior = run(slug, before).graphics[index]!;
      const latest = run(slug, after, "changed").graphics[index]!;
      const expected = investigationDomain([prior, latest]);
      expect(comparisonDomain(prior, [latest]), slug).toEqual(expected);
      expect(comparisonDomain(latest, [prior]), slug).toEqual(expected);
    }
  });

  it("matches the scalar challenge gradient and its finite-difference comparison", () => {
    const before = tf.memory().numTensors;
    for (let weight = -5; weight <= 5; weight += 0.25) {
      const result = run("backpropagation", { weight });
      const variable = tf.tidy(() => tf.variable(tf.scalar(weight)));
      try {
        const actual = tf.tidy(() => {
          const { grads } = tf.variableGrads(() => variable.square());
          return grads[variable.name]!.dataSync()[0];
        });
        const calculation = new Function(
          `${result.code}\nreturn { gradient, estimate };`,
        )();
        expect(result.answer).toBeCloseTo(actual!, 6);
        expect(calculation.gradient).toBeCloseTo(actual!, 6);
        expect(calculation.estimate).toBeCloseTo(actual!, 2);
        expect(result.graphics[1]!.values).toEqual([
          calculation.gradient,
          Number(calculation.estimate.toFixed(3)),
        ]);
        expect(variable.dataSync()[0]).toBe(weight);
      } finally {
        variable.dispose();
      }
    }
    expect(tf.memory().numTensors).toBe(before);
    expect(run("backpropagation", {}, "changed").answer).toBe(10);
  });

  it("reads raw Fourier bins and returns the eligible winner on each supplied grid", () => {
    for (const [caseId, item] of Object.entries(FFT_TASK_CASES)) {
      const raw = tf.tidy(() =>
        Array.from(
          tf.spectral.rfft(tf.tensor1d(item.samples)).abs().dataSync(),
        ),
      );
      let winner = 1;
      for (let bin = 2; bin < raw.length; bin++)
        if (raw[bin]! > raw[winner]!) winner = bin;
      for (const bin of [0, 1, item.samples.length / 2]) {
        const result = run("fourier-transform", { bin }, caseId);
        const generated = new Function(
          `${result.code}\nreturn { frequency, selectedFrequency };`,
        )();
        expect(result.answer).toBe((winner * item.rate) / item.samples.length);
        expect(generated.frequency).toBe(result.answer);
        expect(generated.selectedFrequency).toBe(
          (bin * item.rate) / item.samples.length,
        );
        expect(result.graphics[1]!.highlight).toEqual([bin, winner]);
        expect(result.graphics[1]!.values[bin]).toBeCloseTo(raw[bin]!, 2);
      }
    }
  });

  it("keeps the supplied FFT feature positions attached to their bin centers", () => {
    const first = run("fft-as-features", { feature: 2 });
    const second = run("fft-as-features", { feature: 7 });
    expect(first.answer).toBeCloseTo(32, 3);
    expect(second.answer).toBeCloseTo(16, 3);
    expect(first.graphics[2]!.values).toHaveLength(10);
    expect(first.graphics[2]!.labels?.[2]).toContain("52 Hz");
    expect(second.graphics[2]!.labels?.[7]).toContain("72 Hz");
    for (const result of [first, second])
      expect(new Function(`${result.code}\nreturn selectedValue;`)()).toBe(
        result.answer,
      );
  });

  it("executes generated activation code for each diagnostic case and matches TFJS", () => {
    const spec = NUMERIC_INVESTIGATIONS["activation-functions"]!;
    for (const fn of [0, 1, 2]) {
      for (const example of spec.cases) {
        const values = initialInvestigationValues(spec, example.id);
        const result = run(
          "activation-functions",
          { function: fn },
          example.id,
        );
        const generated = new Function(`${result.code}\nreturn selected;`)();
        const actual = tf.tidy(() => {
          const input = tf.tensor1d(result.graphics[0]!.values as number[]);
          const output =
            fn === 0 ? input.relu() : fn === 1 ? input.sigmoid() : input.tanh();
          return output.dataSync()[values.position!]!;
        });
        expect(generated).toBeCloseTo(actual, 6);
        expect(result.answer).toBeCloseTo(actual, 6);
      }
    }
  });

  it("reaches all sixteen rows at each batch size and preserves row features", () => {
    const spec = NUMERIC_INVESTIGATIONS["data-loading"]!;
    const control = spec.controls.find((c) => c.id === "batch")!;
    for (const caseId of ["standard", "changed"]) {
      const expectedOrder =
        caseId === "standard"
          ? Array.from({ length: 16 }, (_, i) => i)
          : [2, 0, 3, 1, 6, 4, 7, 5, 10, 8, 11, 9, 14, 12, 15, 13];
      for (const size of [2, 4, 8]) {
        const maximum = investigationControlMax(control, { size })!;
        expect(maximum).toBe(16 / size - 1);
        const seen: number[] = [];
        for (let batch = 0; batch <= maximum; batch++) {
          const result = run("data-loading", { size, batch }, caseId);
          expect(result.answer).toBe(expectedOrder[batch * size]);
          expect(result.graphics[0]!.highlight).toEqual(
            Array.from({ length: size }, (_, i) => batch * size + i),
          );
          const features = result.graphics[1]!.values as number[];
          for (let row = 0; row < size; row++) {
            const id = features[row * 3]! / 100;
            seen.push(id);
            expect(features.slice(row * 3, row * 3 + 3)).toEqual([
              id * 100,
              id,
              id / 10,
            ]);
          }
        }
        expect(seen).toEqual(expectedOrder);
      }
    }
    expect(clampInvestigationValues(spec, { size: 8, batch: 7 })).toEqual({
      size: 8,
      batch: 1,
    });
  });

  it("reaches the last complete classification window and labels its last reading", () => {
    const spec = NUMERIC_INVESTIGATIONS["sliding-windows"]!;
    const control = spec.controls.find((c) => c.id === "start")!;
    for (const window of [2, 3, 4]) {
      const start = investigationControlMax(control, { window })!;
      expect(start).toBe(12 - window);
      const result = run("sliding-windows", { start, window });
      expect(result.answer).toBe("evaluation");
      expect(result.graphics[2]!.values).toEqual([
        start,
        11,
        8,
        0,
        "evaluation",
      ]);
      expect(clampInvestigationValues(spec, { start: 11, window }).start).toBe(
        12 - window,
      );
    }
  });

  it("adds normalized time position while preserving the original feature width", () => {
    for (const positionWeight of [-2, 0, 2]) {
      const result = run("temporal-attention", {
        featureWeight: 0,
        positionWeight,
      });
      const expected = tf.tidy(
        () =>
          tf
            .softmax(tf.tensor1d([0, positionWeight / 2, positionWeight]))
            .mul(tf.tensor1d([0, 0.25, 0.5]))
            .sum()
            .dataSync()[0],
      );
      expect(result.answer).toBeCloseTo(expected!, 6);
      const weights = result.graphics[2]!.values as number[];
      expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
      expect(result.graphics[0]!.values).toHaveLength(6);
    }
    expect(NUMERIC_INVESTIGATIONS["beyond-lstm"]!.controls).toHaveLength(4);
  });

  it("generated recurrent-state code retains the actual prior state", () => {
    for (const memory of [0.3, 0.7, 1.2]) {
      for (const step of [0, 1, 2]) {
        const result = run("simple-rnns", { memory, step });
        const generated = new Function(`${result.code}\nreturn nextState;`)();
        expect(generated).toBeCloseTo(result.answer as number, 12);
      }
    }
  });

  it("counts the supplied statistical, reconstruction and amplitude-forecast votes independently", () => {
    expect(run("the-anomaly", {}).answer).toBe(2);
    expect(run("the-anomaly", {}, "changed").answer).toBe(1);
    expect(
      run("the-anomaly", { actual: 0.9, reconstruction: 0.1, forecast: 0.9 })
        .answer,
    ).toBe(1);
    expect(
      run("the-anomaly", { actual: 0.52, reconstruction: 2, forecast: 0.52 })
        .answer,
    ).toBe(1);
    expect(
      run("the-anomaly", { actual: 0.52, reconstruction: 0.1, forecast: 0.2 })
        .answer,
    ).toBe(1);
    const boundary = run("the-anomaly", {
      actual: 0.5,
      reconstruction: 1,
      forecast: 0.4,
    });
    expect(boundary.answer).toBe(0);
    expect(boundary.graphics.at(-1)!.values.at(-1)).toBe(
      "0 votes. No alert under majority rule",
    );
    const alert = run("the-anomaly", {
      actual: 0.5,
      reconstruction: 1.1,
      forecast: 0.39,
    });
    expect(alert.answer).toBe(2);
    expect(alert.graphics.at(-1)!.values.at(-1)).toBe("2 votes. Raise alert");
  });

  it("keeps an exact threshold value below the strict alert boundary", () => {
    const equal = run("evaluating-deep-scan", { threshold: 0.41 });
    const below = run("evaluating-deep-scan", { threshold: 0.4 });
    expect(
      equal.graphics.find(
        (graphic) => graphic.label === "Categories at this threshold",
      )!.values[2],
    ).toBe("FN");
    expect(
      below.graphics.find(
        (graphic) => graphic.label === "Categories at this threshold",
      )!.values[2],
    ).toBe("TP");
    expect(equal.answer).toBe((below.answer as number) + 1);
    const first = run("threshold-tuning", { candidate: 0, row: 5 });
    expect(first.graphics[0]!.values[5]).toContain("flag false");
    expect(first.answer).toBeCloseTo(6 / 7, 12);
    const second = run("threshold-tuning", { candidate: 1 });
    expect(second.answer).toBe(0.8);
  });

  it("parses generated JavaScript at every case and control extreme", () => {
    for (const spec of Object.values(NUMERIC_INVESTIGATIONS)) {
      for (const example of spec.cases) {
        const initial = initialInvestigationValues(spec, example.id);
        const variants = spec.controls.flatMap((control) => {
          const options =
            control.kind === "choice"
              ? control.options!.map((option) => option.value)
              : [control.min!, investigationControlMax(control, initial)!];
          return options.map((value) =>
            clampInvestigationValues(spec, { ...initial, [control.id]: value }),
          );
        });
        for (const inputs of [initial, ...variants]) {
          const result = spec.evaluate(inputs, example.id);
          if (result.code)
            expect(() => new Function(result.code!)).not.toThrow();
        }
      }
    }
  });
});
