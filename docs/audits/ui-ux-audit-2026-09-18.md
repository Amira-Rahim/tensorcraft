# Platform UI/UX audit, 18 September 2026

Remediation follow-up: [implemented changes and verification](ui-ux-remediation-2026-09-18.md). This audit records the baseline before those changes.

Tensorcraft has a recognizable visual identity, but the learner experience is not yet A-grade. The illustrations, restrained green palette and terminal typography belong together. The main weaknesses are mobile behavior, the allocation of space in lessons, and support interactions. Three defects were also reproduced on the public production site, including a sign-in crash.

This audit changes no product code. Findings below remain open. It reviews presentation and interaction; it does not replace the content accuracy audit or establish the course's financial return for learners.

These are internal design judgments, not measured usability scores:

| Area | Current assessment | Main reason |
| --- | --- | --- |
| Visual identity | 8/10 | Consistent art, palette and component language; preserve these. |
| Reading presentation | 7.5/10 | Comfortable main prose and useful JS/ML comparisons, with weak contextual help and very small secondary text. |
| Desktop proportions | 6.5/10 | The Code step wastes a column while examples require horizontal scrolling. |
| Lesson interaction | 6.5/10 | Real editor feedback works, but navigation, reference material and task controls compete. |
| Mobile experience | 5/10 | Sign-in failure, overlapping controls, off-screen support panel and dashboard overflow. |
| Accessibility | 6/10, provisional | Several useful foundations exist, but motion preference, keyboard access and contrast have confirmed gaps. This is not a conformance certification. |

Overall design judgment: about 6.5/10. The current product does not justify a claim that there are no design issues.

**What was inspected**

The source baseline was `9904e2348ea93eac2b22b71cb940c642ae6b5a80`. Public routes used the existing local Next production build, served on port 3118 with `VERCEL_ENV=preview`. The initial attempt lacked server-only production environment values; its HTTP 500 captures were discarded and replaced. No secrets were added to the audit.

| Surface | Evidence and scope |
| --- | --- |
| Landing, Learn, Worlds, Deep Orbit map, all four coming-soon worlds, pricing, paywall, comparison, about, legal, blog index, unsubscribe, 404 | 26 route requests at 1440px and 390px in both schemes: 104 captures. Redirect aliases are included in that count. |
| Sign-in and sign-up | Both resolve to `/auth`. Desktop form inspected. Phone captures expose the reduced-motion crash. The email-confirmation state was inspected with an intercepted OTP response; no email was sent. |
| First lesson | 45 captured states across 1440, 1024, 390 and 320px, including all six steps, mobile pane switching, lesson drawer and failed/passed exercise results. The real browser worker rejected the starter and accepted the solution. Seeded steps elsewhere are inspection fixtures, not proof of completion. |
| Entire launched course | All 56 Concept screens rendered at 1440px and 390px: 112 captures using the actual page and lesson components. Checked layout, accessibility output and a visual contact sheet; this was not another sentence-by-sentence content review. |
| Other lesson formats | Briefing and Challenge for eight lessons, at desktop and phone sizes: 32 states. Includes discovery, broken-code openings, flashback, peer review, decisions, transfer work and the final project. |
| Dashboard, settings, onboarding, completion, certificate, purchase return | 60 states at desktop/phone sizes in both schemes. Production components with fixture account data, production CSS and fonts; authentication, data and external API boundaries isolated. No real account changes or payments. |
| Additional responsive and keyboard inspection | Dashboard/settings at 390, 320 and 810px; 15 screen states and three keyboard probes. |
| Loading/error states | Dashboard, settings and pricing loading; lesson and route errors. Ten states across desktop and 320px. |
| Production spot checks | Fresh isolated browser: cookie overlap at 375px, report panel at 320px and reduced-motion sign-in at 320px. All three reproduced. |
| Browser coverage | Chromium for the main audit; one WebKit smoke check of the first lesson at 390px. Physical phone keyboards, touch hardware, Firefox and a complete Safari workflow remain untested. |

