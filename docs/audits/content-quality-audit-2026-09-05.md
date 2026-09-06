# Deep Orbit content quality audit, 2026-09-05

Owner request: grade the Deep Orbit lessons on whether each module
delivers the best content it can, whether each brings a JavaScript
engineer closer to the basics of machine learning, whether a learner who
finishes can honestly explain the topics the world covers, and where the
text is ambiguous, padded, or acting clever without paying for it.

Method: every one of the 56 lesson MDX files (86,077 words) and all 65
exercise YAML files were read end to end, in curriculum order, by one
reader holding the target audience in mind (working JavaScript engineer,
browser or Node, zero ML). Every number the lessons assert that could be
checked by hand was checked (the list is in the appendix). The
mechanical gates were run first: `packages/content` vitest, 31 files,
413 tests, all green. Every finding below is therefore judgment-tier.
Nothing was edited; this document is the deliverable.

## Verdict in four answers

**1. Is every module delivering the best content it can?** No, but the
median is high. Modules 1, 2, 3, 5, 6, and 7 are close to the ceiling for
a first ML course aimed at this reader: concrete, correct, and the
arithmetic on the page checks out. Modules 4, 10, and 11 are deployment
modules and are honest about it; their ML content is thin by design and
their time estimates are padded. Module 8 carries two lessons that
overlap and one conceptual hole. Module 9 is the weakest: it teaches
LLM tooling well and LLM understanding almost not at all.

**2. Is every module bringing the learner closer to ML basics?** Modules
1 through 3 build the supervised-learning core in the right order
(tensor, neuron, activation, layer, loss, gradient, backprop, loop,
evaluation) and each step is motivated by a failure before it is named.
Modules 5 through 8 add features, sequences, unsupervised detection, and
attention. Modules 4, 9, 10, 11 add operations knowledge a JavaScript
engineer will use, with three or four ML ideas each. The one module that
should teach more ML than it does is 9.

**3. Can a JavaScript engineer who finishes explain these topics?** For
most of the world, yes: what a tensor is, what a neuron computes, why
activations exist, what a loss is and why cross-entropy beats MSE with a
sigmoid, what a gradient is and why backprop exists, what overfitting
looks like and why held-out evaluation is the honest number, what an FFT
returns, why order is information and how an LSTM keeps it, how an
autoencoder detects the unfamiliar, what attention weights are. Four
things they will not be able to explain, because the text never says
them: what a hidden layer actually computes (module 2), why attention
needs to be told about position (module 8), how the LLM they call in
module 9 relates to the attention they built in module 8, and why batch
size is a training decision rather than a memory trick (module 1). And
one thing they will never have done: no exercise in the world trains a
classifier and reads its held-out accuracy.

**4. Ambiguity, fuss, acting smart without delivering?** The prose is
almost free of the usual AI vocabulary; the earlier sweeps did their
job. What remains is structural: narrative bookkeeping paragraphs that
reconcile the story's numbers before a lesson can start, code blocks
that are prose wearing braces, two direct contradictions between
lessons, and a finale explanation that contradicts the ML the course
taught. All are listed with line numbers below.

## Grades

| Module | Grade | One-line reason |
|---|---|---|
| 1 Foundations | A- | Reshape-vs-transpose and the lazy pipeline are best-in-class; batching and shuffling are justified by memory and hand-waving rather than by training |
| 2 Neural Networks | A- | Parameter counting is exact and the forward-pass error is real; the leap from one neuron to "a layer finds patterns" is never explained |
| 3 Training | A | Strongest module. Numeric-gradient-first backprop, 400-rerun honesty, Bayes base-rate drawer, all verified correct |
| 4 Browser Runtimes | B+ | Honest deployment module; two continuity seams (which model shipped, what the three inputs are called) |
| 5 Signal Processing | A- | "Access, not information" is the right framing; two paragraphs of scoreboard retcon before lesson 4 starts |
| 6 Recurrent Networks | A- | Lesson 4's overlapped-split leak demonstration is the single best teaching beat in the course |
| 7 Anomaly Detection | A- | Cost-asymmetry lesson is excellent; bottleneck mechanism stated only in a hint |
| 8 Advanced Time-Series | B+ | Kalman and ensemble derivations are correct and candid; lessons 1 and 2 overlap, lesson 3 repeats module 6, positional information never mentioned, one Farah line contradicts another |
| 9 LLM Integration | B | Verification discipline is the right theme; the module never connects the LLM to anything the learner built, and four of six exercises are string plumbing |
| 10 Optimization | B+ | Pruning saliency drawer and the storage-not-execution honesty about quantization are strong; a ledger-reconciliation paragraph and a mid-sentence retcon to five classes |
| 11 Capstone | B+ | Stale-artifact CI story is a real lesson; time estimates doubled, finale contradicts its own ML |
| Exercises (65) | B | Test design is strong (identity probes, anti-memorization cases); too many "type this config" and "join these strings" tasks; no real training exercise |

Overall: **B+**. Foundations track (modules 1 to 3) is A-. The
specializations range A- to B. The world teaches supervised learning,
sequences, and anomaly detection well enough that a learner can explain
them; it teaches LLMs as an API.

## Findings, ranked

Severity is about learning outcome, not prose polish. Tier 1 items
change what a finisher can explain. Tier 2 items are contradictions a
careful reader will notice. Tier 3 is fuss. Tier 4 is nits.

### Tier 1: gaps that limit "understands ML basics"

