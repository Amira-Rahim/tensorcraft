# Evaluation result contract and capture decisions

Date: 2026-11-06. Status: contract with initial capture implementation.
The research findings below describe the original baseline. The first
implementation now supplies the recorder, capture adapter, semantic decoder,
and authored grader. Integration progress is recorded in the
[five-step plan](../../superpowers/plans/2026-11-06-result-inspection-design-review.md).

This note specifies the first evaluation result contract for deep-scan-eval.
The four-artifact design fits the existing protocol. Its current provenance
description needs stronger boundaries around history mutation, model state,
trusted measurement, and partial results.

The result should let the learner inspect the classifier's actual decisions
and explain what the crew should investigate. A failed diagnosis, changed
weights, or uncertain training history can still produce useful measured
results. Keep those observations distinct from assignment checks and source
claims.

## Evidence and new findings

The review used repository HEAD 8550adf771db, the installed TFJS 4.22.0 CPU
backend, the Node worker used by the current test harness, and the sources
listed below. The tests establish runtime behavior. They do not establish
learner understanding, browser performance, or protection against arbitrary
JavaScript in the worker.

| Probe | Observed result | Required decision |
| --- | --- | --- |
| Set the last history.history.acc entry to 0.123456 after fit and before reading trainAcc. | All nine current checks passed. The artifact reported 0.123456 as the training accuracy. | Copy accuracy at fit completion. Never recover the observed value later from the returned mutable History. |
| Replace every model weight with zero after fit and before evaluate. | All nine current checks passed. Evaluation accuracy was 20/43, represented as 0.4651162922382355. | Record final-state measurements, but mark their weight state as changed since the recorded fit. Object identity alone cannot establish continuity. |
| Replace model.evaluate with a function returning scalar tensors for loss 0.01 and accuracy 0.99. | All nine current checks passed. The artifact reported the fabricated pair. Fresh checks called the same replaced method. | Measure through retained runtime implementation references for the supported model. Compare the learner's reported values to that measurement. |
| Change logs.acc to 0.123456 inside onEpochEnd. | The returned History already contained 0.123456 when fit resolved. | A copy at fit completion prevents later mutation only. Initially mark custom-callback training-log provenance unknown. |
| Retain model.getWeights(), then call setWeights with zeros. | The retained tensor changed from 1 to 0 and kept the same identity. | Copy numeric values into an owned buffer. The returned tensors are live model Variables. Do not dispose them. |
| Evaluate all 44 possible correct-count totals from 0 through 43 with the pinned binary metric and default evaluation batch size. | The maximum error against correct/43 was 2.9109245125447103e-8, at 35 correct. Scores equal to 0.5 predicted class 0. | Retain strict score > 0.5 and an absolute accuracy tolerance of 1e-6. |

The first three probes ran the unmodified authored nine-check grader through
parseAndRunTests. Each probe changed only the solution immediately before
its existing evaluate call. These were independent runs, with unseeded model
initialization. Their loss values are not reference outputs.

The temporary Vitest investigation passed four tests and was removed after
recording these results. A separate direct TFJS probe checked all 44 aggregate
counts and the callback behavior. No permanent exercise tests or runtime
changes were added.

A disposable protocol preflight assembled the proposed four tables using the
existing November 2 maintainer-run numbers and supplied successful-status
context values. The current validateArtifacts accepted all four unchanged.
Row counts were [2, 38, 40, 3] and column counts were [4, 3, 7, 7]. Compact JSON
used 5,944 UTF-8 bytes without summaries, below the 65,536-byte host limit.
This establishes wire feasibility for the proposed shape. The supplied context
does not constitute newly observed provenance or a semantic-validator test.

The current harness schedules it callbacks through microtasks and awaits
them with Promise.all. Registering a capture test first does not establish a
dependency between it callbacks. Capture must run synchronously before test
registration, or every dependent check must explicitly await the same completed
capture. The initial design should use a synchronous preparation phase.

## Diagnostic scope

These observations describe supported operations in one isolated run. A
client-side record cannot establish that arbitrary learner JavaScript never
used evaluation information.

Retained native implementation references address ordinary method replacement
at the public model surface. They do not make mutable model internals, custom
layers, callbacks, or the entire worker trustworthy. Custom optimization,
fitDataset, direct variable writes, externally supplied weights, and changes
that restore identical values can escape fit-only observations.

