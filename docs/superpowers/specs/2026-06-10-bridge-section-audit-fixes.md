# Landing bridge section — UX/usability/text audit fixes

**Date:** 2026-06-10
**Status:** Implemented
**Scope:** `BridgePreviewSection`, `LandingBridgeTicker`, `BridgeTicker` (ui pkg), landing stats bar
**Companion:** [2026-06-10-hero-conversion-pass.md](2026-06-10-hero-conversion-pass.md) (same-day hero work)

## Source

Screenshot + code audit of the post-hero landing band (ticker → stats →
bridge system), three lenses: UX flow, usability/a11y, text. All findings
fixed in one pass.

## Fixes

### `bridge-preview-section.tsx`

- **Tab a11y:** framework buttons now carry `aria-pressed` + always-present
  `aria-label` ("Show bridges in React") — below `sm` the text label is hidden
  and buttons were icon-only glyphs with no accessible name. Selected state
  also no longer color-only (underline added). Focus-visible rings added
  (were absent; hero CTAs had them).
- **Bridge cycling:** preview was hardcoded to bridge #1 while copy promised
  "50 bridges — we'll prove it". Now prev/next controls cycle through
  `PREVIEW_BRIDGES` — bridges that have BOTH `mlCode` and a `feCode` variant
  for every framework (filter guarantees no prose-in-code-block fallback,
  closing that latent bug). Counter: "Bridge #N of 50".
- **ML side now real data:** hardcoded `model.fit(...)` string replaced with
  `bridge.mlCode` from the catalog.
- **ML-invariant story beat:** caption now "It's the same pattern — switch
  frameworks above, this side never changes." (the panel's static-ness was
  the thesis, previously unstated).
- **Section exit CTA:** new centered row — "Run a bridge yourself — module 1
  is free →" to the intro-tensors lesson. Section previously dead-ended at
  peak conviction.
- **h2:** "You Already Know ML" → "Every ML Concept Has a Frontend Name".
  Third "You already…" on the funnel (hero subhead + onboarding headline) —
  the templated-structure smell the 2026-06-10 copy audit flagged.
- **Footer text:** "all personalized to {fw}" → "all shown in {fw}"
  (personalized overstated); sentence extraction hardened from
  `connection.split(".")[0]` to abbreviation/decimal-safe `firstSentence()`.
- **Mobile zigzag:** FE card was `ml-auto` even stacked (right-aligned on
  mobile, ML card left) — now `mx-auto md:ml-auto` / `mx-auto md:mx-0`.
- **`⇄` connectors** `aria-hidden`.
- **Report Issue collision:** footer gets `xl:pr-44` so the bridges-counter
  chip clears the fixed bottom-right Report Issue button.

### `landing-bridge-ticker.tsx` + `bridge-ticker.tsx` (ui)

- **Honest label:** "// LIVE BRIDGE FEED" (false — 12 static curated items) →
  "// FROM THE BRIDGE CATALOG · {n} OF {total}", computed not hardcoded.
- **Tier chip jargon:** `identity/structural/intuition` badges get
  `title` + `aria-label` glosses (e.g. "Structural bridge — same shape,
  different mechanics").
- **Pause control:** solid `var(--tc-bg)` fill — transparent background made
  it collide visually with badge text scrolling underneath.

### `page.tsx`

- **Stats dedup + scoping:** 55-lessons / 11-modules cards duplicated the
  hero stat line one viewport later; "$49 One-time, no sub" didn't say what
  it bought; "11 Modules" had no scope. New cards:
  `$49 / Per theme. One-time, no sub` · `0 / Lines of Python` ·
  `8 KB / The model running in the hero above` · `1 / 5 Themes live`
  ("(4 coming)" dropped — roadmap weight, same reasoning as the hero eyebrow).
- **Redundant strip deleted:** "New to ML? See how it works" → `/learn`
  duplicated the hero secondary CTA one viewport apart.

## Tests

- `page.test.tsx`: new `BridgePreviewSection` suite — aria-pressed toggling,
  accessible tab names, prev/next cycling + counter, exit CTA href,
  shown-in-not-personalized footer (tracks framework), h2 avoids
  "You already".
- `bridge-ticker.test.tsx` (ui): existing 5 still green.

## Verification

- `npx vitest run apps/web/app/page.test.tsx packages/ui/src/effects/bridge-ticker.test.tsx` — 21/21 pass.
- `npx tsc --noEmit` in `apps/web` and `packages/ui` — zero new errors.
- `npx playwright test e2e/landing.spec.ts --project=chromium` — 9/9 pass.

## Deferred

- Real social proof slot (learner count/testimonial) — still pending numbers.
- Keyboard arrow-key navigation between framework tabs (tab-stop nav works).
- Tier-chip tooltips rely on `title` — no touch affordance; fine for now.
