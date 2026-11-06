# Reading Experience Redesign (lesson layout + term/code styling + glossary)

**Date:** 2026-06-15
**Status:** Approved design, pending implementation plan
**Scope:** Lesson reading surface. Stream A of a larger lesson-overhaul effort (other streams: end-of-lesson summary/knowledge-check, bridge "breaks" reframe, character personas; each gets its own spec).

> **2026-08-15:** the extras dir was removed with /extras (owner decision).
> The live lesson surface is deep-orbit (56) only; "deep-orbit + extras
> (~77)" figures below are historical.

**Build-surface note:** the Velite build only compiles launched theme dirs (`deep-orbit` + `extras`, ~77 lesson MDX files) per `LAUNCHED_THEME_DIRS` in [velite.config.ts](packages/content/velite.config.ts). The other 4 themes' lesson MDX (bringing the on-disk total to ~297) is excluded until those themes launch. So: the layout shell and inline-code CSS are app-global and apply to whatever renders, but the only **live, testable** lesson surface today is deep-orbit + extras. Glossary auto-linking and content therefore target deep-orbit now; rolling glossary content to the other themes is gated on those themes launching (tracked in dev-plan, not a blocker here).

## Problem

The lesson reader has three weaknesses:

1. **Wasted space / single narrow column.** Lessons render in one centered `max-w-[900px]` column ([lesson-steps.tsx:333](apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx)). On wide screens ~half the viewport is empty margin, and code, scene, and prose all compete in one stream. There is no grid, just a fixed-width container.
2. **Inline code is invisible.** Inline `` `code` `` in prose renders as plain monospace, same color as body text, no background. Technical tokens do not stand out.
3. **No concept-term affordance.** Non-code technical terms (rank, gradient, epoch) get no treatment and there is no glossary anywhere in the product (confirmed: no glossary file/route exists; lesson `keywords` are bare tags with no definitions).

## Goals

- Use horizontal space deliberately while keeping prose at a comfortable reading measure.
- Make code tokens and concept terms each visually distinct in prose, and distinct from *each other*.
- Give concept terms real, reusable definitions surfaced in a per-step rail and a hover/click affordance.
- Preserve the dark brutalist aesthetic (sharp corners, borders, Inter + JetBrains Mono) and WCAG 2.1 AA.

## Non-goals

- Multi-framework lesson code (react/svelte/vanilla). Bridge variants exist in a library but are not wired into lessons; making lessons multi-language is a separate, large project. Out of scope here.
- The end-of-lesson summary and the knowledge-check redesign (separate stream); this spec only relocates the existing Quiz/KeyTakeaways into the new shell without changing their content.
- Character avatars; the Briefing scene card is designed to *host* them later but ships with text chips now.

## Layout architecture

### Shell

Introduce a two-column lesson shell at the `lg` breakpoint (>=1024px):

- **Left (read column):** prose at a comfortable measure, target `~68ch` (approx 640-680px). Never narrower than today's effective reading width.
- **Right (~340-380px):** a per-step region that is either a **rail** (informational) or a **work pane** (interactive), see table.
- Below `lg`: the right region moves **below** the prose when it is a rail; when it is the Code/Challenge work pane it becomes a **toggle/tab** above the prose so the editor stays reachable without infinite scroll.

Extract from the oversized `lesson-steps.tsx`:

- `LessonShell` - owns the grid, top chrome (mission-map link, segmented progress, step label), footer nav (Continue/back), and the left/right slots. Pure layout.
- `RightRail` - renders the informational right region per step.
- `WorkPane` - renders the interactive right region (code/demo/exercise) for Code + Challenge.

`lesson-steps.tsx` keeps the step state machine (current step, gating, persistence) and composes `LessonShell` with the correct left/right content per step. This is a refactor behind the existing step tests, not a rewrite of the state machine.

### Per-step right region

