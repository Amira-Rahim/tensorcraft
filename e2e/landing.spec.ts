import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section with headline", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText(/ml speaks javascript/i);
    await expect(h1).toContainText(/turns out you'?re fluent/i);
  });

  test("trust line stays above the fold on a 900px-tall laptop", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByTestId("hero-trust-line")).toBeInViewport();
  });

  test("hero mounts the live inference demo panel", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("hero-demo-panel")).toBeVisible();
    // tfjs loads async post-hydration; the demo shell should attach even
    // before inference finishes.
    await expect(page.getByTestId("deep-scan-demo")).toBeAttached({
      timeout: 15_000,
    });
  });

  test("hero demo finishes and the interactive sliders classify a custom reading", async ({
    page,
  }) => {
    await page.goto("/");
    // Real model load + staggered reveal takes a few seconds.
    const panel = page.getByTestId("demo-user-panel");
    await expect(panel).toBeVisible({ timeout: 30_000 });
    const score = page.getByTestId("demo-user-score");
    await expect(score).toContainText(/%/, { timeout: 10_000 });
    const before = await score.textContent();
    await page.getByTestId("demo-slider-0").fill("0.95");
    await expect
      .poll(async () => score.textContent(), { timeout: 10_000 })
      .not.toBe(before);

    // Probed presets must land in the zones their labels claim.
    await page.getByTestId("demo-preset-anomaly").click();
    await expect(score).toContainText(/ANOMALOUS/, { timeout: 10_000 });
    await page.getByTestId("demo-preset-healthy").click();
    await expect(score).toContainText(/NORMAL/, { timeout: 10_000 });
    await expect(page.getByTestId("demo-meter-needle")).toBeAttached();
  });

  test("landing FAQ renders and answers expand", async ({ page }) => {
    await page.goto("/");
    const faq = page.getByTestId("landing-faq");
    await expect(faq).toBeVisible();
    const first = faq.locator("summary").first();
    await first.click();
    await expect(faq.getByText(/no python required/i).first()).toBeVisible();
  });

  test("real lesson screenshot links to the free lesson", async ({ page }) => {
    await page.goto("/");
    const shot = page.getByTestId("lesson-screenshot-link");
    await expect(shot).toBeAttached();
    await expect(shot.locator("img")).toBeAttached();
  });

  test("Deep Orbit card carries the sample-7741 story hook", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("deep-orbit-story-hook")).toContainText(
      /7741/,
    );
  });

  test("displays navigation with brand and CTA", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByTestId("site-nav");
    await expect(nav).toContainText(/tensorcraft/i);
    await expect(nav.getByRole("link", { name: /start now/i })).toBeVisible();
  });

  test("shows theme section with Deep Orbit", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/deep orbit/i).first()).toBeVisible();
  });

  test("footer renders with legal links", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: /terms/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /privacy/i })).toBeVisible();
  });

  test("final CTA opens the free lesson — copy promises no account", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("landing-cta-final").click();
    await expect(page).toHaveURL(/\/themes\/deep-orbit\/foundations/);
  });

  test("page title contains Tensorcraft", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Tensorcraft/);
  });
});
