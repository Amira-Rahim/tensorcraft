// @vitest-environment node
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { initialInvestigationValues } from "./investigation-types";

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

const spec = NUMERIC_INVESTIGATIONS.normalization!;
const exercise = readFileSync(
  new URL(
    "../../../../../packages/content/content/deep-orbit/foundations/exercises/normalize-data.yaml",
    import.meta.url,
  ),
  "utf8",
);
const solution = exercise
  .split("solutionCode: |\n")[1]!
  .split("\ntestCode:")[0]!
  .replace(/^ {2}/gm, "");

describe("normalization's scaler-to-score reference", () => {
  it("matches the authored TensorFlow.js scaler and fixed neuron for training and later rows", () => {
    const before = tf.memory().numTensors;
    const authored = new Function(
      "tf",
      `${solution}\nreturn { batch, mean, std, min, max, normalized, scores, unitRange, scaleFeatures, previewModel };`,
    )(tf) as {
      batch: tf.Tensor2D;
      mean: tf.Tensor1D;
      std: tf.Tensor1D;
      min: tf.Tensor1D;
      max: tf.Tensor1D;
      normalized: tf.Tensor2D;
      scores: tf.Tensor2D;
      unitRange: tf.Tensor2D;
      scaleFeatures: (
        rows: tf.Tensor,
        offset: tf.Tensor,
        scale: tf.Tensor,
      ) => tf.Tensor;
      previewModel: tf.LayersModel;
    };
    try {
      for (const [temperature, signal] of [
        [20, 0.2],
        [22, 0.8],
        [24, 0.4],
        [26, 0.6],
        [30, 0.6],
        [18, 1.2],
      ]) {
        for (const method of [0, 1, 2]) {
          const result = spec.evaluate(
            { temperature: temperature!, signal: signal!, method },
            "standard",
          );
          const reference = new Function(
            `${result.code}\nreturn { scaled, score };`,
          )();
          const actual = tf.tidy(() => {
            const reading = tf.tensor1d([temperature!, signal!]);
            const scaled =
              method === 0
                ? reading
                : authored.scaleFeatures(
                    reading,
                    method === 1 ? authored.mean : authored.min,
                    method === 1
                      ? authored.std
                      : authored.max.sub(authored.min),
                  );
            const prediction = authored.previewModel.predict(
              scaled.expandDims(0),
            ) as tf.Tensor;
            return {
              scaled: Array.from(scaled.dataSync()),
              score: prediction.dataSync()[0]!,
            };
          });
          reference.scaled.forEach((value: number, i: number) =>
            expect(value).toBeCloseTo(actual.scaled[i]!, 5),
          );
          expect(result.answer).toBeCloseTo(actual.scaled[0]!, 5);
          expect(reference.score).toBeCloseTo(actual.score, 6);
          expect(
            result.graphics
              .find((graphic) => graphic.label === "Supplied fixed neuron")
              ?.values.at(-1),
          ).toBe(`Sigmoid score: ${Math.round(actual.score * 1000) / 1000}`);
        }
      }
    } finally {
      tf.dispose([
        authored.batch,
        authored.mean,
        authored.std,
        authored.min,
        authored.max,
        authored.normalized,
        authored.scores,
        authored.unitRange,
      ]);
      authored.previewModel.dispose();
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("keeps the same training rows and statistics when the later reading changes", () => {
    const first = spec.evaluate(initialInvestigationValues(spec), "standard");
    const later = spec.evaluate(
      initialInvestigationValues(spec, "changed"),
      "changed",
    );
    for (const label of [
      "Training rows: temperature, signal strength",
      "Saved training statistics",
    ]) {
      const original = first.graphics.find(
        (graphic) => graphic.label === label,
      )!;
      const changed = later.graphics.find(
        (graphic) => graphic.label === label,
      )!;
      expect(changed.values).toEqual(original.values);
    }
    expect(first.graphics[1]!.highlight).toEqual([4, 5]);
    expect(later.graphics[1]!.highlight).toEqual([]);
    expect(later.answer).toBeCloseTo(10 / 6);
    expect(spec.boundary).toContain("no physical units or timestamps");
    expect(spec.boundary).toContain(
      "performs no TensorFlow.js prediction or training",
    );
  });
});
