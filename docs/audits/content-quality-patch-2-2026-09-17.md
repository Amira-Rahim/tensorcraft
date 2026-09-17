# Content quality patch 2: teaching, prose and early transfer

Date: 2026-09-17. Local implementation following revision `e773240b`.
This implements another part of Q1-Q3 in the [approved plan](../content-quality-plan.md).
It does not certify a 9/10 course, establish learner outcomes or change pricing.

## Coverage and editorial changes

Read the teaching prose, dialogue, recall and recap in the 18 Deep Orbit
lessons outside the original audit's close-reading sample. Corrected claims
and shortened recaps in those 18; also amended the evaluation lesson where
the new assignment belongs. This closes the original prose sampling gap,
not the whole-artifact review gap. Not every code block or historic benchmark
was reproduced, and this is not independent editorial approval.

The manifest lists the 18 paths and scopes. Their previous 62 recap bullets
contained 2,305 whitespace-delimited words, with 13 bullets at least 50 words
long and a maximum of 90. The revised 68 bullets contain 1,009 words; the
longest is 27 words. These counts describe editing, not comprehension gains.

Changes address the binding rubric's categories:

- Unsupported substance: removed guarantees about attention, ensembles,
  recurrent memory, prompts, pipeline accuracy and memory diagnostics.
- Overloaded or wordy language: shortened recap claims, split explanations,
  and moved the prompt's long calibration conversion into an optional drawer.
- Unnecessary repetition: removed repeated story timings from retrieval
  questions and some explanations about how to defeat exercise tests.
- Formulaic language: replaced several staged analogy corrections with the
  actual computational distinction; retained the story's established events.

## Additional findings and repairs

| ID | Finding | Repair and evidence boundary |
| --- | --- | --- |
| F18 | Squared MAE described as variance; predicted MAE gain from sqrt(N) | Ensemble body, recap, hints and exercise now call inverse-squared-MAE weighting a heuristic. A runnable counterexample has equal MAE and unequal variance. Compare with the best member and reserve final evaluation data. |
| F19 | Tensor growth proves a leak; flat count proves no leak; weight bytes equal memory footprint | Inference, profiling and incident feedback distinguish measurements from diagnosis. Explain tidy exceptions and warmup limits. The incident function is now `estimateTensorHeadroom`, returning `growing`, not a leak diagnosis. |
| F20 | Attention fixes distant dependence; softmax weights never zero; any shuffle preserves output | Scope the observed LSTM failure. Explain masks/rounding and the fixed-query, jointly permuted key/value condition. Keep the cost distinction between one-query pooling and full self-attention. |
| F21 | FFT loses timing; a between-bin tone occupies two bins; Hann shrinks every bin; COLA is necessary for reconstruction | Distinguish complex spectra from magnitude plots, demonstrate leakage across many bins, and explain changed peak shapes. Clarify NOLA, normalization and capture boundaries in the optional reconstruction material. |
| F22 | Fixed RNN reach, loss 0.693 proves vanishing gradients, LSTMs guarantee retention | Distinguish an example gradient path from a general bound. Ask for predictions, data checks and gradients before diagnosing training failure. Clarify three gates plus a candidate and retained weights versus reset state. |
| F23 | Prompt structure guarantees parseable or accurate output; 0.95^4 is always system accuracy | State the generation and review limits. The product is the probability all four independent events hold, not an automatic measure of final system accuracy. Typed plausible predictions still need evaluation. |
| F24 | API and measurement comparisons overstate behavior | Fix model-file renaming instructions, resource ownership, backend timing scope, Worker/GPU comparisons, cache ownership, MAE interpretation and forecast-horizon claims. |

