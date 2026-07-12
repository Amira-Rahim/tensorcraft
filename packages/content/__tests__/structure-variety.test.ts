import { describe, it, expect } from "vitest";
// Single-source parser: the gate imports the SAME analyzer the CLI counter
// uses (scripts/audit-structure-variety.mjs). The P1 stripper split-brain
// (CI parser ≠ shipped parser, learners hit bugs CI could not see) is why
// this file contains no parsing logic of its own.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import {
  CONTENT_DIR,
  analyze,
  lessonFiles,
} from "../../../scripts/audit-structure-variety.mjs";

/**
 * Structure-variety regression gate (P2, 2026-07-12).
 *
 * Six launch-audit rounds proved the failure mode: variety machinery exists
 * in the schema but no lesson uses it, and nobody notices because no test
 * counts. These assertions pin the P2 floor so future authoring can't slide
 * back into lockstep. Thresholds are deliberately looser than the current
 * measured numbers; they catch regressions, not style drift.
 */

interface LessonFacts {
  lesson: string;
  opener: string;
  pattern: string;
  scene: boolean;
  takeaways: number;
  recall: number;
}

const facts: LessonFacts[] = lessonFiles(CONTENT_DIR).map(analyze);
const moduleOf = (f: LessonFacts) => f.lesson.split("/")[0]!;
const modules = [...new Set(facts.map(moduleOf))];

describe("structure-variety floor (Deep Orbit)", () => {
  it("analyzes the full 56-lesson corpus", () => {
    expect(facts.length).toBe(56);
    expect(modules.length).toBe(11);
  });

  it("every lesson carries a scene slugline", () => {
    expect(facts.filter((f) => !f.scene).map((f) => f.lesson)).toEqual([]);
  });

  it("every module keeps at least one skeleton-breaker pattern", () => {
    const withoutBreaker = modules.filter(
      (m) => !facts.some((f) => moduleOf(f) === m && f.pattern !== "standard"),
    );
    expect(withoutBreaker).toEqual([]);
  });

  it("every non-standard pattern stays in use somewhere", () => {
    const used = new Set(facts.map((f) => f.pattern));
    for (const p of [
      "broken_code_first",
      "discovery",
      "flashback",
      "peer_review",
    ]) {
      expect(used, `pattern "${p}" has no lesson`).toContain(p);
    }
  });

  it("dialogue openers stay a minority-enough share (no monoculture relapse)", () => {
    const dialogueOpens = facts.filter((f) => f.opener === "dialogue").length;
    // Baseline before P2 was 49/56; P2 landed at 38. Gate well above the
    // current value but below the old monoculture.
    expect(dialogueOpens).toBeLessThanOrEqual(44);
  });

  it("takeaway counts are not in lockstep", () => {
    const counts = new Set(facts.map((f) => f.takeaways));
    expect(counts.size).toBeGreaterThanOrEqual(2);
  });

  it("at least a few lessons carry more than one RecallPrompt", () => {
    const doubles = facts.filter((f) => f.recall >= 2).length;
    expect(doubles).toBeGreaterThanOrEqual(2);
  });
});
