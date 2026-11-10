# Course clarity implementation plan

Prepared November 9, 2026. Finalized November 10, 2026.

Status: the clarity revisions are implemented and internally verified across all 56 Deep Orbit lessons and 65 exercise references. All 65 strict exercise validators, 128 worked-example groups, 840 phase checks and 162 shared-activity checks pass. The final isolated production build and the renderer/story checks for all 56 lessons pass. The final delivery record below supersedes earlier bounded-batch status notes. Unified mission-data/model redesign, 219 coming-soon lessons and independent learner studies remain separate workstreams.

## Earlier implementation batches

The first two batches cover six references and the five Foundations lessons, with L02 counted once. The third batch adds L06-L10 and a forward-pass result explanation using actual captured inputs, kernel, bias, and outputs. Its final preset-source preview, renderer/story checks, isolated production build, and 68-file snapshot are recorded in the audit. The fourth batch adds L11, L12, L14, and L15, and extends the earlier L13 slice. P04 now covers seven exercise contracts across six families. The final Training Loop preview passes 75 phase checks, 15 expanded interactions, and 15 scoped axe scans. The three new inspectors pass six browser settings and actual paid-route Worker checks. The existing evaluation route passes at 390px light. The isolated content and production build pass. The all 56 renderer/story gate passes at two widths with no page errors or overflow.

The fifth batch adds the six Browser Runtimes lessons in card order, L16-L21. Five new transient inspectors bring P04 to twelve contracts across eleven families. Its seven strict exercise validators, 92-group example harness, and isolated inspector matrix pass. The final six-lesson preview passes 90 phase checks and 18 interactions. All five new paid-route workflows, post-fix production build, and all 56 renderer/story checks pass within the recorded scope.

## Current implementation record

The [implementation record](../../audits/course-clarity-implementation-2026-11-09.md) separates source review, runtime checks, browser evidence, final renderer checks, and remaining work. Earlier actual-route editor evidence covers the opening three contracts and the forward-pass contract, with the latter recorded before its final summary wording change. Initial planning inspected source without executing product checks. The Deep Orbit clarity rollout is complete within the final record’s scope. Independent learner evidence remains pending.

Source baseline: `db4225a7e9d809b894251cd4df127e2ef22a2311`. The working tree was clean when planning began. Recheck source and unrelated changes before each implementation batch.

## Outcome and scope

A JavaScript engineer new to ML should be able to explain a lesson's mechanism, predict a meaningful change, perform the taught task, inspect their result, and state its limits. Preserve the story that gives that work a purpose.

The first delivery covers all 56 Deep Orbit lessons, all 65 unique primary and secondary exercise references, their Concept investigations, hints, recall, recaps, references, and story handoffs. Every lesson has a task card below. An inspected source file establishes planning coverage only.

The four coming-soon worlds have a separate discovery and release workstream. Their 219 authored lessons need world-specific plans before implementation. Deep Orbit's review does not establish their readiness.

The earlier 80% estimate is an editorial opinion. This project does not convert it into a learning score or promise a particular percentage improvement.

## Binding inputs and existing implementation

Follow [CLAUDE.md](../../../CLAUDE.md), the [writing rubric](../../writing-quality-rubric.md), the [story style bible](../../story-style-bible.md), and the [clarity change risk plan](../specs/2026-11-06-clarity-change-risk-plan.md).

Extend the existing [lesson/result map](../../design-previews/research/deep-orbit-result-map.md), [exercise capture matrix](../../design-previews/research/result-contract-matrix.json), and [content review manifest](../../audits/content-review-manifest.json). The [result-inspection specification](../specs/2026-11-06-story-driven-result-inspection.md) and its [implementation record](2026-11-06-result-inspection-design-review.md) govern capture and recovery. Reconcile older inventory claims with current code before using them.

Current reusable behavior:

- `apps/web/lib/lesson-phases.ts` defines Briefing, Concept, Challenge, Takeaways, and Epilogue. Keep those phases, IDs, completion rules, and saved positions.
- `apps/web/app/components/lesson-visuals/lesson-workbench.tsx` selects the actual live Concept implementation. Introduction uses `TensorInvestigation`. Tensor Shapes uses `ChannelLayoutExperiment`. The remaining lessons generally use the investigation registry. Updating an unused registry entry cannot repair the live lesson.
- `apps/web/app/components/lesson-visuals/lesson-investigation.tsx` already supports predictions, changed inputs, computed feedback, and current/previous comparisons.
- `packages/ui/src/mdx/exercise.tsx` already exposes `renderResult`, tokened run lifecycle events, draft recovery, and ordinary output fallback. Reuse these interfaces.
- `packages/ui/src/mdx/exercise-output.tsx` renders bounded tables, series, and text. A declared `recordResult` call does not guarantee an artifact is reached after a failure.
- `LessonResultExercise`, `LessonResultExplanation`, and their decoders now provide transient current-run inspection for sixteen exercise contracts across fifteen families, including policy requirements, inference tracing, capacity estimates, runtime parity, report pairing, signal frames, pipeline composition and generated card lines. Other captures retain ordinary output. The existing normalization, network, and evaluation saved-evidence path stays separate.
- `apps/web/app/components/result-explanation.tsx` and `learning-evidence-exercise.tsx` already provide specialized normalization, trained-network, and evaluation inspection. Preserve the newer evaluation capture and decoder.
- `packages/ui/src/mdx/code-block.tsx` already accepts a `footer`. Use focused examples and nearby explanations before adding a line-navigation feature.
- Existing Concept references and derivation drawers can hold supporting detail. Required concepts and runnable task instructions remain visible in the main flow.

## Preservation contract for every task

Each lesson patch must retain:

1. Its incoming crew problem, character competence, evidence known at that point, meaningful learner contribution, and outgoing story action.
2. Visible story and artwork in their intended phases, distinct story-passage styling, shared full-width layout, keyboard access, and reduced-motion behavior.
3. Every required exercise capability, its alternative valid implementations, and checks that reject plausible misconceptions.
4. Dataset and model identities, feature order, labels and their authority, units, selected rows/sensors/times, supplied tools, and known unknowns.
5. Separate identities for supplied examples, fictional mission records, simulations, controlled services, and actual learner runs. Code changes mark prior results stale.
6. Drafts, exercise IDs, hint/solution exposure, progress, saved results, and compatible readers. Changes never reinterpret an older saved artifact.
7. The 73.4 Hz signal discovery, accelerating pulse intervals, sample 7741's unresolved label, lost capture, canonical canary deployment, and final unanswered operator record.

A task may use a small, identified excerpt of an established recording. A source label alone cannot turn unrelated practice data into mission data. Author and review a justified fictional calibration record if the current story supplies no suitable labeled data. Unknown signal rows cannot acquire convenient labels.

Independent transfer tasks deliberately use another problem. Identify that transition and preserve the independent assessment. Supporting toy examples need an explicit purpose and an optional location.

## Ordered work packages

Package descriptions and task cards define the full intended scope. Bounded
implementation does not close a package or a full lesson card. Preserve
earlier review evidence when recording new findings.

| Package | Final delivery state |
| --- | --- |
| P00 | Inventory for all 56 lessons and 65 exercises reconciled. Historical hashes retained and a final bounded source snapshot added. Before-change media that was never recorded remains unavailable. |
| P01 | All 56 original source/fixture contracts reviewed and identified. A unified mission-data/model migration remains a separate curriculum redesign. |
| P02 | Source identity, kind, selected scope, order and units render for 54 shared activities. The two custom opening activities retain their own source contract. |
| P03 | All 56 lesson revisions implemented. Required mechanisms precede optional supporting material. 128 executed example groups cover all 56 lessons. |
| P04 | 16 transient exercise contracts across 15 families, plus the existing three specialized paths. Ordinary captured output remains available for other contracts. |
| P05 | Graded feedback, changed cases, recall, useful failures and assistance boundaries verified. Existing independent assignments remain separate. |
| P06 | Authored-order task outlines, matched titles, stable anchors and return links delivered. Finale navigation, draft recovery and all-three-pass gating verified. |
| P07 | All 56 Deep Orbit lesson revisions delivered. No unstarted lesson revisions remain in this scope. |
| P08 | Final source, exercise, example, browser, renderer, type and isolated-build checks complete within the recorded scope. |
| P09 | 219 coming-soon lessons remain a separate discovery/release workstream. |
| P10 | Independent learner studies and measured learning outcomes remain pending. |

### P00. Baseline, coverage, and preservation ledger

Dependencies: none. Owner: implementation lead with editorial review.

Files:

- `docs/audits/content-review-manifest.json`
- `docs/design-previews/research/deep-orbit-result-map.md`
- `docs/design-previews/research/result-contract-matrix.json`
- New implementation record: `docs/audits/course-clarity-implementation-2026-11-09.md`

Tasks:

1. Enumerate live MDX routes, exercise references, active workbench branches, custom experiments, and project/decision components from source. Reconcile 56 lessons and 65 unique exercises with the task-card coverage.
2. Record each card's objective, required operations, data/model identity, main misconception, exact affected surfaces, incoming/outgoing scene, and verification profiles in the existing map and implementation record.
   For each changed material technical claim, record the claim, installed runtime/version, primary documentation or executable mathematical proof, assumptions, affected surfaces, and review outcome. Verify API contracts against version-matched primary documentation and execute the relevant behavior. Separate mathematical properties, API contracts, measured observations, and fictional events.
3. Preserve original review entries as history. Mark changed artifacts' affected review dimensions pending until their new evidence exists. Do not refresh hashes merely to make the review checker pass.
4. Capture representative current screens and outputs for the six reference lessons in P07. Record fixtures and assistance. Avoid real learner data.

Acceptance: every lesson and every referenced exercise maps to one card, with no missing secondary exercise. Each proposed numerical change has an identified source contract and affected consumers. Evidence status distinguishes planning, source review, execution, browser review, and learner observation.

Verification: profile C, inventory comparison, and manual preservation review. Existing stale review hashes are recorded as baseline findings.

### P01. Mission data and model contracts

Dependencies: P00. Owner: content/ML reviewer and engineer.

Files:

- Relevant MDX and YAML files named in L01-L56.
- `apps/web/app/components/mdx/channel-layout-data.ts`
- `apps/web/app/components/lesson-visuals/instrument-math.ts`
- `apps/web/app/components/lesson-visuals/numeric-investigations.ts`
- `apps/web/app/components/lesson-visuals/flow-investigations.ts`
- `apps/web/app/components/lesson-visuals/deep-orbit-visuals.ts`
- `apps/web/lib/learning-evidence-types.ts` only if a separately reviewed result contract requires it.

Tasks:

1. Use the opening recording contract as the reference for explicit selection and ordering. For each later source, establish what values mean and who knows its labels.
2. Separate bounded orientation repairs from fixture redesign. Orientation can clarify existing source/model identities and definitions without changing numbers, weights, extraction, feature order, or saved descriptors.
3. For a full continuity repair, specify a concrete mission-data excerpt or authored calibration record, expected outputs, required skill, and source transition. Review it against predecessor and successor scenes before changing a grader.
4. Change a numerical fixture atomically across instructions, starter, solution, checks, hints, Concept calculation, reference, recall, recap, result adapter, examples, and story. Preserve valid alternative solutions.
5. Keep existing historical readers and descriptors. If changed meanings need a new capture contract, complete the lifecycle specification's reader-before-writer sequence before enabling writes. Keep new transient inspection independent of saving.

Acceptance: every displayed unit and feature name has a source-specific meaning. Generated proxies stay dimensionless where appropriate. A model change is explicit. No calibration result claims to identify the unknown signal. Fixture migrations have executed reference outputs and a safe historical-reader path.

Verification: C plus N, T, E, or F according to the card. Add S whenever IDs, source descriptors, or retained results are affected. Source identity and label authority are internal prerequisites, not another user permission request.

### P02. Source context in existing investigations

Dependencies: P01 contracts for the migrated reference lessons. Owner: shared UI engineer.

Files:

- `apps/web/app/components/lesson-visuals/investigation-types.ts`
- `apps/web/app/components/lesson-visuals/lesson-investigation.tsx`
- `apps/web/app/components/lesson-visuals/numeric-investigations.ts`
- `apps/web/app/components/lesson-visuals/flow-investigations.ts`
- Relevant investigation tests and `lesson-investigation.css`.

Tasks:

1. Add optional authored source context to `LessonInvestigationSpec`: stable source ID, source kind, readable label, selected scope, ordering, and known units. Use explicit unknown or dimensionless descriptions when the contract requires them.
2. Render that context beside the relevant data in ordinary readable prose. Keep the existing `boundary` field for simulation and capability limits. Do not serialize this presentation metadata into saved evidence automatically.
3. Connect source values and labels through the same definition. Migrate registry entries during their lesson patch. Preserve the two custom opening paths and their existing source contract.
4. Keep changed-case inputs under the same declared source, or explicitly identify the source change. Remove stale duplicated fixtures only after confirming that no active reader uses them.

