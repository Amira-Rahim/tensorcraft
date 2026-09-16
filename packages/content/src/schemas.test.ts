import { describe, it, expect } from "vitest";
import { lessonSchema, exerciseSchema, moduleSchema } from "./schemas";

describe("lessonSchema", () => {
  const validLesson = {
    slug: "introduction-to-tensors",
    title: "Introduction to Tensors",
    moduleId: "module-1",
    worldId: "deep-orbit",
    order: 1,
    estimatedMinutes: 25,
    difficulty: "beginner" as const,
    context: {
      narrative: "The ship receives a mysterious data stream",
      speaker: "Commander Mirza",
    },
    concept: {
      explanation: "Tensors are multi-dimensional arrays",
      bridge: {
        jsTitle: "Array",
        jsCode: "const arr = [1, 2, 3]",
        mlTitle: "Tensor",
        mlCode: "const t = tf.tensor([1, 2, 3])",
        tier: "identity" as const,
      },
    },
    consequence: {
      narrative: "The signal begins to take shape",
    },
    hints: [
      { level: "nudge" as const, content: "Think about array dimensions" },
      { level: "guidance" as const, content: "Use tf.tensor() to create" },
      { level: "solution" as const, content: "const t = tf.tensor([1,2,3])" },
    ],
    keywords: ["tensor", "array", "shape"],
  };

  it("accepts a valid lesson", () => {
    const result = lessonSchema.safeParse(validLesson);
    expect(result.success).toBe(true);
  });

  it("rejects invalid difficulty", () => {
    const result = lessonSchema.safeParse({
      ...validLesson,
      difficulty: "expert",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const { title, ...incomplete } = validLesson;
    const result = lessonSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("validates bridge tier enum", () => {
    const result = lessonSchema.safeParse({
      ...validLesson,
      concept: {
        ...validLesson.concept,
        bridge: { ...validLesson.concept.bridge, tier: "invalid" },
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts a two-rung lesson without an unnecessary guidance hint", () => {
    expect(
      lessonSchema.safeParse({
        ...validLesson,
        hints: [validLesson.hints[0], validLesson.hints[2]],
      }).success,
    ).toBe(true);
  });

  it("rejects a hint ladder with only one rung", () => {
    const result = lessonSchema.safeParse({
      ...validLesson,
      hints: [{ level: "nudge", content: "just one" }],
    });
    expect(result.success).toBe(false);
  });

  it("bridge is optional within concept", () => {
    const result = lessonSchema.safeParse({
      ...validLesson,
      concept: { explanation: "No bridge here" },
    });
    expect(result.success).toBe(true);
  });

  it("defaults keywords to empty array", () => {
    const { keywords, ...noKeywords } = validLesson;
    const result = lessonSchema.safeParse(noKeywords);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keywords).toEqual([]);
    }
  });
});

describe("exerciseSchema", () => {
  const validExercise = {
    slug: "create-a-tensor",
    lessonSlug: "introduction-to-tensors",
    title: "Create a Tensor",
    instructions: "Create a 2D tensor with the given values",
    starterCode: "const tensor = null; // your code here",
    solutionCode: "const tensor = tf.tensor2d([[1,2],[3,4]]);",
    testCode:
      'describe("Tensor", () => { it("exists", () => { expect(tensor).toBeDefined(); }); });',
    estimatedMinutes: 10,
    difficulty: "beginner" as const,
  };

  it("accepts an exercise-level hint ladder of two or three rungs and rejects one", () => {
    const rung = (level: "nudge" | "guidance" | "solution") => ({
      level,
      content: "x",
    });
    expect(
      exerciseSchema.safeParse({
        ...validExercise,
        hints: [rung("nudge"), rung("guidance"), rung("solution")],
      }).success,
    ).toBe(true);
    expect(
      exerciseSchema.safeParse({
        ...validExercise,
        hints: [rung("nudge"), rung("solution")],
      }).success,
    ).toBe(true);
    expect(
      exerciseSchema.safeParse({ ...validExercise, hints: [rung("nudge")] })
        .success,
    ).toBe(false);
  });

  it("accepts a valid exercise", () => {
    const result = exerciseSchema.safeParse(validExercise);
    expect(result.success).toBe(true);
  });

  it("rejects empty starterCode", () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      starterCode: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing solutionCode", () => {
    const { solutionCode, ...incomplete } = validExercise;
    const result = exerciseSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });
});

describe("moduleSchema", () => {
  const validModule = {
    slug: "foundations",
    title: "Foundations",
    worldId: "deep-orbit",
    order: 1,
    description: "Learn the fundamentals of tensors and data loading",
    summary: "Create tensors and prepare data for a model.",
    lessonCount: 5 as const,
    prerequisites: [],
  };

  it("accepts a valid module", () => {
    const result = moduleSchema.safeParse(validModule);
    expect(result.success).toBe(true);
  });

  it.each([4, 5, 6])("accepts a module with %i lessons", (lessonCount) => {
    expect(
      moduleSchema.safeParse({ ...validModule, lessonCount }).success,
    ).toBe(true);
  });

  it.each([0, -1, 1.5])(
    "rejects an invalid lesson count of %s",
    (lessonCount) => {
      expect(
        moduleSchema.safeParse({ ...validModule, lessonCount }).success,
      ).toBe(false);
    },
  );

  it("requires a summary for the module preview", () => {
    expect(
      moduleSchema.safeParse({ ...validModule, summary: undefined }).success,
    ).toBe(false);
    expect(
      moduleSchema.safeParse({ ...validModule, summary: "" }).success,
    ).toBe(false);
  });

  it("defaults prerequisites to empty array", () => {
    const { prerequisites, ...noPrereqs } = validModule;
    const result = moduleSchema.safeParse(noPrereqs);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prerequisites).toEqual([]);
    }
  });
});
