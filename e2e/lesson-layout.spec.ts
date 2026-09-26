import { test, expect, type Page } from "@playwright/test";
import { seedDueReview, REVIEW_WARMUP_LESSON } from "./review-fixture";

/*
  Layout criteria from docs/superpowers/specs/2026-09-23-lesson-layout-design.md.
  Two free lessons: one whose bridge follows a paragraph, and one whose
  bridge the build moved after its section's first paragraph. The spanning
  case, a companion with no paragraph to pair with, is checked on the one
  free lesson that has it and by injecting a companion after a heading in
  the first lesson's grid.
*/
// All in the free module: a signed-out visitor is redirected to the paywall
// on any paid lesson, and the e2e suite has no purchased fixture. Of the 22
// companions that span (the plugin unit test prints the corpus list), one
// is in a free lesson: the concept reference in foundations/normalization,
// checked below. The other 21, the twelve heading-led bridges among them,
// are in paid lessons, so the heading-led shape is exercised by injecting a
// companion into lesson 1's real grid.
const LESSONS = {
  paragraphLed: "/worlds/deep-orbit/foundations/introduction-to-tensors",
  headingLed: "/worlds/deep-orbit/foundations/tensor-shapes",
};
// Its concept reference follows the normalization experiment and wraps the
// rest of its section, so the build leaves it with nothing to pair with.
const SPANNING_LESSON = "/worlds/deep-orbit/foundations/normalization";
// The Code step on the free module's only lesson with a derivation drawer,
// which stacks above the worked example in the left slot (spec section 4).
const CODE_LESSONS = {
  ...LESSONS,
  withDrawer: "/worlds/deep-orbit/foundations/tensor-operations",
};

async function openStep(page: Page, path: string, step: number) {
  const slug = path.split("/").pop()!;
  await page.addInitScript(
    ({ slug, step }) => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
      // The still-art Briefing. A browser with no assignment is given "clip"
      // (apps/web/lib/briefing-variant.ts), which puts the scene video in
      // the plate for any lesson the clip manifest lists; pinning "text"
      // keeps a future clip from changing what these checks measure.
      localStorage.setItem("tc-briefing-variant", "text");
      localStorage.setItem(`tc_step_deep-orbit_${slug}`, String(step));
      localStorage.setItem(`tc_step_max_deep-orbit_${slug}`, String(step));
    },
    { slug, step },
  );
  // domcontentloaded plus the step's own marker below, as the sibling
  // lesson specs do; networkidle can wait on analytics beacons.
  await page.goto(path, { waitUntil: "domcontentloaded" });
  // The step is restored from localStorage in a client effect, so the
  // server HTML is always the Briefing. Wait for the requested step's own
  // marker before anything measures a box, or the Briefing's Continue
  // button can be measured against the Concept grid.
  switch (step) {
    case 0: // Briefing: the scene has resolved (the skip preference ends it)
      await expect(page.locator("[data-script-state='done']")).toBeAttached();
      break;
    case 1: // Concept: the paired grid
      await expect(
        page.locator('.lesson-step-content[data-layout="paired"]'),
      ).toBeVisible();
      break;
    case 2: // Code: the worked-example slot
      await expect(
        page.locator("[data-testid='lesson-right'][data-kind='code']"),
      ).toBeVisible();
      break;
    case 3: // Challenge: the editor pane, behind the view toggle on phones
      await expect(
        page.locator("[data-testid='lesson-right'][data-kind='pane']"),
      ).toBeAttached();
      break;
    case 4: // Takeaways
      await expect(page.getByTestId("takeaways-recall")).toBeVisible();
      break;
    case 5: // Complete
      await expect(
        page.getByRole("group", { name: /^Step 6 of 6/ }),
      ).toBeVisible();
      break;
    default:
      throw new Error(`openStep has no settled marker for step ${step}`);
  }
  // The marker appears as the client mounts the step, which is when the
  // step group starts its 0.3 s step-in (a 12 px translateY). On the Code
  // and Challenge steps the right slot and the nav sit outside the group,
  // so a box read mid-animation shortens every gap across that boundary by
  // the remaining offset. Measure once the group has settled.
  await page
    .getByRole("group", { name: /^Step \d of 6/ })
    .evaluate(async (g) => {
      await Promise.all(g.getAnimations().map((a) => a.finished));
    });
}

// The Takeaways step as a returning learner sees it: the recall remembered
// in this browser, so the recap and the terms list show at once. openStep
// waits only for the recall card, which is the whole step until it settles.
async function openSettledTakeaways(page: Page, path: string) {
  const slug = path.split("/").pop()!;
  await page.addInitScript((slug) => {
    localStorage.setItem(`tc_recall_deep-orbit_${slug}`, "1");
  }, slug);
  await openStep(page, path, 4);
  await expect(page.getByTestId("takeaways-prose")).toBeVisible();
  await expect(page.getByTestId("lesson-terms-list")).toBeVisible();
}

/*
  Every check below reads the boxes it compares in one page.evaluate, so a
  late re-layout (the guest email capture renders after its session check
  resolves) cannot land between two reads. Inside those reads, one() is the
  strict query: an element the check expects once must match exactly once.
*/

// The footer's top edge less the bottom of the nav's lowest control. The
// nav's own box ends at its bottom padding (--l-nav-bottom, the 40 px), so
// a reading from that box stays 0 when the padding is lost.
function footerGap(page: Page) {
  return page.evaluate(() => {
    const one = (s: string) => {
      const found = document.querySelectorAll(s);
      if (found.length !== 1) throw new Error(`${s}: ${found.length} matches`);
      return found[0];
    };
    const controls = [...one("[data-testid='lesson-nav']").children].filter(
      (el) => el.getBoundingClientRect().height > 0,
    );
    if (controls.length === 0) throw new Error("the nav shows no control");
    const lowest = Math.max(
      ...controls.map((el) => el.getBoundingClientRect().bottom),
    );
    return one("footer").getBoundingClientRect().top - lowest;
  });
}

