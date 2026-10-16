import { expect, it } from "vitest";
import {
  recallContentVersion,
  reviewPromptIndex,
} from "./recall-content-version";

it("starts rewritten recall tasks with new queue keys while keeping other lessons and worlds stable", () => {
  for (const lesson of [
    "tensor-shapes",
    "loss-functions",
    "training-loop",
    "the-anomaly",
  ]) {
    expect(recallContentVersion("deep-orbit", lesson)).toBe(2);
    expect(
      [0, 1, 2].map((index) => reviewPromptIndex("deep-orbit", lesson, index)),
    ).toEqual([32, 33, 34]);
    expect(reviewPromptIndex("other-world", lesson, 0)).toBe(0);
  }
  expect(reviewPromptIndex("deep-orbit", "normalization", 1)).toBe(1);
  expect(reviewPromptIndex("other-world", "tensor-shapes", 0)).toBe(0);
});
