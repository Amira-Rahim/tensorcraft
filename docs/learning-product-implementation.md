# Learning-product implementation ledger

Owner pricing update, 2026-11-09: Deep Orbit is $79 introductory and $99 regular, paid once. This supersedes earlier instructions to keep checkout at $50 or prepare a later $70 offer. Existing purchase and access commitments remain in force. The price decision does not establish learning outcomes or willingness to pay.

Approved 2026-09-19. Baseline: `80a3f029`. Implements the [development plan](learning-product-development-plan.md); finding IDs refer to the [September 19 audit](audits/final-learning-product-audit-2026-09-19.md).

Release status: deployed and production-smoke verified on 2026-09-19. The
[final release record](audits/learning-product-release-2026-09-19.md) carries
all twelve dispositions, internal scores and evidence. The screen-reader
walkthrough is deferred by owner decision (2026-09-20), so P7 and final P9
acceptance stay provisional.

Owner rulings of 2026-09-20, after an independent review of this release:
sequential module unlock is restored for purchasers (P2's advisory
prerequisites do not stand); the route picker and readiness check render for
purchasers only, never for prospects; the dashboard continuation section is
removed (only Deep Orbit for now; the Neon sample stays on its coming-soon
page); the capstone project files stay public and linked from the free
lesson; price wording is $50 everywhere, with $70 an internal standard only;
screen-reader work is paused.

## Contracts established in P0

- The existing six phase hashes and public lesson URLs remain stable. Concept experiments mount in the Concept reading pane only. Existing editor and completion requirements remain separate.
- Paid access uses the existing entitlement checks. P2 makes prerequisites advisory for entitled learners, while route preference changes recommendations only. Certificates remain completion certificates.
- `world_progress` and exercise attempts are existing client-reported records; review ratings are self-reports; new experiment results are browser checks. None is independent evidence of mastery.
- Each experiment has an explicit content version, bounded local state, a preserved first attempt, later attempts, and recorded help. Resetting controls does not erase first-attempt evidence. Incompatible drafts reset only their own activity, not editor/lesson state.
- Story storage currently uses a beat ID, fixed choice index/label, and first-write semantics. P3 adds explicit versions before any option changes meaning. Existing choices retain their recorded intent; skipped/error states cannot invent a selection.
- Activity analytics use the consent-gated typed registry. Payloads contain IDs, version, phase, attempt number, outcome, and assistance only. No free-text answers/code. Events describe interaction, not measured learning.
- P5 derives labels from existing records first. New activity summaries are account-scoped, versioned, exportable/deletable, and honestly labeled by source. Old records without assistance/version stay unknown.
- All migrations follow the repository conventions. Schema ships before dependent code; rollback retains learner data. Local verification is distinct from deployed verification.
- The existing review manifest remains the content inventory. Changed content invalidates affected checks until reviewed. Independent review, learner studies, price validation and acquisition evidence remain later stages.

## Coverage and current status

