# Deep Orbit quality audit: core modules, 2026-10-16

Scope: every MDX lesson and every exercise YAML in Foundations, Neural Networks,
Training Loop, and Capstone, plus their four module descriptions. I read the full
source of all 20 lessons, including frontmatter, scene text, objectives, concept
examples, optional references, exercises, hints, recall, recaps, epilogues, and
conditional decisions. I read all 23 exercise contracts, starters, solutions and
graders. Long grader-only audit comments were omitted from some printed reads;
all executable assertions and learner-visible text were inspected.

This is a source, runtime, and teaching audit. It is not a claim that a passing
fixture establishes universal scientific correctness, production readiness, or
learning effectiveness. Root owns shared-shell/browser visual verification.

## Section coverage and evidence

B = Briefing; C = Concept; Ch = Challenge; T = Takeaways; E = Epilogue. Every row
includes all five sections. "Retained" means inspected without an unnecessary
rewrite. Numeric and flow activities are small, explicitly labeled simulations;
the exercise runs the actual pinned TensorFlow.js operations.

| Lesson | B: story and practical purpose | C: technical and visual evidence | Ch: exercise requirements and checks | T: recall and recap | E: story continuity |
| --- | --- | --- | --- | --- | --- |
| introduction-to-tensors | Mirza asks for readings prepared for TFJS; five numbers remain the concrete task. | Actual `prepare-readings.js` runs; shape `[5]`, values preserved, tensor released. Existing shared value-following visual retained. | `create-a-tensor`: real tensor, original five values, shape and supplied cleanup checked. | Shape and creation-versus-training checks match the task. | Sensor identities remain unknown. ARIA contractions removed to preserve her literal register. |
| tensor-shapes | Recording header establishes 64 sensor identities; four-sensor practice recording explicitly made up. | Actual authored block produces `[3,4]`, second row `[3,18,7,8]`, and sensor rows `[[2,3,4],[20,18,16],[5,7,6],[8,8,9]]`. Dedicated activity compares reshape and transpose. | `reshape-tensor`: original supplied tensor, operation provenance, all rows and true tensor values checked. | Three checks transfer the layout task to a new two-moment, three-sensor recording. | Header establishes `[450,64]`; waves are observed after correct arrangement, not used to guess metadata. |
| tensor-operations | Real pinned-runtime shape error introduces the failed amplifier. Nazari's sample count is consistent with 64 × 256 × 60 = 983,040. | Broadcasting, element-wise average/gain, matrix product and semantic axes inspected. Actual optional tensor and matrix examples run. | `add-tensors`: varied gains, `[3,2]` with `[2]` broadcast, channel-mix shapes and values, actual tensor/matrix operations. | Shape rule and checking meaning before transposing retained. | Repeated ripple is an early observation, without attributing a source or claiming a benchmark. |
| data-loading | Lazy reads repair an out-of-memory failure with an on-page cost. Archive/raw capture/summary features distinguished. | Generator and 28,800-row authored pipeline run. Dynamic batch control now reaches every row at sizes 2/4/8; features and labels keep their row membership. | `batch-data`: laziness measured before the first bare sample, repeated passes, actual row contents and labels, shuffle-before-batch ordering, fixed chronological split. Starter's misleading frequency comment corrected to zero-crossing count. | Shuffle membership and future-period evaluation checks retained. | Fictional four-minute/nine-second timings explicitly labeled, not TFJS performance measurements. |
| normalization | Two measurements with different units feed a supplied fixed model. | Actual current scaler/model examples run: mean `[23,.5]`, std `[sqrt(5),sqrt(.05)]`, fixed scores checked. Constant columns and frozen training statistics explained. | `normalize-data`: varied lengths, population statistics, true fixed dense model, shape/readback, saved statistics after training rows disposed, zero-scale policy. Variance-versus-std wording corrected. | Feature scales and broadcasting checks match the task; calibration limitations retained. | 7741 remains unexplained despite correct scaling; decision branches preserve raw archive and unknown label. |
| first-neuron | Known labeled tones precede testing an unknown signal; success on calibration is not generalization. | Actual dot-plus-bias block runs and agrees with JS reduce near .26. Interactive weights/bias show signed contributions. "Smallest contribution" clarified to magnitude. | `implement-neuron`: scalar tensor, no JS readback, varied dimensions/values, input-specific weight effect. | Formula, weight, and bias checks retained. | Tone separation is limited to the fictional demonstration; later 7741 branch references preserve the review decision. |
| activation-functions | Alert threshold is separated from bounded score and useful learning. | Authored affine-collapse and activation examples run. All displayed activation code now executes for negative as well as positive inputs and agrees with TFJS. | `relu-activation`: shape preservation, negatives/zero, large finite positives, no readback and new random inputs. | Affine versus nonlinear behavior and calibration checks retained. | Explicitly changed hand-picked weights explain why both tones now trigger. Unsupported "99.7% of possible readings" removed. |
| layers-and-architecture | Nazari asks for a parameter count after investigation costs. | Actual architecture runs; 128 + 528 + 17 = 673. Width-8 total 833 and XOR construction inspected. Activity changes width without claiming better predictions. | `build-layer`: 16/8/1 practice model, exact activations, arithmetic count for varied widths, no extra models/tensors in quote function. | Parameter count and inferred later-layer shapes retained. | Printed model summary and Nazari's demand remain a handoff to verification, not a claim of learned behavior. |
| forward-pass | Missing batch axis causes a failed demo and a concrete time cost. | Actual forward and hand-computed blocks run together with cleanup. Shapes follow `[1,3] -> [1,32] -> [1,16] -> [1,1]`; adapter behavior distinguished from valid input. | `forward-pass`: one predict call for arbitrary batch height; prediction matches model weights; flat readings get a leading axis with unchanged values. | Batch contract and single-example shape checked. | Random scores are saved as initial outputs, without assigning unknown readings labels. |
| building-a-network | Assemble and compare before/after training, preserving an untrained comparison. | Actual compiled 673-parameter model runs. The challenge's 529-parameter practice architecture is explicitly different. Activity checks dense shapes without claiming to train. | `simple-network`: two independent copies, zero initial biases/random kernels, saved initial weights, exact 50×8 update count, actual predictions from the corresponding states. Synthetic feature comments clarified. | Compilation config and parameter count retained; no claim compilation learns weights. | Random scores remain uninterpreted; 7741 stays tagged for later evidence. |
| loss-functions | Farah asks for measurable prediction error. | Actual MSE .268, logits BCE about .718, perfect MSE zero verified. Optional derivative discussion is distinguished from practical loss selection. | `mse-loss`: reduced scalar, new inputs, correct logits behavior, explicit output contract, rejection of unknown kinds. | Replaced derivative-only recall with three practical checks: sigmoid-output loss, logits API, two-example MSE .1. Root versions this recall as v2. | .6931 baseline is mathematically correct; class-prior baseline and separate test rows remain visible. |
| gradient-descent | Easing example relates to a specific squared-distance objective, then returns to unknown parameters. | Authored four trace lines verified exactly. Rate thresholds distinguished for half-squared and full-squared objectives; overshoot is not equated with divergence. | `gradient-step`: current gradients, `assign`, repeat updates, changed nonlinear losses and actual tape use. | Learning-rate investigation avoids diagnosing a curve from one symptom. | ARIA records loss without becoming an optimizer; remaining 672 parameters establish the next task. |
| backpropagation | Slow numerical-gradient method is experienced before the backward sweep. | Actual multi-variable block runs; finite-difference sketch clearly labels its application-supplied function. Interactive chain rule retains exact prior values. | `backprop-chain`: now enforces one forward call and verifies variable restoration even when the nudged loss throws. Existing requirements and solution unchanged. | Loss/gradient return versus update, numerical pass cost retained. | Fictional timing numbers remain explicitly labeled; the speed story does not masquerade as a device benchmark. |
| training-loop | Illustrative log and mission outcomes explicitly fictional. Training versus validation is made operational. | Authored training and early-stopping code runs as the prefix for the evaluation example. TFJS 4.22 does not restore best weights. Activity now says manual save/restore explicitly. | `training-loop-exercise`: actual fit history and iterations, callback attachment/patience, short/invalid histories, two-window trends and exact 5% band. | Three new practical checks cover validation stopping, observation before diagnosis, manual best checkpoint. Root versions as v2. | 500 versus 102 epochs now described as nearly five times as many epochs, replacing unsupported ten-times-compute claim. |
| evaluating-deep-scan | Mirza requests numbers on unseen signals. | Actual train/evaluate example runs; 47/50 = 94%, precision 23/23, recall 23/26, and Bayes example inspected. Interactive threshold uses strict `>` at equality, consistent with course alert rules. | `deep-scan-eval`: actual 100 training rows and paired labels, 43 untouched evaluation rows, true final/history scores, varied gap cases. No target accuracy demanded. | Gap investigation, membership/leakage and base-rate assumptions retained. | .518 and 94% labeled fictional mission results. Unknown 7741 is not settled by the score. Early authorization is now explicitly a supervised prototype test, separate from the fleet release. |
| system-architecture | Repaired dashboard target justified by bus/watch constraints and earlier loss. | Authored registry executes; chain-versus-branch limitation explicit. Integration sketch does not pretend to provide real classifier stages. Activity shows schema rejection and traceability limits. | `pipeline-architecture`: synchronous/asynchronous handoffs, stage validation, mid-chain failure and chaining. | Feature order, units, preprocessing and data assumptions checked. | ARIA fallback handles known calibration cases; unknown readings still need review. |
| ci-cd-pipeline | Cached evaluation and candidate mismatch has a concrete release consequence. | Artifact identity separated from behavior and device benchmark. GitHub workflow/host actions labeled as integration or pseudocode. | `ci-cd-gate`: conservative missing-label denominator, inclusive accuracy floor, empty/invalid cases. `export-model-artifact`: actual save, reload, byte comparison, quantized/mixed buffers and changed model. | Exact tested bytes and verified rollback covered. | Correct fingerprinted pair passes; accelerating ticker remains consistent. |
| monitoring | Dashboard freeze motivates runtime and silent model failure monitoring. | Actual monitor/drift blocks run, including retention, defensive copies and no-data behavior. Fixed feature semantics and 72 Hz selected bin are consistent with sample rate/window. | `model-monitor`: mean, nearest-rank percentile, no-data vs zero, finite validation, mean-only drift limitation and defensive baseline copy. P100 feedback corrected. | Scores/drift are investigation signals; labels needed for accuracy. | Rising fft_5 and 37-second interval do not identify origin; calibration/label review remain open. |
| documentation | Next watch needs operational handover; card alone is not evidence. | Actual mission card executes; 997×4 = 3,988 bytes, 1,859/2,025 rounds to 91.8%. Whole pipeline, classifier, weight, download scopes separated. | `write-model-card`: metadata-derived fields, stable section order, minimum recall under reordered/new classes, percentages and synthetic numeric metadata. | Evidence conditions, limitations, runbook owners retained. | Fictional calibration percentile is a starting cutoff with independent period follow-up; conditional drift branches keep evidence limits. |
| launch | Canonical 0157 canary is independent of optional simulated policies. | Authored verification helper executes against controlled adapters, including errors and cancellation. Static assets versus required server services explicit. Shell-spiral Fibonacci generalization removed. | `verify-deployment`: order, real TFJS smoke probes, malformed failures, ordinary errors, timeouts/cancellation/skip behavior. `launch-rehearsal`: real normalized fit, canary, history/count and cleanup. `classify-anomaly`: separate votes, constant/collapsed variance, exact finite ratio template and relative tolerance. | Rollback scope and correlated detector evidence retained. | Mirza's final speech is an order; final automated operator-note row untouched. Causality remains unresolved and light-travel contradiction is explicitly noticed by ARIA. |

