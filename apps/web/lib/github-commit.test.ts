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

  it("dispatches the one-time GitHub nudge on github_not_connected, guarded by localStorage", async () => {
    window.localStorage.removeItem("tc_github_nudge_shown");
    const dispatched: string[] = [];
    const spy = vi
      .spyOn(window, "dispatchEvent")
      .mockImplementation((e: Event) => {
        dispatched.push(e.type);
        return true;
      });
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "not connected",
          code: "github_not_connected",
        }),
        { status: 400 },
      ),
    );
    commitExerciseArtifact({ themeId: "deep-orbit", lessonId: "x", code: "y" });
    await new Promise((r) => setTimeout(r, 0));
    expect(dispatched).toContain("tc:github-nudge");
    expect(window.localStorage.getItem("tc_github_nudge_shown")).toBe("1");

    // Second failure: guard holds, no second toast ever.
    dispatched.length = 0;
    commitExerciseArtifact({ themeId: "deep-orbit", lessonId: "x", code: "y" });
    await new Promise((r) => setTimeout(r, 0));
    expect(dispatched).not.toContain("tc:github-nudge");
    spy.mockRestore();
    window.localStorage.removeItem("tc_github_nudge_shown");
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
