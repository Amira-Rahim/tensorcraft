import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { magnitudeSpectrum, teachingSignal } from "./instrument-math";
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
      ["loss-functions", 0, 1],
      ["training-loop", 0, 1],
      ["lstm-gates", 0, 1],
      ["sequence-prediction", 0, 1],
      ["forecasting", 0, 1],
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
      ["activation-functions", 1, { function: 0 }, { function: 1 }],
      ["time-vs-frequency", 0, { frequency: 12 }, { frequency: 20 }],
      ["fourier-transform", 0, { frequency: 12 }, { frequency: 20 }],
      ["spectrograms", 0, { start: 0 }, { start: 40 }],
      ["fft-as-features", 0, { frequency: 12 }, { frequency: 20 }],
      ["windowing-and-overlap", 0, { taper: 0 }, { taper: 1 }],
      ["beyond-lstm", 0, { query: 0.8 }, { query: -1 }],
      ["temporal-attention", 0, { query: 0.8 }, { query: -1 }],
    ] as const;
    for (const [slug, index, before, after] of comparisons) {
      const prior = run(slug, before).graphics[index]!;
      const latest = run(slug, after, "changed").graphics[index]!;
      const expected = investigationDomain([prior, latest]);
      expect(comparisonDomain(prior, [latest]), slug).toEqual(expected);
      expect(comparisonDomain(latest, [prior]), slug).toEqual(expected);
    }
  });

  it("moves the signal between fixed FFT feature columns", () => {
    for (const frequency of [12, 20]) {
      const result = run("fft-as-features", { frequency, amplitude: 0.6 });
      const features = new Function(
        "samples",
        "spectrum",
        `${result.code}\nreturn features;`,
      )(teachingSignal(frequency, 0.6), magnitudeSpectrum);
      expect(features).toHaveLength(3);
      expect(features[0]).toBeCloseTo(1, 10);
      expect(features[1]).toBeCloseTo(frequency === 12 ? 0.6 : 0, 10);
      expect(features[2]).toBeCloseTo(frequency === 20 ? 0.6 : 0, 10);
      expect(result.answer).toBeCloseTo(features[1], 10);
    }
  });
  it("executes generated activation code for every input and matches TFJS", () => {
    for (const fn of [0, 1, 2]) {
      for (let input = -4; input <= 4; input += 0.25) {
        const result = run("activation-functions", { function: fn, input });
        const generated = new Function(`${result.code}\nreturn output;`)();
        const actual = tf.tidy(() => {
          const value = tf.scalar(input);
          return (
            fn === 0 ? value.relu() : fn === 1 ? value.sigmoid() : value.tanh()
          ).dataSync()[0];
        });
        expect(generated).toBeCloseTo(actual!, 6);
        expect(result.answer).toBeCloseTo(actual!, 6);
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

  it("reaches the last complete input/target window for each length", () => {
    const spec = NUMERIC_INVESTIGATIONS["sliding-windows"]!;
    const control = spec.controls.find((c) => c.id === "start")!;
    for (const length of [2, 3, 4]) {
      const start = investigationControlMax(control, { length })!;
      expect(start).toBe(8 - length - 1);
      const result = run("sliding-windows", { start, length });
      expect(result.answer).toBe(9);
      expect(result.graphics[1]!.values).toHaveLength(length);
      expect(
        clampInvestigationValues(spec, { start: 5, length: 4 }).start,
      ).toBe(3);
    }
  });

  it("adds normalized time position before softmax while pooling original values", () => {
    const keys = [-1, -0.4, 0.2, 0.7, 1.2];
    const values = [2, 7, 3, 8, 4];
    for (const positionWeight of [-2, 0, 2]) {
      const result = run("temporal-attention", { query: 0, positionWeight });
      expect(result.answer).toBe(positionWeight > 0 ? 4 : 0);
      const observed = new Function(
        "keys",
        "values",
        "softmax",
        `${result.code}\nreturn { weights, summary };`,
      )(keys, values, (scores: number[]) =>
        tf.tidy(() => Array.from(tf.softmax(tf.tensor1d(scores)).dataSync())),
      );
      expect(
        observed.weights.reduce((a: number, b: number) => a + b, 0),
      ).toBeCloseTo(1, 6);
      const expected = tf.tidy(
        () =>
          tf
            .softmax(tf.tensor1d(keys.map((_, t) => (positionWeight * t) / 4)))
            .mul(tf.tensor1d(values))
            .sum()
            .dataSync()[0],
      );
      expect(observed.summary).toBeCloseTo(expected!, 5);
      const shownContributions = result.graphics.at(-1)!.values as number[];
      shownContributions.forEach((value, t) =>
        expect(value).toBeCloseTo(observed.weights[t] * values[t]!, 2),
      );
    }
    expect(NUMERIC_INVESTIGATIONS["beyond-lstm"]!.controls).toHaveLength(1);
  });

  it("generated recurrent-state code retains the actual prior state", () => {
    for (const memory of [0.3, 0.7, 1.2]) {
      for (const step of [0, 3, 5]) {
        const result = run("simple-rnns", { memory, step });
        const generated = new Function(`${result.code}\nreturn nextState;`)();
        expect(generated).toBeCloseTo(result.answer as number, 12);
      }
    }
  });

  it("counts the statistical, reconstruction and forecast votes independently", () => {
    expect(run("the-anomaly", {}).answer).toBe(2);
    expect(run("the-anomaly", {}, "changed").answer).toBe(0);
    expect(
      run("the-anomaly", {
        actual: 0.9,
        reconstructionError: 0.1,
        predicted: 0.9,
      }).answer,
    ).toBe(1);
    expect(
      run("the-anomaly", {
        actual: 0.52,
        reconstructionError: 2,
        predicted: 0.52,
      }).answer,
    ).toBe(1);
    expect(
      run("the-anomaly", {
        actual: 0.52,
        reconstructionError: 0.1,
        predicted: 0.2,
      }).answer,
    ).toBe(1);
    const boundary = run("the-anomaly", {
      actual: 0.5,
      reconstructionError: 1,
      predicted: 0.4,
    });
    expect(boundary.answer).toBe(0);
    expect(boundary.graphics.at(-1)!.values.at(-1)).toBe("No alert selected");
    const alert = run("the-anomaly", {
      actual: 0.5,
      reconstructionError: 1.1,
      predicted: 0.39,
    });
    expect(alert.answer).toBe(2);
    expect(alert.graphics.at(-1)!.values.at(-1)).toBe("Alert selected");
  });

  it("keeps an exact threshold value below the strict alert boundary", () => {
    const equal = run("evaluating-deep-scan", { threshold: 0.41 });
    const below = run("evaluating-deep-scan", { threshold: 0.4 });
    expect(equal.graphics[1]!.values[2]).toBe("FN");
    expect(below.graphics[1]!.values[2]).toBe("TP");
    expect(equal.answer).toBe((below.answer as number) + 1);
    const costEqual = run("threshold-tuning", { threshold: 0.67, missCost: 3 });
    const costBelow = run("threshold-tuning", { threshold: 0.66, missCost: 3 });
    expect(costEqual.graphics[1]!.values[4]).toBe("TN");
    expect(costBelow.graphics[1]!.values[4]).toBe("FP");
    expect(costBelow.answer).toBe((costEqual.answer as number) + 1);
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