## Confirmed changes

- Corrected inaccurate/unsupported wording without changing canonical findings:
  ARIA's voice, an undefined percentage of "possible readings", a changed tone
  demonstration, variance/std terminology, synthetic feature descriptions,
  epoch arithmetic, Fibonacci shell claim and exact ratio template.
- Tightened existing Backprop requirements with a counted single forward call and
  an exception-restoration test. No starter/solution contract or identifier changed.
- Realigned Loss Functions and Training Loop recall with their main task. Root
  coordinates saved-record content version 2 for these two lessons.
- Shared numeric activity fixes cover negative sigmoid code, all batch/window
  positions, precise recurrence code, manual checkpoint restoration, real temporal
  position scoring, actual three-detector voting, and strict threshold equality.
- Root browser review exposed a duplicate ID when a control was named
  prediction. Namespaced control IDs now keep the Loss Functions slider and
  answer textbox separately labeled, verified against the actual lesson spec.
- Corrected catalog bridge 3: Jest uses Object.is pass-or-throw semantics, and
  losses are not universally distances or smooth. The practical loss recap and
  frontmatter now use the same numerical-objective wording.
- Updated stale reviewed-example selectors for Introduction and Normalization.
  Added numerical assertions to the actual authored neuron, activation, loss,
  gradient trace and scaler code. These checks are repeatable in-repo.

