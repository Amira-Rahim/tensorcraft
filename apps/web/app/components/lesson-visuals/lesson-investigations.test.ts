import { describe, expect, it } from "vitest";
import { DEEP_ORBIT_VISUALS } from "./deep-orbit-visuals";
import { LESSON_INVESTIGATIONS } from "./lesson-investigations";
import {
  clampInvestigationValues,
  initialInvestigationValues,
  matchesInvestigationPrediction,
  type LessonInvestigationSpec,
} from "./investigation-types";

const evaluate = (
  slug: string,
  values: Record<string, number> = {},
  caseId?: string,
) => {
  const spec = LESSON_INVESTIGATIONS[slug]!;
  const selectedCase = caseId ?? spec.cases[0]!.id;
  return spec.evaluate(
    { ...initialInvestigationValues(spec, selectedCase), ...values },
    selectedCase,
  );
};

function controlVariants(spec: LessonInvestigationSpec) {
  return spec.controls.flatMap((control) => {
    const choices =
      control.kind === "choice"
        ? control.options!.map((option) => option.value)
        : [control.min!, control.max!];
    return choices.map((value) => ({ [control.id]: value }));
  });
}

describe("Deep Orbit experiments", () => {
  it("covers the entire visual curriculum without an empty lesson", () => {
    expect(Object.keys(LESSON_INVESTIGATIONS).sort()).toEqual(
      Object.keys(DEEP_ORBIT_VISUALS).sort(),
    );
    expect(Object.keys(LESSON_INVESTIGATIONS)).toHaveLength(56);
  });

  it.each(Object.entries(LESSON_INVESTIGATIONS))(
    "%s offers changed cases and usable results throughout its controls",
    (_slug, spec) => {
      expect(spec.cases.length).toBeGreaterThanOrEqual(2);
      expect(spec.controls.length).toBeGreaterThan(0);
      const outcomes = new Set<string>();
      for (const selectedCase of spec.cases) {
        const initial = initialInvestigationValues(spec, selectedCase.id);
        for (const control of spec.controls) {
          if (control.kind === "choice")
            expect(control.options!.map((option) => option.value)).toContain(
              initial[control.id],
            );
          else {
            expect(initial[control.id]).toBeGreaterThanOrEqual(control.min!);
            expect(initial[control.id]).toBeLessThanOrEqual(control.max!);
          }
        }
        for (const variation of [{}, ...controlVariants(spec)]) {
          const values = clampInvestigationValues(spec, {
            ...initial,
            ...variation,
          });
          const unchanged = { ...values };
          const result = spec.evaluate(values, selectedCase.id);
          expect(values).toEqual(unchanged);
          expect(result.graphics.length).toBeGreaterThanOrEqual(2);
          expect(result.explanation.trim()).not.toBe("");
          if (typeof result.answer === "number")
            expect(Number.isFinite(result.answer)).toBe(true);
          else if (spec.prediction.choices)
            expect(spec.prediction.choices).toContain(result.answer);
          for (const graphic of result.graphics) {
            expect(graphic.values.length).toBeGreaterThan(0);
            for (const value of graphic.values) {
              if (typeof value === "number")
                expect(Number.isFinite(value)).toBe(true);
            }
          }
          // Repeated runs of the same inputs must give the same observation.
          expect(spec.evaluate(values, selectedCase.id)).toEqual(result);
          outcomes.add(JSON.stringify([result.answer, result.graphics]));
        }
      }
      expect(outcomes.size).toBeGreaterThan(1);
    },
  );

  it("broadcasts each channel before applying the gain", () => {
    expect(evaluate("tensor-operations", { position: 2, gain: 2 }).answer).toBe(
      8,
    );
    expect(
      evaluate("tensor-operations", { position: 3, gain: 1 }, "changed").answer,
    ).toBe(8);
  });

  it("uses saved training statistics for a later reading", () => {
    expect(
      evaluate("normalization", { temperature: 24, method: 1 }).answer,
    ).toBeCloseTo(1 / Math.sqrt(5));
    expect(
      evaluate("normalization", { temperature: 30, method: 2 }).answer,
    ).toBeCloseTo(10 / 6);
  });

  it("keeps bias separate from weighted input contributions", () => {
    expect(
      evaluate("first-neuron", { weight: 0.75, bias: 0.2 }).answer,
    ).toBeCloseTo(0.1);
    expect(
      evaluate("first-neuron", { weight: 1, bias: -0.1 }, "changed").answer,
    ).toBeCloseTo(0.65);
  });

  it("detects missing shards even when model.json is available", () => {
    expect(
      evaluate("model-loading", { graph: 1, shards: 1, paths: 0 }).answer,
    ).toBe(1);
    expect(
      evaluate("model-loading", { graph: 1, shards: 4, paths: 1 }, "large")
        .answer,
    ).toBe(4);
  });

  it("distinguishes a cached hit from a valid cached hit after a scaler change", () => {
    const result = evaluate("caching-strategies", {
      key: 0,
      capacity: 2,
      version: 1,
    });
    expect(result.answer).toBe(2);
    expect(
      result.graphics.some((graphic) =>
        graphic.values.includes("A: stale hit"),
      ),
    ).toBe(true);
  });

  it("includes cold initialization and completion in the profiling scope", () => {
    expect(
      evaluate("model-profiling", { cold: 1, read: 1, runs: 5 }).answer,
    ).toBe(36);
    expect(
      evaluate("model-profiling", { cold: 0, read: 0, runs: 5 }).answer,
    ).toBe(4);
  });

  it("stops the pipeline when required input metadata is missing", () => {
    expect(evaluate("system-architecture", {}, "malformed").answer).toBe(5);
    expect(evaluate("system-architecture", { model: 0 }, "valid").answer).toBe(
      60,
    );
  });

  it("keeps a plausible origin claim unverified", () => {
    const complete = evaluate(
      "llms-for-science",
      { measurements: 1, source: 1, draft: 1 },
      "full",
    );
    expect(complete.answer).toBe(2);
    expect(complete.graphics.at(-1)?.values.at(-1)).toContain("unverified");
    expect(
      evaluate(
        "llms-for-science",
        { measurements: 1, source: 1, draft: 1 },
        "partial",
      ).answer,
    ).toBe(1);
  });

  it("requires retrieved evidence and its identity to support a claim", () => {
    expect(
      evaluate("rag-for-signals", { query: 1, top: 1, ids: 1 }, "calibration")
        .answer,
    ).toBe(0);
    expect(
      evaluate("rag-for-signals", { query: 2, top: 1, ids: 1 }, "calibration")
        .answer,
    ).toBe(1);
    expect(
      evaluate("rag-for-signals", { query: 2, top: 1, ids: 0 }, "calibration")
        .answer,
    ).toBe(0);
  });

  it("rejects blank or nonfinite predictions and accepts rounded measurements", () => {
    expect(matchesInvestigationPrediction("", 0)).toBe(false);
    expect(matchesInvestigationPrediction("Infinity", 0)).toBe(false);
    expect(matchesInvestigationPrediction("0.333", 1 / 3, 0.001)).toBe(true);
    expect(matchesInvestigationPrediction("2", 3, 0)).toBe(false);
  });
});
