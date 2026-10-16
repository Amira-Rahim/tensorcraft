// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { parseAndRunTests } from "./exercise-runner-node";
import { SHAPE_RECORDING_SOURCE } from "./exercise-shape-recording.mjs";

const contentRequire = createRequire(
  new URL("../../../content/package.json", import.meta.url),
);
const veliteRequire = createRequire(contentRequire.resolve("velite"));
const { parse } = veliteRequire("yaml");
const exercise = parse(
  readFileSync(
    new URL(
      "../../../content/content/deep-orbit/foundations/exercises/reshape-tensor.yaml",
      import.meta.url,
    ),
    "utf8",
  ),
) as { solutionCode: string; starterCode: string; testCode: string };

async function run(code: string) {
  const result = await parseAndRunTests(code, exercise.testCode, 20_000);
  expect(result.errored, JSON.stringify(result)).not.toBe(true);
  expect(result.results.length).toBe(9);
  return result.results;
}

describe("sensor layout through the shipped worker", () => {
  it("accepts the solution and rejects the untouched starter", async () => {
    expect((await run(exercise.solutionCode)).filter((r) => !r.passed)).toEqual(
      [],
    );
    expect((await run(exercise.starterCode)).every((r) => r.passed)).toBe(
      false,
    );
  });

  it("accepts functional operations and a disposed original tensor", async () => {
    const code = exercise.solutionCode
      .replace("flat.reshape([3, 4])", "tf.reshape(flat, [3, 4])")
      .replace("grid.transpose()", "tf.transpose(grid)")
      .replace("const step1", "flat.dispose();\nconst step1");
    expect((await run(code)).filter((r) => !r.passed)).toEqual([]);
  });

  it("rejects reshape with the requested shape but mixed sensor rows", async () => {
    const results = await run(
      exercise.solutionCode.replace("grid.transpose()", "grid.reshape([4, 3])"),
    );
    expect(
      results.find((r) => r.name.endsWith("bySensor has shape [4, 3]"))?.passed,
    ).toBe(true);
    for (const name of [
      "bySensor comes from transposing grid",
      "every sensor row keeps its readings in time order",
    ])
      expect(results.find((r) => r.name.endsWith(name))?.passed).toBe(false);
  });

  it("rejects a copied grid even when its numbers and shape are correct", async () => {
    const results = await run(
      exercise.solutionCode.replace(
        "flat.reshape([3, 4])",
        "tf.tensor1d(flat.arraySync()).reshape([3, 4])",
      ),
    );
    expect(
      results.find((r) => r.name.endsWith("grid comes from reshaping flat"))
        ?.passed,
    ).toBe(false);
    expect(results.filter((r) => !r.passed)).toHaveLength(1);
  });

  it("rejects a typed-out answer even after a dummy transpose", async () => {
    const code = readFileSync(
      new URL(
        "../../../../scripts/exercise-cheats/reshape-tensor.3.js",
        import.meta.url,
      ),
      "utf8",
    );
    const results = await run(code);
    expect(
      results.find((r) =>
        r.name.endsWith("bySensor comes from transposing grid"),
      )?.passed,
    ).toBe(false);
    expect(results.filter((r) => !r.passed)).toHaveLength(1);
  });

  it("rejects a tensor-shaped object with a correct arraySync result", async () => {
    const code = exercise.solutionCode.replace(
      "grid.transpose()",
      "({ shape: [4, 3], arraySync: () => [[3, 5, 5], [1, 9, 3], [4, 2, 5], [1, 6, 8]] })",
    );
    const results = await run(code);
    expect(results.filter((r) => !r.passed)).toHaveLength(3);
    expect(
      results
        .filter((r) => !r.passed)
        .every((r) => r.error?.includes("must be a TensorFlow.js tensor")),
    ).toBe(true);
  });

  it("checks every sensor value against the recording", async () => {
    const code = exercise.solutionCode.replace(
      "3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8",
      "3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 99",
    );
    const results = await run(code);
    expect(
      results.find((r) =>
        r.name.endsWith("the last row keeps the final readings in order"),
      )?.passed,
    ).toBe(false);
    expect(
      results.find((r) =>
        r.name.endsWith("every sensor row keeps its readings in time order"),
      )?.passed,
    ).toBe(false);
  });
});

it("shape evidence is immutable, local, and survives source disposal without reading its buffer", async () => {
  const result = await parseAndRunTests(
    `const flat = tf.tensor1d([1, 2, 3, 4]);
     const grid = flat.reshape([2, 2]);
     const bySensor = tf.transpose(grid);
     flat.dispose();`,
    `it('records the actual operations', () => {
       const evidence = tf.__shapeOf(grid);
       expect(evidence.input === flat).toBe(true);
       expect(evidence.operation).toBe('reshape');
       try { evidence.operation = 'transpose'; } catch {}
       try { tf.__shapeOf = () => null; } catch {}
       expect(tf.__shapeOf(grid).operation).toBe('reshape');
       expect(tf.__shapeOf(bySensor).input === grid).toBe(true);
       expect(tf.__shapeOf(bySensor).operation).toBe('transpose');
     });`,
    20_000,
  );
  expect(result.results.filter((r) => !r.passed)).toEqual([]);

  // The factory is also reset within a reused runtime, as the CLI validator is.
  class Tensor {}
  const recorder = new Function(`return ${SHAPE_RECORDING_SOURCE}`)()({
    Tensor,
  });
  const input = new Tensor(),
    output = new Tensor();
  recorder.record("reshape", input, output);
  expect(recorder.read(output).input).toBe(input);
  recorder.reset();
  expect(recorder.read(output)).toBe(null);
});