Use claims such as "The recorded fit used the supplied training rows" and
"The model weights changed after the recorded fit." Avoid "This model never
saw test data" or "Verified independent performance."

The initial implementation should capture trusted final-state measurements and
check agreement with the learner's evalResult values. That comparison does not
prove the learner called evaluate. If observed invocation becomes a grading
requirement, add a separate bounded evaluate-call observer and explicit
invocation checks. Do not describe value agreement as invocation evidence.

## Fixture identity and canonical values

Use this proposed definition identity:

| Field | Initial value |
| --- | --- |
| definitionId | deep-orbit.evaluation-cases |
| contractVersion | 1 |
| worldId | deep-orbit |
| moduleId | training-loop |
| lessonId | evaluating-deep-scan |
| exerciseSlug | deep-scan-eval |
| fixtureId | deep-scan-evaluation-100-43 |
| fixtureVersion | 1 |
| featureOrder | Practice feature 1, Practice feature 2, Practice feature 3 |
| units | Dimensionless practice value for each feature |
| evaluation row identity | Input row position 0 through 42, with canonical fixture identity only after comparison |
| classification | Label 0 means calm. Label 1 means flagged. Predict 1 only for score > 0.5. |

The exercise currently supplies unnamed practice columns. The prototype uses
Practice feature 1 through 3. Keep that explicit wording until a content change
defines more specific feature meaning. Do not infer waveform, timestamps, sensor
identity, physical units, or continuity with the earlier eight-feature model.

The fixture contains:

| Partition | Rows | Generation and labels |
| --- | --- | --- |
| Training calm | 50 | Means [0.17, 0.81, 0.23], standard deviation 0.1, seeds [7, 8, 9], float32, clipped to [0, 1], label 0. |
| Training flagged | 50 | Means [0.84, 0.18, 0.78], standard deviation 0.1, seeds [41, 42, 43], float32, clipped to [0, 1], label 1. |
| Evaluation generated calm | IDs 0 through 19 | Calm means, standard deviation 0.1, seeds [204, 205, 206], float32, clipped to [0, 1], label 0. |
| Evaluation generated flagged | IDs 20 through 39 | Flagged means, standard deviation 0.1, seeds [201, 202, 203], float32, clipped to [0, 1], label 1. |
| Evaluation authored | IDs 40 through 42 | [0.30, 0.68, 0.34], [0.26, 0.75, 0.29], [0.33, 0.71, 0.36], converted to float32, all label 1. |

The training shuffle has no stable random seed. Compare the complete multiset
of feature-and-label tuples, retaining multiplicity. Accept paired reordering.
A Set comparison loses duplicate counts. Comparing features and labels in
separate collections loses their pairing.

Evaluation uses exact ordered rows. A reordered pair can still produce useful
measurements, but it fails this fixture's ordered-source check. Preserve its
observed row positions and label its source mismatch. Do not assign canonical
case IDs by guessing from the model output.

Create the canonical plain-value fixture from the pinned generator before
learner execution. The grader and decoder must consume the same versioned
canonical data. Keep that data independent of learner trainX, trainY, testX,
and testY bindings. The browser decoder must not import TFJS or regenerate
random values during rendering or reload.

Compare canonical float32 values exactly for this pinned fixture. JavaScript
decimal literals such as 0.3 differ from their float32 representations. Convert
the authored triples through Float32Array when constructing canonical values.
A numeric epsilon for fixture membership would silently accept edited data.
If a later runtime produces a different fixture, give it a new tested fixture
version.

For audit reproducibility, SHA-256 of JSON.stringify over the ordered
evaluation tuples [id, feature1, feature2, feature3, label] was:

~~~text
cf86b9fedf49e2ab03e99ea575df915bf8e3205633d38e09fe32c9a006671ad1
~~~

The final authored rows read back as:

~~~text
40: [0.30000001192092896, 0.6800000071525574, 0.3400000035762787], label 1
41: [0.25999999046325684, 0.75, 0.28999999165534973], label 1
42: [0.33000001311302185, 0.7099999785423279, 0.36000001430511475], label 1
~~~

The digest identifies these public fixture values. It does not attest execution.

## Bounded runtime observations

