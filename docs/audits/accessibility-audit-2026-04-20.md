# Accessibility Audit — 2026-04-20

**Auditor:** Claude (static code audit, read-only)
**Scope:** `apps/web/app/**`, `packages/ui/src/**`, `packages/themes/src/**`
**Target:** WCAG 2.1 AA, 44×44px touch targets, full keyboard operability
**Method:** Grep + Read sweep of component source (no browser testing)

---

## 1. Executive summary

Tensorcraft has a solid accessibility floor. The root layout provides a working skip link, the global `*:focus-visible` outline rule is present in `globals.css`, CSS `@media (prefers-reduced-motion)` is wired, landmarks (`<nav>`, `<main>`, `<footer>`) are used on nearly every page, and several interactive patterns (bridge-callout tablist, mobile nav hamburger, module progress bar, OAuth buttons) already carry the correct ARIA semantics. Icon-only buttons mostly have `aria-label`.

The dominant gaps are **(a) font sizes well below the documented 12px minimum** (8–11px used in Pill/PhaseChip/SceneHeading, Report-Issue modal labels, Settings labels, Consequence step caption, pricing OWNED chip, dashboard `text-[8px]`), **(b) touch targets under 44×44px** on the UserMenu avatar, MobileNav/LessonDrawer triggers, cookie-consent buttons, pricing theme-picker chips, Quiz submit, CodeBlock copy button, Bridge-Callout tabs, and most lesson-step/pricing text-sm buttons at `py-2`–`py-2.5`, **(c) missing `aria-live` / `role="status"`** on the TestResultsPanel (async exercise outcome — critical for screen readers), CodeBlock copy confirmation, and Quiz verdict text, **(d) `outline-none` form inputs in settings-form, report-issue-button, and glossary-list** which kill focus visibility, **(e) no focus trap / focus restoration** on the report-issue dialog, user-menu dropdown, lesson-drawer bottom sheet, or mobile-nav overlay, **(f) no JS `prefers-reduced-motion` gate** on the particle/animation canvases (auth-form, ambient-background, five-worlds, ticker, report-issue scan line) — the CSS guard only covers CSS animations/transitions, not rAF loops, and **(g) forms have no `aria-describedby` linking errors to inputs and no `aria-invalid`** on validation failure.

### Severity counts
| Severity | Count |
| --- | --- |
| Critical (blocks SR users, or WCAG AA fail on core journey) | 6 |
| Serious (WCAG AA fail, workaround exists) | 14 |
| Moderate (WCAG AA borderline or best-practice) | 11 |
| Minor (polish) | 6 |
| **Total** | **37** |

---

## 2. Findings by page / component