Acceptance: the learner can identify which readings or supplied values an activity uses without opening another lesson. Legacy entries still render while migration proceeds. All migrated source labels agree with their actual values and units.

Verification: N/F registry calculations, investigation rendering/feedback tests, and B browser checks. Tests cover absent metadata, a fictional excerpt, and a controlled-service example. Avoid tests that only require a preferred sentence.

### P03. Focused worked examples and required teaching

Dependencies: P00 and each lesson's P01 decision. Owner: instructional editor with technical review.

Files:

- Relevant lesson MDX from the cards.
- `apps/web/app/components/mdx/concept-reference.tsx` only if existing disclosure behavior needs repair.
- `packages/ui/src/mdx/code-block.tsx` and its tests only if its existing footer cannot meet a demonstrated requirement.
- `scripts/check-reviewed-examples.mjs` when a selected executable block changes.

Tasks:

1. Map every required exercise operation to visible teaching or supplied starter code. Resolve hidden prerequisites before shortening the main explanation.
2. Follow an identified input through the core calculation, explain the result, then show its runnable JavaScript context. Use existing captions/footers for line-specific explanation. Keep full runnable code available in the same Concept flow.
3. Move a derivation or alternative implementation into an existing reference only after confirming that no required exercise or recall depends on untaught material there.
4. Replace overloaded prose and repeated qualifications with a clear explanation at the decision where it matters. Keep essential limitations visible.
5. Maintain the selected-example execution harness when blocks are renamed, split, or removed. Retain numerical assertions against the actual taught example.
6. Recheck changed API, mathematical, and measurement claims using P00's claim ledger. Check installed package documentation first where available, then version-matched official documentation or original papers. Preserve the source link and exact tested setup.

Acceptance: each challenge is solvable from taught material and supplied scaffolding. The focused calculation and runnable example agree. A deeper drawer supports understanding without becoming a hidden prerequisite. No arbitrary sentence or line-count target overrides meaning.

Verification: C and the relevant execution profile. A wording-only patch needs review and existing checks, without a new sentence-matching test.

### P04. Task-specific current-result explanation

Dependencies: P01 and first reference lesson contracts. Owner: result UI engineer.

The fifth-batch implementation covered twelve exercise contracts across eleven
families. The original sensor, gradient, forward, loss, update, and training
history contracts retain their earlier evidence. Browser Runtimes adds
browser-ml-tradeoffs as deployment-policy, inference-pipeline as inference-trace,
incident-tensor-leak as capacity-estimate, onnx-comparison as runtime-parity,
and load-pretrained-pipeline as report-pairing. Startup and model inspection
retain their existing ordinary captured metadata.

Each inspector separates observed or supplied operands, the learner's returned
values, and a labeled reference calculation. The inference range is the
exercise's requested reference, rather than proof of what learner code used.
Memory counts belong to their separately identified probe. ONNX intervals use
a simulated clock and establish no device ranking. Report sentiment scores
establish no urgency or model suitability. Earlier history windows use full
precision and preserve useful failed diagnoses. None of these presentation
contracts certifies authorship, source/model identity, or independent learning.

Known-capture, partial/stale, reset, browser, and actual-route checks pass in
the documented scope. The two L19 inspectors and ordinary fallback outputs
now receive distinct exercise-specific landmark names. No persisted schema,
new result registration, or write flag changes. Other signal, flow, and
structured-report families remain planned. The specialized evaluation capture,
four artifact roles, historical readers, and disabled-by-default writes remain.

Files:

- `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx`
- `apps/web/app/components/result-explanation.tsx`
- `apps/web/app/components/learning-evidence-exercise.tsx`
- `packages/ui/src/mdx/exercise.tsx` and `exercise-output.tsx` only for a shared gap.
- `apps/web/lib/lesson-result-explanations.ts` with family adapters and corresponding tests.
- `apps/web/app/components/lesson-result-explanation.tsx` with rendering tests.
- `apps/web/app/components/lesson-result-exercise.tsx` with current-run host tests.
- `apps/web/lib/training-result-explanations.ts` and `apps/web/app/components/training-result-explanation.tsx`, with focused decoder and rendering tests.
- `apps/web/lib/runtime-result-explanations.ts` and `apps/web/app/components/runtime-result-explanation.tsx`, with decoder, capture, and UI tests.
- `e2e/lesson-result.spec.ts`, its isolated Vite fixture, and dedicated config.
- Actual-route tests `e2e/signed-in-lesson-results.spec.ts`, `e2e/signed-in-forward-result.spec.ts`, `e2e/signed-in-training-results.spec.ts`, and `e2e/signed-in-runtime-results.spec.ts`, with their existing local-review helpers and dedicated configuration. The opening editor has separate retained browser evidence in the audit.

Tasks:

1. Use the existing `renderResult` context to supply transient explanations for reviewed exercise families. Leave the three existing specialized evidence exercises on their current path.
2. Decode exact known artifact contracts by exercise slug and verified titles/columns. Check finite values, lengths, source identity, and compatible artifact groups before computing an explanation. Selection cannot join results from independent probes without a declared relationship.
3. Start with tensor arrangement and scalar gradients. Then add one reviewed signal, one runtime/flow, and one structured-report adapter. Extend only after each family's contract and lesson acceptance pass.
4. Explain one selected result through its captured inputs and intermediate values. If the current capture lacks them, either use the honest existing output or add bounded capture in that exercise under P01. Never substitute a reference calculation as learner output.
5. Return `undefined` for unsupported or undecodable output so the ordinary renderer remains available. Preserve partial/error artifacts, stale-code labels, run identity, and assistance context. Add no automatic save registration.

Acceptance: one result view explains what changed, why, and what the output establishes. Unsupported captures retain readable ordinary output. Empty, partial, corrupt, failed, and stale runs do not invent successful results. A code edit, rerun, or account change cannot show the old result as current.

Verification: result adapter unit tests, UI tests, N/F/T/E according to family, plus S and B. Existing capture bounds and storage limits remain in force.

### P05. Feedback, recall, and independent practice

Dependencies: the lesson's explanation and result contract. Owner: instructional editor and assessment engineer.

Files:

- Lesson MDX, exercise YAML, relevant `scripts/exercise-cheats/<slug>*.js`.
- `apps/web/app/components/mdx/recall-prompt.tsx` only for an actual shared behavior gap.
- `packages/content/src/glossary.ts` and relevant glossary tests when definitions change.
- Existing build-triage and room-occupancy assignment files when their reviewed instructions change.

Tasks:

1. Make graded feedback state correct/incorrect, identify the observed mistake, and direct attention to a relevant value or operation. Keep verdict announcements and stale-error clearing.
2. Give each lesson a retrieval prompt on its main mechanism and a changed case suited to its task. Preserve recognition checks where useful, while including explanation and application at module scale.
3. Progress across modules from worked examples to guided changes, diagnosis, and independent decisions. Keep explicit input/output requirements while reducing procedural guidance.
4. Add or update behavioral misconception fixtures only when changed executable behavior needs protection. Test plausible wrong values even when shapes match. Also test a valid alternative where a grader might overconstrain it.
5. Preserve early and final independent assignments, their baseline/split/scaler/metric/error requirements, and assistance labels. Improve misleading instructions without supplying their solution.

Acceptance: passing a guided task is distinguishable from independent application. Recall does not reward remembering a story number alone. Hint and feedback changes preserve challenge requirements and answer-leak boundaries.

Verification: C plus the card's execution profile. Glossary changes need first-use rendering review, including terms that appear only in dialogue or drawers.

### P06. Multiple-exercise orientation and ending preservation

Dependencies: P00. Owner: lesson UI engineer and story editor.

Files:

- `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx`
- `packages/ui/src/mdx/exercise-brief.tsx`, `exercise.tsx`
- `packages/ui/src/mdx/exercise-brief.test.tsx`, `exercise-draft.test.ts`
- `packages/content/content/deep-orbit/capstone/05-launch.mdx`
- Other multiple-exercise lessons named in cards.
- Planned browser regression: `e2e/signed-in-clarity.spec.ts` under the existing signed-in configuration.

Tasks:

1. Derive a compact task outline from the authored MDX `<Exercise>` reference order. Build its lookup from exercise slugs. Velite's exercise collection can use file order and cannot supply the lesson's task order. Give rendered briefs and editors matching titles and unique stable anchors.
2. Keep editor components mounted with stable keys. Anchor navigation changes focus and scroll only. It introduces no checkpoint state, tab, extra lesson, or completion event.
3. Preserve all three launch exercise passes and the separate independent project. Reconcile authored effort estimates without presenting them as measured learner times.
4. Keep canonical deployment, conditional scenes, skipped-choice neutrality, ARIA's final entry, and `operator_note: none` as the final story beat.

Acceptance: outline, briefs, and editors follow authored MDX reference order with the correct slug/title pairs. Edit two exercises, navigate between their anchors, run one, reload, and recover the correct drafts/results. Passing one does not complete a three-exercise mission. The independent project never appears as an extra mission gate or a promotion after the ending.

Verification: S and B, including the actual local signed-in route. Reuse existing draft/gate tests. Add behavioral coverage for stable anchors and retained editor state if this package changes rendering.

### P07. Reference lessons and rollout batches

Dependencies: P00. Reference numerical migrations also depend on P01. Shared UI work depends on its own packages.

Reference set: L02 Tensor Shapes, L13 Backpropagation, L23 Fourier Transform, L29 LSTM Gates, L44 RAG for Signals, and L47 Model Profiling. Reuse L05, L10, and L15's existing specialized result work.

Card references have two meanings. Learner/context prerequisites describe the existing material the implementer must review. Hard implementation dependencies are P00, the target's approved P01 source contract, applicable shared changes, and any predecessor fixture slice whose values the target consumes. A predecessor card's full redesign is not automatically a dependency.

Batch B includes source/scene review of L01 for L02, L11-L12 for L13, L22 for L23, L27-L28 for L29, L42-L43 for L44, and L46 for L47. Review each target's immediate outgoing handoff too. If a reference uses a new predecessor excerpt, include that predecessor's minimal contract/fixture slice in B and verify it there. Keep its remaining card work open for its normal module batch. If that slice cannot pass its source or preservation checks, hold the dependent reference and continue independent reference tasks. This avoids a dependency cycle without bypassing data or teaching requirements.

Complete each reference lesson's source contract, focused explanation, active investigation, challenge interpretation, feedback/recall, and all five browser phases. Record reusable decisions in the implementation record. Resolve a shared gap once in its owning package.

| Batch | Task cards                                    | Depends on                | Delivery                                                                                       |
| ----- | --------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| A     | P00 and source contracts                      | Baseline                  | Complete coverage and preservation ledger                                                      |
| B     | Six reference cards and relevant P01-P05 work | A                         | Reviewed patterns for layouts, gradients, signals, recurrent state, evidence, and measurements |
| C     | L01-L15                                       | B and local prerequisites | Foundations, networks, training, and evaluation                                                |
| D     | L16-L26                                       | C                         | Browser runtimes and signal processing                                                         |
| E     | L27-L36                                       | D                         | Recurrent networks and anomaly detection                                                       |
| F     | L37-L46                                       | E                         | Advanced time-series and LLM integration                                                       |
| G     | L47-L56 and P06                               | F                         | Optimization, system integration, and ending                                                   |
| H     | P08                                           | All cards                 | Full internal verification and continuity review                                               |

Reference cards visited in B still need predecessor/successor rechecks in their normal batch. A change can ship after its own internal gates pass. Later fixture migrations remain visibly open until their dependencies pass. Human recruitment does not block known improvements.

For each batch, use one reviewable patch for a coherent source contract or shared family and small content patches grouped by module. Keep new schema, navigation, preference, model, or persistence redesign out of a wording patch. No automatic commit or deployment is part of this plan.

### P08. Course-wide verification and evidence record

Dependencies: all Deep Orbit cards and applicable shared packages. Owner: implementation lead and a reviewer who did not author the patch where available.

Tasks:

1. Run the applicable profiles below on changed code and the final cross-course checks once the modules stabilize. A later relevant change invalidates its affected evidence.
2. Review adjacent endings/openings, character development, timing of discoveries, source changes, and the separate independent-project handoff. Preserve unresolved questions.
3. Update the source map and capture matrix with actual output support. Reconcile changed claims with P00's versioned primary-source ledger. Refresh review hashes only after new review evidence is recorded. Keep old dates and limitations in history.
4. Record lesson, revision, profile, command, actual path/backend/device, result, limitation, and remaining finding. Record source, execution, browser, and learner statuses separately.

