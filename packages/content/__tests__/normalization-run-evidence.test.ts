// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { parseAndRunTests } from "../../ui/src/mdx/exercise-runner-node";
import { validateArtifacts } from "../../ui/src/mdx/exercise-artifacts.mjs";

const contentRequire = createRequire(
  new URL("../package.json", import.meta.url),
);
const veliteRequire = createRequire(contentRequire.resolve("velite"));
const { parse } = veliteRequire("yaml");
const exercise: {
  starterCode: string;
  solutionCode: string;
  testCode: string;
} = parse(
  readFileSync(
    new URL(
      "../content/deep-orbit/foundations/exercises/normalize-data.yaml",
      import.meta.url,
    ),
    "utf8",
  ),
);

describe("normalization run evidence through the shipped worker", () => {
  it("captures the actual input before grading disposes the batch", async () => {
    const run = await parseAndRunTests(
      exercise.solutionCode,
      exercise.testCode,
    );
    expect(run.errored).not.toBe(true);
    expect(run.results).toHaveLength(10);
    expect(run.results.filter((check) => !check.passed)).toEqual([]);
    const artifacts = validateArtifacts(run.artifacts);
    expect(artifacts).toHaveLength(4);
    const input = artifacts.find((item) => item.title === "Input readings");
    expect(input?.kind).toBe("table");
    if (input?.kind !== "table") throw new Error("Input table missing");
    expect(input.columns).toEqual([
      "Reading",
      "Temperature",
      "Signal strength",
    ]);
    expect(input.rows.map((row) => row.slice(0, 2))).toEqual([
      [1, 20],
      [2, 22],
      [3, 24],
      [4, 26],
    ]);
    const signals = [0.2, 0.8, 0.4, 0.6];
    input.rows.forEach((row, index) =>
      expect(row[2]).toBeCloseTo(signals[index]!, 6),
    );
    expect(artifacts.map((item) => item.title)).toEqual([
      "Input readings",
      "Saved training statistics",
      "Scaled readings entering Farah's preview",
      "The same batch with min-max scaling",
    ]);
  });

  it("records edited inputs even when the fixed-fixture checks fail", async () => {
    const editedCode = exercise.solutionCode.replace("[20, 0.2]", "[30, 0.25]");
    expect(editedCode).not.toBe(exercise.solutionCode);
    const run = await parseAndRunTests(editedCode, exercise.testCode);
    expect(run.errored).not.toBe(true);
    expect(run.results.some((check) => !check.passed)).toBe(true);
    const input = run.artifacts?.find(
      (item) => item.title === "Input readings",
    );
    expect(input?.kind).toBe("table");
    if (input?.kind !== "table") throw new Error("Input table missing");
    expect(input.rows[0]).toEqual([1, 30, 0.25]);
  });

  it("keeps partial output while rejecting statistics with correct shapes and wrong values", async () => {
    const wrongCode = exercise.solutionCode.replace(
      "std: variance.sqrt()",
      "std: tf.onesLike(mean)",
    );
    expect(wrongCode).not.toBe(exercise.solutionCode);
    const run = await parseAndRunTests(wrongCode, exercise.testCode);
    expect(run.errored).not.toBe(true);
    expect(run.results.some((check) => check.passed)).toBe(true);
    expect(
      run.results.some(
        (check) =>
          !check.passed && check.name.includes("normalized columns have mean"),
      ),
    ).toBe(true);
    const statistics = run.artifacts?.find(
      (item) => item.title === "Saved training statistics",
    );
    if (statistics?.kind !== "table")
      throw new Error("Statistics table missing");
    expect(statistics.rows.map((row) => row[2])).toEqual([1, 1]);
  });

  it("continues grading if submitted code already disposed the input", async () => {
    const run = await parseAndRunTests(
      `${exercise.solutionCode}\nbatch.dispose();`,
      exercise.testCode,
    );
    expect(run.errored).not.toBe(true);
    expect(run.results).toHaveLength(10);
    expect(run.results.filter((check) => !check.passed)).toEqual([]);
    expect(run.artifacts?.some((item) => item.title === "Input readings")).toBe(
      false,
    );
  });
});
