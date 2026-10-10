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
    const pane = page.locator("[data-exercise-workspace]");
    const brief = pane.getByTestId("exercise-brief");
    const codeFrame = pane.locator("[data-editor-frame]");
    const editor = codeFrame.locator(".cm-content");
    const line = (n: number) => editor.locator(".cm-line").nth(n - 1);

    // Measured before anything scrolls: line 3 is on the first screen.
    await expect(line(3)).toBeAttached({ timeout: 30_000 });
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
    if (width === 1440) {
      const line3Bottom = await line(3).evaluate(
        (el) => el.getBoundingClientRect().bottom + window.scrollY,
      );
      expect(line3Bottom).toBeLessThanOrEqual(900);
    }

    await codeFrame.scrollIntoViewIfNeeded();
    await expect(editor).toBeVisible();
    await expect(brief).toBeVisible();
    await expect(
      workspace.getByRole("heading", {
        name: "Prepare the Five Readings",
        exact: true,
      }),
    ).toHaveCount(1);
    await expect(brief.getByRole("heading", { level: 3 })).toHaveText(
      "Finish lines 3 and 4",
    );
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

    const headerBox = (await mission.boundingBox())!;
    const gridBox = (await page.getByTestId("lesson-grid").boundingBox())!;
    const briefBox = (await brief.boundingBox())!;
    const codeBox = (await codeFrame.boundingBox())!;
    const checksBox = (await page.locator(".challenge-checks").boundingBox())!;
    expect(headerBox.width).toBeGreaterThanOrEqual(gridBox.width);
    expect(gridBox.width).toBeLessThanOrEqual(1440);
    expect(headerBox.y + headerBox.height).toBeLessThan(gridBox.y);
    // The brief heads the code: the frame starts where the brief ends.
    expect(codeBox.y).toBeGreaterThanOrEqual(briefBox.y + briefBox.height - 1);
    expect(codeBox.y - (briefBox.y + briefBox.height)).toBeLessThanOrEqual(1);
    if (width === 1440) expect(briefBox.height).toBeLessThanOrEqual(230);
    if (width === 390) expect(briefBox.height).toBeLessThanOrEqual(360);
    if (width >= 1024) {
      expect(codeBox.x + codeBox.width).toBeLessThanOrEqual(checksBox.x + 1);
      expect(codeBox.width).toBeLessThan(910);
      expect(checksBox.width).toBeGreaterThan(300);
    } else {
      expect(checksBox.y).toBeGreaterThanOrEqual(codeBox.y + codeBox.height);
    }

    // Each key names a line the editor marks, and both nulls are framed.
    await expect(brief.getByRole("button", { name: /^Line \d+$/ })).toHaveText([
      "Line 3",
      "Line 4",
    ]);
    await expect(
      codeFrame.locator(".cm-gutterElement.cm-task-line"),
    ).toHaveText(["3", "4"]);
    await expect(codeFrame.locator(".cm-task-slot")).toHaveText([
      "null",
      "null",
    ]);
    if (width === 390) {
      // Each step's code stays within a keyboard-open screen of its line.
      for (const [index, n] of [
        [0, 3],
        [1, 4],
      ] as const) {
        const chipTop = await brief
          .locator("code.challenge-stop-code")
          .nth(index)
          .evaluate((el) => el.getBoundingClientRect().top);
        const lineBottom = await line(n).evaluate(
          (el) => el.getBoundingClientRect().bottom,
        );
        expect(lineBottom - chipTop).toBeLessThanOrEqual(320);
      }
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
    const scroller = codeFrame.locator(".cm-scroller");
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

    // A Line key selects its null; typing replaces it and quiets the stop.
    await brief.getByRole("button", { name: "Line 3" }).click();
    await expect(editor).toBeFocused();
    await page.keyboard.insertText("tf.tensor(streamValues)");
    // The key selected exactly the null: typing replaced it and nothing else.
    await expect(line(3)).toHaveText(
      "const reading = tf.tensor(streamValues);",
    );
    await expect(
      brief.locator(".challenge-stops > li").first(),
    ).toHaveAttribute("data-stop-state", "typed");
    await expect(codeFrame.locator(".cm-task-slot")).toHaveCount(1);
    // Reset replaces the whole document; the frames come back.
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(codeFrame.locator(".cm-task-slot")).toHaveText([
      "null",
      "null",
    ]);
    await expect(
      brief.locator(".challenge-stops > li").first(),
    ).toHaveAttribute("data-stop-state", "waiting");

    // Help opens under the code and leaves the code where it was.
    const codeTop = () =>
      editor.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const before = await codeTop();
    await page.getByRole("button", { name: "Get a nudge" }).focus();
    await page.keyboard.press("Enter");
    const rungs = page.locator(".challenge-hints");
    await expect(rungs.locator("[tabindex='-1']")).toBeFocused();
    await expect(rungs.getByRole("status")).toHaveText("Nudge revealed.");
    // The rung reads as prose in the brief's face; only its code is mono.
    const face = (el: Element) =>
      getComputedStyle(el).fontFamily.split(",")[0].trim();
    const sans = await brief
      .locator(".challenge-brief-note p")
      .first()
      .evaluate(face);
    const mono = await brief
      .locator("code.challenge-stop-code")
      .first()
      .evaluate(face);
    expect(sans).not.toBe(mono);
    const rungText = rungs.locator(".challenge-hint-content p").first();
    expect(await rungText.evaluate(face)).toBe(sans);
    expect(await rungText.locator("code").first().evaluate(face)).toBe(mono);
    await expect(
      page.getByRole("button", { name: "Get more guidance" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reveal solution" }),
    ).toHaveCount(0);
    expect(Math.abs((await codeTop()) - before)).toBeLessThanOrEqual(1);

    // Returning from the concept lands at the whole mission, including
    // the scene above the task, instead of scrolling straight past it.
    await page
      .getByRole("button", { name: "Step 2: Concept", exact: true })
      .click();
    await page.getByRole("button", { name: "Continue →", exact: true }).click();
    await expect(workspace).toBeFocused();
    await expect(mission).toBeInViewport({ ratio: 0.8 });

    // A resize does not switch between hidden instruction and editor views.
    // The learner's in-progress code remains in the same mounted editor.
    await codeFrame.scrollIntoViewIfNeeded();
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