// The story's lowest painted edge: the border-box bottom of the blocks
// inside the story grid's two items (the plate column's picture and stage
// direction, and the beats), not the items themselves, whose boxes contain
// any margin trapped inside them, which is exactly what these checks must
// see as gap. Read with the post-scene slot and the nav.
function storyEdges(page: Page) {
  return page.evaluate(() => {
    const one = (s: string) => {
      const found = document.querySelectorAll(s);
      if (found.length !== 1) throw new Error(`${s}: ${found.length} matches`);
      return found[0];
    };
    const blocks = [
      ...one(".lesson-story-grid").querySelectorAll(":scope > * > *"),
    ].filter((el) => el.getBoundingClientRect().height > 0);
    const slots = document.querySelectorAll("[data-post-scene]");
    if (slots.length > 1)
      throw new Error(`[data-post-scene]: ${slots.length} matches`);
    const slot = slots.length === 1 ? slots[0].getBoundingClientRect() : null;
    return {
      storyBottom: Math.max(
        ...blocks.map((el) => el.getBoundingClientRect().bottom),
      ),
      slotTop: slot ? slot.top : null,
      slotHeight: slot ? slot.height : 0,
      navTop: one("[data-testid='lesson-nav']").getBoundingClientRect().top,
    };
  });
}

// Lesson 1 opens the course, so a fresh guest has nothing earlier to recall
// and no module to catch up on: the post-scene slot must have no height,
// and the nav's hairline sits --l-nav-top below the story. A slot with
// height here is a surprise to look at, not a gap to accept.
async function freshGuestStoryEnd(page: Page) {
  await openStep(page, LESSONS.paragraphLed, 0);
  const m = await storyEdges(page);
  expect(m.slotHeight).toBe(0);
  expect(Math.abs(m.navTop - m.storyBottom - 40)).toBeLessThanOrEqual(1);
}

// Painted edges on the Code step. A slot's blocks are the direct children
// of its LessonContent root (.lesson-step-content > *); the left slot adds
// its intro line, which sits outside LessonContent and is the last block
// above the example on every lesson with nothing else there (40 of 56).
// The roots are left out on purpose: the code slot's root is a flex column,
// and a flex container's box contains its items' margins, so reading it
// would swallow the stray margin these checks exist to catch.
function codeStepEdges(page: Page) {
  return page.evaluate(() => {
    const within = (root: ParentNode, s: string) => [
      ...root.querySelectorAll(s),
    ];
    const one = (root: ParentNode, s: string) => {
      const found = within(root, s);
      if (found.length !== 1) throw new Error(`${s}: ${found.length} matches`);
      return found[0];
    };
    const painted = (els: Element[]) =>
      els.filter((el) => el.getBoundingClientRect().height > 0);
    const top = (el: Element) => el.getBoundingClientRect().top;
    const bottom = (el: Element) => el.getBoundingClientRect().bottom;
    const right = one(
      document,
      "[data-testid='lesson-right'][data-kind='code']",
    );
    const left = right.previousElementSibling!;
    const leftBlocks = [
      one(left, "[role='group'][aria-label^='Step 3'] > div > p"),
      ...painted(within(left, ".lesson-step-content > *")),
    ];
    const rightBlocks = painted(within(right, ".lesson-step-content > *"));
    if (rightBlocks.length === 0)
      throw new Error("the code slot paints no block");
    const drawers = painted(
      within(left, ".lesson-step-content > [data-aside]"),
    );
    return {
      leftBottom: Math.max(...leftBlocks.map(bottom)),
      rightTop: Math.min(...rightBlocks.map(top)),
      lastBottom: Math.max(...[...leftBlocks, ...rightBlocks].map(bottom)),
      navTop: top(one(document, "[data-testid='lesson-nav']")),
      // The lowest derivation drawer in the left slot, or null without one.
      drawerBottom: drawers.length ? Math.max(...drawers.map(bottom)) : null,
    };
  });
}

// A stacked dialogue beat after the first heading of lesson 1's real paired
// grid. The Concept step shows 12 such beats, in 11 paid lessons the suite
// cannot open. The element carries the attributes and classes the Dialogue
// component gives its stacked layout, and a line long enough to fill the
// 440 px beat.
function injectStackedBeat(page: Page) {
  return page
    .locator('.lesson-step-content[data-layout="paired"]')
    .evaluate((g) => {
      const beat = document.createElement("div");
      beat.setAttribute("data-dialogue", "true");
      beat.setAttribute("data-layout", "stack");
      beat.className = "mb-7 mx-auto max-w-[440px]";
      const line = document.createElement("p");
      line.textContent =
        "The thermal channel reads in the thirties and signal strength lives under one, so a raw feed lets temperature carry the whole story.";
      beat.append(line);
      g.querySelector(":scope > h2")!.after(beat);
      const gr = g.getBoundingClientRect();
      const br = beat.getBoundingClientRect();
      return {
        gridLeft: gr.left,
        gridWidth: gr.width,
        left: br.left,
        width: br.width,
      };
    });
}

// The Challenge tracks (spec section 4, amended): instructions on
// min(440 px, 38% of the content width), the editor on the rest after the
// 40 px gutter. Read from the two grid items. The instructions item fills
// its track; the editor pane reaches 20 px into the gutter (lg:-ml-5 with
// lg:pl-5, which centres its divider in the gutter), so its track is its
// width less those 20 px.
function challengeSplit(page: Page) {
  return page.evaluate(() => {
    const one = (s: string) => {
      const found = document.querySelectorAll(s);
      if (found.length !== 1) throw new Error(`${s}: ${found.length} matches`);
      return found[0];
    };
    const grid = one("[data-testid='lesson-grid']").getBoundingClientRect();
    const paneEl = one("[data-testid='lesson-right'][data-kind='pane']");
    const pane = paneEl.getBoundingClientRect();
    const instructions = paneEl.previousElementSibling!.getBoundingClientRect();
    return {
      content: grid.width,
      instructions: instructions.width,
      pane: pane.width,
      // Where the pane starts, from the instructions track's right edge.
      paneOffset: pane.left - instructions.right,
    };
  });
}

