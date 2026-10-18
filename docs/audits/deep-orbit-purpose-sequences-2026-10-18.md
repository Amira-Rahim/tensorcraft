# Deep Orbit purpose and result audit: signals, sequences and forecasting

Date: 2026-10-18 (Africa/Cairo).

Scope: all five sections of 20 missions, their nested references and secondary
incidents, 23 exercise contracts, and four module summaries. Read CLAUDE.md,
the writing rubric and story bible. Preserved previous uncommitted work in
`.superpowers/purpose-sequences-before` before this pass.

## Five-section source coverage

Every cell records the task/result connection reviewed. Challenge cells identify
the submitted result now exposed, rather than treating a test pass as the payoff.
Recall questions and answer keys are unchanged.

| Mission | Briefing | Concept and references | Challenge and visible result | Takeaways | Epilogue and next consumer |
| --- | --- | --- | --- | --- | --- |
| Time vs Frequency | Farah compares archived and live swells. | Same samples, different representations; phase and leakage caveats retained. | Returned time-tolerance verdict, differing bin and its center select a band to inspect. | Full transform versus magnitude-only information. | Full archive transform is queued; source identification stays open. |
| Fourier Transform | Demir needs the frequency represented by an output index. | Bin mapping, complex coefficients, Nyquist, aliasing and DFT reference. | Returned frequency beside sample rate and bin spacing. | Resolution and validated thresholds limit interpretation. | Fictional longer-window replay refines the unexplained peak; the small test does not prove that finding. |
| Spectrograms | Whole-capture averages cannot answer when a tone appears. | Windowed FFT rows, axes, taper defaults and STFT math. | Actual returned 40 Hz bin across a one-second synthetic burst. | Window-length tradeoff and overlap limits. | Long-capture timing reveals fictional pulse gaps; one-second exercise cannot measure them. |
| FFT as Features | Added inputs change a fictional held-out evaluation. | Fixed bin identity, scaling, evaluation and parameter-count confounds. | Actual ten-feature row with peak, crossings and labeled FFT centers. | More useful summaries do not add new recorded information or guarantee accuracy. | Provisional mistake-count benefit leads to inspecting remaining misses. |
| Windowing & Overlap | False contacts cost Nazari investigation time. | Hann/Hamming tradeoffs, symmetric/periodic forms, overlap reconstruction reference. | Actual far-bin magnitude totals and changed peak from the submitted taper. | Reduced leakage is distinct from energy, resolution and split leakage. | A surviving fictional peak motivates independent-sensor checks. |
| Sequences Matter | Single-reading classifier misses order. | Ordered windows, dense baseline, recurrent update reuse and sequence axes. | Actual input windows beside following targets. | Reading order differs from feature order. | Shuffling leaves single-row scores unchanged, motivating memory. |
| Simple RNNs | State replay comparison introduces carried state. | Concrete states, library weights, scalar gradient paths and cadence limits. | Submitted hidden-state trace and 60-step derivative trace. | Stalled loss alone is not a diagnosis. | Fictional failed long-range training motivates gates, not a promised fixed memory limit. |
| LSTM Gates | Earlier gradients did not reach the distant pattern. | Gates, packed columns, activation conventions, GRU and direct gradient path. | Submitted cell and hidden-state values shown separately. | Learned weights survive window resets; state does not last days. | Dense raw-capture replay is a fictional held-out result, separate from random-label API demonstration. |
| Sliding Windows | Overlapping holdout windows inflated evaluation. | Inspectable 200-reading counterexample, task-specific labels and streaming buffer. | Returned training/evaluation windows show their actual source indices and labels. | Split before windowing; window length bounds context. | Corrected premature forecast: existing LSTM classifies live windows; Farah asks about predicting return next. |
| Sequence Prediction | Crew needs errors, baseline and a meaningful horizon. | Regression, feature scaling, phase caveat, clamped feedback and ownership. | Six actual returned rows from the submitted trained model, in z-score units. | Errors need units; returned numeric values do not retain tensors. | Fictional 47-minute forecast uses a separate pulse series, not six exercise steps. |
| Normal vs Anomalous | False alerts expose the need for a reviewed baseline. | Baseline/budget distinction, bounded amplitude, Gaussian assumptions, costs and saved 7741 decision. | Actual flag plus secondary baseline-candidate report. | Expected rate needs volume; a cutoff is not event probability. | Selection and its reason are saved; raw capture remains unchanged. |
| Autoencoders | Independent feature gates miss combinations. | Bottleneck and reconstruction, screened training, eleven mission versus eight synthetic features. | Actual mean MSE on separate calm and suspect synthetic inputs from the submitted fit. | Low reconstruction error can still miss an anomaly. | Fictional contamination and 1.4x miss motivate another screened fit; exercise does not reproduce that ratio. |
| Reconstruction Error | Farah asks for measurement before an anomaly claim. | Aggregate MSE, constructed counterexample, per-feature errors and matching baseline units. | Actual two-input MSE comparison plus incident error/ratio/rank table. | Mismatch location is not physical diagnosis. | Fictional feature findings prompt replay of prior ARIA decisions. |
| Threshold Tuning | Crew alert workload conflicts with missed-event cost. | Percentile uncertainty, F1 versus cost, capture/pager policies and optional threshold comparison. | Returned validation cutoff/F1 plus actual incident triage action. | Volume, class mix and objective affect deployment policy. | Fictional replay checks chosen pager policy; future workload remains uncertain. |
| The Anomaly | Archive/live captures motivate multiple checks. | Separate score units/scalers, correlated errors and unresolved pattern investigation. | Actual per-detector flags, z-score, vote count and alert from supplied scores. | Votes are neither probabilities nor independent proof. | Fibonacci/calibration relationship remains fictional and unexplained. |
| Beyond LSTM | Early information may explain a missed forecast. | Query/key/value math, transpose shapes, one-query versus full attention, untrained forward-pass limits. | Actual returned blend with weights recoverable from the probe's identity-based values. | Read access is not causal proof or guaranteed improvement. | Fictional timing change triggers timestamp and boundary checks. |
| Temporal Attention | Crew examines weighted signal positions. | Feature scoring, incomplete buffers, position column and limited positional expressiveness. | Submitted weights plotted beside original-feature summary. | Weight sum and output shape cannot verify capture completeness. | Missing onset from a narrow recording policy motivates wide capture. |
| Forecasting | Shrinking intervals challenge a fixed-pattern forecast. | Rollout versus observed-history replay, non-stationarity and constructed feedback example. | Actual submitted rollout/replay beside generated observations. | Compare equal horizons across periods before diagnosing drift. | Measured fictional intervals shrink too; model error alone is not the evidence. |
| Kalman Filters | Crew needs an interval estimate through noisy measurements. | EMA comparison, explicit uncertainties and gain derivation. | Returned updates for days 2–8 plotted beside recorded intervals. | Level-only state lags trend; smoothness is not accuracy. | Assumptions travel with the estimate to the bridge. |
| Ensemble Methods | Extra models must earn their runtime cost. | Same-target units, heuristic weights, stacking, covariance and variance references. | Actual member and blend MAEs on the same synthetic targets. | Compare against best member; shared bias survives. | Sparse-log extrapolations disagree; no model explains zero interval. |

