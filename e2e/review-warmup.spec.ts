import { test, expect } from "@playwright/test";
import { REVIEW_LESSON } from "./review-fixture";

test("guest completion becomes a due warm-up the next day", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("tc-cookie-consent", "declined");
    localStorage.setItem("tc_step_deep-orbit_introduction-to-tensors", "4");
    localStorage.setItem("tc_step_max_deep-orbit_introduction-to-tensors", "4");
  });
  await page.goto(REVIEW_LESSON);
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
  const warmup = page.getByRole("region", { name: /Warm-up, item 1 of/ });
  await expect(warmup).toBeVisible();
  await expect(page.locator("[data-script-state='idle']")).toBeAttached();
  const check = warmup.getByRole("button", { name: "Check", exact: true });
  await expect(check).toBeDisabled();
  await warmup.getByRole("textbox").fill("Numeric data with a shape");
  await check.click();
  await warmup.getByRole("button", { name: "Got it", exact: true }).click();
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
  await expect(page.locator("[data-script-state='idle']")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: /Warm-up/ })).toHaveCount(0);
});