async function expectChallengeSplit(page: Page) {
  await openStep(page, LESSONS.paragraphLed, 3);
  const m = await challengeSplit(page);
  const instructions = Math.min(440, 0.38 * m.content);
  expect(Math.abs(m.instructions - instructions)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.paneOffset - 20)).toBeLessThanOrEqual(1);
  const editor = m.content - m.instructions - 40;
  expect(Math.abs(m.pane - 20 - editor)).toBeLessThanOrEqual(1);
}

test.describe("lesson layout, desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });

  // Takeaways twice: with the recall card alone, and settled with the
  // recap and the terms list below it.
  for (const [step, settled] of [
    [0, false],
    [1, false],
    [4, false],
    [4, true],
    [5, false],
  ] as const) {
    const which = settled
      ? `step ${step + 1} with the recall settled`
      : `step ${step + 1}`;
    test(`${which} has no right column, and the footer sits at least 40 px below the nav`, async ({
      page,
    }) => {
      if (settled) await openSettledTakeaways(page, LESSONS.paragraphLed);
      else await openStep(page, LESSONS.paragraphLed, step);
      // The spec's criterion names the rail by its kind. These steps render
      // no right slot at all, so any lesson-right here is a rail under
      // another name.
      await expect(
        page.locator('[data-testid="lesson-right"][data-kind="rail"]'),
      ).toHaveCount(0);
      await expect(page.getByTestId("lesson-right")).toHaveCount(0);
      // A floor, not an exact value: on a step shorter than the viewport
      // the page's minimum height adds space. The Code step pins the 40.
      expect(await footerGap(page)).toBeGreaterThanOrEqual(39);
    });
  }

  for (const [name, path] of Object.entries(LESSONS)) {
    test(`the plate sits beside the first beat on the ${name} lesson`, async ({
      page,
    }) => {
      await openStep(page, path, 0);
      const m = await page.evaluate(() => {
        const one = (s: string) => {
          const found = document.querySelectorAll(s);
          if (found.length !== 1)
            throw new Error(`${s}: ${found.length} matches`);
          return found[0];
        };
        const plate = one(".lesson-story-plate").getBoundingClientRect();
        // The first beat in DOM order is the story's first Dialogue.
        const beat = document
          .querySelector(".lesson-story-grid [data-dialogue]")!
          .getBoundingClientRect();
        const first = [
          ...one(".lesson-story-grid > .lesson-step-content").children,
        ].find((el) => el.getBoundingClientRect().height > 0)!;
        return {
          plateTop: plate.top,
          plateRight: plate.right,
          beatLeft: beat.left,
          storyTop: first.getBoundingClientRect().top,
        };
      });
      // This 360 px ceiling and the spec's 492 px starting point are both
      // signed-out measurements: the guest notice strip (about 33 px) sits
      // inside both. A miss by about that height means the measurement
      // conditions changed, not that the number should move.
      expect(m.plateTop).toBeLessThanOrEqual(360);
      expect(m.beatLeft).toBeGreaterThan(m.plateRight);
      // The story's first painted block starts level with the picture. On
      // lesson 1 that block is the first Dialogue; lesson 2 opens on the
      // sensor-log blockquote, so this reads the block, not the beat.
      expect(Math.abs(m.storyTop - m.plateTop)).toBeLessThanOrEqual(1);
    });
  }

  test("adjacent row beats sit --l-beat apart", async ({ page }) => {
    await openStep(page, LESSONS.paragraphLed, 0);
    // Beat gap (spec section 6: --l-beat is 16 px). Measured from the lower
    // of the first beat's last line and its avatar cell, not from the beat's
    // own box: a stray paragraph margin inside the row's text cell stretches
    // that box, so a box-to-box reading shows 16 even when beats sit 43 apart.
    const gap = await page.evaluate(() => {
      const painted = (el: Element | null) =>
        !!el && el.getBoundingClientRect().height > 0;
      // Painted beats only: the Briefing keeps a lesson's mid-lesson
      // Dialogues (after its first heading) in the DOM, hidden, and the
      // selector alone walks those too. The first two with nothing between
      // them: a stage direction between two beats would add its own height.
      const first = [
        ...document.querySelectorAll(".lesson-story-grid [data-dialogue]"),
      ].find(
        (b) =>
          painted(b) &&
          !!b.nextElementSibling?.matches("[data-dialogue]") &&
          painted(b.nextElementSibling),
      );
      if (!first) return null;
      const lines = first.querySelectorAll("p");
      const line = lines[lines.length - 1];
      const avatar = first.querySelector(
        "[data-dialogue-row]",
      )?.firstElementChild;
      if (!line || !avatar) return null;
      const bottom = Math.max(
        line.getBoundingClientRect().bottom,
        avatar.getBoundingClientRect().bottom,
      );
      return first.nextElementSibling!.getBoundingClientRect().top - bottom;
    });
    // null means no two adjacent painted beats in this lesson's story zone;
    // switch LESSONS.paragraphLed for a lesson that has them rather than
    // drop this.
    expect(gap).not.toBeNull();
    expect(Math.abs((gap ?? 0) - 16)).toBeLessThanOrEqual(2);
  });

  test("a fresh guest's story ends --l-nav-top above the nav at 1,440 px", async ({
    page,
  }) => {
    await freshGuestStoryEnd(page);
  });

  test("a due warm-up sits --l-slot below the story", async ({ page }) => {
    // The fixture marks lesson 1's recall prompt due; a warm-up only recalls
    // earlier lessons, so the card surfaces on lesson 2 (review-fixture.ts).
    await seedDueReview(page);
    await openStep(page, REVIEW_WARMUP_LESSON, 0);
    await expect(page.getByRole("region", { name: /Warm-up/ })).toBeVisible();
    const m = await storyEdges(page);
    expect(m.slotTop).not.toBeNull();
    expect(Math.abs(m.slotTop! - m.storyBottom - 24)).toBeLessThanOrEqual(1);
  });

  test("with no scene picture the story grid is one column", async ({
    page,
  }) => {
    // Abort the art so ScenePortrait takes its error path and renders
    // nothing (the sibling script-playback spec does the same).
    await page.route("**/scenes/**", (route) => route.abort());
    await openStep(page, LESSONS.paragraphLed, 0);
    await expect(page.locator(".lesson-story-plate figure")).toHaveCount(0);
    const m = await page.evaluate(() => {
      const one = (s: string) => {
        const found = document.querySelectorAll(s);
        if (found.length !== 1)
          throw new Error(`${s}: ${found.length} matches`);
        return found[0];
      };
      return {
        gridLeft: one(".lesson-story-grid").getBoundingClientRect().left,
        beatLeft: document
          .querySelector(".lesson-story-grid [data-dialogue]")!
          .getBoundingClientRect().left,
        columnWidth: one(
          ".lesson-story-grid > .lesson-step-content",
        ).getBoundingClientRect().width,
      };
    });
    // One column: the first beat starts at the grid's left edge, below the
    // stage direction, instead of beside an empty picture column. The grid
    // container spans the frame; its single track is the 820 px column.
    expect(Math.abs(m.beatLeft - m.gridLeft)).toBeLessThanOrEqual(1);
    expect(m.columnWidth).toBeLessThanOrEqual(820);
  });

  for (const [name, path] of Object.entries(LESSONS)) {
    test(`Concept pairs correctly on the ${name} lesson`, async ({ page }) => {
      await openStep(page, path, 1);
      const { gridLeft, rows } = await page
        .locator('.lesson-step-content[data-layout="paired"]')
        .evaluate((g) => ({
          gridLeft: Math.round(g.getBoundingClientRect().left),
          rows: [...g.children]
            .map((el) => {
              const r = el.getBoundingClientRect();
              return {
                aside: el.hasAttribute("data-aside"),
                prose: ["P", "UL", "OL", "BLOCKQUOTE"].includes(el.tagName),
                top: Math.round(r.top),
                left: Math.round(r.left),
                width: Math.round(r.width),
                hidden: r.width === 0 && r.height === 0,
              };
            })
            .filter((i) => !i.hidden),
        }));
      for (let i = 0; i < rows.length; i++) {
        const it = rows[i];
        if (it.aside) {
          const prev = rows[i - 1];
          if (prev && prev.prose && prev.width <= 600) {
            // paired: same row, in the companion track, which starts after
            // the 600 px text track and the 40 px gutter
            expect(Math.abs(it.top - prev.top)).toBeLessThanOrEqual(4);
            expect(Math.abs(it.left - (gridLeft + 640))).toBeLessThanOrEqual(1);
          } else {
            // unpaired: spans from the grid's left edge
            expect(it.left).toBe(gridLeft);
            expect(it.width).toBeGreaterThan(820);
          }
        } else if (it.prose) {
          const next = rows[i + 1];
          if (next?.aside && Math.abs(next.top - it.top) <= 4)
            expect(it.width).toBe(600);
          else {
            expect(it.width).toBeGreaterThan(600);
            expect(it.width).toBeLessThanOrEqual(820);
          }
        }
      }
      // No row with an empty first cell: every aside either shares a row
      // with a narrowed block or starts at the grid's left edge.
      for (const it of rows.filter((r) => r.aside)) {
        const partner = rows.find(
          (r) => !r.aside && Math.abs(r.top - it.top) <= 4,
        );
        expect(partner !== undefined || it.left === gridLeft).toBe(true);
      }
      // Every companion in these two lessons pairs today (of the 22 that
      // span, the one in a free lesson is normalization's, which the rule-6
      // tests below cover), so every companion here must pair. Without
      // this, a grid where nothing pairs passes the loop above: each
      // companion takes the spanning branch and each paragraph the
      // unpaired one.
      const companions = rows.flatMap((r, i) =>
        r.aside ? [{ r, prev: rows[i - 1] }] : [],
      );
      expect(companions.length).toBeGreaterThan(0);
      for (const { r, prev } of companions) {
        expect(prev?.prose).toBe(true);
        expect(prev!.width).toBe(600);
        expect(Math.abs(r.top - prev!.top)).toBeLessThanOrEqual(4);
      }
    });
  }

  test("a companion with nothing pairable before it spans the grid (rule 6)", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 1);
    // Inject a companion straight after the first heading, the shape the
    // twelve paid heading-led sections have after the build leaves them.
    const probe = await page
      .locator('.lesson-step-content[data-layout="paired"]')
      .evaluate((g) => {
        const h2 = g.querySelector(":scope > h2")!;
        const aside = document.createElement("div");
        aside.setAttribute("data-aside", "");
        aside.setAttribute("data-testid", "probe-aside");
        aside.textContent = "probe";
        h2.after(aside);
        const gr = g.getBoundingClientRect();
        const ar = aside.getBoundingClientRect();
        return {
          gridLeft: Math.round(gr.left),
          gridWidth: Math.round(gr.width),
          left: Math.round(ar.left),
          width: Math.round(ar.width),
        };
      });
    expect(probe.left).toBe(probe.gridLeft);
    expect(probe.width).toBe(probe.gridWidth);
  });

  test("normalization's concept reference spans the grid (rule 6, real content)", async ({
    page,
  }) => {
    await openStep(page, SPANNING_LESSON, 1);
    const m = await page
      .locator('.lesson-step-content[data-layout="paired"]')
      .evaluate((g) => {
        // Rule 6 reads DOM order: a painted companion whose previous
        // sibling is not a pairable block. Here that must be exactly one,
        // the concept reference after the normalization experiment.
        const pairable = ["P", "UL", "OL", "BLOCKQUOTE"];
        const unpaired = [...g.children].filter(
          (el) =>
            el.hasAttribute("data-aside") &&
            el.getBoundingClientRect().height > 0 &&
            !pairable.includes(el.previousElementSibling?.tagName ?? ""),
        );
        if (unpaired.length !== 1)
          throw new Error(`${unpaired.length} unpaired companions`);
        const gr = g.getBoundingClientRect();
        const r = unpaired[0].getBoundingClientRect();
        return {
          summary:
            unpaired[0].querySelector(":scope > summary")?.textContent ?? "",
          gridLeft: gr.left,
          gridWidth: gr.width,
          left: r.left,
          width: r.width,
        };
      });
    expect(m.summary).toMatch(/^Reference: /);
    expect(Math.abs(m.left - m.gridLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.width - m.gridWidth)).toBeLessThanOrEqual(1);
  });

  test("a stacked dialogue beat centres on the 820 px text measure", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 1);
    const m = await injectStackedBeat(page);
    // (820 - 440) / 2 = 190 px in from the grid's left, the centre of the
    // prose measure, not of the whole 1,184 px grid (372 px in).
    expect(Math.abs(m.left - (m.gridLeft + 190))).toBeLessThanOrEqual(1);
    expect(Math.abs(m.width - 440)).toBeLessThanOrEqual(1);
  });

  test("the Challenge instructions take min(440 px, 38%) and the editor the rest", async ({
    page,
  }) => {
    await expectChallengeSplit(page);
  });

  for (const [name, path] of Object.entries(CODE_LESSONS)) {
    test(`Code step: the worked example sits 24 px below the left slot on the ${name} lesson`, async ({
      page,
    }) => {
      await openStep(page, path, 2);
      const m = await codeStepEdges(page);
      if (path === CODE_LESSONS.withDrawer) {
        // The drawer, not the intro line above it, is the lowest block
        // over the example, so the gap below is read from the drawer.
        expect(m.drawerBottom).not.toBeNull();
        expect(m.drawerBottom).toBe(m.leftBottom);
      }
      expect(Math.abs(m.rightTop - m.leftBottom - 24)).toBeLessThanOrEqual(2);
    });

    test(`Code step: the nav sits 40 px below the example and 40 px above the footer on the ${name} lesson`, async ({
      page,
    }) => {
      await openStep(page, path, 2);
      const m = await codeStepEdges(page);
      expect(Math.abs(m.navTop - m.lastBottom - 40)).toBeLessThanOrEqual(2);
      // The Code step is taller than the viewport, so the page's minimum
      // height adds nothing: the nav's bottom padding (--l-nav-bottom) is
      // the whole gap between its controls and the footer.
      expect(Math.abs((await footerGap(page)) - 40)).toBeLessThanOrEqual(1);
    });
  }

  test("the Complete step's forward control sits in the nav row at the frame's right edge", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 5);
    const m = await page.evaluate(() => {
      const one = (s: string) => {
        const found = document.querySelectorAll(s);
        if (found.length !== 1)
          throw new Error(`${s}: ${found.length} matches`);
        return found[0];
      };
      const nav = one("[data-testid='lesson-nav']").getBoundingClientRect();
      const control = one("[data-testid='next-lesson-card']");
      const box = control.getBoundingClientRect();
      const frame = one("[data-testid='lesson-frame']").getBoundingClientRect();
      const frameRight =
        frame.right -
        parseFloat(
          getComputedStyle(one("[data-testid='lesson-frame']")).paddingRight,
        );
      const href = control.getAttribute("href");
      const nextLessonLinks = Array.from(document.querySelectorAll("a")).filter(
        (a) => a.getAttribute("href") === href && a.getClientRects().length > 0,
      ).length;
      return {
        inside: box.top >= nav.top && box.bottom <= nav.bottom,
        right: box.right,
        frameRight,
        text: control.textContent ?? "",
        nextLessonLinks,
      };
    });
    expect(m.inside).toBe(true);
    expect(Math.abs(m.right - m.frameRight)).toBeLessThanOrEqual(1);
    expect(m.text).toMatch(/Next Mission/i);
    // One control for one action: no body card links to the next lesson.
    expect(m.nextLessonLinks).toBe(1);
  });

  test("the recap and the terms list follow the recall card once it settles", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 4);
    await expect(page.getByTestId("takeaways-prose")).toHaveCount(0);
    await expect(page.getByTestId("lesson-terms-list")).toHaveCount(0);
    await page
      .getByRole("button", { name: /recall it/i })
      .first()
      .click();
    await expect(page.getByTestId("takeaways-prose")).toBeVisible();
    const m = await page.evaluate(() => {
      const box = (s: string) =>
        document.querySelector(s)!.getBoundingClientRect();
      return {
        recallBottom: box("[data-testid='takeaways-recall']").bottom,
        proseTop: box("[data-testid='takeaways-prose']").top,
        proseBottom: box("[data-testid='takeaways-prose']").bottom,
        termsTop: box("[data-testid='lesson-terms-list']").top,
      };
    });
    expect(m.proseTop).toBeGreaterThanOrEqual(m.recallBottom);
    expect(m.termsTop).toBeGreaterThanOrEqual(m.proseBottom);
  });

  test("a browser that remembers the recall sees the recap at once", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("tc_recall_deep-orbit_introduction-to-tensors", "1");
    });
    await openStep(page, LESSONS.paragraphLed, 4);
    await expect(page.getByTestId("takeaways-prose")).toBeVisible();
    await expect(page.getByTestId("lesson-terms-list")).toBeVisible();
    // The card is back in its prompt state, for practice.
    await expect(
      page.getByRole("button", { name: /recall it/i }).first(),
    ).toBeVisible();
  });

  test("on the Concept step the nav sits 40 px below the grid, with Continue at the frame's right edge", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 1);
    const m = await page.evaluate(() => {
      const one = (s: string) => {
        const found = document.querySelectorAll(s);
        if (found.length !== 1)
          throw new Error(`${s}: ${found.length} matches`);
        return found[0];
      };
      // The paired grid is the last block before the nav on the Concept
      // step; a block placed between them later is a deliberate change to
      // this test. Its children carry no margin (rule 1), so the lowest
      // painted child is where the grid visibly ends.
      const blocks = [
        ...one('.lesson-step-content[data-layout="paired"]').children,
      ].filter((el) => el.getBoundingClientRect().height > 0);
      const nav = one("[data-testid='lesson-nav']").getBoundingClientRect();
      const go = one("[data-step-continue]").getBoundingClientRect();
      const frame = one("[data-testid='lesson-frame']").getBoundingClientRect();
      return {
        last: Math.max(
          ...blocks.map((el) => el.getBoundingClientRect().bottom),
        ),
        navTop: nav.top,
        goTop: go.top,
        goRight: go.right,
        frameRight: frame.right,
      };
    });
    expect(Math.abs(m.navTop - m.last - 40)).toBeLessThanOrEqual(2);
    // Continue sits in the nav row, under its hairline, at the frame's
    // right content edge (the frame's 48 px padding).
    expect(m.goTop).toBeGreaterThan(m.navTop);
    expect(Math.round(m.goRight)).toBeGreaterThanOrEqual(
      Math.round(m.frameRight) - 48 - 1,
    );
  });

  test("six step labels sit under their segments, the current one in the accent colour", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 0);
    const m = await page.evaluate(() => {
      // Continue is filled with the accent colour on the Briefing, so its
      // background is the token's computed value.
      const accent = getComputedStyle(
        document.querySelector("[data-step-continue]")!,
      ).backgroundColor;
      return Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          "button[aria-label^='Step ']",
        ),
      ).map((b) => {
        const label = b.querySelector<HTMLElement>(
          "[data-testid='step-label']",
        )!;
        const bb = b.getBoundingClientRect();
        const lb = label.getBoundingClientRect();
        return {
          text: label.textContent,
          visible: lb.width > 0 && lb.height > 0,
          inside:
            lb.left >= bb.left - 1 &&
            lb.right <= bb.right + 1 &&
            lb.top >= bb.top - 1 &&
            lb.bottom <= bb.bottom + 1,
          hit: bb.height,
          current: b.getAttribute("aria-current") === "step",
          accent: getComputedStyle(label).color === accent,
        };
      });
    });
    expect(m.map((s) => s.text)).toEqual([
      "Briefing",
      "Concept",
      "Code",
      "Challenge",
      "Takeaways",
      "Epilogue",
    ]);
    for (const s of m) {
      expect(s.visible).toBe(true);
      expect(s.inside).toBe(true);
      expect(s.hit).toBeGreaterThanOrEqual(24);
      expect(s.accent).toBe(s.current);
    }
  });

  test("the exercise brief sits in the reading column and the pane keeps the editor", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 3);
    const brief = page.getByTestId("exercise-brief");
    await expect(brief).toBeVisible();
    await expect(brief.getByRole("heading", { level: 3 })).toBeVisible();
    const pane = page.locator("[data-testid='lesson-right'][data-kind='pane']");
    await expect(pane.locator("h3")).toHaveCount(0);
    await expect(pane.locator(".cm-content")).toBeVisible({ timeout: 30000 });
    // One exercise: the pane's eyebrow carries no title.
    await expect(pane.getByTestId("exercise-pane-title")).toHaveCount(0);
    const m = await page.evaluate(() => {
      const box = (s: string) =>
        document.querySelector(s)!.getBoundingClientRect();
      return {
        briefRight: box("[data-testid='exercise-brief']").right,
        paneLeft: box("[data-testid='lesson-right'][data-kind='pane']").left,
      };
    });
    expect(m.briefRight).toBeLessThanOrEqual(m.paneLeft);
  });
});

