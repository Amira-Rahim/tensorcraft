// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { parseAndRunTests } from "../../ui/src/mdx/exercise-runner-node";
import { validateArtifacts } from "../../ui/src/mdx/exercise-artifacts.mjs";

const contentRequire = createRequire(
  new URL("../package.json", import.meta.url),
);
const { parse } = createRequire(contentRequire.resolve("velite"))("yaml");
const exercise: { solutionCode: string; testCode: string } = parse(
  readFileSync(
    new URL(
      "../content/deep-orbit/training-loop/exercises/deep-scan-eval.yaml",
      import.meta.url,
    ),
    "utf8",
  ),
);

describe("the evaluation diagnosis gap boundary", () => {
  it(
    "rejects an inclusive gap rule while preserving all four measured tables",
    { timeout: 30_000 },
    async () => {
      const wrong = exercise.solutionCode.replace(
        "trainAcc - testAcc > 0.15",
        "trainAcc - testAcc >= 0.15",
      );
      expect(wrong).not.toBe(exercise.solutionCode);
      const result = await parseAndRunTests(wrong, exercise.testCode, 20_000);
      expect(result.errored).not.toBe(true);
      expect(result.results).toHaveLength(10);
      expect(result.results.filter((check) => !check.passed)).toEqual([
        expect.objectContaining({
          name: "Train DEEP SCAN, Then Read the Gap > diagnose reports a large gap above the stated boundary",
          error: expect.stringContaining(
            "A gap equal to 0.15 is not above the boundary",
          ),
        }),
      ]);
      const artifacts = validateArtifacts(result.artifacts);
      expect(artifacts.map((artifact) => artifact.title)).toEqual([
        "The scores from your evaluation run",
        "Evaluation run context",
        "Captured evaluation cases 0-39",
        "Captured evaluation cases 40-42",
      ]);
      if (artifacts.some((artifact) => artifact.kind !== "table"))
        throw Error("Missing captured evaluation tables");
      expect(
        artifacts.map((artifact) =>
          artifact.kind === "table" ? artifact.rows.length : 0,
        ),
      ).toEqual([2, 38, 40, 3]);
    },
  );
});