Acceptance: 56/56 task cards have reviewed surfaces and applicable internal evidence. All 65 unique exercise references have verified contracts. No consequential teaching error, false provenance, invented scientific result, answer leak, lost draft, or incompatible saved reader remains in the candidate. Shared tests alone do not certify every lesson.

### P09. Draft-world discovery and implementation plans

Dependencies: reusable Deep Orbit patterns. Known factual repairs can proceed earlier without launching a world.

For each coming-soon world, inventory its own lessons, exercises, active renderer, story/data contracts, prerequisites, domain risks, and secondary work. Produce cards equivalent to L01-L56 for its actual source, then implement in prerequisite order. Retain coming-soon routing and purchase boundaries until its existing release checklist passes. Details and current counts appear after the Deep Orbit cards.

### P10. Learner evidence alongside implementation

Dependencies: a stable reviewed revision for the task being observed. Owner: study coordinator and independent reviewers.

Reuse [the study packet](../../learning-study/README.md), [protocol](../../learning-study/pilot-protocol.md), task forms, and scoring anchors. Preserve the original forms and thresholds. The archived five-person prototype study is not an implementation prerequisite.

Run rotating observations of early, dense middle, and late lessons. Retain first unaided explanations, predictions, changed-case reasoning, story consequences, help, and original attempts. Keep full editorial coverage distinct from sampled learner coverage.

The formal diagnostic cohort remains 12-20 novices, target 16, with browser and Node backgrounds. Two independent reviewers cover ML/evaluation and instructional/editorial quality. Recruitment, compensation, consent terms, and scheduling remain coordinator work.

Retain the existing gates: 80% of first-module starters finish without live author help, 80% of early-transfer submitters reach 8/10 without a blocker or solution reveal, 70% of all enrolled complete the assessed final project, and 80% of observed readers explain both the passage and a meaningful consequence. Retain the protocol's separate seven-day response and performance denominators. Report counts, missing observations, assistance, and versions. Follow up on actual use at 30 days.

Repeated consequential confusion returns the responsible explanation to revision even when the aggregate passes. Retest revisions with fresh participants. Internal implementation completion and claims of improved learning have different evidence requirements.

## Verification profiles and commands

Run commands from the repository root unless a command explicitly uses a workspace filter. Commands below are implementation instructions, not checks claimed as executed during this planning task.

### C. Content and source consistency

Applicable to every card. Use the existing gates after edits:

```bash
pnpm --filter @tensorcraft/content build:content
pnpm exec vitest run packages/content/__tests__/slop-lexicon.test.ts packages/content/__tests__/em-dash-ban.test.ts packages/content/__tests__/lesson-answer-leak.test.ts packages/content/__tests__/foundations-continuity.test.ts packages/content/src/end-of-lesson.test.ts packages/content/__tests__/structure-variety.test.ts
node scripts/check-lesson-code.mjs
node scripts/check-content-review.mjs
```

The final command checks recorded hashes and coverage. An expected stale hash remains a pending review until the corresponding review finishes. Parsing a teaching block proves syntax only.

### N. Numeric calculations and exercise contracts

Replace the example slug with every exercise slug listed on the card. The validator accepts one positional slug per invocation. Its `--strict` flag prevents changed work from passing through an allowlist warning.

```bash
node scripts/validate-exercises.mjs reshape-tensor --starters --cheats --strict
pnpm exec vitest run apps/web/app/components/lesson-visuals/numeric-investigations.test.ts apps/web/app/components/lesson-visuals/lesson-investigations.test.ts apps/web/app/components/lesson-visuals/investigation-graphic.test.tsx
```

Inspect registered misconception fixtures for the changed objective. `--cheats` runs existing matching files, so an absent fixture is not evidence of a rejected misconception. Add a narrowly targeted fixture when the executable change needs it.

Execute changed worked examples through `scripts/check-reviewed-examples.mjs` only after checking that its selected block titles and fixtures still match. For an existing selected module:

```bash
REVIEW_MODULE=training-loop node scripts/check-reviewed-examples.mjs
```

A zero selected-run count is missing evidence. The harness executes selected examples with declared setup and substitutions. It does not execute every integration path or establish actual service behavior.

### F. Flow, runtime, and controlled-service exercises

Run C and the card's exercise validator invocations. Then:

```bash
pnpm exec vitest run apps/web/app/components/lesson-visuals/flow-investigation-contracts.test.ts apps/web/app/components/lesson-visuals/flow-investigation-render.test.tsx
```

Verify at least the valid stage sequence and a plausible failure or invalid handoff. Label mocks, supplied callbacks, controlled timing, and real runtime behavior separately. A mock model load or response parser cannot establish network download, offline caching, provider quality, or device performance. Use the existing runtime lab for a changed actual-runtime claim and record its precise mode and downloads.

### T. Training and captured histories

Run C and N for every referenced exercise. Select the relevant recorder/viewer tests from the first command according to the changed capture. The second command demonstrates a focused browser run for two changed slugs. Replace its pattern with the exercise names affected by the patch:

```bash
pnpm exec vitest run packages/ui/src/mdx/exercise-fit-recording.test.ts packages/content/__tests__/network-run-evidence.test.ts packages/content/__tests__/normalization-run-evidence.test.ts packages/content/__tests__/epoch-traces.test.ts apps/web/app/components/network-run-explanation.test.tsx apps/web/app/components/normalization-run-explanation.test.tsx
pnpm exec playwright test e2e/education-exercises.spec.ts --project=chromium --workers=1 --grep 'simple-network|training-loop-exercise'
```

The browser exercise suite checks its enumerated cases through the real Worker. Add a changed exercise's worker case if the current suite does not enumerate it. Run the complete suite for a shared-runner change and once during P08. Keep training serial and within the existing execution budget. Preserve actual outcomes, original histories, independent initializations, and insufficient-history behavior.

### E. Evaluation and decision evidence

Run C and strict validators for this card's own exercise slugs. Check its actual decision contract: source/split provenance, selected policy, denominators, threshold boundaries, tie/empty behavior, and any unsupported interpretation. For anomaly or ensemble cards, use their own recorded cases and relevant N/F tests.

When changing `deep-scan-eval` or shared evaluation capture/decoding/viewing, also run its strict validator and these specialized checks:

```bash
pnpm exec vitest run packages/shared/src/evaluation-result.test.ts packages/ui/src/mdx/evaluation-capture.test.ts apps/web/app/components/evaluation-run-explanation.test.tsx
pnpm exec playwright test --config e2e/evaluation-result.config.ts
```

Check split/scaler provenance, retained policy, baseline and held-out mistakes, captured cases, partial reports, and misleading procedure claims. The fixture browser config checks the viewer without authenticating a real lesson route. Use B for that route. Keep evaluation writes off unless the separately specified compatible-reader rollout is being tested.

### S. Drafts, results, and recovery

Applicable whenever rendering, execution lifecycle, IDs, result contracts, or persisted state changes:

```bash
pnpm exec vitest run packages/ui/src/mdx/exercise-draft.test.ts packages/ui/src/mdx/exercise-saved-runs.test.tsx packages/ui/src/mdx/exercise-output.test.tsx apps/web/lib/learning-evidence-store.test.ts apps/web/lib/learning-evidence-types.test.ts apps/web/app/components/learning-evidence.test.tsx
```

Exercise edit/rerun/reset, old-result staleness, failed/partial output, restore, owner changes, and unsupported legacy capture. Include async invalidation when preparation is delayed. Retain old readers. Do not clear data or bump lesson IDs to simplify recovery.

### B. Rendered lesson and browser experience

After compiling current content:

```bash
node scripts/check-content-browser.mjs
node scripts/check-content-browser.mjs --story
pnpm exec playwright test e2e/lesson-continuity.spec.ts e2e/lesson-layout.spec.ts --project=chromium
```

The content browser harness uses the real MDX renderer with editor/external substitutes at 1100px and 375px. Its story mode exercises saved-choice continuations. It does not establish paid access, editor execution, or a full five-phase signed-in route.

For actual paid-route workflows, use the isolated local setup in [review-setup.md](../../review-setup.md). Start these services in the foreground in a separate terminal:

```bash
pnpm review:prepare
pnpm review:dev
```

Then run:

```bash
pnpm exec playwright test --config e2e/signed-in-results.config.ts
```

Extend coverage in planned `e2e/signed-in-clarity.spec.ts` for reference families and changed multi-editor flows. Keep the existing serial, local-auth-only configuration and its recording settings. The current suite covers its named pilot routes, not all 56 lessons.

For every revised lesson, record all five phases at desktop and narrow widths, both themes, keyboard operation, default/reduced motion, story visibility, useful feedback, and actual current output. Use 1440px and 390px for routine lesson review. Include 320px and 1024px on shared changes and dense interfaces. Record human screen-reader review separately from automated checks.

### Final batch checks

After relevant focused checks pass and before closing P08:

```bash
pnpm exec vitest run
node scripts/validate-exercises.mjs --starters --cheats
pnpm exec playwright test e2e/education-exercises.spec.ts --project=chromium --workers=1
pnpm --filter @tensorcraft/web typecheck
pnpm --filter @tensorcraft/content typecheck
pnpm --filter @tensorcraft/ui exec tsc --noEmit -p tsconfig.json
pnpm --filter @tensorcraft/shared exec tsc --noEmit -p tsconfig.json
```

Run workspace lint on changed packages and a production build through the repository's documented workflow when shared implementation changes require it. Resolve failures caused by the patch. Record unrelated baseline failures with exact diagnostics. Repeat a check only after a relevant change or unresolved finding.

## Lesson task-card conventions

L01-L56 follow module and lesson order. Paths are repository-relative and case-sensitive. A registry key names an entry in the stated TypeScript file. A card's profiles select the commands above, and B applies to every revised lesson even when a card lists only specialist profiles.

Each card includes all current exercise references. Its listed files form the minimum edit/review set. Also update the module description, glossary, handoff registry, selected-example harness, fixtures, and result contracts when the actual patch affects them. All five lesson phases, hints, references, secondary tasks, and adjacent scenes remain in scope under the preservation contract.

Cards that require source discovery have two slices: a bounded explanation/orientation repair, then the dependent mission-data migration. Label the first slice accurately and keep the full continuity task open until P01 passes. No card grants permission to weaken an exercise or move required teaching into a drawer.

## Lesson tasks L01-L21

These cards retain the implemented task scope and its preservation requirements. Earlier batch records below are historical. The final coverage table in the audit identifies the completed lesson revisions. Paths are repository-relative. `NREG` means
`apps/web/app/components/lesson-visuals/numeric-investigations.ts`, `FREG` means
`apps/web/app/components/lesson-visuals/flow-investigations.ts`, and `DREG` means
`apps/web/app/components/lesson-visuals/deep-orbit-visuals.ts`. A key in brackets
identifies the exact registry entry. Existing declarations can be inactive:
the live rendering path takes priority over a registry's presence. Profiles
refer to the plan's common C, N, F, T, E, and S verification definitions.

### L01. From JavaScript Arrays to Tensors

- Earlier batch record: Concept chart selection now highlights flat positions from the same TensorFlow.js example run. A current-run result adapter links actual captured chart values to the supplied recording. Foundations preview checks pass. Actual-editor checks pass. Full-card review remains open.
- Files: `packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx` and `packages/content/content/deep-orbit/foundations/exercises/create-a-tensor.yaml`.
- Live visual: `apps/web/app/components/lesson-visuals/tensor-investigation.tsx`, `tensor-example.ts` in that directory, and `apps/web/app/components/mdx/channel-layout-data.ts`. DREG[`introduction-to-tensors`] supplies copy. The old NREG entry is not this lesson's live activity.
- Change: retain the current 12-reading task. Link a selected sensor to its three flat-list positions and chart points. Explain the two learner-written lines beside their effect, with grouping identified as supplied code. Remove duplicated explanations only after checking all five phases.
- Check: wrapping the array in another array produces a different shape. Tensor creation performs no training.
- Acceptance: Concept example and actual Challenge output preserve the same A-D order. Supplied and learner-executed outputs carry distinct labels. Keep both required replacements and existing cleanup scaffolding.
- Dependency: current recording metadata remains authoritative. Profiles: C, N, S.

### L02. Understanding Tensor Shapes

- Files: `packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx` and `packages/content/content/deep-orbit/foundations/exercises/reshape-tensor.yaml`.
- Live visual: `apps/web/app/components/mdx/channel-layout-experiment.tsx` and `channel-layout-data.ts`. DREG[`tensor-shapes`] supplies the question. `lesson-workbench.tsx` selects this custom activity instead of NREG[`tensor-shapes`].
- Change: strengthen the existing linked comparison of flat values, time-by-sensor grid, by-sensor grid, and chart. Place the second-row prediction immediately beside its recorded positions. Map the visible transformation to the partial code example without revealing the full Challenge solution.
- Check: `reshape([4,3])` has the requested dimensions but mixes sensor membership. The wrong-value case must remain rejected.
- Acceptance: selected readings retain value, sensor, and moment identity across views. Required reshape, row readback, and transpose teaching remains visible before the exercise.
- Dependency: L01's shared excerpt and source metadata. Profiles: C, N, S.

