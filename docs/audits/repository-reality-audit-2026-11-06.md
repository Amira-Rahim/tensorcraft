# Repository reality audit, November 6, 2026

The audit found stale public product descriptions, a learner download that differs from its maintained source, obsolete lesson-layout machinery, dead UI and query code, and verification tools that no longer test what their names promise. The most useful first cleanup is the public metadata, runtime-lab package, visual baseline workflow, and retired dashboard/runner code.

This report records 38 findings: 9 web/UI findings, 12 backend/tooling findings, 6 content findings, and 11 cross-repository findings. The initially failing evaluation work was repaired concurrently and is recorded as resolved, outside that count. The audit changed documentation only. It did not remove code, alter the existing work, contact learner accounts, send messages, deploy, or commit.

## Scope and coverage

The final input inventory contains **3,635 repository entries: 2,249 text files, 1,385 binary files, and one migration-directory symlink**, totaling 432,246,329 bytes. It covers all tracked files and all untracked files that Git does not ignore. One new evaluation test appeared during the audit and received coverage. Twelve existing file hashes changed as result-inspection implementation continued.

| Scope | Entries | Detailed report |
| --- | ---: | --- |
| Web application, UI package, world package | 771 | [Web and UI](repository-reality-2026-11-06/web-ui.md) |
| API, shared packages, database, configuration, bridges, scripts | 422 | [Backend and tooling](repository-reality-2026-11-06/backend-tooling.md) |
| Content, content tooling, content tests | 707 | [Content](repository-reality-2026-11-06/content.md) |
| Documentation, E2E, root configuration, workflows, agent files | 1,735 | Findings R01-R11 below |

[The file ledger](repository-reality-2026-11-06/file-coverage.csv) records a row for every input entry, including its final hash, methods, review scope, and related finding IDs. [Structured evidence](repository-reality-2026-11-06/evidence.json) records cross-repository checks and validation results.

Every regular file received a complete byte read and hash. Text received full-content scans appropriate to its role. Source, manifests, lesson identities, imports, exports, CSS selectors, test assertions, and product contracts received deeper targeted review. All 275 lessons parsed as MDX, all 630 content records parsed, and all 900 exercise code fields passed syntax checks. The content report records the limits of the static API checks.

Binary review covered signatures, structure, hashes, duplicate groups, archive integrity, model manifests/shards, and image/video metadata where applicable. It did not visually inspect every historical screenshot. The symlink resolves to the maintained migration directory and is not a duplicate migration tree.

The inventory excludes ignored dependencies, `.git` objects, build caches/output, private environment files, and private study records. These are not maintained application source. Audit deliverables are outputs, separate from the input inventory. Full-file automated coverage does not establish a fresh sentence-by-sentence technical/story review of all 275 lessons or a browser walkthrough of every route.

## Product baseline

The source establishes one launched world, Deep Orbit: 11 modules, 56 lessons, 65 exercises, five free lessons without an account, and a one-time $50 purchase. Four other worlds contain intentional draft source. Their existence does not establish released routes or readiness for sale. The current lesson flow has five phases. Result-inspection work extends the existing local saved-run slices and remained in progress during this audit.

Sources: [launch scope](../launch-scope.md), [README](../../README.md), [constants](../../packages/shared/src/constants.ts), [lesson phases](../../apps/web/lib/lesson-phases.ts), and [the current pilot status](../superpowers/plans/2026-11-02-learning-evidence-pilot.md).

## Priority findings

