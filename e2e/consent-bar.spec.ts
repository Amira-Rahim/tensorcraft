import { test, expect, type Page } from "@playwright/test";

/*
  The consent bar as a first visitor meets it (spec 2026-09-24, section 1):
  no stored consent, the scene skipped so the Briefing settles at once. The
  bar must be short, the page must reserve its height, and the nav row must
  end above it when the page is scrolled to its end.
*/
const LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";

async function openBriefing(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem("tc-cookie-consent");
    localStorage.setItem("tc-script-skip", "1");
    localStorage.setItem("tc-briefing-variant", "text");
  });
  await page.goto(LESSON, { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-script-state='done']")).toBeAttached();
  await expect(page.getByTestId("cookie-consent-card")).toBeVisible();
  // The bar fades up over 0.15 s; measure its resting box.
  await page.getByTestId("cookie-consent-card").evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((a) => a.finished));
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

function measure(page: Page) {
  return page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    const bar = document
      .querySelector("[data-testid='cookie-consent-card']")!
      .getBoundingClientRect();
    const nav = document
      .querySelector("[data-testid='lesson-nav']")!
      .getBoundingClientRect();
    return {
      barHeight: bar.height,
      barTop: bar.top,
      navBottom: nav.bottom,
      bodyPadding: parseFloat(getComputedStyle(document.body).paddingBottom),
      footerBottom: document.querySelector("footer")!.getBoundingClientRect()
        .bottom,
    };
  });
}

for (const [name, viewport, cap] of [
  ["desktop", { width: 1440, height: 900 }, 64],
  ["phone", { width: 390, height: 844 }, 160],
] as const) {
  test.describe(`consent bar, ${name}`, () => {
    test.use({ viewport, colorScheme: "dark" });

    test("is short, reserves its height, and never covers the nav row", async ({
      page,
    }) => {
      await openBriefing(page);
      const m = await measure(page);
      expect(m.barHeight).toBeLessThanOrEqual(cap);
      expect(Math.abs(m.bodyPadding - m.barHeight)).toBeLessThanOrEqual(1);
      expect(m.navBottom).toBeLessThanOrEqual(m.barTop + 1);
      expect(m.footerBottom).toBeLessThanOrEqual(m.barTop + 1);
    });

    test("scrolls a focused control in the bar's band clear of the bar", async ({
      page,
    }) => {
      await openBriefing(page);
      // Body padding clears the bar only at the page's end. A control in the
      // viewport's bottom band counts as in view, so focus would not scroll
      // it without the root's scroll padding (globals.css). One evaluate
      // from the scroll to the focus, so no late layout shift can move the
      // control out of the band between the check and the focus.
      const m = await page.evaluate(async () => {
        const bar = () =>
          document
            .querySelector("[data-testid='cookie-consent-card']")!
            .getBoundingClientRect();
        const el = [
          ...document.querySelectorAll("[data-testid='lesson-nav'] button"),
        ].at(-1) as HTMLElement;
        window.scrollTo({
          top:
            window.scrollY +
            el.getBoundingClientRect().bottom -
            (window.innerHeight - 4),
          behavior: "instant",
        });
        // The control must sit inside the bar's band, still inside the
        // viewport, right before the focus; otherwise the test proves
        // nothing.
        const before = {
          elBottom: el.getBoundingClientRect().bottom,
          barTop: bar().top,
          innerHeight: window.innerHeight,
        };
        if (
          !(before.elBottom > before.barTop) ||
          before.elBottom > before.innerHeight
        ) {
          throw new Error(
            `control not in the bar's band before focus: ${JSON.stringify(before)}`,
          );
        }
        el.focus();
        await new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        );
        return {
          before,
          focused: document.activeElement === el,
          elBottom: el.getBoundingClientRect().bottom,
          barTop: bar().top,
        };
      });
      expect(m.before.elBottom).toBeGreaterThan(m.before.barTop);
      expect(m.focused).toBe(true);
      expect(m.elBottom).toBeLessThanOrEqual(m.barTop + 1);
    });

    test("releases the space once a choice is made", async ({ page }) => {
      await openBriefing(page);
      await page.getByRole("button", { name: /essential only/i }).click();
      await expect(page.getByTestId("cookie-consent-card")).toHaveCount(0);
      const padding = await page.evaluate(
        () => getComputedStyle(document.body).paddingBottom,
      );
      expect(padding).toBe("0px");
    });
  });
}

for (const [name, viewport] of [
  ["phone portrait", { width: 390, height: 844 }],
  ["phone landscape", { width: 667, height: 375 }],
] as const) {
  test.describe(`lesson drawer with the consent bar, ${name}`, () => {
    test.use({ viewport, colorScheme: "dark" });

    test("the open sheet sits above the bar and inside the viewport", async ({
      page,
    }) => {
      await openBriefing(page);
      await page.getByRole("button", { name: "Open lesson list" }).click();
      const sheet = page.getByRole("dialog", { name: /lessons$/ });
      await expect(sheet).toBeVisible();
      await sheet.evaluate(async (el) => {
        await Promise.all(el.getAnimations().map((a) => a.finished));
      });
      const box = await sheet.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      });
      const barTop = await page
        .getByTestId("cookie-consent-card")
        .evaluate((el) => el.getBoundingClientRect().top);
      expect(box.bottom).toBeLessThanOrEqual(barTop + 1);
      expect(box.top).toBeGreaterThanOrEqual(0);
    });
  });
}
