# Reading Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the lesson reader as a two-column shell (comfortable prose + per-step rail/work-pane), make inline code visually distinct, and add a curated glossary that auto-underlines concept terms linked to a rail definition.

**Architecture:** A CSS-only chip for inline code; a typed glossary dictionary + a shared whole-word matcher driving both a build-time rehype plugin (underlines terms in compiled MDX) and a Velite transform (emits each lesson's term list); React `GlossaryTerm`/`GlossaryRail` coordinated by a `GlossaryContext`; and a `LessonShell` that gives `lesson-steps.tsx` a 2-column grid with per-step left (prose) / right (rail or work pane) slots. Refactor happens behind the existing step-state tests.

**Tech Stack:** Next.js App Router (server + client components), TypeScript, Velite (MDX build, rehype), unified/hast (rehype plugin), vitest + @testing-library/react, Playwright. Spec: `docs/superpowers/specs/2026-06-15-reading-experience-design.md`.

> **COMMIT POLICY (overrides the usual commit steps):** This repo's CLAUDE.md forbids committing on the user's behalf. Do NOT run `git add`/`git commit`/`git push`. Each task ends with "leave changes uncommitted; report files touched." The user commits.
>
> **COPY RULE:** No em dashes in any user-facing copy or glossary definitions (`docs/story-style-bible.md` rule 6).
>
> **BUILD SURFACE:** Only `deep-orbit` + `extras` lessons are in the Velite build (`LAUNCHED_THEME_DIRS` in `packages/content/velite.config.ts`). All runtime/e2e verification uses deep-orbit lessons. CSS + shell are app-global; glossary content targets deep-orbit now.
>
> **TEST COMMANDS:** unit `npx vitest run <path>` from repo root; full unit `npx vitest run`; typecheck `npm run typecheck` (turbo; note `apps/web` is typechecked at `next build`, so also run `npx tsc --noEmit` inside `apps/web` for web files and ignore the known pre-existing errors in `app/onboarding/page.test.tsx`, `app/pricing/__tests__/pricing-tiers.test.tsx`, `app/settings/settings-form.test.tsx`); e2e `npx playwright test <spec>`.

---

### Task 1: Inline code chip (CSS only, all rendered lessons)

**Files:**
- Modify: `apps/web/app/globals.css` (the `.lesson-prose` block, near lines 108-170)
- Test: `apps/web/app/themes/[slug]/[module]/[lesson]/__tests__/inline-code-style.test.tsx` (new)

Inline code in lesson prose must render as a bordered chip; code *blocks* (`pre code`, Shiki output) must be untouched.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

// Minimal harness: a .lesson-prose container with inline code and a pre>code block.
function Prose() {
  return (
    <div className="lesson-prose">
      <p>
        Use <code data-testid="inline">tf.tensor2d()</code> here.
      </p>
      <pre>
        <code data-testid="block">const x = 1;</code>
      </pre>
    </div>
  );
}

describe("inline code chip", () => {
  it("marks inline code distinctly from block code in lesson prose", () => {
    const { getByTestId } = render(<Prose />);
    // The inline code is a direct child of a non-pre element; the block code is inside <pre>.
    const inline = getByTestId("inline");
    const block = getByTestId("block");
    expect(inline.closest("pre")).toBeNull();
    expect(block.closest("pre")).not.toBeNull();
  });
});
```

Note: jsdom does not apply real CSS, so this test locks the structural contract the selector relies on (inline code is NOT inside `<pre>`; block code IS). The visual rule itself is verified in Step 5 (browser).

- [ ] **Step 2: Run test to verify it fails / passes structurally**

Run: `npx vitest run "apps/web/app/themes/[slug]/[module]/[lesson]/__tests__/inline-code-style.test.tsx"`
Expected: PASS structurally (this is a guard test; it documents the selector contract). If it errors on setup, fix imports to match sibling tests.

- [ ] **Step 3: Add the CSS rule**

In `apps/web/app/globals.css`, inside the `.lesson-prose` group, add:

```css
/* Inline code in prose renders as a bordered chip, distinct from body text
   and from Shiki code blocks (which live inside <pre>). Token-driven so each
   theme recolors automatically. */
.lesson-prose :not(pre) > code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: var(--tc-surface);
  border: 1px solid var(--tc-border);
  color: var(--tc-primary);
  padding: 1px 6px;
  border-radius: 0;
  white-space: nowrap;
}
```

Confirm there is no existing `.lesson-prose code` rule that conflicts (there is not, per audit). Confirm `CodeBlock` output renders inside `<pre>` (it does, via `dangerouslySetInnerHTML`) so it is excluded.

- [ ] **Step 4: Re-run the guard test**

Run: same command. Expected: PASS.

- [ ] **Step 5: Visual check**

Start the dev server, open a deep-orbit lesson Concept/Code step, confirm inline code shows as a green bordered chip and code blocks are unchanged. Check one other theme if convenient (token recolor).

- [ ] **Step 6: Leave changes uncommitted; report files touched.**

---

### Task 2: Glossary dictionary

**Files:**
- Create: `packages/content/src/glossary.ts`
- Create: `packages/content/src/glossary.test.ts`
- Modify: `packages/content/src/index.ts` (re-export)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { GLOSSARY, type GlossaryEntry } from "./glossary";

describe("GLOSSARY", () => {
  it("has entries with unique canonical terms", () => {
    const terms = GLOSSARY.map((e) => e.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
  });

  it("every entry has a non-empty definition and no em dashes", () => {
    for (const e of GLOSSARY) {
      expect(e.term.length).toBeGreaterThan(0);
      expect(e.definition.length).toBeGreaterThan(0);
      expect(e.definition).not.toContain(" - ");
    }
  });

  it("defines core foundational terms", () => {
    const terms = new Set(GLOSSARY.map((e) => e.term.toLowerCase()));
    for (const t of ["tensor", "rank", "shape"]) {
      expect(terms.has(t)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to verify FAIL** (`npx vitest run packages/content/src/glossary.test.ts`): module not found.

- [ ] **Step 3: Implement the dictionary**

```ts
export interface GlossaryEntry {
  /** Canonical display form, e.g. "rank". */
  term: string;
  /** One or two plain sentences. No em dashes. */
  definition: string;
  /** Extra surface forms to match in prose, e.g. ["ranks"]. */
  aliases?: string[];
  /** "global" ML term, or a theme slug for theme-specific terms. */
  scope?: "global" | string;
}

