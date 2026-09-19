import { describe, expect, it } from "vitest";
import { exerciseDraftKey, readExerciseDraft } from "./exercise-draft";

describe("exercise draft recovery", () => {
  it("separates guest, account and exercise records", () => {
    expect(
      new Set([
        exerciseDraftKey("x"),
        exerciseDraftKey("x", "a"),
        exerciseDraftKey("x", "b"),
        exerciseDraftKey("y", "a"),
      ]).size,
    ).toBe(4);
    expect(exerciseDraftKey("x")).toBe("tc-code-x");
  });
  it("retains an unfinished legacy draft and solution assistance", () => {
    expect(readExerciseDraft("const reading = [")?.code).toBe(
      "const reading = [",
    );
    const draft = {
      version: 1,
      code: "solution()",
      starter: "old()",
      solutionViewed: true,
      stashedCode: "myAttempt()",
    };
    expect(readExerciseDraft(JSON.stringify(draft))).toEqual(draft);
  });
  it("rejects unsupported, malformed and oversized records without treating them as code", () => {
    expect(() => readExerciseDraft('{"version":2}')).toThrow();
    expect(() => readExerciseDraft('{"version":1,"code":12}')).toThrow();
    expect(() => readExerciseDraft("x".repeat(400_001))).toThrow();
  });
});
