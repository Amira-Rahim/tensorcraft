/** Read authored Exercise references from compiled MDX, then resolve their titles. */
export function orderedLessonExercises<
  T extends { slug: string; title: string },
>(body: string, exercises: readonly T[]): T[] {
  const lookup = new Map(
    exercises.map((exercise) => [exercise.slug, exercise]),
  );
  const seen = new Set<string>(),
    result: T[] = [];
  for (const match of body.matchAll(/\bslug:\s*["']([^"']+)["']/g)) {
    const slug = match[1]!,
      exercise = lookup.get(slug);
    if (exercise && !seen.has(slug)) {
      seen.add(slug);
      result.push(exercise);
    }
  }
  return result;
}
