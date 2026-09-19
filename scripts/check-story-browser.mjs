// Invoked by: node scripts/check-content-browser.mjs --story
// Real MDX, renderer, components and RPC client; only the Supabase transport
// is replaced by an in-memory first-write-wins fixture. No production writes.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

export async function runStoryChecks({
  page,
  base,
  lessons,
  fixture,
  root,
  history,
}) {
  const decisions = [];
  const scenes = new Map();
  for (let index = 0; index < lessons.length; index++) {
    const lesson = lessons[index];
    const dir = path.join(
      root,
      "packages/content/content/deep-orbit",
      lesson.moduleId,
    );
    const source = readdirSync(dir)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => readFileSync(path.join(dir, f), "utf8"))
      .find((s) => s.match(/^slug: (.+)$/m)?.[1] === lesson.slug);
    if (!source) throw new Error(`Source not found for ${lesson.slug}`);
    for (const match of source.matchAll(
      /<BossBeat\s+beatId="([^"]+)"[\s\S]*?options=\{(\[[\s\S]*?\])\}\s*\/>/g,
    )) {
      // Legacy authored object keys are JS identifiers; these files now use JSON.
      const options = JSON.parse(
        match[2].replace(/\b(label|display|consequence):/g, '"$1":'),
      );
      decisions.push({
        beatId: match[1],
        index,
        options,
        version: Number(match[0].match(/contentVersion=\{(\d+)\}/)?.[1] ?? 1),
      });
    }
    for (const match of source.matchAll(
      /<StoryConsequence\s+beatId="([^"]+)"(?:\s+contentVersion=\{\d+\})?\s+fallback="([^"]+)"\s+outcomes=\{(\{[\s\S]*?\})\}\s*\/>/g,
    )) {
      scenes.set(match[1], {
        index,
        fallback: match[2],
        outcomes: JSON.parse(match[3]),
      });
    }
  }
  expect(decisions).toHaveLength(6);
  expect(scenes.size).toBe(6);
  const show = async (target, index, mode = "all") => {
    // Always remount, including returning to the same finale after its briefing.
    await target.evaluate(() => window.showLesson(-1));
    await target.evaluate(({ index, mode }) => window.showLesson(index, mode), {
      index,
      mode,
    });
    await expect(target.locator("#title")).toHaveText(lessons[index].title);
  };
  const scene = (target, id) =>
    target.locator(`[data-testid="story-consequence"][data-beat-id="${id}"]`);
  const results = [];
  for (const decision of decisions) {
    const later = scenes.get(decision.beatId);
    expect(later).toBeTruthy();
    expect(new Set(Object.values(later.outcomes)).size).toBe(4);
    fixture.choices.clear();
    await show(page, later.index, "consequence");
    await expect(scene(page, decision.beatId)).toHaveText(later.fallback);
    for (const option of decision.options) {
      fixture.choices.clear();
      await show(page, decision.index, "briefing");
      const button = page.getByTestId(`boss-beat-option-${option.label}`);
      await expect(button).toBeVisible();
      await button.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("boss-beat-resolved")).toHaveAttribute(
        "data-choice-label",
        option.label,
      );
      await show(page, later.index, "consequence");
      await expect(scene(page, decision.beatId)).toHaveText(
        later.outcomes[option.label],
      );
      await page.reload();
      await page.waitForFunction(() => window.lessonCount === 56);
      await show(page, later.index, "consequence");
      await expect(scene(page, decision.beatId)).toHaveText(
        later.outcomes[option.label],
      );
      await show(page, decision.index, "briefing");
      await expect(page.getByTestId("boss-beat-resolved")).toContainText(
        option.display,
      );
      await expect(page.getByTestId("boss-beat-active")).toHaveCount(0);
      results.push({
        beatId: decision.beatId,
        version: decision.version,
        option: option.label,
        saved: true,
        laterScene: lessons[later.index].slug,
        survivesReload: true,
      });
    }
  }
  const historicalResults = [];
  for (const decision of decisions.filter((d) => history[d.beatId])) {
    const original = history[decision.beatId][1];
    for (const [choiceIndex, option] of original.options.entries()) {
      fixture.choices.clear();
      fixture.choices.set(decision.beatId, {
        beat_id: decision.beatId,
        choice_index: choiceIndex,
        choice_label: option.label,
        reaction_ms: 5,
        chosen_at: "2026-09-18T00:00:00Z",
        content_version: 1,
      });
      await show(page, decision.index, "briefing");
      await expect(page.getByTestId("boss-beat-resolved")).toContainText(
        option.display,
      );
      await expect(page.getByTestId("boss-beat-resolved")).toContainText(
        option.consequence,
      );
      await expect(page.getByTestId("boss-beat-resolved")).toHaveAttribute(
        "data-content-version",
        "1",
      );
      await show(page, scenes.get(decision.beatId).index, "consequence");
      await expect(scene(page, decision.beatId)).toHaveText(
        original.outcomes[option.label],
      );
      historicalResults.push({
        beatId: decision.beatId,
        version: 1,
        choiceIndex,
        originalMeaningPreserved: true,
      });
    }
  }

  // A drift handover and the launch rehearsal coexist without overwriting
  // either record. The last mission row must remain after every branch.
  const drift = decisions.find((d) => d.beatId === "deep-orbit-drift-response");
  const launch = decisions.find(
    (d) => d.beatId === "deep-orbit-launch-deploy-call",
  );
  for (const [driftIndex, launchIndex] of [
    [0, 3],
    [3, 0],
    [3, 3],
    [0, 0],
  ]) {
    fixture.choices.clear();
    for (const [decision, choiceIndex] of [
      [drift, driftIndex],
      [launch, launchIndex],
    ])
      fixture.choices.set(decision.beatId, {
        beat_id: decision.beatId,
        choice_index: choiceIndex,
        choice_label: decision.options[choiceIndex].label,
        content_version: decision.version,
        reaction_ms: 5,
        chosen_at: "2026-09-19T00:00:00Z",
      });
    for (const decision of [drift, launch]) {
      const later = scenes.get(decision.beatId);
      await show(page, later.index, "consequence");
      await expect(scene(page, decision.beatId)).toHaveText(
        later.outcomes[fixture.choices.get(decision.beatId).choice_label],
      );
    }
    await expect(
      page.locator('[data-testid="epilogue"] code').last(),
    ).toContainText("operator_note: none");
  }
  const first = decisions[0],
    later = scenes.get(first.beatId);
  fixture.choices.clear();
  fixture.failReads = 1;
  await show(page, first.index, "briefing");
  await page.getByRole("button", { name: "Retry loading choice" }).click();
  fixture.failWrites = 1;
  await page.getByTestId("boss-beat-option-dominant").click();
  await expect(page.getByRole("alert")).toContainText("could not confirm");
  expect(fixture.choices.size).toBe(0);
  await page.getByTestId("boss-beat-option-dominant").click();
  await expect(page.getByTestId("boss-beat-resolved")).toBeVisible();
  fixture.failReads = 1;
  await show(page, later.index, "consequence");
  await expect(scene(page, first.beatId)).toHaveCount(0);
  await page.getByRole("button", { name: "Retry scene" }).click();
  await expect(scene(page, first.beatId)).toHaveText(later.outcomes.dominant);

  // Two open tabs submit different choices. The second must display the first
  // stored choice instead of its own optimistic selection.
  fixture.choices.clear();
  await show(page, first.index, "briefing");
  const second = await page.context().newPage();
  await second.goto(base + "/__content-review");
  await second.waitForFunction(() => window.lessonCount === 56);
  await show(second, first.index, "briefing");
  await expect(second.getByTestId("boss-beat-active")).toBeVisible();
  await page.getByTestId("boss-beat-option-cooperate").click();
  await expect(page.getByTestId("boss-beat-resolved")).toHaveAttribute(
    "data-choice-label",
    "cooperate",
  );
  await second.getByTestId("boss-beat-option-dominant").click();
  await expect(second.getByTestId("boss-beat-resolved")).toHaveAttribute(
    "data-choice-label",
    "cooperate",
  );
  await second.close();

  for (const decision of decisions.filter((d) =>
    [
      "deep-orbit-foundations-7741-first-flag",
      "deep-orbit-cache-policy",
      "deep-orbit-drift-response",
    ].includes(d.beatId),
  )) {
    fixture.choices.clear();
    await show(page, decision.index, "briefing");
    for (const width of [1100, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.getByTestId("boss-beat-active").scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const accessibility = await new AxeBuilder({ page })
        .include('[data-testid="boss-beat-active"]')
        .analyze();
      expect(accessibility.violations).toEqual([]);
      await page.screenshot({
        path: `test-results/content-review/${decision.beatId}-${width}.png`,
      });
    }
  }
  writeFileSync(
    "test-results/content-review/story-results.json",
    JSON.stringify(
      {
        scope:
          "Local production MDX/client with mocked Supabase transport, no live database claim",
        results,
        historicalResults,
        handoverCombinations: 4,
        failureRecovery: true,
        firstWriteWins: true,
        keyboard: true,
        axePilotWidths: [1100, 375],
      },
      null,
      2,
    ),
  );
  console.log(
    "Story checks passed: 24 current branches, 8 historical branches, 4 combined handovers, reload/revisit, failures, competing tabs, keyboard and three decision accessibility checks.",
  );
}
