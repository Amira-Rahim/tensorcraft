import { z } from "zod";

/**
 * 5C Loop lesson schema — every lesson must follow
 * Context → Concept → Code → Challenge → Consequence
 */
export const lessonSchema = z.object({
  slug: z.string(),
  title: z.string(),
  moduleId: z.string(),
  themeId: z.string(),
  order: z.number().int().positive(),
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),

  // 5C Loop sections (all required)
  context: z.object({
    narrative: z.string().min(1),
    speaker: z.string().optional(),
  }),
  concept: z.object({
    explanation: z.string().min(1),
    bridge: z
      .object({
        feTitle: z.string(),
        feCode: z.string(),
        mlTitle: z.string(),
        mlCode: z.string(),
        tier: z.enum(["identity", "structural", "intuition"]),
      })
      .optional(),
  }),
  // Code and Challenge are in the MDX body
  consequence: z.object({
    narrative: z.string().min(1),
    nextLessonTeaser: z.string().optional(),
  }),

  // Hints (manual 3-level progressive disclosure)
  hints: z
    .array(
      z.object({
        level: z.enum(["nudge", "guidance", "solution"]),
        content: z.string().min(1),
      }),
    )
    .length(3)
    .optional(),

  // Keywords for search/tagging
  keywords: z.array(z.string()).default([]),
});

export const exerciseSchema = z.object({
  slug: z.string(),
  lessonSlug: z.string(),
  title: z.string(),
  instructions: z.string().min(1),
  starterCode: z.string().min(1),
  solutionCode: z.string().min(1),
  testCode: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
});

export const moduleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  themeId: z.string(),
  order: z.number().int().positive(),
  description: z.string(),
  lessonCount: z.literal(5),
  prerequisites: z.array(z.string()).default([]),
});

export type Lesson = z.infer<typeof lessonSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Module = z.infer<typeof moduleSchema>;
