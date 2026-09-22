import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FREE_RECALL_PROMPTS, lookupFreePrompt } from "./free-recall-prompts";

describe("FREE_RECALL_PROMPTS", () => {
  it("contains exactly the free module's prompts", () => {
    expect(FREE_RECALL_PROMPTS).toHaveLength(7);
  });

  it("contains nothing outside the free module", () => {
    // The whole safety argument. If a paid module ever leaks in here, a
    // hand-edited guest localStorage key resolves to paid prompt text.
    const modules = new Set(FREE_RECALL_PROMPTS.map((p) => p.moduleId));
    expect([...modules]).toEqual(["foundations"]);
  });

  it("resolves a free key", () => {
    const first = FREE_RECALL_PROMPTS[0];
    expect(lookupFreePrompt(first.lessonId, first.promptIndex)).toEqual(first);
  });

  it("returns null for a paid key, however well-formed", () => {
    expect(lookupFreePrompt("activation-functions", 0)).toBeNull();
  });

  it("returns null for a free lesson with an out-of-range prompt index", () => {
    const first = FREE_RECALL_PROMPTS[0];
    expect(lookupFreePrompt(first.lessonId, 99)).toBeNull();
  });
});

describe("free-recall-prompts is server-only", () => {
  /*
    The table is derived from the velite `lessons` collection, which velite
    re-exports as one 1.1 MB JSON default. A "use client" directive on this
    module would therefore ship all 56 lessons to every browser to display at
    most two prompts, and the byte-budget check in the plan would not notice:
    it measures the 7 extracted prompts, not what a bundler emits.

    Stage 1 ships no consumer, so nothing catches this today except this test.
    Matching the DIRECTIVE and not the string matters, because the file's own
    header comment explains the rule three times.
  */
  it("carries no 'use client' directive", () => {
    const src = readFileSync(join(__dirname, "free-recall-prompts.ts"), "utf8");
    const directive = src
      .split("\n")
      .find((line) => /^\s*["']use client["'];?\s*$/.test(line));
    expect(
      directive,
      "free-recall-prompts.ts must stay server-only: it imports the velite lessons collection, which is 1.1 MB",
    ).toBeUndefined();
  });
});

describe("course order on every free prompt", () => {
  // The guest warm-up refuses to ask about the lesson being opened or
  // anything after it (course-position.ts). It can only do that if every
  // table entry says where its lesson sits.
  it("carries the free module's order and a lesson order within it", () => {
    for (const prompt of FREE_RECALL_PROMPTS) {
      expect(prompt.moduleOrder).toBe(1);
      expect(prompt.lessonOrder).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(prompt.lessonOrder)).toBe(true);
    }
    // More than one lesson contributes, so the order actually discriminates.
    expect(
      new Set(FREE_RECALL_PROMPTS.map((p) => p.lessonOrder)).size,
    ).toBeGreaterThan(1);
  });
});
