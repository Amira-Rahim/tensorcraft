import { describe, it, expect } from "vitest";
import { parseRecallPrompts } from "./parse-recall-prompts";

describe("parseRecallPrompts", () => {
  it("returns an empty array when there are no prompts", () => {
    expect(parseRecallPrompts("## Just a heading\n\nSome prose.")).toEqual([]);
  });

  it("extracts a single-line prompt", () => {
    const raw = `<RecallPrompt question="What is ReLU?" answer="max(0, x)." />`;
    expect(parseRecallPrompts(raw)).toEqual([
      { index: 0, question: "What is ReLU?", answer: "max(0, x)." },
    ]);
  });

  it("extracts a multi-line prompt", () => {
    const raw = [
      "<RecallPrompt",
      '  question="Why does it collapse?"',
      '  answer="Stacked linear maps multiply out to one matrix."',
      "/>",
    ].join("\n");
    expect(parseRecallPrompts(raw)[0].question).toBe("Why does it collapse?");
  });

  it("survives a greater-than sign inside an attribute value", () => {
    // anomaly-detection/01-normal-vs-anomalous.mdx carries |z| > 3
    const raw = `<RecallPrompt question="What does |z| > 3 mean?" answer="Beyond 3 sigma." />`;
    expect(parseRecallPrompts(raw)).toEqual([
      {
        index: 0,
        question: "What does |z| > 3 mean?",
        answer: "Beyond 3 sigma.",
      },
    ]);
  });

  it("survives an arrow function inside an attribute value", () => {
    // browser-runtimes/03-model-loading.mdx carries r => r.json()
    const raw = `<RecallPrompt question="What does r => r.json() do?" answer="Parses the body." />`;
    expect(parseRecallPrompts(raw)[0].question).toContain("r => r.json()");
  });

  it("indexes multiple prompts in source order", () => {
    const raw = [
      `<RecallPrompt question="First?" answer="A." />`,
      "Some prose between them.",
      `<RecallPrompt question="Second?" answer="B." />`,
    ].join("\n\n");
    expect(parseRecallPrompts(raw).map((p) => [p.index, p.question])).toEqual([
      [0, "First?"],
      [1, "Second?"],
    ]);
  });

  /*
    The index counter advances for a tag that is DROPPED, so indices are not
    guaranteed contiguous. This is the sole reason both enqueue paths take
    `promptIndices: number[]` rather than a count: a count would synthesize
    0..n-1, enqueue a key the read path drops, and silently lose the prompt
    that actually exists. Documented in three files and, until now, pinned in
    none, so moving `index += 1` inside the success branch was a green change.
  */
  it("keeps the authored position when an earlier tag is dropped", () => {
    const raw = [
      `<RecallPrompt question="Orphan, no answer" />`,
      `<RecallPrompt question="Second?" answer="B." />`,
    ].join("\n\n");
    expect(parseRecallPrompts(raw)).toEqual([
      { index: 1, question: "Second?", answer: "B." },
    ]);
  });

  it("drops a prompt missing an answer, so the count gate catches it", () => {
    const raw = `<RecallPrompt question="Orphan?" />`;
    expect(parseRecallPrompts(raw)).toEqual([]);
  });
});

describe("structured recall extraction", () => {
  const check = {
    kind: "shape",
    question: "Shape?",
    expected: [3],
    hint: "Count the elements.",
    explanation: "Three elements.",
  };
  it("carries checked parts to the review payload", () => {
    const result = parseRecallPrompts(
      `<RecallPrompt question="Q?" answer="A." checks={${JSON.stringify([check])}} />`,
    );
    expect(result[0].checks).toEqual([check]);
  });
  it("accepts formatter-style objects and trailing commas without evaluating code", () => {
    const result = parseRecallPrompts(
      `<RecallPrompt question="Q?" answer="A." checks={[{kind: 'shape', question: 'Shape?', expected: [3], hint: 'Count the elements.', explanation: 'Three elements.',}]} />`,
    );
    expect(result[0].checks).toEqual([check]);
  });
  it("handles tag-like text, quotes, and entities consistently with MDX", () => {
    const special = { ...check, hint: 'The string "/>" is not a tag here.' };
    const result = parseRecallPrompts(
      `<RecallPrompt question="A &amp; B?" answer="A." checks={${JSON.stringify([special])}} />`,
    );
    expect(result[0].question).toBe("A & B?");
    expect(result[0].checks).toEqual([special]);
  });
  it.each([
    "makeChecks()",
    "checksFromElsewhere",
    "[...otherChecks]",
    "[{ get kind() { return 'shape' } }]",
    "[{ kind: 'shape', kind: 'number' }]",
  ])("rejects nonliteral or ambiguous checks: %s", (expression) => {
    expect(() =>
      parseRecallPrompts(
        `<RecallPrompt question="Q?" answer="A." checks={${expression}} />`,
      ),
    ).toThrow("invalid checks");
  });
  it.each([
    [],
    [{ ...check, expected: [-1] }],
    [{ ...check, hint: "" }],
    [
      {
        kind: "choice",
        question: "Q?",
        explanation: "A.",
        options: [
          { text: "A", feedback: "a" },
          { text: "B", feedback: "b" },
        ],
        correctIndex: 2,
      },
    ],
  ])("fails the build for invalid checked content", (checks) => {
    expect(() =>
      parseRecallPrompts(
        `<RecallPrompt question="Q?" answer="A." checks={${JSON.stringify(checks)}} />`,
      ),
    ).toThrow("invalid checks");
  });
  it("ignores prompt examples inside code fences", () => {
    expect(
      parseRecallPrompts(
        '```mdx\n<RecallPrompt question="Q?" answer="A." />\n```',
      ),
    ).toEqual([]);
  });
});
