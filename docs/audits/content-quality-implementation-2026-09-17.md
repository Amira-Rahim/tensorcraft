# Content quality implementation: factual corrections

Date: 2026-09-17. Implements the first stage of the
[approved quality plan](../content-quality-plan.md), following the
[original audit](education-product-audit-2026-09-17.md).

Status: corrections implemented locally and automated checks passed. Full
course review, independent approval, and learner evidence remain pending.
No category has been promoted to 9/10. The original audit describes the
pre-change revision and is preserved as that record.

## Correction ledger

Locations below are relative to `packages/content/content/`. The manifest
records exact paths and hashes. “Corrected” means the named issue was
repaired, not that the entire lesson or world passed a full review.

| ID | Location and correction | Evidence and remaining limit |
| --- | --- | --- |
| F01 | Deep Orbit foundations/04, batch-data, and training-loop/05: time-ordered train/validation membership, training-only shuffling and preprocessing, capture grouping/gaps where needed. Removed the later recall question's stale random-split account. | Executed the displayed split. Correct solution passes; a disjoint split containing future training rows fails. Broader independent split selection belongs to Q2/Q5. |
| F02 | Foundations/05: an ambiguous score does not establish novelty, and unfamiliar inputs can receive confident scores. Fixed the dialogue and interpretation of the hand-weighted preview neuron. | Primary research and source review. No claim of a measured calibration experiment. |
| F03 | Anomaly-detection/02, /03, /05: removed autoencoder guarantees and claims that detector agreement proves novelty. | Executed the displayed low-error anomaly and normal false alarm. Existing missed-anomaly exercise preserved. |
| F04 | LLM-integration/01, /03, /04, /05 and rag-pipeline: structured claims retain source IDs, fields, units, and permitted calculations. Numeric screening stays limited; free prose awaits explicit review; automated alerts use measured-value templates. | Grader rejects swapped fields, wrong sources/units, missing evidence, duplicate citations, unsupported text, and invalid sums. Executed report-review and template-alert examples. Source quality and prose interpretation still need review. |
| F05 | Anomaly-detection/04 and find-threshold: separated F1 from equal error cost; selected a validation cutoff before test evaluation. Fixed all-zero F1 sweeps returning a threshold absent from the candidates. | Executed the F1-versus-cost counterexample; new grader cases pass and incorrect accuracy/F2 objectives fail. |
| F06 | Foundations/05 and normalize-data: moments returns variance, std requires a square root, and a constant feature uses divisor 1 while its saved statistic stays zero. Reuse that policy at inference. | New grader covers constant training columns, changed future values, unchanged saved statistics, and min-max scaling. CPU and Chromium worker checks passed. Simplified the instructions and hints. |
| F07 | Neural-networks/03: eight-unit XOR training failures concern optimization, not proof of insufficient capacity. | Executed the learner-facing two-ReLU XOR construction. Historical training-success percentages were not independently rerun. |
| F08 | Training-loop/05: sensitivity/FPR transfer assumes unchanged threshold and within-class distributions. A prefilter can change both. The Bayes example's FPR is explicitly assumed. | Added a recall scenario about prevalence, threshold, and sensor changes. Removed the false monotonic-precision claim. |
| F09 | Optimization-edge/03: small weights do not universally store rare patterns; magnitude is a fallible proxy. | Executed the same ReLU function with differently scaled adjacent weights. Per-class measurements remain the evidence for pruning damage in the fixture. |
| F10 | All 56 Deep Orbit frontmatter bridges and recap bridges received a focused source review. Corrected invented distinctions about rendering, fetch, caching, model tests, middleware, rollback, event flow, training, and deployment. | Known comparisons repaired, including relevant nearby repetitions. Whole-lesson reading, all body analogies, browser/Node prerequisite explanations, and rendered review remain open. This focused pass does not close the full F10 acceptance gate. |
| F11 | Nova generative-basics/01: generator input/output contracts and possible memorization replace “loss change only” and “never copies” claims. | Executed the displayed classifier/generator shapes. Full draft-world review and learner assessment remain pending. |
| F12 | Neon convolutional-neural-networks/01 and apply-convolution: same padding preserves size at stride 1; stride 2 rounds up. Fixed the exercise collapsing a 1x1 result to a scalar despite its rank-2 contract. | Formula checked against real TFJS convolutions. Updated solution/starter/misconception checks passed in the shipped Node worker. |
| F13 | Signal Ward opening and finale: compare rules/models/hybrids, identify hand-chosen weights, and separate one alert from system validation. Removed the clinical scene downplaying an interaction risk. Fixed ordinary-web rollback claims and the unused memory threshold. | Clinical source checked; executed monitoring threshold example; draft MDX parsed. Clinical NLP/domain review remains a release gate. No medical deployment validation is claimed. |
| F14 | Terra privacy-preservation and private-training: define adjacency, epsilon/delta, sensitivity, composition, and the limits of the guarantee. Replaced the uniform-noise exercise with clipping plus supplied standard-normal draws. | One-release formula rejects parameters outside its stated bound. Deterministic grader verifies clipping before noise and supplied-draw use. This is arithmetic practice, not a certified private training implementation; privacy specialist review remains required. |
| F15, added | Shared glossary and Deep Orbit anomaly-detection/05: semi-supervised learning generally mixes labeled and unlabeled training data. Normal-only anomaly-detection usage is identified as a narrower convention. | Definition checked against scikit-learn; removed the claim that a labeled cutoff is the general definition. Full glossary review remains open. |
| F16, added | Deep Orbit advanced-time-series/03: a horizon's mean absolute error is not a calibrated prediction interval. | Replaced the “probability cone” claim with the need for held-out error quantiles and coverage checks. No interval estimator has been added or certified. |
| F17, added | Deep Orbit training-loop/05 and deep-scan-eval instructions: a train/test gap is a diagnostic signal, not proof of overfitting or release health. | Recall now considers data shift, labels, and preprocessing. Exercise's existing string labels are explicitly provisional; its grading contract remains compatible. |

