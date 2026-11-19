# Result design against the lesson contracts

Research snapshot: November 6, 2026. Baseline commit `8550adf771db`. This is design research. No lesson, exercise, runtime, or assessment was changed.

The feature should make the learner's contribution inspectable within the crew's ongoing task. The strongest next step is a trustworthy evaluation result, followed by a few representative lesson interactions. Building every proposed visual now would require inventing operands, joining unrelated probes, or turning supplied story values into learner measurements.

## Coverage and what the evidence establishes

The [65-exercise contract matrix](./result-contract-matrix.json) records all 56 current Deep Orbit lesson sources, all 65 unique referenced exercise YAML files, and all 90 `recordResult()` declarations. Each exercise has exact artifact titles, kinds, available columns or series fields, capture-check names, source lines, SHA-256 hashes, proposed treatment, missing fields, a task-specific inspection question, a next action, and dependencies. Each lesson retains its source boundary, recall questions, and activity/reference inventory.

All source files were read by extraction scripts. The second pass parsed the complete MDX trees, avoiding code examples being mistaken for component references. Every lesson contains Challenge, recall, recap, and epilogue content, with briefing and concept framing in frontmatter. The scan found 83 recall prompts and 24 explicit supporting reference/activity components, including 11 `ConceptReference` sections. Challenge, result, recall, epilogue, and relevant fixture/capture code received close review for result design. This is not a renewed full pedagogical audit of every line or nested reference. It does not execute examples, prove capture reachability, establish production behavior, or report learner-study evidence.

The declarations are 73 tables, 13 series, and four text artifacts. They establish possible captured outputs, not evidence that every run reaches capture. A result recorded after assertions can be absent when those assertions fail. Capture placement and semantic meaning must be reviewed before promising useful partial output.

The treatment counts describe design choices, not implemented capabilities:

| Initial treatment | Exercises | Meaning |
| --- | ---: | --- |
| Existing complete output | 18 | Keep the useful table or text and add accurate source, freshness, and activity context. |
| Bounded enhancement | 28 | Use current fields for a limited interaction. The matrix separately lists fields needed for the richer proposal. |
| Capture extension | 16 | The proposed explanatory view lacks necessary operands or state. |
| Existing saved-stage reuse | 2 | Extend normalization and network evidence through their existing decoders. |
| Evaluation pilot extension | 1 | Capture and validate all evaluation cases before the new case inspector. |

## Capture identity comes before linked views

One submission can collect outputs from several tests. A shared run ID does not make every artifact describe one input, model state, candidate, or measurement window.

| Exercise | Source finding | Required presentation |
| --- | --- | --- |
| `ci-cd-gate` | The labeled-case table comes from the accuracy probe. The failed-release table comes from a separate candidate probe. | Show two named cases. Never pair the first table's rows with the second table's gate score. |
| `build-rnn` | The state trace and derivative trace use different supplied recurrences. | Separate trace contexts. Do not synchronize them as one stream. |
| `model-monitor` | Feature-mean distance and latency percentiles come from different fixtures. | Separate measurement groups. No correlated live-monitoring story. |
| `profile-model` | The timing result uses a controlled-clock mock. The layer inventory uses a different real model fixture. | Keep the two profiles distinct. Do not attach the mock timing to the real model's layers. |
| `model-pipeline` | One table contains a successful pipeline output and a boolean from a separate invalid-input probe. | Name the successful handoff and rejection rehearsal explicitly. |
| `inference-pipeline` | Echo-model preprocessing and temporary-tensor counts are captured in different checks. | Explain their distinct purposes. Counts do not prove the displayed row caused a particular memory change. |
| `gradient-step` | The first table records weight 4. The next check starts its trace there, then updates the same variable to 3.2 and 2.56. | This is intentional continuity across checks. Preserve it through an explicit contract. Different check names do not break that continuity. |
| `export-model-artifact` | The round-trip and inventory checks refer to the same saved `artifacts` object. | Permit the authored relationship, then add artifact identity before persistent cross-run comparisons. |
| `quantize-weights` | Both tables come from the same quantization probe. | Keep the relationship, but do not imply one selected weight explains a particular changed prediction. |

Record semantic probe/group identity and compatible model states in the result definition. `captureCheck` in the matrix is review evidence, not a proposed runtime identifier. The generic renderer cannot infer compatibility from a title, array index, test name, or successful verdict. Initial adapters may map an exact frozen title and column schema to a role within the verified exercise and fixture version. That explicit compatibility contract does not authorize arbitrary title inference.

Some values already exist in display summaries but have no structured field. Examples include retrieval matched/returned/omitted counts, cache model-call count, profile average and weight size, rehearsal update count and gate outcome, and the selected backend. Keep them visible now. A future adapter should capture structured values, never parse the summary sentence to recover them.

