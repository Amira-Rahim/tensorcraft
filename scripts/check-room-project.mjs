// Reproduce the downloadable project's lifecycle in a clean standalone folder.
import {
  mkdtemp,
  readFile,
  writeFile,
  copyFile,
  rename,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { chromium, expect } from "@playwright/test";
const root = fileURLToPath(new URL("..", import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), "tensorcraft-room-project-"));
execFileSync("unzip", [
  "-q",
  join(root, "apps/web/public/assignments/room-occupancy-v1.zip"),
  "-d",
  scratch,
]);
const project = join(scratch, "room-occupancy-v1");
const run = (...args) =>
  execFileSync("npm", args, {
    cwd: project,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120_000,
  });
console.log("Clean project:", project);
run("ci", "--ignore-scripts", "--no-audit", "--no-fund");
console.log("Clean npm ci passed.");
let refused = false;
try {
  run("run", "train");
} catch (error) {
  refused = String(error.stderr).includes("Implement your experiment");
}
expect(refused).toBe(true);
await copyFile(
  join(root, "scripts/fixtures/room-project/train.mjs"),
  join(project, "train.mjs"),
);
run("run", "train");
console.log(run("run", "check").trim());
run("run", "evaluate", "--", "validation");
run("run", "evaluate", "--", "test");
const { validatePlan, metrics } = await import(
  pathToFileURL(join(project, "evaluation.mjs"))
);
const rows = JSON.parse(
  await readFile(join(project, "data.json"), "utf8"),
).rows;
const plan = JSON.parse(await readFile(join(project, "plan.json"), "utf8"));
const bad = structuredClone(plan);
bad.split.test[0] = bad.split.train[0];
expect(() => validatePlan(bad, rows)).toThrow(/overlapping/);
const leakage = structuredClone(plan);
leakage.preprocessingFitIds.push(plan.split.test[0]);
expect(() => validatePlan(leakage, rows)).toThrow(/training row IDs/);
expect(
  metrics([1, 1, 0, 0], [1, 0, 1, 0], { falsePositive: 3, falseNegative: 7 }),
).toMatchObject({ tp: 1, fp: 1, tn: 1, fn: 1, totalErrorCost: 10 });
const { createProjectServer } = await import(
  pathToFileURL(join(project, "serve.mjs"))
);
const server = createProjectServer();
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [],
    external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const origin = `http://127.0.0.1:${server.address().port}`;
  await page.route("**/*", (route) => {
    if (
      route
        .request()
        .url()
        .startsWith(origin + "/")
    )
      return route.continue();
    external.push(route.request().url());
    return route.abort();
  });
  await page.goto(origin);
  await expect(
    page.getByText("Model ready. Enter readings to predict."),
  ).toBeVisible();
  const parity = JSON.parse(
    await readFile(join(project, "model/parity.json"), "utf8"),
  );
  for (const { row, score } of parity) {
    for (const feature of ["temperature", "light", "co2"])
      await page.locator(`input[name="${feature}"]`).fill(String(row[feature]));
    await page.getByRole("button", { name: "Predict occupancy" }).click();
    const text = await page.locator("#result").innerText();
    expect(
      Math.abs(Number(text.match(/score (\d+\.\d+)/)[1]) - score),
    ).toBeLessThan(1e-5);
  }
  await page.locator('input[name="temperature"]').fill("");
  await expect(page.locator("#result")).toHaveText("");
  await page.getByRole("button", { name: "Predict occupancy" }).click();
  await expect(page.locator("#result")).toHaveText("");
  await page.locator('input[name="temperature"]').fill("1e100");
  await page.getByRole("button", { name: "Predict occupancy" }).click();
  await expect(page.locator("#result")).toContainText("No prediction:");
  const weights = join(project, "model/weights.bin");
  await rename(weights, weights + ".held");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Predict occupancy" }),
  ).toBeDisabled();
  await expect(page.locator("#status")).toContainText("Unable to predict:");
  await rename(weights + ".held", weights);
  const original = await readFile(weights),
    corrupt = Buffer.from(original);
  corrupt[0] ^= 1;
  await writeFile(weights, corrupt);
  let corruptionRejected = false;
  try {
    run("run", "check");
  } catch (error) {
    corruptionRejected = String(error.stderr).includes("Artifact changed");
  }
  expect(corruptionRejected).toBe(true);
  await page.reload();
  await expect(page.locator("#status")).toContainText("Artifact changed");
  await writeFile(weights, original);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Predict occupancy" }),
  ).toBeEnabled();
  await page.setViewportSize({ width: 375, height: 850 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/tensorcraft-room-app.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  console.log(
    "Passed: clean install, real fit/export/reload, paired evaluation, overlap/leakage guards, browser parity, invalid input, missing/corrupt artifacts, local-only requests.",
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
