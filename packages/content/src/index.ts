/**
 * @tensorcraft/content
 *
 * MDX lesson content, exercise definitions, and world content schemas.
 * Uses Velite for build-time validation with Zod schemas.
 */

export {
  BUILT_WORLD_DIRS,
  BUILT_WORLD_GLOB,
  BUILT_STORY_WORLDS,
} from "./built-worlds";
export type { BuiltWorldDir } from "./built-worlds";

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

// Curated ML glossary: auto-underline concept terms in prose and feed a rail.
export { GLOSSARY } from "./glossary";
export type { GlossaryEntry } from "./glossary";

// Glossary matching: whole-word prose scanner used by rehype plugin + Velite transform.
export { matchGlossaryTerms, findGlossaryTermsInText } from "./glossary-match";
export type { GlossaryMatch } from "./glossary-match";

// Content query functions
export {
  getModules,
  getModule,
  getFoundationsModules,
  getSpecializationModules,
  isFoundationsModule,
  getWorldLessons,
  getModuleLessons,
  getLesson,
  getExercise,
  getLessonExercises,
  getLessonTotalMinutes,
  getAdjacentLessons,
  getLessonsWithBridges,
  getLessonsByConcepts,
  getPosts,
  getPost,
} from "./queries";
export type { CollectibleBridge } from "./queries";
