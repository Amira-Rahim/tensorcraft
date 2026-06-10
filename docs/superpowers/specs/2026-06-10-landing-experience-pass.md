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

## Post-pass fixes (user feedback, same day)

- **Slider panel felt dead.** Probed the real model's response surface
  (`scripts/probe-deep-scan-model.mjs` — pure-JS tfjs, manual IOHandler):
  single-channel drags move output ±16pp max, and the NEITHER verdict spans
  30–70%, so most drags changed nothing visible. Redesign: zone meter bar
  (NORMAL / NEITHER / ANOMALOUS with a moving needle — every drag now moves
  something), three probed presets (healthy 15.3% / sample 7741 51.3% / deep
  anomaly 91.5% — labels guaranteed by probe, re-run script if model is
  retrained), and copy explaining the channels + "no single channel decides,
  push two". E2e hardened: presets must land in their labeled zones.
- **`//` comment-prefix on prose copy** flagged as an AI tell. All instances
  added in this pass (demo panel eyebrow + closing line, WYB cross-ref +
  lesson-UI label, FAQ eyebrow) replaced with the site's pre-existing ■
  square-marker eyebrow convention or plain prose. Long-established `//`
  eyebrows elsewhere left untouched.

## Post-pass removal (user call, same day)

Final-CTA secondary link block (account / glossary / compare) removed
entirely at user request — section now ends on the primary button. Note:
this was the landing page's only `/compare` link (2026-06-09 funnel fix);
`/compare` and `/glossary` currently have no landing entry point. The two
e2e tests covering those links were removed with it (suite now 12), and
the stale unit guard `apps/web/app/page.compare-link.test.tsx` (added by
the 2026-06-09 funnel fix) was deleted after it blocked the next push.

## Deferred

- Social proof (still gated on real numbers).
- Lesson screenshot staleness — manual re-capture; consider CI job later.
