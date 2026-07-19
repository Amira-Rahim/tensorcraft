import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { EXERCISE_CONTENT } from "@tensorcraft/shared";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";

/**
 * Marketing exercise-count gate (audit run #7, 2026-07-16).
 *
 * /about quoted "80 exercises live today" and "315 authored across the
 * five-theme roadmap" while the corpus held 84 and 298: the copy was pasted
 * once and never updated as exercises shipped. The page now renders
 * EXERCISE_CONTENT from @tensorcraft/shared, and this gate pins those
 * constants to the actual YAML corpus, so adding or removing an exercise
 * without updating the constant is a red test, not a silently stale claim.
 */

const CONTENT_ROOT = dirname(CONTENT_DIR);
const SHIPPED_DIRS = ["deep-orbit", "extras"];
const FIVE_THEME_DIRS = [
  "deep-orbit",
  "neon-protocol",
  "nova-canvas",
  "signal-ward",
  "terra-grid",
];

function countExerciseYamls(themeDir: string): number {
  const root = join(CONTENT_ROOT, themeDir);
  if (!existsSync(root)) return 0;
  let count = 0;
  for (const mod of readdirSync(root)) {
    const exDir = join(root, mod, "exercises");
    if (!existsSync(exDir)) continue;
    count += readdirSync(exDir).filter((f) => f.endsWith(".yaml")).length;
  }
  return count;
}

describe("EXERCISE_CONTENT matches the real corpus", () => {
  it("liveExercises equals the shipped (deep-orbit + extras) YAML count", () => {
    const live = SHIPPED_DIRS.reduce((n, d) => n + countExerciseYamls(d), 0);
    expect(
      EXERCISE_CONTENT.liveExercises,
      `constants say ${EXERCISE_CONTENT.liveExercises} live exercises, the ` +
        `corpus ships ${live}. Update EXERCISE_CONTENT in ` +
        `packages/shared/src/constants.ts - /about renders this number.`,
    ).toBe(live);
  });

  it("authoredFiveThemes equals the five theme dirs' YAML count", () => {
    const authored = FIVE_THEME_DIRS.reduce(
      (n, d) => n + countExerciseYamls(d),
      0,
    );
    expect(
      EXERCISE_CONTENT.authoredFiveThemes,
      `constants say ${EXERCISE_CONTENT.authoredFiveThemes} authored, the ` +
        `corpus holds ${authored}.`,
    ).toBe(authored);
  });

  it("the /about copy renders the constants, not literals", () => {
    const about = readFileSync(
      join(CONTENT_ROOT, "../../../apps/web/app/about/page.tsx"),
      "utf8",
    );
    expect(about).toContain("EXERCISE_CONTENT.liveExercises");
    expect(about).toContain("EXERCISE_CONTENT.authoredFiveThemes");
  });
});
