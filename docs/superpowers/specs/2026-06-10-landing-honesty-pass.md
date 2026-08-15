# Landing page - full-page honesty / duplication / conversion pass

**Date:** 2026-06-10
**Status:** Implemented
**Scope:** page.tsx (final CTA, What You'll Build), five-worlds-section, bridge-preview-section
**Companions:** [hero-conversion-pass](2026-06-10-hero-conversion-pass.md), [bridge-section-audit-fixes](2026-06-10-bridge-section-audit-fixes.md)

## Source

Frontend-design audit across all seven landing sections (full-page screenshot
walk), lenses: honesty/trust, conversion flow, duplicate-purpose sections.

## Findings → fixes

1. **Final CTA contradiction (worst trust defect).** Copy said "you don't need
   an account or a card" while the button (`landing-cta-final`) linked to
   `/auth`. The page's last conversion moment broke its own promise. Button now
   opens the free intro-tensors lesson (consistent with hero / bridge / theme
   CTAs); account path survives as a secondary link ("Prefer to track progress
   across devices? Create a free account"). Body copy now does new work
   instead of repeating the eyebrow: "If it clicks, the full theme is $49 once,
   no subscription" (computed from `PRICING.single.price`) - price
   transparency at the decision point.

2. **False "LIVE" badge.** What You'll Build had a pulsing dot + "LIVE - runs
   entirely in your browser" under a **static code mockup**. Replaced with an
   honest cross-reference that also gives the section a distinct job vs the
   hero demo: "// the hero demo up top is this system's 8 KB preview - it
   already ran in your tab." (hero = proof, WYB = destination).

3. **Stale "50" counts.** Bridge catalog is 51; computed surfaces (ticker
   label, cycler counter, footer chip) showed 51 while prose said 50. Bridge
   subhead and the glossary link ("Browse 50 ML terms") now interpolate
   `BRIDGES.length`.

4. **"Module 1 free / no account" said 4×** (hero trust line, five-worlds
   footer strip, final-CTA eyebrow, final-CTA body). Five-worlds footer strip
   deleted (pure duplicate); final-CTA body repurposed (see #1). Remaining:
   hero trust line + final-CTA eyebrow - one per conversion moment.

5. **Invisible waitlist affordance.** Coming-soon "Notify me →" was
   `opacity-0 group-hover:opacity-100` - invisible until mouse-over, never
   visible on touch. Now `opacity-60` resting.

## Reviewed, left alone

- Five-worlds hero card's empty right half - intentional atmosphere
  (per-theme particle canvas); brutalist negative space.
- "// CHOOSE YOUR WORLD" eyebrow with 4 locked themes - subhead is honest
  ("the other four ship in waves").
- Three CTAs to the same free lesson (hero / bridge exit / theme card /
  final) - repetition of the *action* is funnel design, not duplication;
  each sits at a distinct conviction moment.

## Tests

- e2e: "final CTA navigates to auth page" → "final CTA opens the free lesson";
  new check that the `/auth` secondary link exists in the final section.
- Unit suite unchanged (16/16); counts in tests use regex, not literals.

## Verification

- `npx vitest run apps/web/app/page.test.tsx` - 16/16.
- `npx tsc --noEmit` (apps/web) - zero new errors.
- `npx playwright test e2e/landing.spec.ts --project=chromium` - 10/10.

## Addendum - section order + spatial rhythm (same day)

- **Reorder:** Hero → Stats → Ticker → Bridge System → What You'll Build →
  Five Worlds → Final CTA (was: ticker/stats swapped, Worlds before WYB).
  Rationale: stats extend hero claims (incl. "8 KB - the model in the hero
  above", now adjacent); ticker is the bridge system's marquee intro instead
  of being orphaned by the stats bar; outcome (WYB) now precedes catalog
  (Worlds) - motivation before selection.
- **h2 scale normalized** to `text-3xl md:text-4xl` (bridges was near-h1
  `4xl/5xl`; worlds/WYB were `3xl`). Final CTA stays display-scale as the
  intentional bookend.
- **Rhythm:** bridge header `pt-20→pt-16`; bridge panels `py-12/16→py-10/12`
  with cards `max-w-md→max-w-lg` (less hollow vertical); final CTA
  `py-28→py-20`.
- Verified: vitest 16/16, Playwright landing 10/10 (no test asserts order).

## Deferred

- Social proof slot (still gated on real numbers).
- Five-worlds hero card right-half content (module map?) - only if data
  shows scroll-past.
- `id="how-it-works"` anchor on What You'll Build is unreferenced - harmless,
  candidate for /learn deep-link later.
