/**
 * The world directories that are BUILT (compiled by Velite) and therefore
 * covered by the content QA gates.
 *
 * Single source of truth. Before this, the build glob lived in
 * velite.config.ts AND every gate re-declared its own
 * `["deep-orbit", "extras"]` literal (exercise-counts, epoch-traces,
 * metadata-consistency, end-of-lesson). The consequence, per the scalability
 * audit F3: when a second world launches, the automated consistency net that
 * keeps 5C variety, metadata truth and numeric canon coherent would NOT cover
 * it — it saw only the 77 shipped lessons out of ~275 authored.
 *
 * Now there is one list. Adding a dir here (and to LAUNCHED_WORLDS in
 * @tensorcraft/shared) is the MECHANICAL half of launching a world: Velite
 * compiles it and every gate extends to it with no per-test edits.
 *
 * It is NOT the whole cost, and an earlier version of this comment claimed
 * it was ("one line, no per-test edits"), which mispriced the roadmap
 * (fresh-eyes rerun 2026-07-25 §8). What the one line actually does is turn
 * the QA gates LOOSE on a corpus that has never passed them: measured at
 * HEAD, every unbuilt lesson needs step-5 close conversion, every hint
 * ladder fails Gate B's excerpt convention, and none of the 219 lessons has
 * had a fact-check pass (Deep Orbit needed four adversarial rounds). Budget
 * 12-20 focused weeks per world; the full measured punch list lives in
 * docs/world-launch-checklist.md — read it before flipping any world on.
 *
 * `extras` is cross-world companion content, always built alongside the
 * launched story worlds.
 */
export const BUILT_WORLD_DIRS = ["deep-orbit", "extras"] as const;

export type BuiltWorldDir = (typeof BUILT_WORLD_DIRS)[number];

/** Velite glob form, e.g. `{deep-orbit,extras}`. Derived so it cannot drift. */
export const BUILT_WORLD_GLOB = `{${BUILT_WORLD_DIRS.join(",")}}`;

/** The launched STORY worlds among the built dirs (excludes `extras`). */
export const BUILT_STORY_WORLDS = BUILT_WORLD_DIRS.filter(
  (d) => d !== "extras",
);

/**
 * Lessons in the cross-world `extras` dir (classical-ml, math-deep-dive,
 * ethics-responsibility, python-bridge). Not a WorldSlug, so it has no
 * WORLD_SHAPE row; named here so gates summing built lessons across worlds
 * (e.g. end-of-lesson) can add it without hardcoding a corpus total. Pinned to
 * the filesystem by the same gates that count.
 */
// 21 -> 23 (2026-07-27): math-deep-dive gained statistics-of-signals and
// eigenvectors-svd-compression (viral-roadmap gap audit).
export const EXTRAS_LESSON_COUNT = 23;
