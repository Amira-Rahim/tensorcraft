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
    await page.goto("/themes/deep-orbit/foundations/introduction-to-tensors");

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
    expect(await page.locator("[data-beat-shown]").count()).toBe(5);
    expect(Math.max(...counts)).toBeGreaterThanOrEqual(3);

    // Auto-scroll brought the explanation into view.
    await page.waitForTimeout(1200);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(200);

    // Replay resets and replays.
    await page.getByRole("button", { name: /replay/i }).click();
    await expect(page.locator("[data-script-state='playing']")).toBeAttached();
    expect(await page.locator("[data-beat-shown]").count()).toBeLessThanOrEqual(
      1,
    );
    await page.getByRole("button", { name: /skip/i }).click();
    await expect(page.locator("[data-script-state='done']")).toBeAttached();
  });
});
