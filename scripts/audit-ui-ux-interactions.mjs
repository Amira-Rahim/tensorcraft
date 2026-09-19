import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync } from "node:fs";
const base = process.env.UI_AUDIT_BASE ?? "http://127.0.0.1:3118";
const out = process.env.UI_AUDIT_OUT ?? "test-results/ui-ux-audit";
const browser = await chromium.launch();
const records = [];
try {
  for (const width of [320, 375, 390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      reducedMotion: "reduce",
      colorScheme: "light",
    });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${out}/first-visit-${width}.png` });
    const decline = page.getByRole("button", {
      name: "Essential only",
      exact: true,
    });
    try {
      await decline.click({ timeout: 2000 });
      records.push({ id: "consent-" + width, click: "passed" });
    } catch (e) {
      records.push({
        id: "consent-" + width,
        click: "blocked",
        reason: e.message,
        button: await decline.boundingBox(),
        reportButton: await page
          .getByRole("button", { name: "Report Issue", exact: true })
          .boundingBox(),
      });
      await decline.focus();
      await page.keyboard.press("Enter");
    }
    await page
      .getByRole("button", { name: "Report Issue", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Report an issue" }),
    ).toBeVisible();
    await page.screenshot({ path: `${out}/report-open-${width}.png` });
    const report = await page
      .getByRole("dialog", { name: "Report an issue" })
      .boundingBox();
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    records.push({
      id: `report-open-${width}`,
      report,
      violations: axe.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
    await page.keyboard.press("Escape");
    if (width === 390) {
      await page.addInitScript(() => {
        localStorage.setItem("tc_step_deep-orbit_introduction-to-tensors", "1");
        localStorage.setItem(
          "tc_step_max_deep-orbit_introduction-to-tensors",
          "1",
        );
      });
      await page.goto(
        base + "/worlds/deep-orbit/foundations/introduction-to-tensors",
        { waitUntil: "networkidle" },
      );
      const terms = page.locator("button[data-glossary-term]:visible");
      const count = await terms.count();
      if (count) {
        const term = terms.first();
        const name = await term.getAttribute("data-glossary-term");
        await term.click();
        const definition = page.getByRole("note", {
          name: name + " definition",
        });
        await expect(definition).toBeVisible();
        records.push({
          id: "mobile-glossary",
          term: name,
          button: await term.boundingBox(),
          definition: await definition.boundingBox(),
          scroll: await page.evaluate(() => scrollY),
          viewportHeight: 844,
        });
        await page.screenshot({ path: out + "/mobile-glossary.png" });
      }
    }
    await context.close();
    writeFileSync(
      out + "/interaction-results.json",
      JSON.stringify(records, null, 2),
    );
  }
} finally {
  await browser.close();
}
