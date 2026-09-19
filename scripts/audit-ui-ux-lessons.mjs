// Audit the real public lesson route, including its editor and navigation.
// Step fixtures select each state for inspection. They are NOT completion proof.
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const base = process.env.UI_AUDIT_BASE ?? "http://127.0.0.1:3118";
const out = process.env.UI_AUDIT_OUT ?? "test-results/ui-ux-audit";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const records = [];
const url = "/worlds/deep-orbit/foundations/introduction-to-tensors";
const names = [
  "briefing",
  "concept",
  "code",
  "challenge",
  "takeaways",
  "consequence",
];
try {
  for (const mode of [
    { width: 1440, height: 900, scheme: "dark" },
    { width: 390, height: 844, scheme: "dark" },
    { width: 1440, height: 900, scheme: "light" },
    { width: 390, height: 844, scheme: "light" },
    { width: 1024, height: 768, scheme: "dark" },
    { width: 320, height: 667, scheme: "dark" },
  ]) {
    const context = await browser.newContext({
      viewport: { width: mode.width, height: mode.height },
      colorScheme: mode.scheme,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (let step = 0; step < 6; step++) {
      await page.addInitScript((step) => {
        localStorage.setItem("tc-cookie-consent", "declined");
        localStorage.setItem("tc-script-skip", "1");
        localStorage.setItem(
          "tc_step_deep-orbit_introduction-to-tensors",
          String(step),
        );
        localStorage.setItem(
          "tc_step_max_deep-orbit_introduction-to-tensors",
          "5",
        );
      }, step);
      const response = await page.goto(base + url, {
        waitUntil: "domcontentloaded",
      });
      if ((response?.status() ?? 500) >= 500) throw new Error("Preview failed");
      await expect(
        page.getByRole("group", {
          name: `Step ${step + 1} of 6:`,
          exact: false,
        }),
      ).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (step === 3 && mode.width >= 1024)
        await expect(page.locator(".cm-content").first()).toBeVisible();
      await page.waitForTimeout(350);
      const id = `lesson-${names[step]}-${mode.width}-${mode.scheme}`;
      await capture(id);
      if (step === 3 && mode.width < 1024) {
        await page
          .getByRole("button", {
            name: "Editor",
            exact: true,
          })
          .click();
        if (step === 3)
          await expect(page.locator(".cm-content").first()).toBeVisible();
        await capture(id + "-pane");
      }
      if (step === 0 && mode.width === 390 && mode.scheme === "dark") {
        await page.getByRole("button", { name: "Open lesson list" }).click();
        await capture(id + "-drawer");
        await page.keyboard.press("Escape");
      }
      if (step === 3 && mode.width === 1440 && mode.scheme === "dark") {
        await page
          .getByRole("button", { name: "Run Tests", exact: true })
          .click();
        await expect(page.getByTestId("test-results-panel")).toBeVisible({
          timeout: 90000,
        });
        await capture(id + "-failed");
        const editor = page.locator(".cm-content").first();
        await editor.click();
        await page.keyboard.press(
          process.platform === "darwin" ? "Meta+a" : "Control+a",
        );
        await page.keyboard.insertText(
          "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];\nconst reading = tf.tensor(streamValues);\nconst shape = reading.shape;\nconst values = Array.from(reading.dataSync());\nconst total = tf.tidy(() => reading.sum().dataSync()[0]);\nreading.dispose();",
        );
        await page
          .getByRole("button", { name: "Run Tests", exact: true })
          .click();
        await expect(page.getByTestId("test-results-panel")).toContainText(
          "All tests passed!",
          { timeout: 90000 },
        );
        await capture(id + "-passed");
      }
    }
    async function capture(id) {
      await page.screenshot({ path: `${out}/${id}.png`, fullPage: true });
      const metrics = await page.evaluate(() => {
        const visible = (e) =>
          e.getBoundingClientRect().width > 0 &&
          e.getBoundingClientRect().height > 0 &&
          getComputedStyle(e).visibility !== "hidden";
        const box = (e) => {
          const r = e.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        };
        return {
          viewport: { width: innerWidth, height: innerHeight },
          document: {
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight,
          },
          controls: [
            ...document.querySelectorAll('button,a,input,[role="button"]'),
          ]
            .filter(visible)
            .map((e) => ({
              label: (e.getAttribute("aria-label") || e.textContent)
                .trim()
                .slice(0, 100),
              disabled: e.disabled ?? false,
              ...box(e),
            })),
          panes: [
            ...document.querySelectorAll(
              '[data-testid="lesson-right"],[aria-label^="Step "]',
            ),
          ].map((e) => ({
            label: e.getAttribute("aria-label") || e.getAttribute("data-kind"),
            ...box(e),
          })),
          text: [...document.querySelectorAll("main p, main h1, main h2")]
            .filter(visible)
            .slice(0, 40)
            .map((e) => ({
              text: e.textContent.slice(0, 120),
              font: getComputedStyle(e).fontSize,
              lineHeight: getComputedStyle(e).lineHeight,
              ...box(e),
            })),
        };
      });
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      records.push({
        id,
        ...metrics,
        violations: axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        errors: [...errors],
      });
      writeFileSync(
        `${out}/lesson-results.json`,
        JSON.stringify(records, null, 2),
      );
      console.log(
        id,
        `overflow=${metrics.document.width - mode.width}`,
        `axe=${axe.violations.length}`,
      );
    }
    await context.close();
  }
} finally {
  await browser.close();
}
