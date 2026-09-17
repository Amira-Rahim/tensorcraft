// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { parseAndRunTests } from "../../ui/src/mdx/exercise-runner-node";

// Draft worlds are deliberately excluded from Velite's released collection.
// Parse these two changed exercises without turning their worlds on.
const contentRequire = createRequire(
  new URL("../package.json", import.meta.url),
);
const veliteRequire = createRequire(contentRequire.resolve("velite"));
const { parse } = veliteRequire("yaml");
function js(source: string) {
  return ts.transpileModule(source.replace(/^import .*$/gm, ""), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
    },
  }).outputText;
}

const cases = [
  {
    file: "neon-protocol/convolutional-neural-networks/exercises/apply-convolution.yaml",
    wrong: (solution: string) =>
      solution.replace("stride, padding)", "1, 'valid')"),
    rejectedBy: "same padding preserves size only at stride one",
  },
  {
    file: "terra-grid/federated-learning/exercises/private-training.yaml",
    wrong: (solution: string) => solution.replace("standardNormal()", "0.1"),
    rejectedBy: "adds supplied draws after clipping",
  },
];

describe("targeted draft exercise repairs through the shipped Node worker", () => {
  for (const item of cases) {
    it(item.file, { timeout: 90_000 }, async () => {
      const exercise = parse(
        readFileSync(
          new URL(`../content/${item.file}`, import.meta.url),
          "utf8",
        ),
      );
      const tests = js(exercise.testCode);
      const solution = await parseAndRunTests(
        js(exercise.solutionCode),
        tests,
        30_000,
      );
      expect(solution.errored, JSON.stringify(solution)).not.toBe(true);
      expect(solution.results.length).toBeGreaterThan(0);
      expect(solution.results.filter((r) => !r.passed)).toEqual([]);
      const starter = await parseAndRunTests(
        js(exercise.starterCode),
        tests,
        30_000,
      );
      expect(starter.results.length).toBeGreaterThan(0);
      expect(starter.results.every((r) => r.passed)).toBe(false);
      const wrongSource = item.wrong(exercise.solutionCode);
      expect(wrongSource).not.toBe(exercise.solutionCode);
      const wrong = await parseAndRunTests(js(wrongSource), tests, 30_000);
      expect(wrong.errored, JSON.stringify(wrong)).not.toBe(true);
      expect(wrong.results.some((r) => r.passed)).toBe(true);
      expect(
        wrong.results.some(
          (r) => !r.passed && r.name.includes(item.rejectedBy),
        ),
      ).toBe(true);
    });
  }
});
