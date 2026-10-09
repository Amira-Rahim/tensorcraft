import { test, expect } from "@playwright/test";

test.describe("Lesson script playback", () => {
  test("reveals beats progressively, then scrolls to the explanation", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("tc_step_deep-orbit_introduction-to-tensors");
      localStorage.removeItem("tc_step_max_deep-orbit_introduction-to-tensors");
      localStorage.setItem("tc-cookie-consent", "declined");
    });
    // Pin the art-agnostic fixture: with no scene art served, ScenePortrait
    // must error out and remove itself (and its beat) BEFORE the timeline
    // math below. Aborting the route makes that deterministic; relying on
    // the dev server's 404 timing let a pending request keep the figure (and
    // a 7th beat) alive through "done", and a mid-timeline error could even
    // drop an already-revealed beat, breaking monotonicity. This assertion
    // set stays truthful after real art ships because the route stays dead.
    await page.route("**/scenes/**", (route) => route.abort());
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");

    await expect(page.locator("[data-script-state='playing']")).toBeAttached();
    await expect(page.getByTestId("course-orientation")).toBeVisible();
    await expect(page.getByTestId("scene-context")).toHaveCSS("opacity", "1");
    await expect(page.getByTestId("briefing-takeaway")).toBeHidden();

    // Sample the revealed-beat count across the timeline.
    const counts: number[] = [];
    for (let i = 0; i < 20; i++) {
      counts.push(await page.locator("[data-beat-shown]").count());
      if ((await page.locator("[data-script-state='done']").count()) > 0) break;
      await page.waitForTimeout(1200);
    }

    expect(counts[0]).toBeLessThanOrEqual(1);
    // Monotonic and complete: every pre-heading beat revealed by the end.
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
    await expect(page.locator("[data-script-state='done']")).toBeAttached();
    // The context stays visible outside playback: slugline + 3 dialogues
    // + 1 story paragraph on foundations/01, with the art deliberately absent.
    expect(await page.locator("[data-beat-shown]").count()).toBe(5);
    expect(Math.max(...counts)).toBeGreaterThanOrEqual(3);
    await expect(page.getByTestId("briefing-takeaway")).toBeVisible();

    // Prose partition (2026-09-04): the Briefing ends at the story zone, so
    // there is no auto-scroll and the teaching body must NOT be readable
    // here. The first teaching heading exists in the DOM but stays hidden;
    // the read happens once, on the Concept step.
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(200);
    await expect(
      page.getByRole("heading", { name: "Create and check your tensor" }),
    ).toBeHidden();

    // Replay resets and replays.
    await page.getByRole("button", { name: /replay/i }).click();
    await expect(page.locator("[data-script-state='playing']")).toBeAttached();
    await expect(page.getByTestId("briefing-takeaway")).toBeHidden();
    await expect(page.getByTestId("scene-context")).toHaveCSS("opacity", "1");
    expect(await page.locator("[data-beat-shown]").count()).toBeLessThanOrEqual(
      1,
    );
    // /skip/i also matches "Skip to the challenge" since the lesson-format
    // rework added it, so name the intro control exactly.
    await page.getByRole("button", { name: /skip intro/i }).click();
    await expect(page.locator("[data-script-state='done']")).toBeAttached();
  });
});

test("a due warm-up waits for the story and appears after it", async ({
  page,
}) => {
  // Until 2026-09-22 the card sat in front of the scene and held playback.
  // The page now opens with its story; the card follows in the post-scene
  // slot, and the skip control is live from the first frame.
  const { seedDueReview, REVIEW_WARMUP_LESSON } =
    await import("./review-fixture");
  await seedDueReview(page);
  await page.goto(REVIEW_WARMUP_LESSON);
  await expect(page.locator("[data-script-state='playing']")).toHaveAttribute(
    "aria-busy",
    "true",
  );
  const warmup = page.getByRole("region", { name: /Warm-up/ });
  await expect(warmup).toBeHidden();
  await page.getByRole("button", { name: /skip intro/i }).click();
  await expect(page.locator("[data-script-state='done']")).toBeAttached();
  await expect(warmup).toBeVisible();
  const [titleTop, cardTop] = await Promise.all([
    page
      .getByRole("heading", { level: 1 })
      .boundingBox()
      .then((b) => b?.y),
    warmup.boundingBox().then((b) => b?.y),
  ]);
  expect(cardTop).toBeGreaterThan(titleTop ?? Infinity);
  await warmup.getByRole("button", { name: "I couldn't recall it" }).click();
  await expect(warmup.getByRole("status")).toHaveText("Answer revealed.");
  await warmup.getByRole("button", { name: "Continue to lesson" }).click();
  await expect(warmup).toHaveCount(0);
  // Answering the card never restarts the scene.
  await expect(page.locator("[data-script-state='done']")).toBeAttached();
  await expect(page.getByRole("button", { name: "Continue →" })).toBeFocused();
});

test.describe("Lesson without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("server-rendered idle Briefing remains readable", async ({ page }) => {
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");
    await expect(page.getByTestId("course-orientation")).toBeVisible();
    await expect(page.getByTestId("scene-context")).toBeVisible();
    await expect(page.getByTestId("briefing-takeaway")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "From JavaScript Arrays to Tensors",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Create and check your tensor",
        exact: true,
      }),
    ).toBeVisible();
  });
});