**T1.1 No exercise trains a classifier and reads its held-out
accuracy.** The lessons show it (module 3 lesson 4 trains on 100 rows
with 400 reruns quoted; lesson 5 evaluates 50 held-out rows). The
exercises do not. `training-loop-exercise` fits a one-unit linear model
on four points for ten epochs. `deep-scan-eval` says in its own
instructions that the model is untrained and "the numbers it returns
mean nothing yet; what you are practicing is the shape of the call."
Nothing later closes the loop: `build-rnn`, `build-lstm`,
`build-autoencoder`, `predict-next`, `simple-network` all stop at
compile. A learner can finish all 65 exercises without once having
trained a model whose accuracy they then read and judged. This is the
largest gap between what the world claims ("train a working classifier
by module 3") and what the learner's hands have done. Fix: one exercise
in module 3 or 7 that ships a small real dataset (the synthetic calm and
flagged clusters from lesson 4 would do), trains, evaluates on a
held-out slice, and grades on the train-versus-test gap being read
correctly rather than on a fixed accuracy.

**T1.2 Module 9 never connects the LLM to the attention built in
module 8.** The word "attention" does not appear in module 9. "Token"
appears only inside a recap bullet (`llm-integration/01`, line 183) and
a code option name. The module teaches prompts, RAG, verification, and
orchestration, all correctly, and treats the model as an opaque HTTP
endpoint. A learner who just built softmax attention over 80 time steps
is never told that the thing they are calling is a stack of that same
mechanism predicting the next token, that temperature is a knob on the
softmax they just computed, or that "context window" is the sequence
length they just windowed. One paragraph in lesson 1 would turn module 9
from "tooling" into the payoff of module 8. Fix: a short section in
lesson 1 (next-token prediction, tokens, temperature as softmax
sharpening) that points back at `advanced-time-series/01`.

**T1.3 Attention discards order, and module 8 never says so.** Module 6
spends five lessons establishing that order is information. Module 8
introduces a mechanism that is permutation-invariant by construction
(nothing in `simpleAttention` knows which step came first) and never
mentions positional encoding. No lesson in the world contains the words
"positional" or "permutation." The hybrid in lesson 1 keeps order only
because the LSTM encoder is still in front of the attention head, and
the text does not say that either. A learner who removes the LSTM, as
the lesson says "production transformers" do, will build a model that
cannot tell rise-fall-rise from fall-rise-rise, the exact failure module
6 lesson 1 taught them to fear. Fix: one paragraph in
`advanced-time-series/01` or `/02` naming the property and the standard
patch.

**T1.4 What a hidden layer computes is never stated.** Module 2 lesson 3
introduces layers with "a 16-unit stage that finds patterns in what the
first stage produces" (`neural-networks/03`, line 49). The lesson counts
parameters exactly and explains the middleware bridge, but the sentence
"a dense layer is N copies of the lesson-1 neuron reading the same
inputs side by side, and the next layer's neurons read those N outputs
as their inputs" does not appear anywhere. Line 86 implies it ("one
weight for every incoming value on every unit"). The recall answer says
"units sets the number of neurons." The composition idea, which is the
whole reason depth helps, is left for the reader to infer. Fix: two
sentences after line 49, plus a one-line note that the activation
between layers is what stops the stack from collapsing (lesson 2 already
proved the collapse; lesson 3 should cash it in).

**T1.5 Logits versus probabilities: two loss APIs, never reconciled.**
Module 3 lesson 1 uses `tf.losses.sigmoidCrossEntropy` on raw logits
with a code comment as the only gloss of "logit"
(`training-loop/01`, line 68). Lesson 3 builds a network with no output
sigmoid and feeds logits to the same function. Lesson 4 compiles the
module-2 network, which has a sigmoid output, with
`loss: 'binaryCrossentropy'` (`training-loop/04`, line 66). All three
are correct. The lesson never says that these are the same loss reached
from two ends, that `binaryCrossentropy` expects probabilities and
`sigmoidCrossEntropy` expects the number before the sigmoid, or when to
pick which. "Logit" is not in the glossary. A learner who mixes them will
train a model that silently learns the wrong thing, which is the
category of bug this course otherwise hunts hardest. Fix: one paragraph
in lesson 1 and a glossary entry.

**T1.6 Batch size and shuffling are justified by the wrong reasons in
module 1.** Lesson 4 explains batching as virtual-list memory
management (`foundations/04`, line 101) and shuffling as "prevents the
model from learning the order the data arrived in" (line 99). Module 3
lesson 4's drawer later gives the real reasons (mini-batch gradient
estimate quality, breaking correlation between adjacent batches). The
module-1 framing is not wrong, but it teaches a JavaScript engineer that
32 is a memory number, and nothing in module 1 says it is also the
number that sets how noisy each gradient step is. Fix: one sentence in
lesson 4 pointing forward ("32 is also a training decision; module 3
explains why") so the memory framing is not the only one they carry.

### Tier 2: contradictions and continuity ambiguities

**T2.1 Farah says opposite things about LSTM memory, five lessons
apart.** `recurrent-networks/03`, line 59: "Within a window it can carry
the first step at full strength all the way to the last."
`advanced-time-series/01`, line 46: "it cannot hold step 4 at full
strength while it walks to step 80." Same character, same 80-step
window, opposite claims. The truth is that the cell-state highway makes
it possible in principle and dilution makes it unreliable in practice,
which is exactly the motivation module 8 needs. Fix: soften the module-6
line to "can carry the first step a long way" or make the module-8 line
say "in practice" and reference the earlier claim as the thing that
turned out to be optimistic.

**T2.2 The three input features have two names.** `training-loop/04`,
line 69, names them "[band energy, spectral stability, phase
coherence]." `browser-runtimes/04`, line 62, `signal-processing/04`,
line 70, and `recurrent-networks/05`, line 70, name them "[amplitude,
frequency, phase]." A learner tracking "what does DEEP SCAN actually eat"
gets two answers. The seeded training data in module 3 (calm runs hot on
stability, flagged runs hot on energy) also does not obviously match
amplitude, zero-crossing count, phase. Fix: pick one vocabulary; the
later one is used in five places.

**T2.3 The classifier becomes five-class inside one sentence of module
10.** `optimization-edge/02`, line 46: "That same retrain is when the
head widened: Farah's catalog labels finally landed, and the old binary
anomaly-or-noise gate became five classes (pulsar, quasar, noise,
interference, anomaly)." Every lesson before this trains and evaluates a
binary sigmoid model. The change is architecturally real (a 5-class head
needs softmax and categorical cross-entropy, neither taught) and is
delivered as a subordinate clause in a paragraph about a memory ledger.
The capstone model card then documents the five classes as if they had
always existed. Fix: either keep the classifier binary throughout (the
story does not need five classes) or give the widening one honest
paragraph where softmax and categorical cross-entropy are named, since
`softmax` was already introduced in module 8.