### L03. Basic Tensor Operations

- Earlier batch record: the main worked example and activity now use sensors A/B from the existing three-moment recording. The unchanged exercise fixtures remain explicitly labeled diagnostics. They trace adjacent-moment averaging, gain, reference-row broadcasting, and bank sums. Foundations preview checks pass, including the native slider after its limit changes. Full-card review remains open.
- Files: `packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx` and `packages/content/content/deep-orbit/foundations/exercises/add-tensors.yaml`. Visuals: NREG and DREG[`tensor-operations`].
- Change: present two connected calculations: average/gain at matching positions, then weighted channel-bank sums. Extend the selected-output explanation to show the paired source readings and broadcast row. Give matrix mixing its own labeled input/weight/output axes and one traced dot product. Keep the broken-code opening.
- Check: element-wise multiplication cannot replace the required channel-bank matrix product. Correct output shape with incorrect channel contributions must fail.
- Acceptance: the learner can locate every contributor to one output. Instructions, hints, examples, and results agree on broadcast behavior and transpose direction.
- Dependency: the bounded patch reviews the source contract and changes the Concept/worked excerpt. Diagnostic starter, solution, numerical fixtures, checks, and hints remain unchanged. Exercise copy identifies that separate source. Profiles: C, N.

### L04. Loading and Preparing Data

- Earlier batch record: main teaching and activity now trace the same generated 16-row loader fixture, read counts, restart, row/label pairing, and split membership. These diagnostic values remain separate from the mission archive. Foundations preview checks pass. Mission-data continuity and full-card review remain open.
- Files: `packages/content/content/deep-orbit/foundations/04-data-loading.mdx` and `packages/content/content/deep-orbit/foundations/exercises/batch-data.yaml`. Visuals: NREG and DREG[`data-loading`]. Transfer activity: `future-builds` in `apps/web/app/components/mdx/decision-task-data.ts`.
- Change: stage the existing requirements as lazy read/yield, shuffle rows, form batches, and reserve later validation IDs. Show read count before the first yield, selected row membership, feature/label shapes, and split membership. Explain that the batching demonstration reads all 16 rows while a training run uses training IDs only.
- Check: eager reading, batch-before-shuffle, overlapping splits, and a generator that cannot restart remain rejected.
- Acceptance: the selected batch retains feature order and label pairing. The fixed visual shuffle is distinguishable from a random execution. Keep future-builds explicitly separate as transfer practice.
- Dependency: the generated ID-based values need an approved source contract before any mission-data replacement. Profiles: C, N, F.

### L05. Data Normalization

- Earlier batch record: main teaching and activity now trace the unchanged two-feature fixture through saved statistics, scaling, fixed-neuron terms, and score. Foundations preview checks pass. The separate three-input ending preview remains a continuity limit. Full-card review remains open.
- Files: `packages/content/content/deep-orbit/foundations/05-normalization.mdx` and `packages/content/content/deep-orbit/foundations/exercises/normalize-data.yaml`. Visuals: NREG and DREG[`normalization`]. Custom experiment: `normalization` in `apps/web/app/components/mdx/learning-experiment.tsx` and `learning-experiment-data.ts`.
- Change: sequence fitted column statistics, one transformed row, later-row reuse, fixed-neuron score, and alternate min-max scaling. Use existing normalization result explanation to link selected raw/scaled values and saved statistics. Keep zero-divisor behavior and the required min-max implementation in the visible teaching path.
- Check: variance used as standard deviation, row-wise fitting, refitting a new reading, mutated saved statistics, and constant columns.
- Acceptance: learners can identify their scaling code and the supplied model. Preserve scoreReading after batch disposal, actual result provenance, and sample 7741's unknown label.
- Dependency: separate the two-feature fixture from subsequent networks. Source migration requires a new reviewed contract. Profiles: C, N, S.

### L06. Your First Neuron

- Earlier batch record: The main explanation and live activity now share the same identified three-input arithmetic case and trace each input, weight, product, running sum, bias, and score. The graded tensor fixture and YAML are unchanged. Calibration tone records lack the input/model provenance needed for a full migration. Final Neural Networks preview checks pass. Full-card review remains open.
- Files: `packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx` and `packages/content/content/deep-orbit/neural-networks/exercises/implement-neuron.yaml`. Visuals: NREG and DREG[`first-neuron`].
- Change: make one selected input's weight, product, summed contribution, and bias inspectable together. Align the main worked calculation and Concept activity around a reviewed calibration excerpt. Keep the existing tensor implementation and JavaScript reduce bridge next to the same calculation. Move extra discussion of network-wide importance into the reference only after retaining the essential weight-versus-contribution distinction.
- Check: largest weight does not necessarily supply the largest contribution. Typed scalar answers and JS readback inside neuron do not meet the tensor/gradient requirement.
- Acceptance: returned scalar tensor, cleanup, changed input lengths, and actual calculated score remain covered. No training or classification claim follows this arithmetic result.
- Dependency: establish calibration source and feature meanings before replacing the current two-input activity or three-input fixture. Profiles: C, N.

### L07. Activation Functions

- Earlier batch record: The main explanation and activity now share the five-score and extreme-value diagnostic fixtures. Visible teaching preserves nonlinearity, output ranges, thresholding, calibration limits, and rank-2 shape. Deeper affine/saturation material is optional. YAML is unchanged. Final Neural Networks preview checks pass. Mission-data continuity and full-card review remain open.
- Files: `packages/content/content/deep-orbit/neural-networks/02-activation-functions.mdx` and `packages/content/content/deep-orbit/neural-networks/exercises/relu-activation.yaml`. Visuals: NREG and DREG[`activation-functions`].
- Change: lead from the preceding weighted score into a before/after ReLU view. Use one visible piecewise example to explain why nonlinear behavior matters, then introduce sigmoid and tanh as output-range comparisons. Place threshold and calibration explanations beside the relevant score/decision example. Keep deeper saturation derivations optional while preserving essential interpretation.
- Check: clipping large positives, changing tensor shape, thresholding instead of activation, and treating sigmoid range as calibrated reliability.
- Acceptance: the required ReLU transformation is clear before the Challenge. A selected negative, zero, ordinary positive, and large positive map to the correct outputs. Preserve tensor-only implementation checks.
- Dependency: reuse a known score from the reviewed calibration task. Keep changed illustrative inputs clearly identified. Profiles: C, N.

### L08. Layers and Architecture

- Earlier batch record: The activity traces each layer of the 673-parameter bridge model and separate 225-parameter graded model, with input-width changes checked against TensorFlow.js. Required teaching stays visible before optional XOR detail. YAML is unchanged. Final Neural Networks preview checks pass. Feature/model lineage and full-card review remain open.
- Files: `packages/content/content/deep-orbit/neural-networks/03-layers-and-architecture.mdx` and `packages/content/content/deep-orbit/neural-networks/exercises/build-layer.yaml`. Visuals: NREG and DREG[`layers-and-architecture`].
- Change: show each layer's input width, unit count, weights, biases, and subtotal before the network total. Add explicit identities for the story's 3-input 32/16/1 model and the current 4-input 16/8/1 practice model. Explain sample count, channel count, and feature count where they first differ. Put the separately labeled XOR comparison in optional supporting material unless it assesses an explicit required objective.
- Check: omitting biases, multiplying by batch size, and hardcoding the count for one input width.
- Acceptance: predictParams agrees with model.countParams for changed widths. Existing 673 and practice counts retain their model identities.
- Dependency: source-specific feature display mapping and review of L09-L10 handoffs precede any architecture/fixture redesign. Profiles: C, N.

### L09. The Forward Pass

- Earlier batch record: The failed-demo opening remains. Main teaching now uses the graded single linear 2-to-3 diagnostic model, while the Concept activity labels its fixed-weight reference explicitly. The six check names, starter, solution, default initialization, and numerical fixtures remain. The grader now requires exactly one layer and captures actual kernel/bias beside the original output table. The current-run viewer uses those actual operands. Final preview checks pass. Actual-route evidence predates final summary wording. Mission lineage and full-card review remain open.
- Files: `packages/content/content/deep-orbit/neural-networks/04-forward-pass.mdx` and `packages/content/content/deep-orbit/neural-networks/exercises/forward-pass.yaml`. Visuals: NREG and DREG[`forward-pass`].
- Change: preserve the failed-demo opening. Follow one reading from flat values to a one-row batch, then trace an actual output unit through weights and bias. Keep model.predict and manual arithmetic together. Review the current fixed two-layer Concept activity against the single linear exercise layer and make the source/model handoff explicit before proposing a replacement.
- Check: shape [n,1] instead of [1,n], altered values during batching, per-row repeated predict calls, and applying an extra activation.
- Acceptance: changed batch lengths produce the correct outputs with unchanged input values. A linear output can appear outside probability bounds. Any displayed weights come from the selected actual model or an identified reference.
- Dependency: L02 shapes and L08 architecture. Profiles: C, N.

### L10. Building a Complete Network

- Earlier batch record: Visible teaching now stages construction, compilation, six initial weight arrays, both untrained sweeps, first-model fitting, and comparison with the untouched second model. The generated 8-feature/120-row/529-parameter rehearsal stays separate from the 3-feature/673-parameter bridge model. YAML, network-v1, its viewer, and four-artifact limit remain unchanged. Final preview and optional-reference checks pass. Full mission lineage and full-card review remain open.
- Files: `packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx` and `packages/content/content/deep-orbit/neural-networks/exercises/simple-network.yaml`. Visuals: NREG and DREG[`building-a-network`]. Existing viewer: `apps/web/app/components/network-run-explanation.tsx`.
- Change: group visible teaching into construct, compile, compare initial states, train one copy, and inspect changed scores. Place source/model identity beside every display. Use the existing result viewer for linked row selection, both initial sweeps, trained scores, settings, and loss. Keep the complete required worked setup visible.
- Check: shared model instances, trained comparison model, overwritten initial weights, and invented fixed accuracy targets.
- Acceptance: the 529-parameter eight-feature rehearsal remains distinct from the 673-parameter bridge model. Score comparisons remain training-row observations.
- Dependency: follow the November 6 model/data discovery gate before a mission-calibration migration. Preserve current evidence readers and descriptors. Profiles: C, N, T, S.

### L11. Loss Functions

- Files: `packages/content/content/deep-orbit/training-loop/01-loss-functions.mdx` and `packages/content/content/deep-orbit/training-loop/exercises/mse-loss.yaml`. Visuals: NREG and DREG[`loss-functions`].
- Change: show a labeled prediction, its per-row error, and the batch reduction. Follow with the same binary target represented as a logit or sigmoid output, showing why the API input must match. Add a clear visible worked example for all three required functions. Keep deeper loss-gradient derivations optional.
- Check: passing probabilities to sigmoidCrossEntropy, reducing along the wrong axis, and guessing BCE form from an unknown output name.
- Acceptance: the visible result explains the two captured BCE cases without implying it demonstrates every MSE/API-selection skill. Invalid or missing output-kind values remain rejected.
- Dependency: attach examples to a reviewed labeled calibration source before replacing arithmetic fixtures. Preserve the distinction between training loss and held-out performance. Profiles: C, N.

### L12. Gradient Descent

- Files: `packages/content/content/deep-orbit/training-loop/02-gradient-descent.mdx` and `packages/content/content/deep-orbit/training-loop/exercises/gradient-step.yaml`. Visuals: NREG and DREG[`gradient-descent`]. Experiment: `learning-rate` in `apps/web/app/components/mdx/learning-experiment.tsx` and `learning-experiment-data.ts`.
- Change: place old weight, gradient, learning rate, update amount, new weight, and resulting loss in one trace. Link the actual three recorded updates to that sequence. Identify the experiment's separate loss function rather than implying its curve generated the exercise output.
- Check: adding the gradient, hardcoding the squared-loss derivative, reusing an old gradient, and leaking replaced gradient tensors.
- Acceptance: the first supplied update moves 5 to 4. Subsequent supplied functions recompute gradients and produce their actual outcomes. Larger steps can be inspected without a guaranteed improvement badge.
- Dependency: a mission-loss integration requires a reviewed calibration model and new fixture contract. Profiles: C, N.

### L13. Backpropagation

