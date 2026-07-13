import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, it, expect } from "vitest";
import { getModuleLessonCount, THEME_CONTENT } from "@tensorcraft/shared";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";

/**
 * Module-size constant gate (2026-07-13, DISPATCH producer).
 *
 * The API cannot import this package, so the DISPATCH milestone producer
 * decides "module complete" from getModuleLessonCount() in shared. If a
 * module gains or loses a lesson without the constant moving, milestones
 * fire early or never. This gate compares the constant against the real
 * MDX corpus, module by module.
 */

function countLessons(moduleDir: string): number {
  return readdirSync(moduleDir).filter((f) => f.endsWith(".mdx")).length;
}

const moduleDirs = readdirSync(CONTENT_DIR)
  .map((entry: string) => join(CONTENT_DIR, entry))
  .filter((p: string) => statSync(p).isDirectory());

describe("module lesson counts vs shared constant", () => {
  it("covers all 11 modules", () => {
    expect(moduleDirs.length).toBe(THEME_CONTENT.modulesPerTheme);
  });

  it("every module's real MDX count matches getModuleLessonCount()", () => {
    const mismatches = moduleDirs
      .map((dir: string) => ({
        module: basename(dir),
        actual: countLessons(dir),
        expected: getModuleLessonCount(basename(dir)),
      }))
      .filter((m: { actual: number; expected: number }) => {
        return m.actual !== m.expected;
      });
    expect(mismatches).toEqual([]);
  });

  it("the per-module counts sum to totalLessonsPerTheme", () => {
    const total = moduleDirs.reduce(
      (sum: number, dir: string) => sum + countLessons(dir),
      0,
    );
    expect(total).toBe(THEME_CONTENT.totalLessonsPerTheme);
  });
});
