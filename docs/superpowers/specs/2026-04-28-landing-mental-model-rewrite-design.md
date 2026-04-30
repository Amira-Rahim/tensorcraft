# Landing hero — mental-model rewrite

**Date:** 2026-04-28
**Status:** Spec, awaiting user review
**Scope:** Copy-only rewrite of `LandingHero` to lead with mental-model framing

## Goal

Reposition the landing hero around the claim that a frontend engineer's existing mental model transfers directly to browser ML. The current hero treats the FE→ML bridge as a curriculum claim ("every concept maps to a frontend analogy"). The rewrite makes it an identity claim ("you already think this way — we just rename the primitives").

## Why

- Stronger wedge against generic ML courses: most positioning reads as "we teach you ML in JavaScript." This rewrite says "you are already an ML engineer in disguise."
- Mirrors the onboarding headline (`"You Already Think Like an ML Engineer"`) but with a distinct surface treatment, so landing and onboarding reinforce each other without verbatim duplication.
- Lets the hero do positioning work that currently leaks into a defensive footer disclaimer (the PyTorch line).

## Non-goals

- No layout, component, or visual changes.
- No new sections on the landing page.
- No copy changes to about, pricing, compare, or onboarding surfaces.
- No new tests beyond regenerating snapshot if affected.

## Copy changes

### Eyebrow — unchanged

```
Deep Orbit is live · Launch cohort open
```

### Headline — replace

**Before** (4 lines):
```
The Bridge from
Frontend to ML
Is Shorter Than
You Think
```

**After** (2 lines):
```
SAME MENTAL MODEL.
NEW DOMAIN.
```

- `NEW DOMAIN.` rendered in `text-primary`.
- Same brutalist treatment: `font-mono font-black`, uppercase, tight tracking.
- Cadence intentionally matches the existing final-CTA closer (`BRIDGE / the gap.`).

### Subhead — replace

**Before:**
> Every ML concept maps to a frontend analogy you already know. Every analogy ships with a label that says **where it lies**, so you stop past the honest limit. Eleven modules, fifty-five lessons, one deployable model. Built in JavaScript.

**After:**
> You already debug state, optimize renders, reason about caches. That's the mental model that ships browser ML — `Math.max` becomes ReLU, `TypedArray` becomes Tensor, `Service Worker` becomes model cache. The bridge from frontend to ML is shorter than you think. Eleven modules, fifty-five lessons, one deployable model. Built in JavaScript.

- `Math.max`, `TypedArray`, `Service Worker` rendered in `text-text-primary` (or inline `<code>`-styled span) for visual punch.
- "The bridge from frontend to ML is shorter than you think" — preserved from prior iterated headline, demoted to subhead per Q2 decision.

### Footers

- **Keep:** `No credit card. No account for module 1. No Python.`
- **Drop:** `Want to be a research ML engineer in PyTorch? This is not your course. Want to ship ML in your web app this quarter? It is.`

Rationale: the new headline + subhead make the JS-native, ship-this-quarter positioning implicit. The PyTorch disclaimer becomes redundant defensive framing.

## Files touched

| File | Change |
|------|--------|
| `apps/web/app/components/landing-hero.tsx` | Replace `<h1>`, replace subhead `<p>`, delete PyTorch `<p>` |
| `packages/.../memory/project_copy_lines.md` (auto-memory) | Update iterated-copy record to reflect new landing headline + subhead pattern |
| Snapshot tests touching landing hero | Regenerate if any |

## Bridge selection (subhead inline examples)

Three bridges are named inline. All three are tier **Identity** per [themes-and-bridges.md](../../packages/content/...). Identity tier means "FE concept IS the ML concept" — strongest possible bridge. Critical: weaker tiers (Structural, Intuition) would undercut the headline's identity claim.

- `Math.max(0, x)` ≡ ReLU — Identity
- `TypedArray` w/ `.shape` ≡ Tensor — Identity
- `Service Worker` + Cache Storage ≡ model cache — Identity

## Risks

- **Onboarding overlap:** onboarding still uses `"You Already Think Like an ML Engineer"`. Landing now uses a different mental-model phrasing (`"Same Mental Model. New Domain."`). Both surfaces stay distinct, both reinforce the same wedge.
- **Copy memory drift:** [project_copy_lines.md](memory) documents the prior iterated headline. Memory must be updated atomically with the code change.
- **Snapshot churn:** `apps/web/app/components/__snapshots__/nav.snapshot.test.tsx.snap` is currently dirty per `git status`. If any landing snapshot exists, it will need regen.
- **A/B baseline lost:** the prior headline was iterated through multiple revisions. Replacement loses that conversion baseline. Acceptable pre-launch (no production traffic yet).

## Acceptance criteria

- [ ] `LandingHero` renders new headline as two-line block, `NEW DOMAIN.` in primary color.
- [ ] Subhead renders w/ three inline-emphasized bridge tokens.
- [ ] PyTorch disclaimer removed.
- [ ] Eyebrow + "no credit card" footer preserved verbatim.
- [ ] CTAs unchanged (text + hrefs).
- [ ] `pnpm typecheck` green.
- [ ] `pnpm test` green (snapshots regenerated if needed).
- [ ] `project_copy_lines.md` memory updated.

## Out of scope (deferred)

- Multi-surface mental-model rollout (about, pricing, compare).
- A/B test scaffolding.
- Hero visual / layout changes.

## Process deviation note

This is a copy-only change to one component. The brainstorming skill's spec-document-reviewer subagent loop is overkill at this scope. Proceeding directly to user spec review, then `/frontend-design` per the user's original invocation. Flagging the deviation explicitly.
