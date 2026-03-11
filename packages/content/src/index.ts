/**
 * @tensorcraft/content
 *
 * MDX lesson content, exercise definitions, and theme content schemas.
 * Uses Velite for build-time validation with Zod schemas.
 */

export { lessonSchema, exerciseSchema, moduleSchema } from "./schemas";
export type { Lesson, Exercise, Module } from "./schemas";

// Re-export compiled content from Velite output (available after build:content)
export { lessons, exercises, modules } from "../.velite";

// Content query functions
export {
  getModules,
  getModule,
  getThemeLessons,
  getModuleLessons,
  getLesson,
  getExercise,
  getAdjacentLessons,
} from "./queries";
