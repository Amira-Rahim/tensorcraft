# Course clarity implementation record

Date: November 10, 2026.

Status: all 56 Deep Orbit clarity revisions are implemented and internally verified. The final delivery entry below records current coverage and evidence. Earlier batches and their original findings remain as history. Independent learner evidence remains pending.

## Source baseline and scope

Initial source revision: `db4225a7e9d809b894251cd4df127e2ef22a2311`.
At this record's initial snapshot, `git status --short` showed only the
untracked [implementation plan](../superpowers/plans/2026-11-09-course-clarity-implementation.md).
Concurrent implementation may add product edits after this snapshot. Each
completed slice must record its own changed files and revision or hashes.

The current source inventory resolves all 56 Deep Orbit MDX lessons and all
65 unique primary and secondary `<Exercise>` references to 65 existing YAML
files. No authored Deep Orbit exercise YAML is unreferenced. The sequence
matches plan cards L01-L56. Source inventory does not establish that every
lesson is technically correct, understandable, or verified in a browser.

## Historical package state after the fifth batch

| Package                               | Current state                                    | Evidence and remaining work                                                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P00 baseline and preservation ledger | In progress | Inventory and inherited staleness recorded. Historical first-, second-, and third-batch snapshots are preserved. Fourth-batch verification and source attribution are recorded below. Missing before-change media remains open. |
| P01 source/model contracts | Bounded review across twenty-five lessons | L01-L21 and four later references have reviewed source boundaries. Calibration/model lineage and the recorded continuity limits remain open. |
| P02 source context                    | Planned                                          | Existing local source labels improved. No new shared metadata contract has been introduced.                                                                                                       |
| P03 worked explanations | Twenty-five unique bounded slices internally verified | L01-L21, L23, L29, L44, and L47. Earlier final checks pass. Browser Runtimes final verification passes within its recorded scope. Full cards remain open. |
| P04 current-result explanation | Twelve exercise contracts internally verified | The original seven contracts cover six families. Five Browser Runtimes contracts add five families. Their final paid-route checks pass. Other families remain planned. |
| P05 feedback and independent practice | Limited supporting changes | Prior fixture, restoration, and layer checks remain. L12 checks replaced-gradient disposal. L14 accepts valid short epoch budgets. L15 checks strict gap equality. Original LSTM recall indices are preserved. Course-wide feedback/recall work remains open. |
| P06 multi-exercise orientation        | Planned                                          | Authored MDX reference order and mounted editor state remain mandatory.                                                                                                                           |
| P07 reference rollout | Batch E internally verified within stated scope | Twenty-five unique bounded lesson slices. Thirty-one lessons have no implementation slice. All full cards remain open. |
| P08 complete-course verification | Fifth-batch internal checks passed | Full-course renderer/story, isolated production build, final lesson preview, new inspector matrix, actual-route Workers, and retained evaluation workflow pass within the documented scope. These checks do not close full cards. |
| P09 draft worlds                      | Planned                                          | Separate discovery/release work remains outside this launched-course batch.                                                                                                                       |
| P10 learner evidence                  | Pending                                          | No participants or new independent reviewer results are recorded here.                                                                                                                            |

These are counts of bounded implementation slices, not completed cards or a
measured learning score. L02 belongs to both the reference and Foundations
batches and counts once. All 56 full lesson cards remain open.

## Existing review records and baseline findings

Executed at the initial snapshot:

```bash
node scripts/check-content-review.mjs
```

Result: exit code 1. All 121 recorded Deep Orbit lesson/exercise hashes differ
from current source. Of 162 supporting-artifact records, 57 hashes differ.
No recorded artifact is missing. These differences predate this implementation
slice. The command ends by requiring review before hashes are updated.

The result is inherited review staleness. This work does not refresh the
[content review manifest](content-review-manifest.json) or silently count
historical review statuses as current. A changed artifact needs new evidence
for each affected dimension before its recorded hash can be refreshed.

At the initial snapshot, the [result capture matrix](../design-previews/research/result-contract-matrix.json)
contains 56 lesson records and 65 exercise records. Twenty-one lesson hashes
and one exercise hash differ from its recorded source. Its source totals and
old result declarations describe the November 6 research snapshot. Current
source overrides stale limits or capture descriptions. The narrow architecture
reconciliation below does not renew its complete pedagogical review.

## Architecture reconciliation

The live Concept path comes from
`apps/web/app/components/lesson-visuals/lesson-workbench.tsx`:

- L01 renders `TensorInvestigation` through `LessonInstrument`. Its recording
  and worked code live in `tensor-example.ts` and `channel-layout-data.ts`.
- L02 renders `ChannelLayoutExperiment`, with `channel-layout-data.ts` as
  its recording and excerpt contract.
- The other 54 lessons use `LessonInvestigation` from the merged numeric/flow
  registry. The inventory below identifies which registry supplies each key.
- The two opening numeric registry entries are not the live opening activities.
  Changing those entries alone cannot repair the rendered opening.
- Normalization, network training, and evaluation already use
  `LearningEvidenceExercise` in `lesson-content.tsx` with their specialized
  result explanations. Generic exercise output remains the fallback elsewhere.
- The second batch adds transient `LessonResultExercise` explanations for
  create-a-tensor, reshape-tensor, and backprop-chain. Exact known captures
  decode into two families. Unsupported or undecodable artifacts retain the
  ordinary output path. This path adds no saved-run registration.
- The third batch adds forward-pass as a fourth contract and dense-forward as
  a third family. Its paired input/output and actual kernel/bias tables belong
  to the same model calculation. It retains the same transient host, fallback,
  run identity, partial/stale handling, and existing persistence boundaries.
- Evaluation already captures its report through `captureEvaluation` and
  `evaluationCapture.artifacts.forEach(recordResult)`. Its shared decoder and
  viewer support measured-score/context tables and captured cases. Earlier
  aggregate-only descriptions are stale. Preserve the four-role contract and
  its partial/unavailable states. New source inspection does not establish
  capture reachability in every error path.

The registry aliases in the inventory resolve to:

- `numeric`: `apps/web/app/components/lesson-visuals/numeric-investigations.ts`.
- `flow`: `apps/web/app/components/lesson-visuals/flow-investigations.ts`.
- `TensorInvestigation`: `apps/web/app/components/lesson-visuals/tensor-investigation.tsx`.
- `ChannelLayoutExperiment`: `apps/web/app/components/mdx/channel-layout-experiment.tsx`.

`DEEP_ORBIT_VISUALS` in `deep-orbit-visuals.ts` supplies the corresponding
visual question/reference definition. A registry entry's existence alone
cannot establish live rendering or lesson correctness.

## Preservation fields and review coverage

The existing [lesson/result map](../design-previews/research/deep-orbit-result-map.md)
remains the preservation record for each lesson's crew task, source boundary,
current primary/secondary activities, desired result, and limits. The card
named in the inventory adds its intended misconception check and acceptance
criteria. Read its current MDX and YAML before changing it.

For each implementation slice, retain these fields in its completion entry:

| Field                          | Existing source and required check                                                                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective and prerequisite     | Current frontmatter, objectives, main explanation, and plan card. Map every required operation to visible prior teaching or supplied code.                                                   |
| Incoming and outgoing story    | Current Briefing and predecessor Epilogue, then current Epilogue and successor Briefing. Preserve character competence, known evidence, unresolved questions, and earned discoveries.        |
| Data and model identity        | Map's task/source and limits columns, current fixture, and source-specific metadata. Record selection, order, units, feature meaning, labels/authority, model identity, and transformations. |
| Required work and alternatives | All YAML instructions, starter, solution, tests, hints, and current capture. Preserve valid alternatives and plausible wrong-answer rejection.                                               |
| Actual result                  | Capture code, result groups, source labels, stale-state behavior, and viewer. Keep supplied references and learner runs distinct.                                                            |
| Other surfaces                 | The inventory's custom activities, references, glossary, recall, recap, project/transfer work, and saved-choice continuations.                                                               |
| State and presentation         | Stable IDs, drafts, assistance, progress, readers, five phases, full-width story/artwork, keyboard operation, and reduced motion.                                                            |
| Changed technical claims       | Claim, installed version, version-matched primary source or executable mathematical proof, assumptions, affected surfaces, and review outcome.                                               |

Fifteen lessons have received focused source review for the bounded changes
recorded below. Other preservation fields remain requirements
and pointers, with implementation review pending. No whole-course review is
inferred from this inventory extraction.

## L02 source and technical contract

Source files inspected:

- `packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx`
- `packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx`
- `packages/content/content/deep-orbit/foundations/exercises/reshape-tensor.yaml`
- `apps/web/app/components/mdx/channel-layout-data.ts`
- `apps/web/app/components/lesson-visuals/lesson-workbench.tsx`

`RECORDING_SOURCE.id` is `demir-recording`. This is an authored fictional
recording from 64 sensors. Its worked excerpt selects sensors A, B, C, D at
three local moments in moment-then-sensor order. The selected sensors are not
claimed to be a contiguous slice of the full list. The recording's header
supplies sensor identity and order. Shape cannot supply that metadata.

The main 12 readings, shared with L01, are:

```text
Moment 1: A=2, B=20, C=5, D=8
Moment 2: A=3, B=18, C=7, D=8
Moment 3: A=4, B=16, C=6, D=9
```

The values are recorded readings with no authored physical unit. Moment
numbers are local to this excerpt, not global timestamps or a sample-rate
claim. Keep those limits in labels and explanations.

Required learner work:

1. Reshape the supplied flat tensor to `[3, 4]`, one moment per row.
2. Read row index 1 as the JavaScript array `[3, 18, 7, 8]`.
3. Transpose that grid to `[4, 3]`, with rows `[2, 3, 4]`, `[20, 18, 16]`,
   `[5, 7, 6]`, and `[8, 8, 9]` for sensors A-D.
4. Inspect the chart created from their actual `bySensor` tensor. The chart
   groups those rows into series. This exercise does not train a model.

A reshape to `[4, 3]` has the requested shape but produces rows
`[2, 20, 5]`, `[8, 3, 18]`, `[7, 8, 4]`, and `[16, 6, 9]`. Its mixed sensor
membership remains a required misconception case. Existing checks also require
that the submitted tensors come from the actual supplied reshape/transpose
operations, rather than separately typed-out answers.

The changed-case activity's `CHECK_PACKET` selects A-C at two local moments
with rows `[10, 20, 30]` and `[11, 21, 31]`. The RecallPrompt uses another
identified A-C excerpt with rows `[6, 10, 14]` and `[7, 12, 13]`. These are
separate excerpt cases. Neither changes the worked 12 readings. The
Epilogue's full `[450, 64]` recording is a separate crew action, not the
learner's captured output.

State boundaries: keep `CHANNEL_EXPERIMENT_ID`, its registered version,
`CHANNEL_STORAGE_KEY`, exercise slug `reshape-tensor`, and existing draft and
assistance meanings. Any additional UI selection must preserve existing draft
compatibility or use an explicitly reviewed compatible reader. No new model,
fixture, label authority, persistence schema, or completion rule is required
for the bounded clarity slice.

The following table records the initial declaration review. Later first-batch
execution and browser checks appear in the dated implementation entry below.

| Claim                                                       | Primary evidence inspected                                                                          | Status and execution limit                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Reshape returns the same values with a new equal-size shape | Installed `@tensorflow/tfjs-core@4.22.0`, `dist/ops/reshape.d.ts`, resolved from `apps/web`.        | Declaration source reviewed. Numeric execution for this implementation is pending. |
| Default rank-2 transpose exchanges the two axes             | The same installed package, `dist/ops/transpose.d.ts`, documents default reversed-axis permutation. | Declaration source reviewed. Actual transform/value checks are pending.            |
| Sensor/time meaning comes from authored recording metadata  | `RECORDING_SOURCE`, `WORKED_EXCERPT`, `CHECK_EXCERPT`, and the current two opening lessons.         | Source reviewed. Browser comprehension remains unobserved.                         |
| Same shape can contain wrong sensor membership              | Index the documented 12-value flat order using the two requested layouts.                           | Expected arrays stated above. This record does not claim runtime execution.        |

The installed primary declarations are available through
`apps/web/node_modules/@tensorflow/tfjs-core/dist/ops/reshape.d.ts` and
`transpose.d.ts`. The module package resolved to the pnpm distribution of
version 4.22.0. Preserve the version and rerun the relevant examples when the
implementation changes. No network lookup or API-version inference was needed
for this declaration review.

## Reference-contract queue

This initial queue predates the first implementation checks. Preserve its
pending states as history. The dated implementation entries below record the
later source, execution, and browser evidence.

| Card                  | Contract work before full reference completion                                                                             | Current state                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| L02 Tensor Shapes     | Existing shared recording/operation contract above                                                                         | Focused source review recorded, implementation verification pending                       |
| L13 Backpropagation   | Supplied scalar and three-variable loss identities, automatic/numerical comparison, restoration, and actual forward counts | Bounded explanation implementation in progress, contract and execution completion pending |
| L23 Fourier Transform | Reviewed recording, sample rate, window length, bin convention, units, and the separate story discovery                    | Pending                                                                                   |
| L29 LSTM Gates        | Reviewed input/weight/state identities, gate order, activations, manual/library parity, and source transition              | Pending                                                                                   |
| L44 RAG for Signals   | Record/claim authority, filter mechanism, order/cap, citation fields, units, and unsupported cases                         | Pending                                                                                   |
| L47 Model Profiling   | Supplied model identity, timing boundaries, controlled clock versus device measurement, and ownership                      | Pending                                                                                   |

## Lesson inventory and implementation state

Exercises appear in authored MDX order. Secondary exercises remain visible in
the same row. Other activity IDs are source inventory, not execution evidence.
Every row's source map/card preservation requirements remain in force.
Twenty-five unique lessons now have bounded implementation slices. Thirty-one
remain unstarted. Earlier module and actual-route checks remain recorded as
history. Fifth-batch Browser Runtimes final verification passes within its recorded scope.

| Card | Lesson source                                                                                                          | Exercise slugs, primary first                               | Live Concept              | Other authored activities                                                                                                      | Clarity state                                             |
| ---- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| L01  | [introduction-to-tensors](../../packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx)        | `create-a-tensor`                                           | `TensorInvestigation`     | None authored in MDX                                                                                                           | bounded slice verified, full card open |
| L02  | [tensor-shapes](../../packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx)                            | `reshape-tensor`                                            | `ChannelLayoutExperiment` | None authored in MDX                                                                                                           | bounded slice verified, full card open |
| L03  | [tensor-operations](../../packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx)                    | `add-tensors`                                               | `numeric`                 | None authored in MDX                                                                                                           | bounded slice verified, full card open                    |
| L04  | [data-loading](../../packages/content/content/deep-orbit/foundations/04-data-loading.mdx)                              | `batch-data`                                                | `numeric`                 | `DecisionTask:future-builds`                                                                                                   | bounded diagnostic slice verified, continuity open        |
| L05  | [normalization](../../packages/content/content/deep-orbit/foundations/05-normalization.mdx)                            | `normalize-data`                                            | `numeric`                 | `LearningExperiment:normalization`, `ProjectMilestone:data`, `DeepScanDemo`, `BossBeat:deep-orbit-foundations-7741-first-flag` | bounded slice verified, continuity open                   |
| L06  | [first-neuron](../../packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx)                          | `implement-neuron`                                          | `numeric`                 | `StoryConsequence:deep-orbit-foundations-7741-first-flag`                                                                      | bounded slice verified, continuity/full card open |
| L07  | [activation-functions](../../packages/content/content/deep-orbit/neural-networks/02-activation-functions.mdx)          | `relu-activation`                                           | `numeric`                 | None authored in MDX                                                                                                           | bounded slice verified, continuity/full card open |
| L08  | [layers-and-architecture](../../packages/content/content/deep-orbit/neural-networks/03-layers-and-architecture.mdx)    | `build-layer`                                               | `numeric`                 | None authored in MDX                                                                                                           | bounded slice verified, continuity/full card open |
| L09  | [forward-pass](../../packages/content/content/deep-orbit/neural-networks/04-forward-pass.mdx)                          | `forward-pass`                                              | `numeric`                 | None authored in MDX                                                                                                           | bounded slice verified, continuity/full card open |
| L10  | [building-a-network](../../packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx)              | `simple-network`                                            | `numeric`                 | None authored in MDX                                                                                                           | bounded slice verified, continuity/full card open |
| L11  | [loss-functions](../../packages/content/content/deep-orbit/training-loop/01-loss-functions.mdx)                        | `mse-loss`                                                  | `numeric`                 | None authored in MDX                                                                                                           | bounded slice internally verified, full card open                                                   |
| L12  | [gradient-descent](../../packages/content/content/deep-orbit/training-loop/02-gradient-descent.mdx)                    | `gradient-step`                                             | `numeric`                 | `LearningExperiment:learning-rate`                                                                                             | bounded slice internally verified, full card open                                                   |
| L13  | [backpropagation](../../packages/content/content/deep-orbit/training-loop/03-backpropagation.mdx)                      | `backprop-chain`                                            | `numeric`                 | None authored in MDX                                                                                                           | bounded slice verified, full card open    |
| L14  | [training-loop](../../packages/content/content/deep-orbit/training-loop/04-training-loop.mdx)                          | `training-loop-exercise`                                    | `numeric`                 | None authored in MDX                                                                                                           | bounded slice internally verified, full card open                                                   |
| L15  | [evaluating-deep-scan](../../packages/content/content/deep-orbit/training-loop/05-evaluating-deep-scan.mdx)            | `deep-scan-eval`                                            | `numeric`                 | `DecisionTask:review-costs`, `TransferAssignment`, `ProjectMilestone:evaluation`                                               | bounded slice internally verified, full card open                                                   |
| L16  | [why-the-browser](../../packages/content/content/deep-orbit/browser-runtimes/01-why-the-browser.mdx)                   | `browser-ml-tradeoffs`                                      | `flow`                    | None authored in MDX                                                                                                           | bounded slice internally verified, full card open                                                   |
| L17  | [tensorflow-js-setup](../../packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx)           | `tfjs-setup`                                                | `flow`                    | None authored in MDX                                                                                                           | bounded slice internally verified, full card open                                                   |
| L18  | [model-loading](../../packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx)                       | `load-model`                                                | `flow`                    | None authored in MDX                                                                                                           | bounded slice internally verified, full card open                                                   |
| L19  | [inference-pipeline](../../packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx)             | `inference-pipeline`, `incident-tensor-leak`                | `flow`                    | None authored in MDX                                                                                                           | bounded slice internally verified, full card open                                                   |
| L20  | [onnx-runtime-web](../../packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx)                 | `onnx-comparison`                                           | `flow`                    | None authored in MDX                                                                                                           | bounded slice internally verified, full card open                                                   |
| L21  | [transformers-js](../../packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx)                   | `load-pretrained-pipeline`                                  | `flow`                    | None authored in MDX                                                                                                           | bounded slice internally verified, full card open                                                   |
| L22  | [time-vs-frequency](../../packages/content/content/deep-orbit/signal-processing/01-time-vs-frequency.mdx)              | `time-vs-frequency`                                         | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L23  | [fourier-transform](../../packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx)              | `compute-fft`                                               | `numeric`                 | `LearningExperiment:fft`                                                                                                       | bounded slice verified, full card open                    |
| L24  | [spectrograms](../../packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx)                        | `build-spectrogram`                                         | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L25  | [fft-as-features](../../packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx)                  | `fft-features`                                              | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L26  | [windowing-and-overlap](../../packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx)      | `apply-window`                                              | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L27  | [sequences-matter](../../packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx)               | `create-sequences`                                          | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L28  | [simple-rnns](../../packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx)                         | `build-rnn`                                                 | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L29  | [lstm-gates](../../packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx)                           | `build-lstm`                                                | `numeric`                 | None authored in MDX                                                                                                           | bounded slice verified, full card open                    |
| L30  | [sliding-windows](../../packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx)                 | `sliding-window`                                            | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L31  | [sequence-prediction](../../packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx)         | `predict-next`                                              | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L32  | [normal-vs-anomalous](../../packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx)          | `detect-anomaly`, `incident-baseline-drift`                 | `numeric`                 | `BossBeat:deep-orbit-anomaly-7741-training-set`                                                                                | planned                                                   |
| L33  | [autoencoders](../../packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx)                        | `build-autoencoder`                                         | `numeric`                 | `StoryConsequence:deep-orbit-anomaly-7741-training-set`                                                                        | planned                                                   |
| L34  | [reconstruction-error](../../packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx)        | `reconstruction-error`, `incident-missed-anomaly`           | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L35  | [threshold-tuning](../../packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx)                | `find-threshold`, `incident-false-alarm-storm`              | `numeric`                 | `LearningExperiment:threshold`, `DecisionTask:rule-or-model`                                                                   | planned                                                   |
| L36  | [the-anomaly](../../packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx)                          | `ensemble-detector`                                         | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L37  | [beyond-lstm](../../packages/content/content/deep-orbit/advanced-time-series/01-beyond-lstm.mdx)                       | `simple-attention`                                          | `numeric`                 | `LearningExperiment:attention`                                                                                                 | planned                                                   |
| L38  | [temporal-attention](../../packages/content/content/deep-orbit/advanced-time-series/02-temporal-attention.mdx)         | `temporal-attention`                                        | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L39  | [forecasting](../../packages/content/content/deep-orbit/advanced-time-series/03-forecasting.mdx)                       | `forecast-signal`                                           | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L40  | [kalman-filters](../../packages/content/content/deep-orbit/advanced-time-series/04-kalman-filters.mdx)                 | `kalman-filter`                                             | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L41  | [time-series-ensemble-methods](../../packages/content/content/deep-orbit/advanced-time-series/05-ensemble-methods.mdx) | `weighted-ensemble`                                         | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L42  | [llms-for-science](../../packages/content/content/deep-orbit/llm-integration/01-llms-for-science.mdx)                  | `llm-client`                                                | `flow`                    | None authored in MDX                                                                                                           | planned                                                   |
| L43  | [prompt-engineering](../../packages/content/content/deep-orbit/llm-integration/02-prompt-engineering.mdx)              | `prompt-template`                                           | `flow`                    | None authored in MDX                                                                                                           | planned                                                   |
| L44  | [rag-for-signals](../../packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx)                    | `retrieve-signals`, `rag-pipeline`                          | `flow`                    | None authored in MDX                                                                                                           | bounded slice verified, full card open                    |
| L45  | [report-generation](../../packages/content/content/deep-orbit/llm-integration/04-report-generation.mdx)                | `generate-report`                                           | `flow`                    | `BossBeat:deep-orbit-llm-cut-call`                                                                                             | planned                                                   |
| L46  | [multi-model-systems](../../packages/content/content/deep-orbit/llm-integration/05-multi-model-systems.mdx)            | `model-pipeline`                                            | `flow`                    | `StoryConsequence:deep-orbit-llm-cut-call`                                                                                     | planned                                                   |
| L47  | [model-profiling](../../packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx)                  | `profile-model`                                             | `flow`                    | None authored in MDX                                                                                                           | bounded slice verified, full card open                    |
| L48  | [quantization](../../packages/content/content/deep-orbit/optimization-edge/02-quantization.mdx)                        | `quantize-weights`                                          | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L49  | [pruning](../../packages/content/content/deep-orbit/optimization-edge/03-pruning.mdx)                                  | `prune-weights`                                             | `numeric`                 | None authored in MDX                                                                                                           | planned                                                   |
| L50  | [caching-strategies](../../packages/content/content/deep-orbit/optimization-edge/04-caching-strategies.mdx)            | `inference-cache`, `incident-stale-verdict`                 | `flow`                    | `LearningExperiment:cache`, `BossBeat:deep-orbit-cache-policy`                                                                 | planned                                                   |
| L51  | [webgpu-acceleration](../../packages/content/content/deep-orbit/optimization-edge/05-webgpu-acceleration.mdx)          | `gpu-backend`                                               | `flow`                    | `StoryConsequence:deep-orbit-cache-policy`                                                                                     | planned                                                   |
| L52  | [system-architecture](../../packages/content/content/deep-orbit/capstone/01-system-architecture.mdx)                   | `pipeline-architecture`                                     | `flow`                    | None authored in MDX                                                                                                           | planned                                                   |
| L53  | [ci-cd-pipeline](../../packages/content/content/deep-orbit/capstone/02-ci-cd-pipeline.mdx)                             | `ci-cd-gate`, `export-model-artifact`                       | `flow`                    | None authored in MDX                                                                                                           | planned                                                   |
| L54  | [monitoring](../../packages/content/content/deep-orbit/capstone/03-monitoring.mdx)                                     | `model-monitor`                                             | `flow`                    | `BossBeat:deep-orbit-drift-response`                                                                                           | planned                                                   |
| L55  | [documentation](../../packages/content/content/deep-orbit/capstone/04-documentation.mdx)                               | `write-model-card`                                          | `flow`                    | `StoryConsequence:deep-orbit-drift-response`                                                                                   | planned                                                   |
| L56  | [launch](../../packages/content/content/deep-orbit/capstone/05-launch.mdx)                                             | `verify-deployment`, `launch-rehearsal`, `classify-anomaly` | `flow`                    | `IndependentProject`, `BossBeat:deep-orbit-launch-deploy-call`, `StoryConsequence:deep-orbit-launch-deploy-call`               | planned                                                   |

