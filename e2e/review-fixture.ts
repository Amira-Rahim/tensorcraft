import type { Page } from "@playwright/test";
/** The lesson whose prompt the fixture below marks as due. */
export const REVIEW_LESSON =
  "/worlds/deep-orbit/foundations/introduction-to-tensors";
/**
 * Where that prompt is actually asked. A warm-up only recalls lessons that
 * come BEFORE the one being opened (course-position.ts, 2026-09-22), so a
 * due prompt from lesson 1 surfaces on lesson 2, never on lesson 1 itself.
 */
export const REVIEW_WARMUP_LESSON =
  "/worlds/deep-orbit/foundations/tensor-shapes";
export async function seedDueReview(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("tc-cookie-consent", "declined");
    localStorage.setItem("tc_step_deep-orbit_tensor-shapes", "0");
    localStorage.setItem(
      "tc_guest_reviews_v1",
      JSON.stringify({
        "deep-orbit/foundations/introduction-to-tensors/0": {
          pulls: 0,
          successes: 0,
          lastReviewedAt: null,
          nextReviewAt: "2020-01-01T00:00:00.000Z",
        },
      }),
    );
  });
}
