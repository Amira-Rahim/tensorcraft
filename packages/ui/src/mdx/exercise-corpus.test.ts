// @vitest-environment node
import { afterAll, describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// Node worker path: same buildFullCode + HARNESS + real TFJS as the browser
// worker; only the worker transport differs IN CODE. Since 2026-09-20 the
// browser worker pins the cpu backend too (pinCpuBackend in WORKER_BODY), so
// in the normal case a learner's float arithmetic is the arithmetic this
// file runs. The pin is guarded, though: when setBackend('cpu') is refused,
// tfjs falls back to its own choice, and in a browser Worker
// `WorkerGlobalScope` is defined, so isBrowser() is true and that choice is
// WEBGL. Here, and in the CI vm harness, only the cpu backend is registered,
// so that fallback path is one this file cannot reproduce (blind verifier,
// 2026-09-12). Both harnesses agree with each other on all 65 exercises
// (measured: 0 pass/fail and 0 test-name disagreements). Graders that train
// a model therefore still assert integers and offsets (optimizer.iterations,
// halt minus best epoch) or use tolerances at least an order of magnitude
// wider than measured cpu error (the RNN agreement gate is 5e-6 against a
// measured worst case of 1.1e-7). A numeric assertion tighter than that is a
// webgl flake waiting to happen on the fallback path, and this test will not
// catch it.
import { parseAndRunTests } from "./exercise-runner-node";
import { validateArtifacts } from "./exercise-artifacts.mjs";

/**
 * Semantic corpus check through the SHIPPED runtime path (buildFullCode →
 * worker → real TFJS): every exercise's solution must pass its own tests,
 * no starter may pass a whole suite, and every Deep Orbit solution must
 * return inspectable output. This is the same grading path learners hit
 * in the browser, including the bounded artifact transport.
 *
 * Heavy (spawns a worker per exercise), so it is gated behind
 * EXERCISE_CORPUS=1. Run manually or in a scheduled CI job:
 *   EXERCISE_CORPUS=1 pnpm vitest run packages/ui/src/mdx/exercise-corpus.test.ts
 */
const here = dirname(fileURLToPath(import.meta.url));
const exercises: Array<{
  slug: string;
  lessonSlug: string;
  starterCode?: string;
  solutionCode?: string;
  testCode?: string;
}> = JSON.parse(
  readFileSync(
    resolve(here, "../../../content/.velite/exercises.json"),
    "utf8",
  ),
);
const lessons: Array<{ slug: string; worldId: string }> = JSON.parse(
  readFileSync(resolve(here, "../../../content/.velite/lessons.json"), "utf8"),
);
const deepOrbitLessons = new Set(
  lessons
    .filter((lesson) => lesson.worldId === "deep-orbit")
    .map((lesson) => lesson.slug),
);

describe.runIf(process.env.EXERCISE_CORPUS === "1")(
  "exercise corpus through the shipped runtime",
  () => {
    const outputEvidence: Array<{
      slug: string;
      tests: number;
      artifacts: number;
      kinds: string[];
    }> = [];
    afterAll(() => {
      console.info(
        "DEEP_ORBIT_OUTPUT_CORPUS",
        JSON.stringify({
          completed: outputEvidence.length,
          expected: exercises.filter((ex) =>
            deepOrbitLessons.has(ex.lessonSlug),
          ).length,
          tests: outputEvidence.reduce((sum, row) => sum + row.tests, 0),
          artifacts: outputEvidence.reduce(
            (sum, row) => sum + row.artifacts,
            0,
          ),
          exercises: outputEvidence,
        }),
      );
    });
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
          expect(sol.errored).not.toBe(true);
          expect(failed.map((f) => `${f.name}: ${f.error}`)).toEqual([]);
          expect(sol.results.length).toBeGreaterThan(0);

          if (deepOrbitLessons.has(ex.lessonSlug)) {
            // A passing badge is not the lesson's result. Check the output
            // after serialization through the real worker and host. The
            // shared schema rejects NaN/Infinity, unaligned series, tensors,
            // oversized strings/tables, and malformed cells.
            expect(sol.artifacts?.length).toBeGreaterThan(0);
            const artifacts = validateArtifacts(sol.artifacts);
            expect(artifacts).toEqual(sol.artifacts);
            for (const artifact of artifacts) {
              expect(artifact.title.trim().length).toBeGreaterThan(0);
              if (artifact.kind === "text") {
                expect(artifact.text.trim().length).toBeGreaterThan(0);
              }
            }
            outputEvidence.push({
              slug: ex.slug,
              tests: sol.results.length,
              artifacts: artifacts.length,
              kinds: artifacts.map((artifact) => artifact.kind),
            });
          }

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