| Patch | Findings | Status | Required deliverables |
| --- | --- | --- | --- |
| P0 | All, especially F12 | Complete | Baseline and contracts above; traceability and verification requirements below |
| P1 | F02/F03/F10 | Complete; deployed | Numerical transforms; prediction and changed packet; assistance and persistence; Concept integration; actual production public flows pass. |
| P2 | F01/F02/F04 | Complete; deployed; two outcomes reversed 2026-09-20 | First-session revision/timing; honest offer/project preview; reversible ML routes (purchasers only since 2026-09-20); readiness check; prerequisite recaps; sequential module unlock restored by owner ruling; real account preference and paid-access checks pass. |
| P3 | F07/F08/F09 | Complete; deployed | Five character arcs; two priority revisions; six versioned decisions; current/historical/combined branch matrix and actual authenticated first-write persistence pass. |
| P4 | F03/F05 | Complete; deployed | Seven checked interactions; progressive practice; valid alternatives/misconception tests; final 18 renderer flows, exercises and public experiment smoke pass. |
| P5 | F01/F06/F12 | Complete; deployed | Five evidence stages; privacy and owner boundaries; real cross-browser account summary; fresh external run; production folder/GitHub destination preview pass. |
| P6 | F05/F07/F09 | Complete | Full 56-lesson/65-exercise and supporting-surface review; current hashes; criterion-level internal content A. Human evidence remains E1. |
| P7 | F10 | Deployed changes verified; actual screen-reader check open | Full layout/phase/recovery, enlarged-text and asset checks pass. Native AT operation unavailable; required walkthrough retained in release record. |
| P8 | F11 | Complete; deployed; dashboard continuation removed 2026-09-20 | Checked Neon sample, five-world scope matrix and ending boundary; eight public layouts pass. The completion-gated dashboard continuation was removed by owner ruling (only Deep Orbit for now). |
| P9 | All | Release verified; final acceptance awaits P7 AT | Final suites, runtime/export/RLS, internal scoring, schema-first deployment, real public/authenticated smoke and measurement handoff complete. Mandatory actual screen-reader evidence remains open. |
| E1 | F05/F07/F12 | Later, after internal A | Independent reviewers and observed pre/post/transfer/delayed learning; no recruitment yet |
| E2 | F01/F12 | Later evidence | Assess the $79 introductory and $99 regular offer using actual purchase/refund/support/application evidence. Pricing approved 2026-11-09. |
| E3 | F11/F12 | Later | Cohort/channel economics, retention and repeat-theme purchases; unique-user accounting |

## Verification record

Each completed patch adds commands, environment, result, changed surfaces, evidence paths, and limitations here. A component fixture is not an authenticated route test; a passing test is not an internal editorial grade; an internal grade is not independent learner evidence.

P0 source inspection: lesson renderer and visibility sets; existing progress, certificates and profile preferences; story choice client/RPC contract; analytics consent wrapper; activity components; review manifest/checker; migration conventions. No schema or entitlement changes in P0.

### P1: channel layout experiment

Implemented the worked packet, prediction, selectable channel, reshape/transpose grids and trace, equivalent TFJS code, explanation, and changed rectangular packet. Both dimensions and values matter. First/latest attempt outcomes, help use, and bounded attempts survive tab refresh/remount. Returning to the example records reference use; resetting controls cannot erase assistance or first-attempt evidence. No lesson credit, database writes, model download, or paid-access changes.

Registered once in the Concept pane. Added the matching objective and replaced the long CSS-grid comparison with the actual axis contract. Read the complete shapes lesson and its unchanged exercise contract in context; the existing recap, reference code, hints and epilogue remain consistent. Updated the learning inventory to record concept experiments separately from exercises.

Verification on local Next.js at port 3118, Chromium, installed TFJS CPU:

- Five focused unit suites: 86 tests passed, covering numeric/component behavior, renderer, lesson navigation and analytics. Three content/partition suites: 11 tests passed. The eight new numeric/component tests were rerun after final state changes and pass.
- `pnpm --filter @tensorcraft/content build:content` and `pnpm --filter @tensorcraft/web typecheck` passed.
- `PW_PORT=3118 pnpm exec playwright test e2e/channel-experiment.spec.ts --project=chromium --workers=1 --reporter=line`: three real-page flows passed at 1440 dark, 390 light, and 320 dark. Checks include wrong/correct operation, values, refresh, phase exit/re-entry, single mount, no completion credit, glossary/resize persistence, no page errors, and scoped axe checks.
- 320px at 200% text exposed crowded table headings during visual inspection. Fixed with a labeled keyboard-scrollable table region and wrapping prose; keyboard scrolling and page reflow pass. Normal-size 320px tables fit without horizontal scrolling. Screens inspected and retained in [P1 evidence](audits/learning-product-p1-2026-09-19/).
- Real TFJS cross-checks cover both authored packets and an additional rectangular packet; no retained tensors. Wrong values and reshape with correct target dimensions fail the follow-up.

Limits: local implementation evidence, not observed learner attainment or production deployment. Whole-platform screen-reader/performance review remains P7/P9. First-session timing belongs to P2, not this isolated experiment. During verification a first-time phase deep link correctly clamped to Briefing; the browser test now uses actual Continue navigation. An interrupted test left its owned dev server unresponsive; it was restarted before the passing run.

