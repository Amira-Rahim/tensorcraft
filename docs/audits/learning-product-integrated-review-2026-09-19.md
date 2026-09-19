# Revised-course integrated review, 2026-09-19

Internal review by Codex after P1-P5. Source review complete. P7-P9 still cover final experience, continuation, release checks and the integrated grade. Per-lesson notes are in `learning-product-integrated-review-2026-09-19.json`. Source hashes will be recorded after corrections and checks.

## Foundations

Read all five complete MDX lessons, five full exercise contracts/starters/solutions/tests/feedback, and module metadata in order. The shape experiment and training-only scaler activity fit the subsequent tasks. The data/evaluation/project distinction remains explicit. Fixed one incorrect feedback claim: `arraySync()` returns ordinary arrays, unlike `dataSync()` typed storage. The [installed TFJS API reference](https://js.tensorflow.org/api/4.22.0/#tf.Tensor.arraySync) supports that distinction; actual displayed examples also execute in the existing runtime check.

Readability corrections target rubric categories 2-4: shortened three exercise instructions into explicit actions, removed an unsupported “most common” claim and a “pipeline is proven” overstatement, narrowed the transpose objective to preserve axis meaning, and qualified fitted normalization ranges. Removed a repeated rank/log beat and ARIA's unsupported claim about all possible rules. Added a visible fiction label to the archive timing scene. No story discovery or choice index changed.

The numerical pass run before these copy corrections passed every selected authored example and all 65 reference/starter/shortcut checks. Final changed-content checks remain pending; parsing/rendering is not a quality grade.

## Neural networks

Read all five lessons, five complete exercises and module metadata. Found a consequential body/exercise mismatch: the final lesson still described an 8-input 32/16/1 model (833 parameters), while its instructions, hints, solution and grader use 24/12/1 (529). The body now names both differences and shows the arithmetic. The bridge model remains 3-input 32/16/1, 673 parameters.

Qualified a feedback claim that any constant kernel makes all future gradients identical; symmetry depends on the surrounding weights and update path. Clarified binary calibration as positive-class frequency, replaced a categorical hidden-activation claim with the affine-composition property, and removed a compile comment that implied prediction was unavailable. Added the missing ReLU-at-zero assertion to the existing boundary test. Read the current first-flag handover with all four P3 options; no choice intent or raw-archive ownership changes.

## Training

Read all five lessons, complete exercise YAML files and module metadata. Checked loss/logit derivatives, quadratic convergence ranges, chain-rule factors, epoch/batch accounting, validation selection, prevalence assumptions and baseline instructions together. Removed an unsupported general speed claim from the backprop recap, put fiction timing beside the scene, and separated the unknown best parameters from known target labels. Clarified calibration and balanced evaluation; class-balanced evaluation remains useful, but its raw aggregate metrics need not describe production. Removed exact story-score spoilers from the module listing.

Found two assessment gaps and added one shared, bounded, worker-local fit recorder to both execution paths. Row count alone did not exclude replacing training rows with test rows. The updated check compares paired training values while accepting a valid paired permutation. A correct callback factory could previously pass even when its callback never reached fit; the updated check links the callback options to the History returned by that fit. Snapshot arrays are immutable, capped at 8,192 values per tensor and 16 fits, and reset per run. They are local grader diagnostics, never account summaries or analytics, and do not turn browser checks into authoritative certification. Tests reproduce both previously unchecked paths. Final corpus/worker regression is pending.

## Browser runtimes

Read all six lessons, seven exercises and module metadata, including the memory-growth drill. Kept real lab boundaries distinct from injected loader/ONNX/pipeline behavior. Corrected a stale inference comment that described z-score as a universal rule for open-ended streams, narrowed privacy/network language to the local prediction path, and carried story timing labels into the Consequence pane where those figures appear. The sentiment recall now agrees with the corrected discussion of class-balanced samples.

Added two missing contract checks: initialization must propagate a failure when no backend can start, and the inspection task must dispose the loaded model after copying metadata. The pretrained exercise now returns immediately for an empty input without loading weights, and its hint agrees. Added a regression for a retained inspected model. Numerical/runtime integration is covered by the pinned external lab; final candidate rerun is P9.

## Signal processing

Read all five lessons and complete exercise files, including the distinction between magnitude and power, raw and tapered STFT, Fourier phase and the crude two-sample feature, aliasing, fixed-bin identity and the fictional relabeling comparison. Corrected a scaler that stored 1 as a constant feature's standard deviation despite promising to retain 0. The code now retains the statistic and uses a fallback divisor at application; an authored-code regression checks a later changed value too.

Replaced an inaccurate leakage explanation based only on unequal endpoint samples. An on-bin sine can also have unequal first and last samples; the revised explanation uses finite frames and noninteger cycles, without suggesting that DFT coefficients establish extra physical sources. Qualified peak/source claims and removed a blanket mean-noise-estimation prohibition. Reworded Hamming's sidelobe comparison against Julius O. Smith's [Hamming](https://dsprelated.com/freebooks/sasp/Hamming_Window.html) and [Hann](https://www.dsprelated.com/freebooks/sasp/Hann_Hanning_Raised_Cosine.html) references: near and distant behavior differ, so one number does not choose the window. Read the installed TFJS 4.22.0 rfft implementation for output-length behavior.

Shortened all five exercise instructions into explicit return contracts. Added missing no-complete-frame and equal-magnitude tie checks. Kept the full recording-rate and fictional 73.4 Hz/73.4 s distinction. Numerical regression after these corrections is pending.

## Recurrent networks

Read all five full lessons/exercises and module metadata. The scalar cell and derivative drills precede real layer comparisons; the LSTM exercise explicitly limits per-dimension arithmetic to its one-unit library comparison. Checked retained weights versus reset state, TFJS gate defaults, packed columns, target placement, scaler units, temporal splits and rollout tensor ownership together.

Matched the GRU example's recurrent activation to its sigmoid equations and included their bias terms. Fixed the off-by-one context answer: positions 50 steps apart need 51 readings. Qualified the claim that external labels eliminate leakage, the assertion that feedforward inputs are statistically independent, and the implication that every stalled 0.693 loss is a diagnosis. The lesson already discusses diagnosis correctly; its scene now reports scores near 0.5 rather than claiming the model flips a coin. Fiction labels accompany the overnight and later-archive results. Shortened three long hint sequences and one especially long grader message; removed a repeated memory slogan.

Added zero-horizon and wrong-width forecast checks to the existing failure/ownership tests. The corrected signal-processing authored examples and UI/web TypeScript checks pass. Recurrent numerical and changed-exercise checks are running; full candidate verification remains P9.

## Anomaly detection

Read all five lessons, eight full exercises and module metadata, including the three incident drills and saved training-set decision. Distinguished budgets from observed baselines and made the sweep's zero-denominator reporting convention explicit. Corrected per-feature error language that implied locating a physical cause. Updated the normalization recall to match Foundations' distinction between fitted ranges and physical bounds. Fixed the first-day LSTM/all-eleven-days continuity error and removed a neutral epilogue's implication that the learner had selected an optional choice.

Found a silent failure in the integrated detector: non-finite model outputs compared false against a threshold. The authored example now validates reconstruction/forecast shapes and rejects non-finite scores, with executable invalid-output and tensor-cleanup probes. The exercise also rejects nonconstant windows whose spread disappears in float32, and statistics that overflow during conversion. Its exact constant-reading policy remains explicit. These are error paths, not normal votes. The corresponding graded and authored-code regressions are running.

Signal and recurrent authored examples pass after correction. Three changed reference/starter/shortcut suites pass: FFT winner, STFT and recursive forecast. Full course verification and final grades remain pending.

## Advanced time series

Read all five lessons, five full exercises and module metadata. Narrowed attention's interpretation to weighted values rather than causal influence; distinguished a content-only scorer from recurrent states that already contain context. Corrected the 100-step rollout description for an 80-reading window and a recall question that presumed error grows monotonically. The Kalman explanation now names prediction and covariance updates as well as the gain. Fixed a scene that had Nazari speaking and asleep in the same beat.

Found two numerical edge cases in weighted averages. Scaling finite weights before summing avoids overflow, and scaling inverse-square errors relative to the smallest error avoids infinite weights for tiny valid errors. The exercise also accepts arbitrary unique member names using dictionaries without inherited properties. Added boundary tests and a single-step positional-attention case. All five authored-example groups and the changed weighted-ensemble and temporal-attention reference/starter/shortcut suites pass; an additional authored large-weight probe is queued. Anomaly authored examples and all 14 detector exercise cases pass after correction, including invalid-output cleanup.

The attention scaling explanation was checked against section 3.2.1 of [Attention Is All You Need](https://arxiv.org/html/1706.03762v7#S3.SS2.SSS1), including the independence and unit-variance assumptions behind the dot-product variance argument. The LLM prefill/decoding discussion agrees with the pinned [Transformers cache explanation](https://huggingface.co/docs/transformers/v4.57.1/cache_explanation). Neither source is used as evidence of this course's learning outcomes.

## LLM integration

Read all five lessons, six complete exercises and module metadata. Checked provider-adapter scope, prefill/decoding, temperature, structured response validation, metadata query limits, record caps, typed numerical claims, withheld sections and pipeline fallbacks together. Corrected grader language that implied metadata search cannot rank, role formatting is universally required, or a supplied confidence value establishes certainty. Changed the prompt solution to allow unknown consistently. Simplified several long guidance and feedback paragraphs, plus the instrument-unit explanation. Fixed a softmax sentence that confused probabilities with token selection. Physical bounds in the amplitude fallback are now assumptions the application must validate, not a property scaling guarantees.

All five authored-example groups pass with controlled external boundaries. The report assembly suite passes eight cases, including an empty report. The model pipeline suite passes 19 cases, including invalid sigmoid output and temporary tensor cleanup. These checks do not measure a live provider's factual accuracy.

## Optimization and edge

Read all five lessons, six full exercises and module metadata. Removed outcome spoilers from the module listing. Clarified the large model's role as a fictional size-accounting proxy, not a generative-language-model recipe. Renamed an authored diagnostic that declared every tracked-byte change a leak. Separated dense operation count from actual latency and stored bytes from load-peak evidence. Corrected an epilogue that could invent a skipped cache choice.

Simplified quantization, backend and cache-incident hints. Explained that the quantizer returns number-array codes, while the converter lab writes packed bytes. Distinguished pre-float32 affine error from final model values, and class disagreement from labeled error. Clarified pruning's class-conditional metric as recall, replaced unsupported blanket retraining/speed/quality assertions, and noted that affine storage need not encode zero as byte zero. Pruning cleanup now runs even if a restoration attempt throws. Changed authored and grading regressions are running.


## Capstone and supporting surfaces

Read all five capstone lessons, eight complete exercises and module metadata. Corrected the model-card arithmetic and denominator: 1,859 correct among 2,025 fictional handover rows rounds to 91.8%, with lowest class recall 21/25 = 84%. The 997-parameter classifier retains float32 weights in the final selective export; the large language component supplies almost all the fictional bundle size. Different evaluation slices are now named rather than silently combined.

Corrected a mean-drift explanation that claimed the distribution was unchanged. Added overflow checks for normalized float32 input, robust Euclidean distance, collapsed nonconstant windows and extreme interval ratios. Deployment smoke now checks invalid outputs during warmup/timing and stops on cooperative cancellation, with cleanup tests. Shortened rehearsal and artifact instructions while retaining the actual fit, bytes, schedule and boundary contracts. The last operator-note record stays intact; moving the continuation out of the season remains P8.

Read the complete shared glossary, Deep Orbit world/cast metadata, all module-entry summaries, course project preview, runtime-lab README, build-triage brief, and room-project README, rubric and report form. Updated baseline, attention, broadcasting, typed-array, recurrent-window and other glossary definitions where they disagreed with the teaching or claimed too much. Narrowed the anomaly module's entry requirements to knowledge available before it. Project effort remains an author estimate, the maintainer run is labeled, optional local tooling is explicit, and the $50 launch price is unchanged. The other four complete curricula are not reviewed by this record.

## Final local verification and limits

All 65 reference/starter/shortcut exercise suites pass after the fit-recorder and capstone changes. The later rehearsal regression passes all 17 cases. Every selected authored-example group passes across the eleven modules; selection is not execution of every printed block. In particular, optimization's selected groups cover profiling, quantization, pruning and caching, while real GPU and converter execution belongs to the pinned runtime lab and final P9 run. All 56 lessons render at two widths with no page errors or horizontal overflow.

The content and changed-worker run passed 836 of 837 tests initially. Its failure caught three row fields removed from visible retrieval instructions during copyediting. Restored the complete row schema, removed the now-obsolete input-field exception, rebuilt content, and all three visibility-gate tests pass. Logs are retained in `learning-product-p6-2026-09-19/`; the initial failure is retained as well. This gate catches hidden contracts, not factual accuracy by itself.

P6 source-design assessment against the frozen five-criterion rubric, in its published order:

| Category | Criterion scores | Internal source score | Evidence and remaining limit |
| --- | --- | --- | --- |
| JavaScript fit | 2, 2, 2, 2, 2 | 10/10 | All 56 mechanism/prerequisite/reuse rows; corrected bridges and executable JS. Actual first-time comprehension is unobserved. |
| Learning design | 2, 2, 2, 1, 2 | 9/10 | Seven changed-case experiments, 65 exercises, twelve capability chains, incident drills and independent project. Retrieval prompts need observed recall to validate their difficulty. |
| Factual reliability | 2, 2, 2, 1, 2 | 9/10 | Model/metric arithmetic, units, primary references, boundary and provenance repairs above. Runtime evidence covers pinned fixtures, not every possible device/model. |
| Readability and voice | 2, 2, 1, 2, 2 | 9/10 | Full integrated read and rubric categories 2-4 copyediting; cast voices retain different functions. Advanced reference code/contracts remain dense; novice reading time is unmeasured. |
| Storytelling | 2, 2, 2, 2, 1 | 9/10 | P3 arc/choice ledger and the integrated season read preserve lost capture, uncertainty and developing competence. Continuation placement is still the scheduled P8 task; reader response is unobserved. |
| Player agency | 2, 2, 2, 2, 1 | 9/10 | Six explicit choices and versioned later consequences with P3 branch evidence. Deployment is a labeled rehearsal under a fixed ending, which limits agency. |
| Independent application design | 2, 2, 2, 2, 1 | 9/10 | Unsolved triage and room tasks, cost adaptation, public rubric and clean maintainer export. No independent learner has demonstrated the complete outcome. |

These scores assess the internal design and reviewed source only. They do not grade learners, certify teaching efficacy, establish $70 willingness to pay or ROI, or predict demand. Design/accessibility receives its new review in P7; the combined internal gate and production evidence remain P9. Independent evaluation stays deferred at the owner's request.
