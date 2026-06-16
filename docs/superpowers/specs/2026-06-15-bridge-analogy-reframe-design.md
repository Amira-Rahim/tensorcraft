# Bridge Analogy Reframe ("Where this breaks" -> "Where the analogy ends")

**Date:** 2026-06-15
**Status:** Approved design, pending implementation plan
**Scope:** The bridge callout's limitation footer. Stream C of the lesson-overhaul effort. Small, component-level.

## Problem

The FE->ML bridge callout ends with a footer labeled `⚠ Where this breaks` (rendered by `BridgeBreaks` in `packages/ui/src/mdx/bridge-callout.tsx`). The warning glyph + the word "breaks" frame the analogy as wrong or failed. In fact the footer's content marks a healthy boundary: where the frontend idea and the ML idea stop mapping one-to-one (e.g. "Same elementwise idea; different execution model"). The framing, not the content, is the issue.

## Goal

Reframe the footer so it reads as a natural limit of the analogy, not a failure. Remove the word "breaks" and the warning icon. Do not imply the analogy was incorrect.

## Non-goals

- Do not change the `breaks` frontmatter strings (64 in the built dirs, ~223 across all themes). They already describe the boundary correctly. No per-lesson content edits.
- Do not rename the frontmatter field `breaks` or the schema field. It is authoring-only, never displayed; renaming would churn 200+ lessons + the Zod schema for zero visible benefit.
- Do not change `data-testid="bridge-breaks"` (internal selector; renaming is needless churn and would touch several tests).
- No change to bridge tiers, variants, or the rest of the callout.

## Design

Single component change in `packages/ui/src/mdx/bridge-callout.tsx`, function `BridgeBreaks`:

- **Label:** `⚠ Where this breaks` -> `Where the analogy ends`. Remove the `⚠` glyph. Keep the same kicker styling (`font-mono text-xs uppercase tracking-widest`, tier `color`).
- **Divider styling:** keep the tier-colored dashed top border. With the alarm cues (warning glyph + "breaks") gone, the dashed border reads as a neutral section divider. No other style change.
- Everything else in `BridgeBreaks` (the `breaks` text rendering, `data-testid`, the truthy-guard that hides it when no `breaks` is provided) stays.

Because all themes render this one shared component, the reframe applies everywhere automatically.

## Secondary touch point

`apps/web/app/about/page.tsx` (~line 68) describes bridges as including a "where this breaks" statement. Reword to match the new framing (e.g. "a note on where the analogy ends") so marketing copy and product agree.

## Testing

- Update `packages/ui/src/mdx/bridge-callout.test.tsx` (~line 110): the assertion `toMatch(/Where this breaks/i)` becomes `/Where the analogy ends/i`. The other `bridge-breaks` testid assertions (presence/absence, content) are unchanged and must still pass.
- Run the bridge-callout test file + full unit suite + typecheck. All green.

## Documentation

- If `docs/story-style-bible.md` references "where this breaks" as the bridge-limitation convention, update the term to "where the analogy ends". (Authoring guidance only; the frontmatter field stays `breaks`.)

## Risks

- Minimal. One component label + one test assertion + one marketing line. No data migration, no schema change, no per-lesson edits. The retained `breaks` field name is intentional internal/authoring debt, not user-facing.
