import { test, expect, type Page } from "@playwright/test";
import { seedDueReview, REVIEW_WARMUP_LESSON } from "./review-fixture";

// Check the reading flow for both authored and build-positioned cards.
// These lessons are in the free module and need no purchased fixture. Since
// content fix 11 (2026-10-19) lesson 1's Concept reading has no companion
// card. Lesson 2's reading ends on two: a bridge callout after its last
// paragraph, then a reference the build found nothing to pair with
// (rehype-pair-companions.ts).
const LESSONS = {
  paragraphLed: "/worlds/deep-orbit/foundations/introduction-to-tensors",
  headingLed: "/worlds/deep-orbit/foundations/tensor-shapes",
};
// The normalization lesson: its Concept keeps both worked examples in the
// main read, and its Takeaways closes on the room-project checkpoint.
const SPANNING_LESSON = "/worlds/deep-orbit/foundations/normalization";
// Where each Concept step shows its worked code. Lesson 1's example runs in
// the workbench above the reading, whose "What the example shows" section
// explains it (content fix 11 moved it out of the reading). The others keep
// their code in the reading column, and tensor-operations adds a derivation
// drawer.
const READING_CODE = '.lesson-step-content[data-layout="reading"] pre';
const EXAMPLE_LESSONS = {
  paragraphLed: {
    path: LESSONS.paragraphLed,
    code: "[data-testid='lesson-workbench'] [data-code-block] pre",
  },
  headingLed: { path: LESSONS.headingLed, code: READING_CODE },
  withDrawer: {
    path: "/worlds/deep-orbit/foundations/tensor-operations",
    code: READING_CODE,
  },
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
      localStorage.setItem(`tc_step_v2_deep-orbit_${slug}`, String(step));
      localStorage.setItem(`tc_step_max_v2_deep-orbit_${slug}`, String(step));
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
    case 1: // Concept: the reading column
      await expect(
        page.locator('.lesson-step-content[data-layout="reading"]'),
      ).toBeVisible();
      break;
    case 2: // Challenge: the editor pane, under the instructions at every width
      await expect(
        page.locator("[data-testid='lesson-right'][data-kind='pane']"),
      ).toBeAttached();
      break;
    case 3: // Takeaways
      await expect(page.getByTestId("takeaways-recall")).toBeVisible();
      break;
    case 4: // Complete
      await expect(
        page.getByRole("group", { name: /^Step 5 of 5/ }),
      ).toBeVisible();
      break;
    default:
      throw new Error(`openStep has no settled marker for step ${step}`);
  }
  // The marker appears as the client mounts the step, which is when the
  // step body starts its 0.3 s step-in (a 12 px translateY). The nav and the
  // footer sit outside that body, so a box read mid-animation shortens every
  // gap across that boundary by the remaining offset. Since clarity fix 15
  // the "Step N of 5" group is the whole lesson frame, and the step-in runs
  // on the step body inside it (the key={currentStep} wrapper in
  // lesson-steps.tsx), so the wait collects the group's subtree. It waits
  // only for running animations that end: the story passages' bar pulses
  // loop for as long as the page is open.
  await page
    .getByRole("group", { name: /^Step \d of 5/ })
    .evaluate(async (g) => {
      const moving = () =>
        g
          .getAnimations({ subtree: true })
          .filter(
            (a) =>
              a.playState === "running" &&
              Number.isFinite(a.effect?.getComputedTiming().endTime),
          );
      for (let left = moving(); left.length > 0; left = moving())
        await Promise.all(left.map((a) => a.finished.catch(() => undefined)));
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
  await openStep(page, path, 3);
  await expect(page.getByTestId("takeaways-prose")).toBeVisible();
  await expect(page.getByTestId("lesson-terms-list")).toBeVisible();
}

/*
  Every check below reads the boxes it compares in one page.evaluate, so a
  late re-layout (the guest email capture renders after its session check
  resolves) cannot land between two reads. Inside those reads, one() is the
  strict query: an element the check expects once must match exactly once.
*/

// The site footer, by the name SiteFooter gives it. Lesson 2's channel
// activity has had a <footer> of its own since content fix 8 (2026-10-17).
const SITE_FOOTER = "footer[aria-label='Site footer']";

// The footer's top edge less the bottom of the nav's lowest control. The
// nav's own box ends at its bottom padding (--l-nav-bottom, the 40 px), so
// a reading from that box stays 0 when the padding is lost.
function footerGap(page: Page) {
  return page.evaluate((footer) => {
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
    return one(footer).getBoundingClientRect().top - lowest;
  }, SITE_FOOTER);
}

// The story grid's lowest painted edge: the border-box bottom of the blocks
// inside the grid's two items (the scene picture and the learning notes),
// not the items themselves, whose boxes contain
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

// Lesson 1 closes the scene with two learning notes, "Key idea" then "Your
// first task", in the story grid's reading column under the scene picture
// (clarity fix 16, 2026-10-14, moved them there from the post-scene slot).
// A fresh guest has no warm-up due, so the slot does not render, and the nav
// follows the task note at --l-nav-top. Deep Orbit sets that token and the
// gaps around the notes to its section gap: 48 px from 640 px, 32 px below.
async function freshGuestStoryEnd(page: Page, sectionGap: number) {
  await openStep(page, LESSONS.paragraphLed, 0);
  await expect(
    page.getByRole("complementary", { name: "Key idea" }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Your first task" }),
  ).toBeVisible();
  const m = await page.evaluate(() => {
    const one = (s: string) => {
      const found = document.querySelectorAll(s);
      if (found.length !== 1) throw new Error(`${s}: ${found.length} matches`);
      return found[0];
    };
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, width: r.width };
    };
    return {
      grid: box(one(".lesson-story-grid")),
      plate: box(one(".lesson-story-plate > figure")),
      notes: Array.from(
        document.querySelectorAll("[data-testid='briefing-takeaway']"),
        (el) => ({ part: el.getAttribute("data-part"), ...box(el) }),
      ),
      slots: document.querySelectorAll("[data-post-scene]").length,
      navTop: one("[data-testid='lesson-nav']").getBoundingClientRect().top,
    };
  });
  expect(m.notes.map((note) => note.part)).toEqual(["idea", "task"]);
  const [idea, task] = m.notes;
  expect(m.slots).toBe(0);
  // Each note spans the story grid, under the picture.
  for (const note of m.notes) {
    expect(Math.abs(note.left - m.grid.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(note.width - m.grid.width)).toBeLessThanOrEqual(1);
  }
  expect(Math.abs(idea.top - m.plate.bottom - sectionGap)).toBeLessThanOrEqual(
    1,
  );
  expect(Math.abs(task.top - idea.bottom - sectionGap)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.navTop - task.bottom - sectionGap)).toBeLessThanOrEqual(1);
}

