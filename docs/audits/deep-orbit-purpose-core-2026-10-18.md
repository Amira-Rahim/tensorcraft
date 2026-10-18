# Deep Orbit purpose audit: core missions

Scope: 19 lessons and 20 exercises, covering Foundations 03-05, all Neural
Networks, all Training Loop, and all Browser Runtimes. Reviewed each briefing,
concept, optional reference and derivation, challenge, recall/recap, and ending.
The first two Foundations missions and shared UI/transport are owned by the
parent agent. Source baseline: `/tmp/tensorcraft-purpose-core-before.json`.

## Findings and implementation

The main gap was between a stated crew task and an invisible exercise result.
The exercises calculated useful values, but most showed only test verdicts.
Each owned exercise now records bounded, inspectable output from an existing
successful test, using submitted values or the result of an existing call.
No extra training runs, random probes, or fabricated measurements were added.
Challenge wording now names that output and the check or next step it enables.

Specific misleading connections were corrected:

- ReLU is the hidden-layer activation check, not the answer to Nazari's alert
  threshold question. The consequence logline no longer implies ReLU bounds
  scores. Threshold choice and model evaluation remain separate.
- The 8-feature rehearsal classifier is not called the bridge classifier.
  Its generated data, 529 parameters, and before/after comparison remain
  distinct from the bridge model's 3 inputs and 673 parameters.
- Model inspection copies an input contract and closes its model. An inference
  handler retains its loaded model until teardown; the lesson now says so.
- Startup probes, model-loader responses, ONNX sessions, sentiment predictions,
  and the ONNX comparison clock remain explicitly simulated where applicable.
  Their output cannot masquerade as hardware or model-quality measurements.
- Archive loading exposes yielded rows, batch shapes, and split membership.
  Scaling exposes saved statistics, scaled rows, and fixed-neuron scores.
  Gradient methods expose both their answers and observed forward-pass counts.
  Training exposes its actual fit history, and evaluation exposes the measured
  gap rather than the fictional crew's score.

## Five-section review for every lesson

Every row includes optional references and nested material in its concept
review. Existing scenes, mathematical explanations, graded recall questions,
and earned story unknowns were preserved unless noted above.