**T2.4 Which model got deployed?** Module 3 trains a 32/16/1 network
(673 parameters, named on the engineering board). Module 4 lesson 3
loads and prints a 16/8/1 network (`browser-runtimes/03`, lines 71 to
73: 64, 136, 9 parameters). The capstone export exercise uses 16/8/1
again and calls it "the bench copy." No lesson says the deployed model
differs from the trained one or why. Fix: either print the 673-parameter
summary in module 4 or add the clause "a bench copy, not the 673."

**T2.5 The finale explains the untrained 0.998 with a mechanism the
course's own ML rules out.** `capstone/05`, line 302: "an arbitrary
projection, hand-wired or random, throws it to the far end of the
scale." A random projection of an extreme outlier lands at an extreme
value, but the sign is random: two independent initializations are as
likely to score it 0.002 as 0.998. Module 2 lesson 5 had ARIA say
exactly this ("the probability that both draws push one specific
reading past 0.99 is as near zero as anything I am permitted to log").
The finale's explanation therefore contradicts the one honest line the
story gave about it. The style bible protects the 73.4 Hz / 73.4 s
coincidence as deliberately unresolved; this one is a different thread
and the resolution is the problem. Fix: either leave it unresolved like
the other coincidence, or have ARIA note the sign problem and decline to
close it.

**T2.6 Model card input contract.** `capstone/04`, line 132, documents
the input as "Float32Array of 80 signal samples, normalized to [-1, 1]."
Module 4 taught min-max to [0, 1] and module 5 taught z-score; the
monitoring lesson two files earlier lists the model's real input as the
11-feature vector. The API doc in the same lesson resolves it (80 raw
samples in, features extracted internally) but the normalization range
matches nothing taught. Nit-level on its own; listed here because it is
the document the lesson says a stranger would operate the system from.

### Tier 3: fuss, padding, and repetition

**T3.1 Narrative bookkeeping before the lesson can start.** Four
lessons open with a paragraph or more whose only job is to reconcile the
story's numbers with the previous story's numbers:

- `signal-processing/04`, line 44: two paragraphs explaining where module
  3's 94 percent went (re-annotation dropped it to 78). The underlying
  point (labels can be wrong) is a real lesson, but it is delivered as a
  patch, and a reader who trusted module 3's evaluation lesson now has
  to re-trust it.
- `recurrent-networks/05`, line 125: a paragraph reconciling the demo's
  47 one-second steps with the story's 47 minutes (38 steps at 73 s).
  Honest, and the objective "sanity-check a forecast's horizon" is
  legitimate, but the paragraph exists because the demo and the
  epilogue were written to different clocks.
- `optimization-edge/02`, line 46: the "two different ledgers" paragraph,
  which has to explain that the 85 million weights being quantized
  belong mostly to the LLM component while the accuracy being measured
  belongs to the classifier, and then retcons the classifier to five
  classes on the way past.
- `capstone/05`, line 302: the debts paragraph (see T2.5).

Each is under 200 words. Together they are the clearest instance of
"text with too much fuss" the owner asked about. Fix: for the first
three, decide the number once and let the earlier lesson carry it; the
patch paragraphs then delete.

**T3.2 Prose in code blocks.** Code blocks that contain no runnable
demonstration, only comments asserting a result:

- `anomaly-detection/01`, line 139, `precision-recall.ts`: 25 lines of
  comments and two three-line functions.
- `advanced-time-series/05`, line 123, `why-ensembles.ts`: the
  "ensemble error / sqrt(N)" claim and example MAEs live in comments; the
  function underneath computes MAE but never the sqrt(N) claim.
- `recurrent-networks/02`, line 146, `vanishing-gradient.ts`: builds two
  models and asserts in comments that one "works" and one "fails" without
  running either. The epilogue does the real demonstration.
- `advanced-time-series/03`, line 83, `trustHeuristic`: a hand-tuned
  linear decay whose comment admits it is a placeholder for a real
  interval. It encodes nothing the sentence above it did not.
- `capstone/05`, line 239, `classify-anomaly.ts`: sixty lines of
  `console.log` story. This is the finale and it reads well; it is still
  narrative in a code block.

The house rule (style bible, "term and code styling") is that backticks
are for code. Fix: move the assertions to prose or make the blocks run
and print the number they claim.

**T3.3 Overlap and repetition.**

- Module 8 lessons 1 and 2 teach the same idea (attention weights show
  where the model looked) with the same example (step 4 and step 77,
  `advanced-time-series/02`, line 42). Lesson 2 adds a learnable scorer,
  the truncation failure, and the "attention is not explanation" caveat.
  Those three could live in lesson 1 and the slot could carry T1.3.
- Module 8 lesson 3's multi-step forecasting loop is the same loop, with
  the same recap point about compounding error, that module 6 lesson 5
  already taught. New content in lesson 3 is non-stationarity and the
  drift ratio, which is one section.
- The GPU-readback benchmarking rule is taught in full three times
  (`browser-runtimes/02`, `browser-runtimes/05`, `optimization-edge/05`)
  and referenced eight times. Twice would be reinforcement.
- Two exercises in module 6 are the same function: `create-sequences`
  (window plus stride plus next-reading label) and `sliding-window`
  (window plus next-reading label, no stride). The second is a subset of
  the first, three lessons later.
- Precision and recall are introduced in module 3 lesson 5's drawer,
  then re-introduced from scratch in module 7 lessons 1 and 4.
  Reinforcement is fine; lesson 1's version should say "from module 3."

**T3.4 Time estimates are padded in the last three modules.** Words per
estimated minute, from the frontmatter:

| Range | Modules | Words per minute |
|---|---|---|
| Foundations, signal, recurrent | 1, 5, 6 | 100 to 147 |
| LLM, optimization, capstone | 9, 10, 11 | 44 to 81 |

Modules 9, 10, and 11 each total exactly 130 estimated minutes;
module 1 totals 58. Lessons with the lowest density: `llm-integration/05`
(44 words per minute, 30 minutes), `capstone/01` (46, 30 minutes),
`llm-integration/03` (46, 30 minutes). These are not the densest lessons
in the world; module 3 lesson 4, with two long drawers and 2,289 words,
carries 18 minutes. Either the later estimates should come down by
roughly half or the earlier ones should go up. A learner who budgets 130
minutes for module 9 and finishes in 60 concludes the estimates are
decorative.

### Tier 4: nits

- `training-loop/04`, line 72, comment: "a net trained on pure noise
  would sit at loss 0.693 forever." A 673-parameter network on 100 rows
  memorizes noise; training loss falls and validation stays at 0.693.
  The comment contradicts the memorization point the same lesson makes
  400 words later.
- `signal-processing/04`, line 86: `phase = Math.atan2(signal[1],
  signal[0])` is not a phase of anything; it is the angle of the first
  two samples. The feature is labeled "raw" and never explained.
- `neural-networks/02`, line 87: "ReLU stays in the hidden layers, where
  speed matters." Speed is the minor reason; the non-saturating gradient
  is the one the same lesson names two sections later.
- `foundations/01`, line 141: the first DISPATCH intercept uses
  "[batch, channels, h, w]" and "image latents" before the batch
  dimension has been taught (it arrives in lesson 2).
- `anomaly-detection/02`: the reason a bottleneck forces the network to
  learn structure (4 numbers cannot store 11 arbitrary values, so only
  regularities survive the squeeze) is stated only in the exercise hint
  (line 28), not in the lesson body.
- `anomaly-detection/05`, line 127: `confidence: votes / 3` labels a
  vote count as a confidence. The recap repeats it. Two of three
  detectors agreeing is not a 67 percent probability of anomaly.
- `llm-integration/02`, line 53: the `git log --oneline --graph --all`
  analogy is about output formatting flags, not query specificity; the
  bridge card says "search queries" and the prose says git.
- `training-loop/01`, line 110: the recall answer is 90 words of
  derivation. The style bible asks for a few sentences.
- `recurrent-networks/02`, line 108, trains on random labels with no
  warning; lesson 3 adds the warning ("nothing can learn noise") for the
  same pattern.
- Glossary has no entry for logit, hyperparameter, regularization,
  validation split, or confusion matrix. All five are used.
- Four DerivationDrawers sit after the "## Challenge" heading and, per
  the open item in the 2026-09-04 lesson-format re-audit, render on no
  step: `training-loop/03` (the chain-rule walk, the most important
  derivation in the world), `signal-processing/02` (DFT),
  `signal-processing/03` (STFT), `signal-processing/05` (window and
  overlap). This audit did not open the app to confirm; the placement
  in the MDX matches the earlier finding's description exactly.

## Per-module notes

Each entry lists what the module does well, because the reviewers who
fix the findings should protect these, then the findings already ranked
above by ID.

### Module 1: Foundations (A-)

Strengths: the Float32Array anchor is exactly right for the reader;
lesson 2's garbled-channels example (reshape produces the right shape
and wrong data, and nothing throws) is the best possible introduction to
shape bugs; lesson 3's broken-code-first `matMul` error is real runtime
text; lesson 4's split-without-leaking code (deal the indices once) is
production-grade; lesson 5's "save the training statistics" is the one
normalization fact that matters in production, and it is here on day
one. Nazari's 983 thousand samples a minute (256 Hz times 64 channels
times 60) is correct. The 40 GB post-mortem arithmetic is consistent.

