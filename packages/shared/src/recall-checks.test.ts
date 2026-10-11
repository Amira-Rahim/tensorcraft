import { describe, expect, it } from "vitest";
import { isRecallCheckCorrect, type RecallCheck } from "./recall-checks";

const shape: RecallCheck = {
  kind: "shape",
  question: "Shape?",
  expected: [3],
  hint: "Count.",
  explanation: "One dimension.",
};
const number: RecallCheck = {
  kind: "number",
  question: "Frequency?",
  expected: 54.6,
  tolerance: 0.01,
  hint: "Fold.",
  explanation: "Aliasing.",
};

describe("structured recall grading", () => {
  it.each(["[3]", " [ 3 ] ", "\n[3.0]\n"])(
    "accepts shape formatting: %s",
    (value) => {
      expect(isRecallCheckCorrect(shape, value)).toBe(true);
    },
  );
  it.each([
    "",
    " ",
    "3",
    "[1, 3]",
    "[[3]]",
    '["3"]',
    "[3, null]",
    "shape is [3]",
    "[3] or [1,3]",
    "[2.9]",
  ])("rejects a wrong shape or prose: %s", (value) => {
    expect(isRecallCheckCorrect(shape, value)).toBe(false);
  });
  it("accepts numeric formatting and explicit rounding tolerance", () => {
    for (const value of [
      "54.60",
      " 54.6 ",
      "5.46e1",
      "54.599",
      "54.59",
      "54.61",
    ])
      expect(isRecallCheckCorrect(number, value)).toBe(true);
    for (const value of [
      "",
      "Infinity",
      "NaN",
      "0x36",
      "54.6 Hz",
      "54.6 or 73.4",
      "54.7",
      "54.6101",
    ])
      expect(isRecallCheckCorrect(number, value)).toBe(false);
  });
  it("requires exact numbers unless a tolerance is authored", () => {
    expect(
      isRecallCheckCorrect({ ...number, tolerance: undefined }, "54.599"),
    ).toBe(false);
    expect(
      isRecallCheckCorrect(
        { ...number, expected: 0, tolerance: undefined },
        "0",
      ),
    ).toBe(true);
    expect(isRecallCheckCorrect({ ...number, expected: 0 }, " ")).toBe(false);
  });
  it("grades the chosen option, never a label substring or arbitrary text", () => {
    const choice: RecallCheck = {
      kind: "choice",
      question: "Train?",
      correctIndex: 1,
      options: [
        { text: "Yes", feedback: "No." },
        { text: "No", feedback: "Correct." },
      ],
      explanation: "Only creates a tensor.",
    };
    expect(isRecallCheckCorrect(choice, "1")).toBe(true);
    for (const value of ["0", "2", "No", "anything", "01"])
      expect(isRecallCheckCorrect(choice, value)).toBe(false);
  });
});
