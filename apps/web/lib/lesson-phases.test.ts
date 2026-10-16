import { describe, it, expect } from "vitest";
import {
  historyStep,
  lessonStepKeys,
  migrateLegacyStep,
  parseStepHash,
  restoreLessonSteps,
  stepHash,
} from "./lesson-phases";
const keys = lessonStepKeys("deep-orbit", "lesson", "alice");
const read = (data: Record<string, string>) =>
  restoreLessonSteps({ getItem: (key) => data[key] ?? null }, keys);
describe("five-phase migration", () => {
  it.each([0, 1, 1, 2, 3, 4].map((now, old) => [old, now]))(
    "maps legacy position %s to %s, including numeric URLs",
    (old, now) => {
      expect(migrateLegacyStep(old)).toBe(now);
      expect(parseStepHash(`#step-${old! + 1}`)).toBe(now);
      expect(read({ [keys.legacyCurrent]: String(old) }).current).toBe(now);
      expect(historyStep({ tcStep: old }, "")).toBe(now);
    },
  );
  it("keeps new keys and semantic URLs unambiguous", () => {
    for (let step = 0; step < 5; step++) {
      expect(parseStepHash(stepHash(step))).toBe(step);
      expect(historyStep({ tcStep: step, tcStepsVersion: 2 }, "")).toBe(step);
    }
    expect(
      read({ [keys.current]: "2", [keys.legacyCurrent]: "2" }).current,
    ).toBe(2);
  });
  it("preserves account isolation and the old pass/recall keys", () => {
    expect(keys.current).toBe("tc_step_v2_deep-orbit_lesson:account:alice");
    expect(keys.passed).toBe("tc_step_deep-orbit_lesson:account:alice-passed");
    expect(keys.recall).toBe("tc_recall_deep-orbit_lesson:account:alice");
    expect(lessonStepKeys("deep-orbit", "lesson", null).current).not.toBe(
      keys.current,
    );
  });
  it("revises only sensor-lesson recall while preserving its earned progress keys", () => {
    const revised = lessonStepKeys("deep-orbit", "tensor-shapes", "alice");
    expect(revised.recall).toBe(
      "tc_recall_v2_deep-orbit_tensor-shapes:account:alice",
    );
    expect(revised.current).toBe(
      "tc_step_v2_deep-orbit_tensor-shapes:account:alice",
    );
    expect(revised.passed).toBe(
      "tc_step_deep-orbit_tensor-shapes:account:alice-passed",
    );
    expect(lessonStepKeys("deep-orbit", "tensor-shapes", null).recall).toBe(
      "tc_recall_v2_deep-orbit_tensor-shapes",
    );
    expect(lessonStepKeys("other-world", "tensor-shapes", null).recall).toBe(
      "tc_recall_other-world_tensor-shapes",
    );
  });
  it("deduplicates old Concept/Code visits without inventing skipped phases", () => {
    expect(
      read({
        [keys.legacyMax]: "3",
        [keys.legacyCurrent + "-visited"]: "[0,2,3]",
      }).visited,
    ).toEqual([0, 1, 2]);
    expect(
      read({
        [keys.legacyMax]: "3",
        [keys.legacyCurrent + "-visited"]: "[0,3]",
      }).visited,
    ).toEqual([0, 2]);
    expect(
      read({ [keys.legacyCurrent + "-visited"]: "[1,2]" }).visited,
    ).toEqual([1]);
    expect(
      read({ [keys.current]: "3", [keys.current + "-visited"]: "[]" }).visited,
    ).toEqual([]);
    expect(read({}).visited).toEqual([]);
  });
  it("isolates malformed fields and only approximates visits with valid position evidence", () => {
    expect(
      read({
        [keys.current]: "bad",
        [keys.legacyCurrent]: "5",
        [keys.max]: "2.5",
        [keys.legacyMax]: "4",
        [keys.current + "-visited"]: "{}",
      }),
    ).toEqual({ current: 4, max: 3, visited: [0, 1, 2, 3, 4] });
    expect(read({ [keys.current]: "2garbage", [keys.max]: "-1" })).toEqual({
      current: null,
      max: null,
      visited: [],
    });
    for (const value of ["null", "true", '"2"', "6", "1.1"])
      expect(read({ [keys.current]: value }).current).toBeNull();
  });
  it("survives denied storage and invalid history without accepting out-of-range steps", () => {
    expect(
      restoreLessonSteps(
        {
          getItem: () => {
            throw new Error("denied");
          },
        },
        keys,
      ),
    ).toEqual({ current: null, max: null, visited: [] });
    for (const tcStep of [NaN, 1.2, -1, 9, "2", null])
      expect(historyStep({ tcStep, tcStepsVersion: 2 }, "#step-concept")).toBe(
        1,
      );
    expect(
      historyStep({ tcStep: 4, tcStepsVersion: 99 }, "#step-challenge"),
    ).toBe(2);
    expect(parseStepHash("#step-7")).toBeNull();
  });
});
