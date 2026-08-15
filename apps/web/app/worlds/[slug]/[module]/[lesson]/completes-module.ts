export interface ModuleLessonState {
  slug: string;
  completed: boolean;
}

/**
 * True when finishing `currentSlug` right now closes out the module: every
 * OTHER lesson is already done (server truth or a local guest record) and
 * the current one is not. "Last remaining", not "last by order": in free
 * modules lessons are unlocked in any order, and the award belongs to
 * whichever lesson finishes the set.
 *
 * Pure; callers gate on patch art (patchSrc) and on the completion
 * effect's enteredThisSession guard, so a restored mount never re-awards.
 */
export function completesModule(
  lessons: ModuleLessonState[] | undefined,
  currentSlug: string,
  guestDoneSlugs: ReadonlySet<string>,
): boolean {
  if (!lessons || lessons.length === 0) return false;
  const done = (l: ModuleLessonState) =>
    l.completed || guestDoneSlugs.has(l.slug);
  const current = lessons.find((l) => l.slug === currentSlug);
  if (!current || done(current)) return false;
  return lessons.filter((l) => l.slug !== currentSlug).every(done);
}