## Initial baseline media status

This list records the initial snapshot before the first patches. Later dated
entries record completed checks without erasing the original gaps.

Completed for this record:

- Current source inventory extraction and L01-L56/exercise-path reconciliation.
- Local primary declaration and L02 recording/operation contract source review.
- Actual manifest checker invocation and stale-hash count reconciliation.
- Current live-branch and evaluation capture source reconciliation.

Pending:

- Six-reference baseline screenshots and actual output captures.
- Changed-example execution, strict solution/starter/misconception checks,
  product browser verification, and assistive-technology observations.
- Completion entries from the L02/L13 product implementation agents.
- New independent reviewer, comprehension, transfer, delayed recall, and
  actual-use evidence.

A source hash match would establish bookkeeping only. A failed baseline
manifest check does not justify refreshing old hashes or claiming new review.
Keep source, execution, browser, and learner results separate in future entries.

## Reference implementation slice on November 10

Implemented bounded explanation and interaction changes for L02, L13, L23,
L29, L44, and L47. All original exercise YAML files, numerical grading
fixtures, exercise/activity IDs, saved schemas, and story outcomes remain
unchanged. Five reference lessons still use explicitly identified diagnostic
or illustrative inputs rather than a continuous mission dataset. Their full
P01 continuity work remains open. L02 already uses the established recording.

### Changes and source contracts

| Card                  | Implemented teaching and interaction                                                                                                                                                                                                                                | Preserved source and limits                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L02 Tensor Shapes     | One selection now connects header, flat-list position, time grid, transformed grid, code readback, and chart point. Reading inspection distinguishes the equal 8 values by source index and moment. The code example explains two-index row/column readback.        | Same 12 readings and custom activity. Before prediction/help, cell controls and the table remain unrevealed. Existing attempts, assistance, and sensor selection retain their meanings. Inspected moment is transient UI state, not a new saved answer.                                                                 |
| L13 Backpropagation   | Main teaching stages a numerical estimate, safe temporary assignment/restoration, scalar autodiff return/lookup, and the multi-variable comparison. Concept uses the graded scalar loss w squared rather than an unrelated product/target example.                  | Plain-JS reference arithmetic remains separate from actual TensorFlow.js execution. Existing scalar weight 3 and later weight 5, supplied three-variable loss, real run counts, and fictional timing retain their identities. Full-network code is an optional reference after required scalar/multi-variable teaching. |
| L23 Fourier Transform | A selected bin now shows N, sample rate, bin spacing, frequency, magnitude, and spectrum highlight. Required DC/tie/silence and sampling/precision rules remain visible.                                                                                            | Concept stays 64 samples at 64 Hz with rescaled one-sided magnitudes. Worked code and first graded capture use 128 samples at 128 Hz and raw magnitudes. Mission discovery remains a separate 256 Hz recording, with its longer windows and earned 73.4 Hz display. Other signal activity modes are unchanged.          |
| L29 LSTM Gates        | Main teaching follows kept cell, gated candidate, new cell, output gate, and hidden output. It then explains weighted rows and packed input/forget/candidate/output columns before library parity. The active activity exposes independent output gating.           | First Concept case uses one dimension of the existing supplied old-cell-2, zero-candidate, half-open-gate check. Second explicitly varies the candidate to tanh(1). Larger random-label training and GRU code remain intact in an optional execution reference. Required challenge teaching stays visible.              |
| L44 RAG for Signals   | Main activity now uses field filters and database order, counts matches before the cap, and shows returned/omitted IDs and truncation. Prose stages retrieval before structured claim checking and explains the evidenceRows field mapping beside the keeper claim. | New rag-retrieval-example.ts reproduces the existing four-row AND-filter and forty-row count/cap checks, including clock, IDs, units, and score permutation. These are supplied diagnostic records, not archive captures or new measurements. Both exercises remain required and unchanged.                             |
| L47 Model Profiling   | Main teaching stages untimed warmup, timed prediction/readback, owned-resource cleanup, per-call durations, mean, and parameter inventory. The Concept adds a timer-stage trace.                                                                                    | Existing 4/16/80 simulation and its answers remain unchanged. Supplied controlled-clock durations and real parameter inventory are separate. Parameter bytes, tensor counts, device latency, and peak application memory retain distinct meanings.                                                                      |

Changed product files are the six MDX files, the relevant registry entries in
`numeric-investigations.ts`, `flow-investigations.ts`, and
`deep-orbit-visuals.ts`, plus the L02 component/CSS. New
`rag-retrieval-example.ts` keeps the diagnostic source explicit. Relevant
tests and the selected-example harness cover the changed behavior.

### Technical claim ledger

All TensorFlow.js API checks below use installed 4.22.0 declarations/source
and actual CPU execution. Installed package documents are primary API
material. These checks do not establish another backend's device performance.

| Claim and affected surface                                                                                                                                                     | Primary source or executable evidence                                                                                                                                                                                       | Review result                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reshape preserves flat ordering and count. Transpose permutes axes. L02 labels, selection, and MDX code.                                                                       | tfjs-core `dist/ops/reshape.d.ts`, `transpose.d.ts`, and current channel-layout-data.test.ts comparing real tensor results.                                                                                                 | Correct source-index mapping for original r*4+c, transpose c*4+r, and reshape r*3+c. Duplicate values retain distinct indices 3 and 7.                                                                                                                     |
| variableGrads obtains scalar value and named variable gradients. Gradient computation alone leaves variables unchanged. L13 main examples and Concept arithmetic.              | tfjs-core `dist/gradients.d.ts` and implementation, actual four selected MDX blocks, strict backprop-chain grader, and numeric parity regression.                                                                           | Scalar callbacks, lookup, recomputation, restoration, values, and gradients agree. Forward counts describe the measured functions, without a device-speed claim.                                                                                           |
| rfft returns the nonnegative-frequency bins along the inner real axis. Bin frequency uses k*Fs/N, with separately declared magnitude scaling. L23 selected-bin view and prose. | tfjs-core `dist/ops/spectral/rfft.d.ts` and implementation. Actual three MDX blocks and selected-bin parity against CPU rfft.                                                                                               | Selected-bin frequency is independent of the tone control. Interior Concept bins use 2/N magnitude scaling and endpoints use 1/N. Supplied raw FFT magnitudes stay distinct.                                                                               |
| LSTM gate activation, weight packing, cell and hidden updates. L29 main code and active investigation.                                                                         | tfjs-layers recurrent implementation and layer declarations. Real functional LSTM regression across ten gate/candidate configurations. Actual three new MDX blocks and unchanged training/GRU examples.                     | Explicit sigmoid matches handwritten gates. Default recurrent activation is hardSigmoid. New weight snippet has default forget bias 0. A separate explicit unitForgetBias:true probe gives bias columns [0,1,0,0]. Prose states that condition explicitly. |
| Retrieval filters/cap/order and evidence-row field mapping. L44 main activity and claim example.                                                                               | Existing retrieve-signals and rag-pipeline YAML contracts. New activity parity test executes the actual authored retriever on all three queries in both cases. Selected full MDX pipeline executes with a controlled reply. | Four-row query keeps keeper. Forty-row query matches 30, returns 20, and omits 10. frequency becomes frequencyHz and eventCount is 1 per evidence row. A matching number cannot verify the wrong unit. No real model request occurs.                       |
| Awaited data readback completes tensor computation. Parameter count/bytes differ from memory peaks. L47 timer explanation and inventory.                                       | tfjs-core tensor data and memory declarations, tfjs-layers topology countParams declaration. Actual profiling.ts execution and independent CPU model inventory.                                                             | Layer counts [144,0,0,65], total 209, float32 weight estimate 836 bytes. Owned tensors return to baseline after cleanup. Controlled [4,4,4,4,104] durations average 24 ms, with 120 ms warmup excluded.                                                    |

### Executed internal checks

- Content build: `pnpm --filter @tensorcraft/content build:content`, pass.
- All 133 JavaScript/TypeScript teaching blocks parse after the LSTM formatting
  repair. Parsing establishes syntax only.
- Actual selected examples for all six reference lessons execute. L13 has
  four selected blocks. L23 has three. L29 has three new standalone blocks
  plus its unchanged larger-model/GRU run. L02, L44, and L47 retain their
  executable selected examples. The harness checks retained tensor counts.
- Strict solution/starter/misconception checks pass with zero warnings for
  reshape-tensor, backprop-chain, compute-fft, build-lstm, retrieve-signals,
  rag-pipeline, and profile-model. Their solutions pass, untouched starters
  fail, and registered wrong solutions are rejected.
- Twelve focused content/interaction suites pass 533 checks. The separate
  two-test LSTM parity suite also passes. Counts overlap earlier agent runs
  and must not be added to those earlier totals.
- Web TypeScript check passes. Targeted ESLint on all changed web TS/TSX
  files passes. Formatting checks on TS/TSX/CSS/JS pass.
- Whole-course production MDX renderer checks pass for all 56 lessons at
  1100px and 375px. This harness substitutes the editor and external services.
- Story renderer checks pass 24 current branches, eight historical branches,
  four combined handovers, reload/revisit, failures, competing tabs, keyboard,
  and three decision accessibility checks. These are software observations.

### Browser evidence and revisions

The actual free Tensor Shapes route has three new retained Chromium
regressions in `e2e/lesson-continuity.spec.ts`: 1440px dark, 390px light,
and 320px dark. They exercise an unaided prediction, keyboard selection of
both equal readings, reshape/transpose location, chart identity, page width,
axe checks, and existing sensor/operation restoration after reload.

The first run found insufficient contrast caused by the shared pressed-button
background. The scoped cell/reading buttons now preserve their source-cell
background and readable text. All three regressions pass after that repair.
Visual review also found a wrapping Sensor header at narrow widths. Compact
header padding/type and a nonwrapping first header address it. Final narrow
screens are recorded separately from earlier captures.

Expanded-state review of the development preview also found that absolutely
positioned screen-reader labels could escape the horizontal reading scroller,
making its 390px document 845px wide. Reading and cell buttons now provide
their own positioning context. The preview was refreshed and retested after
table reveal, cell selection, reshape, and transpose at both widths. Document
width now stays equal to the viewport. Original failed images are retained
with a before-expanded-state-fix suffix. The final retained free-route
regressions pass again at all three widths, including accessibility checks.

Four existing real-browser Worker cases pass solution/starter/misconception
checks: reshape-tensor, rag-pipeline, profile-model, and compute-fft. The
other three reference contracts have strict CLI and applicable CPU tests.
Do not describe this as seven new browser Worker cases.

The six-reference development preview covers all five phases at 1440px dark
and 390px light: 60/60 phase checks and 12/12 final interaction checks pass,
with no page/console errors, failed requests, or page overflow. Two first-pass
FFT assertions incorrectly assumed the tone slider moved the selected bin.
Those failed test assumptions remain in results-first-pass.json. Corrected
assertions use Selected bin index. No product change was needed for them.

Evidence lives under `test-results/course-clarity-reference/`, including
results.json, results-first-pass.json, and Concept/workbench PNGs. The
development-only preview uses production section components. It bypasses
paid-route authentication and sequential completion, so it cannot establish
those workflows. Its reduced-motion checks do not establish default-motion
or human screen-reader behavior. Native browser access was unavailable.

The local review launcher was refreshed with the existing tensorcraft-review
Colima socket, preserving its fictional database. No production deployment,
external messages, new purchase, or learner enrollment occurred.

### Remaining work and next batch

The following backlog records the end of the first batch. The second-batch
entry below updates the current unique lesson count and package states.

- P00 before-change media was not collected for every reference. Existing
  historical captures stay historical. New captures show this revised source.
- Keep the older manifest hashes stale until their complete affected review
  dimensions are renewed. The final bounded-source snapshot follows below.
- Reconcile source continuity for L13/L23/L29/L44/L47 before claiming their
  full P01 migrations. Orientation and same-task diagnostic examples do not
  supply a continuous mission recording.
- Complete the remaining 50 lesson cards in the planned module batches.
  P02 metadata and P04 result-family adapters remain pending where needed.
- Check paid-route editor workflows, default motion, and assistive technology
  when those paths change. Keep human comprehension, transfer, retention,
  and independent reviewer evidence open.

This record establishes a first bounded implementation slice. It does not
close all six full lesson cards or the course-wide plan.

## Bounded product-source snapshot

Recorded after the final copy correction and narrow-layout fixes. These hashes identify the implemented product/test sources only. They do not renew the older whole-course review manifest or claim learner evidence. The browser report separately identifies its captured snapshot and scope.

This is the historical first-batch snapshot. Later shared-file changes mean
these hashes do not describe the second batch. Preserve all 19 entries below.