// Seeded from the union of deep-orbit lesson `keywords`, with written
// definitions. Grow incrementally; this is the deep-orbit + global set.
export const GLOSSARY: GlossaryEntry[] = [
  { term: "tensor", definition: "A multi-dimensional array of numbers with optional GPU acceleration; the core data structure in TensorFlow.js.", aliases: ["tensors"], scope: "global" },
  { term: "rank", definition: "The number of dimensions (axes) a tensor has. A scalar is rank 0, a vector rank 1, a matrix rank 2.", scope: "global" },
  { term: "shape", definition: "The size of a tensor along each axis, written as a list like [2, 3].", aliases: ["shapes"], scope: "global" },
  // ...continue to ~40-60 deep-orbit/global terms. Source candidate list:
  //   grep -rh "^  - " packages/content/content/deep-orbit/**/*.mdx under `keywords:`,
  //   dedupe, keep the ones that are real concepts, write a definition each.
];
```

Implementer note: this task SHIPS the deep-orbit + global set (aim 40-60 entries actually used by deep-orbit lessons). Build the candidate list from deep-orbit lesson `keywords` frontmatter, keep genuine concepts, write each definition. Do not invent terms not used in lessons. If the set grows large, that is fine; the test only checks invariants.

- [ ] **Step 4: Re-export** from `packages/content/src/index.ts`: `export { GLOSSARY } from "./glossary"; export type { GlossaryEntry } from "./glossary";` (match the file's existing export style).

- [ ] **Step 5: Run to verify PASS** + `npm run typecheck`.

- [ ] **Step 6: Leave uncommitted; report files.**

---

### Task 3: Glossary matcher util

**Files:**
- Create: `packages/content/src/glossary-match.ts`
- Create: `packages/content/src/glossary-match.test.ts`
- Modify: `packages/content/src/index.ts` (re-export `matchGlossaryTerms`, `findGlossaryTermsInText`)

Shared logic used by the rehype plugin (Task 4) and the Velite transform (Task 4). Pure, no hast/unified deps, so it is trivially testable.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { matchGlossaryTerms, findGlossaryTermsInText } from "./glossary-match";
import type { GlossaryEntry } from "./glossary";

const DICT: GlossaryEntry[] = [
  { term: "tensor", definition: "d", aliases: ["tensors"] },
  { term: "rank", definition: "d" },
  { term: "gradient descent", definition: "d" },
];

describe("matchGlossaryTerms", () => {
  it("matches whole words case-insensitively, returns positions", () => {
    const m = matchGlossaryTerms("A Tensor has a rank.", DICT);
    expect(m.map((x) => x.term)).toEqual(["tensor", "rank"]);
    expect(m[0].start).toBe(2);
    expect(m[0].end).toBe(8);
  });

  it("does not match substrings inside larger words", () => {
    expect(matchGlossaryTerms("rankings and extensor", DICT)).toEqual([]);
  });

  it("matches aliases and prefers the longest match", () => {
    const m = matchGlossaryTerms("Use gradient descent here", DICT);
    expect(m.map((x) => x.term)).toEqual(["gradient descent"]);
  });

  it("findGlossaryTermsInText returns unique canonical entries present", () => {
    const found = findGlossaryTermsInText("tensors and tensor and rank", DICT);
    expect(found.map((e) => e.term).sort()).toEqual(["rank", "tensor"]);
  });
});
```

