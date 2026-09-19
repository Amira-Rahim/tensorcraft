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
    // 6 beats since P2 added scene sluglines: slugline + narrative stage
    // direction + 3 dialogues + 1 story paragraph on foundations/01.
    expect(await page.locator("[data-beat-shown]").count()).toBe(6);
    expect(Math.max(...counts)).toBeGreaterThanOrEqual(3);

    // Prose partition (2026-09-04): the Briefing ends at the story zone, so
    // there is no auto-scroll and the teaching body must NOT be readable
    // here. The first teaching heading exists in the DOM but stays hidden;
    // the read happens once, on the Concept step.
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(200);
    await expect(
      page.getByRole("heading", { name: "Inspect One Packet" }),
    ).toBeHidden();

    // Replay resets and replays.
    await page.getByRole("button", { name: /replay/i }).click();
    await expect(page.locator("[data-script-state='playing']")).toBeAttached();
    expect(await page.locator("[data-beat-shown]").count()).toBeLessThanOrEqual(
      1,
    );
    // /skip/i also matches "Skip to the challenge" since the lesson-format
    // rework added it, so name the intro control exactly.
    await page.getByRole("button", { name: /skip intro/i }).click();
    await expect(page.locator("[data-script-state='done']")).toBeAttached();
  });
});

test("a due warm-up defers the story and its skip control", async ({
  page,
}) => {
  const { seedDueReview, REVIEW_LESSON } = await import("./review-fixture");
  await seedDueReview(page);
  await page.goto(REVIEW_LESSON);
  const warmup = page.getByRole("region", { name: /Warm-up/ });
  await expect(warmup).toBeVisible();
  await expect(page.locator("[data-script-state='idle']")).not.toHaveAttribute(
    "aria-busy",
    "true",
  );
  await expect(page.getByRole("button", { name: /skip intro/i })).toHaveCount(
    0,
  );
  await warmup.getByRole("button", { name: "I couldn't recall it" }).click();
  await expect(warmup.getByRole("status")).toHaveText("Answer revealed.");
  await warmup.getByRole("button", { name: "Continue to lesson" }).click();
  await expect(page.locator("[data-script-state='playing']")).toBeAttached();
  await page.getByRole("button", { name: /skip intro/i }).click();
  await expect(page.locator("[data-script-state='done']")).toBeAttached();
});

test.describe("Lesson without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("server-rendered idle Briefing remains readable", async ({ page }) => {
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");
    await expect(
      page.getByRole("heading", {
        name: "Introduction to Tensors",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Inspect One Packet", exact: true }),
    ).toBeVisible();
  });
});
