# Lesson Page Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rail-based lesson layout with one 1,280 px frame in which prose sits beside the companion it is about, the scene plate sits beside its beats, and nothing renders into an empty column on any of the six steps.

**Architecture:** The MDX body stays a flat list of children under `LessonContent`'s root. A six-rule CSS grid block, keyed on `data-layout="paired"` and guarded by `@supports selector(:has(+ *))`, pairs a prose block with the companion that follows it. A rehype plugin at content build moves heading-led companions after their section's first prose block so the CSS has something to pair. The Briefing gets a two-item story grid (plate column, `LessonContent` root). Scene card, glossary rail and mission progress are removed; objectives render in flow; the Takeaways step gains a terms list.

**Tech Stack:** Next 16 app (`apps/web`), Tailwind utilities plus `apps/web/app/globals.css`, React components in `packages/ui`, velite content build with `@mdx-js/mdx` 3 rehype plugins (`packages/content`), vitest with jsdom, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-23-lesson-layout-design.md` (approved 2026-09-23). Read it first; every task below cites the section it implements.

**Repo rules that bind every task:** never run `git commit` (the owner commits at each checkpoint); no em dash character anywhere, including comments and test names; no coloured left accent bars; run `pnpm run build:content` in `packages/content` before any test that reads the velite build; keep `docs/post-launch-backlog.md` the only task doc.

---

## Shared contracts

These names are used across tasks. Do not rename them mid-plan.

| Name | Meaning |
| --- | --- |
| `data-aside` | Attribute on the root of every companion (`BridgeCallout` both roots, `DerivationDrawer`, `ConceptReference`) |
| `data-layout="paired"` | Attribute on `LessonContent`'s root (`div.lesson-prose.lesson-step-content`), set by the new `layout="paired"` prop; only the Concept step passes it |
| `PAIRABLE_TAGS` | `["p", "ul", "ol", "blockquote"]`, exported from the rehype plugin and mirrored in the CSS `:is()` lists |
| `COMPANION_NAMES` | `["BridgeCallout", "DerivationDrawer", "ConceptReference"]`, exported from the rehype plugin |
| `.lesson-page` | Class on the reader's outermost element; the spacing tokens are defined on it |
| `--l-gutter 40px`, `--l-row 24px`, `--l-heading 16px`, `--l-beat 16px`, `--l-aside-pad 20px`, `--l-slot 24px`, `--l-nav-top 40px`, `--l-nav-inner 24px`, `--l-nav-bottom 40px` | Spacing tokens (spec section 6) |
| `.lesson-story-grid` / `.lesson-story-plate` | The Briefing story grid and its first item |
| `Dialogue layout="row"` | The Briefing beat variant (spec section 2, item 5) |
| `CONCEPT_INTRO` | The renamed `CONCEPT_RIGHT` set, rendered in flow above the Concept body |
| `LessonTermsList` | The Takeaways "Terms in this lesson" component, replacing `GlossaryRail` |

Step numbers in prose are 1-based (1 Briefing to 6 Complete); `currentStep` in code is 0-based and calls step 6 "Consequence".

## File structure

| File | Responsibility after this plan |
| --- | --- |
| `packages/content/src/rehype-pair-companions.ts` (new) | Moves heading-led companions after their section's first free prose block; exports the two name lists |
| `packages/content/__tests__/rehype-pair-companions.test.ts` (new) | Compiles every built lesson through MDX with the plugin and asserts the four invariants |
| `packages/content/velite.config.ts` | Registers the plugin after `rehypeGlossary` |
| `packages/ui/src/mdx/bridge-callout.tsx`, `derivation-drawer.tsx` | `data-aside`, no root margin |
| `apps/web/app/components/mdx/concept-reference.tsx` | `data-aside`, no root margin, `p-5` |
| `packages/ui/src/mdx/dialogue.tsx` | `layout` prop with a `row` variant |
| `packages/ui/src/mdx/learning-objectives.tsx` | "You will be able to" as an `h2`, two-across from `lg` |
| `apps/web/app/globals.css` | Tokens on `.lesson-page`; the paired grid block; the story grid; beat and stage-direction rules |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx` | `layout` prop; row Dialogue under `storyRegister`; glossary span binding without context |
| `.../lesson-shell.tsx` | One frame; `rightKind` is `"pane" | "code" | "none"`; Challenge tracks |
| `.../lesson-steps.tsx` | Rail removal, `CONCEPT_INTRO` in flow, Briefing story grid, eyebrow with format tag, chrome and nav spacing, terms list, `.lesson-page` root, no glossary context |
| `.../lesson-terms-list.tsx` (renamed from `glossary-rail.tsx`) | The Takeaways terms list |
| `.../glossary-context.tsx` (deleted) | Existed only to carry `activeTerm` for the rail |
| `packages/ui/src/mdx/glossary-term.tsx` | `active` and `onActivate` props removed |
| `.../challenge-passed-banner.tsx`, `apps/web/app/components/lesson-warmup.tsx`, `apps/web/app/components/review-prompt-card.tsx` | Spacing per section 6 |
| `.../scene-clip.tsx` | Root margin inside the story grid (`w-full` on the video stays; harmless in a 600 px column) |
| `.../__tests__/lesson-layout-contract.test.ts` (new) | Pins the markers, the CSS block and the tokens |
| `e2e/lesson-layout.spec.ts` (new), `e2e/visual/lesson.spec.ts` (new) | Layout criteria by bounding box; four new baselines |
| `docs/story-style-bible.md`, `docs/post-launch-backlog.md`, `docs/visual-regression.md` | Rail sentences, closed items, coverage table |

---

### Task 1: The reorder plugin

Implements spec section 3, "The reorder plugin". Do this first because every later visual check depends on the built lesson order.

**Files:**
- Create: `packages/content/src/rehype-pair-companions.ts`
- Create: `packages/content/__tests__/rehype-pair-companions.test.ts`
- Modify: `packages/content/velite.config.ts:333`
- Modify: `packages/content/package.json` (devDependency)

- [ ] **Step 1: Add the MDX compiler as a dev dependency of the content package**

The test compiles lessons from source with the same pipeline velite uses. Version 3.1.1 is already in the pnpm store.

Run: `pnpm --filter @tensorcraft/content add -D @mdx-js/mdx@^3.1.1 remark-gfm`
Expected: `packages/content/package.json` gains `@mdx-js/mdx` (range `^3.1.1`, the same range velite declares, so pnpm keeps one copy) and `remark-gfm` under devDependencies and the lockfile updates. `@mdx-js/mdx` 3.1.1 is in the pnpm store; `remark-gfm` is bundled inside velite and needs one network fetch. velite compiles with GFM on, so the test must too, or a lesson table parses as a paragraph and the printed count drifts from the build.

- [ ] **Step 2: Write the failing plugin test**

