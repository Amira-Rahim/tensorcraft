// Read-only supplementary UI probes. --live checks three public production states.
// The email confirmation uses an intercepted OTP response; no email is sent.
import { chromium, webkit, expect } from "@playwright/test";
import fs from "node:fs";
const base = process.env.UI_AUDIT_BASE ?? "http://localhost:3118";
const out = process.env.UI_AUDIT_OUT ?? "test-results/ui-ux-audit";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const records = [];
try {
  const authChecks = [];
  for (const reducedMotion of ["reduce", "no-preference"]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        colorScheme: "light",
        reducedMotion,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() =>
        localStorage.setItem("tc-cookie-consent", "declined"),
      );
      await page.goto(base + "/auth", {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(400);
      const retry = await page
        .getByRole("button", { name: "Try again", exact: true })
        .count();
      authChecks.push({
        mode: reducedMotion,
        attempt,
        errors,
        auth: await page.locator("#auth-email").count(),
        retry,
      });
      if (retry) {
        await page.screenshot({
          path: `${out}/auth-canvas-crash-${reducedMotion}.png`,
        });
      }
      await context.close();
    }
  }
  fs.writeFileSync(
    out + "/auth-crash-results.json",
    JSON.stringify(authChecks, null, 2),
  );
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  await page.addInitScript(() =>
    localStorage.setItem("tc-cookie-consent", "declined"),
  );
  await page.goto(base + "/worlds/neon-protocol", {
    waitUntil: "networkidle",
  });
  await page
    .getByTestId("coming-soon-roster-neon-protocol")
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: out + "/coming-soon-contrast.png" });
  const labels = await page
    .locator('[data-testid="coming-soon-roster-neon-protocol"] span')
    .evaluateAll((es) =>
      es.slice(0, 10).map((e) => ({
        text: e.textContent,
        color: getComputedStyle(e).color,
        font: getComputedStyle(e).fontSize,
      })),
    );
  records.push({ id: "coming-soon-contrast", labels });
  const posts = JSON.parse(
    fs.readFileSync("packages/content/.velite/posts.json", "utf8"),
  );
  if (posts.length)
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/blog/" + posts[0].slug, {
        waitUntil: "networkidle",
      });
      await page.screenshot({
        path: out + "/blog-article-" + width + ".png",
        fullPage: true,
      });
      records.push({
        id: "blog-article-" + width,
        slug: posts[0].slug,
        overflow: await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      });
    }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/auth/v1/otp**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.goto(base + "/auth", { waitUntil: "networkidle" });
  await page.locator("#auth-email").fill("learner@example.test");
  await page.getByRole("button", { name: /send magic link/i }).click();
  await expect(
    page.getByRole("heading", { name: "Check your inbox" }),
  ).toBeVisible();
  await page.screenshot({ path: out + "/auth-email-sent-fixture-390.png" });
  records.push({
    id: "auth-email-sent",
    scope: "OTP response intercepted locally; no email sent",
  });
  if (process.argv.includes("--live")) {
    const live = await browser.newContext({
      viewport: { width: 375, height: 844 },
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    const p = await live.newPage();
    await p.goto("https://tensorcraft.app", {
      waitUntil: "networkidle",
      timeout: 45000,
    });
    await p.screenshot({ path: out + "/live-first-visit-375.png" });
    const b = p.getByRole("button", { name: "Essential only", exact: true });
    const box = await b.boundingBox();
    const hit = await p.evaluate((b) => {
      const e = document.elementFromPoint(
        b.x + b.width / 2,
        b.y + b.height / 2,
      );
      return {
        tag: e.tagName,
        text: e.textContent,
        label: e.getAttribute("aria-label"),
      };
    }, box);
    records.push({ id: "production-consent", url: p.url(), box, hit });
    await b.focus();
    await p.keyboard.press("Enter");
    await p.setViewportSize({ width: 320, height: 844 });
    await p.getByRole("button", { name: "Report Issue", exact: true }).click();
    await p.screenshot({ path: out + "/live-report-open-320.png" });
    records.push({
      id: "production-report",
      box: await p
        .getByRole("dialog", { name: "Report an issue" })
        .boundingBox(),
    });
    await p.goto("https://tensorcraft.app/auth", { waitUntil: "networkidle" });
    await p.waitForTimeout(400);
    await p.screenshot({ path: out + "/live-auth-reduced-motion-320.png" });
    records.push({
      id: "production-auth-reduced-motion",
      url: p.url(),
      auth: await p.locator("#auth-email").count(),
      retry: await p
        .getByRole("button", { name: "Try again", exact: true })
        .count(),
    });
    await live.close();
  }
  try {
    const safari = await webkit.launch();
    const p = await safari.newPage({
      viewport: { width: 390, height: 844 },
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    await p.addInitScript(() =>
      localStorage.setItem("tc-cookie-consent", "declined"),
    );
    await p.goto(
      base + "/worlds/deep-orbit/foundations/introduction-to-tensors",
      { waitUntil: "networkidle" },
    );
    await p.screenshot({ path: out + "/webkit-lesson-390.png" });
    records.push({
      id: "webkit-lesson",
      status: "rendered",
      overflow: await p.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    });
    await safari.close();
  } catch (e) {
    records.push({
      id: "webkit-lesson",
      status: "not-run",
      reason: e.message.slice(0, 500),
    });
  }
} finally {
  fs.writeFileSync(
    out + "/supplement-results.json",
    JSON.stringify(records, null, 2),
  );
  await browser.close();
}
