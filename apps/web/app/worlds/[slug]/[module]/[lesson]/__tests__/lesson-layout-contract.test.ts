import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILT_WORLD_DIRS } from "@tensorcraft/content";

/*
  The lesson layout is a contract spread over files that never meet in a
  unit test, and jsdom applies no CSS, so this test pins the text of each
  side the way post-scene-contract.test.ts does:
  - the companion markers: three companion components stamp data-aside;
  - the reading grid: the Concept body's single-column block in globals.css,
    including the stacked dialogue beat's place on the text measure
    (lesson-content.test.tsx checks that the reader's content root carries
    data-layout="reading" only when the Concept step asks for it);
  - the story grid: the Briefing's plate column beside the beats;
  - the beat and slot rules: the dialogue beat gap, the unpaired companion
    margin, the code and editor slots' margin-free columns, the Challenge
    instructions column's last block and the lesson corpus that rule
    relies on, and the spacing tokens these rules read.
  - the accent shadow rule: which lesson components keep the offset
    shadow and which sit on a hairline (spec 2026-09-24, section 7).
*/

const here = path.dirname(fileURLToPath(import.meta.url));
// Eight segments from apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__
// to the repo root; content-partition-contract.test.ts next door uses the
// same depth.
const repo = path.resolve(here, "../../../../../../../..");
const read = (p: string) => fs.readFileSync(path.join(repo, p), "utf8");

describe("companion markers", () => {
  it("resolves the repo root", () => {
    expect(fs.existsSync(path.join(repo, "pnpm-workspace.yaml"))).toBe(true);
  });

  it("stamps data-aside on both BridgeCallout roots", () => {
    const src = read("packages/ui/src/mdx/bridge-callout.tsx");
    const stamps = src.match(/data-aside=""/g) ?? [];
    expect(stamps).toHaveLength(2);
    expect(src).not.toMatch(/className="my-8/);
  });

  it("stamps data-aside on the derivation drawer", () => {
    const src = read("packages/ui/src/mdx/derivation-drawer.tsx");
    expect(src).toContain('data-aside=""');
    expect(src).not.toMatch(/className="my-8/);
  });

  it("stamps data-aside on the concept reference with the shared padding", () => {
    // The marker and the padding on the details tag, and no vertical
    // margin of its own (the grid and the unpaired rule space it); the
    // rest of the class string is the component's business.
    const src = read("apps/web/app/components/mdx/concept-reference.tsx");
    const details = /<details\b[^>]*>/.exec(src)?.[0] ?? "";
    expect(details).toMatch(/\bdata-aside=""/);
    const classes = (/className="([^"]*)"/.exec(details)?.[1] ?? "").split(
      /\s+/,
    );
    expect(classes).toContain("p-5");
    expect(classes.filter((c) => c.startsWith("my-"))).toEqual([]);
  });
});

