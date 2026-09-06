# Deep Orbit content quality audit (ultra), 2026-09-06

Owner request: run the audit again with fresh eyes, on ultra. Same four
questions. Is every module delivering the best content it can? Does every
module bring a JavaScript engineer closer to the basics of ML? Can a
finisher really explain the ML topics the world covers? Is there
ambiguity, fuss, or text that acts smart without delivering value?

## Method

This pass was run as a multi-agent audit rather than a single reader,
and it was built so that no part of it could inherit my conclusions from
the two earlier audits.

Forty-four module readers, four per module, each read all the lessons in
one module through one lens: ML correctness, cold reader, continuity and
numbers, or exercise fit. Four more readers tracked threads across all
56 lessons: the story and technical threads, the ML concept spine, and
chronology in two halves. None of them was shown the earlier audits or
told what those had found. They produced 753 raw findings.

Eleven merge agents collapsed those to 275 deduplicated findings, capped
at 25 per module. Every merged finding then went to independent skeptics
prompted to refute it, each with a different lens: textual truth, learner
impact, and fix sanity against the canon and the CI gates. A high finding
needed two of three skeptics to let it stand. A medium needed both of
two. A low needed one. Of the 277 findings that reached adjudication,
95 survived and 182 were dropped.

Grades come from the 44 module readers, four independent letters per
module, reported as a median. They do not come from finding counts.

Separately, I ran the technical claims that could be settled by
execution against the installed TensorFlow.js 4.22.0 rather than by
reading. Eleven of them are recorded below with their numbers. Nothing
in the content was edited during this audit.

## Verdict in four answers

**1. Is every module delivering the best content it can? No, and the
gap is wider than my two earlier audits said.** All eleven modules land
at B+ as the median of four independent readings, with individual
letters ranging from B- to A-. My audits of 2026-09-05 and 2026-09-06
both concluded A-, and they were wrong. The reason they were wrong is
visible in the method: I had read the same files three times, I had
written the last round of fixes myself, and I graded the prose while
treating the exercises and the runnable claims as background. Readers
with no such history, told to run the numbers and to read every exercise
against its own tests, found a layer of defects underneath the prose
that I had stopped seeing.

**2. Does every module bring a JavaScript engineer closer to the basics
of ML? Yes, and the spine is sound.** The progression from tensors to
a trained classifier to evaluation to deployment holds up, the story
carries real engineering cost, and the arithmetic is trustworthy: across
the 44 readings there are 237 separate notes recording a number that was
recomputed and found correct. What repeatedly fails is the last step of
teaching a basic. A term is named in a bridge callout, a recap, or a
recall answer, and never defined in any body: broadcasting, aliasing,
weight initialization, the difference between a validation set and a
test set, regularization as a mechanism, mean absolute error. Each of
those reaches the learner as vocabulary rather than as something they
can use.

**3. Can a finisher explain the ML topics the world covers? Most of
them, with specific holes.** They could explain what a tensor adds over
a typed array, what a neuron computes, why activations stop a stack from
collapsing to one linear map, how a parameter count is built, what a
loss is, what gradient descent does, why a held-out score differs from a
training score, what an autoencoder reconstructs, and what attention
pools. They could not explain why weights start random rather than zero,
why a shape mismatch is legal in a subtraction and fatal in a matrix
multiply, why the number you tune on cannot be the number you report,
what dropout or an L2 penalty actually do, why a frequency above Nyquist
plants a false peak rather than vanishing, or why an RNN beats a dense
layer over a flattened window. The last one matters because the module 6
graders reject that dense baseline without any lesson saying why.

**4. Is there ambiguity, fuss, or text acting smart without delivering?
The prose problem is largely solved. A different problem replaced it.**
Of the findings that survived refutation, exactly one is a slop finding,
and the padding is mostly gone, so the earlier sweeps worked. What the
readers found instead is harder to see, because it is invisible at the
sentence level and only shows up when you check the sentence against the
page behind it. The text states mechanisms it does not demonstrate, and
the graders certify skills they do not test. A lesson says overlapping
windows give every sample full weight, and its own drawer says
otherwise. A lesson says a frequency above Nyquist is invisible, and its
own recap says it aliases. An exercise instructs the learner to report
the raw sigmoid as confidence two pages after the body calls that the
mistake. Three graders can be passed by a solution that never does the
thing its lesson is about. A reader who trusts the page is being taught
something false; a reader who checks it finds the correction already
sitting a few lines away, uncredited.

## Grades

Each grade is the median of four independent readings of that module.
The four letters are shown so the spread is visible.

| Module | Grade | Four readers | Deciding factor |
|---|---|---|---|
| 1 Foundations | B+ | B+, B+, B+, B+ | A tensor leak and a wrong shuffle claim in the module that teaches leak detection |
| 2 Neural Networks | B+ | B+, A-, B+, B- | Every number checks out, every exercise is a config transcription |
| 3 Training | B+ | B+, B+, B-, B+ | Validation and test never distinguished; the loop's own mechanism has no exercise |
| 4 Browser Runtimes | B+ | B+, B, B-, B+ | A false cross-runtime claim and a benchmark that measures the backend, not the runtime |
| 5 Signal Processing | B+ | A-, B+, B-, B+ | Two mechanism statements contradicted by the lesson's own drawer and demo |
| 6 Recurrent Networks | B+ | B+, B+, B+, B | The central "why not just flatten it" question is never answered |
| 7 Anomaly Detection | B+ | B+, B, B+, B | Votes from three detectors that share an input are called independent evidence |
| 8 Advanced Time-Series | B+ | B+, B, B, B+ | A drift detector that fires on a stationary signal; a filter credited with tracking it lags |
| 9 LLM Integration | B+ | B, B+, B+, B | The module's headline lesson is asserted in four places and shown in none |
| 10 Optimization | B+ | B+, B+, B, B- | File size treated as runtime memory, and every Challenge promises a measurement no exercise performs |
| 11 Capstone | B+ | B+, B+, B+, B- | An input contract that does not match the one the course built, and a finale explanation that does not hold |

Overall: **B+**. Every module sits at the same median, which is itself
the most useful number here. No single weak module is dragging the world
down. The same pattern recurs in all eleven: claims and graders that
outrun what the page behind them delivers.

## What I checked by running it

These are the claims that could be settled by running the code or
comparing two files rather than by reading. All were checked against the
installed TensorFlow.js 4.22.0 in Node. All eleven confirmed the
finding.

