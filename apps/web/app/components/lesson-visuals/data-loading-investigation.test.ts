import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { initialInvestigationValues } from "./investigation-types";

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

const spec = NUMERIC_INVESTIGATIONS["data-loading"]!;
const lesson = readFileSync(
  resolve(
    __dirname,
    "../../../../../packages/content/content/deep-orbit/foundations/04-data-loading.mdx",
  ),
  "utf8",
);
const blocks = new Map(
  [
    ...lesson.matchAll(
      /<CodeBlock[^>]*title="([^"]+)"[^>]*>\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
    ),
  ].map(([, title, code]) => [title!, code!] as const),
);

describe("the data loader's practice-source contract", () => {
  it("executes the taught on-demand probe, restarts, and batches the same 16 rows", async () => {
    const before = tf.memory().numTensors;
    const output: unknown[][] = [];
    const code = [
      "practice-reader.ts",
      "one-sample.ts",
      "first-read.ts",
      "batch-and-read.ts",
      "split-membership.ts",
    ]
      .map((title) => {
        expect(blocks.has(title), title).toBe(true);
        return blocks.get(title)!;
      })
      .join("\n");
    const execute = new Function(
      "tf",
      "console",
      `return (async () => {
        ${code}
        const secondShapes = [];
        await batches.forEachAsync(group => {
          secondShapes.push([group.xs.shape, group.ys.shape]);
        });
        return { readCount, batchShapes, trainIdx, valIdx, secondShapes };
      })();`,
    );
    const actual = (await execute(tf, {
      log: (...values: unknown[]) => output.push(values),
    })) as {
      readCount: number;
      batchShapes: number[][];
      trainIdx: number[];
      valIdx: number[];
      secondShapes: number[][][];
    };

    expect(output.slice(0, 3)).toEqual([[0], [1], [2]]);
    expect(actual.batchShapes).toEqual(Array.from({ length: 4 }, () => [4, 3]));
    expect(actual.secondShapes).toEqual(
      Array.from({ length: 4 }, () => [
        [4, 3],
        [4, 1],
      ]),
    );
    expect(actual.readCount).toBe(32);
    expect(actual.trainIdx.slice().sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, id) => id),
    );
    expect(actual.valIdx).toEqual([12, 13, 14, 15]);
    const firstPass = output.slice(3, 7) as [number[][], number[][]][];
    const seen: number[] = [];
    for (const [features, labels] of firstPass) {
      features.forEach((row, index) => {
        const id = row[1]!;
        seen.push(id);
        expect(row[0]).toBe(id * 100);
        expect(row[2]).toBeCloseTo(id / 10, 5);
        expect(labels[index]).toEqual([id % 2]);
      });
    }
    expect(seen.sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, id) => id),
    );
    expect(tf.memory().numTensors).toBe(before);
  });

  it("keeps feature order, paired labels, and fixed split membership in every illustrated batch", async () => {
    const before = tf.memory().numTensors;
    for (const example of spec.cases) {
      for (const size of [2, 4, 8]) {
        const seen: number[] = [];
        for (let batch = 0; batch < 16 / size; batch++) {
          const result = spec.evaluate(
            { ...initialInvestigationValues(spec, example.id), size, batch },
            example.id,
          );
          const calculation = new Function(
            `${result.code}\nreturn { selectedIds, features, labels, selectedSplits };`,
          )() as {
            selectedIds: number[];
            features: number[][];
            labels: number[][];
            selectedSplits: string[];
          };
          const source = tf.data
            .generator(function* () {
              for (const id of calculation.selectedIds) {
                yield {
                  xs: tf.tensor1d([id * 100, id, id / 10]),
                  ys: tf.tensor1d([id % 2]),
                };
              }
            })
            .batch(size);
          await source.forEachAsync((actual) => {
            if (
              typeof actual !== "object" ||
              actual === null ||
              !("xs" in actual) ||
              !("ys" in actual) ||
              !(actual.xs instanceof tf.Tensor) ||
              !(actual.ys instanceof tf.Tensor)
            ) {
              throw new Error(
                "The batched row must contain xs and ys tensors.",
              );
            }
            expect(actual.xs.shape).toEqual([size, 3]);
            expect(actual.ys.shape).toEqual([size, 1]);
            const values = actual.xs.arraySync() as number[][];
            values.forEach((row, index) =>
              row.forEach((value, column) => {
                expect(value).toBeCloseTo(
                  calculation.features[index]![column]!,
                  5,
                );
              }),
            );
            expect(actual.ys.arraySync()).toEqual(calculation.labels);
          });
          expect(result.graphics[1]!.values).toEqual(
            calculation.features.flat(),
          );
          expect(result.graphics[2]!.values).toEqual(calculation.labels.flat());
          expect(result.graphics[4]!.highlight).toEqual(
            calculation.selectedIds,
          );
          expect(calculation.selectedSplits).toEqual(
            calculation.selectedIds.map((id) =>
              id < 12 ? "Training" : "Validation",
            ),
          );
          expect(result.answer).toBe(calculation.selectedIds[0]);
          seen.push(...calculation.selectedIds);
        }
        expect(seen.slice().sort((a, b) => a - b)).toEqual(
          Array.from({ length: 16 }, (_, id) => id),
        );
      }
    }
    expect(tf.memory().numTensors).toBe(before);
  });
});
