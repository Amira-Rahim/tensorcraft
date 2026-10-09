import path from "node:path";
import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";
const SCREENSHOT_STYLE = readFileSync(
  path.join(__dirname, "visual/screenshot.css"),
  "utf8",
);

for (const [width, scheme] of [
  [1920, "light"],
  [1440, "dark"],
  [1024, "dark"],
  [390, "dark"],
  [320, "light"],
] as const) {
  test(`tensor challenge stays connected at ${width}px ${scheme}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
      localStorage.setItem(
        "tc_step_v2_deep-orbit_introduction-to-tensors",
        "2",
      );
      localStorage.setItem(
        "tc_step_max_v2_deep-orbit_introduction-to-tensors",
        "2",
      );
    });
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });
    const workspace = page.locator(".lesson-challenge-workspace");
    const mission = workspace.locator(".challenge-mission-header");
    const brief = page.getByTestId("exercise-brief");
    const editorFrame = page.locator("[data-exercise-workspace]");
    const editor = editorFrame.locator(".cm-content");
    await editorFrame.scrollIntoViewIfNeeded();
    await expect(editor).toBeVisible();
    await expect(brief).toBeVisible();
    await expect(
      workspace.getByRole("heading", {
        name: "Prepare the Five Readings",
        exact: true,
      }),
    ).toHaveCount(1);
    await expect(
      workspace.getByRole("heading", { name: "Challenge", exact: true }),
    ).toBeHidden();
    await expect(
      page.getByRole("group", { name: "Challenge view" }),
    ).toHaveCount(0);
    await expect(page.getByTestId("bridge-hint")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Pass 1 more exercise to continue" }),
    ).toBeDisabled();

    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect
      .poll(() =>
        mission
          .locator("img")
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
      )
      .toBe(true);
    const headerBox = (await mission.boundingBox())!;
    const gridBox = (await page.getByTestId("lesson-grid").boundingBox())!;
    const briefBox = (await brief.boundingBox())!;
    const editorBox = (await editorFrame.boundingBox())!;
    expect(headerBox.width).toBeGreaterThanOrEqual(gridBox.width);
    expect(gridBox.width).toBeLessThanOrEqual(1440);
    expect(headerBox.y + headerBox.height).toBeLessThan(gridBox.y);
    expect(editorBox.y).toBeGreaterThan(briefBox.y + briefBox.height);
    const codeBox = (await editorFrame
      .locator("[data-editor-frame]")
      .boundingBox())!;
    const checksBox = (await page.locator(".challenge-checks").boundingBox())!;
    if (width >= 1024) {
      expect(codeBox.x + codeBox.width).toBeLessThanOrEqual(checksBox.x + 1);
      expect(codeBox.width).toBeLessThan(910);
      expect(checksBox.width).toBeGreaterThan(300);
    } else {
      expect(checksBox.y).toBeGreaterThanOrEqual(codeBox.y + codeBox.height);
    }
    await expect(
      page
        .getByRole("list", { name: "Expected sensor readings" })
        .getByRole("listitem"),
    ).toHaveText(["0.12", "0.94", "0.31", "0.88", "0.47"]);
    await expect(page.getByText("3 / 5", { exact: true })).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const scroller = editorFrame.locator(".cm-scroller");
    expect(
      await scroller.evaluate((el) => el.scrollWidth - el.clientWidth),
    ).toBeLessThanOrEqual(1);
    expect(
      (
        await new AxeBuilder({ page })
          .include(".lesson-challenge-workspace")
          .analyze()
      ).violations,
    ).toEqual([]);

    await page.screenshot({
      path: testInfo.outputPath(`challenge-${width}-${scheme}.png`),
      fullPage: true,
      style: SCREENSHOT_STYLE,
    });

    // Help reveals its first useful content in one keyboard action.
    const hint = page.locator(".challenge-hints");
    await hint.getByRole("button", { name: "Get a nudge" }).focus();
    await page.keyboard.press("Enter");
    await expect(hint.locator("[tabindex='-1']")).toBeFocused();
    await expect(hint.getByRole("status")).toHaveText("Nudge revealed.");
    await expect(
      hint.getByRole("button", { name: "Get more guidance" }),
    ).toBeVisible();
    await expect(
      hint.getByRole("button", { name: "Reveal solution" }),
    ).toHaveCount(0);

    // Returning from the concept lands at the whole mission, including
    // the scene above the task, instead of scrolling straight past it.
    await page
      .getByRole("button", { name: "Step 2: Concept", exact: true })
      .click();
    await page.getByRole("button", { name: "Continue →", exact: true }).click();
    await expect(workspace).toBeFocused();
    await expect(mission).toBeInViewport({ ratio: 0.8 });

    // A resize no longer switches between hidden instruction/editor views.
    // The learner's in-progress code remains in the same mounted editor.
    await editorFrame.scrollIntoViewIfNeeded();
    await editor.fill("// My tensor draft\nconst reading = null;");
    await page.setViewportSize({
      width: width >= 1024 ? 390 : 1440,
      height: 900,
    });
    await expect(editor).toHaveCount(1);
    await expect(editor).toBeVisible();
    await expect(brief).toBeVisible();
    await expect(editor).toContainText("// My tensor draft");
  });
}
