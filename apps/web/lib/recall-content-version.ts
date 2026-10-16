/** Meaningful rewrites must not inherit answers or schedules for old prompts. */
export function recallContentVersion(world: string, lesson: string) {
  return world === "deep-orbit" && lesson === "tensor-shapes" ? 2 : 1;
}

/** Review queue indices are opaque integer keys. Reserve 32 positions per
 * revision, matching the API's maximum prompts per lesson. Existing lessons
 * keep their original keys; the rebuilt sensor lesson starts a fresh block.
 */
export function reviewPromptIndex(
  world: string,
  lesson: string,
  sourceIndex: number,
) {
  return (recallContentVersion(world, lesson) - 1) * 32 + sourceIndex;
}
