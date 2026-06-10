/**
 * @tensorcraft/content
 *
 * MDX lesson content, exercise definitions, and theme content schemas.
 * Uses Velite for build-time validation with Zod schemas.
 */

export { lessonSchema, exerciseSchema, moduleSchema } from "./schemas";
export type { Lesson, Exercise, Module } from "./schemas";

// Re-export compiled content from Velite output (available after build:content)
export { lessons, exercises, modules, posts } from "../.velite";
export type { Post } from "../.velite";

// Concept index: reverse lookup from ML/FE concepts → lessons.
// Used by the news → digest matcher pipeline.
export {
  normalizeConcept,
  tokenize,
  extractLessonConcepts,
  buildConceptIndex,
  findLessonsByConcepts,
} from "./concept-index";
export type { ConceptIndex, ConceptSource, LessonRef } from "./concept-index";

// Content query functions
export {
  getModules,
  getModule,
  getFoundationsModules,
  getSpecializationModules,
  isFoundationsModule,
  getThemeLessons,
  getModuleLessons,
  getLesson,
  getExercise,
  getLessonExercises,
  getAdjacentLessons,
  getLessonsWithBridges,
  getLessonsByConcepts,
  getPosts,
  getPost,
} from "./queries";
export type { CollectibleBridge } from "./queries";