1. **The split generator leaks.** `foundations/04`'s `splitGenerator`
   run verbatim over 1,000 readings, one validation pass, batches
   disposed: `numTensors` goes 0 to 1,600, two per skipped reading. At
   28,800 readings that is 46,080 per validation pass. The epilogue says
   `numTensors` holds steady at 70.
2. **The shuffle buffer does not do what the lesson says.** An in-order
   2,000-item stream through `shuffle(100).batch(32)` gives a mean index
   span inside a batch of 371 items, about 3.4 hours of one day at 33
   seconds per reading. The lesson calls it a fair sample of the whole
   archive.
3. **Above Nyquist is not invisible.** A 73.4 Hz tone sampled at 128 Hz
   over 128 samples puts a clean peak in bin 55, magnitude 49.0, against
   a mean of 2.5 in every other bin. The folded image is 54.6 Hz. The
   lesson says such a component is invisible.
4. **Overlap does not give any sample full weight.** With the lesson's
   own Hann window of 64 at hop 32, the worst interior sample reaches
   0.512 in its best window. The sum across windows stays between 0.975
   and 0.999, which is the drawer's claim and not the body's.
5. **The compute-fft grader can be beaten.** All four shipped tests use
   a signal length equal to the sample rate, so the hertz conversion is
   a no-op in every one. A solution that returns the raw bin index with
   the conversion deleted passes 4 of 4. On the discriminating case the
   audit proposes, 256 samples at 128 Hz carrying a 5 Hz tone, that
   shortcut returns 10 where the answer is 5.
6. **The profile-model grader can be beaten.** A solution that calls
   `predict` the right number of times and reports `avgInferenceMs: 0`,
   with no timing, no warmup and no readback, passes 4 of 4. The shipped
   solution against the shipped mock reports 0.007 ms, which measures
   nothing.
7. **The drift detector fires on a signal that never drifts.** Trained a
   small model on a pure sine of fixed period, rolled it out 100 steps
   the way the lesson's `forecast` does, and ran the lesson's own
   `detectDrift` verbatim: `driftDetected: true`, magnitude 2.84. The
   same detector on one-step-ahead errors re-seeded from real data
   reports false, magnitude 1.13. The detector is measuring horizon
   compounding, which the same lesson teaches, and calling it
   non-stationarity.
8. **The Kalman filter lags the drift it is credited with tracking.**
   Run as written, its estimates are 73.10, 73.02, 73.02, 72.89, 72.84,
   72.69, 72.61, 72.44. That slope is 0.092 seconds per day. The raw log
   slopes at 0.145. The body's "roughly a sixth of a second per day"
   (0.167) comes from neither, and the final estimate sits 0.44 behind
   the final reading. The drawer says this filter lags a trend; the
   body, the consequence line, and the epilogue all say it tracks one.
9. **A mid-scale reading cannot be thrown to an extreme.** Three hundred
   fresh initializations of the 3-32-16-1 network scoring [0.5, 0.5,
   0.5] give a minimum of 0.397, a median of 0.499, a maximum of 0.631,
   and nothing above 0.99. The finale's sentence about any projection
   throwing 7741 to one far end of the scale is wrong, and I wrote it
   myself on 2026-09-05. The 0.998 remains a story mystery; the
   mechanism now offered for it is not available.
10. **Feedforward networks do not fail at sequences.** On a task where
    order is the only signal, "spike then dip" against "dip then spike"
    with identical value multisets: a model that genuinely processes each
    step in isolation scores 50.0%, chance. A dense layer over the
    flattened window, which the module's graders reject, scores 100.0%
    with 337 parameters. A SimpleRNN scores 100.0% with 305. The lesson's
    heading and its "processes each time step in isolation" line are
    false for the model a JavaScript engineer would actually reach for.

