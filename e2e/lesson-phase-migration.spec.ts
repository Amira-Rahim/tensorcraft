import { test, expect } from "@playwright/test";
const path = "/worlds/deep-orbit/foundations/introduction-to-tensors";
const oldKey = "tc_step_deep-orbit_introduction-to-tensors";
const oldMax = "tc_step_max_deep-orbit_introduction-to-tensors";
const current = "tc_step_v2_deep-orbit_introduction-to-tensors";
const names = ["briefing", "concept", "challenge", "takeaways", "epilogue"];
for (const [old, phase] of [0, 1, 1, 2, 3, 4].entries()) {
  test(`legacy phase ${old} restores as ${names[phase]}`, async ({ page }) => {
    await page.addInitScript(
      ({ old, oldKey, oldMax }) => {
        localStorage.setItem(oldKey, String(old));
        localStorage.setItem(oldMax, String(old));
        localStorage.setItem(`${oldKey}-visited`, JSON.stringify([old]));
        localStorage.setItem("tc-cookie-consent", "declined");
        localStorage.setItem("tc-script-skip", "1");
      },
      { old, oldKey, oldMax },
    );
    await page.goto(`${path}#step-${old + 1}`);
    await expect(page).toHaveURL(new RegExp(`#step-${names[phase]}$`));
    expect(
      await page.evaluate((key) => localStorage.getItem(key), current),
    ).toBe(String(phase));
    expect(
      await page.evaluate((key) => localStorage.getItem(key), oldKey),
    ).toBe(String(old));
    expect(await page.evaluate(() => history.state.tcStepsVersion)).toBe(2);
    await expect(page.getByRole("button", { name: /^Step / })).toHaveCount(5);
  });
}
test("legacy exercise passes still open the gate and Back keeps semantic history", async ({
  page,
}) => {
  await page.addInitScript(
    ({ oldKey, oldMax }) => {
      localStorage.setItem(oldKey, "3");
      localStorage.setItem(oldMax, "3");
      localStorage.setItem(
        `${oldKey}-passed`,
        JSON.stringify(["create-a-tensor", "unrelated-exercise"]),
      );
      localStorage.setItem("tc-cookie-consent", "declined");
    },
    { oldKey, oldMax },
  );
  await page.goto(path);
  await expect(page).toHaveURL(/#step-challenge$/);
  await expect(
    page
      .getByTestId("lesson-nav")
      .getByRole("button", { name: "Continue →", exact: true }),
  ).toBeEnabled();
  await page
    .getByTestId("lesson-nav")
    .getByRole("button", { name: "Continue →", exact: true })
    .click();
  await expect(page).toHaveURL(/#step-takeaways$/);
  await page.goBack();
  await expect(page).toHaveURL(/#step-challenge$/);
  await expect(
    page
      .getByTestId("lesson-nav")
      .getByRole("button", { name: "Continue →", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key + "-passed")!),
      oldKey,
    ),
  ).toEqual(["create-a-tensor"]);
});