## Fixes made

- Every exercise now records bounded output from an existing test after its
  assertions. No expected-answer table substitutes for submitted results.
- Changed challenge handoffs to name the result and its consumer: a frequency
  band, next model input, split report, review queue, gated state, forecast
  comparison, or update policy. Kept the actual exercise contracts intact.
- Made the ten-feature FFT exercise's omitted phase explicit. Its row cannot
  be passed unchanged to the mission's eleven-input model.
- Connected the autoencoder fixture to checking the screening/training workflow
  before the next archive fit, preserving synthetic provenance and the different
  feature count.
- Corrected Sliding Windows' premature accurate forecast. At that point the
  existing recurrent model classifies windows; next-value training is the next
  mission. The story now follows that prerequisite order.
- Kept scientific source claims, long pulse timing, mission scores and detector
  success separate from what each small execution actually establishes.

## All exercise capture mappings

| Exercise | Captured submitted result | Consumer and important limit |
| --- | --- | --- |
| time-vs-frequency | timeTwin, divergentBin, derived bin center | Farah selects a band; synthetic two-second pair is not source identification. |
| compute-fft | returned hertz with capture size/rate | Select inspection band; bin center is not sub-bin estimation. |
| build-spectrogram | returned 40 Hz magnitude across four frames | Locate test burst; one second cannot establish 73.4-second gaps. |
| fft-features | all ten returned features | Inspect fixed column meaning before adding phase, scaling and training. |
| apply-window | far-bin totals, reduction and peak from submitted weights/application | Compare taper effect; magnitude sum is not energy or a universal bound. |
| create-sequences | returned windows and next-reading targets | Inspect forecasting pairs; synthetic five-row fixture only. |
| build-rnn | returned hidden states and running derivative factors | Check carried state and gradient path; no learned forecasting claim. |
| build-lstm | returned cell/hidden vectors | Inspect stored versus exposed state before comparing the library cell. |
| sliding-window | returned windows and labels for both sides | Check source indices before fitting; no new accuracy measurement. |
| predict-next | six returned trained-model forecast rows | Inspect feedback/history in saved-scaler units; future truth absent. |
| detect-anomaly | returned Boolean beside supplied baseline | Review decision, not diagnosis; arbitrary synthetic values. |
| build-autoencoder | measured held-out MSE from submitted shared training run | Compare reconstruction behavior; stochastic synthetic fit, no guaranteed ratio. |
| reconstruction-error | returned scores for two offset-model probes | Distinguish reconstruction gap from input magnitude; no trained detector validation. |
| find-threshold | returned cutoff and F1 on overlapping labeled cases | F1-based policy comparison; not an operational cost optimum. |
| incident-baseline-drift | returned projected counts, candidate stats, ratio and action | Candidate evaluation plan; same rows fit/check candidate. |
| incident-missed-anomaly | returned errors, ranks and low-error flags | Investigate mismatches; ratios do not establish cause. |
| incident-false-alarm-storm | returned rate, ratio, next check and action | Prioritize investigation; logged change is not confirmed cause. |
| ensemble-detector | returned z-score, flags, votes and alert | Review supplied-score decision; no autoencoder/LSTM execution or event probability. |
| simple-attention | returned blended components and probe-derived weights | Inspect soft combination; identity-based synthetic values make weights recoverable only for this probe. |
| temporal-attention | returned weights and pooled original features | Inspect position influence; no causal attribution or trained result. |
| forecast-signal | returned rollout and replay beside arrived values | Compare feedback behavior at each position; synthetic stochastic training. |
| kalman-filter | returned estimates beside days 2–8 observations | Inspect smoothing/lag before forecasting; fictional log and assumed noise variances. |
| weighted-ensemble | returned member and two blend MAEs | Compare best-member benefit; arbitrary target units and separate prior-period weight scores. |

