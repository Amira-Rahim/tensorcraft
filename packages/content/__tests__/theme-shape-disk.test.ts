import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { THEME_SHAPE, THEME_SLUGS, LAUNCHED_THEMES } from "@tensorcraft/shared";
import { BUILT_THEME_DIRS } from "../src/built-themes";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import {
  CONTENT_ROOT,
  lessonFiles,
} from "../../../scripts/audit-structure-variety.mjs";

/**
 * THEME_SHAPE vs disk, for EVERY theme dir — built or not (fresh-eyes rerun
 * §6: module-counts.test.ts iterates built themes only, so the four unbuilt
 * THEME_SHAPE rows were pinned by nothing and neon-protocol's 55-vs-54
 * survived three audits as "stale"). This gate reads raw .mdx counts off
 * disk, so it needs no Velite build and covers the unbuilt corpus too.
 */
describe("THEME_SHAPE matches the corpus on disk (all themes)", () => {
  for (const slug of THEME_SLUGS) {
    it(`${slug}: totalLessons equals the on-disk .mdx count`, () => {
      const onDisk = lessonFiles(join(CONTENT_ROOT, slug)).length;
      expect(onDisk).toBe(THEME_SHAPE[slug].totalLessons);
    });
  }
});

/**
 * LAUNCHED ⊆ BUILT — asserted nowhere until now (fresh-eyes rerun §6
 * "unguarded entirely"). Launching a theme whose content Velite never
 * compiles would 404 every lesson of a PAID product; this is the one-line
 * tripwire.
 */
describe("launch/build coherence", () => {
  it("every launched theme is a built theme dir", () => {
    for (const slug of LAUNCHED_THEMES) {
      expect(
        (BUILT_THEME_DIRS as readonly string[]).includes(slug),
        `LAUNCHED_THEMES contains "${slug}" but BUILT_THEME_DIRS does not — its lessons would 404`,
      ).toBe(true);
    }
  });
});