Keep the existing 16-fit limit and expose a separate immutable recorder status.
Silently dropping the seventeenth fit cannot support a complete-history claim.
Status must include total attempted fits or a saturated overflow flag, pending
fit count, and whether an observed path lacked a usable snapshot.

For each retained fit, preserve the existing public history identity for
compatibility and add separate copied observations:

- Internal LayersModel identity and a run-local ordinal.
- Fit-start input shapes, dtypes, and bounded feature-and-label snapshots.
- Fit-start settings, including whether callbacks or validation data were supplied.
- Completed epoch indices and finite final loss and accuracy, copied before
  the wrapper resolves to learner code.
- The metric key and resolved metric semantics. In this fixture, the acc
  history key corresponds to binaryAccuracy.
- A bounded copy of fit-completion weight values, with tensor order, shapes,
  and dtypes. Record an explicit unavailable reason when copying fails.
- Failed or pending status. A failed fit with partial history cannot count as
  the required successful 30-epoch fit.

For this slice, accept trusted training-log provenance only when the supported
fit has no custom callbacks. TFJS invokes user epoch callbacks before its
History callback. Copying History after fit therefore cannot establish that
callbacks left its metrics unchanged.

A future callback-compatible recorder could observe epoch metrics before user
callbacks and keep its own epoch counter. That requires behavior and parity
tests. It should not be implied by the current recorder.

Bind the selected history to the evaluated internal model or its exact ordered
weighted-layer lineage. TFJS Sequential recompilation replaces the internal
LayersModel while preserving its layers and weights. A compile with unchanged
configuration remains valid. A different model's independently owned layers
cannot substitute its history, even if numeric weights happen to match.

Inspect all retained fits that share any weighted layer with the evaluated
model, including failed fits that may have updated weights before
throwing. A second fit on the same model prevents the single-fit procedure
claim. Directly observed evaluation rows in a recorded fit produce a mismatch.
Overflow, incomplete input copies, unsupported paths, and pending fits produce
unknown history rather than a successful absence-of-leakage claim.

A fit on a different model remains a separate observation. It cannot establish
that the evaluated model trained on the supplied rows, and the decoder must not
silently substitute that history.

### Weight snapshot ownership and cost

Copy values from the returned getWeights tensors immediately. The initial
implementation uses deeply frozen plain number arrays because nonempty typed
arrays cannot be frozen and the recorder exposes observations to graders.
The copied numbers retain their exact original float32 values. Do not retain
the live tensors as the snapshot, and do not dispose them.

The assigned model has 673 parameters:

- One checkpoint holds 673 numbers, approximately 5,384 bytes at eight bytes
  per number, before engine-specific array overhead.
- Fit completion, pre-capture, and post-capture checkpoints together store
  2,019 numbers, approximately 16,152 numeric bytes before overhead.
- Sixteen retained fit checkpoints at this model size hold 10,768 numbers.
- An 8,192-value cap per retained model checkpoint limits sixteen checkpoints
  to 131,072 copied numbers, approximately 1 MiB before array overhead.

The implementation should check the total parameter count and tensor count
before reading values. Use at most 32 weight tensors and 8,192 scalar values
per checkpoint. Reject non-finite values from state comparison. These are
run-local diagnostic buffers and never enter artifacts, IndexedDB, downloads,
or model restoration.

The existing input recorder uses JavaScript number arrays and allows 8,192
values per input tensor. Its heap cost includes array overhead. The figures
above describe only copied numeric observations. The model/history identity
references still retain existing runtime object graphs. These bounds do not
cap the worker's entire heap. Measure browser capture latency during the
integrated UI work. This review does not claim a browser timing.

Compare copied weight arrays by shape, dtype, order, and exact finite value.
The comparison establishes equality at the observed checkpoints. It cannot
prove no intermediate mutation occurred.

## Capture and check ordering

Use one guarded capture preparation before the grader registers it callbacks.
Make its steps synchronous for the supported CPU model. Do not yield between
the pre-capture checkpoint, evaluate, predict, and post-capture checkpoint.

1. Freeze an observation of the learner's submitted diagnosis and reported
   scalar values. Do not call diagnose. Handle absent or unreadable bindings
   as explicit unavailable fields.
2. Resolve the learner's current public model to its supported internal
   LayersModel. Retain the distinction between that model and the model
   associated with history.