Blog has no compiled articles in this checkout, so its empty index was rendered and its article template was source-reviewed. Admin digest controls were source-reviewed only. Third-party Stripe checkout and GitHub authorization screens were not visually certified by this audit. Authenticated fixture screens do not prove live account workflows.

The [evidence index](ui-ux-2026-09-18/evidence.json) records scope, measurements and scan results. Full captures remain in the ignored `test-results/ui-ux-audit/` directory. Selected screenshots below are retained with this report.

**Fix before release**

1. **UI-01: Sign-in crashes on phones with reduced motion. P1, confirmed locally and on production.**

   Open `/auth` in a fresh 390px-wide browser with reduced motion enabled. The form is replaced by “Sign-in failed.” Three local attempts all produced zero `#auth-email` inputs and one retry button. At 320px, production behaved the same. With normal motion, the form remained but the canvas emitted a non-finite `createRadialGradient` error in all three local attempts.

   The desktop illustration is CSS-hidden below `md`, but its canvas still mounts. `SceneCanvas` measures zero dimensions and immediately renders its reduced-motion frame before the intersection observer can mark it invisible. The orbit projection divides by a zero radius. See [auth page](../../apps/web/app/auth/page.tsx#L46), [canvas lifecycle](../../packages/ui/src/effects/scene-canvas.tsx#L91) and [orbit projection](../../packages/ui/src/effects/orbit-canvas.tsx#L179). [Production screenshot](ui-ux-2026-09-18/sign-in-crash.png).

   Skip drawing zero-sized canvases and handle their transition back to a visible size. Decorative art must not take down the sign-in form. Acceptance: direct loads and desktop-to-phone resizing in both schemes and motion preferences retain the form, without canvas errors. Assert the actual form is present; HTTP 200 and a clean axe scan both missed this error screen.

2. **UI-02: The support button covers the cookie refusal action. P1, confirmed locally and on production.**

   At 375px and 390px, the floating Report Issue button overlaps “Essential only.” An ordinary centered click was intercepted; keyboard activation still worked. On production at 375px, a hit test at the refusal button's center returned Report Issue. It also covers prose and lesson-card text elsewhere. [Production screenshot](ui-ux-2026-09-18/consent-overlap.png).

   Both controls occupy the bottom of the screen at the same stacking level, with the report widget rendered later. See [report button](../../apps/web/app/components/report-issue-button.tsx#L243) and [cookie banner](../../apps/web/app/components/cookie-consent.tsx#L68). Move support into reserved space, hide its floating trigger while consent is open, or put it in the mobile navigation. Acceptance: neither consent action nor any focused lesson control is covered at 320, 375 and 390px.

3. **UI-03: The support panel extends outside narrow screens. P1, confirmed locally and on production.**

   The panel is fixed at 360px wide with a 24px right offset. Its left edge is -64px at 320px and -9px at 375px. Labels, input content and the first severity option are clipped. Document-level horizontal-overflow checks do not detect content positioned off the left edge. [Production screenshot](ui-ux-2026-09-18/report-panel-clipped.png). [Source](../../apps/web/app/components/report-issue-button.tsx#L285).

   Constrain the panel to the viewport with safe side margins and appropriate height. Acceptance: all labels, fields and controls fit; the panel remains usable with a short viewport and the on-screen keyboard. The keyboard portion requires a real-device follow-up after the layout fix.

4. **UI-04: Dashboard content requires sideways scrolling on phones. P1, confirmed in the account fixture.**

   At 390px, the dashboard's main area is 506px wide internally. The third statistic is partly outside the viewport. At 320px, the same content exceeds its container by 186px. The document itself reports no overflow because the nested `main` owns the scrollbar. [Screenshot](ui-ux-2026-09-18/dashboard-mobile.png).

   The statistic strip keeps `repeat(3, 1fr)` and 40px horizontal cell padding at every width. The recent-activity grid also uses fixed columns. See [statistics](../../apps/web/app/dashboard/dashboard-view.tsx#L575) and [activity rows](../../apps/web/app/dashboard/dashboard-view.tsx#L825). Stack or deliberately reflow these sections on phones. Acceptance: every statistic and activity description is readable without horizontally scrolling the entire main area. Measure inner containers as well as `document.scrollWidth`.

**Fix in the lesson experience**

5. **UI-05: The desktop Code step allocates space poorly. P2, measured on the real first lesson.**

   At 1440px, each column is 536px wide. The left column contains about 207px of content, while the right contains 1494px of code. Continue sits near the top, before most examples have been read. Long comments need horizontal scrolling while half the page is unused. [Screenshot](ui-ux-2026-09-18/lesson-code-proportions.png). The equal split comes from [LessonShell](../../apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-shell.tsx#L52); the short introduction comes from `StepCode` in `lesson-steps.tsx`.

   Give code the main width, with concise notes alongside or directly above it. Place the next action after the material it advances past. Keep internal code scrolling where line structure matters; the problem is avoidable width restriction, not the existence of code scrolling. Acceptance: the 1024, 1280 and 1440px layouts use space according to the content and keep the next action logically placed.

6. **UI-06: Mobile task navigation has the wrong order. P2, confirmed on the real lesson and other lesson fixtures.**

   “Show task” opens the editor pane, hides the explanation, and leaves Back plus a large disabled Continue control above the task. In the 390px first lesson, that disabled control begins around y=310, while the task pane begins around y=406. The label does not clearly announce an editor. Later lessons repeat the pattern with multiple exercises. [Screenshot](ui-ux-2026-09-18/challenge-mobile.png). [Source](../../apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx#L1165).

   Use clearly named Instructions and Editor views, with access to the relevant hints/reference. Put progression beside the work or after its results. Preserve the existing single editor instance and the successful-result Continue banner; both are useful. Acceptance: switching views preserves typed code and feedback, and learners can reach instructions, run controls and progression without navigating around a disabled action first.

7. **UI-07: Glossary activation does not show contextual help on phones. P2, confirmed on the real lesson.**

   Tapping WebGL highlights the word and its glossary entry, but the definition remains around y=3970 relative to an 844px viewport. There is no popover, disclosure or scroll to the definition. A native `title` tooltip does not provide a dependable touch interaction. The definition is present in the accessible name, so this is specifically a visible-help problem, not missing text for every assistive technology. [Screenshot](ui-ux-2026-09-18/glossary-mobile.png).

   [GlossaryTerm](../../packages/ui/src/mdx/glossary-term.tsx#L19) only calls `onActivate`; [the context](../../apps/web/app/worlds/[slug]/[module]/[lesson]/glossary-context.tsx#L14) only changes state. Show an inline definition or accessible popover at the term. Acceptance: tap, Enter and Space reveal a visible definition without losing the learner's reading position, including when the desktop rail is off-screen.

8. **UI-08: Lesson orientation is too subtle after Briefing. P2, design judgment supported by the rendered screens.**

   Steps 2-6 hide the lesson title visually. The header has six bars and a fraction, while the current phase is a small label farther down. Desktop learners cannot open the mobile-only lesson drawer. After a resume or interruption, the interface makes them reconstruct which lesson and phase they are in. See [ChromeBar](../../apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx#L1270) and the Code screenshot above.

   Keep a compact visible lesson title, module context and current step name. Make the lesson list available on desktop too. Preserve accessible labels and the 24px progress-button hit areas. This is an orientation improvement, not a claim that the existing progress controls lack accessible names.

9. **UI-09: Exercise presentation exposes raw markup and internal revision language. P2, confirmed in the production component.**

   Data Loading begins its exercise with literal `**Contract revision 2026-09-17b:**`. The instruction renderer supports backticks, paragraphs and some lists, but not this bold syntax. The revision note itself reads like an implementation note. [Screenshot](ui-ux-2026-09-18/exercise-instructions.png), [authored instruction](../../packages/content/content/deep-orbit/foundations/exercises/batch-data.yaml#L5), [renderer](../../packages/ui/src/mdx/instruction-text.tsx#L111).

   Remove revision metadata from learner copy and align the authoring format with what the renderer supports. Acceptance: inspect all 65 exercise instructions in the real component, checking emphasis, return contracts, lists and code rather than checking only the YAML text.

**Finish accessibility and consistency work**

10. **UI-10: Some scrollable content has no keyboard entry point. P2, automated finding confirmed in source.**

    The comparison and paywall tables, the Transformers.js raw code block, and several decision/instruction code blocks trigger `scrollable-region-focusable`. Their overflow wrappers have no focusable content or `tabIndex`. See [comparison table](../../apps/web/app/compare/page.tsx#L155), [paywall table](../../apps/web/app/paywall/page.tsx#L140), [instruction code](../../packages/ui/src/mdx/instruction-text.tsx#L142) and the `.lesson-prose pre` rule in `globals.css`.

    Give meaningful scroll regions keyboard access and an accessible name, without making every decorative container tabbable. Acceptance includes keyboard scrolling in Safari/WebKit. Code and table scrolling can be appropriate; [WCAG reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) makes allowances for content that needs two dimensions.

11. **UI-11: Light-mode accents and secondary typography need another pass. P2 for contrast; P3 for the broader type scale.**

    All four coming-soon pages use the dark brand green for meaningful status text in light mode. One measured example is `#6baa8a` on `#ebf0eb`, about 2.35:1 at 14px. The defined light palette is passed to the canvas, but the text still uses the fixed dark-scheme value. [Screenshot](ui-ux-2026-09-18/coming-soon-light.png), [source](../../apps/web/app/worlds/[slug]/coming-soon-stub.tsx#L46). Normal-size text needs 4.5:1 under [WCAG's contrast criterion](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

    Separately, settings labels use 9-11px type while dashboard numbers use 40px and marketing headlines are much larger. The terminal style can survive larger labels and fewer uppercase micro-labels. [Settings screenshot](ui-ux-2026-09-18/settings-type-scale.png). Use a deliberate type scale: comfortable main text, readable secondary labels, and tiny text reserved for decoration. Small text alone is not a WCAG failure. Low-contrast editor line numbers also deserve inspection, especially for debugging; the audit does not count every decorative gutter warning as a separate failure.

12. **UI-12: Settings tabs do not implement the interaction their semantics promise. P2, confirmed in the fixture.**

    At 390/320px, the tabs are horizontal but still announce vertical orientation. ArrowRight leaves focus and selection on Profile. At 810px, ArrowDown also leaves them unchanged. Every tab is in the normal tab sequence. The page also has no h1 or h2; its only settings title is a 9px label hidden on phones. [Source](../../apps/web/app/settings/settings-form.tsx#L476).

    Implement the [WAI tabs keyboard pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) with the correct orientation and focus behavior, or use ordinary navigation without tab semantics. Add a visible page heading. Tab plus Enter can still reach the existing controls; this is not a claim that settings are wholly keyboard-inoperable.

13. **UI-13: Loading screens have independent responsive defects. P2, confirmed in fixtures.**

    At 320px, the dashboard skeleton makes the document 544px wide; pricing makes it 408px wide. Their fixed-width placeholders and desktop grids do not match the eventual mobile layout. [Dashboard screenshot](ui-ux-2026-09-18/dashboard-loading.png), [dashboard source](../../apps/web/app/dashboard/loading.tsx#L29), [pricing source](../../apps/web/app/pricing/loading.tsx#L7).

    Size placeholders within the available width and mirror the loaded layout. Acceptance: test cold/slow loads, not only the settled page, at 320px in both schemes.

14. **UI-14: Coming-soon status labels imply availability. P2, confirmed in the rendered roster.**

    Unreleased worlds display “Online · Free” for their first module, although the page offers a waitlist and the corresponding lessons are not launched. The label uses the same status-board treatment as product availability. This can make a learner expect a working free lesson. The light-mode screenshot above shows the conflict.

    Use “Free at launch” or another accurate availability label. Fictional status and real access should be distinguishable without reading the full page.

**What should stay**

The visual identity does not need replacement. The world illustrations and character art support the story. The dark and light reading surfaces largely work, and the main teaching prose has sensible width and spacing. JavaScript/ML comparisons are recognizable. The first-run dashboard gives a clear first action instead of showing a wall of empty charts. The lesson drawer opens and closes, editor failure/success feedback is visible, and the browser-worker exercise path works. Onboarding offers clear selected states and back navigation. Preserve these while changing layout and interaction.

For the final visual pass, make spacing and type sizes consistent across lessons, dashboard and settings. Consider a shorter pricing hero so the purchase decision appears sooner. That last change is an editorial design preference, not a release blocker. The approved angular component style and neutral pane dividers should remain; colored left accent bars are not needed.

**Order of work and acceptance bar**

| Patch | Scope | Completion evidence |
| --- | --- | --- |
| 1 | UI-01 through UI-04, plus UI-13 | Direct mobile sign-in works with reduced motion; consent and support remain usable; loaded and loading layouts reflow. Recheck the three production defects after deployment. |
| 2 | UI-05 through UI-09 | Rework lesson proportions, mobile task controls, context and glossary help. Walk one complete lesson and the longer decision/project lessons with the real editor. |
| 3 | UI-10 through UI-12 and UI-14 | Keyboard-scrollable content, readable scheme-aware text, working tab semantics and accurate availability labels. |
| 4 | Final visual review and regression coverage | Inspect desktop, tablet and phone captures in both schemes, including first visit, loading, error, long content, failure and success states. Review on physical phones before claiming mobile quality. |

Passing tests alone cannot award 9/10. Close the confirmed findings first, then assess whether a learner can identify the current task, find help, edit/run code and continue without explanation from the team. No outside reviewer needs to be hired to fix the issues identified here.

The existing checks leave specific gaps: `e2e/reflow.spec.ts` marks the authenticated dashboard case `fixme`; document-width assertions miss nested scrolling and left-edge clipping; the landing visual test masks its large hero canvas; and `.github/workflows/visual-regression.yml` has an enforcement default of `0`. A repository-variable override was not inspected, so this report does not assert that the live CI gate is disabled. Extend coverage for these states and inspect screenshots before accepting baselines.

Automated results were triaged. The homepage's faint decorative numerals and the lesson's decorative end marker are not treated as ordinary body-text contrast failures. Lazy editor placeholders are not evidence that the settled editor is inaccessible. Conversely, a zero-violation error screen is not evidence that sign-in works.

**Reproducing the audit**

Use a local production build with the normal public environment configuration. Do not start a dev server over the same `.next` directory while capturing it.

```sh
VERCEL_ENV=preview pnpm --filter @tensorcraft/web start -p 3118
node scripts/audit-ui-ux.mjs
node scripts/audit-ui-ux-lessons.mjs
node scripts/audit-ui-ux-fixtures.mjs
node scripts/audit-ui-ux-fixtures.mjs --lessons
node scripts/audit-ui-ux-fixtures.mjs --rich
node scripts/audit-ui-ux-fixtures.mjs --responsive
node scripts/audit-ui-ux-fixtures.mjs --states
node scripts/audit-ui-ux-interactions.mjs
node scripts/audit-ui-ux-probes.mjs --live
```

The fixture script imports actual page/components and compiled content. It replaces data/auth/API boundaries, Next routing and image/dynamic wrappers, while serving the production CSS and fonts. Its external network is blocked. These are visual inspection fixtures, not an end-to-end substitute for production authentication, payment, GitHub or certificate issuance. The last command's `--live` flag performs only the three public production spot checks described above.
