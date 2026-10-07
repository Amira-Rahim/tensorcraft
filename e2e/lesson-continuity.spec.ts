import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
    await expect(
      page
        .locator(".lesson-story-grid")
        .getByText(
          /You will work alongside Demir, the crew's JavaScript engineer/,
        ),
    ).toBeVisible();
    const header = await page
      .getByTestId("lesson-briefing-header")
      .boundingBox();
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
    const dialogue = (await page
      .locator(".lesson-story-grid [data-dialogue]")
      .first()
      .boundingBox())!;
    expect(contextBox.y + contextBox.height).toBeLessThan(picture.y);
    expect(contextBox.y + contextBox.height).toBeLessThan(dialogue.y);
    const takeaway = page.getByTestId("briefing-takeaway");
    await expect(takeaway).toHaveCount(1);
    await expect(takeaway).toBeVisible();
    await expect(takeaway).toContainText(
      "A tensor is a container for numbers.",
    );
    await expect(takeaway).toContainText(
      "You will create a tensor from these five readings.",
    );
    await expect(takeaway.locator("code")).toHaveText(
      "[0.12, 0.94, 0.31, 0.88, 0.47]",
    );
    const takeawayBox = (await takeaway.boundingBox())!;
    const storyBox = (await page.locator(".lesson-story-grid").boundingBox())!;
    expect(takeawayBox.y).toBeGreaterThanOrEqual(storyBox.y + storyBox.height);
    expect(takeawayBox.width).toBe(contextBox.width);
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
    await page.getByRole("button", { name: "Continue →", exact: true }).click();
    await expect(orientation).toHaveCount(0);
    await expect(takeaway).toHaveCount(0);
    const instrument = page.locator(".lesson-instrument");
    await expect(page.locator(".lesson-workbench-introduction")).toContainText(
      "A tensor is a container for numbers",
    );
    const preview = instrument.getByRole("button", {
      name: "Preview tensor creation",
    });
    await expect(preview).toHaveAttribute("aria-expanded", "false");
    await preview.focus();
    await page.keyboard.press("Space");
    await expect(instrument.getByRole("status")).toContainText(
      "Same readings, same order",
    );
    await expect(
      instrument.getByText("shape [5]", { exact: true }),
    ).toBeVisible();
    await expect(
      instrument.getByRole("list", { name: "TensorFlow.js tensor: reading" }),
    ).toHaveText(
      await instrument
        .getByRole("list", { name: "Your JavaScript array: streamValues" })
        .innerText(),
      { useInnerText: true },
    );
    await expect(
      page.getByText("prepare-readings.js", { exact: true }),
    ).toBeVisible();
    const reference = page.locator("details").filter({
      has: page.getByText("Reading values and cleanup", { exact: true }),
    });
    await expect(reference).not.toHaveAttribute("open");
    const goals = page.locator(".lesson-goals");
    await expect(goals).not.toHaveAttribute("open");
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
    await reference.locator("summary").click();
    await expect(reference.getByText(/This small exercise uses/)).toBeVisible();
    await goals.locator("summary").click();
    await expect(page.getByTestId("concept-intro")).toBeVisible();
    await page.getByRole("button", { name: "Continue →", exact: true }).click();
    await expect(page.getByTestId("exercise-brief")).toContainText(
      "five readings",
    );
    await expect(page.getByTestId("mission-handoff")).toContainText(
      "same five values",
    );
    await expect(page.getByTestId("challenge-passed-banner")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Step 5: Epilogue", exact: true }),
    ).toBeDisabled();
  });
}