3. Read immutable fit-recorder observations and status. Copy actual evaluation
   inputs into owned bounded plain values. Check canonical input membership
   independently. Reconstruct private evaluation tensors from those copied
   values so later changes to learner bindings cannot change the captured rows.
4. Check the supported topology and compiled metric semantics. The initial
   rich contract supports three Dense layers with three input features and
   one sigmoid output. Record actual widths, settings, and parameter count.
   Unsupported layer classes, custom activations, extra output tensors, or
   unavailable metric semantics cannot acquire the standard model description.
5. Copy the current model weights. Compare them to the matching fit-completion
   checkpoint. Record matched, changed, or unknown. A changed state can still
   proceed to useful final-model measurement.
6. Call retained original LayersModel.evaluate and LayersModel.predict
   implementations on the resolved internal model and copied inputs, with
   explicit batchSize 32. Copy the two evaluation scalars and 43 scores into
   owned plain values immediately.
7. Copy weights again. A change during capture invalidates the claim that
   aggregate metrics and case scores describe one state. Record that failure
   and withhold their combined summary. Keep independently safe raw values.
8. Validate shape, finite values, score bounds, complete case coverage, and
   accuracy agreement. Build the entire candidate bundle and validate it
   through the shared artifact validator before publishing any of its items.
9. Publish the validated artifacts. Only then run assertions about diagnosis,
   requested schedule, submitted value agreement, and other assignment checks.
   Those checks consume the frozen observation. They do not reevaluate the
   mutable model or reread mutable History.
10. Dispose only tensors created by the capture helper, in finally. Leave the
    learner's tensors and model-owned weights alone. Release diagnostic buffers
    when the isolated run ends.

If a learner's diagnose function mutates model weights during later assertions,
the already-captured result remains tied to its earlier snapshot. Moving only
recordResult calls before the final verdict assertion is insufficient if other
diagnosis tests execute first.

The worker owns retained method references and the capture helper. The authored
grader should request a bounded capture through that helper. It should not try
to establish trusted method identity from a potentially changed learner model.

Retained implementations still traverse mutable model internals. Limit the
supported class/configuration surface and record unsupported cases. Do not
turn this work into a general sandbox rewrite.

A candidate bundle can use the same createArtifactCollector or validateArtifacts
implementation for preflight. This needs a narrow shared helper, with browser
worker and CLI parity. Calling recordResult four times without preflight can
leave a half-published bundle when a later artifact violates a bound.
Preflight also checks the live collector's remaining capacity before publishing.
If learner code already consumed a slot, report capture unavailable rather than
partially publishing the four-role bundle or discarding that earlier output.

## Exact artifact wire contract

Keep artifact wire version 1 and host snapshot schema version 1. Resolve the
new semantic contract through the assigned exercise and fixture mapping, then
require matching definition identity in the context artifact.

All four artifacts use kind table. Titles and columns below are frozen role
identifiers for contract version 1. Presentation copy can live outside those
identifiers. Do not parse summaries for any machine field.

| Role | Frozen title | Frozen columns | Complete row count |
| --- | --- | --- | --- |
| measured-scores | The scores from your evaluation run | Dataset, Rows, Loss, Accuracy | 2 |
| run-context | Evaluation run context | Key, Value, Detail | 38 |
| generated-cases | Captured evaluation cases 0-39 | Row ID, Source, Feature 1, Feature 2, Feature 3, Label, Score | 40 |
| authored-cases | Captured evaluation cases 40-42 | Row ID, Source, Feature 1, Feature 2, Feature 3, Label, Score | 3 |

The neutral case-table titles describe positions even when fixture checks fail.
Only validated values can acquire generated or authored source labels.

Keep artifact order as shown. Reject duplicate roles, unrecognized roles,
changed columns, sparse arrays, and extra context keys. Reuse the global bounds:
four artifacts, 40 rows per table, 12 columns, 180-character titles and column
labels, 1,200-character table strings and summaries, and the host's 64 KiB
artifact limit. This contract adds tighter typed fields below.

### Measured scores

The two rows are always present when this artifact exists:

~~~text
["Final training log", observedTrainingRows, finalCopiedLoss, finalCopiedAccuracy]
["Final model evaluation", observedEvaluationRows, capturedLoss, capturedAccuracy]
~~~

