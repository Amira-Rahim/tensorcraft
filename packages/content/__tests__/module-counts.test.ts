import { readdirSync, statSync } from "node:fs";
import { basename, join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import {
  getModuleLessonCount,
  getThemeTotalLessons,
  THEME_CONTENT,
  THEME_SHAPE,
  type ThemeSlug,
} from "@tensorcraft/shared";
import { BUILT_STORY_THEMES } from "../src/built-themes";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";

/**
 * Module-size constant gate (2026-07-13, DISPATCH producer).
 *
 * The API cannot import this package, so the DISPATCH milestone producer
 * decides "module complete" from getModuleLessonCount(theme, module) in shared.
 * If a module gains or loses a lesson without the shape moving, milestones fire
 * early or never. This gate compares the shape against the real MDX corpus,
 * module by module.
 *
 * PER-THEME (re-audit N2/F-B). Previously this read only CONTENT_DIR
 * (deep-orbit) and called the old single-arg getModuleLessonCount, so neon's
 * image-data (4) and any other non-orbit deviation were unmodeled and no gate
 * caught it. It now loops every BUILT story theme and validates that theme's
 * own THEME_SHAPE against its own corpus; the content root is derived from
 * deep-orbit's dir.
 */

// packages/content/content — parent of every theme's content dir.
const CONTENT_ROOT: string = dirname(CONTENT_DIR);

function countLessons(moduleDir: string): number {
  return readdirSync(moduleDir).filter((f) => f.endsWith(".mdx")).length;
}

function moduleDirsOf(themeDir: string): string[] {
  return readdirSync(themeDir)
    .map((entry: string) => join(themeDir, entry))
    .filter((p: string) => statSync(p).isDirectory());
}

// Drift guard: THEME_CONTENT's launched-theme scalars (used by marketing/
// pricing) must equal the deep-orbit row of the per-theme THEME_SHAPE, so the
// two sources cannot silently diverge now that shape is per-theme data.
describe("THEME_CONTENT mirrors THEME_SHAPE[deep-orbit] (re-audit N2/F-A)", () => {
  it("launched-theme scalars equal deep-orbit's shape", () => {
    expect(THEME_CONTENT.totalLessonsPerTheme).toBe(
      THEME_SHAPE["deep-orbit"].totalLessons,
    );
    expect(THEME_CONTENT.modulesPerTheme).toBe(
      THEME_SHAPE["deep-orbit"].modules,
    );
  });
});

for (const theme of BUILT_STORY_THEMES) {
  const shape = THEME_SHAPE[theme as ThemeSlug];
  const moduleDirs = moduleDirsOf(join(CONTENT_ROOT, theme));

  describe(`module lesson counts vs shared shape (${theme})`, () => {
    it(`covers all ${shape.modules} modules`, () => {
      expect(moduleDirs.length).toBe(shape.modules);
    });

    it("every module's real MDX count matches getModuleLessonCount(theme, module)", () => {
      // Also catches an UNDECLARED deviation: a module holding 4 lessons with no
      // override in THEME_SHAPE reads expected=5, actual=4 → mismatch.
      const mismatches = moduleDirs
        .map((dir) => ({
          module: basename(dir),
          actual: countLessons(dir),
          expected: getModuleLessonCount(theme, basename(dir)),
        }))
        .filter((m) => m.actual !== m.expected);
      expect(mismatches).toEqual([]);
    });

    it("the per-module counts sum to the theme's total", () => {
      const total = moduleDirs.reduce((sum, dir) => sum + countLessons(dir), 0);
      expect(total).toBe(getThemeTotalLessons(theme));
    });
  });
}