Findings: T1.6, T4 (DISPATCH intercept). Lesson 5 front-loads
`tf.sequential`, `tf.layers.dense`, and `setWeights` one module early;
the exercise hint runs to 120 words to carry it. Defensible (the
lesson's point is that normalization has a customer) but the heaviest
hint in the world sits in the free module.

### Module 2: Neural Networks (A-)

Strengths: the weighted-sum arithmetic is followable and the flip
(-0.2 to +0.2 moves 0.26 to 0.58) is verified; the linear-collapse
argument for activations is stated correctly in one sentence; the
sigmoid drawer derives the (0, 1) range and the symmetry and names
logistic regression; parameter counts are exact everywhere (128 + 528 +
17 = 673; the exercise's 225; Demir's 2,369 is a 64/32/1 stack, which
matches the text); lesson 4's rank-1-input error is the real TFJS
string and the explanation (rank-1 is expanded on axis 1, so three
features become three samples) is correct.

Findings: T1.4 (the module's one conceptual hole), T4 (ReLU speed).
Lesson 2's objective promises implementing three activations; the
exercise does ReLU. The epilogue's 7741-at-0.998 mystery is fiction the
course later handles badly (T2.5), but ARIA's line here is the honest
one.

### Module 3: Training (A)

Strengths: every number checked. MSE 0.268 and BCE 0.718 in lesson 1
are correct to the digit; the cross-entropy drawer's central claim (the
log derivative cancels the sigmoid's, so the gradient at a confidently
wrong prediction is 50 times larger, 5.6 times at 0.1, 2 times at 0.5)
is correct and is a better explanation than most textbooks give; the
0.6931 epilogue (ln 2, the loss of a coin flip) is the kind of detail a
learner remembers. Lesson 2's lerp identity is exact (both land on 2.8)
and the trace numbers (0.6, 2.214, 2.742, 2.916 with losses 9, 0.966,
0.104, 0.011) are right. Lesson 3 teaches backprop by making the learner
pay for the naive method first, which is the correct order. Lesson 4's
400-rerun honesty, the overfitting story with a stated cost, the
validationSplit-takes-the-last-rows warning, and the saddle-point
drawer are all correct. Lesson 5's confusion matrix (23, 3, 0, 24 gives
94 percent, precision 1.0, recall 0.885), the 0.96 to the 24th
(0.375), and the Bayes example (4.2 percent) are correct, and the
balanced-slice selection-bias warning is a point most courses skip.

Findings: T1.1 (exercise), T1.5 (logits), T4 (pure-noise comment,
recall length, invisible chain-rule drawer).

### Module 4: Browser Runtimes (B+)

