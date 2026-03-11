/**
 * @tensorcraft/content
 *
 * MDX lesson content, exercise definitions, and theme content schemas.
 * Uses Velite for build-time validation with Zod schemas.
 */

export { lessonSchema, exerciseSchema, moduleSchema } from "./schemas";
export type { Lesson, Exercise, Module } from "./schemas";
