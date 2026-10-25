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
    // Story first (CLAUDE.md, binding since 2026-10-15). Since content fix 1
    // (4b379453) the mission scene sits under the step's "Challenge"
    // heading, before the task. It replaced the compact mission header that
    // carried the exercise title.
    const chapter = workspace.getByRole("heading", {
      name: "Challenge",
      exact: true,
    });
    const mission = workspace.getByRole("region", { name: "Mission scene" });
    const story = mission.getByTestId("mission-handoff");
    const pane = page.locator("[data-exercise-workspace]");
    const brief = pane.getByTestId("exercise-brief");
    const codeFrame = pane.locator("[data-editor-frame]");
    const editor = codeFrame.locator(".cm-content");
    const line = (n: number) => editor.locator(".cm-line").nth(n - 1);

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
    // Measured before anything scrolls: the scene's story is on the first
    // screen. The editor follows the scene and the brief, so line 3 no
    // longer fits there by design (deep-orbit-lessons.css: "Read the
    // mission and instructions before reaching the full-width editor").
    if (width === 1440) {
      const storyBottom = await story.evaluate(
        (el) => el.getBoundingClientRect().bottom + window.scrollY,
      );
      expect(storyBottom).toBeLessThanOrEqual(900);
    }

    await codeFrame.scrollIntoViewIfNeeded();
    await expect(editor).toBeVisible();
    await expect(brief).toBeVisible();
    // The step's one visible section heading orients the reader, and the
    // scene follows it directly.
    await expect(chapter).toHaveCount(1);
    await expect(chapter).toBeVisible();
    expect(
      await chapter.evaluate(
        (el) => el.nextElementSibling?.getAttribute("aria-label") ?? null,
      ),
    ).toBe("Mission scene");
    await expect(brief.getByRole("heading", { level: 3 })).toHaveText(
      "Finish lines 3 and 4",
    );
    await expect(
      page.getByRole("group", { name: "Challenge view" }),
    ).toHaveCount(0);
    await expect(page.getByTestId("bridge-hint")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Pass 1 more exercise to continue" }),
    ).toBeDisabled();

    const chapterBox = (await chapter.boundingBox())!;
    const sceneBox = (await mission.boundingBox())!;
    const gridBox = (await page.getByTestId("lesson-grid").boundingBox())!;
    const paneBox = (await page.getByTestId("lesson-right").boundingBox())!;
    const briefBox = (await brief.boundingBox())!;
    const codeBox = (await codeFrame.boundingBox())!;
    const checksBox = (await page.locator(".challenge-checks").boundingBox())!;
    // Every step shares one full-width frame (705ee73e retired the 1,440 px
    // cap): the grid spans the viewport inside the page gutters
    // (--l-page-gutter, 48 px from 48rem and 20 px below), and the scene
    // spans the grid.
    const gutter = width >= 768 ? 48 : 20;
    expect(Math.abs(gridBox.width - (width - 2 * gutter))).toBeLessThanOrEqual(
      1,
    );
    expect(Math.abs(sceneBox.width - gridBox.width)).toBeLessThanOrEqual(1);
    // Story first, then the task: heading, scene, brief, code, checks, in
    // the spacing hierarchy of deep-orbit-lessons.css (audit 2026-10-18).
    // Related content sits 24 px apart (20 px below 40rem), and the task
    // column ends one major section gap (48 px, 32 px below 40rem) above
    // the editor pane.
    const contentGap = width >= 640 ? 24 : 20;
    const sectionGap = width >= 640 ? 48 : 32;
    expect(
      Math.abs(sceneBox.y - (chapterBox.y + chapterBox.height) - contentGap),
    ).toBeLessThanOrEqual(1);
    expect(sceneBox.y + sceneBox.height).toBeLessThan(paneBox.y);
    const taskBox = (await page
      .getByTestId("lesson-grid")
      .locator(":scope > div")
      .first()
      .boundingBox())!;
    expect(
      Math.abs(paneBox.y - (taskBox.y + taskBox.height) - sectionGap),
    ).toBeLessThanOrEqual(1);
    // The brief heads the code: the frame starts where the brief ends, in
    // the same column.
    expect(codeBox.y).toBeGreaterThanOrEqual(briefBox.y + briefBox.height - 1);
    expect(codeBox.y - (briefBox.y + briefBox.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(codeBox.x - briefBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(codeBox.width - briefBox.width)).toBeLessThanOrEqual(1);
    // Brief, editor and checks use one vertical flow at every width
    // (clarity fix 17, 2fc52d2f): the checks sit under the code, as wide.
    expect(checksBox.y).toBeGreaterThanOrEqual(codeBox.y + codeBox.height - 1);
    expect(Math.abs(checksBox.x - codeBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(checksBox.width - codeBox.width)).toBeLessThanOrEqual(1);

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

    // The learner turns this recording excerpt into a tensor. Its readings
    // arrive in the editor's first line, in recorded order (content fix 10,
    // 32022a1b, replaced the five-reading Expected tensor panel). Until a
    // run, the checks column only invites one.
    await expect(line(1)).toHaveText(
      "const streamValues = [2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9];",
    );
    await expect(
      page.getByRole("complementary", { name: "Test results", exact: true }),
    ).toHaveText("Run Tests to see your result and check your code.");
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

    // On a phone each key is the route from a step to its line. The stacked
    // brief (clarity fix 17, 2fc52d2f) sets each step's code farther above
    // its line than a keyboard-open screen, so the key itself must bring
    // the line on screen with exactly its null selected.
    if (width === 390) {
      await brief.getByRole("button", { name: "Line 4" }).click();
      await expect(editor).toBeFocused();
      await expect(line(4)).toBeInViewport();
      expect(
        await page.evaluate(() => document.getSelection()?.toString()),
      ).toBe("null");
    }
    // A Line key selects its null; typing replaces it and quiets the stop.
    await brief.getByRole("button", { name: "Line 3" }).click();
    await expect(editor).toBeFocused();
    if (width === 390) await expect(line(3)).toBeInViewport();
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

    // Returning from the concept lands at the start of the mission instead
    // of scrolling straight past it to the editor. The scene's artwork now
    // spans the frame, so on desktop the whole scene is taller than the
    // screen: its heading and its story are fully on screen, and the scene
    // begins there.
    await page
      .getByRole("button", { name: "Step 2: Concept", exact: true })
      .click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(workspace).toBeFocused();
    await expect(chapter).toBeInViewport({ ratio: 1 });
    await expect(story).toBeInViewport({ ratio: 1 });
    await expect(mission).toBeInViewport();

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
