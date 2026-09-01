# Five Worlds section - one section, cut don't stitch

**Date:** 2026-09-01
**Status:** Implemented (2026-09-01)
**Scope:** `apps/web/app/components/five-worlds-section.tsx` layout and copy; its unit assertions; landing visual baselines
**Related:** [2026-08-31-landing-headline-story-first.md](2026-08-31-landing-headline-story-first.md) (the fluid type family this joins)

## Problem

The landing Five Worlds section reads as three sections, not one (owner,
2026-09-01). Three different layout grammars stack with hard borders
between them: a prose header block on the page surface (eyebrow, h2,
paragraph, LIVE NOW badge), a full-bleed art band with its own inner
layout, and a 4-up coming-soon card strip. Each has its own horizontal
rhythm, so the eye files them as separate objects.

## Decision trail

Owner kept the flagship hierarchy (Deep Orbit stays the big art moment)
and rejected three stitching approaches shown as wireframes: a single
inset console frame, a fused band with a docked translucent rail, and a
five-row ledger. Diagnosis, all three points confirmed by the owner:

1. They shrank the type; the direction is louder type, not less.
2. They were stitching devices; the fix is fewer elements, not better
   joins.
3. Numbering, badges, and frames are gimmicks for this brand; unification
   must come from type, spacing, and shared gutters alone.

## Design

Three layers, one grammar, shared `px-10 md:px-20` gutters throughout.

**The line.** The h2 text changes from "Five Worlds" to "Choose Your
World" (the eyebrow promoted to the section's voice) and joins the fluid
type family: `text-[clamp(3rem,calc(10vw-1rem),8.5rem)]` with the
landing wall's weight and tracking. 17 mono chars at 0.555em per char is
the same width math as the hero's "JAVASCRIPT TO ML." line, so it renders
as one full-bleed line at desktop and wraps naturally below. The h2
renders uppercase with the wall's `leading-[0.93] tracking-[-0.045em]`
(source text stays title case, CSS uppercases, matching the hero).
Header block tightens to `pt-16 pb-8` so the line locks to the band; the
band's existing top border is the only rule under the type.

**The band.** Unchanged internals: art plate, OrbitCanvas reflection,
scrim reading column, world name, specialization, tagline, Start Module
1 link, hover ignition. The 2026-08-23 ruling holds: no prose over the
art beyond the existing scrim reading column.

**The rail.** The 4-up grid keeps its hairline column dividers (structure
per the accent-bar rule's carve-out), per-world scene canvases, palette
variables, hover/focus ignition, and the Notify me button into the
newsletter modal. Card content is name, specialization, Notify me.
Gutter reconciliation (amended at plan review, 2026-09-01): the grid
container carries `px-2 md:px-12`, which with each card's `px-8` puts
every row-start card's text exactly on the page gutter at all three grid
breakpoints (8+32 = the 40px gutter, 48+32 = the 80px gutter). The rail
therefore insets from the viewport edge; the band above is the section's
one full-bleed moment. The originally drafted first/last-card padding
cannot deliver row-start alignment at `sm:grid-cols-2` or `grid-cols-1`
and was dropped.

**Cuts.** The eyebrow row, the intro paragraph, the LIVE NOW badge, and
the per-card COMING SOON badges. Nothing is added: no numbering, no
frames, no new chrome.

**Accepted information loss (owner-flagged, approved):** the paragraph
was the only sentence telling cold visitors the other four worlds have no
release dates. "Notify me" now carries that implication alone. This is
consistent with the no-future-promises rule; the /worlds coming-soon
surface keeps its fuller copy.

## Test and baseline impact

- Reviewer-verified 2026-09-01: NO existing unit or landing-e2e
  assertion covers this section's copy ("Five Worlds", "LIVE NOW",
  "COMING SOON", paragraph); landing e2e asserts only `/deep orbit/i`
  visible, which survives. Still sweep case-insensitively (unit AND e2e,
  per the 2026-08-31 trap); expect hits on /worlds surfaces
  (`e2e/worlds.spec.ts` asserts `/coming soon/i` on /worlds), which keep
  their copy: leave-alone, not updates. Add an inverted guard for the
  cut badges/paragraph per the house removal pattern.
- All six landing visual baselines re-mint (the section is visible in
  them, unlike the masked hero). Verify twice against a warm server;
  eyeball the minted dark baseline.
- Accessibility: the inert-card contract (one tab stop, the Notify me
  button; hover mirrored on focus) is unchanged. Heading order stays
  h1 then h2s.
