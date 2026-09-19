# UI/UX remediation, 2026-09-18

Implementation follow-up to [the UI/UX audit](ui-ux-audit-2026-09-18.md). Changes are local and have not been deployed. The visual identity, story artwork and lesson sequence are retained.

## Changes

| Audit finding | Change |
| --- | --- |
| UI-01, mobile sign-in crash | Shared scene canvas skips zero-size parents, stops animation while hidden, and observes parent resizing so it can resume when visible. |
| UI-02, overlapping controls | Removed the floating report trigger. Support is available in the footer and lesson toolbar without covering consent or reading. |
| UI-03, clipped report form | Dialog uses viewport gutters and dynamic height, a close button, keyboard focus containment and focus restoration. Closed drafts stay mounted but hidden and inert. Screenshot attachment is a keyboard-accessible button. |
| UI-04, dashboard reflow | Compact stacked statistics on phones, responsive padding and activity rows, and no horizontal scrolling of the main dashboard. |
| UI-05, code proportions | Code examples occupy the full reading column, with explanation above and navigation below. Challenges give the editor three fifths of desktop space. |
| UI-06, mobile task order | Named Instructions and Editor controls, one mounted editor, and navigation after the task. The exercise gate remains in place. |
| UI-07, glossary help | Terms open a visible definition beside the reading position, constrained to the viewport, with dismissal and focus return. Glossary activation no longer remounts the MDX content tree. |
| UI-08, orientation | Lesson title, module and current phase remain visible. The lesson list works on desktop and mobile, with complete titles and an identified current lesson. |
| UI-09, exercise instructions | Removed internal revision notes from five exercises. Indented continuations remain part of their numbered step. Exercise code and grading contracts are unchanged. |
| UI-10, keyboard scrolling | Comparison tables, raw lesson code and instruction code expose named, keyboard-focusable scroll regions. |
| UI-11, readability | Scheme-aware coming-soon text, larger functional labels in settings and dashboard, readable line-number colors in both editor schemes, and larger editor gutters. |
| UI-12, settings navigation | Responsive tab orientation, roving focus, arrow keys, Home/End, and visible page/panel headings. |
| UI-13, loading reflow | Dashboard and pricing placeholders fit narrow viewports and use responsive grids. Pricing placeholders reflect two plans. |
| UI-14, availability | Unreleased module labels say Free at launch, Planned, or Planned finale. |

## Verification

- Production build and TypeScript: passed. Web/UI lint: no errors, with 17 existing warnings.
- Full unit suite: 2,789 passed, 65 skipped. The final focused rerun passed 54 tests.
- Nine regression browser tests: passed. They cover mobile sign-in in both schemes and motion preferences, resizing, consent, dialog bounds/focus/closing, glossary placement, and preserved editor code/results. The gutter test checks the actual rendered font size.
- Public pages: 104 captures across 26 routes, two widths and two schemes, with no uncaught page errors. Authentication redirects are labeled as gates, not authenticated-page coverage.
- All 56 Concept views: 112 desktop/mobile captures, no document overflow or axe findings.
- First lesson: all six phases across six viewport/scheme configurations, plus drawer, mobile editor and real worker states (42 captures). The starter fails and the reference solution passes.
- Authenticated layout fixtures: dashboard and all settings tabs at 320, 390 and 810px; inner dashboard width, tab orientation, keyboard selection and headings asserted. Three additional authenticated support checks verify focus wrapping past the hidden file input and returning to the trigger.
- Loading/error states: ten captures, no document overflow or axe findings.
- The five edited exercise instructions: ten desktop/mobile captures after scrolling the lazy editor into view, no document overflow or axe findings.
- Six fresh mobile auth probes have no canvas errors or retry screen. The local email confirmation state uses an intercepted OTP response; no email was sent. A WebKit mobile lesson smoke check also passes.

The [evidence index](ui-ux-remediation-2026-09-18/evidence.json) retains measurements and remaining axe reports. These reports concern decorative homepage numerals, redundant module-number badges and lesson end markers; they are triaged rather than represented as a zero-violation platform-wide scan. Full local captures are in `test-results/ui-ux-remediation-final/`.

Selected screenshots: [code layout](ui-ux-remediation-2026-09-18/code-layout.png), [mobile challenge](ui-ux-remediation-2026-09-18/challenge-mobile.png), [mobile dashboard](ui-ux-remediation-2026-09-18/dashboard-mobile.png), [glossary](ui-ux-remediation-2026-09-18/glossary-mobile.png), [report dialog](ui-ux-remediation-2026-09-18/report-mobile.png), [settings](ui-ux-remediation-2026-09-18/settings-mobile.png), and [coming-soon contrast](ui-ux-remediation-2026-09-18/coming-soon-light.png).

Reproduce using a local preview production build on port 3118:

```sh
VERCEL_ENV=preview pnpm turbo build --filter=@tensorcraft/web
VERCEL_ENV=preview pnpm --filter @tensorcraft/web start -p 3118
PW_PORT=3118 pnpm exec playwright test e2e/ui-remediation.spec.ts --project=chromium --workers=2 --output=test-results/ui-remediation-playwright
UI_AUDIT_OUT=test-results/ui-ux-remediation-final node scripts/audit-ui-ux-fixtures.mjs --responsive --verify
UI_AUDIT_OUT=test-results/ui-ux-remediation-final node scripts/audit-ui-ux-fixtures.mjs --support --verify
UI_AUDIT_OUT=test-results/ui-ux-remediation-final node scripts/audit-ui-ux-fixtures.mjs --instructions --verify
UI_AUDIT_OUT=test-results/ui-ux-remediation-final node scripts/audit-ui-ux-fixtures.mjs --lessons --verify
```

Run the start command in its own terminal. The fixtures isolate database and external API boundaries; the lesson browser test uses the actual local production bundle.

## Content review provenance

The five instruction edits address unnecessary internal framing and unsupported markup (writing rubric categories 3 and 4). Existing substantive instructions already specify the current APIs and return values. Starter code, solutions and tests were compared with the base revision and remain unchanged. This patch does not claim a new independent content review or learner-outcome evidence.

Source hashes in the content-review manifest are updated only for changed reviewed files, with previous hashes retained and this record linked. Previous rendered-experience evidence describes its original revision; the checks in this record cover the updated lesson shell.

## Limits

Browser dimensions are emulated. Physical phone keyboards, assistive-technology sessions and learner studies remain separate acceptance work. Signed-in layouts use real components with isolated data, so these checks do not claim new production authentication or payment evidence. Passing automated checks does not certify that no design issues remain.