Each count is an integer from 0 through 8,192 or null. Loss is finite and
nonnegative or null. Accuracy is finite within [0, 1] or null. Null means
unavailable. It never means zero.

Training fields use the copied final supported fit log. If custom callbacks
prevent trusted log observation, keep those fields null in this semantic
artifact and explain the reason in context. Existing console or safe raw
history output may still be available separately.

Evaluation fields use the capture helper's actual final-model measurement.
A changed weight state retains these values and its changed status. A different
compiled metric cannot be renamed accuracy merely because it occupied index 1.

### Run context

Use exactly these 38 rows in this order. Each row has three cells. Every Detail
cell is null unless the table specifies a value. Unknown settings use null.

| # | Key | Value | Detail |
| --- | --- | --- | --- |
| 1 | definitionId | deep-orbit.evaluation-cases | null |
| 2 | contractVersion | Integer 1 | null |
| 3 | fixtureId | deep-scan-evaluation-100-43 | null |
| 4 | fixtureVersion | String 1 | null |
| 5 | captureStatus | complete, partial, unavailable | Reason code or null |
| 6 | evaluationSourceStatus | matched, mismatch, unknown | Reason code or null |
| 7 | trainingSourceStatus | matched, mismatch, unknown | Reason code or null |
| 8 | fitHistoryStatus | matched, mismatch, unknown | Reason code or null |
| 9 | recordingStatus | complete, overflow, in-flight, unsupported | Reason code or null |
| 10 | trainingLogStatus | available, partial, unavailable | Reason code or null |
| 11 | modelStateStatus | matched, changed, unknown | Reason code or null |
| 12 | modelSupportStatus | supported, unsupported, unknown | Reason code or null |
| 13 | measurementStatus | consistent, inconsistent, unknown, unavailable | Reason code or null |
| 14 | submittedEvaluationStatus | matched, mismatch, unknown | Reason code or null |
| 15 | observedFitCount | Integer 0 through 16 | null |
| 16 | modelFitCount | Integer 0 through 16 or null | null |
| 17 | trainingRows | Integer 0 through 8,192 or null | null |
| 18 | evaluationRows | Integer 0 through 8,192 or null | null |
| 19 | requestedEpochs | Integer 0 through 1,000,000 or null | null |
| 20 | completedEpochs | Integer 0 through 1,000,000 or null | null |
| 21 | batchSize | Integer 1 through 8,192 or null | null |
| 22 | shuffle | Boolean or null | null |
| 23 | initialEpoch | Integer 0 through 1,000,000 or null | null |
| 24 | validationSplit | Number at least 0 and below 1, or null | null |
| 25 | parameterCount | Integer 0 through 8,192 or null | null |
| 26 | inputWidth | Integer 0 through 8,192 or null | null |
| 27 | layer1 | Integer units 1 through 8,192 or null | Activation enum or null |
| 28 | layer2 | Integer units 1 through 8,192 or null | Activation enum or null |
| 29 | layer3 | Integer units 1 through 8,192 or null | Activation enum or null |
| 30 | optimizer | Optimizer enum or null | Finite nonnegative learning rate or null |
| 31 | loss | binaryCrossentropy or null | null |
| 32 | metric | binaryAccuracy or null | Original alias accuracy, acc, binaryAccuracy, or null |
| 33 | decisionRule | Number 0.5 | gt |
| 34 | class0 | Integer 0 | calm |
| 35 | class1 | Integer 1 | flagged |
| 36 | learnerDiagnosis | large-gap, low-scores, no-gap-warning, or null | present, invalid, missing |
| 37 | callbacksPresent | Boolean or null | null |
| 38 | evaluationBatchSize | Integer 32 | null |

Activation enum: relu, sigmoid, linear, tanh, elu, selu, softplus, softsign,
hardSigmoid, softmax. The initial supported output remains sigmoid. Unknown or
custom functions map to null and unsupported model status.

Optimizer enum: Adam, SGD, RMSProp, Adagrad, Adadelta, Adamax. Resolve installed
class names explicitly. A future class needs a contract update or a deliberate
compatible enum extension with decoder tests.

The numeric bounds limit what this first contract represents. An observation
outside a bound becomes null with an unsupported or over-limit status. Never
clamp it to the maximum or report the assigned default as the actual value.

The status fields each carry at most one primary reason. Select the earliest
applicable reason in the lists below. Complete, matched, supported, available,
and consistent statuses have null detail.

