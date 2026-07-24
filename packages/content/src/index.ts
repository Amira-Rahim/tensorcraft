/**
 * @tensorcraft/content
 *
 * MDX lesson content, exercise definitions, and theme content schemas.
 * Uses Velite for build-time validation with Zod schemas.
 */

export {
  BUILT_THEME_DIRS,
  BUILT_THEME_GLOB,
  BUILT_STORY_THEMES,
} from "./built-themes";
export type { BuiltThemeDir } from "./built-themes";

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
  getThemeLessons,
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