| Mission | Briefing task | Concept and reference | Challenge and inspectable result | Recall and recap | Ending and enabled next step |
| --- | --- | --- | --- | --- | --- |
| Basic Tensor Operations | Restore Nazari's feed after the wrong multiply. | Average/gain, broadcasting, channel-bank sums; original failure and derivation retained. | Submitted averaged and amplified passes plus matrix bank scores. | Checks dimensions and axis meanings, not shape alone. | Authored ripple survives another pass; the archive now needs a loader. |
| Loading and Preparing Data | Recover from Demir's full-archive memory failure. | Lazy reads, feature/label pairing, buffering, chronological split; async archive sketch remains labeled. | Actual yielded stand-in rows, batch shapes, and saved train/validation IDs. | Tests shuffle-before-batch and temporal leakage. | Authored full-archive run stays distinct from the 16-row exercise; mismatched feature scales become the next issue. |
| Data Normalization | Prepare Farah's fixed preview model inputs. | Per-feature statistics, reuse, zero-scale behavior, min-max limits, and supplied-neuron math retained. | Saved mean/std, scaled rows and actual model scores, and unitRange output. | Tests scaling purpose and broadcasting. | Sample 7741 is first flagged; a preview score does not resolve its cause. |
| Your First Neuron | Build the score calculation that can later be trained. | Weighted sum, bias, sign and sensitivity, and limits of weight interpretation. | Actual scalar returned by the submitted neuron on the supplied arithmetic case. | Separates weights, bias, and threshold. | Calibration-tone scene remains authored; next stage needs an activation. |
| Activation Functions | Separate the alert rule from hidden-layer behavior. | Affine stack limitation, ReLU, sigmoid/tanh, saturation, calibration and threshold distinctions. | Actual test scores beside submitted ReLU output. | Tests nonlinearity and bounded-score interpretation. | Demir changes weights and a threshold; 7741 disagreement remains unresolved. |
| Layers and Architecture | Give Nazari a network and a checkable parameter quote. | Dense connections, input widths, 673-parameter example, and explicit XOR capacity demonstration. | Actual 16/8/1 stack metadata and submitted count versus built-model count. | Counts weights/biases and infers later input widths. | Bridge-model quote is a separate 32/16/1 configuration; it still needs to earn its cost. |
| The Forward Pass | Make the failed demo accept a proper batch. | Dense forward calculation, missing axis, manual path, floating-point tolerance, cleanup. | Actual inputs and outputs from the submitted two-feature exercise model. | Applies the batch contract to a new feature width. | Untrained scores are saved as a starting comparison, not trusted predictions. |
| Building a Complete Network | Assemble and compare independent rehearsal models. | Compilation, initialization, loss/optimizer/metric jobs, and symmetry limits. | Selected actual scores from both untrained models and the first model after fitting. | Compilation and kernel-count transfer remain graded. | Bridge starting states remain uninterpreted; training mechanics come next. |
| Loss Functions | Give Farah a numerical error signal. | MSE, logits/probability contracts, derivative comparison, and loss comparability. | Actual BCE for supplied confident-correct and confident-wrong cases. | Selects the correct API and computes MSE. | Authored baseline leaves room for a held-out score; lowering loss is not deployment approval. |
| Gradient Descent | Turn a loss gradient into a parameter update. | Learning rate, local descent, convergence ranges, autograd, and derivation retained. | Stored gradient and updated weight, plus captured three-step weight trace. | Exploding loss prompts investigation, not one certain diagnosis. | One updated weight leaves 672; calculating gradients together is the next problem. |
| Backpropagation | Replace repeated per-weight forward evaluations. | Finite differences, chain rule, graph reuse, vanishing gradients and residual limits. | Actual automatic/numerical gradients and observed forward-count comparison. | Distinguishes gradient calculation from updates. | Story timings stay fictional; learner evidence is the counted work, not a device benchmark. |
| The Training Loop | Give Demir a stopping rule. | Fit mechanics, early stopping, checkpoint limits, recent-window rule, optimizer details. | Up to 64 selected points from the actual submitted training/validation history. | Tests patience, trend limits, and separate best-checkpoint handling. | Authored epoch-102 scene stays separate from the learner run; held-out evaluation follows. |
| Evaluating DEEP SCAN | Prepare Mirza's evaluation record on separate rows. | Split integrity, measured gap, baseline, errors, confusion metrics and base rates. | Actual training/test metrics and submitted gap label. | Transfer covers gap investigation, temporal splits, and changing prevalence. | Crew's 94% and 7741 score remain fictional scene values, not grader targets or a solved mystery. |
| Why the Browser? | Screen deployment options against dashboard requirements. | Offline assets, network dependence, compute/download costs, actual workload measurement. | Submitted recommendations for the policy's size/latency boundaries. | Checks deployment tradeoffs without guarantees. | Nazari's authored local-deployment order leads to runtime setup. |
| TensorFlow.js Setup | Make startup report the backend that really initialized. | Install/register/await/check, supported backends, completed-work benchmarking. | Backend and version returned from the simulated cold-runtime case. | Transfer requires querying the runtime and measuring target hardware. | Console timings remain authored, not claims about the learner's machine. |
| Model Loading | Obtain the model's input contract once. | Manifest/shards, export formats, cache versions, storage failure and disposal ownership. | Actual metadata returned by the learner from a simulated loader response. | Differentiates JSON from a runnable model. | Authored stale-cache incident leads to versioning; next lesson keeps the inference model alive. |
| Inference Pipeline | Route normalized readings into prediction without leaking temporaries. | Physical ranges, feature order, phase wrap, synchronous/async ownership, calibration. | Captured normalized model input, returned class score, and before/after tensor count; secondary incident exposes headroom estimate. | Checks resource policy and endpoint growth projection. | Story replay and 7741 flag remain separate from identity-probe evidence. |
| ONNX Runtime Web | Compare compatible executions before choosing a runtime. | Export compatibility, opset/provider, parity, latency distributions, cold start, real lab. | Actual agreement and simulated timer intervals from the submitted comparison. | Tests portability and limits of a laptop measurement. | Runtime choice stays based on the authored console work; simulation cannot choose a winner. |
| Transformers.js | Assemble Mirza's report queue without mismatching reports and scores. | Pretrained task fit, pinned assets, cache behavior, labels and domain evaluation. | Submitted sorted report/label/score rows from the sentiment simulation. | Tests suitability and an honest representative evaluation. | Pretrained integration is working; the unexplained signal returns in the next module. |

## Exercise capture mapping

All captures are called after assertions inside existing tests. None reads an
expected-output constant as if it were a submitted answer. Literal labels name
columns, cases, and selected indices; displayed output values come from the
learner's returned values or model/history. All calls meet the authored limits.

