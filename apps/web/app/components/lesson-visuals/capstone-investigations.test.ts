// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import {
  CAPSTONE_INVESTIGATIONS as specs,
  CAPSTONE_WINDOW,
  CAPSTONE_ASYNC_WINDOW,
  compositionReference,
  MONITOR_DURATIONS,
  nearestRank,
} from "./capstone-investigations";
import { initialInvestigationValues } from "./investigation-types";
const result = (
  slug: string,
  changes: Record<string, number> = {},
  caseId?: string,
) => {
  const spec = specs[slug]!;
  return spec.evaluate(
    { ...initialInvestigationValues(spec), ...changes },
    caseId ?? spec.cases[0]!.id,
  );
};
beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});
describe("capstone traces and evidence boundaries", () => {
  it("matches the supplied composition's real TFJS stage operations", () => {
    const before = tf.memory().numTensors;
    for (const window of [CAPSTONE_WINDOW, CAPSTONE_ASYNC_WINDOW]) {
      const actual = tf.tidy(() => {
        const raw = tf.tensor1d(window);
        const { mean, variance } = tf.moments(raw);
        const normalized = raw.sub(mean).div(variance.sqrt().add(1e-8));
        return {
          normalized: Array.from(normalized.dataSync()),
          magnitudes: Array.from(tf.spectral.rfft(normalized).abs().dataSync()),
        };
      });
      const reference = compositionReference(window);
      actual.normalized.forEach((v, i) =>
        expect(v).toBeCloseTo(reference.normalized[i]!, 5),
      );
      actual.magnitudes.forEach((v, i) =>
        expect(v).toBeCloseTo(reference.magnitudes[i]!, 5),
      );
    }
    expect(tf.memory().numTensors).toBe(before);
    expect(result("system-architecture", { stage: 0 }).answer).toBe(8);
    expect(result("system-architecture", { stage: 2 }).answer).toBe(5);
    expect(result("system-architecture", {}, "malformed").answer).toBe(0);
    expect(result("system-architecture", { async: 1 }).answer).toBe(0);
  });
  it("keeps missing labels in the denominator and export inventory separate", () => {
    expect(result("ci-cd-pipeline").answer).toBe(0.8);
    expect(result("ci-cd-pipeline", {}, "lower").answer).toBe(0.6);
    expect(
      result("ci-cd-pipeline", { minimum: 80 }).graphics[1]!.values,
    ).toContain("true");
    expect(
      result("ci-cd-pipeline", { minimum: 81 }).graphics[1]!.values,
    ).toContain("false");
    expect(result("ci-cd-pipeline", { view: 1 }).answer).toBe(209);
    expect(result("ci-cd-pipeline", { identity: 1 }).explanation).toContain(
      "old report cannot approve",
    );
  });
  it("selects nearest rank without mutating the source and distinguishes an empty log", () => {
    const before = [...MONITOR_DURATIONS];
    for (const [p, expected] of [
      [0, 40],
      [50, 89],
      [95, 134],
      [99, 400],
      [100, 400],
    ]) {
      expect(nearestRank(MONITOR_DURATIONS, p!).value).toBe(expected);
      expect(result("monitoring", { view: 1, percentile: p! }).answer).toBe(
        expected,
      );
    }
    expect(MONITOR_DURATIONS).toEqual(before);
    expect(result("monitoring", { view: 0 }).answer).toBeCloseTo(0.8);
    expect(result("monitoring", { view: 2 }).answer).toBeCloseTo(Math.sqrt(5));
    expect(result("monitoring", {}, "changed").answer).toBe("No data");
  });
  it("derives minimum recall from changed values instead of assuming the anomaly class", () => {
    expect(result("documentation").answer).toBe("anomaly");
    expect(result("documentation", { class: 0, recall: 60 }).answer).toBe(
      "pulsar",
    );
    const line = result("documentation", { line: 0 });
    expect(line.graphics[0]!.values).toContain(
      "- Accuracy: 91.8% (measured at the pruning review)",
    );
    expect(result("documentation", {}, "new").explanation).toContain(
      "do not evaluate sensor B",
    );
  });
  it("separates ordered verification, rehearsal gates and finite interval evidence", () => {
    expect(result("launch").answer).toBe(3);
    expect(result("launch", { failure: 1 }).answer).toBe(2);
    expect(
      result("launch", { failure: 2, check: 2 }).graphics[0]!.values,
    ).toContain("Skipped after timeout");
    expect(result("launch", { task: 1, accuracy: 90 }).answer).toBe(1);
    expect(result("launch", { task: 1, accuracy: 90, drift: 1 }).answer).toBe(
      0,
    );
    expect(result("launch", { task: 2, ratio: 5 }).answer).toBeCloseTo(13 / 8);
  });
});
