import { describe, it, expect } from "vitest";
// Single-source parser: the gate imports the SAME analyzer the CLI counter
// uses (scripts/audit-structure-variety.mjs). The P1 stripper split-brain
// (CI parser ≠ shipped parser, learners hit bugs CI could not see) is why
// this file contains no parsing logic of its own.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { dirname, join } from "node:path";
import {
  CONTENT_DIR,
  analyze,
  lessonFiles,
} from "../../../scripts/audit-structure-variety.mjs";
import { BUILT_STORY_THEMES } from "../src/built-themes";
import { THEME_SHAPE, type ThemeSlug } from "@tensorcraft/shared";

// Parent of every theme's content dir, derived from deep-orbit's dir.
const CONTENT_ROOT = dirname(CONTENT_DIR);

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

const moduleOf = (f: LessonFacts) => f.lesson.split("/")[0]!;

// One describe per BUILT story theme (scalability audit F3): the variety floor
// now applies independently to every launched theme, not just Deep Orbit.
// Adding a theme to BUILT_THEME_DIRS extends this gate automatically; each
// theme must independently meet the same anti-lockstep floor. Thresholds are
// per-theme (a theme's 56 lessons), so they carry over unchanged.
for (const theme of BUILT_STORY_THEMES) {
  const facts: LessonFacts[] = lessonFiles(join(CONTENT_ROOT, theme)).map(
    analyze,
  );
  const modules = [...new Set(facts.map(moduleOf))];

  describe(`structure-variety floor (${theme})`, () => {
    it("analyzes the full lesson corpus", () => {
      // Per-theme shape (re-audit N2/F-A): each theme is held to ITS OWN
      // lesson/module counts, not one Deep-Orbit scalar. deep-orbit 56, neon 54,
      // the rest 55; all 11 modules.
      const shape = THEME_SHAPE[theme as ThemeSlug];
      expect(facts.length).toBe(shape.totalLessons);
      expect(modules.length).toBe(shape.modules);
    });

    it("every lesson carries a scene slugline", () => {
      expect(facts.filter((f) => !f.scene).map((f) => f.lesson)).toEqual([]);
    });

    it("every module keeps at least one skeleton-breaker pattern", () => {
      const withoutBreaker = modules.filter(
        (m) =>
          !facts.some((f) => moduleOf(f) === m && f.pattern !== "standard"),
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
}
