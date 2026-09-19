# P7: learner experience verification

The changes are deployed and verified. The actual screen-reader walkthrough remains open: the native computer connector failed to start, and its read-only fallback did not return. Keyboard operation, accessible names, live status, table alternatives and axe results are separate evidence, not a claim that VoiceOver was run. The [P9 release record](learning-product-release-2026-09-19.md) contains production verification and the remaining walkthrough.

## Changes and observed failures

- Exercise drafts now save during editing and flush when leaving the editor or page. Refresh restores unfinished work and the learner's code retained before viewing a solution. Help remains recorded. Unreadable versions are preserved until an explicit Reset; changed starters keep the draft and explain the difference. Save failures stay visible.
- Account-specific editor and phase keys prevent one account from restoring another account's work. Server exercise passes and completed lessons restore access to previously reached material. Old unattributed local keys remain guest data; they cannot safely be assigned to an account. This is a migration limitation, not a claim that every old local position moves automatically.
- Phase history preserves Next's router state. The real browser check caught a Back-triggered reload that the component test did not catch. Back and Forward now preserve the document and experiment answer.
- The normalization Concept places its controls and calculation together, with the full TensorFlow.js scaler and neuron implementation in an accessible reference disclosure. The Code phase still exposes that reference.
- The homepage no longer fades its text and buttons in through JavaScript. That fade ignored reduced-motion CSS and briefly failed contrast. Forthcoming-world cards no longer dim their text as a group.
- Lazy editor previews are keyboard-focusable while waiting to enter the viewport. Loaded editors retain their keyboard scrolling behavior. Exercise controls wrap on narrow screens.

## Retained verification

See [screens, results and logs](learning-product-p7-2026-09-19/). The public audit has 208 route/layout states at 1440, 1024, 390 and 320 pixels, each in light and dark. All have zero document overflow and zero applicable axe violations. Eight missing-certificate states initially raised a React development timing error; the production build returns the intended 404 without that error. Both the original development results and the production recheck are retained.

The real first lesson has 55 captures covering every phase at the same eight layouts, editor panes, drawer, failed run and passing run. All have zero page errors, document overflow and applicable axe violations. Authenticated UI fixtures cover returning and first-run dashboard, settings, purchase-return/recovery and other account states. The supplementary responsive matrix has 18 records; loading/error states have 10; rich lesson states have 32. These fixtures isolate data/network boundaries and do not prove real entitlement or account persistence.

Fourteen focused browser tests pass for draft recovery, unknown versions, normalization, sign-in resizing, consent/support, glossary focus, and editor view changes. A separate history regression passes with a same-document marker, a 320 by 350 viewport input probe and 200% root-font reflow. The short viewport approximates reduced space; it is not a physical phone keyboard test. Eighteen experiment flows pass numeric feedback, changed cases, tab restoration, keyboard, scoped axe and enlarged-text reflow. All 56 lessons render at desktop/mobile widths. Web types and 64 final focused unit tests pass.

Visual inspection retained the brand palette, square controls, structural borders and readable body size. The new normalization controls, reference boundary, first-lesson hierarchy and narrow dashboard were inspected as images. Decorative ordinals are excluded from axe only when explicitly marked both decorative and hidden from assistive technology; informative content remains checked.

## Production asset comparison

Both baseline `80a3f029` and the candidate were freshly built with the same dependencies and `VERCEL_ENV=preview`, then served through local Next production servers. Each route used a fresh Chromium context, the same viewport, reduced motion and declined optional analytics. Resource encoded-body bytes measure these runs, not a user latency promise.

| Route | Baseline JavaScript | Candidate JavaScript | Change |
| --- | ---: | ---: | ---: |
| Deep Orbit map | 503,257 B | 506,745 B | +3,488 B (0.69%) |
| First lesson, Concept | 1,120,534 B | 1,144,572 B | +24,038 B (2.15%) |
| Normalization, Concept | 1,120,534 B | 1,144,572 B | +24,038 B (2.15%) |

CSS increased from 14,908 to 15,188 encoded bytes. No model downloads or page errors occurred on these routes. The added route controls, pure numerical interactions, account summaries and draft recovery explain the small increase. The pre-existing lesson bundle is still substantial; these figures do not establish performance on low-end devices. New experiments load no model, and existing worker/model ownership and disposal checks remain part of P9's runtime gate. Raw resource records are retained for a final integrated comparison after P8.

## Remaining boundary

Actual screen-reader operation is unverified. P9 must retain that open item if native control remains unavailable. No learner study, purchase conversion, independent mastery, $70 value or acquisition forecast is inferred from this audit.

## P9 follow-up

The final enlarged-text check now waits for layout before measuring width.
It exposed overflow in objective/recap list items, code headers, decision
tables and long technical words that the earlier timing missed. Wrapping,
explicit item spans and labeled keyboard-scrollable regions fix these cases.
All 18 experiment flows pass the corrected 320px/200% text check. The live
demo also releases input/output tensors after failed readback, validates
probabilities and honors reduced motion during its reveal.

Final JavaScript totals are 510,333 encoded bytes for the world map and
1,145,472 for each checked Concept route; CSS is 15,279 bytes. No model
downloads or page errors occurred. The P9 record compares these with the same
fresh baseline and retains the earlier measurements above as history.

All 17 actual public production tests and six authenticated checks pass after
deployment. Native startup failed again during release verification. The
P9 record therefore retains the actual screen-reader requirement explicitly;
the provisional internal design score is not a substitute for it.