11. **The ensemble exercise is copyable from the page above it.** The
    lesson body prints a complete `weightedEnsemble` with the same name
    and semantics, and the exercise instructions point at it: "Plain JS
    loops (like the lesson's own version) or tensors, your choice; the
    grader only checks the numbers."

Two of these, items 1 and 7, were also run independently by a module
reader before I ran them, and the numbers agree.

## Tier 1: wrong beliefs and missing basics

Twenty findings at high severity that survived refutation, in module
order. Each one either teaches something false or leaves a named basic
untaught. NEW means it appears in neither the 2026-09-05 audit nor the
2026-09-06 re-audit. Three further entries that I drafted before their
verifiers finished were then refuted; they are recorded at the end of
this section rather than quietly removed.

**T1.1 NEW. `foundations/02-tensor-shapes.mdx:22` (and recap line 137).
Broadcasting is named twice, defined nowhere, and then required.** The
bridge callout and the recap bridge both use the word. A grep of all 56
lessons finds only those two hits and the glossary has no entry. Lesson
3 then uses `.mul(tf.scalar(2))` and lesson 5's own exercise solution
does `batch.sub(mean).div(std)` with a [4, 2] tensor minus a [2] tensor,
so the learner writes code that depends on a rule the course never gave
them, one lesson after being told a shape mismatch is fatal. Fix: one
paragraph where the [5, 2] batch and the [2] column means already sit
side by side, plus a glossary entry.

**T1.2 NEW. `foundations/04-data-loading.mdx:99`. The shuffle-buffer
explanation teaches a false belief.** "Random order makes every batch a
fair sample of the whole archive." A buffered shuffle only permutes
inside its window. Measured: with an in-order stream, `shuffle(100)`
gives batches spanning about 371 readings, roughly 3.4 hours of one day,
which is the failure the same paragraph says shuffling prevents. Fix:
say the buffer is the window the shuffle can reach across, and either
raise it or label 100 as a demo size and say what it cannot do.

**T1.3 NEW. `foundations/04-data-loading.mdx:126`. The split code leaks
two tensors per skipped reading, in the module that teaches leak
detection.** `splitGenerator` filters a generator that has already built
`xs` and `ys` for every reading, and drops the rejects without
`dispose()`. Measured: `numTensors` 0 to 1,600 over 1,000 readings on one
validation pass, which scales to 46,080. The epilogue says Demir watches
`numTensors` hold steady at 70. Fix: iterate the chosen indices instead
of filtering the whole stream, which also stops the validation side
reading all 28,800 records to yield 5,760.

**T1.4 NEW. `neural-networks/05-building-a-network.mdx:49`. Weight
initialization is never taught.** Five lessons lean on "random weights",
the 7741 mystery hangs on two fresh draws, and `training-loop/03` uses
`tf.randomNormal` with standard deviation 1 without comment. No lesson
says why weights are not zero, why their scale matters, or names
`kernelInitializer`. Grep finds no Glorot and no symmetry breaking
anywhere. Fix: one paragraph on symmetry breaking and fan-in scaling,
which also explains the saturation failure module 2 named.

**T1.5 KNOWN (N1, still open). `training-loop/05-evaluating-deep-scan.mdx:59`.
Validation and test are never distinguished.** Lesson 4 stops training
on the validation split, lesson 5 calls its held-out slice "test", and
the capstone model card declares an 80/10/10 split no lesson taught.
"Held-out" serves both roles. A finisher who early-stops on a curve and
then reports that curve's accuracy has a flattered number and nothing in
the course warns them. Fix: one paragraph naming the two roles and
saying that lesson 4's 0.081 was spent on the stopping decision.

**T1.6 NEW. `browser-runtimes/05-onnx-runtime-web.mdx:21`. The bridge
callout states something false about the ecosystem.** "Same ONNX model
runs in TF.js, ONNX Runtime, PyTorch." TensorFlow.js has no ONNX loader,
and PyTorch exports ONNX rather than executing it. The lesson body loads
`.onnx` only through onnxruntime-web, and lesson 6 says outright that
TFJS is not involved. Fix: name runtimes that do execute ONNX, and
change the breaks line to "absent from the target runtime's opset".

**T1.7 NEW. `browser-runtimes/05-onnx-runtime-web.mdx:183`. The benchmark
measures the backend and the recap reports it as a runtime rule.** The
harness compares TF.js on WebGL against ONNX Runtime on WASM, then
concludes that TF.js sustains faster inference and ONNX starts colder.
The lesson's own rule two sections earlier is that any difference outside
the thing being measured contaminates the measurement. For a
673-parameter dense net the numbers also point the wrong way, since
per-call GPU readback normally loses to WASM at that size. Fix: hold the
backend constant, mark the numbers as one machine's, and let the choice
follow model size.

**T1.8 NEW. `browser-runtimes/exercises/inference-pipeline.yaml:4`. The
exercise grades the definition the lesson calls a mistake.** The
instructions say to return the raw sigmoid as the confidence value and
the test expects 0.25 for a noise verdict. The lesson body says twice
that confidence belongs to the verdict, so p = 0.12 is noise at 88%.
A learner who applies the lesson fails the grader; one who passes has
learned the thing the lesson corrected. Fix: pick one definition and
make the body, both hints, the solution, and the tests agree.

**T1.9 NEW. `signal-processing/02-fourier-transform.mdx:149`. Above
Nyquist is taught as invisible when it is a false peak.** "Anything
between 64 and 128 Hz is invisible to the demo." Measured: a 73.4 Hz
tone at 128 Hz sampling puts a clean peak in bin 55 at magnitude 49
against a floor of 2.5. The recap and the recall answer both say such
components alias into lower bins, so the module contradicts itself, and
"aliasing" is never defined anywhere in the course. This matters
directly: the module's job is hunting unexplained lines, and
under-sampling plants them. Fix: give the folding rule and the number,
and define aliasing there.

**T1.10 NEW. `signal-processing/05-windowing-and-overlap.mdx:144` (also
148 and recap 215). The overlap rule is stated three times and is
false.** "Every sample gets full weight in at least one window."
Measured with the lesson's own Hann window at 50% hop: the worst
interior sample reaches 0.512, and only exact window centres reach 1.0.
The drawer states the true property, that the shifted windows sum to a
near-constant, so body and drawer disagree. Fix: replace all three with
the constant-sum statement and keep the drawer.

**T1.11 NEW. `signal-processing/exercises/compute-fft.yaml:50`. The
grader never tests the formula the lesson is about.** All four tests use
a signal length equal to the sample rate, so `bin * sampleRate / N` is a
no-op. Verified by running a shortcut that returns the raw bin index
against the shipped tests: 4 of 4 pass. A learner can finish believing
bin index is hertz. Fix: add one case where the length and the rate
differ, for instance 256 samples at 128 Hz carrying 5 Hz.

**T1.12 NEW. `signal-processing/exercises/fft-features.yaml:4`. The
exercise grades the move the lesson forbids.** The lesson's hard rule is
that model features must be fixed bins because sorting by magnitude
destroys frequency identity. The exercise has the learner sort by
magnitude and return magnitudes with no frequencies, so even its own
catalog-report pretext does not hold. The Challenge line, the nudge
hint, and the youCanNow all describe fixed-bin extraction and
concatenation that nothing grades. Fix: grade the fixed-bin extraction
and the concatenation, or rename what is returned and reword the three
promises.

**T1.13 NEW. `recurrent-networks/01-sequences-matter.mdx:70`. The module
blames the wrong thing and never answers the obvious question.** The
heading is "Why Feedforward Networks Fail at Sequences" and the comment
says a feedforward network processes each time step in isolation.
Measured on a task where order is the only signal: a model that really
does process steps in isolation scores 50%, chance, but a dense layer
over the flattened window scores 100%. The lesson's own recall answer
concedes that a dense layer holds a separate weight per position. Two
graders reject Flatten plus Dense with no lesson saying why. Fix: name
the real fault, one reading at a time, and give the real reason a
recurrent cell wins, which is that one transition rule applies at every
step so a shifted pattern is the same pattern.

**T1.14 NEW. `llm-integration/05-multi-model-systems.mdx:179`. The
module's headline lesson is asserted four times and shown zero times.**
The bridge, the recap, the RecallPrompt, and the youCanNow all say to
validate output between stages. `pipeline.ts` passes every stage's raw
output straight through, and `resilience.ts` catches only thrown
exceptions, which the bridge itself says is not the failure mode. The
compounding argument that motivates the whole lesson exists only inside
a recall answer. Fix: add the validation step to the pipeline so the
claim is demonstrated.

**T1.15 NEW. `advanced-time-series/03-forecasting.mdx:63`. The drift
detector fires on a signal that never drifts.** `detectDrift` is fed the
100-step rollout, so its "recent" errors are 90 model calls deep and its
"historical" errors are one call deep. Measured: on a pure sine of fixed
period, the lesson's own detector reports drift at magnitude 2.84; on
one-step-ahead errors re-seeded from real data it reports none at 1.13.
The learner leaves believing rising error along a forecast is evidence
the series changed, which is the exact confusion the lesson exists to
prevent. Fix: define drift detection on one-step-ahead errors over
wall-clock time, and say a rollout must never be passed in.

**T1.16 NEW. `advanced-time-series/04-kalman-filters.mdx:125`. The filter
is credited with tracking a drift it lags.** The code comment, the
consequence line, the epilogue, and objective 4 all say the filter
tracks the shrink at about a sixth of a second per day and predicts the
next occurrence. Measured from its own printed run: the estimates slope
at 0.092 per day, the raw log at 0.145, and the final estimate sits 0.44
behind the final reading. Nothing on the page predicts a next
occurrence. Only the collapsed drawer admits the filter lags a trend.
Fix: put the drawer's honesty in the body, attribute the per-day rate to
the log, and either add the two-state filter or narrow objective 4.

**T1.17 NEW. `advanced-time-series/exercises/weighted-ensemble.yaml:5`.
The exercise is copyable from the page above it.** The lesson body
prints a complete `weightedEnsemble` with the same name and semantics,
and the instructions point at it: "Plain JS loops (like the lesson's own
version) or tensors, your choice; the grader only checks the numbers."
Nothing in the exercise touches the correlation floor or
evaluate-against-best-member, which is what the lesson teaches. Fix:
grade the gain over the best single member, including a case where every
member carries the same offset error so the ensemble cannot beat it.