Create `packages/content/__tests__/rehype-pair-companions.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "hast";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";
import {
  rehypePairCompanions,
  COMPANION_NAMES,
  PAIRABLE_TAGS,
  isCompanion,
  isPairable,
  isHeading,
  meaningfulChildren,
} from "../src/rehype-pair-companions";

// The paired-column layout (spec 2026-09-23) pairs a companion with the prose
// block before it. A companion that follows a heading or a code block has
// nothing to pair with, so the build moves it after the first free prose
// block of its section. This test compiles every built lesson from source
// and holds the tree before and after the plugin, which the velite output
// cannot give us. velite also runs a remark plugin that drops {/* */} comment
// expressions before rehype; this pipeline does not, and no built lesson
// carries such a comment today. If one ever does, add that plugin here or
// the printed count can drift from the build.

const CONTENT = join(__dirname, "..", "content");

function lessonFiles(): string[] {
  const out: string[] = [];
  for (const world of BUILT_WORLD_DIRS) {
    const worldDir = join(CONTENT, world);
    for (const mod of readdirSync(worldDir)) {
      const modDir = join(worldDir, mod);
      if (!statSync(modDir).isDirectory()) continue;
      for (const f of readdirSync(modDir)) {
        if (f.endsWith(".mdx")) out.push(join(modDir, f));
      }
    }
  }
  return out.sort();
}

function stripFrontmatter(src: string): string {
  if (!src.startsWith("---")) return src;
  const end = src.indexOf("\n---", 3);
  return end === -1 ? src : src.slice(end + 4);
}

interface Snapshot {
  before: RootContent[];
  after: RootContent[];
}

async function compileWithPlugin(file: string): Promise<Snapshot> {
  const snap: Partial<Snapshot> = {};
  const capture = (key: keyof Snapshot) => () => (tree: Root) => {
    snap[key] = structuredClone(meaningfulChildren(tree));
  };
  await compile(stripFrontmatter(readFileSync(file, "utf8")), {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [capture("before"), rehypePairCompanions, capture("after")],
  });
  return snap as Snapshot;
}

function textValues(nodes: RootContent[]): string[] {
  const out: string[] = [];
  const walk = (n: unknown) => {
    const node = n as { type?: string; value?: string; children?: unknown[] };
    if (node.type === "text" && typeof node.value === "string")
      out.push(node.value);
    for (const c of node.children ?? []) walk(c);
  };
  for (const n of nodes) walk(n);
  return out.sort();
}

function firstHeadingIndex(nodes: RootContent[]): number {
  // The teaching zone starts at the first h2 (spec, definitions).
  return nodes.findIndex((n) => n.type === "element" && n.tagName === "h2");
}

describe("rehype-pair-companions", () => {
  const files = lessonFiles();

  it("found the built corpus", () => {
    expect(files.length).toBe(56);
  });

  it("exports the lists the CSS mirrors", () => {
    expect(COMPANION_NAMES).toEqual([
      "BridgeCallout",
      "DerivationDrawer",
      "ConceptReference",
    ]);
    expect(PAIRABLE_TAGS).toEqual(["p", "ul", "ol", "blockquote"]);
  });

  it("leaves every companion after a pairable block, or with no free pairable block left in its section", async () => {
    const spanning: string[] = [];
    for (const file of files) {
      const { after } = await compileWithPlugin(file);
      const start = firstHeadingIndex(after);
      for (let i = start + 1; i < after.length; i++) {
        if (!isCompanion(after[i])) continue;
        const prev = after[i - 1];
        if (isPairable(prev)) continue;
        // Unpaired: nothing free ahead before the next heading.
        let free = false;
        for (let j = i + 1; j < after.length && !isHeading(after[j]); j++) {
          if (isPairable(after[j]) && !isCompanion(after[j + 1])) free = true;
        }
        expect(
          free,
          `${file}: companion at ${i} has a free pairable block ahead`,
        ).toBe(false);
        spanning.push(`${file.split("/content/")[1]}#${i}`);
      }
    }
    // Keeps the spec's count honest. The spec records 22: 19 with no
    // pairable block after them in their section, plus 3 whose only
    // paragraph already has a drawer after it. The list makes a drift
    // diagnosable, not just visible.
    console.info(
      `spanning companions: ${spanning.length}\n  ${spanning.join("\n  ")}`,
    );
  });

  it("moves nothing before the first heading and changes no text", async () => {
    let checkedPairs = 0;
    for (const file of files) {
      const { before, after } = await compileWithPlugin(file);
      const cut = firstHeadingIndex(before);
      expect(after.slice(0, cut + 1)).toEqual(before.slice(0, cut + 1));
      expect(textValues(after)).toEqual(textValues(before));
      expect(after.length).toBe(before.length);
      // Only companions move, and each stays in its own section.
      const rest = (ns: RootContent[]) => ns.filter((n) => !isCompanion(n));
      const sections = (ns: RootContent[]) => {
        let s = 0;
        const out: number[] = [];
        for (const n of ns) {
          if (isHeading(n)) s++;
          else if (isCompanion(n)) out.push(s);
        }
        return out;
      };
      expect(rest(after)).toEqual(rest(before));
      expect(sections(after)).toEqual(sections(before));
      // A companion that already followed a pairable block keeps that
      // neighbour. Offsets identify nodes (structuredClone keeps position).
      const at = (n: RootContent | undefined) => n?.position?.start.offset;
      const pairs = (ns: RootContent[]) =>
        ns.flatMap((n, k) =>
          isCompanion(n) && isPairable(ns[k - 1])
            ? [`${at(n)}:${at(ns[k - 1])}`]
            : [],
        );
      const kept = pairs(after);
      for (const pair of pairs(before)) {
        expect(pair, `${file}: a node has no position`).toMatch(/^\d+:\d+$/);
        expect(kept, `${file}: companion ${pair} lost its neighbour`).toContain(
          pair,
        );
        checkedPairs++;
      }
    }
    // The neighbour check above is not vacuous.
    expect(checkedPairs).toBeGreaterThan(0);
  });

  it("carries a second companion on to the next free block instead of stacking", () => {
    const p = (text: string): RootContent => ({
      type: "element",
      tagName: "p",
      properties: {},
      children: [{ type: "text", value: text }],
    });
    const h2: RootContent = {
      type: "element",
      tagName: "h2",
      properties: {},
      children: [{ type: "text", value: "Section" }],
    };
    const companion = (name: string): RootContent =>
      ({
        type: "mdxJsxFlowElement",
        name,
        attributes: [],
        children: [],
      }) as unknown as RootContent;
    const tree: Root = {
      type: "root",
      children: [
        h2,
        companion("BridgeCallout"),
        companion("DerivationDrawer"),
        p("one"),
        p("two"),
      ],
    };
    rehypePairCompanions()(tree);
    const names = meaningfulChildren(tree).map((n) =>
      isCompanion(n)
        ? (n as { name: string }).name
        : (n as { tagName: string }).tagName,
    );
    expect(names).toEqual([
      "h2",
      "p",
      "BridgeCallout",
      "p",
      "DerivationDrawer",
    ]);
    // The move puts back one "\n" separator between each pair of blocks.
    expect(
      tree.children.map((n) => (n.type === "text" ? n.value : "block")),
    ).toEqual([
      "block",
      "\n",
      "block",
      "\n",
      "block",
      "\n",
      "block",
      "\n",
      "block",
    ]);
  });

  it("leaves a companion in place when its section has no pairable block", () => {
    const h2: RootContent = {
      type: "element",
      tagName: "h2",
      properties: {},
      children: [{ type: "text", value: "Section" }],
    };
    const pre: RootContent = {
      type: "element",
      tagName: "pre",
      properties: {},
      children: [{ type: "text", value: "code" }],
    };
    const companion = {
      type: "mdxJsxFlowElement",
      name: "BridgeCallout",
      attributes: [],
      children: [],
    } as unknown as RootContent;
    const tree: Root = { type: "root", children: [h2, companion, pre, h2] };
    rehypePairCompanions()(tree);
    expect(tree.children[1]).toBe(companion);
  });

  it("stops at an h3 boundary", () => {
    const p = (text: string): RootContent => ({
      type: "element",
      tagName: "p",
      properties: {},
      children: [{ type: "text", value: text }],
    });
    const h2: RootContent = {
      type: "element",
      tagName: "h2",
      properties: {},
      children: [{ type: "text", value: "Section" }],
    };
    const h3: RootContent = {
      type: "element",
      tagName: "h3",
      properties: {},
      children: [{ type: "text", value: "Subsection" }],
    };
    const pre: RootContent = {
      type: "element",
      tagName: "pre",
      properties: {},
      children: [{ type: "text", value: "code" }],
    };
    const companion = {
      type: "mdxJsxFlowElement",
      name: "BridgeCallout",
      attributes: [],
      children: [],
    } as unknown as RootContent;
    const tree: Root = {
      type: "root",
      children: [h2, companion, pre, h3, p("one")],
    };
    const before = meaningfulChildren(tree);
    rehypePairCompanions()(tree);
    expect(meaningfulChildren(tree)).toEqual(before);
  });

  it("leaves the story zone before the first h2 alone", () => {
    const p = (text: string): RootContent => ({
      type: "element",
      tagName: "p",
      properties: {},
      children: [{ type: "text", value: text }],
    });
    const h2: RootContent = {
      type: "element",
      tagName: "h2",
      properties: {},
      children: [{ type: "text", value: "Section" }],
    };
    const pre: RootContent = {
      type: "element",
      tagName: "pre",
      properties: {},
      children: [{ type: "text", value: "code" }],
    };
    const companion = {
      type: "mdxJsxFlowElement",
      name: "BridgeCallout",
      attributes: [],
      children: [],
    } as unknown as RootContent;
    const tree: Root = {
      type: "root",
      children: [companion, p("story"), h2, pre, p("lesson")],
    };
    const before = meaningfulChildren(tree);
    rehypePairCompanions()(tree);
    expect(meaningfulChildren(tree)).toEqual(before);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run packages/content/__tests__/rehype-pair-companions.test.ts`
Expected: FAIL, "Cannot find module '../src/rehype-pair-companions'".

- [ ] **Step 4: Write the plugin**

Create `packages/content/src/rehype-pair-companions.ts`:

```ts
import type { Root, RootContent } from "hast";

/**
 * Pair companions with prose at content build.
 *
 * The lesson page lays the Concept step out as a two-column grid in which a
 * prose block followed by a companion (bridge callout, derivation drawer,
 * concept reference) narrows to the text track and the companion takes the
 * second track on the same row (apps/web/app/globals.css, the paired block).
 * Grid auto-placement can only pair a companion with the block BEFORE it,
 * and 44 of Deep Orbit's 56 bridge callouts follow a heading. This plugin
 * moves such a companion to sit after the first free pairable block of its
 * section, so the CSS has something to pair. A companion whose section has
 * no free pairable block stays where it is and spans in the layout.
 *
 * It moves whole nodes and changes no text. It never touches the story zone
 * before the first h2.
 * Spec: docs/superpowers/specs/2026-09-23-lesson-layout-design.md, section 3.
 */
export const COMPANION_NAMES = [
  "BridgeCallout",
  "DerivationDrawer",
  "ConceptReference",
] as const;

export const PAIRABLE_TAGS = ["p", "ul", "ol", "blockquote"] as const;

type Node = RootContent | undefined;

export function isCompanion(node: Node): boolean {
  return (
    !!node &&
    node.type === "mdxJsxFlowElement" &&
    (COMPANION_NAMES as readonly string[]).includes(
      (node as { name?: string }).name ?? "",
    )
  );
}

export function isPairable(node: Node): boolean {
  return (
    !!node &&
    node.type === "element" &&
    (PAIRABLE_TAGS as readonly string[]).includes(node.tagName)
  );
}

export function isHeading(node: Node): boolean {
  return (
    !!node &&
    node.type === "element" &&
    (node.tagName === "h2" || node.tagName === "h3")
  );
}

/** Root children without the "\n" text nodes mdast-util-to-hast inserts. */
export function meaningfulChildren(tree: Root): RootContent[] {
  return tree.children.filter(
    (n) => !(n.type === "text" && n.value.trim() === ""),
  );
}

/** A pairable block is free when no companion already follows it. */
function isFree(nodes: RootContent[], j: number): boolean {
  return isPairable(nodes[j]) && !isCompanion(nodes[j + 1]);
}

export function rehypePairCompanions() {
  return (tree: Root) => {
    const nodes = meaningfulChildren(tree);
    // The teaching zone starts at the first h2 (spec, definitions); sections
    // then split on h2 or h3.
    const first = nodes.findIndex(
      (n) => n.type === "element" && n.tagName === "h2",
    );
    if (first === -1) return;

    let moved = false;
    let i = first + 1;
    while (i < nodes.length) {
      const node = nodes[i];
      if (isCompanion(node) && !isPairable(nodes[i - 1])) {
        let j = i + 1;
        while (j < nodes.length && !isHeading(nodes[j]) && !isFree(nodes, j))
          j++;
        if (j < nodes.length && !isHeading(nodes[j])) {
          nodes.splice(i, 1);
          // After the removal the pairable block sits at j - 1.
          nodes.splice(j, 0, node);
          moved = true;
          continue; // re-examine what moved into i
        }
      }
      i++;
    }

    // Only lessons with a moved companion change in the build output. Put
    // back the "\n" separators mdast-util-to-hast's root wrap emits, so a
    // moved lesson compiles with the same whitespace as an unmoved one.
    if (moved)
      tree.children = nodes.flatMap((n, k): RootContent[] =>
        k === 0 ? [n] : [{ type: "text", value: "\n" }, n],
      );
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run packages/content/__tests__/rehype-pair-companions.test.ts`
Expected: PASS, 8 tests. The console output (visible with `--reporter=verbose`) starts `spanning companions: 22` followed by the list (a reviewer ran this exact plugin over the corpus and got 22: the spec's 19 with no pairable block after them in their section, plus 3 whose only paragraph already has a drawer after it). If the number differs, the corpus or the plugin changed: record the actual value in the spec's definitions section and say why in the checkpoint note.

- [ ] **Step 6: Register the plugin in the velite build and rebuild**

In `packages/content/velite.config.ts`, add the import next to the glossary import at line 3:

```ts
import { rehypePairCompanions } from "./src/rehype-pair-companions";
```

and replace line 333:

```ts
  mdx: { rehypePlugins: [[rehypeGlossary, { dictionary: GLOSSARY }]] },
```

with:

```ts
  mdx: {
    rehypePlugins: [
      [rehypeGlossary, { dictionary: GLOSSARY }],
      // Order is immaterial today: rehype-glossary never enters JSX, so
      // moving a companion cannot change which occurrence is underlined first.
      rehypePairCompanions,
    ],
  },
```

Run: `pnpm --filter @tensorcraft/content build:content`
Expected: the build completes with 56 lessons and no errors.

- [ ] **Step 7: Run the content suite and the reader's content-partition contract**

Run: `pnpm vitest run packages/content 'apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/content-partition-contract.test.ts'`
Expected: PASS. The glossary contract still holds because the plugin moves whole nodes and rebuilds the newline separators between them, so a moved lesson compiles with the same text and whitespace as an unmoved one.

- [ ] **Step 8: Checkpoint**

Hand to the owner to commit. Suggested message: `feat(content): pair heading-led companions with their section's first prose block at build`. Do not run `git commit`.

---

### Task 2: Companion markers

Implements spec section 3, "Companions" and the definitions. The three companion roots get `data-aside`, lose their own vertical margin (the grid zeroes it anyway, but a dead utility misleads), and share a 20 px inner padding.

**Files:**
- Modify: `packages/ui/src/mdx/bridge-callout.tsx:91` and `:151`
- Modify: `packages/ui/src/mdx/derivation-drawer.tsx:36-38`
- Modify: `apps/web/app/components/mdx/concept-reference.tsx:14`
- Test: `packages/ui/src/mdx/bridge-callout.test.tsx`, `packages/ui/src/mdx/derivation-drawer.test.tsx`
- Create: `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts`

- [ ] **Step 1: Write the failing contract test, part one (markers)**

Create `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*
  The paired-column layout is a contract spread over files that never meet
  in a unit test: three companion components stamp a marker and one
  stylesheet block pairs on it (the reader's layout attribute is covered by
  its own render tests). jsdom applies no CSS, so this test pins the text of
  each side the way post-scene-contract.test.ts does.
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
    const src = read("apps/web/app/components/mdx/concept-reference.tsx");
    // Tied to the tag: the marker must sit on the root, which is what the
    // grid's child selectors reach. The two packages/ui companions prove the
    // same in their render suites (Step 4).
    expect(src).toMatch(/<details\b[^>]*\bdata-aside=""/);
    expect(src).toMatch(/className="border border-border p-5"/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts'`
Expected: the root check passes; the three marker cases FAIL on a missing `data-aside`.

- [ ] **Step 3: Stamp the markers**

In `packages/ui/src/mdx/bridge-callout.tsx`, line 91 (`GenericBridgeLayout`):

```tsx
    <div className="my-8 brutalist-shadow bg-surface-raised border border-border overflow-hidden">
```

becomes:

```tsx
    <div
      data-aside=""
      className="brutalist-shadow bg-surface-raised border border-border overflow-hidden"
    >
```

Line 151 (`ReactBridgeLayout`), the identical opening `div`, gets the same replacement.

In `packages/ui/src/mdx/derivation-drawer.tsx` lines 36 to 38:

```tsx
    <div
      data-testid="derivation-drawer"
      className="my-8 brutalist-shadow bg-surface-raised border border-border overflow-hidden"
    >
```

becomes:

```tsx
    <div
      data-testid="derivation-drawer"
      data-aside=""
      className="brutalist-shadow bg-surface-raised border border-border overflow-hidden"
    >
```

In `apps/web/app/components/mdx/concept-reference.tsx` line 14:

```tsx
    <details open={open} className="my-6 border border-border p-4">
```

becomes:

```tsx
    <details open={open} data-aside="" className="border border-border p-5">
```

- [ ] **Step 4: Run the contract test and the two component suites**

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts' packages/ui/src/mdx/bridge-callout.test.tsx packages/ui/src/mdx/derivation-drawer.test.tsx`
Expected: PASS. If a component test asserts the `my-8` class, change that assertion to `brutalist-shadow`; the margin is no longer the component's job.

Then add a DOM placement check to each render suite, because a text pin cannot tell the root from an inner element and every grid selector in Task 3 is `> [data-aside]`. In `packages/ui/src/mdx/bridge-callout.test.tsx`, an `it.each` over the file's two bridge fixtures (with and without React variants) named "marks the %s root with data-aside" that renders `<BridgeCallout bridge={bridge} />` and asserts `expect(container.firstElementChild).toHaveAttribute("data-aside", "")`. In `packages/ui/src/mdx/derivation-drawer.test.tsx`, a case "marks its root with data-aside" asserting `expect(screen.getByTestId("derivation-drawer")).toHaveAttribute("data-aside", "")`. Re-run the Step 4 command and expect PASS.

- [ ] **Step 5: Checkpoint**

Owner commits. Suggested message: `feat(ui): mark companions with data-aside and drop their root margins`.

---

### Task 3: Spacing tokens and the paired grid block

Implements spec section 1 (the rules) and section 6 (the tokens).

**Files:**
- Modify: `apps/web/app/globals.css` (append after the blockquote rule near line 391)
- Modify: `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts`

- [ ] **Step 1: Extend the contract test with the stylesheet half**

Append to the test file:

```ts
describe("the paired grid block", () => {
  const css = read("apps/web/app/globals.css");
  const start = css.indexOf("/* Paired columns (spec 2026-09-23, section 1)");
  const block = css.slice(start, css.indexOf("/* End paired columns */"));
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

  it("exists, inside a :has() support guard", () => {
    expect(start).toBeGreaterThan(-1);
    expect(block).toContain("@supports selector(:has(+ *))");
  });

  it("carries the six rules with the shared lists", () => {
    const list = ":is(p, ul, ol, blockquote)";
    expect(folded).toContain(
      `.lesson-step-content[data-layout="paired"] > ${list}:has(+ [data-aside])`,
    );
    expect(folded).toContain(
      `.lesson-step-content[data-layout="paired"] > :not(p, ul, ol, blockquote) + [data-aside]`,
    );
    expect(folded).toContain(
      `.lesson-step-content[data-layout="paired"] > [data-aside]:first-child`,
    );
    expect(folded).toContain(
      `.lesson-step-content[data-layout="paired"] > [data-aside] {`,
    );
    expect(folded).toContain(`> :is(p, ul, ol, blockquote, h2, h3) {`);
    expect(folded).toContain(`> :is(h2, h3) {`);

    // Selectors alone would still pass if rule 4 and rule 5 swapped
    // grid-column values, so pin each rule's own declarations too.
    const rule1 = body(folded, "> * {");
    expect(rule1).toContain("grid-column: 1 / -1;");
    expect(rule1).toContain("margin-block: 0;");
    const rule4 = body(folded, "> [data-aside] {");
    expect(rule4).toContain("grid-column: 2;");
    expect(rule4).toContain("align-self: start;");
    expect(rule4).toContain("margin-block: 0;");
    expect(body(folded, ":has(+ [data-aside]) {")).toContain("grid-column: 1;");
    expect(body(folded, "[data-aside]:first-child {")).toContain(
      "grid-column: 1 / -1;",
    );
    expect(
      body(folded, '.lesson-step-content[data-layout="paired"] {'),
    ).toContain("grid-template-columns: minmax(0, 600px) minmax(280px, 1fr);");
  });

  it("spaces companions outside the grid, where nothing else does", () => {
    // Task 2 removed the components' own margins. The Code step never pairs
    // and a browser without :has() gets no grid, so this rule is the only
    // gap between two drawers there. Fold the whole stylesheet (not just
    // the paired block) so the unpaired rule's own declarations are
    // checked, not just that both strings appear somewhere in the file.
    const wholeFolded = css.replace(/\n\s+(?=[>+])/g, " ");
    expect(
      body(wholeFolded, ".lesson-step-content > [data-aside] {"),
    ).toContain("margin-block: var(--l-row, 24px);");
  });

  it("reads the spacing tokens rather than literals", () => {
    for (const token of ["--l-gutter", "--l-row", "--l-heading"]) {
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
    // Vacuous while the block is absent (no selector lines to iterate);
    // the "exists" case above is the one that fails first in that state.
    // Every selector line, including the comma-terminated first selector
    // of rule 6 and the media-query copies.
    const selectors = folded
      .split("\n")
      .filter(
        (l) =>
          l.includes('[data-layout="paired"]') &&
          (l.trim().endsWith("{") || l.trim().endsWith(",")),
      );
    for (const s of selectors) {
      const afterKey = s.split('[data-layout="paired"]')[1] ?? "";
      // The grid container rule itself has no combinator; skip it.
      if (afterKey.trim() === "{") continue;
      const stripped = afterKey.replace(/:(is|not|has)\([^)]*\)/g, ":$1()");
      // One child combinator, then at most one adjacent-sibling combinator
      // (rule 6), never a descendant space.
      expect(stripped).toMatch(/^\s*>\s*[^\s>+~]+(\s*\+\s*[^\s>+~]+)?\s*[{,]$/);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts'`
Expected: FAIL, "exists, inside a :has() support guard".

- [ ] **Step 3: Add the tokens and the block to the stylesheet**

In `apps/web/app/globals.css`, directly after the `.lesson-prose > blockquote:not([style])` rule (ends near line 391), insert:

```css
/* Spacing scale for the lesson reader (spec 2026-09-23, section 6). Every
   rule below and the Tailwind utilities in lesson-steps.tsx read these, so
   the mockup and the product cannot drift. */
.lesson-page {
  --l-gutter: 40px;
  --l-row: 24px;
  --l-heading: 16px;
  --l-beat: 16px;
  --l-aside-pad: 20px;
  --l-slot: 24px;
  --l-nav-top: 40px;
  --l-nav-inner: 24px;
  --l-nav-bottom: 40px;
}

/* Outside the paired grid (the Code step, and any browser without :has(),
   where the guard below withholds the grid) a companion keeps a row gap on
   both sides, because the components no longer carry their own margin
   (spec section 3). Inside the grid, rule 4 zeroes it at (0,3,0). The
   fallback value covers a reader that has not yet got the .lesson-page
   tokens. */
.lesson-step-content > [data-aside] {
  margin-block: var(--l-row, 24px);
}

/* Paired columns (spec 2026-09-23, section 1). The Concept body is a
   two-track grid: prose beside the companion it is about. A prose block
   followed by a companion narrows to the text track; the companion takes
   the second track on the same row (grid auto-placement fills the free
   cell). Everything else spans. Specificity does the work, not order:
   rule 1 is (0,2,0), rules 2 and 3 (0,2,1), rule 4 (0,3,0), rule 5 (0,3,1),
   rule 6 (0,3,1) and (0,4,0). Without :has() the guard withholds the whole
   block and the step reads as one column in DOM order, which the content
   build already makes the right order (rehype-pair-companions). Pairing
   follows DOM order: a display:none sibling still counts for :has(+ *)
   and +, which is safe today because every partition boundary is a
   heading, so a visible block and its adjacent companion always sit in
   the same zone. */
@supports selector(:has(+ *)) {
  .lesson-step-content[data-layout="paired"] {
    display: grid;
    grid-template-columns: minmax(0, 600px) minmax(280px, 1fr);
    column-gap: var(--l-gutter, 40px);
    row-gap: var(--l-row, 24px);
  }
  /* 1. every block spans and drops its own vertical margin */
  .lesson-step-content[data-layout="paired"] > * {
    grid-column: 1 / -1;
    margin-block: 0;
  }
  /* 2. prose and headings are capped; everything else keeps its width */
  .lesson-step-content[data-layout="paired"]
    > :is(p, ul, ol, blockquote, h2, h3) {
    max-width: 820px;
  }
  /* 3. headings get their extra top space back */
  .lesson-step-content[data-layout="paired"] > :is(h2, h3) {
    margin-top: var(--l-heading, 16px);
  }
  /* 4. a companion takes the second column; the grid's row gap replaces
        the unpaired margin above */
  .lesson-step-content[data-layout="paired"] > [data-aside] {
    grid-column: 2;
    align-self: start;
    margin-block: 0;
  }
  /* 5. a pairable block followed by a companion narrows */
  .lesson-step-content[data-layout="paired"]
    > :is(p, ul, ol, blockquote):has(+ [data-aside]) {
    grid-column: 1;
  }
  /* 6. a companion with nothing pairable before it spans instead */
  .lesson-step-content[data-layout="paired"]
    > :not(p, ul, ol, blockquote)
    + [data-aside],
  .lesson-step-content[data-layout="paired"] > [data-aside]:first-child {
    grid-column: 1 / -1;
  }
  /* The plain-blockquote rule above this block is (0,2,1) and would beat
     rule 1's margin reset; a paired blockquote must sit flush with its
     companion. */
  .lesson-step-content[data-layout="paired"] > blockquote:not([style]) {
    margin-block: 0;
  }
  @media (width < 64rem) {
    .lesson-step-content[data-layout="paired"] {
      grid-template-columns: minmax(0, 1fr);
    }
    .lesson-step-content[data-layout="paired"] > [data-aside],
    .lesson-step-content[data-layout="paired"]
      > :is(p, ul, ol, blockquote):has(+ [data-aside]) {
      grid-column: 1;
    }
  }
}
/* End paired columns */
```

The block above is shown as prettier writes it (four long selectors wrapped at their combinators, which the contract test folds back before pinning). Run `node_modules/.bin/prettier --check apps/web/app/globals.css` afterwards; the diff must touch only the inserted block.

- [ ] **Step 4: Run the contract test and the CSS compile gate**

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts' globals-css`
Expected: PASS for both the contract test (5 cases in the grid describe plus the 4 marker cases, 9 in all) and the stylesheet compile gate (vitest filters are path substrings; `globals-css` matches the gate).

- [ ] **Step 5: Checkpoint**

Owner commits. Suggested message: `feat(web): spacing tokens and the paired-column grid block`.

---

### Task 4: `layout` prop on LessonContent and the row Dialogue binding

Implements spec section 1, "Where the grid lives", and section 2, item 5 (the binding half; the component half is Task 5).

**Files:**
- Modify: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx:90-91`, `:191-192`, `:358-381`, `:603-612`
- Test: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx` (new case)

- [ ] **Step 1: Teach the reader test's LessonContent stub the new prop**

`lesson-steps.test.tsx` mocks `./lesson-content` (lines 25 to 44) with a stub that renders `<div data-testid="lesson-content" ...>`. Extend the factory so the stub also takes `layout` and renders the class and attribute the real root will carry:

```tsx
vi.mock("./lesson-content", () => ({
  LessonContent: ({
    storyRegister,
    hideTeaching,
    visibleComponents,
    layout,
  }: {
    storyRegister?: boolean;
    hideTeaching?: boolean;
    visibleComponents?: Set<string>;
    layout?: "paired";
  }) => (
    <div
      data-testid="lesson-content"
      className="lesson-prose lesson-step-content"
      data-layout={layout}
      data-story-register={storyRegister ? "true" : undefined}
      data-hide-teaching={hideTeaching ? "true" : undefined}
      data-visible={Array.from(visibleComponents ?? []).sort().join(",")}
    />
  ),
}));
```

The only additions to the existing factory are the `layout` prop and the `className` plus `data-layout` attributes; every attribute the stub renders today, including the sorted `data-visible`, stays as it is. The tests that read the stamp live in Task 7, where the step composition makes them pass; this task only changes the reader's contract.

- [ ] **Step 2: Confirm the suite still passes with the wider stub**

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx'`
Expected: PASS, unchanged count.

- [ ] **Step 3: Add the prop, the stamp and the binding**

In `lesson-content.tsx`, after the `storyRegister?: boolean;` line in the props interface (line 91), add:

```ts
  /**
   * "paired" turns the root into the two-track grid from globals.css: prose
   * beside the companion it is about. Only the Concept step passes it.
   */
  layout?: "paired";
```

In the destructuring (line 192, after `storyRegister,`), add `layout,`.

In the `Dialogue` binding (line 381), replace:

```tsx
        return <Dialogue {...props} avatarSlot={avatarSlot} />;
```

with:

```tsx
        // The Briefing lays each beat out as an avatar slot beside its line
        // (spec 2026-09-23, section 2). Mid-lesson beats on Concept and the
        // epilogue keep the stacked layout.
        return (
          <Dialogue
            {...props}
            avatarSlot={avatarSlot}
            layout={storyRegister ? "row" : "stack"}
          />
        );
```

On the root element (line 605 onward), add the stamp after `data-story-register`:

```tsx
        data-layout={layout}
```

The binding now reads `storyRegister` inside the `components` useMemo, so add `storyRegister` to that memo's dependency array (the array that lists `worldId`, `shouldShow` and the others near line 585); without it eslint reports a missing dependency and a mounted instance whose register changed would keep its first layout.

- [ ] **Step 4: Typecheck after Task 5**

`Dialogue` gains its `layout` prop in Task 5; run `pnpm typecheck` at the end of that task and expect no errors. Nothing here is asserted by a unit test on its own: the stamp is exercised by Task 7's reader tests and by the Playwright layout test.

- [ ] **Step 5: Checkpoint**

Owner commits after Task 5 (the two tasks typecheck together), with the unit suite green.

---

### Task 5: The row Dialogue variant

Implements spec section 2, item 5.

**Files:**
- Modify: `packages/ui/src/mdx/dialogue.tsx`, `apps/web/app/globals.css` (two beat-spacing rules)
- Test: `packages/ui/src/mdx/dialogue.test.tsx`, `.../__tests__/lesson-layout-contract.test.ts`, `.../lesson-content.test.tsx`, `.../lesson-steps.playback.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append to `packages/ui/src/mdx/dialogue.test.tsx`:

```tsx
describe("Dialogue row layout", () => {
  it("keeps the stacked, centred layout by default", () => {
    const { container } = render(
      <Dialogue speaker="ARIA" avatarSlot={<i data-testid="slot" />}>
        Line.
      </Dialogue>,
    );
    const root = container.querySelector("[data-dialogue]")!;
    expect(root.className).toContain("max-w-[440px]");
    expect(root.getAttribute("data-layout")).toBe("stack");
  });

  it("puts the avatar slot beside the line in row layout, root still a block", () => {
    const { container } = render(
      <Dialogue speaker="ARIA" layout="row" avatarSlot={<i data-testid="slot" />}>
        Line.
      </Dialogue>,
    );
    const root = container.querySelector("[data-dialogue]")!;
    expect(root.getAttribute("data-layout")).toBe("row");
    expect(root.className).not.toContain("max-w-[440px]");
    expect(root.className).not.toContain("flex");
    const row = root.querySelector("[data-dialogue-row]")!;
    expect(row.className).toContain("grid");
    expect(row.contains(screen.getByTestId("slot"))).toBe(true);
    expect(row.contains(screen.getByText("Line."))).toBe(true);
  });

  it("keeps the cut-to divider as the root's last direct child in both layouts", () => {
    for (const layout of ["stack", "row"] as const) {
      const { container, unmount } = render(
        <Dialogue speaker="ARIA" layout={layout}>
          Line.
        </Dialogue>,
      );
      const root = container.querySelector("[data-dialogue]")!;
      expect(root.lastElementChild!.className).toContain("tc-cut-to");
      unmount();
    }
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run packages/ui/src/mdx/dialogue.test.tsx`
Expected: FAIL, `data-layout` is null.

- [ ] **Step 3: Implement the variant**

Replace the whole of `packages/ui/src/mdx/dialogue.tsx` with:

```tsx
import type { ReactNode } from "react";
import { CharacterAvatar } from "../character-avatar";

interface DialogueProps {
  speaker: string;
  direction?: string;
  /** Label for the scene-transition divider; the divider is hidden unless
   *  the host app's CSS reveals it (see comment on the element below). */
  cutTo?: string;
  avatarSrc?: string;
  avatarName?: string;
  isAI?: boolean;
  /** Canonical expression id for this line (validated against the world
   *  manifest by the packages/content gate). The component itself does not
   *  consume it; the host app's wrapper reads it to build `avatarSlot`. */
  expression?: string;
  /** Fully-built avatar element from the host app (AnimatedAvatar or the
   *  ARIA waveform). Takes precedence over the avatarSrc/avatarName path,
   *  which stays for consumers without an app-side resolver. */
  avatarSlot?: ReactNode;
  /**
   * "stack": avatar centred above the name and line, 440 px wide (the
   * default, used for mid-lesson beats and the epilogue). "row": a 44 px
   * avatar slot beside the line, name over the line, full width (the
   * Briefing story grid, spec 2026-09-23). The root stays a block element
   * in both so the cut-to divider remains its last direct child, which the
   * host stylesheet selects with a child combinator.
   */
  layout?: "stack" | "row";
  children: ReactNode;
}

export function Dialogue({
  speaker,
  direction,
  cutTo = "Briefing",
  avatarSrc,
  avatarName,
  isAI,
  avatarSlot,
  layout = "stack",
  children,
}: DialogueProps) {
  // `||`, not `??`: a falsy slot (false, "") still falls back to the
  // avatarName path, as it did before the row layout.
  const avatar =
    avatarSlot ||
    (avatarName ? (
      <CharacterAvatar
        name={avatarName}
        src={avatarSrc}
        isAI={isAI}
        size={44}
      />
    ) : null);
  const row = layout === "row";
  return (
    <div
      className={row ? "mb-4" : "mb-7 mx-auto max-w-[440px]"}
      data-dialogue="true"
      data-layout={layout}
    >
      {row ? (
        <div
          data-dialogue-row=""
          className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-3 items-start"
        >
          <div>{avatar}</div>
          <div>
            <div
              className="font-mono text-xs font-bold uppercase tracking-[2px] mb-1"
              style={{ color: "var(--tc-primary, #E0E0E0)" }}
            >
              {speaker}
            </div>
            {direction && (
              <div
                className="text-[13px] italic mb-1"
                style={{ color: "var(--tc-muted, #A0A0A0)" }}
                data-testid="direction"
              >
                ({direction})
              </div>
            )}
            <div
              className="text-[15px] leading-relaxed"
              style={{ color: "var(--tc-text, #c8c8c8)" }}
            >
              {children}
            </div>
          </div>
        </div>
      ) : (
        <>
          {avatar ? (
            <div className="flex justify-center mb-2">{avatar}</div>
          ) : null}
          <div
            className="font-mono text-xs font-bold uppercase tracking-[2px] mb-1.5 text-center"
            style={{ color: "var(--tc-primary, #E0E0E0)" }}
          >
            {speaker}
          </div>
          {direction && (
            <div
              className="text-[13px] italic mb-1 text-center"
              style={{ color: "var(--tc-muted, #A0A0A0)" }}
              data-testid="direction"
            >
              ({direction})
            </div>
          )}
          <div
            className="text-[15px] leading-relaxed"
            style={{ color: "var(--tc-text, #c8c8c8)" }}
          >
            {children}
          </div>
        </>
      )}
      {/* Shown only on the last dialogue of a Briefing story zone; the web
          app's lesson CSS opts it in under [data-story-register]. Hidden by
          default so other consumers of @tensorcraft/ui never see it. Must
          stay the root's last direct child. */}
      <div
        className="tc-cut-to hidden items-center gap-3 mt-8"
        aria-hidden="true"
      >
        <span
          className="h-px flex-1"
          style={{ background: "var(--tc-border, #2a2a2a)" }}
        />
        <span
          className="font-mono text-[9px] uppercase tracking-[3px]"
          style={{ color: "var(--tc-muted, #777777)" }}
        >
          Cut to: {cutTo}
        </span>
        <span
          className="h-px flex-1"
          style={{ background: "var(--tc-border, #2a2a2a)" }}
        />
      </div>
    </div>
  );
}
```

The row variant's `mb-4` is not enough on its own. MDX compiles every dialogue line into a `<p>`, and the unlayered `.lesson-prose p { margin-bottom: 1.5em }` rule (27 px at the 18 px body size) beats any Tailwind utility; in the stacked layout that margin collapsed into the root's `mb-7`, but in the row layout the line sits in a grid cell, so the margin cannot collapse out and beats would sit 43 px apart. Add to `apps/web/app/globals.css`, directly before the story-paragraph rule (the first rule whose selector begins `.lesson-step-content[data-story-register="true"]`):

```css
/* Dialogue lines compile to <p>. Inside a grid cell (the row layout, and
   any beat that sits in the paired grid) the paragraph's trailing margin
   cannot collapse into the beat's own margin, so drop it and give the row
   beat the beat gap itself (spec 2026-09-23, section 6, --l-beat). */
.lesson-prose [data-dialogue] p:last-child {
  margin-bottom: 0;
}
.lesson-step-content > [data-dialogue][data-layout="row"] {
  margin-bottom: var(--l-beat, 16px);
}
```

and pin both in `lesson-layout-contract.test.ts` (a case "gives row beats the beat gap" inside the grid describe, using the `body` helper on the folded stylesheet). Also cover the binding: in `lesson-steps.playback.test.tsx`, the loop over the Briefing's rendered dialogues asserts `data-layout` is `row`; in `lesson-content.test.tsx`, the `Dialogue` mock renders `data-layout`, and the story-register case asserts `row` on the first render and `stack` after the rerender, with one shared `visibleComponents` Set across both renders so the memo's `storyRegister` dependency is exercised. Any spacing measurement must read from the bottom of the line's `<p>`, not the beat's root box, because the stray margin sits inside the box.

- [ ] **Step 4: Run the suite and typecheck**

Run: `pnpm vitest run packages/ui/src/mdx/dialogue.test.tsx && pnpm typecheck`
Expected: PASS, typecheck with no errors (Task 4's `layout` prop now exists). The component above is the file as built after review: `avatarSlot ||` rather than `??` (a falsy slot falls back to the `avatarName` path, pinned by a test), no `w-11` on the avatar cell (a grid item already fills its 44px track). The dialogue suite also runs its speaker, direction and line cases and the axe check through `describe.each(["stack", "row"])`, so the row branch is covered.

- [ ] **Step 5: Checkpoint**

Owner commits Tasks 4 and 5 together. Suggested message: `feat(ui): row dialogue layout for the Briefing; LessonContent layout prop`.

---

### Task 6: One frame in LessonShell

Implements spec section 1 (frame) and section 4 (Challenge tracks, Code single column).

**Files:**
- Modify: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-shell.tsx`
- Test: `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-shell.test.tsx`

- [ ] **Step 1: Rewrite the shell test for the new contract**

Replace `__tests__/lesson-shell.test.tsx` with:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonShell } from "../lesson-shell";

describe("LessonShell", () => {
  it("renders left content always", () => {
    render(<LessonShell left={<p>prose</p>} right={null} rightKind="none" />);
    expect(screen.getByText("prose")).toBeInTheDocument();
  });

  it("uses one frame for every kind", () => {
    for (const rightKind of ["none", "code", "pane"] as const) {
      const { container, unmount } = render(
        <LessonShell
          left={<p>prose</p>}
          right={<aside>r</aside>}
          rightKind={rightKind}
        />,
      );
      const frame = container.querySelector("[data-testid='lesson-frame']")!;
      expect(frame.className).toContain("max-w-7xl");
      expect(frame.className).toContain("md:px-12");
      unmount();
    }
  });

  it("leaves the left column uncapped for every kind", () => {
    // Width is the grid's business; the old 68ch cap wasted the frame.
    for (const rightKind of ["none", "code", "pane"] as const) {
      const { container, unmount } = render(
        <LessonShell
          left={<p>prose</p>}
          right={<aside>r</aside>}
          rightKind={rightKind}
        />,
      );
      const left = container.querySelector(
        "[data-testid='lesson-grid']",
      )!.firstElementChild!;
      expect(left.textContent).toBe("prose");
      expect(left.className).not.toContain("max-w-[68ch]");
      unmount();
    }
  });

  it("omits the right region when kind is none", () => {
    render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>slot</aside>}
        rightKind="none"
      />,
    );
    expect(screen.queryByTestId("lesson-right")).toBeNull();
  });

  it("keeps the Code slot single column and the Challenge pane on the frame tracks", () => {
    const { container, rerender } = render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>code</aside>}
        rightKind="code"
      />,
    );
    let grid = container.querySelector("[data-testid='lesson-grid']")!;
    expect(grid.className).toContain("grid-cols-1");
    expect(screen.getByTestId("lesson-right").getAttribute("data-kind")).toBe(
      "code",
    );
    rerender(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>pane</aside>}
        rightKind="pane"
      />,
    );
    grid = container.querySelector("[data-testid='lesson-grid']")!;
    expect(grid.className).toContain(
      "lg:grid-cols-[minmax(0,min(440px,38%))_minmax(0,1fr)]",
    );
    expect(grid.className).toContain("gap-x-10");
    expect(grid.className).toContain("gap-y-6");
    // The hairline sits in the middle of the 40 px gutter, not outside it.
    const right = screen.getByTestId("lesson-right");
    expect(right.className).toContain("lg:pl-5");
    expect(right.className).toContain("lg:-ml-5");
    expect(right.className).not.toContain("pl-10");
    // A neutral divider between panes, never an accent-coloured bar.
    expect(right.className).toContain("border-border");
  });

  /**
   * SINGLE-MOUNT contract (fresh-eyes rerun §6 / R3-7): this slot is the
   * ONLY place the pane exists. The same single instance toggles visibility
   * via `paneOpenOnMobile`, so editor state survives toggles and orientation
   * changes by construction. jsdom does not evaluate Tailwind breakpoints,
   * so the visibility half asserts the class contract.
   */
  it("mounts the pane exactly once, hidden below lg while the toggle is closed", () => {
    render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>pane</aside>}
        rightKind="pane"
      />,
    );
    expect(screen.getAllByText("pane")).toHaveLength(1);
    const right = screen.getByTestId("lesson-right");
    expect(right.className).toContain("hidden");
    expect(right.className).toContain("lg:block");
  });

  it("shows the SAME single pane instance on mobile when the toggle opens", () => {
    render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>pane</aside>}
        rightKind="pane"
        paneOpenOnMobile
      />,
    );
    expect(screen.getAllByText("pane")).toHaveLength(1);
    const right = screen.getByTestId("lesson-right");
    expect(right.className).toContain("block");
    expect(right.className).not.toMatch(/(?:^|\s)hidden(?:\s|$)/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-shell.test.tsx'`
Expected: FAIL, `lesson-frame` not found (vitest does not typecheck, so no type error appears here).

- [ ] **Step 3: Rewrite the shell**

Replace `lesson-shell.tsx` with:

```tsx
interface LessonShellProps {
  left: React.ReactNode;
  right: React.ReactNode;
  rightKind: "pane" | "code" | "none";
  chrome?: React.ReactNode;
  controls?: React.ReactNode;
  footer?: React.ReactNode;
  paneOpenOnMobile?: boolean;
}

/**
 * One frame for every step (spec 2026-09-23, section 1): 1,280 px with 48 px
 * side padding at desktop, the width the chrome bar already uses, so the
 * chrome hairline and the body edges align. "code" is single column (the
 * worked example uses the full width; derivations stack above it in the
 * left slot). "pane" is the Challenge: instructions on a track of 440 px,
 * or 38% of the grid where that is narrower so the editor keeps its width
 * on small desktops; the editor takes the rest, with one mounted editor at
 * every width. "none" is a single column. The gaps repeat the spacing
 * tokens in globals.css: gap-x-10 is --l-gutter, gap-y-6 is --l-row.
 */
export function LessonShell({
  left,
  right,
  rightKind,
  chrome,
  controls,
  footer,
  paneOpenOnMobile = false,
}: LessonShellProps) {
  const single = rightKind === "none";
  const pane = rightKind === "pane";
  return (
    <div className="flex flex-col">
      {chrome}
      <div
        data-testid="lesson-frame"
        className="mx-auto w-full max-w-7xl px-5 md:px-12"
      >
        {controls}
        <div
          data-testid="lesson-grid"
          className={`grid gap-x-10 gap-y-6 ${pane ? "lg:grid-cols-[minmax(0,min(440px,38%))_minmax(0,1fr)]" : "grid-cols-1"}`}
        >
          <div
            className={`min-w-0 ${pane && paneOpenOnMobile ? "hidden lg:block" : ""}`}
          >
            {left}
          </div>
          {!single && (
            <div
              data-testid="lesson-right"
              data-kind={rightKind}
              className={`min-w-0 ${pane ? `lg:border-l lg:pl-5 lg:-ml-5 border-border ${paneOpenOnMobile ? "block" : "hidden"} lg:block` : ""}`}
            >
              {right}
            </div>
          )}
        </div>
        {footer}
      </div>
    </div>
  );
}
```

Note the left column no longer carries `max-w-[68ch]`; width is the grid's business now (Task 7 caps the Takeaways, Challenge and Code left columns at 820 px). The code above is the file as built after review: the instructions track is `minmax(0, min(440px, 38%))` so windows from 1,024 to about 1,250 px keep today's editor width (spec section 4, amended), and the grid is `gap-x-10 gap-y-6` so stacked slots sit `--l-row` apart. The Challenge pane's hairline is a neutral full-height divider between panes, which the accent-bar rule allows; `lg:pl-5 lg:-ml-5` pulls it into the middle of the 40 px gutter so instructions and editor stay 40 px apart in total.

- [ ] **Step 4: Run the shell test**

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-shell.test.tsx'`
Expected: PASS. `lesson-steps.tsx` no longer typechecks (it still passes `"rail"`); Task 7 fixes that.

- [ ] **Step 5: Checkpoint**

Owner commits after Task 7.

---

### Task 7: Rail removal, objectives in flow, terms list, glossary context

Implements spec section 3 (objectives, glossary, mission progress) and the rail removal in section 1. This is the largest task; take it in the order below and typecheck at the end.

**Files:**
- Rename: `.../glossary-rail.tsx` to `.../lesson-terms-list.tsx`; `.../__tests__/glossary-rail.test.tsx` to `.../__tests__/lesson-terms-list.test.tsx`
- Delete: `.../glossary-context.tsx`
- Modify: `.../lesson-steps.tsx` (imports, `CONCEPT_RIGHT`, `LessonSteps` wrapper, `LessonStepsInner` line 335, the step composition at 1097 to 1210, `StepConcept`, `StepTakeaways`, the outer root at 1256, and the `SceneCard` and `MissionProgress` functions)
- Modify: `.../lesson-content.tsx:536-545`
- Modify: `packages/ui/src/mdx/glossary-term.tsx` (drop `active`, `onActivate`)
- Modify: `scripts/check-content-browser.mjs` (the manual content-review harness imported the deleted glossary context)
- Test: `lesson-steps.test.tsx`, `lesson-steps.playback.test.tsx` (one line), `lesson-content.test.tsx` (the `GlossaryTerm` mock), `packages/ui/src/mdx/glossary-term.test.tsx`, `e2e/worlds.spec.ts`

- [ ] **Step 1: Write the terms list test**

Rename `__tests__/glossary-rail.test.tsx` to `__tests__/lesson-terms-list.test.tsx` and replace its contents:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonTermsList } from "../lesson-terms-list";

const TERMS = [
  { term: "tensor", definition: "multi-dim array" },
  { term: "rank", definition: "number of axes" },
];

describe("LessonTermsList", () => {
  it("lists each term and definition under a level-two heading", () => {
    render(<LessonTermsList terms={TERMS} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Terms in this lesson" }),
    ).toBeInTheDocument();
    expect(screen.getByText("tensor")).toBeInTheDocument();
    expect(screen.getByText("multi-dim array")).toBeInTheDocument();
    expect(screen.getByTestId("glossary-entry-rank")).toBeInTheDocument();
  });

  it("renders nothing when there are no terms", () => {
    const { container } = render(<LessonTermsList terms={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Update the reader tests**

In `lesson-steps.test.tsx`, replace the two rail cases in `describe("LessonSteps, LessonShell layout", ...)`:

```tsx
  it("renders the Briefing through a right-rail shell", () => {
    renderSteps();
    const right = screen.getByTestId("lesson-right");
    expect(right).toHaveAttribute("data-kind", "rail");
  });

  it("renders a two-column rail shell on the Concept step", () => {
    renderSteps();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    const right = screen.getByTestId("lesson-right");
    expect(right).toHaveAttribute("data-kind", "rail");
  });
```

with:

```tsx
  it("renders no right slot on the Briefing and Concept steps", () => {
    renderSteps();
    expect(screen.queryByTestId("lesson-right")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.queryByTestId("lesson-right")).toBeNull();
  });

  it("stamps the paired layout on the Concept body only", () => {
    renderSteps();
    expect(
      document.querySelector('.lesson-step-content[data-layout="paired"]'),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      document.querySelectorAll('.lesson-step-content[data-layout="paired"]'),
    ).toHaveLength(1);
  });

  it("renders the objectives in flow above the Concept body", () => {
    renderSteps();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    const intro = document.querySelector("[data-testid='concept-intro']")!;
    const body = document.querySelector('.lesson-step-content[data-layout="paired"]')!;
    expect(intro.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("caps the Takeaways prose and lists the terms after it", () => {
    localStorage.setItem(STEP_KEY, "4");
    localStorage.setItem(MAX_KEY, "4");
    render(
      <LessonSteps
        lesson={{
          ...lesson,
          glossaryTerms: [
            { term: "tensor", definition: "a numeric array with a shape" },
          ],
        }}
        exercises={[]}
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        moduleEntry={null}
        prevLesson={null}
        nextLesson={null}
      />,
    );
    const prose = document.querySelector("[data-testid='takeaways-prose']")!;
    expect(prose.className).toContain("max-w-[820px]");
    const list = document.querySelector("[data-testid='lesson-terms-list']");
    expect(list).toBeInTheDocument();
    expect(
      prose.compareDocumentPosition(list!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
```

The shared fixture lesson has no glossary terms, so this case renders `LessonSteps` with one term of its own and asserts the list unconditionally; a conditional check would pass without ever seeing the list.

Delete the whole `describe("LessonSteps, SceneCard cast avatars", ...)` block (line 630 to its end); the scene card no longer exists. If the test file's mocks include `AnimatedAvatar` stubs only for that block, leave the mocks in place; unused mocks are harmless.

- [ ] **Step 3: Run the two suites to verify they fail**

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-terms-list.test.tsx' 'apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx'`
Expected: FAIL, module not found and `lesson-right` still present.

- [ ] **Step 4: Create the terms list**

Rename `glossary-rail.tsx` to `lesson-terms-list.tsx` and replace its contents:

```tsx
import { useId } from "react";

interface LessonTermsListProps {
  terms: Array<{ term: string; definition: string }>;
}

/**
 * The Takeaways step's closing list of the concept terms this lesson
 * underlined, with their definitions. Replaces the glossary rail (spec
 * 2026-09-23, section 3); the term chips in the prose already show their
 * own definition inline, so this is the look-back, not the first read.
 */
export function LessonTermsList({ terms }: LessonTermsListProps) {
  const headingId = useId();
  if (terms.length === 0) return null;

  return (
    <section
      aria-labelledby={headingId}
      data-testid="lesson-terms-list"
      className="mt-10"
    >
      <h2
        id={headingId}
        className="font-mono text-xs uppercase tracking-[0.2em] mb-4"
        style={{ color: "var(--tc-primary)" }}
      >
        Terms in this lesson
      </h2>
      <dl className="grid gap-x-10 gap-y-4 lg:grid-cols-2">
        {terms.map(({ term, definition }) => (
          <div
            key={term}
            data-testid={`glossary-entry-${term}`}
            className="flex flex-col gap-1"
          >
            <dt
              className="font-mono text-sm"
              style={{ color: "var(--tc-primary)" }}
            >
              {term}
            </dt>
            <dd
              className="text-sm leading-relaxed"
              style={{ color: "var(--tc-muted)" }}
            >
              {definition}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 5: Remove the glossary context**

Delete `glossary-context.tsx`.

In `packages/ui/src/mdx/glossary-term.tsx`, remove the `active?: boolean;` and `onActivate?: (term: string) => void;` props (lines 9 and 10), the `active,` and `onActivate,` destructures (18 and 19), the `onActivate?.(term);` call (line 82), and change the `active || open` expression at line 89 to `open`. Its JSDoc (line 14) says the definition shows "including when the glossary rail is offscreen"; reword it to "A definition beside the term, opened by clicking it." In `packages/ui/src/mdx/glossary-term.test.tsx`, the first case (line 6, "renders children with a glossary affordance and fires onActivate on click") also covers the affordance: keep the case, drop the `onActivate` prop from its render and the `toHaveBeenCalledWith("rank")` assertion, and rename it to "renders children with a glossary affordance". `vi.fn()` was that file's only use of `vi`, so drop `vi` from the vitest import on line 1 or lint flags it at Task 13. Run `pnpm vitest run packages/ui/src/mdx/glossary-term.test.tsx` and expect PASS.

In `lesson-content.tsx`, replace the span binding (lines 536 to 552):

```tsx
    base.span = function GlossarySpan(
      props: React.HTMLAttributes<HTMLSpanElement> & {
        "data-glossary-term"?: string;
      },
    ) {
      const { activeTerm, setActiveTerm } = useGlossary();
      const term = props["data-glossary-term"];
      if (!term) return <span {...props} />;
      const entry = glossaryByTerm.get(term);
      return (
        <GlossaryTerm
          term={term}
          definition={entry?.definition}
          active={activeTerm === term}
          onActivate={setActiveTerm}
        >
          {props.children}
        </GlossaryTerm>
      );
    };
```

with:

```tsx
    base.span = function GlossarySpan(
      props: React.HTMLAttributes<HTMLSpanElement> & {
        "data-glossary-term"?: string;
      },
    ) {
      const term = props["data-glossary-term"];
      if (!term) return <span {...props} />;
      const entry = glossaryByTerm.get(term);
      return (
        <GlossaryTerm term={term} definition={entry?.definition}>
          {props.children}
        </GlossaryTerm>
      );
    };
```

and remove the `useGlossary` import at the top of the file. In `lesson-content.test.tsx`, drop `active` and `onActivate` (and what the mock rendered from them) from the `GlossaryTerm` mock.

`scripts/check-content-browser.mjs` (a manual review harness, not run in CI) builds an inline page that imports `GlossaryProvider` from `glossary-context.tsx` and wraps `LessonContent` in it: delete that import line and render `LessonContent` directly. Leave `docs/audits/content-review-manifest.json` alone; its hash for the script goes stale the way `lesson-steps.tsx` already is at HEAD, and re-signing it is the owner's review step. Check with `node --check` (it does not parse the template-literal module, so also extract that module and check it).

- [ ] **Step 6: Edit the reader**

In `lesson-steps.tsx`:

1. Imports: remove `import { GlossaryProvider, useGlossary } from "./glossary-context";` and `import { GlossaryRail } from "./glossary-rail";`; add `import { LessonTermsList } from "./lesson-terms-list";`.
2. Line 208: rename `const CONCEPT_RIGHT = new Set(["LearningObjectives"]);` to `const CONCEPT_INTRO = new Set(["LearningObjectives"]);` and update the `STEP_VISIBILITY` entry to `CONCEPT_INTRO`.
3. `LessonSteps` (lines 297 to 309): remove the `<GlossaryProvider>` wrapper so it returns `<LearningActivityScope ...><LessonStepsInner {...props} /></LearningActivityScope>`. Reword the comment above the function (lines 295 to 297), which names `GlossaryProvider` and `GlossaryRail`: the entry now only wraps the reader in the learning-activity scope. Task 13's grep on `GlossaryRail` would otherwise hit it.
4. Line 335: delete `const { activeTerm } = useGlossary();`.
5. Delete `const castSpeakers = extractSpeakers(lesson.body, lesson.context.speaker);` (line 1014) and the `extractSpeakers` function (line 1631 onward) if nothing else references it: `grep -n extractSpeakers` must return nothing afterwards.
6. Step composition: change the type to `let rightKind: "pane" | "code" | "none" = "none";` and rewrite the branches:

```tsx
  if (currentStep === 0) {
    rightKind = "none";
    shellLeft = (
      <StepBriefing
        lesson={lesson}
        moduleSlug={moduleSlug}
        exercises={exercises}
        worldSlug={worldSlug}
        lessonSlug={lessonSlug}
        reviewUserId={reviewUserId}
        moduleOrder={moduleOrder}
        dueReviews={warmupCompletedRef.current ? [] : dueReviews}
        onWarmupDone={handleWarmupDone}
        freeRecallPrompts={freeRecallPrompts}
        scriptAutoPlay={!scriptPlayedRef.current}
        onScriptPlayed={handleScriptPlayed}
        scriptStatusRef={scriptStatusRef}
        briefingVariant={briefingVariant}
        moduleEntry={moduleEntry}
        clipUrl={
          briefingVariant === "clip"
            ? (sceneClipFor(worldSlug, moduleSlug, lesson.slug)?.url ?? null)
            : null
        }
      />
    );
  } else if (currentStep === 1) {
    rightKind = "none";
    shellLeft = <StepConcept {...sharedContentProps} />;
  } else if (currentStep === 2) {
    rightKind = "code";
    shellLeft = <StepCode {...sharedContentProps} />;
    shellRight = (
      <LessonContent
        lesson={lesson}
        exercises={exercises}
        worldId={worldSlug}
        moduleId={moduleSlug}
        lessonId={lessonSlug}
        glossaryTerms={lesson.glossaryTerms}
        visibleComponents={CODE_RIGHT}
      />
    );
  } else if (currentStep === 3) {
    // unchanged
  } else if (currentStep === 4) {
    rightKind = "none";
    shellLeft = <StepTakeaways {...sharedContentProps} />;
  } else {
    // unchanged
  }
```

7. `StepConcept`: replace the function body with:

```tsx
  return (
    <div>
      <PhaseChip label="Concept" icon={"◎"} />
      <p
        className="text-base leading-[1.85] mb-6 max-w-[820px]"
        style={{ color: "var(--tc-muted)" }}
      >
        {lesson.concept.explanation}
      </p>
      {/* Objectives sit before the first heading in every lesson, where the
          main instance's hideStoryZone hides them; this second instance
          renders them once, in flow, above the read (spec section 3). */}
      <div className="lesson-prose mb-6" data-testid="concept-intro">
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          worldId={worldSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          glossaryTerms={lesson.glossaryTerms}
          visibleComponents={CONCEPT_INTRO}
        />
      </div>
      <div className="lesson-prose">
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          worldId={worldSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          glossaryTerms={lesson.glossaryTerms}
          visibleComponents={CONCEPT_LEFT}
          layout="paired"
          hideChallengeOnward
          hideStoryZone
        />
      </div>
    </div>
  );
```

8. `StepTakeaways`: give the `lesson-prose` div `className="lesson-prose max-w-[820px]" data-testid="takeaways-prose"` (spec section 3: the Takeaways step gets the frame and the 820 px cap as a single column), and render `<LessonTermsList terms={lesson.glossaryTerms ?? []} />` as its sibling after it. No new prop: `lesson` already arrives through `sharedContentProps`, and a prop named `terms` would shadow the module-level `terms()` helper. The Takeaways body does not pass `layout`.
9. `SceneCard` is the only renderer of `pattern-format-tag`, and item 6 stopped mounting it, so the playback test "renders the FORMAT tag and slugline" would go red here. Put the tag in the Briefing eyebrow now. In `StepBriefing`, the eyebrow div (line 1931 today) reads:

```tsx
        <div
          className="text-xs font-mono uppercase tracking-[3px] mb-6"
          style={{ color: "var(--tc-primary)" }}
        >
          {terms(worldSlug).module.toUpperCase()} {moduleSlug} &middot;{" "}
          {terms(worldSlug).lesson.toUpperCase()} {lesson.order}
        </div>
```

Add the tag inside it, after the lesson number:

```tsx
          {terms(worldSlug).lesson.toUpperCase()} {lesson.order}
          {lesson.pattern && lesson.pattern !== "standard" && (
            <>
              {" "}&middot;{" "}
              <span data-testid="pattern-format-tag">
                {PATTERN_LABELS[lesson.pattern]}
              </span>
            </>
          )}
```

Task 8 folds the duration into the same line and adds the eyebrow's own test id.

   The same playback test asserts the slugline with `expect(screen.getAllByText("Archimedes, Bridge").length).toBeGreaterThan(0);` (line 354). Testing Library's string matcher is an exact full-string match, and the only element whose own text was exactly the location was SceneCard's `<span>{scene.location}</span>`. The surviving `SceneHeading` (`packages/ui/src/mdx/scene-heading.tsx`) renders one uppercased text node that joins location and time (`ARCHIMEDES, BRIDGE - SECOND WATCH`). Change line 354 to `expect(screen.getAllByText(/Archimedes, Bridge/i).length).toBeGreaterThan(0);` so it matches the slugline row.

10. Delete the `SceneCard` function (its comment starts at line 1472; the function runs from 1473 to just before `MissionProgress`) and the `MissionProgress` function (line 1577 to just before `extractSpeakers` at 1631), locating both by name. Then remove their now-unused imports: `AnimatedAvatar` from the `@tensorcraft/ui` import on line 47, and `portraitSources` plus `resolveCharacter` from the `@/lib/character-art` import on line 49; SceneCard is the only user of all three. `worlds` stays: `terms()` at line 71 uses it. `pnpm --filter @tensorcraft/web lint` confirms the list.
11. The reader root (line 1256): add the page class: `className="lesson-page flex-1 overflow-y-auto"`.
12. Review round (applied at the Task 7 checkpoint): type `rightKind` as `React.ComponentProps<typeof LessonShell>["rightKind"]`; give the chrome wrapper and the exercise-history status line `px-5 md:px-12` so they match the frame; add `max-w-[820px]` to `StepChallenge`'s `lesson-prose` wrapper and to `StepCode`'s root. In the reader test, the stub also forwards `hideStoryZone` as `data-hide-story-zone`, the objectives case asserts the intro instance's props (`data-visible="LearningObjectives"`, no `data-layout`, no `data-hide-story-zone`) and the body's `data-hide-story-zone="true"`, and the no-right-slot case anchors on the step counter (`2 / 6`) before its second check. In the e2e Concept test, the `lesson-right` count runs after the paired root is visible, because the step is restored on the client and the server HTML is the Briefing.

- [ ] **Step 7: Run the unit suites and typecheck**

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/' && pnpm typecheck && pnpm --filter @tensorcraft/web lint`
Expected: PASS, including the playback suite's format-tag case now that the tag lives in the eyebrow; typecheck with no errors; lint 0 errors. `content-partition-contract.test.ts` needs no edit (it iterates the set values).

- [ ] **Step 8: Update the worlds e2e**

In `e2e/worlds.spec.ts`, the Concept-step test that starts at line 224 with the name "Concept step underlines glossary terms and lists them in the rail" (its rail assertions are at 236 to 250): rename it to `"Concept step renders the paired grid and underlines glossary terms"` and replace the rail assertions with:

```ts
    // No right slot on the Concept step (spec 2026-09-23); the body is the
    // paired grid and a visible concept term chip proves the read rendered.
    await expect(page.getByTestId("lesson-right")).toHaveCount(0);
    await expect(
      page.locator('.lesson-step-content[data-layout="paired"]'),
    ).toBeVisible();
    const term = page
      .locator(".lesson-prose [data-glossary-term]:visible")
      .first();
    await expect(term).toBeVisible({ timeout: 15000 });
```

Replace the test "clicking a glossary term activates its rail entry" (from its `test(` line through its closing) with:

```ts
  test("the Takeaways step lists the lesson's terms", async ({ page }) => {
    await page.addInitScript(
      ({ stepKey, maxKey }) => {
        localStorage.setItem(stepKey, "4");
        localStorage.setItem(maxKey, "4");
        localStorage.setItem("tc-cookie-consent", "declined");
      },
      { stepKey: STEP_KEY, maxKey: MAX_KEY },
    );
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });
    const list = page.getByTestId("lesson-terms-list");
    await expect(list).toBeVisible({ timeout: 15000 });
    await expect(
      list.getByRole("heading", { level: 2, name: "Terms in this lesson" }),
    ).toBeVisible();
    expect(await list.locator('[data-testid^="glossary-entry-"]').count()).toBeGreaterThan(0);
  });
```

The `data-kind="code"` assertion at line 350 stays; rename its test from "Code step swaps the right rail for a work pane" to "Code step renders the worked example in the code slot".

- [ ] **Step 9: Checkpoint**

Owner commits Tasks 6 and 7. Suggested message: `feat(web): one lesson frame, rail removed, objectives in flow, terms list on Takeaways`.

---

### Task 8: The Briefing

Implements spec section 2. Line numbers in this task were measured before Task 7 removed the rail branches and the glossary wrapper; locate by the quoted content, not the number.

**Files:**
- Modify: `.../lesson-steps.tsx` (`StepBriefing` JSX lines 1925 to 2078, the step body wrapper at line 1313, the post-scene block)
- Modify: `apps/web/app/globals.css` (story grid rules; the story-paragraph rule at line 469)
- Modify: `apps/web/app/components/lesson-warmup.tsx:81`
- Modify: `.../scene-clip.tsx:86`
- Modify: `packages/ui/src/mdx/scene-heading.tsx` (a `divider` prop)
- Test: `lesson-steps.playback.test.tsx`, `packages/ui/src/mdx/scene-heading.test.tsx`, `.../scene-clip.test.tsx`, `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts`, `e2e/lesson-variety.spec.ts`

- [ ] **Step 1: Adjust the format-tag test to the eyebrow**

In `lesson-steps.playback.test.tsx`, the test "renders the FORMAT tag and slugline when pattern and scene are set" keeps its assertions (the tag has lived in the eyebrow since Task 7); add one line after the tag assertion:

```tsx
    expect(tag.closest("[data-testid='lesson-eyebrow']")).not.toBeNull();
```

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.playback.test.tsx' -t "FORMAT tag"`
Expected: FAIL, `closest` returns null, because the eyebrow div has no test id yet.

`SceneHeading` draws its own hairline (an inline `borderBottom`) with `pb-3 mb-7`. Inside the slugline row below, which draws the row's single hairline under both the heading and the playback control, that would render two hairlines and 40 px of stray space, and an inline style cannot be overridden from the stylesheet. Give the component a `divider` prop. Append to `packages/ui/src/mdx/scene-heading.test.tsx`:

```tsx
  it("draws its own hairline and spacing by default", () => {
    const { container } = render(<SceneHeading location="Lab" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.borderBottom).toContain("1px solid");
    expect(root).toHaveClass("pb-3", "mb-7");
  });

  it("drops its hairline and spacing when a host row draws the line", () => {
    const { container } = render(<SceneHeading location="Lab" divider={false} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.borderBottom).toBe("");
    expect(root).not.toHaveClass("pb-3");
    expect(root).not.toHaveClass("mb-7");
  });
```

Run `pnpm vitest run packages/ui/src/mdx/scene-heading.test.tsx` and expect the second case to FAIL (the prop does not exist yet, so the border is still drawn). Then in `scene-heading.tsx` add `divider?: boolean;` to the props with a one-line comment ("false when a host row draws the hairline, as the Briefing's slugline row does"), destructure it with a default of `true`, and render `className={divider ? "font-mono text-[10px] uppercase tracking-[2.5px] pb-3 mb-7" : "font-mono text-[10px] uppercase tracking-[2.5px]"}` (two whole class strings, never an interpolated fragment) and a style object that includes `borderBottom` only when `divider` is true. Run the file again and expect PASS. The Complete step's epilogue heading keeps the default.

- [ ] **Step 2: Rewrite the Briefing markup**

In `StepBriefing`, replace everything from the eyebrow `div` (line 1931) through the `LessonContent` call (line 2078) with the block below (the file as built after review, including the three explanatory comments carried over from the old markup: the Skip button's touch-target comment, the "Establishing shot" comment and the "Dialogue, screenplay beats from MDX" comment).

```tsx
        <div
          data-testid="lesson-eyebrow"
          className="text-xs font-mono uppercase tracking-[3px] mb-3"
          style={{ color: "var(--tc-primary)" }}
        >
          {terms(worldSlug).module.toUpperCase()} {moduleSlug} &middot;{" "}
          {terms(worldSlug).lesson.toUpperCase()} {lesson.order}
          {lesson.pattern && lesson.pattern !== "standard" && (
            <>
              {" "}
              &middot;{" "}
              <span data-testid="pattern-format-tag">
                {PATTERN_LABELS[lesson.pattern]}
              </span>
            </>
          )}{" "}
          &middot;{" "}
          {/* Reading + embedded exercises: "14 min · 2 exercises" where the
            exercises alone are 30 min reads as a lie. One basis everywhere
            (module map, JSON-LD, courseWorkload). */}
          {`${lesson.estimatedMinutes + exercises.reduce((s, e) => s + (e.estimatedMinutes ?? 0), 0)} min${exercises.length > 0 ? ` · ${exercises.length} ${exercises.length === 1 ? "exercise" : "exercises"}` : ""}`}
        </div>

        <h1
          className="text-4xl md:text-6xl font-bold mb-3 leading-[1.1] tracking-tight"
          style={{ color: "var(--tc-text)" }}
        >
          {highlightFirstLongWord(lesson.title, "var(--tc-primary)")}
        </h1>

        {/* Slugline row: the scene heading (first beat) and the playback
          control, on one line over one hairline. The control sits outside
          the beat wrapper so it never inherits a beat's hidden state. Both
          controls share a 44 px height and a 160 px minimum width (min-h-11
          min-w-40), so the row keeps its height and its wrapping when Skip
          becomes Replay, and ml-auto keeps the control at the right when the
          row wraps on a phone or there is no scene. */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border pb-2 mb-6">
          {lesson.scene ? (
            <div data-script-beat="" className="min-w-0">
              <SceneHeading
                prefix="Int."
                location={lesson.scene.location}
                time={lesson.scene.time}
                divider={false}
              />
            </div>
          ) : null}
          {scriptState === "playing" ? (
            <button
              type="button"
              onClick={() => {
                // The scene only plays on the briefing step (step 0).
                track(EVENTS.SCRIPT_SKIPPED, {
                  worldId: worldSlug,
                  lessonId: lessonSlug,
                  step: 0,
                  elapsedMs: playStartedAtRef.current
                    ? Date.now() - playStartedAtRef.current
                    : 0,
                  via: "button",
                  briefingVariant,
                });
                rememberScriptSkipped();
                finish(false);
              }}
              // Was text-xs on a decorative border: technically a control,
              // practically invisible, and the only exit from a 15.5s scene at
              // the product's activation moment. Now readable, with a real
              // touch target and an interactive border that clears 3:1.
              className="ml-auto text-xs font-mono uppercase tracking-[2px] px-4 py-2 min-h-11 min-w-40 transition-colors hover:opacity-80"
              style={{
                color: "var(--tc-text)",
                border: "1px solid var(--tc-border-interactive)",
                background: "transparent",
              }}
            >
              Skip intro <span aria-hidden="true">&#9656;</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                runKindRef.current = "replay";
                play();
              }}
              className="ml-auto text-xs font-mono uppercase tracking-[2px] px-3 py-1.5 min-h-11 min-w-40 transition-colors hover:opacity-80"
              style={{
                color: "var(--tc-muted)",
                border: "1px solid var(--tc-border)",
                background: "transparent",
              }}
            >
              <span aria-hidden="true">&#8635;</span> Replay scene
            </button>
          )}
        </div>

        {/* Story grid (spec section 2, item 4): the plate column beside the
          beats. LessonContent's root is the second grid item, unchanged, so
          collectBeats and the register rules keep walking a flat list. */}
        <div className="lesson-story-grid">
          <div className="lesson-story-plate">
            {/* Establishing shot: its own playback beat, slugline then picture
              then stage direction, screenplay order. With an approved clip
              and the "clip" variant this is the scene VIDEO (owner ruling
              2026-09-04: launch ships with video), poster = the same still;
              otherwise the still exactly as before. The still's src stays
              speculative (art ships incrementally per docs/scene-bible.md);
              on 404 the component removes itself and the timeline matches
              today's. */}
            {lesson.scene &&
            briefingVariant === "clip" &&
            clipUrl &&
            scriptState !== "idle" ? (
              <SceneClip
                clipUrl={clipUrl}
                posterSrc={`/scenes/${worldSlug}/${moduleSlug}/${lessonSlug}.webp`}
                alt={lesson.scene.portraitAlt}
                autoPlayEligible={
                  scriptAutoPlay &&
                  !prefersSkippedScript() &&
                  !prefersReducedMotion()
                }
                worldId={worldSlug}
                lessonId={lessonSlug}
              />
            ) : lesson.scene ? (
              <ScenePortrait
                beat
                className="mb-4"
                src={`/scenes/${worldSlug}/${moduleSlug}/${lessonSlug}.webp`}
                alt={lesson.scene.portraitAlt}
              />
            ) : null}
            <p
              data-script-beat=""
              className="text-sm italic leading-[1.85] max-w-[52ch]"
              style={{ color: "var(--tc-muted)" }}
            >
              {lesson.context.narrative}
            </p>
          </div>

          {/* Dialogue, screenplay beats from MDX. hideTeaching: the Briefing is
            the story zone only since the 2026-09-04 prose partition; the
            teaching body reads once, on the Concept step. */}
          <LessonContent
            lesson={lesson}
            exercises={exercises}
            worldId={worldSlug}
            moduleId={moduleSlug}
            lessonId={lessonSlug}
            glossaryTerms={lesson.glossaryTerms}
            visibleComponents={BRIEFING_COMPONENTS}
            storyRegister
            hideChallengeOnward
            hideTeaching
          />
        </div>
```

Then in the post-scene block that follows, change `<div data-post-scene="">` to `<div data-post-scene="" className="mt-6 space-y-6">` and the catch-up `details` class from `"mt-10 border-t border-border pt-4"` to `"border-t border-border pt-4"`.

In `apps/web/app/components/lesson-warmup.tsx` line 81, change `className="mt-10 border-t border-border pt-6"` to `className="border-t border-border pt-6"`.

In `scene-clip.tsx` line 86, change `className="mb-7 relative"` to `className="mb-4 relative"`, and give the `ScenePortrait` it renders when the video errors (near line 79) `className="mb-4"` too, so a failed clip sits 16 px above the stage direction like the still and the video. In `scene-clip.test.tsx`, let the `ScenePortrait` stub put `className` on its root and assert the fallback has `mb-4`.

On the step body wrapper (the element with `role="group"` whose class reads `animate-step-in outline-none ${isStoryStep ? "min-h-[50vh] flex flex-col justify-center" : ""}`), remove the story-step branch so the class is `className="animate-step-in outline-none"`, and delete `isStoryStep` (it covered steps 0 and 5; nothing else reads it). The Complete step keeps its horizontal centring from its own `text-center py-12` root; only the manufactured 50vh height goes, as spec section 1 says.

The stage direction keeps `max-w-[52ch]` on the element: the stylesheet's story-paragraph cap selects direct children of `LessonContent`'s root, and the direction sits in the plate column outside it. Only its `pl-6` and `mb-7` go.

- [ ] **Step 3: Add the story grid rules**

In `apps/web/app/globals.css`, after the paired block's end marker, add:

```css
/* Briefing story grid (spec 2026-09-23, section 2): the plate column (the
   picture, then the stage direction) beside the beats. Below lg they stack
   in DOM order in one column no wider than 820 px, with the row gap between
   them and the picture no wider than 600 px. From lg the beats column is
   280 to 544 px wide and the plate column takes the rest: 600 and 544 px at
   the frame's full width (windows of 1,280 px and wider, the spec's
   numbers), about 344 and 544 px at 1,024 px, so the picture shrinks before
   the dialogue does. The breakpoint is written like the paired block's
   (64rem, Tailwind's lg) so the frame's lg: utilities and this grid switch
   together. */
.lesson-story-grid {
  display: grid;
  grid-template-columns: minmax(0, 820px);
  column-gap: var(--l-gutter, 40px);
  row-gap: var(--l-row, 24px);
}
.lesson-story-plate > figure {
  max-width: 600px;
}
@media (width >= 64rem) {
  .lesson-story-grid {
    grid-template-columns: minmax(0, 1fr) minmax(280px, 544px);
  }
  .lesson-story-plate {
    align-self: start;
  }
  /* No picture (no scene, or the still failed to load): one column, so the
     beats never sit beside an empty one. */
  .lesson-story-grid:not(:has(> .lesson-story-plate > figure)) {
    grid-template-columns: minmax(0, 820px);
  }
}
/* The beats column is a grid item, so its last story block's margin can no
   longer collapse into the post-scene slot's or the nav's; zero it so those
   own the gap. At (0,4,0) this outranks the row-beat margin rule (0,3,0)
   and the prose paragraph rule (0,1,1). */
.lesson-story-grid
  > .lesson-step-content[data-story-register="true"]
  > :is(:has(+ :is(h2, h3)), :last-child) {
  margin-bottom: 0;
}
/* The first story block's top margin is trapped the same way at the top of
   the beats column (a sensor-log blockquote opens 12 of the 56 Deep Orbit
   stories, and its 1.5em margin put the story 24 px below the picture);
   zero it so the story starts level with the picture, and 24 px under the
   stage direction when the columns stack. */
.lesson-story-grid
  > .lesson-step-content[data-story-register="true"]
  > :first-child {
  margin-top: 0;
}
```

The block above is the file as built after review (spec section 2, item 4, amended): below lg one 820 px column with the picture capped at 600 px and the columns stacked by the grid's `--l-row` row gap; from lg the tracks `minmax(0, 1fr) minmax(280px, 544px)` (600 and 544 at full frame width, the picture giving way first on narrow desktops); one 820 px column when the plate column holds no `figure` (no scene, or the still failed to load); the last visible story block's bottom margin zeroed, because it cannot collapse out of a grid item; and, added after Task 11's tightened plate check caught a 24 px offset on the 12 lessons whose story opens on a sensor-log blockquote, the first story block's top margin zeroed for the same reason. Pin it first, in `lesson-layout-contract.test.ts` inside the grid describe, as a case "lays the Briefing story grid out from lg" (it pins the base template, both gaps, the 600 px figure cap, the lg template, the plate's `align-self: start;`, the no-figure guard's `minmax(0, 820px)` and the trailing-margin rule's `margin-bottom: 0;`): fold the whole stylesheet as the unpaired case does and assert with the `body` helper that `.lesson-story-grid {` contains `display: grid;` and `column-gap: var(--l-gutter, 40px);`, that the stylesheet contains `@media (width >= 64rem)`, and that the `.lesson-story-grid {` rule found after that media query contains `grid-template-columns: minmax(0, 1fr) minmax(280px, 544px);`. Run it red (the rules do not exist yet), then add the CSS and run it green.

And in the story-paragraph rule (the rule whose selector begins `.lesson-step-content[data-story-register="true"]` and whose body sets `font-style: italic`, near line 582 in the current file), delete the `padding-left: 1.5rem;` line; keep `max-width: 52ch`.

The three briefing-meta cases in `lesson-steps.test.tsx` (lines 317 to 361) keep passing after the eyebrow merge: `getByText` matches the div's own text nodes and the tag is a child element. Do not rewrite them when the separate duration line disappears.

- [ ] **Step 4: Run the Briefing suites**

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.playback.test.tsx' 'apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx' 'apps/web/app/worlds/[slug]/[module]/[lesson]/post-scene-contract.test.ts' apps/web/app/components/lesson-warmup.test.tsx`
Expected: PASS. The post-scene contract still finds exactly one `data-post-scene=` stamp.

- [ ] **Step 5: Update the lesson-variety e2e comment**

In `e2e/lesson-variety.spec.ts`, the header comment's phrase spans lines 4 and 5 (line 4 ends with `velite`, line 5 reads ` * frontmatter → lesson page → SceneCard.`); change line 5 to ` * frontmatter → lesson page → eyebrow and slugline.`, and at line 16 change `// SceneCard rail: scene slugline fed from frontmatter.` to `// Slugline row: scene location fed from frontmatter.` The assertions stay. In `packages/content/velite.config.ts` lines 174 to 178 (one line lower than at HEAD, after Task 1's import), reword the comment that says the rail beside the Takeaways step lists the terms: it is now the Takeaways "Terms in this lesson" list. Three more comments name removed things and should be reworded in the same step: `packages/content/src/schemas.ts` line 63 and its duplicate in `packages/content/velite.config.ts` line 130 ("the Briefing SceneCard" becomes "the Briefing eyebrow" in both), and `packages/content/src/expressions.test.ts` line 30 (mentions `extractSpeakers`; describe the speaker set from the compiled body instead).

- [ ] **Step 6: Checkpoint**

Owner commits. Suggested message: `feat(web): Briefing story grid, slugline row, format tag in the eyebrow`.

---

### Task 9: Objectives component

Implements spec section 3, "Objectives".

**Files:**
- Modify: `packages/ui/src/mdx/learning-objectives.tsx`
- Test: `packages/ui/src/mdx/learning-objectives.test.tsx`

- [ ] **Step 1: Write the failing test**

Append to `learning-objectives.test.tsx`:

```tsx
  it("labels the block as a level-two heading and lays items two across from lg", () => {
    render(<LearningObjectives objectives={["a", "b"]} />);
    const heading = screen.getByRole("heading", { level: 2, name: "You will be able to" });
    expect(heading).toBeInTheDocument();
    // Inline metrics, so the unlayered .lesson-prose h2 rule cannot restyle it.
    const style = heading.getAttribute("style") ?? "";
    expect(style).toContain("font-size: 0.75rem");
    expect(style).toContain("font-weight: 600");
    expect(style).toContain("color: var(--tc-primary)");
    const list = screen.getByRole("list");
    expect(list.className).toContain("lg:grid-cols-2");
    // The unlayered .lesson-prose ul and li rules (globals.css) would indent
    // the list 1.5em, add item margins and enlarge the text to the body size
    // at md; the metrics are pinned inline for the same reason as the h2.
    const listStyle = list.getAttribute("style") ?? "";
    expect(listStyle).toContain("padding-left: 0");
    expect(listStyle).toContain("margin: 0");
    const itemStyle = screen.getAllByRole("listitem")[0].getAttribute("style") ?? "";
    expect(itemStyle).toContain("font-size: 0.875rem");
    expect(itemStyle).toContain("margin: 0");
  });
```

Run: `pnpm vitest run packages/ui/src/mdx/learning-objectives.test.tsx`
Expected: FAIL, no heading named "You will be able to".

- [ ] **Step 2: Implement**

Replace the component:

```tsx
interface LearningObjectivesProps {
  objectives: string[];
}

export function LearningObjectives({ objectives }: LearningObjectivesProps) {
  return (
    <div className="min-w-0 [overflow-wrap:anywhere] p-5 brutalist-shadow bg-surface-raised border border-border">
      {/* Inline metrics on purpose: this heading renders inside .lesson-prose,
          whose unlayered `.lesson-prose h2` rule in apps/web/app/globals.css
          outranks Tailwind's layered utilities and would set it to 1.5rem,
          weight 700, text colour, with a 2.5em top margin. Every property
          that rule sets is pinned here. */}
      <h2
        className="font-mono uppercase tracking-widest"
        style={{
          fontSize: "0.75rem",
          lineHeight: "1rem",
          fontWeight: 600,
          margin: "0 0 0.75rem",
          color: "var(--tc-primary)",
        }}
      >
        You will be able to
      </h2>
      {/* The list and its items render inside .lesson-prose too, whose
          unlayered ul and li rules in apps/web/app/globals.css would indent
          the list, space the items and set the body text size; pinned inline
          like the heading. */}
      <ul
        role="list"
        className="grid gap-x-8 gap-y-2 lg:grid-cols-2"
        style={{ paddingLeft: 0, margin: 0 }}
      >
        {objectives.map((obj) => (
          <li
            key={obj}
            className="flex items-start gap-2 text-text-primary/80"
            style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.625 }}
          >
            {/* Decorative: without aria-hidden, VoiceOver reads "white
                circle" before every objective. */}
            <span
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-xs text-primary"
            >
              ○
            </span>
            <span className="min-w-0">{obj}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Update any existing assertion in the test that expected "Learning Objectives" or an `h4`. The component above is the file as built after review: the list carries `role="list"` (WebKit exposes a marker-less `ul` as a plain group) and the bullet glyph `aria-hidden="true"` (screen readers read it aloud otherwise). The test checks each pinned property exactly through `element.style` (zero lengths serialize as `0px`) rather than substrings, and `apps/web/app/globals.css` carries a one-line note above the `.lesson-prose` `h2`, `ul`/`ol` and `li` rules naming this component.

- [ ] **Step 3: Run and checkpoint**

Run: `pnpm vitest run packages/ui/src/mdx/learning-objectives.test.tsx`
Expected: PASS. Owner commits: `feat(ui): objectives block reads "You will be able to", two across`.

---

### Task 10: Chrome, nav and Continue spacing

Implements spec section 1 (chrome) and section 6. Line numbers were measured before Task 7; locate by content.

**Files:**
- Modify: `.../lesson-steps.tsx` `ChromeBar` (lines 1348 to 1371) and `bottomNav` (line 1017)
- Modify: `.../challenge-passed-banner.tsx:44`
- Modify: `apps/web/app/components/review-prompt-card.tsx:114`
- Modify: `.../lesson-shell.tsx` and `apps/web/app/globals.css` (the Code step's slot gap)
- Test: `lesson-steps.test.tsx`, `__tests__/lesson-shell.test.tsx`, `__tests__/lesson-layout-contract.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `describe("LessonSteps, step navigation chrome", ...)` in `lesson-steps.test.tsx`:

```tsx
  it("shows the lesson title in the chrome on every step but the Briefing", () => {
    renderSteps();
    const chrome = document.querySelector("[data-testid='lesson-chrome']")!;
    expect(chrome.querySelector("h1")).toBeNull();
    expect(chrome.textContent).not.toContain(lesson.title);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      document.querySelector("[data-testid='lesson-chrome'] h1"),
    ).toHaveTextContent(lesson.title);
  });
```

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx' -t "chrome on every step"`
Expected: FAIL, `lesson-chrome` not found.

- [ ] **Step 2: Edit the chrome**

In `ChromeBar`, replace line 1348 and lines 1359 to 1368 (the `min-w-0` div closes at 1368; `<ReportIssueTrigger />` on 1369 and the rest of the bar stay):

```tsx
  const LessonHeading = currentStep === 0 ? "p" : "h1";
```
```tsx
    <div className="mb-8 border-b border-border pb-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-mono text-text-muted mb-1">
            {moduleName ?? moduleSlug}
          </p>
          <LessonHeading className="text-base font-semibold text-text-primary">
            {lessonTitle}
          </LessonHeading>
        </div>
```

with:

```tsx
  // The Briefing's title card is that step's H1 (spec 2026-09-23); on every
  // other step the chrome title is the page's only H1 and stays.
  const showTitle = currentStep !== 0;
```
```tsx
    <div data-testid="lesson-chrome" className="mb-4 border-b border-border pb-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-mono text-text-muted mb-1">
            {moduleName ?? moduleSlug}
          </p>
          {showTitle && (
            <h1 className="text-base font-semibold text-text-primary">
              {lessonTitle}
            </h1>
          )}
        </div>
```

The chrome wrapper already reads `mx-auto w-full max-w-7xl px-5 md:px-12`: the Task 7 review moved it (and the exercise-history status line above it) from `px-6` to `px-5` so both match the frame at phone width. Nothing to change there.

- [ ] **Step 3: Apply the nav and Continue spacing**

`bottomNav` (line 1017): `className="flex flex-wrap gap-4 items-center justify-between mt-10 pt-6"` becomes `className="flex flex-wrap items-center justify-between mt-(--l-nav-top) pt-(--l-nav-inner) gap-(--l-nav-inner) pb-(--l-nav-bottom)"` (40 above the hairline, 24 below it and between controls, 40 to the footer, read from the spacing scale as spec section 6 asks, through Tailwind v4's variable shorthand), and the element gains `data-testid="lesson-nav"` so Task 11 can measure from its hairline.

`challenge-passed-banner.tsx` line 44: `className="mt-4 flex items-center justify-between gap-4 border px-5 py-4"` becomes `className="mt-(--l-row) flex items-center justify-between gap-(--l-nav-inner) border px-5 py-4"`.

`review-prompt-card.tsx` line 114: `` className={`${buttonClass} mt-3`} `` becomes `` className={`${buttonClass} mt-[var(--l-nav-inner,24px)]`} `` (the card is also used outside the lesson page, hence the fallback). The Briefing's post-scene slot (Task 8's `mt-6 space-y-6`) becomes `mt-(--l-slot) space-y-(--l-slot)`, and `StepConsequence`'s root changes from `text-center py-12` to `text-center pt-12`: its bottom padding blocked margin collapse and put the nav 88 px (120 with no next lesson) below the last block. Pin each of these classes in the step navigation chrome describe, `challenge-passed-banner.test.tsx` and `lesson-warmup.test.tsx`, and add a case that visits all six steps and finds exactly one level-1 heading carrying the lesson title on each. Reword the spacing-scale comment in `globals.css` to name the rules and utilities that read the tokens and the values still repeated as literals (the shell's gaps, the pane's offsets, the companions' `p-5`).

`StepConcept`'s explanation paragraph is already capped at 820 px by Task 7; `StepCode` has no such paragraph, so nothing else changes here.

The Code step's slot gap (spec section 4, amended). The left slot (the intro line and any drawers) sits above the code slot (the worked example). Grid items do not collapse margins, so the visible gap is the shell's 24 px row gap plus the left slot's trailing 24 px (the intro line's `mb-6`, or the last drawer's unpaired `--l-row` margin) plus the code block's 32 px `my-8`: about 80 px. The target is 24 px. Write the tests first: in `__tests__/lesson-shell.test.tsx`, assert the grid has `gap-y-0` (and no `gap-y-6`) for `rightKind="code"` and `gap-y-6` for `"none"` and `"pane"`; in `lesson-layout-contract.test.ts`, fold the stylesheet as the unpaired case does and assert with the `body` helper the declarations listed after the CSS block below (pass each two-selector list whole). Run both red. Then:

1. In `lesson-shell.tsx`, build the grid class from whole strings: the code kind gets `grid gap-x-10 gap-y-0 grid-cols-1`, the others keep `gap-y-6` (never glue a class to an interpolation; Tailwind drops it).
2. In `apps/web/app/globals.css`, directly after the unpaired companion rule (`.lesson-step-content > [data-aside]`), add the rules below (as built after review, measured in headless Chromium: 40 px above the nav on the Code step, on the Challenge editor with and without the passed banner, and on the Challenge instructions view at 390 and a tall-instructions column at 1,440; 24 px from the left slot to the worked example; the two worked examples in a slot now sit 24 px apart instead of 32). The first pair replaces an earlier `margin-top: 0` rule; the last rule relies on the hint panel being the content root's last child, which `lesson-content.test.tsx` pins by rendering (the root's `lastElementChild` is the panel), and on every lesson having hints, which the contract test pins over the five world corpora:

```css
/* The code slot (Code step) and the editor slot (Challenge) are grid items,
   so a block's trailing margin stays inside them and pushes the nav down,
   and a leading one adds to the gap above. Lay each slot's blocks out as a
   column with the row gap between them and no margins of their own: the
   slot starts at its first block and ends at its last, so the left slot's
   trailing 24 px is the gap above the worked example and the nav's own
   40 px is the gap below. Hidden prose is display: none and takes no gap. */
.lesson-page [data-kind="code"] .lesson-step-content,
.lesson-page [data-kind="pane"] .lesson-step-content {
  display: flex;
  flex-direction: column;
  row-gap: var(--l-row, 24px);
}
.lesson-page [data-kind="code"] .lesson-step-content > *,
.lesson-page [data-kind="pane"] .lesson-step-content > * {
  margin-block: 0;
}

/* The Challenge instructions column is a grid item too. Its last block (the
   hint panel, in every current lesson) would otherwise keep its bottom
   margin inside the column and push the nav to 64 px. */
.lesson-page .lesson-step-content[data-show-challenge="true"] > :last-child {
  margin-bottom: 0;
}
```

In the contract test, pin the container rule's `display: flex;`, `flex-direction: column;` and `row-gap: var(--l-row, 24px);`, the child rule's `margin-block: 0;`, and the instructions rule's `margin-bottom: 0;`. Run the suites green. Task 11 measures the gaps in a browser.

3. Nav to footer: the reader's inner wrapper directly inside the `.lesson-page` root changes from `py-6` to `pt-6`; nothing renders after the shell inside it, and its bottom padding stacked under the nav's `pb-10` (64 px to the footer). Pin it in the step navigation chrome describe: `.lesson-page > div` has `pt-6` and not `py-6`, and `[data-testid='lesson-nav']` has `pb-10`.

- [ ] **Step 4: Run the suites**

Run: `pnpm vitest run 'apps/web/app/worlds/[slug]/[module]/[lesson]/' apps/web/app/components && pnpm typecheck && pnpm --filter @tensorcraft/web lint`
Expected: PASS, 0 lint errors.

- [ ] **Step 5: Checkpoint**

Owner commits. Suggested message: `feat(web): chrome title only off the Briefing; nav and Continue spacing on the scale`.

---

### Task 11: Playwright layout test

Implements the success criteria as a browser test. Run it against a production build the way CI does (see `docs/visual-regression.md` and the recipe in the memory file `e2e_local_run_recipe.md`: build, then `CI=1 PW_PORT=3117`).

**Files:**
- Create: `e2e/lesson-layout.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect, type Page } from "@playwright/test";
import { seedDueReview, REVIEW_WARMUP_LESSON } from "./review-fixture";

/*
  Layout criteria from docs/superpowers/specs/2026-09-23-lesson-layout-design.md.
  Two free lessons: one whose bridge follows a paragraph, and one whose
  bridge the build moved after its section's first paragraph. The spanning
  case, a companion with no paragraph to pair with, is exercised by
  injecting a companion into the first lesson's grid.
*/
// Both in the free module: a signed-out visitor is redirected to the paywall
// on any paid lesson, and the e2e suite has no purchased fixture. The
// spanning case (a companion with no pairable block in its section) exists
// only in paid lessons, so it is exercised below by injecting a companion
// into lesson 1's real grid; the plugin unit test covers the corpus count.
const LESSONS = {
  paragraphLed: "/worlds/deep-orbit/foundations/introduction-to-tensors",
  headingLed: "/worlds/deep-orbit/foundations/tensor-shapes",
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
      await expect(page.getByTestId("takeaways-prose")).toBeVisible();
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
    return {
      leftBottom: Math.max(...leftBlocks.map(bottom)),
      rightTop: Math.min(...rightBlocks.map(top)),
      lastBottom: Math.max(...[...leftBlocks, ...rightBlocks].map(bottom)),
      navTop: top(one(document, "[data-testid='lesson-nav']")),
    };
  });
}

test.describe("lesson layout, desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });

  for (const step of [0, 1, 4, 5]) {
    test(`step ${step + 1} has no right column, and the footer sits at least 40 px below the nav`, async ({
      page,
    }) => {
      await openStep(page, LESSONS.paragraphLed, step);
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
      // Both free lessons have only paragraph-led companions today (the 19
      // that span are all in paid lessons; the rule-6 test below covers
      // spanning), so every companion here must pair. Without this, a grid
      // where nothing pairs passes the loop above: each companion takes the
      // spanning branch and each paragraph the unpaired one.
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

  for (const [name, path] of Object.entries(LESSONS)) {
    test(`Code step: the worked example sits 24 px below the left slot on the ${name} lesson`, async ({
      page,
    }) => {
      await openStep(page, path, 2);
      const m = await codeStepEdges(page);
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

  test("the nav sits 40 px below the Complete step's next-lesson card", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 5);
    // The card paints a box (border and background), so its border-box
    // bottom is the visible edge; the step's own wrapper must add nothing
    // (a bottom padding there once put the nav 88 px down). By test id: the
    // step keeps the lesson body in the DOM, hidden, and lesson 1's teaching
    // paragraph above the Challenge heading links to the next lesson too.
    const gap = await page.evaluate(() => {
      const one = (s: string) => {
        const found = document.querySelectorAll(s);
        if (found.length !== 1)
          throw new Error(`${s}: ${found.length} matches`);
        return found[0];
      };
      return (
        one("[data-testid='lesson-nav']").getBoundingClientRect().top -
        one("[data-testid='next-lesson-card']").getBoundingClientRect().bottom
      );
    });
    expect(Math.abs(gap - 40)).toBeLessThanOrEqual(2);
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
});

test.describe("lesson layout, phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });

  test("a fresh guest's story ends --l-nav-top above the nav at 390 px", async ({
    page,
  }) => {
    // One column here, so the beats column is always the story's last row.
    await freshGuestStoryEnd(page);
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

  for (const step of [0, 1, 4]) {
    test(`nothing renders between Continue and the footer on step ${step + 1}`, async ({
      page,
    }) => {
      await openStep(page, LESSONS.paragraphLed, step);
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
});
```

The block above is the file as built. Its first production-build run found the plate top at 377.5 px (see the plate-top trims note after this task); after those trims the listed specs ran 91 of 91 green (2026-09-24). A review round then tightened it (every visible companion must pair; the Code checks read the slots' blocks, not their flex wrappers; a seeded warm-up exercises the post-scene slot; phone reading order is checked by boxes; the footer gap is measured from the nav's lowest control; a `next-lesson-card` test id), which exposed the trapped first-block margin fixed in Task 8's rules; the final run was 104 of 104 green. One test-side detail from the first round stays: `openStep` waits for the step group's own step-in animation to finish, because on the Code and Challenge steps the right slot and the nav sit outside the animated group and a mid-animation read shortens every gap across that boundary. (The Complete-step card is now selected by its `next-lesson-card` test id.)

- [ ] **Step 2: Run it against a production build**

Run:

```bash
rm -rf apps/web/.next
export NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_placeholder_anon_key NEXT_PUBLIC_API_URL=http://localhost:3998 SUPABASE_URL=https://placeholder.supabase.co SUPABASE_SERVICE_ROLE_KEY=sb_placeholder_service_role_key
pnpm turbo build --filter @tensorcraft/web
CI=1 PW_PORT=3117 npx playwright test e2e/lesson-layout.spec.ts e2e/worlds.spec.ts e2e/lesson-variety.spec.ts e2e/review-warmup.spec.ts e2e/script-playback.spec.ts e2e/accessibility.spec.ts e2e/ui-remediation.spec.ts e2e/learning-routes.spec.ts e2e/mobile.spec.ts e2e/editor-drafts.spec.ts --project=chromium --reporter=line > "$SCRATCH/lesson-layout-e2e.log" 2>&1; echo "exit $?"; grep -E "passed|failed|flaky" "$SCRATCH/lesson-layout-e2e.log"
```

(`$SCRATCH` is your scratch directory. Port 3000 belongs to another project on this machine: never use it and never kill what listens there; check `lsof -ti:3117` is empty first, and identify any server you started by its working directory before stopping it.) Expected: all passed. If the phone test's "nothing follows Continue" count is not zero, inspect what rendered below the nav; the spec forbids anything but the footer there. A failure in a spec other than `lesson-layout.spec.ts` is a regression from Tasks 1 to 10 until shown otherwise: find its cause, and check the same test on the base commit before calling it pre-existing.

- [ ] **Step 3: Checkpoint**

Owner commits. Suggested message: `test(e2e): lesson layout criteria by bounding box`.


**Plate-top trims (applied after Task 11's production-build run, 2026-09-24).** The Briefing plate's top edge measured 377.5 px at 1,440 x 900 signed out against the spec's 360: the playback control moved into the slugline row and its 44 px touch target sets that row's height, which the spec's budget had not counted. Three token-aligned trims bring it to 357.5 without touching the controls or the title card: the reader wrapper directly inside `.lesson-page` goes from `pt-6` to `pt-4`, `ChromeBar`'s root from `pb-5` to `pb-4`, and the Briefing slugline row from `mb-6` to `mb-4` (the plate is the scene's second beat, and beats sit `--l-beat` apart). `lesson-steps.test.tsx` pins all three. Spec section 2's plate-top paragraph records the measurement.

---

### Task 12: Docs, backlog, bible, visual baselines

Implements the docs rows of spec section 5 and the visual items in Tests.

**Files:**
- Modify: `docs/story-style-bible.md:161-162`, `:228-229`, `:233-235`
- Modify: `docs/post-launch-backlog.md:4472-4476`, `:4553`, `:4742-4767`
- Modify: `docs/visual-regression.md:8-18`, `:31-38`
- Create: `e2e/visual/lesson.spec.ts`
- Re-mint: `e2e/visual/review-warmup.spec.ts-snapshots/*`
- Modify: `e2e/visual/review-warmup.spec.ts` (it opened lesson 1, where no warm-up can appear since b83a241d; it now opens `REVIEW_WARMUP_LESSON`, as the functional specs already do; it also gained the `document.fonts.ready` wait and the shared `stylePath`, like its siblings)

- [ ] **Step 1: Bible**

Line 161 to 162: `Renders as the INT. slugline and the SceneCard rail.` becomes `Renders as the INT. slugline row above the story grid.`
Line 228: `lists it in the lesson's glossary rail.` becomes `lists it in the Takeaways step's "Terms in this lesson".`
Line 229: delete `Clicking the underlined term highlights its rail entry.`; the chip shows its own definition inline.
Lines 233 to 235: `stays off the rail (the build derives the rail from the rendered underlines, gate \`glossary-rail-contract.test.ts\`).` becomes `stays off the terms list (the build derives the list from the rendered underlines, gate \`glossary-rail-contract.test.ts\`).`

- [ ] **Step 2: Backlog**

Under the "Owner call, one" paragraph (line 4472), append one sentence: `The rail is gone (2026-09-23 layout spec); the same question now applies to the Takeaways "Terms in this lesson" list, which reads the same set.`

Line 4553 `- [ ] **OWNER: the glossary rail.**`: change the checkbox to `- [x]` and append at the end of the item: `Closed 2026-09-23: the rail is removed by the lesson layout spec; the term-source question moves to the Takeaways terms list (see "Owner call, one" above).`

Lines 4742, 4752 and 4761 (the three `(B1)`/`(B2)` items): change each `- [ ]` to `- [x]` and append `Resolved by docs/superpowers/specs/2026-09-23-lesson-layout-design.md (approved 2026-09-23).` to each.

After the last of those three items (near line 4767), add three new items in the same list style. First: `- [ ] Deep Orbit lesson \`advanced-time-series/05-ensemble-methods.mdx\` has the slug \`time-series-ensemble-methods\` but its scene art ships as \`public/scenes/deep-orbit/advanced-time-series/ensemble-methods.webp\`, so the Briefing requests a file that does not exist and shows no picture (a live paid lesson; it predates the 2026-09-23 layout work, which now renders that case as a single column). \`packages/content/__tests__/scene-art-coverage.test.ts\` names each plate from the filename instead of the frontmatter slug, so the gate behind the /pricing "Illustrated lessons" claim passes anyway. Fix: make the gate read the frontmatter slug (it goes red), then rename the asset to the slug (renaming the slug would change the lesson URL and progress keys). Found 2026-09-23 during the lesson layout build.` Second: `- [ ] Neon Protocol lesson \`ml-through-vision/01-seeing-like-a-machine.mdx\` wraps a \`BridgeCallout\` in \`<Section>\`, which the reader renders as a plain div, so neither the paired grid nor the unpaired companion margin (\`.lesson-step-content > [data-aside]\`) reaches it. Found 2026-09-23 during the lesson layout build; not user-visible today because Neon Protocol is not in LAUNCHED_WORLDS. Before Neon launches: unwrap that callout or widen the rule to nested companions.` Third: `- [ ] \`LessonRecap\` and \`KeyTakeaways\` (packages/ui) render inside \`.lesson-prose\`, whose unlayered \`ul\` and \`li\` rules override their \`text-sm\` items (17 px at md) and add a 1.5em indent, and their decorative check glyphs are real text that screen readers read before every item. \`LearningObjectives\` pins its metrics inline and hides its glyph (2026-09-23); these two still need the same treatment, or the \`.lesson-prose\` element rules could move into a cascade layer so components stop pinning. Found in the Task 9 review.`

As built after review, the backlog differs from the text quoted above: the glossary-rail item stays closed and a new open item follows it, `**OWNER: which terms the Takeaways "Terms in this lesson" list shows.**` (the list shows only terms the prose underlines; about 35 percent of lesson prose, 99,116 of 283,204 characters, sits inside components the chip plugin does not walk; three options); the new items sit under `### Found during the lesson layout build (2026-09-23 and 2026-09-24)` with bold labels and trigger tags (ensemble art B1, Neon wrapper B3, recap lists B2, and a fourth `(B2) OWNER:` item about the focus ring around the whole step when a lesson is reopened mid-way), each split into one idea per sentence, with full paths and a dated source. `docs/post-launch-backlog.md` is the reference; re-running this step must not overwrite it with the text above.

- [ ] **Step 3: Visual regression doc and the new lesson baselines**

Create `e2e/visual/lesson.spec.ts`:

```ts
import path from "node:path";
import { test, expect } from "@playwright/test";

/*
  Lesson route baselines (spec 2026-09-23). Four images: the Briefing and the
  Concept step of lesson 1 at 1,440 and 390. Dark scheme, scene resolved,
  reduced motion, consent declined.
*/

const LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";
const shouldRun = process.env.RUN_VISUAL === "1";
// Hides the Next.js dev-overlay badge at capture time; see screenshot.css.
const SCREENSHOT_STYLE = path.join(__dirname, "screenshot.css");

for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["phone", { width: 390, height: 844 }],
] as const) {
  for (const [stepName, step] of [
    ["briefing", 0],
    ["concept", 1],
  ] as const) {
    test(`lesson ${stepName} ${name}`, async ({ page }) => {
      test.skip(!shouldRun, "Opt-in visual comparison");
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.addInitScript((s) => {
        localStorage.setItem("tc-cookie-consent", "declined");
        localStorage.setItem("tc-script-skip", "1");
        localStorage.setItem(
          "tc_step_deep-orbit_introduction-to-tensors",
          String(s),
        );
        localStorage.setItem(
          "tc_step_max_deep-orbit_introduction-to-tensors",
          String(s),
        );
        // The text briefing, so a future scene clip cannot change the image
        // (key from apps/web/lib/briefing-variant.ts).
        localStorage.setItem("tc-briefing-variant", "text");
      }, step);
      // domcontentloaded is enough: the step is restored in a client effect
      // after load, so the step's own marker below is what the test waits on.
      await page.goto(LESSON, { waitUntil: "domcontentloaded" });
      // data-script-state exists only on the Briefing root; the Concept
      // step's settled marker is its paired grid.
      if (step === 0) {
        await expect(page.locator("[data-script-state='done']")).toBeAttached();
        // The plate image is lazy and removes itself on error: wait for it.
        await expect
          .poll(() =>
            page
              .locator(
                '.lesson-story-plate > [data-testid="scene-portrait"] > img',
              )
              .evaluate(
                (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
              ),
          )
          .toBe(true);
      } else {
        await expect(
          page.locator('.lesson-step-content[data-layout="paired"]'),
        ).toBeVisible();
      }
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      // The step container's script focus ring is transient state, not layout.
      await page.evaluate(() =>
        (document.activeElement as HTMLElement | null)?.blur(),
      );
      await expect(page).toHaveScreenshot(`lesson-${stepName}-${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.001,
        stylePath: SCREENSHOT_STYLE,
      });
    });
  }
}
```

Mint the four new baselines and re-mint the warm-up card the way the existing 32 were made, against `next dev` on a clean build directory (a dev server over a production `.next` serves unstyled pages that mint green, the documented trap):

```bash
# Clean build directory: a dev server over a production .next (Task 11
# builds one) serves unstyled pages that mint green.
rm -rf apps/web/.next
# Delete the two warm-up images first, then mint ONLY the two specs this
# change affects. `pnpm test:visual:update` would re-mint all 36 and bake in
# any unrelated drift (the /pricing and /worlds/deep-orbit baselines were
# already stale on main on 2026-09-15); docs/visual-regression.md forbids
# regenerating to make an unexpected diff pass.
rm -f e2e/visual/review-warmup.spec.ts-snapshots/*-chromium-darwin.png
RUN_VISUAL=1 PW_PORT=3111 npx playwright test e2e/visual/lesson.spec.ts e2e/visual/review-warmup.spec.ts --project=chromium --update-snapshots=all > /tmp-scratch/visual-mint.log 2>&1
# Compare everything, without writing.
PW_PORT=3111 pnpm test:visual > /tmp-scratch/visual-compare.log 2>&1
```

(Write the logs to your scratch directory, not `/tmp-scratch`, and never pipe Playwright through `tail`: the pipeline reports exit 0 on failures.) Expected: the mint writes `e2e/visual/lesson.spec.ts-snapshots/lesson-{briefing,concept}-{desktop,phone}-chromium-darwin.png` and the two warm-up PNGs; in the compare run those 6 pass. If any of the other 30 fail, do not re-mint them: open the diff, check whether the same test fails on clean main (the known stale /pricing and world-page baselines will), and list them in the checkpoint note as pre-existing. Open every image you minted and confirm it shows the intended layout (docs/visual-regression.md, "After a re-mint, look at the images"). If `find e2e/visual -name '*-chromium-linux.png'` finds a Linux set, the Linux images for these two specs come from the CI `mint` job, which is the owner's to run; note it in the checkpoint rather than triggering it. Read the warm-up card's new width off the minted image before writing the record below.

Before accepting the two Briefing images, look at the space between the "Cut to" divider and the teaser paragraph under it. It is 16 px now (the last beat's `--l-beat` margin; main had 28 px), and the spec does not set it. If it reads cramped, give the teaser its own top margin in the story rules, re-mint, and say so in the baseline record; either way, note the value you accepted.

In `packages/content/__tests__/glossary-rail-contract.test.ts`, rename the `describe` string from the rail to `"lesson terms list contract"` and update its header comment to say the Takeaways step's terms list; the assertions and the filename stay. Three more comments still describe the rail: `packages/content/src/glossary-match.ts` line 72 ("not reach the rail beside the lesson") and `packages/content/src/glossary-match.test.ts` lines 40 and 55 ("a second rail entry", "the rail must not list it"); reword each to the Takeaways terms list.

In `docs/visual-regression.md`: change "Three spec files" to "Five spec files"; add rows for `review-warmup.spec.ts` (the warm-up card element, dark and light, 2 tests) and `lesson.spec.ts` (lesson 1 Briefing and Concept at 1440 and 390, 4 tests); update the totals (36 tests) and the baseline-set table; change the "Running the suite locally" section's example so a targeted re-mint is the documented way to mint one spec (`RUN_VISUAL=1 PW_PORT=3111 npx playwright test <spec> --project=chromium --update-snapshots=all`), with one sentence that `pnpm test:visual:update` re-mints every baseline and is for deliberate whole-suite changes only; replace the paragraph "Auth-required pages ... are not covered" with a sentence that lesson routes are covered for the free module and authenticated pages are still not. Add a "Baseline record" section:

```markdown
## Baseline record

Every mint or re-mint names its reason and the expected change, per the
owner's 2026-09-15 rule.

| Date | Snapshot | Reason | Expected change |
| --- | --- | --- | --- |
| 2026-09-23 | `review-warmup-{dark,light}.png` | The warm-up card now spans the lesson content width instead of the old 68-character column (lesson layout spec, section 2 item 6). Element screenshot in the prompt state, so the Continue gap change is not visible here | Width from the old text column to the frame's content width at the visual project's 1,280 px viewport (record the two measured values from the old and new images); height changes only by reflow of the question text |
| 2026-09-23 | `lesson-briefing-{desktop,phone}.png`, `lesson-concept-{desktop,phone}.png` | New coverage for the lesson route after the layout change | New baselines, no prior image |
```

- [ ] **Step 4: Checkpoint**

Owner commits. Suggested message: `docs: bible and backlog for the lesson layout; lesson visual baselines`.

---

### Task 13: Full gates and dead code

- [ ] **Step 1: Confirm nothing references removed code**

Run: `grep -rn "SceneCard\|MissionProgress\|GlossaryRail\|glossary-context\|extractSpeakers\|castSpeakers\|CONCEPT_RIGHT" apps packages e2e --include='*.ts' --include='*.tsx' | grep -v '\.next/'`
Expected: no output. Then run `grep -rniw 'rail' apps packages e2e scripts --include='*.ts' --include='*.tsx' --include='*.mjs' --include='*.css' | grep -v node_modules | grep -v '\.next/'` and expect no hit that describes the removed lesson rail (Task 12 rewords three of them; this step rewords the rest: the `it` names and the failure message in `packages/content/__tests__/glossary-rail-contract.test.ts` ("every rail entry", "off their rails", "has an empty rail"; the `rail()` and `RailTerm` identifiers may be renamed to `termsList()` and `ListedTerm` in the same pass), the comments at `packages/content/src/glossary.ts:10` ("feed a concept rail") and `packages/content/src/index.ts:33` ("feed a rail"). Also update `.github/workflows/visual-regression.yml` line 11, whose comment still says "All 30 committed baselines" (36 now; comment only, nothing in the workflow counts from it). Task 8 step 5 already reworded the two prose comments that used to match (`packages/content/src/schemas.ts` and `expressions.test.ts`); a code reference is a straggler to delete, a comment is a straggler to reword.

- [ ] **Step 2: Run every gate**

Run `pnpm format` first: prettier reflows the long JSX lines pasted from this plan (docs, MDX and `.velite` are prettier-ignored, so only the ts, tsx and css edits change). Then:

```bash
pnpm --filter @tensorcraft/content build:content
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:exercises
```

Expected: all green. Then the e2e set from Task 11 step 2 once more on a fresh build.

- [ ] **Step 3: Check the em dash and accent-bar bans over the diff**

Run (against the plan's starting commit, since checkpoints are committed as you go; both forms work with stock macOS BSD grep and perl):

```bash
# Changed tracked files plus new untracked ones (git diff alone skips the
# untracked plugin, terms list, contract test and specs).
{ git diff b83a241d --diff-filter=d --name-only; git ls-files --others --exclude-standard; } | sort -u > "$SCRATCH/touched.txt"
grep -v '\.png$' "$SCRATCH/touched.txt" | xargs grep -l $'\xe2\x80\x94'
git diff b83a241d | perl -ne 'print "$.: $_" if /^\+.*(border-l-(?!0|transparent|border)|border-left)/'
git ls-files --others --exclude-standard | grep -v '\.png$' | grep -v '^docs/superpowers/' | xargs perl -ne 'print "$ARGV:$.: $_" if /(border-l-(?!0|transparent|border)|border-left)/'
```

Expected: no output from any of the three searches (the third skips `docs/superpowers/`, because this plan quotes the searches themselves). `--diff-filter=d` keeps the deleted `glossary-context.tsx` out of the list; the renamed terms list appears under its new path, which exists. The em-dash-ban and slop-lexicon tests in `pnpm test` remain the real gate.

- [ ] **Step 4: Measure the open drawer case the spec left to the plan**

Open `foundations/tensor-operations` (free, and it carries a derivation drawer after a paragraph) on the Concept step at 1,440 and open the drawer (click its summary; the route preference that opens drawers by default may need a signed-in account, which the e2e suite does not have). Measure the paragraph's height, the open drawer's height and the empty text-column space beside the drawer; do the same for lesson 1's first paired row, where the Task 12 review saw about 200 px of empty text column beside the bridge callout. Take full-page screenshots into your scratch directory. If a tall companion beside a short paragraph reads worse than it would spanning, record the observation in `docs/post-launch-backlog.md` as an item under the "Found during the lesson layout build" subheading, with the measurements, the trigger tag the backlog's rules imply, and the screenshot paths; do not change the plugin in this plan (a height threshold is the owner's design call).

- [ ] **Step 5: Final checkpoint**

Owner commits. Update the spec's status line to read "implemented" (both the worktree copy and, by the controller, the main checkout's copy).