| ID | Priority | Finding | Recommended disposition |
| --- | --- | --- | --- |
| W01 | P1 | Public `llms.txt` and plugin metadata still advertise the five-world launch and wrong course counts | Derive public claims from launched content |
| W03 | P1 | Runtime-lab ZIP differs from its explicit source map in three files | Rebuild and validate the actual download |
| R01 | P1 | Visual baseline mint and enforcement reject a complete screenshot set | Count expected screenshots or compare explicit names |
| W08 | P2 | Model-contract documentation contradicts shipped future-world model shapes/architectures | Separate actual artifact contracts from target designs |
| C02 | P2 | A retired two-column transform still reorders 27 live lessons | Review authored order, then retire the transform and its old tests |
| C01 | P2 | Writing gate skips every live exercise instruction body | Parse YAML prose fields, including block scalars |
| B05 | P2 | Digest reconciliation truncates Stripe and compares unlike populations | Reconcile matching session identities with pagination |
| R03 | P2 | Production RLS probe reports HTTP/API errors as successful denial | Validate status and response shape |
| R02 | P2 | Normal typecheck passes while the broader test program has 39 errors in 23 files | Repair test type drift and add an explicit test-type check |
| B02 | P2 | README backfill sends stored encrypted credentials as bearer tokens | Archive or adapt the tool before reuse |
| B03 | P2 | Bridges package declares an ESM file its build never emits | Bundle and test the packed package |
| R07 | P2 | Deployment runbooks contradict required startup configuration | Reconcile against `env.ts` and deployed middleware contracts |

P1 means a direct product claim, delivered artifact, or verification path should receive early attention. P2 covers active maintenance and correctness gaps. P3 covers smaller cleanup, latent future-world problems, and decisions requiring usage confirmation. The detailed reports provide evidence and limitations for each finding.

## Remaining scoped findings

| ID | Priority | Finding |
| --- | --- | --- |
| W02 | P2 | AI-plugin metadata points its OpenAPI declaration at an absent web health route |
| W04 | P2 | The active runner retains 463 unused lines of the old `TF_MOCK` |
| W05 | P2 | A retired dashboard component, button, and test island retain 645 lines |
| W06 | P2 | Retired tensor, investigation, ticker, and journey CSS has no markup consumers |
| W07 | P3 | Two progress lookup functions have no consumers; another lookup serves tests only |
| W09 | P3 | Smaller unused imports, locals, props, and a duplicate MDX registry remain |
| B01 | P2 | Runnable browser audit scripts still assert the old six-phase flow |
| B04 | P3 | Bridges README claims framework variants the types reject |
| B06 | P3 | Legacy GitHub push and the progress API have no current repository callers |
| B07 | P3 | Seven production exports have no runtime consumer; shutdown flushing is unconnected |
| B08 | P3 | One-release rebrand shims and their tests remain months after the recorded removal gate |
| B09 | P3 | Current comments misdescribe waitlists, webhook writes, encryption, and email behavior |
| B10 | P3 | Newsletter tool defaults to retired port 8787 instead of the current API origin |
| B11 | P3 | Art upload MIME labels JPEG reference bytes as PNG |
| B12 | P3 | Certificate comments promise secret-rotation verification that no read path performs |
| C03 | P2, future release | Three Neon exercise parent IDs silently resolve to valid Deep Orbit slugs |
| C04 | P3 | Blog link gate validates source filenames and authored worlds instead of reachable routes |
| C05 | P3 | Three private content query wrappers have no consumers |
| C06 | P3 | Content comments and fixtures describe superseded titles, sizes, durations, and gate scope |

These are summarized here to keep the complete inventory navigable. Exact paths, line references, counterexamples, and retention cautions live in the linked scoped reports.

## Cross-repository findings

### R01. Visual baseline accounting prevents a complete mint or enforcement

Priority P1. Confirmed by test discovery and screenshot call sites.