| Status field | Allowed non-null primary reasons, in priority order |
| --- | --- |
| captureStatus | capture-error, unsupported-model, missing-cases, missing-evaluation, missing-training-log |
| evaluationSourceStatus | shape-mismatch, row-order-mismatch, feature-mismatch, label-mismatch, input-read-failed, unsupported-runtime |
| trainingSourceStatus | shape-mismatch, pair-mismatch, label-mismatch, input-read-failed, missing-fit, recording-overflow |
| fitHistoryStatus | wrong-model, evaluation-rows-in-fit, extra-model-fit, failed-fit, wrong-schedule, validation-data-present, callbacks-unobserved, missing-fit, recording-overflow, fit-in-flight, unsupported-fit |
| recordingStatus | recording-overflow, fit-in-flight, unsupported-fit |
| trainingLogStatus | callbacks-unobserved, history-shape-mismatch, metric-unavailable, nonfinite-metric, failed-fit, missing-fit |
| modelStateStatus | changed-during-capture, weights-changed, config-changed, checkpoint-unavailable |
| modelSupportStatus | unsupported-model, unsupported-metric, over-limit, model-unavailable |
| measurementStatus | changed-during-capture, accuracy-count-mismatch, nonfinite-metric, missing-cases, missing-evaluation, prediction-failed |
| submittedEvaluationStatus | value-mismatch, invalid-result-shape, metric-unavailable, missing-evaluation |

Reason codes never carry exception text or learner strings. Existing check
results can carry bounded human-readable diagnostics. Status-to-reason pairings
need an explicit decoder map. A decoder rejects contradictory pairings such as
matched with feature-mismatch.

A complete recording means all fit calls observed by this recorder fit within
its limits. It does not mean the recorder covered every possible training API.

### Evaluation rows

Each case row contains:

~~~text
[rowIndex, source, feature1, feature2, feature3, suppliedLabel, score]
~~~

rowIndex is an integer 0 through 42. Source is generated, authored, or unknown.
Feature and score cells are finite numbers within [0, 1]. suppliedLabel is
integer 0 or 1. Preserve full numeric precision in the payload.

IDs 0 through 39 belong only in the first case table. IDs 40 through 42 belong
only in the second. Rows must be unique across the complete bundle and strictly
ascending within each table. The decoder checks the expected IDs, features,
and labels together against its independent fixture.

Source generated or authored requires an exact match to that canonical row.
A changed row must use unknown. A claimed known source with mismatched values
is a semantic integrity error, not an acceptable unknown state.

For a valid unknown-source row, the inspector can show input position, Input 1
through Input 3, supplied label 0 or 1, and the captured score. It must not give
that row the canonical story meaning or an authored-case marker.

Store no predicted label, error category, confusion counts, or derived accuracy
in these tables. The adapter derives them once from suppliedLabel, score, and
decisionRule. This avoids conflicting persisted copies.

## Completeness and error behavior

Completeness describes the captured data. It stays independent of graded
success, fixture matching, fit-history status, and changes since training.

The existing artifact collector rejects empty table rows. Represent a wholly
absent case partition by omitting its artifact. Never emit an empty table or
a dummy row. If a table contains only some valid cases, keep their actual IDs
and use partial capture status. Do not renumber or fill the gaps.

The decoder uses this order:

1. Enforce structural bounds and host byte limits.
2. Resolve the assigned definition and check the context identity, exact key
   set, row count, field types, status enums, and reason pairings.
3. Validate artifact roles and columns before interpreting their values.
4. Validate each available row and compare any claimed source to canonical
   values. Reject duplicate IDs, wrong partitions, invalid scores, or changed
   column order as semantic errors.
5. Derive observed coverage. Compare it to context rather than accepting a
   complete flag as proof.
6. Derive supported summaries and explicit unavailable states.

A missing context produces an unavailable semantic result. Safe generic
artifacts can remain visible, but saving as this contract requires a valid
context. A present, valid context can describe an unavailable capture and
preserve that honest outcome.