## Verification record

- `pnpm --filter @tensorcraft/content build:content`: passed. Root rebuilds once
  more after final cross-module copy/recall edits for the integration checks.
- `scripts/check-reviewed-examples.mjs` with `REVIEW_MODULE` set separately to
  foundations, neural-networks, training-loop, capstone: all 19 execution groups
  passed on TFJS 4.22.0 CPU, including the added numerical assertions.
- All 23 core exercises passed solution validation. All untouched starters fail;
  each registered ignorant shortcut has a failing check, as required by the
  validator's starter/cheat gate.
- 82 focused tests passed across `numeric-investigations.test.ts`,
  `lesson-investigations.test.ts`, and `lesson-investigation.test.tsx`.
  Meaningful counterexamples cover negative sigmoid code, exactly-on-threshold
  scores, real temporal-position weighting, isolated detector votes, dynamic
  range clamping, every batch/window position and generated-code execution.
  The final React rerun passed all seven cases after the label fix below.
- Proof logs are in `.superpowers/core-mdx-examples-audit-2026-10-16.log` and
  `.superpowers/core-exercises-audit-2026-10-16.log`.

## Additional shared numeric activity audit

I read all 37 numeric investigation definitions and the common calculation
helpers. Generic tests visit every case and control endpoint, assert finite
nonempty diagrams and deterministic results, and parse every generated code
snippet. This establishes source/control coverage, not equivalence testing of
every possible input or backend. The following confirmed mismatches were fixed:

