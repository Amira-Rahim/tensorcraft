# Deep Orbit learning evidence pilot

Date: 2026-11-02. Status: normalization and first trained-network slices implemented locally. Remaining pilot proposed.

This document specifies a bounded improvement to the current Deep Orbit course.
The normalization and first trained-network slices are implemented in the repository. Later phases remain proposed.
The [interactive proposal](../../design-previews/learning-evidence-pilot.html) illustrates the intended states using supplied examples.

## Implementation status

The normalization exercise now captures actual input rows, statistics, scaled
values, scores, submitted code, checks, runtime identifiers, and assistance.
Learners can save their first and latest runs in an owner-scoped IndexedDB store,
inspect them in the lesson, download or delete them, and explicitly restore code
while preserving their newer draft. Signed-in learners also see these local runs
in Building DEEP SCAN. Guest records use the stable browser-local guest scope.
Signing in leaves guest records in that scope.

Saved results identify changed code and changed exercise content. A failed rerun
keeps earlier saved work available. The explanation reads captured values and
lets learners select a reading and feature. Full result tables stay available in
a disclosure and scroll horizontally on small screens. Hint history covers the
current session. Recorded solution exposure persists with the draft scope.

Validation completed on 2026-11-02:

- 246 targeted tests passed across snapshots, ownership, recovery, lesson
  integration, captured explanations, runner behavior, content accuracy, and prose gates.
- Chromium flows passed at 1440px and 390px, including save, failure, stale output,
  reload, code restoration, and recovery of the newer draft.
- Direct browser IndexedDB checks passed, covering save-order retention,
  owner isolation, immutable records, failed-write recovery, and deletion.
- Web TypeScript validation passed. Targeted lint has no errors and retains the
  existing unused TF_MOCK warning in the runner. Content was rebuilt with Velite.

These slices have no account synchronization or JSON import. Guest adoption,
held-out evaluation, optimization, executable reviews, and the learner pilot
remain follow-up work.
No completion credit comes from saving or restoring a snapshot.

### First trained-network slice

The building-a-network exercise now retains the first model's observed fit
settings, completed loss history, sixteen selected input rows, and the matching
scores before and after training. It also retains the second model's untrained
scores for comparison. The recorder copies settings at fit start and loss after
completed epochs. It keeps the original history object available to existing
graders. Longer histories retain at most 64 labeled samples.

The explanation compares the same captured row across all three score columns.
It shows weak or worsening results as recorded. Settings include the model's
actual parameter count, layer widths, activations, optimizer, learning rate,
loss, batch size, shuffle setting, and epoch counts. These are training results
from a separate synthetic eight-feature rehearsal. They do not establish
performance on new data. Full model weights are not persisted, and restoring
code does not execute it. A fresh run can produce different values.

Building DEEP SCAN now includes a Model milestone for accounts entitled to
Deep Orbit. Paid starter source is resolved only within that world's entitlement.
The browser store retains first and latest saves independently for each milestone.
Existing normalization records remain readable and migrate atomically on a
successful write. Concurrent writes retry without replacing another milestone's
records, and the 2 MiB ceiling applies across the owner's milestones.

The exercise checks the actual requested epochs and batch size, closing the
case where a different schedule produces the same optimizer-update count.
Runs that train different inputs or reserve a validation split do not publish
the selected rows as training examples. Valid captured settings and loss remain
available with failed checks.

Validation completed on 2026-11-02:

- 282 targeted tests passed. The affected display and access tests passed again
  after final visual corrections.
- Five Chromium cases passed: normalization and network recovery at 1440px and
  390px, plus the real paid lesson's guest redirect. Network cases mount the
  shipped editor, worker, and storage in a test-only fixture with local content.
  They do not claim an authenticated end-to-end test of the paid lesson route.
- Fourteen direct browser IndexedDB checks passed, including legacy migration,
  concurrent writes, independent retention, tamper rejection, and failed writes.
- The exercise validator passed the reference, starter, and cheat checks with
  all eight graded checks and four captured artifacts. Harness parity passed.
- Web TypeScript validation and targeted lint passed. The wider repository
  type check still reports unrelated test errors. No changed evidence files
  appear in those remaining errors.
- Desktop and mobile captures were inspected. Loss-axis labels preserve their
  leading decimals, and the observed training settings render in the saved view.

The saved-run discovery tasks below are prepared. Participant sessions remain
unrun, so these checks establish software behavior rather than learning outcomes.

## Evaluation phase review, 2026-11-02

Status: production implementation remains proposed. A local visual prototype
and browser verification now accompany this review. No learner observation has
occurred. This review changes the next evaluation slice's scope and order and
supersedes the earlier broad P4 description for held-out evaluation.

The next result should help a learner explain a model's mistake and choose a
relevant investigation. Saving the result supports that task. A new metric panel
alone would leave the important learning question unanswered.

### Findings that change the plan

The current lesson already has a threshold activity on twelve supplied cases,
the runnable 43-row evaluation, a fictional 50-row crew result, a cost decision
on 100 validation builds, and an independent assignment with 720 synthetic
builds. Each source serves a different purpose. The next slice should connect
the actual run to the existing teaching and make those transitions explicit.

The saved Model milestone uses an eight-feature, 529-parameter network. The
evaluation exercise creates a separate three-feature, 673-parameter model.
These records show related skills. They do not represent saved weights passing
from one milestone into the next. A shared executable model across the course
would require a separate content and artifact migration. This slice does not
make that claim or attempt that migration.