- [ ] **Step 2: Run to verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { GlossaryEntry } from "./glossary";

export interface GlossaryMatch {
  term: string;       // canonical term
  start: number;      // index in text
  end: number;        // exclusive
  entry: GlossaryEntry;
}

interface Surface { surface: string; entry: GlossaryEntry; }

function surfaces(dict: GlossaryEntry[]): Surface[] {
  const out: Surface[] = [];
  for (const entry of dict) {
    out.push({ surface: entry.term, entry });
    for (const a of entry.aliases ?? []) out.push({ surface: a, entry });
  }
  // Longest surface first so "gradient descent" wins over "gradient".
  return out.sort((a, b) => b.surface.length - a.surface.length);
}

const WORD = /[A-Za-z0-9]/;
function isBoundary(text: string, i: number): boolean {
  return i < 0 || i >= text.length || !WORD.test(text[i]!);
}

/** All non-overlapping whole-word matches, left to right. */
export function matchGlossaryTerms(
  text: string,
  dict: GlossaryEntry[],
): GlossaryMatch[] {
  const surf = surfaces(dict);
  const lower = text.toLowerCase();
  const matches: GlossaryMatch[] = [];
  const taken: boolean[] = new Array(text.length).fill(false);
  for (const { surface, entry } of surf) {
    const needle = surface.toLowerCase();
    let from = 0;
    while (true) {
      const idx = lower.indexOf(needle, from);
      if (idx === -1) break;
      const end = idx + needle.length;
      const boundaryOk = isBoundary(text, idx - 1) && isBoundary(text, end);
      let overlaps = false;
      for (let i = idx; i < end; i++) if (taken[i]) { overlaps = true; break; }
      if (boundaryOk && !overlaps) {
        for (let i = idx; i < end; i++) taken[i] = true;
        matches.push({ term: entry.term, start: idx, end, entry });
      }
      from = idx + 1;
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}

/** Unique canonical entries that appear at least once in text. */
export function findGlossaryTermsInText(
  text: string,
  dict: GlossaryEntry[],
): GlossaryEntry[] {
  const seen = new Map<string, GlossaryEntry>();
  for (const m of matchGlossaryTerms(text, dict)) {
    if (!seen.has(m.term)) seen.set(m.term, m.entry);
  }
  return [...seen.values()];
}
```

- [ ] **Step 4: Run to verify PASS** + typecheck.

- [ ] **Step 5: Leave uncommitted; report files.**

---

### Task 4: Build integration (rehype underline plugin + `glossaryTerms` transform)

**Files:**
- Create: `packages/content/src/rehype-glossary.ts`
- Create: `packages/content/src/rehype-glossary.test.ts`
- Modify: `packages/content/velite.config.ts` (add top-level `mdx.rehypePlugins`; add `glossaryTerms` to the lessons schema via object transform)

**Decision (locked):** glossary auto-underlines the **first occurrence per lesson** (not per step). Build-time step attribution is impractical: the rehype plugin walks a flat hast tree with no step markers. The rail still shows all of a lesson's terms. Document this in the plugin comment.

- [ ] **Step 0: Add dependencies to `packages/content` (pnpm strict isolation; REQUIRED first)**

`packages/content/node_modules` only symlinks velite + zod; nothing is hoisted to root. The plugin imports `unist-util-visit` and `import type {...} from "hast"`; the plugin test imports `unified`, `rehype-parse`, `rehype-stringify`. Add them:

```bash
pnpm --filter @tensorcraft/content add unist-util-visit @types/hast
pnpm --filter @tensorcraft/content add -D unified rehype-parse rehype-stringify
```

(`unist-util-visit`, `@types/hast`, `unified` are in the pnpm store via velite; `rehype-parse`/`rehype-stringify` are a fresh install.) Verify imports resolve before writing code. Confirm the filter name matches the package's `name` in `packages/content/package.json` (adjust the `--filter` value if it differs from `@tensorcraft/content`).

- [ ] **Step 1: Write the failing test for the plugin**

```ts
import { describe, it, expect } from "vitest";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { rehypeGlossary } from "./rehype-glossary";

const DICT = [
  { term: "tensor", definition: "d" },
  { term: "rank", definition: "d" },
];

async function run(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeGlossary, { dictionary: DICT })
    .use(rehypeStringify)
    .process(html);
  return String(file);
}

describe("rehypeGlossary", () => {
  it("wraps the first prose occurrence of a term in a GlossaryTerm element", async () => {
    const out = await run("<p>A tensor and another tensor.</p>");
    // first occurrence wrapped, second left as plain text
    expect(out.match(/data-glossary-term="tensor"/g)?.length).toBe(1);
  });

  it("does not touch code, pre, headings, or links (including nested)", async () => {
    const out = await run(
      "<h2>tensor</h2><p><code>tensor</code> and <a><em>tensor</em></a></p><pre><code>tensor</code></pre>",
    );
    expect(out).not.toContain("data-glossary-term");
  });
});
```

(If `rehype-parse`/`rehype-stringify` are not already dev deps in `packages/content`, add them as devDependencies; `unified` is transitively present via velite but add it explicitly if the import fails.)

- [ ] **Step 2: Run to verify FAIL.**

- [ ] **Step 3: Implement the plugin**

Output a hast element that compiles to the `GlossaryTerm` MDX component. Velite's MDX compiler maps lowercase tag names to HTML; to emit a component, produce an element whose `tagName` is registered in the MDX component map. Simplest robust approach: emit a `<span data-glossary-term="...">text</span>` and have the React layer upgrade `span[data-glossary-term]` via the MDX `span` override (see Task 9). This avoids MDX component-name resolution issues from rehype.

Use a single recursive walk that carries a `skip` flag down through skipped ancestors, so a term nested anywhere inside `code`/`pre`/`a`/headings (e.g. `<a><em>tensor</em></a>`) is never wrapped. Do NOT rely on checking only the immediate parent.

```ts
import type { Root, Element, Text, RootContent } from "hast";
import { matchGlossaryTerms } from "./glossary-match";
import type { GlossaryEntry } from "./glossary";

interface Options { dictionary: GlossaryEntry[]; }
const SKIP_TAGS = new Set(["code", "pre", "a", "h1", "h2", "h3", "h4", "h5", "h6", "script", "style"]);

/**
 * Wraps the FIRST occurrence per document of each glossary term (found in prose
 * text nodes) in <span data-glossary-term="<canonical>">. First-occurrence-per-
 * lesson (not per step): step boundaries are a runtime concept not present in the
 * build-time hast tree. The React `span` override upgrades these to <GlossaryTerm>.
 */
export function rehypeGlossary(options: Options) {
  const dict = options.dictionary;
  return (tree: Root) => {
    const used = new Set<string>();

    const wrapText = (value: string): RootContent[] => {
      const matches = matchGlossaryTerms(value, dict).filter((m) => !used.has(m.term));
      if (matches.length === 0) return [{ type: "text", value }];
      const out: RootContent[] = [];
      let cursor = 0;
      for (const m of matches) {
        if (used.has(m.term)) continue;
        used.add(m.term);
        if (m.start > cursor) out.push({ type: "text", value: value.slice(cursor, m.start) });
        out.push({
          type: "element",
          tagName: "span",
          properties: { "data-glossary-term": m.term },
          children: [{ type: "text", value: value.slice(m.start, m.end) }],
        } as Element);
        cursor = m.end;
      }
      if (cursor < value.length) out.push({ type: "text", value: value.slice(cursor) });
      return out;
    };

    const walk = (node: Element | Root, skip: boolean) => {
      const next: RootContent[] = [];
      for (const child of node.children) {
        if (child.type === "text" && !skip) {
          next.push(...wrapText((child as Text).value));
        } else {
          if (child.type === "element") {
            walk(child, skip || SKIP_TAGS.has(child.tagName));
          }
          next.push(child);
        }
      }
      node.children = next;
    };

    walk(tree, false);
  };
}
```

The TEST in Step 1 (including the nested `<a><em>tensor</em></a>` case) is the contract; make it pass.

- [ ] **Step 4: Wire into Velite + add the transform**

In `velite.config.ts`:

```ts
import { rehypeGlossary } from "./src/rehype-glossary";
import { GLOSSARY } from "./src/glossary";
import { findGlossaryTermsInText } from "./src/glossary-match";
```

Add the global mdx option to `defineConfig`:

```ts
export default defineConfig({
  root: "content",
  strict: true,
  mdx: {
    rehypePlugins: [[rehypeGlossary, { dictionary: GLOSSARY }]],
  },
  output: { data: ".velite", clean: true },
  collections: { lessons, exercises, modules, posts },
});
```

Add a `glossaryTerms` field to the lessons schema by transforming the object with raw content access. Append `.transform()` to the lessons `s.object({...})`:

```ts
  // after the schema object literal in `lessons`:
}).transform((data, { meta }) => {
  const raw = typeof meta.content === "string" ? meta.content : "";
  // Strip fenced code blocks and inline code before scanning so code tokens
  // never become rail glossary entries.
  const prose = raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ");
  return { ...data, glossaryTerms: findGlossaryTermsInText(prose, GLOSSARY) };
}),
```

Verify the Velite transform signature in this version (`(data, ctx)` where `ctx.meta.content` holds raw file text). If the field must be declared, add `glossaryTerms: s.custom().optional()` to the schema before the transform, or follow Velite's pattern for computed fields. Confirm `.velite` output for a deep-orbit lesson now includes `glossaryTerms`.

- [ ] **Step 5: Run plugin test + rebuild content**

Run: `npx vitest run packages/content/src/rehype-glossary.test.ts` (PASS), then build content (the repo's content build, e.g. `npm run build` in `packages/content` or the root velite step) and inspect a generated lesson JSON in `.velite/` for `data-glossary-term` spans in `body` and a populated `glossaryTerms` array.

- [ ] **Step 6: Leave uncommitted; report files.**

---

### Task 5: `GlossaryContext` (cross-slot coordination)

**Files:**
- Create: `apps/web/app/themes/[slug]/[module]/[lesson]/glossary-context.tsx`
- Test: covered via Task 6/7 component tests (no standalone test needed; it is a trivial context)

- [ ] **Step 1: Implement**

```tsx
"use client";
import { createContext, useContext, useState, useCallback } from "react";

