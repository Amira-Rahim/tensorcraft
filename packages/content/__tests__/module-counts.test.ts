import { readdirSync, statSync } from "node:fs";
import { basename, join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import {
  getModuleLessonCount,
  getWorldTotalLessons,
  WORLD_CONTENT,
  WORLD_SHAPE,
  type WorldSlug,
} from "@tensorcraft/shared";
import { BUILT_STORY_WORLDS } from "../src/built-worlds";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";

/**
 * Module-size constant gate (2026-07-13, DISPATCH producer).
 *
 * The API cannot import this package, so the DISPATCH milestone producer
 * decides "module complete" from getModuleLessonCount(world, module) in shared.
 * If a module gains or loses a lesson without the shape moving, milestones fire
 * early or never. This gate compares the shape against the real MDX corpus,
 * module by module.
 *
 * PER-WORLD (re-audit N2/F-B). Previously this read only CONTENT_DIR
 * (deep-orbit) and called the old single-arg getModuleLessonCount, so neon's
 * image-data (4) and any other non-orbit deviation were unmodeled and no gate
 * caught it. It now loops every BUILT story world and validates that world's
 * own WORLD_SHAPE against its own corpus; the content root is derived from
 * deep-orbit's dir.
 */

// packages/content/content - parent of every world's content dir.
const CONTENT_ROOT: string = dirname(CONTENT_DIR);

function countLessons(moduleDir: string): number {
  return readdirSync(moduleDir).filter((f) => f.endsWith(".mdx")).length;
}

function moduleDirsOf(worldDir: string): string[] {
  return readdirSync(worldDir)
    .map((entry: string) => join(worldDir, entry))
    .filter((p: string) => statSync(p).isDirectory());
}

// Drift guard: WORLD_CONTENT's launched-world scalars (used by marketing/
// pricing) must equal the deep-orbit row of the per-world WORLD_SHAPE, so the
// two sources cannot silently diverge now that shape is per-world data.
describe("WORLD_CONTENT mirrors WORLD_SHAPE[deep-orbit] (re-audit N2/F-A)", () => {
  it("launched-world scalars equal deep-orbit's shape", () => {
    expect(WORLD_CONTENT.totalLessonsPerWorld).toBe(
      WORLD_SHAPE["deep-orbit"].totalLessons,
    );
    expect(WORLD_CONTENT.modulesPerWorld).toBe(
      WORLD_SHAPE["deep-orbit"].modules,
    );
  });
});

for (const world of BUILT_STORY_WORLDS) {
  const shape = WORLD_SHAPE[world as WorldSlug];
  const moduleDirs = moduleDirsOf(join(CONTENT_ROOT, world));

  describe(`module lesson counts vs shared shape (${world})`, () => {
    it(`covers all ${shape.modules} modules`, () => {
      expect(moduleDirs.length).toBe(shape.modules);
    });

    it("every module's real MDX count matches getModuleLessonCount(world, module)", () => {
      // Also catches an UNDECLARED deviation: a module holding 4 lessons with no
      // override in WORLD_SHAPE reads expected=5, actual=4 → mismatch.
      const mismatches = moduleDirs
        .map((dir) => ({
          module: basename(dir),
          actual: countLessons(dir),
          expected: getModuleLessonCount(world, basename(dir)),
        }))
        .filter((m) => m.actual !== m.expected);
      expect(mismatches).toEqual([]);
    });

    it("the per-module counts sum to the world's total", () => {
      const total = moduleDirs.reduce((sum, dir) => sum + countLessons(dir), 0);
      expect(total).toBe(getWorldTotalLessons(world));
    });
  });
}