- Files: `packages/content/content/deep-orbit/training-loop/03-backpropagation.mdx` and `packages/content/content/deep-orbit/training-loop/exercises/backprop-chain.yaml`. Visuals: NREG and DREG[`backpropagation`].
- Change: retain the costly-nudging opening, then teach one scalar estimate, its automatic counterpart, and a multi-variable comparison. Keep loss value, gradient lookup, recomputation, and numerical restoration visible. Link each recorded variable to its two estimates and observed forward counts. Explain the chain rule with one local calculation before the full network code. Keep Jacobian/residual elaboration in the optional derivation.
- Check: frozen answers, numerical substitution inside gradOf, wrong variable keys, multiple moved variables, and failure to restore after an exception.
- Acceptance: gradient computation stays separate from weight updates. Counts describe the supplied functions and elapsed story timings remain fictional.
- Dependency: required numerical-estimation teaching remains in the main flow. New mission-loss fixtures need the source-contract task. Profiles: C, N.

### L14. The Training Loop

- Files: `packages/content/content/deep-orbit/training-loop/04-training-loop.mdx` and `packages/content/content/deep-orbit/training-loop/exercises/training-loop-exercise.yaml`. Visuals: NREG and DREG[`training-loop`].
- Change: connect one batch update to one epoch, then show validation monitoring. Explain the callback's five non-improvements separately from diagnose's two ten-epoch means. Mark actual original epoch windows on the recorded curve. Following the risk plan, capture diagnose applied to copies of the full actual histories without running another fit. Retain captured curves if that function throws or returns an invalid label.
- Check: short history, exact 5% boundaries, zero means, invalid arrays, competing conditions, and long downsampled histories.
- Acceptance: sampled plot points never substitute for original windows. Stopping does not restore best weights. A valid short or 500-epoch run remains valid.
- Dependency: bounded result capture and worker-budget review precede the new diagnostic output. Profiles: C, N, T, S.

### L15. Evaluating DEEP SCAN

- Files: `packages/content/content/deep-orbit/training-loop/05-evaluating-deep-scan.mdx` and `packages/content/content/deep-orbit/training-loop/exercises/deep-scan-eval.yaml`. Visuals: NREG and DREG[`evaluating-deep-scan`]. Additional activities: `review-costs` in `apps/web/app/components/mdx/decision-task-data.ts` and the existing TransferAssignment component.
- Change: reuse the current evaluation capture/viewer. Explain one selected held-out case before aggregate metrics, then compare the baseline and error categories. Tie the diagnose verdict to measured scores and make validation-choice versus final-test roles visible. Keep the twelve-case Concept review and 43-row exercise identities explicit.
- Check: test rows in fit, wrong metric tensor, mutated scores, strict threshold equality, and incorrect gap precedence.
- Acceptance: useful captured output survives a wrong diagnostic answer. Fictional 94% and 7741's 0.518 remain separate story records. Preserve the independent transfer task.
- Dependency: current readers and disabled-by-default evaluation writes follow the existing result-inspection rollout. Profiles: C, N, T, E, S.

### L16. Why the Browser?

- Files: `packages/content/content/deep-orbit/browser-runtimes/01-why-the-browser.mdx` and `packages/content/content/deep-orbit/browser-runtimes/exercises/browser-ml-tradeoffs.yaml`. Visuals: FREG and DREG[`why-the-browser`].
- Change: turn each selected scenario into a requirement trace showing the first decisive rule: local requirement, download budget, then latency preference. Explain client, server, and reconsider beside that trace. Retain Nazari's operational decision and introduce no alternate prerequisite-bypassing route.
- Check: sending sensitive/offline-required inputs to the server because the model exceeds the download budget. Exercise boundaries of 50 MB and 50 milliseconds retain their exact inequalities.
- Acceptance: the recorded recommendations reflect the authored policy. The result identifies which requirement drove each answer and states what real device measurement remains necessary.
- Dependency: preserve training-to-runtime story progression and distinguish a policy choice from benchmark evidence. Profiles: C, F.

### L17. TensorFlow.js Setup

- Files: `packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx` and `packages/content/content/deep-orbit/browser-runtimes/exercises/tfjs-setup.yaml`. Visuals: FREG and DREG[`tensorflow-js-setup`]. Real-device extension: `scripts/fixtures/runtime-lab-package/README.md`.
- Change: expose the startup sequence as request, accepted/refused preference, ready, actual backend, and version. Place the small async implementation beside the relevant sequence. Keep simulated startup output and optional actual-device lab observations explicitly labeled.
- Check: returning the requested name before readiness, ignoring false, swallowing total initialization failure, and hardcoding the version.
- Acceptance: unknown names, registered failures, omitted preference, and no available backend produce the specified outcomes. The UI does not label a simulated backend as the learner's machine.
- Dependency: retain the existing mock contract. Any genuine device capture requires its own source/version metadata and lab execution. Profiles: C, F, S.

### L18. Model Loading

- Files: `packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx` and `packages/content/content/deep-orbit/browser-runtimes/exercises/load-model.yaml`. Visuals: FREG and DREG[`model-loading`].
- Change: organize the explanation around manifest, weight shards, usable model, inspected contract, and ownership. Link the actual simulated load call to copied input/output shapes, layer count, and cleanup. Keep cache/version discussion beside a clearly identified optional application example.
- Check: loading three times, dropping the null batch entry, reading metadata before await, and missing disposal when inspection fails.
- Acceptance: one loader result supplies all returned fields. Failure leaves a meaningful error rather than a fabricated model record. Explain that this helper disposes its inspected model while a prediction handler retains its own model.
- Dependency: preserve mock-versus-real distinction. Changing persistence or loader identities requires the source-contract/state review. Profiles: C, F, S.

### L19. Inference Pipeline

- Files: `packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx`, `packages/content/content/deep-orbit/browser-runtimes/exercises/inference-pipeline.yaml`, and `packages/content/content/deep-orbit/browser-runtimes/exercises/incident-tensor-leak.yaml`. Visuals: FREG and DREG[`inference-pipeline`].
- Change: trace raw fields, saved ranges, normalized feature order, [1,3] input, output score, class rule, and cleanup. Apply source-specific display names for legacy frequency/phase fields. Give the incident its own snapshot-to-rate-to-headroom calculation and preserve its story context.
- Check: reordered features, p equal to 0.5, incorrect chosen-class score, leaked tensors, and flat/falling snapshot counts.
- Acceptance: echo-probe output checks preprocessing without claiming model accuracy. The incident estimates capacity under a stated continuation assumption and identifies no cause. Both exercise briefs remain paired with their actual editors.
- Dependency: scoped feature mapping preserves stored values, units, extraction, and model hashes. Profiles: C, N, F, S.

### L20. ONNX Runtime Web

- Files: `packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx` and `packages/content/content/deep-orbit/browser-runtimes/exercises/onnx-comparison.yaml`. Visuals: FREG and DREG[`onnx-runtime-web`]. Optional real lab: `scripts/fixtures/runtime-lab-package/README.md`.
- Change: align identical inputs, completed outputs, parity tolerance, and timing boundaries in one comparison. Explain format, compatible graph, runtime, and execution provider at their point in the workflow. Show the simulated result before the separate route to real repeated measurement.
- Check: timing only dispatch, including model loading, comparing a constant, disposing the caller's model, and failing session cleanup on error.
- Acceptance: both runtimes receive the same [1,3] float32 values. Parity and simulated timing remain separate from accuracy and measured device speed. Preserve real-lab provenance and scope.
- Dependency: use existing compatible model contracts. No new conversion pipeline or runtime-ranking claim belongs in this task. Profiles: C, F, N, S.

### L21. Transformers.js for Pretrained Models

- Files: `packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx` and `packages/content/content/deep-orbit/browser-runtimes/exercises/load-pretrained-pipeline.yaml`. Visuals: FREG and DREG[`transformers-js`].
- Change: follow one crew report through task selection, a single factory call, a batch prediction, pairing, and final sorting. Put the required task/output contract in the visible teaching flow. Move the long unrelated task catalogue to an optional reference. Make model suitability and real download observations separate from simulated integration results.
- Check: sorting scores before pairing text, loading per report, wrong supported task, and loading on empty input.
- Acceptance: every report retains its original label/score pairing after sorting. A high sentiment score gains no urgency or accuracy interpretation. Keep the return to Sector 7-G and subsequent signal-processing handoff intact.
- Dependency: real model execution remains the separately identified lab work. A fixture-to-live switch needs explicit model/version and output contracts. Profiles: C, F, S.

## Lesson tasks for modules 5 through 8

Status: these lesson revisions are implemented and internally verified in the final record. No independent learner observation is claimed.
All cards include review of all five phases, references, hints, feedback,
recall, and predecessor/successor story handoffs.

Registry references below resolve to these exact files:

- `numeric`: `apps/web/app/components/lesson-visuals/numeric-investigations.ts`.
- `visuals`: `apps/web/app/components/lesson-visuals/deep-orbit-visuals.ts`.
- `experiments`: `apps/web/app/components/mdx/learning-experiment-data.ts` and
  `apps/web/app/components/mdx/learning-experiment.tsx`.
- `decisions`: `apps/web/app/components/mdx/decision-task-data.ts` and
  `apps/web/app/components/mdx/decision-task.tsx`.

Each card names the affected key in both `numeric` and `visuals`. Implementers
must inspect its shared helper before changing it. Preserve the other modes
when editing `signalSpec`, `forecastSpec`, `reconstructionSpec`, or
`attentionSpec`. A `mission-source contract` dependency means the reviewed
source, selected rows/times, feature meaning, units, transformations, model,
and any label authority must exist before changing primary fixtures. Correct
source labels alone do not complete that dependency.

### L22. Time vs Frequency

- Files: `packages/content/content/deep-orbit/signal-processing/01-time-vs-frequency.mdx`
  and `packages/content/content/deep-orbit/signal-processing/exercises/time-vs-frequency.yaml`.
- Registry: `time-vs-frequency` in `numeric` and `visuals`, through
  `signalSpec("views")`.
- Work: organize Concept around one capture pair with a linked time trace and
  magnitude comparison. Keep sample tolerance and raw-magnitude cutoff beside
  their distinct comparisons. Trace one divergent bin into the returned
  `divergentBin` and explain why this identifies a difference to investigate.
  Keep the full-transform versus magnitude distinction in the main path.
- Dependencies: the existing two-second synthetic pair and 64 Hz Concept
  generator need a mission-source contract before a primary-data migration.
  Preserve their separate identities in the first bounded slice.
- Acceptance: a selected bin shows its frequency, two magnitudes, difference,
  and applicable cutoff. Check equal samples, exactly-at-limit differences,
  DC divergence, and no-divergence results. A peak establishes no physical cause.
  Profiles: C, N.

### L23. Fourier Transform

- Files: `packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx`
  and `packages/content/content/deep-orbit/signal-processing/exercises/compute-fft.yaml`.
- Registry: `fourier-transform` in `numeric` and `visuals`, through
  `signalSpec("fourier")`. Review experiment `fft` in `experiments`.
- Work: sequence the main explanation as samples, computed magnitudes,
  eligible maximum, and bin-to-hertz conversion. Select a bin to reveal N,
  sample rate, bin width, and returned frequency. Keep DC exclusion, tie
  behavior, resolution, and sampling limits visible. Retain the derivation in
  its optional drawer. Put the separate two-tone experiment in an explicitly
  optional comparison when it does not advance the mission task.
- Dependencies: L22 and the mission-source contract. The one-second graded
  fixture cannot reproduce the story's 73.4 Hz precision. Preserve the
  longer-window discovery and distinguish 128 Hz demos from 256 Hz sensors.
- Acceptance: off-bin, strong-DC, tied-peak, and silent cases follow the stated
  computed-bin convention. Silence receives no tone-discovery claim. Profiles: C, N.

### L24. Spectrograms

- Files: `packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx`
  and `packages/content/content/deep-orbit/signal-processing/exercises/build-spectrogram.yaml`.
- Registry: `spectrograms` in `numeric` and `visuals`, through
  `signalSpec("spectrogram")`.
- Work: link one selected frame to its starting sample, covered interval,
  magnitude row, and place in time. Explain window length and hop through
  this same capture before the STFT terminology. First interpret the existing
  captured 40 Hz series. Add a full heatmap only after bounded capture includes
  every displayed frame/bin and its sample-rate metadata.
- Dependencies: L23, mission-source contract, and result-capture review for any
  heatmap extension. Preserve untapered challenge slices and identify the
  default-Hann library example separately. Tapering is taught in L26.
- Acceptance: incomplete final frames and a capture shorter than one frame
  produce the documented output. Rows stay in time order and bins stay in
  frequency order. The one-second test cannot measure the 73.4-second pulse
  interval. Profiles: C, N.

### L25. FFT as Features

- Files: `packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx`
  and `packages/content/content/deep-orbit/signal-processing/exercises/fft-features.yaml`.
- Registry: `fft-as-features` in `numeric` and `visuals`, through
  `signalSpec("features")`.
