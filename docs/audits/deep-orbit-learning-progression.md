# Deep Orbit learning progression

Local curriculum map, 2026-09-17. This is an author-side review aid, not an
independent assessment of teaching quality.

The [lesson inventory](deep-orbit-learning-map.json) records all 56 lessons:
authored objectives, explanation headings, 65 exercise references, task
openings, recall questions and source hashes. Regenerate it with
`pnpm --filter @tensorcraft/content build:content` followed by
`node scripts/build-learning-map.mjs`. The source paths identify where to
inspect actual assertions and hints. Their presence does not establish that
every objective has suitable assessment. The subsequent
[assessment review](deep-orbit-assessment-review-2026-09-17.md) maps every
authored objective to evidence and records a finding for each exercise.

| Module | Needed on entry | Explain and practise | Feedback and later use |
| --- | --- | --- | --- |
| Foundations | JS arrays, functions, async calls; basic arithmetic | Tensors, shapes, operations, loading, temporal splits and training-only scaling | Shape/value checks; normalization and split recall. Used by every later model. |
| Neural networks | Shapes and feature scaling | Neuron arithmetic, activations, dense layers, forward passes, parameters | Executable arithmetic and shape comparisons. Supplies the classifier trained next. |
| Training loop | Forward pass, features and labels | Loss, gradients, optimizer updates, fit history, validation, evaluation and baseline | Loss/update checks, held-out evaluation, confusion-matrix recall. Followed by the unfamiliar build-triage assignment. |
| Browser runtimes | Trained model and preprocessing contract | Backend initialization, model files, caching, inference and resource ownership | Runtime and disposal checks; memory-growth incident. Reused in optimization and deployment. |
| Signal processing | Sampling rate, arrays, tensor operations | Time/frequency views, FFT bins, frames, filtering and tapers | Numeric spectra and transform comparisons; recall about windows and leakage. Supplies temporal and anomaly features. |
| Recurrent networks | Ordered windows and the training loop | State updates, recurrent weights, LSTM gates, sequence training and forecasting | Hand calculation compared with TF.js; rolling-window and unit checks. Used by attention and forecast evaluation. |
| Anomaly detection | Scaling, reconstruction loss, evaluation splits | Autoencoders, reconstruction errors, empirical thresholds, false alarms and missed anomalies | Counterexamples and threshold comparisons. Scores become inputs to the later pipeline. |
| Advanced time-series | Sequences, forecasting and evaluation | Attention, position, horizon errors, Kalman updates and ensemble comparison | Arithmetic/model checks and held-out member comparisons. Supplies forecasts to the reporting pipeline. |
| LLM integration | Model limits, input/output contracts and units | Prompt context, structured evidence checks, reviewed drafts and orchestration | Rejection of unsupported structured claims, assembly and fallback cases. Reused in capstone reporting. |
| Optimization and edge | Inference, baseline measurements and quality metrics | Weight size, runtime profiling, quantization, pruning, cache validity and backends | Timing/resource checks and incident exercises. Used to explain deployment tradeoffs. |
| Capstone | Full pipeline and its evaluation limits | Integration, model cards, monitoring, rollback and deployment decisions | Guided integration checks and story decisions. The independent external project remains to be built. |

## Foundational concepts and their first useful applications

| Concept | Teaching anchor | Practice or retrieval | Review finding |
| --- | --- | --- | --- |
| Features and labels | Foundations data loading; neural-network inputs; training targets | Loading, fitting, evaluation; build-triage field selection | Transfer task explicitly distinguishes prediction-time fields from outcome-only columns. |
| Training vs inference | Training loop; browser model loading and inference | Train a classifier, save/load and predict | Browser inference requires the same feature order and preprocessing. |
| Baseline | Evaluating DEEP SCAN, before its scoring example | Build-triage compares baseline and model on the same rows | Added a majority-class explanation; a trained model does not earn value simply by existing. |
| Loss vs evaluation metric | Loss functions; classifier evaluation; sequence prediction | Loss calculations, confusion matrix and forecast errors | MAE and MSE wording corrected; metric choice must follow the decision. |
| Train/validation/test | Foundations split; training callbacks; final evaluation | Split exercise, evaluation recall and build-triage report | Time ordering and training-only preprocessing are required for the new task. |
| Leakage | Foundations splitting; overlapping signal windows | Split/window exercises and transfer feature exclusions | Outcome-only duration is a tempting but invalid input at build start. |
| Generalization | Train/validation gap and sequence replay | Error inspection; final-period transfer report | A score gap suggests investigations, not a proved cause. |
| Uncertainty and limits | Normalization/classification; reconstruction error; thresholds | Recall and counterexamples; transfer recommendation | No confidence value, threshold or passing grader certifies production reliability. |

## Scaffolding and assessment decisions

The existing code exercises provide explicit function contracts and three hint
levels. They support guided practice. The new build-triage assignment asks
for a decision and evidence without prescribing an architecture, split ratio,
metric target or function body. Its optional rescue hints are recorded. The
learner reports outside help separately, keeps runnable code and exports a
report. A self-review marker is not an assessment pass and awards no XP.

The assignment is at training-loop lesson 5, after `deep-scan-eval`, in the
Challenge brief. It uses synthetic build records rather than ship telemetry.
The task requires a baseline, time-split rationale, training-only preprocessing,
a chosen metric, a final-period comparison and individual error analysis.
Choosing the baseline over the model is a valid conclusion.

## Work still needed before Q2 can pass

- Resolve the [assessment review's](deep-orbit-assessment-review-2026-09-17.md)
  open findings A15-A24. All 65 task contracts, hint ladders and grader logic
  have now been read against the objectives. Complete diagnostic editing,
  broader valid-alternative testing and learner readiness checks remain open.
- Check first-use terminology and rendered glossary coverage, including
  dialogue and optional drawers. Sampling, matrix dimensions, sigmoid,
  gradients and normalization need particular attention for a JS-only reader.
- Review the other 38 lessons again in their revised sequence. Earlier
  close-reading plus this patch's 18-lesson prose pass does not establish a
  complete current-revision code, numerical or editorial review.
- Observe unfamiliar JavaScript engineers attempting the assignment without
  author assistance. Record interventions and revisit the time estimate.
- Add the separate final independent project and a rubric for external
  assessment. Guided capstone completion is not that evidence.
