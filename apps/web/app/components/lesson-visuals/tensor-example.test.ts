import { describe, expect, it } from "vitest";
import { memory } from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-cpu";
import { runTensorExample } from "./tensor-example";
import { WORKED_PACKET } from "../mdx/channel-layout-data";

describe("the live tensor example", () => {
  it("derives its result from the supplied readings and releases every tensor", async () => {
    const before = memory().numTensors;
    for (const values of [
      WORKED_PACKET.flat(),
      WORKED_PACKET.slice(0, 2).flat(),
      WORKED_PACKET.flat(),
    ]) {
      const result = await runTensorExample(values);
      expect(result.shape).toEqual([values.length]);
      result.values.forEach((value, index) =>
        expect(value).toBeCloseTo(values[index]!, 6),
      );
      expect(result.values).toHaveLength(values.length);
      expect(result.chartRows).toEqual(
        [0, 1, 2, 3].map((sensor) => values.filter((_, i) => i % 4 === sensor)),
      );
      expect(memory().numTensors).toBe(before);
    }
  });
});
