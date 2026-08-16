# Landing bridge section, anatomy-of-one-bridge redesign

**Date:** 2026-08-16
**Status:** Approved (owner picked "Anatomy of one bridge" from three
mockups; declined the "where it breaks" note on the landing page)
**Scope:** `apps/web/app/components/bridge-preview-section.tsx`,
`apps/web/app/page.tsx` (one stale comment), `apps/web/app/page.test.tsx`
**Prior spec:** [2026-06-10-bridge-section-audit-fixes.md](2026-06-10-bridge-section-audit-fixes.md)

## Problem

The section is a fossil of removed features (framework picker, cycler,
ticker, caption). What remains: two top-aligned code boxes of different
heights in a tall empty band, a glowing bordered `⇄` tile that looks like
a button but is `aria-hidden` decoration, three unrelated accent colors
(green FE label and FE code, gold ML code, purple connector; the bridge is
structural tier, so the gold is wrong), and a headline ("Every ML Concept
Has a Frontend Name") the section asserts but never explains. The
`connection` prose that does the explaining sits unused in
`packages/shared/src/bridges.ts`.

## Design

Model the section on the lesson `BridgeCallout` (ui package): the landing
preview becomes a scaled-up version of the surface learners actually use.

1. **Header band:** unchanged.
2. **Code band** (`md:grid-cols-[1fr_auto_1fr]`, kept):
   - Labels symmetric and muted (`text-text-muted`), matching the callout's
     muted-label grammar. Styling changes only: the label text stays
     "YOUR REACT CODE" / "ML EQUIVALENT" (the first is pinned by an
     existing test). Concept titles stay `text-text-primary`.
   - Both code blocks colored by the bridge's tier token
     (`--tc-tier-identity|structural|intuition` via a record map, as in
     `exercise.tsx`). One accent per band instead of three.
   - Equal heights: each cell is a flex column, the code box `flex-1`.
   - ML snippet formatted at render, one statement per line
     (`mlCode.replace(/;\s+/g, ";\n")`). `bridges.ts` data untouched; the
     lesson callout keeps its own rendering.
   - Connector de-buttoned: on desktop the hairline divider stays and the
     `⇄` glyph sits on it in the tier color with a page-background
     punch-out; on mobile it is a bare glyph between the stacked panels,
     no divider. No border, no glow, no raised surface. Stays
     `aria-hidden`.
3. **Connection band (new,** `border-t`**):** the lesson footer grammar
   scaled up. `bridge:` prefix in the tier color, then the full
   `connection` prose in muted mono, `text-sm`, max width ~65ch, centered.
   No "breaks" note (owner decision, 2026-08-16). No left accent bar
   (banned repo-wide, 2026-08-16, CLAUDE.md).
4. **CTA band:** unchanged (`bridge-section-cta`, free-lesson href).
5. **Motion:** keep the single `whileInView` fade. No new choreography.
6. **page.tsx:** fix the stale "(client island, framework picker)" comment.

## Constraints held (pinned by existing tests and owner directives)

Exactly one bridge, no cycler or counter, no framework picker, CTA to the
free lesson, no "personalized"/"all shown in" text, h2 avoids "You
already", catalog stays unbrowsable.

## Tests

`page.test.tsx` BridgePreviewSection suite gains:
- renders the `connection` prose of the previewed bridge (from data, not a
  hardcoded string);
- does NOT render that bridge's `breaks` text;
- section contains no buttons (nothing clickable-looking that isn't);
- ML snippet renders one statement per line (textContent matches `;\n`).

Existing five tests stay green unchanged.

## Verification

- `npx vitest run apps/web/app/page.test.tsx`
- `npx tsc --noEmit` in `apps/web`
- Landing visual baselines (dark + light) re-minted; delete PNGs first
  (stale-under-tolerance trap, 2026-08-15).