test.describe("lesson layout, narrow desktop", () => {
  test.use({ viewport: { width: 1024, height: 768 }, colorScheme: "dark" });

  test("the text track gives way before the companion does", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 1);
    // Spec, Fallbacks: both tracks are capped, so at 1,024 px the
    // companion keeps its 544 px and the text track takes what is left
    // after the 40 px gutter (about 344 px), instead of a 600 px text
    // track squeezing the companion to 288 px.
    const m = await page
      .locator('.lesson-step-content[data-layout="paired"]')
      .evaluate((g) => {
        const shown = [...g.children].filter(
          (el) => el.getBoundingClientRect().height > 0,
        );
        return {
          gridWidth: g.getBoundingClientRect().width,
          pairs: shown.flatMap((el, i) => {
            if (!el.hasAttribute("data-aside")) return [];
            const c = el.getBoundingClientRect();
            const p = shown[i - 1].getBoundingClientRect();
            return [
              {
                prevTag: shown[i - 1].tagName,
                width: c.width,
                top: c.top,
                prevWidth: p.width,
                prevTop: p.top,
              },
            ];
          }),
        };
      });
    expect(m.pairs.length).toBeGreaterThan(0);
    for (const c of m.pairs) {
      expect(c.prevTag).toBe("P");
      expect(Math.abs(c.width - 544)).toBeLessThanOrEqual(1);
      expect(
        Math.abs(c.prevWidth - (m.gridWidth - 40 - 544)),
      ).toBeLessThanOrEqual(1);
      expect(Math.abs(c.top - c.prevTop)).toBeLessThanOrEqual(4);
    }
  });

  test("the Challenge instructions take min(440 px, 38%) and the editor the rest", async ({
    page,
  }) => {
    await expectChallengeSplit(page);
  });

  test("no step label is clipped at the narrowest desktop width", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 0);
    const clipped = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-testid='step-label']"),
      )
        .filter((label) => label.scrollWidth > label.clientWidth)
        .map((label) => label.textContent),
    );
    expect(clipped).toEqual([]);
  });
});

