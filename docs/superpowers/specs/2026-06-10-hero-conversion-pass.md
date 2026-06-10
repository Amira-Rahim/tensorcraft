# Landing hero — conversion pass (proof panel, subhead trim, outcome CTA)

**Date:** 2026-06-10
**Status:** Implemented
**Scope:** `LandingHero` layout + all copy surfaces EXCEPT the headline; unit + e2e tests
**Headline:** untouched — still governed by [2026-05-08-landing-headline-audience-callout.md](2026-05-08-landing-headline-audience-callout.md)

## Goal

Raise hero conversion. Diagnosis (2026-06-10 review): claim without proof, ~60-word
subhead, zero social validation, strongest risk-reversal copy rendered smallest,
and the entire right half of the viewport spent on decorative particles.

## Changes

1. **Live proof panel (biggest lever).** Right column now embeds `DeepScanDemo`
   (`apps/web/app/components/mdx/deep-scan-demo.tsx`) — the free-tier magic
   moment: a real 8 KB TFJS model classifying readings live in the visitor's
   tab. Loaded via `next/dynamic` `ssr:false` so tfjs stays off the critical
   path. Caption: `PROOF, NOT PROMISE`. Layout went single-column
   `max-w-[620px]` → `grid lg:grid-cols-[minmax(0,620px)_minmax(0,1fr)]`;
   stacks under the copy on mobile.

2. **Subhead trimmed ~50%.** Kept the fluency receipts (`Math.max → ReLU`,
   `TypedArray → Tensor`, `Service Worker → model cache`). Cut:
   - "The bridge from frontend to ML is shorter than you think." — restated
     the headline's job; the phrase survives elsewhere in brand copy.
   - "Eleven modules, fifty-five lessons, one deployable model. Built in
     JavaScript." — moved out of prose into a scannable stat line.

3. **Stat line.** New mono element under the subhead
   (`data-testid="hero-stat-line"`, left border in primary):
   `11 MODULES · 55 LESSONS · 1 DEPLOYABLE MODEL`. Doubles as specificity-based
   social proof until real learner numbers exist.

4. **Outcome CTA.** Primary CTA `Start Module 1 — Free` → `Run Your First
   Tensor — Free`. Outcome verb, on-brand noun, and literally matches the href
   (`…/introduction-to-tensors`). Href unchanged.

5. **Eyebrow.** `Deep Orbit is live · 4 themes in the pipeline` → `Deep Orbit
   is live · No Python required`. "Pipeline" is roadmap language signalling
   incompleteness to cold visitors; "No Python" is the sharpest differentiator
   and was previously buried in the footer. Pipeline/waitlist story still lives
   in the themes section.

6. **Trust line promoted.** `No credit card. No account for module 1.` moved
   tight under the CTAs (`mb-14` gap → `mb-6`), bumped `text-xs text-text-muted`
   → `text-[13px] text-text-primary`. "No Python" removed here (now in the
   eyebrow — kept single-sourced).

7. **Fold fix (same-day follow-up).** Deployed screenshot review showed the
   promoted trust line landing below the fold (behind the macOS dock) on a
   ~900px-tall viewport — the spacing rhythm was sized for the old single
   trust-footer layout. Vertical rhythm tightened: eyebrow `mb-9 → mb-6`,
   headline `mb-10 → mb-8`, subhead `mb-8 → mb-6`, stat line `mb-12 → mb-8`,
   CTA row `mb-6 → mb-5`, section `pb-28 → pb-16` (~48 px in-flow + 48 px
   padding slack). Trust line got `data-testid="hero-trust-line"` and an e2e
   regression test: `toBeInViewport()` at 1440×900.

## Iterated-copy trail

The subhead and footer are flagged in memory (`project_copy_lines.md`) as
deliberately iterated copy — not to be silently rewritten. This change was
proposed as an explicit recommendation list in-session (2026-06-10) and
approved by the user ("implement") before any edit. Headline untouched.

## Tests

- `apps/web/app/page.test.tsx` — 5 new cases: outcome CTA copy + href, eyebrow
  No-Python (and no "pipeline"), stat line, trust line, demo panel mounts
  (`next/dynamic` stubbed in jsdom).
- `e2e/landing.spec.ts` — hero demo panel visible; `deep-scan-demo` shell
  attaches within 15 s (inference completion not asserted — timing-flaky).

## Verification

- `npx vitest run apps/web/app/page.test.tsx` from repo root — 11/11 pass.
- `npx tsc --noEmit` in `apps/web` — zero new errors (6 pre-existing in
  `settings-form.test.tsx`, present with this change stashed).
- `npx playwright test e2e/landing.spec.ts --project=chromium` — 9/9 pass
  (includes fold regression + live demo panel attach).

## Deferred / follow-ups

- Real social proof (learner count / testimonial) once numbers exist —
  stat line is the placeholder.
- Hero CTA click + scroll-depth analytics verification before measuring lift.
- Demo header says "PREVIEW BUILD" — ambiguous on landing (reads as site
  beta); consider hero-specific label via prop.
- Demo is one-shot; replay affordance is polish for later.