| Situation | Result behavior |
| --- | --- |
| All 43 cases, consistent evaluation metric, failed diagnosis | Show the result and failed diagnosis together. Saving does not grant completion. |
| All 43 cases, weights changed since fit | Show the final-model result and training-state warning. Keep training-log and final-model values clearly distinct. |
| All 43 cases, fixture mismatch | Show useful measured values with changed-source labels. Avoid canonical story-source claims. |
| Missing cases | Show the available cases and their count. Withhold whole-run accuracy and whole-run confusion totals. |
| Complete cases, missing evaluation metric | Show available case decisions. Withhold the combined evaluation summary until the measurement relation is established. |
| Complete cases, inconsistent aggregate accuracy | Show the inconsistency and safe rows. Do not choose one value silently or repair the stored metric. |
| Missing training log, complete consistent evaluation | Show the evaluation result. Label training comparison unavailable. |
| Unsupported model or unreadable input | Keep safe raw output and a bounded unavailable reason. Do not create synthetic case scores. |
| Runtime exception or worker termination | Show the execution failure. The current worker may return no artifacts. Preserve earlier saved results. |
| Malformed structural payload | Reject before any semantic viewer. Unknown status does not bypass validation. |

A decoder should return separate caseCoverage, metricAvailability, sourceStatus,
fitStatus, stateContinuity, and diagnosis fields. A single passed boolean cannot
represent these combinations.

The current result view should inspect safe numeric rows even when source or
training checks fail. This serves the learning task without treating uncertain
history as a canonical result.

## Metric agreement and display rules

Use the raw full-precision score for classification:

~~~text
predicted = score > 0.5 ? 1 : 0
~~~

At exactly 0.5, predict class 0. A rounded display of 0.500000 can represent a
score on either side. If six-decimal formatting hides the side, show enough
digits or explicitly say that the full captured score is above the boundary.
Never move a plotted point or change its class to match rounded text.

For a complete canonical case set:

~~~text
TP + TN + FP + FN = 43
derivedAccuracy = (TP + TN) / 43
abs(derivedAccuracy - capturedAccuracy) <= 1e-6
~~~

The tolerance covers float32 metric rounding. One wrong case changes accuracy
by approximately 0.0232558. The tolerance does not allow missing rows, changed
labels, or reordered fixture identities.

For learner evalResult agreement, use absolute tolerance 1e-6 for accuracy and
a loss tolerance of 1e-6 times max(1, absolute captured loss). Keep loss finite
and nonnegative. Compare against the trusted captured evaluate result. Do not
reconstruct binary crossentropy with ad hoc JavaScript logarithms, because
TFJS loss handling and numeric clipping belong to the pinned implementation.

The report's class counts explain recorded predictions. The learner's diagnosis
uses a separate rule: a gap strictly above 0.15 first, then both scores strictly
below 0.7, otherwise no-gap-warning. A failed diagnosis cannot suppress capture.

Training accuracy is the final epoch's log aggregated during training. It is
not a fresh evaluation of the final weights on the training set. Preserve that
label even when the final-state checkpoint matches.

A sigmoid score alone does not establish a calibrated probability. Feature
bars show the supplied inputs. They do not establish feature importance or
the cause of a prediction.

## Credible challenge cases and acceptance

| Case | Required observation and acceptance |
| --- | --- |
| Change generated feature means but keep every shape. | Independent fixture comparison reports mismatch. Current values remain inspectable with honest source labels. |
| Reorder training feature-and-label pairs together. | Multiset comparison accepts membership without inventing stable training order. |
| Reorder features and labels separately. | Paired-tuple comparison rejects membership. |
| Train on evaluation rows, recompile, then perform the requested fit. | Full observed history reports the earlier fit. Optimizer iteration reset cannot hide it. |
| Return history from a different model. | Model/history identity check fails. Capture the current model with unavailable matching training history. |
| Run more than 16 fits. | Recording overflow prevents a complete-history claim, even if the retained fits look valid. |
| Change final History accuracy or loss after fit. | Captured immutable values remain unchanged. Submitted-value checks can fail. |
| Change epoch logs inside a callback. | Custom-callback training-log provenance stays unknown in the first slice. |
| Set or train weights after the recorded fit. | Final-state measurement remains useful. State continuity reports changed when checkpoint values differ. |
| Change weights between aggregate evaluation and prediction. | Pre/post checkpoint mismatch prevents a combined result claim. |
| Replace public evaluate or predict methods. | Supported capture uses retained implementations. Submitted fabricated values fail agreement checks. |
| Mutate the model inside diagnose. | Capture finishes before any grader call to diagnose. Later assertions cannot rewrite the result. |
| Forge values equal to the actual evaluate result without calling evaluate. | Value checks can pass. The system makes no invocation claim. |
| Use custom optimizer code, fitDataset, or restore identical weights after another path. | Do not assert complete training provenance. Fit observations remain diagnostic. |
| Duplicate, omit, round, or relabel cases in a persisted payload. | Decoder rejects invalid semantics or returns an explicit supported partial state. It never repairs values silently. |
| Edit the context to claim complete or matched. | Structural and semantic checks still compare rows and identities. Local edits can remain undetectable if all fields are coherently forged, so the record never becomes external assessment proof. |