| Exercise | Captured output and source | Scope and limit |
| --- | --- | --- |
| add-tensors | `merged.dataSync()`, `boosted.dataSync()`, and `out.arraySync()` from existing merge/mix calls. | Three tables; supplied test passes, not the full 64-channel stream. |
| batch-data | Submitted `batchShapes`; actual `xs`/`ys` collected during the existing bare verification drain; actual `trainIdx`/`valIdx`. | Three tables, at most 16 rows each; ID-derived synthetic archive stand-in. No extra drain added. |
| normalize-data | Submitted `mean`/`std`, `normalized` plus `scores`, and `unitRange`. | Three tables for two features/four readings; fixed supplied neuron, no accuracy claim. |
| implement-neuron | Actual submitted `output` tensor scalar. | One table; fixed arithmetic example, no training or classification claim. |
| relu-activation | Existing input tensor and actual activation output. | One five-row comparison; activation behavior, no alert threshold. |
| build-layer | Actual layer configs/counts and existing `quoted` result versus model count. | Two tables; exercise's 16/8/1 stack. No extra model built. |
| forward-pass | Existing `input` and actual `prediction` values already checked against weights. | One two-row table; untrained random model. |
| simple-network | Submitted `sweepOne`, `sweepTwo`, `trainedSweep`, and supplied labels. | One 16-row subset, IDs 0-7 and 60-67. Existing synthetic training run only; no new-data evaluation. |
| mse-loss | Existing `rightLoss` and `wrongLoss` readbacks. | One two-row BCE comparison; identical labels, different supplied logit cases. |
| gradient-step | Actual stored gradient, learning rate and weight, plus snapshots during the existing three-step check. | One table and one three-point weight series. No extra update. |
| backprop-chain | Existing automatic result kept in `comparison`, numerical estimates `est`, and observed `recordedPasses`/`estimatePasses`. | Two three-variable/cost tables; forward counts, not timing. No extra differentiation call. |
| training-loop-exercise | Actual `history.history.loss` and `val_loss`. | One series with up to 64 evenly spaced epoch samples including endpoints. No extra fit. |
| deep-scan-eval | Submitted `trainAcc`, `testAcc`, `verdict`, `history` and `evalResult`. | One metrics table plus verdict text. Synthetic fixture; final fit log versus held-out evaluation. |
| browser-ml-tradeoffs | Actual decisions from the two existing boundary calls, now held in named variables. | One two-row policy table; no performance measurements. |
| tfjs-setup | Returned `result.backend` and `result.version` from existing cold-runtime test. | One table, explicitly simulated/generated names, not current-machine metadata. |
| load-model | Actual `info.inputShape`, `outputShape`, and `layerCount`. | One metadata table; simulated model-loader response. |
| inference-pipeline | Actual input recorded by the existing model spy plus returned class/score; actual counts around existing cleanup probe. | Two tables; identity model tests routing/cleanup, not classification accuracy. |
| incident-tensor-leak | Existing `r.growing`, `ratePerHour`, and `hoursToBudget` from the positive-growth case. | One projection table; supplied snapshots, constant-rate assumption. Flat/falling Infinity cases remain graded but are not serialized. |
| onnx-comparison | Actual `out.outputsAgree`, `tfjsMs`, and `onnxMs`. | One table; ONNX and clock are simulated. Generated intervals are not milliseconds measured on hardware. |
| load-pretrained-pipeline | Actual sorted `out` rows, keeping text/label/score paired. | One three-report table; supplied sentiment simulation, no urgency or real-model-quality claim. |

## Preservation and verification

AST comparison against the saved baseline found 459 existing grader assertions
with no added or removed assertion. Two deployment assertions now read named
results of the identical previous calls; inputs and expected decisions are
unchanged. All other assertions are byte-equivalent after AST printing.
Starter and solution code remain byte-identical for all 20 exercises. All 50
owned MDX CodeBlock blocks and 25 graded recall blocks remain byte-identical.
Evidence: `.superpowers/purpose-core-preservation.json`.

The current capture build was produced by the sibling content agent. All 20
existing solution/starter/cheat gates passed: 122 solution tests, all untouched
starters unable to complete, 31 registered cheat probes rejected while clearing
at least one test, and zero warnings. Harness parity passed its 35 fixtures in
each invocation. The sequential run took 205.44 seconds. Full output:
`.superpowers/purpose-exercise-validation-core.log`. `git diff --check` passes.
No new tests or commits were created. The final MDX copy needs the parent's
aggregate content build; the validated exercise capture code is unchanged.

## Technical limits and remaining ownership

- Shared result transport, validation, stale-result handling, and presentation
  belong to the parent agent. This audit adds authored capture sites and copy.
- These snapshots expose actual submitted results. They do not introduce a
  shared live model or recording object persisted between independent lessons.
  Later fixtures and authored story runs remain identified separately.
- No fictional timings, discovery, accuracy, or sample-7741 truth was replaced
  with a favorable learner outcome. Existing story mysteries remain unresolved.
- The browser lab and independent project remain the route to real asset,
  device, cache, network, and pretrained-model measurements. Their full runs
  were not performed by this source pass.
- Other Deep Orbit modules and the first two Foundations lessons are outside
  this agent's ownership and must be included in the parent's full audit.
