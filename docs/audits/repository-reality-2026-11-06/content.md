# Content audit, November 6, 2026

Read-only scope: every tracked and untracked non-ignored file under `packages/content/`. No repository files changed.

## Coverage and evidence

- 707 files read in full, hashed, inventoried, and checked using the methods in `file-coverage.csv`.
- 4,601,424 bytes and 102,756 lines at the inventory snapshot.
- All 630 YAML/frontmatter records parsed: 275 lessons, 55 module manifests, 300 exercises.
- Every lesson parsed with the installed `@mdx-js/mdx` parser. No MDX syntax errors.
- All 900 authored exercise starter, solution, and grader snippets parsed with the installed TypeScript parser. No syntax errors. All 300 exercise graders contain tests and assertions.
- All 592 static CodeBlock examples extracted. 584 JS, TS, and TSX examples parsed without syntax errors. Eight shell, YAML, JSON, log, and text examples were classified separately rather than incorrectly parsed as JavaScript.
- Static `tf.*` API chains in examples resolve against installed TensorFlow.js 4.22.0. This verifies existence, not arguments or numerical correctness.
- Lesson/exercise counts, world/module/lesson identities, duplicate lesson/exercise slugs, mounted exercise references and parent metadata, and explicit internal absolute lesson links checked across all five worlds.
- Public source exports checked against consumers across the repository. Tests and build files inspected for stale assumptions and scope gaps.
- Actual MDX compilation hooks measured companion-node reordering across all 56 launched lessons.

The checks above cover every file. Semantic source review was targeted at build code, tests, query consumers, and flagged lesson/exercise contracts. This was not a manual sentence-by-sentence fact-check of all 275 authored lessons, and no browser lesson walkthrough was performed by this agent. Root owns the broad unit, lint, type, and exercise command results.

## Findings

### C01. The writing gate skips every live exercise instruction body

Priority P2. Confidence high. Current false assurance in a quality gate.

`packages/content/__tests__/slop-lexicon.test.ts:93-100` extracts only the first physical line of `title:` and `instructions:`. All 65 launched exercises now use block scalar instructions. The test therefore scans the literal `|` or `>` marker and skips the full instruction body. Across the full corpus, 79 of 300 exercises use block scalars. It also omits exercise hints and the new taskBrief fields, even though those are learner-visible prose.

Concrete example: `packages/content/content/deep-orbit/foundations/exercises/create-a-tensor.yaml:4-25` puts all instructions and taskBrief prose outside the scanner. The test's declared scope at lines 17-21 promises exercise prose coverage and still refers to two literal-character exceptions that the binding repo-wide ban removed.

An independent scan of decoded YAML prose found no current matches from the gate's banned lexicon in the skipped fields. This is a test-coverage defect, not evidence of a current prohibited phrase. Repair by parsing YAML and selecting all learner-visible prose fields while preserving code exemptions, then give the extractor its own block-scalar and taskBrief fixtures.

### C02. A build transform still changes reading order for the retired two-column lesson layout

Priority P2. Confidence high that rationale and behavior are stale. Confirm final authored reading order before deleting.

`packages/content/src/rehype-pair-companions.ts:6-18` says it moves BridgeCallout, DerivationDrawer, and ConceptReference nodes so CSS can pair a reading column with a second column. `packages/content/velite.config.ts:396-400` still installs the transform. The layout has since changed to one column: `apps/web/app/globals.css:524-558` sets `grid-template-columns: minmax(0, 1fr)`, and `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts:97` explicitly rejects the old second-column rule. The web audit independently confirmed these references.

An actual MDX compile with before/after hooks found that the plugin still moves 27 companion nodes in 27 of the 56 live lessons. For example, advanced-time-series/01-beyond-lstm moves its BridgeCallout from root slot 8 to slot 10, and /02-temporal-attention moves one from slot 6 to slot 8. Exact affected paths are in `evidence.json, companion_reordering`.

`packages/content/__tests__/rehype-pair-companions.test.ts` remains a 329-line suite preserving this obsolete layout arrangement. This is not dead by reachability, because it runs in every content build. It is retained behavior whose original product purpose disappeared. Review the 27 affected source orders, preserve intentional teaching order in MDX, then remove the transform and retire tests that only defend the old column layout.

### C03. Three Neon exercise parent IDs still point to Deep Orbit lesson slugs after the Neon rename

Priority P2 for future-world release readiness. Confidence high. No current launched-course impact.

- `packages/content/content/neon-protocol/image-data/exercises/normalize-pixels.yaml:2` declares `lessonSlug: normalization`, but its actual mounted parent `image-data/03-normalization.mdx:2` declares `np-normalization`.
- `packages/content/content/neon-protocol/capstone/exercises/design-architecture.yaml:2` declares `system-architecture`, but its mounted parent `capstone/01-system-architecture.mdx:2` declares `np-system-architecture`.
- `packages/content/content/neon-protocol/capstone/exercises/deploy-sentinel.yaml:2` declares `launch`, but its mounted parent `capstone/05-launch.mdx:2` declares `np-launch`.

All three old identifiers are valid Deep Orbit lesson slugs. Consequently, the current compiled completeness assertion at `packages/content/src/completeness.test.ts:31-38`, which checks membership in a global lesson-slug set, would continue to pass after enabling Neon. The all-world mount gate at `packages/content/__tests__/exercise-slug-refs.test.ts:55-61,77-98` checks that an exercise is mounted somewhere in the same module, but never compares its `lessonSlug` with that mount's parent.

