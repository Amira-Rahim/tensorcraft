# Landing hero - curiosity-hook headline + secondary-CTA fix

**Date:** 2026-05-08
**Status:** Implemented
**Scope:** Headline rewrite of `LandingHero`; repoint of orphaned secondary CTA
**Supersedes:** [2026-04-28-landing-mental-model-rewrite-design.md](2026-04-28-landing-mental-model-rewrite-design.md)

> **Filename note:** the slug `audience-callout` is preserved from the same-day intermediate draft; the shipped headline iterated past direct audience callout into a curiosity-hook framing within the same session. See "Same-session iteration" below for the trail.

## Goal

Reframe the homepage hero to spark curiosity in word three rather than state a fact. Cold visitors should hit a claim that contradicts their prior assumption (ML = Python) and have to keep reading to find out how it can be true. The headline names the reader as already-fluent without using the heavy-handed "ML for Frontend Devs" labelling - the indirect identity flattery does the audience-callout job while leaving the reveal to the subhead.

## Prior state

```
SAME MENTAL MODEL.
NEW DOMAIN.
```

Iterated 2026-04-28 to land an identity claim ("you already think this way"). User feedback 2026-05-08: too cryptic for a cold visitor, never names the audience anywhere in the headline despite the page `<title>` already declaring "Tensorcraft - Learn Machine Learning for Frontend Developers in JavaScript". The hero was undershooting a promise the SEO surface was already making.

### Same-session iteration (2026-05-08)

A first rewrite shipped to the local file but was never committed:

```
ML FOR FRONTEND DEVS.
NO PYTHON REQUIRED.
```

User feedback within the same session: too blunt. States the audience and the negative differentiator but has no hook - nothing that makes a cold visitor lean in. Hero is the highest-converting pixel and was being spent on a fact rather than a hook. Discarded.

Four hook shapes were considered before choosing: confidence flip ("YOU'VE BEEN WRITING ML. WITHOUT KNOWING IT."), curiosity hook ("ML SPEAKS JAVASCRIPT. TURNS OUT YOU'RE FLUENT."), spicy contrarian ("ML IS EASIER IN JAVASCRIPT. FIGHT US."), and frame-and-reveal ("FRONTEND IS HALF OF ML. WE TEACH THE OTHER HALF."). User chose curiosity hook for its surprise-claim shape and indirect audience flattery.

## New state

```
ML SPEAKS JAVASCRIPT.
TURNS OUT YOU'RE FLUENT.
```

- Line 1 (`<span className="block">`) - default text color. Fact-claim that contradicts the visitor's prior (ML = Python).
- Line 2 (`<span className="block text-primary">`) - primary green. Indirect audience callout via flattery - reader is named as already-qualified.

## Why this shape

- **Curiosity gap.** "ML speaks JavaScript" is a fact-claim that contradicts the visitor's default mental model. They have to keep reading to find out how it can be true. The blunt version stated; this version dares.
- **Audience callout, indirect but flattering.** "You're fluent" names the reader as already-qualified without doing the heavy-handed `ML for Frontend Devs` labelling. Identity claim, brand-voice consistent with the onboarding headline ("You Already Think Like an ML Engineer").
- **Subhead now functions as evidence, not setup.** The existing subhead enumerates `Math.max → ReLU`, `TypedArray → Tensor`, `Service Worker → model cache` - three concrete fluency receipts. With the headline now claiming fluency, those bridges read as the punchline / proof rather than disambiguation copy. No subhead rewrite needed.
- **No Python clause not lost.** The reassurance footer ("No credit card. No account for module 1. No Python.") still does that job. The hero no longer has to.
- **Within voice rules.** Two declarative sentences. No hype words. No em-dash. No forbidden patterns from `docs/audits/marketing-copy-audit-2026-04-26.md`. Mono ALL CAPS rendering preserved.
- **Page `<title>` alignment preserved.** The hero's "fluent" claim is consistent with the SEO surface's "Frontend Developers" target audience even without naming them outright.

## Changes

1. `apps/web/app/components/landing-hero.tsx`
   - `<h1>` spans rewritten to the new headline (lines 42–45).
   - Component docstring updated to reference the new baseline + this spec; "do not silently rewrite" guidance preserved.
   - Secondary CTA `href="#five-c-loop"` → `href="/learn"` (the `5C LOOP` section was deleted from the homepage in a prior 2026-05-08 session, leaving the anchor orphaned). `/learn` is the canonical "how it works" destination already used by the header link "New to ML? See how it works".

2. `apps/web/app/page.test.tsx`
   - Headline test renamed from "renders the iterated landing headline (mental-model frame)" → "renders the curiosity-hook landing headline".
   - Regex assertions updated: `/same mental model/i` → `/ml speaks javascript/i`, `/new domain/i` → `/turns out you'?re fluent/i`. Apostrophe tolerance (`'?`) handles either curly or straight rendering.
   - All other LandingHero tests (CTA `rounded-none`, focus-visible ring, ParticleField canvas) untouched.

3. Memory `project_copy_lines.md`
   - Baseline `**Landing headline (2026-05-08):**` updated to the curiosity-hook headline.
   - Both prior versions (mental-model, audience-callout) live in the historical "Prior landing headline" block.
   - **How to apply** spec link continues to point at this document.

4. Prior spec `2026-04-28-landing-mental-model-rewrite-design.md`
   - Top-of-document `> SUPERSEDED 2026-05-08` banner added in the prior pass; banner stays accurate.

5. `docs/audits/marketing-copy-audit-2026-04-26.md`
   - `landing-hero.tsx` row annotated to reflect the curiosity-hook framing as the shipped state.

## Out of scope

- Subhead body, eyebrow ("DEEP ORBIT IS LIVE · LAUNCH COHORT OPEN"), primary CTA copy, reassurance footer ("No credit card. No account for module 1. No Python."). All untouched.
- Onboarding headline ("You Already Think Like an ML Engineer") is intentionally distinct per the brand-copy memory and not in scope.
- Audience widening to "JS engineers" (from "Frontend devs") if Node/backend JS becomes a target later - see follow-up notes in `/Users/amira.salah/.claude/plans/from-a-user-prespective-giggly-steele.md`.

## Verification

- `npx tsc --noEmit` from `apps/web/` - zero new errors related to this change.
- Visual: `/` shows the new two-line headline with `TURNS OUT YOU'RE FLUENT.` in primary green; secondary CTA navigates to `/learn` rather than performing a no-op in-page jump; subhead's bridges read as fluency receipts.
- `grep -rn "ML for Frontend Devs\|Same Mental Model\|New Domain" --include="*.ts" --include="*.tsx"` returns zero hits in code.
- `grep -rn "#five-c-loop" --include="*.ts" --include="*.tsx"` returns zero hits.