The workflow assumes one screenshot per test at [visual-regression.yml:136](../../.github/workflows/visual-regression.yml#L136). It uses discovered test count as expected PNG count in both the mint check at line 163 and enforcement check at line 318.

Playwright discovers 36 visual tests. The two Concept cases in [lesson.spec.ts:84](../../e2e/visual/lesson.spec.ts#L84) each take a second screenshot after tensor creation. A complete run therefore produces 38 PNGs. The 38 committed Darwin images independently match that structure. Both guards reject 38 files against the expected 36.

The repository default enforcement switch remains off and there are zero Linux baselines. That is an explicitly documented state. The new defect is that the prescribed activation path cannot accept a complete set. Compare an explicit expected filename set, or split each screenshot into a separate test, before minting and reviewing Linux baselines.

### R02. Test types have drifted outside the normal workspace typecheck

Priority P2. Confirmed by execution.

`pnpm typecheck` passes 10 tasks. A separate `pnpm --filter @tensorcraft/web exec tsc --noEmit -p ../../tsconfig.json` reports 39 diagnostics across 23 files. [The root config](../../tsconfig.json) includes the broader test program, while package configs exclude many tests and no root command runs that program.

Examples include stale Hono context/response types, spread arguments in payment mocks, unused `@ts-expect-error` annotations in particle-field tests, optional Shiki theme fields accessed without narrowing, and missing declarations for script imports. Some root diagnostics also reflect dependency/type resolution, so each requires a targeted disposition. This does not establish a production application type failure. The exact diagnostics are retained in structured evidence.

Repair meaningful test types, add declarations or explicit boundaries for imported scripts, and expose a named test-type command. Keep the normal application typecheck distinct so its existing success remains interpretable.

### R03. The production RLS probe treats broken checks as successful denial

Priority P2. Confirmed by source control flow.

[synthetic-checks.yml:76-85](../../.github/workflows/synthetic-checks.yml#L76) calls curl without checking the HTTP status and decides denial by the absence of the literal `"id"` in the response body. A 401 invalid-key JSON response, 404 route response, or JSON error without that field prints `denied` and leaves the job successful.

The earlier readiness probe uses different credentials and does not validate this anonymous request. Parse the anonymous response, distinguish expected policy denial/empty results from invalid configuration or API failures, and fail when the probe cannot establish its intended invariant. This finding concerns false assurance in the probe, not evidence of a live data leak. The isolated local RLS suite passed.

### R04. The deployment-drift check does not check the web deployment it describes

Priority P2. Confirmed scope mismatch.

[synthetic-checks.yml:90-112](../../.github/workflows/synthetic-checks.yml#L90) explains a Vercel deployment stall, names the step `main has been deployed`, then reads only successful `deploy-api.yml` workflow SHAs. No web deployment identity is queried. A stale web app and current API satisfy the implemented comparison.

Name the API-only check explicitly and add a web build/revision identity check if the intended invariant includes both deployments. The current source only warns about API lag; this audit did not inspect production deployment state.

### R05. The onboarding browser test passes for an HTTP 500 error page

Priority P2. Reproduced in an isolated browser fixture.

[onboarding.spec.ts:4-9](../../e2e/onboarding.spec.ts#L4) is named `renders onboarding welcome step` but only waits for a URL containing `/onboarding` or `/auth`. The initial requested path already satisfies that expression.

An isolated local server returned status 500 with `Internal server error` as its only heading. The exact existing `goto` and `waitForURL` sequence passed. This did not contact the actual app or an external service.

Assert the guest redirect and recognizable auth content separately. Add an authenticated fixture for the actual welcome/persistence flow, with response, content, and state assertions. Keep the test name aligned with what it establishes.

### R06. Review-launcher tests are outside CI's test inventory

Priority P2. Confirmed configuration gap.

[review.test.mjs](../../scripts/review.test.mjs) contains eight Node tests. Root Vitest includes only `*.test.ts` and `*.test.tsx`. [package.json:23](../../package.json#L23) provides `review:check`, but no workflow invokes it. All eight tests passed when run separately in this audit.

The review launcher is now the README's primary entry path. Add its existing command to the appropriate CI checks, rather than assuming the root unit command includes it. Retain its real network/environment isolation assertions.

### R07. Operational documentation contradicts startup and rate-limit behavior

Priority P2. Confirmed against current implementation.

[deployment-guide.md:41-44](../deployment-guide.md#L41) labels `APP_URL` optional and says the API boots without Redis. Line 78 labels `KIT_WEBHOOK_SECRET` optional. [env.ts:31-46](../../apps/api/src/env.ts#L31) requires all four values in production and throws before serving when they are absent.

[infrastructure.md:136-149](../infrastructure.md#L136) repeats the boot/degradation claim and describes sliding-window per-IP limiting. The current limiter uses a fixed window and bearer-token hash before IP fallback. [deployment-guide.md:228-233](../deployment-guide.md#L228) also claims an in-memory fallback that the middleware does not implement. Its in-process blocked-subject cache is a different behavior.

These instructions can send an operator toward the wrong diagnosis. Reconcile the environment tables, rate-limit explanation, exemption list, and local versus production distinctions against source. Infrastructure sizing/topology should identify targets separately from checked configuration: the document says 3-5 API instances while `fly.toml` declares a minimum of two, and the source does not establish the claimed live machine count.

### R08. Living architecture/specification sections retain obsolete implementation contracts

Priority P2. Confirmed, with historical exceptions separated.

[architecture.md:141-142](../architecture.md#L141) lists nonexistent `GET/PUT /api/profiles/me` routes. Current profile routes are `PATCH /:userId`, `GET /export`, and `POST /delete`. Lines 212-226 describe a logger waiting for Sentry integration and old test-framework versions; the implementation already calls Sentry and the lock pins newer tools.

[tech-spec.md:325-343](../tech-spec.md#L325) describes JSON exercises under a nonexistent directory, Python starter filenames, and grading inside Sandpack. Current exercises are YAML under world/module folders, use JavaScript strings, and run through a worker with real TensorFlow.js and explicit service substitutes. Lines 723-726 still describe five-step onboarding with world selection, a World settings tab, the removed paywall notice banner, and a verifiable certificate claim. The implementation and certificate share page establish narrower contracts.

The broad scope warnings in PRD/product-plan/dev-plan correctly identify the superseded five-world launch. Those historical passages were not counted as fresh bugs merely for remaining in place. The actionable problem is current-looking implementation reference mixed with proposals. Split implemented reference from retained design, link each to its source, and remove false operational guarantees.

### R09. The root roadmap still asks for completed CSS work

Priority P3. Confirmed source/status mismatch.

[ROADMAP.md:68-70](../../ROADMAP.md#L68) lists moving shared prose defaults into a CSS cascade layer as pending work. [globals.css:194](../../apps/web/app/globals.css#L194), its responsive rules, and its list rules already put those defaults in `@layer components`. Existing source tests preserve the contract.

Mark the implementation portion complete and retain the requested all-lesson/browser review as a separate evidence task. The roadmap's broad statement that purchaser access controls remain owner decisions should also link the September 20 ruling already recorded in the implementation ledger. A later decision about recommendations can remain open without implying that current enforcement is unspecified.

### R10. Retention email drafts still carry obsolete product claims

Priority P3. Confirmed existing backlog item; automations remain explicitly uncreated.

[email-retention-sequences.md:20-25](../email-retention-sequences.md#L20) promises a fifteen-minute first lesson and 55 bridges. Current lesson metadata says eight minutes, and the canonical bridge registry has 51 entries. Neither estimate is independent observed learner timing. The roadmap/backlog already records the discrepancy.

Refresh those drafts before creating automations. Keep prepared copy and configured/live automation status explicit. This audit did not inspect Kit configuration or send any email.

### R11. CI documentation still teaches the old mock and a command the hook does not run

Priority P3. Confirmed documentation drift.

[ci-cd.md:91-95](../ci-cd.md#L91) says exercise validation uses the same TensorFlow mock as the editor. [validate-exercises.mjs:60](../../scripts/validate-exercises.mjs#L60) loads real TensorFlow.js; the worker also runs the real runtime with controlled external-service shims. Distinguish the active shims from the unused mock identified in W04.

The pre-push instructions at [ci-cd.md:147-148](../ci-cd.md#L147) say `pnpm turbo test --continue=never`; the actual hook runs `pnpm test`. The Turbo configuration has no test task. Document the actual root Vitest command and the separately invoked review, exercise, runtime-corpus, and browser checks. The elapsed-time estimates are historical observations, not current guarantees.

## Removal candidates and retention decisions

The strongest deletion candidates are the 463-line `TF_MOCK`, the 645-line retired dashboard island, the three unused content query wrappers, two unused web progress lookups, and individually verified unused selectors/locals. Their evidence is stronger than a filename search: it includes compiler results and repository-wide consumer checks. Removing them still warrants the focused checks for their area.

The old layout transform is active behavior, so preserve deliberate authored reading order before retiring it. Mounted endpoints, one-release compatibility shims, and the backfill tool need a usage/retention decision. Repository absence cannot establish absence of external or deployed old-client use.

Retain intentional coming-soon content, dynamically resolved artwork, lesson-phase/storage migrations, historical story decisions, data export/erasure handling for retired features, and append-only schema history. Quiz and KeyTakeaways still have future-world consumers. In-progress evaluation modules are active work. The three Deep Scan model directories serve different contracts and are not duplicate deletion candidates merely because their names overlap.

## Historical artifacts and optional hygiene

The docs tree contains 1,589 entries and 317,469,684 bytes. Across repository binaries, 112 exact-duplicate groups retain 54,574,223 duplicate bytes, about 52.0 MiB. Many are intentional screenshots of auth redirects or repeated evidence. This supports an archive/deduplication policy, not blind deletion of evidence. Preserve provenance and links if consolidating it.

The link scan found 67 missing relative Markdown file targets, all inside dated audit or plan records already excluded by the historical-link policy. It found no missing local Markdown file targets or likely missing local heading anchors in the living-document input set. It also identified literal source-path references requiring contextual classification; planned/deleted files in historical descriptions are not automatically broken current instructions.

Twenty-four `.png`-named documentation images contain JPEG bytes: 22 art references and two preview captures. B11 covers the operational MIME consequence for the art inputs. All actual PNG streams passed chunk CRC and decompression checks. The filename mismatch itself does not mean a raster is corrupt.

The two installed `compress` skill aliases contain seven byte-identical Python files. Their separate skill names are intentional catalog entries. If maintaining them locally, share the implementation to reduce drift. They are agent tooling rather than app runtime code, and no execution was needed for this audit.

## Documentation cleanup applied, November 6, 2026

After the audit, the owner requested removal of documentation that no longer serves a purpose. The cleanup removed **211 files totaling 54,618,988 bytes (52.1 MiB)**:

- 34 Markdown documents: six superseded guides/checklists and 28 completed or obsolete implementation plans/specifications.
- 162 byte-identical evidence copies, retaining one matching copy and the original scenario-to-copy mapping.
- 11 retired Foundations/two-lesson prototype runtime files and four summary logs duplicated by richer retained reports.

Active plans, November research, current authoring/story contracts, unresolved requirements, unique release evidence, art-production inputs, and E2E baselines remain. Retained deferred requirements were checked against the canonical backlog and roadmap. Current instructions now link to active guides. Historical citations use immutable Git history where the old source still explains a decision.

[Structured evidence](repository-reality-2026-11-06/evidence.json) now includes every deleted path, its prior hash and size, the reason or category, and the surviving copy for each duplicate. The original file-coverage ledger remains a pre-cleanup snapshot. All removed files matched clean tracked content before deletion. Reference housekeeping also removed obsolete source-comment pointers and two dead vocabulary-test allowlist entries. It corrected the webhook comment to describe its existing suppression writes. Application behavior did not change.

Cleanup checks passed: 1,563 local Markdown links checked with zero newly broken targets, all 162 duplicate survivors matched their hashes, both prose-gate test files passed (three tests), and `git diff --check` passed. The scan still reports 65 pre-existing missing targets in retained historical material. The original audit test results describe that earlier snapshot. This documentation cleanup did not rerun the full application suite.

## Current defects revalidated from the existing backlog

Two known live inconsistencies remain. Lesson one teaches a twelve-value recording, while [deep-orbit-recap.tsx:33](../../apps/web/app/worlds/[slug]/[module]/[lesson]/deep-orbit-recap.tsx#L33) and [deep-orbit-tensor-figure.tsx:11](../../apps/web/app/worlds/[slug]/[module]/[lesson]/deep-orbit-tensor-figure.tsx#L11) retain the three-value example and shape `[3]`. Guest exercise execution also still posts signed-in attempt and GitHub commit endpoints from [lesson-content.tsx:289](../../apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx#L289). These remain valid backlog work, alongside the newly identified stale material. They are not additional discoveries in the 38-finding count.

## Validation results and limits

| Check | Final observed result |
| --- | --- |
| Root Vitest suite | 3,781 passed, 65 skipped; 325 files passed, one skipped |
| Focused evaluation/worker/result tests | 45 passed after concurrent repairs |
| Normal workspace typecheck | 10 tasks passed |
| Normal lint | 13 tasks passed; existing unused warnings remain |
| Broader root test-type program | 39 diagnostics across 23 files, R02 |
| Exercise solutions, untouched starters, cheating fixtures | 65 passed; zero failures; one starter-credit advisory in current evaluation WIP |
| Shipped-worker exercise corpus | 65 passed with `EXERCISE_CORPUS=1` |
| Review-launcher Node suite | Eight passed |
| Isolated PostgreSQL RLS/forward migrations | Passed; retired migrations 027/028 deliberately excluded |
| Clean-schema rollback checks | All 25 passed; migration 066 correctly refused destructive rollback with v2 practice data |
| Playwright discovery | 324 cases: 303 Chromium, seven in each of three mobile/tablet projects |
| Visual discovery | 36 tests, 38 screenshot outputs, zero committed Linux baselines |
| Download artifacts | All three ZIPs valid; two source-exact, runtime lab differs in three entries |
| Model artifacts | All 15 topologies/manifests parse; referenced shards and byte counts match |

The first unit run had six failures and the first lint run had an evaluation-file error. Concurrent implementation fixed them. The final results above supersede those observations. No old test was removed by this audit to obtain the final passing suite. The final exercise validator also reports an advisory: the untouched `deep-scan-eval` starter clears its new `has room to record the evaluation result` check, one of eleven checks. The reference solution and cheating rejection still pass. Keep that capture-capability invariant outside learner credit, or bind it to actual learner work, before considering the in-progress grading change complete.

Validation used the existing installation. Several installed root tools lag the declared lock: Vitest 5.0.2 versus 5.0.5, Playwright 1.63.0 versus 1.64.1, Turbo 2.11.7 versus 2.11.10, and React 19.3.0 versus 19.3.1. Next.js is 16.4.2 and TensorFlow.js is 4.22.0. A fresh frozen-lock install and the appropriate CI runs remain necessary before treating these local results as validation under the full declared dependency set. The audit did not replace the working installation while concurrent work was using it.

The full Playwright suite, production build, external model downloads, production secrets/migration state, real payments, external API consumers, human screen-reader work, and learner outcomes were not revalidated. Static source findings and local isolated checks must not be presented as those forms of evidence.

## Cleanup sequence

1. Correct public metadata, align the runtime-lab archive with its intended frozen source, and repair visual baseline accounting.
2. Remove confirmed dead runner/dashboard/query code and unused styles in focused changes. Preserve active model/service shims and dynamic assets.
3. Retire the old column-reordering behavior after checking the 27 affected lessons. Repair prose, route, type, onboarding, review-launcher, and RLS-probe coverage.
4. Reconcile deployment, model, architecture, CI, and email documentation with the implemented contracts. Label proposals and dated evidence clearly.
5. Decide retention of dormant endpoints, compatibility shims, completed one-off tools, and large historical artifact groups using their actual usage and preservation needs.
