import { defineCollection, defineConfig, s } from "velite";

const lessons = defineCollection({
  name: "Lesson",
  pattern: "**/*.mdx",
  schema: s.object({
    slug: s.slug("lessons"),
    title: s.string().min(1),
    moduleId: s.string().min(1),
    themeId: s.string().min(1),
    order: s.number().int().positive(),
    estimatedMinutes: s.number().int().positive(),
    difficulty: s.enum(["beginner", "intermediate", "advanced"]),

    // 5C Loop structured sections (Context, Concept, Consequence in frontmatter)
    context: s.object({
      narrative: s.string().min(1),
      speaker: s.string().optional(),
    }),
    concept: s.object({
      explanation: s.string().min(1),
      bridge: s
        .object({
          feTitle: s.string(),
          feCode: s.string(),
          mlTitle: s.string(),
          mlCode: s.string(),
          tier: s.enum(["identity", "structural", "intuition"]),
        })
        .optional(),
    }),
    // Code and Challenge sections live in the MDX body
    consequence: s.object({
      narrative: s.string().min(1),
      nextLessonTeaser: s.string().optional(),
    }),

    // 3-level progressive hints
    hints: s
      .array(
        s.object({
          level: s.enum(["nudge", "guidance", "solution"]),
          content: s.string().min(1),
        }),
      )
      .length(3)
      .optional(),

    keywords: s.array(s.string()).default([]),

    // Velite-specific: compiled MDX body and metadata
    body: s.mdx(),
    metadata: s.metadata(),
  }),
});

const exercises = defineCollection({
  name: "Exercise",
  pattern: "**/exercises/*.yaml",
  schema: s.object({
    slug: s.slug("exercises"),
    lessonSlug: s.string().min(1),
    title: s.string().min(1),
    instructions: s.string().min(1),
    starterCode: s.string().min(1),
    solutionCode: s.string().min(1),
    testCode: s.string().min(1),
    estimatedMinutes: s.number().int().positive(),
    difficulty: s.enum(["beginner", "intermediate", "advanced"]),
  }),
});

const modules = defineCollection({
  name: "Module",
  pattern: "**/module.yaml",
  schema: s.object({
    slug: s.slug("modules"),
    title: s.string().min(1),
    themeId: s.string().min(1),
    order: s.number().int().positive(),
    description: s.string().min(1),
    lessonCount: s.number().int().positive(),
    prerequisites: s.array(s.string()).default([]),
    // "foundations" = shared core (modules 1-6), "specialization" = theme-specific (modules 7-11)
    // "companion" = optional deep-dive companion modules, "bonus" = unlockable bonus content
    track: s
      .enum(["foundations", "specialization", "companion", "bonus"])
      .default("foundations"),
    unlockCondition: s.string().optional(),
  }),
});

export default defineConfig({
  root: "content",
  strict: true,
  output: {
    data: ".velite",
    clean: true,
  },
  collections: { lessons, exercises, modules },
});