- Work: let selecting each returned feature reveal its calculation: maximum
  absolute sample, strictly opposite-sign pair count, or fixed FFT bin.
  Connect requested hertz limits to included bin centers and final vector
  order. Explain the later scaling step beside the raw vector. Keep the
  mission's eleven-input model distinct from this phase-omitting exercise.
- Dependencies: L23 and mission-source contract. Apply source-specific feature
  display mapping from the existing clarity-risk plan. Preserve the separate
  deployed three-feature model and research model identities.
- Acceptance: inclusive band edges, zeros in crossing pairs, negative peaks,
  fixed column order, and raw unscaled magnitudes remain correct. The artifact
  makes no 78%-to-87% accuracy claim. That comparison retains its fictional
  held-out rows, labels, and changed-capacity qualifications. Profiles: C, N.

### L26. Windowing and Overlap

- Files: `packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx`
  and `packages/content/content/deep-orbit/signal-processing/exercises/apply-window.yaml`.
- Registry: `windowing-and-overlap` in `numeric` and `visuals`, through
  `signalSpec("window")`.
- Work: follow one finite capture through endpoint weights, elementwise
  multiplication, changed spectrum, and the reported leakage measure. Show
  reduced distant leakage alongside broadened peaks and changed heights.
  Explain overlap through which original samples contribute to neighboring
  frames. Keep reconstruction conditions in the existing optional derivation.
- Dependencies: L24 and mission-source contract. A spectrum viewer needs
  bounded spectral capture. The Concept uses a squared-spectrum percentage,
  while the grader reports far-bin magnitude sums. Label both definitions
  and never compare their numbers as the same metric.
- Acceptance: symmetric-Hann endpoints, n=2, input ordering, off-bin tones, and
  matching-length application remain valid. Preserve the fixture-specific
  reduction claim and distinguish periodic from symmetric Hann. Profiles: C, N.

### L27. Sequences Matter

- Files: `packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx`
  and `packages/content/content/deep-orbit/recurrent-networks/exercises/create-sequences.yaml`.
- Registry: `sequences-matter` in `numeric` and `visuals`.
- Work: move from the order comparison into one visibly selected input window
  and its immediately following target. Link source indices with the returned
  arrays and tensor axes. Explain how a per-row classifier lacks this context
  while preserving the dense flattened-window baseline. Make stride and the
  final omitted window visible before the challenge.
- Dependencies: L26 handoff and mission-source contract. The eight-reading
  Concept examples and five-row graded stream remain separate until reviewed
  migration aligns their source and feature meaning.
- Acceptance: the target never appears inside its input window. Verify stride
  greater than one, multiple features, exact-length/no-target input, and null
  tensors for no pairs. Reversing values preserves membership but changes
  ordering. Building pairs is clearly separate from training. Profiles: C, N.

### L28. Simple RNNs

- Files: `packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx`
  and `packages/content/content/deep-orbit/recurrent-networks/exercises/build-rnn.yaml`.
- Registry: `simple-rnns` in `numeric` and `visuals`.
- Work: scrub one reading at a time and show input contribution, previous-state
  contribution, bias, and tanh output. Connect extracted one-unit library
  weights to that same calculation before showing wider-network code. Teach
  the running derivative product through the existing second captured series.
  Keep required recurrence, kernel ordering, and derivative mechanics visible.
- Dependencies: L27 and mission-source contract. The Concept currently divides
  input by ten while the graded cell uses its supplied input weight directly.
  Explain or eliminate that difference through a coordinated fixture revision.
- Acceptance: repeated calls reset state, outputs match the returned layer's
  actual weights, and reordered inputs change the trace appropriately. Check
  both shrinking and growing derivative examples. Scalar derivative behavior
  does not diagnose the fictional overnight model. Profiles: C, N.

### L29. LSTM Gates

- Files: `packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx`
  and `packages/content/content/deep-orbit/recurrent-networks/exercises/build-lstm.yaml`.
- Registry: `lstm-gates` in `numeric` and `visuals`.
- Work: stage the same update through retained old cell, gated candidate, new
  cell, and gated hidden output. Extend the current cell-only activity to
  connect the output gate and hidden state. Then map one-unit kernel columns
  to the handwritten update and the layer-parity result. Keep explicit
  recurrent activation and input/forget/candidate/output ordering in the main
  path. Retain a concise GRU comparison and direct-path gradient explanation.
- Dependencies: L28, mission-source contract, and capture review for any extra
  displayed gate values. Move the unrelated random-label fit into an optional
  execution reference while preserving all challenge prerequisites.
- Acceptance: a closed input gate blocks a nonzero candidate, gate-column
  swaps fail, and handwritten outputs match the layer with matching activations.
  Distinguish cell from hidden state and weights retained across fresh windows.
  Profiles: C, N.

### L30. Sliding Windows

- Files: `packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx`
  and `packages/content/content/deep-orbit/recurrent-networks/exercises/sliding-window.yaml`.
- Registry: `sliding-windows` in `numeric` and `visuals`.
- Work: replace the primary next-target activity with a timeline centered on
  the actual classification task: split first, form windows on either side,
  show last-reading labels, and omit crossing windows. Keep the earlier
  next-reading forecasting pattern as an explicitly separate comparison.
  Link the small membership example to the existing reproducible leakage
  demonstration without transferring its scores to the graded fixture.
- Dependencies: L27, L29, and mission-source contract. The current Concept
  activity teaches a different target rule from the challenge. Resolve this
  mismatch across activity, worked code, instructions, and recall together.
- Acceptance: zero shared source indices across sets, correct external labels,
  dropped crossing windows, and correct empty sides. Explain that the
  97.4%/60.6% comparison also changes evaluated periods. Profiles: C, N.

### L31. Sequence Prediction

- Files: `packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx`
  and `packages/content/content/deep-orbit/recurrent-networks/exercises/predict-next.yaml`.
- Registry: `sequence-prediction` in `numeric` and `visuals`, through
  `forecastSpec(false)`.
- Work: trace one forecast input window, predicted row, converted physical
  limits, clamped row, and next window. Teach saved-scaler dimensions and
  training-only fitting beside the three-feature data. Separate required
  training/history handling from feedback-loop mechanics. Preserve caller
  ownership and error cleanup guidance.
- Dependencies: L30 and a reviewed three-feature mission-source/model contract.
  The Concept's fixed arithmetic rule is not the trained model. Keep it
  optional if a mission-data activity replaces the primary mechanism. Current
  captured forecasts contain no future observations.
- Acceptance: invalid scalers, wrong-width/non-finite predictions, mutation,
  clamp-before-feedback, and zero forecast steps behave correctly. Retain
  MAE's z-score units and distinguish one-second forecasts from the separate
  47-minute story forecast. Add no unsupported accuracy curve. Profiles: C, N, T.

### L32. Normal vs Anomalous

- Files: `packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx`,
  `packages/content/content/deep-orbit/anomaly-detection/exercises/detect-anomaly.yaml`,
  and `packages/content/content/deep-orbit/anomaly-detection/exercises/incident-baseline-drift.yaml`.
- Registry: `normal-vs-anomalous` in `numeric` and `visuals`. Preserve saved
  decision `deep-orbit-anomaly-7741-training-set` and its later outcomes.
- Work: show the reading's distance from its supplied baseline and strict
  boundary. Follow with the incident's observed alert fractions, candidate
  mean/spread, and next investigation. Keep measurement, Gaussian reference,
  and same-data fitting/checking distinct. Put deeper distribution arithmetic
  in optional detail after required assumptions are visible.
- Dependencies: L31 handoff and reviewed baseline/label authority. Preserve
  sample 7741's unresolved label and raw capture.
- Acceptance: exact three-sigma, negative/non-finite spread, zero-spread
  convention, changed baselines, and incident rule ordering remain correct.
  A candidate baseline receives no deployment approval from its own fit rows.
  Profiles: C, N, E, S.

### L33. Autoencoders

- Files: `packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx`
  and `packages/content/content/deep-orbit/anomaly-detection/exercises/build-autoencoder.yaml`.
- Registry: `autoencoders` in `numeric` and `visuals`, through
  `reconstructionSpec(false)`.
- Work: connect row screening to the actual fit inputs, then explain input,
  bottleneck, and reconstruction on one selected row. First interpret the
  existing aggregate errors. Add input/reconstruction detail only through
  bounded capture. Keep essential architecture, training, and ownership rules
  visible before the challenge.
- Dependencies: L32 and a reviewed calibration-source/model contract. The
  four-feature averaging activity, eight-feature synthetic exercise, and
  eleven-feature mission model need distinct identities until coordinated
  migration. Preserve the saved training-set choice outcomes.
- Acceptance: excluded rows never reach fit, all-excluded/mismatched flags
  fail before model construction, and failure cleanup respects supplied-model
  ownership. Comparison runs share initial weights/settings. Actual scores
  replace no fictional 1.4x result and promise no fixed separation. Profiles: C, N, T, S.

### L34. Reconstruction Error

- Files: `packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx`,
  `packages/content/content/deep-orbit/anomaly-detection/exercises/reconstruction-error.yaml`,
  and `packages/content/content/deep-orbit/anomaly-detection/exercises/incident-missed-anomaly.yaml`.
- Registry: `reconstruction-error` in `numeric` and `visuals`, through
  `reconstructionSpec(true)`.
- Work: trace input/reconstruction pairs into squared feature errors and the
  returned mean. Pair that with the incident's separate absolute errors,
  positive baseline, ratio ranking, and low-error list. Explain the change
  of measure at the incident boundary. Keep the low-error-anomaly counterexample
  visible where the lesson explains what its score establishes.
- Dependencies: L33 and mission-source contract. The current offset-model
  probe does not produce the story's twelve-times-normal case.
- Acceptance: correct MSE reduction, single-row batch, no added live tensors
  after warmup, ratio ties by lower index, and original-order low-error
  indices. Raw error and relative error may rank differently. Neither ranks
  physical causes. Profiles: C, N, E.

### L35. Threshold Tuning

- Files: `packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx`,
  `packages/content/content/deep-orbit/anomaly-detection/exercises/find-threshold.yaml`,
  and `packages/content/content/deep-orbit/anomaly-detection/exercises/incident-false-alarm-storm.yaml`.
- Registry: `threshold-tuning` in `numeric` and `visuals`. Review experiment
  `threshold` in `experiments` and decision `rule-or-model` in `decisions`.
- Work: link candidate cutoff, case flags, confusion counts, precision, recall,
  and F1 using the same supplied rows. Keep F1 selection and the crew's cost
  decision explicit. Present the storm as a separate ordered runbook task.
  Keep the build-service transfer decision explicitly outside ship data.
- Dependencies: L15 evaluation, L32 baseline, L34 scores, and reviewed source
  contracts for each distinct activity.
- Acceptance: strict cutoff comparison, tied candidates, all-zero F1, zero
  alert baseline, and first-match runbook priority remain correct. Thresholds
  use validation data. Six cases establish no future alert rate. Profiles: C, N, E.

### L36. The Anomaly

- Files: `packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx`
  and `packages/content/content/deep-orbit/anomaly-detection/exercises/ensemble-detector.yaml`.
- Registry: `the-anomaly` in `numeric` and `visuals`.
- Work: show each supplied score or computed statistic, its own units/cutoff,
  comparison, vote, and final majority decision. Keep the signed z-score and
  actual baseline inspectable. Explain the shift from the story's multifeature
  forecast MSE to this exercise's amplitude-error gate before using either.
  Preserve the Fibonacci/calibration discovery in its earned story section.
- Dependencies: L32, L34, L35, and mission-source contract. The exercise
  computes one statistical detector and receives other detector outputs. It
  does not run the full autoencoder/LSTM system.
- Acceptance: below-mean sign, exact cutoff boundaries, constant-window null
  score, lost float32 variation, invalid inputs, and varying window lengths
  remain covered. Two votes are no probability or cause diagnosis. Preserve
  unknown signal origin and the 0.9987 crew correlation. Profiles: C, N, E.

### L37. Beyond LSTM

- Files: `packages/content/content/deep-orbit/advanced-time-series/01-beyond-lstm.mdx`
  and `packages/content/content/deep-orbit/advanced-time-series/exercises/simple-attention.yaml`.
- Registry: `beyond-lstm` in `numeric` and `visuals`, through
  `attentionSpec(false)`. Review experiment `attention` in `experiments`.
- Work: trace query/key products, softmax across time, each weighted value,
  and the returned blend. Keep separate keys and values visible and map the
  rank-1 exercise inputs to the batched worked example. Shorten repeated
  focus metaphors by explaining the actual operation once.
- Dependencies: L28, L36 handoff, and mission-source contract. The fixed
  weight-revealing probe and separate experiment establish arithmetic, not
  forecast quality. Preserve the reviewed timestamp change in the epilogue.
