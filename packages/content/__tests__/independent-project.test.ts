// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  metrics,
  validatePlan,
  baselinePrediction,
} from "../../../apps/web/public/assignments/room-occupancy-v1/evaluation.mjs";
import {
  validateMetadata,
  vectorFor,
} from "../../../apps/web/public/assignments/room-occupancy-v1/preprocessing.mjs";
const data = JSON.parse(
  readFileSync(
    new URL(
      "../../../apps/web/public/assignments/room-occupancy-v1/data.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const plan = () => ({
  split: {
    train: [data.rows[0].id],
    validation: [data.rows[1].id],
    test: [data.rows[2].id],
  },
  preprocessingFitIds: [data.rows[0].id],
  costs: { falsePositive: 3, falseNegative: 7 },
  baseline: { kind: "constant", value: 0 },
  predictionTime: "current measurements",
  splitReason: "later periods",
  metricReason: "error costs",
  baselineReason: "compare simple policy",
  validationChoices: "frozen before test",
});
describe("independent project contracts", () => {
  it("keeps undefined metrics distinct from measured zero and counts paired errors", () => {
    expect(
      metrics([0, 0], [0, 0], { falsePositive: 1, falseNegative: 2 }),
    ).toMatchObject({
      precision: null,
      recall: null,
      accuracy: 1,
      totalErrorCost: 0,
    });
    expect(
      metrics([1, 1, 0, 0], [1, 0, 1, 0], {
        falsePositive: 3,
        falseNegative: 7,
      }),
    ).toMatchObject({
      tp: 1,
      fn: 1,
      fp: 1,
      tn: 1,
      precision: 0.5,
      recall: 0.5,
      totalErrorCost: 10,
    });
    expect(() => metrics([0], [0, 1], {})).toThrow();
    expect(() => metrics([0], [NaN], {})).toThrow();
  });
  it("checks chronology, disjoint membership and declared preprocessing provenance", () => {
    expect(validatePlan(plan(), data.rows).test[0].id).toBe(data.rows[2].id);
    for (const mutate of [
      (p: any) => p.split.test.push(p.split.train[0]),
      (p: any) => p.split.train.push(p.split.train[0]),
      (p: any) => {
        const a = p.split.train;
        p.split.train = p.split.test;
        p.split.test = a;
      },
      (p: any) => p.preprocessingFitIds.push(p.split.test[0]),
      (p: any) => p.split.validation.push("not-a-row"),
      (p: any) => (p.costs.falseNegative = Infinity),
    ]) {
      const p = plan();
      mutate(p);
      expect(() => validatePlan(p, data.rows)).toThrow();
    }
  });
  it("uses the saved feature order/scaler and rejects unusable inputs", () => {
    const meta = {
      version: 1,
      features: ["co2", "temperature"],
      mean: [400, 20],
      std: [100, 2],
      threshold: 0.5,
    };
    expect(vectorFor({ temperature: 24, co2: 500 }, meta)).toEqual([1, 2]);
    for (const raw of [
      { temperature: 24 },
      { temperature: NaN, co2: 500 },
      { temperature: 1e100, co2: 500 },
      { temperature: 24, co2: -1 },
    ])
      expect(() => vectorFor(raw, meta)).toThrow();
    expect(() => validateMetadata({ ...meta, std: [0, 2] })).toThrow();
    expect(() =>
      validateMetadata({ ...meta, features: ["occupied", "temperature"] }),
    ).toThrow();
    expect(() =>
      validateMetadata({ ...meta, features: ["co2", "co2"] }),
    ).toThrow();
  });
  it("respects both directions and exact baseline threshold boundaries", () => {
    expect(
      baselinePrediction(
        {
          kind: "threshold",
          feature: "light",
          threshold: 10,
          direction: "gte",
        },
        { light: 10 },
      ),
    ).toBe(1);
    expect(
      baselinePrediction(
        {
          kind: "threshold",
          feature: "light",
          threshold: 10,
          direction: "lte",
        },
        { light: 11 },
      ),
    ).toBe(0);
    expect(() =>
      baselinePrediction(
        {
          kind: "threshold",
          feature: "occupied",
          threshold: 1,
          direction: "gte",
        },
        { occupied: 1 },
      ),
    ).toThrow();
  });
  it("ships ordered source rows with explicit provenance and no fitted preprocessing", () => {
    expect(data.rows).toHaveLength(2056);
    expect(new Set(data.rows.map((r: any) => r.id)).size).toBe(
      data.rows.length,
    );
    expect(
      data.rows.every(
        (r: any, i: number) =>
          i === 0 || data.rows[i - 1].recordedAt < r.recordedAt,
      ),
    ).toBe(true);
    expect(data.rows.every((r: any) => [0, 1].includes(r.occupied))).toBe(true);
    expect(data.sourceArchiveSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(data.mean).toBeUndefined();
  });
});
