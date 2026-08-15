# Lesson Page Restructure: Screenplay Register + Focus Mode

**Date:** 2026-06-11
**Status:** Approved (design), pending implementation
**Scope:** Lesson viewer (`/themes/[slug]/[module]/[lesson]`), shared story components in `packages/ui`, global nav.

## Problem

The lesson Briefing step renders story content (scene descriptions, character
dialogue) and instructional content (concept prose) in nearly identical type.
The page reads as an undifferentiated wall. Secondary issues:

- The top-left exit button is the loudest element in the bar and its label
  ("Foundations: Tensors & Data", the module) misstates its destination (the
  theme map).
- The meta pills row gives `12 MIN`, `STRUCTURAL BRIDGE`, and `1 EXERCISE`
  equal weight. "Structural bridge" is internal content-QA vocabulary
  (bridge tiers: identity / structural / intuition) leaked into learner UI.
- The marketing nav (THEMES / PRICING / LEARN / BLOG / Start now) renders on
  lesson pages, competing with the lesson chrome and offering a "Start now"
  CTA to someone already learning.

## Design

### 1. Focus mode

`Nav` ([apps/web/app/components/nav.tsx](../../../apps/web/app/components/nav.tsx),
already a client component using `usePathname`) returns `null` on lesson
viewer routes: paths matching `/themes/{slug}/{module}/{lesson}` (exactly 4
segments; the capstone route is 3 segments so it keeps the nav - the
`capstone` check below is only defensive against a lesson slug literally
named "capstone"). All other routes keep the global nav. The lesson top bar
(drawer, exit chip, segmented step bar, counter) becomes the page's only
chrome. Hiding `Nav` intentionally removes `MobileNav` and the user menu on
lesson pages; account access from a lesson goes through the exit chip.

### 2. Exit chip

Same position (top-left), demoted: transparent background, border appears on
hover only, label `← Mission Map`. Destination unchanged
(`/themes/{slug}`), now honestly labeled - the module route is a redirect
shim to the theme page, whose module map is the module overview.

### 3. Meta line

The three pills in `StepBriefing` collapse into one muted mono line under the
title:

```
12 min · 1 exercise
```

- Exercise count omitted when zero; pluralized ("2 exercises").
- Bridge tier removed from learner UI. The `tier` field stays in the content
  schema and QA tooling; nothing learner-facing replaces it.

### 4. Screenplay register for story content

Story and instruction get distinct visual registers, typography only - no
boxes. Applies to all story surfaces (Briefing, Consequence/Epilogue, inline
Dialogue anywhere).

**Shared components (`packages/ui/src/mdx/`):**

- `SceneHeading`: prefix ("INT.", "EPILOGUE") rendered in theme primary
  (`--tc-primary`); location/time stay muted. Otherwise unchanged.
- `Dialogue`: speaker name moves from text color to theme primary
  (`--tc-primary`). Block (speaker + direction + line) indented `pl-6` to
  read as script. Root element gains `data-dialogue` attribute and renders a
  trailing `CUT TO:` divider element (see mechanism below). Body keeps the
  560px measure.

**Stage directions:** `lesson.context.narrative` in `StepBriefing` keeps
italic + muted, gains the same `pl-6` indent and a ~52ch measure.

**CUT-TO divider + story-zone prose, mechanism.** Several lessons carry
top-level narration prose before or between their opening dialogues (6 by
accurate count: kalman-filters, monitoring, forward-pass, model-profiling,
quantization, lstm-gates - an earlier scan reported 38/56 but was counting
dialogue body lines as prose), so any "render dialogues, then prose" split
would reorder content. Instead the MDX
render order is untouched and CSS does positional work inside the Briefing
step container (a `data-story-register` attribute set by `StepBriefing`'s
`LessonContent`):

- Story-zone prose - any `p` with a later `Dialogue` sibling - gets the
  stage-direction style:
  `[data-story-register] p:has(~ [data-dialogue]) { /* italic, muted, indented */ }`
- Every `Dialogue` renders a divider (`CUT TO: BRIEFING`, thin rule + mono
  micro-label). CSS hides it on all but the last dialogue, and everywhere
  outside the briefing container:
  `[data-dialogue]:has(~ [data-dialogue]) .tc-cut-to { display: none }`
  plus the divider is only displayed at all under `[data-story-register]`.
  The divider is hidden by default inside the `Dialogue` component itself
  (inline/utility class), so consumers of `@tensorcraft/ui` outside
  `apps/web` never see a stray divider; the web app's CSS opts it in under
  `[data-story-register]`.

Heuristic accepted: prose *after* the final dialogue is instruction-styled
even if a closing narration line exists; corpus scan shows openings end on
dialogue or transition directly to instruction.

Amendment (2026-06-11, found in code review): 6 lessons carry top-level
`Dialogue` blocks *mid-lesson*, after `##` headings (model-loading,
ci-cd-pipeline, forward-pass, pruning, webgpu-acceleration, training-loop).
An unbounded sibling selector would stage-direction-ize all instructional
prose above the last such dialogue and misplace the divider. The story zone
is therefore bounded to content before the first heading: both rules add
`:not(:where(h2, h3) ~ *)` so only pre-heading prose/dialogues participate.
Mid-lesson dialogues keep dialogue styling (component-level) but never
trigger the divider or prose re-styling.

`:has()` is supported in all evergreen browsers (baseline 2023). Fallback
without `:has()`: no divider, interleaved prose keeps normal style; dialogue
and scene-heading styling (component-level) still carries the register
shift.

**Epilogue/Consequence:** inherits automatically - same `SceneHeading` +
`Dialogue` components, existing FADE OUT marker kept. The epilogue container
does not set `data-story-register`, so no CUT-TO divider appears there.

### Resulting hierarchy (Briefing)

kicker (SECTOR · MISSION) → H1 → quiet meta line → screenplay block
(slugline, indented italic stage directions, indented dialogue with primary
speakers) → `CUT TO: BRIEFING` rule → full-width plain instructional prose.

## Files touched

| File | Change |
|---|---|
| `apps/web/app/components/nav.tsx` | hide on lesson routes |
| `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx` | exit chip, meta line, narrative indent, `data-story-register` pass-through |
| `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.tsx` | accept/forward story-register flag |
| `packages/ui/src/mdx/dialogue.tsx` | speaker color, indent, `data-dialogue`, CUT-TO element |
| `packages/ui/src/mdx/scene-heading.tsx` | primary-colored prefix |
| global CSS (lesson-prose layer) | story-zone `:has()` rules |

## Testing

- `lesson-steps.test.tsx`: meta line (count omitted at zero, pluralization),
  exit chip label, `data-story-register` present on Briefing content only.
- `packages/ui` dialogue/scene-heading tests: speaker color hook,
  `data-dialogue`, CUT-TO element presence; prefix accent.
- e2e (`e2e/themes.spec.ts`): marketing nav absent on lesson route, present
  on theme route; existing lesson assertions unchanged.
- jsdom does not implement `:has()` styling; positional rules verified by
  asserting the CSS contract (attributes/classes present), visual check via
  dev server.

## Accessibility

- Muted italic stage directions checked against WCAG AA (4.5:1) on each
  theme background; bump muted tone if any theme fails.
- CUT-TO divider is decorative: `aria-hidden="true"`.
- Speaker color change keeps the caps + tracking treatment, so color is not
  the sole differentiator.

## Non-goals

- No change to step gating, persistence, or the segmented progress bar
  (shipped separately today).
- No content/MDX edits - 297 lesson files untouched.
- No removal of `tier` from the content schema.
