# Landing page - experience pass (interactive demo, product shot, FAQ, story beat)

**Date:** 2026-06-10
**Status:** Implemented
**Scope:** deep-scan-demo, landing-hero, five-worlds-section, bridge-preview-section, page.tsx, layout.tsx, faq-data.ts (new), pricing curriculum anchor
**Companions:** hero-conversion-pass, bridge-section-audit-fixes, landing-honesty-pass (all 2026-06-10)

## User decisions (asked, answered)

- Product shot: **real auto-captured screenshot** (not mockup)
- Demo interactivity: **sliders - feed your own reading**
- Founder note: **skipped**
- Story beat: **hero-anomaly tie-in on Deep Orbit card**

## Changes

1. **Interactive demo sliders** (`deep-scan-demo.tsx`). New `interactive` prop
   (hero only - lesson embed unchanged, its beat ends on the unanswered 51%).
   After the run: three channel sliders pre-set to sample 7741's exact values;
   dragging re-classifies live against the already-loaded model (refs reused,
   tensors disposed). Closing line: "Find what fools the model - that's lesson
   one's question." Also new `headerLabel` prop - hero passes "DEEP SCAN ·
   live inference · running in your tab", retiring the ambiguous
   "preview build" wording on the landing surface.

2. **Real lesson screenshot** in What You'll Build, captured by
   `scripts/capture-lesson-shot.mjs` (Playwright, 1440×900 @2x, dark, cookie
   banner dismissed) → `apps/web/public/landing/lesson-screenshot.png`.
   Happy accident: the shot shows the Mirza/ARIA story dialogue, so the
   product image also evidences the story-driven claim. Linked to the free
   lesson, labeled "// THE LESSON UI - this is the actual free lesson".
   **Re-capture when the lesson UI changes** (script header has the command).

3. **Story beat** (`five-worlds-section.tsx`): Deep Orbit card line -
   "That ambiguous reading in the demo up top? Sample 7741 - the anomaly this
   whole story chases. The demo was chapter one." Gated on
   `HERO_CARD.slug === "deep-orbit"` so a future launched-theme swap can't
   make it false.

4. **FAQ** - visible `<details>` section ("Fair Questions") before the final
   CTA; zero JS, native a11y. Items live in `app/faq-data.ts`, the single
   source mapped by BOTH the section and layout.tsx's sitewide FAQPage JSON-LD
   (previously 4 inline questions with no visible counterpart). Two new
   entries: math level ("none upfront - derivations in optional drawers"),
   refunds ("14-day money-back, <20% usage" - wording matches /pricing).

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

8. Skip link audit finding: already existed in layout (`#main-content`) - no
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
  (`scripts/probe-deep-scan-model.mjs` - pure-JS tfjs, manual IOHandler):
  single-channel drags move output ±16pp max, and the NEITHER verdict spans
  30–70%, so most drags changed nothing visible. Redesign: zone meter bar
  (NORMAL / NEITHER / ANOMALOUS with a moving needle - every drag now moves
  something), three probed presets (healthy 15.3% / sample 7741 51.3% / deep
  anomaly 91.5% - labels guaranteed by probe, re-run script if model is
  retrained), and copy explaining the channels + "no single channel decides,
  push two". E2e hardened: presets must land in their labeled zones.
- **Demo still unintelligible to cold visitors** (what runs in the tab? what
  are ch-0/1/2? what is NEITHER?). Added a framing block (interactive variant
  only, shown from load): Deep Scan = the anomaly detector you'll build; an
  8 KB net downloaded into the page scores archived ship-sensor readings;
  <30% normal, >70% anomalous, between = can't tell. Slider explainer now
  names the channels using lesson-05 canon (temperature, signal strength,
  normalized 0–1). Lesson embed unchanged - its story provides this context.
- **WYB redesigned as a pipeline band** after the stripped version read as
  floating paragraphs in dead space. One bordered grid
  (`xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]`): header owns the first cell
  (kills the empty right half), steps 01–04 fill the rest with oversized
  ghost numerals (Five Worlds grammar) + hard dividers (stats-bar rhythm).
  Step copy tightened to fit cells; outcome line + syllabus link live in the
  header cell. Server-rendered, zero JS, responsive 1→2→5 columns.
- **Lesson screenshot CUT too (user call):** the free lesson is one click
  away - the real thing beats a picture of it. Asset + capture script
  deleted; WYB is now header + syllabus link + a 2×2
  Train/Detect/Deploy/Own grid. E2e screenshot test removed (suite 11).
- **Lab CUT entirely (final).** After moving to What You'll Build it made
  that section "trying too hard and way too busy" (user) - three deep-scan
  surfaces on one page. Deleted: `DeepScanLab`, presets, sliders, meter, AND
  the WYB code mockup + hero-cross-ref line. WYB is now just: header +
  syllabus link | real lesson screenshot | Train/Detect/Deploy/Own. Hero
  spectator demo (with one framing line) is the page's only model surface.
  The probe script stays for verifying future claims. E2e slider test
  replaced with a spectator-run assertion (7741 cliffhanger renders).
  History below kept for the reasoning trail:
- **Lab moved out of the hero.** The interactive panel had accreted (framing
  paragraph + presets + sliders + meter) past hero-glanceability - hero
  content that needs instructions is section content. Split: `DeepScanDemo`
  (spectator table; `framing` prop adds a one-line premise for the hero) and
  new `DeepScanLab` export (presets/sliders/meter, own terminal frame),
  mounted in What You'll Build's right column. Both share one module-level
  `loadDeepScan()` singleton - tfjs + model load once per page; failed loads
  reset the singleton so a retry is possible. Funnel now: watch (hero) →
  understand (bridges) → touch (WYB) → choose (worlds) → act.
- **`//` comment-prefix on prose copy** flagged as an AI tell. All instances
  added in this pass (demo panel eyebrow + closing line, WYB cross-ref +
  lesson-UI label, FAQ eyebrow) replaced with the site's pre-existing ■
  square-marker eyebrow convention or plain prose. Long-established `//`
  eyebrows elsewhere left untouched.

## Space pass (user: "so much space is wasted")

- **FAQ** reflowed into the header-in-first-cell band grammar
  (`xl:grid-cols-[1fr_2.2fr]`): header cell left (eyebrow, h2, "anything
  else, open module 1" line), full-width question list right. No dead half.
- **Final CTA** centered - the one symmetric moment on an asymmetric page;
  closes without a dead half. Same content, same testids.
- **WYB** pipeline band (see above) was the same treatment.

## Five Worlds unified (user: read as two sections) - TWO iterations

First attempt: header-in-first-cell three-column band (matching WYB/FAQ).
**Rejected at page scale** - three consecutive identical band layouts
(WYB + Worlds + FAQ) read as a monotonous cramped spreadsheet ("the page
now looks terrible"). Lesson recorded: the band grammar works as an
accent, not a default; vary composition per section.

Final: title lives ON the flagship surface - eyebrow/h2/sub and the Deep
Orbit block share one full-width orbit canvas (LIVE NOW chip top-right),
so header and flagship physically cannot read as separate sections; the
four unlaunched worlds run as a compact 4-up strip underneath (name, chip,
spec, always-visible Notify me, own atmospheres). FAQ likewise reverted to
full-width rows under a simple header (no dead half - rows span the page).
Page rhythm now: stats band → centered bridge → WYB band → full-bleed
Worlds canvas → full-width FAQ rows → centered CTA bookend. Verified via
scroll-through full-page screenshot (whileInView sections are invisible in
naive fullPage captures - scroll first).

## Deep Orbit card slimmed (user call)

Ghost numeral "01", the sample-7741 story-hook paragraph, and "(free)" in
the card CTA all removed - card is now name / spec / tagline / "Start
Module 1 →" over the orbit canvas. Story-hook e2e test deleted (suite 10).

## Bridge cycler REMOVED (user call - content protection)

Prev/next cycling exposed the bridge catalog for free browsing; the catalog
is paid content. Back to ONE preview bridge (first with full framework
variant coverage + mlCode), framework tabs remain the only variation,
crossfade keyed on framework only. `bridge-prev/next/counter` testids gone;
unit test now asserts the cycler does NOT exist (regression guard against
reintroduction). User had separately removed the section footer chip.

## Deep Orbit 3D orbit canvas (user request, same day)

`AtmosphereCanvas` kind 0 (drifting stars) replaced with a real 3D orbital
system drawn on the same 2D canvas - no three.js. `drawOrbit()`: three
tilted rings (perspective projection, focal length 2.4R), per-ring speed +
Y-axis precession, depth-scaled particle size/alpha (far side dims behind
the central body + glow), faint projected ring paths so the orbit shape
reads instantly. Center at 68%/52% - right of the card's text column.
Time-parameterized from the rAF timestamp (no mutable particle state), so
the reduced-motion static frame is just t=0; offscreen pause unchanged.
Other four themes keep their particle atmospheres.

## Post-pass removal (user call, same day)

Final-CTA secondary link block (account / glossary / compare) removed
entirely at user request - section now ends on the primary button. Note:
this was the landing page's only `/compare` link (2026-06-09 funnel fix);
`/compare` and `/glossary` currently have no landing entry point. The two
e2e tests covering those links were removed with it (suite now 12), and
the stale unit guard `apps/web/app/page.compare-link.test.tsx` (added by
the 2026-06-09 funnel fix) was deleted after it blocked the next push.

## Deferred

- Social proof (still gated on real numbers).
- Lesson screenshot staleness - manual re-capture; consider CI job later.
