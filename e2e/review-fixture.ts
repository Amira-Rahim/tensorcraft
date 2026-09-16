import type { Page } from "@playwright/test";
export const REVIEW_LESSON =
  "/worlds/deep-orbit/foundations/introduction-to-tensors";
export async function seedDueReview(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("tc-cookie-consent", "declined");
    localStorage.setItem("tc_step_deep-orbit_introduction-to-tensors", "0");
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