| Activity | Confirmed issue | Applied correction and evidence |
| --- | --- | --- |
| Data Loading | Two-row batches could not reach the archive's later half. | Maximum index is now `16 / size - 1`; size choices 2/4/8; all sixteen row IDs and paired features are reached at every size. React test changes 2-row final batch to 8 rows and confirms clamping from index 7 to 1. |
| Activation Functions | Negative sigmoid input generated invalid code such as `Math.exp(--1)`. | Parenthesize the signed literal. Execute generated code for all three activations at every quarter-step from -4 to 4 and compare with real TFJS. |
| Training Loop | Best-checkpoint activity could imply the callback restores it automatically. | Both boundary and result explain manual save/restore; TFJS 4.22 early stopping keeps the final weights. Root also updates the shared reference takeaway. |
| Simple RNNs | Displayed code rounded the prior state before using it, changing the shown calculation. | Code retains the actual previous state; displayed labels remain rounded. Executed code matches the simulation to twelve decimals for changed step/memory controls. |
| Sliding Windows | Later valid windows were unreachable for shorter input lengths. | Maximum start is `8 - length - 1`; final target at index 7 is reachable for lengths 2/3/4, without including it in the input. |
| Temporal Attention | Activity duplicated content-only attention while the lesson teaches a positional scoring feature. | Add an independently adjustable coefficient on `t/(T-1)` before softmax. Negative favors earlier, positive later. Original values are pooled; TFJS softmax checks verify weights and weighted sum. This remains a small linear positional scorer, explicitly not full self-attention. |
| The Anomaly | Activity used three univariate cutoffs instead of the exercise's three detector contracts. | Use original calm baseline, amplitude z-score, supplied AE error cutoff 1 and supplied amplitude-forecast error cutoff .1. Show independent votes and two-of-three decision. Distinguish this simple amplitude forecast gate from the main integration's three-feature MSE. Tests isolate each vote, equality and majority. |
| Evaluation / Threshold Tuning | Activity used inclusive alert threshold unlike the lesson's strict alert rule. | Use score `>` threshold; an exact match stays unflagged. Tests show an anomaly becomes FN at equality and a calm row remains TN at equality. |

