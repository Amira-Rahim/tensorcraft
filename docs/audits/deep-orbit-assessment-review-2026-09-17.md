# Deep Orbit assessment review

Date: 2026-09-17. Base: `9ab981bd`. Reviewer: Codex, local author-side review.
Status: coverage pass complete, targeted corrections implemented, acceptance open.

The course has substantial guided coding practice, including real tensor
operations, model fitting, parameter inspection, resource checks and export.
It does not yet establish that a learner can independently choose a baseline,
split, metric, model or deployment plan. Several graders also require a
particular random training outcome or teach a stronger diagnosis than the
available evidence supports. Those gaps prevent a 9/10 assessment sign-off
and a claim that the $70 learning outcome has been demonstrated.

This review fixes 14 finding groups across 15 exercises. The remaining
findings below have concrete acceptance conditions. Passing the reference
solutions is useful engineering evidence, not a learner study or an
independent educational endorsement.

## Scope and method

- Read all 65 Deep Orbit exercise contracts, starters, reference solutions,
  hint ladders and grader logic against their 56 lessons' 222 authored objectives.
- Mapped objectives to guided code, partial evidence, self-checked recall or
  explanation alone. The [manual review record](deep-orbit-assessment-review.json)
  preserves exact objectives, individual judgments, source paths and hashes.
- Checked prerequisites against module order and explicitly supplied API
  scaffolding. This does not finish the whole-course first-use terminology
  or glossary review, or establish readiness for a JS-only reader.
- Reviewed diagnostic wording selectively around suspect assertions and
  changed contracts. This is not a complete copyedit of every failure message.
- Ran all reference solutions, untouched starters and registered misconception
  submissions through the exercise validator. Added production-worker boundary
  regressions and ran the 15 changed exercises through the browser worker.
- Probed alternative prompt wording and seeded shuffling. This is targeted
  testing, not proof that all valid implementations pass.

The corpus scope is Deep Orbit. The four draft worlds, full lesson rendering,
accessibility, historical story benchmarks, narrative continuity, learner
outcomes and real infrastructure deployment are outside this review's sign-off.

## Objective coverage

The categories describe the evidence currently collected, not how well a
learner understands the topic. An objective with guided code evidence can
still have a grader defect. An objective phrased as "understand" may have a
relevant implementation task without collecting the learner's explanation.

| Evidence | Objectives | Meaning |
| --- | ---: | --- |
| Guided code | 118 | At least one directly relevant behavior is tested within an explicit implementation contract. |
| Partial | 52 | Practice checks only part of the objective, or relies on supplied decisions, stand-ins or an ungraded report. |
| Self-checked recall | 23 | The learner can reveal an answer; no independent performance is collected. |
| Explanation only | 29 | The objective is explained but lacks a directly aligned assessed task or recall check. |

These are manual judgments, not a mastery percentage or a count of wholly
unassessed lessons. Broad objectives deserve narrowing where the course only
teaches a bounded operation.

| Module | Exercises reviewed | Guided code | Partial | Recall only | Explanation only |
| --- | ---: | ---: | ---: | ---: | ---: |
| foundations | 5 | 14 | 3 | 2 | 2 |
| neural-networks | 5 | 11 | 5 | 2 | 1 |
| training-loop | 5 | 10 | 7 | 1 | 2 |
| browser-runtimes | 7 | 6 | 8 | 2 | 8 |
| signal-processing | 5 | 7 | 6 | 3 | 2 |
| recurrent-networks | 5 | 12 | 4 | 2 | 2 |
| anomaly-detection | 8 | 12 | 3 | 5 | 0 |
| advanced-time-series | 5 | 13 | 1 | 3 | 2 |
| llm-integration | 6 | 12 | 5 | 1 | 1 |
| optimization-edge | 6 | 12 | 4 | 2 | 3 |
| capstone | 8 | 9 | 6 | 0 | 6 |

