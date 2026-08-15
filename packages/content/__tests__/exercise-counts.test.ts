import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";
import { EXERCISE_CONTENT } from "@tensorcraft/shared";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";

/**
 * Marketing exercise-count gate (audit run #7, 2026-07-16).
 *
 * /about quoted "80 exercises live today" and "315 authored across the
 * five-world roadmap" while the corpus held 84 and 298: the copy was pasted
 * once and never updated as exercises shipped. The page now renders
 * EXERCISE_CONTENT from @tensorcraft/shared, and this gate pins those
 * constants to the actual YAML corpus, so adding or removing an exercise
 * without updating the constant is a red test, not a silently stale claim.
 */

const CONTENT_ROOT = dirname(CONTENT_DIR);
// Scope tracks the build via one shared constant (F3).
const SHIPPED_DIRS = [...BUILT_WORLD_DIRS];
const FIVE_WORLD_DIRS = [
  "deep-orbit",
  "neon-protocol",
  "nova-canvas",
  "signal-ward",
  "terra-grid",
];

function countExerciseYamls(worldDir: string): number {
  const root = join(CONTENT_ROOT, worldDir);
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
  it("liveExercises equals the shipped (built world dirs) YAML count", () => {
    const live = SHIPPED_DIRS.reduce((n, d) => n + countExerciseYamls(d), 0);
    expect(
      EXERCISE_CONTENT.liveExercises,
      `constants say ${EXERCISE_CONTENT.liveExercises} live exercises, the ` +
        `corpus ships ${live}. Update EXERCISE_CONTENT in ` +
        `packages/shared/src/constants.ts - /about renders this number.`,
    ).toBe(live);
  });

  it("authoredFiveWorlds equals the five world dirs' YAML count", () => {
    const authored = FIVE_WORLD_DIRS.reduce(
      (n, d) => n + countExerciseYamls(d),
      0,
    );
    expect(
      EXERCISE_CONTENT.authoredFiveWorlds,
      `constants say ${EXERCISE_CONTENT.authoredFiveWorlds} authored, the ` +
        `corpus holds ${authored}.`,
    ).toBe(authored);
  });

  it("the /about copy renders the constants, not literals", () => {
    const about = readFileSync(
      join(CONTENT_ROOT, "../../../apps/web/app/about/page.tsx"),
      "utf8",
    );
    expect(about).toContain("EXERCISE_CONTENT.liveExercises");
    expect(about).toContain("EXERCISE_CONTENT.authoredFiveWorlds");
  });
});
