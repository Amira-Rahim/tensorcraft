// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// Node worker path: same buildFullCode + HARNESS + real TFJS as the browser
// worker; only the worker transport differs.
import { parseAndRunTests } from "./exercise-runner-node";

/**
 * Semantic corpus check through the SHIPPED runtime path (buildFullCode →
 * worker → real TFJS): every exercise's solution must pass its own tests,
 * and no starter may pass a whole suite. This is the same invariant the CI
 * grader enforces, but through the exact code learners hit in the browser.
 *
 * Heavy (spawns a worker per exercise), so it is gated behind
 * EXERCISE_CORPUS=1. Run manually or in a scheduled CI job:
 *   EXERCISE_CORPUS=1 pnpm vitest run packages/ui/src/mdx/exercise-corpus.test.ts
 */
const here = dirname(fileURLToPath(import.meta.url));
const exercises: Array<{
  slug: string;
  starterCode?: string;
  solutionCode?: string;
  testCode?: string;
}> = JSON.parse(
  readFileSync(
    resolve(here, "../../../content/.velite/exercises.json"),
    "utf8",
  ),
);

describe.runIf(process.env.EXERCISE_CORPUS === "1")(
  "exercise corpus through the shipped runtime",
  () => {
    for (const ex of exercises) {
      it(
        `${ex.slug}: solution passes, starter does not`,
        { timeout: 60_000 },
        async () => {
          const sol = await parseAndRunTests(
            ex.solutionCode ?? "",
            ex.testCode ?? "",
            45_000,
          );
          const failed = sol.results.filter((r) => !r.passed);
          expect(failed.map((f) => `${f.name}: ${f.error}`)).toEqual([]);
          expect(sol.results.length).toBeGreaterThan(0);

          const starter = await parseAndRunTests(
            ex.starterCode ?? "",
            ex.testCode ?? "",
            45_000,
          );
          const starterPassedAll =
            starter.results.length > 0 &&
            starter.results.every((r) => r.passed);
          expect(starterPassedAll).toBe(false);
        },
      );
    }
  },
);
