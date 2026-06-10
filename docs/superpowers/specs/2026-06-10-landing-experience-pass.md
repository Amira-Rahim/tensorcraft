# Landing page — experience pass (interactive demo, product shot, FAQ, story beat)

**Date:** 2026-06-10
**Status:** Implemented
**Scope:** deep-scan-demo, landing-hero, five-worlds-section, bridge-preview-section, page.tsx, layout.tsx, faq-data.ts (new), pricing curriculum anchor
**Companions:** hero-conversion-pass, bridge-section-audit-fixes, landing-honesty-pass (all 2026-06-10)

## User decisions (asked, answered)

- Product shot: **real auto-captured screenshot** (not mockup)
- Demo interactivity: **sliders — feed your own reading**
- Founder note: **skipped**
- Story beat: **hero-anomaly tie-in on Deep Orbit card**

## Changes

1. **Interactive demo sliders** (`deep-scan-demo.tsx`). New `interactive` prop
   (hero only — lesson embed unchanged, its beat ends on the unanswered 51%).
   After the run: three channel sliders pre-set to sample 7741's exact values;
   dragging re-classifies live against the already-loaded model (refs reused,
   tensors disposed). Closing line: "Find what fools the model — that's lesson
   one's question." Also new `headerLabel` prop — hero passes "DEEP SCAN ·
   live inference · running in your tab", retiring the ambiguous
   "preview build" wording on the landing surface.

2. **Real lesson screenshot** in What You'll Build, captured by
   `scripts/capture-lesson-shot.mjs` (Playwright, 1440×900 @2x, dark, cookie
   banner dismissed) → `apps/web/public/landing/lesson-screenshot.png`.
   Happy accident: the shot shows the Mirza/ARIA story dialogue, so the
   product image also evidences the story-driven claim. Linked to the free
   lesson, labeled "// THE LESSON UI — this is the actual free lesson".
   **Re-capture when the lesson UI changes** (script header has the command).

3. **Story beat** (`five-worlds-section.tsx`): Deep Orbit card line —
   "That ambiguous reading in the demo up top? Sample 7741 — the anomaly this
   whole story chases. The demo was chapter one." Gated on
   `HERO_CARD.slug === "deep-orbit"` so a future launched-theme swap can't
   make it false.

4. **FAQ** — visible `<details>` section ("Fair Questions") before the final
   CTA; zero JS, native a11y. Items live in `app/faq-data.ts`, the single
   source mapped by BOTH the section and layout.tsx's sitewide FAQPage JSON-LD
   (previously 4 inline questions with no visible counterpart). Two new
   entries: math level ("none upfront — derivations in optional drawers"),
   refunds ("14-day money-back, <20% usage" — wording matches /pricing).

5. **AtmosphereCanvas perf/a11y** (`five-worlds-section.tsx`): five rAF loops
   previously ran forever. Now: IntersectionObserver stops off-screen
   canvases; `prefers-reduced-motion` renders one static frame and reacts to
   live changes. BridgeTicker already behaved; these now match.

6. **Bridge swap polish:** keyed `AnimatePresence` crossfade (150 ms) on
   framework/bridge change; ←/→ arrow keys cycle while focus is in the
   controls row.

7. **Syllabus link:** "See the full module-by-module syllabus →" in What
   You'll Build → `/pricing#curriculum`; `id="curriculum"` + `scroll-mt-24`
   added to the pricing CurriculumPreview.

8. Skip link audit finding: already existed in layout (`#main-content`) — no
   change needed.

## Tests

- e2e (+4): sliders classify a custom reading against the real model (fill
  slider → score changes), FAQ expands, lesson screenshot attached + linked,
  story hook contains 7741.
- unit (+1): FAQ data covers math/refund/no-Python; ≥6 items.
- framer-motion test mock extended with `AnimatePresence`.

## Verification

- vitest `page.test.tsx` 17/17; tsc clean (apps/web, same 6 pre-existing
  excluded); Playwright landing **14/14**.

## Deferred

- Social proof (still gated on real numbers).
- Lesson screenshot staleness — manual re-capture; consider CI job later.