### P2: opening path, course promise and ML routes

Revised both opening lessons around a packet, explicit axis meanings and an early channel experiment. Kept cleanup beside the first allocation. Optional references remain available and expand in the Code phase. The first lesson links to the experiment without requiring challenge completion. The full free module still carries its authored duration; the 10–15 minute first-result target is not a course-duration claim.

Added an optional ML route and four-question readiness check. Account choices persist separately from JavaScript seniority; guests use browser storage. Conflicting guest preferences require an explicit adoption. Save failures preserve the previous selection. Returning learners keep their lesson phase and actual work takes priority over recommendations. The route no longer sets a lesson's opening phase (revised 2026-09-20): every learner meets the scene, and only an explicit phase link skips ahead. Purchased modules were browseable across lesson routes, world map, drawer and dashboard until 2026-09-20, when the owner restored sequential unlock: a paid module opens after the previous one is complete, on the lesson route, the world map, the drawer and the dashboard. Paid gates and certificate requirements stay intact. Mid-course recaps use module-start knowledge and do not invent decisions; they sit inside the Briefing of a module's first lesson, after the scene, and nowhere else (revised 2026-09-20). Updated onboarding's old JavaScript/math-default wording.

The offer now names practical capabilities and previews a real room-project failure, with supplied files, prerequisites, local setup and effort limits. Reproduced the external project in a clean directory, then built the preview from its recorded validation result with source, plan and artifact hash checks. The fixed five-epoch fixture is explicitly a maintainer integration demonstration. Launch price remains $50. The project brief closes the world page in a collapsed disclosure below the module map; course preferences (route and readiness check) render inside it for purchasers only, and prospects never see them (owner, 2026-09-20). They previously sat between the header and the film, which put a settings panel in front of the story.

Verification:

- Eight focused suites: 100 tests passed for preference state, API validation, route recommendation, navigation and dashboard regression. Two further suites: 28 tests passed for actual server lesson access and onboarding. Five final integration/partition suites: 23 tests passed. Privacy/content checks: 10 tests passed. Tests overlap; these counts are not additive unique coverage.
- `pnpm test:rls`: additive migration 062 and account isolation passed against isolated PostgreSQL. Checks cover self-edit, cross-account denial, invalid route rejection, nullable reset, unchanged purchase/progress rows. Production migration remains P9.
- Content build, web/API typechecks passed. Focused web lint: no errors; existing unrelated warnings remain. Added hook dependency warning was fixed.
- `REVIEW_MODULE=foundations node scripts/check-reviewed-examples.mjs`: actual authored packet/rank/cleanup, reshape/archive and other foundation examples passed using TFJS CPU, with tensor counts restored.
- `node scripts/check-room-project.mjs`: clean install, untouched-starter refusal, fit/export/reload, validation/test comparison, overlap/leakage rejection, browser parity, invalid inputs and missing/corrupt artifacts passed. `build-room-project-preview.mjs` checked that actual run before writing public evidence.
- Five Chromium real-page flows passed at 1440 dark, 390 light and 320 dark. They check the free direct entry, wrong/correct transform, changed packet, reference/code phase, glossary interaction, refresh, browser preference, guest paywall, no completion credit, reflow and scoped axe. Access tests for authenticated purchase states are server-route tests with explicit boundary mocks, not a production login claim.
- Visual review found artwork bleeding through light-mode cards; opaque surfaces fixed it. Retained reviewed screenshots in [P2 evidence](audits/learning-product-p2-2026-09-19/).
- A separate agent-maintainer walkthrough started at the world overview, read the first Concept, used its experiment link, deliberately predicted the wrong channel sequence, inspected both transforms and passed the changed packet. Elapsed 75.452 seconds includes agent reading and tool roundtrips. The [timing record](audits/learning-product-p2-2026-09-19/maintainer-walkthrough.json) explicitly excludes any inference about first-time human reading speed or the 10–15 minute target. E1 observes human timing later.