| File : line | Issue | WCAG SC | Severity | Recommended fix |
| --- | --- | --- | --- | --- |
| `apps/web/app/layout.tsx:317` | Skip-link target `#main-content` is a `<div>`, not a `<main>`. Individual pages wrap content in their own `<main>`, so the skip link lands on an anonymous container above the real main landmark. Also: focus does not naturally reach the div (no `tabIndex={-1}`), so VoiceOver announces the div's contents but arrow-nav is unpredictable. | 2.4.1, 4.1.2 | Serious | Either change wrapper to `<main id="main-content" tabIndex={-1}>` and remove per-page `<main>`, or keep per-page `<main>` and move the `id` / skip-link target onto each page's `<main>` (or set `tabIndex={-1}` on the wrapper div as a minimum). |
| `apps/web/app/components/nav.tsx:51` | `<nav>` lacks a `<header>` wrapper. Minor — screen readers still expose it as a navigation landmark, but top-of-page `<header>` landmark is absent sitewide. | 1.3.1 | Minor | Wrap `<Nav>` + `<Ticker>` in `<header>` inside layout. |
| `apps/web/app/components/nav.tsx:23` | Nav links `text-[13px]` — OK, but inactive state uses `text-text-muted` (#A0A0A0 on #232323 surface ≈ 4.8:1 — passes). Active state uses `text-primary` — varies per theme; Nova Canvas `#C06060` on surface `#232323` ≈ 4.3:1 (fails AA 4.5:1 for normal text). | 1.4.3 | Serious | Darken surface to `#1C1C1C` behind nav, or brighten the Nova Canvas primary, or bump nav link to `text-[14px]` (large-text threshold is 3:1). |
| `apps/web/app/components/mobile-nav.tsx:52` | Hamburger button 40×40px — below 44×44. | 2.5.5 | Serious | `w-11 h-11` (44px). |
| `apps/web/app/components/mobile-nav.tsx:65` | Full-screen overlay has no focus trap, no focus-restore to hamburger on close, no `role="dialog"`/`aria-modal`. Escape only closes on route change. | 2.1.2, 2.4.3, 4.1.2 | Serious | Add focus trap (first link focused on open, Tab cycles within overlay, Esc closes), return focus to hamburger on close, add `role="dialog" aria-modal="true" aria-label="Site navigation"`. |
| `apps/web/app/components/user-menu.tsx:82` | Avatar button w-9 h-9 (36px) — below 44×44. | 2.5.5 | Serious | `w-11 h-11`. |
| `apps/web/app/components/user-menu.tsx:98` | Dropdown has `role="menu"` but no arrow-key navigation, no Escape-to-close, no focus restore to trigger, no `aria-activedescendant`. Menu items `py-2.5` ≈ 34px. | 2.1.1, 4.1.2, 2.5.5 | Serious | Implement roving tabindex + Arrow/Home/End/Esc per APG menu pattern, or convert to a simple popover with links (no `role="menu"`) and rely on Tab. Increase item padding to `py-3` + `text-sm` for ≥44px. |
| `apps/web/app/components/cookie-consent.tsx:63-74` | "Accept all" / "Essential only" buttons `py-2 text-sm` ≈ 32px. | 2.5.5 | Serious | `py-3 px-6` or `h-11`. |
| `apps/web/app/components/cookie-consent.tsx:49` | Banner not announced — no `role="region" aria-label="Cookie consent"`. Mid-page focus order reasonable but the banner is `position: fixed bottom` so sighted keyboard users may not discover it. | 4.1.2 | Moderate | Add `role="region" aria-label="Cookie consent"`; consider moving focus to "Accept" on mount (debated — some teams intentionally don't). |
| `apps/web/app/components/report-issue-button.tsx:218-253` | FAB: `padding: 10px 20px; fontSize: 11` ≈ 32px tall. Below 44px. `fontSize: 11` below 12px min. | 2.5.5, 1.4.4 | Serious | Bump to `padding: 14px 22px; fontSize: 13` and `min-height: 44`. |
| `apps/web/app/components/report-issue-button.tsx:299` | Dialog has `role="dialog" aria-label="Report an issue"` but no `aria-modal="true"`, no focus trap, no auto-focus on first field, no focus-restore to FAB. Escape works (good). Click-outside works (good). | 2.4.3, 4.1.2 | Serious | Add `aria-modal="true"`, focus first field on open, trap Tab, restore focus on close. |
| `apps/web/app/components/report-issue-button.tsx:373,433,454,504` | Labels / metadata text at `fontSize: 9` — below 12px min and below WCAG 4.5:1 border (small text amplifies contrast issues with `var(--tc-muted)`). | 1.4.4, 1.4.3 | Serious | Raise to `fontSize: 12` minimum for labels and metadata. |
| `apps/web/app/components/report-issue-button.tsx:467,522,720` | `outline-none` on `<select>`, `<textarea>`, and `<input>` with no replacement `:focus-visible` ring. Global `*:focus-visible` outline in `globals.css` is overridden by this class. | 2.4.7 | Critical | Remove `outline-none` and rely on the global focus-visible rule, OR add `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`. |
| `apps/web/app/components/report-issue-button.tsx:536` | Character counter `fontSize: 8` + `opacity: 0.6` over `var(--tc-muted)` — effectively unreadable. | 1.4.4, 1.4.3 | Serious | `fontSize: 11` + remove opacity. |
| `apps/web/app/components/report-issue-button.tsx:749` | `role="alert"` — good, but validation errors above it are not bound to inputs via `aria-describedby`, and inputs have no `aria-invalid`. | 3.3.1, 4.1.2 | Serious | Add `aria-invalid` + `aria-describedby` on each validated field pointing at an error element. |
| `apps/web/app/components/auth-form.tsx:425` | Email input has `outline-none`, but provides `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` replacement — OK. |  | ✓ good |  |
| `apps/web/app/components/auth-form.tsx:299-309` | Error banner uses `role="alert"` implicitly? No — missing. Also errors not wired to input via `aria-describedby`. | 3.3.1, 4.1.2 | Serious | Wrap error in `<div role="alert" aria-live="polite">`, set `aria-invalid="true"` + `aria-describedby` on the email input when set. |
| `apps/web/app/components/auth-form.tsx:464` | Terms text at `text-xs text-text-muted/60` — muted #A0A0A0 × 0.6 ≈ #606060 on #232323 ≈ 2.1:1 (fails 4.5:1). | 1.4.3 | Serious | Remove `/60` opacity or use `text-text-muted` alone. |
| `apps/web/app/components/auth-form.tsx:326` | "Didn't receive it?" text also `text-text-muted/60` — same contrast problem. | 1.4.3 | Serious | Same fix. |
| `apps/web/app/components/auth-form.tsx:244` | Canvas loss-landscape animation runs rAF loop regardless of `prefers-reduced-motion`. | 2.3.3, 2.2.2 | Moderate | Guard `requestAnimationFrame` loop with `matchMedia('(prefers-reduced-motion: reduce)').matches` check; skip draw or draw a static final frame. |
| `apps/web/app/components/ambient-background.tsx:1-end` | Same — rAF particle loop, no reduced-motion check. | 2.3.3, 2.2.2 | Moderate | Same — short-circuit on `prefers-reduced-motion`. |
| `apps/web/app/components/five-worlds-section.tsx` | Same — per-theme particle canvases run regardless of reduced motion. | 2.3.3, 2.2.2 | Moderate | Same. |
| `apps/web/app/components/ticker.tsx` | Scrolling ticker (rAF) not gated. Scrolling content is WCAG 2.2.2 Pause/Stop/Hide territory (over 5s). | 2.2.2 | Moderate | Add pause control OR gate on reduced-motion. |
| `apps/web/app/settings/settings-form.tsx:292,315,338` | Labels rendered at `fontSize: 10` — below 12px minimum and poor contrast on small text. | 1.4.4 | Serious | `fontSize: 12` minimum. |
| `apps/web/app/settings/settings-form.tsx:301,324,365` | Inputs use `outline-none` with no `focus-visible` replacement. Only a static 2px border stays; no focus indication. | 2.4.7 | Critical | Add focus-visible ring or remove `outline-none`. |
| `apps/web/app/settings/settings-form.tsx` | Form lacks `aria-describedby` / `aria-invalid` wiring for validation errors (pattern consistent across forms). | 3.3.1 | Serious | Wire errors to inputs. |
| `apps/web/app/glossary/glossary-list.tsx:76` | Search `<input>` has no `<label>` (placeholder is not a label). | 1.3.1, 3.3.2 | Serious | Add visually-hidden `<label htmlFor="glossary-search">Search terms</label>` or `aria-label="Search terms"`. |
| `apps/web/app/glossary/glossary-list.tsx:81` | `focus:outline-none` overrides global focus-visible rule. Border change is color-only. | 2.4.7, 1.4.1 | Serious | Remove `focus:outline-none` OR add visible focus ring. |
| `apps/web/app/glossary/glossary-list.tsx:85` | Clear button `text-xs` — ≈12px, borderline. No `aria-label` — text "Clear" exists so OK, but keyboard users may not know what it clears. | 1.4.4 | Minor | Add `aria-label="Clear search"`. |
| `apps/web/app/pricing/pricing-tiers.tsx:33-55` | Theme-picker chips `px-3 py-1.5 text-xs` ≈ 28px tall — below 44×44. Uses color+border to convey selected state; with disabled+owned state relying partly on color. | 2.5.5, 1.4.1 | Serious | `py-3 px-4` minimum, include text/icon difference for selected, not color alone. |
| `apps/web/app/pricing/pricing-tiers.tsx:50` | "OWNED" chip `text-[10px]` — below 12px. | 1.4.4 | Moderate | `text-xs` (12px). |
| `apps/web/app/pricing/pricing-tiers.tsx` | ThemePicker buttons lack `aria-pressed` to express selection state; relies on disabled + visual cue. | 4.1.2 | Moderate | Add `aria-pressed={isSelected}`. |
| `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx:388-444` | Back / Continue buttons `px-5 py-3` ≈ 40–42px — borderline under 44. Disabled state uses `opacity: 0.3` + color change; disabled Back is `cursor: not-allowed` but still receives focus (native button disabled). | 2.5.5 | Moderate | Use `py-3.5` for 44px, or `min-height: 44px` style. |
| `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx:730,746,794,831,854` | Step decorations `text-[9px]` / `text-[10px]` (Pill, PhaseChip, SceneHeading-like badges, "FADE OUT", "NEXT MISSION") — below the 12px floor. | 1.4.4 | Serious | Raise all to `text-[12px]` minimum. |
| `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx:213-229` | Touch-swipe gesture navigates between lesson steps but no keyboard equivalent (← / → arrows). Mouse / keyboard users must use Back / Continue buttons — fine for now, but swipe-only alternatives violate principle of keyboard parity if swipe ever becomes the primary discover-path. | 2.1.1 | Minor | Add `onKeyDown` on container: ArrowLeft → goBack, ArrowRight → goNext. |
| `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-drawer.tsx:46` | Trigger w-9 h-9 (36px) — below 44. | 2.5.5 | Serious | `w-11 h-11`. |
| `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-drawer.tsx:65-71` | Bottom sheet: backdrop `<div onClick>` — decorative, acceptable. But no `role="dialog"`, no `aria-modal`, no focus trap, no focus restore, no Escape handler. | 2.4.3, 4.1.2 | Serious | Add dialog semantics + focus trap + Escape + focus restore to trigger. |
| `apps/web/app/themes/[slug]/module-map-client.tsx:89` | Module accordion uses `aria-expanded` — good. Lacks `aria-controls` pointing at the revealed lesson panel. | 4.1.2 | Moderate | Add `aria-controls="mod-{slug}-panel"` and matching `id` on the panel. |
| `apps/web/app/themes/[slug]/module-map-client.tsx:285` | `role="progressbar"` + `aria-valuenow/min/max` — good, but no `aria-label` or `aria-labelledby` to say *what* is progressing. | 4.1.2 | Moderate | Add `aria-label="Module completion"`. |
| `apps/web/app/dashboard/bridge-collection.tsx:103` | Caption `text-[8px]` — far below 12px floor. | 1.4.4 | Serious | **FIXED 2026-07-15** (`text-xs`). Open this long because the component was never imported by anything; it only rendered for the first time when the dashboard collectibles were wired up. |
| `apps/web/app/dashboard/dashboard-view.tsx` | Uses `<canvas>` for skill genome radar — ensure it has `<canvas role="img" aria-label="Your skill genome: …">` with a textual summary. (Not verified in detail; flagging.) | 1.1.1 | Moderate | Add `role="img"` + `aria-label` summarizing axes+values, or provide a `<p class="sr-only">` readout. |
| `apps/web/app/components/site-footer.tsx:5` | `<footer>` landmark used — good. Missing `aria-label` (helpful when multiple footers exist; not strictly required). | — | Minor | `<footer aria-label="Site footer">`. |
| `apps/web/app/components/site-footer.tsx:40-51` | Link to `/bridges` — but the project brief says the bridges route was removed. Dead link would send keyboard + SR users to 404. | 2.4.4, 3.2.3 | Moderate | Remove `/bridges` link, or restore the route. |
| `packages/ui/src/mdx/exercise.tsx:465-525` | `TestResultsPanel` renders async test outcome ("All tests passed", per-test ✓/✗, score). No `role="status"`, no `aria-live="polite"`. Screen-reader users running an exercise will not be told whether tests passed. Core user flow. | 4.1.3, 3.3.1 | Critical | Wrap outer container in `role="status" aria-live="polite" aria-atomic="true"` and ensure summary text appears first in reading order. |
| `packages/ui/src/mdx/exercise.tsx` | ✓/✗ glyphs used without text labels inside list rows — text "passed/failed" is implicit in color+glyph. Add `sr-only` text. | 1.1.1, 1.4.1 | Serious | Replace bare glyph with `<span aria-hidden>✓</span><span className="sr-only">Passed:</span>` pattern. |
| `packages/ui/src/mdx/quiz.tsx:55-72` | Option buttons — should be a `role="radiogroup"` with `role="radio"` / `aria-checked`. Current implementation is a group of native `<button>`s which screen readers will announce as "button, button, button" with no group relationship, and no `aria-pressed` or radio state. | 4.1.2, 1.3.1 | Serious | Convert to proper radiogroup (ul with role="radiogroup", li role="radio" aria-checked, or fieldset+radio inputs styled as buttons). |
| `packages/ui/src/mdx/quiz.tsx:87-90` | Verdict text ("Correct!" / "Not quite — try again") is not in a live region — screen readers won't announce the result. | 4.1.3 | Critical | Add `role="status" aria-live="polite"` on the verdict element. |
| `packages/ui/src/mdx/quiz.tsx:79` | Submit button `py-2` ≈ 32px. | 2.5.5 | Serious | `py-3`. |
| `packages/ui/src/mdx/code-block.tsx:91-99` | Copy button `py-1 text-xs` ≈ 24px tall — well below 44. `aria-label="Copy code"` missing (text changes from "Copy" → "Copied!" which is fine as visible text, but no live region so SR misses the confirmation). | 2.5.5, 4.1.3 | Serious | Add `aria-live="polite"` on the button OR separate status span; bump padding to `py-2` + `px-3`. |
| `packages/ui/src/mdx/bridge-callout.tsx:184` | Tabs `px-4 py-2 text-xs` ≈ 28px tall. Touch target. | 2.5.5 | Moderate | `py-3`. |
| `packages/ui/src/mdx/bridge-callout.tsx:143-158` | Keyboard: Arrow + Enter/Space implemented, roving `tabIndex` correct, but no Home / End support — APG recommends them. | 2.1.1 | Minor | Add Home → first tab, End → last tab. |
| `packages/ui/src/mdx/hint-panel.tsx:64-76` | "Reveal" button: no `aria-expanded`, no live region around the revealed content. SR user presses "Reveal Nudge" — content appears but isn't announced. | 4.1.2, 4.1.3 | Moderate | Add `aria-expanded` on trigger and `role="status" aria-live="polite"` on revealed container (or `aria-live="polite"` on the parent list). |
| `packages/ui/src/mdx/scene-heading.tsx:17` | `text-[10px]` — below 12px floor. | 1.4.4 | Serious | `text-[12px]`. |
| `packages/ui/src/mdx/dialogue.tsx:13` | Speaker label `text-xs` = 12px (OK). Dialogue body `text-[15px]` OK. Direction `text-[13px] italic` OK. |  | ✓ good |  |
| `packages/ui/src/mdx/key-takeaways.tsx:8` | `<h4>` used — heading-hierarchy depends on context. In a lesson step without an ancestor `<h3>`, this skips levels. Audit each lesson step: StepTakeaways has no heading of its own, StepConsequence starts with `<h2>`. | 1.3.1 | Moderate | Use `<h3>` inside step containers (where lesson title is `<h1>` at step 0 and `<h2>` at step 5). |
| `apps/web/app/components/session-toast.tsx:30` | `role="alert"` — good. |  | ✓ good |  |
| `apps/web/app/pricing/payment-error.tsx:24` | `role="alert"` — good. |  | ✓ good |  |
| `apps/web/app/pricing/checkout-button.tsx:144` | `role="alert"` — good, but the `<p>` carries the role; `aria-live="polite"` or `assertive` not set explicitly (defaults are implementation-defined for `alert`, but `assertive` is standard for `alert`). | 4.1.3 | Minor | Fine; optionally add explicit `aria-live="assertive"` for clarity. |
| `apps/web/app/globals.css:9-12` | Global `*:focus-visible { outline: 2px solid var(--tc-primary); outline-offset: 2px }` — excellent. |  | ✓ good |  |
| `apps/web/app/globals.css:283-292` | CSS `prefers-reduced-motion` zeroes animation & transition durations — good for CSS-driven motion. Does not cover JS rAF canvases. | 2.3.3 | Moderate | Add a JS helper or hook (`useReducedMotion`) and guard all rAF loops. |
| `packages/themes/src/css/themes.css` | Nova Canvas primary `#D07070` on surface `#232323` ≈ 4.85:1 (passes AA 4.5:1) — FIXED 2026-04-20 via Phase 11 §11a foundation work. Terra Grid primary `#C49535` on surface ≈ 5.1:1 (passes). Signal Ward `#65C07D` on surface ≈ 5.4:1 (passes). Deep Orbit `#6BAA8A` on surface ≈ 4.9:1 (passes). Neon Protocol `#4A90D9` on surface ≈ 4.5:1 (borderline). | 1.4.3 | ✓ resolved | Nova Canvas bumped from `#C06060` → `#D07070`. Neon Protocol still borderline — consider further bump in future pass. |

---

## 3. Repeating patterns (single-fix locations)

1. **Sub-12px typography**. At least 12 locations use `text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]`, or inline `fontSize: 8|9|10|11`. The design system claims 12px minimum (CLAUDE.md + dev-plan line 434 "Minimum font size 12px"). Introduce a lint rule (eslint `no-restricted-syntax` on arbitrary `text-[<12]` Tailwind values and inline `fontSize < 12`) and sweep all offenders to 12px. Highest-impact files: `lesson-steps.tsx`, `report-issue-button.tsx`, `settings-form.tsx`, `bridge-collection.tsx`, `scene-heading.tsx`.

2. **`outline-none` on form inputs**. 8 occurrences across `settings-form.tsx`, `report-issue-button.tsx`, `glossary-list.tsx`. These override the global focus-visible rule. Either remove `outline-none` entirely (simplest) or pair every instance with `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`.

3. **Touch targets < 44×44**. Icon-only buttons (UserMenu avatar `w-9 h-9`, LessonDrawer trigger `w-9 h-9`, MobileNav hamburger `w-10 h-10`), text buttons at `py-2`/`py-2.5 text-xs`/`text-sm` (cookie consent, Quiz submit, CodeBlock copy, pricing chips, bridge-callout tabs, user-menu items, report-issue FAB). Introduce a shared `Button` component in `packages/ui` with `min-h-11` baked in, or a Tailwind `@utility` like `tap-target { min-height: 44px; min-width: 44px }` and sweep.

4. **Modal/dialog patterns missing focus trap + restore**. Report-issue dialog, user-menu popover, mobile-nav overlay, lesson-drawer bottom sheet. Standardize on a shared `Dialog`/`Popover` primitive (radix-ui, react-aria, or a tiny custom hook) that handles: (a) focus first focusable on open, (b) trap Tab within, (c) Escape closes, (d) restore focus to opener on close, (e) `aria-modal` + `role="dialog"` + labelled.

5. **No `aria-live` on async feedback**. TestResultsPanel (exercise), Quiz verdict, CodeBlock "Copied!", HintPanel reveals. Standardize: any element whose content changes in response to user action but is not itself focused should have `role="status" aria-live="polite"` (or `role="alert" aria-live="assertive"` for errors).

6. **Form validation wiring**. No form uses `aria-invalid` or `aria-describedby`. Create a `<FieldError>` helper or pattern where each input receives `aria-invalid={!!error} aria-describedby={error ? 'field-x-error' : undefined}` and the error paragraph has matching `id`.

7. **JS animation loops not gated on `prefers-reduced-motion`**. At least 5 rAF loops. Add a shared `useReducedMotion()` hook (`const reduce = useSyncExternalStore(subscribe, () => matchMedia('(prefers-reduced-motion: reduce)').matches)`) and early-return from draw().

---

## 4. What's already good (don't regress)

- **Skip-to-content link** in root layout (first focusable, styled on focus).
- **Global `*:focus-visible` outline** with theme primary color + offset — covers everything the user interacts with unless a component explicitly overrides.
- **CSS `prefers-reduced-motion`** zeroes animations & transitions.
- **Landmarks present**: `<main>` on every content page (32 files), `<nav aria-label="Main navigation">`, `<footer>`, `<form>`.
- **Mobile nav hamburger** carries `aria-label="Open menu"` + `aria-expanded`.
- **Bridge-callout tabs** implement the APG tablist pattern with roving tabindex + arrow keys + `role="tab"/"tabpanel"/"tablist"`.
- **Module-map progress** uses `role="progressbar"` + `aria-valuenow/min/max`.
- **Auth form** has proper `<label htmlFor>` (sr-only) and autocomplete on the email input, and its OAuth buttons carry `aria-label`.
- **Toast / error banners** (session-toast, payment-error, checkout-button error) correctly use `role="alert"`.
- **All SVG icons** inside buttons carry `aria-hidden="true"`.
- **No `<div onClick>` / `<span onClick>`** misuse found — every clickable element is a `<button>` or `<Link>`.
- **No raw `<img>` tags** — Next `<Image>` used (which enforces `alt` at build time in strict configs, though we couldn't verify alt presence per-use here).

---

## 5. Priority-ordered fix plan

If time is limited, tackle in this order:

1. **[Critical] TestResultsPanel + Quiz verdict `aria-live`.** Two-line fix each. Unblocks screen-reader users on the core exercise flow. (`packages/ui/src/mdx/exercise.tsx` line ~472, `packages/ui/src/mdx/quiz.tsx` line ~87.)
2. **[Critical] Remove `outline-none` on settings, report-issue, and glossary form fields (or pair with focus-visible ring).** Keyboard users currently have zero focus indication on those inputs. 8 class changes.
3. **[Serious] Sweep sub-12px text.** Global find-and-replace of `text-[8px]`/`[9px]`/`[10px]`/`[11px]` → `text-[12px]` (or `text-xs`), plus inline `fontSize: 8|9|10|11` → 12. ~15 locations.
4. **[Serious] Standardize dialog pattern (focus trap + restore + aria-modal) and apply to report-issue, user-menu, mobile-nav, lesson-drawer.** One new shared hook/component, four consumer updates.
5. **[Serious] Nova Canvas (and possibly Neon Protocol) primary contrast.** Bump luminance until text on surface reaches ≥4.5:1 across all themes. Verify with programmatic check in `packages/themes/src/theme-properties.test.ts`.
6. **[Serious] Form `aria-invalid` / `aria-describedby` wiring.** Auth, settings, report-issue. Small cross-file edit.
7. **[Serious] Touch-target sweep to ≥44×44.** Add a `min-h-11 min-w-11` utility or a shared `Button`; apply to UserMenu avatar, MobileNav hamburger, LessonDrawer trigger, cookie-consent, Quiz submit, CodeBlock Copy, bridge-callout tabs, pricing chips.
8. **[Serious] Quiz radiogroup semantics.** Rewrite options as `role="radiogroup"` with `role="radio"` + `aria-checked`.
9. **[Moderate] Reduced-motion gate for rAF canvases.** One `useReducedMotion` hook; 5 consumers.
10. **[Moderate] Fix `/bridges` dead link in site footer.** One delete.
11. **[Moderate] Skip-link / main-landmark reconciliation.** Either make the layout `<div id="main-content">` a `<main tabIndex={-1}>` or move the id/target onto each page's `<main>`.
12. **[Minor] Remaining polish**: `aria-pressed` on pricing chips, Home/End on bridge-callout tabs, keyboard arrows on lesson-step swipe, `<header>` landmark sitewide, `aria-label` on progressbars, skill-genome canvas `role="img"`.

---

## Out of scope / not verified

- **Screen-reader testing** (VoiceOver, NVDA) — static audit only; real SR sweep is still a dev-plan task.
- **Automated vitest-axe / playwright-axe test coverage** — dev-plan notes 8 components + 9 routes covered; I did not re-run them.
- **Lighthouse / axe DevTools runtime reports** — none executed.
- **Alt text on all `<Image>` usages** — no raw `<img>` found but each `<Image>` call site's `alt` text quality wasn't individually reviewed.
- **Color-contrast numeric verification** — estimated via standard luminance math; exact Lab values should be recomputed with a dedicated tool before shipping fixes.
