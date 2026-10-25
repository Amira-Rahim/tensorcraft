import { test, expect, type Page } from "@playwright/test";

/**
 * The Briefing's learning notes are two asides since clarity fix 16
 * (2026-10-14): "Key idea" and "Your first task". Both carry the
 * briefing-takeaway test id. includeHidden lets the playback test find them
 * while the scene holds them back with display: none.
 */
function briefingNotes(page: Page, includeHidden = false) {
  return [
    page.getByRole("complementary", { name: "Key idea", includeHidden }),
    page.getByRole("complementary", { name: "Your first task", includeHidden }),
  ];
}

test.describe("Lesson script playback", () => {
  test("reveals beats progressively, then shows the Briefing notes without scrolling", async ({
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
    // The notes wait with the scene notes until the scene finishes.
    await expect(page.getByTestId("briefing-takeaway")).toHaveCount(2);
    const notes = briefingNotes(page, true);
    for (const note of notes) {
      await expect(note).toBeAttached();
      await expect(note).toBeHidden();
    }

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
    // The context stays visible outside playback: slugline + 3 story
    // paragraphs + 3 dialogues on foundations/01, with the art deliberately
    // absent. Content fix 10 (2026-10-18) put a story paragraph before the
    // dialogues and two after them, where one paragraph used to follow.
    expect(await page.locator("[data-beat-shown]").count()).toBe(7);
    expect(Math.max(...counts)).toBeGreaterThanOrEqual(3);
    for (const note of notes) await expect(note).toBeVisible();

    // Prose partition (2026-09-04): the Briefing ends at the story zone, so
    // there is no auto-scroll and the teaching body must NOT be readable
    // here. The first teaching heading exists in the DOM but stays hidden;
    // the read happens once, on the Concept step. Lesson 1's first teaching
    // heading reads "What the example shows" since content fix 11
    // (2026-10-19). The Briefing renders the body in three slices (the story
    // and the two notes), so the heading has three hidden copies.
    // toBeHidden() also passes when nothing matches, which kept this check
    // green after the old heading was renamed on 2026-10-08, so prove a copy
    // is in the DOM and that none is visible.
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(200);
    const teachingHeading = page.getByRole("heading", {
      name: "What the example shows",
      includeHidden: true,
    });
    await expect(teachingHeading.first()).toBeAttached();
    await expect(teachingHeading.filter({ visible: true })).toHaveCount(0);

    // Replay resets and replays.
    await page.getByRole("button", { name: /replay/i }).click();
    await expect(page.locator("[data-script-state='playing']")).toBeAttached();
    for (const note of notes) await expect(note).toBeHidden();
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
  // The warm-up is a checked recall card in the Deep Orbit layout (clarity
  // fix 14, 2026-10-12). Its way out is "Show an explanation", which reveals
  // every expected answer with its explanation. "I couldn't recall it" only
  // renders outside that layout.
  await warmup.getByRole("button", { name: "Show an explanation" }).click();
  await expect(warmup.getByRole("status")).toHaveText(
    "Answers revealed. Read each explanation before continuing.",
  );
  await expect(warmup.getByText("Expected answer: [12].")).toBeVisible();
  await expect(
    warmup.getByText("Expected answer: No, it only creates a tensor."),
  ).toBeVisible();
  await warmup.getByRole("button", { name: "Continue to lesson" }).click();
  await expect(warmup).toHaveCount(0);
  // Answering the card never restarts the scene.
  await expect(page.locator("[data-script-state='done']")).toBeAttached();
  // The step button reads "Continue" without an arrow since content fix 12
  // (2026-10-19).
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeFocused();
});

test.describe("Lesson without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("server-rendered idle Briefing remains readable", async ({ page }) => {
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");
    await expect(page.getByTestId("course-orientation")).toBeVisible();
    await expect(page.getByTestId("scene-context")).toBeVisible();
    await expect(page.getByTestId("briefing-takeaway")).toHaveCount(2);
    for (const note of briefingNotes(page)) await expect(note).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "From JavaScript Arrays to Tensors",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "What the example shows",
        exact: true,
      }),
    ).toBeVisible();
  });
});