Read the complete revised lessons and both existing exercise contracts, hints, solutions and grading feedback. Corrected the readback explanation to distinguish returning a typed array from copying with Array.from, and described reshape's logical order without claiming a universal physical memory layout. Source-level review and local execution support these changes; whole-course integration review remains P6.

### P3: character continuity and consequential decisions

Revised the first investigation and drift decisions with known resource costs, owners, limits and later work. Removed their countdowns. Added versioned storage and immutable historical text so earlier choices retain their meaning. Strengthened all five character arcs through hypothesis revision, delegated responsibility, new engineering boundaries and ARIA's useful but limited archive/fallback role. Kept permanent loss and the final unanswered record.

The [story review](audits/learning-product-story-2026-09-19.md) records the arc map, six-decision contract, compatibility behavior and limits. [Retained evidence](audits/learning-product-p3-2026-09-19/) includes current/historical branch outcomes and desktop/mobile decision screens. Local PostgreSQL checks pass across all six beats and two accounts. Three focused client suites pass 31 tests; web typecheck passes. All 56 rendered lessons pass at two widths; 24 current, eight historical and four combined handovers pass with explicit mocked transport. Three decision controls pass scoped axe checks at both widths. The complete revised-course editorial grade and production migration remain P6/P9.

### P4: numerical experiments and practice progression

All seven interaction objectives now have implementations. Added normalization and threshold experiments plus learning-rate, FFT-window, attention and cache controls. Each has prediction, inspectable calculations, help, reset and a changed case. Frozen threshold policy survives resets; first attempts and assistance remain explicit. Mapped twelve capabilities to existing later work without claiming independent transfer.

The [practice review](audits/learning-product-practice-2026-09-19.md) records numerical boundaries, contextual alignment, fixes and verification. Sixteen numerical/component tests, 21 worker boundary/alternative tests, all 65 exercise reference/starter/misconception checks, 27 renderer/content tests, content build, web typecheck and focused lint pass. Eighteen renderer-fixture interaction flows and two actual free-lesson browser flows pass. [Screens and outcomes](audits/learning-product-p4-2026-09-19/) are retained. Whole-course editorial/design integration and production verification remain P6/P7/P9.

### P5: system evidence and external run records

Added the five-stage system view to both dashboard states, with links to browser exercise attempts, new experiment summaries and self-rated reviews. Lesson completion is counted separately. Historical attempts with missing assistance remain unknown; a failed old attempt is not relabeled as completion. Data/evaluation milestones connect the early brief to the capstone. The run form records a baseline/model comparison, split/scaler rationale and observed artifact behavior. Detailed answers stay local or in an explicit download. A baseline win is valid; form completeness does not grade a rationale or certify independent application.

Migration 064 adds own-account read access and a bounded RPC for compact practice records. Stable stream IDs deduplicate retries, preserve first recorded outcomes and aggregate separate devices. The expected owner accompanies every write so a stale request cannot use a new account's token to move a record. Guest adoption is explicit. Account changes remount scoped drafts and hide old server-owned lesson content until refreshed. Both tables are included in privacy export and cascade on account deletion. Database types are generated from the actual migrated test schema through the installed generator, not hand-authored.

Verification on 2026-09-19:

- Isolated PostgreSQL: all existing RLS and new activity assertions pass, including stale retries, contradictory outcomes, immutable first attempts, multiple streams, two accounts, direct-write denial, catalog/version limits and deletion. This is not production persistence evidence.
- Twelve focused final tests pass for summary validation, account identity changes, synchronization/retry, provenance and project reports. Earlier integration suites also cover dashboard queries, API privacy export, lesson navigation and renderer partitioning. Web/API typechecks and focused web lint pass.
- All 56 lessons render at desktop/mobile widths without page errors or overflow. Seven actual Next.js free-lesson flows pass after persistence integration: opening route, channel experiment and normalization, with phase/remount/reload behavior and no completion credit.
- Three explicit transport-fixture browser flows pass at 1440 dark, 390 light and 320 dark, including failed-save retry, account switching, project download and scoped axe. Screens were visually inspected and are retained in [P5 evidence](audits/learning-product-p5-2026-09-19/). The synthetic form values test recording; they are not project results.
- The existing decision/project browser check still passes with the run form present. The clean external project run and hash-checked published preview are the P2 evidence; this patch changes no project source or training artifact. Production folder/GitHub verification remains P9.