- Acceptance: different key/value widths, one time step, dv=1 axis retention,
  unscaled scoring, and caller-owned input lifetime remain correct. Reordering
  matched key/value rows preserves the same blend for the same query. Weights
  receive no causal interpretation. Profiles: C, N.

### L38. Temporal Attention

- Files: `packages/content/content/deep-orbit/advanced-time-series/02-temporal-attention.mdx`
  and `packages/content/content/deep-orbit/advanced-time-series/exercises/temporal-attention.yaml`.
- Registry: `temporal-attention` in `numeric` and `visuals`, through
  `attentionSpec(true)`.
- Work: use one table to connect original reading, normalized position,
  score, weight, weighted contribution, and pooled feature. Lead with the
  position-aware challenge path before expanding into batched scorer examples.
  Keep the missing-buffer failure and timestamp explanation together.
- Dependencies: L37 and mission-source contract. Retain warnings about actual
  tensors versus symbolic layer construction where that code remains. Preserve
  the 80 readings, 79-second endpoint span, 74 positions, and 73.4-second raw
  gap as distinct measurements.
- Acceptance: the added position affects scores but never enters the summary.
  Check T=1 position zero, d=1 retained axis, normalized weights on truncated
  input, and a wrong-value output with the correct shape. A weight sum of one
  establishes no complete capture or confidence. Profiles: C, N.

### L39. Forecasting

- Files: `packages/content/content/deep-orbit/advanced-time-series/03-forecasting.mdx`
  and `packages/content/content/deep-orbit/advanced-time-series/exercises/forecast-signal.yaml`.
- Registry: `forecasting` in `numeric` and `visuals`, through
  `forecastSpec(true)`.
- Work: select a horizon and inspect the two input histories, predictions,
  arrived observation, and errors from the same trained model. Start with
  one changed feedback step before the full loop. Keep the fixed-rule
  arithmetic and logistic example as optional supporting comparisons when
  the mission activity supplies the required mechanism.
- Dependencies: L31, L38, and reviewed scalar source/model contract. Preserve
  the actual-series capture and separate three-feature forecaster identity.
- Acceptance: rollout appends predictions, replay appends only prior arrived
  observations, arrays remain unchanged, and failures dispose only owned
  resources. Equal paths and poor forecasts are valid outcomes. Errors need
  not increase at every horizon. Preserve the failed 0312/0308 story schedule
  and unresolved cause of compression. Profiles: C, N, T.

### L40. Kalman Filters

- Files: `packages/content/content/deep-orbit/advanced-time-series/04-kalman-filters.mdx`
  and `packages/content/content/deep-orbit/advanced-time-series/exercises/kalman-filter.yaml`.
- Registry: `kalman-filters` in `numeric` and `visuals`.
- Work: replace the unrelated one-update primary illustration with selection
  within the existing eight-day fictional interval log. Show prior estimate,
  prior/predicted variance, measurement variance, gain, correction, and next
  state for one selected day. Keep raw measurements, EMA baseline, filtered
  estimates, and lag visible. Retain the gain derivation as optional detail.
- Dependencies: L39 and bounded capture extension for uncertainty/gain traces.
  Day 1 initializes state and receives no fabricated correction. This existing
  log supplies a mission-data source without importing the toy's 10/14 values.
- Acceptance: exact repeated-update arithmetic and changed-noise cases reject
  a fixed-alpha substitute. Values retain seconds and variances retain squared
  units. Smoothness establishes no accuracy gain. Preserve one-state lag and
  avoid adding an unrequired velocity-state implementation. Profiles: C, N.

### L41. Ensemble Methods

- Files: `packages/content/content/deep-orbit/advanced-time-series/05-ensemble-methods.mdx`
  and `packages/content/content/deep-orbit/advanced-time-series/exercises/weighted-ensemble.yaml`.
- Registry: `time-series-ensemble-methods` in `numeric` and `visuals`.
- Work: select one target position and inspect every member prediction,
  equal blend, prior-error-weighted blend, and errors. Separate the earlier
  normalized-MAE weighting period from the current evaluation period. Keep
  stable weight calculation and comparison with the best member in the main
  path. Keep a concise stacking prerequisite and use optional detail for the
  covariance derivation where it supports no required implementation.
- Dependencies: L40 and mission-source contract for aligned member targets,
  times, units, and periods. The four synthetic targets do not reproduce the
  story's 0.036 result.
- Acceptance: correlated errors, a blend worse than the best member, exact
  ties, tiny positive prior errors, and JavaScript property-name member keys
  remain correct. `beatsBest` describes the equal blend only. Neither squared
  MAE weights nor agreement guarantee a superior forecast. Profiles: C, N, E.

## Module 9: LLM Integration

For L42-L46, update the named key in both
`apps/web/app/components/lesson-visuals/deep-orbit-visuals.ts`
(`DEEP_ORBIT_VISUALS`) and
`apps/web/app/components/lesson-visuals/flow-investigations.ts`
(`FLOW_INVESTIGATIONS`) when changing the Concept activity. The existing
activities often use separate miniature fixtures. Keep their source boundary
honest during the bounded clarity slice. Replacing them with mission evidence
requires the source-contract work before this module can pass full continuity
review.

### L42. LLMs for Science

- Files: `packages/content/content/deep-orbit/llm-integration/01-llms-for-science.mdx`
  and `packages/content/content/deep-orbit/llm-integration/exercises/llm-client.yaml`.
  Visual key: `llms-for-science`.
- Change: start the required explanation with one supplied report reply.
  Connect its raw text, located JSON, parsed fields, and accepted or rejected
  result. Explain the HTTP adapter after this boundary makes sense. Keep
  required parsing and validation visible. Retain the existing optional
  generation/Transformer reference. Show the actual accepted reply table and
  identify which claim checks still require Farah.
- Dependency: L41's report handoff and the reviewed report-source contract.
  The exercise continues to call its supplied callback once. It makes no real
  language-model request.
- Acceptance: zero is an accepted score. A numeric string, blank reasoning,
  invalid class, and malformed JSON fail visibly. A schema-valid unsupported
  claim remains subject to evidence review. Recall distinguishes structure
  from truth. Verify with C and F.

### L43. Prompt Engineering

- Files: `packages/content/content/deep-orbit/llm-integration/02-prompt-engineering.mdx`
  and `packages/content/content/deep-orbit/llm-integration/exercises/prompt-template.yaml`.
  Visual key: `prompt-engineering`.
- Change: let learners inspect the actual assembled prompt and select role,
  catalogue, current reading, and response requirements. Link each interpolated
  value to its input argument. Place the distinction between physical Hz,
  zero-crossing count, and scaled classifier features beside the relevant
  values. Consolidate repeated parsing discussion around the prerequisite
  established in L42.
- Dependency: use the reviewed mission reading and catalogue contract before
  replacing the activity's made-up P1/P2 records. Preserve raw units and
  source-specific feature meaning. Keep the unit derivation optional.
- Acceptance: changed arguments change their matching prompt lines. The
  catalogue and current reading occupy separate lines. Missing catalogue
  facts produce useful feedback. Present prompt construction as the result,
  with no fabricated model response or quality score. Verify with C and F.

### L44. RAG for Signals

- Files: `packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx`,
  `packages/content/content/deep-orbit/llm-integration/exercises/retrieve-signals.yaml`,
  and `packages/content/content/deep-orbit/llm-integration/exercises/rag-pipeline.yaml`.
  Visual key: `rag-for-signals`.
- Change: separate the required explanation into record selection and claim
  checking. Trace one reviewed mission query through filters, retained order,
  matched count, twenty-row cap, and omissions. Selecting a structured claim
  reveals its exact record, field, unit, value, and supported calculation.
  Keep optional search-method comparisons after learners understand this path.
- Dependency: L42-L43 and an explicit record/claim source contract. The
  Concept activity currently uses keyword ranking, while the exercise uses
  field filters. Align their taught mechanism or explicitly distinguish the
  optional comparison.
- Acceptance: both exercises remain required. Wrong-row, swapped-field,
  wrong-unit, repeated-citation, truncation, and unsupported-text cases receive
  explanatory outcomes. A matching number alone cannot pass. Verify with C,
  F, and N.

### L45. Report Generation

- Files: `packages/content/content/deep-orbit/llm-integration/04-report-generation.mdx`
  and `packages/content/content/deep-orbit/llm-integration/exercises/generate-report.yaml`.
  Visual key: `report-generation`.
- Change: show one reviewed section traveling from draft and evidence through
  the supplied approval decision into the assembled report. Explain the
  example's `generated` field and exercise's `content` field once at their
  handoff. Link included sections to review status and list withheld headings
  without showing withheld text. Put the sampler detail in the existing
  supporting explanation after the assembly task is clear.
- Dependency: L44 and reviewed section records. Preserve the optional
  `deep-orbit-llm-cut-call` decision, release gate, omission, and next-watch
  consequences. The exercise formats supplied text and calls no LLM.
- Acceptance: original section order, empty input, all-withheld, and
  all-approved cases remain correct. A withheld body's distinctive text never
  appears in the result. A changed draft needs fresh approval. Verify with C,
  F, and S for persisted choice consequences.

### L46. Multi-Model Systems

- Files: `packages/content/content/deep-orbit/llm-integration/05-multi-model-systems.mdx`
  and `packages/content/content/deep-orbit/llm-integration/exercises/model-pipeline.yaml`.
  Visual key: `multi-model-systems`.
- Change: trace one raw reading through scaling, classifier output, detector
  decision, and optional writer. Show the input/output contract at each
  selected handoff. Explain classifier implementation separately from pipeline
  orchestration before joining them. Keep every required stage operation in
  the main flow. Label the Concept's controlled replies separately from the
  exercise's real supplied-model prediction.
- Dependency: L42-L45 and the source-specific feature mapping. Preserve the
  alert/report-review boundary and the fictional 340 MB handoff into L47.
- Acceptance: unsupported labels become unknown. Nonfinite scores and string
  booleans stop the proper stage. A false detector skips the writer. Every
  stage receives the original reading. Valid fields do not certify a correct
  prediction. Preserve choice continuation. Verify with C, N, F, and S.

## Module 10: Optimization and Edge

L47, L50, and L51 use their slug keys in `DEEP_ORBIT_VISUALS` and
`FLOW_INVESTIGATIONS` in the two files named above. L48 and L49 use
`apps/web/app/components/lesson-visuals/numeric-investigations.ts`
(`NUMERIC_INVESTIGATIONS`) plus `DEEP_ORBIT_VISUALS`.

### L47. Model Profiling

- Files: `packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx`
  and `packages/content/content/deep-orbit/optimization-edge/exercises/profile-model.yaml`.
  Visual key: `model-profiling`.
- Change: retain the lost-capture opening. Follow one profiling call through
  input creation, untimed warmup, timed prediction/readback, and cleanup. Show
  completed call durations and their mean beside the actual parameter
  inventory. Explain weight bytes, live tensors, and peak application memory
  at their respective measurements. Use the current controlled clock to teach
  the arithmetic and the runtime lab for separate device observations.
- Dependency: L46's model inventory and the measurement-source contract.
  Preserve the irreversible missed capture and relay slot.
- Acceptance: warmup stays outside timing. Slow calls affect the mean. A
  rejected prediction/readback still releases owned tensors. Zero-parameter
  layers remain in the inventory. No display converts test-clock durations
  into device performance or parameter bytes into peak memory. Verify with C,
  N, and F.

### L48. Quantization

- Files: `packages/content/content/deep-orbit/optimization-edge/02-quantization.mdx`
  and `packages/content/content/deep-orbit/optimization-edge/exercises/quantize-weights.yaml`.
  Visual key: `quantization`.
- Change: use a clearly identified excerpt from one supplied exercise kernel
  to trace original float, kernel bounds, scale, integer code, and decoded
  float. Then inspect actual before/after predicted classes. Keep the
  browser lab's binary model distinct from the exercise's multiclass model.
  Place converter commands after the storage mechanism and separate packing
  a file from this exercise's simulated integer arrays.
- Dependency: L47 measurement vocabulary and a reviewed kernel/model identity
  before replacing the Concept's fixed [-1, 1] miniature example.
- Acceptance: constant kernels avoid division by zero. Biases stay unchanged.
  Stored codes preserve flattened positions. Unlabeled disagreements receive
  no accuracy verdict. Smaller storage makes no speed or peak-memory claim.
  Verify with C and N, plus the actual converter/runtime-lab checks if those
  instructions change.

### L49. Pruning

- Files: `packages/content/content/deep-orbit/optimization-edge/03-pruning.mdx`
  and `packages/content/content/deep-orbit/optimization-edge/exercises/prune-weights.yaml`.
  Visual key: `pruning`.
