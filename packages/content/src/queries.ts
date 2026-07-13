import { lessons, exercises, modules, posts } from "../.velite";
import {
  buildConceptIndex,
  findLessonsByConcepts,
  normalizeConcept,
  type ConceptIndex,
} from "./concept-index";

export type { Lesson, Exercise, Module, Post } from "../.velite";

/** Get all blog posts, sorted newest-first. */
export function getPosts() {
  return [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/** Get a single blog post by slug. */
export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug) ?? null;
}

/** Get all modules for a theme, sorted by order */
export function getModules(themeSlug: string) {
  return modules
    .filter((m) => m.themeId === themeSlug)
    .sort((a, b) => a.order - b.order);
}

/** Get only foundations (shared core) modules for a theme */
export function getFoundationsModules(themeSlug: string) {
  return getModules(themeSlug).filter((m) => m.track === "foundations");
}

/** Get only specialization (theme-specific) modules for a theme */
export function getSpecializationModules(themeSlug: string) {
  return getModules(themeSlug).filter((m) => m.track === "specialization");
}

/** Check if a module is part of the shared foundations track */
export function isFoundationsModule(mod: { track: string }) {
  return mod.track === "foundations";
}

/** Get a single module by theme and slug */
export function getModule(themeSlug: string, moduleSlug: string) {
  return (
    modules.find((m) => m.themeId === themeSlug && m.slug === moduleSlug) ??
    null
  );
}

/** Get all lessons for a theme, sorted by module order then lesson order */
export function getThemeLessons(themeSlug: string) {
  return lessons
    .filter((l) => l.themeId === themeSlug)
    .sort((a, b) => a.order - b.order);
}

/** Get lessons for a specific module */
export function getModuleLessons(themeSlug: string, moduleSlug: string) {
  return lessons
    .filter((l) => l.themeId === themeSlug && l.moduleId === moduleSlug)
    .sort((a, b) => a.order - b.order);
}

/** Get a single lesson */
export function getLesson(
  themeSlug: string,
  moduleSlug: string,
  lessonSlug: string,
) {
  return (
    lessons.find(
      (l) =>
        l.themeId === themeSlug &&
        l.moduleId === moduleSlug &&
        l.slug === lessonSlug,
    ) ?? null
  );
}

/** Get an exercise by slug */
export function getExercise(slug: string) {
  return exercises.find((e) => e.slug === slug) ?? null;
}

/** Get all exercises for a given lesson slug */
export function getLessonExercises(lessonSlug: string) {
  return exercises.filter((e) => e.lessonSlug === lessonSlug);
}

/**
 * Lesson + embedded-exercise minutes: the single user-facing time basis.
 * lesson.estimatedMinutes counts the reading/steps only, so every surface
 * that shows a learner "how long is this page" must add the exercises the
 * page embeds. The theme courseWorkload JSON-LD and /pricing's curriculum
 * preview already sum on this basis; per-lesson surfaces drifted from it
 * when second (incident) exercises landed (2026-07-13 P4 round 3).
 */
export function getLessonTotalMinutes(lesson: {
  slug: string;
  estimatedMinutes: number;
}): number {
  return (
    lesson.estimatedMinutes +
    getLessonExercises(lesson.slug).reduce(
      (sum, ex) => sum + (ex.estimatedMinutes ?? 0),
      0,
    )
  );
}

/** Bridge collectible shape returned by getLessonsWithBridges */
export interface CollectibleBridge {
  lessonSlug: string;
  moduleSlug: string;
  feTitle: string;
  mlTitle: string;
  tier: "identity" | "structural" | "intuition";
}

/** Get all lessons with bridges for a theme (for dashboard collectibles) */
export function getLessonsWithBridges(themeSlug: string): CollectibleBridge[] {
  return lessons
    .filter((l) => l.themeId === themeSlug && l.concept?.bridge)
    .map((l) => ({
      lessonSlug: l.slug,
      moduleSlug: l.moduleId,
      feTitle: l.concept.bridge!.feTitle,
      mlTitle: l.concept.bridge!.mlTitle,
      tier: l.concept.bridge!.tier,
    }));
}

/**
 * Look up lessons that teach a given set of free-text terms (e.g. ML news
 * keywords like "WebGPU", "transformers.js"). Tokens are normalized via
 * `normalizeConcept` before lookup, so callers can pass raw strings.
 *
 * Pass a pre-built `ConceptIndex` (loaded from `.velite/concept-index.json`).
 * Falls back to building it on-demand if `index` is omitted: slow path,
 * intended for tests or one-off scripts only.
 */
export function getLessonsByConcepts(
  terms: string[],
  options: { index?: ConceptIndex; limit?: number } = {},
) {
  const { limit = 10 } = options;
  const normalized = terms.flatMap((t) => normalizeConcept(t));
  if (normalized.length === 0) return [];

  const index = options.index ?? buildConceptIndex(lessons);
  return findLessonsByConcepts(index, normalized, { limit });
}

/** Get prev/next lessons for navigation */
export function getAdjacentLessons(lesson: {
  themeId: string;
  moduleId: string;
  order: number;
}) {
  const moduleLessons = getModuleLessons(lesson.themeId, lesson.moduleId);
  const index = moduleLessons.findIndex((l) => l.order === lesson.order);

  return {
    prev: index > 0 ? moduleLessons[index - 1] : null,
    next: index < moduleLessons.length - 1 ? moduleLessons[index + 1] : null,
  };
}
