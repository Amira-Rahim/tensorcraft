import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const [width, scheme] of [
  [1440, "dark"],
  [390, "light"],
  [320, "dark"],
] as const) {
  test(`keeps equal readings distinct across layouts at ${width}px ${scheme}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
      localStorage.setItem("tc_step_v2_deep-orbit_tensor-shapes", "1");
      localStorage.setItem("tc_step_max_v2_deep-orbit_tensor-shapes", "1");
    });
    await page.goto("/worlds/deep-orbit/foundations/tensor-shapes");
    const activity = page.getByTestId("channel-layout-experiment");
    await expect(activity).toBeVisible();
    await expect(activity.getByTestId("time-grid")).toHaveCount(0);
    await activity
      .getByLabel("Which four readings go in the second row?")
      .fill("3, 18, 7, 8");
    await activity
      .getByRole("button", { name: "Check prediction", exact: true })
      .click();
    await activity
      .getByRole("button", { name: "Run reshape", exact: true })
      .click();
    const result = activity.getByTestId("channel-result");
    const secondEight = result.getByRole("button", {
      name: /Time 2, flat index 7/,
    });
    await secondEight.focus();
    await page.keyboard.press("Enter");
    await expect(activity.getByTestId("reading-position")).toContainText(
      "Sensor D recorded 8 at Time 2",
    );
    await expect(
      activity.getByTestId("transformed-reading-position"),
    ).toContainText("row 2, column 1");
    await expect(activity.getByRole("img")).toHaveAccessibleName(
      /Selected reading: 8 at Time 2/,
    );
    await activity
      .getByRole("button", { name: "Run transpose", exact: true })
      .click();
    await expect(
      activity.getByTestId("transformed-reading-position"),
    ).toContainText("row 3, column 1");
    const firstEight = result.getByRole("button", {
      name: /Time 1, flat index 3/,
    });
    await firstEight.focus();
    await page.keyboard.press("Enter");
    await expect(activity.getByTestId("reading-position")).toContainText(
      "Sensor D recorded 8 at Time 1",
    );
    await expect(
      activity.getByTestId("transformed-reading-position"),
    ).toContainText("row 3, column 0");
    await expect(
      activity.locator('td[data-selected-reading="true"]'),
    ).toHaveCount(2);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-testid="channel-layout-experiment"]')
          .analyze()
      ).violations,
    ).toEqual([]);
    await result.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath(`linked-reading-${width}-${scheme}.png`),
    });
    await page.reload();
    await expect(activity.getByLabel("Follow a sensor")).toHaveValue("3");
    await expect(
      activity.getByRole("button", { name: "Run transpose", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  });
}

for (const [width, scheme] of [
  [1440, "dark"],
  [390, "dark"],
  [320, "light"],
] as const) {
  test(`one packet from visual to practice at ${width}px ${scheme}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() =>
      localStorage.setItem("tc-cookie-consent", "declined"),
    );
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");
    const orientation = page.getByTestId("course-orientation");
    await expect(orientation).toBeVisible();
    await expect(orientation).toContainText("machine learning in JavaScript");
    await expect(orientation).toContainText("program trained on examples");
    // Since 2026-10-14 the Deep Orbit briefing tells its story (passages and
    // dialogue) in .briefing-story-intro above the plate. The 2026-10-18
    // rewrite replaced "You will work alongside Demir, the crew's JavaScript
    // engineer" with a story passage that hands Demir's problem to the learner.
    const story = page.locator(".briefing-story-intro");
    await expect(
      story.locator("p[data-story-passage]").filter({
        hasText: "He needs your help to turn that array into a tensor.",
      }),
    ).toBeVisible();
    const header = await page.getByTestId("lesson-title-header").boundingBox();
    const chrome = await page.getByTestId("lesson-chrome").boundingBox();
    const gutter = width >= 768 ? 48 : 20;
    expect(header!.x).toBe(gutter);
    expect(header!.width).toBe(width - 2 * gutter);
    expect(chrome!.width).toBe(header!.width);
    const context = page.getByTestId("scene-context");
    await expect(context).toContainText("Its existing software, ARIA");
    await expect(context).toHaveCSS("font-style", "normal");
    const contextBox = (await context.boundingBox())!;
    const picture = (await page.getByTestId("scene-portrait").boundingBox())!;
    const dialogue = (await story
      .locator("[data-dialogue]")
      .first()
      .boundingBox())!;
    expect(contextBox.y + contextBox.height).toBeLessThan(picture.y);
    expect(contextBox.y + contextBox.height).toBeLessThan(dialogue.y);
    // Since 2026-10-14 the takeaway is two full-width asides after the
    // story and its picture: the key idea, then the first task with Demir's
    // 12 selected readings (2026-10-18), the same packet the Concept runs.
    const takeaway = page.getByTestId("briefing-takeaway");
    await expect(takeaway).toHaveCount(2);
    const idea = page.getByRole("complementary", { name: "Key idea" });
    const task = page.getByRole("complementary", { name: "Your first task" });
    await expect(idea).toHaveAttribute("data-part", "idea");
    await expect(task).toHaveAttribute("data-part", "task");
    await expect(idea).toBeVisible();
    await expect(task).toBeVisible();
    await expect(idea).toContainText(
      "A tensor holds numbers in a form TensorFlow.js can calculate with.",
    );
    await expect(task).toContainText(
      "Create a tensor from his selected readings, then run the code to see one line per sensor.",
    );
    // The array's brackets and commas are aria-hidden decoration, so the
    // accessibility tree holds exactly the 12 values in recording order.
    await expect(
      task.getByRole("list", { name: "Readings in array order" }),
    ).toMatchAriaSnapshot(
      [
        '- list "Readings in array order":',
        ...[2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9].map(
          (reading) => `  - listitem: "${reading}"`,
        ),
      ].join("\n"),
    );
    const ideaBox = (await idea.boundingBox())!;
    const taskBox = (await task.boundingBox())!;
    const storyBox = (await story.boundingBox())!;
    expect(ideaBox.y).toBeGreaterThanOrEqual(storyBox.y + storyBox.height);
    expect(ideaBox.y).toBeGreaterThanOrEqual(picture.y + picture.height);
    expect(taskBox.y).toBeGreaterThanOrEqual(ideaBox.y + ideaBox.height);
    expect(ideaBox.width).toBe(contextBox.width);
    expect(taskBox.width).toBe(contextBox.width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(
      (await new AxeBuilder({ page }).include("[data-script-state]").analyze())
        .violations,
    ).toEqual([]);
    await page.evaluate(async () => {
      await document.fonts.ready;
      (document.activeElement as HTMLElement)?.blur();
    });
    await page.screenshot({
      path: testInfo.outputPath(`briefing-${width}-${scheme}.png`),
      fullPage: true,
    });
    // The lesson nav button reads "Continue" with no arrow since 2026-10-19.
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(orientation).toHaveCount(0);
    await expect(takeaway).toHaveCount(0);
    // Since 2026-10-18 the Concept workbench runs the same 12 readings
    // through TensorFlow.js and charts them with the supplied code.
    const instrument = page.locator(".lesson-instrument");
    await expect(instrument).toContainText("Demir’s selected readings");
    await expect(instrument).toContainText(
      "These are the same selected sensors and moments you’ll work with in the challenge.",
    );
    await expect(instrument).toContainText("Demir");
    const chart = instrument.getByRole("region", {
      name: "Chart from this example",
    });
    await expect(chart).toHaveCount(0);
    await expect(page.locator(".lesson-workbench-introduction")).toContainText(
      "Demir wants to see how each sensor’s readings change over time.",
    );
    const goals = page.locator(".lesson-goals");
    await expect(
      goals.getByRole("heading", {
        name: "Learning goals for this mission",
      }),
    ).toBeVisible();
    await expect(goals.getByRole("listitem")).toHaveCount(3);
    await expect(page.getByTestId("concept-intro")).toBeVisible();
    const goalsBox = (await goals.boundingBox())!;
    const activityBox = (await instrument.boundingBox())!;
    expect(goalsBox.y + goalsBox.height).toBeLessThanOrEqual(activityBox.y);
    expect(goalsBox.width).toBe(activityBox.width);
    // The worked example holds the briefing's readings in their array order.
    await expect(instrument.locator("pre")).toContainText(
      /const streamValues = \[\s*2, 20, 5, 8,\s*3, 18, 7, 8,\s*4, 16, 6, 9,\s*\];/,
    );
    // "Run example" (2026-10-19) has no expanded state, unlike the old
    // "Create tensor" toggle. The result appears below it after the run.
    const preview = instrument.getByRole("button", {
      name: "Run example",
      exact: true,
    });
    await expect(preview).toBeEnabled();
    await preview.focus();
    await page.keyboard.press("Space");
    await expect(chart.getByRole("status")).toHaveText("From your latest run");
    const shapeResult = instrument.getByText(
      "The example’s tensor has shape [12]: one axis holding 12 values. The supplied chart code groups those readings into 4 lines, one for each sensor.",
    );
    await expect(shapeResult).toBeVisible();
    await expect(instrument).toContainText(
      "Next, Farah will help you write the code that keeps each sensor’s readings together.",
    );
    // Keyboard users keep their place on the control they activated.
    await expect(preview).toBeFocused();
    await expect(shapeResult).toBeInViewport({ ratio: 0.85 });
    await expect(
      page.getByRole("heading", { name: "What the example shows" }),
    ).toBeVisible();
    // The chart's values come back from the tensor, one series per sensor:
    // each row is one selected moment, in the recording's sensor order.
    await chart.getByText("Read the values", { exact: true }).click();
    await expect(chart.getByRole("columnheader")).toHaveText([
      "Selected moment",
      "Sensor A",
      "Sensor B",
      "Sensor C",
      "Sensor D",
    ]);
    await expect(chart.getByRole("cell")).toHaveText([
      ...["1", "2", "20", "5", "8"],
      ...["2", "3", "18", "7", "8"],
      ...["3", "4", "16", "6", "9"],
    ]);
    await expect(
      page.getByText("prepare-readings.js", { exact: true }),
    ).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).include(".lesson-concept").analyze())
        .violations,
    ).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.evaluate(async () => {
      await document.fonts.ready;
      (document.activeElement as HTMLElement)?.blur();
      window.scrollTo(0, 0);
    });
    await page.screenshot({
      path: testInfo.outputPath(`concept-${width}-${scheme}.png`),
      fullPage: true,
    });
    await testInfo.attach("page-size.json", {
      body: JSON.stringify(
        await page.evaluate(() => ({
          width: innerWidth,
          height: document.documentElement.scrollHeight,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        })),
      ),
      contentType: "application/json",
    });
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    // The challenge works on the same 12 readings (2026-10-18).
    await expect(page.getByTestId("exercise-brief")).toContainText(
      "Expect [12]: a list of 12 readings.",
      { timeout: 30_000 },
    );
    await expect(page.getByTestId("mission-handoff")).toContainText(
      "Help him turn the selected readings into a tensor and save its shape.",
    );
    await expect(page.getByTestId("challenge-passed-banner")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Step 5: Epilogue", exact: true }),
    ).toBeDisabled();
  });
}
