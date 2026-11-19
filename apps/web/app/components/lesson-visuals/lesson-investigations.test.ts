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

  it("keeps the recording sensor aligned through pairing and broadcast", () => {
    expect(
      evaluate("tensor-operations", { row: 1, column: 0, gain: 2 }).answer,
    ).toBe(7);
    expect(
      evaluate("tensor-operations", { row: 1, column: 1, gain: 1 }, "changed")
        .answer,
    ).toBe(19);
  });

  it("uses saved training statistics for a later reading", () => {
    expect(
      evaluate("normalization", { temperature: 24, method: 1 }).answer,
    ).toBeCloseTo(1 / Math.sqrt(5));
    expect(
      evaluate("normalization", { temperature: 30, method: 2 }).answer,
    ).toBeCloseTo(10 / 6);
  });

  it("keeps bias separate from the three weighted input contributions", () => {
    expect(
      evaluate("first-neuron", { weight: -0.2, bias: 0.1 }).answer,
    ).toBeCloseTo(0.26);
    expect(
      evaluate("first-neuron", { weight: 0.2, bias: 0.1 }, "changed").answer,
    ).toBeCloseTo(0.58);
  });

  it("detects missing shards even when model.json is available", () => {
    expect(
      evaluate("model-loading", { graph: 1, shards: 0, paths: 0 }).answer,
    ).toBe("files unavailable");
    expect(
      evaluate("model-loading", { graph: 1, shards: 1, paths: 1 }, "large")
        .answer,
    ).toBe("files unavailable");
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
    expect(evaluate("system-architecture", {}, "malformed").answer).toBe(0);
    expect(evaluate("system-architecture", { stage: 0 }, "valid").answer).toBe(
      8,
    );
  });

  it("accepts valid structure while leaving the reply's claims for evidence review", () => {
    const complete = evaluate("llms-for-science", { reply: 0 }, "wrapped");
    expect(complete.answer).toBe("Accepted fields");
    expect(complete.graphics.at(-1)?.values.at(-1)).toContain(
      "evidence review",
    );
    expect(evaluate("llms-for-science", { reply: 1 }, "plain").answer).toBe(
      "Accepted fields",
    );
    expect(evaluate("llms-for-science", { reply: 2 }, "plain").answer).toBe(
      "Rejected reply",
    );
  });

  it("counts omitted matches after field filtering and preserves the record cap", () => {
    expect(evaluate("rag-for-signals", { query: 1 }, "filters").answer).toBe(0);
    expect(evaluate("rag-for-signals", { query: 1 }, "capped").answer).toBe(10);
    expect(evaluate("rag-for-signals", { query: 0 }, "capped").answer).toBe(20);
  });

  it("rejects blank or nonfinite predictions and accepts rounded measurements", () => {
    expect(matchesInvestigationPrediction("", 0)).toBe(false);
    expect(matchesInvestigationPrediction("Infinity", 0)).toBe(false);
    expect(matchesInvestigationPrediction("0.333", 1 / 3, 0.001)).toBe(true);
    expect(matchesInvestigationPrediction("2", 3, 0)).toBe(false);
  });
});