describe("the lesson layout stylesheet", () => {
  const css = read("apps/web/app/globals.css");
  const start = css.indexOf("/* Concept reading column.");
  const block = css.slice(start, css.indexOf("/* End reading column */"));
  // Prettier wraps a long selector at its combinators onto continuation
  // lines that begin with ">" or "+"; fold those back so every selector is
  // one line again before pinning text.
  const folded = block.replace(/\n\s+(?=[>+])/g, " ");
  // The declarations of the rule whose selector line starts with `selector`.
  const body = (source: string, selector: string) => {
    const at = source.indexOf(selector);
    expect(at, selector).toBeGreaterThan(-1);
    return source.slice(source.indexOf("{", at) + 1, source.indexOf("}", at));
  };

  it("keeps prose and cards in one readable column", () => {
    expect(start).toBeGreaterThan(-1);
    const container = body(
      folded,
      '.lesson-step-content[data-layout="reading"] {',
    );
    expect(container).toContain("display: grid;");
    expect(container).toContain("grid-template-columns: minmax(0, 1fr);");
    expect(container).toContain("max-width: 820px;");
    expect(container).toContain("row-gap: var(--l-row, 24px);");
    expect(body(folded, "> * {")).toContain("margin-block: 0;");
    expect(body(folded, "> :is(h2, h3) {")).toContain(
      "margin-top: var(--l-heading, 16px);",
    );
    expect(body(folded, "> blockquote:not([style]) {")).toContain(
      "margin-block: 0;",
    );
    expect(folded).not.toContain("grid-column: 2");
  });

  it("centres a stacked dialogue beat in the reading column", () => {
    const beat = body(
      folded,
      '.lesson-step-content[data-layout="reading"] > [data-dialogue] {',
    );
    expect(beat).toContain("justify-self: center;");
    expect(beat).toContain("width: min(100%, 440px);");
    expect(beat).toContain("margin-inline: 0;");
  });

  it("spaces companions outside the grid, where nothing else does", () => {
    // Companions have no component margins; the default spacing applies
    // outside the reading column and the code/editor slots.
    const wholeFolded = css.replace(/\n\s+(?=[>+])/g, " ");
    expect(
      body(wholeFolded, ".lesson-step-content > [data-aside] {"),
    ).toContain("margin-block: var(--l-row, 24px);");
  });

  it("lays the code and editor slots out as margin-free columns", () => {
    // Both slots are grid items, which keep a block's trailing margin
    // inside them (pushing the nav down) and add a leading one to the gap
    // above. Stacking each slot's blocks with the row gap and no margins
    // leaves the left slot's trailing 24 px as the gap above the worked
    // example and the nav's own 40 px as the gap below (spec sections 4
    // and 6). Scoped under .lesson-page the child rule is (0,3,0) and
    // outranks the unpaired companion rule wherever it sits. The rules sit
    // outside the reading block, so fold the whole stylesheet as the
    // unpaired case does.
    const wholeFolded = css.replace(/\n\s+(?=[>+])/g, " ");
    const container = body(
      wholeFolded,
      [
        '.lesson-page [data-kind="code"] .lesson-step-content,',
        '.lesson-page [data-kind="pane"] .lesson-step-content {',
      ].join("\n"),
    );
    expect(container).toContain("display: flex;");
    expect(container).toContain("flex-direction: column;");
    expect(container).toContain("row-gap: var(--l-row, 24px);");
    expect(
      body(
        wholeFolded,
        [
          '.lesson-page [data-kind="code"] .lesson-step-content > *,',
          '.lesson-page [data-kind="pane"] .lesson-step-content > * {',
        ].join("\n"),
      ),
    ).toContain("margin-block: 0;");
  });

  it("ends the Challenge instructions column at its last block", () => {
    // The instructions column is a grid item too: its last block, the hint
    // panel in every current lesson, would otherwise keep its bottom margin
    // inside the column and push the nav to 64 px. Fold the whole
    // stylesheet as the cases above do.
    const wholeFolded = css.replace(/\n\s+(?=[>+])/g, " ");
    expect(
      body(
        wholeFolded,
        '.lesson-page .lesson-step-content[data-show-challenge="true"] > :last-child {',
      ),
    ).toContain("margin-bottom: 0;");
    // lesson-content.test.tsx checks that the panel renders as the content
    // root's last child; the next case checks that every lesson has one.
  });

  it("finds hints in every built lesson, which the :last-child rule relies on", () => {
    // The hint panel is the instructions column's last block only in a
    // lesson with hints. A lesson without them would leave its last
    // block's bottom margin inside the column, under the nav. Only built
    // lessons reach the page, so the built worlds are the corpus.
    const missing: string[] = [];
    for (const world of BUILT_WORLD_DIRS) {
      const dir = path.join(repo, "packages/content/content", world);
      const lessons = fs
        .readdirSync(dir, { recursive: true, encoding: "utf8" })
        .filter((file) => file.endsWith(".mdx"));
      expect(lessons.length, world).toBeGreaterThan(0);
      for (const file of lessons) {
        const text = fs.readFileSync(path.join(dir, file), "utf8");
        const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
        if (!/^hints:/m.test(front)) missing.push(`${world}/${file}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("gives row beats the beat gap", () => {
    // Dialogue lines compile to <p>, whose unlayered prose margin beats any
    // utility. In the row layout the line sits in a grid cell, where that
    // margin cannot collapse into the beat's own, so the stylesheet drops
    // it and spaces the row beat with --l-beat. Both rules sit outside the
    // reading block, so fold the whole stylesheet as the case above does.
    const wholeFolded = css.replace(/\n\s+(?=[>+])/g, " ");
    expect(
      body(wholeFolded, ".lesson-prose [data-dialogue] p:last-child {"),
    ).toContain("margin-bottom: 0;");
    expect(
      body(
        wholeFolded,
        '.lesson-step-content > [data-dialogue][data-layout="row"] {',
      ),
    ).toContain("margin-bottom: var(--l-beat, 16px);");
  });

  it("lays the Briefing story grid out from lg", () => {
    // The plate column beside the beats (spec section 2, item 4). The rules
    // sit outside the reading block, so fold the whole stylesheet as the
    // cases above do.
    const wholeFolded = css.replace(/\n\s+(?=[>+])/g, " ");
    // Stacked below lg: one column capped like spanning prose, the row gap
    // between the plate column and the beats, the picture capped at 600 px.
    const grid = body(wholeFolded, ".lesson-story-grid {");
    expect(grid).toContain("display: grid;");
    expect(grid).toContain("grid-template-columns: minmax(0, 820px);");
    expect(grid).toContain("row-gap: var(--l-row, 24px);");
    expect(grid).toContain("column-gap: var(--l-gutter, 40px);");
    expect(body(wholeFolded, ".lesson-story-plate > figure {")).toContain(
      "max-width: 600px;",
    );
    expect(wholeFolded).toContain("@media (width >= 64rem)");
    // The lg copies come after the base rules, so look for the query after
    // the base grid rule and read each rule after that.
    const lg = wholeFolded.indexOf(
      "@media (width >= 64rem)",
      wholeFolded.indexOf(".lesson-story-grid {"),
    );
    expect(lg).toBeGreaterThan(-1);
    const fromLg = wholeFolded.slice(lg);
    expect(body(fromLg, ".lesson-story-grid {")).toContain(
      "grid-template-columns: minmax(0, 1fr) minmax(280px, 544px);",
    );
    expect(body(fromLg, ".lesson-story-plate {")).toContain(
      "align-self: start;",
    );
    // No picture (no scene, or the still failed to load): one column, so
    // the beats never sit beside an empty one.
    expect(
      body(
        fromLg,
        ".lesson-story-grid:not(:has(> .lesson-story-plate > figure)) {",
      ),
    ).toContain("grid-template-columns: minmax(0, 820px);");
    // The beats column is a grid item, so its last story block's margin
    // cannot collapse into the post-scene slot's or the nav's.
    expect(
      body(
        wholeFolded,
        '.lesson-story-grid > .lesson-step-content[data-story-register="true"] > :is(:has(+ :is(h2, h3)), :last-child) {',
      ),
    ).toContain("margin-bottom: 0;");
    // Its first story block's top margin is trapped the same way at the top
    // of the beats column: a sensor-log blockquote's 1.5em margin put the
    // story 24 px below the picture.
    expect(
      body(
        wholeFolded,
        '.lesson-story-grid > .lesson-step-content[data-story-register="true"] > :first-child {',
      ),
    ).toContain("margin-top: 0;");
  });

  it("reads the spacing tokens rather than literals", () => {
    for (const token of ["--l-row", "--l-heading"]) {
      expect(block).toContain(`var(${token}, `);
    }
    const tokens = css.slice(
      css.indexOf(".lesson-page {"),
      css.indexOf("}", css.indexOf(".lesson-page {")),
    );
    for (const [name, value] of [
      ["--l-gutter", "40px"],
      ["--l-row", "24px"],
      ["--l-heading", "16px"],
      ["--l-beat", "16px"],
      ["--l-aside-pad", "20px"],
      ["--l-slot", "24px"],
      ["--l-nav-top", "40px"],
      ["--l-nav-inner", "24px"],
      ["--l-nav-bottom", "40px"],
    ]) {
      expect(tokens).toContain(`${name}: ${value};`);
    }
  });

  it("selects no deeper than a direct child", () => {
    // Layout rules must not change the contents of nested cards.
    const selectors = folded
      .split("\n")
      .filter(
        (l) =>
          l.includes('[data-layout="reading"]') &&
          (l.trim().endsWith("{") || l.trim().endsWith(",")),
      );
    for (const s of selectors) {
      const afterKey = s.split('[data-layout="reading"]')[1] ?? "";
      // The grid container rule itself has no combinator; skip it.
      if (afterKey.trim() === "{") continue;
      const stripped = afterKey.replace(/:(is|not|has)\([^)]*\)/g, ":$1()");
      expect(stripped).toMatch(/^\s*>\s*[^\s>+~]+\s*[{,]$/);
    }
  });
});

/* The offset accent shadow marks a container the learner acts in and
   nothing else (spec 2026-09-24, section 7). Source text checks, like the
   marker tests above: jsdom applies no CSS, and the class either is or is
   not in the className string. */
describe("accent shadow rule", () => {
  const keeps = [
    "packages/ui/src/mdx/hint-panel.tsx",
    "apps/web/app/components/review-prompt-card.tsx",
    "packages/ui/src/mdx/quiz.tsx",
    "apps/web/app/components/mdx/interactive-demo.tsx",
    "apps/web/app/components/mdx/boss-beat.tsx",
  ];
  const loses = [
    "packages/ui/src/mdx/code-block.tsx",
    "packages/ui/src/mdx/bridge-callout.tsx",
    "packages/ui/src/mdx/learning-objectives.tsx",
    "packages/ui/src/mdx/key-takeaways.tsx",
    "packages/ui/src/mdx/lesson-recap.tsx",
    "packages/ui/src/mdx/derivation-drawer.tsx",
    "apps/web/app/components/mdx/concept.tsx",
    "apps/web/app/components/mdx/math-block.tsx",
    "apps/web/app/components/mdx/next-lesson.tsx",
    "apps/web/app/components/mdx/dispatch-tease.tsx",
    "apps/web/app/components/mdx/strategy-thread.tsx",
    "packages/ui/src/mdx/exercise-data.tsx",
  ];

  for (const file of keeps) {
    it(`${file} keeps the shadow`, () => {
      expect(read(file)).toMatch(/\bbrutalist-shadow\b/);
    });
  }

  for (const file of loses) {
    it(`${file} sits on a hairline`, () => {
      // A hover shadow is a control affordance and may stay (next-lesson).
      // One class token only, so an unclosed bracket cannot swallow text.
      const src = read(file).replace(/hover:shadow-\[[^\]\s]*\]/g, "");
      expect(src).not.toMatch(/\bbrutalist-shadow\b/);
      // The hairline the test name promises: the border that frames the block.
      expect(src).toMatch(/\bborder border-border\b/);
    });
  }

  it("the exercise pane keeps the shadow and its nested panels lose it", () => {
    const src = read("packages/ui/src/mdx/exercise.tsx");
    const hits = src.match(/\bbrutalist-shadow\b/g) ?? [];
    expect(hits).toHaveLength(1);
    // The one carrier is the pane root, whose class string also names the
    // line-number override that only the pane has.
    expect(src).toMatch(/\[&_\.cm-lineNumbers\][^"]*brutalist-shadow/);
  });

  it("the exercise brief carries no offset shadow", () => {
    // Prose in the reading column, not a framed block: no hairline to check.
    expect(read("packages/ui/src/mdx/exercise-brief.tsx")).not.toMatch(
      /\bbrutalist-shadow\b/,
    );
  });
});

describe("consent bar reserved space", () => {
  it("body pads its bottom by the bar's published height", () => {
    const css = read("apps/web/app/globals.css");
    expect(css).toMatch(
      /(^|\n)body\s*\{[^}]*padding-bottom:\s*var\(--tc-consent-h,\s*0px\)/,
    );
  });

  it("the root scrolls focus and anchors clear of the bar", () => {
    // Body padding clears the bar only at the page's end; a focused element
    // in the viewport's bottom band needs the scroll padding on the root,
    // where the bar publishes the property.
    const css = read("apps/web/app/globals.css");
    expect(css).toMatch(
      /(^|\n)html\s*\{[^}]*scroll-padding-bottom:\s*var\(--tc-consent-h,\s*0px\)/,
    );
  });

  for (const file of [
    "apps/web/app/components/report-issue-button.tsx",
    "apps/web/app/components/session-toast.tsx",
    "apps/web/app/components/github-nudge-toast.tsx",
    "apps/web/app/components/mobile-nav.tsx",
  ]) {
    it(`${file} lifts its bottom edge by the bar's height`, () => {
      expect(read(file)).toContain("var(--tc-consent-h,0px)");
    });
  }

  it("the lesson sheet lifts its bottom edge by the bar's height", () => {
    expect(
      read("apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-drawer.tsx"),
    ).toContain('className="lesson-drawer-panel"');
    expect(read("apps/web/app/globals.css")).toMatch(
      /(^|\n)\.lesson-drawer-panel\s*\{[^}]*bottom:\s*var\(--tc-consent-h,\s*0px\)/,
    );
  });

  it("the glossary popover keeps clear of the bar", () => {
    expect(read("packages/ui/src/mdx/glossary-term.tsx")).toContain(
      '"--tc-consent-h"',
    );
  });
});

describe("code wraps on phones (spec 2026-09-24, section 4)", () => {
  const css = read("apps/web/app/globals.css");
  const block =
    /^@media \(width < 64rem\) \{([\s\S]*?)\n\}/m.exec(css)?.[1] ?? "";

  it("wraps pre below the one-column breakpoint", () => {
    expect(block).toMatch(/\.lesson-prose pre \{[^}]*white-space: pre-wrap/);
    expect(block).toMatch(/\.lesson-prose pre \{[^}]*overflow-wrap: anywhere/);
    expect(block).toMatch(/\.lesson-prose pre \{[^}]*overflow-x: visible/);
  });

  it("gives each highlighted line a 2ch hanging indent", () => {
    expect(block).toMatch(/\.lesson-prose pre \.line \{[^}]*padding-left: 2ch/);
    expect(block).toMatch(/\.lesson-prose pre \.line \{[^}]*text-indent: -2ch/);
  });

  it("reaches no deeper than the line span", () => {
    const selectors = block.match(/^\s*\.lesson-prose[^{]*\{/gm) ?? [];
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) {
      expect(s.replace("{", "").trim().split(/\s+/).length).toBeLessThanOrEqual(
        3,
      );
    }
  });

  it("the editor wraps its lines at every width", () => {
    const editor =
      /<SandpackCodeEditor\b(?:(?!\/>)[\s\S])*\/>/.exec(
        read("packages/ui/src/mdx/exercise.tsx"),
      )?.[0] ?? "";
    expect(editor).toMatch(/\bwrapContent\b/);
  });
});
