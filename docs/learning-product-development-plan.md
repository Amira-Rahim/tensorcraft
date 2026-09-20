# Deep Orbit learning-product development plan

Date: 2026-09-19. Status: approved changes implemented and deployed. The screen-reader walkthrough is deferred by owner decision (2026-09-20), so P7 and final P9 acceptance stay provisional until it is scheduled. Owner rulings of 2026-09-20, recorded in the ledger, reversed three outcomes of this plan: sequential module unlock is restored for purchasers, course preferences render for purchasers only, and the dashboard continuation section is removed. The [implementation ledger](learning-product-implementation.md) and [release record](audits/learning-product-release-2026-09-19.md) distinguish completed checks, that open verification and later independent evidence.

This plan implements all twelve findings in the [final learning-product audit](audits/final-learning-product-audit-2026-09-19.md). It extends the approved [content quality plan](content-quality-plan.md), preserving its completed work and the owner's direction: internal quality first, independent reviewers and learner studies afterward. Finding IDs in this document refer to the September 19 audit, not the differently numbered findings in earlier audits.

The implementation baseline is revision `80a3f029`. The audit's [retained evidence](audits/final-learning-product-2026-09-19/evidence.json) records what was inspected and the limits of that inspection. Estimates below are planning estimates, not delivery promises.

## 1. The result we are building toward

A JavaScript engineer should be able to start without prior ML knowledge, obtain an understandable result early, and gradually learn to prepare data, train and evaluate a model, diagnose failures, and run a saved artifact in a JavaScript application. Someone who already understands ML should be able to reach the engineering challenges directly and find meaningful work on evaluation, runtime behavior, caching, conversion, and deployment.

The story should make these activities necessary. A discovery changes the crew's next action. A mistake costs something concrete. A character remembers what they learned. A choice changes a later responsibility or resource allocation. Deep Orbit should deliver its own ending while giving a returning learner a clear reason to explore another theme.

The purchase should provide a coherent course, useful feedback, a satisfying season, and work the learner can explain and run outside Tensorcraft. The $50 price, and any later increase the owner decides on, needs that practical substance. Lesson counts, illustrations, certificates, and hours of material help describe the package; they cannot establish learning or willingness to pay.

The central learning sequence is:

**Encounter a problem → predict → change or build something → inspect the evidence → explain a decision → meet a changed case later.**

Use this sequence across a module. Do not force every lesson into an identical seven-part template or add another mandatory step to the existing six lesson phases.

## 2. Complete coverage of the audit

| Finding                                   | Development commitment                                                                                       | Main patches      | Evidence that closes the internal work                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| F01: specific useful outcome              | Rewrite the world offer around demonstrable capabilities; show the external project and honest prerequisites | P2, P5            | Every advertised outcome links to a lesson, check, or runnable artifact                                          |
| F02: earlier useful result                | Build the shape experiment and revise the first-session sequence around it                                   | P1, P2            | A complete free entry path reaches a prediction, visible result, and changed example; timed walkthrough recorded |
| F03: mechanisms need experiments          | Deliver three substantial experiments and four smaller concept interactions                                  | P1, P4            | Numerical contracts, accessible controls, feedback, and follow-up cases verified                                 |
| F04: route for ML-experienced learners    | Separate ML route preference from JS experience; make paid prerequisites advisory                            | P2                | Correct access and recommendations across direct links, maps, dashboard, and navigation; no unearned completion  |
| F05: increasing judgment                  | Connect worked examples, variations, diagnosis, and transfer at capability level                             | P4, P6            | Objective-to-assessment map, valid alternative solutions, and assistance-aware records                           |
| F06: visible growing system               | Show five system stages with links to actual practice and project evidence                                   | P5                | Every status has a known source; missing, assisted, and older evidence remain distinguishable                    |
| F07: character development                | Revise character arcs across all eleven modules and remove repeated regressions                              | P3, P6            | Scene-by-scene continuity record showing setup, changed behavior, and payoff                                     |
| F08: meaningful decisions                 | Improve two existing decisions first, then review all six and their later effects                            | P3                | Defensible tradeoffs, version-safe saved choices, all branches and neutral states checked                        |
| F09: readable prose and honest provenance | Review every lesson surface in context; separate scene prose from measurement records                        | P3, P6            | Complete current review manifest; claims supported; no unresolved consequential teaching defects                 |
| F10: instructional design                 | Pair explanation, controls, code, and results; preserve typography and identity                              | P1, P4, P7        | Rendered desktop/mobile and accessibility evidence, including failure and resume states                          |
| F11: reason to continue                   | Add a skill-based next-theme preview and returning-learner bridge specification                              | P8                | Honest availability, new capabilities, sample work, complete Deep Orbit ending                                   |
| F12: price, ROI, and scale                | Instrument meaningful learning and purchase outcomes; prepare later studies and price decisions              | P0, P5, P9, E1–E3 | Internally: verified measurement and honest offer. Later: learner, purchase, and acquisition evidence            |

