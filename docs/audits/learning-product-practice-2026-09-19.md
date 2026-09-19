# P4 numerical experiments and practice progression

Internal implementation and instructional review, 2026-09-19. Human learning, independent transfer and completion-time evidence remain later work.

## Implemented interactions

All seven objectives have working interactions. Channel layout is P1. Six additional interactions use a common prediction/result/changed-case shell in the Concept phase. The Code and Challenge phases keep their existing contracts. There are no model downloads, artificial latency readings or new completion credits.

| Interaction | Numerical boundary | Changed case |
| --- | --- | --- |
| Channel layout | Reshape and transpose share target dimensions but differ in channel values; real TFJS parity | A different rectangular packet, operation and values both required |
| Normalization | Four explicit training rows; population moments; zero std divisor 1; saved feature order; fixed weights and bias; raw, saved and refitted paths | Recover v1 inputs [2,2] for [26,3] when a deployment incorrectly uses a different scaler |
| Threshold | 21 explicit validation labels; strict score > cutoff; empty ratios 0; FP × false-alarm cost + FN × miss cost; true-positive review excluded | Freeze the selected policy and costs before viewing ten separate test rows; no unlock on reset/refresh |
| Learning rate | Derivative of 0.5 × (w - target)²; four updates; 2.2 diverges while 1.2 overshoots and approaches; the coding exercise uses w² | Negative starting weight and a nonzero target |
| FFT window | Generated 10/12 Hz signal at 128 Hz; rectangular window; one-sided magnitude / observed N; native spacing versus padded grid | 64 observed points padded to 128; distinguish 1 Hz display spacing from 2 Hz native spacing |
| Attention | Unscaled QKᵀ, matching the lesson and challenge; stable softmax; separate keys/values and explicit shapes | Query [0,2] produces weighted value [2.975,7.025] after rounding |
| Cache identity | Deterministic toy score; exact/rounded/unversioned keys; independent model/scaler replacement; expected fresh result alongside returned result | Both versions change, while repeated inputs still reuse the matching artifact |

Threshold 0.4 has higher validation F1 than 0.7 at equal unit error costs, but costs more. Threshold 1 catches nothing and misses every positive. Neither the validation table nor the synthetic labels establish mission prevalence or a production threshold. Normalization scores are uncalibrated, supplied-weight demonstrations. FFT padding adds no observation time, and bin spacing alone does not establish frequency resolution. Attention weights are not causal explanations. Cache call counts are simulated work counts, not milliseconds.

## Assistance and feedback

A calculation is hidden until prediction or explicit help. Feedback states the observed number, its consequence and the next formula/input to inspect. A failed answer exposes the calculation and counts as assistance for later attempts. First/latest outcomes are retained separately, with a maximum of twenty checks per case. Reset clears controls without erasing history. Returning to the worked case records reference use for the changed case. Corrupt or incompatible drafts produce an explicit fresh-start notice. Blocked storage keeps the activity usable in memory. Numeric equivalents, whitespace and scientific notation are accepted; wrong preprocessing, wrong dimensions/values and nonfinite answers fail.

These browser records are practice evidence. Cross-device summaries and account boundaries are P5. They do not establish mastery or complete lessons.

## Capability progression

The authored [practice progression](deep-orbit-practice-progression.json) maps twelve capabilities to worked examples, partial implementation, failure diagnosis, changed constraints and later use. The [learning map](deep-orbit-learning-map.json) includes it and all seven experiment registrations. Its builder checks lesson/exercise membership. Existing build-triage, three decision tasks, incident exercises and the room project supply broader decisions. Rationale remains self-reviewed; no automated language-model judgment is introduced.

Read the relevant existing exercise contracts and graders alongside the additions. Kept specified objectives: the attention challenge uses unscaled scores; the gradient challenge teaches actual autograd; the FFT challenge teaches rFFT and excludes DC; the cache challenge explicitly practices approximate rounded reuse under immutable artifact lifetimes. The new experiments make those limits visible rather than silently changing what the grader accepts.

## Verification and corrections

- Six numerical contracts cross-checked against installed TFJS CPU where applicable: population moments, dense sigmoid prediction, derivative, FFT and stable attention. Also checked threshold equality/empty cases, differing F1/cost rankings, and rounded/version cache failures. Tensor counts return to baseline.
- Numerical/state/component suites: 16 tests pass. Three equivalent implementations run through the shipped Node worker: threshold reduce with last-max tie behavior, key-first attention multiplication, and FFT argMax over eligible bins. Together with existing assessment boundaries/reliability: 21 tests pass.
- Full exercise validator: 65 passed, zero failed/warned; untouched starters and registered misconceptions remain rejected. No grader changes were needed.
- Production MDX fixture: eighteen interaction/viewport flows at 1100 dark, 375 light and 320 dark. Wrong prediction, correct correction, distinct changed case, persisted first record, reference help, keyboard submission, scoped axe and 200% text reflow pass. External boundaries are explicitly stubbed.
- Two actual Next.js free-lesson flows at 1440 dark and 390 light pass: raw versus saved inputs, changed case, phase exit/re-entry, reload, single Concept mount, no completion credit, scoped axe and page reflow.
- Content build, web typecheck, focused lint and four renderer/content suites (27 tests) pass. Browser review initially found that the fixture's theme attribute did not activate light mode; corrected to `data-scheme` and repeated the checks. Explicit select labels also replaced implicit wrapping to give stable accessible names. The attention interaction was aligned with the existing unscaled lesson before the final passing run.

Retained screens and outcomes: [P4 evidence](learning-product-p4-2026-09-19/). Numerical API references: [TFJS 4.22 API](https://js.tensorflow.org/api/4.22.0/) and [model/weight semantics](https://www.tensorflow.org/js/guide/models_and_layers). The executable fixtures, not undocumented benchmark numbers, support the displayed results. Full integrated editorial and design review remains P6/P7.