The other numeric activities retain their explicit demonstration boundaries:
fixed weights or forecasts are not training; mean-distance drift is not an
accuracy verdict; attention weights are not causal explanations; quantization
rounding is not measured speed or quality; detector agreement is not independent
proof. Other module auditors own the corresponding detailed MDX/runtime review.

## Remaining evidence limits and editorial questions

- I did not claim a visual/browser pass for every phase. Root checks shared shell,
  paragraph width, dialogue, captions, phase extraction, responsive layout and
  controls in the browser. Source mapping covers all 20 lessons and their
  investigations; that is not a substitute for rendered verification.
- Evaluating DEEP SCAN now limits module-3 authorization to a supervised
  prototype test. It does not replace the later runtime/release work or change
  the canonical 0157 fleet deployment and 94% story result.
- Capstone's fictional card records an 80/10/10 archive split and a handover
  evaluation of 2,025 labeled captures. Those facts need not conflict. The lesson now explicitly marks
  labeled-subset selection and coverage as a gap in the fictional handover,
  requiring recorded IDs and label coverage. No missing provenance was invented.
- Capstone diagrams and pseudocode intentionally describe services and fictional
  five-class/language artifacts that are not shipped. Actual exercise/runtime
  fixtures are explicitly separate. Production transport, GPU devices and remote
  providers are outside a local CPU fixture's evidence.
- A broad class's definition cannot guarantee every learner solution or future
  backend behavior. These tests check pinned runtime/API and meaningful wrong
  cases; they are not tamper-proof proofs or evidence of learner outcomes.

## Primary references checked

