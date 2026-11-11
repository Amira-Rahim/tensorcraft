# Tensorcraft product roadmap

Updated November 9, 2026. This roadmap covers the learning platform, all five
worlds, course production, learner evidence, operations, and growth.

This roadmap includes the complete retained implementation inventory from the
[post-launch backlog](docs/post-launch-backlog.md), plus detailed plan follow-ups,
platform proposals, testing, and browser-performance work. The [growth strategy](docs/roadmap.md) owns the commercial
goals and evidence gates. This document also preserves long-range feature ideas
from older plans. Detailed plans and later verified results take precedence
over stale open checkboxes in older documents.

Phases describe dependencies rather than fixed dates. Maintenance, learner
research, and distribution can proceed in parallel. Optional proposals remain
separate from planned maintenance and world expansion. No phase assigns a
new deadline, spending commitment, or promise to build every deferred idea.

## Roadmap navigation

- [Phase 1: current-course reliability](#phase-1-dependable-current-course-experience)
- [Phase 2: learning results and course production](#phase-2-inspectable-learning-results-and-course-production)
- [Phase 3: releases, learner validation, and distribution](#phase-3-release-evidence-learner-validation-and-sustainable-distribution)
- [Phase 4: remaining world launches](#phase-4-release-the-remaining-four-worlds)
- [Phase 5: capacity and maintenance](#phase-5-platform-capacity-and-long-term-maintenance)
- [All 24 platform proposals](#platform-expansion-through-stories-and-community)
- [Testing program](#testing-program-across-the-platform)
- [Browser model performance](#browser-model-performance-and-responsiveness)
- [Detailed technical implementations](#detailed-technical-work-from-active-and-deferred-plans)
- [Optional product directions](#optional-and-owner-gated-product-directions)
- [Long-range possibilities](#long-range-platform-possibilities)
- [Complete retained backlog inventory](#detailed-canonical-implementation-and-verification-inventory)

## Current product and completed foundations

Deep Orbit is the only launched world: 11 modules, 56 lessons, and 65
exercises. Its first five lessons work without an account. The current offer
is $79 introductory and $99 regular, paid once. Sequential module unlock and purchaser-only
route/readiness controls remain owner decisions.

The shared five-phase lesson experience, visual/story rollout, training
exercises, saved story decisions, project export, GitHub integration, and
light/dark themes already exist. The normalization and first trained-network
saved-run slices are implemented locally. Their validation does not establish
independent learning outcomes or production deployment of those latest slices.

Four more worlds have authored source, but their lessons remain outside the
launched course. Their shared 11-module structure still needs per-world
technical, teaching, story, exercise, and release work.

Sources: [launch scope](docs/launch-scope.md),
[learning-product implementation](docs/learning-product-implementation.md),
[November learning-evidence plan](docs/superpowers/plans/2026-11-02-learning-evidence-pilot.md),
and [launch verification](docs/launch-verification.md).

## Phase 1: dependable current-course experience

This phase addresses remaining defects in the existing course and its access
flows. Preserve completed behavior while closing the recent audit findings.

### Lesson continuity and feedback

- Reconcile lesson one's twelve-value recording with its recap, tensor
  figure, and terms. Carry authored code examples through recall parsing and
  warm-up rendering so learners can inspect the line a question asks about.
- Keep result announcements mounted before asynchronous updates. Cover
  loading, success, errors, repeated runs, and stale output with useful
  visible feedback and accessible verdicts.
- Move shared prose defaults into a CSS cascade layer so component spacing
  and grids survive. Inspect all lesson phases and nested activities across
  the 56 lessons after changing those shared rules.
- Resolve remaining lesson-layout findings, including clipped panels,
  unnecessary code tab stops, duplicate code landmarks, small code readouts,
  and wrapping on phone browsers. Reproduce older findings before changing
  code because later layout work has already closed some of them.
- Keep hint-use counts, recap completion, lesson progress, and capability
  labels consistent with the action the learner actually completed. Resolve
  the readiness recommendation's conflict with sequential unlock through an
  owner decision while preserving the current access rule.

### Guest, account, and purchase journeys

- Stop guest exercise runs from calling signed-in attempt and GitHub-commit
  endpoints. Preserve local execution, guest progress, and authenticated
  persistence/export behavior.
- Complete the outstanding current-revision journey checks: campaign entry,
  guest progress carried into signup, completed test-mode purchase, and the
  course access it grants. Existing verified auth, checkout, refunds,
  GitHub connection, token renewal, and project export remain the baseline.
- Revoke the GitHub OAuth grant when deleting an account. Recheck access,
  export, deletion, refunds, and disputes together when changing their
  shared boundaries.
- Resolve the remaining partial-refund/dispute restoration behavior. Add
  the first-live-payment verification procedure and webhook error monitoring
  to the operational handoff. Real payment verification belongs to a
  separately authorized production session.

### Accessibility and browser reliability

- Fix the remaining reduced-motion reveal behavior, focus order, keyboard
  controls, menu focus restoration, touch targets, error associations, and
  readable code at narrow widths. Verify the current state before applying
  older audit recommendations.
- Check phone code wrapping in WebKit and broaden browser coverage where
  the existing suites leave gaps. Make browser checks fail visibly when a
  required route or environment is unavailable.
- Diagnose the exercise-autocomplete race and other recurring flakes.
  Preserve meaningful browser coverage when correcting test assumptions.
- The full human screen-reader walkthrough remains owner-deferred. When
  the owner resumes it, use the existing seven-path script, check glossary
  accessible names, and record actual assistive-technology evidence.

Completion means the chosen defects have reproducible before/after evidence,
focused tests, and actual browser checks. A passing component fixture alone
does not close a full authenticated learner journey.

Sources: [recent backlog follow-ups](docs/post-launch-backlog.md),
[September lesson-audit findings](docs/post-launch-backlog.md#lesson-audit-2026-09-24),
and [learning-product release record](docs/audits/learning-product-release-2026-09-19.md).

## Phase 2: inspectable learning results and course production

### Remaining learning-evidence pilot

The [story-driven result design](docs/superpowers/specs/2026-11-06-story-driven-result-inspection.md)
maps all 56 launched lessons to suitable result interactions and defines shared
current-run inspection, historical compatibility, and selective saving. The
[implementation record](docs/superpowers/plans/2026-11-06-result-inspection-design-review.md#implementation-progress-on-november-6)
now records the locally implemented three-lesson pilot: capture, immediate
inspection, history, and project-stage integration. Evaluation writes default to
off until the reader-first release sequence is complete.

The full signed-in pilot review is complete locally: 27 Chromium cases cover
all five phases at four widths in both themes, access restrictions, prerequisites
and normal-motion story playback. Four final targeted flows also verify the last
chart correction and default evaluation reader mode. The review fixed chart
scales, category labels, contrast, saved metadata sizing and misleading preview
copy. Human screen-reader review and observed learner understanding remain open.

Build on the locally implemented normalization and first-network saved runs.
Their owner-scoped storage, download/delete controls, stale labels, and draft
recovery already exist. Preserve those contracts as the pilot expands.

1. Evaluation capture and semantic validation are implemented locally. The
   recorder tracks immutable metrics and weight state, including shared weights
   across recompilation. The grader preserves actual case output when diagnosis
   checks fail. The interface retains the documented source/procedure limits.
2. The evaluation inspector is implemented in the actual lesson, with scores,
   missed anomalies, false alarms, selected inputs, supplied labels, and the fixed
   decision rule together. Normalization and network views also appear directly
   after a run. Browser checks and observed learner understanding remain separate
   release evidence.
3. Evaluation history and the project-stage entry are implemented using existing
   retention and recovery controls. Browser-local records remain distinct from
   server practice history. Ship compatible readers before enabling evaluation
   writes, and preserve those readers during rollback. The three milestones use
   different fixtures and models; they do not transfer one saved model through
   the course.
4. Complete the remaining proposed optimization explanation and explicit
   guest-record adoption work. Account synchronization, JSON import, and
   full-model persistence remain outside this bounded pilot.
5. Add the two proposed executable repair reviews. Extend authored activity
   schemas, stable IDs/versions, registration, enqueueing, and entitlement-safe
   resolution. Old review rows must retain their meaning. Track first
   attempts, retries, errors, and assistance separately. Saving a run or
   completing an assisted retry must not manufacture lesson mastery.
6. Rehearse the complete learner flow, refresh the study packet, and observe
   the pilot before deciding how far to extend it. Use the existing worker
   and bounded runtime rather than introducing another execution platform.

The November plan's original whole-pilot estimates include work now completed.
Re-estimate the remaining packages from their actual state before scheduling.

### Authoring and content maintenance

- Add the planned lesson-authoring scaffold so new content starts with the
  required schema, story sections, exercise references, and review metadata.
- Keep source hashes, reviewed versions, executable examples, and rendered
  checks current when content changes. Extend the quality rubric before
  introducing a new teaching pattern.
- Resolve remaining factual, glossary, prose, character-voice, and technical
  handoff findings. Apply the writing rubric and story rules without
  repeating completed whole-course rewrites.
- Maintain a content-review cycle using actual learner confusion, failed
  attempts, and useful feedback. Completion or hint-use thresholds are
  review signals, not proof that a lesson teaches successfully.
- Keep external assignments, model files, loaders, preprocessing, labels,
  reference solutions, and packaging instructions synchronized. Independently
  review a clean exported project and the learner's explanation of its work.
- Remove deprecated lesson components only after every world has migrated
  away from them. Keep the existing curriculum and runtime upgrade plans
  compatible with the launched lessons.

### Planned scene and media production

The owner-approved Deep Orbit video direction still needs production work.
The manifest-gated briefing clip player and still fallback already exist.
Finish the remaining approved clip batches, compositing, per-batch owner
review, normalized exports, and manifest checks. Move trailers and clips to
chosen media hosting before expanding delivery. Complete caption timing and
accessible text fallback where a clip replaces written scene content.

Reconcile location-plate anchors with shipped art before further generation.
Each later world's media needs its own scene bible, approved masters, and
character references. Standalone narration remains a fallback proposal if
the video direction becomes impractical.

Completion means each implemented slice displays the learner's actual result,
keeps story and data sources clear, preserves assistance and ownership, and
passes the relevant exercise, content, recovery, and browser checks.

Sources: [November learning-evidence plan](docs/superpowers/plans/2026-11-02-learning-evidence-pilot.md),
[content quality plan](docs/content-quality-plan.md),
[learning-product plan](docs/learning-product-development-plan.md),
[canonical authoring and media backlog](docs/post-launch-backlog.md),
and [video integration plan](docs/future-ai-video-scenes.md).

## Phase 3: release evidence, learner validation, and sustainable distribution

These tracks can run alongside course development. Changes to production
services, real accounts, payments, or participant records require their own
environment and authorization.

### Publishing and operational readiness

- Maintain exact-revision release checks for content, exercises, types,
  lint, database policies, builds, browser flows, and rollback behavior.
  Reconcile stale audit claims with actual current checks.
- Wire durable verification harnesses into discoverable commands or CI.
  Retire one-off scripts after their purpose ends. Correct visual masking
  that hides meaningful page content and document each baseline change.
- Move future bulky screenshot evidence to appropriate build artifacts and
  add a repository-size policy. Any treatment of existing binary history
  remains an owner decision.
- Maintain monitoring, alert delivery, usage quotas, scheduled-job
  heartbeats, backups, and restore-drill evidence. Production alert delivery,
  a managed restore, and the monthly partition scheduler already have
  verification. Future work concerns remaining gaps and ongoing operation.
- Load-test before buying significant traffic. Review service timeouts,
  rate limits, cloud-cost alerts, and email deliverability against the
  traffic actually planned.
- Reconcile remaining privacy and business-policy work with the owner's
  current decisions. Business registration, tax settings, advisor review,
  controller details, invoicing, and processor agreements remain separate
  owner/operator work. Historical legal checklist text does not establish
  current compliance or reopen superseded geography decisions.

### Trustworthy measurement and privacy

- Resolve replay configuration/disclosure, server-side event consent,
  location precision, certificate-name leakage, consent reopening/versioning,
  cross-tab behavior, and deletion propagation to analytics records.
- Separate local/test traffic from real use. Fix the signup definition,
  payment-event duplication, initial-event loss, identity races, campaign
  attribution, and Web Vitals route attribution.
- Define activation, learning, retention, and purchase denominators using
  events and authoritative payment records that actually exist. Keep missing
  consent and attribution visible rather than interpreting them as failure.
- Establish dashboards and routine cohort reviews for course use, failures,
  refunds, support effort, and acquisition sources. Use payment records for
  retained revenue and keep study-funded purchases separate.

### Independent learning evidence

- Refresh the frozen reviewer handoff for the current course. Commission
  independent ML and editorial samples, then the agreed full review, after
  the owner approves recipients and budget.
- Run the existing formal novice pilot with its planned 12 to 20 learners,
  baseline/post-course tasks, independent project, delayed recall/transfer,
  and later use. Keep smaller discovery sessions separate from that study.
- Record attempts, help, active time, setup failures, non-completion, and
  missing responses. Revise repeated points of confusion and observe the
  revised task with fresh participants.
- Assess story comprehension and whether choices help learners reason about
  the task. Completion clicks, saved runs, and internal scores alone do not
  establish learning or practical transfer.

### Acquisition and retention

The current commercial milestone is 1,000 retained paying customers. The
long-term owner goal is 200,000 unique lifetime paying customers. Neither is
a revenue forecast or an instruction to implement every growth proposal.

- Follow the staged first-1,000 plan: learn from early buyers, publish useful
  working course excerpts, test distribution through relevant hosts, and
  concentrate on channels that bring buyers who use the course.
- Complete the current funnel checks and source attribution before paying
  for traffic. Publish the first useful article or hide the empty blog link.
  Keep campaign recordings aligned with the deployed course.
- Correct stale duration and bridge-count claims before enabling the Kit
  retention drafts. Verify tags, forms, unsubscribe behavior, delivery, and
  the actual retention automations. Maintain transactional refund messages
  and retry behavior where the backlog records gaps.
- Collect consented reviews and project examples before adding testimonials,
  customer counts, ratings, or similar proof. Revisit search indexing and
  content discoverability using real results.
- Evaluate the $79 introductory and $99 regular offer using learning,
  purchases, refunds, and support evidence. The owner approved these prices
  on November 9. Preserve current purchase commitments. Positive contribution and qualified demand determine whether
  acquisition spend can increase.

Sources: [growth strategy](docs/roadmap.md),
[first-1,000 plan](docs/marketing-first-1000-paid.md),
[study protocol](docs/learning-study/pilot-protocol.md),
[learning measurement handoff](docs/learning-study/learning-product-handoff.md),
[observability](docs/observability.md),
[launch verification](docs/launch-verification.md), and
[privacy, measurement, and release backlog](docs/post-launch-backlog.md).

## Phase 4: release the remaining four worlds

Each world is a separate launch sprint. Authored MDX and a working launch
flag do not make it ready to sell. The existing backlog records a world-2
gate of 200 users with usable data. The current strategy also requires
qualified learner or buyer need and the world-specific release checks.
Resolve the metric definition before using that count as a release decision.
No new date or order among the four worlds is assigned here.

### World-specific scope

| World         | Authored source today                | Future course outcome and work                                                                                                                                                                                                                                                                                            |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Neon Protocol | 11 modules, 54 lessons, 58 exercises | Complete the vision path through image data, CNNs, detection, segmentation, feature extraction, transfer learning, real-time inference, and the Sentinel capstone. Reconcile the missing lesson/count promise and place the planned PCA/SVD explanation in this curriculum.                                               |
| Signal Ward   | 11 modules, 55 lessons, 60 exercises | Complete tokenization, embeddings, sequence models, attention/transformers, entity recognition, classification, retrieval/question answering, and deployment/privacy. Repair the recorded word-order example. Review medical framing, data rights, and limitations before releasing the Diagnostic One teaching scenario. |
| Nova Canvas   | 11 modules, 55 lessons, 58 exercises | Complete the generative path through latent spaces, GANs, VAEs, diffusion, style transfer, multimodal alignment, audio, and the creative capstone. Verify authored numerical outcomes and identify model/data licenses and the limits of generated examples.                                                              |
| Terra Grid    | 11 modules, 55 lessons, 59 exercises | Complete optimization, quantization, pruning/distillation, edge deployment, pipelines, monitoring, federated learning, A/B testing, reliability, and the Terra Grid capstone. Verify deployment claims, changed-data behavior, and architecture-specific runtime limits.                                                  |

These are source inventories, not completion claims. All four worlds need
substantive review against the current teaching contract.

### Shared release work for every world

1. Map the useful outcome, reused capabilities, new skills, prerequisite
   bridge, and capstone. Make each theme teach a worthwhile domain problem
   instead of changing only the names and background.
2. Execute technical examples and exercise solutions on the pinned runtime.
   Test plausible wrong answers, changed fixtures, leakage, disposal,
   loaders, and deployment boundaries. Complete appropriate subject review.
3. Migrate legacy lesson closes to the current recall, recap, and epilogue
   structure. Repair missing embedded exercises, hint ladders, analogy
   limitations, and consequence/body mismatches. Extend partition and
   content gates to the new world.
4. Complete the character registry, dialogue continuity, scene artwork,
   glossary, and narrative handoffs. Review every lesson phase, secondary
   exercise, and supporting reference in context.
5. Verify external project setup, artifact licensing, baseline comparison,
   model export/reload, and the learner's explanation. Run the appropriate
   world-specific learner pilot and fix blocking findings.
6. Check keyboard, screen-reader, motion, responsive, and browser behavior.
   Verify entry, purchase, entitlement, progress, capstone, and rollback
   paths before changing the built/launched sets.
7. Update the catalog, metadata, sitemap, checkout, receipts, and relevant
   communications together. Announce availability only after the release
   checks pass.

### Cross-world platform changes at the second release

- Restore useful cross-world journey/progress navigation and reconsider the
  world choice in onboarding. Keep the current single-world dashboard
  continuation decision until another world is sellable.
- Re-enable bundle surfaces only when their actual contents are available.
  Verify catalog/JSON-LD availability, pricing copy, ownership, upgrade
  credits, refunds, disputes, and access together.
- Fix the recorded disputed/partially-refunded purchase-credit case before
  multi-world upgrades can encounter it.
- Add per-world purchase/retention sequences where justified. Remove legacy
  components after the last world migrates, rather than breaking draft worlds
  early.

Sources: [world launch checklist](docs/world-launch-checklist.md),
[launch scope](docs/launch-scope.md),
[curriculum product plan](docs/product-plan.md),
[continuation review](docs/audits/learning-product-continuation-2026-09-19.md),
and [world-release backlog](docs/post-launch-backlog.md).

## Phase 5: platform capacity and long-term maintenance

Scale work follows measured bottlenecks. The backlog's approximate 10,000-user
trigger is a planning checkpoint, not a claim that every issue waits safely
until that size. Earlier performance or reliability failures bring the
relevant work forward.

- Reduce repeated authentication queries and review safe rendering/cache
  boundaries for lesson routes. Preserve individual access checks.
- Re-audit RLS query costs and missing activity indexes. Bound submitted
  code size, attempt retention, and expensive queries.
- Reduce the landing page's eager ML/runtime cost, lesson hydration delay,
  and pricing layout shift. Tighten performance budgets after the measured
  improvements and verify representative devices.
- Review API/database geography, readiness versus liveness, dependency
  failures, and container startup cost. Improve background-job handling as
  digest or notification backlogs grow.
- Strengthen required release checks, migration hygiene, rollback records,
  dependency updates, and security regression coverage. Recheck historical
  debt before acting because the API deployment workflow and several CI
  protections already exist.
- Reconcile unused tables, retired feature paths, transitional API aliases,
  duplicated helpers, and old audit records. Coordinate data removal with
  export/deletion behavior and an owner decision where records may exist.
- Make the bridges package self-contained and verify a clean package install
  before its first public release. Assess a TensorFlow.js major upgrade and
  internationalization as separately scoped maintenance/expansion work.

Sources: [platform and scale backlog](docs/post-launch-backlog.md),
[deployment guide](docs/deployment-guide.md),
[infrastructure](docs/infrastructure.md), and
[development-plan history](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/dev-plan.md).

## Platform expansion through stories and community

This section directly inventories all 24 brainstormed features and their
supporting implementation work. They are proposed future implementations.
The [detailed platform proposals](docs/platform-feature-proposals.md) preserve
the scenarios, research, operating considerations, and individual experiments.
The recommended sequence starts with a coherent small experience and expands
using observed learning, return, production capacity, and demand.

### First platform prototypes

| Proposal                      | Implementation scope                                                                                                                                                                                            | Dependencies and first evaluation                                                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Recurring story seasons    | Publish short operations with connected missions, character conflict, executable work, complete endings, permanent archives, and late-entry paths.                                                              | Versioned mission packages and editorial capacity. Prototype three or four episodes and observe learning and voluntary continuation.                   |
| 2. Small crews                | Match optional crews by readiness, pace, language, and availability. Implement rotating roles, independent attempts, shared handoffs, solo continuation, absence recovery, pause/rejoin, and reassignment.      | Reliable identity, permissions, artifacts, and moderation. Start with manual formation and measure contribution distribution and blocked progress.     |
| 3. Persistent projects        | Maintain compatible, versioned projects across episodes, with revisions, provenance, collaborator credit, export, recovery, and new incidents that challenge earlier work.                                      | Explicit stage/data/model contracts. Start with one project and a later changed condition.                                                             |
| 4. Character development      | Author distinct future-season arcs, factual callbacks, understandable disagreement, changes in responsibility, and quiet recognition of actual work.                                                            | Approved canon scope, stable event records, character continuity, and neutral fallbacks. Preserve the existing Deep Orbit finale and unresolved facts. |
| 5. Evidence-linked discussion | Attach spoiler-aware hints, reviews, and solution debriefs to exact code, chart, data, output, and assistance versions. Add structured reviews and authored fallback explanations.                              | Publication controls and reproducible artifacts. Check whether discussion improves an explanation and performance on a new case.                       |
| 6. Three arena modes          | Implement private practice, cooperative operations, and ranked competition. Explore challenger/defender tasks, repair rounds, deployment budgets, and explanation rounds.                                       | The arena scoring contract, isolated execution, determinism, hidden holdouts, and moderation. Begin with a bounded cooperative challenge.              |
| 7. Shared investigations      | Aggregate reviewed contributions into open questions, verified findings, rejected claims, and a published episode outcome. Implement contribution limits, attribution, low-participation fallbacks, and replay. | A separate policy for personal branches and global canon. Community decisions select valid priorities while technical truth follows evidence.          |
| 8. Return after an absence    | Show accurate progress and story recaps, saved outputs, optional recall, catch-up paths, and a clear next action. Support controlled notifications and crew re-entry.                                           | Accurate progress, browser/account ownership labels, and authored narrative state. Observe resumption after real gaps.                                 |

### Community, character, and contribution systems

| Proposal                       | Implementation scope                                                                                                                                                                                              | Dependencies and first evaluation                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 9. Studios and apprenticeships | Offer character-led professional perspectives, graded responsibility, and movable studio membership. A later mission can ask learners to teach a new apprentice and show that character applying the explanation. | Authored misconceptions, new-case checks, and a scoped future arc. Existing characters retain learned capabilities.                   |
| 10. Theory groups              | Build evidence boards with claims, observations, alternative explanations, falsification tests, revisions, and episode-based spoiler controls.                                                                    | Source labels and moderation. Keep community interpretation distinct from canon.                                                      |
| 11. Crew councils              | Collect independent recommendations, compare operational priorities, record decisions and disagreements, and show authored consequences.                                                                          | Stable choice IDs, shared evidence, branch testing, and independent follow-up cases.                                                  |
| 12. Recognition records        | Carry reviewed contributions into later scenes and create exportable operation records containing actual projects, decisions, revisions, assistance, and collaborator credit.                                     | Appropriate verification and participant publication choices. Test accurate recall and the value of delayed recognition.              |
| 13. Playable invitations       | Let guests complete useful free, spoiler-safe tasks before registration and pass valid results to an inviter. Preserve independent continuation when an invitation is declined.                                   | Guest isolation, bounded execution, attribution, and honest assistance records. Measure useful completion and voluntary continuation. |
| 14. Helper progression         | Implement calibrated reviewer permissions, reproducible bug/test/explanation contributions, repair clinics, response expectations, staff escalation, and quality-based recognition.                               | Review rubrics and operating capacity. Measure correction quality, usefulness, and queue age.                                         |
| 15. Artifact commons           | Publish opt-in reusable tools, tests, explanations, and solutions with runtime compatibility, limitations, attribution, review status, and remix lineage.                                                         | Versioned artifacts, licenses, publication controls, and moderation. Begin with one narrow artifact type.                             |
| 16. Archived crew replays      | Create consented, edited investigation replays with prediction pauses, labeled historical participants, and understandable solution evolution.                                                                    | Reproducible records, editorial tooling, and spoiler controls. Evaluate prediction and transfer as well as viewing.                   |
| 17. Premieres and fandom       | Support mission premieres, writer discussions, character art/music, creator showcases, and failed-experiment events with accessible asynchronous versions.                                                        | Sustainable production and moderation. Label official, commissioned, and fan work clearly.                                            |
| 18. Generations of crews       | Support bounded veteran handoffs, newcomer guidance, reviewed tools, and selected community contributions that recur in future missions.                                                                          | Published selection/credit rules, permissions, and editorial review. New crews retain their own investigation and decisions.          |

### Ambitious platform experiments

| Proposal                              | Implementation scope                                                                                                                                                                                                                           | Dependencies and first evaluation                                                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 19. Cross-world expeditions           | Connect released specialties through compatible artifacts, accessible roles, integration tests, and independent learning checks.                                                                                                               | Ready curricula and explicit interfaces. Start with two components in a clearly framed crossover simulation.                                 |
| 20. Persistent engineering simulation | Simulate documented data drift, equipment failures, resource constraints, monitoring, and repairs across operations. Separate computed effects and authored reactions.                                                                         | Reproducible simulation contracts and validated artifacts. Prototype one controlled incident before continuous operation.                    |
| 21. Bounded character conversations   | Explore stage-aware, evidence-grounded discussions and recommendation rehearsals, with authored knowledge limits, technical evaluation, spoiler controls, and fallbacks. Voice is a later accessible experiment.                               | Scoped canon and generated-content evaluation. Compare authored trees with constrained generation before expanding.                          |
| 22. Mission creation studios          | Build author templates, previews, executable validation, editorial review, community anthologies, and eventual SDK support. Evaluate invited authors before open publication, paid creator programs, marketplace features, or revenue sharing. | Reliable internal authoring and review, publishing permissions, versioning, and maintenance capacity.                                        |
| 23. Partner observatory               | Support bounded partner projects, public-analysis reproduction, test harnesses, expert review, attribution, maintenance, and verified follow-through.                                                                                          | Suitable partners and data rights. Keep research contributions and fictional teaching missions visibly identified.                           |
| 24. Spatial and physical missions     | Explore shared browser rooms, optional AR tables, sensor kits, and live incident rooms where the format helps a concrete concept or collaboration task.                                                                                        | An accessible browser baseline, real-device evaluation, and a viable support model. Hardware and synchronized participation remain optional. |

### Shared platform machinery and delivery sequence

- Maintain separate versioned records for canon, recorded learner events,
  independently/server-verified results, and community event state. Implement
  spoiler stages, knowledge boundaries, branch fallback, and public-credit rules.
- Package each mission's objective, prerequisites, data provenance, reference
  work, plausible wrong answers, evaluation, story beats, accessibility, and
  release metadata together. Add previews, branch validation, and technical
  review tools that make repeated production affordable.
- Implement crew permissions, handoff state, conflict handling, moderation,
  reporting/blocking, contact preferences, technical adjudication, support
  queues, and recovery when peers are absent or questions go unanswered.
- Keep paid access, publication choices, assistance records, export/deletion,
  and compatible artifact upgrades intact across seasons and community systems.
- Track authoring/review effort, moderation/support demand, compute/storage,
  notification exposure, and cost per useful activity. Distinguish cumulative
  buyers, active learners, learning, story interest, belonging, and return.
- Test growth through playable invitations, useful public artifacts, and
  educator-authored missions. Evaluate ongoing memberships, enterprise
  expeditions, and creator programs using demand and delivery economics.
- Prototype the four-episode relay investigation described in the proposals,
  followed by a changed-condition incident. Pair it with a small optional-crew
  discovery pilot and solo path. This does not replace the existing formal study.
- Expand from the first season/project/callback/recap into crew discussion,
  cooperative arena and reviews, then shared events, artifact reuse, creator
  publishing, and larger experiments as the relevant needs become clear.

## Testing program across the platform

This is the future test inventory, including extensions to checks that already
exist. Audit current coverage before adding cases. Select tests that expose
meaningful failures, cover changed contracts, or resolve a known risk. Record
the tested revision, runtime, browser/backend, fixtures, and limitations.

### Code, content, numerical, and model tests

| Level                                   | Future implementation and coverage                                                                                                                                                                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static validation                       | Maintain type, lint, formatting, build, dependency, content-schema, broken-link, license/provenance, and repository-character checks. Add missing package/task discovery and useful CI diagnostics.                                                             |
| Unit tests                              | Exercise transforms, preprocessing, grading, progress, scoring, consent, entitlements, import/export, and story-state functions with valid, invalid, empty, boundary, and failure inputs.                                                                       |
| Component and interaction tests         | Cover editor/run/stop, feedback transitions, focus, stale results, recaps, hints, error recovery, accessibility announcements, and state changes without replacing browser evidence.                                                                            |
| Property-based tests                    | Generate bounded shapes, axes, values, dtypes, payloads, and state sequences. Check task-specific invariants, serialization, ownership, limits, and recovery with reproducible seeds.                                                                           |
| Metamorphic tests                       | Define justified relationships such as equivalent preprocessing paths or consistent independent batch evaluation. Apply input transformations only where the task's mathematics supports the expected relationship.                                             |
| Numerical and gradient tests            | Check finite values, edge magnitudes, tolerances, preprocessing constants, reference calculations, finite-difference gradients where useful, and reproducible training/evaluation behavior.                                                                     |
| Differential tests                      | Compare compatible implementations and model artifacts across pinned CPU, WASM, WebGL, WebGPU, TensorFlow.js, and ONNX paths where supported. Document tolerances and unsupported operations instead of requiring bitwise identity.                             |
| Dataset and artifact contracts          | Verify shape/units/channel order, split identity, labels, preprocessing, class maps, checksums, shard completeness, version compatibility, and licensed provenance. Reject corrupted or mismatched artifacts.                                                   |
| Evaluation integrity                    | Validate observed model/fit history, fixture identity, held-out separation, and progress/result claims. Mark unsupported or exhausted capture as unknown provenance. Do not claim arbitrary learner-code honesty from observed calls alone.                     |
| Exercise corpus and adversarial answers | Execute references, starters, plausible wrong solutions, correct-shape/wrong-value answers, grader spoofing cases, timeouts, and required operations against the actual pinned runtime. Keep trusted authoring validation distinct from public-code sandboxing. |
| Mutation testing                        | Selectively alter grading, ownership, numerical, payment, and branch logic to identify tests that fail to detect consequential mistakes. Avoid indiscriminate mutation work without a useful decision.                                                          |
| Worker lifecycle tests                  | Cover initialization, backend refusal, readiness, duplicate messages, stale run IDs, rapid reruns, cancellation, timeouts, termination/restart, navigation, and cleanup across success and failure.                                                             |

### Integrated behavior, access, and compatibility tests

| Level                            | Future implementation and coverage                                                                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package and service integration  | Exercise UI/runner/content boundaries and API/auth/database/payment/progress/export behavior with controlled local services and explicit external mocks.                                                                |
| Provider and consumer contracts  | Pin request/response expectations for Supabase, Stripe, GitHub, email, analytics, model hosting, and future creator/community APIs. Detect SDK, schema, asset, and webhook drift.                                       |
| Database and migration tests     | Verify clean installs, upgrades from supported revisions, RLS/role matrices, constraints, retention/partition jobs, concurrent writes, backfills, rollback/recovery, and migration failure behavior.                    |
| End-to-end journeys              | Cover guest, signup/onboarding, purchase in test mode, access, training, progress, resume, project export, refunds/deletion, and later crew/arena/creator paths using real application boundaries.                      |
| Browser and device matrix        | Test supported Chromium, Firefox, and WebKit browsers plus actual iOS/Android and representative low/mid/high-capability devices. Exercise available GPU/WASM paths and documented fallbacks.                           |
| Accessibility                    | Combine automated checks with keyboard, focus, screen-reader, zoom, contrast, reduced-motion, captions, chart alternatives, editor, and canvas workflows. Preserve the owner-deferred walkthrough status until resumed. |
| Visual and responsive regression | Cover narrow/wide layouts, themes, feedback states, story/art visibility, code wrapping, dialogs, charts, and dynamic controls. Review meaningful baseline changes without masking the behavior under test.             |
| Localization readiness           | Add pseudolocalization, long labels, Unicode/tokenization, RTL, fonts, locale-aware data formatting, translated terminology, fallbacks, and locale-independent progress checks when locales are implemented.            |
| Offline and storage resilience   | Test slow/lost/interrupted requests, partial downloads, cache eviction/corruption, quota exhaustion, private browsing, unavailable IndexedDB, stale content, and recovery without silent data loss.                     |
| Collaboration and concurrency    | Exercise multi-tab/account switching, simultaneous edits, permission changes, ordering/idempotency, reconnect/rejoin, conflict resolution, invitations, and crew departure.                                             |
| Import, export, and durability   | Round-trip supported versions, validate bounds and identifiers, preserve source/assistance labels, reject invalid data safely, and test interrupted saves, recovery, deletion, and account isolation.                   |

### Security, capacity, release, and human evaluation

| Level                             | Future implementation and coverage                                                                                                                                                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Defensive security                | Extend source/dependency/history scanning, authorization and tenancy checks, browser policy tests, input fuzzing, and scoped application security review. Test public execution isolation, resource limits, and egress controls before exposing untrusted submissions. |
| Privacy and publication           | Verify consent, analytics suppression/deletion, ownership, public-field minimization, spoiler permissions, private artifacts, sharing revocation, export, and erasure propagation.                                                                                     |
| Performance benchmarks            | Establish reproducible model/kernel/pipeline benchmarks, cold and warm startup, downloads, main-thread responsiveness, rendering, memory, and end-to-end run latency. Compare changes against the same environment and quality criteria.                               |
| Load, stress, spike, and capacity | Model realistic API, database, realtime, artifact, and arena workloads. Determine saturation, rate-limit behavior, queue depth, backpressure, scaling limits, and cost. Validate browser execution separately on real devices.                                         |
| Soak and resource leakage         | Repeat training, inference, navigation, cancel/restart, media, and collaboration over long sessions and multiple tabs. Check tensor/heap/GPU resources, listeners, workers, connections, thermal slowdown, and recovery.                                               |
| Fault injection and recovery      | Exercise API/provider failures, delayed/duplicate events, worker crashes, GPU context/device loss, storage failures, queue outages, and network transitions. Verify bounded retries, useful errors, preserved work, and recovery.                                      |
| AI-assisted feature evaluation    | For future tutors/characters, test factual and numerical accuracy, canon/knowledge boundaries, spoilers, unobserved-memory claims, adversarial prompts, fallback, latency, cost, and learner usefulness using reviewed cases.                                          |
| Story and branch testing          | Validate stable choices, neutral/skipped paths, joins, consequences, character continuity, facts, protected endings, spoiler boundaries, and personal/global event versions. Combine automated reachability with editorial review.                                     |
| Learning and usability research   | Observe representative novices and returning learners. Check prediction, explanation, debugging, delayed recall, independent transfer, confusion, group participation, and accessibility in addition to satisfaction.                                                  |
| Experiment validation             | Verify feature flags, cohort assignment, consent, event definitions, missing data, peer spillover, assistance exposure, and metric calculations before interpreting A/B or crew experiments.                                                                           |
| Release and reproducibility       | Verify clean clone/install, lockfiles, asset/license manifests, model packaging, local review setup, production-like builds, smoke tests, deployment health, canaries, rollback, and restored backups.                                                                 |
| Monitoring and operations         | Test alert delivery, scheduled-job heartbeats, telemetry sampling, source attribution, redaction, dashboards, incident runbooks, and production/test separation through authorized environments.                                                                       |

### Test delivery and maintenance

- Keep fast static/unit/component checks on relevant changes. Run affected
  integration, corpus, numerical, and policy checks before merge/release.
  Schedule broader browser/device, soak, performance, and capacity suites
  according to change risk and available infrastructure.
- Build reusable deterministic fixtures and data factories. Version model
  artifacts, record random seeds, preserve failing cases, and distinguish
  authored references from learner results.
- Make missing prerequisites visible. Quarantine flaky checks with an owner
  and a correction task rather than silently accepting skipped coverage.
  Publish reproducible logs, meaningful screenshots/traces, and baseline changes.
- Separate trusted CI/reference execution, local mock review, real browser
  testing, and adversarial public execution. Each environment needs its own
  access and resource assumptions.
- Expand tests with implemented features and known failure modes. Coverage
  percentages, snapshots, or a passing local suite alone do not establish
  numerical correctness, security, teaching quality, or production readiness.

## Browser model performance and responsiveness

Measure the complete user experience and preserve numerical/teaching behavior
while optimizing. The application currently pins TensorFlow.js 4.22.0 and
includes ONNX Runtime Web 1.30.0 and Transformers.js 4.3.1 in its runtime tools.
The exercise worker deliberately initializes the CPU backend today. Any change
to that policy needs benchmarks and corpus/compatibility validation.
It currently creates a fresh worker for each run and separates runtime loading
from the learner-code execution budget. Preserve that distinction and prove
state cleanup/isolation before selecting a reusable-worker policy.

Extend the existing runtime lab rather than rebuilding its warm-up, parity,
cache, conversion, pretrained-model, and memory probes. Its full pretrained
and converter checks are optional and must remain visibly marked when not run.
The exercise harness stubs some network model-loading/ONNX boundaries, so corpus
success does not establish real-model loading or backend support. Add the missing
real paths and physical-device coverage. Chromium mobile emulation does not
replace Firefox, WebKit, or physical Safari/Android testing.

### Measurement and performance budgets

- Instrument runtime download, model bytes, initialization, graph/kernel
  compilation, warm-up, preprocessing, inference/training, output readback,
  rendering, and total click-to-result separately. Distinguish first/cold,
  cached, warm, repeated, and resumed runs.
- Build a benchmark matrix of representative models, input/sequence sizes,
  browsers, backends, network conditions, memory classes, and real devices.
  Report median and tail latency, throughput, failure rate, and sample size.
- Establish per-route bundle/network budgets and per-task runtime/memory
  budgets from those baselines. A small tensor exercise and the optional
  large pretrained-model lab need different limits and user expectations.
- Target good field Core Web Vitals at the 75th percentile: LCP at most
  2.5 seconds, INP at most 200 milliseconds, and CLS at most 0.1. Separate
  mobile/desktop and important routes. Add model/worker metrics because those
  three page metrics do not measure the entire ML workflow.
- Track long tasks, interaction during training, frame stability, cancellation
  responsiveness, timeout rate, cache hit rate, and repeated-run memory. Add
  CI regression checks and privacy-aware field measurement where authorized.

### Loading, delivery, and caching

- Lazy-load editors, visualization modules, ML libraries, model weights, and
  optional runtime providers when their route or task needs them. Remove
  duplicated runtime bundles and unused kernels/providers using measured,
  compatibility-tested builds.
- Keep models off the initial landing/auth path unless required for that
  visible experience. Schedule low-priority warm-up/prefetch from demonstrated
  intent, with cancellation and constrained-network behavior.
- Audit weight sizes, shard counts, request overhead, compression, cache
  headers, CORS, immutable versioned URLs, checksums, and CDN placement. Avoid
  eagerly loading the optional full DistilBERT lab's large downloads.
- Implement bounded model/runtime caching with explicit versions, invalidation,
  quota/eviction handling, partial-download recovery, and clear download status.
  Keep private user records isolated from publicly shareable asset caches.
- Evaluate smaller or quantized model variants and optimized artifacts against
  each lesson's required behavior, reference cases, accuracy/tolerance, license,
  download size, startup time, and supported kernels. Storage compression alone
  does not establish faster execution.

### Execution and backend policy

- Benchmark CPU, WASM, WebGL, and WebGPU on the actual workloads. Select a
  supported backend using measured policy, feature detection, initialization
  checks, and fallbacks. GPU launch/transfer cost can outweigh a tiny workload.
- Verify browser worker compatibility, supported operations, precision,
  context/device loss, and fallback behavior before changing the CPU-pinned
  exercise path. Keep course grading consistent across supported paths.
- Reuse safely initialized workers and model/session instances where beneficial,
  with bounded concurrency, per-run isolation, cancellation, timeouts, and
  restart after faults. Account for worker startup and message-transfer cost.
- Move eligible preprocessing and inference off the main thread. Use transferable
  buffers where ownership permits, bound payload sizes, batch UI updates,
  and avoid copying large arrays or reading GPU results unnecessarily.
- Measure asynchronous output reads against synchronous calls that stall the
  UI. For training, expose progress at a bounded cadence, yield appropriately,
  and keep editor/navigation/cancel controls responsive.
- Evaluate ONNX execution providers, graph/session options, shape stability,
  batching, buffer reuse, and GPU-resident processing where appropriate. Enable
  WASM threads only when runtime/browser support and cross-origin isolation
  requirements fit the app's actual deployment and integrations.
- Warm up representative shapes after loading and measure compilation separately.
  Keep startup bounded and avoid hidden work that competes with the first task.

### Memory, GPU resources, and UI cost

- Audit ownership of tensors, variables, models, sessions, image buffers, and
  worker resources. Dispose on completion, error, cancellation, navigation,
  replacement, and teardown. Use scoped tensor cleanup correctly across
  synchronous and asynchronous boundaries.
- Profile retained tensors/heap/GPU resources and model-cache growth over long
  repeated sessions. Treat runtime-reported memory limits and estimates
  explicitly; browser JavaScript heap measurements do not describe all GPU use.
- Reduce avoidable allocations, typed-array copies, padding, oversized inputs,
  and unnecessary precision. Recheck numerical and pedagogical equivalence.
- Pause hidden/offscreen animation and nonessential processing, cap costly
  canvas resolution where justified, honor reduced motion, and prevent model
  execution from contending needlessly with scene effects and chart updates.
- Profile React updates, editor work, syntax highlighting, charts, media,
  hydration, and layout together with ML. Virtualize genuinely large collections
  and use incremental rendering where it improves measured interaction.
- Test multiple tabs, background/resume, memory pressure, mobile thermal slowdown,
  and interrupted sessions. Provide a recoverable smaller workload or supported
  fallback with clear limitations when a device cannot run the requested task.

### Performance acceptance

For each optimization, retain a before/after benchmark tied to the exact
revision, artifact, browser/backend, device, inputs, and warm/cold conditions.
Run the affected correctness, numerical, corpus, memory, accessibility, and
browser checks. Set rollout and regression thresholds from measured variability.
Preserve meaningful error messages and learning requirements while improving
startup, throughput, responsiveness, or memory.

Primary implementation references:
[TensorFlow.js platform and memory guide](https://www.tensorflow.org/js/guide/platform_environment),
[ONNX Runtime Web performance diagnosis](https://onnxruntime.ai/docs/tutorials/web/performance-diagnosis.html),
[ONNX runtime/session options](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html),
and [Core Web Vitals guidance](https://web.dev/articles/defining-core-web-vitals-thresholds).

## Detailed technical work from active and deferred plans

The following implementations make broad roadmap headings actionable. Active
proposals, separate later projects, operational checks, and historical options
retain their source status. Verify older specifications against current code
before treating an item as an unbuilt feature.

### Learning-evidence and executable-review implementations

- Bind recorded training fits and returned history to the actual evaluated
  model, including internal model identity. Reject observed extra test-data
  training and protect fixture values independently of learner-editable tensors.
  Unsupported or exhausted recording must yield unknown provenance. Observed
  history cannot prove arbitrary learner code never accessed held-out data.
- Capture a valid evaluation artifact before the learner's diagnosis assertion.
  Preserve useful output after a wrong verdict and earlier saved output after
  a failed rerun.
- Capture all 43 evaluation cases within the existing artifact/table limits.
  Validate generated/authored row identity, ordering, features, labels, finite
  values, completeness, duplicate detection, and confusion/metric consistency.
- Implement the measured-run inspector: full-width score plot, class lanes,
  strict decision boundary, source markers, category counts, selected-case
  details, keyboard/previous/next navigation, and equivalent text.
- Integrate the evaluation project stage with owner-scoped first/latest storage,
  legacy migration, atomic write failure, shared size limits, entitlements,
  stale-version labels, explicit restore, and account switching.
- Implement explicit guest-record adoption. Validate any later JSON import by
  size, schema, identifiers, and content compatibility; retain source and
  assistance labels without granting independent assessment credit.
- Complete the proposed scalar-gradient/optimization explanation using actual
  captured output and re-estimate its changed dependencies.
- Add the two executable repair reviews for held-out normalization and correct
  single-reading batch-axis inference with preserved feature order.
- Extend activity discriminants, authoring/parser/build support, stable prompt
  indices, versioned fixtures, registry/enqueue coverage, collision detection,
  legacy row adapters, entitlement resolution, and owner/version-specific drafts.
- Record first/latest attempts, hints, solution exposure, skip, retry, and
  execution errors separately. Keep retrieval credit distinct from lesson credit.
- Rehearse save/discover/restore/interpret flows and authenticated paid routes,
  complete browser/accessibility checks, refresh the study packet, and observe
  the implemented slices. Record source versions, first responses, assistance,
  missing results, and repeated confusion before revising a task.
- Scope the pilot rollout to the listed activities, rehearse internally, and
  reconcile canonical backlog status after implementation. Account sync remains
  a separate authenticated API/RLS/retention/export/deletion/retry/conflict project.

Source: [November learning-evidence plan](docs/superpowers/plans/2026-11-02-learning-evidence-pilot.md).

### Dashboard, jobs, database, and export improvements

- Evaluate separating public lesson rendering/cache behavior from authenticated
  overlays while preserving immediate entitlement and progress correctness.
- Reassess the historical client-side SWR dashboard proposal against current
  rendering, request duplication, and actual latency.
- Integrate safe per-owner reads of the existing restricted `dashboard_stats`
  aggregate and an appropriate refresh schedule. Creation of the view is already
  complete. Keep restricted aggregate access behind a safe application boundary.
- Evaluate dashboard, purchase, and module cache-through paths with write
  invalidation, tenant-safe keys, bounded stale behavior, and outage fallback.
- Evaluate read-replica routing for appropriate analytics/admin reads. Preserve
  primary reads where immediate write visibility and access decisions require it.
- Choose background-job machinery for measured needs: skill-genome computation,
  event archival/partition detach, digest work, aggregate refresh, durable retries,
  deduplication, dead-letter review, and job progress/health monitoring.
- Move large retroactive GitHub exports from one request into bounded background
  work with progress, retry/cancel, idempotency, token handling, and failure recovery.
  Reassess the historical conflict branch/PR proposal before selecting a policy.
- Consider SQL-side hint aggregation, additional indexes, request coalescing,
  connection/query budgets, and bounded retention using query-plan evidence.
- Evaluate build-time API transpilation/bundling to remove unnecessary runtime
  startup work while preserving deployment artifacts, source maps, and health.

Sources: [infrastructure proposals](docs/infrastructure.md),
[development-plan history](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/dev-plan.md), [GitHub specification](docs/tech-spec.md),
and the detailed canonical inventory below.

### Observability and delivery operations

- Add browser-side failure reporting to onboarding completion and settings writes
  where current paths still lack it, with useful diagnostics and redaction.
- Verify Stripe dashboard notifications, quota/cost alerts, job heartbeats, and
  public status reporting. Record actual delivery rather than configuration alone.
- Implement durable searchable API log aggregation, same-day signup/purchase
  anomaly visibility, and a tighter behavioral synthetic-monitoring cadence.
- Add an independent incident-notification fallback when the ordinary email
  delivery dependency fails.
- Implement bounce/complaint-driven invalid-email state, required schema changes,
  user re-validation, and provider webhook recovery.
- Maintain webhook retry/dead-letter handling where provider retries and current
  idempotency leave a concrete remaining gap. Reconcile existing behavior first.
- Evaluate newer React Hooks/Compiler advisory lint rules against the pinned
  toolchain and address useful findings without conflating advisory rules with
  measured performance improvements.

Sources: [observability follow-ups](docs/observability.md),
[historical development follow-ups](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/dev-plan.md), and
[web lint configuration](apps/web/eslint.config.mjs).

### Tensorcraft Pulse technical implementation

Pulse remains a deferred publishing proposal. Revalidate source access, provider
choices, costs, schemas, and current runtime versions before implementation.
Inventory and reuse the existing news ingestion/deduplication, candidate
matching, drafting scripts, schemas, and workflows before adding Pulse-specific
capabilities. The current pipeline is a starting point, not an unbuilt feature.

- Build a separate daily worker/orchestrator and typed source adapters for
  selected news, papers/models, release feeds, repositories, and vendor/blog RSS.
- Add versioned raw-item, lesson-embedding/body-hash, match, publication,
  editorial-queue, rewrite-signal, and job-state data structures.
- Implement initial lesson indexing and incremental re-embedding after relevant
  content hashes change, with resumable bounded batches.
- Implement ingestion deduplication, summaries, embedding/matching, quality
  scoring, publication thresholds, editorial routing, and retention/TTL cleanup.
- Detect potential stale content through release keywords, API-symbol changes,
  and optional reviewed model-assisted diffs. Preserve human control of lesson edits.
- Implement global/world feeds, lesson current-events blocks, queue approve/reject,
  bulk actions, keyboard controls, and signal-disposition administration.
- Add per-source rate limits, budget guards, run reports, failure/usage alerts,
  worker packaging/deployment, and regression fixtures for all pipeline stages.

Sources: [deferred Pulse implementation plan](docs/superpowers/plans/2026-05-03-tensorcraft-pulse.md),
[current ingestion](scripts/news/scrape.mjs), [matching](scripts/news/match.mjs),
and [drafting](scripts/news/draft.mjs).

### Authoring, worlds, media, and historical specification reconciliation

- Add an author preview workflow with fast content reload, scaffolds, source
  metadata, and meaningful content/compiler diagnostics.
- Extend per-world glossaries and alias validation. Reconcile full lesson-code
  variants and rendering/switching for additional frameworks with the narrower
  bridge-variant proposal and current learner demand.
- Evaluate module-level formula/equation metadata and presentation, unused
  skill-axis tokens, and remaining content-rendering/metadata tests.
- Extend the current media integration only where needed: lesson clip metadata,
  captions/text fallbacks, author-side scene specifications, manifest/build
  validation, upload/deploy tooling, hosting, and approved production batches.
  Preserve the latest silent-clip direction and existing shipped player.
- Reassess automatic promotional/lesson screenshot refresh, hero replay controls,
  and dashboard world selection using current implementations and owner decisions.
- Reconcile historical per-exercise hint-panel/schema requests with hints that
  already exist. Add only missing exercise-specific behavior and validation.
- Check whether the actual runtime lab satisfies the old real-model exercise
  request before planning another rewrite. Retain explicit network/cache/CI
  requirements for any new large-model task.
- Reconcile resume/study-time persistence, progress-write concurrency, field
  limits, payment/auth/GitHub error mapping, platform-versus-code errors, and
  API response contracts against later fixes.
- Verify the remaining scope of PNG progress sharing, Clipboard/Web Share
  fallback, certificate PDF/print and dynamic social-image generation, and
  in-lesson reactions/feedback before selecting additional work.
- Apply changes to price, currencies, regional offers, team seats, and releases
  across catalog, Stripe/test mode, entitlements, receipts, copy, metadata,
  reporting, and affected tests as one coordinated implementation.

Sources: [development-plan history](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/dev-plan.md),
[video integration](docs/future-ai-video-scenes.md),
[content-quality plan](docs/content-quality-plan.md),
[learning-product plan](docs/learning-product-development-plan.md),
and [technical specification](docs/tech-spec.md).

## Optional and owner-gated product directions

These are recorded future proposals. They require the stated evidence,
capacity, and owner selection before implementation.

### Subscriptions and purchase options

An all-access subscription requires demand for continuing learning, a
sustainable publishing cadence, and economics compared with one-time sales.
The proposed build includes persisted customers, explicit entitlements,
subscription checkout, lifecycle webhooks, dunning, billing management, and a
clear treatment of existing lifetime buyers. Test money-related behavior in
Stripe test mode before any separate live launch.

Guest checkout remains disabled. Re-enabling it requires the recorded
post-payment success, ownership, credit, identity, webhook, and acceptance
repairs. Purchasing-power indicators, installment methods, and a
merchant-of-record change remain evaluations rather than promises.

### Tensorcraft Arena

A free public arena would let people practice through competitive ML
challenges. The current direction allows public challenge discovery without
buying a world. Its proposed scope includes:

- Weekly challenges drawing on the five worlds as their content becomes
  suitable, with practice runs, submissions, and inspectable results.
- Public profiles, leaderboards, shareable result cards, and referral
  attribution. Decide account requirements for submissions separately from
  public browsing and practice.
- Community solutions and discussion, with publication rules that protect
  active challenges. The historical competition proposals also include
  matchmaking, ELO-style ratings, live standings, reputation/cosmetics,
  seasonal tournaments, and possible prizes. These require separate scope
  and operating decisions.
- Server execution of submitted code against hidden holdout data, followed
  by server-written scores. The protected submission table exists, but the
  competitive scoring service still needs implementation.
- An isolated execution service with bounded CPU, memory, and runtime,
  blocked network/filesystem access, and reusable workers. Establish seeded,
  reproducible challenge execution and verify repeated scoring agrees.
- Rate limits, replay detection, auditable submissions, anti-cheat review,
  moderation/reporting, and public-content rules. Publish only the intended
  profile and ranking fields.

Rankings start with new server-verified arena submissions. Existing browser
exercise scores cannot seed the ladder. The lesson grader also needs a
separate execution boundary before it can handle competitive submissions.

First test whether a small challenge prototype helps learning or brings
qualified buyers. Expand after that evidence supports the ongoing challenge,
moderation, and infrastructure work. The older paid-arena proposal is
superseded by the current free-arena direction. No tournament date, prize
budget, or ranking formula is committed here.

Sources: [current arena direction](docs/roadmap.md),
[arena delivery backlog](docs/post-launch-backlog.md),
[scoring contract](docs/arena-scoring-contract.md), and
[historical competition features](docs/product-plan.md#arena).

### Shared learning, social features, and story expansion

- Opt-in teams with invitations, leadership history, and public boards.
  A shared review queue and team forgetting score depend on that team layer.
- Adversarial pair mode with a real-time split-screen coding workspace,
  critique rubric, and a defined competitive exercise outcome.
- Mentor ghost mode showing anonymous distributions of other learners'
  decisions once there is enough useful data to display.
- Rate-limited 24-hour bridge-preview gifts, an opt-in public capstone
  gallery, cohort starts, and capstone leaderboards.
- A second-price capstone auction using a proposed token economy. It depends
  on the auction lesson and a separate decision about participation rules.

The old user-count gates are minimum planning triggers. Each proposal still
needs a useful learner purpose and a current implementation scope.

Additional boss decisions depend on actual completion/drop-off evidence.
Branching quizzes could change the following scene, and world epilogues could
respond to a learner's sequence of decisions. Reputation cosmetics, character
perspective versions, voice-actor cards, and commitment nudges remain deferred.
A Thompson-sampling review scheduler requires the relevant Bayesian lesson
and an evaluation against the current review experience. Preserve the existing
six saved story decisions and count completed candidates toward expansion.

### Enterprise learning

An enterprise offer requires a real team-buyer need, useful learning evidence,
and suitable curriculum coverage. The proposed platform includes organizations,
invitations, scoped billing/manager/learner roles, seat billing, team progress,
and the relevant identity/procurement requirements. SSO/SCIM, invoicing, and
processor agreements follow the selected buyer need. Track contracts and seats
separately from unique paying customers.

### Advanced curriculum, publishing, and presentation

- Evaluate a Vickrey auction lesson for Terra Grid, a Stackelberg strategy
  treatment of adversarial patches for Neon Protocol, and a preference-learning
  treatment of reinforcement learning from human feedback for Signal Ward.
  Restoring the SHAP interpretability lesson and its strategy cross-link
  requires a suitable place in a launched world and a fresh teaching review.
- Evaluate real-data retraining of demonstration/capstone models and an
  ensemble capstone. Each needs a defined learning purpose, lawful data
  access, technical evaluation, and domain review. Existing synthetic
  artifacts retain their documented role until replacement work is approved.
- Consider the public bridges catalog, framework variants, and wider search
  publishing when they serve measured learner/distribution needs. Package
  release and catalog restoration are distinct tasks.
- Tensorcraft Pulse would collect relevant browser-ML news and releases,
  match them to lessons, and present a public feed. Proposed editor-approved
  lesson updates and release-change alerts would help identify stale content.
  Its ingestion, summarization, matching, and editorial queue remain deferred.
  Expanded article/news matching and a full sitemap retain their own scopes.
- Editor offline fallback, optional scrollytelling, live or drill-down
  visualizations, and low-priority quiz expansion remain separate candidates.
- Revisit dashboard panel disclosure, module-map refinements, and additional
  theme-toggle locations using actual usability evidence. Owner-authored
  copy/layout rulings need explicit decisions before changing them.
- Reassess the proposed `ActivityHeatmap` and `LossLandscape` components
  against current implementations. Any new activity view needs accurate
  progress data. A loss visualization needs a clear teaching purpose and
  meaningful learner interaction.
- PWA/push notifications, streak nudges, and broader retention experiments
  require useful demand, opt-in behavior, and an operating plan.

Removed surfaces such as the old extras catalog and DISPATCH inbox do not
return automatically because historical plans mention them. A targeted
curriculum reuse or feature restoration needs its own current scope.

Sources: [optional growth directions](docs/roadmap.md),
[canonical deferred proposals](docs/post-launch-backlog.md),
[arena scoring contract](docs/arena-scoring-contract.md), and
[historical polish context](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/v2-polish-backlog.md). Pulse's proposed
workflow is recorded in its [deferred implementation plan](docs/superpowers/plans/2026-05-03-tensorcraft-pulse.md).

## Long-range platform possibilities

The [platform feature proposals](docs/platform-feature-proposals.md) explore
new story seasons, character development, cooperative crews, persistent
projects, community investigations, and more ambitious platform experiments.
They include proposed pilots and evaluation criteria. These suggestions need
product selection before becoming delivery commitments.

These ideas come from historical product, engineering, and marketing plans,
or from explicitly deferred extensions to the current learning pilot. They
remain visible here so ambitious possibilities are not lost. Their old version
numbers, launch dates, revenue forecasts, and adoption targets are superseded.
Each needs a fresh product decision and implementation plan before scheduling.

### Native mobile and offline study

The older plan proposes a React Native mobile app and downloadable lessons
for offline study. This would extend beyond the browser PWA and editor fallback.
Scope the phone learning experience, supported offline exercises and assets,
content updates, storage limits, and progress synchronization before choosing
a native implementation. Verify what learners can actually run without a
connection and how their work survives reconnecting.

### AI tutor and advanced learner analytics

An LLM-assisted tutor could offer coding hints and explain a learner's result.
The recorded open questions include when help appears and how much help a
learner receives. Design around the actual lesson, authored references, and
inspectable code/output. Evaluate incorrect guidance and answer-giving, retain
assistance labels, and account for inference cost and learner-data handling.
The current authored hint system remains the baseline.

The historical plan names an advanced analytics dashboard without defining
its audience. One possible scope is a learner-facing view of attempts,
recurring errors, review history, and demonstrated capabilities, alongside
the operator dashboards planned elsewhere. Explain the limits of those
records and distinguish assisted work from independent performance.

### Community spaces and peer review

Historical ideas include forums, lesson comments, peer code reviews, an owned
Discord community with world channels, and curriculum-author office hours.
These need moderation, a sustainable teaching/support schedule, and clear
boundaries between learner discussion and authoritative course corrections.
Start with the format learners actually use before building every surface.

### Certification and employer relationships

A formal certification program would need defined competencies, assessment
design, independent performance evidence, verification, and review procedures.
Existing course-completion certificates do not establish that program.
Employer partnerships and corporate training are separate long-range options
that depend on demonstrated learner outcomes and a concrete partner need.
No accreditation, hiring outcome, or partnership is promised.

### Custom worlds and tools for other educators

A custom-world SDK would let third-party authors create new courses or worlds.
It would need a stable content/interaction contract, previews, validation,
versioning, accessibility checks, and a supported publishing process. This is
broader than the internal lesson scaffold already planned.

Historical distribution proposals also include reusable public UI components
and an ML exercise-runner package, alongside the bridges package. Re-scope
them against the actual runtime, maintenance capacity, and applicable licenses.
Free standalone, embeddable interactive demos could introduce course concepts
outside the main app. Verify each analogy and experiment before publishing it.
Platform licensing is another recorded commercial possibility, distinct from
selling learner seats, with no selected delivery or licensing model yet.

### Localization and regional purchase options

Recorded language candidates include Spanish, Brazilian Portuguese, Japanese,
Korean, Simplified Chinese, French, German, Hindi, Arabic, and Hebrew. The
source plans disagree about sequence, so there is no fixed language order.
Arabic and Hebrew would require verified right-to-left layouts.

The proposed system includes translated interface strings and terminology,
locale-aware routes, publication by world and language, visible fallbacks,
progress preserved across languages, and translation completeness tracking.
Machine-assisted drafts would receive native-speaking technical review and
community correction support. Audit the current architecture before assuming
the older specification's preparatory work already exists.

Localized checkout currencies remain an unresolved purchase option, separate
from purchasing-power discounts. Revisit catalog prices, receipts, refunds,
bundle credits, and reporting together if that option is selected.

### Learning workspaces beyond the current pilot

The current pilot deliberately limits saved learning records. Possible
extensions currently absent, deferred, or excluded from the pilot include
authenticated synchronization across devices, validated record import,
full-model persistence, and a course-wide shared model. These require explicit
ownership, compatibility, retention, recovery, export, and deletion behavior.
Saving or importing a record must retain its source and assistance labels.

Other recorded research possibilities include learner-supplied datasets,
additional threshold controls, evaluation curves, model comparison/ranking,
free-text assessment, and automated explanations of failures. Each needs a
specific learning purpose and evaluation. These are outside the current pilot
and have no implementation commitment.

### Later sharing and referral features

Progress cards, learner-project sharing, and referral attribution could support
word of mouth. The current acquisition plan starts with voluntary sharing and
manual attribution. Build referral automation only after learners recommend
the course on their own. Any rewards need a new decision that fits the current
purchase model and preserves honest progress records.

Sources: [historical product vision](docs/prd.md#7-release-plan),
[superseded version roadmap](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/dev-plan.md#version-roadmap),
[product options and founder questions](docs/product-plan.md),
[localization design](docs/tech-spec.md#8-internationalization-descoped-to-post-v10),
[historical community and creator proposals](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/marketing-plan.md),
[current referral approach](docs/marketing-first-1000-paid.md), and
[learning-pilot extension boundaries](docs/superpowers/plans/2026-11-02-learning-evidence-pilot.md).

## Detailed canonical implementation and verification inventory

This inventory directly includes every retained unchecked record from the
[canonical backlog](docs/post-launch-backlog.md), inspected November 3, 2026.
It retains 345 records from 353 unchecked source records, including nested
scope. Eight superseded or completed records are reconciled below. Source-line
numbers refer to that inspected revision and may move as the backlog changes.

Status labels distinguish recorded open work, partial residuals, conditional
ideas, operator actions, owner decisions, and historical findings that need
verification against later fixes. These are not 345 confirmed unbuilt features.
Some parent records repeat nested scope so that no implementation disappears
when reading a single record. Current source and later verified evidence govern
implementation. One contact address is omitted from this reading inventory.

| Disposition                                | Records |
| ------------------------------------------ | ------: |
| Owner-gated / verify current ruling        |      30 |
| Open as recorded / reproduce current state |     185 |
| Conditional proposal / verify need         |      12 |
| Partly open / reconcile inline status      |      13 |
| Partly open / completed subparts excluded  |       6 |
| Operator verification / dashboard action   |      24 |
| Historical setup / verify later completion |       3 |
| Historical finding / verify later closure  |      72 |

### First-1,000 funnel follow-ups (2026-11-02)

- **CB-001**, source line 32. Status: Owner-gated / verify current ruling.

  **(OWNER) The hero note awaits approval.** "The first 5 lessons are free, no account needed." sits under the hero buttons (`landing-hero.tsx`), as §9 item 2 of the plan asks. The count comes from `getModuleLessonCount()`, which `module-counts.test.ts` checks against the lesson files. The record it touches: - It returns the content of the trust line "No credit card. No account for module 1." to the same slot. Commit 0be63b29 removed that line on 2026-08-19. - It brings back the free claim dropped from the button on 2026-08-22 (b3f7b7ae, "Run Your First Tensor (Free)"). The owner also had the bridge section's free CTA removed on 2026-08-31. The session record gives redundancy as the reason: the hero and closing CTAs already led to the same free lesson. - On wide screens it lifts the buttons 28px off the subhead's bottom edge, which the 2026-08-31 one-row layout aligned. Hanging the note below the row on wide screens would keep that alignment. - On phones it sits under the second button, 84px below the primary one. On a first visit at 375 by 667 the consent bar covers it. At 320 by 568 the note sits below the fold, and the consent bar covers the primary button itself. If approved, update the history comments in `e2e/landing.spec.ts` and `apps/web/app/page.test.tsx`. The landing visual baselines mask the hero canvas, so a baseline diff will not show the note. The 320px capture still changes height and needs a re-mint.

- **CB-002**, source line 57. Status: Owner-gated / verify current ruling.

  **(OWNER, before the first sale) The checkout source question stays off while `ACQUISITION_SOURCES` is empty.** Filling the list in `apps/api/src/lib/acquisition-source.ts` switches on the optional "How did you find Tensorcraft?" question. Labels and values must each be unique, and the unit test enforces every rule Stripe test mode enforced on 2026-11-02. Put these privacy changes in a web deploy that is live before the API deploy that carries the list: - `/privacy` section 2 (purchase data): Stripe keeps the optional answer with the payment, and Tensorcraft does not copy it. - Section 3 (purposes): the purpose, learning which channels bring buyers, and its legal basis. The owner or counsel picks consent for a voluntary answer or a stated legitimate interest. - Section 9 (retention): how long the answer stays. The ten-year tax retention for purchase records does not cover it. - The "Last updated" date and the privacy snapshot test. - Access and erasure: add a Stripe Dashboard step to section 4 of [the support runbook](docs/support-runbook.md), and widen Stripe's purpose in [privacy-compliance.md](docs/privacy-compliance.md). Stripe's Redaction Jobs API (public preview) can also redact Checkout Sessions.

- **CB-003**, source line 76. Status: Open as recorded / reproduce current state.

  **(B5) Guest exercise runs call two signed-in endpoints.** `lesson-content.tsx` posts `/api/exercise-attempts` on every run and `/api/github/commit` after a pass without checking for a session. Both return 401 for guests (three console errors in the walkthrough). The API's global rate limiter (`apps/api/src/index.ts`) runs before auth, so a traffic spike spends Upstash quota on requests that can only fail. Skip both calls when there is no session.

- **CB-004**, source line 83. Status: Open as recorded / reproduce current state.

  **(B2) The nav's "Blog" link opens "Our first post is coming soon."** That line states a future plan on a user surface. Hide the link until the first post ships, or publish the first post (source material: [tensor cleanup article material](docs/articles/tensor-cleanup-material.md)).

- **CB-005**, source line 87. Status: Owner-gated / verify current ruling.

  **(OWNER) The Kit drafts carry two stale claims.** Fix them before creating the automations (plan §9 item 6). In [the drafts](docs/email-retention-sequences.md), A1 says "The first lesson takes fifteen minutes", but lesson one's `estimatedMinutes` is 8 (the module totals 59). A2 says "55 bridges", but the shared `BRIDGES` list has 51 entries, and no page on the site states a count.

### CI repair follow-ups (2026-10-25)

- **CB-006**, source line 98. Status: Open as recorded / reproduce current state.

  **Lesson 1 recap contradicts its own recall.** The learner answers `[12]` for `tf.tensor(streamValues)`, then DeepOrbitRecap shows the retired three-value example (`[0.2, 0.4, 0.6]`, "Its shape is [3]"), unlabelled. Breaks the one-continuous-recording rule. Files: `deep-orbit-recap.tsx`, `deep-orbit-tensor-figure.tsx`, `deep-orbit-terms.tsx`. The authored MDX recap ("[12] means a list of 12 numbers") never renders in that branch.

- **CB-007**, source line 104. Status: Open as recorded / reproduce current state.

  **Warm-up asks about a line it never shows.** "Does this line train a model?" has an `example` in the recall prompt, but `parse-recall-prompts.ts`, `ResolvedReviewItem` and `lesson-warmup.tsx` drop it (since 1f213595).

- **CB-008**, source line 107. Status: Open as recorded / reproduce current state.

  **"Run example" result is not announced reliably.** The only status region mounts together with its text (`tensor-investigation.tsx`, `exercise-output.tsx`). Keep a live region mounted before the run.

- **CB-009**, source line 110. Status: Owner-gated / verify current ruling.

  **Reduced-motion reveal cascades.** `globals.css` sets `transition-duration: 0.01ms` with `transition-property: all`, so a `visibility` reveal steps down one nesting level per frame (120 to 440 ms); content is hidden from screen readers meanwhile. Owner call on the rule.

- **CB-010**, source line 114. Status: Open as recorded / reproduce current state.

  **Shared Deep Orbit prose rules out-specify component rules.** Two cases were patched in `deep-orbit-lessons.css` (recall notes, checkpoint heading). The binding fix is moving the shared prose rules into a cascade layer, then reviewing every lesson visually.

- **CB-011**, source line 118. Status: Owner-gated / verify current ruling.

  **Phone keyboard guarantee from the 2026-10-10 challenge spec is gone.** At 390 px a step's code sits 590 and 376 px from its line (budget 320). The e2e now checks the Line keys instead. Owner call: restore or retire.

- **CB-012**, source line 121. Status: Owner-gated / verify current ruling.

  **Lighthouse runs each URL once.** `/worlds` Time to Interactive missed its budget in 1 of 4 identical runs. `numberOfRuns: 3` in `.github/lighthouserc.json` asserts the median at about 3x the step's Actions minutes. Owner call.

- **CB-013**, source line 125. Status: Open as recorded / reproduce current state.

  **Small items.** "Next, Farah will help you" skips ProseText, so no character mention; `.tensor-investigation .iv-cells` CSS is dead since 32022a1b; the checkpoint text runs about 120 characters a line at 1440 px; pricing restore accepts unlaunched world slugs (the API rejects them at checkout); `zod 4.6.5` remains dev-only through eslint-plugin-react-hooks.

### Foundations opening follow-ups (2026-10-03)

- **CB-014**, source line 165. Status: Open as recorded / reproduce current state.

  **Optional future opening research, unscheduled.** This does not block the visual rollout. If separately commissioned, the proposed prerequisites are: internal content and runtime checks pass with no blocking defects, and a research slot and compensation budget are allocated. The owner is the proposed study lead. Reserve 16–24 hours for recruitment, twelve short observations, follow-ups, and analysis. Proposed compensation is $25 each, $300 total. Allocating $150 in each of two months fits within the current $200 monthly marketing budget while leaving $50 per month for other acquisition work. Recruitment time is uncertain. Keep this round separate from the formal novice pilot and exclude compensated purchases from demand evidence. Assess explanation of the first result, a changed case before its worked answer, and whether the learner understands why this prepares data for ML. Record voluntary continuation and its stated reason. Include a short seven-day follow-up within the existing time and compensation budget, reporting missing responses and help. Scheduled follow-ups are not organic product retention. The detail plan defines these observations.

- **CB-015**, source line 181. Status: Open as recorded / reproduce current state.

  **Assess purchases after the opening revision.** Gate: the relevant PostHog measurement follow-ups below are complete and there is enough new external use to report meaningful counts. Reconcile payment and refund records, separate study participants and existing owners, and label missing consent or attribution. Until then, commercial evidence remains inconclusive.

- **CB-016**, source line 190. Status: Open as recorded / reproduce current state.

  **Consider a randomized opening comparison.** Gate: measurement is reliable and sufficient eligible traffic exists. Define a primary outcome, useful effect size, sample requirement, and stopping rule before running the comparison. Current tracked traffic is insufficient; this is not part of the initial implementation or twelve-person discovery round.

- **CB-017**, source line 212. Status: Open as recorded / reproduce current state.

  **Prepare the revised course for the existing formal novice pilot.** Gate: B, prerequisite coverage, opening implementation, and internal checks are complete; review opening diagnostics before freezing the study version. Refresh the Q6 handoff below and retain the [pilot protocol](docs/learning-study/pilot-protocol.md), including all five free lessons, early independent model work, the final project, delayed checks, and 30-day use evidence. Schedule and budget this separately from the twelve-person opening round. Required resource fields and recruitment remain pending; no participants or results are implied. Treat observed enjoyment, independent skill, and genuine purchases as separate evidence. Full-course learner evidence remains required before claiming beginner effectiveness or scaling an unproven paid funnel.

### Content quality and learner evidence (2026-09-17)

The November 9 owner decision sets $79 introductory and $99 regular. It
supersedes the earlier $50 launch and $70 later pricing instructions in this
retained inventory. Quality and learner-evidence requirements remain open.

- **CB-018**, source line 259. Status: Open as recorded / reproduce current state.

  **Deferred human evidence for Q2/Q4/Q5 acceptance:** observe baseline and metric rationale, errors, difficulty, delayed recall and unaided project work; ask learners which choices affected later scenes. Local implementation checks do not establish these outcomes. The prior reviewer packet must be refreshed for the revised source before an external handoff. No recruitment in this pass.

- **CB-019**, source line 300. Status: Open as recorded / reproduce current state.

  **Q7 price validation:** assess the $79 introductory and $99 regular offer using actual purchase, refund, support and learner evidence. The November 9 owner decision supersedes the earlier price hold.

- **CB-020**, source line 302. Status: Open as recorded / reproduce current state.

  **Start measurement review now, Q8:** verify learning and acquisition funnels; use cohort evidence to assess the 200,000 unique paying-customer ambition, with buyers distinguished from seats and repeat purchases.

- **CB-021**, source line 305. Status: Open as recorded / reproduce current state.

  **Before each future world release, Q9:** complete full subject, prose, story, exercise, and project review, plus a world-specific learner pilot.

### 1. Operator + external service setup

- **CB-022**, source line 534. Status: Open as recorded / reproduce current state.

  Search Console reindex request after the next deploy (added 2026-08-25): the /learn result still serves a pre-rebrand snippet (the old "...developer's guide" wording, www host). Inspect `/` and `/learn` in GSC and hit Request Indexing so Google picks up the rewritten /learn meta description and shows the site name "Tensorcraft" instead of the bare domain (signals: WebSite JSON-LD, og:site_name, application-name; gated by `apps/web/app/layout.test.tsx`).

- **CB-023**, source line 542. Status: Open as recorded / reproduce current state.

  PPP (Purchasing Power Parity) indicator on pricing page.

- **CB-024**, source line 543. Status: Conditional proposal / verify need.

  Payment plans (installments): evaluate Klarna/Afterpay.

- **CB-025**, source line 544. Status: Partly open / reconcile inline status.

  Review prompt at certificate issuance + collect beta quotes: the build task that produces the third-party proof the two items below consume (`roadmap.md` §2 P3 kept this half when "name the teacher" was rejected).

- **CB-026**, source line 548. Status: Open as recorded / reproduce current state.

  Social proof on landing page once real user counts exist.

- **CB-027**, source line 549. Status: Open as recorded / reproduce current state.

  Pricing-page JSON-LD AggregateRating once reviews exist.

- **CB-028**, source line 550. Status: Open as recorded / reproduce current state.

  Testimonials on landing/pricing once real users exist.

- **CB-029**, source line 551. Status: Open as recorded / reproduce current state.

  Compliance polish (audit register §2 P2, triaged 2026-07-22): consent granularity/versioning/expiry (CNIL ~6mo); equalize Accept vs "Essential only" salience; banner names only PostHog (add Plausible + Vercel Analytics); gate Sentry session replay behind consent (`replaysOnErrorSampleRate: 1.0` exceeds strictly-necessary); disclose the `tc_world` cookie; align the under-16s claim with reality or add an age gate.

### 2. Ongoing operations cadence

- **CB-030**, source line 567. Status: Open as recorded / reproduce current state.

  Weekly metrics review: completion rates, hint dependency, time-on-page, conversion.

- **CB-031**, source line 569. Status: Open as recorded / reproduce current state.

  Cohort analysis: performance by difficulty, world, learner background.

- **CB-032**, source line 570. Status: Open as recorded / reproduce current state.

  Content maintenance cycle: monthly review analytics + optimize 2-3 lessons; quarterly character/narrative consistency audit; biannually full curriculum technical-accuracy + bridge-consistency audit.

- **CB-033**, source line 573. Status: Open as recorded / reproduce current state.

  Analytics-driven content QA thresholds: lesson completion beginner ≥75% / intermediate ≥60% / advanced ≥45%; exercise pass ≥70% within 3 attempts (content review if <50%); hint dependency ≤40% of completions (>60% triggers exercise redesign); scroll depth ≥75%; story-skip >40% in any module flags narrative redesign.

- **CB-034**, source line 578. Status: Owner-gated / verify current ruling.

  Respond to beta feedback + community Discord questions. **Blocked on the Discord existing.** Moved here from `docs/audits/launch-blockers-history-2026-08-23.md` 2026-08-23 (owner: postpone until after launch). Nothing in `apps/web` references Discord and the site footer carries only four links (`apps/web/app/components/site-footer.tsx`). When you want it: create the server, channels and rules, then send the invite link and the repo half is a footer link plus a snapshot update. It was only ever on the launch list because this cadence line assumed a server already existed.

- **CB-036**, source line 587. Status: Open as recorded / reproduce current state.

  Re-audit cadence: run the multi-agent quality audit after each major content sprint; index audits in `docs/audits/README.md` (index still TODO).

- **CB-037**, source line 589. Status: Open as recorded / reproduce current state.

  Priority/effort pass over this backlog: sections (§4 especially) have grown into unordered mixes of 1-line fixes and 20-day features; rank within each section (impact × effort) so the index stays navigable (added 2026-07-22).

- **CB-038**, source line 593. Status: Open as recorded / reproduce current state.

  Quality-rubric maintenance: extend `docs/quality-rubric.md` before shipping any new content pattern.

### 3. Data-gated content work

- **CB-039**, source line 604. Status: Owner-gated / verify current ruling.

  **Restore the bundle surfaces when world 2 launches.** Scope grew on 2026-08-14 (owner directive, screenshot feedback on /pricing): future product plans are not shown to users anywhere, so every user-visible trace of the bundle ladder was removed, not just the dead CTAs. Self-healing off `LAUNCHED_WORLDS` with no edit: the tier cards, and the JSON-LD offers in `apps/web/app/pricing/pricing-jsonld.ts` (gated tiers are now filtered out of the catalog entirely; each reappears once enough worlds have launched to fill it - a pinned test in `pricing-jsonld.test.tsx` fails at that moment as a reminder to walk this list). Manual steps: - `BundleRoadmap` ("Listed, not sold." strip) was DELETED, component and test; recover from git history before 2026-08-14 if wanted, or decide the grown tier grid covers it. - `metadata` in `apps/web/app/pricing/page.tsx`: title flattened from "From $0 to $159" to "Free Preview, $59 per World"; descriptions dropped their bundle clause on 2026-08-09. - Pricing hero paragraph dropped "bundle a few, or all five worlds" (2026-08-09). - FAQ "Is Tensorcraft free?" (`apps/web/app/faq-data.ts`) dropped the ship-in-waves and bundle-discount sentences; "Can I learn ML with JavaScript?" dropped the CV/NLP-worlds-in-development clause. - /compare cost row dropped the all-five price; capstone row dropped "four in the pipeline".

- **CB-040**, source line 626. Status: Open as recorded / reproduce current state.

  **BossBeat expansion** (6 ranked beats, one per dormant module). Gate: ~100 real lesson completions so placement follows observed drop-off. Detail spec + non-negotiable quality gates: `docs/v2-beat-expansion-plan.md`. The newer [Q4 plan](docs/content-quality-plan.md#q4-improve-story-and-consequential-choices) first improves existing consequences and pilots two candidates. Count any shipped candidates toward this wave rather than duplicating the work.

- **CB-041**, source line 635. Status: Open as recorded / reproduce current state.

  #2 Team layer (opt-in): teams/team_members/leadership_log + invite codes + opt-in public boards (~10-14d).

- **CB-042**, source line 637. Status: Open as recorded / reproduce current state.

  #10 Shared team bandit (hard dep on #2, ~5-7d).

- **CB-043**, source line 638. Status: Open as recorded / reproduce current state.

  #4 Adversarial pair mode: Realtime split-screen Sandpack (~14-20d).

- **CB-044**, source line 639. Status: Open as recorded / reproduce current state.

  #7 Mentor ghost mode: anonymous decision-distribution overlay (~8-12d).

- **CB-045**, source line 641. Status: Open as recorded / reproduce current state.

  #14 Capstone auction (Vickrey; needs auction lesson first, ~14-18d).

- **CB-046**, source line 642. Status: Open as recorded / reproduce current state.

  #8 Trade-the-bridge gifting (~3-5d).

- **CB-047**, source line 643. Status: Open as recorded / reproduce current state.

  #9 Public capstone gallery at /gallery (~5-8d).

- **CB-048**, source line 645. Status: Open as recorded / reproduce current state.

  #5 Branching quizzes (high authoring tax, ~14-20d full curriculum).

- **CB-049**, source line 646. Status: Conditional proposal / verify need.

  #12 Reputation currency (SP cosmetic only; re-evaluate when LATER opens).

- **CB-050**, source line 648. Status: Open as recorded / reproduce current state.

  #17 Branching world epilogues (~6-8d).

- **CB-051**, source line 649. Status: Open as recorded / reproduce current state.

  #16 Voice-actor character cards ($$$$ recurring; defer).

- **CB-052**, source line 650. Status: Open as recorded / reproduce current state.

  #18 Character-perspective re-render (3-4x MDX cost; defer).

### 4. Polish (editorial, models, features)

- **CB-053**, source line 654. Status: Open as recorded / reproduce current state.

  **Module map design passes (2026-08-29 audit, deferred).** The four defect fixes from the audit shipped same day (mobile teaser overlap, Start-vs-Continue CTA, header stats modes, price-once locked rows, crew strip hidden when the trailer band renders). Deferred design work, in priority order: 1. Make the map read as a route: the connector between module rows is a 1x8px sliver nobody sees. A continuous full-height spine with waypoint nodes, filled to the learner's position, would encode "you are here, this far to a deployed model". Keep it a neutral border-token hairline with nodes, structural like the pane dividers; the left accent bar ban still applies to colored edges glued to cards. 2. Type hierarchy in the list: module titles (14px) match lesson titles and sit 2px above their descriptions, while the 16px lesson ordinal is the largest type in each card. One step up for module titles, ordinals demoted to muted 12px. 3. Trailer resting affordance: the only play cue is a 12px mono caption on a 900px poster. A centered play glyph on hover/focus keeps the restraint. Decide with WORLD_TRAILER_PLAYED data. 4. Mobile: lesson titles truncate at 390px (56px ordinal panel + chevron leave ~200px). Consider dropping the ordinal panel or the chevron on small screens.

- **CB-054**, source line 675. Status: Owner-gated / verify current ruling.

  **/learn v5 video-first (2026-08-27), supersedes the v4 store page.** The owner's Flow/Veo trailer (72s, Epidemic "ES_Slipping" bed) shipped to `public/media/learn-trailer*`; the page is now trailer hero -> crew line -> close CTAs. Video SEO: VideoObject JSON-LD + sitemap `videos` entry. Store-page components deleted (git history keeps them). 2026-08-31 (owner request): the collapsible "About this video" transcript block was removed too, so the H1 + two intro paragraphs are the page's whole indexable text layer now. Watch GSC after deploy: the owner accepted the thin-content tradeoff twice; the previously documented lever ("expand the transcript block") no longer exists, so if the "javascript machine learning" cluster slips, bring the owner options rather than restoring removed sections unprompted. Original v4 record follows for history:

- **CB-055**, source line 744. Status: Partly open / completed subparts excluded.

  Obtain rulings on coming-soon syllabus headings and screen-reader SEO keyword copy. Update Kit dashboard subject lines. Preserve the already-kept taglines, withdrawn paywall finding, and completed legal/module-summary changes.

- **CB-056**, source line 785. Status: Open as recorded / reproduce current state.

  **Dashboard per-panel progressive disclosure (considered, not built, 2026-08-16).** The first-run mission dispatch covers zero-activity accounts only; an account with one completed lesson gets the full dashboard back, zeroed panels included (heatmap with one cell, 0/N bridges, empty patch slots). Per-panel gating (each instrument hidden until it has data) was the alternative the owner passed on; the boundary is recorded in `docs/superpowers/specs/2026-08-16-first-run-dashboard-design.md`. Revisit if early-account retention data shows the near-empty full dashboard hurts.

- **CB-057**, source line 795. Status: Owner-gated / verify current ruling.

  Reconcile the retired DISPATCH database/RPCs and account-erasure coverage if removal becomes permanent. Restoration is only a new owner-selected scope, not scheduled inbox work.

- **CB-058**, source line 829. Status: Open as recorded / reproduce current state.

  **sequence-models/01 (signal-ward) order-vs-word coherence bug**: the lesson claims "same words, different order" for an example pair that differs by a word ("denied" vs "reported"); its own BoW vectors differ. Load-bearing for the quiz framing; needs a content rewrite when the signal-ward launch sprint runs (see `docs/audits/ai-slop-audit-2026-08-12.md`).

- **CB-059**, source line 835. Status: Conditional proposal / verify need.

  **Light-mode follow-ups** (deferred from the 2026-07-23 rollout; context in `docs/superpowers/plans/2026-07-22-light-mode.md`): - [ ] Scheme toggle inside the lesson viewer (lesson pages are chromeless - no site nav - so today learners flip scheme from other pages or the OS; candidate spot: the lesson ChromeBar). - [ ] Scheme toggle inside the open mobile-nav drawer (overlay covers the top bar while open; duplicate the toggle next to the drawer's close button). - [ ] One-time Windows/Linux visual check of the nav toggle glyphs (◐ U+25D0 has no production precedent and sits outside the latin font subset; tofu risk on non-mac platforms). - [ ] `Ticker`/`TickerCanvas` appears to be dead code (no live importer, only a stale layout.test mock) - confirm and delete or re-mount. - [ ] Tighten `SceneCanvas`'s `rgbLight` from optional-with-fallback to a required dark/light tuple once all call sites are stable (a new consumer can currently omit it and silently render dark-only hues in light). - [ ] Optional: scope `transition-colors`/`transition-all` utilities to hover/focus states so the scheme flip is perfectly uniform (today ~186 small chrome elements ease 150ms while surfaces snap - assessed fine). - [ ] Optional: client-sync `meta[name=world-color]` when the user's manual override disagrees with the OS (browser chrome color mismatch, cosmetic).

- **CB-060**, source line 837. Status: Open as recorded / reproduce current state.

  Scheme toggle inside the lesson viewer (lesson pages are chromeless - no site nav - so today learners flip scheme from other pages or the OS; candidate spot: the lesson ChromeBar).

- **CB-061**, source line 840. Status: Open as recorded / reproduce current state.

  Scheme toggle inside the open mobile-nav drawer (overlay covers the top bar while open; duplicate the toggle next to the drawer's close button).

- **CB-062**, source line 842. Status: Open as recorded / reproduce current state.

  One-time Windows/Linux visual check of the nav toggle glyphs (◐ U+25D0 has no production precedent and sits outside the latin font subset; tofu risk on non-mac platforms).

- **CB-063**, source line 845. Status: Open as recorded / reproduce current state.

  `Ticker`/`TickerCanvas` appears to be dead code (no live importer, only a stale layout.test mock) - confirm and delete or re-mount.

- **CB-064**, source line 847. Status: Conditional proposal / verify need.

  Tighten `SceneCanvas`'s `rgbLight` from optional-with-fallback to a required dark/light tuple once all call sites are stable (a new consumer can currently omit it and silently render dark-only hues in light).

- **CB-065**, source line 850. Status: Conditional proposal / verify need.

  Optional: scope `transition-colors`/`transition-all` utilities to hover/focus states so the scheme flip is perfectly uniform (today ~186 small chrome elements ease 150ms while surfaces snap - assessed fine).

- **CB-066**, source line 853. Status: Conditional proposal / verify need.

  Optional: client-sync `meta[name=world-color]` when the user's manual override disagrees with the OS (browser chrome color mismatch, cosmetic).

- **CB-067**, source line 856. Status: Open as recorded / reproduce current state.

  **Story-voice Phase 4 spot-check editorial pass** (~3.5h): dump 702 dialogue blocks, spot-check top 5 speakers against `docs/voice-guide.md`, edit ~20 outliers per character, re-run velite + build.

- **CB-068**, source line 859. Status: Open as recorded / reproduce current state.

  **Studio-one VAE real-data retraining** (~3h): tiny CelebA subset fixes posterior collapse; architecture unchanged.

- **CB-069**, source line 861. Status: Open as recorded / reproduce current state.

  **Capstone real-data retraining, all 5 worlds** (~10h total): Deep Orbit DEEP SCAN (LIGO / Kaggle audio anomaly), Neon SENTINEL (CIFAR-10), Signal DIAGNOSTIC-ONE (MIMIC-III + ClinicalBERT), Nova STUDIO-ONE (CelebA), Terra METEOR (ERCOT).

- **CB-070**, source line 866. Status: Open as recorded / reproduce current state.

  SHAP cross-link in `<StrategyThread>`: the SHAP lesson (extras/ethics-responsibility/03-model-interpretability) was removed with /extras on 2026-08-15 (see §"/extras removal" below). Doing this now means restoring the lesson from commit `0b5ec6d` and placing it in a launched world.

- **CB-071**, source line 871. Status: Open as recorded / reproduce current state.

  Auction lesson (Terra Grid, Vickrey; JS-to-ML bridge: CSS specificity wars).

- **CB-072**, source line 872. Status: Open as recorded / reproduce current state.

  Stackelberg reframe of adversarial patches (Neon Protocol).

- **CB-073**, source line 873. Status: Open as recorded / reproduce current state.

  RLHF preference-learning reframe (Signal Ward).

- **CB-074**, source line 874. Status: Open as recorded / reproduce current state.

  Email nudge for streak-at-risk (Resend template + cron at `last_lesson_completed_at + 24h` when streak ≥3 and `email_alerts`).

- **CB-075**, source line 876. Status: Open as recorded / reproduce current state.

  PWA / push notifications (no manifest.json / service worker today).

- **CB-076**, source line 877. Status: Open as recorded / reproduce current state.

  Capstone leaderboard (opt-in, Kaggle-style holdout; needs hosting + cheating mitigations).

- **CB-077**, source line 879. Status: Open as recorded / reproduce current state.

  Commitment device at checkout (finish-by date, opt-in nudges).

- **CB-078**, source line 880. Status: Open as recorded / reproduce current state.

  Cohort starts (synchronized start dates, world-mate pairing).

- **CB-079**, source line 881. Status: Open as recorded / reproduce current state.

  Thompson-sampling scheduler upgrade (after a Bayesian intuition lesson exists; keeps self-reference parity).

- **CB-080**, source line 883. Status: Open as recorded / reproduce current state.

  **Tensorcraft Pulse** (content freshness via scraping): /pulse feed + in-lesson `<Currents>` + /admin/signals. ~$5/mo, ~3-5d. Plan: `docs/superpowers/plans/2026-05-03-tensorcraft-pulse.md` (status DEFERRED; reactivate by flipping plan header + plan-document-reviewer + Task 0.1).

- **CB-081**, source line 887. Status: Open as recorded / reproduce current state.

  Capstone v2 with multi-model ensembles.

- **CB-082**, source line 917. Status: Open as recorded / reproduce current state.

  **Decide the location-plate canon** (found 2026-09-04 by pixel-matching): the shipped `apps/web/public/locations/deep-orbit/{bridge,engineering,lab}.webp` derive from the newer `art-src/masters` candidates, not from the committed `docs/art-refs/deep-orbit/masters/` anchors that every scene and the lesson-video prompts use as their reference (`ingest.mjs` `newest()` sorts candidates by name, so a re-run keeps shipping the newer ones). Either promote the shipped renders to the anchors or re-ingest the plates from the anchors; until then the app's bridge and the Veo ingredient are different renders of the same room.

- **CB-083**, source line 963. Status: Open as recorded / reproduce current state.

  The other 20 character sheets (Neon / Signal / Nova / Terra) + world wiring + their scene art: gated on those worlds launching (see §5).

- **CB-084**, source line 969. Status: Open as recorded / reproduce current state.

  Sandpack offline fallback for the exercise editor.

- **CB-085**, source line 970. Status: Open as recorded / reproduce current state.

  Arrow-key support in exercises.

- **CB-086**, source line 971. Status: Open as recorded / reproduce current state.

  Touch-target sweep to ≥44×44 (per `docs/audits/accessibility-audit-2026-04-20.md`; verify current state first - the 2026-07-15 per-step axe gates do not check target size).

- **CB-087**, source line 974. Status: Open as recorded / reproduce current state.

  User-menu focus trap + focus restoration.

- **CB-088**, source line 975. Status: Open as recorded / reproduce current state.

  A11y medium/low sweep (audit register §5, triaged 2026-07-22): tell keyboard users Escape exits the editor (Tab indents); make the screenshot dropzone keyboard-operable; `tabIndex={0}` on overflowing code blocks; announce step _completion_ in the step bar (visited state is colour-only, `title` swallowed by `aria-label`); `role="alert"` + `aria-invalid`/`aria-describedby` on auth errors (`aria-invalid` appears zero times in the codebase); onboarding `<main>`; fix `role="tabpanel"` placed on `<main>` in settings; label the second `<nav>`s; real arrow-key/Escape handling for `role="menu"` in user-menu; stop hiding "Best Value"/"Available Now" behind `aria-hidden`; enlarge the 15.5s-scene Skip control; 15px/12px inputs to ≥16px (iOS zoom); report-issue panel clips at `left:-60px` @320px.

- **CB-092**, source line 1001. Status: Closed, 2026-11-06 documentation cleanup.

  Retired the superseded GT narrative checklist. Deferred DISPATCH scheduler/email work and restoration decisions remain in the canonical backlog. Current story requirements live in `docs/content-quality-plan.md` Q4 and `docs/story-style-bible.md`.

- **CB-093**, source line 1004. Status: Open as recorded / reproduce current state.

  Verify R0-R4 structural-variety closure: the copy-humanization-reaudit plan (2026-06-10) was likely absorbed by Run 7 cadence work + Run 8 endorsement, but never formally ticked off. Check `docs/audits/copy-humanization-reaudit-2026-06-10.md`; fold any survivors here.

- **CB-094**, source line 1010. Status: Open as recorded / reproduce current state.

  Bridge per-framework variants (Vue/Angular/Svelte, ~5h).

- **CB-095**, source line 1011. Status: Open as recorded / reproduce current state.

  Quiz coverage expansion past current 24% (diminishing returns).

### 5. World launch sprints (V1 = Deep Orbit only)

- **CB-096**, source line 1015. Status: Open as recorded / reproduce current state.

  Neon Protocol, Signal Ward, Nova Canvas, Terra Grid: full curriculum content per world (each its own launch sprint; scope doc: `docs/launch-scope.md`).

- **CB-097**, source line 1018. Status: Open as recorded / reproduce current state.

  Per-world GT narrative launch content (DISPATCH, boss beats, cameos) for each new world, outlined in the GT plan file.

- **CB-098**, source line 1020. Status: Open as recorded / reproduce current state.

  World-specific glossary terms for unlaunched worlds.

- **CB-099**, source line 1021. Status: Open as recorded / reproduce current state.

  Per-world Kit purchase sequences (5x `KIT_TAG_PURCHASED_{WORLD}` + 5 sequences) if per-world email marketing becomes worth it.

- **CB-100**, source line 1024. Status: Owner-gated / verify current ruling.

  **Restore /journey.** Removed 2026-08-15 (owner decision): with one live world the page rendered near-identical content to /worlds, so the catalog is the single five-worlds surface until the arc framing has two live worlds to show. Restore from commit `152f2c8`: - `apps/web/app/journey/` (page.tsx, journey-ring.tsx + test, error.tsx) and `apps/web/lib/journey-progress.ts` + its test. The shared journey model (`packages/shared/src/journey.ts`) was NOT removed; it still feeds dispatch-tease and strategy-thread. - Drop the temporary `/journey` → `/worlds` redirect in `apps/web/next.config.ts` (deliberately 307, safe to remove). - Re-add nav links (nav.tsx + mobile-nav.tsx), the sitemap entry, and the "Journey" row in the `e2e/accessibility.spec.ts` axe matrix. - Comments trimmed at removal (scene-by-slug.ts, world-cards-grid.tsx, entitlements.ts) can regain their journey-ring mentions. - Carried-over open item: the page metadata sold the finale-handoff arc but the on-page copy never did; write that pitch into the page at restore time or it converges with /worlds again. Design spec: `docs/superpowers/specs/2026-08-15-journey-ring-redesign.md`. - `journey_enrollment` stays in the schema; its `completed_at` writer lived in journey/page.tsx, so nothing records ring completion while the route is gone (harmless: the ring cannot close before all five worlds are live).

- **CB-101**, source line 1046. Status: Open as recorded / reproduce current state.

  Purchase credit survives refund/dispute: upgrade pricing sums `partially_refunded` rows, so a disputed purchase still funds the bundle discount. Unreachable with one world; live the day world #2 launches.

- **CB-102**, source line 1050. Status: Open as recorded / reproduce current state.

  neon-protocol has 54 MDX files vs the 55 that `WORLD_CONTENT.comingSoonLessonsPerWorld` promises (`image-data` has 4); add a test pinning coming-soon counts.

- **CB-103**, source line 1053. Status: Conditional proposal / verify need.

  ~~PCA/SVD deep-dive~~ shipped early 2026-07-27 as shared `extras/math-deep-dive/08-eigenvectors-svd-compression`, then removed 2026-08-15 with /extras (see §"/extras removal" below). The world-2 slice is back to real authoring: when neon-protocol's feature-extraction module launches, restore the deep-dive from commit `0b5ec6d` into that world (the DerivationDrawer companion-link feature was also removed and would need rebuilding, or inline the derivation).

### 6. Big deferred bets

- **CB-104**, source line 1063. Status: Owner-gated / verify current ruling.

  **AI video scenes**: ACTIVATED for Deep Orbit 2026-08-31 (owner). Paste-ready Flow/Veo prompts for all 63 scenes (56 lessons + 7 epilogues): `docs/video-scene-prompts-deep-orbit.md`. Integration design (`<VideoScene>` swap, captions, R2 CDN) still lives in `docs/future-ai-video-scenes.md`; its Runway/ElevenLabs generation stage and cost table are superseded. Remaining work tracked in the dated "Lesson video scenes follow-ups (2026-08-31)" section at the end of this file. Subsumes audio narration (video includes voice acting).

- **CB-105**, source line 1071. Status: Conditional proposal / verify need.

  **Audio narration fallback** (only if video stays too expensive): AI TTS, narrative steps only (Briefing + Consequence), one world first, auto-regeneration from MDX. Standalone narration was rejected for V1: interactive-first lesson model conflicts with passive audio, ~1,650 segments to maintain, re-record on every MDX edit, >40% story-skip risk.

- **CB-106**, source line 1076. Status: Open as recorded / reproduce current state.

  **Team pricing** (design from enterprise demand data).

- **CB-107**, source line 1077. Status: Open as recorded / reproduce current state.

  **Team license management** (admin dashboard, seat assignment, progress reports).

### 7. Platform + infra deferrals

- **CB-108**, source line 1082. Status: Open as recorded / reproduce current state.

  **Web performance work + restore aspirational Lighthouse budgets.** Deferred 2026-08-24. The Lighthouse CI budgets had never passed (red since at least 2026-07-25), so they were ratcheted to that night's worst measurement plus ~25% headroom to turn the job into a working regression gate: interactive 14000ms, LCP 11500ms, CLS 0.35, script 800KB, total 1150KB (`.github/lighthouse-budget.json`). Measured 2026-08-24 on the throttled CI runner (simulated slow 4G, 4x CPU): `/` TTI 11.3s, LCP 9.1s, script 624KB, total 898KB, perf score 0.44; `/pricing` CLS 0.247 (the only page with real layout shift), TTI 5.1s; `/worlds` TTI 10.9s; `/learn` TTI 4.1s, perf 0.84. Accessibility, best-practices, and SEO all sit at 0.91-1.0 already. The perf work, when it becomes worth doing: landing-page script diet (624KB is the outlier; the other pages are ~370KB), the /pricing layout shift, then walk the budgets back down toward the old aspirational values (LCP 2500, TTI 3500, CLS 0.1, script 500KB). Also removed then: the dead `assert` block in `.github/lighthouserc.json`; when the workflow passes `budgetPath`, the treosh action asserts only from the budget file, so those category minScores never fired (verified against the 2026-07-25 and 2026-08-24 run logs, both of which would have failed `categories:performance >= 0.9`).

- **CB-109**, source line 1103. Status: Partly open / reconcile inline status.

  **Drop the counterfactual debris.** Deferred from `docs/audits/launch-blockers-history-2026-08-23.md` 2026-08-23: the table is empty and harmless, and a pending migration blocks the API deploy gate, so this waits until the launch deploy is out. The feature's client was deleted in 24d45e4; `counterfactual_choices` was verified at **0 rows** in production on 2026-08-23. When you do it, in one transaction-wrapped migration:

- **CB-110**, source line 1125. Status: Open as recorded / reproduce current state.

  **Remove the two one-release API shims from migration 059.** Added 2026-08-18 so an old client could not break against the renamed columns, and deliberately scoped to a single release. Both are still deployed (Fly v18, 2026-08-20): `apps/api/src/routes/onboarding.ts` maps `fe_background` / `fe_experience_years` onto their `js_*` names when the new keys are absent, and `apps/api/src/routes/skill-events.ts` rewrites an incoming `fe_integration` axis to `js_integration`. Earliest safe removal is roughly 2026-08-27, one release after the migration landed; taking them out sooner defeats the purpose they were added for. Delete both blocks plus their tests, then redeploy the API. No migration and no web change. Filed here rather than in `docs/audits/launch-blockers-history-2026-08-23.md` because it is post-deploy cleanup, not a release gate: leaving the shims in place is harmless, only untidy.

- **CB-111**, source line 1139. Status: Partly open / reconcile inline status.

  Visual gate is blind to the entire landing hero (found 2026-08-22 while re-minting baselines after a hero subhead rewrite). Both `e2e/visual/key-pages.spec.ts` and `e2e/visual/responsive.spec.ts` mask `page.locator("canvas")`. On `/` the first match is the hero's ParticleField, which is `absolute inset-0` inside a `min-h-screen` section, so the magenta mask covers the headline, subhead, both CTAs, and the demo panel. Measured on the freshly minted `landing-1440-chromium-darwin.png`, the hero band is 100% magenta. What proves the gate cannot see hero copy: rewriting the subhead from four rendered lines down to three left 5 of the 6 landing baselines byte-identical to HEAD. Only `landing-320` moved, and only because the total page height changed. This is the same failure the responsive spec's own comment records for /pricing's AmbientBackground on 2026-08-09; the landing page was never re-checked. The mask is not simply removable: ParticleField seeds particle positions with `Math.random()` (`packages/ui/src/effects/particle-field.tsx:38-43`), so even its reduced-motion static frame differs between runs. Fix shape: hide ParticleField at capture time in `e2e/visual/screenshot.css` (that file already exists, for the dev-overlay badge) and narrow the mask to the world-card canvases, then re-mint the landing baselines.

- **CB-112**, source line 1161. Status: Owner-gated / verify current ruling.

  Privacy deferrals from the 2026-08-16 policy audit (`docs/audits/privacy-policy-audit-2026-08-16.md`; the shipped fixes are listed there too): - OWNER: /privacy §1 names "Tensorcraft" as controller with no legal identity behind it (owner removed the placeholder 2026-08-16, entity/name decision pending; GDPR Art. 13(1)(a) gap stands until a legal entity or sole-trader name plus registered address is added; JSX comment in §1 marks the spot). Also confirm the `[contact address omitted]` mailbox actually receives mail, and confirm the Supabase project region so §7 (transfers) can name it. - Encrypt `profiles.github_token` at rest (plaintext since migration 011; a DB leak leaks live GitHub tokens). - Propagate account deletion to PostHog persons via their API, and one-time-scrub existing person properties: `identify()` sent the account email until 2026-08-16, so persons created before then still carry it EU-side. (2026-10-02: the scrub half is moot. The EU project went live 2026-08-26, after the fix, and a HogQL count found 0 persons with an `email` property. Deletion propagation is still open; recordings need deleting too. See "PostHog data audit follow-ups (2026-10-03)".) - Legacy waitlist rows auto-subscribed under the pre-050 default (`subscribed = true` without an affirmative opt-in): re-consent campaign or purge; owner decision. - Certificate share pages: add `robots: noindex` (name + avatar are public to anyone with the link; policy §2 now discloses this). - `tc_world` personalization cookie is set by middleware before any consent interaction; disclosed in policy §6 as functional, revisit if counsel wants it consent-gated. - Terms lawyer pass (factual fixes shipped 2026-08-16, these need counsel): governing-law/jurisdiction clause; termination/suspension clause so §7 Acceptable Use has a consequence; statutory-rights carve-out on the §8 liability exclusion (EU/UK consumers); §5 IP claim should except vendored open-source (tfjs, Apache-2.0); cross-link the privacy policy; add an explicit terms-acceptance step for guest checkout (guest buyers currently never click through acceptance).

- **CB-113**, source line 1197. Status: Open as recorded / reproduce current state.

  Effects test-infra hardening deferred from the 2026-08-15 signal-lock review (pricing curriculum cinematic): (a) capture `globalAlpha` in the recording-canvas style snapshots; deferred because it changes the `RecordedStyles` shape and invalidates every golden style SHA (a deliberate re-goldening exercise, fresh off the arch-sensitivity canonicalization). Until then the crossfade alpha channel in `signal-lock.ts` is covered by geometry tests only. (b) Lock `RING_RADII` (signal-lock.ts) against `ORBIT_RINGS` (orbit-canvas.tsx) drift, which likely means exporting the radii or extracting a shared scene-math module for the duplicated `hash()`/`wash()` helpers while there. (c) `hexToRgb` now has eight copies across apps/web (a canonical export exists in `packages/worlds/src/wcag.ts`); consolidate as one sweep.

- **CB-114**, source line 1210. Status: Open as recorded / reproduce current state.

  Real background job queue (Upstash QStash / Fly Machines cron) for large digest backlogs; deferred until job-queue infra is chosen.

- **CB-115**, source line 1212. Status: Open as recorded / reproduce current state.

  Integration / visual-regression / perf test suites against real Supabase + Stripe prod + GitHub API (deferred to beta; `docs/visual-regression.md`).

- **CB-116**, source line 1215. Status: Open as recorded / reproduce current state.

  Exercise-runner timeout vs TFJS download: the 1.47 MB TFJS bundle downloads inside the runner's 10s timeout, so a slow-connection learner's first "Run Tests" fails as "Timed out after 10 seconds", misattributed to their own code. Preload before arming the timer, or exclude download time from it.

- **CB-117**, source line 1220. Status: Partly open / reconcile inline status.

  Test-infra debt (2026-07-21 audit structural notes): e2e `webServer` allowance is 30s against measured 19-154s cold compiles, so the a11y gate fails open and Worlds / Pricing / all six lesson steps can skip verification silently; Firefox has zero automated coverage; the two WebKit projects (iPhone SE, iPad) and the Chromium Pixel 7 run the mobile smoke suite only; no `browserslist` (floors in `docs/browser-support.md` unenforced); `metadata.test.ts` reads exported objects in isolation with zero `generateMetadata` coverage. Also fix e2e viewport truth: `mobile.spec.ts` claims iPhone SE is 375×667 but Playwright's device is 320×568, leaving 375px - the most common real iPhone width - covered by no project; `reflow.spec.ts` passes while the report panel is clipped (its own `overflowX:hidden` masks it). Register's structural close: make gates fail **closed** and test resolved behaviour at real viewports.

- **CB-118**, source line 1234. Status: Open as recorded / reproduce current state.

  CI/CD gating debt (audit §4): no branch protection or required checks - Vercel deploys on push regardless of failing tests/e2e/lint (`eslint.ignoreDuringBuilds: true`); the only real gate is bypassable husky pre-push; `pnpm audit`, `format:check`, and migration drift absent from CI; no Dependabot/Renovate config to surface the next CVE; no API deploy workflow (`fly deploy` manual, web/API version skew unmonitored).

- **CB-119**, source line 1240. Status: Open as recorded / reproduce current state.

  Security hardening, low tier (audit §1, grouped): `achievements` self-insert of any badge; 30s JWT-cache life for revoked tokens; auth-callback `allowedHosts` falls through to `origin` instead of rejecting; validate `module_id`/`exercise_slug` before the GitHub path; webhook amount mismatch logs but still grants; logger redact list misses `github_token` and only reaches depth 1; unsubscribe token in query string; `avatar_url` validation is dead code (settings writes via PostgREST; add a DB CHECK or route through the API).

- **CB-120**, source line 1248. Status: Open as recorded / reproduce current state.

  Data-integrity P2 cluster (audit §3, grouped): client-supplied `completed_at` corrupts the heatmap on skewed clocks; guest replay collapses multi-day study into one streak call; DISPATCH dedup TOCTOU (duplicate inbox message, cosmetic); `/certificates/[id]` still 404s on non-ok HTTP during outages; delete `lesson-progress.tsx` dead code (carries two live bugs); frontend bypasses `POST /api/progress` and all its validation; `cache.ts` has bare Redis calls and zero callers; stop describing `cert_hash` as verifiable (no verification endpoint).

- **CB-121**, source line 1256. Status: Open as recorded / reproduce current state.

  Migration hygiene retrofit (audit §3): 17 of 40 migrations non-idempotent, none wrapped in BEGIN/COMMIT, rollback SQL covers 3 of 40, no down-migrations. Retrofit as part of adopting real migration tooling.

- **CB-122**, source line 1260. Status: Open as recorded / reproduce current state.

  Code Hike scrollytelling (§7c, post-V0.5; Shiki shipped instead).

- **CB-123**, source line 1261. Status: Conditional proposal / verify need.

  `LossLandscape` component (atmospheric-only; revisit post-V1).

- **CB-124**, source line 1262. Status: Open as recorded / reproduce current state.

  `ActivityHeatmap` component (post-V0.5).

- **CB-125**, source line 1263. Status: Open as recorded / reproduce current state.

  Remove deprecated `<Quiz>` + `<KeyTakeaways>` MDX components once all worlds are migrated off them.

- **CB-126**, source line 1267. Status: Open as recorded / reproduce current state.

  Refund-comms email (transactional template when a refund is issued).

- **CB-127**, source line 1268. Status: Open as recorded / reproduce current state.

  News-scrape failure alerts.

- **CB-128**, source line 1269. Status: Open as recorded / reproduce current state.

  Newsletter retry queue.

- **CB-129**, source line 1270. Status: Open as recorded / reproduce current state.

  Fix post-unsubscribe re-signup being blocked by the unique constraint.

- **CB-130**, source line 1272. Status: Open as recorded / reproduce current state.

  Plausible + PostHog consolidation (both ship today; pick one once launch data shows which earns its keep).

- **CB-131**, source line 1274. Status: Open as recorded / reproduce current state.

  i18n.

- **CB-132**, source line 1275. Status: Open as recorded / reproduce current state.

  TFJS major upgrade.

- **CB-133**, source line 1276. Status: Open as recorded / reproduce current state.

  npm-publishable `@tensorcraft/bridges` (blocked by `workspace:*` dep; needs tsup/rollup `noExternal`). Re-verified 2026-08-20, and the blocker is real: `packages/bridges-public/package.json` declares `"@tensorcraft/shared": "workspace:*"` and `src/index.ts` only re-exports from it, so the built `dist/index.js` is 802 bytes of re-export with no bridge data in it. `@tensorcraft/shared` is `private: true` at version `0.0.0` and 404s on the registry, so publishing today yields a package that installs and then throws `Cannot find module '@tensorcraft/shared'` on first import. The workspace-protocol rewrite pnpm does at publish time does not help: it rewrites to `0.0.0`, which is equally unpublished. Fix is a bundling step (tsup or rollup with the shared package marked `noExternal`) so the 51 bridges are inlined and the package has zero runtime dependencies, then `npm pack --dry-run` should show a substantially larger `dist/index.js`. Also note `@tensorcraft/bridges` has never been published at all (registry 404), so this is a first release rather than a version bump, and the name is unclaimed. Version, README, and description were corrected to 51 on 2026-08-19/20 and are publish-ready; only the packaging is not.

### 8. Growth roadmap / Horizon 1: fix the economics (0-9 months)

- **CB-134**, source line 1325. Status: Open as recorded / reproduce current state.

  Launch more of the 4 built-but-gated worlds (overlaps §5 world sprints). Gate: the existing world-release requirements and demonstrated learner or buyer need. A larger target alone does not open this gate.

- **CB-135**, source line 1328. Status: Open as recorded / reproduce current state.

  Authoring scaffold `scripts/new-lesson.mjs` (no generator exists; authoring velocity is the volume bottleneck).

- **CB-136**, source line 1330. Status: Conditional proposal / verify need.

  All-access subscription (~$15-25/mo) alongside one-time: Optional. Gate: demonstrated demand for continuing learning value, a sustainable release cadence, and economics assessed against one-time sales. `subscriptions` table + persisted `stripe_customer_id`, real `entitlements` table replacing ad-hoc `purchases.world_ids` derivation, `mode:"subscription"` checkout, `customer.subscription.*` / `invoice.paid` / `invoice.payment_failed` webhooks + dunning, billing management UI. Money-touching: full TDD + Stripe test-mode e2e before any live charge.

- **CB-137**, source line 1339. Status: Open as recorded / reproduce current state.

  Subscription content cadence: decide + publish the release rhythm before selling all-access - a static catalog churns a $15-25/mo sub immediately; the cadence decision re-orders §5 world sprints (added 2026-07-22).

- **CB-138**, source line 1343. Status: Open as recorded / reproduce current state.

  Subscription grandfathering: define the migration story for existing one-time buyers (credit / discount / grandfather) before the plan page ships - getting this wrong publicly is a trust incident (added 2026-07-22).

- **CB-139**, source line 1347. Status: Open as recorded / reproduce current state.

  Re-enable guest checkout behind the full hardening list: guest-safe success page, ownership + upgrade-credit checks (email field, no inbox round-trip), guest fallback in both `async_payment_*` webhook handlers, unique index on `lower(profiles.email)`, anon (not service-role) client for the OTP send, real unmocked `guest-account.ts` tests. The UI stopped using the route on 2026-07-21 after review found 3 post-charge defects. Since 2026-09-16 the endpoint also returns 403, so direct requests cannot create guest sessions (defect record: `roadmap.md` §2 P2). Money-touching: same TDD bar as the subscription work.

- **CB-140**, source line 1356. Status: Conditional proposal / verify need.

  Re-evaluate merchant-of-record at subscription launch, or when EU / international mix makes OSS VAT filing a real operating cost: compare Paddle (5% + 50¢, B2B invoicing) and Polar (~4% + 40¢) against Stripe Managed Payments (6.4% + 30¢) - not Lemon Squeezy (maintenance mode since the 2024 Stripe acquisition). Decision + fee analysis: `docs/roadmap.md` §4.

- **CB-141**, source line 1362. Status: Open as recorded / reproduce current state.

  Growth instrumentation: activation metric, referral/virality events, cohort-LTV dashboards (current taxonomy has zero virality events).

### 8. Growth roadmap / Horizon 2: build reach (9-24 months)

- **CB-142**, source line 1372. Status: Conditional proposal / verify need.

  Viral competition arena (FREE, monetize via funnel, not arena paywall): public no-auth weekly challenge, `challenges` / `arena_submissions` / `leaderboard` tables, ranking service, arena result cards, referral loop, public profiles. Optional. Gate: evidence that learners want shared challenges and that the proposed experience supports learning or qualified acquisition. Compare a small prototype with simpler distribution work before building the arena. **Write-model bone LAID (2026-07-24, migration 048):** `arena_submissions` exists, **service-role-write-only** (self-read RLS, no client write policy), so scores cannot be forged. **Correction (scalability re-audit 2026-07-24):** it is NOT true that "scoring infra already exists" - today's grading is CLIENT-authoritative and forgeable, and the cert stack proves payment not skill. The real remaining bones + the exact design are in `docs/arena-scoring-contract.md`: server-authoritative re-scoring against a hidden hold-out (A-F1), a hardened sandbox for the exec path (A-F2, do NOT reuse `WORKER_BODY_STRING`), an RNG-seeding/determinism convention (A-F3), plus the public top-N leaderboard `SECURITY DEFINER` RPC. Ships WITH: moderation + report flow + anti-cheat + ToS update - public no-auth UGC (usernames, code, leaderboards) griefs on day one without them; also update `product-plan.md`'s stale $29/yr arena pricing (free arena decided in roadmap) when this starts (added 2026-07-22).

- **CB-143**, source line 1393. Status: Open as recorded / reproduce current state.

  Rebuild the public `/bridges` catalog (51-bridge dataset lives in `packages/shared/src/bridges.ts`, rendered nowhere public since the 2026-05-05 revert).

- **CB-144**, source line 1396. Status: Foundation implemented locally on 2026-11-10 / deployment and measurement pending.

  The 2026-11-10 SEO work removed the core/full switch because paid lessons redirect signed-out visitors to pricing. The sitemap now selects public pages and free lessons, with real editorial dates only where recorded. Added a public worked guide and generated source summary. The compiled blog currently has zero posts. Expand public explanations using verified examples and query evidence. See [the SEO and GEO plan](docs/seo-geo-plan.md) for release checks, the live HTTP baseline, and measurement. The earlier instruction to flip the sitemap and scale from a single post is superseded.

### 8. Growth roadmap / Horizon 3: enterprise seats (optional; legacy 24-48-month planning label)

- **CB-145**, source line 1409. Status: Open as recorded / reproduce current state.

  Orgs + members + invitations; org-scoped roles (`billing_owner | manager | learner`) replacing flat `user | admin`.

- **CB-146**, source line 1411. Status: Open as recorded / reproduce current state.

  Seat-quantity Stripe billing with proration.

- **CB-147**, source line 1412. Status: Open as recorded / reproduce current state.

  Team progress dashboard.

- **CB-148**, source line 1413. Status: Open as recorded / reproduce current state.

  SSO/SCIM + procurement table stakes (SOC2, invoicing, DPA).

### 9. Scale debt (before ~10k users)

- **CB-149**, source line 1438. Status: Open as recorded / reproduce current state.

  Six `auth.getUser()` round-trips per authenticated page view; no `React.cache()` anywhere in the repo.

- **CB-150**, source line 1440. Status: Open as recorded / reproduce current state.

  All 22 RLS policies use unwrapped `auth.uid()` (Supabase's documented #1 RLS performance anti-pattern; wrap as `(select auth.uid())`).

- **CB-151**, source line 1442. Status: Open as recorded / reproduce current state.

  Missing `(user_id, attempted_at DESC)` index on `exercise_attempts`; re-add the `skill_axis` index silently dropped in the `013` partition swap.

- **CB-152**, source line 1445. Status: Open as recorded / reproduce current state.

  Landing ships ~249 kB gzipped of TFJS eagerly.

- **CB-153**, source line 1446. Status: Open as recorded / reproduce current state.

  Co-locate API + DB: Fly runs `iad`, Supabase `eu-west-1` (contrary to `infrastructure.md`); every API→DB query crosses the Atlantic.

- **CB-154**, source line 1448. Status: Open as recorded / reproduce current state.

  Health check gates Fly liveness on a DB query, so a Supabase blip kills the whole API fleet; separate readiness from liveness / fail open (its `count: exact` is also a permanent ~20 seq scans/min on profiles).

- **CB-155**, source line 1451. Status: Open as recorded / reproduce current state.

  Lesson route is SSR, not SSG: `cookies()` opts every lesson view out of static generation (0 of 56 prerendered; the "edge cache" comment in `page.tsx:28-32` is false), so each view pays full SSR + auth round-trips. Audit calls it the largest single infra item at 5-10k users.

- **CB-156**, source line 1456. Status: Open as recorded / reproduce current state.

  `exercise_attempts` unbounded: 100KB `submitted_code`, no dedup, no retention policy; ~6MB/min achievable per user. Add retention + size caps.

### Moved out of launch-blockers (2026-08-23) / Tier 1-OPS - Operator + distribution setup, do before flipping live

- **CB-157**, source line 1582. Status: Operator verification / dashboard action.

  (OPERATOR) **Verify the 059 rename end to end with a signed-in session.** Migration 059 was applied 2026-08-20 and the API redeployed (Fly v18) the same day, but the two behaviors it touched have only been checked at the infrastructure layer (ledger IN SYNC 59/59, `/api/health/ready` reports `db: ok`, CI green). Neither has been exercised as a user, because both need an authenticated session: (1) complete an onboarding and confirm the JavaScript-background and years-of-experience answers persist, which is what the deployed-old-API window was silently discarding; (2) download a GDPR export from settings and confirm it returns `js_background` and `js_experience_years`, the endpoint that would have 500'd between the migration and the API deploy. Also worth one query while signed into Supabase: profiles with `onboarding_completed = true` and a null `js_background` created between 2026-08-18 and 2026-08-20 are learners whose answers the old API dropped. Expected to be zero or near-zero at current traffic.

- **CB-158**, source line 1597. Status: Historical setup / verify later completion.

  Verify current PostHog event setup against the checklist. Project creation is historical and superseded by the later live PostHog audit; preserve only current configuration/verification gaps.

- **CB-159**, source line 1607. Status: Operator verification / dashboard action.

  (OPERATOR) **Success-metrics dashboard + alerts** in PostHog: lesson completion (target ≥60%), paid conversion (3%), NPS (≥40), 7-day retention (≥30%), 30-day retention (≥15%), avg time per lesson, hint dependency, paywall conversion. At minimum, payment-failure alerting live before real money flows.

- **CB-160**, source line 1612. Status: Operator verification / dashboard action.

  (OPERATOR) **Kit (ConvertKit) lifecycle setup.** Code side is complete and verified 2026-08-20: the client (`apps/api/src/lib/kit.ts`), every tag lookup (`apps/api/src/routes/email-tags.ts:8-19`, `preferences.ts:98,109`, `payments.ts:873,1196`), the fail-closed bounce webhook (`webhooks.ts:50-54`, rejects everything while `KIT_WEBHOOK_SECRET` is unset, and that var is in the API's `PROD_REQUIRED` list so production refuses to boot without it), and all names documented in `apps/api/.env.example:47-72`. Everything below is dashboard and secret work. Manually create the Form + the seven lifecycle Tags in the Kit dashboard (`signed_up`, `onboarded`, `first_lesson`, `capstone`, `purchased`, `email_alerts`, `weekly_digest`), then set `KIT_FORM_ID` + `KIT_TAG_SIGNED_UP` / `KIT_TAG_ONBOARDED` / `KIT_TAG_FIRST_LESSON` / `KIT_TAG_CAPSTONE` / `KIT_TAG_PURCHASED` / `KIT_TAG_EMAIL_ALERTS` / `KIT_TAG_WEEKLY_DIGEST` env vars (numeric tag IDs). **API keys are NOT usable, see the entry directly below.** Also set `KIT_WEBHOOK_SECRET` and register the bounce webhook per `docs/email-setup.md` §3, plus `KIT_TAG_PAYWALL_HIT` / `KIT_TAG_MODULE_1_COMPLETE` (R2-7 made missing-tag skips recoverable, but sequences cannot fire on tags that do not exist). Purchase is a single world-agnostic tag in V1 (per-world sequences: `post-launch-backlog.md` §5). Without this, purchases succeed but subscribers are never tagged and no lifecycle email fires - including ~~the purchase receipt flagged in R2-4~~ (**no longer true as of 2026-08-23**: the receipt is sent over Resend and does not depend on Kit, see Tier 1-LEGAL. What is still lost while Kit is unconfigured is lifecycle tagging and every sequence that keys off it). Templates must follow `docs/email-templates.md`.

- **CB-161**, source line 1638. Status: Operator verification / dashboard action.

  (OPERATOR) **Kit credentials fail auth, and the client may target a retired API base. BLOCKS both Kit entries above.** Found 2026-08-20 by probing the live API with the stored credentials, not by reading config. Three findings, each verified: 1. **Both stored keys 401.** `KIT_API_KEY` and `KIT_API_SECRET` from `apps/api/.env` were tried against Kit v4 (`GET https://api.kit.com/v4/tags`, header `X-Kit-Api-Key`): both return `401 {"errors":["The API key is invalid"]}`. The v3 secret endpoint (`GET /v3/account?api_secret=...`) returns `401 {"error":"Authorization Failed"}`. 2. **The client points at a base URL that now redirects.** `apps/api/src/lib/kit.ts:6` hardcodes `https://api.convertkit.com/v3`. `GET /v3/tags?api_key=...` answers `302`. ConvertKit rebranded to Kit and moved to `api.kit.com/v4`, so the version question has to be settled, not just the credential. 3. **No tag IDs exist in production.** `flyctl secrets list -a tensorcraft-api` shows exactly one Kit variable deployed, `KIT_WEBHOOK_SECRET`. None of the nine `KIT_TAG_*` vars the code reads are set on the host. Combined effect, and why this is a launch blocker rather than a chore: `/api/email` answers `{ ok: true, skipped: true }` when a tag var is unset (R2-7), so every lifecycle tag call has been succeeding loudly and doing nothing. The failure is invisible from logs, dashboards, and the app. Purchases, onboarding, first lesson and capstone all currently tag nobody. **Narrowed 2026-08-23:** the purchase RECEIPT no longer depends on this. It was rebuilt on Resend precisely because these credentials are dead, so a buyer now gets the legally expected artifact even with Kit dark. What remains lost here is lifecycle tagging and the retention sequences keyed to it, which is a marketing outage rather than a compliance one. Order of work: regenerate a key in the Kit dashboard; decide v3 versus a port to v4 (`kit.ts` is the only caller); set the key plus the nine `KIT_TAG_*` IDs as Fly secrets; then re-verify with a real tag call before trusting either entry above. Do NOT mark those done on dashboard state alone: this entry existed as "API keys already configured" and was wrong.

- **CB-162**, source line 1674. Status: Operator verification / dashboard action.

  (OPERATOR) **Kit retention automations** A/B/C per `docs/email-retention-sequences.md`. Copy drafted, code side live; dashboard work only. The sequences target exactly the launch cohort (signed up / stalled / finished free tier). Blocked by the credential entry above: an automation cannot fire on a tag that is never applied.

- **CB-163**, source line 1679. Status: Historical setup / verify later completion.

  Verify current Sentry alert coverage and preserve remaining alert gaps. Treat the old create-alert-rules task as historical until checked against later production alert-delivery evidence.

- **CB-164**, source line 1684. Status: Operator verification / dashboard action.

  (OPERATOR) **Plausible:** add site `tensorcraft.app`, set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` in Vercel. ~EUR 9/mo. The script component (`apps/web/app/components/plausible-script.tsx:8`) is already conditional on the var. Note `apps/web/.env.example:26` carries a template default, which is NOT evidence the Vercel env is set.

- **CB-165**, source line 1697. Status: Operator verification / dashboard action.

  (OPERATOR) **Product Hunt "upcoming" page** - follower capture only works pre-launch.

- **CB-166**, source line 1699. Status: Operator verification / dashboard action.

  (OPERATOR) **Twitter/X account @tensorcraft** - reserve the handle before announcing there. Follow `docs/marketing-first-1000-paid.md` for the current distribution plan and posting priorities.

- **CB-167**, source line 1708. Status: Partly open / reconcile inline status.

  **Distribution head start:** write + publish the first blog batch and begin the audience track. `roadmap.md` §7: longest lead time in the plan, runs in parallel, starts before the code is ready. Verified 2026-08-20: infrastructure is DONE and content is ZERO. `packages/content/content/blog/` holds only `.gitkeep`, while the whole render path is built and waiting (`apps/web/app/blog/page.tsx` branches on `posts.length === 0`, `blog/[slug]/page.tsx` and `blog/rss.xml/route.ts` both exist). This is a writing task, not an engineering one.

- **CB-168**, source line 1728. Status: Operator verification / dashboard action.

  (OPERATOR) **Settle whether the 046 Custom Access Token hook is enabled.** Split out 2026-08-20 from the entry above, which is where the contradiction lives: that entry says the hook was enabled in the Supabase dashboard on 2026-07-25, while the struck entry further down still lists enabling it as an open step. Neither the repo nor the database can settle it, because it is Supabase Auth configuration rather than schema, and it is the only sub-claim in the ops-deploy entry left unproven. Check Authentication, Hooks in the Supabase dashboard, then correct whichever entry is wrong. Consequence if it is off: middleware falls back safely, so this is a correctness-of-record question, not an outage risk.

- **CB-170**, source line 1782. Status: Owner-gated / verify current ruling.

  (OPERATOR) **Make Vercel installs honor the lockfile.** Moved here 2026-08-20 from the "VERCEL BUILD FAILURE (2026-08-14)" section, where it was the only live item under a heading that reads as resolved. Set the install command to `pnpm install --frozen-lockfile`; until then every deploy re-resolves caret ranges and can compile against dependencies CI never tested, which is exactly what broke the 2026-08-14 build. The code half is done (`apps/web/app/admin/digest/actions.ts` types its update payload as `NewsItemUpdate`, which compiles under both supabase-js versions). Worth considering instead: there is no `vercel.json` in the repo, so this setting lives only in the dashboard and can drift silently. Committing a `vercel.json` with `installCommand` would put it under version control. Not done here because a wrong value breaks every deploy; owner call. (2026-09-19: `apps/web/vercel.json` now exists and is the file such a setting would go in; the project reads config from its Root Directory.)

- **CB-171**, source line 1852. Status: Operator verification / dashboard action.

  (OPERATOR) **Env-var hygiene: three settings remain, all outside the repo.** Verified 2026-08-20: every code and doc sub-item below is genuinely done (`apps/api/src/env.ts` three tiers boot-called at `index.ts:123`; `apps/web/lib/env.ts` mirrored through `instrumentation.ts`, unit-tested). What is left: (1) `SENTRY_AUTH_TOKEN` in Vercel, absent means minified production stack traces; (2) `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in the Vercel **production** environment, which is a hard launch gate now that the boot assertion refuses to start production without them; (3) `APP_URL` on Fly; (4) **added 2026-08-23: `API_URL` and `ADMIN_API_KEY` in the Vercel server environment**, which the email-link unsubscribe relay needs in order to tell Kit about an opt-out. `API_URL` must NOT be `NEXT_PUBLIC_`, since it is paired with a secret, and `ADMIN_API_KEY` must match the API's value exactly or the relay is rejected 401. Both are documented in `apps/web/.env.example`. Unset is safe but inert: the local opt-out still applies and Kit is simply not told. Historical detail follows. (audit §4; doc side CLOSED 2026-07-25 - remaining work is the startup assertion + operator settings): ~~document `STRIPE_TAX_ENABLED`~~ (now in `.env.example` + deployment-guide, with prerequisites); ~~remove dead GitHub App vars~~ (gone from `.env.example`, deployment-guide, pre-launch-checklist); ~~fix Upstash docs~~ (all three docs now state the silent-degradation truth); ~~CERT_SIGNING_SECRET in deployment-guide~~ (added); ~~CORS_ALLOWED_ORIGINS straggler~~ (fixed); ~~KIT_TAG_PAYWALL_HIT / MODULE_1_COMPLETE in .env.example~~ (added); ~~rate-limit 60-vs-120 doc split~~ (all docs now say 60, the code truth). ~~STILL OPEN: add a startup env assertion (`env.ts`/zod)~~ **Code side DONE 2026-08-11:** API had `apps/api/src/env.ts` since the R3 wave (three tiers, boot-called, deploy-preflight diffs its exported lists); web now mirrors it in `apps/web/lib/env.ts` wired through `instrumentation.ts` (nodejs runtime, skips the build phase, keys the prod tier off `VERCEL_ENV` so previews stay bootable; unit-tested). REMAINING (operator): set `SENTRY_AUTH_TOKEN` (absent → production stack traces minified), `SUPABASE_URL` + service key on **Vercel** (RFC 8058 one-click unsubscribe throws unset - Gmail/Yahoo bulk rules; the boot assertion now refuses to start production without them), and `APP_URL` on Fly (guest email falls back to the production domain rather than a broken link, but the explicit var is still correct).

- **CB-172**, source line 1888. Status: Operator verification / dashboard action.

  (OPERATOR) **Upstash plan check.** This entry's arithmetic is stale: it assumed 5-6 Redis commands per API request. The 2026-08-17 limiter rewrite cut that to 2 commands per request (fixed window via `@upstash/ratelimit`, blocked subjects served from an ephemeral cache), and `/api/health` is now exempt from the limiter entirely, which was the probe traffic that consumed most of the quota. Free tier headroom is therefore roughly 250k requests/month, not 1,700/day, and the owner has deferred payment until traffic justifies it. Re-check the console before a launch spike rather than treating this as a hard blocker. Code fails closed in production: `apps/api/src/env.ts:42-43` puts both Upstash vars in `PROD_REQUIRED`.

- **CB-173**, source line 1899. Status: Operator verification / dashboard action.

  (OPERATOR) **Email domain warmup + Postmaster.** Doc conflict found 2026-08-20 and still unresolved: this entry says register Postmaster Tools pre-launch, while `docs/email-setup.md:153` defers it ("worth doing post-V1 once volume > 5k/day"). Pick one and make both docs agree. No warmup schedule exists anywhere in the repo. DNS auth is in place with DMARC at `p=none` (`docs/dns-records.md:31`). §10b plans a launch-week blast to 500 waitlist users from a domain that has never bulk-sent - cold domain + burst = spam folder at the worst moment. Ramp sends gradually over the preceding weeks; register Google Postmaster Tools (added 2026-07-22).

- **CB-174**, source line 1910. Status: Operator verification / dashboard action.

  (OPERATOR) **Cloud-cost alerts.** Configure billing/usage alerts on Vercel (bandwidth), Supabase (egress/compute), Fly, PostHog (1M-event overage), Upstash. One viral spike currently produces a surprise bill with zero warning (added 2026-07-22).

- **CB-175**, source line 1958. Status: Historical setup / verify later completion.

  Maintain backup and managed restore evidence. Reconcile this historical verification item against later completed restore records before planning another initial setup.

### Moved out of launch-blockers (2026-08-23) / Tier 1-LEGAL - advisor + compliance actions before selling in the EU/UK

- **CB-176**, source line 2089. Status: Owner-gated / verify current ruling.

  Reconcile operational follow-through after the owner opened EU/UK purchases, including retired geo-backstop alert handling and region-blocked waitlist promises. Apply the later owner deferral of registration/tax work; do not treat old urgency as a new instruction.

- **CB-177**, source line 2108. Status: Owner-gated / verify current ruling.

  Advisor follow-through only, under the existing owner decision that checkout geography stays open. Market scope is already decided.

- **CB-179**, source line 2138. Status: Operator verification / dashboard action.

  (OPERATOR) **Tax handling: code is written but switched OFF.** Verified 2026-08-20. `taxSessionParams()` (`apps/api/src/routes/payments.ts:47-53`) wires `automatic_tax`, `tax_id_collection` and `invoice_creation` (`billing_address_collection` was hoisted OUT of that helper on 2026-08-23 so the buyer's country is captured whether or not the tax flag is on), and is spread into both checkout sessions (`:282`, `:426`). But it returns `{}` unless `STRIPE_TAX_ENABLED === "true"` (`:48`), and that var ships empty (`apps/api/.env.example:17`). **At repo defaults, zero tax is collected**, so the R2-4 exposure is live even though the code exists. **Rescoped 2026-08-23 by the launch-before-LLC decision.** With EU/UK checkout geo-gated, EU VAT and OSS drop out of the launch path entirely, so this entry is no longer blocked on OSS registration. **But US-only is not tax-free, and that is the trap in this rescope.** Digital-goods taxability varies by state, and home-state nexus applies from the first sale with no threshold to hide behind, so whether tax is owed depends on which state the owner sells from. Confirm that with the US advisor before assuming the flag can stay off. If the home state taxes digital products, the sequence is unchanged in shape: Stripe dashboard Tax setup, then register in that one state, then set `STRIPE_TAX_ENABLED=true` and redeploy. The 0.5% Stripe Tax fee on a single-state registration is the cheap version of this problem. Original remaining work, for when EU/UK opens at the gate: Stripe-dashboard Tax setup, OSS registration, then set `STRIPE_TAX_ENABLED=true` and redeploy. **Migration 047 is confirmed applied** (2026-08-20, ledger IN SYNC 59/59), so one hazard is formally retired: R3-2 warned that deploying the current `payments.ts` before 047 would 500 every `checkout.session.completed` upsert and leave customers charged with no access. The tax columns exist in production, so flipping the flag is now a dashboard and redeploy step with no ordering trap in front of it.

- **CB-180**, source line 2173. Status: Operator verification / dashboard action.

  (OPERATOR) **Form the US LLC. GATED: at 500 users with proven market need, per the owner decision of 2026-08-23, NOT before launch.** Added as its own entry because the decision and the formation are different things and only the first is done. What downstream work needs from it: the registered legal name, a registered agent or virtual business address that is safe to publish, an EIN, a business bank account, and the Stripe account moved to or opened under the entity. Until it exists, five entries below cannot close, and any sale made in the meantime is made by an individual, with the disclosure consequences described in the decision note above. When the gate opens, revisit merchant-of-record at the same time: the two decisions interact (see item 4 of the decision note).

- **CB-182**, source line 2246. Status: Operator verification / dashboard action.

  (OPERATOR) **Get a virtual business address or PO box.** New 2026-08-23. Independent of LLC formation and unblocks the CAN-SPAM postal-address entry below for the digest that is already sending. A USPS PO box or a commercial mail-receiving agency address is acceptable for CAN-SPAM. This is also the address that goes on `/terms` and `/privacy` under the trading name, which is what keeps a home address off the site.

- **CB-183**, source line 2252. Status: Partly open / reconcile inline status.

  **Legal entity + address still open; JURISDICTION DONE 2026-08-23.** Terms now carries a governing-law section (§11): Delaware law, Delaware courts, with an explicit carve-out stating it does not remove the mandatory protections of EU and UK consumer law, which a choice-of-law clause cannot waive. Covered by `e2e/legal.spec.ts`. Still open and blocked on the LLC and the mailbox: the published entity name and the postal address. The accepted-risk note above already settles what goes in the meantime (trading name, no natural person named). Original text follows. Re-verified 2026-08-20 and still fully open. `apps/web/app/terms/page.tsx` has no entity, no address and no governing-law section anywhere in its ten sections; `apps/web/app/privacy/page.tsx:55-59` carries an explicit code comment marking the GDPR Art. 13(1)(a) hole and names only bare "Tensorcraft". This is the blocking decision described above.

- **CB-184**, source line 2266. Status: Partly open / reconcile inline status.

  **Send a real receipt/invoice on purchase. RECEIPT BUILT 2026-08-23, needs deploying; the invoice half is still open.** Built on **Resend, deliberately not Kit**: Kit's credentials 401 (see Tier 1-OPS), and a receipt is the legally expected artifact of a payment, so it must not sit behind an integration that is currently dark. Resend was already wired and sending (digest, issue notifications). `sendPurchaseReceipt` (`apps/api/src/lib/email.ts`) inspects Resend's `{data, error}` result rather than assuming a throw (the F1 lesson), bounds its own wait so a hung mailer cannot hold the Stripe webhook past its timeout, and never throws. Wired into BOTH settle paths inside the existing dedupe guard, so it inherits the two-layer dedupe instead of inventing a third: the sync path and `async_payment_succeeded`, the latter being where delayed methods (SEPA, bank debit) settle. 10 tests. **Two defects found while building it, both fixed:** the buyer's email was looked up INSIDE the Kit try block, so a Kit failure (the current state) would have skipped the receipt too; and the webhook 500'd when the receipt rejected, turning a successful payment into a Stripe retry. The lookup is now shared and each sender has its own failure domain, and the call site is guarded independently of the helper's contract. **Also worth knowing:** `async_payment_succeeded` had NO test coverage at all before this, and the admin-client `profiles` mock returned a bare null, which had made both the receipt and the pre-existing Kit tag unreachable in tests. Both fixed. **Remaining:** deploy the API, and decide the invoice half, which is unreachable while `STRIPE_TAX_ENABLED` is unset. Original text follows. Verified 2026-08-20: still fully open. The only purchase-time email action is a Kit tag (`apps/api/src/routes/payments.ts:873-875` and the async duplicate at `:1196-1198`); no receipt email template exists anywhere (`apps/api/src/lib/email.ts` sends issue notifications only). The on-screen receipt at `apps/web/app/dashboard/purchase-success/page.tsx` is not an email. Two independent halves: the Kit receipt automation (dashboard, Tier 1-OPS) and the Stripe invoice half, which is unreachable while `STRIPE_TAX_ENABLED` is unset.

- **CB-185**, source line 2299. Status: Operator verification / dashboard action.

  (OPERATOR) **Postal address: PLUMBING BUILT AND FAIL-CLOSED 2026-08-23, waiting only on the address itself.** The owner deferred acquiring one. That is safe because the digest has NO scheduled trigger: the weekly cron only scrapes news for curation, and a human sends from /admin/digest, so nothing has gone out without an address. Rather than leave a trap for whoever clicks send first, `sendDigestNewsletter` now **refuses to send** when `NEWSLETTER_POSTAL_ADDRESS` is unset, returning `blockedReason: "missing_postal_address"`. Dry runs still work, since they mail nobody. When set, the value renders in both the plaintext and HTML footers. 3 tests. **This cannot affect selling**: the guard lives in the digest sender only. The purchase receipt is a separate function and is transactional, so CAN-SPAM's address requirement does not apply to it. **To close:** a PO box or virtual mailbox (neither needs the LLC, and neither exposes a home address), then set the env var. Original text follows. Verified 2026-08-20: the plaintext footer is one unsubscribe line (`apps/api/src/lib/newsletter.ts:119`) and the HTML footer is read-on-web plus unsubscribe (`:167-171`). No postal-address constant or env var exists anywhere in the repo to inject. **Unblocked 2026-08-23:** this no longer waits on the entity. It waits only on the virtual mailbox entry above, since CAN-SPAM accepts a PO box or a commercial mail-receiving agency address and does not require a registered company. Once the address exists this is a small repo change: add the constant plus an env var, inject into both the plaintext and HTML footers, and cover it with a test. The digest is already sending, so this is live non-compliance today rather than a pre-launch task.

- **CB-186**, source line 2371. Status: Owner-gated / verify current ruling.

  **Privacy-page Art. 13 gaps: 4 of 6 closed by the 2026-08-16 rewrite, 3 still open.** Re-verified line by line 2026-08-20. CLOSED: lawful basis per purpose (§3), international transfers with DPF/SCC safeguards (§7), complaint right (§10). **Waitlist retention CLOSED 2026-08-23** (owner approved the default): §9 now states waitlist and newsletter emails are kept until unsubscribe or 24 months without engagement, whichever comes first. STILL OPEN: controller identity (no longer an open question as of 2026-08-23, just gated on LLC formation: the controller is the LLC); **Art. 27 EU/UK representative**, which the policy does not mention at all and which US establishment turns from a question into a requirement, in both the EU and the UK, unless the narrow Art. 27(2) exemption is confirmed to apply (do not assume it does, and note the geo-gate option above avoids both appointments); and **waitlist retention**, which §2 collects but §9 never gives a period for. Also open and narrower than the original wording: §7 names US-processing providers generically but does not name Supabase, so "EU personal data on US-hosted Supabase" is only addressed in the abstract. Confirm the Supabase project region and name it.

- **CB-187**, source line 2390. Status: Partly open / reconcile inline status.

  **Sub-processor list + DPAs: the list is done, no DPA is signed.** Re-verified 2026-08-20. The list half is CLOSED: /privacy §5 now enumerates twelve processors including Resend (correctly described as the digest sender) and Vercel. The DPA half is untouched: all six boxes in the "DPA execution checklist" at `docs/privacy-compliance.md:87-101` are unchecked, the processor table marks "DPA required: Yes" for all ten, and no executed-DPA artifact exists in the repo. One checklist line there ("Add PostHog + Sentry to the privacy Sub-processors section") is in fact already done and can be ticked now.

- **CB-188**, source line 2399. Status: Operator verification / dashboard action.

  (OPERATOR) **Confirm (don't assume) the EAA microenterprise exemption** with the advisor - the accessibility-statement obligation has applied to e-commerce since 2025-06-28. Verified 2026-08-20: no accessibility statement page or route exists. Note the exemption turns on headcount and turnover of a legal entity that does not exist yet, and that the repo's a11y coverage is desktop-chromium only, so a conformance claim is not currently evidenced.

- **CB-189**, source line 2416. Status: Partly open / reconcile inline status.

  **Privacy-page data-inventory update (R3-8): mostly closed, one real gap left.** Re-verified 2026-08-20. DONE: billing country + VAT id are disclosed (§2); arena `submitted_code` is disclosed and covered by the §9 learning-data rule; the "30-day removal" versus ten-year VAT retention conflict is resolved in copy (§9 carries the carve-out) and genuinely implemented in code (`apps/api/src/routes/profiles.ts:346-349` with migration 056's `on delete set null`). ~~STILL OPEN: `stripe_customer_id` is stored and returned in the data export but disclosed nowhere~~ **CLOSED 2026-08-23:** /privacy §2 now discloses "the customer reference Stripe assigns you", described in plain terms rather than by column name. Separately, the ten-year figure is currently an assertion in shipped copy with no jurisdiction behind it; the advisor should confirm it for the eventual establishment country.

### Moved out of launch-blockers (2026-08-23) / Tier 2 - Fix in week 1, before spending real money on ads

- **CB-191**, source line 2458. Status: Owner-gated / verify current ruling.

  **Indexability: the CLOAKING half is FIXED 2026-08-23, the word-count half is a design question.** **Fixed:** the lesson body shipped at `opacity: 0` and `display: none` because the scene rules hide content while `[data-script-state="playing"]` and first-visit SSR ships in exactly that state, so a client that never runs JS never saw it revealed. `NoscriptReveal` now emits a `<noscript>` override in the initial HTML. 4 tests, run through the SERVER renderer on purpose: React drops `<noscript>` children on a client render, so a normal RTL test would have passed against an empty element and proved nothing. **Not fixed, and deliberately not faked:** only the current step is in the DOM, so the page carries roughly 100 words even after JS runs. The obvious workarounds are worse than the problem. Server-rendering all six steps hidden with `display: none` gets them discounted anyway, and a crawler-only text block is cloaking, which is the thing we just fixed. The real fix is a rendering decision about whether free-module lessons present their full prose, and it wants an owner call rather than a patch. Original finding: **Lessons ship ~100 indexable words** (only the current step is in the DOM) and require JS to render at all, with no `<noscript>`. Re-verified 2026-08-20: zero `noscript` anywhere in `apps/web`, and exactly one of six steps renders because `currentStep` is client state. Large organic-acquisition loss for a content-led product.

- **CB-192**, source line 2464. Status: Open as recorded / reproduce current state.

  **Load test before ad spend** (gap found 2026-07-22 - no audit dimension covered it): nobody has ever pushed the payment path, the SSR lesson route, or the Stripe webhook handler under concurrency. Gates 2/3 explicitly precede buying traffic; measure before spending.

- **CB-193**, source line 2478. Status: Operator verification / dashboard action.

  (OPERATOR) **Uptime monitoring + status page.** Re-verified 2026-08-20, and this is the single most consequential gap in this tier: it is the failure mode that let the API certificate expire unnoticed for weeks in July, killing every browser-to-API call. What exists: `/api/health` (liveness, static JSON) and `/api/health/ready` (readiness, real DB check, 503 on failure), correctly split at `apps/api/src/routes/health.ts`. What does NOT exist: any external observer. Both current probes are self-probes from inside the host (`apps/api/fly.toml` `[checks.health]` every 10s, and a Dockerfile `HEALTHCHECK` hitting localhost), which is exactly the case that cannot report down-and-silent. No workflow pings a URL on a schedule, and no status page route exists. Cheap to close: `/api/health` is already exempt from rate limiting (`apps/api/src/middleware/rate-limit.ts:95`), so an external monitor can poll it freely. Point one at the web root, at `https://api.tensorcraft.app/api/health/ready`, and at the Stripe webhook path. Sentry alert rules (Tier 1-OPS) cover errors, not silence.

- **CB-194**, source line 2495. Status: Partly open / completed subparts excluded.

  Reproduce remaining rendered overlay-contrast checks and identify any genuinely unresolved toggle selector. Preserve the two explicitly closed live-region/border fixes and disabled-control exemption.

- **CB-195**, source line 2500. Status: Partly open / completed subparts excluded.

  Reproduce anonymous rate-limit identity/origin bypass, scope nonce-based script CSP, and assess waitlist route limits/captcha. Preserve already-fixed GitHub token binding and verified child-partition RLS.

- **CB-196**, source line 2507. Status: Operator verification / dashboard action.

  (OPERATOR) **Unsubscribe propagation: BOTH DIRECTIONS BUILT 2026-08-23. Needs two Vercel env vars to take effect.** **Outbound (we tell Kit) is built via option 1**, the owner's choice: the web handlers flip `waitlist.subscribed` as before, then relay the address to a new `POST /api/email/unsubscribe` on the API, which owns the Kit client. The relay is strictly best effort and runs AFTER the flip, so it can never turn a successful unsubscribe into the non-2xx that mail providers retry, and it no-ops quietly when unconfigured. The endpoint is guarded by `ADMIN_API_KEY` (the check was extracted to `apps/api/src/lib/admin-auth.ts` and is now shared with the admin routes rather than duplicated) and answers identically whether or not Kit knows the address, so it cannot be used to enumerate subscribers. 13 tests. **OPERATOR STEP: set `API_URL` and `ADMIN_API_KEY` in the Vercel server environment** (documented in `apps/web/.env.example`). Until then the relay is inert and Kit is simply not told, which is the same position as before, not a regression. Note the signed-in Settings toggle never needed this: it already reconciles Kit tags through `routes/preferences.ts`. Original entry follows. **Inbound (Kit tells us) is fixed.** The `/api/webhooks/kit-bounce` handler used to only log. It now suppresses locally on unsubscribe, complaint, bounce or cancelled: `waitlist.subscribed` to false and `profiles.weekly_digest` / `email_alerts` to false, matched with `ilike` because Kit echoes the subscriber's own casing and a casing mismatch between these two tables has bitten this project before. Writes are best effort and never 500, since a retry carries no new information and Kit would hammer a database that is not answering. Event matching is deliberately loose: over-matching costs someone a newsletter they can resubscribe to, under-matching means mailing someone who reported us as spam. 6 tests. **Outbound (we tell Kit) is NOT a code gap, it is a routing choice.** The signed-in settings toggle already reconciles Kit tags correctly in `apps/api/src/routes/preferences.ts`. What does not reach Kit is the EMAIL-LINK unsubscribe, and both handlers for it live in `apps/web` (`unsubscribe/one-click/route.ts` and `unsubscribe/page.tsx`) while the Kit client and its secrets live in `apps/api`. Three ways to close it, none free: 1. Web calls a new internal API endpoint, best effort after the DB flip. Needs `API_URL` + `ADMIN_API_KEY` on Vercel. Keeps RFC 8058 reliability intact because the DB flip still happens first. 2. Web calls Kit directly. Needs `KIT_API_SECRET` on Vercel and duplicates the Kit base URL, which is exactly the drift that produced the waitlist constraint bug. 3. Move the unsubscribe endpoint into the API, where the mailer already lives. Architecturally cleanest, but it changes the `List-Unsubscribe` target on a Gmail and Yahoo compliance path, so it wants its own deliberate change window. Recommendation: option 1. Original finding follows. **CLOSED 2026-09-15, both directions verified in code and by test.** This entry had gone stale twice over; re-reading it nearly cost another rebuild of work that already exists. - Outbound: `apps/api/src/routes/email-tags.ts:111` calls `unsubscribeFromAll(email)` inside a try/catch that logs and still returns ok, on the reasoning that the caller has already flipped the database so a Kit outage must not read as a failed unsubscribe. - Inbound: the kit-bounce handler no longer only logs. On a suppression event it writes `waitlist.subscribed = false` and `profiles.weekly_digest/email_alerts = false`, matched with `ilike` because Kit echoes the subscriber's own casing. Failures warn rather than 500, so Kit does not retry forever against a database that is not answering. - 24 tests across `webhooks.test.ts` and `email-tags.test.ts` pass.

- **CB-197**, source line 2571. Status: Partly open / completed subparts excluded.

  Preserve completed Kit/Resend/Supabase server timeout hardening. Reconcile seven client apiFetch bypasses, remaining Upstash bounds, and synchronous webhook email dependencies against current code.

- **CB-198**, source line 2581. Status: Partly open / completed subparts excluded.

  Move TypeScript transpilation off container startup by building workspace packages/API output or bundling the API at build time, then verify a container build. Machine size, unused emit, and start-script misdiagnoses are already fixed.

- **CB-199**, source line 2591. Status: Partly open / completed subparts excluded.

  Counterfactual database/RPC/export-list cleanup remains the residual. Preserve already-fixed admin links and deliberately documented dormant state. Consolidate with line1103.

### Moved out of launch-blockers (2026-08-23) / Pricing re-price follow-ups (2026-08-31)

- **CB-200**, source line 2631. Status: Code fix implemented locally on 2026-11-10 / deployment pending.

  **B0: keep `/llms.txt` facts accurate.** The original audit recorded stale counts, unsupported course scope, and an unpinned handwritten file. A later correction brought the static copy to 56 lessons and 65 exercises. The 2026-11-10 work replaces that file with a static route generated from the compiled launched course, shared pricing, and public guide registry. Regression checks pin counts and free lesson links. The summary identifies fictional data and supplied models, links canonical public sources, and labels future worlds coming soon. Treat it as optional reference documentation, without a claim of search ranking benefit.

- **CB-201**, source line 2637. Status: Open as recorded / reproduce current state.

  **B5: checkout trust microcopy.** Nothing at the buy button says where the card data goes. Add "Secure checkout via Stripe" plus a one-line refund restatement at `CheckoutButton`, and an instant-access-after-payment line. (The 5-day badge sits at the top of /pricing only.)

- **CB-202**, source line 2642. Status: Open as recorded / reproduce current state.

  **B5: make /about and /compare reachable on the buying path.** /about (the only page answering "who made this?") has exactly one inbound link in the app, from /compare; /compare is footer-only. Neither is in the nav.

- **CB-203**, source line 2646. Status: Open as recorded / reproduce current state.

  **B3: depth pass on module 2 (`neural-networks`).** Thinnest module in the shipped world (~1,087 words/lesson vs the 1,537 average, 1 derivation drawer, shortest exercises) and it is the first thing a buyer sees after paying. Gate on early refund/completion data pointing at it.

- **CB-204**, source line 2651. Status: Owner-gated / verify current ruling.

  **B9 (owner call first): module summary jargon sweep.** The owner flagged the `neural-networks` summary ("Build a classifier one piece at a time...") as assuming knowledge the cold JS-engineer audience lacks (classifier, activation). Assessment delivered 2026-08-31: spend the first clause defining the payoff in the reader's terms. If the owner approves a rewrite, sweep the other module summaries for the same pattern. These summaries survived the 2026-08-19/20 pre-lesson audits, so this reopens a judgment call, not a defect.

### Moved out of launch-blockers (2026-08-23) / Lesson video scenes follow-ups (2026-08-31)

- **CB-205**, source line 2680. Status: Operator verification / dashboard action.

  (OPERATOR) **Generate the 42 launch clips in Flow** (not 63: the 2026-09-04 value audit in the prompts doc's Generation plan cut 10 entries and deferred 11 past launch; the doc's Status lines mark them, and every verdict passed a full three-lens adversarial vote). RESEQUENCED by owner ruling 2026-09-04 (recorded in the audit doc): the launch ships WITH video, so generation starts now in the rebased batch order (pilots → module 1 + E1 launch-blocking → modules 2-3 → spine → rest) instead of waiting on a pre-clip baseline. The baseline kit becomes the launch-window read against the absolute gates (skip under 40%, survival floor, completion; conversion recorded, never gated at this n).

- **CB-206**, source line 2719. Status: Open as recorded / reproduce current state.

  **Comp pass for kit signatures** on flagged entries: alert signal, ambiguous reading, interval arc, AI ring states come from the trailer's motion-graphics kit, never from Veo, before any clip ships.

- **CB-207**, source line 2722. Status: Owner-gated / verify current ruling.

  **Owner review gate per batch**, same as the still-scene pipeline (Gate D pattern): eyeball every take against the reject list before ingest; no auto-approve.

- **CB-208**, source line 2725. Status: Open as recorded / reproduce current state.

  **Build the integration** from `docs/future-ai-video-scenes.md`: `<VideoScene>` MDX component with the text fallback, caption timing from the existing Dialogue text, lesson schema fields, hosting (R2 or Vercel Blob; the backlog §4 item moving the two trailer mp4s off `public/` should land first and this follows its choice), Velite manifest validation, and tests per the doc's file list.

- **CB-209**, source line 2731. Status: Open as recorded / reproduce current state.

  **Accessibility**: captions on by default where the clip replaces read text; `prefers-reduced-motion` gets the existing still scene, not autoplaying video.

- **CB-210**, source line 2734. Status: Open as recorded / reproduce current state.

  **Other worlds** repeat this per world at launch (their scene bibles and masters do not exist yet; each world needs its Gate C masters first).

### Moved out of launch-blockers (2026-08-23) / Production log review follow-ups (2026-09-02)

- **CB-211**, source line 2752. Status: Operator verification / dashboard action.

  (OPERATOR) **B9: dedupe the BetterStack log drain.** Every request line lands 2-4 times in the drain: the proxy line appears to be delivered under both the `edge` and `external` sources, on top of the separate `lambda` line. Narrow the drain's sources (drop `external` or `edge`, keep `lambda`), then confirm in Live tail that one HEAD probe produces one proxy line. The drain API calls, ids, and the 15-competing-drains history are in `docs/observability.md` §Log Drains. Cosmetic, but it doubles the volume against the capped free tier and makes every future log review noisier.

- **CB-212**, source line 2761. Status: Operator verification / dashboard action.

  (OPERATOR) **B9: downsize Vercel function memory.** Functions run at 2048 MB while peak observed usage is ~293 MB (REPORT lines, 2026-09-02 window). Flip the project's Function Memory setting in the Vercel dashboard to the 1024 MB tier; GB-hour billing halves whenever traffic arrives. Dashboard only, on purpose: a `vercel.json` `functions` block with a glob that matches nothing hard-fails the deploy, and this project already has deploy-gate history (`vercel_project_settings_deploy_gate`).

### Moved out of launch-blockers (2026-08-23) / Lesson-format re-audit follow-ups (2026-09-04)

- **CB-213**, source line 2777. Status: Owner-gated / verify current ruling.

  (OWNER CALL) **The Code step is thin for the 40 drawer-less lessons**: one framing sentence over code the learner just read inline on Concept. Options the audit surfaced: fold to five steps, or give the step unique content (per-lesson code annotations, a trace-through). Data first: read the Code step's dwell and skip-over rates once the baseline runs. Direction B of the 2026-09-24 lesson audit (see "Lesson audit (2026-09-24)" below) takes this up after direction A ships.

- **CB-214**, source line 2785. Status: Historical finding / verify later closure.

  **Mastery gate is measured, not enforced**: Show Solution then Run Tests still opens the gate and still emits full-weight exercise_pass skill events with solutionViewed unchecked. Decide whether earned-pass filtering stays analytics-only or gates the genome weighting.

- **CB-215**, source line 2789. Status: Historical finding / verify later closure.

  **Spaced repetition: both stages built locally 2026-09-16; rollout verification pending.** Shared scheduler, guest storage, entitlement-filtered reads, the authenticated write route, and migration 061 form the data layer. Stage 2 now adds the attempt-before-reveal card, Briefing warm-up and playback deferral, guest merge, and account-scoped retry outbox. Retry/version checks prevent counting a lost-response retry twice. Stage 1 recorded migration 061 as applied; verify it in the target staging environment before deploying these surfaces. No hosted database was changed during stage 2. See `docs/launch-verification.md` and `docs/superpowers/specs/2026-09-15-spaced-review-design.md`.

- **CB-216**, source line 2799. Status: Historical finding / verify later closure.

  **SEO: teaching bodies are display:none to crawlers** on the free-module lessons the sitemap markets (the partition cemented what was previously a 15s timing window). Check GSC indexing of the five free lessons post-deploy; if degraded, server-render the teaching body for bots or add a static transcript surface.

- **CB-217**, source line 2809. Status: Historical finding / verify later closure.

  **Dwell is raw wall time**: prevStepMs includes idle/hidden-tab time; add a visibility-pause if dwell tails look poisoned in the baseline.

### Moved out of launch-blockers (2026-08-23) / Content quality audit follow-ups (2026-09-05)

- **CB-218**, source line 2901. Status: Historical finding / verify later closure.

  **Exercise mix** (2026-09-05: deep-scan-eval, sliding-window, generate-report rewritten; the rest still open): 16 of 65 are type-the-config or join-the-strings (list in the audit); the nine incident exercises ship their full recipe in starter comments. Worst in modules 9 and 11. Consider one harder exercise per module that removes the recipe. SUPERSEDED 2026-09-12 by measurement (`node scripts/report-starter-dictation.mjs --flagged`): the incident drills are mostly the CLEAN pattern, and the recipes concentrate in the capstone (8 of 8 starters flagged) and the recurrent-networks and foundations starters. Now tracked by the starter-dictation gate; the de-recipe pass landed 2026-09-12 (0 of 65 starters dictate) and was blind-verified the same day (see "Item 2" below).

- **CB-219**, source line 2914. Status: Historical finding / verify later closure.

  (B0) **Re-mint visual baselines after the 2026-09-05 re-pace**: per-module minutes on world-deep-orbit and pricing, and the FAQ "about 27 hours" line on landing and pricing, all changed (`course-jsonld.ts` is PT27H). e2e was not run in the remediation session. Remediation record: the "Remediation, 2026-09-05" section of `docs/audits/content-quality-audit-2026-09-05.md`.

### Moved out of launch-blockers (2026-08-23) / Content quality re-audit follow-ups (2026-09-06)

- **CB-220**, source line 2930. Status: Historical finding / verify later closure.

  **N1 Validation vs test never distinguished.** Module 1 splits train/validation, module 3 lesson 4 tunes on validationSplit, lesson 5 reports a held-out slice, capstone/04 says 80/10/10, and no lesson says the tuning number and the reported number must be different sets. One paragraph in training-loop/05.

- **CB-221**, source line 2935. Status: Historical finding / verify later closure.

  **N2 Early stopping is never called a regularizer.** One sentence after the early-stopping block in training-loop/04; one clause in lesson 5's overfitting fix list.

- **CB-222**, source line 2938. Status: Historical finding / verify later closure.

  **N3 training-loop/02 epilogue vs /03 premise**: lesson 2 runs 4,000 descent steps on the network overnight (loss 0.31, so not the toy); lesson 3 opens with Demir unable to differentiate 673 weights. Reframe lesson 3's opener as a check on the autograd black box; keeps the cost lesson and the discovery tag.

- **CB-223**, source line 2943. Status: Historical finding / verify later closure.

  **N4 training-loop/03 chain-rule drawer** derives with squared error and shows the sigmoid factor lesson 1 proved cross-entropy cancels, without comment. One closing sentence.

- **CB-224**, source line 2946. Status: Historical finding / verify later closure.

  **N5 capstone/05 debts paragraph** grew to ~230 words under the T2.5 fix; halve it.

- **CB-225**, source line 2948. Status: Historical finding / verify later closure.

  **N6 Prose-in-code blocks missed on 2026-09-05**: signal-processing/03 window-tradeoff.ts, recurrent-networks/02 rnn-unrolled.ts.

- **CB-226**, source line 2951. Status: Historical finding / verify later closure.

  **N7 foundations/04** explains shuffling (needs the per-batch update) one section before it introduces the per-batch update.

- **CB-227**, source line 2953. Status: Historical finding / verify later closure.

  **Tier 4 nits**: neural-networks/03 "2,369 on a 64-unit stage" is 64/32/1; neural-networks/02 recap triad "fast, simple, and effective" and objective promises three activations for a ReLU-only exercise; training-loop/01 objective promises BCE for an MSE exercise; foundations/04 recall answer still says "learn sequence rather than patterns"; foundations/02 uses "batch" before defining it; neural-networks/02 raw outputs of -11 and 600 after module 1 normalized everything; capstone/03 and /04 say zeroCrossings where every other lesson says frequency; optimization-edge/01 feeds an embedding layer a float [80, 11] tensor; browser-only anchors without a Node gloss (useEffect in foundations/01 and browser-runtimes/04, "In your React component" in browser-runtimes/03, CSS grid in foundations/02); foundations/01 "backend" three lessons before it is defined.

### Moved out of launch-blockers (2026-08-23) / The 76 mediums: fixed (2026-09-07) / The one blocked item is an owner decision

- **CB-228**, source line 3012. Status: Open as recorded / reproduce current state.

  **`browser-runtimes/03-model-loading.mdx:75` prints a `model.summary()` for a model the product does not ship.** The lesson prints the 673-parameter DEEP SCAN stack, 128 / 528 / 17. The asset actually served from `apps/web/public/models/deep-scan/` is a 16 / 8 / 1 network totalling 209 parameters in an 836-byte `weights.bin`, and `docs/capstone-models.md` records it as `deep-scan-v1`. Both were verified by parsing the served asset and by rebuilding the canon network in TensorFlow.js. Two ways out, and they are not equivalent. Shipping a real 673-parameter asset keeps the lesson and the 673 canon that runs through modules 2, 3 and 4, but it replaces a live product asset that the landing demo also loads. Changing the printed summary to 209 keeps the product untouched and puts the lesson at odds with that canon. The editor built a deployable 673-parameter pair but correctly declined to install it, because `apps/web/` was outside its ownership. Your call.

### Moved out of launch-blockers (2026-08-23) / The 12 high findings: fixed, then verified (2026-09-07)

- **CB-229**, source line 3088. Status: Historical finding / verify later closure.

  **`optimization-edge/05-webgpu-acceleration.mdx:103`** now claims a failed backend leaves the engine on cpu. Measured: register a throwing backend above a working one and `tf.ready()` settles on the next working REGISTERED backend, not cpu.

- **CB-230**, source line 3092. Status: Historical finding / verify later closure.

  **`training-loop/04-training-loop.mdx:138` and `:250`** rest on a run that does not exist. The reader measured the clean 100-row block 16 times: training loss lands at 0.0001 to 0.0005 and validation loss does not turn upward near epoch 97, so the 500-epoch run is the best generalizing model in the lesson rather than the one labelled MEMORIZING.

- **CB-231**, source line 3098. Status: Historical finding / verify later closure.

  **`capstone/05-launch.mdx:175`** was not brought along by module 10's 42 MB reframing and now contradicts it: module 10 says the weight file is 85 MB and 42 MB is the gzipped download, the capstone still calls the shipped weights 42 MB.

- **CB-232**, source line 3102. Status: Historical finding / verify later closure.

  **`glossary.ts:754`** still says pruning removes weights and makes a model smaller and faster, which lesson 03 was corrected to deny twice ("Pruning deletes nothing").

- **CB-233**, source line 3105. Status: Historical finding / verify later closure.

  **`capstone/02-ci-cd-pipeline.mdx:183`** asserts the smoke test measures the new deployment; the step it describes curls a URL that GitHub Pages has not finished propagating.

- **CB-234**, source line 3108. Status: Historical finding / verify later closure.

  Plus 20 medium regressions, 31 places a corrected claim survives elsewhere, and 14 rubric violations.

### Moved out of launch-blockers (2026-08-23) / Step 1 correction pass (2026-09-07) / Inherited claims in the unlaunched worlds, NOT fixed

- **CB-235**, source line 3144. Status: Historical finding / verify later closure.

  packages/content/content/terra-grid/edge-deployment/03-runtime-environments.mdx:20 and :49 (also :38, :46, :51, :162). CLAIM: the same op-gap claim in TFLite/ONNX/Core ML terms ("an unsupported op does not run slowly, it fails the load. So targeting a runtime starts with an op-set audit rather than

- **CB-236**, source line 3145. Status: Historical finding / verify later closure.

  /Users/amira.salah/Desktop/tensorcraft/packages/content/content/signal-ward/transformers-bert/05-medis-mistake.mdx:65. Claim: "the model's attention weights didn't give it enough importance." This reads the weights as causal importance, the exact claim retired in deep-orbit. Should say the weight on

- **CB-237**, source line 3146. Status: Historical finding / verify later closure.

  /Users/amira.salah/Desktop/tensorcraft/packages/content/content/signal-ward/attention-mechanisms/04-attention-visualization.mdx:13 (concept.explanation). Claim: "Attention weights can be visualized as heatmaps, revealing which words the model connects." "Revealing which words the model connects" out

- **CB-238**, source line 3147. Status: Historical finding / verify later closure.

  /Users/amira.salah/Desktop/tensorcraft/packages/content/content/terra-grid/capstone/01-system-architecture-review.mdx:157 :: KeyTakeaways bullet 2 states the unconditional fallback rule as a general principle: "Every component needs a defined fallback strategy: the system must degrade gracefully". T

- **CB-239**, source line 3148. Status: Historical finding / verify later closure.

  /Users/amira.salah/Desktop/tensorcraft/packages/content/content/neon-protocol/capstone/01-system-architecture.mdx:52 :: LearningObjectives objective 4 promises "Map failure modes and design graceful degradation for each stage", i.e. a fallback for every stage without exception. Same shape as the dee

- **CB-240**, source line 3149. Status: Historical finding / verify later closure.

  /Users/amira.salah/Desktop/tensorcraft/packages/content/content/terra-grid/mlops-pipelines/05-automated-retraining.mdx:73. Claim: `return driftScore > 0.3` picks a drift threshold with no derivation shown. This is terra-grid's own detector, not the Deep Orbit claim I corrected, so it is not a sweep

- **CB-241**, source line 3150. Status: Historical finding / verify later closure.

  packages/content/content/nova-canvas/creative-deployment/03-caching-precomputation.mdx:125 :: CLAIM: `console.log('Cache HIT: 0ms generation')`. Same defect class as the fake annotation removed from deep-orbit 04-caching-strategies.mdx:130: a printed latency the code cannot produce. A Map lookup plu

- **CB-242**, source line 3151. Status: Historical finding / verify later closure.

  packages/content/content/nova-canvas/creative-deployment/03-caching-precomputation.mdx:201 :: CLAIM (KeyTakeaway 2): "LRU eviction ensures the cache holds the most relevant outputs without unbounded growth". LRU holds the most recently USED entries, which is a proxy for relevance and not the same th

- **CB-243**, source line 3152. Status: Historical finding / verify later closure.

  packages/content/content/nova-canvas/creative-deployment/03-caching-precomputation.mdx:201 :: CLAIM (KeyTakeaway 3): "Pre-computing popular outputs during off-peak hours eliminates generation latency for common requests". "Eliminates" overclaims: pre-computation removes the generation cost, not the

- **CB-244**, source line 3153. Status: Historical finding / verify later closure.

  /Users/amira.salah/Desktop/tensorcraft/packages/content/content/terra-grid/quantization/01-number-formats.mdx:81 :: Claim/pattern: the same slogan formula I removed from my own file, inside a code-block comment: '// BYTES_PER_ELEMENT is 4 and 1. That ratio is the whole trick.' Rubric section 1 (slog

- **CB-245**, source line 3154. Status: Historical finding / verify later closure.

  /Users/amira.salah/Desktop/tensorcraft/packages/content/content/nova-canvas/creative-deployment/04-concurrent-users.mdx:25 :: Claim/pattern: same formula, in a hint: 'GenerationQueue(maxConcurrent: 4) is the whole trick: 4 inferences run, everyone else holds a live WebSocket and a queue position'. R

### Moved out of launch-blockers (2026-08-23) / Step 1 fresh-reader verification (2026-09-07)

- **CB-246**, source line 3191. Status: Historical finding / verify later closure.

  **Run the correction pass.** Order: the 2 high regressions, then the 6 unclosed defects, then the 31 sweep gaps (per claim, not per file), then the 25 mediums, then the rubric list.

- **CB-247**, source line 3194. Status: Historical finding / verify later closure.

  **The sweep instruction needs teeth.** Telling an editor to sweep produced a 31-gap miss rate. The reliable version is what the readers did: grep for the claim, enumerate every surface, and report the list before editing. Consider making that the required first step of any claim fix.

- **CB-248**, source line 3199. Status: Historical finding / verify later closure.

  **Other worlds inherit these claims.** nova-canvas is unlaunched and already carries at least one corrected Deep Orbit claim. A claim fix should sweep `packages/content/content/` entirely, not just `deep-orbit/`.

### Moved out of launch-blockers (2026-08-23) / Round 4 remediation, steps 1 to 3 (2026-09-07) / The durable part: a cheat gate

- **CB-249**, source line 3254. Status: Historical finding / verify later closure.

  Verify whether the cheat gate is already wired into current CI before adding anything. Later canonical records report full cheat sweeps and new harness gates.

- **CB-250**, source line 3257. Status: Historical finding / verify later closure.

  Reconcile historical remaining-cheat counts against later full-suite coverage. Create only genuinely missing current exercise cheats.

### Moved out of launch-blockers (2026-08-23) / Round 4 remediation, steps 1 to 3 (2026-09-07) / Found while verifying, and NOT fixed: the em dash gate has a blind spot

- **CB-251**, source line 3269. Status: Historical finding / verify later closure.

  Decide the two halves separately. The gate should refuse to skip a tracked file with a text extension that git thinks is binary, rather than passing silently. Whether a July audit record should then be rewritten to satisfy a ban adopted in August is a call about historical documents, so I left the file alone.

### Moved out of launch-blockers (2026-08-23) / Content quality audit round 4 (2026-09-07) / The three themes

- **CB-252**, source line 3298. Status: Historical finding / verify later closure.

  **Retrieval surfaces contradict correct bodies.** A body explains a mechanism right and the RecallPrompt, recap bullet, objective or hint states it wrong. These are the surfaces built for recall, so they are what a learner keeps. Start here: `foundations/04:146` and `:152` give a false reason for shuffling before batching that the body gets right at line 99; `training-loop/04:29` says weights update once per epoch and its own drawer contradicts it 156 lines later; `training-loop/05:143` states overfitting as a bare inequality, which flags every healthy model; `signal-processing/05:214` says Hamming tapers to zero when its own formula gives 0.08.

- **CB-253**, source line 3308. Status: Historical finding / verify later closure.

  **Six exercise graders are beaten by solutions showing no understanding**, each executed to prove it: `profile-model` (mine, see below), `build-spectrogram` (an STFT that never advances in time), `apply-window` (a boxcar with two samples zeroed), `prompt-template` (bare substring checks), `prune-weights` (sparsity read as keep fraction), `quantize-weights` (never rounds). This is the exercise-mix project arriving with named instances.

- **CB-254**, source line 3315. Status: Historical finding / verify later closure.

  **Three basics named and never taught**: feature and label (used in code the learner writes, absent from every lesson and from the glossary), MAE (an objective, a recap bullet and a capability line in module 6, never expanded), and attention's learned projections (module 8 teaches Q, K and V as the raw hidden states and never says a real head learns three matrices).

### Moved out of launch-blockers (2026-08-23) / Content quality audit round 4 (2026-09-07) / My own regression, confirmed by execution

- **CB-255**, source line 3324. Status: Historical finding / verify later closure.

  **`optimization-edge/exercises/profile-model.yaml` is still beatable.** Last night's fix closed the cheat that measures nothing and reports zero. A solution that calls predict runs+1 times and returns the numbers memorised from the lesson prose still passes 4 of 4. I ran it. The timing assertion needs to compare against the mock's known cost rather than a floor.

### Moved out of launch-blockers (2026-08-23) / Content quality audit round 4 (2026-09-07) / VISUAL BASELINES 2026-09-20: two world-page baselines now stale by design

- **CB-256**, source line 3343. Status: Open as recorded / reproduce current state.

  **(B0) Re-mint the two deep-orbit world baselines, but read them first.** These two were already drifting before this change: a cold run on clean main measured 3092 against a 3152-pixel baseline, a 60-pixel gap nobody has explained. Re-minting now would bake that unexplained drift in behind an intended change and destroy the only record of it. Measure cold, with a freshly started server, since a warm dev server keeps deleted Tailwind rules alive. Establish what the 60 pixels were, then re-mint. The lesson-page baselines are unaffected: no visual spec captures a lesson route.

### Moved out of launch-blockers (2026-08-23) / Content quality audit round 4 (2026-09-07) / VISUAL BASELINES 2026-09-07: GREEN, 30/30, and a CI gap

- **CB-257**, source line 3359. Status: Open as recorded / reproduce current state.

  **The visual suite never runs in CI.** All three specs under `e2e/visual/` are gated on `RUN_VISUAL=1`, and nothing sets it, so every CI run skips 30 tests and reports green. A visual regression can therefore ship unnoticed; the baselines only protect anything when someone remembers to run them by hand. Either set `RUN_VISUAL=1` in the e2e job or drop the gate, which was added while the baselines were still being generated and has outlived its reason.

### Moved out of launch-blockers (2026-08-23) / Content quality audit round 4 (2026-09-07) / E2E RUN 2026-09-07: GREEN, 132/132

- **CB-258**, source line 3388. Status: Open as recorded / reproduce current state.

  **Worth a look, not a test bug.** The lesson page renders two identical `.lesson-prose` containers, both 2616 pixels tall, so the prose sits in the DOM twice. Nothing fails because of it and it is invisible to a reader, but it doubles the prose payload on every lesson page. Check `lesson-steps.tsx` and `lesson-content.tsx`.

### Moved out of launch-blockers (2026-08-23) / Content quality audit round 4 (2026-09-07) / BATCH TWO APPLIED 2026-09-06 (all 20 Tier 1 items now closed)

- **CB-259**, source line 3438. Status: Historical finding / verify later closure.

  `optimization-edge/02:63`: a five-class 94.2 is presented as comparable to a binary 94. Chance moves from 50 to 20 percent, so it is a new baseline rather than the next rung of the 78 to 87 ladder.

- **CB-260**, source line 3441. Status: Historical finding / verify later closure.

  `optimization-edge/03:139`: the 512 MB fit is credited to pruning, but lesson 2 already cleared the budget at 85 MB, and the line still reads file size as memory footprint.

- **CB-261**, source line 3444. Status: Historical finding / verify later closure.

  `optimization-edge/03:93`: the 80 percent build's accuracy is the pruning-only figure applied to a build whose size requires quantization too.

- **CB-262**, source line 3447. Status: Historical finding / verify later closure.

  `optimization-edge/03:174`: the module says why the crew did not exempt the classifier from quantization, but not from pruning.

- **CB-263**, source line 3449. Status: Historical finding / verify later closure.

  `optimization-edge/01:171`: promises the 45 ms and 112 ms survive into module 11. Neither appears there.

- **CB-264**, source line 3451. Status: Historical finding / verify later closure.

  `capstone/04:120`: the model card is titled as the classifier and reports 42 MB, which is the whole bundle. Collapses the two ledgers module 10 spent a lesson separating.

- **CB-265**, source line 3454. Status: Historical finding / verify later closure.

  `capstone/02:225`: the CI gate sets a 50 MB and 20 ms cap, then passes an artifact its own log identifies as 340 MB and 45 ms.

- **CB-266**, source line 3456. Status: Historical finding / verify later closure.

  `capstone/exercises/launch-rehearsal.yaml`: the identity probe has weights [[1],[0],[0]] and no bias, so a solution that never calls predict passes, and two of the three normalization channels are never observed by any test.

- **CB-267**, source line 3460. Status: Historical finding / verify later closure.

  The Tier 2 and Tier 3 lists in the audit, roughly 60 medium and 40 low, are largely untouched.

- **CB-268**, source line 3462. Status: Historical finding / verify later closure.

  The exercise mix remains the largest single lever on the grade.

### Moved out of launch-blockers (2026-08-23) / Content quality audit round 4 (2026-09-07) / BATCH ONE APPLIED 2026-09-06 (13 of the 20, plus the profile-model grader)

- **CB-269**, source line 3498. Status: Open as recorded / reproduce current state.

  `optimization-edge/05` line 152: the 45 ms to 15 ms half of the speedup still has no cause the module can support. The module never names the backend the 45 ms baseline ran on, so closing this needs a story decision (was the 0249 profile on the WASM fallback?) rather than an edit. OWNER DECISION.

- **CB-270**, source line 3503. Status: Historical finding / verify later closure.

  `foundations/04` line 161: the epilogue's "numTensors hold steady at 70" matches no pipeline in the file. Measured on the lesson's own code: 202 while streaming through the shuffle buffer, 2 for the split pipelines. Pick one or drop the number.

- **CB-271**, source line 3507. Status: Historical finding / verify later closure.

  `foundations/03` youCanNow does not name broadcasting, though the objectives and recap now do.

- **CB-272**, source line 3509. Status: Historical finding / verify later closure.

  `foundations/04` line 99 says "a sliding window of that size" and the antecedent was removed by the correction.

- **CB-273**, source line 3511. Status: Historical finding / verify later closure.

  `glossary.ts`: the aliasing entry is 51 words and broadcasting is 33, against a file median of 17. The file's header calls for one or two plain sentences.

- **CB-274**, source line 3514. Status: Historical finding / verify later closure.

  `neural-networks/05`: five surfaces still say "weights" where they mean all 673 parameters, now that the body distinguishes the 624 drawn connection weights from the 49 zeroed biases.

- **CB-275**, source line 3517. Status: Historical finding / verify later closure.

  Found while editing, different world: Neon Protocol `03-performance-budgets.mdx` and `04-webgl-acceleration.mdx` time `model.predict()` with no readback inside the clock, the same defect the Deep Orbit profiling lesson calls fiction. That world is unlaunched, so it is not urgent, but it will need the same fix.

### Moved out of launch-blockers (2026-08-23) / Exercise-layer coverage plan (owner-approved 2026-09-08, in progress) / Remaining rewrites, in place, no exercise retired

- **CB-276**, source line 3944. Status: Historical finding / verify later closure.

  Reconcile the old build-autoencoder rewrite against later September exercise implementation/verification before scheduling any additional change.

- **CB-277**, source line 3948. Status: Historical finding / verify later closure.

  Reconcile the old time-vs-frequency rewrite against later September exercise implementation/verification before scheduling any additional change.

- **CB-278**, source line 3951. Status: Historical finding / verify later closure.

  Reconcile the old build-rnn rewrite against later September exercise implementation/verification before scheduling any additional change.

- **CB-279**, source line 3953. Status: Historical finding / verify later closure.

  Reconcile the old predict-next rewrite against later September exercise implementation/verification before scheduling any additional change.

- **CB-280**, source line 3954. Status: Historical finding / verify later closure.

  Reconcile the old find-threshold rewrite against later September exercise implementation/verification before scheduling any additional change.

- **CB-281**, source line 3956. Status: Historical finding / verify later closure.

  Reconcile the old build-layer rewrite against later September exercise implementation/verification before scheduling any additional change.

- **CB-282**, source line 3958. Status: Historical finding / verify later closure.

  Reconcile the old prune-weights rewrite against later September exercise implementation/verification before scheduling any additional change.

- **CB-283**, source line 3960. Status: Historical finding / verify later closure.

  Reconcile the old onnx-comparison rewrite against later September exercise implementation/verification before scheduling any additional change.

- **CB-284**, source line 3962. Status: Historical finding / verify later closure.

  Reconcile the old simple-network rewrite against later September exercise implementation/verification before scheduling any additional change.

- **CB-285**, source line 3964. Status: Historical finding / verify later closure.

  Reconcile the old load-pretrained-pipeline rewrite against later September exercise implementation/verification before scheduling any additional change.

- **CB-286**, source line 3965. Status: Historical finding / verify later closure.

  Reconcile the old gpu-backend rewrite against later September exercise implementation/verification before scheduling any additional change.

- **CB-287**, source line 3966. Status: Historical finding / verify later closure.

  Reconcile the old create-sequences rewrite against later September exercise implementation/verification before scheduling any additional change.

### Moved out of launch-blockers (2026-08-23) / Exercise-layer coverage plan (owner-approved 2026-09-08, in progress) / The 3 retirements

- **CB-288**, source line 3977. Status: Historical finding / verify later closure.

  Reconcile the old false-alarm incident replacement against later September exercise implementation/verification before scheduling any additional change.

- **CB-289**, source line 3979. Status: Historical finding / verify later closure.

  Reconcile the old baseline-drift incident replacement against later September exercise implementation/verification before scheduling any additional change.

- **CB-290**, source line 3982. Status: Historical finding / verify later closure.

  Reconcile the old checker-down incident replacement against later September exercise implementation/verification before scheduling any additional change.

### Moved out of launch-blockers (2026-08-23) / Round 7 (2026-09-13): grade of record, 47 blind readers, every high closed the same day / Fixer leftovers closed by hand (2026-09-14, item 3 of the post-round-7 list)

- **CB-291**, source line 4794. Status: Owner-gated / verify current ruling.

  **OWNER: module 3's title** ("Training: Loss, Gradients & Optimization") still skips backprop. Retitling moves the video title card (`docs/video-scene-prompts-deep-orbit.md:355`), `docs/prd.md:550`, `docs/product-plan.md:704`, the e2e text match (`e2e/worlds.spec.ts:107`) and both world-page visual baselines (`e2e/visual/worlds.spec.ts`, full-page at 0.001). Not done without a ruling; the summary and description already name backpropagation.

- **CB-292**, source line 4811. Status: Owner-gated / verify current ruling.

  **OWNER: which terms the Takeaways "Terms in this lesson" list shows.** Today it shows exactly the terms the lesson prose underlines. The chip plugin walks only HTML elements, never the children of a JSX component. About 35 percent of lesson prose (99,116 of 283,204 characters, the count in the item above) sits inside Dialogue, DerivationDrawer, Callout and Epilogue. A term named only there never reaches the list. The options are to teach the plugin to walk component children (chips would then appear inside dialogue), to union the list with each lesson's frontmatter terms, or to keep the list as what the reader saw underlined. "Owner call, one" above has a worked case: anomaly-detection/autoencoders went from 22 listed terms to 3.

### Moved out of launch-blockers (2026-08-23) / Next 16 bump follow-ups (2026-09-14)

- **CB-293**, source line 4872. Status: Open as recorded / reproduce current state.

  **B0: decide the bundler before merging #38.** Next 16 runs `next dev` and `next build` on Turbopack and never reads the config's `webpack` function, and it prints no warning about that. The function only marks `.velite` as managed and ignores it in watch mode, so a Velite rebuild of its 2 MB JSON does not crash the dev server. Production output is unaffected. Either keep Turbopack and confirm `next dev` survives a Velite rebuild, or add `--webpack` to the `dev` and `build` scripts to keep today's behaviour. Neither path is verified yet.

- **CB-294**, source line 4880. Status: Open as recorded / reproduce current state.

  **B9: rename `middleware.ts` to `proxy.ts`.** Next 16 prints a deprecation on every build. `npx @next/codemod@canary middleware-to-proxy .` does the rename; update the matcher comments and the `docs/ci-cd.md` references in the same change.

- **CB-295**, source line 4884. Status: Open as recorded / reproduce current state.

  **B9: move the three edge-runtime routes to Node.** `app/icon.tsx`, `app/apple-icon.tsx` and `app/api/og/route.tsx` export `runtime = "edge"`, which Next 16 deprecates and which already disables static generation for those routes. Check the OG composite still renders after the switch (satori needs JPEG plates).

- **CB-296**, source line 4889. Status: Open as recorded / reproduce current state.

  **B9: import `withSentryConfig` from `@sentry/nextjs/config`.** Sentry 10.74 deprecates the root import and drops it in v11. One line in `next.config.ts`, independent of the Next version, and the warning already prints on main.

- **CB-297**, source line 4893. Status: Operator verification / dashboard action.

  (OPERATOR) **Rebase #38 once the config fix is on main.** Comment `@dependabot rebase` on the PR; the PR itself needs no edits.

### Moved out of launch-blockers (2026-08-23) / Independent review follow-ups (2026-09-20)

- **CB-298**, source line 4920. Status: Owner-gated / verify current ruling.

  Owner-deferred human screen-reader walkthrough and associated glossary accessible-name verification. Resume only under the existing owner gate.

- **CB-299**, source line 4927. Status: Partly open / reconcile inline status.

  **(B0) Production recheck of the three mobile defects** fixed in the 09-18 UI remediation (reduced-motion `/auth` crash, consent overlap at 375px, report dialog at 320px): `node scripts/audit-ui-ux-probes.mjs --live`, keep the JSON under `docs/audits/`. The release record reads as if this ran; no artifact exists.

- **CB-300**, source line 4932. Status: Open as recorded / reproduce current state.

  **(B0) Editorial pass on the hedge formula.** "does not establish / guarantee / prove" and "It does not ..." went from 34 to 203 occurrences across the 56 lessons (54 remain after the finale and Epilogue fixes), 22 lessons carry four or more, and 68 of 142 glossary definitions were rewritten with a trailing hedge. One hedge per claim; restore second person in `packages/content/src/glossary.ts`; add glossary.ts to the slop-lexicon target list.

- **CB-301**, source line 4939. Status: Open as recorded / reproduce current state.

  **(B0) 2026-09-16 logical export of the production auth schema.** `docs/launch-verification.md` line 295 records a local restore of public, auth and storage, "removed afterward", with no log, fingerprint or deletion record. Owner to state who ran it and whether it was deleted; if unknown, rotate sessions once. Rewrite `docs/deployment-guide.md` so the quarterly drill is the managed snapshot restore and logical exports exclude `auth.refresh_tokens`, `auth.sessions` and `auth.mfa_*`.

- **CB-302**, source line 4946. Status: Open as recorded / reproduce current state.

  **(B0) Visual baselines re-minted under one reason.** `docs/audits/learning-product-p9-2026-09-19/visual-baseline-updates.json` holds one reason string for 21 images and absorbed the pricing (3518 vs 3544) and deep-orbit (3092 vs 3152) drift ruled must-diagnose-first on 2026-09-15. Re-measure both cold against 80a3f029, then give each entry its own reason. The 2026-09-20 layout and sequential-unlock changes make the deep-orbit world baselines stale again by design; same rule applies.

- **CB-303**, source line 4953. Status: Open as recorded / reproduce current state.

  **(B0) Repository weight decision.** 852 audit PNGs (about 177 MB, no LFS) sit in the last three commits; 173 files under `learning-product-p7-2026-09-19/current/` are byte-identical to their siblings. Owner decides between a history rewrite now and keeping history. Either way: publish future screenshot evidence as CI artifacts, keep only markdown and small JSON under `docs/audits/`, add a binary-size gate.

- **CB-304**, source line 4960. Status: Open as recorded / reproduce current state.

  **(B0) Record the red CI period.** Main's Broken-link job was red on every push from e5ff39b4 to 8a28a23c (private-repo link) and the E2E job on five of them (training exercises timing out on software WebGL). The release record has no CI row; add one with the run URL when the next release record is written, and require CI on the exact tree before any deploy.

- **CB-305**, source line 4966. Status: Open as recorded / reproduce current state.

  **(B0) Stripe: live-mode path never exercised.** Checklist A6 was rewritten to test mode only; add a two-line runbook entry for verifying the first live charge, a Sentry capture for webhook 4xx (wrong live `STRIPE_WEBHOOK_SECRET` today only logs), and an uptime check that the endpoint answers 400 to an unsigned POST. The dispute status guard landed on 2026-09-20; partially refunded purchases that win a dispute still restore to `completed` because migration 051 knows no other target.

- **CB-306**, source line 4973. Status: Owner-gated / verify current ruling.

  Record/reconcile the dated owner tax/registration deferral across documents. Do not reopen the geographic market decision or treat older urgency as authorization.

- **CB-307**, source line 4977. Status: Open as recorded / reproduce current state.

  **(B1) GitHub account deletion does not revoke the OAuth grant** (`apps/api/src/routes/profiles.ts` around line 439): stored refresh tokens outlive the account by up to six months. Revoke on delete.

- **CB-308**, source line 4980. Status: Owner-gated / verify current ruling.

  **(B1) Readiness check versus sequential unlock.** With sequential unlock restored, the readiness check's "start at module 7" links land on the previous-module lock panel for most purchasers. Either keep the check as a recommendation only or remove it; owner call.

- **CB-309**, source line 4984. Status: Open as recorded / reproduce current state.

  **(B2) Migration 063's decision catalog is hand-copied** in the SQL, its check constraint, `rls.sql` and `boss-beat-client.ts` with no test deriving it from the MDX; a vitest parsing BossBeat props against the 063 VALUES list closes it.

- **CB-310**, source line 4988. Status: Open as recorded / reproduce current state.

  **(B2) The 31 new `scripts/check-*` and `verify-*` harnesses** are wired into nothing; the release record cites their logs without the invoking commands, and two carry hard-coded counts (56 lessons, 6 decisions). Wire the durable ones into package.json or CI; delete the one-off ones.

### Moved out of launch-blockers (2026-08-23) / Lesson opener: measured waste, owner call (2026-09-22) / Found during the lesson layout build (2026-09-23 and 2026-09-24)

- **CB-311**, source line 5036. Status: Open as recorded / reproduce current state.

  **(B1) The ensemble-methods lesson shows no scene picture.** Deep Orbit lesson `advanced-time-series/05-ensemble-methods.mdx` has the slug `time-series-ensemble-methods`, but its scene art ships as `apps/web/public/scenes/deep-orbit/advanced-time-series/ensemble-methods.webp`. The Briefing requests `time-series-ensemble-methods.webp`, which does not exist, so this live paid lesson shows no picture. The mismatch predates the 2026-09-23 layout work, which now renders a Briefing without a picture as a single column. `packages/content/__tests__/scene-art-coverage.test.ts` names each plate from the filename instead of the frontmatter slug, so the gate behind the /pricing "Illustrated lessons" claim passes anyway. Fix: make the gate read the frontmatter slug (it goes red), then rename the asset to the slug (renaming the slug would change the lesson URL and progress keys). Found 2026-09-23 during the lesson layout build.

- **CB-312**, source line 5049. Status: Open as recorded / reproduce current state.

  **(B3) A Neon Protocol callout sits inside `<Section>`.** Neon Protocol lesson `ml-through-vision/01-seeing-like-a-machine.mdx` wraps a `BridgeCallout` in `<Section>`, which the lesson page renders as a plain div. Neither the paired grid nor the unpaired companion margin (`.lesson-step-content > [data-aside]`) reaches a companion inside that div. It is not user-visible today, because Neon Protocol is not in `LAUNCHED_WORLDS`. Before Neon launches, unwrap that callout or widen the rule to nested companions. Found 2026-09-23 during the lesson layout build.

- **CB-313**, source line 5057. Status: Open as recorded / reproduce current state.

  **(B2) Recap and takeaway lists pick up the prose list rules.** `LessonRecap` and `KeyTakeaways` (packages/ui) render inside `.lesson-prose`. From the md breakpoint, its unlayered `li` rule sets their `text-sm` items to 17 px. Its unlayered `ul` and `ol` rule adds a 1.5em indent to their lists. Their decorative check glyphs are real text, so screen readers read one before every item. `LearningObjectives` already pins its metrics inline and hides its glyph (2026-09-23), and these two need the same treatment. The alternative is to move the `.lesson-prose` element rules into a cascade layer so components stop pinning. The Takeaways step's heading outline runs from the chrome's h1 to h4 headings (the recall card and `LessonRecap`) before the h2 terms list, and those h4s predate this work. The `BossBeat` decision's options are an `ol` inside `.lesson-prose` too, so they pick up the same indent (about 25 px). Found 2026-09-23 in the review of Task 9 of docs/superpowers/plans/2026-09-23-lesson-layout.md.

- **CB-314**, source line 5071. Status: Open as recorded / reproduce current state.

  **(B2) OWNER: the focus ring around the whole lesson step.** The lesson page moves focus to the step container (`role="group"`, `tabIndex=-1`) so keyboard and screen reader users land on the new step. The unlayered `*:focus-visible` rule in `apps/web/app/globals.css` overrides the container's `outline-none`. A reader who reopens a lesson mid-way (a reload, a new tab or a bookmark) sees a 2 px ring around the whole step, because the restored step takes focus on load. A reader who arrives by clicking an in-app link sees no ring, because `:focus-visible` matches script focus on load and after a key press, not after a click (checked in the Task 12 review). In development the ring also shows on every freshly loaded Briefing, because StrictMode runs the mount effect twice. This predates the 2026-09-23 layout work. `e2e/visual/lesson.spec.ts` blurs the focused element before each capture, so the lesson baselines do not show the ring. The options are to suppress the outline on that container only, since it is a non-interactive focus target, or to keep it for keyboard-initiated step changes only. The choice touches WCAG 2.4.7 (Focus Visible), so it is the owner's call. Found 2026-09-24 while minting the lesson baselines.

- **CB-315**, source line 5088. Status: Open as recorded / reproduce current state.

  **(B2) OWNER: a tall companion leaves an empty text column.** Measured 2026-09-24 on a production build at 1,440 x 900, signed out, on the Concept step. A paired row is as tall as its taller item. The companion column is 544 px wide, beside the 600 px text column. On lesson 1 (`foundations/introduction-to-tensors`), the first bridge callout is 314 px tall beside a 132 px paragraph. That leaves 183 px of empty text column before the next paragraph. At 544 px, both of the callout's code samples also wrap onto a second line. Spanning that row instead (simulated in the browser, not built) makes the callout 253 px tall with each sample on one line, and the page 62 px longer. On `foundations/tensor-operations`, the bridge row leaves 152 px (a 162 px paragraph beside a 314 px callout). That lesson also has the free module's only derivation drawer. Opening it grows the drawer from 59 px to 731 px beside a 229 px paragraph, and 502 px of the text column stays empty. The drawer is the step's last block, so that gap sits above the nav rather than between two paragraphs. Spanning the open drawer at the full grid width (1,184 px) would set its text at 114 to 131 characters a line, against 49 to 61 paired. The drawers that already span (6 by the spec's count) open at that width today. Capped at the 820 px prose width, the drawer would measure 83 to 91, close to the 88 to 99 of the paragraph above it at that width. The page would then be 22 px shorter than paired. Judged by eye on those pages, both rows read better spanning, as long as a spanning drawer gets the 820 px cap. A height threshold therefore needs that cap too. `rehype-pair-companions.ts` runs at content build, so it sees the text but neither rendered heights nor whether a learner opened a drawer. The threshold and the cap are the owner's design call, and the layout plan left the plugin unchanged. To see it, open either lesson's Concept step at 1,440 on a production build and open the drawer. Found 2026-09-24 in Task 13 of docs/superpowers/plans/2026-09-23-lesson-layout.md.

- **CB-316**, source line 5116. Status: Open as recorded / reproduce current state.

  **(B2) OWNER: a Briefing decision leaves the picture column empty.** Measured 2026-09-24 on a production build at 1,440 x 900, signed out, on `foundations/normalization`, the free lesson whose story zone carries a `BossBeat`. The decision box renders in the story grid's beats column, 544 px wide and 724 px tall. The picture and the stage direction end 468 px down the 1,152 px grid, so 684 px of the picture column stays empty beside the box. At 1,024 the picture shrinks and the empty stretch grows to 855 px. The box itself is legible: its prompt runs about 50 characters a line at 18 px, the four options sit two across in 229 px cards, and nothing overflows. Five paid lessons also carry a story-zone decision (`anomaly-detection/01`, `capstone/03`, `capstone/05`, `llm-integration/04` and `optimization-edge/04`). The e2e suite cannot open them signed out, and their empty stretch depends on the length of each prompt. Two paid lessons put a code block in the same place, before their first heading (`advanced-time-series/04-kalman-filters` and `recurrent-networks/02-simple-rnns`), which the same choice would cover. Moving the decision out of the beats column is a layout choice, so it is the owner's call. Found 2026-09-24 in the final review of docs/superpowers/plans/2026-09-23-lesson-layout.md.

- **CB-317**, source line 5135. Status: Open as recorded / reproduce current state.

  **(B9) The Briefing without JavaScript.** With scripting off, the noscript reveal shows the whole Briefing, and two parts of it read wrong. The "Cut to: Briefing" divider appears under every dialogue beat, because the reveal's `.tc-cut-to { display: revert !important }` reveals all of them instead of the last one. A story-zone `BossBeat` stays on its "Loading beat" placeholder, because it needs JavaScript to render its options. Both predate the 2026-09-23 layout work, which made the no-JS story grid one 820 px column. Found 2026-09-24 in the final review of docs/superpowers/plans/2026-09-23-lesson-layout.md.

### Moved out of launch-blockers (2026-08-23) / Lesson audit (2026-09-24)

- **CB-318**, source line 5188. Status: Open as recorded / reproduce current state.

  **(B3) The NextLesson card never lifts on hover.** `apps/web/app/components/mdx/next-lesson.tsx` pairs `brutalist-hover` with layered hover utilities that lose to, or cancel, the unlayered `.brutalist-hover:hover` rule in `apps/web/app/globals.css`: the two `translate` utilities offset the rule's 2 px lift, and the rule's 6 px shadow at 35% accent wins over the utility's 4 px accent shadow. On hover the card shows the faint shadow and never moves. Predates the 2026-09-24 work. Found in the Task 1 quality review of docs/superpowers/plans/2026-09-24-lesson-tightening.md.

- **CB-319**, source line 5197. Status: Open as recorded / reproduce current state.

  **(B3) OWNER: two faint edges after the shadow rule.** The exercise results panel's partial state uses `border-warning/15`, about 1.33:1 in dark and 1.25:1 in light against the pane, fainter than the house hairline (about 1.45:1). Its success and error states sit near the hairline, so `/20` would match them. CodeBlock is framed by its hairline alone (about 1.63:1 dark, 1.31:1 light against the page), because Shiki paints the code close to the page colour. The edges are decorative, so neither fails WCAG 1.4.11, and no baseline captures the results panel. Found in the Task 1 quality review of docs/superpowers/plans/2026-09-24-lesson-tightening.md.

- **CB-320**, source line 5206. Status: Open as recorded / reproduce current state.

  **(B2) OWNER: the exercise editor wraps at desktop too.** Since 2026-09-25 `wrapContent` is on at every width, because 59 of 65 starters have a line wider than the desktop editor and their step comments were scrolled off. Wrapped rows start at the content edge with no line number, and Home, End, Up and Down move by visual row. The alternative is to wrap below 1,024 px only (`wrapContent` from a matchMedia hook); crossing the breakpoint then rebuilds the editor view, which keeps the text but loses undo history and the cursor. Found in the Task 7 quality review of docs/superpowers/plans/2026-09-24-lesson-tightening.md.

- **CB-321**, source line 5215. Status: Open as recorded / reproduce current state.

  **(B3) Wrapped code hangs from the block edge, not the line's indent.** Below 1,024 px a wrapped line continues 2 ch in from the `pre` edge, so a line indented 2 or more spaces continues at or left of its own code (2,669 CodeBlock lines exceed a 390 px row; 986 are indented 2+ spaces). A Shiki `line` transformer in `packages/ui/src/mdx/code-block.tsx` that stamps each line's leading spaces as `--tc-indent`, with the CSS hang written as `calc((var(--tc-indent, 0) + 2) * 1ch)`, would hang each line from its own indent. Found in the Task 7 quality review.

- **CB-322**, source line 5223. Status: Open as recorded / reproduce current state.

  **(B3) Run the phone wrap tests in WebKit.** `e2e/lesson-layout.spec.ts` runs only in the chromium project, and iOS Safari is the main phone engine. The inline-block line layout with preserved newlines has not been seen in WebKit. The simplest route is a wrap test in `e2e/mobile.spec.ts`, which the `mobile-iphone-se` project already runs in WebKit at 320 x 568. This overlaps the open "Test-infra debt (2026-07-21 audit structural notes)" item, which notes that the WebKit projects run only the mobile smoke suite. Found in the Task 7 quality review.

- **CB-323**, source line 5231. Status: Open as recorded / reproduce current state.

  **(B3) OWNER: two "Need a hint?" ladders in one column.** Since the 2026-09-25 change, an exercise's own hint ladder renders in the Challenge step's reading column, above the lesson ladder at the column's foot. Counted from the exercise YAML files on 2026-09-25: 10 exercises carry their own ladder, in 9 lessons (anomaly-detection 01, 03 and 04, browser-runtimes 01 and 04, capstone 02 and 05, llm-integration 03, optimization-edge 04), and all 9 lessons carry a lesson ladder too. Each now shows at least two panels headed "Need a hint?" in one column, where the exercise's own ladder used to sit in its own pane. `capstone/05-launch` shows three, since `verify-deployment` and `launch-rehearsal` both carry one. A label per ladder (for example "Hints for" followed by the exercise's title) would tell them apart. It does not fix `browser-runtimes/01-why-the-browser`: there the lesson ladder's nudge and guidance match the two rungs of the `browser-ml-tradeoffs` ladder word for word, so the learner sees the same two hints twice. Drop one of the two ladders there; the exercise's is the one to drop, since the lesson ladder holds the same two rungs plus the solution. Found in the Task 6 quality review of docs/superpowers/plans/2026-09-24-lesson-tightening.md.

- **CB-324**, source line 5249. Status: Open as recorded / reproduce current state.

  **(B2) Analytics: `hintsUsed` counts the exercise's own ladder from 2026-09-25.** Before, reveals on an exercise's own ladder reached analytics but never the step machine's counter, so `hintsUsed` on the attempts POST, `exercise_submitted` and `lesson_completed` undercounted on those lessons. From this change on they count. The figure is lesson-wide distinct levels, so a reveal on exercise 2's ladder also raises exercise 1's figure. Read any jump on those lessons as this fix, not a behaviour change. Per-exercise attribution would need the counter keyed by exercise slug.

- **CB-325**, source line 5257. Status: Open as recorded / reproduce current state.

  **(B2) Takeaways: Continue before answering skips the recap.** The recall gate keeps Continue available, so a learner who moves on without answering never sees the recap or the terms list on that visit. Compare Takeaways step views with `recall_answered` events once data arrives, to see how often that happens. Found in the Task 5 quality review of docs/superpowers/plans/2026-09-24-lesson-tightening.md.

- **CB-326**, source line 5263. Status: Partly open / reconcile inline status.

  **(B1) OWNER, legal-adjacent: "Cookie settings" never brings the bar back in the same tab.** `cookie-settings-button.tsx` clears the consent key and turns every consent gate off, so withdrawal itself works. But `CookieConsent` reads storage once, on mount, and has never listened for consent changes, so a visitor cannot make a new choice until a full reload. The button's docstring and the closed backlog item "Consent withdrawal path (code)" both say the banner re-shows. The fix is small (subscribe to the consent change event in `CookieConsent`), and the publish effect from the 2026-09-24 work already handles a re-show. Found in the Task 2 quality review of docs/superpowers/plans/2026-09-24-lesson-tightening.md.

- **CB-327**, source line 5274. Status: Open as recorded / reproduce current state.

  **(B3) OWNER: the exercise brief's title is no larger than its instructions on desktop.** Measured on the production build, lesson 1's Challenge step, 2026-09-25. The brief pins its `h3` at 18 px, line height 28 px, weight 600, at every width. At 1,440 the first instruction paragraph is 18 px (line height 32.4 px, weight 400) and the first list item 17 px (28.9 px); at 390 they are 16 px (28.8 px) and 14 px (23.8 px). On desktop the title matches the paragraph's size and stands apart by weight and colour alone. The old pane title had the same `text-lg` classes but sat under the unlayered `.lesson-prose h3` rule, so it rendered at 24 px (line height 37.3 px) at 1,440 and 20 px (31.1 px) at 390. There are two options. The first pins the title larger inside the brief: the old 24 px from 768 px up and 20 px below. The second pins the instruction metrics inside the brief, as LearningObjectives pins its list. The paragraphs and list items then take the `text-sm leading-relaxed` the instructions already ask for (14 px, line height 22.75 px), and the 18 px title reads larger. The second also ends the phone mismatch between paragraphs (16 px) and list items (14 px) in one instruction block. Found in the final review of docs/superpowers/plans/2026-09-24-lesson-tightening.md, measured in its Task 9.

- **CB-328**, source line 5294. Status: Partly open / reconcile inline status.

  **(B3) Duplicate code landmarks.** The exercise code-contract `pre` in `packages/ui/src/mdx/instruction-text.tsx` keeps `role="region"` and `aria-label="Exercise code contract"`. Both predate the 2026-09-24 work (commit 80a3f029, 2026-09-19). The block no longer scrolls at any width, so each contract is now only a named landmark. Counted from the exercise build on 2026-09-25: 5 of 65 exercises carry a contract and none carries two. But `capstone/05-launch` renders three briefs on its Challenge step, each with one contract, so that page holds three regions with the same name. The MDX `pre` mapping in `lesson-content.tsx` does the same with "Code example" on raw fences, and in the Deep Orbit build two lessons carry two fences each (`advanced-time-series/04-kalman-filters`, `training-loop/03-backpropagation`). axe's best-practice `landmark-unique` rule would flag both. `e2e/accessibility.spec.ts` runs only the wcag2a and wcag2aa tags. The four specs that run axe with no tag filter scope it to one component each, none of them a brief, so nothing catches it today. The proposed fix for the contract is to drop both attributes. The mapping's pair belongs with the tab-stop item below, since raw fences still scroll from 1,024 px. Found in the Task 9 quality review of docs/superpowers/plans/2026-09-24-lesson-tightening.md.

- **CB-329**, source line 5312. Status: Open as recorded / reproduce current state.

  **(B3) Tab stops on code that cannot scroll.** Shiki 4 puts `tabindex="0"` on its `pre` by default (`@shikijs/core` 4.4.3), and CodeBlock passes its output through unchanged. The MDX `pre` mapping in `lesson-content.tsx` sets `tabIndex={0}` on raw fences (8 blocks in 6 lessons of the Deep Orbit build). Below 1,024 px these blocks wrap and cannot scroll, so each one is a tab stop with nothing to scroll. On the production build at 390 px, lesson 1's Concept and Code steps each show three Shiki blocks, all with `tabindex="0"`, `overflow-x: visible` and no overflow. From 1,024 px the blocks are `overflow-x: auto` and can scroll: at 1,440 one of the three Concept blocks overflows. A block that scrolls needs its tab stop, which axe's `scrollable-region-focusable` rule checks under the wcag2a tag the suite runs. So any fix depends on width. Found in the Task 9 quality review of docs/superpowers/plans/2026-09-24-lesson-tightening.md.

### Moved out of launch-blockers (2026-08-23) / Challenge task stops follow-ups (2026-10-10)

- **CB-330**, source line 5330. Status: Owner-gated / verify current ruling.

  **Velite's `strict: true` does nothing.** velite 0.4's CLI declares `--strict` with a default of `false` and resolves `options.strict ?? config.strict`, so the CLI's `false` overrides the config and every content schema issue is only logged. Fix: run `velite build --strict` in `packages/content`'s `build:content` (the tree built cleanly with it on 2026-10-10). The task-brief transform throws instead, so it does not depend on this. Gate: owner call.

- **CB-331**, source line 5337. Status: Open as recorded / reproduce current state.

  **`e2e/exercise-autocomplete.spec.ts` flakes.** It failed in main's CI run before 2026-10-10 and passed locally. Find the race before it masks a real failure.

- **CB-332**, source line 5340. Status: Owner-gated / verify current ruling.

  **The Expected tensor's shape readout is still a prose chip.** The `[5]` in `.challenge-expected-shape` takes the `.lesson-prose :not(pre) > code` rule in `globals.css`: a bordered chip at 0.85em of the panel's 14 px, so 11.9 px, under the 12 px floor. The 2026-10-10 overrides cover the brief and the hint rungs, and the five readings above it have their own override, but this `code` has none. It predates the change, and the approved mockup kept it. Fix: give `.lesson-challenge-workspace .challenge-expected-shape code` the readings' treatment (no border or wash, 14 px). Gate: owner call, since it changes the panel's look.

### Moved out of launch-blockers (2026-08-23) / PostHog data audit follow-ups (2026-10-03)

- **CB-333**, source line 5396. Status: Owner-gated / verify current ruling.

  **(B0) Session replay is on but undisclosed.** Project settings record 100% of consenting sessions (replay, console logs, heatmaps; default masking, 30-day retention), and `apps/web/lib/posthog.ts` does not turn them off. The policy promises "pageviews and product events" (`apps/web/app/privacy/page.tsx:165`; the "Session recording is off" line at `:177` is about Sentry). Owner call: disable it in the init options (`disable_session_recording`, `enable_heatmaps: false`, `enable_recording_console_log: false`) and in the project, or disclose it, sample it (`docs/tech-spec.md:482` says 10%), mask text, and version consent so earlier "accepted" values are asked again.

- **CB-334**, source line 5406. Status: Open as recorded / reproduce current state.

  **(B1) Server-side PostHog events ignore the banner.** `payment_*` (`apps/api/src/routes/payments.ts`), `code_pushed` (`apps/api/src/routes/github.ts`) and `$exception` (user context from `apps/api/src/middleware/auth.ts`) go out keyed to the Supabase user id whatever the visitor chose, against `privacy/page.tsx:163-171`. None sent yet. Gate them on a stored consent signal, or state a legal basis.

- **CB-335**, source line 5412. Status: Open as recorded / reproduce current state.

  **(B2) Precise location is stored.** Events and the identified person carry city, postal code and coordinates although `anonymize_ips` is on; the policy says nothing about location. Strip below country or region with a PostHog transformation (or `$geoip_disable`), then state the precision in the policy.

- **CB-336**, source line 5417. Status: Open as recorded / reproduce current state.

  **(B2) Certificate page titles carry the learner's name** into the `$pageview` `title` property (`apps/web/app/certificates/[id]/page.tsx:74-75`), and replays record the `og:` metas in the page head (the visible name block is `ph-no-capture` since 2026-10-03). Use a generic `<title>` and keep the name in the Open Graph title, or strip it in `before_send`; for the metas, set `session_recording.slimDOMOptions.headMetaSocial`.

- **CB-337**, source line 5423. Status: Open as recorded / reproduce current state.

  **(B2) Consent flow.** "Cookie settings" does not reopen the banner until a full reload (`cookie-consent.tsx` reads the key once on mount); opting out leaves the `ph_` cookie (`opt_out_persistence_by_default`); stored consent has no version; the banner stays up in other open tabs after Accept.

- **CB-338**, source line 5433. Status: Owner-gated / verify current ruling.

  **(B0) The internal-traffic filter matches nobody.** Cohort 221371 keys on `$internal_or_test_user`, which nothing sets, and anonymous visitors get no person (identified-only profiles). Set `internal_or_test_user_hostname: 'localhost'`, register a persisted `tc_internal` super property (owner account, or a one-time `?tc_internal=1`), filter on event properties, and turn "Filter test accounts" on by default.

- **CB-339**, source line 5440. Status: Open as recorded / reproduce current state.

  **(B0) Usage alerts.** Free plan, hard cap 1M events a month (data dropped above it): billing alert at 250k, insight alert on daily `$opt_in` above 50 as a loop tripwire.

- **CB-340**, source line 5443. Status: Open as recorded / reproduce current state.

  **(B2) Dev servers send to the production project** (`localhost:3001` events 2026-08-26/27). Separate dev project key, or the hostname flag.

- **CB-341**, source line 5445. Status: Open as recorded / reproduce current state.

  **(B2) `signup_completed` is not a signup.** It fires on every Supabase `SIGNED_IN`, including tab refocus (169 events for one account; `apps/web/lib/supabase/session-listener.tsx:102-117`). Fire once for a new account (account age plus a per-user key, or decided server-side in the auth callback); treat every historical value as invalid.

- **CB-342**, source line 5450. Status: Open as recorded / reproduce current state.

  **(B2) Reverse proxy** (Installation Health fails; ad blockers on a JavaScript audience): Next.js rewrites under a neutral path (not `/ingest`), `ui_host`, then narrow the CSP.

- **CB-343**, source line 5453. Status: Open as recorded / reproduce current state.

  **(B3) First-visit mount events are lost.** `lesson_started`, `pricing_page_viewed`, `paywall_hit` and similar fire before Accept and `capture()` drops them. Queue in memory and flush after opt-in, or re-fire page-level events once analytics is ready.

- **CB-344**, source line 5457. Status: Open as recorded / reproduce current state.

  **(B3) Tabs initialised together split one person into several ids.** The consent broadcast initialises every open tab at once; each mints its own distinct id, and `consent_granted` fires once per tab. Initialise only in the visible tab.

- **CB-345**, source line 5461. Status: Open as recorded / reproduce current state.

  **(B3) KPI formulas** in `docs/tech-spec.md:464-472` and `scripts/analytics/module1-baseline.mjs` use events that do not exist (`exercise_started`, `checkout_completed`, `attemptNumber`) and include internal traffic. Define B3's "users" as DB accounts and "data" as consented module-1 starts after these fixes. Dashboard: the existing "Success-metrics dashboard + alerts" operator item.

- **CB-346**, source line 5467. Status: Open as recorded / reproduce current state.

  **(B1) `payment_completed` double count**: the client sends it on every purchase-success mount and the webhook sends it too. Count revenue from `$lib = posthog-node` only, or drop the client event.

- **CB-347**, source line 5470. Status: Open as recorded / reproduce current state.

  **(B1) No posthog-node event has ever arrived.** Consistent with zero payments, but `docs/deployment-guide.md:47` names `POSTHOG_KEY` while the API reads `POSTHOG_PROJECT_TOKEN`; confirm the Fly secret name.

- **CB-348**, source line 5473. Status: Open as recorded / reproduce current state.

  **(B5) Launch links carry no UTMs** (zero tagged visits so far).

- **CB-349**, source line 5474. Status: Open as recorded / reproduce current state.

  **(B9) Blog lesson links carry internal UTMs** (`apps/web/app/blog/[slug]/lesson-link.tsx:25`) that overwrite the session's real campaign.

- **CB-350**, source line 5477. Status: Open as recorded / reproduce current state.

  **(B9) Per-path Web Vitals are attributed to the next page** (`$pathname` at flush); break down by `$current_url`.

- **CB-351**, source line 5482. Status: Open as recorded / reproduce current state.

  **(B2) `/pricing` layout shift, CLS 0.22-0.34 on hard loads.** `pricing-tiers.tsx` calls `useSearchParams` under `<Suspense fallback={null}>` (`apps/web/app/pricing/page.tsx:148`), so the static HTML has no tier markup and the grid appears after hydration. Read `searchParams` on the server, or isolate the selection restore.

- **CB-352**, source line 5487. Status: Open as recorded / reproduce current state.

  **(B2) Lesson LCP about 2.9 s against 0.84 s for static pages.** The Briefing is hidden until hydration (`lesson-steps.tsx:1853`), the LCP portrait is lazy (`packages/ui/src/scene-portrait.tsx:63`), and Sandpack is imported statically through the mdx barrel (`packages/ui/src/mdx/exercise.tsx:14` via `mdx/index.ts:7`).

- **CB-353**, source line 5492. Status: Open as recorded / reproduce current state.

  **(B9) No reload on `ChunkLoadError`** (seen 2026-09-17 after a deploy).

### Reconciled historical records

These source records stay visible for coverage accounting. Their old scope is
superseded or complete, so any remaining work uses the current replacement.

| Source line | Disposition                | Reconciliation                                                                                                                                                                      |
| ----------: | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|         586 | Excluded historical record | The current roadmap/source baseline already has launched Deep Orbit modules1-11. Do not reopen the old modules6-11 scope-planning milestone.                                        |
|         987 | Excluded historical record | DISPATCH producer hooks were removed by owner decision, documented at canonical line795. Any future restoration needs a new scope.                                                  |
|         991 | Excluded historical record | The DISPATCH inbox/producers were removed at line795. A weekly cron/email mirror is not a current implementation requirement.                                                       |
|         996 | Excluded historical record | The build-a-rewind-surface/stop-collecting alternative is superseded by explicit counterfactual cleanup at line1103.                                                                |
|        1760 | Excluded historical record | The task is struck through, lists a July pending set, and later production ledger records supersede that exact pending list. Future release migration checks remain in the roadmap. |
|        2122 | Excluded historical record | Market scope was decided at line2108. Advisor follow-through remains tracked there. Do not reopen the old market/geo-gate choice.                                                   |
|        2184 | Excluded historical record | The EU/UK geo-gate was removed by owner decision, explicitly documented at line2089. Do not deploy or restore that obsolete gate.                                                   |
|        2453 | Excluded historical record | The skip/replay affordance was fixed. The remaining scene duration is an explicit owner product decision, not an unimplemented fix.                                                 |

## Roadmap maintenance

Close work in the canonical backlog with the changed behavior, relevant
revision, checks, and limitations. Update this view when a phase outcome or
owner decision changes. Keep completed work, external evidence, and open
choices distinct.