Strengths: honest about tfjs-node; Nazari's 86,400 readings times 180
ms equals 4.3 hours, correct; the readback-inside-the-clock rule is
correct and important; the IndexedDB version-key story has a cost
attached; lesson 4's confidence-belongs-to-the-verdict point and the
phase-circularity note (sin and cos would be the clean encoding, but the
model was trained on the seam) are the kind of production honesty the
rubric asks for; ONNX opset fragility and the Transformers.js when-not
list are accurate.

Findings: T2.2, T2.4, T3.3 (readback repetition). ML content is thin by
design; what it does deliver (train and inference are separate,
preprocessing must match training, a model is architecture plus
weights) is adequate for a deployment module.

### Module 5: Signal Processing (A-)

Strengths: "a complex coefficient is just a pair of numbers" is exactly
the gloss this reader needs; every magnitude asserted (64 and 19.2 at
128 samples; 204.8, 153.6, 102.4, 51.2 at 512; the 73.5-versus-73.4 bin
straddle) is correct; the STFT window counts (7 windows, 129 bins) are
correct; lesson 4's "the FFT adds no information, it adds access" is the
right way to explain feature engineering and Nazari's "write down the
accuracy you expect before you spend the compute" is a good habit to
install; lesson 5's leakage numbers are plausible, the Hamming sidelobe
figures (-43 dB versus -31 dB first sidelobe; -6 versus -18 dB per
octave decay) are correct, and the symmetric-versus-periodic Hann COLA
note is precise.

Findings: T3.1 (the 94-to-78 retcon), T4 (atan2 phase). The
normalization section of lesson 4 repeats module 1 with a CSS
"200 times more important" folk explanation; module 1's recap had the
correct gradient-skew mechanism, so this is a step backward.

### Module 6: Recurrent Networks (A-)

Strengths: lesson 1's recall answer (position within a vector matters
to a dense layer; position within a sequence does not, because it never
sees the sequence) is a sharp distinction most courses blur; lesson 2's
hand-run cell (0.4621, 0.8537, 0.8284) is correct and shows the same
input producing two outputs, which is the whole point; lesson 3's gate
equations are right, the 4x parameter claim is right, the "cell state is
only scaled and added, never pushed through a weight matrix" gradient
explanation is right, and the "recognition, not memory" recall answer is
a non-obvious point delivered well; lesson 4's nearest-neighbour lookup
scoring 97.4 percent on an overlapped split and 60.6 percent on a time
split (with the 66.7 percent majority baseline stated) is the best
single teaching beat in the world, because it is auditable by hand and
the learner cannot un-see it.

Findings: T2.1, T3.1 (units paragraph), T3.2 (vanishing-gradient
block), T3.3 (duplicate windowing exercise), T4 (random-label training).

### Module 7: Anomaly Detection (A-)

Strengths: the 3-sigma drawer (0.95 to the 64th is 0.0376; 270 false
alarms an hour at 100,000 readings) is correct and explains when the
rule lies; lesson 2's epilogue finds a contamination leak that is
subtle and real (FFT windows straddling the anomaly carried its
spectrum into "normal" training rows); lesson 3's per-feature error map
sums to the 0.062 aggregate exactly; lesson 4's "same curve, opposite
costs" section is the clearest cost-asymmetry teaching in the world and
should be protected from any edit; lesson 5 states what three agreeing
detectors can and cannot claim, which is good epistemics.

Findings: T3.2 (precision-recall block), T4 (bottleneck reason in hint
only; votes labelled confidence).

### Module 8: Advanced Time-Series (B+)

Strengths: the worked softmax ([2, 1, 0] gives [0.665, 0.245, 0.090])
is correct and vetoes the :focus analogy with arithmetic rather than
assertion; the hybrid LSTM-plus-attention build is honest that TFJS has
no attention layer; lesson 2's truncated-buffer failure (softmax always
sums to 1, so a window missing its onset produces an equally confident
heatmap) is a real and under-taught failure; lesson 4's EMA-to-Kalman
discovery opener is excellent, the gain derivation is correct, the
steady-state gain (0.27) is correct, and the honesty note that a
constant-state Kalman lags a trend like an EMA does is exactly the kind
of "trust the shape of the win, not the cost of entry" the course
preaches; lesson 5's correlation-floor derivation is correct and the
DISPATCH intercept (three copies of one mistake voting unanimously)
makes it concrete.

Findings: T1.3, T2.1, T3.2 (why-ensembles, trustHeuristic), T3.3
(lessons 1 and 2 overlap, lesson 3 repeats module 6).

### Module 9: LLM Integration (B)

Strengths: the theme (the model drafts, a human who knows the data
decides what is true) is the right one and every lesson enforces it;
the numeric claim checker is a concrete, reusable idea and the exercise
that builds it is the module's best; the RAG lesson is honest that its
retrieval is keyword matching and says what embeddings would change; "a
component cannot contradict its props, a generator can" is a line worth
the module; the temperature-is-not-a-defense recap bullet in lesson 4 is
correct and important; the cut-the-section BossBeat is well judged.

Findings: T1.2 (the module's defining gap), T3.4 (all five lessons are
padded), T4 (git log analogy). Exercises: `prompt-template` and
`generate-report` are string joins; `model-pipeline` is three awaits;
`llm-client` is a regex and three null checks. Four of six exercises
exercise no ML or LLM skill. The claim checker and the incident triage
are the two that do.

### Module 10: Optimization and Edge (B+)

Strengths: the crash opener has a cost that stays paid, which the style
bible demands and most of the world only gestures at; "quantization is
a storage format, not an execution mode" in the browser is a correct
and rarely stated fact, and the lesson refuses to promise faster
inference; lesson 3's peer-review pattern works (three assumptions in
three sentences), the 0.994-versus-1.000 probe strikes the tree-shaking
analogy's central promise with arithmetic, the 80 percent prune costing
the salvage fragment shows the cost, the Taylor saliency drawer is
correct (second-order damage is half the curvature times the weight
squared, and magnitude pruning assumes equal curvature), and the SVD
drawer is correct; lesson 4's LRU delete-and-re-set trick is right;
lesson 5 applies the readback rule to its own first draft.

Findings: T2.3, T3.1 (two ledgers), T3.3 (readback third time), T3.4
(padding). Lesson 4's "interviewers fish for" aside is the one line in
the world that sounds like a blog post.