| Source                                                                           | SHA-256                                                            |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/web/app/components/lesson-visuals/deep-orbit-visuals.ts`                   | `caf30858872cc20424368154f4b12e7ee76888dfde5658efd1e89ea25344deef` |
| `apps/web/app/components/lesson-visuals/flow-investigation-contracts.test.ts`    | `9f2ab95def73d09ecf86dbe01b01fabde87c968074f480b90d48fb07194dc9ea` |
| `apps/web/app/components/lesson-visuals/flow-investigations.ts`                  | `7708efc392ae85149f8996cacfa56df97c1d344ea1b386d7179989d7dfee94be` |
| `apps/web/app/components/lesson-visuals/lesson-investigations.test.ts`           | `ce64c8763b1805c17c9915fac5a706aad119f64c8024b05426880e3e728f4c99` |
| `apps/web/app/components/lesson-visuals/lstm-investigation.test.ts`              | `a645bb00d3fc7877e95179e54359c698f7365193d7d784d6147853a2f9dcd53a` |
| `apps/web/app/components/lesson-visuals/numeric-investigations.test.ts`          | `1a61465332dce8a858dfa04cd302095258e6c5c51687973f276bc6a7a05c79c2` |
| `apps/web/app/components/lesson-visuals/numeric-investigations.ts`               | `dc6f75e81f6a05554c94a99a77e8faf53996f2e0746f39002a0ffa4ae1156e78` |
| `apps/web/app/components/lesson-visuals/rag-retrieval-example.ts`                | `291c38e425f95a1ffae3548a9441b84c5e9dcc8d4cf29e9d0b2170b8d2efad1f` |
| `apps/web/app/components/mdx/channel-layout-experiment.css`                      | `fe62e5078858c73fa8dcc012be16b2e66e93fd6a702bb0ad8125fdd2ef64085f` |
| `apps/web/app/components/mdx/channel-layout-experiment.test.tsx`                 | `c9f24845d2bf24ed77b58e65dc3ab47dccdda549d7ce0701ca91ab53a46e1354` |
| `apps/web/app/components/mdx/channel-layout-experiment.tsx`                      | `b4a5dbec5305f595fd347ba44c7d76207d616d338ddf1371a4a8915ef022866c` |
| `e2e/lesson-continuity.spec.ts`                                                  | `b0130e1c75eefb34ec482c118af3f491c8a977173606fcf35b516f2a02236a72` |
| `packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx`           | `516ebdcaf3230ba599f9b3fb46321461dbd14a577007e36419f7ae661ddee3f8` |
| `packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx`     | `bd05a0d137fc3bceb987c2f3bf7dba835751dbb0d8afe5c0b4a9cd0b319ef19d` |
| `packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx`   | `c02dce7c7343abc90abbfe99a87970ff7b902a87e23c713b4a0aa37e66a69513` |
| `packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx`       | `2c5c96122ae9dc97d70e0e0bdb752f3db7a23bb19e40429934b176060aad34fb` |
| `packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx` | `1bcd932dcb7c058acf70eef1fa6c25881096a3cce9acfbac6512f9e686fe7add` |
| `packages/content/content/deep-orbit/training-loop/03-backpropagation.mdx`       | `3eefd31154f5bc50b01eb2449e06d31be49922a13183224a398855c136617139` |
| `scripts/check-reviewed-examples.mjs`                                            | `372188cd7f02ebd05d0074dbbbdf4f1bf92a333bea9d685453aab3425d478fee` |

## Foundations and current-run result slice on November 10

The second batch adds bounded work in L01, L03, L04, and L05 and revisits L02.
Together with the first six references, this makes ten unique lessons with
implementation slices. Forty-six lessons have no implementation slice. All
56 full cards remain open. This count describes changed scope, not learning
quality or full mission-data continuity.

### Changes and source contracts

| Card                       | Implemented behavior                                                                                                                                                                                                                                                                | Preserved source and remaining limit                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L01 From Arrays to Tensors | Selecting a sensor on the supplied Concept chart highlights its flat-list positions and reports the readings in moment order. Main prose explains the extra axis caused by another array wrapper. Supplied-example status stays distinct from Challenge output.                     | The same 12 fictional readings, header order A-D, and three local moments remain. Sensor D's two 8s retain indices 3 and 7. Tensor creation, shape inspection, supplied grouping, and cleanup retain their roles.                                                                                                                                                                               |
| L03 Tensor Operations      | The main worked example and active investigation now average neighboring moments, apply gain, trace a broadcast reference row, and calculate weighted channel-bank sums. Selected outputs identify every contributing value and weight.                    | The excerpt selects A/B from the existing opening recording: [2,20], [3,18], [4,16]. Two overlapping views pair moments 1/2 with 2/3. No physical unit is supplied. Gain 2 and bank weights [1,0], [0,1], [1,1] are chosen settings, with no anomaly or independent-measurement noise-reduction claim. All grader inputs remain separate diagnostics.                                       |
| L04 Data Loading           | Main teaching and the activity now share the 16-row fixture. Learners inspect the first read, fresh-iterator restart, row-before-batch shuffle, feature/label pairing, and assigned split membership. The all-row batching demonstration stays distinct from training-only use.     | The reader generates [id*100,id,id/10] and label id%2. These unitless loader test values do not come from the mission archive and carry no anomaly label authority. The activity's fixed permutation illustrates one shuffle. Actual TensorFlow.js shuffling remains random. Full mission-data continuity remains open.                                                                         |
| L05 Normalization          | Main teaching and activity trace row [24,0.4] through saved column statistics, scaled inputs, fixed-neuron terms, and score about 0.6745. Later-row cases reuse the same statistics. Main min-max calculation, zero-divisor handling, and returned-tensor ownership remain visible. | The unchanged four-row, two-feature practice fixture specifies no physical units or timestamps. Supplied weights [0.9,-1.4] and bias -0.3 remain fixed. It is separate from Demir's recording. The ending still uses the separate three-input DeepScanDemo and model. This patch does not establish lineage into that preview or subsequent networks. Sample 7741's true label remains unknown. |

L03 changes the Concept example and activity to use the opening recording.
Its exercise changes instructions and result labels/summaries only. Numerical
fixtures, starter, solution, checks, and hints stay unchanged and remain
explicitly diagnostic. L04 changes exercise instructions only and aligns the
main teaching/activity with the existing generated reader. No diagnostic label becomes
a claim about a ship capture. Exercise/activity IDs, saved schemas, required
skills, and canonical story outcomes remain unchanged.

### Second-batch P04 current-run explanations

Three reviewed exercise contracts now use transient explanations across two
families:

- create-a-tensor and reshape-tensor decode exact chart contracts. A sensor
  and moment selection links supplied source position, actual captured value,
  chart series, and the difference between them. A captured 902 remains 902
  when the corresponding supplied reading is 2.
- backprop-chain decodes the captured three-variable gradient table and its
  forward-call counts. Inspection keeps numerical estimates, automatic
  gradients, calculation counts, elapsed time, and weight updates distinct.

`lesson-result-explanations.ts` checks known slugs, titles, columns, axes,
series order, lengths, finite values, and compatible groups. Duplicate or
unknown contracts receive ordinary output. A decoded result cannot establish
who authored the code or certify a measurement's scientific meaning.

`LessonResultExercise` consumes the existing settled `renderResult` snapshot.
It checks exercise scope, resets inspection by run token/owner, marks edits
stale, and preserves partial/error output. The ordinary renderer remains the
fallback. This path adds no automatic saving or new persisted schema. The
normalization, network, and evaluation evidence exercises keep their existing
specialized path.

`ExerciseOutput` now accepts an optional controlled series selection by
artifact index. Existing uncontrolled charts retain their behavior, including
Show all. Stale output keeps its warning and full text contrast. The browser
checks found that fading old data reduced light-theme text contrast to
4.22:1. Removing that fade preserves readable earlier results without changing
their stale status. The new viewer also supplies an explicit primary text color.

The shared exercise keeps one mounted verdict announcement and its adapted
summary. Inspect result appears when there is rendered output. Final
actual-route verification after this link-visibility change follows below.
The fallback now requires at least one artifact before creating output. This
avoids a result link to an empty fallback element. Creation copy describes the
supplied chart code without claiming that a partial capture proves the learner
created a tensor.

### Technical claim checks

| Claim or contract                                                                            | Evidence                                                                                                                                                                                                                        | Limit                                                                                                                                                         |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L01 selection preserves source index and moment even for equal values                        | Tensor example tests execute TensorFlow.js and check released tensors. UI tests select D and inspect indices 3,7,11 plus chart points 8,8,9.                                                                                    | This establishes identity mapping, not interpretation of the full recording.                                                                                  |
| L03 element-wise operations, broadcasting, transpose, and bank dot products agree            | Pinned TensorFlow.js 4.22.0 execution compares both pairing modes, all selected outputs, and gains. Main examples produce boosted [5,38] and [7,34], then bank sums [5,38,43] and [7,34,41].                                    | Fixed settings demonstrate the calculation. They do not establish anomaly detection or a measured filtering benefit.                                          |
| L04 lazy reads, fresh iterators, batch shapes, row/label pairing, and split membership agree | Actual main MDX strings execute with the practice reader. Tests check probe counts 0,1,2, all 16 rows, repeat iteration, [4,3] features, [4,1] labels, and cleanup.                                                             | A shuffle buffer reads ahead. The demonstrated all-row pass is not a training pass over validation data. Generated labels have no scientific authority.       |
| L05 saved statistics, scaling, fixed-neuron output, and cleanup agree                        | Installed 4.22.0 moments.js/.d.ts, globals.d.ts tidy return-object semantics, and expand_dims.d.ts. Eighteen activity configurations compare with the actual authored YAML solution and real fixed model on CPU.                | The activity computes a JavaScript reference. It performs no TensorFlow.js prediction or training itself. Its model is supplied, not learned during the task. |
| P04 uses bounded actual captures without substituting expected values                        | Decoder/host tests cover malformed, duplicate, scoped, partial, stale, rerun, and owner changes. Actual shipped-Worker captures for all three supported slugs decode. Browser fixtures test a deliberate captured disagreement. | The browser fixture uses predetermined typed captures. Its presentation checks do not replace genuine Worker execution or actual-route integration.           |

### Executed second-batch internal checks

- Thirteen focused result, Foundations activity, continuity, and prose suites
  pass 461 checks. A separate four-suite shared run passes 57 checks. These
  runs overlap other recorded runs and must not be summed into a unique total.
- After the Inspect result visibility fix, three shared suites pass 39 checks.
  After the later empty-fallback correction, the saved-run suite passes 22
  checks. Three result suites pass 36 checks after the final copy correction.
  The final four-suite shared run passes 58 checks, including the new
  empty-fallback regression. These runs overlap the collections above. The
  final actual-route browser verification after hardening follows below.
- The Foundations selected-example harness executes nine groups with no
  retained tensors. All 136 authored JavaScript/TypeScript teaching blocks
  parse. Parsing establishes syntax only.
- Strict solution/starter/registered-misconception checks pass with zero
  warnings for create-a-tensor (6 checks, 1 output), add-tensors (6 checks,
  3 outputs), batch-data (6 checks, 3 outputs), and normalize-data (10 checks,
  4 outputs). Solutions pass and untouched starters/registered wrong answers
  fail. These are exercise results, not comprehension evidence.
- Explicit web and UI TypeScript checks pass. Targeted ESLint reports zero
  errors. Web lint retains two existing lesson-content warnings for an unused
  mdxComponents value and useMemo dependencies. The later lesson-steps lint
  also reports zero errors and three existing warnings for prevLesson,
  highlightTitle, and briefingVariant dependencies. These are five existing
  web warnings across the two targets. UI targeted lint has no errors.
- After the preview repairs, three content suites pass eight checks covering
  the em-dash ban, slop lexicon, and Foundations continuity. The nine selected
  Foundations execution groups and all 136 teaching-block parses pass again.
- All 56 lessons pass the renderer at 1100px and 375px. Story checks pass
  24 current branches, eight historical branches, four combined handovers,
  reload/revisit, failures, and keyboard behavior. The renderer substitutes
  editors/external services and does not verify every real-route workflow.

### Isolated P04 browser evidence

The retained `e2e/lesson-result.spec.ts` starts a private Vite server using
production components, CSS, local production fonts, and shared typed test
artifacts. Six Chromium cases pass at 1440px, 390px, and 320px in both schemes.
Desktop checks use default motion. Narrow checks use reduced motion.

Each case checks bidirectional keyboard selection between source and chart,
the two equal 8s, a chart after another artifact, partial/stale 902-versus-2
output, creation/grouping responsibility, gradient selection/counts, page
width, and three axe states. All 18 axe scans pass after the stale-opacity
repair. Runs report zero page errors, failed requests, or external requests.
Related viewer/output unit suites also pass ten checks, overlapping the other
reported collections.

The six cases and 18 axe scans pass again after the final creation/gradient
copy correction. Current-copy evidence and screenshots live under
`test-results/course-clarity-results/current-copy/`. Earlier successful
captures remain in `verified/`. Initial runs and contrast failures remain in
`first-pass/`, `final/`, and `before-opacity-fix/` under the same parent
directory. The config's default `latest/` output keeps those historical
folders separate. Narrow dark linked-sensor and light stale/gradient captures
from the earlier verified run received visual inspection. The final copy
changes do not establish learner authorship or measured speed.

This fixture executes no learner code, opens no account or paid route, and
does not establish draft restoration, completion gating, human screen-reader
behavior, comprehension, transfer, or retention. Worker/decoder integration
has separate executable tests. Actual-editor integration has separate evidence below.

### Foundations preview findings and final verification

Earlier preview attempts are preserved under
`test-results/course-clarity-foundations/`, including triage.json and the
first/targeted reports. They found a real controlled-slider mismatch in L03
after its maximum shrank and expanded. The shared range now handles both
input and change events. The regression fails before that fix and 101
relevant checks pass afterward, together with web typecheck and targeted lint.
The final native-browser reproduction now selects the intended Bank 2 and
reports the correct 21.5 after the range limit shrinks and expands.

The apparent L01/L02 light contrast problem came from the development preview
fixture. Its nested data-world attribute reset dark tokens while Tailwind
aliases inherited light tokens. Actual free routes showed consistent light
tokens. Removing the redundant preview wrapper attribute fixes that scope
without changing lesson color CSS. The theme-scope probe remains historical
evidence. Final preview checks after the review-server refresh pass.

The final Foundations preview passes 75/75 visible phase checks, 15/15 expanded
activity cases, and 15 scoped axe scans. The five lessons run through all five
phases at 1440px dark with default motion, 390px light with reduced motion,
and 320px dark with reduced motion. It reports no page overflow, page errors,
or console errors and retains 30 final screenshots. Evidence lives in
`test-results/course-clarity-foundations/results-final.json` and its final-*
captures. Earlier failed/targeted reports remain historical.

The implementation lead visually inspected final 390px L01/L03, 320px
normalization, and current P04 light 390px/dark 320px captures. Text and
controls remained legible. The preview bypasses paid-route access and
sequential completion and does not establish real exercise Worker behavior or
learner understanding.

### Actual opening-editor workflow and production build

The retained free L01 route regression in `e2e/exercise-run.spec.ts` passes on
the refreshed local review stack. The untouched starter fails without a
result-inspection link. Completing the two learner-owned blanks passes and
opens the actual captured-result viewer. Sensor D at moment 2 retains index 7
and reported value 8. The canonical solution passes independently and resets
the inspector. A later code edit keeps that result with explicit stale text.
Saved completion, the single Continue action, and the brief/editor boundary
also retain their behavior.

The final run adds two scoped axe scans, desktop and stale 390px, plus a
390px page-width check. Both scans pass. Its desktop/phone result-region
screenshots received visual inspection. Evidence is under
`test-results/course-clarity-foundation-editor-accessible/`.
The preceding successful run remains in `course-clarity-foundation-editor-verified/`.
Earlier failures remain in the original and `-final` folders. The first found
the empty fallback link. The second reached a correct accessible combobox but
used an exact label-text locator that included wrapped options. The retained
test now selects the accessible combobox role and name. No product change
was needed for that locator correction. Final L02/L13 actual-route evidence
follows below.

The isolated production build also passes: content build, Next.js 16.4.2
compilation, TypeScript, and generation of 99 static pages. It uses a separate
filtered source copy with local review configuration, pinned installed
dependencies, no copied environment files, and no external service credentials.
The build leaves the live review runtime untouched. Its manifests verify
selected product sources and the lockfile against the workspace. Evidence is
under `test-results/course-clarity-build/`. Existing cache-header, middleware,
and Edge Runtime warnings remain. Production deployment settings remain
unverified. The final rebuild after restoration hardening passes with the same
99-page result. Its ten selected source/hash comparisons match the workspace,
including the hardened YAML, regression test, and shared Exercise component.
Final build evidence is in `course-clarity-build/final-after-restoration/`.

### L13 numerical-restoration hardening

Final peer review found an existing grading gap. Replacing only the final
restoration with `w.assign(tf.scalar(saved))` passed all eight checks while
leaving the three-variable probe nudged. The captured gradients and counts
could therefore coexist with incorrect restoration. The earlier viewer copy
also implied that computing either method left weights unchanged.

The grader now snapshots all three probe variables and global w after each
numerical estimate. It checks them against their original values after
recording both gradient/count tables. The separate exception probe now uses
its own scalar variable and checks restoration of that passed variable. The
canonical solution still passes all eight existing check names. The one-line
wrong-target variant fails the two relevant checks while retaining both actual
tables. Instructions, starter, solution, probe numbers, artifact titles,
columns, and result schema remain unchanged. Feedback now names the existing
0.05 comparison tolerance. Its numerical threshold stays unchanged.

The viewer now separates calculating gradients from applying a weight update.
It explains that numerical estimation must restore its temporary change and
that gradient values alone cannot confirm restoration. The two-test real
Worker regression and actual-capture decoder tests pass 25 checks. Strict
backprop-chain validation passes eight checks and two outputs with zero
warnings, rejects the untouched starter, and rejects both registered
misconceptions. The six isolated browser cases and 18 axe scans pass again
with the final copy in `course-clarity-results/restoration-copy/`. Earlier
browser captures remain identified as pre-hardening.

### Actual reshape and gradient workflows

Final actual-route checks for L02 and L13 pass after the restoration patch:
four Chromium cases at 390px light and 320px dark, with 12 scoped axe scans.
Both routes run their shipped browser Worker. The free reshape case checks
distinct equal readings, chart/source selection, a same-code rerun reset,
saved completion, a wrong row with useful captured output, and stale edits.
The paid gradient case uses fictional local Alex and explicitly seeded
prerequisite completion. It checks actual numerical/automatic gradients,
forward counts 1 and 6, rerun reset, saved completion, and a missing-finally
failure that keeps the actual tables. All four reject untouched starters
without an empty inspection link. No page overflow or page errors occur.

Final evidence is in `test-results/course-clarity-lesson-results-hardened/`.
The final 390px light partial-gradient and 320px dark linked-reshape captures
received visual review. The test dismisses the existing GitHub nudge through
its UI so it cannot cover the captured result. Earlier free and paid runs,
their served source hashes, and harness-only failures remain in their separate
integration, integration-final, paid-complete, and paid-readable folders.
One earlier full-code matcher needed innerText to preserve CodeMirror's line
boundaries. Another wrong-code matcher needed to allow a newline before
finally. Neither required a product change.

The final focused restoration/decoder/prose run passes 29 checks in four
suites. The production rebuild includes the hardened grader. These checks
establish the implemented software behavior on the stated local paths.
Seeded prerequisites bypass earning course completion, and none of these
checks establishes learner understanding or a new result-persistence scheme.

### Remaining work after the second batch (historical)

- Keep all 56 full cards open. Forty-six lessons have no implementation slice.
  The ten changed lessons still need their remaining card requirements and
  appropriate continuity/learning evidence.
- Keep L04's diagnostic reader and L05's two-feature fixture/three-input ending
  boundary visible until a reviewed source/model migration resolves them.
  The five later reference mission-data migrations remain open.
- Continue P04 with reviewed signal, runtime/flow, and structured-report
  families. Preserve ordinary output, existing saved evidence, and unknown
  source meanings.
- Preserve older review manifest entries and the first-batch hash table.
  A fresh bounded snapshot will not renew the complete course review.
- Obtain independent reviewer and learner evidence using the existing study
  protocol. Software checks alone do not show improved understanding.

### Neural Networks source review before the third batch (historical)

Read-only review mapped the five Neural Networks lessons before implementation.
Their Concept activities, worked code, graded probes, and bridge story use
different input widths and model settings. L06's calibration tones and story
scores have no accompanying input, feature/scaler, or fixed-model record.
The current arithmetic examples cannot supply that missing provenance.

At that review, the proposed next bounded work split into L06/L07 for weighted terms and activation,
L08/L09 for model identity, parameter counts, and actual forward arithmetic,
and L10 for construction, compilation, and the existing rehearsal viewer.
L09's default random kernel needs actual capture before a dot-product viewer
can explain it. L10 already uses all four artifact slots. Preserve its frozen
network-v1 contract and existing viewer. These findings close no additional
lesson card and create no calibration labels or measurements.


### Second-batch bounded source snapshot (historical)

Recorded after the final restoration regression, current-result copy, and
actual-route checks. These 56 working-tree product/test/support hashes include
the earlier reference files alongside the second batch. The historical
19-file snapshot above retains its original values. This table does not
renew the older full-course review manifest or establish learner evidence.

| Source | SHA-256 |
| --- | --- |
| `apps/web/app/components/__fixtures__/lesson-results.ts` | `998f4aac5eecbe52660103a6d69d9d0c038983bcb9357a79e0f50a4b11f2e39c` |
| `apps/web/app/components/lesson-result-exercise.test.tsx` | `64b9a34f305030abaf791c568064fb8d2432a2094d3169404d22a374a86a9c70` |
| `apps/web/app/components/lesson-result-exercise.tsx` | `5f79e3f1da04f729cf769f093cca74ed2718f7abaaf992159ae7f539768e484a` |
| `apps/web/app/components/lesson-result-explanation.test.tsx` | `58122ae414ee847dd63ec4747e0eb7528498e5c398a0a7c6d94532d1a8bb9453` |
| `apps/web/app/components/lesson-result-explanation.tsx` | `e24cfba33231ee5747aa21b8fb34ba5679201a52f1b1abeb98056bf405dd8b36` |
| `apps/web/app/components/lesson-visuals/data-loading-investigation.test.ts` | `779b7c34f2b134f9640e49fc91e61fe8d433f36db318439bbc433e3403564b7a` |
| `apps/web/app/components/lesson-visuals/deep-orbit-visuals.ts` | `70219260da9c6dfe142de466fec850a9a001e7956b8cf1016251deb8d186607c` |
| `apps/web/app/components/lesson-visuals/flow-investigation-contracts.test.ts` | `9f2ab95def73d09ecf86dbe01b01fabde87c968074f480b90d48fb07194dc9ea` |
| `apps/web/app/components/lesson-visuals/flow-investigations.ts` | `7708efc392ae85149f8996cacfa56df97c1d344ea1b386d7179989d7dfee94be` |
| `apps/web/app/components/lesson-visuals/lesson-handoffs.ts` | `ee8d2d681e48a3aea6e02f7bcaadfea84267ab59d9b3e1e0b2daab92f0a041fe` |
| `apps/web/app/components/lesson-visuals/lesson-investigation.test.tsx` | `97c06c92e788e45df0c84be56f462483d206d55f2d99c23a13586859416f4fb7` |
| `apps/web/app/components/lesson-visuals/lesson-investigation.tsx` | `b6c8294ee1ffdc077084137cdaaf56b6dcd45392fc58d68aa2341e156bf26083` |
| `apps/web/app/components/lesson-visuals/lesson-investigations.test.ts` | `49ec63546e5a06dead57b13151f23cb427e8163dba12bde05f4f61172aa53f72` |
| `apps/web/app/components/lesson-visuals/lstm-investigation.test.ts` | `a645bb00d3fc7877e95179e54359c698f7365193d7d784d6147853a2f9dcd53a` |
| `apps/web/app/components/lesson-visuals/normalization-investigation.test.ts` | `0ef9ec8055a5bab523b0ee8775f9ae4c1f8b34d1e3ed64af669864776d926f33` |
| `apps/web/app/components/lesson-visuals/numeric-investigations.test.ts` | `1a61465332dce8a858dfa04cd302095258e6c5c51687973f276bc6a7a05c79c2` |
| `apps/web/app/components/lesson-visuals/numeric-investigations.ts` | `b39983dd98be6550cd0dfab964096f6627d4115618ba769b7d0c6b92efd71764` |
| `apps/web/app/components/lesson-visuals/rag-retrieval-example.ts` | `291c38e425f95a1ffae3548a9441b84c5e9dcc8d4cf29e9d0b2170b8d2efad1f` |
| `apps/web/app/components/lesson-visuals/tensor-investigation.test.tsx` | `e41e538f0d1f0c38821068bc81db58b4e991fb60753a8bcb5a0d14166cbf21ce` |
| `apps/web/app/components/lesson-visuals/tensor-investigation.tsx` | `44cf970deb141c4b48f4dc5af87d11718ddc2ad50188dbeefb47a627ee8673d9` |
| `apps/web/app/components/lesson-visuals/tensor-operations-investigation.test.ts` | `8c7d0103f89408594b119d49d5869686db5f5c110786632cf821e661551bc844` |
| `apps/web/app/components/mdx/channel-layout-experiment.css` | `fe62e5078858c73fa8dcc012be16b2e66e93fd6a702bb0ad8125fdd2ef64085f` |
| `apps/web/app/components/mdx/channel-layout-experiment.test.tsx` | `c9f24845d2bf24ed77b58e65dc3ab47dccdda549d7ce0701ca91ab53a46e1354` |
| `apps/web/app/components/mdx/channel-layout-experiment.tsx` | `b4a5dbec5305f595fd347ba44c7d76207d616d338ddf1371a4a8915ef022866c` |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx` | `5634b0a8e92bd11420bd4ec216351ba8c9fd11ff1ff3173f42afba4e5209a00a` |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx` | `6e2a2af4151d14ae1e9f3421bb1bcb180752f90f3756f7219ca2ea9da610cc49` |
| `apps/web/lib/lesson-result-explanations.test.ts` | `042c5eb6b4d2108f03f185d9c9e252ee8779677a208410cef5389979c41627d9` |
| `apps/web/lib/lesson-result-explanations.ts` | `b813760095df0f17342c5b48c56c6d10afb9e7a41a8edfb70091edd47f80bb59` |
| `docs/design-previews/research/deep-orbit-result-map.md` | `64f5da2e9b5eff463e10e34f27a3e8d8b65c8d466d139fb2c56c7a2d7b7a1d1a` |
| `docs/design-previews/research/result-contract-matrix.json` | `632c432a08673e68021f16011381f1273b7ad853a9ae100047467cf9a7412fb6` |
| `e2e/exercise-run.spec.ts` | `bb6b560fb03d158b2cd97944fe0bb89f5c4881ac9c75387d6a837e01e35ccfd6` |
| `e2e/fixtures/lesson-result.tsx` | `d2d3e827d2693b85789f2052e31b289b476f866bb63e6a5d0ed8086da54cfb79` |
| `e2e/lesson-continuity.spec.ts` | `b0130e1c75eefb34ec482c118af3f491c8a977173606fcf35b516f2a02236a72` |
| `e2e/lesson-result.config.ts` | `37a5918bfddaeeb061f2c6bd758793f9d07695f033463770ae3755e918af96b2` |
| `e2e/lesson-result.spec.ts` | `6c22e9df82e03aa3541266f75c13d8a02589fafebe86fb70c693d392ad38b7ee` |
| `e2e/signed-in-lesson-results.spec.ts` | `75d14f97a94c45f7ec017c4d174062eb1db1e8928a75ac88771feba8ba1fe34d` |
| `packages/content/__tests__/backprop-restoration.test.ts` | `9001be7b018bfae9ab8a89e780ce4928b478d35634d1b6febe828d0eb0ffd2d6` |
| `packages/content/__tests__/foundations-continuity.test.ts` | `f937bb02191a08e0537daba89c4bb859a8c8e0acc398d64c7bfbea82dda07d2a` |
| `packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx` | `4265023fcfe25cf087a8f94d44288b95badf74955a8c2bef714ef0863df39e26` |
| `packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx` | `516ebdcaf3230ba599f9b3fb46321461dbd14a577007e36419f7ae661ddee3f8` |
| `packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx` | `aad9cbc0f696a315061bdf3f8911a190a11b11be8cfaa8eca057eef6933a5b07` |
| `packages/content/content/deep-orbit/foundations/04-data-loading.mdx` | `9ec273078a9e1fa7f6b6d487d41ab62d6b2a040a8a31fa3caadcdc03d9e01092` |
| `packages/content/content/deep-orbit/foundations/05-normalization.mdx` | `0868261463890664989de0796e8f82771959fe35e1f4bf1af13e8147ac086677` |
| `packages/content/content/deep-orbit/foundations/exercises/add-tensors.yaml` | `e630ae8c69d38c24e9bfd041aba748b772e903ed334efcb2bf248739120ec31c` |
| `packages/content/content/deep-orbit/foundations/exercises/batch-data.yaml` | `cf8f5d36362fa83e9a37de7bbbb5e6c7311c8fec015c3d8071b759a3deb9f8cb` |
| `packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx` | `bd05a0d137fc3bceb987c2f3bf7dba835751dbb0d8afe5c0b4a9cd0b319ef19d` |
| `packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx` | `c02dce7c7343abc90abbfe99a87970ff7b902a87e23c713b4a0aa37e66a69513` |
| `packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx` | `2c5c96122ae9dc97d70e0e0bdb752f3db7a23bb19e40429934b176060aad34fb` |
| `packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx` | `1bcd932dcb7c058acf70eef1fa6c25881096a3cce9acfbac6512f9e686fe7add` |
| `packages/content/content/deep-orbit/training-loop/03-backpropagation.mdx` | `3eefd31154f5bc50b01eb2449e06d31be49922a13183224a398855c136617139` |
| `packages/content/content/deep-orbit/training-loop/exercises/backprop-chain.yaml` | `f2d9533943d6f0a0824f2eb1b9858945b823543315f9ea4508b62e769baf7c0e` |
| `packages/ui/src/mdx/exercise-output.test.tsx` | `5d3596562c3a2b0576e6882c46367f9f8449614cc8721448ad1c41176966c935` |
| `packages/ui/src/mdx/exercise-output.tsx` | `a40ee9a8aa958b8a41d50910abe4c2e9264617955ae571d8a58d3f55ce1e8821` |
| `packages/ui/src/mdx/exercise-saved-runs.test.tsx` | `5f1b3512e04da773f15aa9c6440eac7712b47aa9e821b19981d68901fbb81ca7` |
| `packages/ui/src/mdx/exercise.tsx` | `3e6ded85d6ca2a2fe7c595bfee484961dc38f0603e6468d5c516c8b36f027243` |
| `scripts/check-reviewed-examples.mjs` | `7ed1dd37af17d1c2f283b45c7eda2fe9825020c8262a2a4f0469cab439d9a410` |


## Neural Networks and dense-forward result slice on November 10

The third batch adds L06-L10 to the ten unique lessons covered by the first
and second batches. There are now fifteen unique bounded slices: L01-L10,
L13, L23, L29, L44, and L47. Forty-one lessons remain unstarted. All 56 full
cards remain open. This entry records focused implementation and verification,
with the remaining source/model continuity work identified below.

### Source contracts and required teaching

All five lessons retain their five phases, visible story and artwork, and
required teaching in the main flow. The source review distinguishes arithmetic
practice, generated diagnostics, fixed references, bridge story records, and
actual learner output. No new calibration measurement or unknown-signal label
has been authored.

| Card | Implemented explanation and activity | Source boundary and preservation |
| --- | --- | --- |
| L06 | The main explanation and activity share inputs [0.5,0.8,0.2], weights [0.4,-0.2,0.6], and bias 0.1. A selected term shows its input, weight, product, running sum, bias, and final score 0.26. Changing the second weight to 0.2 produces 0.58. | These are dimensionless arithmetic values. The separate calibration-tone story scores 0.81 and 0.12 have no supplied input/model record. The graded tensor fixture, varied lengths, scalar output, and gradient requirement remain unchanged. |
| L07 | The main explanation and activity share [-2,-0.5,0,1.5,3], with ReLU [0,0,0,1.5,3]. A rank-2 example preserves shape. An extreme-value case preserves positive values including 6.5 and 2**126. | The values are diagnostic scores. Essential nonlinearity, range, threshold, and calibration teaching stays visible. Optional material covers affine composition and saturation. A sigmoid range does not establish calibrated probability. |
| L08 | The activity traces input width, units, weights, biases, layer subtotal, and total for both identified networks. The bridge 3/32/16/1 model totals 673. The graded 4/16/8/1 model totals 225, with changed-width formula 16*width+161. | Batch rows reuse the model's weights. Input feature width remains distinct from sample count or raw channels. Required capacity teaching precedes the optional XOR comparison. Model/feature lineage remains a separate review requirement. |
| L09 | Main teaching uses the graded single linear 2-input/3-unit model with 9 parameters. It traces an actual selected output through getWeights, covers one-row and changed-size batches, calls predict once per batch, and returns the exact output tensor. | The Concept activity uses an identified fixed-weight reference of that same architecture. Its values do not replace the random learner model. The failed-demo opening and bridge ending remain. The three-feature bridge model is a separate optional reference, with an illustrative row and no claimed label. |
| L10 | Visible stages cover construction, compilation, six initial weight arrays containing 529 values, both untrained 120-row sweeps, 50 epochs at batch size 16 for the first model, and comparison with the untouched second model. | The 8-feature/120-row/529-parameter rehearsal uses generated proxies, noise features, and generated labels. It remains separate from the 3-feature/673-parameter bridge model. The ending returns to that untrained bridge classifier. Sample 7741 remains unknown. |

The five MDX files and their assigned numeric/visual registry entries changed.
Only forward-pass.yaml changed among the five Neural Networks YAML files.
Its starter, canonical solution, numerical fixtures, default initialization,
and six check names remain. It now rejects models with zero or more than one
layer and gives appropriate feedback for either case. The other four YAML
files remain unchanged. L10's frozen network-v1 descriptor, existing viewer,
and four-artifact cap remain unchanged.

### Fourth current-run contract and actual operands

P04 now covers four contracts across three families: create-a-tensor and
reshape-tensor use sensor-layout, backprop-chain uses gradient-comparison,
and forward-pass uses dense-forward. The new viewer reuses the existing
transient host and renderResult interface. It adds no saved-run registration,
new persistence schema, or interpretation of older artifacts.

The original forward table remains `Your first forward pass`, with columns
Reading, Input 1, Input 2, Unit 1, Unit 2, Unit 3. Its two rows contain the
actual diagnostic input/output values. A second bounded table,
`Weights used for this forward pass`, contains columns Parameter, Unit 1,
Unit 2, Unit 3, with Input 1, Input 2, and Bias rows. These values come from
the same actual layer used for prediction and parity comparison. The capture
uses two artifact slots. It reads layer-owned weight tensors without disposing
them.

Selection links one captured reading to one captured kernel column and bias.
The viewer displays the calculated JavaScript sum separately from the captured
TensorFlow.js output and explains rounding. It preserves an actual captured
mismatch, including the 902 regression case, rather than replacing output with
the sum. Finite captured values remain available when intermediate arithmetic
overflows. Unsupported or undecodable captures keep ordinary output. Partial
runs, stale edits, reruns, run ownership, and control reset retain the existing
host behavior.

An accepted extra-fit probe showed that the six existing checks permit a
submission to train before prediction. Capture copy therefore says `captured`
weights. It does not certify initialization or absence of training. The
canonical solution retains its original untrained default initialization.
This batch adds no new prohibition on fitting.

### Technical claim and execution evidence

The API review uses installed TensorFlow.js 4.22.0 declarations/source and the
[versioned official API reference](https://js.tensorflow.org/api/4.22.0/).
The focused tests execute real CPU tensors and models. Mathematical range
claims remain distinct from finite-precision observations and story records.

| Claim and affected surface | Primary or executable evidence | Result and limit |
| --- | --- | --- |
| Weighted terms and bias produce the displayed neuron score. Tensor operations preserve differentiation. | tfjs-core arithmetic/gradient declarations and neuron-activation-investigations.test.ts, including actual authored code and unchanged grader probes. | Main arithmetic and JavaScript bridge agree. A numerically correct implementation that reads values into JavaScript still fails the tensor/gradient contract. |
| ReLU preserves shape and all nonnegative values. Sigmoid/tanh ranges do not prove calibration. | tfjs-core activation declarations and actual execution of five-score, zero, negative, large-positive, and rank-2 cases. | ReLU does not clip large positives. Mathematical open ranges allow floating-point endpoint rounding. No probability calibration claim follows. |
| Dense parameter count is inputWidth*units+units when bias is enabled. Batch size does not add weights. | tfjs-layers dense/topology declarations, countParams, and 24 actual models covering both architectures at all 12 activity widths. | All 72 selected-layer states match actual models. Bridge subtotals are 128,528,17. Practice subtotals are 80,136,9. Width 6 gives practice total 257. |
| Default dense activation is linear, bias is enabled, and initialized kernels vary. predict accepts a batch and returns its actual output tensor. | Versioned layers.dense, Sequential.add, predict, countParams, and getWeights API contracts, plus actual 2-to-3 model execution. | Default bias is zero. The model has 9 parameters and shapes [null,2] and [null,3]. Outputs can be negative or exceed 1. Passing output captures alone do not prove that weights were never trained. |
| The selected dense output uses its actual row, kernel column, and bias. Shape alone cannot establish value preservation. | network-shape-investigations.test.ts executes staged MDX, 45 fixed-reference cases, and actual YAML capture/validation. | Actual selected-row arithmetic matches within floating-point tolerance. Extra layers, cloned answers, wrong-axis batching, and changed values with the correct shape are rejected. Owned tensors return to baseline. |
| Compilation configures training without changing initialized weights or predictions. Only the fitted model changes in the rehearsal. | tfjs-layers compile/fit contracts and three actual lifecycle tests in building-network-investigation.test.ts. | Snapshots and both initial sweeps remain intact. Actual 50-epoch/batch-16 and 100-epoch/batch-32 schedules each produce 400 updates for 120 rows. No fixed stochastic loss or score is invented. |

The execution harness now selects these Neural Networks block groups:

- L06: `first-neuron.ts`.
- L07: `activations.ts`, `relu-keeps-shape.ts`, and optional `collapse.ts`.
- L08: `layer-architecture.ts`, `parameter-quote.js`, and optional `xor-capacity.js`.
- L09: main `diagnostic-forward.js`, `inspect-diagnostic-unit.js`, and
  `diagnostic-batches.js`, with optional `forward-pass.ts` and `by-hand.ts`.
- L10: `compile-rehearsal.ts`, `initial-rehearsal.ts`, and
  `train-first-rehearsal.ts`, with existing `complete-network.ts` preserved.

All 11 selected Neural Networks execution groups pass with no retained
tensors. All 144 course JavaScript/TypeScript teaching blocks parse. Parsing
establishes syntax only. Web TypeScript and targeted ESLint checks pass.

The new focused suites contain 11 neuron/activation tests, five network-shape
tests, and three network-lifecycle tests. The five focused decoder/viewer/host/
shape/lifecycle suites pass 58 checks. A separate five-suite shared/regression
run passes 116 checks, including the 69-check visual suite, restoration,
ExerciseOutput, saved runs, and shared investigation behavior. The visual suite
needed three stale L01 status expectations corrected. Agent runs of broader
numeric, writing, and answer-leak groups overlap these runs. Their totals are
not added here.

All five strict grader processes finish with exit code 0 and zero warnings.
Each canonical solution passes, each untouched starter fails, and each pair
of registered wrong answers is rejected:

| Exercise | Existing checks | Captured artifacts in the canonical run |
| --- | --- | --- |
| implement-neuron | 5 | 1 |
| relu-activation | 6 | 1 |
| build-layer | 7 | 2 |
| forward-pass | 6 | 2 |
| simple-network | 8 | 4 |

### Neural Networks preview findings and final verification

The final preview uses production lesson-section components in an isolated
review server. It bypasses paid access and sequential completion. It does not
execute learner Workers or establish an earned full-course workflow.

The first matrix retained served-source mismatches and L07's 3px overflow at
320px. The shared wrapping fix reduces that content width from 323px to 320px.
The late L09 epilogue and L10 reference changes required a refreshed snapshot.
The first 39 browser warnings came from Playwright's screenshot caret-hiding
style racing React hydration. The same race reproduced on unchanged L02.
Using `caret: "initial"` removes it in the baseline and final runs. This is a
harness finding, separate from the source mismatch and product wrapping fix.

Final evidence is in `test-results/course-clarity-neural/results-final.json`
and `final/`, with 105 screenshots. The matrix passes all 75 phase checks and
15 meaningful Concept interactions across 1440px dark with default motion,
390px light with reduced motion, and 320px dark with reduced motion. All 15
scoped axe scans pass, with no page errors, console errors, failed requests,
or page overflow, including expanded interaction states. Interactions verify
selected neuron terms, activation cases, architecture subtotals, paired dense
operands, and rehearsal stages against the current registries.

The late L10 optional reference has a separate three-viewport check. Each case
opens the reference and selects all five stages by keyboard. All three cases
and three scoped axe scans pass, with six screenshots and no errors or
overflow. Evidence is in `optional-reference-final/results.json`.
`served-source-verification.json` confirms all 15 reviewed raw product sources
match current files and the final capture manifest. The older generated L09
JSON contained the superseded initialized-weights wording. Canonical content
has rebuilt, and the final all-course renderer/story rerun passes. All 56
lesson and 65 exercise records match the served compiled content by unique
world/module/slug keys and every field. Their serialized ordering differs.
`generated-source-verification.json` records this comparison. The final
preview uses current raw MDX and correct capture wording.

First evidence remains in `results-first-pass.json`, `results.json`,
`first-pass/`, and the triage files. These findings remain available alongside
the final passing evidence.

### Isolated dense-forward and actual paid-route browser evidence

The isolated result fixture passes six Chromium cases across 1440px, 390px,
and 320px in both schemes, with 30 clean scoped axe scans. It checks linked
actual capture selection, mismatched values, partial/stale states, bounded
overflow, and existing sensor/gradient behavior. Evidence is in
`test-results/course-clarity-results/forward-family-verified/`. The fixture
uses typed supplied artifacts and executes no learner code. Earlier native
select key attempts failed even on a plain select in headless macOS Chromium.
The retained test now checks Tab focus and uses the native choice API. Earlier
`forward-family/`, `forward-native-select/`, and `forward-keyboard-check/`
folders remain available. These fixture observations do not establish paid
route access or learner results.

The new retained `e2e/signed-in-forward-result.spec.ts` executes the actual
paid forward-pass route using the existing local-review helper and
signed-in-results configuration. It uses fictional local Alex, seeds only
Foundations prerequisites, and enters Challenge directly. It records no auth
traces, video, or automatic screenshots. It dismisses the existing GitHub
nudge through the UI and captures result regions only.

Two cases, 390px light and 320px dark with reduced motion, pass. Each rejects
the starter without an empty Inspect action, runs the canonical six checks,
and captures both actual tables. Selecting Reading 2 and Unit 3 compares
3*kernel[0][2]+4*kernel[1][2]+bias[2] with the displayed sum and actual captured
output. The comparison reads captured operands and does not assume fixed
random weights. The two canonical differences are about 2.98e-8 and 5.96e-8.
A same-code rerun resets controls and preserves saved completion. A partial
asBatch implementation that adds 1 fails the later value-preservation check
while retaining useful prediction/kernel captures. A later edit marks that
output stale. Three scoped axe scans per case pass, with no page errors or
page overflow. The 390px complete and 320px partial screenshots were visually
inspected and remain readable, with tables scrolling inside bounded regions.

The initial two-case pass remains in
`test-results/course-clarity-forward-result-integration/`. A second two-case
pass records explicit operands, eight served-source hashes, test metadata,
and four result PNGs in
`test-results/course-clarity-forward-result-integration-final/results.json`
and its per-case evidence files. These are six scoped axe scans from the
second run, not a combined total with its first run. Both passes precede the
final summary change from initialized to captured weights. The behavior and
operand comparison were verified, while that final copy is covered by the
refreshed preview and source inspection. This is local software integration
evidence. Seeded prerequisites and direct Challenge entry do not establish
independent learner performance or a fully earned paid-course journey.

The retained actual-route command is:

```bash
TENSORCRAFT_REVIEW_DOCKER_HOST=unix:///Users/amira.salah/.colima/tensorcraft-review/docker.sock pnpm exec playwright test e2e/signed-in-forward-result.spec.ts --config e2e/signed-in-results.config.ts --output test-results/course-clarity-forward-result-integration-final
```

### Third-batch production build and remaining evidence

The isolated production build passes both content and web commands with exit
code 0. Evidence is in
`test-results/course-clarity-build/neural-forward-final/20261110T094917409/`.
The filtered source copy contains 5,372 files, zero environment files, and 144
dependency links. All 19 @tensorcraft workspace links point inside that copy.
Its 22 selected product/lock sources match current canonical source and its
manifest. Versions are Node 24.12.0, pnpm 10.12.4, Next 16.4.2, React 19.3.0,
and TensorFlow.js 4.22.0. The build uses sanitized local review settings and
existing pinned installed dependencies. It does not restart the live review
server. This establishes an isolated build, without a fresh-install or
deployment claim. The custom Cache-Control notice also appears in prior
builds.

The latest all-56 renderer/story run passed its recorded 24 current branches,
eight historical branches, four combined handovers, reload/failure/keyboard
cases, and all lessons at 1100px and 375px. The subsequent stale generated L09
wording finding required a canonical content rebuild, which now passes in
about 2.43 seconds. The fresh final renderer/story run passes again for all 56 lessons at
1100px and 375px, with no page errors or horizontal overflow. Story checks
pass the same 24 current, eight historical, and four combined handovers,
reload/revisit, failures, competing tabs, keyboard, and three accessibility
cases. The fixture substitutes exercise editors and external services. Its
latest output is in `test-results/content-review/`. Previous output remains
in `test-results/content-review-before-neural-20261110T114853/`.

The final fresh-compiled decoder and prose-gate run passes 38 checks in three
suites. The third-batch source snapshot follows below. The historical 19-file
and 56-file snapshot values above remain unchanged.

Full mission data/model lineage, other P04 families, the remaining full-card
requirements, and the 41 unstarted lessons remain open. P09 draft-world work
has not started. No new independent reviewer or learner-study results are
recorded. Software verification does not measure improved understanding or
supply a course-wide clarity percentage.

### Final preset wording and source verification

Final visual inspection found that editable examples kept value-specific
names after their controls changed. L06 could show a positive-weight example
name with a negative weight. L10 could retain a same-update-count name after
its schedule changed. Their names and descriptions now identify presets and
state their starting settings. Example IDs, controls, calculations, defaults,
and grader contracts remain unchanged.

The final preset-source matrix repeats all 75 phases and 15 interactions at
the three stated viewport/scheme settings. It passes 15 scoped axe scans with
105 screenshots and no page errors, console errors, failed requests, or page
overflow. It explicitly checks the neutral labels after changing L06's weight
to -1 and L10's schedule to one epoch with batch size 8. Evidence is in
`test-results/course-clarity-neural/results-final-presets.json`,
`final-presets/`, and `served-source-verification-final-presets.json`.
All 15 selected raw product sources and all five compiled lesson objects match
canonical content. The DREG hash is unchanged from the passing three-viewport
optional-reference check. These repeated scans are not added to the earlier
matrix totals.

Before this wording repair, formatting normalized NREG and an older loading
test. `final-format-parity.json` records identical compiled JavaScript for
those formatting changes. The later preset-copy change has its own full
browser/source verification above. Earlier evidence remains available.

The final isolated content and production web builds also pass from this
preset source. Evidence is in
`test-results/course-clarity-build/neural-forward-presets/20261110T100714098/`.
All 22 selected built sources, including NREG, match current canonical source,
and the formatted loading test matches its built copy. Earlier formatted and
pre-format builds remain separate. The last build uses the same local review
configuration and installed versions, copies no environment files, and leaves
the live review server untouched.

### Third-batch bounded source snapshot

Recorded after the final preset wording, browser matrix, and production build.
These 68 working-tree product/test/support hashes identify the cumulative
source for the first three bounded batches. They preserve the earlier 19-file
and 56-file snapshots as history. They do not renew the full-course review
manifest or establish independent learner results.

| Source | SHA-256 |
| --- | --- |
| `apps/web/app/components/__fixtures__/lesson-results.ts` | `054a9a897d921266f6a53aae915c9e8193c99b479c567826bcb1c415d4de8b23` |
| `apps/web/app/components/lesson-result-exercise.test.tsx` | `64b9a34f305030abaf791c568064fb8d2432a2094d3169404d22a374a86a9c70` |
| `apps/web/app/components/lesson-result-exercise.tsx` | `5f79e3f1da04f729cf769f093cca74ed2718f7abaaf992159ae7f539768e484a` |
| `apps/web/app/components/lesson-result-explanation.test.tsx` | `6180c37b30491092e98713ba135c7ab94a5d2d2c04f3760b4f90c670a715d275` |
| `apps/web/app/components/lesson-result-explanation.tsx` | `e7821a9844cb43ad6ec572e40decd1bca303c825d5c375f20bb1cdfa131f8d96` |
| `apps/web/app/components/lesson-visuals/building-network-investigation.test.ts` | `320b2e6504a87ee82c2c5e0ae7139e46220757061d60960f16c203617d16d0ce` |
| `apps/web/app/components/lesson-visuals/data-loading-investigation.test.ts` | `9e441840ee04b2efbb2c79f2ac8a53418d2b4b9eb608dc2483eb62886419fb4d` |
| `apps/web/app/components/lesson-visuals/deep-orbit-visuals.ts` | `c6f7bbe9de743b9db5f02da57d00bda43d69283a05d488cdbad9a7061b57eef4` |
| `apps/web/app/components/lesson-visuals/flow-investigation-contracts.test.ts` | `9f2ab95def73d09ecf86dbe01b01fabde87c968074f480b90d48fb07194dc9ea` |
| `apps/web/app/components/lesson-visuals/flow-investigations.ts` | `7708efc392ae85149f8996cacfa56df97c1d344ea1b386d7179989d7dfee94be` |
| `apps/web/app/components/lesson-visuals/lesson-handoffs.ts` | `ee8d2d681e48a3aea6e02f7bcaadfea84267ab59d9b3e1e0b2daab92f0a041fe` |
| `apps/web/app/components/lesson-visuals/lesson-investigation.css` | `bc9a76bca6f2894877ec9df3ab3c9d86a146fd479a32b017db603dc4d0deb797` |
| `apps/web/app/components/lesson-visuals/lesson-investigation.test.tsx` | `97c06c92e788e45df0c84be56f462483d206d55f2d99c23a13586859416f4fb7` |
| `apps/web/app/components/lesson-visuals/lesson-investigation.tsx` | `b6c8294ee1ffdc077084137cdaaf56b6dcd45392fc58d68aa2341e156bf26083` |
| `apps/web/app/components/lesson-visuals/lesson-investigations.test.ts` | `476aaad7dae23d506a6ec38a8645df2d759d22f5b6f6f69326d86814d6c4b1d1` |
| `apps/web/app/components/lesson-visuals/lesson-visuals.test.tsx` | `cdc47a1b3b25bda9a194245d45604a11bafcf5852b78f38fe6564a96f44dee0b` |
| `apps/web/app/components/lesson-visuals/lstm-investigation.test.ts` | `a645bb00d3fc7877e95179e54359c698f7365193d7d784d6147853a2f9dcd53a` |
| `apps/web/app/components/lesson-visuals/network-shape-investigations.test.ts` | `d60cee6dc835159cce9b2073b044ccc4dc0fd0be0682f5daf27d9df8c50ba90d` |
| `apps/web/app/components/lesson-visuals/neuron-activation-investigations.test.ts` | `c62ab38a82cc13fe692a842355e2061d5aead36d1cbe5be3c351e15cbb77de62` |
| `apps/web/app/components/lesson-visuals/normalization-investigation.test.ts` | `0ef9ec8055a5bab523b0ee8775f9ae4c1f8b34d1e3ed64af669864776d926f33` |
| `apps/web/app/components/lesson-visuals/numeric-investigations.test.ts` | `d1c990821e5941c94f411ff065cdd9904a99bc55aaa32ab276287c12a93f7447` |
| `apps/web/app/components/lesson-visuals/numeric-investigations.ts` | `b7cb053a4794f9a0abaea5823df22d4ca7267b16b40dbb1aae13931220041302` |
| `apps/web/app/components/lesson-visuals/rag-retrieval-example.ts` | `291c38e425f95a1ffae3548a9441b84c5e9dcc8d4cf29e9d0b2170b8d2efad1f` |
| `apps/web/app/components/lesson-visuals/tensor-investigation.test.tsx` | `e41e538f0d1f0c38821068bc81db58b4e991fb60753a8bcb5a0d14166cbf21ce` |
| `apps/web/app/components/lesson-visuals/tensor-investigation.tsx` | `44cf970deb141c4b48f4dc5af87d11718ddc2ad50188dbeefb47a627ee8673d9` |
| `apps/web/app/components/lesson-visuals/tensor-operations-investigation.test.ts` | `8c7d0103f89408594b119d49d5869686db5f5c110786632cf821e661551bc844` |
| `apps/web/app/components/mdx/channel-layout-experiment.css` | `fe62e5078858c73fa8dcc012be16b2e66e93fd6a702bb0ad8125fdd2ef64085f` |
| `apps/web/app/components/mdx/channel-layout-experiment.test.tsx` | `c9f24845d2bf24ed77b58e65dc3ab47dccdda549d7ce0701ca91ab53a46e1354` |
| `apps/web/app/components/mdx/channel-layout-experiment.tsx` | `b4a5dbec5305f595fd347ba44c7d76207d616d338ddf1371a4a8915ef022866c` |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx` | `5634b0a8e92bd11420bd4ec216351ba8c9fd11ff1ff3173f42afba4e5209a00a` |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx` | `6e2a2af4151d14ae1e9f3421bb1bcb180752f90f3756f7219ca2ea9da610cc49` |
| `apps/web/lib/lesson-result-explanations.test.ts` | `86569d31797de61acd1f09d7038a16057753711a5190a082f1d526e40baab5a6` |
| `apps/web/lib/lesson-result-explanations.ts` | `f0081df5c76010ac27681fa6a0ea21386baed154ff32f6f495b22d8a27c8f1cb` |
| `docs/design-previews/research/deep-orbit-result-map.md` | `a15c5e365dd9a385df23ed05ac686a6a8b4d924486b25638e810cf4f60b41f74` |
| `docs/design-previews/research/result-contract-matrix.json` | `7555172ab45936a9969383667e45e1d5bf9d2a9fd5379d7474f2691dd533a516` |
| `e2e/exercise-run.spec.ts` | `bb6b560fb03d158b2cd97944fe0bb89f5c4881ac9c75387d6a837e01e35ccfd6` |
| `e2e/fixtures/lesson-result.tsx` | `34bd691dddf20aac286a623afbd3f005fb020f5c80c8c93f9c385c725c2b9386` |
| `e2e/lesson-continuity.spec.ts` | `b0130e1c75eefb34ec482c118af3f491c8a977173606fcf35b516f2a02236a72` |
| `e2e/lesson-result.config.ts` | `37a5918bfddaeeb061f2c6bd758793f9d07695f033463770ae3755e918af96b2` |
| `e2e/lesson-result.spec.ts` | `d22620cf9fb279ed6dcc6c2db9a7ae3a04b7fafc820ec3c7a6ced19023f5de65` |
| `e2e/signed-in-forward-result.spec.ts` | `ff14cb9dcc7ddde9876416a2e32635940ba9120aab8a1503df3d03c705ac0dcb` |
| `e2e/signed-in-lesson-results.spec.ts` | `75d14f97a94c45f7ec017c4d174062eb1db1e8928a75ac88771feba8ba1fe34d` |
| `packages/content/__tests__/backprop-restoration.test.ts` | `9001be7b018bfae9ab8a89e780ce4928b478d35634d1b6febe828d0eb0ffd2d6` |
| `packages/content/__tests__/foundations-continuity.test.ts` | `f937bb02191a08e0537daba89c4bb859a8c8e0acc398d64c7bfbea82dda07d2a` |
| `packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx` | `4265023fcfe25cf087a8f94d44288b95badf74955a8c2bef714ef0863df39e26` |
| `packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx` | `516ebdcaf3230ba599f9b3fb46321461dbd14a577007e36419f7ae661ddee3f8` |
| `packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx` | `aad9cbc0f696a315061bdf3f8911a190a11b11be8cfaa8eca057eef6933a5b07` |
| `packages/content/content/deep-orbit/foundations/04-data-loading.mdx` | `9ec273078a9e1fa7f6b6d487d41ab62d6b2a040a8a31fa3caadcdc03d9e01092` |
| `packages/content/content/deep-orbit/foundations/05-normalization.mdx` | `0868261463890664989de0796e8f82771959fe35e1f4bf1af13e8147ac086677` |
| `packages/content/content/deep-orbit/foundations/exercises/add-tensors.yaml` | `e630ae8c69d38c24e9bfd041aba748b772e903ed334efcb2bf248739120ec31c` |
| `packages/content/content/deep-orbit/foundations/exercises/batch-data.yaml` | `cf8f5d36362fa83e9a37de7bbbb5e6c7311c8fec015c3d8071b759a3deb9f8cb` |
| `packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx` | `bd05a0d137fc3bceb987c2f3bf7dba835751dbb0d8afe5c0b4a9cd0b319ef19d` |
| `packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx` | `3fa5cf9b3a35c9c4967fd15f0eed607bc9174f0b27a186ec21494e328e8e5872` |
| `packages/content/content/deep-orbit/neural-networks/02-activation-functions.mdx` | `35e7cd1f182cc83fd33e126026383de7a00f2dd606dd4c61d355bad769c83675` |
| `packages/content/content/deep-orbit/neural-networks/03-layers-and-architecture.mdx` | `17580c383e6c9b4f6347e0558cf21aa0c1f4941b880818b0c61e48dac88c1bf6` |
| `packages/content/content/deep-orbit/neural-networks/04-forward-pass.mdx` | `fa76c9bb00d6ccc643235d528754fd19339e1ec5be6b77ea1ab44538e2681b52` |
| `packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx` | `2566e3cfe06312ecd978ac87c5c1850cd2f7fcdaa2f235d3c3b0ca94a1c7043c` |
| `packages/content/content/deep-orbit/neural-networks/exercises/forward-pass.yaml` | `fbf101fc005c5c4355486f916b844108abb504fbe13401301213a436df26c38a` |
| `packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx` | `c02dce7c7343abc90abbfe99a87970ff7b902a87e23c713b4a0aa37e66a69513` |
| `packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx` | `2c5c96122ae9dc97d70e0e0bdb752f3db7a23bb19e40429934b176060aad34fb` |
| `packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx` | `1bcd932dcb7c058acf70eef1fa6c25881096a3cce9acfbac6512f9e686fe7add` |
| `packages/content/content/deep-orbit/training-loop/03-backpropagation.mdx` | `3eefd31154f5bc50b01eb2449e06d31be49922a13183224a398855c136617139` |
| `packages/content/content/deep-orbit/training-loop/exercises/backprop-chain.yaml` | `f2d9533943d6f0a0824f2eb1b9858945b823543315f9ea4508b62e769baf7c0e` |
| `packages/ui/src/mdx/exercise-output.test.tsx` | `5d3596562c3a2b0576e6882c46367f9f8449614cc8721448ad1c41176966c935` |
| `packages/ui/src/mdx/exercise-output.tsx` | `a40ee9a8aa958b8a41d50910abe4c2e9264617955ae571d8a58d3f55ce1e8821` |
| `packages/ui/src/mdx/exercise-saved-runs.test.tsx` | `5f1b3512e04da773f15aa9c6440eac7712b47aa9e821b19981d68901fbb81ca7` |
| `packages/ui/src/mdx/exercise.tsx` | `3e6ded85d6ca2a2fe7c595bfee484961dc38f0603e6468d5c516c8b36f027243` |
| `scripts/check-reviewed-examples.mjs` | `83e77542dbda63997d5b78b160e895a839d67fdd1bae9faf0f75d5275c246b7c` |

## Training Loop and three result families on November 10

This fourth batch adds bounded L11, L12, L14, and L15 slices. L13 already
belongs to the first batch and remains in the five-lesson preview. The unique
total is nineteen: L01-L15, L23, L29, L44, and L47. Thirty-seven lessons have no
implementation slice. All 56 full cards remain open.

### Required teaching and source boundaries

| Card | Implemented explanation and activity | Preserved scope and limits |
| --- | --- | --- |
| L11 | The main MSE probe uses labels [3,-0.5,2,1] and predictions [2.5,0,2.1,1.3]. A selected row exposes the difference, square, and contribution to the batch mean 0.15. BCE uses [1,0] labels with correct [3,-3] and wrong [-3,3] logits. The main API table distinguishes probabilities from raw logits. | Arithmetic inputs remain separate from ship measurements. The five-row alternate is an existing shared-input probe. The grader-only two-row MSE probe stays unseen. The eight check names, starter, solution, and numerical fixtures remain. Numeric captures do not certify pickBceForm. |
| L12 | The main scalar trace uses w squared, start 5, rate 0.1, gradient 10, new weight 4, and recomputed loss 16. Further updates expose every operand. Separate supplied losses demonstrate why step must differentiate its argument. | The scalar probe trains no spacecraft classifier. The scene board and optional shifted-square reference have their own explicit identity. The separate learning-rate experiment uses half the squared distance to a target. Six check names, starter, solution, and numerical fixtures remain. |
| L13 | Existing squared-loss, numerical restoration, automatic/numerical comparison, and forward-call teaching remains in the module matrix. | No new lesson slice is counted. Fictional timing remains separate from actual counted calculations. |
| L14 | Main teaching covers optimizer updates, actual training/validation curves, callback patience, and the ordered full-history diagnosis. The activity uses a supplied 50-entry reference and explicit short-history, zero, exact 5%, and changed-trend cases. | The fresh 100-row/three-feature/673-parameter exercise differs from L10's eight-feature rehearsal. Deterministic class interleaving replaces an inaccurate claim that the fixture was shuffled first. Early stopping counts five non-improvements and does not restore best weights. |
| L15 | The selected held-out row trace teaches strict cutoff and error category before aggregates. A declared always-class 0 baseline scores20/43 and misses 23 flagged rows. Required confusion-matrix teaching stays visible. | Training labels are tied 50/50, so the policy is declared before evaluation. The generated 40 rows plus 3 authored cases differ from the 12-score Concept worksheet and the independent optional50-row reference. Fictional94%/.518 and sample 7741 remain separate. Existing four capture roles, specialized reader, and write flags remain. |

All five phases, visible narrative/artwork, main required concepts, editor
mounting, and outgoing story beats remain. The original two LSTM recall
questions now keep indices 0 and 1. The new cell-state question follows at 2.
The intentional checked-prompt total is 84, with a regression for those keys.

### Actual captures and current-run inspection

The transient host now supports seven contracts across six families. The
new loss-comparison, scalar-updates, and training-history families use the
existing bounded artifact protocol and tokened renderResult lifecycle. They
introduce no persisted schema, account state, or saved-run registration.

- `mse-loss` captures four pre-call input rows beside the actual scalar MSE.
  Its BCE comparison retains the actual two returned losses plus the supplied
  labels/logits, before numerical assertions. A finite wrong return 0 remains
  inspectable. Separate input tensors preserve the original call isolation.
- `gradient-step` retains its original first after-state and three-point
  weight series. Two new rows record the actual before-weight, gradient,
  rate, after-weight, and read-back loss for calls 2 and 3. There is no invented
  observed before-state for the learner's first call and no extra optimizer
  update. A short capture keeps ordinary output available.
- `training-loop-exercise` preserves original epoch numbers for up to 64
  sampled curve points. Its second table records full-history final-window
  ranges/means, returned/invalid/threw status, valid label or null, and bounded
  detail. Means and samples are captured before diagnosis receives copies.
  A thrown, invalid, or wrong valid diagnosis leaves both artifacts visible.

Strict readers check exact roles, axes, columns, row order, finite values,
sample mapping, joined trace values, and bounded details. Missing or malformed
contracts fall back to ordinary output. The viewers keep captured output
separate from JavaScript reference calculations, retain useful failures,
mark edits stale, and reset controls on a new run token. Overflow references
remain readable beside finite returned values.

History references use full captured precision. The display explicitly labels
rounded means, full ten-epoch windows, sampled epochs, and the strict 5% rule
with absolute 1e-12 tolerance and zero special case. The diagnosis describes
curves without establishing their cause or held-out performance.

Read-only real-Worker review found that replacing fit inputs with zeros still
passes the existing history checks, and adding 100 to the scalar loss leaves
all six gradient checks passing. Final copy therefore describes the supplied
exercise contract separately from the submitted history and lossFn captures.
This bounded adapter adds no new input-provenance or exact-loss restriction.

### Confirmed grader repairs

Three narrow repairs preserve existing check names and valid alternatives:

1. Replaced-gradient disposal was untested. Removing only the disposal line
   passed all six checks. Calls2/3 now require a replaced prior gradient to be
   disposed while keeping the latest readable. An implementation that reuses
   one live gradient variable still passes. Deleting all disposal or only the
   third-update disposal fails while retaining the first after-state.
2. A legitimate requested 5-epoch training budget previously failed the
   500-only stopping assumption. The check now validates the producing
   requested 1..500 budget. Patience applies when stopping before that budget,
   with no rejection just for completing a short requested run.
3. An inclusive evaluation gap comparison passed all ten checks before the
   repair. The existing gap check now asserts diagnose(0.15,0) is low-scores.
   The same >= variant fails only that boundary check and retains all four
   case tables. Literal 0.15 avoids an unrelated subtraction-rounding artifact.

### Fourth-batch verification in progress

The reviewed-example harness passes 71 runtime groups, including 15 Training
Loop groups. Ten new main blocks execute alongside retained optional blocks.
Every group returns to its initial tensor count. Runtime checks use the
installed TensorFlow.js 4.22.0 implementation for loss defaults, gradients,
early-stopping behavior, strict binary cutoff, metric order, and measured
evaluation. Stochastic model outputs have no fixed expected accuracy.

All five Training Loop strict validators pass canonical solutions, starter
rejection, and registered misconception variants. Actual visible artifact
counts are 3, 3, 2, 2, 4 for L11-L15 respectively. The focused current-result,
capture, host, and boundary command passes 114 checks before the additional
rounded-mean UI regression. Final reruns are recorded below when complete.

The first lesson-preview matrix passes 75 phase checks, 15 activity cases,
15 scoped axe scans, and 105 screenshots. It reports no page/console errors,
failed requests, or page overflow. Nineteen selected served raw files and all
five compiled lesson objects match that first-pass source. Its report remains
at `test-results/course-clarity-training/results-first-pass.json`. This pass
predates the L12 scene-board sentence.

The initial isolated inspector matrix passes all six width/theme settings,
with 66 scoped axe scans across old and new states. It uses predetermined
artifacts and no learner execution. Its evidence remains under
`test-results/course-clarity-results/training-loop/`. The final wording matrix,
actual paid-route Workers, final lesson preview, isolated production build,
and all 56 renderer/story check are recorded separately below.

Actual-route first attempts are retained. The first stopped before account
seeding because the caller omitted the dedicated review Docker socket. The
socket-corrected attempt reached real passing captures but used unsuitable
exact-label locators and required a full virtualized CodeMirror document in
the DOM. The test now uses accessible combobox roles and checks executed
source through the real Worker verdict. These test setup failures do not count
as passing product evidence. No auth trace, video, or automatic screenshot
was enabled.

### Final fourth-batch browser and runtime evidence

The final Training Loop preview passes all 75 phase checks, 15 Concept
interactions, and 15 scoped axe scans, with 105 screenshots. It covers
1440px dark/default motion, 390px light/reduced motion, and 320px dark/reduced
motion. It reports no page errors, console errors, failed requests, or page
overflow. All 22 selected raw sources and five compiled lessons match the
served snapshot at verification. The final report, screenshots, and source
checks are in `test-results/course-clarity-training/results-final.json`,
`final/`, and `served-source-verification-final.json`. The earlier first pass
remains separate. Preview evidence uses production section components while
bypassing paid gating and sequential completion. It executes no learner code.

The final isolated result-viewer matrix passes six settings: 1440, 390, and
320px in both schemes, with reduced motion on phone sizes. Its 66 scoped axe
scans cover sensor, gradient, forward, loss, update, long/short history, and
useful-failure states. Selection, native Tab focus, stale state, actual versus
reference output, and page overflow checks pass. There are no page errors,
external requests, or failed requests. Evidence is in
`test-results/course-clarity-results/training-loop-final/`. These predetermined
captures test production presentation, independently of Worker capture tests.

All three new contracts pass actual paid-route tests with fictional local
Alex, seeded Foundations/Neural Networks prerequisites, and direct Challenge
access. The final clean run is in
`test-results/signed-in-results/training-loop-final-clean/`:

- MSE/BCE at 390px light: eight checks and three artifacts. A returned zero
  BCE fails grading while its actual zero and captured logits remain visible.
- Gradient steps at 320px dark: six checks and three artifacts. A missing
  previous-gradient disposal fails and falls back to the retained first
  after-state table in ordinary output.
- History at 390px light: six checks and two artifacts. A thrown diagnosis
  retains actual curves, status/detail, and the separate full-mean reference.

Each case checks saved completion and control reset on a fresh passing run.
Edits mark retained output stale. The two full partial-result inspectors also
pass accessibility checks, for five scoped scans across the three workflows.
No page errors occur. Screenshots contain the result region, dismiss the
optional GitHub nudge, and preserve the caret to avoid a known development
hydration race. Auth traces, video, and automatic screenshots stay off.

The earlier socket-corrected and final attempts remain as history. The final
attempt initially passed MSE but revealed two remaining test-only assumptions:
an exact one-line disposal replacement failed on compiled multiline code,
and one history control still used the old label locator. The corrected
two-case retry passes. The clean three-case rerun passes all three together.
These retries are not added to the final accessibility totals.

Final focused decoder/viewer/host/capture/boundary checks pass 115 tests across
seven suites. A separate numeric/shared-investigation/recall set passes 129
tests across nine suites. The answer-leak, writing lexicon, starter, and hint
checks pass 478 tests across four suites. Their scopes overlap other selected
commands and should not be summed into a unique total. The final reviewed
example harness remains at 71 groups. Web and UI typechecks, targeted lint,
lesson-code parsing (151 blocks), formatting, punctuation, and diff checks
pass.

Formatting normalized one decoder method chain and an older investigation
test after the browser/build snapshots. The TypeScript printer retains source
line breaks, so its first byte comparison differs. That attempt remains in
`final-format-parity-printer-attempt.json`. Parsing and normalizing the emitted
JavaScript with esbuild produces identical output for both files, recorded in
`test-results/course-clarity-training/final-format-parity.json`. The affected
decoder and investigation suites pass 67 tests afterward. This is a formatting
change with explicit source attribution, rather than a new behavior claim.

### Fourth-batch production build and renderer attribution

The isolated content and production web build pass from the settled source
copy at
`test-results/course-clarity-build/training-loop-final/20261110T132045565/`.
The build copies tracked/untracked source, reads no canonical environment
files, uses sanitized local review settings, retargets workspace links, and
does not touch the live review runtime. Thirty-five of 36 selected built
sources match final raw source. The decoder differs only by the formatting
change whose normalized JavaScript parity is recorded above.

An earlier passing build at `20261110T131200884/` predates one gradient
summary clarification. Its renderer ran alongside the build and failed during
startup amid generated-file reloads. The settled-source isolated renderer
also timed out during its first page load before checking any lesson. Both
logs remain available and supply no lesson-pass claim. The canonical renderer
rerun uses rebuilt lesson objects compared with that settled copy. Its final
outcome is recorded separately below.

The unchanged canonical `node scripts/check-content-browser.mjs --story`
command passes with a sanitized environment. All 56 canonical compiled lesson
objects match the isolated build by moduleId/slug, despite different array
ordering. The renderer checks every lesson at 1100px and 375px, for 112 checks,
with no page errors or overflow. Story checks pass 24 current branches, eight
historical branches, four combined handovers, recovery/reload, first-write-wins,
keyboard operation, and decision accessibility.

Current reports are in `test-results/content-review/`, with a complete copy
under `all56-story-renderer-final/` in the final build evidence. The prior
renderer is preserved at
`test-results/content-review-before-training-loop-20261110T131200884/`.
`final-gates.json` records the passing commands, source comparison, zero
environment files, internal workspace links, and decoder formatting proof.
This verifies existing installed dependencies, without a fresh-install or
deployment claim.

The retained evaluation reader workflow also passes at 390px light in
`test-results/signed-in-results/training-loop-evaluation-current/`. Its three
scoped axe scans, keyboard/prediction/comparison flow, starter rejection,
actual solution, selected authored case40, downloaded 43-case snapshot,
disabled reader writes, independent cost decision/transfer, recall, and
fictional epilogue checks all pass. It has no page errors or overflow. Five
screenshots remain. The initial old-artwork assertion failure is preserved in
`training-loop-evaluation/`. Only affected selectors and the new briefing
baseline chart expectation changed in that existing test. Product schemas,
flags, and the specialized viewer remain unchanged.

### Remaining work after the fourth batch

These internal checks support nineteen bounded slices and seven transient
result contracts. They do not close any of the 56 full lesson cards or supply
independent learner evidence. Thirty-seven Deep Orbit lessons remain without
an implementation slice. Continue with the L16-L20 Signal Processing cards,
including L23's already-started cross-module dependencies, while preserving
the current sources and accumulated evidence.

Full mission data/model lineage, authored calibration authority, source
metadata, remaining result families, complete feedback/transfer coverage,
before-change media, and learner/reviewer studies remain open. The coming-soon
worlds retain their separate 219-lesson discovery scope. Existing review
manifest hashes remain stale and unchanged. No course-wide clarity percentage,
deployment, or learning-effectiveness claim follows from this implementation.

### Fourth-batch bounded source snapshot

Recorded after final runtime, browser, renderer, formatting, and build
verification. These 88 cumulative product/test/support hashes identify the
current working tree. The earlier 19-, 56-, and 68-file snapshots retain all
143 historical hash values. The build and browser source differences from
formatting have their own explicit parity evidence above. This snapshot
does not refresh the inherited review manifest or close full lesson cards.

| Source | SHA-256 |
| --- | --- |
| `apps/web/app/components/__fixtures__/lesson-results.ts` | `8f684aa5baf29fea2270e0251542320e707a4e0cdc3366722c147890c5cbd2df` |
| `apps/web/app/components/lesson-result-exercise.test.tsx` | `64b9a34f305030abaf791c568064fb8d2432a2094d3169404d22a374a86a9c70` |
| `apps/web/app/components/lesson-result-exercise.tsx` | `5f79e3f1da04f729cf769f093cca74ed2718f7abaaf992159ae7f539768e484a` |
| `apps/web/app/components/lesson-result-explanation.test.tsx` | `6180c37b30491092e98713ba135c7ab94a5d2d2c04f3760b4f90c670a715d275` |
| `apps/web/app/components/lesson-result-explanation.tsx` | `ce7a050c85c0ae13e006beb92a2b51182d1c0486acee4339f210e3eb0c429de7` |
| `apps/web/app/components/lesson-visuals/building-network-investigation.test.ts` | `320b2e6504a87ee82c2c5e0ae7139e46220757061d60960f16c203617d16d0ce` |
| `apps/web/app/components/lesson-visuals/data-loading-investigation.test.ts` | `9e441840ee04b2efbb2c79f2ac8a53418d2b4b9eb608dc2483eb62886419fb4d` |
| `apps/web/app/components/lesson-visuals/deep-orbit-visuals.ts` | `a6a6bffab7985bdf3d4cc79410019e5d37a4f07383c9b469c7843e1735c4a42d` |
| `apps/web/app/components/lesson-visuals/evaluation-investigation.test.ts` | `5a8ceb36fb42ebd6e2cad8dfb74df7dfd5faa756467746dacc4e5b7ed7664e86` |
| `apps/web/app/components/lesson-visuals/flow-investigation-contracts.test.ts` | `9f2ab95def73d09ecf86dbe01b01fabde87c968074f480b90d48fb07194dc9ea` |
| `apps/web/app/components/lesson-visuals/flow-investigations.ts` | `7708efc392ae85149f8996cacfa56df97c1d344ea1b386d7179989d7dfee94be` |
| `apps/web/app/components/lesson-visuals/lesson-handoffs.ts` | `ee8d2d681e48a3aea6e02f7bcaadfea84267ab59d9b3e1e0b2daab92f0a041fe` |
| `apps/web/app/components/lesson-visuals/lesson-investigation.css` | `bc9a76bca6f2894877ec9df3ab3c9d86a146fd479a32b017db603dc4d0deb797` |
| `apps/web/app/components/lesson-visuals/lesson-investigation.test.tsx` | `a024c0ed47bd9fcb73003419e82472b859e5ddedae13833be3c7936e5514b6f9` |
| `apps/web/app/components/lesson-visuals/lesson-investigation.tsx` | `b6c8294ee1ffdc077084137cdaaf56b6dcd45392fc58d68aa2341e156bf26083` |
| `apps/web/app/components/lesson-visuals/lesson-investigations.test.ts` | `476aaad7dae23d506a6ec38a8645df2d759d22f5b6f6f69326d86814d6c4b1d1` |
| `apps/web/app/components/lesson-visuals/lesson-visuals.test.tsx` | `cdc47a1b3b25bda9a194245d45604a11bafcf5852b78f38fe6564a96f44dee0b` |
| `apps/web/app/components/lesson-visuals/loss-gradient-investigations.test.ts` | `3807a16c4805e06691b06c21dbe3fafb7fb63466162e014668cfa8785d563c25` |
| `apps/web/app/components/lesson-visuals/lstm-investigation.test.ts` | `a645bb00d3fc7877e95179e54359c698f7365193d7d784d6147853a2f9dcd53a` |
| `apps/web/app/components/lesson-visuals/network-shape-investigations.test.ts` | `d60cee6dc835159cce9b2073b044ccc4dc0fd0be0682f5daf27d9df8c50ba90d` |
| `apps/web/app/components/lesson-visuals/neuron-activation-investigations.test.ts` | `c62ab38a82cc13fe692a842355e2061d5aead36d1cbe5be3c351e15cbb77de62` |
| `apps/web/app/components/lesson-visuals/normalization-investigation.test.ts` | `0ef9ec8055a5bab523b0ee8775f9ae4c1f8b34d1e3ed64af669864776d926f33` |
| `apps/web/app/components/lesson-visuals/numeric-investigations.test.ts` | `1aefc0f6b890a449c606e6b45088bab654b92ff9245bada7ba9cd4c61d808fc1` |
| `apps/web/app/components/lesson-visuals/numeric-investigations.ts` | `95057a32f42ddd9e80bf03477492a423365c6442406da38ef07eae06a56174d1` |
| `apps/web/app/components/lesson-visuals/rag-retrieval-example.ts` | `291c38e425f95a1ffae3548a9441b84c5e9dcc8d4cf29e9d0b2170b8d2efad1f` |
| `apps/web/app/components/lesson-visuals/tensor-investigation.test.tsx` | `e41e538f0d1f0c38821068bc81db58b4e991fb60753a8bcb5a0d14166cbf21ce` |
| `apps/web/app/components/lesson-visuals/tensor-investigation.tsx` | `44cf970deb141c4b48f4dc5af87d11718ddc2ad50188dbeefb47a627ee8673d9` |
| `apps/web/app/components/lesson-visuals/tensor-operations-investigation.test.ts` | `8c7d0103f89408594b119d49d5869686db5f5c110786632cf821e661551bc844` |
| `apps/web/app/components/lesson-visuals/training-loop-investigation.test.ts` | `b7f8c5daff17ee37c36365374cc39ddf3833cde4dc01038693a63b9ed60d61cf` |
| `apps/web/app/components/mdx/channel-layout-experiment.css` | `fe62e5078858c73fa8dcc012be16b2e66e93fd6a702bb0ad8125fdd2ef64085f` |
| `apps/web/app/components/mdx/channel-layout-experiment.test.tsx` | `c9f24845d2bf24ed77b58e65dc3ab47dccdda549d7ce0701ca91ab53a46e1354` |
| `apps/web/app/components/mdx/channel-layout-experiment.tsx` | `b4a5dbec5305f595fd347ba44c7d76207d616d338ddf1371a4a8915ef022866c` |
| `apps/web/app/components/training-result-explanation.test.tsx` | `067103e1fc0c028d1897a746b0648e442a758ee50c4d5fc1becb72dad3a29498` |
| `apps/web/app/components/training-result-explanation.tsx` | `a4cdc067d7b2a9599cab3a2e02f52fe3267c5c870ae9e5481a0c13ee8a96ec0c` |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx` | `5634b0a8e92bd11420bd4ec216351ba8c9fd11ff1ff3173f42afba4e5209a00a` |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx` | `6e2a2af4151d14ae1e9f3421bb1bcb180752f90f3756f7219ca2ea9da610cc49` |
| `apps/web/lib/lesson-result-explanations.test.ts` | `86569d31797de61acd1f09d7038a16057753711a5190a082f1d526e40baab5a6` |
| `apps/web/lib/lesson-result-explanations.ts` | `63bf16fa04d20d5d61b3c033b2e16109a0522e25bd08e3536441f83b01490026` |
| `apps/web/lib/training-result-explanations.test.ts` | `43e4e00feced5aac846fc6f5b45280c38ab5a1757589caf2d50aa514b5c7c71f` |
| `apps/web/lib/training-result-explanations.ts` | `363543261754552ef511603500e5133fe27f2165cf7c9a1a713b6bf2b5f96e8b` |
| `docs/design-previews/research/deep-orbit-result-map.md` | `d63d39d3216850031ab88f4c16d0e3365377510052c36d0308d64146cd15acff` |
| `docs/design-previews/research/result-contract-matrix.json` | `3c11c4c17c0d6931f2d1d23091886475218a8976cbc7452a912c5f98e8b0348d` |
| `e2e/exercise-run.spec.ts` | `bb6b560fb03d158b2cd97944fe0bb89f5c4881ac9c75387d6a837e01e35ccfd6` |
| `e2e/fixtures/lesson-result.tsx` | `a9a38e3eb6842215087a9fe44972c6159dcf22856f9251dffb552854b111eb06` |
| `e2e/lesson-continuity.spec.ts` | `b0130e1c75eefb34ec482c118af3f491c8a977173606fcf35b516f2a02236a72` |
| `e2e/lesson-result.config.ts` | `37a5918bfddaeeb061f2c6bd758793f9d07695f033463770ae3755e918af96b2` |
| `e2e/lesson-result.spec.ts` | `714ff3dbcf834716b57315174e0413a917d8ed76331feca3d0b732c1364480a5` |
| `e2e/signed-in-evaluation.spec.ts` | `034fd50a8ffd4797b2408dcd46721751d120bd153daad311581fb20404e97ac5` |
| `e2e/signed-in-forward-result.spec.ts` | `ff14cb9dcc7ddde9876416a2e32635940ba9120aab8a1503df3d03c705ac0dcb` |
| `e2e/signed-in-lesson-results.spec.ts` | `75d14f97a94c45f7ec017c4d174062eb1db1e8928a75ac88771feba8ba1fe34d` |
| `e2e/signed-in-training-results.spec.ts` | `4ed36e391a14da7c6ea2727c49c2c2162e0e7cb6113e7169a7640b1648837f7c` |
| `packages/content/__tests__/backprop-restoration.test.ts` | `9001be7b018bfae9ab8a89e780ce4928b478d35634d1b6febe828d0eb0ffd2d6` |
| `packages/content/__tests__/deep-orbit-recall-checks.test.ts` | `567b75cdf2fcdb4a4a2242992715dde9ff8a98b6af46f27437f85007779003ff` |
| `packages/content/__tests__/evaluation-gap-boundary.test.ts` | `e5937eaf1bf022dda10ea7def3baba906d4de6d0fc653d5515dd7ef40761ca71` |
| `packages/content/__tests__/foundations-continuity.test.ts` | `f937bb02191a08e0537daba89c4bb859a8c8e0acc398d64c7bfbea82dda07d2a` |
| `packages/content/__tests__/training-loop-diagnosis.test.ts` | `113242ed36a75bc024fa3d8f0d500dadd78cf91d601aa044477b601aa48fe62f` |
| `packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx` | `4265023fcfe25cf087a8f94d44288b95badf74955a8c2bef714ef0863df39e26` |
| `packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx` | `516ebdcaf3230ba599f9b3fb46321461dbd14a577007e36419f7ae661ddee3f8` |
| `packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx` | `aad9cbc0f696a315061bdf3f8911a190a11b11be8cfaa8eca057eef6933a5b07` |
| `packages/content/content/deep-orbit/foundations/04-data-loading.mdx` | `9ec273078a9e1fa7f6b6d487d41ab62d6b2a040a8a31fa3caadcdc03d9e01092` |
| `packages/content/content/deep-orbit/foundations/05-normalization.mdx` | `0868261463890664989de0796e8f82771959fe35e1f4bf1af13e8147ac086677` |
| `packages/content/content/deep-orbit/foundations/exercises/add-tensors.yaml` | `e630ae8c69d38c24e9bfd041aba748b772e903ed334efcb2bf248739120ec31c` |
| `packages/content/content/deep-orbit/foundations/exercises/batch-data.yaml` | `cf8f5d36362fa83e9a37de7bbbb5e6c7311c8fec015c3d8071b759a3deb9f8cb` |
| `packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx` | `bd05a0d137fc3bceb987c2f3bf7dba835751dbb0d8afe5c0b4a9cd0b319ef19d` |
| `packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx` | `3fa5cf9b3a35c9c4967fd15f0eed607bc9174f0b27a186ec21494e328e8e5872` |
| `packages/content/content/deep-orbit/neural-networks/02-activation-functions.mdx` | `35e7cd1f182cc83fd33e126026383de7a00f2dd606dd4c61d355bad769c83675` |
| `packages/content/content/deep-orbit/neural-networks/03-layers-and-architecture.mdx` | `17580c383e6c9b4f6347e0558cf21aa0c1f4941b880818b0c61e48dac88c1bf6` |
| `packages/content/content/deep-orbit/neural-networks/04-forward-pass.mdx` | `fa76c9bb00d6ccc643235d528754fd19339e1ec5be6b77ea1ab44538e2681b52` |
| `packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx` | `2566e3cfe06312ecd978ac87c5c1850cd2f7fcdaa2f235d3c3b0ca94a1c7043c` |
| `packages/content/content/deep-orbit/neural-networks/exercises/forward-pass.yaml` | `fbf101fc005c5c4355486f916b844108abb504fbe13401301213a436df26c38a` |
| `packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx` | `c02dce7c7343abc90abbfe99a87970ff7b902a87e23c713b4a0aa37e66a69513` |
| `packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx` | `43ec8cf5752145604e54a40b9390eeac1f8f395798c7b069c540a7eea13ef395` |
| `packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx` | `1bcd932dcb7c058acf70eef1fa6c25881096a3cce9acfbac6512f9e686fe7add` |
| `packages/content/content/deep-orbit/training-loop/01-loss-functions.mdx` | `5caa5727c3d3c571c3df578a5aba5505acb48365a02324c12effc6b7da2ee6d4` |
| `packages/content/content/deep-orbit/training-loop/02-gradient-descent.mdx` | `d6ea95f1c09f662d07d18db582e2d036b09e63a516361a0c9cba4362d221e0ce` |
| `packages/content/content/deep-orbit/training-loop/03-backpropagation.mdx` | `3eefd31154f5bc50b01eb2449e06d31be49922a13183224a398855c136617139` |
| `packages/content/content/deep-orbit/training-loop/04-training-loop.mdx` | `ee7a96747ba06b0c632c1fbc0ec1e651dac5cded4b7c5ece270c848cd134b7d1` |
| `packages/content/content/deep-orbit/training-loop/05-evaluating-deep-scan.mdx` | `6a54242107d64ff193289c7a2906fca6b55969d21020dafbf60eb01bf5803d76` |
| `packages/content/content/deep-orbit/training-loop/exercises/backprop-chain.yaml` | `f2d9533943d6f0a0824f2eb1b9858945b823543315f9ea4508b62e769baf7c0e` |
| `packages/content/content/deep-orbit/training-loop/exercises/deep-scan-eval.yaml` | `e82a3a5ca0a4f87873248babd7cf4c3fa7df142c0f628b31314c34905fcaa6b6` |
| `packages/content/content/deep-orbit/training-loop/exercises/gradient-step.yaml` | `c4ec8788dc33c72d86f6c6af8680a8de6a0523e735e7ab734caa00dd2e2213fa` |
| `packages/content/content/deep-orbit/training-loop/exercises/mse-loss.yaml` | `8e45e025151722b96a69b34085fc43370884047e3c24fa5d7092bd9f3934450c` |
| `packages/content/content/deep-orbit/training-loop/exercises/training-loop-exercise.yaml` | `59266a171d043599f409a33ad300512ebf5a703edba47596ca445444a82d6064` |
| `packages/ui/src/mdx/exercise-output.test.tsx` | `5d3596562c3a2b0576e6882c46367f9f8449614cc8721448ad1c41176966c935` |
| `packages/ui/src/mdx/exercise-output.tsx` | `a40ee9a8aa958b8a41d50910abe4c2e9264617955ae571d8a58d3f55ce1e8821` |
| `packages/ui/src/mdx/exercise-saved-runs.test.tsx` | `5f1b3512e04da773f15aa9c6440eac7712b47aa9e821b19981d68901fbb81ca7` |
| `packages/ui/src/mdx/exercise.tsx` | `3e6ded85d6ca2a2fe7c595bfee484961dc38f0603e6468d5c516c8b36f027243` |
| `scripts/check-reviewed-examples.mjs` | `9324db13c315f4ab4cc26cd84750872bbfed23b28b1445a62292e1109f5aeb11` |

## Browser Runtimes and five result families on November 10

This fifth batch implements bounded L16-L21 slices. The unique total is now
25: L01-L21, L23, L29, L44, and L47. Thirty-one lessons remain without an
implementation slice. All 56 full lesson cards remain open. The preceding
remaining-work paragraph mistakenly called L16-L20 Signal Processing. The
cards place Browser Runtimes at L16-L21 and Signal Processing at L22-L26.
This batch follows the actual card order.

### Required teaching and source boundaries

| Card | Implemented teaching and live activity | Preservation and limits |
| --- | --- | --- |
| L16 | Follow a scenario through the local requirement, inclusive 50 MB budget, and strict below-50 ms preference. Trace client, server, or reconsider before comparing the returned recommendation. A separate byte calculation distinguishes decimal MB from MiB. | These are authored deployment rules, not device benchmarks or guarantees. Oversized sensitive/offline cases cannot silently fall back to a server. Nazari's operational decision and existing prerequisite policy remain. |
| L17 | Follow request, accepted/refused/unknown preference, ready, actual backend, and version. A refused preference can fall back. Total initialization failure reaches the caller. The main code reads the ready runtime. | The live activity and cold grader use identified test names and versions. They do not identify the learner's device. Optional benchmarks and the real runtime lab remain separate observations. |
| L18 | Follow the real asset's manifest, one weight shard, usable model, copied shapes/count, and ownership. The main inspection example loads once and disposes in finally. Export/cache/UI examples identify their separately supplied or retained model. | The asset is a supplied 673-parameter example. Shape cannot establish feature meaning. The grader's loader response remains simulated and its alternate architecture remains distinct. The shipped manifest and 2692-byte weight file are byte-identical to HEAD. |
| L19 | Follow [512,21,pi/2] through the requested scales, observed [0.25,1/3,0.75] model row, amplitude-echo output 0.25, noise decision, and selected-class score 0.75. Teach synchronous/async readback and cleanup. The incident separately traces 400 to 520 over 1h, 120/hour, 9480 remaining, and 79 projected hours. | Legacy frequency means zero-crossing count. Legacy phase is the supplied sample-pair angle in radians. Neither is an FFT quantity. Echo probes check integration, not accuracy. Incident endpoints assume continuation and identify no leak cause. Both editors, briefs, and required passes remain. |
| L20 | Compare identical float32 inputs, completed output readback, inclusive 0.0001 parity, and exact timing boundaries. The live activity replaces an unrelated operator quiz with a controlled comparison trace. | TensorFlow.js uses planted test weights, ONNX and clock are simulated, and parity establishes no accuracy or device ranking. The caller retains its model. Session and temporary ownership remain explicit. Real repeated measurement stays in the optional lab. |
| L21 | Follow task selection, one factory call, one full-batch prediction, original positional pairing, and final sort. Move the long task catalogue into a supporting reference while required mechanics remain visible. | Supplied sentiment scores are fixed integration fixtures. A high score establishes no urgency or suitability for ship reports. Real pretrained download/pinning/disposal remains an optional, separately identified path. The Sector 7-G handoff stays intact. |

All six lessons retain five phases, visible story/artwork, required skills,
exercise IDs, starter code, canonical solutions, numerical probes, original
check names, recall ordering, and earned endings. The module has seven
exercises because L19 includes the separate capacity incident. All seven
strict validators pass canonical solutions, starter rejection, and registered
misconceptions: 31 checks with visible artifact counts 3, 1, 1, 4, 2, 2, 2 in authored
exercise order. No dependency, model asset, persisted schema, or result-write
flag changed.

### Captured operands and transient inspectors

P04 now covers twelve exercise contracts across eleven families. Five new
contracts reuse the existing tokened host, bounded artifacts, stale-code
warning, rerun reset, and ordinary fallback. They add no saved-run definition.

| Exercise and family | Actual or supplied captured information | Inspection and limits |
| --- | --- | --- |
| browser-ml-tradeoffs: deployment-policy | Three local-conflict inputs and two complete boundary inputs copied before calls, paired with returned recommendations. The original boundary summary remains. | Select a probe and follow its decisive rule. Keep the authored reference separate from a wrong returned decision. Policy choices do not measure latency. |
| inference-pipeline: inference-trace | Supplied raw fields, requested reference ranges, actual values observed at predict, observed echo output, returned class/score, and the original separate cleanup probe. Four artifacts fit the existing limit. | Select a feature. Show reference scaling beside the observed value, then compare the strict class rule with the returned class/score. The ranges do not certify the implementation used them. Memory counts belong to a different identified call. |
| incident-tensor-leak: capacity-estimate | Supplied endpoint times/counts/budget copied before the function and its actual returned projection. | Select elapsed time, count change, rate, remaining capacity, or deadline arithmetic. Keep the continuation assumption and uncertainty about cause visible. |
| onnx-comparison: runtime-parity | Inputs and outputs observed inside the same first comparison invocation, plus its actual returned parity decision and simulated intervals. | Select an input position, compare the observed scores against inclusive tolerance, and retain a wrong returned flag. The clock advances by test steps and measures no device speed. |
| load-pretrained-pipeline: report-pairing | Original positions, text, supplied labels/scores copied before learner code, plus the returned queue before pairing/sort assertions. | Select an original report and inspect matching returned rows, rank, label, and score. Wrong pairings, duplicate texts, or missing original text remain visible rather than being replaced by reference rows. |

Readers validate known titles, columns, row order, bounded strings, finite
numbers, required groups, and shape-specific invariants. Known corrupt groups
fall back to ordinary output. Useful failures retain their actual values and
separate references. Startup and model loading retain ordinary actual metadata
output rather than inventing missing event histories or a loaded model record.

### Confirmed grader and accessibility repairs

The existing model-loading ownership check now also supplies a throwing
metadata getter. A helper that disposed only on success previously passed all
three checks. It now fails the same third check while the canonical helper
passes and the earlier metadata table remains available. Check names, starter,
solution, original architectures, and capture roles stay unchanged.

Read-only Worker probes showed three ONNX misconceptions passed both existing
checks: stopping TFJS timing before awaited readback, timing ONNX loading, and
leaving TFJS input/output tensors alive. The same first check now observes
phase events, recorded clock pairs, and actual temporary disposal. The two
session-factory probes take turns so their wrappers cannot restore each other
early. No extra prediction or fit was added. Four focused regressions reject
the three variants while preserving both useful tables, and accept an
array-readback alternative. The Worker locks Tensor prototype methods, so the
test observes the instance readback with an own property descriptor.

The actual two-editor L19 route exposed duplicate region names in both result
inspectors and output containers. Titled multi-exercise hosts now provide
exercise-specific accessible names. Ordinary fallback output also uses its
exercise title. Existing single-exercise names and all IDs/state remain. A
two-inspector axe regression, shared output/saved-run tests, and both real L19
workflows pass after this repair. It changes presentation without remounting
editors or adding a new navigation/gating state.

### Runtime and technical evidence

The actual authored-example harness passes 92 groups, including 22 Browser
Runtimes groups and all 71 earlier groups. The existing inference group
counts in both sets. It executes real CPU tensor work,
loads the unchanged serialized model through controlled in-memory IO, and
uses declared local substitutes for fetch, storage, sessions, clocks, and
pipeline factories. Every group returns to its starting tensor count. The
initial full run found a test-only tensor allocated inside a disposal
assertion. The final harness owns and releases that probe explicitly.

The new result decoder/Worker suite passes 25 cases, with five canonical and
five useful-failure runs. The result UI suite adds six cases, including two
simultaneous inspectors. ONNX timing/cleanup adds four regressions. The broader
activity, shared-flow, recall, and writing/answer-leak command passes 464 tests
across eight suites, with no unhandled errors. A wrong-readiness test initially
left its rejected fixture promise unhandled. Its final mutation still skips
awaiting readiness, but handles that rejection so the Worker can report the
intended grading failures. Shared output/host/saved-run verification passes 43
tests across four suites. These scopes overlap and are not a unique total.

The pinned runtime checks use TensorFlow.js 4.22.0 and the current installed
ORT Tensor implementation. Transformers tests execute the installed
TextClassificationPipeline over controlled logits, without a pretrained
asset download. Root package/lock declare HF 4.3.1 while installed HF resolves
4.3.0. The separate runtime-lab package pins HF 4.3.0 and ORT 1.29.0, while root
ORT is 1.30.0. Those scopes remain explicit. No fresh-install, actual-device
benchmark, real pretrained-quality, or executed real-lab claim follows.
Web/UI typechecks, targeted lint, lesson-code parsing 157 blocks, formatting,
and diff/punctuation checks pass.

### Browser evidence and retained first attempts

The final six-lesson preview passes 90 phase checks, 18 expanded interactions,
18 scoped axe scans, and 126 screenshots at 1440px dark/default motion,
390px light/reduced motion, and 320px dark/reduced motion. It has no page errors,
console errors, failed requests, or page overflow. Evidence is in
`test-results/course-clarity-browser-runtimes/results-final.json` and `final/`.
All 31 selected served raw product files and all six compiled lesson objects match canonical source, recorded separately in `served-source-verification-final.json`. The initial preview's three failures were the same obsolete L18 Challenge
sentence matcher. All 18 interactions already passed. Its 87/90 result and
screenshots remain in the first-pass files. Updating that matcher changed no
product teaching or required assertion about visibility.

The isolated inspector matrix passes six width/theme settings with 126 scoped
axe scans across existing and new states. It checks selected operands, wrong
outputs, stale state, control resets, native focus, and no page overflow. It
uses predetermined typed captures, separately from Worker tests. Evidence is
in `test-results/course-clarity-results/browser-runtimes-final/`. The first
attempt prepended a context artifact to the four-artifact inference fixture,
exceeding the unchanged shared cap. The fixture now adds context only when
space remains. Initial failures and the first three settings that passed
after that correction remain in the separate first-pass directory. The later
multi-editor naming change has its own UI and actual-route verification.

All five new contracts pass real signed-in browser Worker workflows with
fictional local Alex and seeded prerequisite rows, in
`test-results/signed-in-results/browser-runtimes-final/`. The cases cover
390px light and 320px dark, starter rejection, canonical outputs, saved
completion, control reset, useful failed outputs, stale edits, and 10 scoped
axe scans. Both L19 editors must pass before the saved-completion assertion.
The initial policy, parity, and report cases passed, while both L19 cases
exposed the duplicate names repaired above. That first evidence remains in
`browser-runtimes-first/`. Screenshots contain result regions with the optional
GitHub nudge dismissed and caret preserved. No auth trace, video, automatic
screenshot, real learner account, or remote write was used.

### Production build and remaining work

Final isolated content and web production builds pass in
`test-results/course-clarity-build/browser-runtimes-final/20261110T142941534/`.
The copy contains 5397 source files, zero environment files, 144 dependency
links, and 19 workspace links retargeted inside the copy. All 75 selected product,
model, package/lock, and harness files match canonical source at verification
and the copy manifest. That complete-build set includes eight concurrent
workspace files outside this task. The separate
`curriculum-source-verification.json` confirms all 67 selected curriculum
sources still match. Concurrent marketing changes are not attributed to this
batch. All 56 canonical compiled lesson objects match the fresh build
by moduleId/slug. The unchanged canonical renderer/story command passes from a
sanitized environment. Reports and its prior-report archive are linked from
`final-gates.json`; complete output is retained in `all56-story-renderer-final/`.

The earlier pre-accessibility build passed at `20261110T142129308/`. The next
build compiled the accessibility fix, then caught two invalid Testing Library
option types in its new test. Removing those unsupported options preserves
exact string-name matching. That failed build remains at
`20261110T142628012/`; the final build and typechecks pass. No live review
runtime was modified by the isolated builds. The review source was separately
refreshed before final browser checks.

These internal checks establish 25 bounded slices and twelve transient
contracts within their stated scope. Thirty-one lessons remain unstarted.
Continue with the five Signal Processing cards L22-L26, counting the existing
L23 slice as a revisit. Full mission data/model continuity, shared source
metadata, remaining result families, wider feedback/transfer work, before-change
media, and independent learner/reviewer evidence remain open. All 56 full cards
and the separate 219-lesson draft-world discovery scope remain open. Older
review-manifest hashes stay unchanged. No learning-improvement percentage,
fresh-install equivalence, or deployment claim follows.

### Fifth-batch bounded source snapshot

Recorded after final runtime, browser, type/lint, renderer, and isolated
production-build checks. These 111 cumulative curriculum product/test/support
hashes identify this work. All 231 earlier hash entries from the 19-, 56-, 68-,
and 88-file snapshots remain as history. Concurrent landing-page, teaser,
analytics, and marketing-plan changes appeared in the shared workspace. They
were left untouched and are excluded from this curriculum attribution. The
production build records its complete workspace copy separately. This snapshot
does not refresh the inherited review manifest or establish learner outcomes.

| Source | SHA-256 |
| --- | --- |
| `apps/web/app/components/__fixtures__/lesson-results.ts` | `8f684aa5baf29fea2270e0251542320e707a4e0cdc3366722c147890c5cbd2df` |
| `apps/web/app/components/__fixtures__/runtime-results.ts` | `43645e14b177e5bb95924c3f231c4ad20b8b0b9f1eff9dbb581f4981f1b8e7b4` |
| `apps/web/app/components/lesson-result-exercise.test.tsx` | `64b9a34f305030abaf791c568064fb8d2432a2094d3169404d22a374a86a9c70` |
| `apps/web/app/components/lesson-result-exercise.tsx` | `3403ccb13589a71ef8c23942a0e052609a9e9994e382121c4e44799e52483d59` |
| `apps/web/app/components/lesson-result-explanation.test.tsx` | `6180c37b30491092e98713ba135c7ab94a5d2d2c04f3760b4f90c670a715d275` |
| `apps/web/app/components/lesson-result-explanation.tsx` | `8cd46a0e1a2f7a62e441f0185ef9f47af8cf6d385456faf8c14ca07ea1246da5` |
| `apps/web/app/components/lesson-visuals/browser-policy-setup-investigations.test.ts` | `2390d8c9c204b10d31d594dc022eed1cfc3f66134a3bfa352a00f4217bd7f695` |
| `apps/web/app/components/lesson-visuals/building-network-investigation.test.ts` | `320b2e6504a87ee82c2c5e0ae7139e46220757061d60960f16c203617d16d0ce` |
| `apps/web/app/components/lesson-visuals/data-loading-investigation.test.ts` | `9e441840ee04b2efbb2c79f2ac8a53418d2b4b9eb608dc2483eb62886419fb4d` |
| `apps/web/app/components/lesson-visuals/deep-orbit-visuals.ts` | `de90b0024a46501c88c27963a9a23f4c69a73ea2bca9c97c3d27cb98c20a3e8e` |
| `apps/web/app/components/lesson-visuals/evaluation-investigation.test.ts` | `5a8ceb36fb42ebd6e2cad8dfb74df7dfd5faa756467746dacc4e5b7ed7664e86` |
| `apps/web/app/components/lesson-visuals/flow-investigation-contracts.test.ts` | `9f2ab95def73d09ecf86dbe01b01fabde87c968074f480b90d48fb07194dc9ea` |
| `apps/web/app/components/lesson-visuals/flow-investigations.ts` | `0b79fbd999e3694435cfba9b3997297141c8dc644b41d9690faaa7d665eed36c` |
| `apps/web/app/components/lesson-visuals/lesson-handoffs.ts` | `ee8d2d681e48a3aea6e02f7bcaadfea84267ab59d9b3e1e0b2daab92f0a041fe` |
| `apps/web/app/components/lesson-visuals/lesson-investigation.css` | `bc9a76bca6f2894877ec9df3ab3c9d86a146fd479a32b017db603dc4d0deb797` |
| `apps/web/app/components/lesson-visuals/lesson-investigation.test.tsx` | `a024c0ed47bd9fcb73003419e82472b859e5ddedae13833be3c7936e5514b6f9` |
| `apps/web/app/components/lesson-visuals/lesson-investigation.tsx` | `b6c8294ee1ffdc077084137cdaaf56b6dcd45392fc58d68aa2341e156bf26083` |
| `apps/web/app/components/lesson-visuals/lesson-investigations.test.ts` | `02e0b8619fb868107e4c877b19066535d8daaa7940303efdbced0f8aa3d32934` |
| `apps/web/app/components/lesson-visuals/lesson-visuals.test.tsx` | `cdc47a1b3b25bda9a194245d45604a11bafcf5852b78f38fe6564a96f44dee0b` |
| `apps/web/app/components/lesson-visuals/loading-inference-investigations.test.ts` | `cb8e9395b6c34ea5adcefc95b52f38f0ea09727cc013887e47606dea6e85ee51` |
| `apps/web/app/components/lesson-visuals/loss-gradient-investigations.test.ts` | `3807a16c4805e06691b06c21dbe3fafb7fb63466162e014668cfa8785d563c25` |
| `apps/web/app/components/lesson-visuals/lstm-investigation.test.ts` | `a645bb00d3fc7877e95179e54359c698f7365193d7d784d6147853a2f9dcd53a` |
| `apps/web/app/components/lesson-visuals/network-shape-investigations.test.ts` | `d60cee6dc835159cce9b2073b044ccc4dc0fd0be0682f5daf27d9df8c50ba90d` |
| `apps/web/app/components/lesson-visuals/neuron-activation-investigations.test.ts` | `c62ab38a82cc13fe692a842355e2061d5aead36d1cbe5be3c351e15cbb77de62` |
| `apps/web/app/components/lesson-visuals/normalization-investigation.test.ts` | `0ef9ec8055a5bab523b0ee8775f9ae4c1f8b34d1e3ed64af669864776d926f33` |
| `apps/web/app/components/lesson-visuals/numeric-investigations.test.ts` | `1aefc0f6b890a449c606e6b45088bab654b92ff9245bada7ba9cd4c61d808fc1` |
| `apps/web/app/components/lesson-visuals/numeric-investigations.ts` | `95057a32f42ddd9e80bf03477492a423365c6442406da38ef07eae06a56174d1` |
| `apps/web/app/components/lesson-visuals/rag-retrieval-example.ts` | `291c38e425f95a1ffae3548a9441b84c5e9dcc8d4cf29e9d0b2170b8d2efad1f` |
| `apps/web/app/components/lesson-visuals/runtime-comparison-report-investigations.test.ts` | `24387440f5976e4302b9ad64052bc22a5205f4bed5bba8dd589b881fc99e05b1` |
| `apps/web/app/components/lesson-visuals/tensor-investigation.test.tsx` | `e41e538f0d1f0c38821068bc81db58b4e991fb60753a8bcb5a0d14166cbf21ce` |
| `apps/web/app/components/lesson-visuals/tensor-investigation.tsx` | `44cf970deb141c4b48f4dc5af87d11718ddc2ad50188dbeefb47a627ee8673d9` |
| `apps/web/app/components/lesson-visuals/tensor-operations-investigation.test.ts` | `8c7d0103f89408594b119d49d5869686db5f5c110786632cf821e661551bc844` |
| `apps/web/app/components/lesson-visuals/training-loop-investigation.test.ts` | `b7f8c5daff17ee37c36365374cc39ddf3833cde4dc01038693a63b9ed60d61cf` |
| `apps/web/app/components/mdx/channel-layout-experiment.css` | `fe62e5078858c73fa8dcc012be16b2e66e93fd6a702bb0ad8125fdd2ef64085f` |
| `apps/web/app/components/mdx/channel-layout-experiment.test.tsx` | `c9f24845d2bf24ed77b58e65dc3ab47dccdda549d7ce0701ca91ab53a46e1354` |
| `apps/web/app/components/mdx/channel-layout-experiment.tsx` | `b4a5dbec5305f595fd347ba44c7d76207d616d338ddf1371a4a8915ef022866c` |
| `apps/web/app/components/runtime-result-explanation.test.tsx` | `d8f6ce68cf5f04726194665e4da8041336940c48001e954243280c2567f2c852` |
| `apps/web/app/components/runtime-result-explanation.tsx` | `5cc065720e0a96500d3418b9db9e7f44f6f3f50c2407fc0097fe5ad4a86ee538` |
| `apps/web/app/components/training-result-explanation.test.tsx` | `067103e1fc0c028d1897a746b0648e442a758ee50c4d5fc1becb72dad3a29498` |
| `apps/web/app/components/training-result-explanation.tsx` | `a4cdc067d7b2a9599cab3a2e02f52fe3267c5c870ae9e5481a0c13ee8a96ec0c` |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx` | `5634b0a8e92bd11420bd4ec216351ba8c9fd11ff1ff3173f42afba4e5209a00a` |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx` | `6e2a2af4151d14ae1e9f3421bb1bcb180752f90f3756f7219ca2ea9da610cc49` |
| `apps/web/lib/lesson-result-explanations.test.ts` | `86569d31797de61acd1f09d7038a16057753711a5190a082f1d526e40baab5a6` |
| `apps/web/lib/lesson-result-explanations.ts` | `c7776379848488984e9cc6c450dceabe4defc4bc7458d5c1d89bf8dd0f6cb65a` |
| `apps/web/lib/runtime-result-explanations.test.ts` | `a64fb516fcdb14def5163ac3cb281ac94e1af4e3db3247b11e0d37dcc997aa56` |
| `apps/web/lib/runtime-result-explanations.ts` | `b90da8f9bb3e5004b3cf34557f6bd1a7353004f2645ede1f35fda45d1e9744aa` |
| `apps/web/lib/training-result-explanations.test.ts` | `43e4e00feced5aac846fc6f5b45280c38ab5a1757589caf2d50aa514b5c7c71f` |
| `apps/web/lib/training-result-explanations.ts` | `363543261754552ef511603500e5133fe27f2165cf7c9a1a713b6bf2b5f96e8b` |
| `docs/design-previews/research/deep-orbit-result-map.md` | `f5087b44193a27f6acf6a02f2f96d4a0d22fa130a19b73daf13cbac0df777c77` |
| `docs/design-previews/research/result-contract-matrix.json` | `b8c81fc0b3cdc1a23197de2ec35bb7d5957b736f62ad84b5ad1528d1408cc3a8` |
| `e2e/exercise-run.spec.ts` | `bb6b560fb03d158b2cd97944fe0bb89f5c4881ac9c75387d6a837e01e35ccfd6` |
| `e2e/fixtures/lesson-result.tsx` | `133bd2f7fd27f42977595831d7a46b7eb939ad8de5f4a47aea84db9b444e91df` |
| `e2e/helpers/local-review.ts` | `d24ecaf8f1598bf5c6aded30a9ff2523ecf18f3687089e01390a1211522b966c` |
| `e2e/lesson-continuity.spec.ts` | `b0130e1c75eefb34ec482c118af3f491c8a977173606fcf35b516f2a02236a72` |
| `e2e/lesson-result.config.ts` | `37a5918bfddaeeb061f2c6bd758793f9d07695f033463770ae3755e918af96b2` |
| `e2e/lesson-result.spec.ts` | `b99ca48e21eb0692944f72c1c707bc81523f6c580a8a9835a12e837d74ec0153` |
| `e2e/signed-in-evaluation.spec.ts` | `034fd50a8ffd4797b2408dcd46721751d120bd153daad311581fb20404e97ac5` |
| `e2e/signed-in-forward-result.spec.ts` | `ff14cb9dcc7ddde9876416a2e32635940ba9120aab8a1503df3d03c705ac0dcb` |
| `e2e/signed-in-lesson-results.spec.ts` | `75d14f97a94c45f7ec017c4d174062eb1db1e8928a75ac88771feba8ba1fe34d` |
| `e2e/signed-in-runtime-results.spec.ts` | `40ccf922874eb77223b448fa7333b569d982902671824f85810075e051d986cb` |
| `e2e/signed-in-training-results.spec.ts` | `4ed36e391a14da7c6ea2727c49c2c2162e0e7cb6113e7169a7640b1648837f7c` |
| `packages/content/__tests__/backprop-restoration.test.ts` | `9001be7b018bfae9ab8a89e780ce4928b478d35634d1b6febe828d0eb0ffd2d6` |
| `packages/content/__tests__/deep-orbit-recall-checks.test.ts` | `567b75cdf2fcdb4a4a2242992715dde9ff8a98b6af46f27437f85007779003ff` |
| `packages/content/__tests__/evaluation-gap-boundary.test.ts` | `e5937eaf1bf022dda10ea7def3baba906d4de6d0fc653d5515dd7ef40761ca71` |
| `packages/content/__tests__/foundations-continuity.test.ts` | `f937bb02191a08e0537daba89c4bb859a8c8e0acc398d64c7bfbea82dda07d2a` |
| `packages/content/__tests__/onnx-comparison-boundaries.test.ts` | `87d7da51897bdf0d399e786006a34c4202117c1cbbfa98bcdde708d9cf404eae` |
| `packages/content/__tests__/training-loop-diagnosis.test.ts` | `113242ed36a75bc024fa3d8f0d500dadd78cf91d601aa044477b601aa48fe62f` |
| `packages/content/content/deep-orbit/browser-runtimes/01-why-the-browser.mdx` | `8693ef5eef3eac8b20753f24640435c7747eaf29a85ca705553f2796e2c053ad` |
| `packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx` | `2740f8f6f164b64f1819f42a5285763d26bcb9aa99ecf8396348076cd7cae861` |
| `packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx` | `e7bdeed7b4eb75a998d2f5e43216d4f5192ba11b0c36a0fbd7e85651b72f1976` |
| `packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx` | `bd0242c15f226c66ec7691ed370d01d891dfa63e0a20505c12c0544acce7a926` |
| `packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx` | `d18a3746e665aa11060b2b09ff69ab70df5b9b9f76265aa0204e1aaec5ab16ec` |
| `packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx` | `5d38f1f8f6e76d38d61c4e729f5ee9a6a9470819986d8910d75b1bb391b74d39` |
| `packages/content/content/deep-orbit/browser-runtimes/exercises/browser-ml-tradeoffs.yaml` | `1b510e56b07bf068d6a84467026063cc98db253c5b60fff267b24f4cdcf9a04c` |
| `packages/content/content/deep-orbit/browser-runtimes/exercises/incident-tensor-leak.yaml` | `55a746b1869c6303a18667976fabb03e0cdb8ae61abcd709dd20815d46ba324f` |
| `packages/content/content/deep-orbit/browser-runtimes/exercises/inference-pipeline.yaml` | `bc22292a377bb003309f7b456dabd1b56a95927d2c91875a6acf7d3fce924c1e` |
| `packages/content/content/deep-orbit/browser-runtimes/exercises/load-model.yaml` | `08c4e27c327324d64e36a6bac7a6994d28fc40db7ccd0cb96f4e348e3eb54ca3` |
| `packages/content/content/deep-orbit/browser-runtimes/exercises/load-pretrained-pipeline.yaml` | `918e2a085233a39ffc59d8325409a07047ee7d58ba0efa4af259186e61e08785` |
| `packages/content/content/deep-orbit/browser-runtimes/exercises/onnx-comparison.yaml` | `2c0139caab73e3d7f01d406a969e7ab186ab7a4dccea60038a29bceeeaa85d42` |
| `packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx` | `4265023fcfe25cf087a8f94d44288b95badf74955a8c2bef714ef0863df39e26` |
| `packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx` | `516ebdcaf3230ba599f9b3fb46321461dbd14a577007e36419f7ae661ddee3f8` |
| `packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx` | `aad9cbc0f696a315061bdf3f8911a190a11b11be8cfaa8eca057eef6933a5b07` |
| `packages/content/content/deep-orbit/foundations/04-data-loading.mdx` | `9ec273078a9e1fa7f6b6d487d41ab62d6b2a040a8a31fa3caadcdc03d9e01092` |
| `packages/content/content/deep-orbit/foundations/05-normalization.mdx` | `0868261463890664989de0796e8f82771959fe35e1f4bf1af13e8147ac086677` |
| `packages/content/content/deep-orbit/foundations/exercises/add-tensors.yaml` | `e630ae8c69d38c24e9bfd041aba748b772e903ed334efcb2bf248739120ec31c` |
| `packages/content/content/deep-orbit/foundations/exercises/batch-data.yaml` | `cf8f5d36362fa83e9a37de7bbbb5e6c7311c8fec015c3d8071b759a3deb9f8cb` |
| `packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx` | `bd05a0d137fc3bceb987c2f3bf7dba835751dbb0d8afe5c0b4a9cd0b319ef19d` |
| `packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx` | `3fa5cf9b3a35c9c4967fd15f0eed607bc9174f0b27a186ec21494e328e8e5872` |
| `packages/content/content/deep-orbit/neural-networks/02-activation-functions.mdx` | `35e7cd1f182cc83fd33e126026383de7a00f2dd606dd4c61d355bad769c83675` |
| `packages/content/content/deep-orbit/neural-networks/03-layers-and-architecture.mdx` | `17580c383e6c9b4f6347e0558cf21aa0c1f4941b880818b0c61e48dac88c1bf6` |
| `packages/content/content/deep-orbit/neural-networks/04-forward-pass.mdx` | `fa76c9bb00d6ccc643235d528754fd19339e1ec5be6b77ea1ab44538e2681b52` |
| `packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx` | `2566e3cfe06312ecd978ac87c5c1850cd2f7fcdaa2f235d3c3b0ca94a1c7043c` |
| `packages/content/content/deep-orbit/neural-networks/exercises/forward-pass.yaml` | `fbf101fc005c5c4355486f916b844108abb504fbe13401301213a436df26c38a` |
| `packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx` | `c02dce7c7343abc90abbfe99a87970ff7b902a87e23c713b4a0aa37e66a69513` |
| `packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx` | `43ec8cf5752145604e54a40b9390eeac1f8f395798c7b069c540a7eea13ef395` |
| `packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx` | `1bcd932dcb7c058acf70eef1fa6c25881096a3cce9acfbac6512f9e686fe7add` |
| `packages/content/content/deep-orbit/training-loop/01-loss-functions.mdx` | `5caa5727c3d3c571c3df578a5aba5505acb48365a02324c12effc6b7da2ee6d4` |
| `packages/content/content/deep-orbit/training-loop/02-gradient-descent.mdx` | `d6ea95f1c09f662d07d18db582e2d036b09e63a516361a0c9cba4362d221e0ce` |
| `packages/content/content/deep-orbit/training-loop/03-backpropagation.mdx` | `3eefd31154f5bc50b01eb2449e06d31be49922a13183224a398855c136617139` |
| `packages/content/content/deep-orbit/training-loop/04-training-loop.mdx` | `ee7a96747ba06b0c632c1fbc0ec1e651dac5cded4b7c5ece270c848cd134b7d1` |
| `packages/content/content/deep-orbit/training-loop/05-evaluating-deep-scan.mdx` | `6a54242107d64ff193289c7a2906fca6b55969d21020dafbf60eb01bf5803d76` |
| `packages/content/content/deep-orbit/training-loop/exercises/backprop-chain.yaml` | `f2d9533943d6f0a0824f2eb1b9858945b823543315f9ea4508b62e769baf7c0e` |
| `packages/content/content/deep-orbit/training-loop/exercises/deep-scan-eval.yaml` | `e82a3a5ca0a4f87873248babd7cf4c3fa7df142c0f628b31314c34905fcaa6b6` |
| `packages/content/content/deep-orbit/training-loop/exercises/gradient-step.yaml` | `c4ec8788dc33c72d86f6c6af8680a8de6a0523e735e7ab734caa00dd2e2213fa` |
| `packages/content/content/deep-orbit/training-loop/exercises/mse-loss.yaml` | `8e45e025151722b96a69b34085fc43370884047e3c24fa5d7092bd9f3934450c` |
| `packages/content/content/deep-orbit/training-loop/exercises/training-loop-exercise.yaml` | `59266a171d043599f409a33ad300512ebf5a703edba47596ca445444a82d6064` |
| `packages/ui/src/mdx/exercise-output.test.tsx` | `5d3596562c3a2b0576e6882c46367f9f8449614cc8721448ad1c41176966c935` |
| `packages/ui/src/mdx/exercise-output.tsx` | `a40ee9a8aa958b8a41d50910abe4c2e9264617955ae571d8a58d3f55ce1e8821` |
| `packages/ui/src/mdx/exercise-saved-runs.test.tsx` | `5f1b3512e04da773f15aa9c6440eac7712b47aa9e821b19981d68901fbb81ca7` |
| `packages/ui/src/mdx/exercise.tsx` | `32f15958afa39a5d8bb4e08e32d2765f398431ca73bc4eb3c6e61cd2714040e7` |
| `scripts/check-reviewed-examples.mjs` | `4d396fe1a29ab7a4e4a507fa2b54772ce1d2f83d78f2d7f9423127518cea1ca7` |


## All 56 lesson revisions and final integration

Completed November 10, 2026. This entry supersedes earlier statements that 31 lessons were unstarted or that the shared source metadata and task navigation were only planned. All 56 Deep Orbit lesson files now contain their clarity revisions. The original 65 exercise references remain in their authored order. The separate 219 coming-soon lessons have not been revised in this delivery.

| Package | Final delivery state |
| --- | --- |
| P00 | Inventory for all 56 lessons and 65 exercises reconciled. Historical hashes retained and a final bounded source snapshot added. Before-change media that was never recorded remains unavailable. |
| P01 | All 56 original source/fixture contracts reviewed and identified. A unified mission-data/model migration remains a separate curriculum redesign. |
| P02 | Source identity, kind, selected scope, order and units render for 54 shared activities. The two custom opening activities retain their own source contract. |
| P03 | All 56 lesson revisions implemented. Required mechanisms precede optional supporting material. 128 executed example groups cover all 56 lessons. |
| P04 | 16 transient exercise contracts across 15 families, plus the existing three specialized paths. Ordinary captured output remains available for other contracts. |
| P05 | Graded feedback, changed cases, recall, useful failures and assistance boundaries verified. Existing independent assignments remain separate. |
| P06 | Authored-order task outlines, matched titles, stable anchors and return links delivered. Finale navigation, draft recovery and all-three-pass gating verified. |
| P07 | All 56 Deep Orbit lesson revisions delivered. No unstarted lesson revisions remain in this scope. |
| P08 | Final source, exercise, example, browser, renderer, type and isolated-build checks complete within the recorded scope. |
| P09 | 219 coming-soon lessons remain a separate discovery/release workstream. |
| P10 | Independent learner studies and measured learning outcomes remain pending. |

### Teaching and source decisions

The final pass completed Signal Processing, Recurrent Networks, Anomaly Detection, Advanced Time Series, LLM Integration, Optimization and Capstone, including the earlier reference revisits. Each main explanation now follows a selected operation, input or decision from the lesson's actual exercise contract. Required teaching stays visible before optional application sketches and supporting derivations. Existing story, dialogue, art, recall and secondary-task boundaries remain.

The 54 shared investigations expose an authored source identity, kind, selected scope, ordering and known units beside Current inputs. Case scope comes from the same case definition that chooses the values. The two custom opening activities keep their established recording identities. Controlled startup, sentiment, forecast and timing examples make no device, science or elapsed-performance claim.

Signal activities now preserve raw FFT magnitude, eligible bins, frame starts, feature order and symmetric Hann weights. Recurrent activities expose window/target membership, actual recurrent weights, gated cell updates and clamp-before-feedback. Later modules expose screened training rows, per-feature reconstruction error, validation thresholds, independent detector votes, key/value attention, positional scoring, forecast histories, Kalman uncertainty and prior-error ensemble weights. L22's allowed illustrative cutoff range is 0.5 through 20 because float64 reference accumulation and TFJS float32 FFTs can differ at a zero cutoff. L28 describes derivative-factor magnitude, including negative recurrent weights.

The LLM and optimization revisions separate parsed structure from supported scientific claims, preserve review flags, match raw preprocessing contracts, use each kernel's quantization bounds, preserve constant kernels and biases, inspect pooled pruning cutoffs and per-class recall, and track cache identity and backend readiness. Their runtime proofs check actual pinned TFJS operations, restoration/cleanup and useful failed outputs.

Capstone teaching follows the eight-sample composition, the five-row behavior gate, the separate 209-parameter/836-float32-byte export, supplied monitoring logs, and the card's source metadata. Branch scheduling, classifier compatibility, sample/channel meaning and release-card scope stay visible before optional references. The composition result comes from the async-middle alternating window `[0.4,1.2,0.4,1.2,0.4,1.2,0.4,1.2]`, separate from the first worked eight-sample probe. A final tensor does not observe all internal handoffs. The launch project supplies a training starter, without pretrained weights or a build command. The author estimate is 25 reading minutes plus 50 exercise minutes, with the optional project separate.

### Actual output and navigation

Four new transient readers extend the earlier twelve contracts: `compute-fft`, `build-spectrogram`, `pipeline-architecture`, and `write-model-card`. The spectrum capture identifies its returned bin center but contains no full spectrum. The frame selector reads actual captured 40 Hz magnitudes at four frame starts. The composition selector preserves actual returned magnitudes beside a separately labeled JavaScript reference. The card selector preserves an actual returned text line beside its supplied metadata and formatting calculation. Unsupported, partial or ambiguous groups retain ordinary output. No reference calculation replaces an actual result.

The forecasting capture adds three bounded reconstructed reference windows beside actual returned rollout/replay predictions. Those windows do not observe actual prediction inputs. The Kalman capture records actual prior and stored state beside separately computed reference variance/gain. Neither extension adds a fit, prediction or filter update. No persisted schema, registration, storage scope or write flag changes.

All 8 multiple-exercise lessons now use authored MDX reference order for task outlines. Briefs and editors share matching titles and stable links. The finale's two mobile routes verify six unique brief/editor anchors, keyboard focus, independent drafts, retained output during navigation, all-three-pass completion and reload recovery. Reload restores drafts/completion, while transient captures retain their existing current-tab lifetime. A stable empty exercise list also preserves the existing scene-only rerender identity contract.

### Verification and practical limits

| Verification | Final evidence |
| --- | --- |
| Exercise execution | 65 strict canonical solutions pass 576 checks and produce 106 visible outputs. Untouched starters and all registered misconception solutions fail appropriately. `test-results/course-clarity-all-lessons/exercises-strict.log`. |
| Taught examples | 128 selected runtime groups across all 56 lessons pass with no retained TFJS tensors. Controlled callbacks/clocks verify startup and timing orchestration without measuring hardware. `reviewed-examples-delivery.log`. The runner now inserts line boundaries so a trailing authored comment cannot swallow verification code. |
| Preservation | All 65 starter executable bodies and canonical solutions match HEAD. 64 starter strings are byte-identical. The evaluation starter changes only its misleading source comment. Every original literal named check remains. Model assets and lockfile remain unchanged. `preservation-proof.json`. |
| Activity and content tests | 2,187 assertions pass in the bounded 135-file command. Its only remaining failure was the repository-wide binary-file scan exceeding its 5-second test deadline during a concurrent build. Both assertions in that file pass on an isolated rerun, covering all 2,188 selected assertions across the two commands. 65 heavy/corpus cases remain intentionally skipped in that command and have separate strict/Worker evidence. The original failed logs remain. |
| Test readiness |The initial cold lazy-editor test could exceed its default 1-second query wait in a broad run. Its scoped query now awaits the existing lazy chunk for up to 5 seconds. Product Worker budgets remain unchanged. Saved-run coverage passes 22 tests and the corrected case passes in the full command. |
| Actual lesson browser sweep | 56 lessons, five phases and three settings: 1440 dark with motion, 390 light reduced motion, 320 dark reduced motion. 840 phase checks and 162 expanded shared-activity checks pass, with 162 scoped axe scans and zero page errors, console errors, failed requests or page overflow. `browser/complete.json`. |
| Result presentation |Six viewport/theme settings pass 150 scoped axe scans using predetermined captures. These fixtures execute no learner code. `test-results/course-clarity-results/all-lessons-complete/`. |
| Actual signed-in Workers |All four new capture/decoder/viewer paths pass on the isolated paid routes at 320px dark. Both finale workflows pass at 390px light and 320px dark, including all three real exercise runs and draft recovery. Auth uses only fictional Alex in the isolated local service, with no traces/videos. Evidence: `test-results/signed-in-results/all-lessons-final-fixed/` and `launch-final/`. |
| Type/lint |Web and UI TypeScript checks pass. New source has zero ESLint warnings/errors. The wider changed-file lint has five pre-existing warnings in the two lesson framework files and no errors. |
| Production and story rendering | The final isolated content/web build passes. 115 selected product/package/model/harness sources match canonical raw bytes and its source manifest. All 56 compiled lessons match by module/slug. The unchanged production renderer/story gate passes 112 desktop/mobile lesson checks. `test-results/course-clarity-build/all-lessons-final/20261110T160713797/final-gates.json`. |

The final build copied 5431 safe source files, read zero environment files, reused 144 installed dependency links and kept 19 internal workspace links. It establishes the installed dependency environment rather than a fresh install. HF 4.3.0 remains installed against declared 4.3.1, and the separate runtime lab retains its own pins. No production deployment, real pretrained download, target-device benchmark, runtime ranking or learner-improvement percentage is claimed.

The final sweep found two 320px feedback overflows caused by long unbroken numeric predictions. Wrapping feedback preserves the full values and fixes both. Read-only review also caught the moved client directive, an omitted-exercises remount, a composition wording overclaim and the L22 zero-cutoff precision boundary. Each was corrected before the final source sweep. The first draft-reload browser assertion also needed to reveal CodeMirror's virtualized final line. It now checks both the persisted owner-specific draft and the restored editor.

Story review preserves the missed capture, unresolved sample 7741, 73.4 Hz, accelerating intervals, fixed 0157 canary, thirty matching verdicts, two-minute rollout, optional decision, counterfactual records, 0213 entry and final `operator_note: none`. Shared source labels make diagnostic/fictional distinctions explicit. A unified mission-data/model migration and independent learner study remain separate work. The source distinctions and learning-gain limits remain explicit.

### Per-lesson final coverage

The runtime count below names selected executed groups, including clearly supplied integration inputs. It does not claim every optional network or hardware example ran on a device. Every lesson also has all five final browser phases, the source review, and its exercise's strict check.

| Card | Lesson | Exercise references in authored order | Active activity | Executed groups |
| --- | --- | --- | --- | --- |
| L01 | [From JavaScript Arrays to Tensors](../../packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx) | `create-a-tensor` | custom tensor workbench | 1 |
| L02 | [Understanding Tensor Shapes](../../packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx) | `reshape-tensor` | custom channel layout | 1 |
| L03 | [Basic Tensor Operations](../../packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx) | `add-tensors` | source-labeled investigation | 4 |
| L04 | [Loading and Preparing Data](../../packages/content/content/deep-orbit/foundations/04-data-loading.mdx) | `batch-data` | source-labeled investigation | 2 |
| L05 | [Data Normalization](../../packages/content/content/deep-orbit/foundations/05-normalization.mdx) | `normalize-data` | source-labeled investigation | 1 |
| L06 | [Your First Neuron](../../packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx) | `implement-neuron` | source-labeled investigation | 1 |
| L07 | [Activation Functions](../../packages/content/content/deep-orbit/neural-networks/02-activation-functions.mdx) | `relu-activation` | source-labeled investigation | 2 |
| L08 | [Layers and Architecture](../../packages/content/content/deep-orbit/neural-networks/03-layers-and-architecture.mdx) | `build-layer` | source-labeled investigation | 3 |
| L09 | [The Forward Pass](../../packages/content/content/deep-orbit/neural-networks/04-forward-pass.mdx) | `forward-pass` | source-labeled investigation | 2 |
| L10 | [Building a Complete Network](../../packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx) | `simple-network` | source-labeled investigation | 3 |
| L11 | [Loss Functions](../../packages/content/content/deep-orbit/training-loop/01-loss-functions.mdx) | `mse-loss` | source-labeled investigation | 4 |
| L12 | [Gradient Descent](../../packages/content/content/deep-orbit/training-loop/02-gradient-descent.mdx) | `gradient-step` | source-labeled investigation | 3 |
| L13 | [Backpropagation](../../packages/content/content/deep-orbit/training-loop/03-backpropagation.mdx) | `backprop-chain` | source-labeled investigation | 4 |
| L14 | [The Training Loop](../../packages/content/content/deep-orbit/training-loop/04-training-loop.mdx) | `training-loop-exercise` | source-labeled investigation | 2 |
| L15 | [Evaluating DEEP SCAN](../../packages/content/content/deep-orbit/training-loop/05-evaluating-deep-scan.mdx) | `deep-scan-eval` | source-labeled investigation | 2 |
| L16 | [Why the Browser?](../../packages/content/content/deep-orbit/browser-runtimes/01-why-the-browser.mdx) | `browser-ml-tradeoffs` | source-labeled investigation | 4 |
| L17 | [TensorFlow.js Setup](../../packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx) | `tfjs-setup` | source-labeled investigation | 3 |
| L18 | [Model Loading](../../packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx) | `load-model` | source-labeled investigation | 5 |
| L19 | [Inference Pipeline](../../packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx) | `inference-pipeline`, `incident-tensor-leak` | source-labeled investigation | 4 |
| L20 | [ONNX Runtime Web](../../packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx) | `onnx-comparison` | source-labeled investigation | 3 |
| L21 | [Transformers.js for Pretrained Models](../../packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx) | `load-pretrained-pipeline` | source-labeled investigation | 3 |
| L22 | [Time vs Frequency](../../packages/content/content/deep-orbit/signal-processing/01-time-vs-frequency.mdx) | `time-vs-frequency` | source-labeled investigation | 1 |
| L23 | [Fourier Transform](../../packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx) | `compute-fft` | source-labeled investigation | 1 |
| L24 | [Spectrograms](../../packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx) | `build-spectrogram` | source-labeled investigation | 2 |
| L25 | [FFT as Features](../../packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx) | `fft-features` | source-labeled investigation | 2 |
| L26 | [Windowing & Overlap](../../packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx) | `apply-window` | source-labeled investigation | 2 |
| L27 | [Sequences Matter](../../packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx) | `create-sequences` | source-labeled investigation | 2 |
| L28 | [Simple RNNs](../../packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx) | `build-rnn` | source-labeled investigation | 3 |
| L29 | [LSTM Gates](../../packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx) | `build-lstm` | source-labeled investigation | 4 |
| L30 | [Sliding Windows](../../packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx) | `sliding-window` | source-labeled investigation | 2 |
| L31 | [Sequence Prediction](../../packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx) | `predict-next` | source-labeled investigation | 3 |
| L32 | [Normal vs Anomalous](../../packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx) | `detect-anomaly`, `incident-baseline-drift` | source-labeled investigation | 3 |
| L33 | [Autoencoders](../../packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx) | `build-autoencoder` | source-labeled investigation | 3 |
| L34 | [Reconstruction Error](../../packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx) | `reconstruction-error`, `incident-missed-anomaly` | source-labeled investigation | 2 |
| L35 | [Threshold Tuning](../../packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx) | `find-threshold`, `incident-false-alarm-storm` | source-labeled investigation | 2 |
| L36 | [The Anomaly](../../packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx) | `ensemble-detector` | source-labeled investigation | 2 |
| L37 | [Beyond LSTM](../../packages/content/content/deep-orbit/advanced-time-series/01-beyond-lstm.mdx) | `simple-attention` | source-labeled investigation | 2 |
| L38 | [Temporal Attention](../../packages/content/content/deep-orbit/advanced-time-series/02-temporal-attention.mdx) | `temporal-attention` | source-labeled investigation | 2 |
| L39 | [Forecasting](../../packages/content/content/deep-orbit/advanced-time-series/03-forecasting.mdx) | `forecast-signal` | source-labeled investigation | 2 |
| L40 | [Kalman Filters](../../packages/content/content/deep-orbit/advanced-time-series/04-kalman-filters.mdx) | `kalman-filter` | source-labeled investigation | 2 |
| L41 | [Ensemble Methods](../../packages/content/content/deep-orbit/advanced-time-series/05-ensemble-methods.mdx) | `weighted-ensemble` | source-labeled investigation | 2 |
| L42 | [LLMs for Science](../../packages/content/content/deep-orbit/llm-integration/01-llms-for-science.mdx) | `llm-client` | source-labeled investigation | 2 |
| L43 | [Prompt Engineering](../../packages/content/content/deep-orbit/llm-integration/02-prompt-engineering.mdx) | `prompt-template` | source-labeled investigation | 2 |
| L44 | [RAG for Signals](../../packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx) | `retrieve-signals`, `rag-pipeline` | source-labeled investigation | 1 |
| L45 | [Report Generation](../../packages/content/content/deep-orbit/llm-integration/04-report-generation.mdx) | `generate-report` | source-labeled investigation | 2 |
| L46 | [Multi-Model Systems](../../packages/content/content/deep-orbit/llm-integration/05-multi-model-systems.mdx) | `model-pipeline` | source-labeled investigation | 2 |
| L47 | [Model Profiling](../../packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx) | `profile-model` | source-labeled investigation | 2 |
| L48 | [Quantization](../../packages/content/content/deep-orbit/optimization-edge/02-quantization.mdx) | `quantize-weights` | source-labeled investigation | 2 |
| L49 | [Pruning](../../packages/content/content/deep-orbit/optimization-edge/03-pruning.mdx) | `prune-weights` | source-labeled investigation | 1 |
| L50 | [Caching Strategies](../../packages/content/content/deep-orbit/optimization-edge/04-caching-strategies.mdx) | `inference-cache`, `incident-stale-verdict` | source-labeled investigation | 2 |
| L51 | [WebGPU Acceleration](../../packages/content/content/deep-orbit/optimization-edge/05-webgpu-acceleration.mdx) | `gpu-backend` | source-labeled investigation | 2 |
| L52 | [System Architecture](../../packages/content/content/deep-orbit/capstone/01-system-architecture.mdx) | `pipeline-architecture` | source-labeled investigation | 2 |
| L53 | [CI/CD Pipeline](../../packages/content/content/deep-orbit/capstone/02-ci-cd-pipeline.mdx) | `ci-cd-gate`, `export-model-artifact` | source-labeled investigation | 1 |
| L54 | [Monitoring](../../packages/content/content/deep-orbit/capstone/03-monitoring.mdx) | `model-monitor` | source-labeled investigation | 2 |
| L55 | [Documentation](../../packages/content/content/deep-orbit/capstone/04-documentation.mdx) | `write-model-card` | source-labeled investigation | 2 |
| L56 | [Launch](../../packages/content/content/deep-orbit/capstone/05-launch.mdx) | `verify-deployment`, `launch-rehearsal`, `classify-anomaly` | source-labeled investigation | 2 |

### Final source attribution

The [final bounded source snapshot](course-clarity-final-source-snapshot.json) records current curriculum product/test/support hashes. The 342 earlier hash entries remain unchanged above. Concurrent marketing, landing, teaser/video and analytics work remains outside this attribution. The broader isolated-build manifest records its complete workspace copy separately. The inherited review-manifest hashes remain historical, with no fabricated independent pedagogical renewal.
