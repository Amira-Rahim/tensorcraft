// Run with the repository's local HTTP preview server available on port 8767.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const previewUrl =
  process.env.FOUNDATIONS_PREVIEW_URL ||
  "http://127.0.0.1:8767/docs/design-previews/foundations/index.html";
const screenshots = path.join(__dirname, "screenshots");
const report = {
  artifact: "Isolated visual prototype, not the production app",
  date: new Date().toISOString().slice(0, 10),
  viewChecks: 0,
  viewCheckScope:
    "Five lessons and five phases, both appearances, at 1440, 1024, 390, 320 pixels: overflow, image loading, single H1",
  reviewPanelChecks: 0,
  interactionChecks: [],
  pageErrors: [],
  axeChecks: [],
  limits: [
    "Exercise feedback is authored and does not grade submitted code",
    "Production migration and access gates are not implemented or tested here",
    "Automated accessibility checks and DOM announcement checks do not replace assistive technology testing",
    "No learner study or commercial validation",
    "Preview drafts use tab-scoped session storage; closing the tab ends the session",
  ],
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => report.pageErrors.push(error.message));
    const visit = async (lesson, phase) => {
      await page.goto(`${previewUrl}?lesson=${lesson}&phase=${phase}`);
      await page.evaluate(() => document.fonts.ready);
    };
    const appearance = async (scheme) => {
      if ((await page.locator("html").getAttribute("data-scheme")) !== scheme) {
        await page.locator("#theme-toggle").click();
      }
    };
    const openReview = async (tab = "settings") => {
      await page
        .locator(
          tab === "settings" ? "#open-preview-settings" : "#open-design-notes",
        )
        .click();
      assert.equal(
        await page.locator("#review-dialog").evaluate((el) => el.open),
        true,
      );
    };
    const closeReview = async () => {
      await page.locator("#close-review").click();
      assert.equal(
        await page.locator("#review-dialog").evaluate((el) => el.open),
        false,
      );
    };
    const chooseAttempt = async (attempt) => {
      await openReview();
      await page.locator("#attempt-select").selectOption(attempt);
      await closeReview();
    };
    const checkpoint = (name) => report.interactionChecks.push(name);
    const hold = async (selector) => {
      await page
        .locator(selector)
        .first()
        .evaluate((element) => {
          window.auditNode = element;
        });
    };
    const assertHeld = async (selector) => {
      assert.equal(
        await page
          .locator(selector)
          .first()
          .evaluate((element) => window.auditNode === element),
        true,
      );
    };
    const screenshot = async (name) => {
      await page.mouse.move(0, 0);
      await page.evaluate(() => {
        document.activeElement?.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({
        path: path.join(screenshots, `${name}.png`),
        fullPage: true,
      });
    };

    await visit(0, 0);
    await page.keyboard.press("Tab");
    assert.equal(
      await page
        .locator(".skip-link")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    assert.equal(
      await page
        .locator(".skip-link")
        .evaluate((el) => el.getBoundingClientRect().top >= 0),
      true,
    );
    await page.keyboard.press("Enter");
    assert.equal(
      await page
        .locator("#lesson-main")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    checkpoint(
      "Skip link is first in keyboard order, visible on focus, and focuses the lesson",
    );

    await page.evaluate(() => window.scrollTo(0, 0));
    const desktopHeader = await page.evaluate(() => ({
      titleSize: getComputedStyle(document.querySelector("#lesson-title"))
        .fontSize,
      accent: document.querySelector("#lesson-title .title-accent").textContent,
      mission: document.querySelector("#mission-eyebrow").textContent,
      sceneTop: document.querySelector(".scene").getBoundingClientRect().top,
      beats: document.querySelectorAll(".briefing-beats .dialogue").length,
      progress: document.querySelectorAll(".step-bar").length,
      controlsOpen: document.querySelector("#review-dialog").open,
    }));
    assert.equal(desktopHeader.titleSize, "60px");
    assert.equal(desktopHeader.accent, "Introduction");
    assert.match(desktopHeader.mission, /Mission 1.*18 min.*1 exercise/);
    assert.ok(desktopHeader.sceneTop <= 360);
    assert.equal(desktopHeader.beats, 3);
    assert.equal(desktopHeader.progress, 5);
    assert.equal(desktopHeader.controlsOpen, false);
    assert.equal(
      await page
        .locator(".briefing-beats")
        .evaluate((el) =>
          Boolean(
            el.compareDocumentPosition(
              document.querySelector(".briefing-assignment"),
            ) & Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        ),
      true,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page
        .locator("#lesson-title")
        .evaluate((el) => getComputedStyle(el).fontSize),
      "36px",
    );
    assert.equal(await page.locator(".steps").isVisible(), true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    checkpoint(
      "Approved header preserves 60/36px two-tone title, mission metadata, five visible progress segments, full crew scene, and review tools closed by default",
    );
    await page.locator(".lesson-menu summary").click();
    await page.locator("#lesson-list a[data-lesson='1']").click();
    assert.match(page.url(), /lesson=1&phase=0/);
    assert.equal(
      await page.locator("#lesson-menu").evaluate((el) => el.open),
      false,
    );
    await page.locator(".lesson-menu summary").click();
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("#lesson-menu").evaluate((el) => el.open),
      false,
    );
    assert.equal(
      await page
        .locator(".lesson-menu summary")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    checkpoint(
      "Lesson drawer navigates to actual lesson links, closes on selection, and supports Escape",
    );
    await visit(0, 0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("#replay-scene").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#lesson-status")
        .textContent.includes("All dialogue"),
    );
    assert.equal(
      await page
        .locator("[data-story-beat]")
        .evaluateAll(
          (elements) => elements.flatMap((el) => el.getAnimations()).length,
        ),
      0,
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator("#replay-scene").click();
    assert.match(
      await page.locator("#replay-scene").textContent(),
      /Stop replay/,
    );
    await page.locator("#replay-scene").click();
    assert.match(
      await page.locator("#replay-scene").textContent(),
      /Replay scene/,
    );
    checkpoint(
      "Scene replay is user-triggered, stoppable, and respects reduced motion without hiding dialogue",
    );

    await visit(0, 1);
    await page.getByText("Optional reference", { exact: true }).click();
    await hold('[data-reading="0"]');
    await page.locator('[data-reading="0"]').focus();
    await page.keyboard.press("Space");
    await assertHeld('[data-reading="0"]');
    assert.equal(
      await page.locator(".teaching details").evaluate((el) => el.open),
      true,
    );
    assert.equal(
      await page
        .locator('[data-reading="0"]')
        .evaluate((el) => el === document.activeElement),
      true,
    );
    assert.equal(
      await page.locator(".code-block .match").textContent(),
      "0.12",
    );
    await page.waitForFunction(() =>
      document
        .querySelector("#lesson-status")
        .textContent.includes("Position 0"),
    );
    checkpoint(
      "Packet selection updates matching code without closing reference or moving keyboard focus",
    );
    await page.evaluate(() => {
      window.auditStatus = document.querySelector("#lesson-status");
    });
    await page.locator('[data-reading="1"]').click();
    await page.waitForFunction(() =>
      document
        .querySelector("#lesson-status")
        .textContent.includes("Position 1"),
    );
    assert.equal(
      await page.evaluate(
        () => window.auditStatus === document.querySelector("#lesson-status"),
      ),
      true,
    );
    checkpoint(
      "One persistent polite live region receives changed instrument messages",
    );

    const lengthBefore = await page.evaluate(() => history.length);
    const conceptUrl = page.url();
    assert.match(
      await page.locator("#next-button").getAttribute("href"),
      /phase=2/,
    );
    await page.locator("#next-button").click();
    const challengeUrl = page.url();
    assert.equal(await page.evaluate(() => history.length), lengthBefore + 1);
    await page.goBack();
    assert.equal(page.url(), conceptUrl);
    assert.equal(await page.locator(".instrument").count(), 1);
    await page.goForward();
    assert.equal(page.url(), challengeUrl);
    assert.equal(await page.locator("#draft").count(), 1);
    assert.equal(
      await page
        .locator("#lesson-title")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    checkpoint(
      "Step anchors create browser history; Back and Forward restore phase and heading focus",
    );
    const popupPromise = context.waitForEvent("page");
    await page
      .locator('a.step[data-phase="1"]')
      .click({ modifiers: ["ControlOrMeta"] });
    const popup = await popupPromise;
    await popup.waitForLoadState();
    assert.match(popup.url(), /phase=1/);
    assert.equal(page.url(), challengeUrl);
    await popup.close();
    checkpoint(
      "Modified step-link click opens a new tab without changing the current step",
    );

    const draft =
      '// retained draft\nconst label = "</textarea><strong>literal</strong>";';
    await page.locator("#draft").fill(draft);
    await page.locator("#next-button").click();
    await page.locator("#back-button").click();
    assert.equal(await page.locator("#draft").inputValue(), draft);
    await page.reload();
    assert.equal(await page.locator("#draft").inputValue(), draft);
    await chooseAttempt("success");
    await page.locator("#draft").fill("// success draft");
    await chooseAttempt("retry");
    assert.equal(await page.locator("#draft").inputValue(), draft);
    await chooseAttempt("success");
    assert.equal(await page.locator("#draft").inputValue(), "// success draft");
    await page.reload();
    assert.equal(await page.locator("#attempt-select").inputValue(), "success");
    assert.equal(await page.locator("#draft").inputValue(), "// success draft");
    checkpoint(
      "Drafts survive steps, reload, and sample switching; each authored attempt keeps its own draft",
    );
    await page.getByText("Need a hint?", { exact: true }).click();
    await hold("#draft");
    await page.locator("#run-checks").click();
    await assertHeld("#draft");
    assert.equal(
      await page.locator(".challenge-grid details").evaluate((el) => el.open),
      true,
    );
    assert.match(
      await page.locator(".feedback").textContent(),
      /Sample checks passed/,
    );
    await page.waitForFunction(() =>
      document
        .querySelector("#lesson-status")
        .textContent.includes("Sample checks passed"),
    );
    await chooseAttempt("retry");
    await page.locator("#run-checks").click();
    assert.match(
      await page.locator(".feedback").textContent(),
      /reading.dispose/,
    );
    checkpoint(
      "Authored success and retry feedback preserve editor and hint, and update live announcement",
    );

    await visit(0, 3);
    await hold('[data-answer="1"]');
    await page.locator('[data-answer="1"]').focus();
    await page.keyboard.press("Space");
    await assertHeld('[data-answer="1"]');
    assert.equal(
      await page.locator('[data-answer="1"]').getAttribute("aria-pressed"),
      "true",
    );
    await page.waitForFunction(() =>
      document
        .querySelector("#lesson-status")
        .textContent.includes("That fits"),
    );
    checkpoint(
      "Recall feedback updates in place with keyboard focus and selected answer retained",
    );

    await visit(1, 1);
    await hold('[data-transform="transpose"]');
    await page.locator('[data-transform="transpose"]').click();
    await assertHeld('[data-transform="transpose"]');
    assert.deepEqual(
      await page.locator(".matrix").last().locator(".cell").allTextContents(),
      ["1", "4", "2", "5", "3", "6"],
    );
    await visit(2, 1);
    await page.locator('[data-gain="2"]').click();
    assert.deepEqual(
      await page.locator(".vector.result span").allTextContents(),
      ["6", "10", "14"],
    );
    assert.match(
      await page.locator(".code-block pre").textContent(),
      /const gain = 2/,
    );
    await visit(3, 1);
    await page.locator("#next-batch").click();
    assert.deepEqual(await page.locator(".batch .cell").allTextContents(), [
      "7",
      "3",
      "6",
      "4",
    ]);
    checkpoint(
      "Transpose, gain, and next-batch controls update their displayed values correctly",
    );

    await visit(4, 1);
    await hold(".scale-fill");
    await page.locator('[data-scale="normalized"]').click();
    await assertHeld(".scale-fill");
    await page.waitForFunction(() =>
      document
        .querySelector(".scale-fill")
        .getAnimations()
        .some((animation) => animation.playState === "running"),
    );
    assert.equal(
      await page.locator(".score-line strong").textContent(),
      "0.59",
    );
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const offset = await page.evaluate(() => {
        const track = document
          .querySelector(".scale-track")
          .getBoundingClientRect();
        const axis = document
          .querySelector(".axis-note")
          .getBoundingClientRect();
        const zero = document
          .querySelector(".axis-note span:nth-child(2)")
          .getBoundingClientRect();
        return {
          start: Math.abs(axis.left - track.left),
          end: Math.abs(axis.right - track.right),
          zero: Math.abs(
            (zero.left + zero.right) / 2 - (track.left + track.right) / 2,
          ),
        };
      });
      assert.ok(
        offset.start < 1 && offset.end < 1 && offset.zero < 1,
        `Scale axis matches the plotted domain at ${width}px`,
      );
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('[data-scale="raw"]').click();
    assert.equal(
      await page.locator(".score-line strong").textContent(),
      "1.00",
    );
    assert.equal(
      await page
        .locator(".scale-fill")
        .first()
        .evaluate((el) => getComputedStyle(el).transitionProperty),
      "transform",
    );
    checkpoint(
      "Scaling animates a mounted bar using transforms and can be interrupted by another choice",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator('[data-scale="normalized"]').click();
    report.reducedMotionTransition = await page
      .locator(".scale-fill")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    assert.equal(report.reducedMotionTransition, "0s");
    checkpoint("Reduced motion suppresses measurement transitions");
    await page.emulateMedia({ reducedMotion: "no-preference" });

    await appearance("light");
    assert.equal(
      await page.locator('meta[name="theme-color"]').getAttribute("content"),
      "#f5f5f2",
    );
    await page.reload();
    assert.equal(
      await page.locator("html").getAttribute("data-scheme"),
      "light",
    );
    assert.equal(
      await page.locator("#theme-toggle").getAttribute("aria-label"),
      "Use dark appearance",
    );
    await appearance("dark");
    assert.equal(
      await page.locator('meta[name="theme-color"]').getAttribute("content"),
      "#181818",
    );
    checkpoint(
      "Appearance persists across reload and synchronizes native/browser chrome colors",
    );

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const order = await page.locator(".concept-grid").evaluate((el) => ({
        dom: [...el.children].map((child) => child.className),
        visual: [...el.children]
          .sort((a, b) => {
            const x = a.getBoundingClientRect(),
              y = b.getBoundingClientRect();
            return Math.abs(x.top - y.top) < 2
              ? x.left - y.left
              : x.top - y.top;
          })
          .map((child) => child.className),
      }));
      assert.deepEqual(order.dom, ["mission-workbench", "teaching"]);
      const workbenchOrder = await page
        .locator(".mission-workbench")
        .evaluate((el) => [...el.children].map((child) => child.className));
      assert.deepEqual(workbenchOrder, ["scene-context", "instrument"]);
      assert.deepEqual(order.dom, order.visual);
    }
    checkpoint(
      "Desktop and mobile keep scene context and the working instrument ahead of explanation and code, in matching DOM and visual order",
    );

    for (let lesson = 0; lesson < 5; lesson++) {
      await visit(lesson, 1);
      assert.equal(await page.locator(".scene-context .scene img").count(), 1);
      assert.equal(await page.locator(".scene-context .dialogue").count(), 1);
      assert.equal(
        await page.locator(".instrument-status .observer").textContent(),
        "ARIA · console observation",
      );
      assert.equal(await page.locator(".teaching .code-block").count(), 1);
      await visit(lesson, 2);
      assert.equal(
        await page.locator(".challenge-brief .scene img").count(),
        1,
      );
      assert.equal(await page.locator(".challenge-preview").count(), 1);
      await visit(lesson, 3);
      assert.equal(await page.locator(".recall-figure").count(), 1);
      assert.equal(await page.locator(".dialogue").count(), 0);
      await visit(lesson, 4);
      assert.equal(await page.locator(".epilogue .scene img").count(), 1);
      assert.equal(await page.locator(".epilogue .dialogue").count(), 1);
      assert.equal(
        await page.locator(".story-artifact .unresolved").count(),
        1,
      );
      if (lesson < 4)
        assert.doesNotMatch(
          await page.locator("#lesson-body").textContent(),
          /7741/,
        );
      if (lesson === 0)
        assert.match(
          await page.locator(".story-artifact").textContent(),
          /256.*rank 1/,
        );
      if (lesson === 3)
        assert.match(
          await page.locator(".story-artifact").textContent(),
          /story value.*not a measured/,
        );
    }
    checkpoint(
      "All five lessons retain scene context through Concept and Challenge, visual recall without new story, and canonical epilogue voices with unresolved evidence",
    );
    await visit(0, 1);
    await hold(".packet-plot");
    await page.locator('[data-reading="4"]').click();
    await assertHeld(".packet-plot");
    assert.match(
      await page.locator(".packet-plot").getAttribute("aria-label"),
      /Selected position 4, value 0.47/,
    );
    assert.equal(
      await page
        .locator(".packet-plot .plot-value")
        .allTextContents()
        .then((values) => values.join("")),
      "0.47",
    );
    checkpoint(
      "Packet selection updates the mounted plot, readout, and code for the same selected value",
    );

    await visit(4, 4);
    assert.equal(await page.locator("#next-button").isVisible(), false);
    await page.locator("#boundary-button").click();
    assert.match(
      await page.locator(".review-note").textContent(),
      /Neural networks/,
    );
    assert.match(page.url(), /lesson=4&phase=4/);
    await page.waitForFunction(() =>
      document
        .querySelector("#lesson-status")
        .textContent.includes("Neural networks"),
    );
    checkpoint(
      "Final destination announces the preview boundary without restarting the foundations",
    );

    await visit(0, 2);
    await page.locator("#draft").fill("// review panel keeps this draft");
    await openReview();
    const footerScroll = await page.evaluate(() => scrollY);
    assert.equal(
      await page
        .locator("#settings-tab")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    // The native modal contains keyboard navigation and makes the lesson inert.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(
          () =>
            document.activeElement === document.body ||
            document
              .querySelector("#review-dialog")
              .contains(document.activeElement),
        ),
        true,
      );
    }
    await page.locator("#next-button").evaluate((el) => el.focus());
    assert.equal(
      await page
        .locator("#next-button")
        .evaluate((el) => el === document.activeElement),
      false,
    );
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("#review-dialog").evaluate((el) => el.open),
      false,
    );
    assert.equal(
      await page
        .locator("#open-preview-settings")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    assert.equal(await page.evaluate(() => scrollY), footerScroll);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    checkpoint(
      "Review dialog contains focus, makes the lesson inert, and restores footer focus and scroll on Escape",
    );

    await openReview();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page.locator("#notes-tab").getAttribute("aria-selected"),
      "true",
    );
    assert.equal(await page.locator("#design-notes").isVisible(), true);
    assert.equal(await page.locator("#preview-controls").isVisible(), false);
    await page.keyboard.press("Home");
    assert.equal(
      await page.locator("#settings-tab").getAttribute("aria-selected"),
      "true",
    );
    await page.keyboard.press("End");
    assert.equal(
      await page.locator("#notes-tab").getAttribute("aria-selected"),
      "true",
    );
    await page.locator("#review-title").click();
    assert.equal(
      await page.locator("#review-dialog").evaluate((el) => el.open),
      true,
    );
    await page.mouse.click(20, 20);
    assert.equal(
      await page.locator("#review-dialog").evaluate((el) => el.open),
      false,
    );
    checkpoint(
      "Review tabs support arrow, Home, and End keys; outside click dismisses without treating panel content as backdrop",
    );

    await openReview();
    const currentUrl = page.url();
    await page.locator("#lesson-select").selectOption("4");
    await page.locator("#step-select").selectOption("1");
    assert.equal(page.url(), currentUrl);
    await page.locator("#preview-navigation button").click();
    assert.match(page.url(), /lesson=4&phase=1/);
    assert.equal(
      await page.locator("#review-dialog").evaluate((el) => el.open),
      false,
    );
    assert.equal(
      await page
        .locator("#lesson-title")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    assert.equal(await page.evaluate(() => scrollY), 0);
    await openReview();
    assert.equal(await page.locator("#state-control").isVisible(), false);
    await page.locator("#lesson-select").selectOption("0");
    await page.locator("#step-select").selectOption("2");
    await page.locator("#preview-navigation button").click();
    assert.equal(
      await page.locator("#draft").inputValue(),
      "// review panel keeps this draft",
    );
    checkpoint(
      "Preview navigation waits for Open step, closes the panel, focuses the lesson, and keeps per-lesson drafts",
    );

    await openReview();
    await page.locator("#attempt-select").selectOption("success");
    await page.locator("#draft").evaluate((el) => {
      window.auditDraft = el;
      window.auditDraftValue = el.value;
    });
    await page.locator("#preview-feedback").click();
    assert.equal(
      await page.locator("#review-dialog").evaluate((el) => el.open),
      false,
    );
    assert.equal(
      await page
        .locator("#draft")
        .evaluate(
          (el) =>
            el === window.auditDraft && el.value === window.auditDraftValue,
        ),
      true,
    );
    assert.equal(
      await page
        .locator("#run-checks")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    assert.match(
      await page.locator(".feedback").textContent(),
      /Sample checks passed/,
    );
    await page.waitForFunction(() =>
      document
        .querySelector("#lesson-status")
        .textContent.includes("Sample checks passed"),
    );
    checkpoint(
      "Preview feedback shows the selected authored outcome in the lesson, preserving the editor and announcing the result",
    );

    const fallbackContext = await browser.newContext();
    await fallbackContext.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new Error("Storage unavailable");
      };
    });
    const fallback = await fallbackContext.newPage();
    await fallback.goto(`${previewUrl}?lesson=0&phase=2`);
    await fallback.locator("#draft").fill("// temporary draft");
    assert.match(
      await fallback.locator("#draft-note").textContent(),
      /stays open/,
    );
    await fallback.locator("#next-button").click();
    await fallback.locator("#back-button").click();
    assert.equal(
      await fallback.locator("#draft").inputValue(),
      "// temporary draft",
    );
    await fallbackContext.close();
    checkpoint(
      "Unavailable storage keeps in-memory edits and shows an accurate retention label",
    );

    for (const scheme of ["dark", "light"]) {
      for (const width of [1440, 1024, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        for (let lesson = 0; lesson < 5; lesson++) {
          for (let phase = 0; phase < 5; phase++) {
            await visit(lesson, phase);
            await appearance(scheme);
            const layout = await page.evaluate(async () => {
              await Promise.all(
                [...document.images].map((image) =>
                  image.decode().catch(() => {}),
                ),
              );
              return {
                overflow: document.documentElement.scrollWidth > innerWidth,
                h1: document.querySelectorAll("h1").length,
                images: [...document.images].every(
                  (image) => image.naturalWidth > 0,
                ),
              };
            });
            assert.deepEqual(
              layout,
              { overflow: false, h1: 1, images: true },
              `${scheme} ${width} lesson ${lesson} phase ${phase}`,
            );
            report.viewChecks++;
          }
        }
      }
    }
    console.log(`${report.viewChecks} responsive view checks passed`);

    for (const scheme of ["dark", "light"]) {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const [lesson, phase] of [
          [0, 0],
          [0, 1],
          [0, 2],
          [0, 3],
          [0, 4],
          [4, 4],
          [1, 1],
          [2, 1],
          [3, 1],
          [4, 1],
        ]) {
          await visit(lesson, phase);
          await appearance(scheme);
          if (phase === 2) await page.locator("#run-checks").click();
          if (phase === 3) await page.locator('[data-answer="1"]').click();
          const result = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          const violations = result.violations.map(({ id, impact, nodes }) => ({
            id,
            impact,
            targets: nodes.flatMap((node) => node.target),
          }));
          report.axeChecks.push({
            lesson: lesson + 1,
            phase: phase + 1,
            scheme,
            width,
            violations,
          });
          assert.deepEqual(
            violations,
            [],
            `axe ${scheme} ${width} ${lesson}/${phase}`,
          );
        }
      }
    }
    for (const scheme of ["dark", "light"]) {
      for (const width of [1440, 1024, 390, 320]) {
        await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
        await visit(0, 2);
        await appearance(scheme);
        for (const tab of ["settings", "notes"]) {
          await openReview(tab);
          // Include the lower content, swatches, and links in layout and accessibility checks.
          if (tab === "notes") {
            await page.locator(".review-disclosure summary").nth(0).click();
            await page.locator(".review-disclosure summary").nth(1).click();
          }
          const layout = await page.locator("#review-dialog").evaluate((el) => {
            const rect = el.getBoundingClientRect(),
              close = document
                .querySelector("#close-review")
                .getBoundingClientRect();
            const scroll = document.querySelector(".review-scroll");
            return {
              overflow:
                el.scrollWidth > el.clientWidth ||
                scroll.scrollWidth > scroll.clientWidth,
              visible:
                rect.left >= 0 &&
                rect.top >= -1 &&
                rect.right <= innerWidth + 1 &&
                rect.bottom <= innerHeight + 1,
              closeVisible: close.top >= 0 && close.bottom <= innerHeight,
              bodyLocked: document.body.style.overflow === "hidden",
            };
          });
          assert.deepEqual(
            layout,
            {
              overflow: false,
              visible: true,
              closeVisible: true,
              bodyLocked: true,
            },
            `review ${scheme} ${width} ${tab}`,
          );
          await page.locator(".review-scroll").evaluate((el) => {
            el.scrollTop = el.scrollHeight;
          });
          assert.equal(await page.locator("#close-review").isVisible(), true);
          report.reviewPanelChecks++;
          if (width !== 1024) {
            const result = await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
              .analyze();
            const violations = result.violations.map(
              ({ id, impact, nodes }) => ({
                id,
                impact,
                targets: nodes.flatMap((node) => node.target),
              }),
            );
            report.axeChecks.push({ panel: tab, scheme, width, violations });
            assert.deepEqual(
              violations,
              [],
              `axe review ${scheme} ${width} ${tab}`,
            );
          }
          await closeReview();
        }
      }
    }
    console.log(`${report.axeChecks.length} axe checks passed`);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const [name, lesson, phase] of [
      ["desktop-briefing", 0, 0],
      ["desktop-tensors", 0, 1],
      ["desktop-epilogue", 0, 4],
      ["desktop-takeaways", 0, 3],
      ["desktop-operations", 2, 1],
      ["desktop-final-scene", 4, 4],
      ["desktop-shapes", 1, 1],
      ["desktop-batching", 3, 1],
      ["desktop-normalization", 4, 1],
    ]) {
      await visit(lesson, phase);
      await appearance("dark");
      if (lesson === 1 && phase === 1)
        await page.locator('[data-transform="transpose"]').click();
      if (lesson === 4 && phase === 1)
        await page.locator('[data-scale="normalized"]').click();
      await screenshot(name);
    }
    await visit(0, 1);
    await appearance("light");
    await screenshot("desktop-light");
    await visit(0, 2);
    await appearance("dark");
    await chooseAttempt("success");
    await page
      .locator("#draft")
      .fill(
        "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];\nconst reading = tf.tensor(streamValues);\nconst shape = reading.shape;\nconst values = Array.from(reading.dataSync());\nconst total = tf.tidy(() => reading.sum().dataSync()[0]);\nreading.dispose();",
      );
    await screenshot("desktop-challenge");
    await chooseAttempt("retry");
    await page
      .locator("#draft")
      .fill(
        "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];\nconst reading = tf.tensor(streamValues);\nconst shape = reading.shape;\nconst values = Array.from(reading.dataSync());\nconst total = tf.tidy(() => reading.sum().dataSync()[0]);\n// Release reading after its final use.",
      );
    await page.locator("#run-checks").click();
    await screenshot("desktop-retry");
    await page.setViewportSize({ width: 390, height: 844 });
    await visit(0, 0);
    await screenshot("phone-briefing");
    await visit(0, 1);
    await screenshot("phone-tensors");
    await visit(0, 2);
    await screenshot("phone-challenge");
    await visit(0, 4);
    await screenshot("phone-epilogue");
    await visit(4, 1);
    await page.locator('[data-scale="normalized"]').click();
    await screenshot("phone-normalization");
    for (const [prefix, width, height] of [
      ["desktop", 1440, 1000],
      ["phone", 390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      await visit(0, 2);
      await appearance("dark");
      await page.locator(".brand-footer").scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await page.screenshot({
        path: path.join(screenshots, `${prefix}-footer.png`),
      });
      for (const tab of ["settings", "notes"]) {
        await openReview(tab);
        await page.mouse.move(0, 0);
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
        await page.screenshot({
          path: path.join(screenshots, `${prefix}-review-${tab}.png`),
        });
        await closeReview();
      }
    }
    assert.deepEqual(report.pageErrors, []);
    fs.writeFileSync(
      path.join(__dirname, "verification.json"),
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(
      `${report.interactionChecks.length} interaction checks passed; screenshots and verification.json updated`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