### Module 11: Capstone (B+)

Strengths: lesson 1's recap admits the pipeline is `PipelineStage<any,
any>[]` and only the runtime validate() fires, which is more honest than
the code; lesson 2's green-on-the-wrong-artifact story (cache keyed on a
name that never changes blessed the 340 MB model eight days after it was
replaced) is a real CI/ML lesson delivered with the log as evidence, and
the rollback step stays red on purpose; lesson 3's DISPATCH intercept
("when drift fires, read the maintenance log before you read the sky")
is the right operational instinct; lesson 4's runbook rewrite ("I do not
have an intuition for high; I have thresholds") is a good beat; the
launch BossBeat prices its own third option.

Findings: T2.5, T2.6, T3.2 (console.log finale), T3.4 (all five lessons
at 44 to 81 words per minute; the module claims 130 minutes for 9,551
words). Exercises `ci-cd-gate`, `write-model-card`, and
`verify-deployment` are plumbing; `pipeline-architecture` (grades the
real feature path), `export-model-artifact` (real `model.save` bytes),
`launch-rehearsal` (full chain inside tidy, tensor-count checked), and
`classify-anomaly` are good.

## Exercise audit

What is strong, and should be kept as the house standard: nearly every
exercise has an anti-memorization test ("works on a different pair, no
memorized outputs"); identity-probe models make normalization and
predict verifiable by hand (`inference-pipeline`, `launch-rehearsal`);
several exercises grade the exact arithmetic so a shortcut fails
(`kalman-filter` rejects a fixed-alpha EMA; `find-threshold` has an
overlapping-data case; `compute-fft` feeds a DC offset that must not
win); tensor-leak tests compare `tf.memory().numTensors` before and
after.

What is weak:

- Sixteen of 65 exercises are "type this configuration" or "join these
  strings": `build-layer`, `forward-pass`, `simple-network`,
  `build-rnn`, `build-lstm`, `predict-next`, `build-autoencoder`,
  `tfjs-setup`, `browser-ml-tradeoffs`, `prompt-template`,
  `generate-report`, `model-pipeline`, `ci-cd-gate`, `write-model-card`,
  `verify-deployment`, `gpu-backend`. Each is correct and each is
  finished in under five minutes by the reader the course targets. The
  frontmatter's own taxonomy tags twelve exercises `arithmetic`.
- The nine incident exercises ship their complete recipe in the starter
  comments, step by step. They teach a real operational shape (endpoints
  define the trend; a deploy invalidates every cached verdict; prose
  sails, numbers wait) but the coding is transcription.
- Duplicate: `create-sequences` and `sliding-window` (T3.3).
- The gap in T1.1: no exercise trains and evaluates.

Grade for the exercise set: B. The test harnesses are A-quality; the
task selection is C in modules 9 and 11 and A in modules 1, 3, 6, 7.

## Appendix A: arithmetic verified by hand

Every one of these was recomputed from the values on the page and
matched the lesson's claim.

- foundations/03: 256 Hz times 64 channels times 60 s = 983,040 samples
  per minute.
- foundations/04: 256 times 64 times 33 times 4 bytes = 2.16 MB per
  reading; 19,204 readings = 41.5 GB.
- neural-networks/01: 0.5(0.4) + 0.8(-0.2) + 0.2(0.6) + 0.1 = 0.26; with
  +0.2, 0.58.
- neural-networks/03: 3(32)+32 = 128, 32(16)+16 = 528, 16+1 = 17, total
  673; exercise 4/16/8/1 = 225; 64/32/1 on 3 inputs = 2,369.
- neural-networks/05: 8/32/16/1 = 833.
- training-loop/01: MSE of [0.6, 0.4, 0.3, 0.7, 0.8] against
  [1, 0, 1, 0, 1] = 0.268; sigmoid cross-entropy of logits
  [0.4, -0.4, -0.8, 0.8, 1.4] = 0.718; gradient ratios 50x at 0.01, 5.6x
  at 0.1, 2x at 0.5; ln 2 = 0.6931.
- training-loop/02: lerp from 2 toward 10 at 0.1 = 2.8; descent trace
  x = 0.6, 2.214, 2.742, 2.916 and loss 9.0, 0.966, 0.104, 0.011.
- training-loop/05: 8 + 39 + 3 = 50 rows, 26 anomalous, 24 calm; TP 23,
  FN 3, FP 0, TN 24 gives 94.0 percent, precision 1.0, recall 0.885;
  0.96 to the 24th = 0.375; Bayes 0.000885 / 0.020865 = 0.042.
- browser-runtimes/01: 86,400 times 0.18 s = 4.32 hours.
- browser-runtimes/06: 67M parameters times 4 bytes = 268 MB.
- signal-processing/01 and 02: bin 94 at 0.5 Hz = 47 Hz, magnitude
  0.2 times 256 = 51.2; 5 Hz at amplitude 1 over 128 samples = 64; 0.3
  = 19.2; natural peaks 204.8, 153.6, 102.4, 51.2; 73.4 Hz sits between
  bins 146 and 147.
- signal-processing/03: (1024 - 256) / 128 + 1 = 7 windows; 129 bins;
  round(73.4 times 256 / 256) = 73.
- signal-processing/04: 4 Hz per bin at 64 samples; bins 13 to 20 span
  52 to 80 Hz; 9 points of 28,800 = 2,592 readings.
- recurrent-networks/02: tanh(0.5) = 0.4621, tanh(0.8 times 0.4621 +
  0.9) = 0.8537, tanh(0.8 times 0.8537 + 0.5) = 0.8284.
- recurrent-networks/03: 11 days times 86,400 = 950,400.
- recurrent-networks/04: 193 pairs, every fifth = 39, 38/39 = 97.4
  percent; 33 eval windows, 20/33 = 60.6 percent, 22/33 = 66.7 percent.
- anomaly-detection/01: (1.82 - 0.52) / 0.15 = 8.67 sigma; 0.95 to the
  64th = 0.0376; 0.0027 times 100,000 = 270.
- anomaly-detection/03: (0.6412 + 0.0289 + 0.0071 + 8 times 0.0005) / 11
  = 0.062; 0.062 / 0.005 = 12.4.
- anomaly-detection/04: 2 / 0.34 = 5.9 flags.
- advanced-time-series/01: softmax([2, 1, 0]) = [0.665, 0.245, 0.090].
- advanced-time-series/04: first update from variance 1, Q 0.1, R 1
  gives gain 0.5238 and estimate 5.238; steady-state gain 0.27.
- advanced-time-series/05: averages [0.803, 37.3, 0.48].
- llm-integration/05: 0.95 to the fourth = 0.81.
- optimization-edge/01: 85M times 4 / 1e6 = 340.0 MB; 12.8M + 68M +
  4.2M = 85M.
- capstone/02: 3/16/8/1 = 64 + 136 + 9 = 209 parameters, 836 bytes.

Nothing checked was wrong. The one arithmetic-adjacent error found is
the pure-noise comment in training-loop/04 (Tier 4), which is a claim
about training dynamics rather than a sum.

## Appendix B: what this audit did not do

- Did not open the app. Rendering, step partitioning, and the
  drawer-after-Challenge visibility claim were not confirmed in a
  browser; that item is cross-referenced to the 2026-09-04 re-audit's
  open finding, which did.
- Did not run the exercise solutions through the runner. Test code was
  read for correctness and for what it grades; it was not executed.
- Did not audit the four coming-soon worlds, module.yaml prose, the
  glossary definitions, or any pre-lesson surface (all covered by the
  2026-08-19 editorial audit and the 2026-08-31 cold-reader audit).
- Did not edit anything. The follow-ups are filed in
  `docs/post-launch-backlog.md` under "Content quality audit follow-ups
  (2026-09-05)".

## Recommended fix order

1. T1.1: one real train-and-evaluate exercise. Largest gap between
   the world's promise and the learner's hands. Half a day.
2. T1.2 and T1.3: one paragraph each. Together they turn module 8 into
   the setup for module 9 instead of two unrelated modules. An hour.
3. T2.1, T2.2, T2.3, T2.4: the four continuity seams. Each is a few
   lines; T2.3 needs a decision (binary or five-class). An hour after
   the decision.
4. T1.4 and T1.5: two paragraphs and one glossary entry. An hour.
5. T3.4: halve the estimates in modules 9 to 11 or double them in 1 to
   3. Ten minutes and a re-mint of any baseline that shows minutes.
6. T2.5: decide whether the finale's 0.998 explanation stays. Owner
   call; it touches canon.
7. T3.1 and T3.2: delete the patch paragraphs whose numbers are now
   decided upstream; move prose out of code blocks. An afternoon.
8. T3.3 and Tier 4 as opportunistic edits when already in the file.

## Remediation, 2026-09-05 (same day)

Owner instruction: begin all the fixes needed to move the content from
B+ toward A+. Applied in the audit's recommended order. Every gate that
existed before the edits is green after them: `packages/content` vitest
31 files / 413 tests (slop lexicon, em-dash ban, interval canon, epoch
traces, exercise counts, taxonomy, hint-excerpt inclusion, structure
variety, end-of-lesson close), `scripts/validate-exercises.mjs
--starters` 65 / 65, the web content-partition contract and
lesson-content suites 20 / 20, velite build clean. The rewritten
training exercise passed five consecutive grader runs (random init is
the only source of variance). Nothing is committed.

### Tier 1 (all six applied)

- **T1.1** `deep-scan-eval` is now a real train-and-evaluate exercise:
  100 seeded readings, a 40-row held-out slice under fresh seeds, 30
  epochs at batch 16, `model.evaluate` on the slice, a `diagnose(trainAcc,
  testAcc)` rule, and a verdict on the learner's own run. The grader
  reruns the evaluation, demands held-out accuracy above 0.85, tests
  `diagnose` on five synthetic pairs, and requires the verdict to be the
  rule applied to this run. Hint ladder rewritten; solution hint is a
  verbatim excerpt. `training-loop/05` Challenge text and recap updated.
- **T1.2** `llm-integration/01` gained a section, "What You Are Actually
  Calling": next-token prediction as classification over a vocabulary,
  the stacked attention from module 8, context length as the windowed T,
  temperature as a divisor on module 8's softmax, and "fluency is the
  objective; truth was never in the loss." Recap gained the bullet.
- **T1.3** `advanced-time-series/01` gained a paragraph stating that
  attention is order-blind (a window and its shuffle produce the same
  weights), that the hybrid keeps order only through the LSTM encoder,
  and that transformers add a positional encoding. Recap gained the
  bullet. `advanced-time-series/02` gained "Putting the Position Back":
  a runnable positional feature (`withPosition`, position scaled to
  [0, 1] concatenated as a fourth feature) and the sine-cosine note.
  Lesson 2 now carries content lesson 1 does not.
- **T1.4** `neural-networks/03` states what a stage is: 32 copies of the
  lesson-1 neuron reading the same inputs, the next stage voting on
  their votes, and why the activation between stages cashes in lesson
  2's collapse proof.
- **T1.5** `training-loop/01` gained the logit paragraph: what a logit
  is, which loss takes logits and which takes probabilities, and the
  rule (sigmoid on the last layer means `binaryCrossentropy`). Glossary
  gained `logit`, `hyperparameter`, `regularization`, `validation
  split`, `confusion matrix`.
- **T1.6** `foundations/04` shuffling now has its mechanism (batches are
  stretches of one day without it; every update pulls the same way) and
  batching has its second reason (the batch is the gradient's sample;
  1 is noisy, the full archive is one update per pass; module 3 shows
  the tradeoff).

### Tier 2 (all six applied; the two owner calls were made inside the audit's own options)

- **T2.1** Farah's module-6 line softened ("most of the way to the
  last, where the simple RNN lost it by step twenty"); her module-8
  line now says "whatever the gates permit on paper, in practice".
- **T2.2** `training-loop/04` features renamed to [amplitude, frequency,
  phase], with a clause explaining why a clean tone crosses zero less
  often than broadband noise (so "low frequency for flagged" is coherent
  with the zero-crossing definition used everywhere else).
- **T2.3** Decision: keep the five classes and teach the widening.
  `optimization-edge/02` now spends a paragraph and a code block on the
  five-unit softmax head, categorical cross-entropy, and one-hot labels,
  using module 8's softmax and module 3's log-loss. The ledger paragraph
  above it shrank to three sentences.
- **T2.4** `browser-runtimes/03` prints the 32/16/1 summary (128, 528,
  17, total 673) and says it is the trained network.
- **T2.5** Decision: leave the sign unresolved, as the audit's first
  option. `capstone/05` now says the harmonics overlay explains why the
  reading is an extreme outlier but not which end it lands on, that
  random weights have no preferred sign, that ARIA said so at the time,
  and that the direction goes in the ledger with the other unresolved
  coincidence. The 72.4 s callback and the 29.7 s live reading are
  untouched (interval canon green).
- **T2.6** `capstone/04` input contract now says 80 raw samples with
  feature extraction and the saved training statistics applied inside;
  the JSDoc `@param` and `@throws` match.

### Tier 3

- **T3.1** All four patch paragraphs cut or compressed: the 94-to-78
  retcon in `signal-processing/04` is one sentence and a point about
  labels; the units check in `recurrent-networks/05` is three sentences;
  the two-ledgers paragraph in `optimization-edge/02` is three
  sentences followed by the teaching it was hiding; the debts paragraph
  in `capstone/05` is T2.5.
- **T3.2** All five prose-in-code blocks resolved: `anomaly-detection/01`
  (prose plus the two real ratio functions, with a pointer back to
  module 3), `advanced-time-series/05` (the sqrt(N) claim and the four
  MAEs moved to prose above the real function), `recurrent-networks/02`
  (the never-run "demo" replaced by the backprop-through-time
  mechanism in prose, pointing at the epilogue's real run),
  `advanced-time-series/03` (the placeholder trust decay deleted; the
  loop is labelled as module 6's and the comment says why no trust
  number exists), `capstone/05` (the console.log finale is now a
  `text` transcript block titled `bridge-console.log`, which is what it
  always was).
- **T3.3** Partly. Lesson 2 of module 8 now carries unique content
  (above). Module 8 lesson 3's loop is labelled as module 6's. The
  duplicate `sliding-window` exercise is replaced by "Split First, Then
  Window": cut the stream at a boundary, window each side, drop
  straddlers, on a series whose values are their own indices so any leak
  is visible. `anomaly-detection/01` now credits module 3 for precision
  and recall. NOT done: the readback benchmarking rule is still taught
  in full three times; the third telling (`optimization-edge/05`) is a
  story beat with its own measured numbers and was left as
  reinforcement.
- **T3.4** Modules 9 to 11 re-paced to roughly 110 words per minute (the
  density of modules 1, 5, 6). New per-module totals: 64, 77, 86
  minutes (were 130, 130, 130). Course total 1,590 minutes (812 lesson
  + 778 exercise), about 27 hours. `course-jsonld.ts` workload is
  `PT27H` with its comment updated; `faq-data.ts` says "about 27
  hours". FOLLOW-UP: the world-deep-orbit, pricing, and landing visual
  baselines will differ (per-module minutes and the FAQ line render on
  those pages) and need a re-mint; e2e was not run in this session.

### Tier 4 (all applied)

Pure-noise comment corrected (`training-loop/04`); atan2 "phase"
glossed as the angle of the first two samples (`signal-processing/04`);
ReLU placement now credits the unit slope, not speed
(`neural-networks/02`); the module-1 DISPATCH intercept now says the
axis names are new and lesson 2 explains them; the bottleneck mechanism
is in the body of `anomaly-detection/02`; `confidence: votes / 3` is
`agreement` with the objective, comments, and recap saying "evidence
count, not a probability" (`anomaly-detection/05`); the git-log analogy
is a search-query analogy matching the bridge card
(`llm-integration/02`); the module-3 lesson-1 recall answer is four
sentences; the random-label drill in `recurrent-networks/02` carries
its warning; the "interviewers fish for" aside is gone
(`optimization-edge/04`); the four DerivationDrawers that sat after
"## Challenge" (`training-loop/03`, `signal-processing/02`, `/03`,
`/05`) now sit above it and render on the Concept and Code steps.

### Exercises

Three rewritten (`deep-scan-eval`, `sliding-window`,
`generate-report`). `generate-report` now carries the lesson's cut
decision: sections arrive with a `validated` flag, failed sections
never ship their content, and a Withheld list appears only when
something was withheld. The remaining "type this config" exercises
listed in the exercise audit are unchanged; that item stays open.

### Re-grade after remediation

| Module | Before | After | What moved it |
|---|---|---|---|
| 1 Foundations | A- | A | batching and shuffling now have their training reasons |
| 2 Neural Networks | A- | A | the layer mechanism is stated |
| 3 Training | A | A | logits reconciled; real train-and-evaluate exercise |
| 4 Browser Runtimes | B+ | A- | which model shipped is answered; input names agree |
| 5 Signal Processing | A- | A- | patch paragraph cut; normalization mechanism restored |
| 6 Recurrent Networks | A- | A | contradiction removed; duplicate exercise replaced with the lesson's own point |
| 7 Anomaly Detection | A- | A | bottleneck mechanism stated; agreement is not confidence |
| 8 Advanced Time-Series | B+ | A- | order-blindness taught; lesson 2 distinct; placeholder gone |
| 9 LLM Integration | B | B+ | the LLM is now connected to modules 6 and 8; report exercise carries a decision; pacing honest |
| 10 Optimization | B+ | A- | five-class head taught; ledger paragraph shrunk |
| 11 Capstone | B+ | A- | finale no longer contradicts module 2; transcript is a transcript; pacing honest |
| Exercises | B | B+ | three real exercises replace three weak ones; config-typing tasks remain |

Overall after remediation: **A-**. What separates it from A+ is now
concrete and short: the readback rule taught three times (T3.3, left
as reinforcement), the sixteen configuration-typing exercises and the
nine recipe-in-comments incidents (exercise mix), and the visual
baseline re-mint that the pacing change requires. Module 9 stays B+
because its exercises are still mostly plumbing even with the LLM
section added.
