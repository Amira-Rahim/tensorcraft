import { expect, test } from "@playwright/test";
import {
  assertLocalReviewReady,
  loginReviewAccount,
} from "./helpers/local-review";

const lessonPath = "/worlds/deep-orbit/foundations/normalization";

test.use({
  reducedMotion: "no-preference",
  viewport: { width: 1440, height: 1000 },
});

test("signed-in free lesson plays its story before the learner advances", async ({
  page,
}, testInfo) => {
  await assertLocalReviewReady();
  await page.addInitScript(() => {
    localStorage.setItem("tc-cookie-consent", "declined");
  });
  await loginReviewAccount(page, "jordan", lessonPath);

  const lesson = page.locator(".lesson-page");
  const script = page.locator("[data-script-state]");
  const notes = page.locator("[data-scene-notes]");
  const art = page.getByRole("img", {
    name: /bridge holo table squeezes four mismatched sensor traces/,
  });
  const continueButton = page
    .getByTestId("lesson-nav")
    .getByRole("button", { name: "Continue", exact: true });

  await test.step("normal motion progressively reveals the opening scene", async () => {
    await expect(lesson).toHaveAttribute("data-step", "Briefing");
    await expect(script).toHaveAttribute("data-script-state", "playing");
    await expect(script).toHaveAttribute("aria-busy", "true");
    await expect(page.getByTestId("scene-context")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /skip intro/i }),
    ).toBeVisible();
    await expect(notes).toBeHidden();
    await expect(page.locator(".cm-content")).toHaveCount(0);
    expect(
      await page.evaluate(() => localStorage.getItem("tc-script-skip")),
    ).toBeNull();

    const counts: number[] = [];
    const deadline = Date.now() + 45_000;
    while ((await script.getAttribute("data-script-state")) === "playing") {
      counts.push(await script.locator("[data-beat-shown]").count());
      if (Date.now() > deadline)
        throw new Error("The opening scene did not finish.");
      await page.waitForTimeout(500);
    }
    expect(counts.length).toBeGreaterThan(2);
    expect(Math.max(...counts)).toBeGreaterThan(Math.min(...counts));
    for (let index = 1; index < counts.length; index++) {
      expect(counts[index]).toBeGreaterThanOrEqual(counts[index - 1]!);
    }
    await expect(script).toHaveAttribute("data-script-state", "done");
    await expect(notes).toBeVisible();
    await expect(art).toBeVisible();
    await expect
      .poll(() =>
        art.evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect(
      page.getByText(
        "Before the deep scan runs, normalize every sensor feed. One scale, no exceptions.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(lesson).toHaveAttribute("data-step", "Briefing");
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(200);
    await page.screenshot({
      path: testInfo.outputPath("normalization-story-default.png"),
      fullPage: true,
    });
  });

  await test.step("replay remains available and advancing is an explicit learner action", async () => {
    await page.getByRole("button", { name: /replay scene/i }).click();
    await expect(script).toHaveAttribute("data-script-state", "playing");
    await expect(notes).toBeHidden();
    await continueButton.click();
    await expect(lesson).toHaveAttribute("data-step", "Concept");
    await expect(page.getByTestId("lesson-investigation")).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Mission context", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".cm-content")).toHaveCount(0);
    expect(
      await page.evaluate(() => localStorage.getItem("tc-script-skip")),
    ).toBeNull();
  });

  await test.step("skip reveals the story in place without jumping to the editor", async () => {
    await page
      .getByRole("button", { name: "Step 1: Briefing", exact: true })
      .click();
    await expect(lesson).toHaveAttribute("data-step", "Briefing");
    await page.getByRole("button", { name: /replay scene/i }).click();
    await expect(script).toHaveAttribute("data-script-state", "playing");
    await page.getByRole("button", { name: /skip intro/i }).click();
    await expect(script).toHaveAttribute("data-script-state", "done");
    await expect(lesson).toHaveAttribute("data-step", "Briefing");
    await expect(art).toBeVisible();
    await expect(notes).toBeVisible();
    await expect(page.locator(".cm-content")).toHaveCount(0);
    expect(
      await page.evaluate(() => localStorage.getItem("tc-script-skip")),
    ).toBe("1");
  });
});