- [TFJS 4.22 API: tensors and operations](https://js.tensorflow.org/api/4.22.0/):
  reshape/transpose, moments, dense layers, prediction, losses, variableGrads,
  synchronous tidy, fit/evaluate, save and earlyStopping contracts.
- [TFJS 4.22 earlyStopping](https://js.tensorflow.org/api/4.22.0/#callbacks.earlyStopping):
  patience/monitor behavior and `restoreBestWeights: true` not implemented.
- [TFJS 4.22 variableGrads](https://js.tensorflow.org/api/4.22.0/#variableGrads):
  loss scalar and named gradients, trainable variable list semantics.
- [TensorFlow.js save/load guide](https://www.tensorflow.org/js/guide/save_load):
  topology and weight serialization are distinct from training quality.
- [Jest toBe documentation](https://jestjs.io/docs/expect#tobevalue):
  Object.is comparison semantics; a failed assertion throws rather than
  returning a boolean.
- Installed `@tensorflow/tfjs` 4.22.0 source and executed authored examples are
  direct implementation evidence, particularly for float32 values and cleanup.

## Optional reference instrument audit

A final pass read all 1,723 lines of `lesson-instrument.tsx`, all calculation
helpers in `instrument-math.ts`, and every `DEEP_ORBIT_VISUALS` stage definition
consumed by the reference component. Root owns opening these disclosures in the
browser. I verified the source branches and their controls, without replacing
the shared layout or making the story optional.

| Reference family | Source coverage and observed result |
| --- | --- |
| Tensor | Creation still delegates to the actual TFJS tensor activity. Legacy reshape, matching-position operations, fixed four-row batching and normalization all inspect the correct small arrays. Batch choices reach all four batches. Raw versus z-score fixed-neuron results agree with the exercise. Dedicated Tensor Shapes does not render this legacy reference. |
| Neuron | Linear diagram's two products and bias are correct; activation curves and signed-input code agree. Query/weight labels state which quantity is editable. No learned-parameter claim. |
| Network | Two-input dense parameter counts are `4*hidden+1`. Forward example `[.5,1] -> [.6,.4] -> .54` uses disclosed fixed weights and zero biases; it is a linear output, not a trained sigmoid score. |
| Loss | Squared errors and their three-example average are correct; changing the middle prediction changes only its error term. |
| Gradient / chain | Chain derivative for `y=2*w`, `L=(y-6)^2` is correct. Generated descent and recurrent snippets now retain full internal values rather than recomputing from rounded display values. The descent button explicitly explains when a step leaves its limited plot. |
| Training | Loss trace is explicitly illustrative. Added explicit manual checkpoint-saving/restoration note; the TFJS callback keeps final weights. |
| Evaluation | Shared `screening()` and displayed code now use the strict `score > threshold` rule. Exact-threshold anomaly and calm counterexamples are tested. Confusion categories remain mutually exclusive. |
| Signal / spectrum | Direct Fourier magnitudes agree with TFJS rFFT after one-sided amplitude normalization, including DC and Nyquist. Time/frequency/spectrogram/taper controls retain fixed sample-rate/window captions and make no benchmark claim. |
| FFT features | Confirmed semantic bug: reference columns followed the editable tone and could duplicate the 20 Hz column. Both reference and primary activity now keep columns at 4/12/20 Hz. Moving a 12 Hz tone to 20 Hz moves its magnitude between those fixed columns. |
| Sequence / RNN / LSTM | Order reversal, a three-reading window with an excluded target, fixed recurrent state, forget/input gate arithmetic and observed-versus-forecast chronology inspected. Exact generated recurrent state is now preserved. |
| Forecast / ensemble | Recursive rule and two fixed forecasts are explicitly illustrative. Blending changes the plotted combination and held-out teaching-case error, without claiming training or future performance. |
| Attention | Content-only reference is retained for Beyond LSTM. Temporal reference now includes an adjustable coefficient on normalized position before softmax, then pools the original values. New rendered test compares both early/later preferences and weighted output with TFJS. |
| Kalman | Measurement variance changes scalar gain, estimate and posterior variance correctly. The prior variance is fixed for this one update; no full-filter simulation is claimed. |
| Anomaly | Baseline and averaging-reconstruction examples retain their limits. The Agreement reference now uses the actual exercise contracts: amplitude z-score, supplied reconstruction error, supplied amplitude forecast miss, and two-of-three majority. Each vote can be changed separately. It is distinguished from the full model's three-feature forecast MSE. |
| Precision | Fixed-bound uniform quantization and strict-below-cutoff pruning calculations are correct. Values remain JavaScript numbers; no runtime or accuracy benefit is claimed. |
| Flow stages | Read every browser, optimization, LLM and capstone stage definition. They are labeled schematic steps rather than executed systems. Reported two root-owned snippets for correction: profiler must start its clock before `predict`, and backend initialization must verify actual success. Other stages preserve schema/version/evidence boundaries. |

The reference result now has an accessible name, distinguishing it from native
range outputs with implicit status roles. Non-flow references explicitly identify
JavaScript simulations and state that they do not run or train the lesson's
models. No model quality, device speed, remote provider result or mission outcome
was invented.

Verification after these changes: **87/87 tests passed** across
`reference-instruments.test.tsx`, `numeric-investigations.test.ts`, and the full
`lesson-visuals.test.tsx` curriculum matrix. The last file renders every one of the
56 mapped references and operates its labeled input. Nine added reference cases
exercise actual rendered controls, numerical code precision, true vote inputs,
fixed FFT column identity, manual checkpoint semantics, and TFJS-backed spectrum,
attention and population-moment comparisons. Primary FFT identity has a separate
numeric regression. Root performs the final integrated build and browser pass.
