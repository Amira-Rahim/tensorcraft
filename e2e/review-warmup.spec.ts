import { test, expect } from "@playwright/test";
import { REVIEW_LESSON } from "./review-fixture";

test("guest completion becomes a due warm-up the next day", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("tc-cookie-consent", "declined");
    // The warm-up follows the scene (2026-09-22). Remembering a skip resolves
    // the scene on mount so the card is reachable without a 15 s wait.
    localStorage.setItem("tc-script-skip", "1");
    localStorage.setItem("tc_step_deep-orbit_introduction-to-tensors", "4");
    localStorage.setItem("tc_step_max_deep-orbit_introduction-to-tensors", "4");
  });
  await page.goto(REVIEW_LESSON);
  // The saved step is restored in a client effect, so the server HTML is
  // the Briefing. Clicking before the restore lands hit the Briefing's
  // Continue and recorded nothing (failed twice on Linux CI, 2026-10-25).
  // Legacy index 4 migrates to Takeaways, step 4 of 5.
  await expect(page.getByRole("group", { name: /^Step 4 of 5/ })).toBeVisible();
  await page
    .getByRole("button", { name: /continue|complete/i })
    .first()
    .click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Object.keys(
          JSON.parse(localStorage.getItem("tc_guest_reviews_v1") ?? "{}"),
        ),
      ),
    )
    .toContain("deep-orbit/foundations/introduction-to-tensors/0");
  await page.clock.setFixedTime(new Date(Date.now() + 2 * 86_400_000));
  await page.goto("/worlds/deep-orbit/foundations/tensor-shapes");
  // The scene resolves first; the card comes after it, never in front.
  await expect(page.locator("[data-script-state='done']")).toBeAttached();
  const warmup = page.getByRole("region", { name: /Warm-up, item 1 of/ });
  await expect(warmup).toBeVisible();
  const [titleTop, cardTop] = await Promise.all([
    page
      .getByRole("heading", { level: 1 })
      .boundingBox()
      .then((b) => b?.y),
    warmup.boundingBox().then((b) => b?.y),
  ]);
  expect(cardTop).toBeGreaterThan(titleTop ?? Infinity);
  const check = warmup.getByRole("button", {
    name: "Check answers",
    exact: true,
  });
  await expect(check).toBeDisabled();
  // Lesson 1's recall asks about Demir's 12 selected readings since content
  // fix 10 (2026-10-18), so the shape is [12]. The Deep Orbit layout
  // (clarity fix 14, 2026-10-12) sets "No" on its own line, so the radio's
  // accessible name has no comma.
  await warmup
    .getByRole("textbox", { name: "What is this tensor’s shape?" })
    .fill("[12]");
  await warmup
    .getByRole("radio", { name: "No it only creates a tensor." })
    .check();
  await check.click();
  await expect(warmup.getByRole("status")).toHaveText(
    "All answers are correct.",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("tc_guest_reviews_v1") ?? "{}")[
            "deep-orbit/foundations/introduction-to-tensors/0"
          ]?.successes,
      ),
    )
    .toBe(1);
  await warmup.getByRole("button", { name: "Continue to lesson" }).click();
  await expect(warmup).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: /Warm-up/ })).toHaveCount(0);
});
