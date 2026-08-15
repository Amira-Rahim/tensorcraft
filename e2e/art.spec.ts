import { test, expect } from "@playwright/test";

/**
 * Art is optional by contract (packages/ui/src/art-plate.tsx). The unit tests
 * prove the failure path with a synthetic error event; this proves it in a
 * real browser, where an SSR'd <img> can settle BEFORE hydration attaches
 * onError and the verdict has to be recovered from the DOM (use-img-settled).
 *
 * Aborting the route rather than pointing at a missing file is the point:
 * the request dies while the HTML is still streaming, which is the timing
 * that jsdom can never reproduce.
 */
const SURFACES = [
  { name: "landing Five Worlds band", path: "/" },
  { name: "Deep Orbit world page", path: "/worlds/deep-orbit" },
  { name: "auth left pane", path: "/auth/sign-in" },
  { name: "worlds index hero card", path: "/worlds" },
];

for (const surface of SURFACES) {
  test(`${surface.name} renders cleanly with no location art`, async ({
    page,
  }) => {
    await page.route("**/locations/**", (route) => route.abort());
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto(surface.path);
    await page.waitForLoadState("networkidle");

    // Not "hidden" — gone. A plate that fails must leave the DOM, not sit
    // there as a broken-image frame.
    await expect(page.getByTestId("art-plate")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test(`${surface.name} shows the plate when the art is present`, async ({
    page,
  }) => {
    await page.goto(surface.path);
    await expect(page.getByTestId("art-plate").first()).toBeAttached();
  });
}

test("a dead patch route leaves no broken emblem on the world page", async ({
  page,
}) => {
  // Same SSR-settles-before-hydration timing as the plates, through
  // ModulePatch: with the patch route dead, every emblem yields to its
  // fallback node and nothing broken stays in the DOM.
  await page.route("**/patches/**", (route) => route.abort());
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/worlds/deep-orbit");
  await page.waitForLoadState("networkidle");

  await expect(page.getByTestId("module-patch")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("the plate sits under the canvas, not over it", async ({ page }) => {
  await page.goto("/worlds/deep-orbit");
  const plate = page.getByTestId("art-plate").first();
  await expect(plate).toBeAttached();
  // The canvas is the reflection on the glass: it must paint above the art.
  const plateZ = await plate.evaluate((el) => getComputedStyle(el).zIndex);
  expect(["auto", "0"]).toContain(plateZ);
});