// A dialogue beat after the first heading of lesson 1's real reading grid.
// The Concept step shows such beats in paid lessons the suite cannot open.
// Since clarity fix 17 (2026-10-14) Deep Orbit renders every Dialogue as a
// speech surface (lesson-dialogue.css), so the element carries the
// attributes and markup the Dialogue component gives that layout, and a line
// long enough to wrap.
function injectDialogueBeat(page: Page) {
  return page
    .locator('.lesson-step-content[data-layout="reading"]')
    .evaluate((g) => {
      const beat = document.createElement("div");
      beat.className = "tc-dialogue-speech";
      beat.setAttribute("data-dialogue", "true");
      beat.setAttribute("data-layout", "speech");
      const header = document.createElement("div");
      header.setAttribute("data-dialogue-row", "");
      header.setAttribute("data-dialogue-header", "");
      const speaker = document.createElement("div");
      speaker.setAttribute("data-dialogue-speaker", "");
      speaker.textContent = "Dr. Farah";
      header.append(speaker);
      const text = document.createElement("div");
      text.setAttribute("data-dialogue-text", "");
      const line = document.createElement("p");
      line.textContent =
        "The thermal channel reads in the thirties and signal strength lives under one, so a raw feed lets temperature carry the whole story.";
      text.append(line);
      beat.append(header, text);
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

// The Deep Orbit Challenge stacks its two grid items in one full-width
// column at every width (orbit-challenge-grid, clarity fix 16 and 17): the
// instructions, then the one editor pane a section gap below, 48 px from
// 640 px. Read from the two grid items.
function challengeStack(page: Page) {
  return page.evaluate(() => {
    const one = (s: string) => {
      const found = document.querySelectorAll(s);
      if (found.length !== 1) throw new Error(`${s}: ${found.length} matches`);
      return found[0];
    };
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, width: r.width };
    };
    const grid = one("[data-testid='lesson-grid']");
    const pane = one("[data-testid='lesson-right'][data-kind='pane']");
    return {
      tracks: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
      grid: box(grid),
      instructions: box(pane.previousElementSibling!),
      pane: box(pane),
    };
  });
}

async function expectChallengeStack(page: Page) {
  // The tensor introduction uses the continuous workspace, covered in
  // challenge-workspace.spec.ts. The other lessons share this stack.
  await openStep(page, LESSONS.headingLed, 2);
  const m = await challengeStack(page);
  expect(m.tracks).toBe(1);
  for (const item of [m.instructions, m.pane]) {
    expect(Math.abs(item.left - m.grid.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(item.width - m.grid.width)).toBeLessThanOrEqual(1);
  }
  expect(Math.abs(m.instructions.top - m.grid.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.pane.top - m.instructions.bottom - 48)).toBeLessThanOrEqual(
    1,
  );
}

test.describe("lesson layout, desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });

  // Takeaways twice: with the recall card alone, and settled with the
  // recap and the terms list below it.
  for (const [step, settled] of [
    [0, false],
    [1, false],
    [3, false],
    [3, true],
    [4, false],
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
      // the page's minimum height adds space. The nav owns that minimum spacing.
      expect(await footerGap(page)).toBeGreaterThanOrEqual(39);
    });
  }

  for (const [name, path] of Object.entries(LESSONS)) {
    test(`the story leads into the full-width plate on the ${name} lesson`, async ({
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
        const box = (el: Element) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, width: r.width };
        };
        // The story's painted blocks: the passages and dialogue before the
        // first heading. The teaching body stays mounted there, hidden.
        const story = [
          ...one(".briefing-story-intro > .lesson-step-content").children,
        ].filter((el) => el.getBoundingClientRect().height > 0);
        // The first beat in DOM order is the story's first Dialogue.
        const beat = story.find((el) => el.matches("[data-dialogue]"));
        return {
          contextBottom: one(
            "[data-testid='scene-context']",
          ).getBoundingClientRect().bottom,
          story: story.map(box),
          beat: beat ? box(beat) : null,
          plate: box(one(".lesson-story-plate > figure")),
          grid: box(one(".lesson-story-grid")),
        };
      });
      // The Briefing reads from the story to the scene to the task
      // (lesson-briefing.css, clarity fix 16). The scene context leads into
      // the story with one beat gap (32 px) whatever sits above it, and every
      // story block spans the frame.
      expect(m.story.length).toBeGreaterThan(0);
      expect(m.beat).not.toBeNull();
      const first = m.story[0];
      const last = m.story[m.story.length - 1];
      expect(Math.abs(first.top - m.contextBottom - 32)).toBeLessThanOrEqual(1);
      for (const block of m.story) {
        expect(Math.abs(block.left - m.grid.left)).toBeLessThanOrEqual(1);
        expect(Math.abs(block.width - m.grid.width)).toBeLessThanOrEqual(1);
      }
      // The first beat reads before the picture, not beside it, and the
      // picture follows the story's last block a section gap (48 px) below,
      // as wide as the story.
      expect(m.beat!.bottom).toBeLessThan(m.plate.top);
      expect(Math.abs(m.plate.top - last.bottom - 48)).toBeLessThanOrEqual(1);
      expect(Math.abs(m.plate.left - m.grid.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(m.plate.width - m.grid.width)).toBeLessThanOrEqual(1);
    });
  }

  test("adjacent dialogue beats sit --lesson-beat-gap apart", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 0);
    // Every Deep Orbit beat is a bordered speech surface (lesson-dialogue.css,
    // clarity fix 17), and the story stack spaces its blocks with
    // --lesson-beat-gap, 32 px from 640 px. The surfaces paint their own
    // edges, so the gap is read between them. A stray paragraph margin inside
    // a beat would stretch its surface instead, so the beat's last line must
    // also sit exactly the surface's bottom padding and border (32 + 1 px)
    // above its edge.
    const m = await page.evaluate(() => {
      const painted = (el: Element | null) =>
        !!el && el.getBoundingClientRect().height > 0;
      // Painted beats only: the Briefing keeps a lesson's mid-lesson
      // Dialogues (after its first heading) in the DOM, hidden, and the
      // selector alone walks those too. The first two with nothing between
      // them: a stage direction between two beats would add its own height.
      const first = [
        ...document.querySelectorAll(".briefing-story-intro [data-dialogue]"),
      ].find(
        (b) =>
          painted(b) &&
          !!b.nextElementSibling?.matches("[data-dialogue]") &&
          painted(b.nextElementSibling),
      );
      if (!first) return null;
      const lines = first.querySelectorAll("[data-dialogue-text] p");
      const line = lines[lines.length - 1];
      if (!line) return null;
      const beat = first.getBoundingClientRect();
      return {
        gap:
          first.nextElementSibling!.getBoundingClientRect().top - beat.bottom,
        inset: beat.bottom - line.getBoundingClientRect().bottom,
      };
    });
    // null means no two adjacent painted beats in this lesson's story zone;
    // switch LESSONS.paragraphLed for a lesson that has them rather than
    // drop this.
    expect(m).not.toBeNull();
    expect(Math.abs(m!.gap - 32)).toBeLessThanOrEqual(2);
    expect(Math.abs(m!.inset - 33)).toBeLessThanOrEqual(1);
  });

  test("a fresh guest's learning notes end --l-nav-top above the nav at 1,440 px", async ({
    page,
  }) => {
    await freshGuestStoryEnd(page, 48);
  });

  test("a due warm-up sits --l-slot below the story", async ({ page }) => {
    // The fixture marks lesson 1's recall prompt due; a warm-up only recalls
    // earlier lessons, so the card surfaces on lesson 2 (review-fixture.ts).
    await seedDueReview(page);
    await openStep(page, REVIEW_WARMUP_LESSON, 0);
    await expect(page.getByRole("region", { name: /Warm-up/ })).toBeVisible();
    const m = await storyEdges(page);
    expect(m.slotTop).not.toBeNull();
    // Deep Orbit's --l-slot is its section gap, 48 px at this width.
    expect(Math.abs(m.slotTop! - m.storyBottom - 48)).toBeLessThanOrEqual(1);
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
      const grid = one(".lesson-story-grid");
      const g = grid.getBoundingClientRect();
      const column = one(
        ".lesson-story-grid > .briefing-reading-column",
      ).getBoundingClientRect();
      return {
        tracks: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        plateShown: one(".lesson-story-plate").getClientRects().length > 0,
        gridLeft: g.left,
        gridTop: g.top,
        gridWidth: g.width,
        noteLeft: one(
          "[data-testid='briefing-takeaway'][data-part='idea']",
        ).getBoundingClientRect().left,
        columnTop: column.top,
        columnWidth: column.width,
      };
    });
    // One column: the empty plate takes no track, row or gap, so the
    // learning notes start at the grid's top left corner instead of under an
    // empty picture. Since adjust width (2026-10-12) the single track spans
    // the frame: 1,440 px less its two 48 px gutters.
    expect(m.plateShown).toBe(false);
    expect(m.tracks).toBe(1);
    expect(Math.abs(m.noteLeft - m.gridLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.columnTop - m.gridTop)).toBeLessThanOrEqual(1);
    expect(m.gridWidth).toBe(1344);
    expect(Math.abs(m.columnWidth - m.gridWidth)).toBeLessThanOrEqual(1);
  });

  for (const [name, path] of Object.entries(LESSONS)) {
    test(`Concept keeps prose and cards in one column on the ${name} lesson`, async ({
      page,
    }) => {
      await openStep(page, path, 1);
      const { width, left, rows } = await page
        .locator('.lesson-step-content[data-layout="reading"]')
        .evaluate((g) => ({
          width: g.getBoundingClientRect().width,
          left: g.getBoundingClientRect().left,
          rows: [...g.children]
            .map((el) => {
              const r = el.getBoundingClientRect();
              return {
                aside: el.hasAttribute("data-aside"),
                heading: ["H2", "H3"].includes(el.tagName),
                top: r.top,
                bottom: r.bottom,
                left: r.left,
                width: r.width,
                height: r.height,
              };
            })
            .filter((r) => r.height > 0),
        }));
      // The reading column spans the frame (adjust width, 2026-10-12): 1,440
      // px less the frame's two 48 px gutters.
      expect(width).toBe(1344);
      const cardCount = rows.filter((r) => r.aside).length;
      if (name === "paragraphLed") expect(cardCount).toBe(0);
      else expect(cardCount).toBeGreaterThan(0);
      for (const [i, row] of rows.entries()) {
        expect(Math.abs(row.left - left)).toBeLessThanOrEqual(1);
        expect(Math.abs(row.width - width)).toBeLessThanOrEqual(1);
        if (i > 0) {
          // Deep Orbit's reading rhythm (deep-orbit-lessons.css): the
          // content gap (24 px) between blocks, and the section gap (48 px)
          // above a heading that starts a new section.
          const gap = row.heading ? 48 : 24;
          expect(
            Math.abs(row.top - rows[i - 1].bottom - gap),
          ).toBeLessThanOrEqual(1);
        }
      }
      // Where a lesson has references, opening one keeps the next block below it.
      if (cardCount > 0) {
        const reference = page
          .locator(
            '.lesson-step-content[data-layout="reading"] > details[data-aside]',
          )
          .first();
        await reference.locator(":scope > summary").click();
        await expect(reference).toHaveAttribute("open", "");
        const gap = await reference.evaluate((el) => {
          let next = el.nextElementSibling;
          while (next && !next.checkVisibility())
            next = next.nextElementSibling;
          const following =
            next ?? document.querySelector("[data-testid='lesson-nav']")!;
          return (
            following.getBoundingClientRect().top -
            el.getBoundingClientRect().bottom
          );
        });
        expect(gap).toBeGreaterThanOrEqual(24);
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("a card after a heading fills the reading column", async ({ page }) => {
    await openStep(page, LESSONS.paragraphLed, 1);
    // Inject a companion straight after the first heading, the shape the
    // twelve paid heading-led sections have after the build leaves them.
    const probe = await page
      .locator('.lesson-step-content[data-layout="reading"]')
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

  test("normalization keeps scaling and inference prerequisites in the main read", async ({
    page,
  }) => {
    await openStep(page, SPANNING_LESSON, 1);
    const read = page.locator('.lesson-step-content[data-layout="reading"]');
    await expect(
      read.getByText("fit-and-scale.ts", { exact: true }),
    ).toBeVisible();
    await expect(
      read.getByText("score-the-scaled-input.ts", { exact: true }),
    ).toBeVisible();
    // Content fix 12 (2026-10-19) named the section for what it covers.
    await expect(
      read.getByRole("heading", { name: "Min-max scaling" }),
    ).toBeVisible();
    expect(
      await read
        .getByText("score-the-scaled-input.ts", { exact: true })
        .evaluate((el) => !!el.closest("details:not([open])")),
    ).toBe(false);
  });

  test("a dialogue beat spans the reading column at 1,440 px", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 1);
    const m = await injectDialogueBeat(page);
    // A speech beat in the reading grid starts at its left edge and spans
    // it (deep-orbit-lessons.css), like every other block in the column.
    expect(m.gridWidth).toBe(1344);
    expect(Math.abs(m.left - m.gridLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.width - m.gridWidth)).toBeLessThanOrEqual(1);
  });

  test("the Challenge instructions and the editor stack full width, a section gap apart", async ({
    page,
  }) => {
    await expectChallengeStack(page);
  });

  for (const [name, { path, code }] of Object.entries(EXAMPLE_LESSONS)) {
    test(`Concept keeps code in context on the ${name} lesson`, async ({
      page,
    }) => {
      await openStep(page, path, 1);
      await expect(
        page.getByRole("button", { name: /^Step .*Code/ }),
      ).toHaveCount(0);
      await expect(page.getByTestId("lesson-workbench")).toBeVisible();
      await expect(page.locator(`${code}:visible`).first()).toBeVisible();
      await expect(page.getByTestId("lesson-right")).toHaveCount(0);
      expect(await footerGap(page)).toBeGreaterThanOrEqual(39);
    });
  }

  test("the Complete step's forward control sits in the nav row at the frame's right edge", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 4);
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
    await openStep(page, LESSONS.paragraphLed, 3);
    await expect(page.getByTestId("takeaways-prose")).toHaveCount(0);
    await expect(page.getByTestId("lesson-terms-list")).toHaveCount(0);
    // Inside the Deep Orbit lesson layout the recall card's bail button
    // reads "Show an explanation" (checked-recall-card.tsx, clarity fix 14).
    await page
      .getByRole("form", { name: "Knowledge check" })
      .getByRole("button", { name: "Show an explanation", exact: true })
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
    await openStep(page, LESSONS.paragraphLed, 3);
    await expect(page.getByTestId("takeaways-prose")).toBeVisible();
    await expect(page.getByTestId("lesson-terms-list")).toBeVisible();
    // The card is back in its prompt state, for practice: it still offers
    // its explanation (the Deep Orbit card's bail button).
    await expect(
      page
        .getByRole("form", { name: "Knowledge check" })
        .getByRole("button", { name: "Show an explanation", exact: true }),
    ).toBeVisible();
  });

  // Owner, 2026-10-10: Takeaways uses the whole frame and the step bar alone
  // names the step. Since clarity fix 14 and 17 (2026-10-12 and 14) the Deep
  // Orbit recap stacks its copy over its figure, and the terms list is a
  // "Review lesson terms" disclosure that shows one chosen term at a time.
  test("Takeaways spans the frame: no step label, a stacked recap, one term at a time", async ({
    page,
  }) => {
    await openSettledTakeaways(page, LESSONS.paragraphLed);
    await expect(
      page.getByRole("group", { name: /^Step 4 of 5/ }).getByText(/takeaways/i),
    ).toHaveCount(0);
    const terms = page.getByTestId("lesson-terms-list");
    await expect(terms).not.toHaveAttribute("open");
    await terms.getByRole("heading", { name: "Review lesson terms" }).click();
    await expect(terms).toHaveAttribute("open", "");
    await expect(
      terms.getByRole("button", { name: "Tensor", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const m = await page.evaluate(() => {
      const one = (s: string) => {
        const found = document.querySelectorAll(s);
        if (found.length !== 1)
          throw new Error(`${s}: ${found.length} matches`);
        return found[0];
      };
      const box = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, bottom: r.bottom, width: r.width };
      };
      const entry = one("[data-testid='glossary-entry-tensor']");
      return {
        grid: box(one("[data-testid='lesson-grid']")),
        // The step's three sections, in reading order.
        sections: [
          "[data-testid='takeaways-recall']",
          "[data-testid='takeaways-prose']",
          "[data-testid='lesson-terms-list']",
        ].map((s) => box(one(s))),
        recap: box(one(".orbit-recap")),
        copy: box(one(".orbit-recap-copy")),
        figure: box(one(".orbit-recap-layout > figure")),
        // The chosen term's definition, example and reading, then the
        // illustration that follows them.
        entry: Array.from(entry.children, box),
        illustration: box(entry.nextElementSibling!),
        labels: Array.from(
          document.querySelectorAll(".review-prompt-note"),
          (el) => getComputedStyle(el).fontSize,
        ),
      };
    });
    for (const section of [...m.sections, m.recap]) {
      expect(Math.abs(section.left - m.grid.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(section.width - m.grid.width)).toBeLessThanOrEqual(1);
    }
    // The recall card, the recap and the terms list stack a section gap
    // (48 px) apart.
    for (let i = 1; i < m.sections.length; i++) {
      expect(
        Math.abs(m.sections[i].top - m.sections[i - 1].bottom - 48),
      ).toBeLessThanOrEqual(1);
    }
    // The recap's copy, then its figure 32 px below, each as wide as the
    // recap.
    for (const part of [m.copy, m.figure]) {
      expect(Math.abs(part.left - m.recap.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(part.width - m.recap.width)).toBeLessThanOrEqual(1);
    }
    expect(Math.abs(m.figure.top - m.copy.bottom - 32)).toBeLessThanOrEqual(1);
    // Definition, example and reading share one column, one per row, and
    // the illustration follows them.
    expect(m.entry).toHaveLength(3);
    for (let i = 1; i < m.entry.length; i++) {
      expect(m.entry[i].top).toBeGreaterThanOrEqual(m.entry[i - 1].bottom);
      expect(Math.abs(m.entry[i].left - m.entry[0].left)).toBeLessThanOrEqual(
        1,
      );
    }
    expect(m.illustration.top).toBeGreaterThan(m.entry[2].bottom);

    // Show an explanation settles the card, announces it, and reveals each
    // check's expected answer in a panel across the card. Deep Orbit dropped
    // its reading measures (clarity fix 19, 2026-10-14), so each panel's text
    // runs the panel's full content width.
    const check = page.getByRole("form", { name: "Knowledge check" });
    await check
      .getByRole("button", { name: "Show an explanation", exact: true })
      .click();
    await expect(check.getByRole("status")).toHaveText(
      "Answers revealed. Read each explanation before continuing.",
    );
    const answers = check.locator("[data-feedback-state='neutral']");
    await expect(answers).toHaveCount(2);
    await expect(answers.nth(0)).toContainText("Expected answer: [12].");
    await expect(answers.nth(1)).toContainText(
      "Expected answer: No, it only creates a tensor.",
    );
    const panels = await answers.evaluateAll((els) =>
      els.map((el) => {
        const style = getComputedStyle(el);
        return {
          panel: el.getBoundingClientRect().width,
          content:
            el.clientWidth -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight),
          text: Math.max(
            ...Array.from(
              el.querySelectorAll("p"),
              (p) => p.getBoundingClientRect().width,
            ),
          ),
        };
      }),
    );
    for (const { panel, content, text } of panels) {
      expect(panel).toBeGreaterThan(1100);
      expect(Math.abs(text - content)).toBeLessThanOrEqual(1);
    }

    // The card's two notes keep the 14 px the Deep Orbit check card sets for
    // them (deep-orbit-takeaways.css): the shared prose p rule must not set
    // them at body size. Last, so the layout checks above always run.
    expect(m.labels).toEqual(["14px", "14px"]);
  });

  test("a room-project checkpoint spans the full-width step, its heading at the card's top", async ({
    page,
  }) => {
    await openSettledTakeaways(page, SPANNING_LESSON);
    const m = await page.evaluate(() => {
      const card = document.querySelector(".project-milestone")!;
      const style = getComputedStyle(card);
      const top = card.getBoundingClientRect().top;
      return {
        card: card.getBoundingClientRect().width,
        content:
          card.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight),
        text: Array.from(
          card.querySelectorAll(":scope > p"),
          (p) => p.getBoundingClientRect().width,
        ),
        heading: card.querySelector("h3")!.getBoundingClientRect().top - top,
      };
    });
    expect(m.card).toBeGreaterThan(1100);
    // Deep Orbit dropped its reading measures (clarity fix 19), so the
    // checkpoint's text runs the card's full content width.
    expect(m.text.length).toBeGreaterThan(0);
    for (const width of m.text) {
      expect(Math.abs(width - m.content)).toBeLessThanOrEqual(1);
    }
    // The card's 16 px padding and border, with no prose margin above.
    expect(m.heading).toBeLessThanOrEqual(18);
  });

  test("on the Concept step the nav sits --l-nav-top below the reading, with Continue at the frame's right edge", async ({
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
      const reading = one(
        '.lesson-step-content[data-layout="reading"]',
      ).getBoundingClientRect();
      const nav = one("[data-testid='lesson-nav']").getBoundingClientRect();
      const go = one("[data-step-continue]").getBoundingClientRect();
      const frame = one("[data-testid='lesson-frame']").getBoundingClientRect();
      return {
        last: reading.bottom,
        navTop: nav.top,
        goTop: go.top,
        goRight: go.right,
        frameRight: frame.right,
      };
    });
    // Deep Orbit's --l-nav-top is its section gap, 48 px at this width.
    expect(Math.abs(m.navTop - m.last - 48)).toBeLessThanOrEqual(2);
    // Continue sits in the nav row, under its hairline, at the frame's
    // right content edge (the frame's 48 px padding).
    expect(m.goTop).toBeGreaterThan(m.navTop);
    expect(Math.round(m.goRight)).toBeGreaterThanOrEqual(
      Math.round(m.frameRight) - 48 - 1,
    );
  });

  test("five step labels sit under their segments, the current one in the accent colour", async ({
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

  test("the workspace brief heads the editor column, above the code", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 2);
    const pane = page.locator("[data-testid='lesson-right'][data-kind='pane']");
    const brief = pane.getByTestId("exercise-brief");
    await expect(brief).toBeVisible({ timeout: 30000 });
    // One h3 in the pane, the brief's own (spec 2026-10-10).
    await expect(pane.locator("h3")).toHaveCount(1);
    await expect(brief.getByRole("heading", { level: 3 })).toHaveText(
      "Finish lines 3 and 4",
    );
    await expect(pane.locator(".cm-content")).toBeVisible({ timeout: 30000 });
    // One exercise: the pane's eyebrow carries no title.
    await expect(pane.getByTestId("exercise-pane-title")).toHaveCount(0);
    const m = await page.evaluate(() => {
      const box = (s: string) =>
        document.querySelector(s)!.getBoundingClientRect();
      return {
        briefBottom: box("[data-testid='exercise-brief']").bottom,
        frameTop: box("[data-editor-frame]").top,
      };
    });
    expect(m.briefBottom).toBeLessThanOrEqual(m.frameTop + 1);
  });
});

test.describe("lesson layout, narrow desktop", () => {
  test.use({ viewport: { width: 1024, height: 768 }, colorScheme: "dark" });

  test("Concept keeps cards below prose at 1,024 px", async ({ page }) => {
    await openStep(page, LESSONS.headingLed, 1);
    const m = await page
      .locator('.lesson-step-content[data-layout="reading"]')
      .evaluate((g) => {
        const shown = [...g.children].filter(
          (el) => el.getBoundingClientRect().height > 0,
        );
        return {
          width: g.getBoundingClientRect().width,
          cards: shown.flatMap((el, i) => {
            if (!el.hasAttribute("data-aside")) return [];
            const card = el.getBoundingClientRect();
            const prev = shown[i - 1].getBoundingClientRect();
            return [
              {
                width: card.width,
                gap: card.top - prev.bottom,
                leftDelta: card.left - prev.left,
              },
            ];
          }),
        };
      });
    // The reading column spans the frame: 1,024 px less its two 48 px
    // gutters.
    expect(m.width).toBe(928);
    expect(m.cards.length).toBeGreaterThan(0);
    for (const card of m.cards) {
      expect(card.width).toBe(m.width);
      expect(Math.abs(card.leftDelta)).toBeLessThanOrEqual(1);
      expect(Math.abs(card.gap - 24)).toBeLessThanOrEqual(1);
    }
  });

  test("the Challenge instructions and the editor stack full width, a section gap apart", async ({
    page,
  }) => {
    await expectChallengeStack(page);
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

  test("a fresh guest's learning notes end --l-nav-top above the nav at 390 px", async ({
    page,
  }) => {
    // Deep Orbit's section gap is 32 px below 640 px.
    await freshGuestStoryEnd(page, 32);
  });

  test("a dialogue beat fills the reading column at 390 px", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 1);
    const m = await injectDialogueBeat(page);
    expect(Math.abs(m.left - m.gridLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.width - m.gridWidth)).toBeLessThanOrEqual(1);
  });

  test("on the Challenge step the hint panel ends the instructions, a section gap above the editor and the nav", async ({
    page,
  }) => {
    await openStep(page, LESSONS.headingLed, 2);
    const m = await page.evaluate(() => {
      const one = (s: string) => {
        const found = document.querySelectorAll(s);
        if (found.length !== 1)
          throw new Error(`${s}: ${found.length} matches`);
        return found[0];
      };
      const box = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      };
      // Deep Orbit shows the instructions and the editor together, one
      // under the other, with no Instructions and Editor toggle (clarity
      // fix 17). The hint panel is the instructions column's last painted
      // block: the column keeps the lesson's other prose mounted, hidden.
      const pane = one("[data-testid='lesson-right'][data-kind='pane']");
      const column = pane.previousElementSibling!;
      const blocks = [
        ...column.querySelectorAll(".lesson-step-content > *"),
      ].filter((el) => el.getBoundingClientRect().height > 0);
      const hint = blocks[blocks.length - 1];
      return {
        hintAction: hint.querySelector("button")?.textContent ?? null,
        hint: box(hint),
        column: box(column),
        pane: box(pane),
        navTop: one("[data-testid='lesson-nav']").getBoundingClientRect().top,
      };
    });
    expect(m.hintAction).toBe("Get a nudge");
    expect(m.hint.height).toBeGreaterThan(0);
    // The panel ends the column with no trailing margin, the editor pane
    // follows a section gap (32 px below 640 px) under it, and the nav sits
    // --l-nav-top, the same 32 px, under the editor.
    expect(Math.abs(m.column.bottom - m.hint.bottom)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.pane.top - m.hint.bottom - 32)).toBeLessThanOrEqual(2);
    expect(Math.abs(m.navTop - m.pane.bottom - 32)).toBeLessThanOrEqual(2);
  });

  for (const [name, path] of Object.entries(LESSONS)) {
    test(`each companion stacks under its block, full width, on the ${name} lesson`, async ({
      page,
    }) => {
      await openStep(page, path, 1);
      // One column: a companion starts at its block's left edge, spans the
      // grid, and sits one content gap below the block. Deep Orbit's
      // --lesson-content-gap is 20 px below 640 px. Reading order alone
      // would pass a companion placed beside its block.
      const companions = await page
        .locator('.lesson-step-content[data-layout="reading"]')
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
                // A companion the build could not pair stays after the
                // companion before it (rehype-pair-companions.ts).
                prev: !prev
                  ? null
                  : prev.hasAttribute("data-aside")
                    ? "companion"
                    : prev.tagName.toLowerCase(),
                leftDelta: p ? c.left - p.left : null,
                width: c.width,
                gridWidth: grid.width,
                top: c.top,
                prevBottom: p ? p.bottom : null,
              },
            ];
          });
        });
      if (name === "paragraphLed") expect(companions).toHaveLength(0);
      else {
        expect(companions.length).toBeGreaterThan(0);
        // The first companion pairs with the prose block it follows.
        expect(["p", "ul", "ol", "blockquote"]).toContain(companions[0].prev);
      }
      for (const c of companions) {
        expect(["p", "ul", "ol", "blockquote", "companion"]).toContain(c.prev);
        expect(Math.abs(c.leftDelta!)).toBeLessThanOrEqual(1);
        expect(Math.abs(c.width - c.gridWidth)).toBeLessThanOrEqual(1);
        expect(c.top).toBeGreaterThanOrEqual(c.prevBottom! + 18);
        expect(c.top).toBeLessThanOrEqual(c.prevBottom! + 22);
      }
    });
  }

  // Takeaways twice, as on desktop: the recall card alone, then settled.
  for (const [step, settled] of [
    [0, false],
    [1, false],
    [3, false],
    [3, true],
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
      const between = await page.evaluate((footer) => {
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
        const bottom = doc(one(footer));
        return [...document.querySelectorAll("main *")]
          .filter((el) => {
            if (!el.checkVisibility()) return false;
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
      }, SITE_FOOTER);
      expect(between).toEqual([]);
      expect(await footerGap(page)).toBeGreaterThanOrEqual(39);
    });
  }

  test("on Takeaways the recap is one column and each term stacks at 390 px", async ({
    page,
  }) => {
    await openSettledTakeaways(page, LESSONS.paragraphLed);
    // The Deep Orbit terms list is a closed "Review lesson terms" disclosure
    // that shows one chosen term at a time (clarity fix 14).
    const terms = page.getByTestId("lesson-terms-list");
    await terms.getByRole("heading", { name: "Review lesson terms" }).click();
    await expect(terms).toHaveAttribute("open", "");
    const m = await page.evaluate(() => {
      const one = (s: string) => {
        const found = document.querySelectorAll(s);
        if (found.length !== 1)
          throw new Error(`${s}: ${found.length} matches`);
        return found[0];
      };
      const box = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, bottom: r.bottom };
      };
      const entry = one("[data-testid='glossary-entry-tensor']");
      const [definition, detail, source] = Array.from(entry.children, box);
      return {
        copy: box(one(".orbit-recap-copy")),
        figure: box(one(".orbit-recap-layout > figure")),
        definition,
        detail,
        source,
        illustration: box(entry.nextElementSibling!),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    // The recap's copy, then its figure under it.
    expect(m.figure.top).toBeGreaterThanOrEqual(m.copy.bottom);
    expect(m.figure.left).toBe(m.copy.left);
    // The term's definition, example and reading stack, then its picture.
    expect(m.detail.top).toBeGreaterThanOrEqual(m.definition.bottom);
    expect(m.source.top).toBeGreaterThanOrEqual(m.detail.bottom);
    expect(m.detail.left).toBe(m.definition.left);
    expect(m.source.left).toBe(m.definition.left);
    expect(m.illustration.top).toBeGreaterThanOrEqual(m.source.bottom);
    expect(m.illustration.left).toBe(m.definition.left);
    expect(m.overflow).toBeLessThanOrEqual(0);
  });

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
    expect(m).toHaveLength(5);
    for (const s of m) {
      expect(s.hidden).toBe(true);
      expect(s.hit).toBeGreaterThanOrEqual(24);
    }
  });

  test("the Complete step's forward control still sits at the frame's right edge at 390 px", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 4);
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

  test("the brief's header wraps only between chips, and the editor follows the brief", async ({
    page,
  }) => {
    await openStep(page, LESSONS.headingLed, 2);
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
    // Deep Orbit keeps the brief and its one editor on the page together:
    // no Instructions and Editor toggle (clarity fix 17). The editor sits
    // under the brief, and the brief stays in view.
    await expect(
      page.getByRole("group", { name: "Challenge view" }),
    ).toHaveCount(0);
    await expect(
      page.locator(
        "[data-testid='lesson-right'][data-kind='pane'] .cm-content",
      ),
    ).toBeVisible({ timeout: 30000 });
    await expect(brief).toBeVisible();
    const [briefBottom, editorTop] = await page.evaluate(() => {
      const one = (s: string) => {
        const found = document.querySelectorAll(s);
        if (found.length !== 1)
          throw new Error(`${s}: ${found.length} matches`);
        return found[0];
      };
      return [
        one("[data-testid='exercise-brief']").getBoundingClientRect().bottom,
        one(
          "[data-testid='lesson-right'][data-kind='pane'] [data-editor-frame]",
        ).getBoundingClientRect().top,
      ];
    });
    expect(editorTop).toBeGreaterThan(briefBottom);
  });

  for (const step of [1]) {
    test(`every code block fits the phone on step ${step + 1}, with no blank line between code lines`, async ({
      page,
    }) => {
      // Lesson 2: since content fix 11 lesson 1's Concept prose has no code.
      // Its example sits in the workbench, whose code block keeps local
      // scrolling by design (lesson-visuals.css, .tensor-investigation-console).
      await openStep(page, LESSONS.headingLed, step);
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
    await openStep(page, LESSONS.paragraphLed, 2);
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