The read-only audit also executed the current evaluation in the existing
TFJS 4.22.0 harness. It reproduced these grading gaps:

- Training on test rows first, recompiling with a fresh optimizer, and then
  performing the requested training still passes all nine checks.
- Returning history from a different model while training the evaluated model
  on test rows can also pass all nine checks. The recorded history check does
  not currently bind that fit to the evaluated model.
- Changing a generated training or test feature mean passes the checks. The
  checks compare against editable tensors and pin only part of the fixture.
- An incorrect final verdict passes eight checks but publishes no artifacts,
  because capture runs inside the final verdict assertion.

These observations are engineering audit results, not learner outcomes. They
make provenance checks and independent capture the first implementation work.
Browser records remain inspectable learning records, not tamper-proof proof of
execution or independent competence.

### Learner flow and visible result

1. Keep Mirza's scene and artwork first. Establish the task: inspect what the
   classifier missed and what the crew should investigate next.
2. Identify the fresh three-feature model, 100 training rows, and 43 evaluation
   rows before the run. The evaluation set contains 40 generated examples and
   three hand-written story cases. Name feature order and dimensionless practice
   values without inventing physical units or archive timestamps.
3. Keep the existing fit, evaluate, and diagnosis task. The current result
   immediately shows the measured accuracy, correct predictions, missed labeled
   anomalies, false alarms, and the fixed decision rule. The learner can inspect
   this result before saving it.
4. Selecting a category reveals its cases. Selecting a case shows its input
   values, supplied label, score, predicted class, and error category together.
   Keep all 43 rows available and identify the three authored cases. Empty error
   categories show zero. Do not guarantee that any particular row is missed.
5. Use one short, ungraded explanation prompt: "Which result would you ask the
   crew to investigate next, and what further evidence would help?" Keep the
   response optional and outside completion credit. Start with this prompt in
   the explanation and observation script, without a new journal or grading
   system. An error category does not establish why the model failed.
6. Save the same immutable result through the existing controls. Reopening it
   preserves source, code, assistance, stale-state labels, and draft recovery.
7. Place a compact summary within the existing Evaluation project stage, with
   a link to full inspection. Consolidate saved-result placement for the pilot
   stages so the page has one entry per stage. Keep server practice history and
   browser-local runs visibly distinct within that entry. Limit this change to
   placement and navigation for the three pilot stages. Preserve existing
   attempt and review behavior.
8. Continue into the existing validation cost decision and independent transfer
   assignment. State the domain and data change at each handoff. Preserve their
   current requirements and the shared five-section lesson structure.

The primary view should show counts and one selected case. Detailed metrics
and formulas remain in the current references. The gap label keeps its literal
meaning and receives no readiness color or success badge. A valid high score
with a missed anomaly is useful evidence. A zero-error run is equally valid
for the supplied rows and still leaves unseen operating conditions untested.

The crew's fictional 94% and sample 7741's 0.518 remain canon. Identify their
source where the consequence and epilogue display them. Do not substitute the
learner's score into those events or assign sample 7741 a new label.

### Visual, interactive, and story design contract

The frontend-design review makes the visual treatment explicit. The central
element is a full-width plot of the learner's captured evaluation scores.
Horizontal position represents score from 0 to 1. Two labeled lanes show the
supplied classes. A fixed, labeled boundary at 0.5 makes each decision visible.
A flagged-label case on the calm-prediction side is a missed anomaly. A
calm-label case on the flagged-prediction side is a false alarm.

Keep point positions faithful to captured values. Stack overlapping points
vertically within their class lane without moving their score horizontally.
Use distinct marker shapes and a text legend for generated and hand-written
cases. Selected-case text repeats the source. The three feature values do not
provide a waveform or a time series, so neither representation is appropriate.
Feature displays explain the inspected inputs, not each feature's causal
contribution to the prediction.

| Lesson section | Story and learner action | Visible response |
| --- | --- | --- |
| Briefing | Keep the bridge scene, Mirza's question, and artwork visible before technical work. | The task names the evidence needed for his review and identifies this exercise's model and data. |
| Concept | Keep the existing predict-and-change threshold experiment on its separate teaching cases. | Its supplied scores show why missed anomalies and false alarms differ. The handoff identifies the actual-run plot that follows. |
| Challenge | Run the exercise, select an error category, and inspect a case. | The actual score plot, selected point, decision explanation, and three input values stay coordinated. Inspection works before saving. |
| Recall and takeaways | Preserve the existing checks and connect their questions to the evaluation task. | Graded checks announce correct or incorrect with useful feedback. The open investigation prompt remains optional and ungraded. |
| Epilogue | Preserve the crew's supervised prototype decision and unresolved sample 7741. | Keep the authored scene and artwork visible. Identify the fictional crew result alongside its appearance. |

Category selection highlights matching cases while leaving the full distribution
visible. Display the subset count and whole-run count distinctly. A case selector
and Previous case / Next case controls provide the same inspection without
pointer precision or dozens of keyboard stops. Changing selection updates the
point emphasis, exact score, supplied label, prediction, source, and feature
values together. Explain the classification rule from those values. Do not infer
the model's reason for assigning that score.

Retain all captured output without a quiz, save action, or animation gate.
Use brief action-driven highlighting to show selection changes. Preserve the
shared story treatment and its reduced-motion behavior. New plotting motion
must not simulate a fresh inference, training pass, or change in stored scores.
The existing separate concept activity provides parameter exploration. This
captured report keeps its original rule and values.