interface GlossaryCtx {
  activeTerm: string | null;
  setActiveTerm: (t: string | null) => void;
}
const Ctx = createContext<GlossaryCtx>({ activeTerm: null, setActiveTerm: () => {} });

export function GlossaryProvider({ children }: { children: React.ReactNode }) {
  const [activeTerm, setActive] = useState<string | null>(null);
  const setActiveTerm = useCallback((t: string | null) => setActive(t), []);
  return <Ctx.Provider value={{ activeTerm, setActiveTerm }}>{children}</Ctx.Provider>;
}

export const useGlossary = () => useContext(Ctx);
```

- [ ] **Step 2: Typecheck. Leave uncommitted; report files.**

---

### Task 6: `GlossaryTerm` component + `span` MDX upgrade

**Files:**
- Create: `packages/ui/src/mdx/glossary-term.tsx`
- Create: `packages/ui/src/mdx/glossary-term.test.tsx`
- Modify: `packages/ui/src/mdx/index.ts` (export)

`GlossaryTerm` is the visible underlined term. It reads `useGlossary` to set the active term on click and to reflect active state. Because the context lives in the app, the UI component takes the active-state + onActivate via props, and the app wires it (keeps `packages/ui` free of app imports).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlossaryTerm } from "./glossary-term";

describe("GlossaryTerm", () => {
  it("renders children with a glossary affordance and fires onActivate on click", () => {
    const onActivate = vi.fn();
    render(
      <GlossaryTerm term="rank" definition="number of axes" onActivate={onActivate}>
        rank
      </GlossaryTerm>,
    );
    const el = screen.getByText("rank");
    expect(el.getAttribute("data-glossary-term")).toBe("rank");
    fireEvent.click(el);
    expect(onActivate).toHaveBeenCalledWith("rank");
  });

  it("exposes the definition as an accessible title/tooltip", () => {
    render(
      <GlossaryTerm term="rank" definition="number of axes">rank</GlossaryTerm>,
    );
    expect(screen.getByText("rank").getAttribute("title")).toContain("number of axes");
  });
});
```

