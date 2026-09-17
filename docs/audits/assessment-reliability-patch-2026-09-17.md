# Assessment reliability patch

Date: 2026-09-17. Base: `92cf8f27`. Reviewer: Codex, local author-side review.
Status: implemented and verified locally; broader assessment acceptance remains open.

This patch repairs the next five assessment priorities across 19 exercises:
loss-curve interpretation, training-result grading, zero-spread anomaly rules,
timing/shuffle checks, and operational boundaries. Instructions, affected
lesson hints, solutions and graders now describe the same contracts. Changed
contracts carry a dated revision note where learners need a new signature or
return value. No price or release setting changes.

## Changes and limits

| Finding | Correction | Remaining limit |
| --- | --- | --- |
| A15 | `batch-data` exposes `makeDataset(source)`. A controlled source observes shuffle-before-batch and buffer size; real drains still check laziness, values and shapes. | A fixed-seed shuffle is accepted. The grader does not estimate shuffle quality from two random outcomes. |
| A16 | `training-loop-exercise` separates a real fit from callback tests on controlled histories. Short histories and reaching the epoch limit are valid. Trend labels use both curves, with finite/nonnegative validation and explicit zero and 5% boundaries. | The returned trend describes measurements, not a proven cause. The exercise still specifies the callback policy. |
| A17 | `deep-scan-eval` removes required loss reduction, minimum accuracy, maximum loss and a required healthy verdict. It checks training records, held-out membership, fresh evaluation and reported score provenance. Feedback names score gaps without asserting memorization. | Graded baseline selection, a confusion matrix, metric rationale and individual error investigation remain open under A17/A24. |
| A18 | `simple-network`, `build-autoencoder`, `predict-next` and `forecast-signal` retain real fitting and prediction checks without required class separation, error ratios, loss drops or forecast divergence. Supplied models observe fit inputs, targets, options and history identity. Deterministic forecast cases test changed histories and legitimate agreement. | The confounded autoencoder comparison is removed from grading. A learner-run contamination experiment needs matched weights and a controlled schedule. Historic narrative benchmarks have not been reproduced by this patch. |
| A19 | `profile-model` accepts an optional clock. Controlled readback costs test awaiting, warmup exclusion and the arithmetic mean. No wall-clock speed or ratio determines correctness. | Real default-clock calls still measure the current device. This patch provides no cross-device performance benchmark. |
| A20 | `detect-anomaly`, `ensemble-detector` and `classify-anomaly` distinguish a matching constant reading from a changed one. The ensemble returns a null z-score when spread is zero. Decimal constants are checked before float32 conversion. | Exact equality is this exercise's policy. Real sensors need an explicit measurement tolerance. |
| A21 | Pruning handles full sparsity, missing classes, restoration after errors and tensor disposal. Cache keys include shape/dtype, copies protect values, and bounded LRU eviction is tested. Counts require safe nonnegative integers. Threshold tests admit tied maximizers. Empty monitor data is null. Deployment checks have bounded waits and request cancellation. | The cache assumes an immutable model/preprocessor lifetime and approximate rounded keys. The monitor is a short-session example. Aborting a signal cannot forcibly stop noncooperative work. |
| A22 | FFT wording distinguishes an illustrative sinusoid from general peak behavior. Windowing measures summed far-bin magnitude, not energy, and limits its 20x result to the specified fixtures. | This does not establish a general leakage-reduction factor. |

A15, A16, A20, A21 and A22 have targeted local corrections. The grading
portions of A17-A19 are corrected; their wider assessment or benchmark
requirements remain open where listed above. A23 and A24 are not closed.
The manual objective evidence counts remain 118 guided, 52 partial,
23 self-checked recall and 29 explanation-only. More reliable graders do
not turn guided implementation into independent decision-making.

## Implementation evidence

- Production Node-worker regressions cover constant decimal baselines,
  absence versus zero, protected cache results, bounded deployment checks,
  controlled profiling, and a genuinely poor real classifier fit. The latter
  uses zero initial weights with the original optimizer and schedule, and
  verifies that both measured scores are low before accepting the report.