`getLessonExercises()` at `packages/content/src/queries.ts:97-100` selects by this field, and `getLessonTotalMinutes()` at lines 103-120 builds learner-facing workload from the selection. Enabling Neon as written would attribute those exercises and minutes to Deep Orbit and omit them from their true Neon parents. Correct the three IDs and make the raw all-world gate assert the exact mounted-parent relationship. Keep these files as intentional future content.

### C04. The blog link gate validates source filenames and authored availability instead of actual routes

Priority P3 while the blog is empty. Confidence high. Latent stale gate.

`packages/content/__tests__/blog-links.test.ts:35-42` resolves lessons by stripping the numeric filename prefix. Actual lesson routing resolves frontmatter `slug`. It also accepts all authored worlds without checking launch status and accepts any `/worlds/{anything}` at line 83 without verifying the world registry.

Concrete counterexample: the gate accepts `/worlds/neon-protocol/image-data/normalization`, because `03-normalization.mdx` exists, although the real slug is `np-normalization` and the entire lesson route is currently gated to 404. The inverse valid future slug `np-normalization` fails the filename check. `/worlds/not-a-world` passes the unconditional world-page branch.

There are currently zero published posts, so this does not establish an existing broken public CTA. The gate is present specifically to prevent a prior 404 regression. Resolve links against compiled launched lesson identities and the registered world list, with explicit fixtures for unlaunched, renamed, and nonexistent targets.

### C05. Three public content query helpers have no consumers

Priority P3. Confidence high for repository non-use.

`packages/content/src/queries.ts:32-38` exports `getFoundationsModules` and `getSpecializationModules`; lines 154-164 export `getLessonsByConcepts`. Repository-wide symbol inspection finds only their definitions and re-exports in `packages/content/src/index.ts`. No application, script, or test calls them. The content package is private.

Remove these wrappers and the now-unused query-file imports if no explicit near-term consumer requires them. Do not remove the concept-index primitives with them: scripts still call those primitives directly. Other test-facing helpers and schema exports were not classified as dead merely because their consumers are tests.

### C06. Current-code comments and test fixtures still describe superseded product state

Priority P3. Confidence high. Documentation and naming maintenance, not evidence of a functional failure.

- `packages/content/src/glossary.ts:4` says terms come from "all five built worlds". Only Deep Orbit is built.
- `packages/content/src/built-worlds.ts:20-25` presents an old measured claim that none of the 219 draft lessons has had a fact-check pass. Current `education-counterexamples.test.ts` executes examples from all five worlds, and `draft-exercise-corrections.test.ts` explicitly executes two repaired future-world exercises. Retain the historical estimate with its date and qualify its scope instead of presenting it as current HEAD evidence.
- `packages/content/__tests__/pipeline-integration.test.tsx:15-23` describes the deprecated Quiz in the live pipeline and says contract testing uses only sample fixtures. Contract testing now also iterates real compiled data. The fixture at lines 55-65 claims to mirror lesson one while retaining its old title and 25-minute duration, where the actual lesson is 8 minutes. The test named "fewer than 3 hints" at line 133 only rejects one rung, while two rungs are explicitly valid. Keep Quiz's own tests for its 51 intentional future-world lesson consumers, but label this suite's fixtures and scope honestly and cover current RecallPrompt/LessonRecap in the live pipeline claim.
- `packages/content/src/task-brief-lines.test.ts:5-15` labels a five-value, pre-chart starter as create-a-tensor's built starter. The real exercise has 12 values and chart-grouping code. This is still a useful line-scanner unit fixture. Rename it as a simplified fixture or obtain the current built starter rather than claiming it is exact.
- The large historic comments in `starter-dictation.test.ts` and `guidance-hint-dictation.test.ts` still say to expect the suites red until the repair pass lands. Keep their measured historical calibration, but replace the current-status instruction after confirming the root test results.

## Intentional retained material and checks that passed

Deep Orbit remains the only built world. Its 11 module manifests, 56 lessons, and 65 exercises agree with current scope. Every launched lesson has scene metadata, RecallPrompt, LessonRecap, and Epilogue; no launched lesson retains Quiz or KeyTakeaways. No duplicate lesson or exercise slugs and no broken explicit absolute internal lesson links were found across all five worlds.

The 219 lessons and 235 exercises in the four future worlds are intentional authored drafts. They are not deletion candidates. All 219 still use KeyTakeaways, 51 use Quiz, all 44 future module manifests omit the required summary field, 217 future lessons lack scene metadata, and 218 lack RecallPrompt. These are release-readiness work already contemplated by the world-launch checklist. The app excludes those lessons from current routes and builds, so these facts do not establish a live regression. They do prevent claiming that flipping launch flags alone prepares them for learners.

No new runtime shared import missing from `turbo build:content` inputs was found. `task-brief-lines.ts` imports `packages/shared/src/scan-stops.ts`, which turbo explicitly hashes. The RecallCheck import in the recall parser is type-only. New evaluation-capture modules are not imported into the Velite graph.

The raw public schemas intentionally duplicate Velite-facing shape validation and have contract tests against compiled content. They were not classified as dead. The empty blog placeholder and source content for coming-soon worlds were also retained as intentional product material.