The editorial changes address unsupported substance, overloaded sentences,
and repeated explanation. They do not replace the full Q3 edit. The story's
signal constants, irreversible lost capture, and ending are preserved; no
new Deep Orbit choice consequences have been implemented in this stage.

## Review coverage and standards

The [manifest](content-review-manifest.json) records every one of the 56
Deep Orbit lessons and 65 exercises. It includes authored objectives,
declared module prerequisites, required review checks, source hashes,
targeted findings, and evidence. These declarations have not yet been
validated as a lesson-level curriculum map.

- 61 Deep Orbit artifacts have partial review or corrections; 60 remain
  pending. All whole-artifact checks remain pending.
- All 56 frontmatter/recap bridges have a recorded focused review. That
  scope is narrower than reviewing every comparison in every lesson body.
- Seven changed draft artifacts and the shared glossary have supporting
  hash records. The rest of the draft corpus has not acquired review status
  from these targeted repairs.
- No artifact has independent approval or a full editorial/learner pass.

Run `node scripts/check-content-review.mjs` to detect missing entries,
changed content, duplicates, or removed files. A current hash establishes
bookkeeping, not educational quality. Invalidate affected checks before
updating a changed artifact's recorded hash.

[The quality rubric](../quality-rubric.md) now blocks consequential teaching
errors rather than permitting a percentage. Dialogue is judged by purpose
and pacing. The [story bible](../story-style-bible.md) now agrees with the
repo-wide punctuation rule, including code that detects the banned character.

## Primary evidence

