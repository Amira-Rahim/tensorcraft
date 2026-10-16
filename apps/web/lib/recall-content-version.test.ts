import { expect, it } from "vitest";
import {
  recallContentVersion,
  reviewPromptIndex,
} from "./recall-content-version";

it("gives the rebuilt sensor lesson new queue keys without changing other lessons", () => {
  expect(recallContentVersion("deep-orbit", "tensor-shapes")).toBe(2);
  expect(
    [0, 1, 2].map((index) =>
      reviewPromptIndex("deep-orbit", "tensor-shapes", index),
    ),
  ).toEqual([32, 33, 34]);
  expect(reviewPromptIndex("deep-orbit", "normalization", 1)).toBe(1);
  expect(reviewPromptIndex("other-world", "tensor-shapes", 0)).toBe(0);
});
