import { describe, it, expect, vi, beforeEach } from "vitest";

// Contract test for the commit-on-pass helper (2026-07-13 all-P round):
// the endpoint/body shape is what makes the "push to your GitHub" promise
// real, and the fire-and-forget MUST swallow rejections (an unhandled
// rejection here would surface as console noise on every guest submit).

vi.mock("./api-fetch", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "./api-fetch";
import { commitExerciseArtifact } from "./github-commit";

beforeEach(() => {
  vi.mocked(apiFetch).mockReset();
});

describe("commitExerciseArtifact", () => {
  it("POSTs the artifact to /api/github/commit with the full payload", () => {
    vi.mocked(apiFetch).mockResolvedValue(new Response(null));
    commitExerciseArtifact({
      themeId: "deep-orbit",
      lessonId: "tensor-operations",
      moduleId: "foundations",
      exerciseSlug: "amplify-gains",
      code: "const amplified = gains.mul(window);",
    });
    expect(apiFetch).toHaveBeenCalledWith("/api/github/commit", {
      method: "POST",
      body: JSON.stringify({
        themeId: "deep-orbit",
        lessonId: "tensor-operations",
        moduleId: "foundations",
        exerciseSlug: "amplify-gains",
        code: "const amplified = gains.mul(window);",
      }),
    });
  });

  it("swallows rejections (guest / not-connected is the common case)", async () => {
    // The real guard is vitest's global unhandled-rejection detector: if
    // commitExerciseArtifact ever loses its .catch, the rejected promise
    // below fails the RUN, not just this assertion. The flush guarantees
    // the rejection has settled inside this test's lifetime.
    vi.mocked(apiFetch).mockRejectedValue(new Error("401"));
    expect(() =>
      commitExerciseArtifact({
        themeId: "deep-orbit",
        lessonId: "x",
        code: "y",
      }),
    ).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