**T1.19 NEW. `optimization-edge/02-quantization.mdx:46`. The bytes and
the accuracy come from different models, and the module never notices.**
Every megabyte in the module comes from the language component and every
accuracy point comes from the sub-megabyte classifier. Farah's "we
bought 298 megabytes for 2.4 points of accuracy" is therefore false
economics: exempting the classifier would have bought the same megabytes
for zero points. Selective quantization is never mentioned, though the
converter supports it. Fix: either quantize the language component only
in the fiction, or teach per-layer exemption and have someone say the
2.4 points were a choice.

**T1.20 NEW. `optimization-edge/05-webgpu-acceleration.mdx:153` (with
lesson 3 line 139). File size is treated as runtime memory.** Lesson 2
teaches that quantized weights decode to float32 at load and lesson 3
that pruned zeros stay in place, so 85 million parameters occupy 340 MB
of RAM whether the file is 340 MB or 42 MB. Lesson 5 then says the 340
MB build was fighting the dashboard for memory and the 42 MB build is
not, and credits a three-times latency gain to that relief. The one
number the module owes the reader, the load-time peak of file buffer
plus decoded tensors, is never given. Fix: state the peak arithmetic
once and recast the latency drop as a separate measurement.

**T1.23 Contested, and introduced by the 2026-09-05 remediation.
`capstone/05-launch.mdx:288`. The finale's explanation of the untrained
0.998 does not hold for the event it explains.** The text says that in
the sensors' own coordinates 7741 is an outlier so extreme that any
projection, hand-wired or random, throws it to one far end of the scale.
The event being explained is two fresh random initializations scoring
0.998 and then 0.997. Measured: 300 fresh initializations of the
673-parameter network, using the default initializer the course's own
code uses, score that reading between 0.397 and 0.631, with none above
0.99. Two of three skeptics refuted this finding, arguing that the
sentence scopes its outlier claim to raw sensor space and that a
hand-picked weight vector such as [10, 10, 10] would indeed saturate.
Both points are fair and neither rescues the sentence: the network never
sees raw sensor space, `training-loop/05` pins its actual input at
[0.5, 0.5, 0.5] and explains the 51.8 percent by that centrality, and
the draws in the story were random rather than hand-picked. I wrote this
sentence myself to close T2.5 of the 2026-09-05 audit, and it replaced
an unresolved mystery with a mechanism. Fix: cut the harmonics-overlay
and projection sentences and leave the debt open, which is what the
owner ruling asked for.


### Withdrawn after refutation

I drafted three Tier 1 entries for modules 10 and 11 before their
verifiers had finished, on the strength of my own reading. The skeptics
refuted all three and they were right. They are recorded here rather
than deleted.

- **`optimization-edge/01-model-profiling.mdx:137`, the model identity.**
  I claimed no lesson reconciles a sub-megabyte classifier with an
  85-million-parameter artifact. Refuted 3 to 0: `optimization-edge/02`
  line 46 states the two-ledger split outright, and
  `llm-integration/05` line 197 sets it up a module earlier. What
  survives is the narrower T1.19 about the economics of that split.
- **`optimization-edge/04-caching-strategies.mdx:146`, the cache TTL.**
  I claimed TTL cannot guard against input drift because a fixed model
  is deterministic. Refuted 2 to 1 on a mechanism I had missed: the key
  is a rounded hash, so one entry serves a whole quantization bucket,
  and drift changes which member is typical of that bucket. The residual
  point, that the recap omits the model version the bridge and the
  incident exercise both teach, is a Tier 2 item at most.
- **`capstone/04-documentation.mdx:186`, the runbook.** I claimed that
  re-running the fixed holdout cannot detect a production accuracy drop.
  Refuted 3 to 0: the holdout score moves with the deployed artifact,
  the saved normalization statistics, and the feature path, and this
  module's own CI beat turns on exactly that, a stale artifact scoring
  94.2 where the shipping one scores 91.8. Re-scoring the holdout is a
  legitimate control step. The residual point, that the module never
  says production accuracy needs production labels, is a pedagogy gap
  and sits in Tier 2.

## Tier 2: confusion, wrong numbers, contradictions

Findings that would mislead a careful learner or waste their time,
without leaving them holding a false basic. In module order.

### Module 1, Foundations

- **`01-introduction-to-tensors.mdx:24`.** The bridge callout says a
  Tensor tracks gradient information, which is PyTorch's model. In
  TensorFlow.js only variables receive gradients, and only inside
  `tf.grad`, `tf.variableGrads`, or an optimizer step. Fix: cut the
  clause or tie it to the tape.
- **`03-tensor-operations.mdx:144` and the recall answer at 137.**
  "Use `transpose()` to fix mismatches" contradicts the lesson's own
  opening bug, where the fix was `mul`. Transposing there satisfies the
  inner-dimension rule and silently returns a [64, 64] outer product,
  the exact right-shape-wrong-data failure lesson 2 warned about. Fix:
  ask which product was meant first.