The strongest examples change inputs and compare actual behavior:
`time-vs-frequency`, `build-rnn`, `build-lstm`, `reconstruction-error`,
`weighted-ensemble` and `export-model-artifact`. The export exercise really
saves and reloads an artifact and compares predictions. This is stronger
integration evidence than merely generating a configuration string.

## Corrections implemented in this patch

All rows below are locally corrected. Their scope is the named contracts,
solutions, tests and corresponding lesson hints or challenge wording. They
do not close the other findings for the same lesson.

| ID | Severity | Exercise | Problem and correction |
| --- | --- | --- | --- |
| A01 | High | `mse-loss` | Unknown activations were automatically treated as logits. `pickBceForm` now requires an explicit probabilities/logits contract and rejects unknown semantics. |
| A02 | High | `browser-ml-tradeoffs` | The size rule sent offline or device-only data requirements to a server. Conflicting requirements now return `reconsider`; the 50 MB/50 ms rules are explicitly exercise policy, not universal performance facts. Starter types include the new result. |
| A03 | High | `incident-baseline-drift` | A Gaussian reference was called a rate promise; measurements from the candidate's fitting data authorized rollout and asserted a cause. The task now reports `expectedPerDay`, uses unrounded rates for triage and requires independent evaluation before deployment. |
| A04 | High | `incident-missed-anomaly` | Low reconstruction error was treated as proof of memorization and a reason to retrain. The result now reports feature discrepancies and low errors without claiming a cause or prescribing retraining. |
| A05 | High | `incident-false-alarm-storm` | Age, volume and sensor-change clues were labeled root causes. Results now name next checks; a zero baseline gives a null ratio, and rounding cannot change a branch. Reviewing real events remains necessary. |
| A06 | High | `llm-client` | Merely present fields accepted invalid confidence, classification and reasoning. The parser now enforces finite numeric confidence in [0, 1], allowed classes and non-empty reasoning. It still does not verify truth or calibration. |
| A07 | Medium | `simple-attention`, `temporal-attention` | Unqualified squeeze removed the feature axis when its width was one. Squeezing only axis 0 preserves the promised rank-1 result. |
| A08 | High | `model-pipeline` | Invalid detector and alert values could flow through despite a stage-validation objective. The task now rejects non-boolean detector output and empty/non-string alerts. |
| A09 | Medium | `fft-features` | Touching exact zero counted as changing to the opposite sign. The exercise now states and tests the strict adjacent-opposite-sign convention, with zero-containing pairs excluded. |
| A10 | High | `simple-network` | Near-0.5 confidence and a small initial class gap were treated as evidence that a model had not trained. Removed those checks; retained weight replay, snapshots and optimizer-iteration evidence. A trained-output threshold remains under A18. |
| A11 | Medium | `quantize-weights` | A constant kernel divided by a zero scale, producing NaN. Constant kernels now store integer zero and decode to their original minimum. Guidance allows unchanged predictions and no longer implies an affine grid necessarily rounds small weights to zero. |
| A12 | High | `ci-cd-gate` | Missing labels could compare equal and count as correct. Only equal, non-empty string labels now count; incomplete rows remain in the denominator under the stated conservative gate policy. Starter types permit validation of unknown fields. |
| A13 | High | `classify-anomaly` | An empty ratio list passed the Fibonacci check by vacuous truth. Empty evidence now fails. The fictional confirmation label is explicitly a mission rule, not proof of a signal's origin. |
| A14 | Medium | `prompt-template` | Legitimate prompts failed literal vocabulary checks. "An assistant that labels signals" and "Return JSON without prose" now pass. Direct JSON prohibitions still fail; a passing template does not prove model obedience. |

