import { describe, it, expect } from "vitest";
import { parseInstructionBlocks, parseInlineCode } from "./instruction-text";

describe("parseInlineCode", () => {
  it("turns backtick pairs into code spans and leaves prose alone", () => {
    expect(
      parseInlineCode("Return `{ rows, matched }` as one object."),
    ).toEqual([
      { kind: "text", value: "Return " },
      { kind: "code", value: "{ rows, matched }" },
      { kind: "text", value: " as one object." },
    ]);
  });
  it("treats an unmatched backtick as punctuation", () => {
    expect(parseInlineCode("one ` stray")).toEqual([
      { kind: "text", value: "one ` stray" },
    ]);
  });
});

describe("parseInstructionBlocks", () => {
  it("joins hard-wrapped prose and splits paragraphs on blank lines", () => {
    const text =
      "Retrieval decides what the model\nis allowed to know.\n\nThree filters.";
    expect(parseInstructionBlocks(text)).toEqual([
      {
        kind: "paragraph",
        text: "Retrieval decides what the model is allowed to know.",
      },
      { kind: "paragraph", text: "Three filters." },
    ]);
  });

  it("keeps an indented return contract with trailing comments as a code block", () => {
    const text = [
      "Return:",
      "",
      "  {",
      "    oldAlertsPerDay: number,    // rate times volume, rounded",
      "    action: 'hold' | 'roll-forward' | 'investigate',",
      "  }",
      "",
      "A threshold is a rate promise.",
    ].join("\n");
    const blocks = parseInstructionBlocks(text);
    expect(blocks).toHaveLength(3);
    expect(blocks[1]).toEqual({
      kind: "code",
      text: "{\n  oldAlertsPerDay: number,    // rate times volume, rounded\n  action: 'hold' | 'roll-forward' | 'investigate',\n}",
    });
    expect(blocks[2]).toEqual({
      kind: "paragraph",
      text: "A threshold is a rate promise.",
    });
  });

  it("reads numbered steps as an ordered list and dashes as a bulleted one", () => {
    const text =
      "1. Write `fitStats(rows)`.\n2. Z-score the batch.\n\n- first\n- second";
    expect(parseInstructionBlocks(text)).toEqual([
      {
        kind: "list",
        ordered: true,
        items: ["Write `fitStats(rows)`.", "Z-score the batch."],
      },
      { kind: "list", ordered: false, items: ["first", "second"] },
    ]);
  });

  it("renders a single-line instruction as one paragraph", () => {
    expect(parseInstructionBlocks("Add two tensors.")).toEqual([
      { kind: "paragraph", text: "Add two tensors." },
    ]);
  });
});