## The most consequential missing operands

| Proposed interaction | What is currently captured | What must precede the richer view |
| --- | --- | --- |
| Evaluation cases | Aggregate train/test rows, losses, accuracies, and gap label. | All 43 case IDs, inputs, labels, full-precision scores, fixture groups, decision rule, and a verified connection to the trained/evaluated candidate. Capture should survive an incorrect interpretation. |
| Tensor layout mapping | Four sensor series at three moments. | Captured flat values and shapes, declared sensor/time header, and the exact reshape/transpose index relationship. A chart alone cannot establish axes. |
| Neuron or forward-pass explanation | A returned scalar, or input/output rows. | The actual input weights, bias, shapes, and terms. The forward-pass kernel is randomly initialized, so a reference kernel cannot explain it. |
| Loss explanation | Two BCE result values. | Labels, logits, per-case contributions, and reduction. The legacy `mse-loss` name does not mean its artifact includes an MSE result. |
| Attention calculation | A special two-row inferred-weight table, or weights plus pooled readings. | Query/keys/values or scored features, logits, actual normalization, and weighted terms. The first lesson recovers weights only because its supplied values are twice the identity. |
| Signal overlays | Frequency summary, one-bin history, feature vector, or leakage totals. | Actual sample arrays and spectra with sample rate, length, bin convention, and window metadata. Four values at 40 Hz cannot form a full spectrogram. |
| LSTM gate inspection | Two returned cell and hidden-state values. | Previous state, gate inputs/outputs, candidate, contribution terms, and gate column order. |
| Forecast feedback | Six predicted z-score rows. | Initial and feedback windows, scaler and bounds, and pre-clamp values. No future observations currently exist for an accuracy curve. |
| Threshold comparison | Winning cutoff and F1. | All six labeled scores, candidate cutoffs, comparison and tie rules, and confusion counts. An F1-optimal validation cutoff is not a deployment cost decision. |
| Reconstruction detail | Aggregate MSE or two probe MSEs. | Input/reconstruction pairs and per-feature errors. The separate incident uses absolute-error ratios and must retain that meaning. |
| Claim verification | Claim, cited record, field, value, unit, accepted/unverified result. | The cited source value, permitted calculation, and reason for each decision. A source link must resolve to the actual record being checked. |

These dependencies do not justify postponing a clear table. They constrain which extra interaction can honestly appear. Start with the smallest view that answers the lesson question using available data.

## Where an extra viewer is unnecessary

The 18 initial table/text cases are `browser-ml-tradeoffs`, `load-model`, `incident-tensor-leak`, `onnx-comparison`, `load-pretrained-pipeline`, `incident-baseline-drift`, `incident-false-alarm-storm`, `ensemble-detector`, `weighted-ensemble`, `llm-client`, `prompt-template`, `generate-report`, `inference-cache`, `incident-stale-verdict`, `pipeline-architecture`, `model-monitor`, `write-model-card`, and `verify-deployment`.

These results are already the object the learner needs to read: a recommendation, metadata, projection, vote, document, audit list, or checklist. Give the object readable hierarchy and honest status. Add an interaction only when it answers a concrete question that the table or text cannot answer well. For example, selectable prompt sections might eventually help distinguish a catalogue from a reading. That task needs only the assembled text and its section meanings.

For text, disclose truncation if the 6,000-character bound is reached. A partial model card or report cannot look complete. For runtime examples, keep the controlled clock or mock loader visible and route device questions to the existing real runtime lab. Neither format checking nor table rendering certifies the underlying claim.

## Fit the result to all five lesson phases

| Phase | Role of the feature | Story requirement |
| --- | --- | --- |
| Briefing | State the crew's question and the evidence the learner will produce. | Keep the scene, dialogue, and stakes visible before technical work. No result dashboard should replace the opening. |
| Concept | Let the learner inspect a clearly supplied example when it teaches the required operation. | Keep supplied examples separate from a learner run. Only reuse a recording when values, axes, and provenance actually match. |
| Challenge | Place the current result below the exercise that produced it. Make one useful question inspectable. | Frame the output as the learner's contribution to the crew task, including a useful failure or incomplete result. |
| Recall | Preserve the existing question and its answer-reveal rules. | A result reference can support reflection after the attempt. It must not reveal a graded answer in advance or silently replace the retrieval task. |
| Epilogue | Let the learner retain the artifact while the crew acts on its authored evidence. | Preserve the story's fixed scenes, unknowns, and optional decision consequences. Never rewrite the scene to celebrate a passing test or present fictional mission scores as this run. |

