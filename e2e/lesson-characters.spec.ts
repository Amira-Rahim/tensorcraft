import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("tc-cookie-consent", "declined"),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("character portraits stay hoverable and keyboard accessible throughout a lesson", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${LESSON}?start=concept`);
  const demir = page.locator(
    '.lesson-workbench-introduction [data-character-mention="Ensign Demir"]',
  );
  const tooltip = page.getByRole("tooltip");
  await demir.hover();
  await expect(tooltip).toContainText("JavaScript engineer");
  await expect
    .poll(() =>
      tooltip
        .getByRole("img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await tooltip.hover();
  await expect(tooltip).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("character-desktop.png") });
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
  await demir.focus();
  await expect(tooltip).toBeVisible();
  await expect(demir).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(demir).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page
      .locator(
        '.tensor-investigation-speaker [data-character-mention="Ensign Demir"]',
      )
      .first(),
  ).toBeFocused();
  await expect(tooltip).toContainText("Ensign Demir");
  await page.mouse.move(0, 0);
  await page.keyboard.press("Escape");

  await page
    .getByRole("button", { name: "Create tensor", exact: true })
    .click();
  await expect(
    page.locator(".lesson-instrument").getByRole("status"),
  ).toContainText("All 5 readings match");
  await page
    .locator(
      '.tensor-investigation-consequence [data-character-mention="Dr. Farah"]',
    )
    .hover();
  await expect(tooltip).toContainText("astrophysicist");
  expect(
    (
      await new AxeBuilder({ page })
        .include(".lesson-concept")
        .include('[role="tooltip"]')
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Continue →", exact: true }).click();
  // The challenge brief names no character since 2026-10-10; the mission
  // header's "Demir" is the Challenge step's mention.
  await page
    .locator(".challenge-mission-header [data-character-mention]")
    .first()
    .hover();
  await expect(tooltip).toBeVisible();
  await expect(
    page.locator(
      "pre [data-character-mention], code [data-character-mention], a [data-character-mention], button button",
    ),
  ).toHaveCount(0);
});

test("character cards fit a narrow touch screen in light mode", async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 740 },
    hasTouch: true,
    isMobile: true,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.addInitScript(() =>
    localStorage.setItem("tc-cookie-consent", "declined"),
  );
  await page.goto(`${LESSON}?start=concept`);
  const demir = page.locator(
    '.lesson-workbench-introduction [data-character-mention="Ensign Demir"]',
  );
  const tooltip = page.getByRole("tooltip");
  await demir.tap();
  await expect(tooltip).toBeVisible();
  const bounds = await tooltip.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(12);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(308);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(740);
  await page.screenshot({ path: testInfo.outputPath("character-mobile.png") });
  expect(
    (
      await new AxeBuilder({ page })
        .include(".lesson-concept")
        .include('[role="tooltip"]')
        .analyze()
    ).violations,
  ).toEqual([]);
  await demir.tap();
  await expect(tooltip).toHaveCount(0);
  await demir.tap();
  await page
    .getByRole("heading", { name: "Prepare the readings for TensorFlow.js" })
    .tap();
  await expect(tooltip).toHaveCount(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await context.close();
});

for (const slug of ["tensor-shapes", "tensor-operations"]) {
  test(`shared character mentions work in ${slug}`, async ({ page }) => {
    await page.goto(`/worlds/deep-orbit/foundations/${slug}?start=concept`);
    const mention = page
      .locator(".mission-context-narrative [data-character-mention]")
      .first();
    await mention.hover();
    await expect(page.getByRole("tooltip").getByRole("img")).toBeVisible();
    await expect(page.getByRole("tooltip")).toContainText(
      (await mention.textContent()) ?? "",
    );
  });
}
