# Deep Orbit quality audit: applied modules, 2026-10-16

Scope: every source line in the 15 lessons and 20 exercises in
`anomaly-detection`, `llm-integration`, and `optimization-edge`, including all
three module descriptions. The review covered frontmatter, scene and speaker
metadata, dialogue, bridge limits, code and comments, objectives, hints,
exercise starters/solutions/graders, every recall prompt and recap, epilogues,
saved decisions, and their later consequences. The shared layout was reviewed
through its activity specifications; browser layout inspection belongs to the
parent audit.

The ongoing standard is the [binding lesson quality contract](../../CLAUDE.md#lesson-quality-contract-binding-2026-10-16).
All section columns below were reviewed. A pass means no confirmed source
defect remained in that section after the listed fixes. It does not mean a
fictional instrument result or arbitrary future model has been scientifically
validated.

## Coverage by lesson

| Lesson | Briefing and story | Concept and visual activity | Challenge, grader, hints | Takeaways and recall | Epilogue and continuity |
| --- | --- | --- | --- | --- | --- |
| Normal vs Anomalous | Reviewed baseline need, Nazari's alert cost, 7741 exclusion decision and its four outcomes. | Baseline mean/population std, nearest-rank percentiles, bounded-amplitude z-score and Gaussian caveats checked. Shared slider uses an explicitly separate five-reading baseline. | `detect-anomaly` and `incident-baseline-drift` pass; zero spread, both tails, changed baseline, unrounded triage rate, and independent-validation warning covered. | Recall's 270 expected hourly flags is correct under its stated rate. Recap distinguishes cutoff, probability, and drift investigation. | Original capture remains unchanged. The saved decision changes review work rather than the reading's true label. |
| Autoencoders | Changed the overbroad claim that a threshold reads one feature at a time to describe this particular z-score check. | The 11-feature bottleneck architecture and normal-only training are valid. Averaging activity explicitly demonstrates information loss rather than trained weights. | `build-autoencoder` passes. Added an explicit distinction between its eight synthetic features and the mission example's eleven. Screened-row selection, held-out finite errors, ownership and failed-fit cleanup are checked. | Recall correctly permits low-error anomalies; no guaranteed separation ratio. | 412 suspect rows, 1.4x error, and 90 minutes are labeled fictional findings, not reproduced exercise results. 7741 choices retain their costs and uncertainty. |
| Reconstruction Error | Replaced ambiguous “guarantee a miss” dialogue with checking how the model rebuilds this reading. | MSE and per-feature squared errors checked. Constructed distant-input counterexample really has zero error. Simplified bridge wording while retaining scalar-vs-feature distinction. | `reconstruction-error` and `incident-missed-anomaly` pass. Input-only energy, same-error-offset models, cleanup, relative ranking and tie order covered. | Recall correctly separates aggregate mismatch, feature location and physical cause. | fft_5 is the 72 Hz-centered bin nearest 73.4 Hz; no claim that a coarse bin measures 73.4 exactly. ARIA's requested 400-case replay continues in caching. |
| Threshold Tuning | Crew cost conflict remains visible; no promise that one threshold eliminates both error types. | Percentile arithmetic, F1-vs-cost counterexample and train/validation/test separation checked. Shared activity now uses the same strict greater-than cutoff as the exercise. | `find-threshold` and `incident-false-alarm-storm` pass. Graders distinguish F1 from accuracy, recall and F2; zero baseline, runbook order and unrounded boundaries covered. | Three recalls cover F1, differing error costs and about 183 weekly flags. Their numbers and sampling limits are correct. | Replay removes 12 false alerts and keeps two signal alerts as a fictional observation. The next capture is still unresolved. |
| The Anomaly | Replay of 7741 precedes the live alert. The amplitude gate remains quiet while AE and LSTM flag. | Verified scale separation and MSE vs amplitude-error units. Clarified Fibonacci numbers as relative gap lengths rather than seconds or hertz. Shared activity now uses the actual statistical, reconstruction and forecast gates plus a 2-of-3 decision. | `ensemble-detector` passes. Clarified that the function accepts other nonempty window lengths, not only the main eight-reading case. Checks cover both tails, caller cutoffs, majority combinations, constant windows, float32 precision loss and invalid scores. | Replaced an unrelated autoencoder-basics recall with three checks on the actual task: majority decision, votes vs probability, and shared blind spots. Root must version the `the-anomaly` recall contract. The separate bounded-amplitude recall is preserved. | 0.9987 correlation and calibration-path vs external-source hypotheses preserve canon. The text does not resolve the source. |
| LLMs for Science | Six-hour deadline, 47-day event counts, verification ledger and first fabrication remain coherent. | HTTP adapter and limited numeric screen execute against controlled service boundaries. Moved transformer architecture detail into an optional reference so parsing one reply remains the main task. Shared claim-check activity has an explicit fixed-example boundary. | `llm-client` passes. Wrapped JSON, absent/renamed fields, finite score endpoints, malformed JSON, extra fields and fresh replies covered. Regex extraction is explicitly a constrained exercise contract. | Recall preserves draft, evidence review, correction and approval, including review fallibility. | 63.1-second interval fits acceleration. ARIA finds an unsupported instrument without acquiring new scientific knowledge. |
| Prompt Engineering | Genuine peer review starts from failed v1. The missing catalogue line is the next concrete repair. | Clarified central-90% amplitude band versus sensor range and decision threshold. The 73.4 Hz prompt field now comes from the longer spectrum measurement; a 64-sample, 256 Hz window has 4 Hz bins. Role-message labels remain distinct from a requested analyst perspective. Added a visible four-part prompt builder with a separate catalogue and changed practice reading. | `prompt-template` passes. Matching solution hint and solution copy were updated together. Fresh inputs, separated catalogue/current values, order and requested fields are checked. | Recall correctly treats the four parts as a task checklist, not universal prompt law, and keeps JSON validation and fact checking. | Prompt v8/v9 held-out comparison remains unresolved before retrieval work. One improved reply does not prove a better prompt. |
| RAG for Signals | Demir's Server Components analogy fails on-page and costs an audit hour. | Retrieval cap, complete-match count, source IDs, named fields, units, supported operations and token budget are explicit. Shared keyword activity is accurately labeled as a separate toy search. | `retrieve-signals` and `rag-pipeline` pass. Graders reject future/invalid timestamps, wrong bands, cap-before-filter, field swaps, wrong sources/units, repeated citations, unsupported text, unsafe counts and empty evidence. | Recall tests meaning and source scope rather than mere digit matching. | 14 retrieved records versus 17 claimed records is a plausible unverified-generation failure. Later field checks assist but do not approve free prose. |
| Report Generation | Failed Methodology and the 22-minute review constraint support section-by-section work. All saved choices respect approval before release. | A new draft loses old approval; final cross-section review remains required. Shared activity distinguishes a complete report from assembly of approved sections with an explicit Withheld list. | `generate-report` passes. Approved order, withheld heading list, no withheld body, separators, empty report and changed approval flags covered. | Recall covers local evidence review and whole-document consistency. | Five approved sections leave at 0411 with explicit omission. No choice silently publishes rejected text. |
| Multi-Model Systems | Simplified Demir's opening without claiming that the autoencoder simply “knows normal.” | Verified stage feature widths, individual frozen scalers, sigmoid score bounds, AE MSE and optional forecast behavior. Measured alert and LLM draft remain separate. Shared detector uses explicit fictional 0-to-1 scores, strict threshold comparison, and a warning that reconstruction MSE can exceed 1. | `model-pipeline` passes. Checks reject wrong scale/length, invalid sigmoid outputs, bad detector booleans and empty alerts; every callback receives original input. | Recall correctly distinguishes structure/range checks from outcome evaluation. | Measured alert ships while prose waits for review. 340 MB language component and sub-megabyte crew models are distinguished; build/timing values are marked fictional. |
| Model Profiling | 0249 crash loses the capture and relay slot irreversibly. Full scene remains visible before work. | TFJS CPU example passes. Parameter arithmetic is 84,994,664 and 339,978,656 float32 bytes. Proxy is explicitly not a generative architecture. MB, MiB, latency, storage and load peak remain distinct. | `profile-model` passes. Injected clock, awaited readback, one warmup, arithmetic mean, zero-parameter layers and rejection cleanup covered. | Recall correctly rejects parameter-share-to-time-share inference. | 211 KB salvage is not the lost capture. 61.2-second interval and 19-day relay deadline continue the story without recovering it. |
| Quantization | Nazari requests bytes and changed decisions, not an unmeasured speed guarantee. | Uniform affine encoding, constant tensor handling and float32 decode checked. 673-parameter browser lab is distinct from fictional 85-million-weight bundle. | `quantize-weights` passes. Added explicit multiclass exercise-vs-sigmoid-lab distinction. Graders check per-kernel ranges, decoded applied weights, unchanged biases, changed classes, half-step error and constant kernels. | Recall separates smaller storage from runtime memory/speed and labeled accuracy. | Engineering load test passes only as fictional mission result; bridge test stays open. Class-by-class review leads into pruning. |
| Pruning | Wrong tree-shaking analogy has a shown numerical difference and later three-hour cost. | Added explicit five-class, eleven-input practice-model boundary instead of silently implying it is the earlier binary model. Checked 0.994 vs 1.000 output, rare-class denominator, dense storage, compression and rescaling example. | `prune-weights` passes. Pooled kernel ranking, strict cutoff ties, sparsity 0/1, independent original weights, absent classes, restoration and failure cleanup covered. | Recall rejects sparse-storage and rare-weight causal guarantees. Defined per-class recall beside the task. | 85 MB file vs 42 MB served is preserved. Accuracy results and future replay remain scenario values, not claimed exercise measurements. |
| Caching Strategies | Demir times the wrong model and Nazari corrects him. Policy rehearsal remains visible and changes handoff work. | Verified optimistic latency `0.4*0.0013+0.6*0.035=0.02152 ms` and about 55.4 ms savings across 1,644 hits. Approximate keys, TTL, mutation, ownership and version changes are explained. | `inference-cache` and `incident-stale-verdict` pass. Keys include position, shape, dtype; separate caches, LRU, copied arrays, caller input ownership, age equality and rollback version covered. | Recall asks whether saved inference exceeds cache overhead and when a result is valid. | ARIA's 400-case replay continues the earlier request. Error comparison explicitly cannot measure decision quality. No cache hit does not prove a nonrepeating source. |
| WebGPU Acceleration | Worker analogy is corrected rather than blessed; backend selection and fallback cost advance Nazari's request. | Corrected misleading “eleven-feature classifier” references. Backend false/throw distinction and awaited readback checked against pinned code. Fictional costs do not claim a universal GPU speedup. | `gpu-backend` passes. False resolution, thrown missing registration, caller preference, stop-at-success, exactly one ready and total startup failure covered. | Recall covers supported compute, overhead, device measurement and completion timing. | Bridge rehearsal, engineering fallback, lost capture, 15-day relay window and 47.9-second pulse interval remain consistent. Cache decision consequences preserve distinct costs. |

## Verification evidence

- `node scripts/check-reviewed-examples.mjs` passed. It executes the authored
  runnable examples using pinned TensorFlow.js 4.22 CPU and controlled external
  service boundaries. It does not call a real LLM or reproduce fictional
  scientific results. It includes all reviewed anomaly, LLM and optimization
  code supported by that script.
- All 20 current YAML exercise sources passed the original CI validator
  harness with `--starters --cheats`: 20 passed, zero failed, zero allowlisted.
  Untouched starters were rejected and registered plausible wrong submissions
  were caught. The temporary harness differed only in reading the source YAML
  export instead of the potentially stale Velite JSON, plus its relocated
  import path. Log: `.superpowers/applied-audit-validator.log`.
- Focused `education-counterexamples` and `metadata-consistency` tests passed.
  The combined 150-test run had 149 passes and one unrelated canon-table
  failure caused by in-progress `temporal-attention` interval wording. That
  failure was reported to the parent agent for coordination, not hidden or
  fixed by weakening the gate.
- The quantization converter's byte format was checked against official
  documentation and source. The real converter/browser backend experiments
  in the downloadable runtime lab were not re-run during this sub-audit.

## Shared interaction findings and resolution

All 19 entries of `FLOW_INVESTIGATIONS` were reviewed, including their
controls, cases, graphics, result math and emitted code. Seven confirmed issues
were reported and resolved during the parent audit:

1. **Resolved: partial report assembly.** `report-generation` now separates
   `completeReportReady` from assembly of approved sections. Its displayed
   code names the Withheld list. Integration tests execute the actual authored
   report assembler with activity decisions, verifying that failed bodies are
   omitted and their headings listed while approved sections remain.
2. **Resolved: zero monitoring limit.** `monitoring` plots observed missing-input
   percentages against the absolute limit. It no longer invents a 200% ratio
   for a zero denominator. Tests check 2% and 12% observations, zero-limit
   breaches, equality and unchanged readings across limit changes.
3. **Resolved: detector score meaning and equality.** `multi-model-systems`
   identifies D2 as a fictional 0-to-1 score, states that the score is not a
   calibrated probability, and distinguishes it from unbounded reconstruction
   MSE. Strict `>` matches the authored rule. Both fixed cases have equality
   and either-side regression probes.
4. **Resolved: stale-cache interpretation.** `caching-strategies` now says that
   the result belongs to the wrong version and might still have the same
   numerical value. Tests trace changed scalers, LRU eviction, valid and stale
   hits, and execute both displayed key policies. No prediction is invented.
5. **Resolved: prompt construction task.** `prompt-engineering` now lets
   learners add/remove role, reference catalogue, current values and JSON
   request. The assembled prompt is visible in the main graphic. P1/P2 are
   explicitly synthetic; changing the reading changes its ID, values and units
   while retaining the catalogue. Tests verify independent missing parts,
   separate lines, visible/code agreement and the empty prompt. It makes no
   LLM call or factual guarantee.
6. **Resolved by the numeric-spec owner: exact-cutoff behavior.** Numeric
   `evaluationSpec`, used by Threshold Tuning, now uses strict `>` like the
   exercise and authored helper. The parent audit coordinates its regression
   tests.
7. **Resolved by the numeric-spec owner: ensemble task alignment.** Numeric
   `the-anomaly` now uses the exercise's eight-value baseline, amplitude,
   supplied reconstruction error and supplied forecast. It shows the three
   actual cutoffs, votes and majority decision, distinguishes amplitude error
   from full-model forecast MSE, and states that no models run in this fixed
   simulation.

The new `flow-investigation-contracts.test.ts` has 22 passing tests. Combined
with the existing `lesson-investigations.test.ts`, all 89 tests passed after
these changes. The emitted prompt/key/completeness code executes in the tests,
and the report integration uses the actual exercise solution rather than a
copied assembler.

The other flow activities correctly distinguish fixed examples from real
model execution. Local-file readiness assumes a successful download when
online; this is an intentionally simplified path simulation, not a runtime
availability check. Native browser width, keyboard interaction, reduced motion,
scene visibility and final rendered output remain the parent audit's browser
review responsibility.

## Nested practice audit

The later audit pass read all of `learning-experiment.tsx` and
`learning-experiment-data.ts`, their existing numerical and interaction tests,
all six MDX placement references, and the account-remount boundary in
`learning-activity-scope.tsx`. These practices supplement the main lesson
activities inside optional references. They keep their existing tasks,
activity IDs and content version 1.

| Practice | Numerical and technical evidence | Worked and changed-case flow |
| --- | --- | --- |
| Normalization | Population mean `[22, 1]`, std `[2, 1]` and the fixed two-input sigmoid match TFJS moments and Dense predictions. Constant-feature division uses 1 without replacing the saved zero statistic. The supplied neuron is explicitly not trained in the activity. | Predict selected preprocessing output; then restore the v1 scaler input `[2, 2]` for `[26, 3]` instead of the mismatched v2 input `[1, 0]`. Fixed weights and feature order stay visible. |
| Threshold | Synthetic 21-row validation and separate 10-row test data use strict `score > threshold`. Equality, TP/FP/TN/FN, zero-denominator reporting, and cost calculations have independent fixtures. At equal costs, cutoff 0.4 has higher F1 but more errors than 0.7, as the text states. | Choose and compare validation policies, then freeze threshold and both costs before revealing test rows. Returning, reset and remount keep the policy frozen. The cost model explicitly excludes true-positive review costs. |
| Learning rate | For `0.5*(w-target)^2`, the derivative is `w-target`, verified with TFJS autograd. Rate 2.2 diverges; 1.2 overshoots while approaching. The text distinguishes this toy loss from the coding exercise's `w^2`. | Predict the first update from 4 toward 0, then from -3 toward 1. Full update/loss traces appear only after an attempt or help. No claim of general neural-network convergence. |
| FFT | Direct DFT magnitudes match TFJS `rfft` for 32/64/128 observations, with and without double-length padding. The stated one-sided `|DFT|/observed samples` convention intentionally does not double amplitudes. Sampling is explicitly 128 Hz for this generated teaching signal. | Predict displayed grid spacing, then distinguish 1 Hz padded grid from 2 Hz native spacing for 64 observed samples. Padding does not add observations or guarantee resolution. Fixed tiny SVG labels were enlarged, vertical magnitude units/ticks added, and the plot scale now contains all displayed bins. |
| Attention | Stable, unscaled dot-product softmax and weighted values match actual TFJS matmul/softmax for each query and the changed query. Shapes are explicit. The lesson intentionally omits the usual key-width division; the practice says so. | First predict a dot product, then compute both weighted-output coordinates for `[0, 2]`. Fixed keys and values are visible inputs. Results and contribution tables appear after help or an attempt. Attention weights are not presented as causal explanations. |
| Cache | The deterministic sigmoid toy actually computes fresh and returned values. Rounded keys collide across the alert boundary, and independent model/scaler changes invalidate exact versioned identities. The activity makes no latency claim. | Predict forward-call counts, then replay exact versioned keys with both artifacts changed. Displayed mismatches are measured within this toy function, unlike the separate provenance-only flow activity. Each replay starts from an empty cache. |

Two confirmed display/restoration defects were fixed without changing an
exercise or numerical contract:

- FFT chart ticks were 10 SVG pixels and the vertical magnitude scale was not
  shown. Ticks are now 18 pixels with magnitude units and labeled values.
  Controls and input text inherit the shared lesson reading size.
- Saved drafts could contradict their own evidence, such as feedback displayed
  while help was false, a result unlike the latest recorded attempt, or frozen
  threshold values that differed from editable settings. Parsing now rejects
  those corrupt combinations instead of restoring them as valid records. Valid
  first/latest outcomes, attempts, help and frozen settings remain intact.

All 25 numerical and component tests pass across the two practice test files.
New coverage checks every practice for hidden worked results before help,
explicitly labeled inputs, assistance surviving reset/remount, valid versus
contradictory restored histories, frozen-policy consistency, and readable FFT
ticks/plot bounds. Existing tests compare normalization, FFT and attention with
pinned TFJS CPU, verify threshold and gradient counterexamples, preserve
first/latest outcomes and the attempt limit, and recover blocked storage.

The component uses native labeled selects, buttons, an associated answer
label, live feedback and keyboard-focusable table regions. It contains no
animation, so reduced-motion users receive the same task and results. Account
changes remount children through the shared identity scope rather than mixing
the old account's rendered draft into the new account. Final phone/desktop
rendering remains part of the parent browser pass.

## Primary references

- [TensorFlow.js 4.22 moments](https://js.tensorflow.org/api/4.22.0/#moments),
  [MSE](https://js.tensorflow.org/api/4.22.0/#losses.meanSquaredError),
  [tidy](https://js.tensorflow.org/api/4.22.0/#tidy),
  [data readback](https://js.tensorflow.org/api/4.22.0/#tf.Tensor.data), and
  [backend selection](https://js.tensorflow.org/api/4.22.0/#setBackend).
- [Pinned engine implementation](https://github.com/tensorflow/tfjs/blob/tfjs-v4.22.0/tfjs-core/src/engine.ts)
  for false initialization results, unregistered names and readiness.
- [TensorFlow.js conversion guide](https://www.tensorflow.org/js/guide/conversion)
  and [pinned weight decoding](https://github.com/tensorflow/tfjs/blob/tfjs-v4.22.0/tfjs-core/src/io/io_utils.ts)
  for storage quantization and affine decoding.
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762) and
  [Hugging Face cache explanation](https://huggingface.co/docs/transformers/v4.57.1/cache_explanation)
  for transformer structure and cached decoding. The adapter is a stated
  chat-completions contract, not a promise that every provider/model accepts
  all its options.

Technical acceptance should stay evidence-based. Passing these finite tests
does not prove every possible model, physical reading or future browser is
correct. The source now states which examples are executable, which inputs are
provided, which outputs are fictional, and where validation is still required.