| Step | Left (read) | Right region | Type |
|---|---|---|---|
| Briefing | Screenplay scene + dialogue | Scene card: `lesson.scene` location/time + cast chips (speakers parsed from this lesson's Dialogue) | rail |
| Concept | Explanation + bridge | Glossary (this lesson's terms) + the existing `LearningObjectives` (relocated here, not inline) | rail |
| Code | Walkthrough prose | Sticky highlighted code / `InteractiveDemo` | work pane |
| Challenge | Task brief + hints | `Exercise` editor (Sandpack) | work pane |
| Takeaways | Summary recap (owned by other stream) | Glossary recap + mission progress | rail |
| Consequence | Epilogue scene | Rail collapses; full-width close + next-lesson card | none |

`LearningObjectives` is already in `CONCEPT_COMPONENTS`; relocating means routing it into the rail slot on the Concept step rather than the prose flow. No data change.

Cast chips: parse distinct `speaker` values from the lesson's Briefing `<Dialogue>` elements (or fall back to `lesson.context.speaker`). No new frontmatter.

## Inline code styling (CSS-only)

Add a scoped rule for inline code in lesson prose (inline `<code>` not inside `<pre>`):

- background `var(--tc-surface)`, `1px solid var(--tc-border)`, color `var(--tc-primary)`, `font-family: var(--font-mono)`, `padding: 1px 6px`, `border-radius: 0`, slightly smaller size.
- Token-driven, so every theme recolors automatically.
- Applies to every rendered lesson (today: deep-orbit + extras) with zero content edits. Must not affect code *blocks* (`pre code`) or the Shiki-highlighted block renderer.

Implementation: a class on the prose container (e.g. `lesson-prose`) with `:not(pre) > code` selector in globals.css, or a Tailwind `[&_:not(pre)>code]` utility on the prose wrapper. Verify the selector does not hit `CodeBlock` output (which renders its own `<pre>`).

## Glossary system (new)

### Dictionary

New module `packages/content/src/glossary.ts` (or a Velite collection if dynamic editing is wanted later; start with a typed TS module):

```ts
export interface GlossaryEntry {
  term: string;          // canonical display form, e.g. "rank"
  definition: string;    // one or two plain sentences, no em dashes
  aliases?: string[];    // surface forms to match, e.g. ["ranks"]
  scope?: "global" | ThemeSlug; // global ML term vs theme-specific
}
export const GLOSSARY: GlossaryEntry[];
```

- Seed the candidate term list from the union of all lesson `keywords` across themes; write a real definition for each kept term. Target ~100-150 entries.
- Definitions are written once and reused course-wide (a key reason this beats per-lesson markup).
- **Phased content:** ship global + deep-orbit terms first; other themes' theme-specific terms follow per theme.

### Auto-linking in prose (build time)

A rehype plugin added to Velite's MDX pipeline (Velite `s.mdx()` currently uses defaults; add `mdx: { rehypePlugins: [...] }` in [velite.config.ts](packages/content/velite.config.ts)):

- Walks prose text nodes only. **Skips** headings, `code`/`pre`, `a`, and any existing component children.
- Wraps the **first occurrence per lesson step** of any dictionary term/alias in a `<GlossaryTerm term="...">` node. (Step is known from the section the node falls under; if step attribution at build time is impractical, fall back to first-occurrence-per-lesson and document the choice in the plan.)
- Whole-word, case-insensitive matching; prefer the **longest** matching alias; never match inside another match.

A shared matcher util (`matchGlossaryTerms(text, dict)`) is used by both the rehype plugin and a Velite `transform` that adds `glossaryTerms: GlossaryEntry[]` to each lesson record (scan raw body against dictionary) so the rail knows exactly which entries to show without re-parsing at runtime.

### Components

- `GlossaryTerm` (new, in `packages/ui/src/mdx/`): renders children in body color with a **bronze (accent) dotted underline**, `cursor: help`. Desktop: hover tooltip with the definition; click scrolls the rail to the entry and flashes it. Mobile: tap opens a small popover. Registered in the lesson MDX component map ([lesson-content.tsx:93](apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.tsx)).
- `GlossaryRail` (new): lists `lesson.glossaryTerms` as `{term (mono, primary), definition (muted)}`; active term gets a left primary border + tint. Used in the Concept rail and the Takeaways recap.

### Two distinct treatments

- **Code token:** green bordered chip (CSS above).
- **Concept term:** bronze dotted underline + glossary link.

They must never render the same way; this distinction is a hard requirement.

## Components summary

**New:** `LessonShell`, `RightRail`, `WorkPane`, `GlossaryTerm`, `GlossaryRail`, `glossary.ts` dictionary, `matchGlossaryTerms` util, rehype glossary plugin.

**Modified:** `lesson-steps.tsx` (compose shell, route per-step slots), `lesson-content.tsx` (register `GlossaryTerm`), `velite.config.ts` (rehype plugin + `glossaryTerms` transform), lesson prose CSS (globals.css), MDX index re-exports.

## Phasing (informs the plan, not separate specs)

1. Inline code chip CSS + test (instant, all themes).
2. `LessonShell` 2-col grid + per-step rail content (deep-orbit verified).
3. Code/Challenge work pane (split) + mobile toggle.
4. Glossary dictionary (global + deep-orbit) + matcher + rehype plugin + `GlossaryTerm` + `GlossaryRail`.
5. Roll glossary content to the other 4 themes (gated on those themes launching; their MDX is not in the build today).

## Testing

- **vitest:** `GlossaryTerm` (renders underline, tooltip, click callback), `GlossaryRail` (lists terms, active state), `matchGlossaryTerms` (whole-word, longest-alias, skips code, first-occurrence), `LessonShell` (grid slots, mobile stack), code-chip CSS presence via a render assertion.
- **rehype plugin** unit test: given MDX with terms in prose + code + headings, only prose first-occurrences are wrapped.
- **Update** existing `lesson-steps.test.tsx` / `lesson-content.test.tsx` for the new shell structure; keep the step state-machine assertions green.
- **e2e (themes/lesson specs):** Concept step shows rail glossary; clicking a concept term highlights its rail entry; Code step shows the split work pane; mobile viewport stacks the rail / shows the code toggle. No live form submits.
- All suites green before done (repo rule: docs + tests updated before reporting done).

## Documentation

- Update `docs/story-style-bible.md` (or a new authoring note) with the term/code conventions and how to add a glossary entry.
- Note the deferred multi-framework lessons + remaining-themes glossary content in [the product roadmap](../../../ROADMAP.md).

## Risks / open questions

- `lesson-steps.tsx` is large and central; refactor incrementally behind step tests.
- Build-time step attribution for "first occurrence per step" may be hard; documented fallback is first-occurrence-per-lesson.
- Glossary matching false positives (substrings, plurals): mitigated by whole-word + alias control; the dictionary is curated, not generated.
- Glossary definitions are real writing effort; phased by theme, tracked in dev-plan.
- Contrast: bronze dotted underline on `#181818` and the code chip colors must pass AA; verify per theme palette.
- `GlossaryTerm` (rendered inside the prose slot) and `GlossaryRail` (right slot) live in different shell slots, so the click-to-highlight needs an explicit coordination channel (React context with an `activeTerm` + setter, or a custom event). The plan must pick one; do not rely on cross-slot DOM lookups.
- No change to JSON-LD, routes, pricing, or the step gating/scoring logic.