- [ ] **Step 2: Run to verify FAIL.**

- [ ] **Step 3: Implement**

```tsx
interface GlossaryTermProps {
  term: string;
  definition?: string;
  active?: boolean;
  onActivate?: (term: string) => void;
  children: React.ReactNode;
}

/** Concept term in prose: body color + accent dotted underline, linked to the
 *  rail glossary. Visually distinct from the inline-code chip (Task 1). */
export function GlossaryTerm({ term, definition, active, onActivate, children }: GlossaryTermProps) {
  return (
    <button
      type="button"
      data-glossary-term={term}
      title={definition}
      aria-label={definition ? `${term}: ${definition}` : term}
      onClick={() => onActivate?.(term)}
      className="inline cursor-help bg-transparent p-0 border-0 text-left"
      style={{
        color: "var(--tc-text)",
        borderBottom: "2px dotted var(--tc-accent)",
        background: active ? "color-mix(in srgb, var(--tc-accent) 16%, transparent)" : "transparent",
      }}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Export** from `packages/ui/src/mdx/index.ts`.

- [ ] **Step 5: Run to verify PASS** + typecheck. Leave uncommitted; report files.

---

### Task 7: `GlossaryRail`

**Files:**
- Create: `apps/web/app/themes/[slug]/[module]/[lesson]/glossary-rail.tsx`
- Test: `apps/web/app/themes/[slug]/[module]/[lesson]/__tests__/glossary-rail.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlossaryRail } from "../glossary-rail";

