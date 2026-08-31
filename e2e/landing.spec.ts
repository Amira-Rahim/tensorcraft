import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section with headline", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    // Story-first headline (owner decision 2026-08-31). This DOM assertion
    // is the real gate on the headline: the visual baselines magenta-mask
    // the whole hero (ParticleField spans it), so they cannot see the text.
    // Spec: docs/superpowers/specs/2026-08-31-landing-headline-story-first.md.
    await expect(h1).toContainText(/stories that take you/i);
    await expect(h1).toContainText(/from javascript to ml/i);
  });

  test("primary CTA stays above the fold on a 900px-tall laptop", async ({
    page,
  }) => {
    // 2026-08-19 (owner): the trust line was cut from the hero; the fold
    // guarantee now anchors on the primary CTA.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByTestId("landing-cta-primary")).toBeInViewport();
  });

  // The live Deep Scan proof panel was removed from the hero on 2026-08-31
  // (owner request; spec 2026-08-31-landing-headline-story-first.md). The
  // demo and its 7741 cliffhanger now mount only inside lessons, covered by
  // deep-scan-demo.test.tsx and the lesson e2e specs.
  test("hero no longer mounts the demo panel", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("landing-hero")).toBeVisible();
    await expect(page.getByTestId("deep-scan-demo")).toHaveCount(0);
  });

  test("landing FAQ renders with answers visible", async ({ page }) => {
    await page.goto("/");
    const faq = page.getByTestId("landing-faq");
    await expect(faq).toBeVisible();
    // Static Q|A rows since 2026-08-14 (no accordion): answers render
    // without any interaction.
    await expect(faq.getByText(/no python required/i).first()).toBeVisible();
  });

  test("displays navigation with brand and CTA", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByTestId("site-nav");
    await expect(nav).toContainText(/tensorcraft/i);
    await expect(nav.getByRole("link", { name: /start now/i })).toBeVisible();
  });

  test("shows world section with Deep Orbit", async ({ page }) => {
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
    // The only test here that navigates into the lesson route. On a cold
    // local `next dev` that route compiles on demand (9.5s measured
    // 2026-08-31, on top of compiling "/"), which can blow the default 30s
    // test budget; it failed exactly this way 3/3 cold and passed 2/2 warm.
    // slow() triples the budget locally; CI runs `next start`, no compile.
    test.slow();
    await page.goto("/");
    await page.getByTestId("landing-cta-final").click();
    await expect(page).toHaveURL(/\/worlds\/deep-orbit\/foundations/);
  });

  test("page title contains Tensorcraft", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Tensorcraft/);
  });

  test("scheme toggle flips data-scheme, restyles the page, and persists", async ({
    page,
  }) => {
    await page.goto("/");
    const html = page.locator("html");
    const toggle = page.getByRole("button", { name: /color scheme/i });
    // Config pins colorScheme: "dark", so the page starts dark (no attr).
    await expect(html).not.toHaveAttribute("data-scheme", "light");
    const darkBg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    // system → light
    await toggle.click();
    await expect(html).toHaveAttribute("data-scheme", "light");
    const lightBg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(lightBg).not.toBe(darkBg);
    // Explicit choice persists across reload.
    await page.reload();
    await expect(html).toHaveAttribute("data-scheme", "light");
  });
});