- **`04-data-loading.mdx:103`.** The lazy-window analogy is restated
  four times in one lesson, and the "Why Batching Matters" opener adds
  nothing new. Fix: delete the paragraph and open on the sentence about
  batch size being a deliberate knob.
- **`exercises/batch-data.yaml:18`.** The read-count test cannot detect
  eager preloading, so the lesson's "the grader counts your reads" is a
  bluff. Fix: pull one element from a fresh iterator and assert the
  count advanced by exactly one.
- **`exercises/reshape-tensor.yaml:4`.** The task warns that guessing
  will be caught, but the solution is one `arraySync()[1]` and no test
  touches the reshape-versus-transpose distinction the lesson is built
  on. Fix: add a second deliverable that fails if the learner reaches
  for reshape.

### Module 2, Neural Networks

- **`01-first-neuron.mdx:18`.** The lesson calls itself the first
  neuron and defers activation to lesson 2, but `foundations/05` already
  had the learner run a dense sigmoid neuron with `setWeights`. Fix:
  acknowledge the borrowed neuron in one clause.
- **`01-first-neuron.mdx:84`.** Weight magnitude is taught as feature
  importance with no mention that this only holds when inputs share a
  scale, on inputs named amplitude, frequency, and phase. Fix: one
  clause tying it back to the normalization in module 1.
- **`02-activation-functions.mdx:13`.** The raw scores of -11 and 600
  that drive the lesson cannot come from lesson 1's weights on
  normalized feeds, where the sum tops out near 9, and 600 is then
  reused as data in code. Fix: use reachable numbers or make it a
  visible Demir mistake.
- **`02-activation-functions.mdx:44`.** The objective promises
  implementing three activations; the exercise is a one-line `.relu()`
  and tanh never gets a formula anywhere in the module. Fix: reword the
  objective and give tanh its relation to sigmoid.
- **`02-activation-functions.mdx:99`.** The forward pointer promises
  module 3 will round up both failure modes; the dying ReLU never
  appears again anywhere in the world. Fix: pay it off or narrow the
  promise.
- **`05-building-a-network.mdx:103`.** The 8-input, 833-parameter build
  the learner assembles as the complete classifier vanishes: module 3
  trains the 3-input, 673-parameter model and every later module ships
  that one. Fix: reframe it as a sizing drill or say the spec was
  shelved.
- **`exercises/build-layer.yaml:4`.** The stated skill is counting
  parameters before building, but the count is computed by the library
  and handed over in the guidance hint. Fix: make it a budget problem,
  or require a hand-computed expected count.
- **`exercises/forward-pass.yaml:5`.** The lesson is built around the
  missing batch dimension, and the starter hands the learner an
  already-batched `tensor2d`. Fix: hand over a rank-1 reading and make
  them add the axis.

### Module 3, Training

- **`01-loss-functions.mdx:106`.** The objective and Challenge promise
  binary cross-entropy on the classifier's predictions; the exercise is
  a one-line wrapper around `tf.losses.meanSquaredError` tested on
  regression values with a negative label, and the logits-versus-
  probabilities trap the lesson calls its most important point is never
  exercised. Fix: build MSE from primitives on the lesson's own pair and
  add a cross-entropy case.
- **`02-gradient-descent.mdx:123`.** The epilogue trains the whole
  673-weight network overnight to a loss of 0.31, which lesson 3 (still
  unable to get those gradients) and lesson 4 (the loss "finally
  moving") both treat as not yet possible. Fix: make the overnight run
  the single-weight toy.
- **`03-backpropagation.mdx:119`.** The hand derivation walks the
  squared-error-plus-sigmoid chain that lesson 1 showed starves the
  gradient, keeping the factor lesson 1 proved cross-entropy cancels,
  while the code directly above trains with `sigmoidCrossEntropy`. Fix:
  derive the loss the code uses, or add the one sentence that ties it
  back.
- **`04-training-loop.mdx:24`.** The bridge says an epoch "yields to
  nothing"; `model.fit` yields the thread every 125 ms by default, which
  is the one API fact a JavaScript engineer cares about most. Fix:
  rewrite around what fit really will not do, which is stop mid-sweep on
  a flag.
- **`04-training-loop.mdx:176`.** The reader is told to seed the
  shuffle, but `tf.util.createShuffledIndices` takes no seed. Fix: point
  at a seeded RNG of their own.
- **`05-evaluating-deep-scan.mdx:50`.** The opener says nothing in the
  training logs will warn you about a train-test gap, one lesson after
  Nazari says validation loss is the first number you read. Fix: say
  training loss, or add the no-validation-split condition.
- **`05-evaluating-deep-scan.mdx:200`.** Regularization is the named fix
  for overfitting and the recall answer lists dropout and L2, but no
  lesson or exercise in the world shows either; a grep finds no dropout
  layer and no regularizer anywhere. Fix: trim the recall to what was
  taught, or add a short drawer showing both.
- **`exercises/backprop-chain.yaml:4`.** The backpropagation exercise is
  a strict subset of the previous lesson's (variable gradients on a
  scalar, minus the update) and touches no chain, no layer, and no
  gradient shape, while the youCanNow claims all three. Fix: rebuild it
  on the lesson's own two-layer block.
- **`exercises/training-loop-exercise.yaml:4`.** The training-loop
  exercise has no validation split, no callback, and no stopping rule,
  so the module's central mechanism has no exercise anywhere. Fix:
  require the validation split and the early-stopping callback, and
  assert the run halted before the cap.

### Module 4, Browser Runtimes

- **`03-model-loading.mdx:75`.** The printed `model.summary()` for the
  shipped path shows the 673-parameter stack; the asset actually at that
  path is a 209-parameter 16/8/1 model. Fix: ship the model the story
  trained, or print what the loader returns.
- **`03-model-loading.mdx:184`.** The Challenge and youCanNow promise
  caching with version invalidation; the exercise only reads three
  properties off a loaded model, while the epilogue's consequence rests
  on an unversioned key. Fix: grade the cache path or drop the claim.
- **`05-onnx-runtime-web.mdx:56`.** The opset check is the lesson's
  central portability rule and is asserted to have passed, but nothing
  shows how to export a TF.js model to ONNX or how to read an opset, so
  the learner cannot produce the file the lesson loads. Fix: add the
  converter and check commands.
- **`05-onnx-runtime-web.mdx:137`.** The ONNX half of the head-to-head
  is seventeen lines of prose inside a code comment, and its memory
  figure reads a WASM heap that is never measured and is not comparable
  to `tf.memory().numBytes`. Fix: show the code, or drop the memory
  column.