The seven headline recommendations are covered by the same work: early result (P1–P2), manipulable concepts (P1/P4), experienced route (P2), growing system (P5), character growth (P3/P6), consequential choices (P3), and instructional design (P7 plus each feature's own visual verification).

## 3. Sequence, dependencies, and effort

Work one reviewable patch at a time. Each patch includes its relevant content, interface, tests, and evidence. A feature is not complete when only its component or prose exists.

| Patch | Scope                                                                                    | Dependency                        | Estimated focused working days |
| ----- | ---------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------ |
| P0    | Baseline, acceptance contracts, state and measurement design                             | Existing audit                    | 1–2                            |
| P1    | First shape experiment in its actual lesson                                              | P0                                | 3–5                            |
| P2    | First-session path, world offer, ML route, project preview                               | P1                                | 3–5                            |
| P3    | Character arcs, two decision revisions, all six branch contracts                         | P0; use P2 route behavior         | 3–5                            |
| P4    | Normalization and threshold experiments, four smaller interactions, practice progression | P1 pattern and P3 story contracts | 6–10                           |
| P5    | System progress and external-project evidence                                            | P2/P4 activity contracts          | 4–6                            |
| P6    | Complete integrated editorial and factual review                                         | Stable P1–P5 content              | 4–7                            |
| P7    | Full learner-journey design and accessibility refinement                                 | P1–P6                             | 3–5                            |
| P8    | Next-theme value and returning-learner bridge                                            | P3 ending and P5 capability map   | 1–2                            |
| P9    | Final internal grading, release verification, measurement handoff                        | P0–P8                             | 2–4                            |

This is approximately **30–51 focused working days**, including implementation and internal review. A reasonable calendar allowance for one person covering engineering and editing is **8–13 working weeks**, including roughly 25% for rework and integration. Re-estimate after P1 and P3, when the interaction pattern and editorial depth are concrete. External review, actual course completion, delayed recall, customer recruitment, and market evidence add elapsed time afterward.

This is deliberately larger than a cosmetic launch patch. P1–P3 plus the P2 project preview form the first useful release candidate. It still needs the relevant release checks before deployment and does not complete this plan. The full internal upgrade finishes at P9. Later evidence stages do not block us from fixing discoverable problems now.

## 4. P0: establish the contracts before changing behavior

Record the current lesson URLs, phase hashes, entitlement rules, progress sources, six decision IDs, project exports, and analytics events. Preserve existing findings and verification records instead of labeling previously completed work as new.

Create a compact work ledger linking each F01–F12 finding to its patch, changed files, verification evidence, and remaining uncertainty. Extend the existing learning map and review manifest where possible. Do not introduce another competing content inventory.

Freeze these implementation contracts:

- A course route changes recommendations, not purchases or completion credit.
- Lesson completion, exercise results, self-rated recall, story decisions, and project evidence are different records.
- A revealed solution makes an attempt assisted. A later changed case can demonstrate a separate success; it cannot rewrite the first attempt.
- Scientific truth and canonical events do not depend on a story choice.
- A content revision cannot silently reinterpret an old saved choice or claim that an old exercise proves a new objective.
- Product analytics follow existing consent behavior. Operational learning records remain separate from analytics collection.

Define event payloads before connecting the first experiment. Add only events that answer an actual product question, such as experiment started/submitted, route chosen, and project milestone recorded. Include activity ID, content version, selected route, assistance state, and a bounded outcome enum. Do not send source code, free-text reasoning, email addresses, or raw project files to analytics.

**Exit condition:** each work item has a concrete outcome and test; the source of every planned progress label is identified; internal and external acceptance are explicitly separated.

## 5. P1: make the first concept something the learner can investigate

Implement the [first experiment specification](audits/deep-orbit-first-experiment-spec-2026-09-19.md) in the shapes lesson, next to the existing reshape incident.

The learner receives a small packet arranged as three times by four channels. They predict how to collect one channel, compare reshape and transpose, and inspect the selected values in both the grid and the equivalent JavaScript. They then solve a different rectangular packet before entering the existing coding challenge.

The important contrast is a result with the right dimensions but the wrong membership. The initial packet is deliberately small position-marker data, not the ship's full telemetry or sample 7741. Its reshape and transpose results have already been cross-checked against TFJS in the specification.

Implement a focused `channel-layout-experiment.tsx` under the existing MDX components. Keep the math in pure functions, render a semantic table or SVG with a table equivalent, and register the component in the lesson's MDX map. Mount it once in Concept. Preserve the existing Code and Challenge behavior rather than mounting a second interactive instance in another phase.

Use local versioned state for prediction, current operation, selected coordinate, assistance, and follow-up progress. Keep this separate from lesson completion. Storage failure must leave the experiment usable. Navigation, glossary use, and responsive layout changes must not restart it.

For twelve cells, use the verified JavaScript transformation directly. Do not load another ML runtime or charting dependency solely for the diagram. The existing challenge remains the place where the learner executes TFJS.

Feedback must say what happened and where to inspect: for example, a reshape preserved storage order but mixed channel membership. Do not penalize an incorrect prediction, conceal help, require an essay, or award mastery for clicking through the answers.

**Exit condition:** correct shape/wrong membership fails the check; the changed packet is genuinely different; assistance is recorded honestly; all controls work with a keyboard and touch; phase navigation preserves state; the lesson remains readable if the enhancement fails.

## 6. P2: connect the first result, the course promise, and both entry routes

### First-session sequence

Revise the first two lessons together. Begin with a concrete packet and a visible question. Introduce rank, shape, readback, and storage ownership when the learner needs them. Keep tensor cleanup alongside the first relevant runtime allocation, before repeated runs can accumulate resources. Move secondary API detail into a clearly available reference rather than removing it.

The design target is one understandable prediction/run/inspection cycle within the first **10–15 minutes**. This is a target for the opening path, not a claim that the entire free module takes fifteen minutes. The audit's authored estimate for foundations is 109 minutes, and actual learner time remains unmeasured.

Time a scripted internal walkthrough from the existing entry point, including reading, interaction, and a wrong turn. Record it as a maintainer walkthrough. Real first-time timing is collected later. If the opening still delays the experiment, revise its prerequisite explanation before adding another shortcut.

Keep sample 7741's first appearance in foundations/05. Keep the existing later DEEP SCAN demonstration in its story context. Preserve the owner-approved homepage headline and the earlier decision to remove the live demo from the homepage.

### A specific offer and visible project

Update the world overview, relevant course/pricing descriptions, and module introductions to show what a learner will be able to do. Replace the claim that eleven modules stand between the learner and their first model with an accurate account of early model work and later engineering depth.

Add a compact project preview using the existing external room project: inputs, a baseline, model output, an uncertainty or failure case, and a link to the artifact brief. Clearly label a maintainer demonstration and supplied starter code. Do not show fixture results as work a buyer has already achieved.

State prerequisites in ordinary terms: JavaScript functions, arrays, objects, modules, and async work. Distinguish required local setup for the final project from browser-only introductory work. Retain honest time estimates and current access/refund terms. The checkout price stays $50 until the owner decides to change it after customer evidence.

### Two reversible routes

Offer “Learn ML from the beginning” and “I know the basics; show me the engineering challenges” on the world overview and in course preferences. Avoid another mandatory onboarding questionnaire.

Keep this separate from the existing `experience_level`, which describes JavaScript experience. Add a nullable ML route preference with a guided fallback; do not infer ML knowledge from “advanced” JavaScript. An optional short check on shapes, data splitting, evaluation, and inference recommends a starting module. It grants no lesson credit and does not prevent browsing.

For entitled learners, replace hard prerequisite locks with a recommendation and direct prerequisite links. Guided mode still gives a clear next lesson. Challenge mode emphasizes the applicable exercise, failure case, and prerequisite recap. Both retain an obvious way to read the full explanation and story. Add a brief, spoiler-bounded “what the crew knows so far” recap for mid-course entry, using only established events and neutral text for unmade choices.

Apply the same policy to server lesson routes, module/world maps, lesson drawer, dashboard recommendations, and previous/next links. Preserve authentication and paid access checks. The current certificate remains a completion certificate with its existing purchase/completion requirements; bypassing a recommendation does not satisfy them.

**State and migration:** use an additive profile preference, update typed API validation and profile export, and default missing values safely. Store a guest preference locally without inventing authenticated progress; on sign-in preserve an existing account choice and offer to adopt the guest preference if they differ. Follow [migration conventions](../packages/supabase/migrations/CONVENTIONS.md), including a paired down migration and real-database checks.

**Exit condition:** both routes work from direct links and normal navigation; purchasers can browse; guests cannot enter paid material through route changes; no preference writes completion; returning users retain their place; the world offer links to real deliverables.

## 7. P3: give the investigation and its characters lasting consequences

### Character development across the season

Write a short continuity record for each character: starting belief, pressure, action, consequence, and later changed behavior. Use it to revise selected scenes, then read the entire arc in order.

| Character | Development to implement                                                                                                    | Visible payoff                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Demir     | Make and check an early prediction; later mistakes arise from new constraints instead of repeating already-resolved lessons | He owns a verification or handover responsibility before the final record, with evidence of competence |
| Farah     | Give her an attractive hypothesis that consumes time and turns out to be inadequate                                         | She revises it herself and changes the next experiment; she is not only the person correcting others   |
| Nazari    | Let investigation compete with a real maintenance or watch obligation; reduce repetitive punitive coffee/sleep jokes        | Trust appears as delegated responsibility and a concrete tradeoff, with restrained warmth              |
| ARIA      | Carry a useful old result or rule into later work, including the limited watchdog salvage                                   | Her contribution remains useful without becoming intuition, an oracle, or a repair of the lost capture |
| Mirza     | Keep terse questions and decisions; make their effects appear in subsequent assignments                                     | A decision changes who must verify, wait, or act, rather than ending as a slogan                       |

Preserve the strongest existing scenes: ARIA's 211 KB salvage, Nazari watching without counting, the failed shuffled-sequence experiment, and the final operator record. The 340 MB capture remains lost. The fixed 0157 canary deployment, 7741's unresolved truth, reporting release gate, and final `operator_note: none` remain intact. Follow the [story bible](story-style-bible.md); do not expand DISPATCH cameos.

### Two decision revisions first

Start with the first 7741 investigation and the later drift response. Give each at least two defensible actions under the stated information and resource constraints.

For the first flag, the decision can weigh a full calibration investigation against a bounded replay with a named owner while another scheduled check proceeds. Specify what each can establish, what remains unresolved, and which watch slot it consumes. Neither action changes the sample's ground truth.

For drift, weigh inspecting the instrument/data chain against a bounded shadow comparison with explicit stopping and review conditions. State the available engineering time and missing labels. A shadow candidate is not evidence of improvement until evaluated; keeping high prediction scores does not settle the question.

The learner should be able to defend an option before seeing its consequence. Later scenes should acknowledge the cost as well as the benefit. Do not use hidden information to make every alternative look foolish after selection.

### Review the existing six decisions as one system

| Existing decision                        | Revision focus                                    | Later evidence                                                                                |
| ---------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `deep-orbit-foundations-7741-first-flag` | Investigation scope and scarce watch time         | Packet ownership and deferred channel work in the first-neuron lesson                         |
| `deep-orbit-anomaly-7741-training-set`   | Exclusion, sensitivity runs, and unknown labels   | Autoencoder work and the limits of the selected probe                                         |
| `deep-orbit-llm-cut-call`                | Reviewed omission versus delayed completion       | Which report work remains and who handles the next alert                                      |
| `deep-orbit-cache-policy`                | Correctness boundaries and measurement costs      | Cache hits/misses and backend comparison follow-up                                            |
| `deep-orbit-drift-response`              | Investigation versus controlled comparison        | Runbook evidence, ownership, and evaluation gates                                             |
| `deep-orbit-launch-deploy-call`          | Rehearsal tradeoffs within fixed deployment canon | Verification deadlines, rollback responsibility, and handover changes before the final record |

Some existing options correctly diagnose misconceptions, such as fabricated labels or rounded cache collisions. Retain their teaching purpose. Do not pretend scientifically invalid behavior is an equally valid command strategy. The improvement is stronger legitimate tradeoffs where they exist, not a higher choice count.

### Preserve saved choices when options change

Existing storage uses one choice per user and beat with fixed indices and four canonical labels. Keep those IDs, index meanings within each version, and first-choice behavior. Do not silently reuse an index for a different historical intention.

Add explicit decision content versions when semantics change. Treat existing rows as version 1; retain their option/outcome mapping. New choices can use version 2. The resolver reads the saved version, and the write path validates the requested version and option. Maintain an old-client-compatible path during rollout. Never infer an old version from the current wording or the display order.

For an old choice, show its historical meaning and an appropriate continuation. If the old content needs a factual correction, label the correction without changing what the learner selected. A skipped decision gets a neutral continuation. A failed lookup gets a retry/error state and neutral prose, never an invented selection. No trust score or branching engine is needed: saved calls determine bounded later scenes and work assignments.

**Exit condition:** review all 24 current option paths, the six skipped cases, and failed-load/retry behavior; add cases for revised versions and existing rows. Check replay, remount, display shuffling, cross-user isolation, direct entry, and the final scene's position. Test meaningful combinations where two decisions affect the same handover; avoid writing every theoretical combination of all six independent branches.

## 8. P4: build experiments and make practice require judgment

### Three substantial experiments

Use the P1 pattern, but extract shared controls or state helpers only where a second experiment actually needs them.

| Experiment               | Learner action                                                                               | Numerical and teaching contract                                                                                                                                           | Follow-up                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Shape and channel layout | Predict and compare reshape/transpose; trace a coordinate                                    | Storage order, axis meaning, and channel membership agree with TFJS; dimensions alone cannot pass                                                                         | Different rectangular packet                                             |
| Normalization            | Change one feature or select raw versus training-standardized input while weights stay fixed | Fit statistics on training data only; use the same saved stats at inference; define constant-feature behavior; separate a score from calibrated probability               | Diagnose a model/scaler mismatch on new readings                         |
| Threshold policy         | Choose a threshold and explicit miss/review costs                                            | Confusion counts are recomputed from fixed labeled validation data; define threshold equality and zero-denominator metrics; calculate `FP × review cost + FN × miss cost` | Freeze the selected policy, then evaluate held-out data without retuning |

The normalization experiment should show the saved scaler contract with the model artifact. A changed output demonstrates sensitivity to preprocessing, not a claim that the resulting confidence is meaningful on arbitrary inputs.

The threshold experiment must state which costs it models. If a review cost applies to all alerts instead of false alarms only, change the formula and wording together. Include an all-negative policy, missed positives, and at least one case where F1 and cost choose differently. Keep validation and final-test views distinct.

### Four smaller interactions

These are bounded additions, not four more course subsystems. Where the existing exercise already performs the experiment, add the prediction/result comparison there instead of duplicating it.

| Interaction    | Concrete implementation                                                                                 | Guard against a false lesson                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Learning rate  | Step through updates on a specified one-dimensional loss; compare small, useful, and overshooting steps | Label it a toy loss; derive updates from its derivative; do not promise neural-network convergence                                                |
| FFT window     | Change sample count at a fixed sample rate; inspect bins, units, and a generated signal                 | Separate bin spacing from resolving nearby frequencies; explain leakage and zero-padding limits; do not move canonical signal discoveries earlier |
| Attention      | Change a small query and inspect scores, normalized weights, and the weighted value vector              | Shapes and stable softmax are correct; weights do not establish causal explanation or human understanding                                         |
| Cache boundary | Compare exact and rounded keys on nearby inputs, then swap model or scaler version                      | Show stale/colliding output explicitly; keep model and preprocessing versions in the key; separate simulated counters from measured timing        |

Every interaction has a prediction, controllable input, inspectable numbers, useful error feedback, reset, help, and one changed case. If an interaction cannot clarify a misconception beyond its existing exercise, document the equivalent existing task that satisfies this contract rather than adding ornamental controls.

### A deliberate practice progression

Update the existing [learning map](audits/deep-orbit-learning-map.json) at the capability level. Across each major capability, connect a worked example to partial completion, plausible failure diagnosis, and an unfamiliar constraint. Reuse the 65 existing exercises, build-triage assignment, three decision tasks, review queue, and external project wherever they already serve the purpose.

Grade behavior rather than the preferred spelling of a solution, except when the API itself is the objective. Accept valid alternative implementations and reject known shortcut solutions. Give feedback in this order: observed result, why it matters, next thing to inspect. Preserve staged hints and a visible rescue path.

After a full solution is revealed, offer a changed case. Keep the original assistance state. Automated numerical checks can assess dimensions, costs, and expected outputs; free-text rationale remains self-reviewed or later human-reviewed unless a deliberately limited check can be justified. Do not introduce an LLM grader that pretends to establish engineering judgment.

**Exit condition:** all seven interaction objectives have working implementations or documented existing-task equivalents; numerical fixtures pass; major capabilities have a later use; help and first-attempt records remain honest; changed graders pass correct solutions and reject the relevant misconceptions.

## 9. P5: make the growing system and external work visible

Add a compact “Your DEEP SCAN system” view to the dashboard and a smaller milestone view at relevant module endings. Show five stages: data, model, evaluation, runtime, and operations.

Each stage answers three questions: what have I worked on, where is the evidence, and what remains to check? Link to existing exercises, saved attempts, review items, and project sections. Keep these as linked evidence summaries; do not force 65 isolated exercises into a shared mutable program.

Use explicit labels such as “Recorded exercise pass,” “Practised with help,” “Changed case passed,” “Review due,” and “External run reported.” Explain the provenance in detail views. These are not a universal mastery percentage. Existing browser-written progress and attempts cannot be upgraded into independently verified evidence by changing a label.

Introduce the room project early through P2's preview, then add milestones after data preparation and evaluation. In the final stage, make it easy to retrieve the brief, export the starter, record model/baseline comparison and split rationale, run the local application, and find the existing GitHub/folder export flow. Explain which files are supplied and what the learner must create or justify.

### Records and synchronization

Start with a read model over existing progress, exercise attempts, and review records. For new experiments, use a compact activity record keyed by user, activity, and content version: first outcome, latest outcome, attempt count, assistance observed, completion time, and source. Keep raw answers/code out of this summary. Store detailed working drafts locally or in the existing explicit export.

Use authenticated, user-scoped persistence for cross-device summaries, with bounded payloads and idempotent submissions. Server validation checks the activity/version and record shape; it does not make a browser-reported completion tamper-proof. Label it accordingly. Any genuinely authoritative future assessment needs a separate server-verified write model under the migration conventions.

Guest records remain local. Import only compatible records on sign-in, preserve an existing account's first recorded attempt, and deduplicate retries. If older records lack version or assistance information, show “Earlier completion; assistance not recorded.” Do not invent a historical version or change an earned completion because a new check exists.

Exercise status, review due state, and lesson completion remain independent. A project export is an export, not proof that the application ran. A maintainer fixture proves integration, not independent learner application. Include new records in account export/deletion behavior and test cross-account reads and writes.

**Exit condition:** a learner can find their current capability, supporting work, and next useful task; account switching cannot leak state; missing or old records remain understandable; project files run from a fresh directory using the documented steps; advertised project outcomes match the actual artifact.

## 10. The eleven-module revision map

This map coordinates teaching, story, and interface work so they reinforce each other. It does not require a new widget in every module.

| Module                | Practical payoff                                                       | Story development                                                      | Evidence or interface change                                                     |
| --------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Foundations           | Recover channels and preserve training-only scaler statistics          | Obtain useful evidence without resolving 7741                          | Shape/normalization experiments; first investigation choice; data milestone      |
| Neural networks       | Trace a weighted sum through activation                                | Demir predicts and checks before Farah explains                        | Linked inputs/weights/output and an altered case                                 |
| Training loop         | Compare against a baseline on held-out data                            | A disappointing score changes deployment expectations                  | Learning-rate interaction; existing triage assignment; evaluation evidence       |
| Browser runtimes      | Reload the same artifact and handle missing cache/network support      | ARIA retains a result needed later                                     | Connect existing runtime lab, fallback behavior, and artifact versions           |
| Signal processing     | Read a real frequency plot with correct resolution and units           | The learner notices a peak before its significance is explained        | FFT window interaction; evidence before dialogue interpretation                  |
| Recurrent networks    | Compare ordered and shuffled inputs with a persistence baseline        | Later correct prediction pays off the failed ordering experiment       | Side-by-side actual results using existing tasks                                 |
| Anomaly detection     | Select a policy with error costs while labels remain uncertain         | Investigation consumes another crew member's time                      | Threshold experiment; training-set choice and later sensitivity work             |
| Advanced time-series  | Inspect weighted values and check forecasts against later observations | Farah changes her own hypothesis; Demir corrects an earlier instinct   | Attention interaction and the existing forecasting task                          |
| LLM integration       | Trace a claim to a source and reject unsupported output                | Preserve Nazari correcting her own approved summary                    | Claim/source/result comparison and report-release consequences                   |
| Optimization and edge | Measure size, disagreement, and latency separately                     | Preserve permanent loss and ARIA's limited salvage                     | Cache boundary interaction; existing conversion/deployment checks and provenance |
| Capstone              | Run, explain, and modify an external artifact                          | Pay off responsibility and ARIA's changed role before the final record | System evidence, drift/deployment handovers, project export and run record       |

## 11. P6: finish a full editorial and factual review of the revised course

Read all 56 lessons in course order after the structural changes settle. Include frontmatter, module descriptions, dialogue, body, code, derivations, hints, starter comments, solutions, recap, recall answers, glossary, epilogues, project instructions, and related product claims. Recheck all 65 exercise contracts; rerun executable checks as described below. This is a new integrated pass over the revised product, not a claim that the earlier review was never done.

For each lesson, record the intended learner action, prerequisite knowledge, central mechanism, likely misconception, evidence/check, and later reuse. Search for related occurrences before changing terminology or a technical claim.

Edit for specific actions, clear referents, defined terms, and sentences that carry one manageable idea. Explain the mechanism before using an analogy. Keep one useful mapping and its boundary rather than introducing a metaphor and spending a paragraph undoing it. Read dialogue aloud and read each character's lines together to catch repetitive exchanges and indistinguishable voices.

Move fixture and benchmark provenance out of dramatic dialogue where it disrupts the scene. Add an adjacent visible note identifying “teaching fixture,” “measured on this setup,” or “fictional mission event,” with expandable setup details where useful. Material caveats must remain visible in context; they cannot exist only in a tooltip. When uncertainty changes a decision, keep it in the scene itself.

For technical claims, distinguish mathematical properties, API behavior, local measurements, and story events. Reproduce changed numerical examples and runtime claims using the installed versions. Use primary documentation for changed external contracts. Never translate a toy result into a general speed, accuracy, safety, or causal claim.

Update the review manifest only after the relevant review, including source hashes, evidence, fixes, and limitations. A matching hash or passing slop lexicon test establishes bookkeeping or a narrow rule; neither earns an editorial grade by itself.

**Exit condition:** complete current coverage, no unresolved consequential factual or grading defect, consistent body/exercise/recap/glossary explanations, and a justified internal score for each applicable quality category. Confirmed defects return to their owning patch before final grading.

## 12. P7: make the design support the learner's next action

Preserve the existing visual identity: palette, typography, illustration style, square geometry, and clear structural borders. The objective is more useful visual explanation and better proportion between reading and action.

Use a repeatable instructional composition: a short question, the relevant data, nearby controls, and the result with a concise interpretation. When code matters, highlight the line connected to the selected value. When code repeats the preceding explanation, preserve it as accessible reference rather than another mandatory reading passage. Keep full lesson reference material available and searchable.

For the long normalization Concept screen, replace distant explanation/code/result blocks with small local pairs. Do not set an arbitrary maximum page height or shrink body text to reduce the measured 10,064-pixel mobile page. The success criterion is that the learner can compare the information needed for the current task without repeatedly searching the page.

Use the existing six phases and stable URL hashes. Preserve browser back/forward behavior, bookmarks, editor drafts, selected experiment values, glossary state where intended, and review progress. Avoid sticky layers that cover the task or result, especially with the mobile keyboard open.

Audit the full journey: homepage and learn entry, world preview, route choice, free lessons, signup, paywall, purchase return, course map, all lesson phase types, hints/errors, review, dashboard, capstone, export, and next-theme discovery. Check both novice and experienced routes, plus returning and partially completed accounts.

Verify 1440- and 1024-pixel desktop/tablet layouts, 390- and 320-pixel phone widths, dark/light themes, reduced motion, keyboard navigation, zoom/reflow, and a screen-reader walkthrough of each new interaction. Inspect loading, empty, failed-save, offline, stale-version, unsupported-runtime, and retry states. Automated accessibility checks complement this inspection; they do not replace it.

Use labeled axes and units, text explanations of color/state, visible focus, appropriate target sizes, and restrained live announcements. No colored left accent bars, mandatory animation, actual countdown pressure, or rewards that require hiding help. Fictional urgency can motivate a scene without rushing the real learner.

Compare asset and JavaScript costs with the captured baseline on the same route and environment. Lazy-load heavy models only when required, reserve visual space before loading, clean up tensors/workers/listeners, and keep a readable fallback. Investigate regressions with reproducible traces rather than promising speed from an arbitrary bundle-size number.

**Exit condition:** complete journey matrix and retained screenshots; no unresolved task-blocking layout, focus, state-loss, or accessibility issue; each interaction has a usable text/table explanation; performance changes have an explained budget and evidence.

## 13. P8: make another theme a new learning opportunity

Deep Orbit's final narrative beat remains complete. Put commercial continuation on the completion screen or dashboard, outside the final operator record. Keep the existing DISPATCH texture without expanding the cast inside this season.

For Neon Protocol, define a compact preview showing what carries forward, what is new, and one representative task. Reused capabilities include tensors, evaluation, and deployment discipline; new work should demonstrate the actual image/vision objectives in its authored curriculum. Use a real checked sample, not a speculative feature promise.

Add a returning-learner bridge that recommends only the prerequisites needed for that task. Store transferable capability references in shared journey/curriculum data so each theme can link back to evidence without treating Deep Orbit completion as mastery of all future topics.

For each of the other four worlds, prepare an outcome/reuse/new-skill matrix and apply the same internal review rubric before its release. A theme must add a worthwhile problem and teaching progression, not simply replace names and backgrounds. The specialized medical, privacy, or other domain claims retain their separate pre-release review requirements.

Use the release manifest to distinguish available, preview, and forthcoming material. Do not enable buying an unreleased promise or invent dates. Completion of P8 establishes the continuation design and a checked preview; authoring and launching all four later courses is a separate, substantial program.

**Exit condition:** Deep Orbit's ending works alone; the next-theme surface explains a concrete new skill and actual availability; the sample is accurate and accessible; returning learners have a clear bridge; all five themes have a documented scope comparison.

## 14. P9: verification and the internal A gate

Run focused tests while each patch changes, then one complete candidate verification after integration. Repeat a broad suite only when a later change, failure, or unresolved concern warrants it.

| Area                   | Verification                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Numerical teaching     | Pure-function tests, changed inputs, real TFJS cross-checks, dimensions/units, zero and boundary cases                                 |
| Exercises              | `pnpm test:exercises`, including reference solutions, starters, and cheating fixtures; inspect changed feedback and valid alternatives |
| Build and code quality | Relevant unit suites during patches; final `pnpm test`, `pnpm typecheck`, `pnpm lint`, and required build checks; format changed files |
| Content coverage       | `node scripts/check-content-review.mjs`; inspect manifest statuses and evidence rather than equating current hashes with a grade       |
| New persistent state   | Real-database `pnpm test:rls`, migration status, old/missing version handling, export/deletion, retry/idempotence, user isolation      |
| Learner journeys       | Playwright routes for guest, new purchaser, existing purchaser, guided/challenge preference, mid-course return, and capstone           |
| Story state            | Every option and later outcome, revised/legacy versions, skipped/error states, final canon, and actual authenticated persistence       |
| Runtime and exports    | Existing runtime, model-deployment, decision/project, and package scripts where affected; fresh project installation and external run  |
| Visual/accessibility   | Existing visual suite plus purposeful new states; manual keyboard, screen-reader, motion and responsive checks                         |
| Release                | Migration ledger, deployment preflight, production smoke of changed public/authenticated flows, and rollback verification              |

Use actual app routes for access and persistence checks. The existing component fixture in `check-decisions-browser.mjs` is useful for its scoped UI contract; it is not proof of paid navigation or live authentication. Similarly, cached build output is not a fresh runtime or deployment verification. Record the environment, revision, commands, result, and limitations for each release record.

Keep Stripe test mode for payment regressions. Do not create real charges to establish a UI learning change. Production smoke should exercise the changed learner experience under the approved account/entitlement setup and distinguish it from local fixture evidence.

### Internal grading

Reuse the [content quality plan's rubric](content-quality-plan.md): five criteria scored 0, 1, or 2, at least 9/10 in each applicable category, and no zero. Keep its independent acceptance separate. The internal record must cite evidence for each score, including contrary examples and their resolution.

Grade JS audience fit, learning design, factual reliability, readability, storytelling, agency, and the internal readiness of independent application. Add a five-criterion design score: hierarchy/readability, interaction clarity, responsive continuity, accessibility, and visual coherence/performance. These are proposed internal acceptance criteria, not an external standard or a conversion prediction.

No overall average can hide a weak category. Wrong foundational rules, misleading guarantees, graders accepting materially wrong answers, broken access, lost saved work, or unreachable required interactions block the relevant release regardless of the score.

The internal application score establishes that the project, rubric, setup, and transfer tasks are sound and executable. Actual independent learner performance remains unmeasured until the later study. Value at $70, learner ROI, and readiness to acquire 150,000 users remain externally unproven rather than receiving convenient internal 9/10 ratings.

**Exit condition:** all twelve findings have an internal disposition, every internal category meets its defined gate, the reviewed candidate is deployed and smoke-checked when implementation reaches release, and evidence-dependent categories remain explicitly open.

## 15. Later evidence: learning, price, and growth

These stages begin after the internal gate. No recruiting, contacting, or hiring is part of writing this plan. Prepare the material now; arrange external participation only when the course is ready and the owner authorizes that work.

### E1: establish learning and story comprehension

Use the existing [study task forms](learning-study/task-forms.md), revised to match the new activities. Start with small diagnostic cohorts from both intended audiences, for example 6–8 JS engineers new to ML and 4–6 learners with ML foundations. These are proposed usability/learning-discovery samples, not statistically representative market validation.

Observe the opening session, then allow realistic time for the course and project. Use comparable pre/post tasks, an unfamiliar transfer task, and delayed recall seven days after the relevant learning/completion. Record help, actual effort, setup failures, and non-completion. Do not judge only the learners who finish.

Ask learners to explain why a result changed, defend a split and baseline, diagnose a failure, and modify their artifact. Ask what each central character wanted, what changed, and where a prior decision affected later work. A high scene completion rate alone does not establish compelling storytelling.

Freeze task-level scoring and assistance rules before reviewing results. Report counts and uncertainty, not only percentages. A consequential misconception or repeated inability to perform the intended task returns to development. Repeated confusion in the same step triggers a targeted revision and another small check before scaling. Independent ML/editorial review can now challenge issues our internal pass missed.

### E2: validate the $70 offer and learner ROI

Keep the $50 launch offer while collecting learning and customer evidence. Evaluate the artifact's usefulness, effort required, support burden, refund reasons, and later use. Update inaccurate duration estimates and setup expectations promptly.

After the owner chooses to test $70, use an actual clearly priced offer and measure completed purchases, refunds, support load, and learning outcomes. Stated willingness to pay is supporting evidence; it is not equivalent to buying. Keep existing purchase/access commitments and avoid silently changing terms.

Learner ROI means demonstrated skill gain and useful application relative to money and time. Do not replace it with a salary promise or a certificate claim. Do not raise the price automatically because a test suite passes or the internal rubric reaches A.

### E3: test whether distribution can scale across five themes

Use separate funnels for novice and experienced routes. Define unique visitors, registered learners, activated learners, paying customers, and returning buyers. Count a person once in the 150,000-user ambition; five purchases from that person are five purchases, not five users.

| Question                           | Measurement                                                                                                  | Decision it informs                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Do visitors reach useful learning? | First experiment result among eligible starters, plus visible failures and early exits                       | Fix entry or interaction friction before buying more traffic                |
| Can they apply the idea?           | Changed-case results, first attempt and assistance separated                                                 | Improve explanation/practice before claiming learning success               |
| Do they return?                    | Seven-day return among cohorts old enough to qualify, interpreted alongside recall                           | Improve continuation and useful next steps                                  |
| Is the external work usable?       | Project starts, exports, reported runs, and separately reviewed artifacts                                    | Fix setup or transfer support                                               |
| Does the offer work?               | Actual payments/refunds and support effort by cohort and source                                              | Test positioning and price with product-quality guardrails                  |
| Is another theme wanted?           | Preview engagement and explicit interest, then actual later purchases                                        | Prioritize themes using observed demand                                     |
| Can acquisition scale?             | Channel-specific acquisition cost, conversion, contribution after fees/refunds/support, and repeat purchases | Increase spend only where economics and learning outcomes remain acceptable |

Keep consented client-event denominators separate from authoritative payment/webhook records. Exclude maintainer fixtures and test accounts. Do not silently interpret missing analytics consent as abandonment or zero learning. Preserve content versions so before/after cohorts can be interpreted.

Instrument first, establish a baseline, then set acquisition and retention targets with the owner. No repository audit can establish that one marketing plan will yield tens of thousands of users. This work makes that ambition testable and improves the product that reaches them.

## 16. Architecture and release boundaries

| Work                               | Existing integration points                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Experiments and lesson composition | `apps/web/app/components/mdx/`, lesson `lesson-content.tsx` and `lesson-steps.tsx`, `packages/content/`        |
| Route preference and access        | World/module/lesson pages, onboarding/profile API validation, `apps/web/lib/progress.ts`, entitlement helpers  |
| Story versions and continuations   | `boss-beat.tsx`, `story-consequence.tsx`, `apps/web/lib/boss-beat-client.ts`, Supabase RPCs and new migrations |
| Capability/evidence view           | Dashboard, progress/review stores, shared activity types, existing decision/transfer/project components        |
| Project delivery                   | `packages/shared/src/project-export.ts`, `scripts/package-room-project.py`, existing folder/GitHub export      |
| Continuation                       | `packages/shared/src/journey.ts`, world manifests, completion/dashboard surfaces                               |
| Measurement                        | `apps/web/lib/analytics-events.ts`, existing consent-gated capture and server payment events                   |
| Review and release evidence        | Existing learning map, content manifest, browser checks, runtime/deployment scripts, launch records            |

Use additive migrations and old-client-compatible reads/writes for preferences, activity summaries, and decision versions. Apply schema before dependent application code; keep old versioned decisions readable after the new UI ships. A rollback disables the new presentation while retaining learner data. Do not drop populated records as the normal way to revert an interface.

Use a small number of release switches for the experiment, route, and evidence surfaces only where partial rollout or rollback needs them. Do not build a general feature-flag service or adaptive curriculum engine for this plan. Avoid an additional charting framework, new code-execution service, full story-state simulator, or shared mutable notebook unless the bounded implementation proves a specific need.

Main risks are scope inflation, state incompatibility, unearned progress claims, story changes that contradict canon, and interactions that add effort without improving understanding. The contracts, staged releases, changed-case checks, and final integrated reading address these risks directly.

## 17. Delivery checklist

Implementation progress is tracked in [the ledger](learning-product-implementation.md). The September 19 candidate is deployed and production-smoke verified. P7 and final P9 acceptance remain provisional; the screen-reader walkthrough is deferred by owner decision (2026-09-20). Earlier audits remain separate historical evidence; E1-E3 require later human and market results.

- [x] P0: freeze contracts and trace every audit finding to evidence.
- [x] P1: implement and verify the shape experiment in the actual lesson.
- [x] P2: complete the opening path, honest offer, project preview, and both ML routes.
- [x] P3: revise character arcs, improve the two priority decisions, and verify all six versioned branches.
- [x] P4: complete the concept interactions and capability-level practice progression.
- [x] P5: connect system milestones, honest evidence, and the external project.
- [x] P6: review the entire revised content in context and reconcile all teaching surfaces.
- [ ] P7: screen-reader walkthrough deferred by owner decision (2026-09-20); the implemented layout, input, state and recovery changes pass their checks.
- [x] P8: deliver the checked continuation preview and all-world scope/reuse matrix. The dashboard continuation section was removed by owner ruling on 2026-09-20 (only Deep Orbit for now); the Neon sample stays on its coming-soon page.
- [ ] P9: final acceptance stays provisional while the P7 walkthrough is deferred; internal content grading, release checks, deployment smoke and evidence handoff are complete.
- [ ] E1: after internal A, collect independent review and observed learning evidence.
- [ ] E2: use real customer outcomes to evaluate ROI and any later price decision by the owner.
- [ ] E3: establish repeatable acquisition and cross-theme demand before scaling claims or spend.

P0-P8 implementation and P9 release work are recorded in the ledger. The screen-reader walkthrough is deferred (owner, 2026-09-20) and tracked in docs/post-launch-backlog.md. Independent participation and price/growth decisions remain later stages.
