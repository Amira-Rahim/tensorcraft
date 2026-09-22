/**
 * Where a lesson sits in a world's course order: module first, then lesson
 * within the module. Both are the velite `order` fields, 1-based.
 *
 * Shared by the server-side due-review resolver and the client-side guest
 * warm-up so both halves of spaced review apply one rule: a warm-up only ever
 * asks about material that comes BEFORE the lesson being opened. Before this
 * (2026-09-22) a learner who finished lesson 1 and came back a day later was
 * quizzed on lesson 1's own prompt the moment they reopened lesson 1.
 *
 * No "use client": pure, importable from either side.
 */
export interface CoursePosition {
  moduleOrder: number;
  lessonOrder: number;
}

/** True when `candidate` comes strictly before `current` in course order. */
export function isEarlierInCourse(
  candidate: CoursePosition,
  current: CoursePosition,
): boolean {
  if (candidate.moduleOrder !== current.moduleOrder)
    return candidate.moduleOrder < current.moduleOrder;
  return candidate.lessonOrder < current.lessonOrder;
}
