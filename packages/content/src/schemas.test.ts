import { describe, it, expect } from "vitest";
import { lessonSchema, exerciseSchema, moduleSchema } from "./schemas";

describe("lessonSchema", () => {
  const validLesson = {
    slug: "introduction-to-tensors",
    title: "Introduction to Tensors",
    moduleId: "module-1",
    themeId: "deep-orbit",
    order: 1,
    estimatedMinutes: 25,
    difficulty: "beginner" as const,
    context: {
      narrative: "The ship receives a mysterious data stream",
      speaker: "Commander Okafor",
    },
    concept: {
      explanation: "Tensors are multi-dimensional arrays",
      bridge: {
        feTitle: "Array",
        feCode: "const arr = [1, 2, 3]",
        mlTitle: "Tensor",
        mlCode: "const t = tf.tensor([1, 2, 3])",
        tier: "identity" as const,
      },
    },
    consequence: {
      narrative: "The signal begins to take shape",
      nextLessonTeaser: "Next: understanding tensor shapes",
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

  it("requires hints to have exactly 3 levels", () => {
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
    themeId: "deep-orbit",
    order: 1,
    description: "Learn the fundamentals of tensors and data loading",
    lessonCount: 5 as const,
    prerequisites: [],
  };

  it("accepts a valid module", () => {
    const result = moduleSchema.safeParse(validModule);
    expect(result.success).toBe(true);
  });

  it("requires exactly 5 lessons", () => {
    const result = moduleSchema.safeParse({
      ...validModule,
      lessonCount: 4,
    });
    expect(result.success).toBe(false);
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
