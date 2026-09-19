import { describe, it, expect, beforeAll } from "vitest";
import * as tf from "@tensorflow/tfjs";
import {
  fitScaler,
  TRAINING_ROWS,
  SAVED_SCALER,
  standardize,
  fixedNeuron,
  policyMetrics,
  VALIDATION_SCORES,
  HELD_OUT_SCORES,
  gradientTrace,
  spectrum,
  attention,
  KEYS,
  VALUES,
  cacheReplay,
  matchNumbers,
  experimentDraft,
  parseExperimentDraft,
  experimentExpected,
  EXPERIMENTS,
  type ExperimentId,
} from "./learning-experiment-data";

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});
describe("experiment numerical contracts", () => {
  it("matches actual TFJS population moments, constant-feature handling and fixed dense prediction", () => {
    const before = tf.memory().numTensors;
    for (const rows of [
      TRAINING_ROWS,
      [
        [3, 2],
        [3, 8],
        [3, 5],
      ],
    ]) {
      const actual = tf.tidy(() => {
        const x = tf.tensor2d(rows);
        const { mean, variance } = tf.moments(x, 0);
        return {
          mean: Array.from(mean.dataSync()),
          std: Array.from(variance.sqrt().dataSync()),
        };
      });
      const fitted = fitScaler(rows);
      fitted.mean.forEach((x, i) => expect(x).toBeCloseTo(actual.mean[i], 5));
      fitted.std.forEach((x, i) => expect(x).toBeCloseTo(actual.std[i], 5));
    }
    expect(
      standardize(
        [3, 5],
        fitScaler([
          [3, 2],
          [3, 8],
          [3, 5],
        ]),
      )[0],
    ).toBe(0);
    expect(
      standardize(
        [4, 5],
        fitScaler([
          [3, 2],
          [3, 8],
          [3, 5],
        ]),
      )[0],
    ).toBe(1);
    const model = tf.sequential();
    model.add(
      tf.layers.dense({ units: 1, inputShape: [2], activation: "sigmoid" }),
    );
    tf.tidy(() =>
      model.setWeights([tf.tensor2d([[0.6], [-0.8]]), tf.tensor1d([0.1])]),
    );
    for (const row of [
      [24, 2],
      [26, 3],
      [0, 0],
    ]) {
      const actual = tf.tidy(() => {
        const x = tf.tensor2d([row]);
        const z = x
          .sub(tf.tensor1d(SAVED_SCALER.mean))
          .div(tf.tensor1d(SAVED_SCALER.std));
        return (model.predict(z) as tf.Tensor).dataSync()[0];
      });
      expect(fixedNeuron(standardize(row))).toBeCloseTo(actual, 6);
    }
    model.dispose();
    expect(tf.memory().numTensors).toBe(before);
    expect(standardize([26, 3])).toEqual([2, 2]);
    expect(() => fitScaler([[1, 2], [3]])).toThrow();
    expect(() => standardize([1])).toThrow();
  });
  it("counts threshold equality, all-negative and empty-denominator cases, with F1/cost disagreement", () => {
    const lower = policyMetrics(VALIDATION_SCORES, 0.4, 1, 1),
      higher = policyMetrics(VALIDATION_SCORES, 0.7, 1, 1);
    expect(lower).toMatchObject({ tp: 4, fp: 3, tn: 13, fn: 1, cost: 4 });
    expect(higher).toMatchObject({ tp: 2, fp: 0, tn: 16, fn: 3, cost: 3 });
    expect(lower.f1).toBeGreaterThan(higher.f1);
    expect(policyMetrics(VALIDATION_SCORES, 1, 5, 10)).toMatchObject({
      tp: 0,
      fp: 0,
      fn: 5,
      precision: 0,
      recall: 0,
      f1: 0,
      cost: 50,
    });
    expect(
      policyMetrics([{ score: 0.4, positive: true }], 0.4, 1, 1),
    ).toMatchObject({ tp: 0, fn: 1 });
    expect(policyMetrics([], 0, 1, 1)).toMatchObject({
      precision: 0,
      recall: 0,
      f1: 0,
    });
    expect(policyMetrics(HELD_OUT_SCORES, 0.7, 1, 1)).toMatchObject({
      tp: 1,
      fp: 1,
      tn: 6,
      fn: 2,
      cost: 3,
    });
    expect(() => policyMetrics([], 0, -1, 1)).toThrow();
  });
  it("uses the derivative of the stated loss, including overshooting that grows or shrinks", () => {
    expect(gradientTrace(0.5).map((r) => r.weight)).toEqual([
      4, 2, 1, 0.5, 0.25,
    ]);
    expect(gradientTrace(2.2)[4].loss).toBeGreaterThan(8);
    expect(gradientTrace(1.2)[4].loss).toBeLessThan(8);
    expect(gradientTrace(0.5, -3, 1)[1]).toMatchObject({ weight: -1, loss: 2 });
    const derivative = tf.grad((w) => w.square().mul(0.5));
    const grad = tf.tidy(() => derivative(tf.scalar(4)).dataSync()[0]);
    expect(grad).toBe(4);
  });
  it("matches actual TFJS FFT bins across observed windows and zero padding, without treating padding as more data", () => {
    const before = tf.memory().numTensors;
    for (const n of [32, 64, 128])
      for (const padded of [false, true]) {
        const r = spectrum(n, padded);
        const actual = tf.tidy(() => {
          const x = tf.tensor1d(r.signal);
          const withZeros = padded ? x.pad([[0, n]]) : x;
          return Array.from(
            tf.spectral.rfft(withZeros).abs().div(n).dataSync(),
          );
        });
        r.bins.forEach((bin, i) =>
          expect(bin.magnitude).toBeCloseTo(actual[i], 5),
        );
        expect(r.nativeSpacing).toBe(128 / n);
        expect(r.gridSpacing).toBe(128 / n / (padded ? 2 : 1));
        expect(r.seconds).toBe(n / 128);
      }
    expect(tf.memory().numTensors).toBe(before);
  });
  it("matches dot-product attention and stable softmax for each query and the changed case", () => {
    const before = tf.memory().numTensors;
    for (const q of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, 2],
      [10000, -10000],
    ]) {
      const r = attention(q);
      const actual = tf.tidy(() => {
        const scores = tf.matMul(
          tf.tensor2d([q]),
          tf.tensor2d(KEYS),
          false,
          true,
        );
        const weights = tf.softmax(scores);
        return {
          weights: Array.from(weights.dataSync()),
          value: Array.from(tf.matMul(weights, tf.tensor2d(VALUES)).dataSync()),
        };
      });
      r.weights.forEach((v, i) => expect(v).toBeCloseTo(actual.weights[i], 5));
      r.value.forEach((v, i) => expect(v).toBeCloseTo(actual.value[i], 5));
      expect(r.weights.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 12);
    }
    expect(tf.memory().numTensors).toBe(before);
  });
  it("exposes rounded collisions and independently invalidates model and scaler changes", () => {
    expect(cacheReplay("rounded", 1, 1).rows[1]).toMatchObject({
      hit: true,
      wrong: true,
    });
    expect(cacheReplay("rounded", 1, 1).rows[1].returned).toBeLessThan(0.5);
    expect(cacheReplay("rounded", 1, 1).rows[1].expected).toBeGreaterThan(0.5);
    for (const [m, s] of [
      [2, 1],
      [1, 2],
      [2, 2],
    ]) {
      expect(cacheReplay("unversioned", m, s).rows[3].wrong).toBe(true);
      expect(cacheReplay("exact", m, s)).toMatchObject({ calls: 3, hits: 1 });
      expect(cacheReplay("exact", m, s).rows.every((r) => !r.wrong)).toBe(true);
    }
    expect(cacheReplay("exact", 1, 1).calls).toBe(2);
  });
});
it("accepts numerical equivalents and rejects blank, nonfinite, extra and misconception answers", () => {
  for (const s of ["2,2", "2 2", "2e0, +2.000"])
    expect(matchNumbers(s, [2, 2])).toBe(true);
  for (const s of [
    "",
    "0x2,2",
    "2,2,2",
    "NaN,2",
    "Infinity,2",
    "1,0",
    "0,0",
    "26,3",
  ])
    expect(matchNumbers(s, [2, 2])).toBe(false);
  expect(matchNumbers("0.707", [1 / Math.sqrt(2)])).toBe(true);
});
it("parses all supported drafts, rejects incompatible versions/settings/frozen state, and calculates each changed case", () => {
  for (const id of Object.keys(EXPERIMENTS) as ExperimentId[]) {
    const d = experimentDraft(id);
    expect(parseExperimentDraft(JSON.stringify(d), id)).toEqual(d);
    for (const patch of [
      { version: 2 },
      { settings: [999] },
      { answer: "x".repeat(81) },
      { prediction: { first: null, latest: null, count: 1, help: false } },
    ])
      expect(() =>
        parseExperimentDraft(JSON.stringify({ ...d, ...patch }), id),
      ).toThrow();
    d.phase = "changed_case";
    if (id === "threshold") d.frozen = [0.7, 1, 1];
    expect(experimentExpected(id, d).every(Number.isFinite)).toBe(true);
  }
  expect(() =>
    parseExperimentDraft(
      JSON.stringify({
        ...experimentDraft("threshold"),
        phase: "changed_case",
      }),
      "threshold",
    ),
  ).toThrow();
});