const TERMS = [
  { term: "tensor", definition: "multi-dim array" },
  { term: "rank", definition: "number of axes" },
];

describe("GlossaryRail", () => {
  it("lists each term and definition", () => {
    render(<GlossaryRail terms={TERMS} activeTerm={null} />);
    expect(screen.getByText("tensor")).toBeInTheDocument();
    expect(screen.getByText("multi-dim array")).toBeInTheDocument();
    expect(screen.getByText("rank")).toBeInTheDocument();
  });

  it("marks the active term", () => {
    render(<GlossaryRail terms={TERMS} activeTerm="rank" />);
    const entry = screen.getByTestId("glossary-entry-rank");
    expect(entry.getAttribute("data-active")).toBe("true");
  });

  it("renders nothing when there are no terms", () => {
    const { container } = render(<GlossaryRail terms={[]} activeTerm={null} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run FAIL.**

- [ ] **Step 3: Implement** a kicker "Glossary" + list of entries; each entry `data-testid={`glossary-entry-${term}`}`, `data-active`, left border primary when active, term in mono/primary, definition in muted. Returns `null` when `terms` is empty. Use palette tokens. (Follow the brutalist kicker style used elsewhere: `font-mono text-xs uppercase tracking-[0.2em]`.)

- [ ] **Step 4: Run PASS** + typecheck. Leave uncommitted; report files.

---

### Task 8: `LessonShell` (2-column grid + chrome)

**Files:**
- Create: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-shell.tsx`
- Test: `apps/web/app/themes/[slug]/[module]/[lesson]/__tests__/lesson-shell.test.tsx`

A presentational shell: takes `left`, `right`, `rightKind` ("rail" | "pane" | "none"), and chrome props (progress, step label, nav). Owns the responsive grid.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonShell } from "../lesson-shell";

describe("LessonShell", () => {
  it("renders left content always", () => {
    render(<LessonShell left={<p>prose</p>} right={null} rightKind="none" />);
    expect(screen.getByText("prose")).toBeInTheDocument();
  });

  it("renders the right slot when provided", () => {
    render(<LessonShell left={<p>prose</p>} right={<aside>rail</aside>} rightKind="rail" />);
    expect(screen.getByText("rail")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-right").getAttribute("data-kind")).toBe("rail");
  });

  it("omits the right region when kind is none", () => {
    render(<LessonShell left={<p>prose</p>} right={<aside>rail</aside>} rightKind="none" />);
    expect(screen.queryByTestId("lesson-right")).toBeNull();
  });
});
```

- [ ] **Step 2: Run FAIL.**

- [ ] **Step 3: Implement** a `div` grid: at `lg+` use `grid grid-cols-[minmax(0,1fr)_360px]` (rail) or `grid-cols-2` (pane), gap, with `data-testid="lesson-right" data-kind={rightKind}`; below `lg` single column, right region stacked (rail) or rendered above prose as a toggle target (pane) - for this task it is enough to stack; the pane toggle is wired in Task 9. Left wrapper keeps the comfortable measure (`max-w-[68ch]` on the prose container, full-width within its grid cell). When `rightKind === "none"`, render only the left, centered (preserve current single-column for Consequence).

- [ ] **Step 4: Run PASS** + typecheck. Leave uncommitted; report files.

---

### Task 9: Wire shell + glossary into `lesson-steps` / `lesson-content`

**Files:**
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx`
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.tsx` (register `span` upgrade + `GlossaryTerm`)
- Modify: existing tests `lesson-steps.test.tsx`, `lesson-content.test.tsx` as needed

This is the integration task. Keep the step state machine intact; move rendering into `LessonShell`.

- [ ] **Step 1: Register the `span` upgrade + GlossaryTerm in the MDX map**

In `lesson-content.tsx`, wrap the content tree in the app `GlossaryProvider`, and add to `mdxComponents` a `span` override that upgrades glossary spans:

```tsx
span: (props: React.HTMLAttributes<HTMLSpanElement> & { "data-glossary-term"?: string }) => {
  const term = props["data-glossary-term"];
  if (!term) return <span {...props} />;
  const entry = glossaryByTerm.get(term); // built from lesson.glossaryTerms
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
},
```

`glossaryByTerm` is a `Map` built from `lesson.glossaryTerms` (passed through props); `activeTerm`/`setActiveTerm` come from `useGlossary()`. Keep the `mdxComponents` object stable (memoize) so the hoisted-visibility behavior and script playback are not disturbed.

- [ ] **Step 2: Thread `glossaryTerms` through props**

`page.tsx` already passes `lesson` to `LessonSteps`; add `glossaryTerms` (from the Velite lesson record) into the lesson prop type and pass to `LessonContent`. Update the `LessonStepsProps.lesson` type to include `glossaryTerms?: { term: string; definition: string }[]`.

- [ ] **Step 3: Compose `LessonShell` per step**

Replace the single `max-w-[900px]` wrapper (around line 333) so each step renders through `LessonShell` with:
- Briefing: left = screenplay; right = scene card (location/time + cast chips parsed from Dialogue speakers); rightKind "rail".
- Concept: left = prose (Concept visible set minus LearningObjectives); right = `<><GlossaryRail terms={lesson.glossaryTerms} activeTerm={activeTerm}/> + LearningObjectives</>`; rightKind "rail".
- Code: left = walkthrough prose; right = code/demo work pane; rightKind "pane".
- Challenge: left = brief/hints; right = Exercise; rightKind "pane".
- Takeaways: left = KeyTakeaways/Quiz/RecallPrompt (unchanged content); right = GlossaryRail recap + progress; rightKind "rail".
- Consequence: left = epilogue; rightKind "none".

To route `LearningObjectives` and `Exercise`/`CodeBlock` into the right slot, render two `LessonContent` instances with complementary visibility Sets (one for the left, one for the right) OR split the existing Sets into left/right Sets. Define new hoisted Sets (e.g. `CONCEPT_LEFT`, `CONCEPT_RIGHT`, `CODE_LEFT`, `CODE_RIGHT`, `CHALLENGE_LEFT`, `CHALLENGE_RIGHT`) so identity stays stable. This keeps the proven step-gating model; you are only partitioning which components land left vs right.

Mobile: when `rightKind === "pane"`, render a toggle ("Show code"/"Show task") above the prose that reveals the pane; the existing single-column behavior is the fallback.

- [ ] **Step 4: Update existing tests**

Adjust `lesson-steps.test.tsx` / `lesson-content.test.tsx` for the new structure (shell wrapper, split Sets). Keep all step-state assertions (locked/unlocked, persistence keys `tc_step_*`, exercise gate, completion at final step) passing. Keep the playback test green (do not change Briefing beat behavior).

- [ ] **Step 5: Run** `npx vitest run "apps/web/app/themes/[slug]/[module]/[lesson]/"` - all PASS.

- [ ] **Step 6: Visual check** dev server: Concept shows glossary rail + objectives on the right, terms underlined in prose, clicking a term highlights its rail entry; Code/Challenge show the split pane; mobile stacks/toggles; Consequence is single-column. Check reduced-motion + one non-deep-orbit theme token recolor if available.

- [ ] **Step 7: Leave uncommitted; report files.**

---

### Task 10: e2e + docs + full verification

**Files:**
- Modify: `e2e/themes.spec.ts` (or the lesson e2e spec; add reading-experience assertions)
- Modify: `docs/story-style-bible.md` (authoring conventions), `docs/dev-plan.md` (deferred: multi-framework lessons, other-theme glossary content)
- Verify: full suites

- [ ] **Step 1: Add e2e assertions** on a deep-orbit lesson:
  - Concept step: a `[data-glossary-term]` element is visible in prose and the glossary rail (`glossary-entry-*`) lists terms.
  - Clicking a `[data-glossary-term]` sets its rail entry `data-active="true"`.
  - Code step: the split work pane renders (assert the code pane testid).
  - Inline code chip present in prose (assert an inline `code` exists outside `pre`).
  Verify exact rendered prefixes/selectors in the browser before finalizing.

- [ ] **Step 2: Run** `npx playwright test e2e/themes.spec.ts` - PASS.

- [ ] **Step 3: Docs.** In `docs/story-style-bible.md` add a short "Term and code styling" note: inline code = automatic chip (just use backticks); concept terms = add to `packages/content/src/glossary.ts` (define once, auto-underlines first occurrence). In `docs/dev-plan.md` record deferred: (a) multi-framework lesson code, (b) glossary content for the 4 coming-soon themes (gated on launch).

- [ ] **Step 4: Full verification** (report exact numbers): `npm run typecheck`; `npx tsc --noEmit` in `apps/web` (ignore the 3 known pre-existing failing test files); `npx vitest run` (full); content build succeeds; `npx playwright test e2e/themes.spec.ts`.

- [ ] **Step 5: Leave uncommitted; report all files changed across tasks for the user to review and commit.**

---

## File structure summary

| File | Responsibility |
|---|---|
| `apps/web/app/globals.css` | inline-code chip rule (Task 1) |
| `packages/content/src/glossary.ts` | term -> definition dictionary (Task 2) |
| `packages/content/src/glossary-match.ts` | pure whole-word matcher (Task 3) |
| `packages/content/src/rehype-glossary.ts` | build-time prose underliner (Task 4) |
| `packages/content/velite.config.ts` | wire plugin + `glossaryTerms` transform (Task 4) |
| `.../[lesson]/glossary-context.tsx` | active-term coordination (Task 5) |
| `packages/ui/src/mdx/glossary-term.tsx` | underlined concept term (Task 6) |
| `.../[lesson]/glossary-rail.tsx` | rail term list (Task 7) |
| `.../[lesson]/lesson-shell.tsx` | 2-col grid + chrome (Task 8) |
| `.../[lesson]/lesson-steps.tsx`, `lesson-content.tsx` | compose shell + glossary per step (Task 9) |
| `e2e/themes.spec.ts`, docs | verification + authoring notes (Task 10) |
