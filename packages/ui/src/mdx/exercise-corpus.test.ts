// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// Node worker path: same buildFullCode + HARNESS + real TFJS as the browser
// worker; only the worker transport differs IN CODE. The RUNTIME differs in
// one way this file cannot close (blind verifier, 2026-09-12): tfjs picks its
// backend from the environment, and in a browser Worker `WorkerGlobalScope`
// is defined, so isBrowser() is true and the learner runs on WEBGL. Here, and
// in the CI vm harness, only the cpu backend is registered. Both harnesses
// agree with each other on all 65 exercises (measured: 0 pass/fail and 0
// test-name disagreements), but neither reproduces the learner's float
// arithmetic. Graders that train a model therefore assert integers and
// offsets (optimizer.iterations, halt minus best epoch) or use tolerances at
// least an order of magnitude wider than measured cpu error (the RNN
// agreement gate is 5e-6 against a measured worst case of 1.1e-7). A numeric
// assertion tighter than that is a webgl flake waiting to happen, and this
// test will not catch it.
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
