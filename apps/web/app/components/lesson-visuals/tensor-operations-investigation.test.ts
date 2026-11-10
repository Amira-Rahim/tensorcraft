import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseAndRunTests } from "../../../../../packages/ui/src/mdx/exercise-runner-node";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { WORKED_PACKET } from "../mdx/channel-layout-data";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import {
  clampInvestigationValues,
  initialInvestigationValues,
} from "./investigation-types";

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

const spec = NUMERIC_INVESTIGATIONS["tensor-operations"]!;

function run(values: Record<string, number>, caseId: string) {
  return spec.evaluate(
    clampInvestigationValues(spec, {
      ...initialInvestigationValues(spec, caseId),
      ...values,
    }),
    caseId,
  );
}

describe("recording-based tensor operations", () => {
  it("keeps exact sensor selections and traces both contributions into a bank", () => {
    const recording = WORKED_PACKET.map((moment) => moment.slice(0, 2));
    const result = run({ stage: 1, gain: 2, row: 1, column: 2 }, "standard");
    expect(result.graphics[0]!.values).toEqual(recording.slice(0, 2).flat());
    expect(result.graphics[1]!.values).toEqual(recording.slice(1, 3).flat());
    expect(result.graphics[0]!.highlight).toEqual([2, 3]);
    expect(result.graphics[1]!.highlight).toEqual([2, 3]);
    expect(result.graphics[4]!.highlight).toEqual([4, 5]);
    expect(result.graphics[5]!.highlight).toEqual([2, 5]);
    expect(result.graphics[6]!.values).toEqual([7, 34]);
    expect(result.graphics[7]!.highlight).toEqual([5]);
    expect(result.answer).toBe(41);
    expect(
      result.graphics[6]!.values.reduce<number>(
        (total, value) => total + Number(value),
        0,
      ),
    ).toBe(result.answer);

    const reference = run({ stage: 0, gain: 1, row: 1, column: 1 }, "changed");
    expect(reference.graphics[1]!.values).toEqual(recording[0]);
    expect(reference.graphics[1]!.highlight).toEqual([1]);
    expect(reference.graphics[2]!.values).toEqual([2, 20, 2.5, 19]);
    expect(reference.answer).toBe(19);
  });

  it("matches real TensorFlow.js for both pairings, every output, and every gain", () => {
    const before = tf.memory().numTensors;
    for (const caseId of ["standard", "changed"]) {
      for (let gain = 0; gain <= 3; gain += 0.25) {
        const actual = tf.tidy(() => {
          const left = tf.tensor2d(
            WORKED_PACKET.slice(0, 2).map((moment) => moment.slice(0, 2)),
          );
          const right =
            caseId === "changed"
              ? tf.tensor1d(WORKED_PACKET[0]!.slice(0, 2))
              : tf.tensor2d(
                  WORKED_PACKET.slice(1, 3).map((moment) => moment.slice(0, 2)),
                );
          const merged = left.add(right).div(2) as tf.Tensor2D;
          const boosted = merged.mul(gain) as tf.Tensor2D;
          const weights = tf.tensor2d([
            [1, 0],
            [0, 1],
            [1, 1],
          ]);
          const mixed = boosted.matMul(weights.transpose()) as tf.Tensor2D;
          return {
            merged: merged.arraySync(),
            boosted: boosted.arraySync(),
            mixed: mixed.arraySync(),
          };
        });
        for (const stage of [0, 1]) {
          for (const row of [0, 1]) {
            for (let column = 0; column < (stage === 0 ? 2 : 3); column++) {
              const result = run({ stage, gain, row, column }, caseId);
              expect(result.graphics[2]!.values).toEqual(actual.merged.flat());
              expect(result.graphics[3]!.values).toEqual(actual.boosted.flat());
              expect(result.answer).toBe(
                (stage === 0 ? actual.boosted : actual.mixed)[row]![column],
              );
              const capture = `const captured = { merged: merged.arraySync(), boosted: boosted.arraySync(), mixed: ${stage === 1 ? "mixed.arraySync()" : "null"} };\ntf.dispose(`;
              const generated = new Function(
                "tf",
                `${result.code!.replace("tf.dispose(", capture)}\nreturn captured;`,
              )(tf);
              expect(generated.merged).toEqual(actual.merged);
              expect(generated.boosted).toEqual(actual.boosted);
              expect(generated.mixed).toEqual(
                stage === 1 ? actual.mixed : null,
              );
            }
          }
        }
      }
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("clamps the selected bank to a sensor when switching to element-wise output", () => {
    expect(
      clampInvestigationValues(spec, { stage: 0, gain: 2, row: 1, column: 2 }),
    ).toEqual({ stage: 0, gain: 2, row: 1, column: 1 });
    expect(
      run({ stage: 0, gain: 2, row: 1, column: 2 }, "standard").answer,
    ).toBe(34);
  });
});

describe("the authored channel-mix contract", () => {
  it("rejects the reversed matrix product even when the first output has the right shape", async () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "packages/content/content/deep-orbit/foundations/exercises/add-tensors.yaml",
      ),
      "utf8",
    );
    const block = (field: string, next: string) =>
      source
        .split(`${field}: |\n`)[1]!
        .split(`\n${next}:`)[0]!
        .replace(/^ {2}/gm, "");
    const solution = block("solutionCode", "testCode");
    const tests = block("testCode", "estimatedMinutes");
    const reversed = solution.replace(
      "block.matMul(mix.transpose())",
      "mix.matMul(block.transpose())",
    );
    expect(reversed).not.toBe(solution);
    const result = await parseAndRunTests(reversed, tests);
    expect(result.errored).not.toBe(true);
    expect(result.results.filter((test) => test.passed)).toHaveLength(4);
    expect(result.results.filter((test) => !test.passed)).toHaveLength(2);
    expect(
      result.results.find((test) => test.name.includes("scores every reading"))
        ?.error,
    ).toContain("The shape is [3, 3] either way");
  });
});
