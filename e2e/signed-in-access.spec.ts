import { test, expect } from "@playwright/test";
import {
  assertLocalReviewReady,
  loginReviewAccount,
} from "./helpers/local-review";

test.beforeAll(async () => {
  await assertLocalReviewReady();
});

test("signed-in unpaid learner can open foundations but receives no paid editor or history", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.addInitScript(() =>
    localStorage.setItem("tc-cookie-consent", "declined"),
  );
  await loginReviewAccount(page, "jordan");
  await page.goto(
    "/worlds/deep-orbit/foundations/normalization?start=briefing",
  );
  await expect(page.getByTestId("lesson-frame")).toBeVisible();
  await expect(page).toHaveURL(/\/foundations\/normalization/);

  for (const [module, lesson] of [
    ["neural-networks", "building-a-network"],
    ["training-loop", "evaluating-deep-scan"],
  ]) {
    const response = await page.goto(`/worlds/deep-orbit/${module}/${lesson}`);
    await expect(page).toHaveURL(
      new RegExp(`/pricing\\?locked=deep-orbit&module=${module}`),
    );
    await expect(page.locator(".cm-content")).toHaveCount(0);
    const html = await response!.text();
    expect(html).not.toContain("Train DEEP SCAN, Then Read the Gap");
    expect(html).not.toContain("captureEvaluation({");
  }

  await page.goto("/dashboard/project");
  await expect(
    page.getByRole("heading", { name: "Building DEEP SCAN", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[aria-label="Saved network runs"]')).toHaveCount(
    0,
  );
  await expect(
    page.locator('[aria-label="Saved evaluation runs"]'),
  ).toHaveCount(0);
  await page.locator("summary").filter({ hasText: /^Data/ }).click();
  await expect(
    page.getByRole("region", { name: "Saved normalization runs" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("unpaid-project.png"),
    fullPage: true,
  });
});
