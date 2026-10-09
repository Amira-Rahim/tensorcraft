import { describe, expect, it } from "vitest";
import { memory } from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-cpu";
import { runTensorExample } from "./tensor-example";
import { FIRST_PACKET } from "./instrument-math";

describe("the live tensor example", () => {
  it("derives its result from the supplied readings and releases every tensor", async () => {
    const before = memory().numTensors;
    for (const values of [FIRST_PACKET, [1, 2, 6], FIRST_PACKET]) {
      const result = await runTensorExample(values);
      expect(result.shape).toEqual([values.length]);
      result.values.forEach((value, index) =>
        expect(value).toBeCloseTo(values[index]!, 6),
      );
      expect(result.values).toHaveLength(values.length);
      expect(memory().numTensors).toBe(before);
    }
  });
});
