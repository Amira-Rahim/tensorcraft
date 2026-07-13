import { apiFetch } from "./api-fetch";

/**
 * Fire-and-forget: commit a passed exercise's code to the learner's
 * tensorcraft-<theme> repo (POST /api/github/commit).
 *
 * Failures are deliberately silent: the server answers with a structured
 * error when GitHub is not connected (the common case), and the Settings
 * page's retroactive push backfills anything missed here — same
 * best-effort contract as exercise-attempt recording. This call is what
 * makes the "solved exercises push to your GitHub" promise true in the
 * product, not just in the API (2026-07-13 audit: the backend existed for
 * months with zero callers).
 */
export function commitExerciseArtifact(input: {
  themeId: string;
  lessonId: string;
  moduleId?: string;
  /** Artifact filename key; without it two-exercise lessons overwrite. */
  exerciseSlug?: string;
  code: string;
}): void {
  apiFetch("/api/github/commit", {
    method: "POST",
    body: JSON.stringify(input),
  }).catch(() => {
    /* best-effort; Settings' retroactive push covers gaps */
  });
}
