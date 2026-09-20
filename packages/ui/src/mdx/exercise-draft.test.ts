import { describe, expect, it } from "vitest";
import {
  exerciseDraftKey,
  readExerciseDraft,
  resolveDraftForStarter,
  isTrivialDraft,
  type ExerciseDraft,
} from "./exercise-draft";

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

describe("exercise draft reconciliation with the current starter", () => {
  const draft = (code: string, starter: string): ExerciseDraft => ({
    version: 1,
    code,
    starter,
    solutionViewed: false,
    stashedCode: null,
  });

  it("moves an untouched draft onto a changed starter instead of preserving the stale one", () => {
    // Opening an exercise used to persist the starter as a draft, so a
    // later starter fix never reached that learner (audit 2026-09-20).
    const stale = {
      ...draft("old starter", "old starter"),
      solutionViewed: true,
    };
    const resolved = resolveDraftForStarter(stale, "new starter");
    expect(resolved).toEqual({
      ...stale,
      code: "new starter",
      starter: "new starter",
    });
  });

  it("keeps edited code when the starter has changed", () => {
    const edited = draft("my work", "old starter");
    expect(resolveDraftForStarter(edited, "new starter")).toBe(edited);
  });

  it("keeps any draft while the starter is unchanged", () => {
    const same = draft("old starter", "old starter");
    expect(resolveDraftForStarter(same, "old starter")).toBe(same);
  });

  it("keeps a legacy draft that recorded no starter", () => {
    const legacy = draft("const x = 1;", "");
    expect(resolveDraftForStarter(legacy, "starter")).toBe(legacy);
  });

  it("treats an untouched editor with no help and no stash as nothing to persist", () => {
    expect(
      isTrivialDraft({
        code: "s",
        starter: "s",
        solutionViewed: false,
        stashedCode: null,
      }),
    ).toBe(true);
    expect(
      isTrivialDraft({
        code: "s2",
        starter: "s",
        solutionViewed: false,
        stashedCode: null,
      }),
    ).toBe(false);
    expect(
      isTrivialDraft({
        code: "s",
        starter: "s",
        solutionViewed: true,
        stashedCode: null,
      }),
    ).toBe(false);
    expect(
      isTrivialDraft({
        code: "s",
        starter: "s",
        solutionViewed: false,
        stashedCode: "kept",
      }),
    ).toBe(false);
  });
});
