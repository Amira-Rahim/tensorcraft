import { lessons, exercises, modules } from "../.velite";

export type { Lesson, Exercise, Module } from "../.velite";

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