- **`05-onnx-runtime-web.mdx:168`.** The table blames TF.js's cold start
  on shader compilation, but the benchmark stops that clock before any
  shader compiles. Fix: move the clock or relabel the cause.
- **`exercises/browser-ml-tradeoffs.yaml:16`.** The starter comments
  spell out the full decision tree with thresholds and precedence, so
  the exercise is transcription. Fix: leave the thresholds in the lesson
  table.
- **`exercises/incident-tensor-leak.yaml:16`.** The starter ships a
  numbered recipe that is the solution, and the instructions repeat the
  formulas. Fix: keep the concept comment, cut the recipe.

### Module 5, Signal Processing

- **`02-fourier-transform.mdx:129`.** The body prints a complete
  `findDominantFrequency` and the exercise asks for exactly that
  function. Fix: cut the body to a sketch, or retarget the exercise at
  the peaks-above-floor loop nobody codes.
- **`03-spectrograms.mdx:135`.** The demo asserts its output shows the
  anomaly pulsing, but the clip is four seconds and the pulse period is
  73.4 seconds, so all seven windows read the same. Fix: use a capture
  long enough to show the gap, or say the pattern needs minutes.
- **`04-fft-as-features.mdx:199`.** The headline 87% points at training
  accuracy on the epoch log while the validation figure on the same line
  is 86.2, against the held-out reporting rule module 3 taught. The log
  also skips the Epoch 20 line its own callback would print. Fix: report
  the held-out number and add the missing line.
- **`05-windowing-and-overlap.mdx:104`.** The Hamming comment stacks
  four undefined terms (main lobe, sidelobe, dB, dB per octave) and is
  the only material for the objective about choosing a window. Fix:
  define the two shapes in plain words and move the figures to the
  drawer.
- **`exercises/apply-window.yaml:5`.** The instructions print the Hann
  formula, the body prints both functions, and no test computes an FFT,
  so the learner never sees leakage suppressed. Fix: grade the effect,
  not the formula.
- **`exercises/time-vs-frequency.yaml:4`.** Two generic array scans over
  precomputed arrays; nothing the learner writes touches a signal, a
  sample rate, or a frequency. Fix: have them build the twin pair and
  report which frequency diverged.

### Module 6, Recurrent Networks

- **`01-sequences-matter.mdx:99`.** Single rows are tagged rising and
  falling and the first three-row window is called rise-rise-fall, but
  three rows hold two transitions and they go up then down, which cuts
  against Farah's point that the pattern lives across rows. Fix:
  annotate transitions, not rows.
- **`04-sliding-windows.mdx:173`.** The RecallPrompt asks a recognition
  question whose answer is in the question, and tests a lesson 2 point
  rather than this lesson's split-before-window leak. Fix: ask why a
  97% score from a lookup is not evidence of learning.
- **`04-sliding-windows.mdx:179`.** Two labeling conventions run side by
  side without being named: the callout, `createWindows`, and the recap
  put the label after the window, while the mirror, the hint, and the
  graded exercise label by the last reading inside it. A learner who
  follows the callout fails the grader. Fix: name both conventions and
  say which task each belongs to.
- **`05-sequence-prediction.mdx:76`.** MAE is an objective, a compiled
  metric, and a recap bullet, and is never expanded or defined in the
  module, any earlier module, or the glossary. Fix: one sentence and a
  glossary entry.
- **`exercises/predict-next.yaml:4`.** The exercise builds an untrained
  model and touches none of the lesson's four objectives, and the
  [10, 2] shape is never explained. Fix: grade the multi-step forecast
  loop the lesson is about.

### Module 7, Anomaly Detection

- **`05-the-anomaly.mdx:174`.** The finale's only RecallPrompt re-asks
  lesson 2's autoencoder question almost verbatim and never tests this
  lesson's own idea, that ensemble agreement is an evidence count rather
  than a probability. Fix: ask why two of three firing is not a 67%
  probability, and what three agreeing detectors that share an input can
  actually claim.

### Module 8, Advanced Time-Series

- **`02-temporal-attention.mdx:188`.** The Challenge and the youCanNow
  promise building a temporal attention mechanism and identifying the
  focused steps; the exercise hands over already-normalized weights and
  asks for a reshape and one `matMul`, a strict subset of lesson 1's
  exercise. The nudge hint concedes it: "The weights are handed to you
  already normalised." Fix: give raw per-step scores and require the
  weights, the pooled vector, and the top steps.

### Module 9, LLM Integration

- **`05-multi-model-systems.mdx:180`.** The recap, the RecallPrompt, and
  the frontmatter describe a sequential chain where the classifier's
  output becomes the detector's input, but `pipeline.ts` fans out: three
  stages each consume the raw signal and only the reporter reads the
  others. Fix: pass the classification into the anomaly stage, as the
  exercise already does, or describe the fan-out.

### Module 10, Optimization and Edge

- **`02-quantization.mdx:63`.** The comment says a five-class 94.2 is
  comparable to the binary 94 because both mean argmax hits the true
  column. Chance is 20% on the five-way task and 50% on the binary one,
  and the class mix changed with the catalog labels, so the 78, 87, 94.2
  ladder is not one series. Fix: say a five-way 94.2 is a harder number
  and treat it as a new baseline.
- **`03-pruning.mdx:129`.** The 42 MB figure depends on a sparse weight
  encoding TensorFlow.js does not have; a learner following the tools
  the module teaches gets 85 MB. The module never says how a 60%-zero
  model is stored or loaded at 42 MB. Fix: name the mechanism, either a
  custom sparse handler or the honest alternative that the dense file
  compresses on the wire and stays 85 MB on disk.
- **`exercises/inference-cache.yaml:26`.** The graded solution caches
  and re-serves the live output tensor, so any caller that disposes its
  result, which is the discipline lesson 1 teaches, poisons every later
  cache hit with a disposed tensor. The tests never read the returned
  value, so the grader cannot see it. Fix: cache a plain value, and add
  a test that reads the result on the second call.

### Module 11, Capstone

- **`01-system-architecture.mdx:165`.** The registry declares a fork and
  join that the linear `Pipeline` class shown just above cannot execute,
  and the text never reconciles the two topologies. Fix: drop the extra
  dependency, or say the manifest is a graph and the runner shown is its
  linear special case.
