# Landing hero — audience-callout headline + secondary-CTA fix

**Date:** 2026-05-08
**Status:** Implemented
**Scope:** Headline rewrite of `LandingHero`; repoint of orphaned secondary CTA
**Supersedes:** [2026-04-28-landing-mental-model-rewrite-design.md](2026-04-28-landing-mental-model-rewrite-design.md)

## Goal

Reframe the homepage hero to lead with a direct audience callout and a concrete differentiator, replacing the prior abstract "mental model" framing. Cold visitors should see in the first words who the product is for and what specific pain it removes.

## Prior state

```
SAME MENTAL MODEL.
NEW DOMAIN.
```

Iterated 2026-04-28 to land an identity claim ("you already think this way"). User feedback 2026-05-08: too cryptic for a cold visitor, never names "frontend" anywhere in the headline despite the page `<title>` already declaring "Tensorcraft — Learn Machine Learning for Frontend Developers in JavaScript". The hero — the highest-converting pixel on the page — was undershooting a promise the SEO surface was already making.

## New state

```
ML FOR FRONTEND DEVS.
NO PYTHON REQUIRED.
```

- Line 1 (`<span className="block">`) — default text color. Names the audience explicitly.
- Line 2 (`<span className="block text-primary">`) — primary green. Concrete negative differentiator that ML courses overwhelmingly fail.

## Why this shape

- **Audience callout first.** Cold-visitor decision is "do I trust this enough to start." Naming "frontend devs" in word three answers "is this for me" instantly. The prior identity-claim framing required parsing two lines plus a subhead before the visitor could place themselves.
- **Negative differentiator second.** "No Python Required" lands the single most concrete pain point that distinguishes Tensorcraft from every fast.ai / Coursera / DeepLearning.AI alternative. Stronger conversion lever than abstract framing.
- **Subhead now functions as proof, not setup.** The existing subhead ("You already debug state, optimize renders, reason about caches… `Math.max` becomes ReLU…") previously had to do the audience callout work the headline skipped. With the headline now naming the audience, the bridges become punchline rather than evidence — the same copy reads as reinforcement instead of necessary disambiguation. No subhead rewrite needed.
- **Page `<title>` alignment.** The hero now matches what the SEO surface (`apps/web/app/layout.tsx:29`) has been telling search engines and browser tabs all along.

## Changes

1. `apps/web/app/components/landing-hero.tsx`
   - `<h1>` spans rewritten to the new headline (lines 42–45).
   - Component docstring updated to reference the new baseline + this spec; "do not silently rewrite" guidance preserved.
   - Secondary CTA `href="#five-c-loop"` → `href="/learn"` (the `5C LOOP` section was deleted from the homepage in a prior 2026-05-08 session, leaving the anchor orphaned). `/learn` is the canonical "how it works" destination already used by the header link "New to ML? See how it works".

2. `apps/web/app/page.test.tsx`
   - Headline test renamed from "renders the iterated landing headline (mental-model frame)" to "renders the audience-callout landing headline".
   - Regex assertions updated: `/same mental model/i` → `/ml for frontend devs/i`, `/new domain/i` → `/no python/i`.
   - All other LandingHero tests (CTA `rounded-none`, focus-visible ring, ParticleField canvas) untouched.

3. Memory `project_copy_lines.md`
   - New `**Landing headline (2026-05-08):**` baseline entry.
   - Prior "Same Mental Model. New Domain." moved to the historical "Prior landing headline" block.
   - **How to apply** spec link updated to point at this document.

4. Prior spec `2026-04-28-landing-mental-model-rewrite-design.md`
   - Top-of-document `> SUPERSEDED 2026-05-08` banner added.
   - Status changed to "Superseded 2026-05-08".
   - Body retained for historical rationale.

5. `docs/audits/marketing-copy-audit-2026-04-26.md`
   - `landing-hero.tsx` row annotated with the 2026-05-08 edit.

## Out of scope

- Subhead body, eyebrow ("DEEP ORBIT IS LIVE · LAUNCH COHORT OPEN"), primary CTA copy, reassurance footer ("No credit card. No account for module 1. No Python."). All untouched.
- Onboarding headline ("You Already Think Like an ML Engineer") is intentionally distinct per the brand-copy memory and not in scope.
- Audience widening to "JS engineers" (from "Frontend devs") if Node/backend JS becomes a target later — see follow-up notes in `/Users/amira.salah/.claude/plans/from-a-user-prespective-giggly-steele.md`.

## Verification

- `npx tsc --noEmit` from `apps/web/` — zero new errors related to this change.
- Visual: `/` shows the new two-line headline with `NO PYTHON REQUIRED.` in primary green; secondary CTA navigates to `/learn` rather than performing a no-op in-page jump.
- `grep -rn "Same Mental Model\|New Domain" --include="*.ts" --include="*.tsx"` returns zero hits.
- `grep -rn "#five-c-loop" --include="*.ts" --include="*.tsx"` returns zero hits.