test.describe("lesson layout, phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });

  test("a fresh guest's story ends --l-nav-top above the nav at 390 px", async ({
    page,
  }) => {
    // One column here, so the beats column is always the story's last row.
    await freshGuestStoryEnd(page);
  });

  test("a stacked dialogue beat fills the grid's width at 390 px", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 1);
    const m = await injectStackedBeat(page);
    // The measure is narrower than the beat here, so it fills the column.
    expect(Math.abs(m.left - m.gridLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.width - m.gridWidth)).toBeLessThanOrEqual(1);
  });

  test("on the Challenge step's Instructions view the nav sits 40 px below the hint panel", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 3);
    const m = await page.evaluate(() => {
      const one = (s: string) => {
        const found = document.querySelectorAll(s);
        if (found.length !== 1)
          throw new Error(`${s}: ${found.length} matches`);
        return found[0];
      };
      // The Instructions view is the phone default; the hint panel is the
      // last block of the instructions column and paints a bordered box.
      const panel = one(
        "[role='group'][aria-label^='Step 4'] .lesson-step-content > :last-child",
      ).getBoundingClientRect();
      return {
        panelHeight: panel.height,
        gap:
          one("[data-testid='lesson-nav']").getBoundingClientRect().top -
          panel.bottom,
      };
    });
    expect(m.panelHeight).toBeGreaterThan(0);
    expect(Math.abs(m.gap - 40)).toBeLessThanOrEqual(2);
  });

  for (const [name, path] of Object.entries(LESSONS)) {
    test(`each companion stacks under its block, full width, on the ${name} lesson`, async ({
      page,
    }) => {
      await openStep(page, path, 1);
      // One column below 1,024 px: a companion starts at its block's left
      // edge, spans the grid, and sits a row gap (24 px) below the block.
      // Reading order alone would pass a companion placed beside its block.
      const companions = await page
        .locator('.lesson-step-content[data-layout="paired"]')
        .evaluate((g) => {
          const grid = g.getBoundingClientRect();
          const shown = [...g.children].filter(
            (el) => el.getBoundingClientRect().height > 0,
          );
          return shown.flatMap((el, i) => {
            if (!el.hasAttribute("data-aside")) return [];
            const prev = shown[i - 1];
            const c = el.getBoundingClientRect();
            const p = prev ? prev.getBoundingClientRect() : null;
            return [
              {
                prevTag: prev ? prev.tagName.toLowerCase() : null,
                leftDelta: p ? c.left - p.left : null,
                width: c.width,
                gridWidth: grid.width,
                top: c.top,
                prevBottom: p ? p.bottom : null,
              },
            ];
          });
        });
      expect(companions.length).toBeGreaterThan(0);
      for (const c of companions) {
        expect(["p", "ul", "ol", "blockquote"]).toContain(c.prevTag);
        expect(Math.abs(c.leftDelta!)).toBeLessThanOrEqual(1);
        expect(Math.abs(c.width - c.gridWidth)).toBeLessThanOrEqual(1);
        expect(c.top).toBeGreaterThanOrEqual(c.prevBottom! + 22);
        expect(c.top).toBeLessThanOrEqual(c.prevBottom! + 26);
      }
    });
  }

  // Takeaways twice, as on desktop: the recall card alone, then settled.
  for (const [step, settled] of [
    [0, false],
    [1, false],
    [4, false],
    [4, true],
  ] as const) {
    const which = settled
      ? `step ${step + 1} with the recall settled`
      : `step ${step + 1}`;
    test(`nothing renders between Continue and the footer on ${which}`, async ({
      page,
    }) => {
      if (settled) await openSettledTakeaways(page, LESSONS.paragraphLed);
      else await openStep(page, LESSONS.paragraphLed, step);
      // Everything <main> renders between Continue and the site footer, in
      // document space. The regression this guards is a column landing
      // below the nav on phones, so the probe covers all of <main>,
      // including the shell's right slot and footer outside the step body.
      // Toasts render outside <main>, in the root layout, and the lessons
      // drawer renders nothing while closed; the position filter skips only
      // elements that are themselves fixed, not their children.
      const between = await page.evaluate(() => {
        const one = (s: string) => {
          const found = document.querySelectorAll(s);
          if (found.length !== 1)
            throw new Error(`${s}: ${found.length} matches`);
          return found[0];
        };
        const doc = (el: Element) =>
          el.getBoundingClientRect().top + window.scrollY;
        const go = one("[data-step-continue]");
        const top = doc(go) + go.getBoundingClientRect().height;
        const bottom = doc(one("footer"));
        return [...document.querySelectorAll("main *")]
          .filter((el) => {
            if (getComputedStyle(el).position === "fixed") return false;
            const y = doc(el);
            return (
              y > top &&
              y < bottom &&
              el.getBoundingClientRect().height > 0 &&
              !!el.textContent?.trim()
            );
          })
          .map(
            (el) =>
              `${el.tagName.toLowerCase()}: ${el.textContent!.trim().slice(0, 40)}`,
          );
      });
      expect(between).toEqual([]);
      expect(await footerGap(page)).toBeGreaterThanOrEqual(39);
    });
  }

  test("no step label shows on a phone and every segment keeps a 24 px hit box", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 0);
    const m = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          "button[aria-label^='Step ']",
        ),
      ).map((b) => {
        const label = b.querySelector<HTMLElement>(
          "[data-testid='step-label']",
        );
        return {
          hidden: !label || label.getClientRects().length === 0,
          hit: b.getBoundingClientRect().height,
        };
      }),
    );
    expect(m).toHaveLength(6);
    for (const s of m) {
      expect(s.hidden).toBe(true);
      expect(s.hit).toBeGreaterThanOrEqual(24);
    }
  });

  test("the Complete step's forward control still sits at the frame's right edge at 390 px", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 5);
    const m = await page.evaluate(() => {
      const one = (s: string) => {
        const found = document.querySelectorAll(s);
        if (found.length !== 1)
          throw new Error(`${s}: ${found.length} matches`);
        return found[0];
      };
      const control = one("[data-testid='next-lesson-card']");
      const box = control.getBoundingClientRect();
      const frame = one("[data-testid='lesson-frame']").getBoundingClientRect();
      const frameRight =
        frame.right -
        parseFloat(
          getComputedStyle(one("[data-testid='lesson-frame']")).paddingRight,
        );
      return { right: box.right, frameRight };
    });
    expect(Math.abs(m.right - m.frameRight)).toBeLessThanOrEqual(1);
  });

  test("the Instructions view holds the brief and its header wraps only between chips", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 3);
    const brief = page.getByTestId("exercise-brief");
    await expect(brief).toBeVisible();
    await expect(brief.getByRole("heading", { level: 3 })).toBeVisible();
    // Every item in the header row is one line tall: a chip that broke
    // inside a word would be two.
    const items = await brief
      .locator(":scope > div:first-child > *")
      .evaluateAll((els) =>
        els.map((el) => ({
          height: el.getBoundingClientRect().height,
          lineHeight: parseFloat(getComputedStyle(el).lineHeight),
        })),
      );
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const item of items) {
      // An item that broke inside a word is two lines tall. One line plus a
      // chip's padding, or the eyebrow's larger glyph, stays under 1.9.
      expect(item.height).toBeLessThan(item.lineHeight * 1.9);
    }
    await page.getByRole("button", { name: "Editor" }).click();
    await expect(
      page.locator(
        "[data-testid='lesson-right'][data-kind='pane'] .cm-content",
      ),
    ).toBeVisible({ timeout: 30000 });
    await expect(brief).toBeHidden();
  });

  for (const step of [1, 2]) {
    test(`every code block fits the phone on step ${step + 1}, with no blank line between code lines`, async ({
      page,
    }) => {
      await openStep(page, LESSONS.paragraphLed, step);
      // Rendered blocks only: the Concept step keeps the reference drawer's
      // example inside a closed <details>, which lays out nothing. Shiki
      // highlights on the client after mount, so wait until every rendered
      // block carries its line spans.
      await expect
        .poll(() =>
          page.evaluate(() => {
            const pres = Array.from(
              document.querySelectorAll<HTMLElement>(".lesson-prose pre"),
            ).filter((pre) => pre.getBoundingClientRect().height > 0);
            return (
              pres.length > 0 &&
              pres.every((pre) => !!pre.querySelector(".line"))
            );
          }),
        )
        .toBe(true);
      const blocks = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>(".lesson-prose pre"))
          .filter((pre) => pre.getBoundingClientRect().height > 0)
          .map((pre) => {
            const lines = Array.from(
              pre.querySelectorAll<HTMLElement>(".line"),
            );
            const boxes = lines.map((l) => l.getBoundingClientRect());
            // Shiki renders a blank source line as an empty span, which lays
            // out 0 px tall while its line box keeps the blank line's height.
            // Measure the lines that carry text: a newline rendering as a line
            // of its own would still open a gap between every such pair.
            const filled = boxes.filter((b) => b.height > 0);
            // One unwrapped line's height; a wrapped line is a multiple of it.
            const single = Math.min(...filled.map((b) => b.height));
            let maxGap = 0;
            for (let i = 1; i < boxes.length; i++) {
              if (boxes[i].height === 0 || boxes[i - 1].height === 0) continue;
              maxGap = Math.max(maxGap, boxes[i].top - boxes[i - 1].bottom);
            }
            const wrappedAt = boxes.findIndex((b) => b.height > single * 1.5);
            const style =
              wrappedAt >= 0 ? getComputedStyle(lines[wrappedAt]) : null;
            return {
              scrollWidth: pre.scrollWidth,
              clientWidth: pre.clientWidth,
              lines: filled.length,
              single,
              maxGap,
              hanging: style
                ? {
                    paddingLeft: parseFloat(style.paddingLeft),
                    textIndent: parseFloat(style.textIndent),
                  }
                : null,
            };
          }),
      );
      expect(blocks.length).toBeGreaterThan(0);
      for (const b of blocks) {
        expect(b.lines).toBeGreaterThan(0);
        expect(b.scrollWidth).toBeLessThanOrEqual(b.clientWidth);
        // A blank line between two code lines is a gap of a whole line
        // height. Half a line of slack absorbs baseline rounding without
        // letting a blank line through.
        expect(b.maxGap).toBeLessThan(b.single / 2);
      }
      // At least one line wraps, and its continuation starts 2 ch in: the
      // padding equals the negative indent.
      const wrapped = blocks.find((b) => b.hanging);
      expect(wrapped).toBeDefined();
      expect(wrapped!.hanging!.paddingLeft).toBeGreaterThan(0);
      expect(
        wrapped!.hanging!.paddingLeft + wrapped!.hanging!.textIndent,
      ).toBeCloseTo(0, 1);
    });
  }

  test("the editor shows its starter code without a horizontal scrollbar", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 3);
    await page.getByRole("button", { name: "Editor" }).click();
    const scroller = page.locator(
      "[data-testid='lesson-right'][data-kind='pane'] .cm-scroller",
    );
    await expect(scroller).toBeVisible({ timeout: 30000 });
    const m = await scroller.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth);
  });
});