- **`04-documentation.mdx:132`.** The documented input contract is an
  80-sample window across two lessons and the model-card exercise, but
  every earlier module built the feature extractor on a 64-sample
  capture whose eight fixed FFT bins are defined at that window's 4 Hz
  resolution. Fix: change 80 to 64, or say the production window was
  widened and the FFT consumes the first 64.
- **Residual from a refuted finding.** The module never states that
  production accuracy needs production labels, which is why confidence
  and input drift are the proxies you monitor. The runbook step itself
  is fine (see the withdrawal note above), but this basic is missing.


## Tier 3: nits

Real but small. One line each, in module order.

### Module 2

- `05-building-a-network.mdx:96`: a meta-announcing header over bullets
  that restate the code comments four lines above.
- `exercises/implement-neuron.yaml:28`: a test calls its case "the
  lesson example" when the lesson's example uses different numbers and a
  different answer.

### Module 3

- `03-backpropagation.mdx:71`: the discovery reveal names a function the
  learner called an hour earlier in lesson 2's exercise.
- `04-training-loop.mdx:50`: the objective promises recognizing
  underfitting from the curve; the word never appears in the body.
- `04-training-loop.mdx:54`: `setImmediate` used with no browser gloss,
  and "drain loop" coined and then reused as a known term.
- `04-training-loop.mdx:61`: "from previous lesson" points at lesson 3,
  which built a different, hand-rolled network.
- `04-training-loop.mdx:223`: the only RecallPrompt tests a drawer aside
  about batch sizing rather than the validation-stopping idea the whole
  lesson is built on.

### Module 4

- `02-tensorflow-js-setup.mdx:52`: the prose names three backends and
  omits WebGPU, which the objective and the code block in the same
  lesson both include.
- `02-tensorflow-js-setup.mdx:131`: the warm-up leaks the transpose
  intermediate, in a block whose comment says always dispose.
- `03-model-loading.mdx:190`: the recap introduces two analogies the
  body never used, one of which names a fetch progress event that does
  not exist.
- `04-inference-pipeline.mdx:24`: saliency maps and attention
  visualization named two modules before attention exists.
- `04-inference-pipeline.mdx:53`: the objective promises optimizing
  latency; the lesson only measures it.
- `04-inference-pipeline.mdx:66`: "the 64-sample capture window"
  collides with canon, where a capture is 33 seconds at 256 Hz.
- `05-onnx-runtime-web.mdx:173`: ONNX ships to a "backup system" with no
  antecedent and no successor anywhere in the world.
- `05-onnx-runtime-web.mdx:177`: the Challenge promises a comparison
  with TF.js that the exercise does not perform.
- `06-transformers-js.mdx:79`: "two lessons ago" points at lesson 4; the
  IndexedDB caching is in lesson 3.

### Module 5

- `02-fourier-transform.mdx:164`: the noise floor is the mean of all
  bins including the peaks it is meant to detect, so the threshold is
  set by the signal and the anomaly clears it by 12%.
- `03-spectrograms.mdx:177`: the drawer calls 75% overlap the common hop
  while the body and lesson 5 call 50% the standard.
- `04-fft-as-features.mdx:220`: a whatYouLearned bullet carries scene
  references, which the style bible says must be story-stripped.
- `05-windowing-and-overlap.mdx:208`: leakage described as spurious
  high-frequency energy when the lesson's own demo shows the largest
  leak below the tone.
- `05-windowing-and-overlap.mdx:214`: Hamming said to taper edges to
  zero; the lesson's own formula gives 0.08 there, which is why its far
  sidelobes decay slowly.
- `exercises/apply-window.yaml:24`: the describe blocks name a tensor
  implementation the instructions say is optional.

### Module 6

- `02-simple-rnns.mdx:148`: the gradient product is presented as only
  able to shrink; exploding gradients and clipping are never mentioned.
- `03-lstm-gates.mdx:88`: the cell-state gradient is called slowly
  decaying rather than exponential, when the real point is that the
  per-step factor is learnable and can sit near 1.
- `03-lstm-gates.mdx:152`: the GRU comparison is delivered as two code
  comments and a rule of thumb; the reset and update gates are named and
  never explained.
- `exercises/predict-next.yaml:35`: no test checks the output layer is
  linear, so a sigmoid output passes and would silently clamp forecasts.
- `exercises/sliding-window.yaml:79`: a pure data-preparation exercise
  tagged `model_arch`, with an untyped starter where the module's others
  are typed.

## Per-module notes

**1 Foundations.** Protect the canon arithmetic, which four readers
checked and none broke: 28,800 readings, 33-second windows, 256 Hz
across 64 channels, the 2 MB and 40 GB figures, 7741 arriving on day 3.
Protect the garbled-channels reshape in lesson 2 and the normalize-data
exercise, which is the one grader in the module that tests
understanding. What weighed against it: the module that teaches
`numTensors` as the leak detector ships a leaking split, the shuffle
paragraph teaches a false mechanism, `.batch(32)` is credited with the
memory fix the generator actually provides, and two graders claim to
catch guessing that they cannot catch.

**2 Neural Networks.** Protect the numbers, which are the module's real
achievement: every parameter count is a real count, the cold-open error
string is the true TensorFlow.js 4.22.0 output, and the `model.summary()`
table matches the runtime column for column. What weighed against it:
all five exercises are one-to-four-line transcriptions whose full answer
sits in the guidance hint, so the three lessons with a genuine
conceptual point grade only the API surface around it, and the model's
three inputs are named three different ways.

**3 Training.** Protect the two best drawers in the world: the
cross-entropy cancellation in lesson 1 and the numeric-gradient-first
approach to backpropagation in lesson 3. What weighed against it:
validation and test are never separated, the module's own central
mechanism (stopping on the validation curve) has no exercise anywhere,
and lesson 2's epilogue performs training that lesson 3 says is not yet
possible.

**4 Browser Runtimes.** Protect the browser realities, which are
accurate and hard to find elsewhere: backend selection, the memory
model, and the incident exercises. What weighed against it: a bridge
callout that is simply false about which runtimes execute ONNX, a
head-to-head that varies two things and reports the result as a rule,
and an exercise that grades the confidence definition the lesson calls a
mistake.

**5 Signal Processing.** Protect the derivations and the demos, where
every printed number reproduces from the code, and protect the COLA
drawer, which is right where the body is wrong. What weighed against it:
two mechanism statements contradicted by the module's own drawer and
recap, and two graders that never test the formula their lesson is
about.

