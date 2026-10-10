import { describe, expect, it } from "vitest";
import { taskBriefLines } from "./task-brief-lines";
import { exercises } from "../.velite";

// create-a-tensor's BUILT starter: tsToJs drops the YAML's blank lines.
const BUILT_STARTER = [
  "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];",
  "// Your work: replace the two nulls.",
  "const reading = null;",
  "const shape = null;",
  "// Supplied: copy the readings into a JavaScript array for Farah.",
  "const values = reading?.arraySync();",
  "// Supplied: release memory after copying the values.",
  "reading?.dispose();",
  "",
].join("\n");

const STEPS = [
  {
    title: "Create the tensor",
    instruction: "Set `reading` to:",
    code: "tf.tensor(streamValues)",
    target: "reading",
  },
  {
    title: "Read its shape",
    instruction: "Set `shape` to:",
    code: "reading.shape",
    target: "shape",
  },
];

describe("taskBriefLines (spec 2026-10-10, section 5 item 10)", () => {
  it("adds each step's line in the built starter", () => {
    expect(taskBriefLines(BUILT_STARTER, STEPS)).toEqual({
      ok: true,
      steps: [
        { ...STEPS[0], line: 3 },
        { ...STEPS[1], line: 4 },
      ],
    });
  });

  it("fails a target the starter never declares", () => {
    const result = taskBriefLines(BUILT_STARTER, [
      { ...STEPS[0], target: "readingX" },
    ]);
    expect(result).toEqual({
      ok: false,
      errors: [
        "taskBrief step 1 (readingX): the built starter must declare it exactly once; found 0.",
      ],
    });
  });

  it("fails a target declared twice", () => {
    const result = taskBriefLines(
      `${BUILT_STARTER}\nconst reading = null;`,
      STEPS,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/found 2\.$/);
  });

  it("fails a declaration that no longer holds its placeholder", () => {
    const result = taskBriefLines(
      BUILT_STARTER.replace("const reading = null;", "const reading = 1;"),
      STEPS,
    );
    expect(result).toEqual({
      ok: false,
      errors: [
        "taskBrief step 1 (reading): its starter declaration must hold null.",
      ],
    });
  });

  it("the built create-a-tensor brief carries lines 3 and 4", () => {
    const exercise = exercises.find((e) => e.slug === "create-a-tensor");
    expect(exercise?.taskBrief?.steps.map((step) => step.line)).toEqual([3, 4]);
  });
});