For A01, the API's second argument is explicitly logits in the
[TensorFlow.js 4.22 documentation](https://js.tensorflow.org/api/4.22.0/#losses.sigmoidCrossEntropy).
An arbitrary activation name does not establish that contract. A03-A05 are
principally corrections to what the available observations can support: a
triage policy can choose an investigation without certifying its cause.

The changed prose addresses the writing rubric's unsupported substance,
overloaded sentences, repetition and formulaic language. In particular,
incident feedback now states a measurement or next check instead of repeatedly
turning a clue into a dramatic certainty. Three-step hints remain available;
this patch does not replace the full feedback editorial pass.

## Open findings and acceptance conditions

### A15. Shuffle grading uses a random result as evidence

**Medium.** `batch-data` compares membership across two drains and requires a
difference. Correct random shuffling can theoretically reproduce groups; that
outcome is not proof the pipeline was built incorrectly. Replace the chance
comparison with controlled input/order probes while retaining lazy iteration,
temporal-split and batch-shape checks.

A proposed fixed-seed counterexample using `shuffle(10, 123, false)` passed
all five tests on the installed TFJS 4.22.0 runtime. A reproducible rejection
of that alternative was **not** found. Keep that result separate from the
static concern about judging randomness through two observed samples.

### A16. Loss-curve diagnosis and early stopping need separate assessments

**High.** `training-loop-exercise` accepts training losses but its diagnosis
ignores them, labeling rising validation loss as overfitting. Training can
also be unstable. The grader additionally requires a stopping epoch inside a
fixed range from a random fit.

Acceptance: use both curves and label observable trends separately from
possible causes. Include training-improves/validation-worsens, both-worsen,
flat, insufficient-history and zero-loss cases. Test patience/min-delta with
controlled histories, and verify the actual fit history separately. A correct
callback must not fail merely because a particular model keeps improving.
The [Google loss-curve guide](https://developers.google.com/machine-learning/crash-course/overfitting/interpreting-loss-curves)
uses training and validation behavior together and discusses multiple reasons
for abnormal curves; it supports investigation rather than a single-cause rule.

### A17. Evaluation does not assess choosing or interpreting a baseline

**High for the learning gate.** `deep-scan-eval` requires a healthy verdict and
high accuracy from an unseeded fit. Computing the score correctly and proving
the model is useful are separate requirements. The majority baseline and
confusion-matrix work mainly live in explanation, recall and the self-reviewed
build-triage assignment.

Acceptance: grade metrics against controlled predictions; accept an honest
poor result. Collect a baseline comparison on identical held-out rows, a
confusion matrix, a metric justified by the costs and an investigation of
individual mistakes. Choosing the baseline must remain a valid conclusion.

### A18. Several training grades and explanations overstate one run

**High.** `simple-network` still requires a trained group gap above 0.6.
`build-autoencoder` compares two independently initialized fits, confounding
training contamination with initialization, and requires large score ratios.
Its feedback incorrectly says an all-linear network is not an autoencoder.
`predict-next` and `forecast-signal` require loss reductions or output
separation from training outcomes; the latter requires minimum divergence
between two correct rollout methods. Forecast instructions also need consistent
MAE units where inputs are per-channel z-scores rather than physical units.

Acceptance: isolate the variable being demonstrated with paired initial
weights and controlled fixtures. Check real fitting, data membership and
prediction provenance separately from model quality. Assess rollout mechanics
against a deterministic model, including a case where both methods agree.
Remove causal certainty, correct the linear-autoencoder label and make units
explicit. Reproduce any retained measured example with a script and stated
scope. Seeds alone do not prove reliability across backends.

### A19. Wall-clock thresholds can reject correct profiling

**Medium.** `profile-model` requires short measured times and a fixed ratio
between two timed cases. CPU contention can fail a correct implementation.
Acceptance: test await/readback ordering and duration arithmetic with a
controlled clock or schedule. Keep a real browser benchmark as a reported
measurement with environment details, not an absolute learner correctness gate.

### A20. Zero-spread anomaly baselines silently lose a vote

**High.** `ensemble-detector` and `classify-anomaly` map standard deviation zero
to z-score zero even when the new value differs from the constant baseline.
`detect-anomaly` also needs an explicit positive-spread precondition or a
zero-spread policy.

Acceptance: define equal versus different readings against a constant baseline,
including a measurement-tolerance choice if appropriate. Align the lesson,
reference, hint and grader; cover both cases. Do not silently treat every
reading as normal or describe an undefined z-score as a measured zero.

### A21. Boundary and operational contracts need another focused patch

**Medium, with deployment verification claim high.** Resolve these individual
contracts and add meaningful boundary cases:

- `prune-weights`: define whether sparsity 1 is allowed; the current cutoff
  indexes past the array at that endpoint. Define per-class reporting when a
  class has no examples rather than emitting NaN.
- `inference-cache`: distinguish shape and dtype, protect cached arrays from
  caller mutation and state capacity/eviction limits. Value keys alone are
  insufficient for the full caching objective.
- `rag-pipeline`: reconcile an integer event-count contract with validation
  that can admit fractional counts from records. Declare trusted-input bounds
  or validate them. Broaden equivalent valid evidence and boundary probes.
- `find-threshold`: strengthen general candidate-membership and tie tests;
  accept any maximizing supplied candidate as the instructions permit.
- `model-monitor`: name the no-traffic state explicitly. Empty-data zeros do
  not demonstrate health, and a mean-only distance does not detect all drift.
- `verify-deployment`: catching rejection cannot handle a promise that never
  settles, despite the brief's claim. Add bounded probe timeouts or narrow the
  promise to settled checks and teach the missing timeout responsibility.

### A22. Spectral wording needs precise measurement definitions

**Medium.** `compute-fft` overgeneralizes the nearest-bin result to off-bin
signals; mixtures, phases and boundaries complicate it. `apply-window`
labels a sum of magnitudes as energy. Acceptance: state the narrow sinusoid
assumptions for the bin demonstration; either rename the magnitude statistic
or compute squared magnitudes and explain the normalization. Align feedback
with what is actually calculated.

### A23. Harness integration is narrower than several advertised objectives

**High for independent application.** Model loaders, ONNX sessions, pretrained
pipelines and runtime availability use stand-ins for useful contract testing.
They do not prove package installation, actual artifact transport, browser
operator support, offline caching or performance on a learner's device.
Quantization does not run the converter. Capstone tasks do not produce a
learner-authored CI workflow, rollback deployment, API documentation or runbook.

Acceptance: narrow objectives where the task only teaches a contract. Add one
real exported-model application with reproducible setup, frozen preprocessing,
held-out evaluation and failure handling. Exercise at least one real saved
artifact outside the runner; distinguish unit doubles from integration checks.
Do not add real network dependencies to every arithmetic exercise.

### A24. Independent decisions, difficulty and transfer remain unvalidated

**High for the $70 outcome.** Explicit signatures and three hint levels are
appropriate practice, but most tasks continue to prescribe the architecture,
formula and policy. The course rarely collects why the learner chose a scaler,
activation, split, metric, investigation or deployment route. Rendering supplied
metadata is not evidence of authoring a useful model card.

Acceptance: add short decision tasks at the relevant points with plausible
competing options, require evidence in the early transfer report, and build
the final independent project with a public rubric. Include unfamiliar data
and a case where an ordinary rule is preferable. Collect assistance, time,
errors, explanation and a delayed transfer attempt from target JS engineers.
Difficulty labels and estimated minutes remain author estimates until then.
The long prediction and training contracts especially need observed attempts.

## Order of the next patches

1. Correct A16, A18 and A20, then replace the stochastic/timing gates in
   A15, A17 and A19. Address A21-A22 alongside the affected contracts. Keep
   each patch's instructions, hints, solution and feedback consistent.
2. Close A17's assessment coverage and A24's decision gaps. Narrow unsupported
   objectives under A23 and deliver the external project already planned in Q5.
3. Finish the feedback copyedit and prerequisite/rendered checks. Run an
   independent review and learner pilot after repairs. Use those results to
   evaluate the 9/10 gate and $70 value, not the number of exercises or tests.

These tasks are indexed in the [canonical backlog](../post-launch-backlog.md).
Q2-Q3 remain in progress; this coverage pass does not pass their exit gates.

## Compatibility and verification

Exercise slugs remain stable. Seven exercises now display a dated contract
revision with the specific change. Five change argument/return semantics;
`llm-client` and `model-pipeline` tighten validation. Local saved drafts remain
intact and learners can update them using those notes. Existing completion
records are not invalidated. There is no automatic draft migration or new
versioned-completion claim; reassessment requires running the revised task.

Eight production-worker boundary probes reproduced failures before the fixes:
missing CI labels, both single-feature attention results, a constant kernel,
exact-zero crossings, invalid LLM confidence, empty Fibonacci evidence and
non-boolean pipeline output. Two further probes reproduced sensible prompt
variants being rejected. They now pass and are retained in
[assessment-boundaries.test.ts](../../packages/ui/src/mdx/assessment-boundaries.test.ts).
The learner graders also retain regression cases for the repaired behavior.

Verification recorded for this patch:

- Content build completed; all 65 exercise references match the learning map.
- All 65 reference solutions pass the validator, untouched starters fail and
  registered misconception submissions remain rejected.
- Content and production-worker boundary suites: **832 tests pass across 30
  files**, including the ten new boundary/valid-alternative regressions.
- Chromium: all 15 changed exercises accept their solution and reject their
  starter/misconception through the production browser worker. This is runner
  verification, not a visual review of all 56 rendered lessons.
- Workspace typecheck passes. Review-manifest hashes and diff whitespace are
  checked after the final source changes. The final hint-only follow-up also
  passes all 203 metadata/guidance checks.

The manifest also contained three stale hashes from formatting the previous
patch's build-triage README, starter and package file. Comparing each with its
recorded archived copy confirmed formatting-only differences. Those hashes
are refreshed; the assignment and downloadable archive retain the same behavior.

Browser coverage is added to
[education-exercises.spec.ts](../../e2e/education-exercises.spec.ts).
Useful reproduction commands:

```sh
pnpm --filter @tensorcraft/content build:content
node scripts/validate-exercises.mjs --starters --cheats
pnpm vitest run packages/content/__tests__ packages/ui/src/mdx/assessment-boundaries.test.ts
pnpm exec playwright test e2e/education-exercises.spec.ts --project=chromium --workers=2
pnpm typecheck
node scripts/check-content-review.mjs
```

The full Playwright command includes earlier regression exercises too; this
review ran the 15 changed cases using its slug filter. Automated success does
not close the explicitly recorded A15-A24 risks.

## Findings for every exercise

The source-hashed [review JSON](deep-orbit-assessment-review.json) also contains
all lesson/objective judgments. This table is the concise exercise index.

| Exercise | Assessment finding |
| --- | --- |
| `create-a-tensor` | Actual float32 tensor values, rank, backend sum and disposal; supports array/tensor factory alternatives. |
| `reshape-tensor` | Checks rank, shape, row-major values and a shared underlying buffer; view sharing is explicitly part of the task. |
| `add-tensors` | Varies gains, broadcast inputs and matrix banks; meaningful shape/arithmetic evidence. |
| `batch-data` | Checks lazy generator values, batch axes and temporal membership. Random membership comparison remains a risk; a fixed-seed/false probe passed on TFJS 4.22.0, so that proposed rejection was not reproduced. |
| `normalize-data` | Checks training statistics, constant-column handling, min-max and frozen inference statistics. Dense preview is supplied before the neural-network module. |
| `implement-neuron` | Varies width, sign and bias; forbids readback inside the tensor calculation as an explicit objective. |
| `relu-activation` | Accepts tensor arithmetic and checks negative/zero/large positive values. Does not assess choosing sigmoid/tanh. |
| `build-layer` | Counts dynamic widths without allocating quote-sized models; model architecture is prescribed. |
| `forward-pass` | Checks one batched call and returned tensor identity, plus shape repair. Identity is an explicit task contract. |
| `simple-network` | Checks real weight snapshots, model replay and untrained optimizer count. Removed confidence-based inference of training state; trained-outcome threshold remains stochastic. |
| `mse-loss` | Corrected the unsupported activation fallback; BCE now requires declared probabilities or logits and rejects unknown semantics. |
| `gradient-step` | Dynamic losses exercise gradient calculation and subtraction. The supplied single-variable scope does not test multi-variable gradient selection. |
| `backprop-chain` | Numerical and automatic gradient agreement plus call counts; explicit finite-difference contract is narrow but coherent. |
| `training-loop-exercise` | Real fit and iteration counts are useful, but overfitting diagnosis ignores the training curve and stopping-time assertions assume a random outcome. |
| `deep-scan-eval` | Uses real held-out rows and score provenance; healthy is required from an unseeded fit. No graded baseline or confusion-matrix implementation. |
| `browser-ml-tradeoffs` | Rewritten to preserve hard privacy/offline requirements and report conflicting size constraints; latency is an exercise preference. |
| `tfjs-setup` | Cold-runtime doubles exercise await/order and both refusal forms. It does not prove package installation or device availability. |
| `load-model` | Architecture follows a single awaited load, including an injected changed model. Actual network and IndexedDB behavior are not exercised. |
| `inference-pipeline` | Actual shape, feature order, scaling, threshold and tensor cleanup are checked with controlled model outputs. |
| `incident-tensor-leak` | Endpoint rate and conditional headroom are checked without diagnosing growth as a leak. Negative-rate magnitude/deadline checks can be strengthened. |
| `onnx-comparison` | Checks input parity, await/readback timing and disagreement; ONNX is a stand-in and parameter-count backend choice is a heuristic. |
| `load-pretrained-pipeline` | Checks task choice, one load, positional pairing and score ordering. Pipeline output is injected; sentiment validity for incident reports is unassessed. |
| `time-vs-frequency` | Transforms both raw captures and varies phase, offset, length, amplitude and the added tone; strong counterexamples. |
| `compute-fft` | Tests magnitude, DC exclusion and bin-to-Hz conversion. Nearest-bin wording needs qualification for general signals. |
| `build-spectrogram` | Tests whole frames, hops, silence, changing tones and leakage across neighboring bins; taper exclusion is explicit. |
| `fft-features` | Tests fixed frequency columns and varying sample rate; repaired the adjacent-zero crossing inconsistency. |
| `apply-window` | Tests a symmetric Hann interior and elementwise application. Leakage probe currently measures summed magnitude while calling it energy. |
| `create-sequences` | Tests target alignment, stride, empty output, feature preservation and tensor shapes. |
| `build-rnn` | Manual recurrence and gradient products match a real one-unit layer; useful reset/order and exploding/vanishing counterexamples. |
| `build-lstm` | Manual gates match packed weights in the real one-unit layer; sigmoid override and gate order are explicitly taught. |
| `sliding-window` | Tests all retained rows and labels against temporal boundaries, including parameter variations. |
| `predict-next` | Real fit and rollout use shapes, clamps, model reads and disposal. Contract is long; loss-drop thresholds and z-score MAE wording need attention. |
| `detect-anomaly` | Tests sign, strict boundary and changing scales; positive std should be explicitly declared or zero handled. |
| `incident-baseline-drift` | Now reports a Gaussian reference and candidate diagnostics, with independent validation required before deployment. Uses unrounded rates for triage. |
| `build-autoencoder` | Exercises screening and reconstruction fitting, but two independent initializations confound the contamination comparison; strong outcome guarantees remain. |
| `reconstruction-error` | Uses zero, identity and offset models plus live tensor counts; measures reconstruction rather than input energy. |
| `incident-missed-anomaly` | Now ranks measured discrepancies without claiming memorization or prescribing retraining. Baseline is explicitly positive. |
| `find-threshold` | Tests F1 against accuracy, recall and equal-cost error traps; any maximizing supplied candidate is allowed. A new general tie/membership probe would strengthen it. |
| `incident-false-alarm-storm` | Now returns next-check priorities, keeps cause undetermined and reports null for a zero-baseline ratio. |
| `ensemble-detector` | Tests all vote combinations and changing units/cutoffs. Zero spread currently maps every reading to z=0 and needs repair. |
| `simple-attention` | Tests QKV distinction and soft weighting against independent arithmetic; repaired scalar collapse for one value feature. |
| `temporal-attention` | Tests positional scoring, pooling and reversal; repaired one-feature summary rank. |
| `forecast-signal` | Checks both histories against the returned model. Random training and minimum divergence are still used as correctness requirements. |
| `kalman-filter` | Checks gain/state with known and varying parameters, plus lag; this is a specified 1D random-walk model. |
| `weighted-ensemble` | Checks validation-only weights, best-member comparison and both benefit/harm cases; formula is labeled a heuristic. |
| `llm-client` | Now validates allowed classes, finite bounded numeric confidence and non-empty text. JSON extraction is deliberately limited to one object. |
| `prompt-template` | Relaxed wording tests after reproducing two sensible rejected prompts; checks structure, not actual LLM obedience. |
| `retrieve-signals` | Varies filters, case, clock, cap and database order. It is a declared regex query parser, not semantic retrieval. |
| `rag-pipeline` | Checks record/field/unit/operation provenance and unsupported prose; count-integrality and valid tie/boundary breadth can improve. |
| `generate-report` | Tests assembly/withholding order with changed headings and bodies. Boolean verdicts are supplied, not independently verified. |
| `model-pipeline` | Now validates detector and alert outputs as well as classifier confidence; real classifier preprocessing is tested. |
| `profile-model` | Checks resource cleanup and mean readback timings; real timer cutoffs can reject correct code under contention. |
| `quantize-weights` | Repaired constant kernels; tests restore weights and compare actual class decisions. Does not exercise converter output or quantify accuracy from labels. |
| `prune-weights` | Checks global cutoff, fresh originals per level, per-class counts and final restore. Endpoint sparsity and missing-class behavior are underspecified. |
| `inference-cache` | Tests ordered values, decimal precision, persistence and tensor release. Shape/dtype and returned-value mutation protection are missing. |
| `incident-stale-verdict` | Tests inclusive age boundary, version mismatch and rollback; a fresh entry can still be approximate or wrong for reasons outside this exercise. |
| `gpu-backend` | Tests caller preference, false/throw refusals, first success and final ready; actual hardware remains unverified here. |
| `pipeline-architecture` | Uses real normalization/FFT with async middle and final stages; validates before processing. Architecture is a given chain, not designed by the learner. |
| `ci-cd-gate` | Repaired missing/null/empty labels counting as matches. Conservative batch score keeps missing labels in the denominator. |
| `export-model-artifact` | Actual save handler, artifact byte count, mixed precision sizes and reload prediction agreement; strong integration exercise. |
| `model-monitor` | Tests numeric order statistics and mean-vector distance. Empty-data zeros are sentinels, not evidence of model health; shape/scale assumptions need clearer bounds. |
| `write-model-card` | Checks metadata rendering, benchmark attribution and weakest recall across varied classes. Does not assess authorship of an adequate model card. |
| `verify-deployment` | Checks ordered awaiting, rejection reporting and empty runs with real inference probes. A promise that never settles is not handled despite the instruction claim. |
| `launch-rehearsal` | Checks the actual training rows/schedule/trace, warm optimizer state, canary score provenance, gate decisions and cleanup. The project and policy are supplied. |
| `classify-anomaly` | Repaired empty-pattern evidence; real votes and ratio tolerance are checked. Zero-spread handling and the fictional confirmation label still need careful scope. |
