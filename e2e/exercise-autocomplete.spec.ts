import { test, expect } from "@playwright/test";

test("JavaScript and TensorFlow.js suggestions can be accepted or dismissed by keyboard", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() =>
    localStorage.setItem("tc-cookie-consent", "declined"),
  );
  await page.goto(
    "/worlds/deep-orbit/foundations/introduction-to-tensors?start=challenge",
    { waitUntil: "domcontentloaded" },
  );
  const editor = page.locator(".cm-content");
  await expect(editor).toBeVisible();
  await editor.fill(
    "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];\nconst reading = tf.",
  );
  await editor.press("ControlOrMeta+End");
  await page.keyboard.type("ten");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.locator(".cm-completionLabel").first()).toHaveText(
    "tensor",
  );
  await page.screenshot({
    path: testInfo.outputPath("tensorflow-suggestions.png"),
    fullPage: true,
    style: "nextjs-portal {display:none!important}",
  });
  await page.keyboard.press("Tab");
  await expect(editor).toContainText("const reading = tf.tensor");
  expect((await editor.innerText()).split("\n").at(-1)).toBe(
    "const reading = tf.tensor",
  );
  await page.keyboard.insertText("(streamValues);\nconst shape = reading.");
  await page.keyboard.type("sh");
  await expect(page.locator(".cm-completionLabel").first()).toHaveText("shape");
  await page.keyboard.press("Enter");
  await expect(editor).toContainText("const shape = reading.shape");
  await page.keyboard.insertText(";\n");
  await page.keyboard.type("streamV");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.locator(".cm-completionLabel").first()).toHaveText(
    "streamValues",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(editor).toContainText("streamV");
});