Reference acceptance requires no particular accuracy, loss target, confusion
count, missed authored case, or preferred diagnosis. Zero errors and weak
results are both valid measured outcomes.

## Required corrections to the main specification

1. Replace the implied sufficiency of model/history identity with separate
   identity, observed-fit-history, and copied-weight-state checks.
2. Specify immutable accuracy capture. State that the existing recorder copies
   loss only, and that custom callbacks can alter History before it resolves.
3. Require a synchronous guarded preparation phase before any diagnosis checks.
   Test registration order does not establish capture order in this harness.
4. Use retained original evaluate/predict implementations for supported capture.
   Stop calling the learner's mutable evaluate method as the measurement oracle.
5. Distinguish trusted measured values from submitted-value agreement. The first
   slice does not verify evaluate invocation.
6. Treat changed post-fit weights as useful final-state results with a continuity
   warning. Do not automatically discard them or falsely label them as the
   recorded fit's untouched output.
7. Adopt the exact 38-row context table, four frozen artifact roles, typed null
   handling, and bounded reason codes, or replace them with an equally precise
   reviewed contract before implementation.
8. Add canonical float32 row data and paired training-multiset comparison.
   Explicitly preserve the distinction between input position and canonical ID.
9. Define omitted case partitions because the current wire format rejects empty
   tables. Distinguish missing coverage from malformed payloads.
10. Require bundle preflight and exact accuracy consistency checks. State the
    bound and ownership of runtime-only weight checkpoints.
11. Keep the initial source envelope labeled as the assigned task. Only validated
    row values and observed context support stronger source labels.
12. Add these new counterexamples to Gate A. Update verification notes to
    distinguish the completed maintainer probes from future regression tests,
    browser checks, and participant observation.

## Sources

Local evidence:

- [Current evaluation exercise](../../../packages/content/content/deep-orbit/training-loop/exercises/deep-scan-eval.yaml)
- [Fit recorder](../../../packages/ui/src/mdx/exercise-fit-recording.mjs)
- [Fit recorder tests](../../../packages/ui/src/mdx/exercise-fit-recording.test.ts)
- [Worker and test harness](../../../packages/ui/src/mdx/exercise-runner.ts)
- [Node worker adapter](../../../packages/ui/src/mdx/exercise-runner-node.ts)
- [Shared artifact validator](../../../packages/ui/src/mdx/exercise-artifacts.mjs)
- [CLI exercise validator](../../../scripts/validate-exercises.mjs)
- [Current persisted snapshot parser](../../../apps/web/lib/learning-evidence-types.ts)
- [Network explanation parser](../../../apps/web/app/components/network-run-explanation.tsx)
- [November 2 evaluation plan](../../superpowers/plans/2026-11-02-learning-evidence-pilot.md)
- [November 6 main specification](../../superpowers/specs/2026-11-06-story-driven-result-inspection.md)

Pinned library inspection used the installed @tensorflow/tfjs-layers 4.22.0
metrics.js, models.js, variables.js, engine/topology.js, engine/training.js,
and base_callbacks.js. Those files establish strict greater-than thresholding,
Sequential delegation, live weight reads, and callback-before-History order.

Primary documentation:

- The [TFJS 4.22.0 evaluate API](https://js.tensorflow.org/api/4.22.0/#tf.LayersModel.evaluate)
  defines evaluation outputs in terms of the compiled loss and metrics.
- TensorFlow's [training guide](https://www.tensorflow.org/js/guide/train_models)
  documents Layers fit and fitDataset alongside Core optimizer training.
  These separate paths support the limited scope stated for fit-only recording.