- Temporal dependence and preprocessing:
  [scikit-learn cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html#cross-validation-of-time-series-data).
- Confidence on unfamiliar inputs:
  [Lee et al.](https://arxiv.org/abs/1711.09325).
- Autoencoders reconstructing anomalies:
  [Bouman and Heskes](https://arxiv.org/abs/2501.13864).
- F1 threshold optimization:
  [Lipton et al.](https://arxiv.org/abs/1402.1892).
- TensorFlow statistics and operations:
  [TFJS API](https://js.tensorflow.org/api/latest/#moments), plus execution
  against the installed TFJS runtime.
- Browser comparisons:
  [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch),
  [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage),
  [prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/prefetch),
  and [Transformers.js pipelines](https://huggingface.co/docs/transformers.js/api/pipelines).
- Generative memorization:
  [Carlini et al.](https://arxiv.org/abs/2301.13188).
- Convolution padding:
  [TensorFlow Conv2D](https://www.tensorflow.org/api_docs/python/tf/keras/layers/Conv2D).
- Clinical interaction correction:
  [NHS Specialist Pharmacy Service](https://www.sps.nhs.uk/articles/managing-interactions-with-methotrexate/).
- Privacy definitions and mechanism limits:
  [Dwork and Roth](https://www.cis.upenn.edu/~aaroth/Papers/privacybook.pdf),
  [NIST introduction](https://www.nist.gov/blogs/cybersecurity-insights/differential-privacy-privacy-preserving-data-analysis-introduction-our),
  [TensorFlow Privacy tutorial](https://www.tensorflow.org/responsible_ai/privacy/tutorials/classification_privacy),
  and [Abadi et al.](https://arxiv.org/abs/1607.00133).
- Semi-supervised learning:
  [scikit-learn API](https://scikit-learn.org/stable/api/sklearn.semi_supervised.html).

## Automated verification

- `pnpm turbo build:content`: revised launched content compiles.
- `pnpm test:exercises`: all 65 solutions pass; registered starter and
  incorrect-solution checks pass, including the new probes.
- `pnpm exec vitest run packages/content/__tests__ packages/content/src/contract.test.ts`:
  837 tests passed across 29 files at this checkpoint. Twelve tests execute
  displayed examples directly; two more run the changed draft exercise
  contracts through the shipped Node worker.
- `EXERCISE_CORPUS=1 pnpm exec vitest run packages/ui/src/mdx/exercise-corpus.test.ts -t 'batch-data|normalize-data|rag-pipeline|find-threshold'`:
  four changed exercises pass; 61 intentionally skipped here and covered
  separately by the full CLI validation.
- `PW_PORT=3107 pnpm exec playwright test e2e/education-exercises.spec.ts --project=chromium --workers=1 --reporter=line`:
  four tests pass using the shipped runner in real Chromium workers.
  Each accepts the solution and rejects the starter and a misconception.
- `pnpm typecheck`: all 10 tasks pass.
- Five changed draft MDX files parse with the installed MDX compiler and
  YAML parser without adding their worlds to the released collection.
- `git diff --check` and the review manifest check pass.

The browser checks exercise execution from the public introductory page.
They do not bypass paid access, walk every revised lesson, or establish
support on every browser, device, or GPU backend. Passing tests establish
specific contracts, not novice comprehension, retention, or clinical/privacy
readiness.

## Compatibility and next work

Lesson and exercise slugs are unchanged. No stored progress, entitlements,
or user data were edited. Earlier completions are not evidence of passing
revised assessments. Saved `batch-data`, `normalize-data`, or `rag-pipeline`
solutions may need changes to match their visible contracts. The RAG result
now uses claim IDs in `verified` and `unverified`; instructional callers
have been aligned. The two draft exercise contracts also changed as recorded
above; their worlds remain unreleased.

Curriculum/assessment versioning in analytics remains Q8 work. Do not pool
old and new learning results as equivalent evidence.

Next: finish the remaining full-reading coverage and in-context bridge
checks, build the objective/practice map, and edit the course's recaps and
exercise instructions. Then implement the early transfer assignment,
persistent story consequences, and independently runnable project. External
review, the learner pilot, $70 purchase evidence, and acquisition evidence
remain required by the approved plan. These have not been replaced by an
agent's self-rating.

No deployment, price increase, commit, or push was performed. The offer
remains $50. This completes a factual-correction checkpoint, not the whole
quality plan.