- Change: keep the directive and failed tree-shaking analogy. Tie the
  magnitude cutoff to an identified kernel excerpt, then connect requested
  sparsity to actual per-class recall curves. Show class support, missing-class
  nulls, tied cutoffs, and original-model restoration beside the comparison.
  Retain the Hessian and low-rank derivations in their existing optional
  drawers. Consolidate repeated magnitude caveats around the observed failure.
- Dependency: L48's model/version distinction. Case-level comparisons require
  added bounded capture before the UI can show them. Aggregate curves remain
  useful until that capture exists.
- Acceptance: each level starts from cloned original weights. Level zero
  preserves behavior. Failure restores originals. Tied cutoffs can produce a
  different achieved sparsity. No claim attributes rare patterns universally
  to small weights or promises smaller dense files. Verify with C, N, and T.

### L50. Caching Strategies

- Files: `packages/content/content/deep-orbit/optimization-edge/04-caching-strategies.mdx`,
  `packages/content/content/deep-orbit/optimization-edge/exercises/inference-cache.yaml`,
  and `packages/content/content/deep-orbit/optimization-edge/exercises/incident-stale-verdict.yaml`.
  Visual key: `caching-strategies`. Also update `cache` in
  `apps/web/app/components/mdx/learning-experiment-data.ts` if its source or
  explanation changes.
- Change: teach one request sequence with key fields, hit/miss, model-call
  count, returned value, and eviction. Explain key collision separately from
  stale version/age. Connect the existing collision experiment and incident
  exercise to those two failure modes. A full request trace needs additional
  bounded capture beyond the current repeat-request artifact.
- Dependency: source/model-version contract and L47's timing scope. Preserve
  `deep-orbit-cache-policy` and its later consequences.
- Acceptance: separate model caches, caller mutation, LRU hits, exact TTL
  boundary, fresh old-version entries, and opposite-verdict rounded inputs
  remain covered. No fictional language-model timing becomes classifier savings.
  Verify with C, N, F, and S.

### L51. WebGPU Acceleration

- Files: `packages/content/content/deep-orbit/optimization-edge/05-webgpu-acceleration.mdx`
  and `packages/content/content/deep-orbit/optimization-edge/exercises/gpu-backend.yaml`.
  Visual key: `webgpu-acceleration`.
- Change: show the preference list and each actual initialization outcome
  before explaining the selector. Link false results, thrown errors, the
  successful attempt, readiness, and returned active backend. Put completed
  prediction timing beside its await/readback boundary. Keep the controlled
  backend exercise separate from the optional real device comparison.
- Dependency: L47's measurement contract. Preserve the current worker backend
  policy and the later cache-policy continuation. No runtime package, model,
  or backend policy change belongs to this clarity slice.
- Acceptance: a false result and a thrown error both try the next backend.
  Success stops attempts. `ready` is awaited once. All-failed behavior remains
  explicit. Fallback success claims no speed advantage or hardware support.
  Verify with C and F, plus N for changed timing examples and S for choices.

## Module 11: Capstone

L52-L56 use their slug keys in both `DEEP_ORBIT_VISUALS` and
`FLOW_INVESTIGATIONS`. Keep the planning activities distinct from the actual
exercise runs and fictional mission records.

### L52. System Architecture

- Files: `packages/content/content/deep-orbit/capstone/01-system-architecture.mdx`
  and `packages/content/content/deep-orbit/capstone/exercises/pipeline-architecture.yaml`.
  Visual key: `system-architecture`.
- Change: follow the supplied eight-sample input through runtime validation,
  awaited normalization, FFT, and tensor construction. Expose the selected
  handoff's value/shape and ownership before the full generic pipeline code.
  Explain the budget activity as planning with fixed costs. Keep its timing
  interpretation distinct from the actual composition exercise.
- Dependency: source contract for the eight-sample composition fixture.
  Its window scaler differs from the production classifier. Preserve that
  explicit identity until a reviewed integration task changes it.
- Acceptance: malformed middle-stage input stops before processing. Async
  middle and final stages preserve order and actual output. Explain that the
  any-typed stage list does not guarantee compatible TypeScript stage types.
  The displayed result verifies this composition, with no full-system claim.
  Verify with C, N, and F.

### L53. CI/CD Pipeline

- Files: `packages/content/content/deep-orbit/capstone/02-ci-cd-pipeline.mdx`,
  `packages/content/content/deep-orbit/capstone/exercises/ci-cd-gate.yaml`, and
  `packages/content/content/deep-orbit/capstone/exercises/export-model-artifact.yaml`.
  Visual key: `ci-cd-pipeline`.
- Change: explain candidate identity, behavioral gate, and export round-trip
  as separate checks. Link the supplied prediction rows to their denominator
  and gate decision. Link the actual saved model's weight inventory to
  original/reloaded probe predictions. Identify the missing fingerprints,
  preprocessing, and label metadata before proposing a release-bundle capture.
- Dependency: L52's handoff contracts. The current two exercise artifacts are
  separate evidence. Connecting them requires compatible model and data
  versions, rather than a new label implying they match.
- Acceptance: missing labels stay in the total and cannot count as correct.
  An empty batch fails. Exact threshold equality passes. Export awaits the
  real handler and reloads real bytes. Round-trip parity implies no hosted
  deployment or generalization. Both exercises remain visible. Verify with C,
  N, and F.

### L54. Monitoring

- Files: `packages/content/content/deep-orbit/capstone/03-monitoring.mdx`
  and `packages/content/content/deep-orbit/capstone/exercises/model-monitor.yaml`.
  Visual key: `monitoring`.
- Change: trace a supplied score log, duration log, and feature window into
  their separate summaries. Select a percentile to reveal the sorted rank,
  and select a feature mean to show its difference from the baseline. Keep
  the Concept's fixed alert examples and exercise's computed log summaries
  explicitly separate. Explain review actions beside each signal.
- Dependency: L47's timing scope and the reviewed source/scale of each
  monitoring window. Preserve `deep-orbit-drift-response` and the
  missing-label condition.
- Acceptance: empty logs display No data rather than zero. Numeric sorting,
  P0/P100, unchanged caller arrays, and equal means with changed spread
  distinguish plausible errors. A mean shift or score trend cannot establish
  accuracy loss or authorize retraining. Verify with C, N, F, and S.

### L55. Documentation

- Files: `packages/content/content/deep-orbit/capstone/04-documentation.mdx`
  and `packages/content/content/deep-orbit/capstone/exercises/write-model-card.yaml`.
  Visual key: `documentation`.
- Change: make the learner's actual generated card the central result.
  Selecting a line highlights its supplied metadata and percentage or
  minimum-recall calculation. Introduce the card through the next watch's
  question before the full interface. Group input-window/channel meaning,
  evaluation scope, and measurement scope beside their matching fields.
  Keep runbook judgment distinct from string formatting.
- Dependency: L53-L54 and a reviewed model-card source identity. The fictional
  five-class card must not inherit another lesson's downloaded model or claim
  its scores were measured by the learner.
- Acceptance: changed class names/order still select the weakest recall.
  Evaluation context stays beside accuracy. Weight bytes and full download,
  classifier time and pipeline time remain distinct. Complete fields do not
  verify their claims or evaluate a new sensor. Verify with C, N, and F.

### L56. Launch

- Files: `packages/content/content/deep-orbit/capstone/05-launch.mdx` and
  `packages/content/content/deep-orbit/capstone/exercises/verify-deployment.yaml`,
  `packages/content/content/deep-orbit/capstone/exercises/launch-rehearsal.yaml`,
  `packages/content/content/deep-orbit/capstone/exercises/classify-anomaly.yaml`.
  Visual key: `launch`.
- Change: pair the three existing briefs with stable matching editor titles
  and anchors in `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx`
  and its actual brief/editor render branches. Keep editors mounted. Explain
  verification, real rehearsal training, and supplied detector voting as
  distinct tasks. Correct the independent project's supplied-model/build
  claim against `apps/web/public/assignments/room-occupancy-v1/README.md` and
  `package.json`. Reconcile author effort estimates.
- Dependency: finale state-preservation task and L52-L55. Preserve all three
  passes, 0157 canary, thirty matches, two-minute rollout, optional decision,
  0213 entry, and final `operator_note: none` as the last story beat.
- Acceptance: anchor navigation/reload retain drafts and results. Timeout
  skips dependent checks. Actual fit evidence stays distinct from supplied
  scores. Score differences imply no accuracy gain. The independent project
  remains separate. Verify with C, N, T, E, F, and S.

## Draft-world discovery tasks

The following source inventory establishes authoring scope. These lessons have
not received a new per-lesson clarity plan in this pass.

| ID  | World and exact root                      | Current inventory                                  | Required discovery output before per-lesson implementation                                                                                                                                                                                                 |
| --- | ----------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W01 | `packages/content/content/neon-protocol/` | 11 modules, 54 MDX lessons, 58 exercise YAML files | Map every lesson and exercise. Identify source images, labels, coordinate transforms, input/output dimensions, and rights. Plan a connected image/feature/output trace and review convolution/padding prerequisites with domain expertise.                 |
| W02 | `packages/content/content/signal-ward/`   | 11 modules, 55 MDX lessons, 60 exercise YAML files | Map every lesson and exercise. Identify text sources, token/span alignment, labels, retrieval evidence, and task-specific validity. Separate text processing from medical claims and obtain the clinical/domain review required before release.            |
| W03 | `packages/content/content/nova-canvas/`   | 11 modules, 55 MDX lessons, 58 exercise YAML files | Map every lesson and exercise. Identify architecture/output dimensions, model/seed/source lineage, generated references, and claimed comparisons. Preserve randomness and human assessment rather than inventing a numerical creative-quality verdict.     |
| W04 | `packages/content/content/terra-grid/`    | 11 modules, 55 MDX lessons, 59 exercise YAML files | Map every lesson and exercise. Identify actual device/runtime conditions, measured versus simulated traces, deployment boundaries, and privacy assumptions. Plan modality-specific explanations and technical review of privacy guarantees before release. |

Each discovery output needs a complete objective/prerequisite/assessment map,
world-specific story/data contracts, a representative hard-lesson design,
file-level lesson cards, and separate source/runtime/browser/learner evidence
statuses. Use `docs/world-launch-checklist.md` and the current content quality
plan for release requirements. Keep all four worlds coming soon until their
own gates pass. Their 219 authored lessons do not inherit Deep Orbit's review
status or learner evidence.

## Completion record and release boundaries

A lesson card closes only when its revised teaching, all affected surfaces,
required exercise contracts, meaningful result, and adjacent story handoffs
pass their applicable internal checks. Record a bounded orientation slice
separately when a dependent mission-data migration remains open. A module
cannot claim full continuity while that migration is pending.

The implementation lead records for each P/L/W task its status, exact changed
files, source revision/hashes, prerequisite tasks, findings, checks actually
run, checked routes/backends/devices, unresolved limitations, and evidence
links. Use planned, in progress, awaiting source contract, internally verified,
and learner evidence pending as separate states where applicable. Do not
replace an old failure or first attempt with a successful retry.

A reproducible false result, false source attribution, lost draft, answer leak,
story spoiler, changed unknown label, or unreadable historical capture stops
that candidate. Repair the responsible patch and rerun its affected checks.
Rollback removes only that patch or disables its new presentation/writes.
Keep compatible readers, IDs, learner records, and unrelated work.

The first implementation session starts with P00, then records P01 contracts
for L02 and the dense reference set. Begin shared P02/P04 changes only against
those concrete contracts. Preserve existing current-result functionality while
new families are added. Do not begin with a global punctuation rewrite, a new
lesson shell, or a course-wide fixture replacement.

After the six reference lessons, estimate the remaining work from observed
content, fixture, UI, and verification effort separately. Use those estimates
to schedule module batches. No fixed calendar or staffing promise follows
from this plan. Human study windows follow their existing protocol.

Planning deliverable validation checks lesson-card order, all current exercise
references, existing source paths, declared future files, internal links, and
formatting. It supplies no product test result. Product implementation,
independent learning evidence, and deployment remain separate work.

## Final Deep Orbit delivery

All 56 lesson revisions are complete for the existing exercise/source contracts. The final [implementation record](../../audits/course-clarity-implementation-2026-11-09.md#all-56-lesson-revisions-and-final-integration) contains per-lesson coverage, source attribution, executed checks and limitations. The original starter executable code and all canonical solutions remain. The evaluation starter has one comment-only source-identity correction. All original named checks remain.

Task anchors preserve mounted editors and current-tab outputs. Reload restores each account's drafts and saved completion. Transient captures retain their existing current-tab lifetime, and the established normalization/network/evaluation saved-evidence paths remain unchanged.

The course still uses distinct diagnostic fixtures, controlled callbacks and authored mission records. The revisions identify those boundaries and preserve the unknown readings and existing diagnostic fixtures. Historical missing before-change media cannot establish a before/after learning gain. The coming-soon-world and learner-research workstreams remain outside this delivery.
