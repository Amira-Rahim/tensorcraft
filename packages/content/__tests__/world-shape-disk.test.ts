import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { WORLD_SHAPE, WORLD_SLUGS, LAUNCHED_WORLDS } from "@tensorcraft/shared";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import {
  CONTENT_ROOT,
  lessonFiles,
} from "../../../scripts/audit-structure-variety.mjs";

/**
 * WORLD_SHAPE vs disk, for EVERY world dir - built or not (fresh-eyes rerun
 * §6: module-counts.test.ts iterates built worlds only, so the four unbuilt
 * WORLD_SHAPE rows were pinned by nothing and neon-protocol's 55-vs-54
 * survived three audits as "stale"). This gate reads raw .mdx counts off
 * disk, so it needs no Velite build and covers the unbuilt corpus too.
 */
describe("WORLD_SHAPE matches the corpus on disk (all worlds)", () => {
  for (const slug of WORLD_SLUGS) {
    it(`${slug}: totalLessons equals the on-disk .mdx count`, () => {
      const onDisk = lessonFiles(join(CONTENT_ROOT, slug)).length;
      expect(onDisk).toBe(WORLD_SHAPE[slug].totalLessons);
    });
  }
});

/**
 * LAUNCHED ⊆ BUILT - asserted nowhere until now (fresh-eyes rerun §6
 * "unguarded entirely"). Launching a world whose content Velite never
 * compiles would 404 every lesson of a PAID product; this is the one-line
 * tripwire.
 */
describe("launch/build coherence", () => {
  it("every launched world is a built world dir", () => {
    for (const slug of LAUNCHED_WORLDS) {
      expect(
        (BUILT_WORLD_DIRS as readonly string[]).includes(slug),
        `LAUNCHED_WORLDS contains "${slug}" but BUILT_WORLD_DIRS does not - its lessons would 404`,
      ).toBe(true);
    }
  });
});