The following tokens reuse Deep Orbit's existing theme. These are role choices,
not new hard-coded component colors. Use the current CSS variables and their
light-scheme overrides.

| Role | Existing token | Dark value | Light value |
| --- | --- | --- | --- |
| Page | `--tc-bg` | `#181818` | `#f5f5f2` |
| Inspection surface | `--tc-surface` | `#232323` | `#ffffff` |
| Text and axis labels | `--tc-text` | `#e0e0e0` | `#1f1f1f` |
| Selection and focus | `--tc-primary` | `#6baa8a` | `#3b6550` |
| Existing world accent | `--tc-accent` | `#a89060` | `#6b5a3b` |
| Incorrect prediction emphasis | `--tc-error` | `#fca5a5` | `#b00f0f` |

Use Inter for headings, prose, controls, and readable numeric labels. Keep
JetBrains Mono for executable code. Retain the shared lesson scale, with 28px
activity headings, approximately 20-22px desktop activity prose and controls,
and the existing responsive reductions. Use tabular numbers where alignment
helps comparison. Keep prose below 80 characters per line. Use sentence case
and the shared caption alignment. Color accompanies labels, shapes, and focus
outlines. It never carries correctness or source by itself.

Keep the five-section full-width stack, with left-aligned teaching prose and
controls. The plot spans the activity width. Selected-case details sit below it
at every viewport size. The explanatory content remains in normal reading
order without a narrow side panel. Mobile keeps both class labels, the score
axis, and the threshold legible, with a touch-friendly selector for dense points.

```text
Existing bridge scene, dialogue and artwork
Review question and actual-run source
All cases   Missed anomalies   False alarms   Correct

[ Full-width captured score plot             ]
[ Supplied calm cases                       ]
[ Supplied flagged cases                    ]
[ Score 0           Fixed 0.5              1 ]

Selected case          Previous case   Next case
Actual score, supplied label, decision and source
Three named feature values and rule explanation

Optional next-investigation prompt
Save this run   Captured details
Existing transfer work and story continuation
```

The initial counts-and-table concept left room for a generic metric dashboard.
The revised layout makes the actual distribution and one case's decision the
visual focus. The score lanes encode the lesson's classification problem, and
the crew's review gives inspection a purpose. Preserve TC's established palette
and typography. Avoid decorative instrument chrome, repeated statistic cards,
new accent bars, and unrelated science-fiction effects.

Design acceptance requires screenshots of the complete lesson and inspector at
desktop and mobile widths in both schemes. Review story placement and the
source distinction alongside zero-error, partial, stale, and failed-run states.
Check visible keyboard focus, case navigation, readable point overlap, text
equivalents for the plot, and reduced motion. Source review and a wireframe do
not establish that the finished experience meets this contract.

### Local prototype verification

The [interactive prototype](../../design-previews/evaluation-inspector/index.html)
uses current world tokens, shared lesson/story/dialogue styles, original artwork,
and selected lesson passages. It identifies its actual maintainer run separately
from synthetic display fixtures and the fictional epilogue. It does not render
the complete production exercise editor or replace the paid lesson route.

The first screenshot review found excessive mobile plot height and controls
too far from the distribution. Tighter point packing reduced the 390px plot
from 797px to 539px while preserving exact score positions. Category controls
now appear above the plot. Its caption explains vertical stacking. The 320px
navigation uses two rows, case-selector labels fit narrow screens, and adjacent
case controls share their height. Story passages keep their full width, and
Challenge includes the original scene artwork before the inspection task.

The [review record](../../design-previews/evaluation-inspector/README.md) links
the reproducible browser checks and screenshots. Verification covers desktop
and mobile in both themes, measured and alternative states, case selection,
keyboard focus, reduced motion, and preview-only save/download. Production
capture, grading repairs, owner storage, complete lesson integration, and
learner understanding remain unverified by this prototype.

### Evaluation and capture contract

Keep the report's classification rule fixed at `score > 0.5`. The installed
TFJS 4.22.0 binary accuracy implementation uses this strict comparison. A score
equal to 0.5 predicts class 0. Test equality directly, and derive classifications
from the full captured score rather than its rounded display value.