The `tf.tidy` exception wording follows the installed 4.22 contract and the
[TensorFlow.js API reference](https://js.tensorflow.org/api/4.22.0/#tidy).
Backend claims are scoped to workloads and devices, consistent with the
[TensorFlow.js environment guide](https://www.tensorflow.org/js/guide/platform_environment).
The reconstruction correction follows SciPy's
[NOLA documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.check_NOLA.html)
and [COLA documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.check_COLA.html),
including the distinction between convenient constant overlap and a nonzero
normalization denominator. These references support those specific claims,
not the accuracy of every lesson or story benchmark.

`education-counterexamples.test.ts` executes the new MAE/variance and off-bin
FFT examples from their authored CodeBlocks. The spectral example also checks
that it leaves no tensors allocated. It does not simulate physical sensors.

The incident contract change affects saved learner code: a draft written for
`diagnoseLeak` / `leaking` must adopt the new function and `growing` field.
The exercise slug is unchanged, so progress identifiers remain stable.
The solution, hint, feedback, misconception submission and browser check all
use the new contract.

## Learning progression and independent assignment

The [progression review](deep-orbit-learning-progression.md) maps all 11
modules and the foundational concepts. The accompanying JSON inventories
all 56 lessons and 65 exercise references. Objective-by-objective assessment
validity and semantic feedback review are explicitly still pending.

The evaluation lesson now explains a majority-class baseline before the
scoring example. Its Challenge pane adds build failure triage after the
first classifier evaluation:

- 720 original synthetic builds, with prediction-time field definitions,
  outcome-only columns and a chronological record.
- Downloadable data, runnable JS starter, Node setup and CC0 reuse terms.
- Learner-chosen features, split, baseline, model and metric; evidence includes
  error cases, limitations and commands needed to reproduce the result.
- Optional rescue hints recorded separately from self-reported outside help.
- A report saved in the browser tab, export/import, and an explicit
  self-review marker. No XP, completion gate or verified mastery claim.
- Edits invalidate the self-review marker. Loading an earlier report retains
  hints already revealed in the current tab and requires a fresh self-review.

The assigned 60-90 minutes is an author estimate pending learner observation.
The report is not account-synced. Closing the tab can lose the tab draft;
the UI asks learners to download it. Blocked tab storage produces a clear
message rather than a false saved indicator.

A fixed maintainer feasibility run uses 480/120/120 chronological rows,
training-only scaling, four prediction-time features and a single sigmoid
unit. With the recorded seed and settings, the final period has 31 failures
and 89 successes. At a 0.5 threshold, the model catches 21 failures, misses
10 and raises 5 false alarms. A training-majority baseline predicts success
for every row and misses all 31 failures. Model log loss is about 0.298,
compared with 0.571 for a constant training-prevalence score. This is a
synthetic fixture development check, not a requirement imposed on learners
or an estimate of production performance. The fixture was revised during
authoring; these are the final fixture's results, not a claim of an untouched
research benchmark.

Reproduction commands:

```sh
node scripts/generate-build-triage.mjs
python3 scripts/package-build-triage.py
node scripts/verify-build-triage.mjs
node scripts/check-transfer-browser.mjs
```

## Verification

- Content build passed; the generated inventory covers 11 modules, 56 lessons
  and 65 exercise references.
- Content and focused renderer/journal tests: 841 passed across 31 files.
- Exercise validator: all 65 solutions passed, with untouched starters and
  registered misconception submissions rejected as expected.
- Chromium worker tests for `weighted-ensemble` and `incident-tensor-leak`:
  both passed, including solution, starter and misconception cases.
- Local component browser check passed: render, tab restore, assistance record,
  report download/import, ZIP download and desktop/mobile overflow checks.
  The 375-pixel layout was visually inspected.
- ZIP contents matched the source files; the extracted starter ran on Node
  using the workspace's installed TF.js 4.22.0. A fresh network install was
  not part of this check.
- Workspace typecheck passed. Targeted web lint had no errors and six existing
  warnings in lesson-content/lesson-steps; no warnings in the new components.
- Review-manifest hashes and `git diff --check` passed.

Browser component verification uses the production component, stylesheet and
public assets on a local Vite page. It covers the journal and download behavior,
not authenticated navigation through the paid lesson. The renderer test
separately checks that the component appears only in its selected step.

## Remaining acceptance work

- Complete the current-revision review of all 56 lessons and 65 exercises,
  including every code example, numerical claim, analogy body and glossary.
- Finish objective-level assessment and feedback review and external scoring.
- Build consequential story choices and the independent final project.
- Run the planned independent subject/editorial reviews and learner pilot,
  including unassisted transfer and delayed recall.
- Use actual learner and purchase evidence before making a $70 value claim.
