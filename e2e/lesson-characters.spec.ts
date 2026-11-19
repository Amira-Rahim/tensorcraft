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
  // The next stop is the speaker of Demir's request in the workbench. Its
  // .tensor-investigation-speaker wrapper was removed on 2026-10-14.
  await page.keyboard.press("Tab");
  await expect(
    page
      .locator(
        '.tensor-investigation-request [data-character-mention="Ensign Demir"]',
      )
      .first(),
  ).toBeFocused();
  await expect(tooltip).toContainText("Ensign Demir");
  await page.mouse.move(0, 0);
  await page.keyboard.press("Escape");

  // "Run example" (2026-10-19) replaced the old "Create tensor" control. The
  // story beat with Farah's mention left the run result on 2026-10-18, and
  // the result's closing line names Farah as plain text, so the mention
  // checked after the run is Farah in the reading that follows the workbench.
  await page.getByRole("button", { name: "Run example", exact: true }).click();
  await expect(
    page.locator(".lesson-instrument").getByRole("status"),
  ).toHaveText("From this supplied example run");
  await expect(
    page
      .locator(".lesson-instrument")
      .getByText(
        "The example’s tensor has shape [12]: one axis holding 12 values.",
      ),
  ).toBeVisible();
  await page
    .locator(
      '.lesson-step-content[data-layout="reading"] [data-character-mention="Dr. Farah"]:visible',
    )
    .first()
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
  // The lesson nav button reads "Continue" with no arrow since 2026-10-19.
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  // The challenge brief names no character since 2026-10-10. Since
  // 2026-10-15 the Challenge step's mention is "Demir" in the mission scene
  // (lesson-challenge-scene.tsx), which replaced the mission header.
  await page
    .getByTestId("challenge-scene")
    .locator("[data-character-mention]")
    .first()
    .hover();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("Ensign Demir");
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
  // Tapping plain content elsewhere closes the card. The workbench heading
  // now holds a Demir mention itself (2026-10-18), so tap the next heading.
  await page
    .getByRole("heading", { name: "Give the chart code its readings" })
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

for (const [width, colorScheme] of [
  [320, "light"],
  [390, "dark"],
  [1440, "light"],
  [1440, "dark"],
] as const) {
  test(`dialogue portraits fit at ${width}px in ${colorScheme} mode`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme });
    await page.goto(LESSON);
    const dialogue = page
      .locator('[data-dialogue][data-layout="speech"]')
      .first();
    await expect(dialogue).toBeVisible();
    const portrait = dialogue.getByTestId("animated-avatar");
    await expect(portrait).toHaveCSS("width", width < 650 ? "56px" : "64px");
    await expect
      .poll(() =>
        portrait
          .getByTestId("animated-avatar-base")
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBe(512);
    const name = dialogue.locator("[data-dialogue-speaker]");
    const portraitBox = await portrait.boundingBox();
    const nameBox = await name.boundingBox();
    expect(nameBox!.x).toBeGreaterThanOrEqual(
      portraitBox!.x + portraitBox!.width,
    );
    expect(nameBox!.x + nameBox!.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await dialogue.screenshot({
      path: testInfo.outputPath(`dialogue-${width}-${colorScheme}.png`),
    });
  });
}
