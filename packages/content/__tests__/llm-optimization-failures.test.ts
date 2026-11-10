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
const cases = [
  {
    module: "llm-integration",
    slug: "llm-client",
    name: "coercing a numeric string into an accepted score",
    before: "!Number.isFinite(parsed.confidence)",
    after: "!Number.isFinite(Number(parsed.confidence))",
    title: "The reply your client accepted",
  },
  {
    module: "optimization-edge",
    slug: "prune-weights",
    name: "returning the last pruned weights to the caller",
    before: "try { model.setWeights(original); }",
    after: "try { /* Deliberately omit restoration. */ }",
    title: "Which classes your pruning pass affects",
  },
  {
    module: "optimization-edge",
    slug: "gpu-backend",
    name: "swallowing readiness failure after selection",
    before: "await runtime.ready();",
    after: "await runtime.ready().catch(() => {});",
    title: "How your selector reached a working backend",
  },
];

describe("useful captured results after nearby contract failures", () => {
  it.each(cases)(
    "rejects $name and retains the earlier actual output",
    { timeout: 30_000 },
    async (item) => {
      const exercise = parse(
        readFileSync(
          new URL(
            `../content/deep-orbit/${item.module}/exercises/${item.slug}.yaml`,
            import.meta.url,
          ),
          "utf8",
        ),
      ) as { solutionCode: string; testCode: string };
      expect(exercise.solutionCode).toContain(item.before);
      const wrong = exercise.solutionCode.replaceAll(item.before, item.after);
      const result = await parseAndRunTests(wrong, exercise.testCode, 20_000);
      expect(result.errored).not.toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.some((check) => !check.passed)).toBe(true);
      expect(result.results.some((check) => check.passed)).toBe(true);
      const artifacts = validateArtifacts(result.artifacts);
      expect(artifacts.map((artifact) => artifact.title)).toContain(item.title);
      if (item.slug === "llm-client") {
        const accepted = artifacts.find(
          (artifact) => artifact.title === item.title,
        )!;
        if (accepted.kind !== "table")
          throw Error("Missing accepted fields table");
        expect(accepted.rows).toEqual([
          ["Classification", "anomaly"],
          ["Model score", 0.95],
          ["Reasoning", "High amplitude"],
        ]);
      }
    },
  );
});