**6 Recurrent Networks.** Protect the nearest-neighbour leak
demonstration in lesson 4, which is still the sharpest single teaching
beat in the world, and the hand-run tanh drill, which reproduces exactly
and makes its point by computing before arguing. What weighed against
it: the module never answers why not just flatten the window, while its
graders reject that answer, and it runs two labeling conventions side by
side without naming either.

**7 Anomaly Detection.** Protect lesson 4's cost-asymmetry argument and
lesson 3's per-feature error map, both of which teach by mechanism, and
the z-scores that recompute cleanly. What weighed against it: the
retrieval surfaces enshrine two folk beliefs the bodies argue against,
"baseline" means the normal mean in one lesson and the normal max in the
next, and threshold tuning by F1 needs labels the module says are not
required.

**8 Advanced Time-Series.** Protect both derivation drawers, which
readers called correct and unusually honest, and the Kalman gain
derivation in particular. What weighed against it: a drift detector that
cannot tell horizon compounding from non-stationarity, a filter credited
with tracking a drift its own run lags, and three of five exercises that
would pass a learner who understood nothing beyond reshaping.

**9 LLM Integration.** Protect lesson 1's "What You Are Actually
Calling" section, which readers independently named the best teaching in
the module: it rebuilds an LLM from parts the learner already owns and
lands hallucination in one true line about what the loss optimizes. What
weighed against it: the module's headline lesson is asserted in four
places and demonstrated in none, retrieval's actual mechanism is named
once in a comment, and the language model moves from an HTTP service to
weights inside the bundle without anyone saying so.

**10 Optimization and Edge.** Protect the mechanisms, which are given
rather than folk-told: affine min-max quantization with scale and zero
point, magnitude pruning with its justification, a correct LRU, and the
readback rule. What weighed against it: the module's spine contradicts
itself on whether a smaller file is a smaller running model, the 42 MB
figure needs a sparse format TensorFlow.js does not have, the accuracy
cost was paid on a model that carries none of the bytes, and every
Challenge line promises a measurement that no exercise performs. Two of
my own findings here, on the model identity and on the cache TTL, were
refuted; see the withdrawal note.

**11 Capstone.** Protect the launch rehearsal and the model-artifact
export, the two exercises that leave a learner able to do the thing, and
the finale's callbacks, which all recompute. What weighed against it: an input
contract of 80 samples where every earlier module built on 64, an
architecture manifest the runner shown cannot execute, a model card
describing a split nobody ran, and one paragraph in the finale whose
explanation does not survive being run. My finding against the runbook
was refuted; see the withdrawal note.

## Coverage and limits

- **What was read.** All 56 lessons and all 65 exercise files, each
  lesson by four independent readers, plus four readers who tracked
  threads across the whole world.
- **What was thrown away.** Refutation was not a formality. Of the 277
  findings that reached adjudication, 95 survived and 182 were dropped,
  including several I would have kept.
- **The merge cap.** Each module's merge was capped at 25 findings, and
  the merge agents reported dropping between 12 and 22 low-severity
  items each, about 190 in total. Those are not in this document. They
  were single-lens nits, and they are recoverable from the run journal
  if anyone wants them.
- **Two different skeptics, and this matters.** The model limit was
  exhausted twice during this audit. 154 findings, covering modules 1
  through 6 and part of 9, were refuted by one model: 82 survived. The
  remaining 123, covering modules 7, 8, 10, 11 and the rest of 9, were
  refuted by a different and much stricter model after the limit reset:
  13 survived. That second pass dropped 110 findings, and 65 of those
  had at least one skeptic who said the finding stands, killed by my
  rule that a medium finding needs both of two skeptics to let it live.
  So the short finding lists for modules 7, 8, 10 and 11 are partly an
  artifact of the filter, not evidence that those modules are cleaner.
  Grades are unaffected, because they come from the 44 module readings,
  all done under the same conditions before any limit was hit.
- **Three findings I got wrong.** I drafted Tier 1 entries for modules
  10 and 11 before their verifiers finished, and the skeptics refuted
  all three. They are recorded in the withdrawal note rather than
  deleted. The lesson is the same one this audit makes about the
  content: do not write the claim before you have checked the page
  behind it.
- **What was not done.** No browser rendering, no visual check, no
  accessibility pass, no end-to-end run. Exercises were judged by
  reading them against their own tests, and a handful were executed; the
  other 60 were not run. The content gates were green before this audit
  and were not re-run against changes, because nothing was changed.
- **What I ran myself.** Eleven claims were settled by execution or
  direct comparison rather than by reading, listed above. Where an agent
  and an execution disagree, the execution is what this document
  reports.

## Recommended order

1. **The four wrong mechanisms a learner will carry out of the world.**
   Aliasing (T1.9), the overlap rule (T1.10), the shuffle buffer (T1.2),
   and the drift detector (T1.15). Each is one or two paragraphs, and
   each currently teaches something false. The Kalman attribution
   (T1.16) belongs with them if you count a misattributed number as a
   wrong mechanism.
2. **The four graders that certify what they do not test.** compute-fft
   (T1.11), profile-model (check 6 above), fft-features (T1.12), and the
   confidence contradiction in inference-pipeline (T1.8). The first two
   can be beaten by a solution that does nothing; the last one punishes
   a learner for following the lesson.
3. **The six basics that are named and never taught.** Broadcasting
   (T1.1), weight initialization (T1.4), validation versus test (T1.5),
   regularization as a mechanism, mean absolute error, and the real
   reason a recurrent cell beats a flattened window (T1.13). These are
   the difference between a finisher who can explain the topics and one
   who can recite them.
4. **The three false claims about the world's own artifacts.** The ONNX
   cross-runtime line (T1.6), the file-size-as-memory claim (T1.20), and
   the finale's projection sentence (T1.23), which I introduced.
5. **The tensor leak (T1.3), the quantization economics (T1.19), and the
   42 MB storage mechanism.** Code and bookkeeping rather than prose,
   and all three undercut modules that are otherwise strong.
6. **Tier 2 by module, then Tier 3.** Several Tier 2 items share a file
   with a Tier 1 item, so doing them in the same sitting is cheaper.
7. **Carried over and still open.** The exercise mix (this audit found
   the same pattern from a different angle and it is now the largest
   single theme), and the visual baseline re-mint the 2026-09-05 re-pace
   requires.