Threshold exploration already exists on separate teaching cases. Adding a
slider over the saved test rows would encourage model selection using test
results. [Scikit-learn's evaluation guidance](https://scikit-learn.org/stable/modules/cross_validation.html)
explains how repeated choices based on a test set can leak its information into
the selection process. Keep first/latest saves as history and recovery. Do not
rank them as competing models or describe the latest score as an improvement.

Capture one final-model state and its actual inputs. Collect aggregate metrics
with `evaluate()` and row scores with `predict()` before any further mutation.
The row inspector must consume that captured record after reload without
training or predicting again. Keep the final fit-log training accuracy labeled
as a training log. It was accumulated during training and is not a fresh
evaluation of the final weights on the training set.

Use the existing four-artifact limit and 40-row table limit:

| Artifact | Contents |
| --- | --- |
| Measured scores | Final training log and held-out loss/accuracy, each with its source and row count. |
| Run context | Actual model/fit settings, fixed threshold and comparison, supplied label meaning, learner's diagnosis, and provenance-check status. |
| Generated evaluation cases | All 40 generated rows with stable fixture row IDs, actual features, supplied labels, and model scores. |
| Authored evaluation cases | The three hand-written cases with the same fields and explicit source. |

The inspector derives confusion counts from those exact rows and the recorded
rule. The counts must sum to 43 and agree with the captured held-out accuracy
within a stated numeric tolerance. The two row tables represent a complete set,
not a sampled excerpt. Do not raise global artifact limits for this exercise.
The evidence adapter must validate both tables together, including row identity,
feature order, finite scores, labels, completeness, and duplicate/missing IDs.

Bind the recorded fit to the actual evaluated model, including Sequential's
internal LayersModel identity. Check its full observed fit history, exact
requested schedule, paired input values, and fixture membership. Compare the
canonical generated fixture independently of editable learner bindings. Reordered
training pairs can remain valid. Test rows must retain their stable identities.
Missing records, unsupported observed paths, and exhausted recording capacity
produce unknown provenance. Passing checks validate the observed fit history.
The recorder cannot detect every custom training path, so its checks cannot
establish that arbitrary source never used test information.

Copy valid outputs before unrelated diagnosis assertions execute. A bad verdict
must retain valid measured results with the failed check. Missing or mismatched
data must produce a clear incomplete state. It must not acquire the canonical
fixture label merely because its shapes match. Preserve prior saved records
when the new run throws or capture fails.
The adapter must distinguish the assigned exercise's expected fixture identity
from the verified source of the captured rows. The current snapshot spreads
canonical source metadata automatically, so extending its slug list alone does
not satisfy this requirement.

Extend the existing per-milestone owner store for this exercise. Preserve legacy
normalization and network records, first/latest retention, the shared 2 MiB
owner limit, atomic failed writes, owner isolation, and explicit restore. Keep
the existing Deep Orbit entitlement boundary for paid source. No saved record
grants lesson credit, and restoring source never runs it automatically.

### Implementation order and exit checks

| Step | Deliverable | Exit check |
| --- | --- | --- |
| E0 | Fixture, model identity, grading and source-label corrections | The reproduced extra-fit, wrong-model and changed-fixture cases fail the relevant checks. The reference passes without a required accuracy or error count. |
| E1 | Bounded capture and current-run error inspector | Every displayed case traces to the captured run. Valid output survives a wrong verdict. Inspection works before Save. |
| E2 | Persistence and existing-stage integration | Save, leave, reopen, inspect and recover newer code on desktop and mobile. Earlier milestones remain readable. Paid content and account boundaries hold. |
| E3 | Focused observation and revision | Learners explain the case, the result's limits, and a relevant next investigation. Record confusion before expanding this pattern. |

Test strict threshold equality, scores near the boundary, zero and all errors,
both error types, no predicted positives, partial/missing rows, altered labels,
extra fits, a different model's history, unsupported provenance, edited code,
changed content, and a failed rerun. Keep default outcomes unconstrained.
Check keyboard case selection, accessible count labels, mobile tables, and the
story/result distinction in the full lesson. Capture source review, runtime
execution, browser checks, and participant observations separately.

### Evidence needed from learners

The first two slices still need observation. Run their existing discovery tasks
alongside a focused evaluation check. A prototype may use an explicitly labeled
maintainer run. It must not call that result the participant's work.
Observe learners who have reached the relevant lesson, or supply the same
bounded prerequisite context and record it. Freeze source and activity hashes
before sessions. Keep first responses and assistance in private study records,
separate from product analytics. Preserve the formal forms and scoring gates.

Ask the learner to identify the model and source, find an error or explain a
zero-error result, connect label and score to the decision, explain what
`no-gap-warning` establishes, and propose an investigation with suitable new
evidence. Record the first response before help, then any assisted revision.
An inability to retrieve the record calls for navigation work. Finding it but
misinterpreting it calls for changes to the explanation or lesson.

For a proposed first group of six novices from the existing discovery round,
two independent instances of the same consequential confusion should trigger
revision and observation with fresh participants. Examples include confusing
the fictional score with the actual run, treating the previous model as this
model, or selecting a threshold against the final test rows. This is a small
diagnostic rule, not an effectiveness estimate or a replacement for the formal
study's frozen gates. Declare it before observation. Owner-supplied study terms
remain necessary before recruitment. No outreach or enrollment occurred here.

The [IES learning guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) supports
combining visual representations with explanation and asking learners to explain
underlying relationships. It does not establish that TC's proposed inspector
will improve learning. That remains a product hypothesis to observe.

Defer additional threshold controls, curve dashboards, automated causal
diagnosis, new free-text assessment infrastructure, model ranking, full-model
persistence, and account sync. Revisit a course-wide shared model only as an
explicitly scoped project. The immediate objective is one understandable
evaluation record and a learner who can reason from it.

## Product result

A learner should be able to revisit a meaningful result they produced, explain
how their code produced it, and apply the underlying skill to a changed case.
The crew's task and story remain visible throughout that progression.

Start with normalization, the first trained practice classifier, and the later
evaluation lesson's separate classifier. Add the scalar gradient exercise as a second mechanism case.
Extend the existing project view and review system. Keep the current five lesson
sections and their story placement.

## Lessons from the comparison

- [Agentale](https://agentale.app/about) makes a newly learned ability visible through its companion. TC can make the learner's accumulated work inspectable in Building DEEP SCAN.
- [Mastery Games](https://flexboxzombies.com/) reuses skills in later visual challenges. TC can extend its existing spaced review with selected repair and diagnosis tasks.
- [Tinker](https://www.learntinker.com/lessons/build-the-value-class/) gives learners runnable implementation work. TC can connect its existing experiments more closely to captured exercise output.
- [Microsoft's JavaScript course](https://github.com/microsoft/generative-ai-with-javascript) already combines a continuing story with AI projects. TC's product evidence should explain the useful work learners can independently do.

These comparisons establish feature overlap. They supply no evidence that one
teaching method produces better retention or transfer than another.

## Existing foundations and proposed additions

| Area | Current implementation | Proposed addition |
| --- | --- | --- |
| Exercise output | The worker collects validated tables, series, and text through recordResult. ExerciseOutput shows the current run and marks it stale after edits. | Retain selected run snapshots after leaving the lesson. |
| Draft recovery | Exercise drafts retain code, starter identity, solution use, and stashed code with owner-specific keys. | Store immutable run identity separately from the mutable draft. |
| Project view | ProjectPipeline and SystemEvidence show stages, recorded attempts, assistance, activities, and review links. | Show actual selected learner output beside the existing evidence links. |
| Concept experiments | LessonInvestigation supports prediction, changed cases, paired runs, visual output, and method code. | Let a small number of explanation views consume actual exercise-run output. |
| Review | Due prompts appear after the Briefing scene. Structured checks support choice, shape, and number answers. | Add a bounded executable repair activity for selected objectives. |
| Independent application | Room occupancy already has data, a starter, a rubric, local inference, a run record, and export. | Observe learner work and use the findings to revise the pilot. |

## Pilot boundaries and data provenance

The selected exercises use different supplied fixtures. Their results form a
learning record. They do not automatically assemble into one compatible model.

| Milestone | Existing source | Honest contribution |
| --- | --- | --- |
| Reusable scaling | foundations/exercises/normalize-data.yaml | Four rows with two features and a supplied fixed sigmoid neuron. Learner code fits and reuses statistics. It does not train this neuron. |
| First trained practice network | neural-networks/exercises/simple-network.yaml | A separate 120-row, eight-feature synthetic rehearsal. The 24/12/1 network has 529 parameters. Before/after scores reuse training rows. |
| Held-out evaluation | training-loop/exercises/deep-scan-eval.yaml | A separate three-feature model and fixture with 100 training rows and 43 held-out rows. The learner reports measured scores and applies the stated diagnostic rule. |
| One optimization step | training-loop/exercises/gradient-step.yaml | A scalar squared-loss practice case. An initial weight of 5 and learning rate of 0.1 produce gradient 10 and updated weight 4. |

Use paths relative to packages/content/content/deep-orbit in this table.
Keep the synthetic rehearsal, fictional ship evidence, supplied model, and
independent real-data project explicitly identified at every handoff.
Never replace a run's score with the story's authored result or a maintainer example.

## Learner flow A: retained work in Building DEEP SCAN

1. The normalization Briefing establishes why the crew needs consistent feature scales.
2. The learner explores the concept, writes the required functions, and runs the existing exercise.
3. The worker returns the learner's actual statistics and scores through the current artifact collector.
4. The result keeps its visible checks. The learner can save this run in the existing lesson workspace.
5. For signed-in learners, Building DEEP SCAN shows a Data milestone with the saved table, feature order, source label, and assistance record.
6. Opening the milestone reveals the saved inputs and outputs, the original run date, and the matching code version.
7. Inspect opens saved source read-only. Restore explicitly places it in the existing workspace while preserving any newer draft through the current stash/recovery behavior. A subsequent run creates a new snapshot.
8. Later milestones add their own measured results. The project view explains how each practiced skill contributes to the crew's system.

The project view should initially show one useful output per milestone, with
details available on demand. Avoid a gallery of every passing test or console log.
An empty stage names the next useful task and links to it.
Guests inspect saved work in an in-lesson saved-runs panel. The current project
dashboard remains signed-in only. A guest save never redirects to that dashboard.

### Snapshot states

| State | Visible behavior |
| --- | --- |
| No saved run | Explain what the milestone will retain and link to the exercise. |
| Run available | Display captured output and offer Save this run. |
| Saved in this browser | Show the date, fixture identity, result, and assistance label. |
| Current code differs | Preserve the saved result and say which code version produced it. Offer a fresh run. |
| Latest run failed | Show the failed check and any valid captured output. Keep the earlier saved run accessible. |
| Lesson content changed | Label the snapshot historical. Resume against current content creates a new attempt. |
| Save unavailable | Keep output visible, explain the storage failure, and offer a local download. |
| Signed out or account changed | Load only the current owner's saved runs. Never display another account's local work. |

Do not discard an earlier result merely because the learner edits code.
Do not present an earlier result as the output of the current editor contents.

### Proposed snapshot contract

Compose the persisted snapshot type in apps/web/lib/learning-evidence-types.ts.
The UI package exposes a typed run callback with its existing ExerciseArtifact
payload. The web host adds lesson, ownership, and provenance metadata. Keep pure
review activity discriminants in shared. This boundary avoids a shared-to-UI
dependency cycle, since UI already depends on shared.

    LearningEvidenceSnapshot {
      schemaVersion: 1
      runId: string
      ownerScope: guest browser identity or signed-in account ID
      worldId, moduleId, lessonId, exerciseSlug: authored identifiers
      milestoneId: one of the explicitly supported pilot milestones
      capturedAt: ISO timestamp
      exerciseVersion, starterHash, testHash, runtimeVersion, backend: strings
      codeHash: string
      submittedCode: locally retained source for this run
      fixtureId, fixtureVersion, sourceLabel: authored metadata
      selectedRowIds, actualSelectedValues: captured bounded run data
      featureOrder, units: authored context where applicable
      artifacts: validated bounded ExerciseArtifact array
      checks: names and outcomes from this run
      runOutcome: passed, partial, failed, or errored
      assistance: hints revealed, solution viewed, or unknown
      origin: browser exercise run
    }

Code hashes associate outputs with a submission. They do not establish trust
in a browser-reported result. Copy values from the run, never recompute a
different illustrative result and attach it to that submission.
Do not add separate authored solution or hidden-test fields to exports. Exact
submittedCode can include a solution the learner revealed and used. Preserve
that exact source with its solution-viewed assistance record.
Keep partial output labeled with the checks that failed. A completed worker run
can produce valid tables while other checks fail. Retain that distinction.
Treat saved source and artifacts as operational learning records. Keep raw code,
answers, project files, and explanations out of product analytics.
Capture selected row IDs and their actual bounded values for generated fixtures.
Data seeds alone do not reproduce random initialization, training shuffles, or
backend rounding. A later rerun can produce different scores and creates its own
record. Never replace a saved measured result with a fresh replay's values.

### Persistence decision

Use an owner-scoped IndexedDB store for the pilot. Local-only storage allows
inspection and recovery without creating an account synchronization dependency.
Use the label Saved in this browser for guests and signed-in learners alike.
Signed-in ownership prevents accidental cross-account display on shared devices.
It does not make local storage private from another person controlling the device.

Retain the first saved run and latest saved run for each selected milestone.
Keep existing artifact collection limits. Add provisional byte ceilings of
256 KiB for submitted code and 64 KiB for rendered output per snapshot.
Cap the owner store at 2 MiB. On exceeding a cap, preserve existing data and
offer download or deletion. Check these limits against actual pilot payloads.

Keep lesson drafts independent. Signing in does not silently adopt guest
snapshots. A learner may explicitly import their guest work into their current
local account scope after seeing its source label. Account switching must clear
in-memory selectors and result panels before reading the next owner scope.

Downloads retain provenance and assistance labels. Imports validate shape,
size, schema, authored identifiers, and content compatibility. Imported files
remain labeled Imported record. Import never grants completion or mastery.

Account sync is a separate follow-up. It requires an authenticated API,
server-side validation, entitlement checks for resolved content, owner-only RLS,
bounded retention, deletion/export support, retry behavior, and conflict handling.
Server validation of a payload still does not prove the browser executed it.
Do not count imported or synchronized records as independent assessment passes.

## Learner flow B: one explanation of the actual run

Start with normalization because its fixture and expected calculations are small.
Keep the full task requirements, including population statistics, the zero-scale
rule, min-max scaling, and scoring a later reading without refitting.

1. Concept shows the existing named two-feature excerpt and a prediction question.
2. Challenge uses the current starter and grader.
3. A result adapter reads the run's saved means, standard deviations, scaled rows, and scores.
4. The explanation places each output beside its corresponding input and operation.
5. The learner can inspect a changed reading using their stored statistics.
6. Editing source marks the prior explanation stale until the next run.

Keep feature order and units visible. The fixed preview neuron remains labeled
supplied. A high score is a model output, with no claim of calibration or accuracy.
The current fixture's means are 23 and 0.5. Its population standard deviations
are sqrt(5) and sqrt(0.05). Verify display rounding against TFJS 4.22.0.

For the first network, reuse the existing sixteen selected training rows with
before/after scores and the untrained comparison model. Label the row selection
and training reuse. Render the scores obtained, including weak separation.
The later evaluation milestone keeps its separate held-out data and diagnostic rule.

Then extend gradient-step with loss before and after the captured update.
Preserve differentiation of the supplied function, repeated steps, and the
current tests using other losses. A successful update can raise loss at an
excessive learning rate. Show that outcome and its cause without changing grading
requirements or implying that the scalar practice trains the ship classifier.

The shared explanation receives immutable run values. It must not silently
replace captured values with the concept experiment's defaults.

## Learner flow C: scheduled diagnosis and repair

Keep the existing review schedule and maximum of two due warm-up prompts.
Keep Briefing story and artwork ahead of review. Add only two pilot repair tasks.

- Scaling repair: fix a short function that refits statistics on a held-out batch. A fresh, explicitly labeled batch should reuse supplied training statistics.
- Batch-axis repair: correct a single-reading inference call while preserving feature order. Test more than the demonstrated values.

Give each activity a stable ID, version, fixture ID, starter, bounded test code,
expected skill, and feedback for plausible mistakes. Reuse the existing worker,
timeouts, API allowlist, and TFJS runtime. Do not evaluate submitted source on
the page's main thread or send it to an unrestricted execution service.

Extend resolved review activity data with an explicit activity kind. Keep old
prompt keys and queue rows valid. Extend the existing recall-content-version
handling to executable activities so changed fixtures cannot inherit old success.
Add authored activity schema validation, content-build/parser support, and
lesson-completion enqueue registration. Give each new task an explicit stable
promptIndex in the lesson's registry. Existing indices retain their meaning.
Build validation rejects duplicate indices and ID/version collisions. It checks
that every enqueued key resolves to one authored activity. Old queue rows still
resolve to their original recall prompt through a compatibility adapter.
Resolve paid starter and feedback content through the existing entitlement
boundary in review-store-server.ts before passing those fields to the client.
Warm-ups must not read an unrelated exercise's persisted draft or grant a full
lesson pass. Give repair drafts their own owner-scoped activity/version keys.

Record first outcome, latest outcome, help use, solution reveal, skipped task,
and execution error separately. Feed the existing scheduler a successful retrieval
only when the current activity passed before hints or its solution were revealed.
An assisted retry remains useful practice and keeps its assistance label.
Missing historical help data stays unknown. Keep prose self-assessment ungraded.

## Work packages and dependencies

All estimates are provisional engineering/editorial person-days for one person
familiar with TC. They exclude recruitment, participant time, review turnaround,
and account sync. Parallel work can shorten elapsed time after shared contracts settle.

| Package | Deliverable | Dependencies | Estimate |
| --- | --- | --- | --- |
| P0 | Fixture inventory, snapshot contract, and story/result labels for the three core milestones | Current authored sources | 1-2 days |
| P1 | Owner-scoped local snapshot store with byte limits, recovery, deletion, and download | P0 | 3-4 days |
| P2 | Exercise run hook, save states, stale comparison, and selected project milestones | P1 | 3-5 days |
| P3 | Normalization output adapter and one shared explanation | P0 and run contract from P2 | 2-4 days |
| P4 | First-network/evaluation result integration and scalar-gradient follow-up | P3 | 2-4 days |
| P5 | Two versioned repair reviews, content schema/build/parser, stable registration/enqueue, entitlement-safe resolution, and assistance records | P0, existing worker and review flow | 4-7 days |
| P6 | Browser/accessibility checks, study packet refresh, and a complete internal learner-flow rehearsal | P2-P5 | 2-3 days |

The full bounded pilot is approximately 17-29 person-days under these assumptions.
P0-P3 provide the first reviewable product slice in approximately 9-15 person-days.
Re-estimate after P0 exposes payload size, adapter complexity, and review schema changes.
Each package ends in a demonstrated learner flow, with review notes and failures retained.

## Implementation map

Existing files to extend when implementation begins:

- packages/ui/src/mdx/exercise.tsx: expose a typed onRunSnapshot callback carrying validated output and immutable submission identity. ExerciseSubmitResult currently does not include artifacts. Keep this separate from attempt analytics.
- packages/ui/src/mdx/exercise-output.tsx: preserve current visible output and stale behavior while adding saved-run controls.
- packages/ui/src/mdx/exercise-artifacts.mjs: reuse current validation and limits. Extend metadata outside the artifact payload.
- packages/ui/src/mdx/exercise-draft.ts: reuse owner conventions while keeping mutable drafts separate from immutable snapshots.
- apps/web/app/dashboard/project/page.tsx and project-pipeline.tsx: mount local saved evidence after hydration alongside server-loaded summaries.
- apps/web/app/components/mdx and packages/ui/src/mdx/exercise.tsx: provide the in-lesson saved-runs entry for guests and signed-in learners without changing dashboard access.
- apps/web/lib/system-evidence.ts and apps/web/app/components/system-evidence.tsx: keep source/assistance labels and existing evidence links.
- apps/web/app/components/lesson-visuals/lesson-investigation.tsx and numeric-investigations.ts: share explanation adapters where useful without duplicating experiment state.
- packages/shared/src/recall-checks.ts and review-types.ts: represent a versioned executable activity separately from existing structured checks.
- packages/content/src/recall-check-schema.ts, parse-recall-prompts.ts, and packages/content/velite.config.ts: validate authored review activities, preserve legacy prompt extraction, and generate stable activity/index registries.
- apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx: enqueue the registered review activities on the existing lesson-completion path.
- apps/web/app/components/review-prompt-card.tsx and lesson-warmup.tsx: mount bounded repair activities in the existing review slot.
- apps/web/lib/review-store-server.ts, review-store-api.ts, and review-store-guest.ts: preserve entitlement checks, legacy queues, owner scope, and retry behavior.

Proposed new files include web snapshot types, shared activity types, a local evidence store,
fixture-specific result adapters, a saved-run component, and focused tests beside them.
Select exact filenames during P0. Avoid a new generalized authoring platform.

## Acceptance checks

### Captured work

- A solution run saves its actual bounded output, exact submitted code, content identity, and assistance record.
- Navigation and reload retain a saved run. Account changes cannot display another owner's record.
- Guest saves remain accessible within the lesson. Signing in preserves account isolation and offers explicit adoption of selected guest records.
- Account switch, unmount, reset, superseded runs, and edit-during-run cannot attach a late reply to different code or ownership. Resume never executes saved source automatically.
- Editing code immediately marks the old result stale. A failed rerun preserves its failure and the older saved result separately.
- Inspecting saved source leaves a newer draft intact. Explicit restoration preserves that draft through the existing stash/recovery flow.
- Oversized, malformed, incompatible, and unavailable-storage cases produce useful recovery behavior.
- The project view identifies the separate two-, eight-, and three-feature fixtures. No label implies one assembled deployed model.

### Technical explanations and review

- Execute the authored solution and plausible wrong answers on pinned TFJS 4.22.0.
- Check incorrect values with correct shapes, swapped feature order, axis errors, zero variance, refitting on held-out rows, stale gradients, and missing batch dimensions.
- Verify before/after training plots use actual measured outputs without fixed accuracy targets.
- Verify a repair pass cannot credit its parent lesson or erase the first failed attempt or assistance.
- Verify old review rows still resolve, and free/refunded users cannot obtain paid repair content through a warm-up.
- Verify content build rejects duplicate task indices, changed versions do not inherit old success, and completed lessons enqueue each registered repair task only once.
- Verify keyboard operation, announced verdicts, useful focus order, reduced motion, narrow screens, and readable story placement.

Use focused unit and worker tests for data/state boundaries, one browser flow
covering save/edit/fail/reload, owner-switch checks, and a keyboard walkthrough.
Run the existing relevant exercise validators and content checks after content edits.
Record source review, executed examples, and browser verification separately.

## Learner observation and decisions

Use the existing [measurement handoff](../../learning-study/learning-product-handoff.md),
[pilot protocol](../../learning-study/pilot-protocol.md), and task forms.
Refresh the exact revision and source hashes before external observation.
Keep a small discovery round separate from the formal novice study and its gates.

### Saved-run discovery tasks

These tasks are ready for observation. No participant sessions or learning
outcomes have been recorded for these changes. Complete the existing protocol's
contact, consent, scheduling, and retention fields before inviting participants.

Use these prompts consistently after the learner reaches the relevant exercise.
Allow ordinary course hints and record them. Record the first attempt before
offering live help. Maintainer runs and automated browser tests do not count as
participant observations.

| Task | Neutral prompt | Observation |
| --- | --- | --- |
| Save and resume | Save a normalization run, leave the lesson, and reopen its result. | Can the learner find the result and identify its original code and date? |
| Explain scaling | Choose one reading and explain how the saved statistics relate to its scaled values. | Can the learner connect the correct feature, mean, scale, and output? |
| Reuse statistics | A later reading has changed. Explain which statistics you would use and why. | Does the learner reuse training statistics instead of fitting the later reading? |
| Recover work | Edit the code, inspect an earlier saved run, then restore it and recover the newer draft. | Does the learner distinguish inspection from restoration and recognize stale output? |
| Explain training | Pick one row from a network run and compare its before/after scores and the untrained second model. | Can the learner trace all scores to the same captured reading and distinguish the two models? |
| Limit the conclusion | Explain what these scores and the loss history tell you about a new reading. | Does the learner recognize that these rows were used for training and that separate evaluation remains necessary? |

For each task retain the pseudonymous participant ID, exercise and source hashes,
active time, first response, assistance, retries, outcome, and specific confusion.
Mark missing observations unknown. Record whether the observer intervened before
the learner found a control or explained a result. Use recurring confusion to
choose the next revision, then observe fresh participants. This small discovery
round does not replace the formal novice study or its established thresholds.

Observe whether learners can find their saved result, identify its source,
explain a transformation, and repair a fresh case. Retain active time, first
attempts, retries, help, missing observations, and reasons for each assessment.
Use the existing delayed tasks and external room project to assess retained
understanding and transfer. A return visit or saved record alone proves neither.

Report recurring confusion and revise the affected lesson. Use fresh participants
for revised tasks. Record observed timing before publishing time estimates.
Only show real learner examples in promotional material after obtaining the
necessary permission. Keep maintainer demonstrations clearly identified.
Preserve the current offer and established homepage decisions.

## Rollout and plan ownership

Implement behind one pilot feature flag scoped to the listed activities.
Begin with an internal complete flow, then a small learner observation round.
Check whether saved evidence improves explanation and resumption, and whether
repair review creates useful retrieval without excessive interruption.
Learning observation informs expansion. It does not become a new prerequisite
for unrelated authorized development or replace existing release decisions.

After implementation, add one canonical parent item to
[post-launch-backlog.md](../../post-launch-backlog.md), linking these packages and
their demonstrated status. Keep detailed rationale here. Reconcile overlapping
items in the [learning-product development plan](../../learning-product-development-plan.md)
and [foundations opening plan](../../foundations-opening-plan.md) without deleting
their earlier evidence. This proposal does not mark any existing work complete.

The pilot excludes additional worlds, a public gallery, leaderboards, an AI tutor,
certification changes, a new learning route, full-model persistence, arbitrary
dataset uploads, account sync, pricing changes, and a rewrite of all 56 lessons.
Later expansion should follow observed needs and a fresh estimate.

## Planning verification

The original planning pass produced this document and an illustrative interactive
preview. The implementation status above records the two completed local slices.
The evaluation review above remains proposed work.

- Source review covered the current runner and artifact boundary, mutable drafts, project evidence, authenticated dashboard access, review scheduling, and the selected authored fixtures.
- The normalization reference ran against TFJS 4.22.0. Its means were [23, 0.5], standard deviations approximately [2.236068, 0.223607], and four fixed-neuron scores approximately [0.591657, 0.070385, 0.674496, 0.569884]. The published later reading [24, 0.51] scored approximately 0.509969. These are supplied reference results.
- The preview calculates its scalar squared-loss example in JavaScript. It illustrates how captured exercise values could explain a run. It does not execute the production TFJS grader or save learner work.
- Browser verification covered all six preview record states, rate 0.1 giving weight 4 and loss 16, rate 1.2 giving weight -7 and loss 49, incorrect repair followed by correction, retained hint history, and keyboard tab navigation.
- All four preview views fit widths of 320, 390, 736, and 1024 pixels without horizontal overflow. Light and dark appearances received visual inspection. The checked flows produced no page script errors.
- Document links and prohibited punctuation checks passed. Independent architecture review clarified guest access, package dependency direction, draft preservation, generated-run provenance, and registration of new review activities.

These checks establish that the proposal is inspectable. Production acceptance
and learner observations still belong to the implementation packages above.
