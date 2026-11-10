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
      "../content/deep-orbit/training-loop/exercises/backprop-chain.yaml",
      import.meta.url,
    ),
    "utf8",
  ),
);

describe("backpropagation's numerical variable restoration", () => {
  it("accepts the canonical implementation and keeps both captured comparisons", async () => {
    const run = await parseAndRunTests(
      exercise.solutionCode,
      exercise.testCode,
    );
    expect(run.errored).not.toBe(true);
    expect(run.results).toHaveLength(8);
    expect(run.results.filter((check) => !check.passed)).toEqual([]);
    const artifacts = validateArtifacts(run.artifacts);
    expect(artifacts.map((artifact) => artifact.title)).toEqual([
      "Your two gradient methods",
      "Forward calculations needed for those gradients",
    ]);
  });

  it("rejects restoring global w for another variable while retaining actual gradient tables", async () => {
    const wrongTarget = exercise.solutionCode.replace(
      "variable.assign(tf.scalar(saved));",
      "w.assign(tf.scalar(saved));",
    );
    expect(wrongTarget).not.toBe(exercise.solutionCode);
    const run = await parseAndRunTests(wrongTarget, exercise.testCode);
    expect(run.errored).not.toBe(true);
    expect(run.results).toHaveLength(8);
    const failed = run.results.filter((check) => !check.passed);
    expect(failed.map((check) => check.name)).toEqual([
      "Backprop > the estimate agrees with the recorded pass and costs a forward pass per variable",
      "Backprop > restores a nudged variable when the second loss calculation fails",
    ]);
    expect(failed[0]!.error).toContain("leave every other variable unchanged");
    expect(failed[1]!.error).toContain(
      "Restoring global w does not restore this separate variable",
    );
    const artifacts = validateArtifacts(run.artifacts);
    expect(artifacts).toHaveLength(2);
    const gradients = artifacts[0]!;
    const counts = artifacts[1]!;
    if (gradients.kind !== "table" || counts.kind !== "table")
      throw Error("Missing actual comparison tables");
    expect(gradients.title).toBe("Your two gradient methods");
    expect(gradients.columns).toEqual([
      "Variable",
      "Automatic gradient",
      "Numerical estimate",
    ]);
    expect(gradients.rows).toHaveLength(3);
    expect(gradients.rows[2]![1]).toBe(1.5);
    // The incorrect restoration leaves variable a nudged, affecting c's estimate.
    expect(gradients.rows[2]![2]).toBeGreaterThan(1.5005);
    expect(counts.title).toBe(
      "Forward calculations needed for those gradients",
    );
    expect(counts.columns).toEqual(["Method", "Forward calculations"]);
    expect(counts.rows).toEqual([
      ["Automatic differentiation", 1],
      ["Numerical estimates", 6],
    ]);
  });
});