The first two lessons already share Demir's twelve selected readings. This is a strong foundation for linked selection because the data continuity is explicit. The next action is concrete: hand the same values from a chart into the correct sensor layout.

Other sources intentionally change. The normalization fixture has two features and a supplied fixed neuron. The network rehearsal has eight features, 24/12/1 layers, and 529 parameters. The bridge model has three inputs, 32/16/1 layers, and 673 parameters. The autoencoder exercise uses eight features where the mission uses eleven. Runtime exercises use controlled mocks. The result system must preserve these distinctions.

Those labels prevent false claims, but labels alone do not satisfy the project's longer-term story-and-data contract. Where a fixture feels detached from the crew's ongoing work, record a separate content-alignment task. A replacement needs a coherent change across briefing, concept example, hints, exercise, grader, recall, and epilogue. Do not quietly make the UI call a synthetic batch the ship's capture. The result feature cannot repair that continuity through decoration.

Several narrative boundaries deserve explicit checks during implementation:

- The FFT exercise's one-second 128 Hz capture yields one-Hz bin spacing. The epilogue's longer measurement supports a finer estimate. Do not display the mission's 73.4 Hz as the exercise's winning bin.
- The sequence-prediction artifact has no future observed targets. The later forecasting lesson does have aligned observed, recursive, and replay series. These are different capabilities, despite belonging to one family.
- `simple-attention` returns only a blend. Its worked example also returns weights. Preserve the challenge's actual return contract rather than borrowing the example interface.
- The threshold-tuning exercise selects validation F1. The separate cost decision and pager incident answer different questions.
- The LLM client checks a supplied reply's structure. Retrieval, numerical claim checking, reviewed sections, and final report consistency are distinct later responsibilities.
- The capstone chain runner is linear. Its current result cannot demonstrate the mission diagram's branch scheduler. The lesson explicitly leaves that work open.

## Secondary exercises need independent ownership

Nine exercises are secondary activities in their lessons: four anomaly/inference incidents, the cache incident, RAG claim checking, artifact export, launch rehearsal, and final anomaly classification. They must have their own current run, selected item, source context, and failure state. Completing the first exercise must not create or replace evidence for the second.

The launch lesson has three separate contributions: local deployment checks, a small trained-model rehearsal, and a decision rule over supplied fictional scores. Keep their results beside their respective exercises. A single "mission passed" surface would collapse local checks, synthetic model performance, and narrative classification into an unsupported conclusion.

The `future-builds`, `review-costs`, and `rule-or-model` decision tasks, independent project, and external transfer assignment remain separate activities. Their purpose is transfer or policy judgment. They should not masquerade as additional observations from the current exercise run.

## Learning order and rollout

First establish the common result contract: identity, source, freshness, capture availability, independent verdict/interpretation states, and complete bounded data. Then implement the evaluation pilot and reuse the existing normalization/network decoders. The evaluation case view depends on its capture and grader-contract investigation because the current aggregate table cannot support it.

Use the next prototypes to test distinct learning actions, in order:

1. Tensor layout: trace one sensor value through a declared layout. This tests selection and axes without model-score semantics.
2. Scalar gradient: explain an update using actual operands and intentionally continuous steps. This tests calculation detail and state identity.
3. Spectrogram lesson: inspect the existing single-bin time trace first. A full matrix is a separate capture decision.
4. Backend fallback: inspect the actual controlled operation sequence, then distinguish it from real device measurement.
5. RAG verification: inspect a claim against its actual source field and reason, without treating accepted numeric claims as general factual approval.

The matrix records prerequisite concepts by family. They constrain explanatory copy without adding course gates. Classification inspection needs clear feature order and score semantics. Spectral selection needs sample rate and bin spacing. Claim verification needs source and field meaning.

Do not introduce extra saving requirements during this rollout. The data, network, and evaluation stages already provide a bounded retention scope. Other results can remain transient while the team observes whether returning to them actually helps learning.

## Limits that affect authoring now

The current recorder permits four artifacts, 12 table columns, 40 table rows, eight series, 64 points per series, and 6,000 text characters. Normalization and the network rehearsal already use all four artifact slots. New metadata must not simply become a fifth artifact that disappears. The 43-case evaluation must not be silently reduced to 40 cases. Training histories already disclose sampling. Keep gaps visible instead of interpolating purported measurements.

A source-level design is ready for implementation only after its selected interaction has validated fields, explicit probe compatibility, a bounded completeness policy, and a task-specific explanation. Browser verification must then check the full editor/run/result flow, keyboard selection, reduced motion, small screens, visible story context, stale results, and useful failure states. A learner check must establish that the interaction helps explain the contribution to the crew task. Shared component tests cannot establish those outcomes for all 65 exercises.
