import { describe, it, expect } from "vitest";
import * as tf from "@tensorflow/tfjs";
import {
  VISION_KERNEL,
  visionFeatureMap,
  visionImage,
  type VisionPattern,
} from "./vision-preview";

describe("the published Neon vision sample", () => {
  it("matches real conv2d across orientation, brightness and all windows, without retaining tensors", async () => {
    await tf.setBackend("cpu");
    await tf.ready();
    const before = tf.memory().numTensors;
    for (const pattern of [
      "vertical",
      "horizontal",
      "uniform",
      "reversed",
    ] as VisionPattern[]) {
      for (const brighter of [false, true]) {
        const image = visionImage(pattern, brighter);
        const expected = tf.tidy(() => {
          const input = tf.tensor4d(image.flat(), [1, 5, 5, 1]);
          const filter = tf.tensor4d(VISION_KERNEL.flat(), [3, 3, 1, 1]);
          return Array.from(tf.conv2d(input, filter, 1, "valid").dataSync());
        });
        const actual = visionFeatureMap(image).flat();
        actual.forEach((value, index) =>
          expect(value).toBeCloseTo(expected[index], 5),
        );
      }
    }
    expect(tf.memory().numTensors).toBe(before);
  });
  it("detects direction and rejects invalid image contracts", () => {
    expect(visionFeatureMap(visionImage("vertical", false))[1][1]).toBeCloseTo(
      2.8,
    );
    expect(visionFeatureMap(visionImage("reversed", false))[1][1]).toBeCloseTo(
      -2.8,
    );
    expect(
      visionFeatureMap(visionImage("horizontal", false))[1][1],
    ).toBeCloseTo(0);
    expect(visionFeatureMap(visionImage("uniform", false))[1][1]).toBeCloseTo(
      0,
    );
    expect(() => visionFeatureMap([[1]])).toThrow();
    const invalid = visionImage("uniform", false);
    invalid[0][0] = NaN;
    expect(() => visionFeatureMap(invalid)).toThrow();
  });
});
