// Read-only UI audit of a local production build. Does not modify baselines.
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
const base = process.env.UI_AUDIT_BASE ?? "http://127.0.0.1:3118";
const out = process.env.UI_AUDIT_OUT ?? "test-results/ui-ux-audit";
mkdirSync(out, { recursive: true });
const routes = [
  ["home", "/"],
  ["learn", "/learn"],
  ["worlds", "/worlds"],
  ["deep-orbit", "/worlds/deep-orbit"],
  ["neon", "/worlds/neon-protocol"],
  ["ward", "/worlds/signal-ward"],
  ["terra", "/worlds/terra-grid"],
  ["nova", "/worlds/nova-canvas"],
  ["foundations", "/worlds/deep-orbit/foundations"],
  ["neural", "/worlds/deep-orbit/neural-networks"],
  ["pricing", "/pricing"],
  ["locked-pricing", "/pricing?locked=deep-orbit&module=neural-networks"],
  ["paywall", "/paywall"],
  ["signin", "/auth/sign-in"],
  ["signup", "/auth/sign-up"],
  ["about", "/about"],
  ["compare", "/compare"],
  ["blog", "/blog"],
  ["privacy", "/privacy"],
  ["terms", "/terms"],
  ["unsubscribe", "/unsubscribe"],
  ["not-found", "/audit-missing-route"],
  ["dashboard-gate", "/dashboard"],
  ["settings-gate", "/settings"],
  ["onboarding-gate", "/onboarding"],
  ["certificate-missing", "/certificates/audit-missing"],
];
const recordPath = `${out}/public-results.json`;
const records =
  process.env.UI_AUDIT_RESUME && existsSync(recordPath)
    ? JSON.parse(readFileSync(recordPath, "utf8")).filter(
        (record) => !record.error,
      )
    : [];
const browser = await chromium.launch();
const modes = process.argv.includes("--quick")
  ? [{ width: 1440, height: 900, scheme: "dark" }]
  : [
      { width: 1440, height: 900, scheme: "dark" },
      { width: 390, height: 844, scheme: "dark" },
      { width: 1440, height: 900, scheme: "light" },
      { width: 390, height: 844, scheme: "light" },
    ];
try {
  for (const mode of modes) {
    const context = await browser.newContext({
      viewport: { width: mode.width, height: mode.height },
      colorScheme: mode.scheme,
      reducedMotion: "reduce",
    });
    await context.addInitScript(() =>
      localStorage.setItem("tc-cookie-consent", "declined"),
    );
    const page = await context.newPage();
    for (const [name, route] of routes) {
      const id = `${name}-${mode.width}-${mode.scheme}`;
      if (records.some((record) => record.id === id && !record.error)) continue;
      const errors = [];
      const listener = (e) => errors.push(e.message);
      page.on("pageerror", listener);
      try {
        const response = await page.goto(base + route, {
          waitUntil: "networkidle",
          timeout: 45000,
        });
        if ((response?.status() ?? 500) >= 500)
          throw new Error(`Preview failed: HTTP ${response?.status()}`);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `${out}/${id}.png` });
        if (
          ["home", "learn", "deep-orbit", "pricing", "foundations"].includes(
            name,
          )
        )
          await page.screenshot({
            path: `${out}/${id}-full.png`,
            fullPage: true,
          });
        const metrics = await page.evaluate(() => {
          const rect = (e) => {
            const r = e.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          };
          const visible = (e) => {
            const r = e.getBoundingClientRect(),
              s = getComputedStyle(e);
            return (
              r.width > 0 &&
              r.height > 0 &&
              s.visibility !== "hidden" &&
              s.display !== "none"
            );
          };
          const small = [
            ...document.querySelectorAll(
              'button,a,input,select,textarea,[role="button"]',
            ),
          ]
            .filter(visible)
            .filter((e) => {
              const r = e.getBoundingClientRect();
              return r.width < 24 || r.height < 24;
            })
            .map((e) => ({
              tag: e.tagName,
              label: (e.getAttribute("aria-label") || e.textContent || "")
                .trim()
                .slice(0, 90),
              ...rect(e),
            }));
          const tiny = [
            ...document.querySelectorAll("p,span,label,button,a,h1,h2,h3"),
          ]
            .filter(visible)
            .filter(
              (e) =>
                e.textContent.trim() &&
                parseFloat(getComputedStyle(e).fontSize) < 12,
            )
            .slice(0, 50)
            .map((e) => ({
              text: e.textContent.trim().slice(0, 90),
              size: getComputedStyle(e).fontSize,
              lineHeight: getComputedStyle(e).lineHeight,
              opacity: getComputedStyle(e).opacity,
            }));
          return {
            viewport: { width: innerWidth, height: innerHeight },
            document: {
              width: document.documentElement.scrollWidth,
              height: document.documentElement.scrollHeight,
            },
            headings: [...document.querySelectorAll("h1,h2,h3")]
              .filter(visible)
              .map((e) => ({
                tag: e.tagName,
                text: e.textContent,
                font: getComputedStyle(e).fontSize,
                ...rect(e),
              })),
            smallControls: small,
            tinyText: tiny,
            brokenImages: [...document.images]
              .filter((i) => i.complete && !i.naturalWidth)
              .map((i) => i.getAttribute("src")),
          };
        });
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        records.push({
          id,
          route,
          url: page.url(),
          status: response?.status(),
          ...metrics,
          observedState: metrics.headings.some((h) =>
            /sign-in failed|something went wrong|failed to load/i.test(h.text),
          )
            ? "error-boundary"
            : "content-or-redirect",
          violations: axe.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
          errors,
        });
        console.log(
          id,
          response?.status(),
          `overflow=${metrics.document.width - mode.width}`,
          `axe=${axe.violations.length}`,
        );
      } catch (e) {
        records.push({ id, route, error: e.message });
        console.log(id, "ERROR", e.message.slice(0, 160));
      }
      page.off("pageerror", listener);
      writeFileSync(
        `${out}/public-results.json`,
        JSON.stringify(records, null, 2),
      );
    }
    await context.close();
  }
} finally {
  await browser.close();
}