- Valid-alternative probes accept fixed-seed shuffling and choosing the last
  maximizing threshold when several candidates tie.
- Registered misconception submissions were updated to the new signatures
  and result labels, preserving the intended wrong behavior.
- The first browser run exposed an autoencoder timeout. The grader now shares
  one real screened fit across assertions and checks alternative selections
  through a supplied model, including an empty flag log. The worker's
  30-second limit was not raised. A later parallel run timed out in four
  training cases. All five targeted serial rechecks passed. The browser test
  file now runs cases sequentially to avoid competing training jobs.
- The standalone validator now exposes AbortController and AbortSignal,
  matching the existing browser and Node-worker environments.
- Content build, targeted content/worker tests, browser-worker execution,
  workspace typecheck and review-manifest checks are recorded below. These
  are local checks, not deployed-product evidence.

## Validation

| Check | Result |
| --- | --- |
| Content build | Passed. |
| Full exercise validator, including starters and registered misconceptions | 65 passed, 0 failed, 0 warned; no untouched-starter credit advisories. |
| Content tests plus both assessment worker regression files | 840 tests passed in 31 files. |
| Workspace typecheck | 10 tasks successful. |
| Chromium worker checks | All 19 affected cases passed across the main run and serial rechecks. The final two changed graders passed again with sequential execution enforced. |
| Review manifest | 121 Deep Orbit artifacts and 40 supporting artifacts have current hashes; all 121 whole-artifact statuses remain partial. |
| Diff whitespace and newly added banned punctuation | Passed. |

Reproduce with:

```sh
pnpm turbo build:content
node scripts/validate-exercises.mjs --starters --cheats
pnpm vitest run packages/content/__tests__ packages/ui/src/mdx/assessment-boundaries.test.ts packages/ui/src/mdx/assessment-reliability.test.ts
pnpm typecheck
node scripts/check-content-review.mjs
```

Browser scope: `e2e/education-exercises.spec.ts`, Chromium, the 19 exercise
exercises covered by A15-A22. The fixture runs the reference, untouched
starter and primary registered misconception through the shipped browser
worker. It does not navigate every paid lesson or verify its rendered layout.
The file now runs sequentially even when Playwright allows two workers.

## Editorial and factual scope

The focused edit addresses unsupported causal conclusions, ambiguous units,
missing-data sentinels and repetitive diagnostic wording. Learner-facing
feedback now distinguishes a measured result from a proposed investigation.
The forecast MAE is in per-channel z-score coordinates; physical errors need
inverse scaling and per-channel reporting. Linear autoencoders are valid;
the nonlinear stack is this particular task's requirement.

Early stopping behavior was checked against the installed TFJS 4.22.0
implementation and controlled callback histories. The
[TFJS callback reference](https://js.tensorflow.org/api/4.22.0/#callbacks.earlyStopping)
documents its monitoring and patience settings. The timeout example makes
cancellation cooperative: settling a race does not terminate the losing
operation. See [MDN's Promise.race reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race).

This is a focused author-side pass. It does not complete whole-course
fact checking, all feedback copyediting, story continuity, rendered lesson
accessibility, historical benchmark reproduction, independent review or a
learner pilot. The manifest keeps those checks pending.

## Next assessment work

1. Collect baseline, split and metric decisions, plus error analysis, as
   assessed evidence. Accept a defensible choice to retain the baseline.
2. Run an exported model in an external application and check real runtime,
   artifact-loading and caching behavior. Stand-ins remain useful contract
   tests but do not establish this integration.
3. Complete the independent project and rubric, then observe unfamiliar
   JavaScript engineers, recording time, assistance and delayed transfer.

These gates remain in the [canonical backlog](../post-launch-backlog.md).
Neither passing tests nor these repairs establish a 9/10 course or prove
that learners receive $70 of value.

The subsequent [independent assessment patch](independent-assessment-patch-2026-09-17.md)
implements decision tasks and the external project scaffold. Its report
records the current remaining acceptance gates and updated evidence counts.
