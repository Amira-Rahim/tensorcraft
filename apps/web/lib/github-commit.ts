import { apiFetch } from "./api-fetch";

/**
 * Fire-and-forget: commit a passed exercise's code to the learner's
 * tensorcraft-<world> repo (POST /api/github/commit).
 *
 * Failures are deliberately silent: the server answers with a structured
 * error when GitHub is not connected (the common case), and the Settings
 * page's retroactive push backfills anything missed here - same
 * best-effort contract as exercise-attempt recording. This call is what
 * makes the "solved exercises push to your GitHub" promise true in the
 * product, not just in the API (2026-07-13 audit: the backend existed for
 * months with zero callers).
 */
export function commitExerciseArtifact(input: {
  worldId: string;
  lessonId: string;
  moduleId?: string;
  /** Artifact filename key; without it two-exercise lessons overwrite. */
  exerciseSlug?: string;
  code: string;
}): void {
  apiFetch("/api/github/commit", {
    method: "POST",
    body: JSON.stringify(input),
  })
    .then(async (res) => {
      // One-time nudge: the endpoint answers github_not_connected for the
      // common not-linked case, and nothing else in the lesson flow ever
      // surfaces it, so a learner who skips Settings gets an empty repo
      // with no explanation. Show one toast, ever, per browser.
      if (res.ok || typeof window === "undefined") return;
      const body = (await res.json().catch(() => null)) as {
        code?: string;
      } | null;
      if (
        body?.code === "github_not_connected" &&
        !window.localStorage.getItem("tc_github_nudge_shown")
      ) {
        window.localStorage.setItem("tc_github_nudge_shown", "1");
        window.dispatchEvent(new CustomEvent("tc:github-nudge"));
      }
    })
    .catch(() => {
      /* best-effort; Settings' retroactive push covers gaps */
    });
}
