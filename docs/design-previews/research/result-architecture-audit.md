# Lesson result architecture audit

Date: November 6, 2026. Status: research and proposed architecture. No product
implementation changes accompany this note.

## Recommended boundary

Keep result inspection inside the existing lesson and execution platform. Use a
small set of explicit, versioned result definitions to connect authored learning
tasks with bounded captured values and a suitable view. Keep browser persistence
optional and selective. The initial production slice remains held-out evaluation
within the existing three-milestone pilot.

Every lesson needs a meaningful visible response to the learner's work. That
does not require a saved model, a score plot, or a new saved-run milestone in every
lesson. A tensor transformation, a gradient calculation, a runtime measurement,
and an engineering decision need different views and different limits on what
the result establishes.

The [November 2 plan](../../superpowers/plans/2026-11-02-learning-evidence-pilot.md#evaluation-phase-review-2026-11-02)
already specifies the held-out evaluation view and a reviewed local prototype.
Extend that work. Its capture and storage changes remain proposed. The existing
normalization and network slices already implement production components in the
repository, with browser-local persistence.

## Verified current implementation

| Concern | Current behavior | Evidence |
| --- | --- | --- |
| Shared execution | A run creates a fresh worker. It loads vendored TFJS 4.22.0, with a same-version CDN fallback, and pins the browser path to CPU. Loading and learner execution have separate budgets. | `packages/ui/src/mdx/exercise-runner.ts:1250-1295`, `1688-1729`, `1798-1853` |
| Capture transport | The authored test environment receives `recordResult`. The collector copies bounded plain values for text, tables, and series. It transports neither tensors nor HTML. Worker and host validate the artifacts. | `packages/ui/src/mdx/exercise-artifacts.mjs:1-76`, `packages/ui/src/mdx/exercise-runner.ts:1656-1659`, `1859-1878` |
| Global bounds | A run can carry four artifacts. A table has at most 12 columns and 40 rows. A series has at most 64 points and eight series. Strings and numeric finiteness also have bounds. | `packages/ui/src/mdx/exercise-artifacts.mjs:8-63` |
| Current output | `Exercise` captures submitted source, checks, artifacts, runtime, backend, and assistance. Its ordinary output labels code edits stale. Attempt persistence remains a separate callback. | `packages/ui/src/mdx/exercise.tsx:165-188`, `735-831`, `1441-1448` |
| Snapshot integration | Only `normalize-data` and `simple-network` receive `LearningEvidenceExercise`. The wrapper builds a saved snapshot asynchronously and guards against unmount/account changes. | `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx:696-707`, `apps/web/app/components/learning-evidence-exercise.tsx:28-118` |
| Saved record | Schema 1 stores run identity, owner, exercise hashes, submitted source, runtime, fixture/source metadata, selected inputs, artifacts, checks, assistance, and outcome. The registry currently knows only two exercises. | `apps/web/lib/learning-evidence-types.ts:13-101` |
| Ownership | Guests use `guest:browser`. Accounts use `account:<id>`. Signing in does not adopt guest records. IndexedDB isolates the browser, with separate records per owner. | `apps/web/lib/learning-evidence-store.ts:14-41` |
| Retention | Each milestone retains its first save and latest save. Saving again replaces the latest slot. Deleting the first promotes the remaining latest record. | `apps/web/lib/learning-evidence-store.ts:271-320` |
| Local budgets | Source has a 256 KiB limit, artifacts have a 64 KiB limit, and the complete owner record has a shared 2 MiB limit. | `apps/web/lib/learning-evidence-types.ts:7-11` |
| Atomicity | The store verifies records before a mutation and rechecks the owner state within an IndexedDB write transaction. Concurrent changes retry. Failed writes retain the earlier state. | `apps/web/lib/learning-evidence-store.ts:183-219`, `239-299` |
| Recovery | The saved panel offers explicit source restore. The editor preserves the newer draft for recovery. Restore does not execute code or load weights. | `apps/web/app/components/learning-evidence.tsx:417-445`, `packages/ui/src/mdx/exercise-draft.ts:31-52` |
| Presentation | Saved-run views select normalization or network explanations by slug. Those explanations consume recorded artifacts. A generic `ExerciseOutput` remains available for full tables and series. | `apps/web/app/components/learning-evidence.tsx:344-366`, `packages/ui/src/mdx/exercise-output.tsx:23-75`, `77-250` |
| Project discovery | Building DEEP SCAN currently renders a pipeline, a separate saved-run block, then a separate server-evidence block. Evaluation already has a project stage. | `apps/web/app/dashboard/project/page.tsx:46-64`, `apps/web/lib/system-evidence.ts:43-73` |
| Paid source | The project route resolves network starter source only after verifying Deep Orbit entitlement. It sends starter and version hashes, with no authored solution or grading source. | `apps/web/app/dashboard/project/page.tsx:26-40` |

Browser-local owner labels and source hashes organize and check records. They do
not authenticate execution. Same-origin client code can access browser storage.
The fit recorder explicitly describes itself as diagnostic provenance rather
than a trust boundary (`exercise-fit-recording.mjs:1-5`). Saved runs must not
become independent mastery, certification, public ranking, or authoritative
assessment evidence.

## Evaluation gaps that precede UI implementation

The [existing review](../../superpowers/plans/2026-11-02-learning-evidence-pilot.md#findings-that-change-the-plan)
executed four grading bypasses. This audit confirms the relevant current code
paths. It did not rerun those complete bypass submissions.

1. The current check finds a fit by returned history identity, then compares its
   inputs to learner-editable `trainX` and `trainY`. It does not bind the fit to
   the model used for evaluation (`deep-scan-eval.yaml:242-254`).
2. The current fixture check pins shape and the three authored tail rows, while
   generated rows still come from editable learner bindings
   (`deep-scan-eval.yaml:256-290`). A matching shape cannot establish source.
3. Both published artifacts live after the final diagnosis assertion. A wrong
   diagnosis therefore hides useful measured values
   (`deep-scan-eval.yaml:394-408`).
4. The fit recorder stores at most 16 fits. Each tensor snapshot stores at most
   8,192 values. Unsupported inputs yield no snapshot. The current read API
   exposes only retained entries, without an explicit overflow signal
   (`exercise-fit-recording.mjs:8-15`, `74-107`). Exactly 16 observed fits and
   more than 16 fits need distinguishable statuses before claiming complete
   observed history.
5. A worker-level thrown error returns logs and an error, without collected
   artifacts (`exercise-runner.ts:1660-1662`). Ordinary caught test failures can
   retain artifacts already published by earlier tests. The bounded initial
   feature should promise retained valid output after a wrong diagnosis and
   retained earlier saved work after a failed rerun. It cannot promise arbitrary
   partial results from a terminated worker.

The existing plan's four-artifact shape fits the current collector: measured
scores, context, 40 generated cases, and three authored cases. Keep those
limits. Validate both case tables as one set of 43 unique, complete rows.

Capture must precede unrelated diagnosis assertions. Capture one final-model
state, its actual inputs, evaluation metrics, and row scores. No weights may
change between `evaluate` and `predict`. Inspection after selection or reload
must consume the snapshot without another fit or inference pass.

Bind the observed fit and its returned history to the evaluated model, including
Sequential's internal model identity. Compare canonical fixture values through
an independent grader-owned definition. Check reordered training pairs as pairs,
while keeping evaluation row identities stable. Reject observed test-row
training. Missing, exhausted, or unsupported recording yields unknown provenance.
Observed history cannot prove that arbitrary learner code never used test data.

## Proposed responsibilities

| Layer | Responsibility | Boundary |
| --- | --- | --- |
| Authored exercise and lesson | Name the crew's task, the input source, feature meanings, and a useful inspection question. Declare a result-definition identifier. | Authors cannot inject executable view functions through metadata. Story stays in the existing lesson sections. |
| Worker capture | Copy bounded observations from the actual run and the grader-owned fixture checks. | Plain finite values only. No model objects, tensors, HTML, component names, or browser storage writes. |
| Result adapter | Validate the semantic contract, completeness, row identities, rule, metrics, and source evidence. Produce either a usable typed result or an explicit unavailable/partial state. | Invalid records never receive canonical fixture or source labels by default. |
| Inspection view | Render the validated result with a suitable result family and text equivalents. Keep selected case/feature local to the view. | Selection never mutates measured values or reruns learner code. |
| Saved-run repository | Retain immutable snapshots, owner isolation, limits, migrations, download/delete, and safe explicit restore. | Saving grants no lesson credit. No account sync in this slice. |
| Lesson and project navigation | Keep the scene before the technical task. Put one compact saved-result entry inside its existing project stage. | Source and access checks remain on the server. Local records and server practice history retain separate labels. |

The result-definition registry should be keyed by a stable definition ID and
semantic version. Each definition selects an allowlisted validator, renderer,
expected artifact roles, source contract, retention policy, and project stage.
The same definition serves current and saved inspection. Reuse the existing
envelope and storage while the first few definitions prove their contracts.

A content-owned `resultDefinition` reference would need coordinated additions to
both `packages/content/velite.config.ts:204-242` and
`packages/content/src/schemas.ts:101-135`, generated content, cross-reference
validation, and lesson rendering. A small typed registry in application code is
the lower-risk first step. Move author-facing declarations into the content
schema once the initial result families and their authoring rules are stable.

Do not infer the view from tensor shape, module name, or artifact title. Shape
does not supply semantic meaning. The current explanations match exact artifact
titles and columns, so a bounded legacy adapter can keep those records readable
during migration. Future capture needs stable artifact-role IDs with an explicit
protocol version. Display titles remain editable prose.

## Versioning and historical compatibility

Current `exerciseVersion` hashes only the built starter and grader code
(`learning-evidence-types.ts:126-135`). The validator also compares all source
context fields against the single current registry entry (`297-300`). Changing
the fixture version, source label, units, or feature metadata would make older
records invalid rather than merely historical.

Before a wider rollout, retain historical definition readers keyed by the
record's contract/fixture version. Validate old records against the definition
that produced them, then label them historical against the currently authored
exercise. Never relabel old features using the current source metadata.

Keep schema version, semantic result-definition version, fixture version,
exercise source hash, and renderer implementation version separate. A spacing
change need not invalidate a measured run. A feature-order or source-meaning
change needs a new semantic contract. An unsupported future contract should
offer safe code/download recovery without guessing how to draw its values.

Avoid rewriting saved JSON merely by reading it. Migrate only through a tested,
atomic write, preserving source and assistance. Existing normalization and
network records must remain readable, downloadable, and deletable. Do not
silently manufacture missing provenance fields for legacy runs.

## State model

Keep these dimensions separate:

- Execution: idle, loading runtime, running, finished, stopped, or failed.
- Checks: passed, partial, failed, or unavailable.
- Capture: complete, partial, unsupported, or unavailable.
- Observed provenance: supported and checked, unknown, or an observed mismatch.
- Recency: matches current code, code changed, or historical content contract.
- Retention: current unsaved run, saving, saved locally, or save failed.
- Assistance: recorded hint levels for this session and recorded solution exposure.

A correct diagnosis can accompany a weak model. An incorrect diagnosis can
accompany valid measured data. A high accuracy can accompany missed anomalies.
A saved record can be historically valid after content changes. One green
success badge cannot express these states.

For the first slice, implement these distinctions through a typed decoded view
and explicit visible messages. Avoid a general event-sourced workflow engine.
Preserve the existing mounted announcements for graded verdicts. Selection
should update one concise selected-case status rather than announcing all rows.

## Storage and rollout constraints

The 2 MiB owner limit applies across milestones. Saving the maximum permitted
source for two records at each of 65 exercises would require more than 32 MiB
before artifacts or JSON overhead. The current store is suitable for the bounded
pilot, not a promise of two full-source snapshots for every course exercise.

Use current inspection in each suitable lesson, but save only selected meaningful
milestones initially. Measure actual snapshot sizes and retention needs before
changing capacity. Keep the existing download route for storage failure. Show
that records live in this browser, including when the learner is signed in.

Guest adoption remains an explicit separate action. Account switching must key
and remount result consumers, invalidate asynchronous work, and leave the earlier
owner's state undisplayed. Reuse the existing transaction guards. Add paid
evaluation source to the same server entitlement pattern as the network source.

Account synchronization would require a separate API, RLS policies, retention,
export/deletion propagation, offline/retry/conflict design, and a migration
strategy. It would not make client-reported execution authoritative. Full model
persistence would add weights, optimizer state, runtime compatibility, and much
larger storage. Neither is necessary to inspect captured values.

## Alternatives and decision

| Alternative | Assessment |
| --- | --- |
| One universal inspector with automatic chart inference | Small initial API, but easily assigns false semantics and forces unrelated tasks into a score dashboard. Reject. |
| A bespoke inspector and store for every lesson | Fits each task, but duplicates capture, stale labels, ownership, and recovery. Reject duplicated infrastructure. |
| Shared lifecycle with explicit result families and versioned adapters | Preserves lesson meaning and existing infrastructure. Select. Keep the first families small and add only from actual lesson needs. |
| Server execution and synchronized artifact storage immediately | Could support later cross-device work or authoritative scoring, but introduces a separate runtime and data project. Defer. |
| One trained model carried through all lessons | Would require migration of fixtures, exercise goals, model shape, and story claims. Current milestones use separate models and datasets. Defer as its own curriculum redesign. |

## Validation required before release

First validate provenance and fixture behavior with the reference, plausible
wrong answers, extra fits, wrong-model history, changed generated rows, reordered
training pairs, and unsupported recording. Verify strict threshold equality,
near-boundary full-precision values, complete row coverage, confusion/metric
agreement, zero errors, all errors, and both error categories.

Then verify save, failed write, retained earlier work, reload, changed code,
changed semantic contract, download/delete, restoration with newer-draft
recovery, concurrent tabs, guest/account switching, paid source, and legacy
records. Use the existing worker and collector tests plus focused browser flows.

Review the complete lesson at desktop and phone widths in both schemes. Include
the scene, technical handoff, actual result, supplied teaching activities,
fictional epilogue, and the project-stage return path. Inspect keyboard focus,
selection without pointer precision, readable overlapping points, equivalent
text, and reduced motion. Software checks do not establish that learners
understand the result. Use the existing planned discovery tasks before extending
the pattern across the course.

## Checks performed in this investigation

This note used source inspection. Two small runtime probes ran in fresh Node
processes with the installed `@tensorflow/tfjs` 4.22.0 CPU backend:

- A one-epoch Sequential fit returned the exact history object retained by the
  current recorder. `entry.model === model.model` was true and
  `entry.model === model` was false, verifying the internal identity boundary.
- At prediction score exactly 0.5, `tf.metrics.binaryAccuracy` returned 1 for
  supplied label 0 and 0 for supplied label 1. The inspector must therefore use
  strict `score > 0.5` for this pinned metric and classify before rounding.

No database records, private learner data, participant sessions, production
routes, or complete browser flows were accessed. No product code changed.
