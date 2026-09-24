import { z } from "zod";

/**
 * 5C Loop lesson schema: every lesson must follow
 * Context → Concept → Code → Challenge → Consequence
 */
export const lessonSchema = z.object({
  slug: z.string(),
  title: z.string().min(1),
  moduleId: z.string().min(1),
  worldId: z.string().min(1),
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
        jsTitle: z.string(),
        jsCode: z.string(),
        mlTitle: z.string(),
        mlCode: z.string(),
        tier: z.enum(["identity", "structural", "intuition"]),
        breaks: z.string().optional(),
      })
      .optional(),
  }),
  // Code and Challenge are in the MDX body
  consequence: z.object({
    narrative: z.string().min(1),
  }),

  // Screenplay scene metadata (optional; falls back gracefully)
  scene: z
    .object({
      location: z.string(),
      time: z.string().optional(),
      epilogueLocation: z.string().optional(),
      portraitAlt: z.string().optional(),
      epiloguePortraitAlt: z.string().optional(),
    })
    .optional(),

  // Short exercises can omit the middle guidance rung.
  hints: z
    .array(
      z.object({
        level: z.enum(["nudge", "guidance", "solution"]),
        content: z.string().min(1),
      }),
    )
    .min(2)
    .max(3)
    .optional(),

  // Pedagogical pattern. The lesson BODY carries the alternate structure
  // (authored that way); this field tags it so the Briefing eyebrow renders
  // a FORMAT line (PATTERN_LABELS in lesson-steps.tsx) and the variety gate
  // can assert skeleton-breakers exist per module.
  // "standard"          → conventional Context→Concept→Code→Challenge→Consequence
  // "broken_code_first" → lesson opens with a bug to fix before exposition
  // "discovery"         → learner explores examples/prompts before the concept is named
  // "flashback"         → narrative loops back to an earlier scene before advancing
  // "peer_review"       → learner critiques someone else's code
  pattern: z
    .enum([
      "standard",
      "broken_code_first",
      "discovery",
      "flashback",
      "peer_review",
    ])
    .optional()
    .default("standard"),

  // Keywords for search/tagging
  keywords: z.array(z.string()).default([]),

  // Skill Genome: which axes this lesson affects (optional, for event tracking)
  skillAxes: z
    .array(
      z.enum([
        "data_prep",
        "model_arch",
        "training",
        "evaluation",
        "deployment",
        "js_integration",
      ]),
    )
    .optional()
    .default([]),
});

export const exerciseSchema = z.object({
  slug: z.string(),
  lessonSlug: z.string().min(1),
  title: z.string().min(1),
  instructions: z.string().min(1),
  starterCode: z.string().min(1),
  solutionCode: z.string().min(1),
  testCode: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),

  // The exercise's own hint ladder (second exercises of a lesson carry one;
  // the lesson's ladder serves its primary exercise). See velite.config.ts.
  hints: z
    .array(
      z.object({
        level: z.enum(["nudge", "guidance", "solution"]),
        content: z.string().min(1),
      }),
    )
    .min(2)
    .max(3)
    .optional(),

  // ML-content axis (independent of cognitive difficulty).
  mlContent: z
    .enum([
      "arithmetic",
      "data",
      "model",
      "training",
      "evaluation",
      "deployment",
      "systems",
    ])
    .optional()
    .default("arithmetic"),

  // Skill Genome: primary axis this exercise affects (optional, for event tracking)
  skillAxis: z
    .enum([
      "data_prep",
      "model_arch",
      "training",
      "evaluation",
      "deployment",
      "js_integration",
    ])
    .optional(),
});

export const moduleSchema = z.object({
  slug: z.string(),
  title: z.string().min(1),
  worldId: z.string().min(1),
  order: z.number().int().positive(),
  description: z.string().min(1),
  summary: z.string().min(1),
  lessonCount: z.number().int().positive(),
  prerequisites: z.array(z.string()).default([]),
  track: z
    .enum(["foundations", "specialization", "companion", "bonus"])
    .default("foundations"),
  unlockCondition: z.string().optional(),
});

export type Lesson = z.infer<typeof lessonSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Module = z.infer<typeof moduleSchema>;
