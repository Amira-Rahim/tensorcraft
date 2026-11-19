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
const exercise = parse(
  readFileSync(
    new URL(
      "../content/deep-orbit/browser-runtimes/exercises/onnx-comparison.yaml",
      import.meta.url,
    ),
    "utf8",
  ),
) as { solutionCode: string; testCode: string };
const firstCheck =
  "compareRuntimes > runs one signal through both runtimes and finds that they agree";
function replaceOnce(code: string, before: string, after: string) {
  expect(code.split(before)).toHaveLength(2);
  return code.replace(before, after);
}
const misconceptions = [
  [
    "stopping TFJS timing before readback completes",
    (code: string) =>
      replaceOnce(
        code,
        "tfjsValue = (await prediction.data())[0];\n    tfjsMs = performance.now() - start;",
        "tfjsMs = performance.now() - start;\n    tfjsValue = (await prediction.data())[0];",
      ),
  ],
  [
    "including ONNX session loading in its inference interval",
    (code: string) =>
      replaceOnce(
        replaceOnce(
          code,
          "const session = await ort.InferenceSession.create(modelPath, { executionProviders: ['wasm'] });",
          "const loadingStart = performance.now();\n  const session = await ort.InferenceSession.create(modelPath, { executionProviders: ['wasm'] });",
        ),
        "const onnxMs = performance.now() - start;",
        "const onnxMs = performance.now() - loadingStart;",
      ),
  ],
  [
    "retaining both TFJS temporary tensors",
    (code: string) =>
      replaceOnce(
        code,
        "prediction?.dispose();\n    input.dispose();",
        "// Deliberately retain both temporary tensors.",
      ),
  ],
] as const;

describe("ONNX comparison timing and temporary ownership", () => {
  it.each(misconceptions)(
    "rejects %s and keeps the actual comparison tables",
    { timeout: 30_000 },
    async (_name, mutate) => {
      const result = await parseAndRunTests(
        mutate(exercise.solutionCode),
        exercise.testCode,
        20_000,
      );
      expect(result.errored).not.toBe(true);
      expect(result.results).toHaveLength(2);
      expect(
        result.results
          .filter((check) => !check.passed)
          .map((check) => check.name),
      ).toEqual([firstCheck]);
      const artifacts = validateArtifacts(result.artifacts);
      expect(artifacts.map((artifact) => artifact.title)).toEqual([
        "Inputs and outputs from your runtime comparison",
        "Your runtime comparison",
      ]);
      const observed = artifacts[0]!;
      const returned = artifacts[1]!;
      if (observed.kind !== "table" || returned.kind !== "table")
        throw Error("Missing captured comparison tables");
      expect(observed.rows.map((row) => row[0])).toEqual(["TFJS", "ONNX"]);
      expect(observed.rows[0]!.slice(1, 4)).toEqual(
        observed.rows[1]!.slice(1, 4),
      );
      expect(
        observed.rows.every(
          (row) => typeof row[4] === "number" && Number.isFinite(row[4]),
        ),
      ).toBe(true);
      expect(returned.rows[0]![0]).toBe(true);
    },
  );

  it(
    "accepts an awaited array readback while preserving two checks and both captures",
    { timeout: 30_000 },
    async () => {
      const alternative = replaceOnce(
        exercise.solutionCode,
        "tfjsValue = (await prediction.data())[0];",
        "tfjsValue = (await prediction.array())[0][0];",
      );
      const result = await parseAndRunTests(
        alternative,
        exercise.testCode,
        20_000,
      );
      expect(result.errored).not.toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results.filter((check) => !check.passed)).toEqual([]);
      expect(validateArtifacts(result.artifacts)).toHaveLength(2);
    },
  );
});