Limits: summary provenance is browser-reported or learner-reported, not tamper-proof grading. Local controls do not synchronize across devices. A duplicated browser tab can clone its local stream identity; incompatible concurrent submissions fail visibly and preserve the account record rather than silently overwrite it. The dashboard reads a bounded recent history and says so. Local type generation also exposed a historical `issues.status` field absent from repository migrations; production schema comparison remains an explicit P9 check. No independent attainment claim is made.

### P6: integrated source review

The [integrated review](audits/learning-product-integrated-review-2026-09-19.md) records all 56 complete lessons, 65 exercises, eleven module metadata files, and the supporting glossary/project/entry surfaces. Its per-lesson JSON identifies mechanism, prerequisites, misconception, practice and reuse with reviewed source hashes. Corrections and criterion-level internal source scores are recorded there; independent results are not inferred.

All 65 exercise suites pass, the later rehearsal regression passes 17 cases, selected authored-code groups pass across the course, and all 56 lessons render at both widths. The content gate caught a hidden retrieval input contract introduced by copyediting; it was fixed and the gate passes. Retained checks are in [P6 evidence](audits/learning-product-p6-2026-09-19/). New whole-experience review, continuation placement, final verification and production deployment remain P7-P9.

### P7: learner experience and recovery

The [experience review](audits/learning-product-experience-2026-09-19.md) records responsive and state coverage, recovered draft and history defects, keyboard fixes, screenshots and the fresh production asset comparison. Actual screen-reader operation remains open because the native connector is unavailable. This is carried into P9 explicitly; it does not prevent implementing the independent continuation surface in P8.

### P8: checked continuation

The [continuation review](audits/learning-product-continuation-2026-09-19.md) covers the checked vision sample, all-five-world comparison, separate future release requirements, and the ending/dashboard boundary. Numerical and eight production-build browser flows pass. P8 enlarged-text checks also found and fixed navigation, waitlist and table wrapping missed by the normal-size P7 matrix.

### P9: integrated release and handoff

The [release record](audits/learning-product-release-2026-09-19.md) supersedes
earlier patch notes that say production verification is pending. It retains
the full commands/results, source and deployment identifiers, every finding's
disposition, criterion-level scores, known limits and the exact AT walkthrough.

Final checks: 2,885 unit tests passed with 65 skipped; all 65 exercise suites
passed; 200 browser tests passed with 34 skipped. The separate 67-flow visual
and affected-route run includes all 32 visual tests. Types, lint without
errors, formatting, fresh build, real-database RLS, all 56 rendered lessons,
18 experiment flows, complete fixture story branches, real CPU/WASM/WebGL/
WebGPU and converter/cache checks, and a fresh external project passed.
Counts from overlapping suites are not additive.

Late checks repaired actual 200% text overflow and a demo tensor leak. The
Vercel migration gate moved to the configured project root, private upload
exclusions were made explicit, and Sentry build-token pass-through was fixed.
The final cloud build passed the 65/65 migration gate and source-map upload.

Migrations 062-065, Fly API v33 and the final READY Vercel deployment are live.
All 17 public production tests and six authenticated checks passed. The latter
used an approved temporary zero-dollar QA entitlement and explicit finale
fixture. Actual route preferences, cross-browser activity, versioned story
save, folder selection, GitHub destination preview and continuation were
checked. QA changes were removed, original account state independently read
back, and the temporary session revoked. No new GitHub publication or live
charge was required for this check.

The [measurement handoff](learning-study/learning-product-handoff.md) and
updated task forms prepare the new activity/story observations without
recruitment. Internal content categories meet A. The design score is
provisional because actual screen-reader operation could not be observed;
the walkthrough is deferred by owner decision (2026-09-20). E1-E3 stay separate and unproven.