Maximum per exercise: two artifacts, ten table rows, 60 plotted points, three
series, six columns. All captures stay below the shared limits. Existing shared
training promises are reused; no stochastic training was added.

## Verification and boundaries

- All 23 scoped solution/starter/registered-cheat validator commands passed
  against the fresh compiled capture source. Logs are
  `.superpowers/purpose-sequences-<slug>.log`; aggregate results are in
  `.superpowers/purpose-sequences-validation.json`.
- Compared source against the pre-edit snapshot: every MDX code block, recall
  block and saved decision is unchanged. All exercise instructions, starters
  and solutions are unchanged. Existing assertions are preserved. One existing
  detector call is named once to capture its result; existing autoencoder
  measurements are collected after their assertions.
- Final simple-attention capture was moved to its matching-key probe after that
  initial validation. Fresh Velite compilation and its scoped
  `--starters --cheats` rerun both passed.
- This pass does not establish real scientific findings, fleet hardware timing,
  classifier accuracy or forecast usefulness. Those remain explicit evaluation
  requirements. Some optional demonstrations intentionally exercise APIs or
  counterexamples, with their synthetic/untrained limits retained.
- Shared layout, transport and result rendering began parent-owned. The shared
  review follow-up below records the small fixes delegated back to this agent.
  Browser rendering and accessibility need the parent's browser checks. No
  commit or deployment was performed.

Unresolved content blockers: none found in this source scope. Runtime and
browser evidence must not be substituted for one another.

## Shared result-flow review follow-up

Reviewed the collector, browser/Node worker transport, exercise controls and
output component. With parent authorization, fixed these concrete issues:

- A pending run could repopulate output after Reset or publish into a different
  exercise/account with identical source code. Run tokens now invalidate these
  completions, including results, logs and attempt callbacks. A newer run keeps
  its running state when an older promise settles. Editing within the same run
  still retains its output, explicitly marked stale.
- Draft readiness and the editor provider now follow the exercise/account key.
  Unknown-starter legacy drafts receive a neutral notice while preserving their
  code. Workspace help no longer refers to an absent reference tensor.
- Finite numeric extremes could overflow the chart's range arithmetic and
  produce NaN coordinates. Scaling now normalizes first; constant, zero and
  subnormal series remain visible. Data tables retain full returned numeric
  precision and have artifact-specific accessible region names.
- Sparse arrays could bypass `.map` validation and become displayed nulls.
  Copies now visit every position; malformed host output becomes a failed
  display check without rendering the artifact.
- Removed the output component's redundant enclosing card/padding, which
  squeezed mobile output within the existing exercise frame. Its divider fills
  the available width and its summary uses the larger lesson text size.

Meaningful regression tests first reproduced the reset/navigation races,
extreme-value NaNs and sparse-array acceptance. Final focused verification:
seven suites, 67 tests passed, covering artifacts, output, feedback, draft
recovery, briefs, the runner and exercises. The UI TypeScript build also passed.
The parent and corpus owner were notified that collector edits were stable.

Remaining boundary: resetting or leaving a lesson discards old completion
callbacks; it does not cancel the already bounded worker execution. Browser
layout, keyboard and screen-reader behavior require the parent's browser pass.

Also compared all 20 scoped `LESSON_HANDOFFS` and `DEEP_ORBIT_VISUALS` entries
with the final authored text and captures. No contradictory mission promises
were found. The Sliding Windows visual's next-reading example remains separate
from its classification exercise, a distinction stated explicitly in the MDX;
its handoff and epilogue no longer imply an already-trained forecaster.
