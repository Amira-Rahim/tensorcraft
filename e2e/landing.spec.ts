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

  test("hero demo runs the real model to the 7741 cliffhanger", async ({
    page,
  }) => {
    await page.goto("/");
    // Real model load + staggered reveal takes a few seconds.
    await expect(page.getByTestId("demo-verdict-7741")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("demo-verdict-7741")).toContainText(
      /not an answer/i,
    );
  });

  test("landing FAQ renders and answers expand", async ({ page }) => {
    await page.goto("/");
    const faq = page.getByTestId("landing-faq");
    await expect(faq).toBeVisible();
    const first = faq.locator("summary").first();
    await first.click();
    await expect(faq.getByText(/no python required/i).first()).toBeVisible();
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

  test("final CTA opens the free lesson: copy promises no account", async ({
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
