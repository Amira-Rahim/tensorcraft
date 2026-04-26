# Fast.ai Compare — `deep-orbit/neural-networks` vs fastbook Ch. 4

Date: 2026-04-25
Scope: 5 lessons in `packages/content/content/deep-orbit/neural-networks/` vs fastbook Ch. 4 "Under the Hood: Training a Digit Classifier" ([source notebook](https://github.com/fastai/fastbook/blob/master/04_mnist_basics.ipynb)).

Why this comparison: closest 1:1 conceptual fit. Both teach the foundational neural-network mental model: weighted sum → activation → layer composition → forward pass → trainable model. Different audiences (TFJS in the browser for FE devs vs PyTorch on Colab for general programmers), but same conceptual frontier.

---

## Quick verdict

| Dimension | Tensorcraft NN module | fast.ai Ch. 4 | Winner |
|---|---|---|---|
| Time investment | ~130 min, 5 lessons | ~3–5 hr engaged, 1 chapter | Tensorcraft (lighter) |
| Total content | ~3.5k words MDX | ~18.7k words + 137 code cells | fast.ai (denser) |
| Concept coverage | 5 (neuron / activation / layer / forward / compile) | 13 explicit sections incl. SGD, gradients, loss derivation, mini-batches, sigmoid | **fast.ai** |
| First-principles depth | Library-first throughout (`tf.layers.dense`, `model.compile`) | Builds SGD, loss, gradients **from scratch** before refactoring to Learner | **fast.ai** |
| Hands-on coding ratio | 5 short exercises (one per lesson) | 137 code cells, reader expected to run/modify each | **fast.ai** |
| Bridge to existing skills | Strong FE bridges per concept | None — assumes general Python/programming | **Tensorcraft** |
| Story / narrative | Continuous (ARIA, Dr. Farah, Commander Mirza) | None | **Tensorcraft** |
| Browser runnability | TFJS in-page exercise | Requires Colab/Jupyter | **Tensorcraft** |
| Math floor | None (zero calculus) | Implicit calculus intuition (derivatives, gradients) | Tie (different audiences) |
| Math ceiling | None — never derives anything | Sigmoid math, gradient computation, MSE derivation | **fast.ai** |

**Bottom line:** Tensorcraft wins for **time-to-first-prediction** and **mental-model continuity for FE devs**. fast.ai wins decisively for **mechanistic understanding** — what's actually happening when `model.compile().fit()` runs. A learner who finishes Tensorcraft NN module can ship a model; a learner who finishes fast.ai Ch. 4 can debug one.

---

## Concept coverage matrix

Concepts covered by each. ✓ = covered substantively, △ = mentioned/passed-through, ✗ = absent.

| Concept | Tensorcraft NN | fast.ai Ch. 4 |
|---|---|---|
| Tensor representation of input | △ (assumed from `foundations` module) | ✓ (Pixels section, ~10k chars) |
| Single neuron / weighted sum | ✓ (lesson 01) | ✓ (linear function in SGD section) |
| Activation function (ReLU/sigmoid/tanh) | ✓ (lesson 02) | ✓ (sigmoid derived; ReLU in nonlinearity) |
| Layer composition / multi-layer | ✓ (lesson 03, library) | ✓ (built from scratch in "Adding a Nonlinearity") |
| Forward pass | ✓ (lesson 04, library) | ✓ (manual, no `model.predict`) |
| Loss function | △ (mentioned in lesson 05 compile) | ✓ (full section, derives MSE then mnist_loss) |
| Gradient computation | ✗ | ✓ (uses `.backward()` after motivating chain rule) |
| Learning rate | ✗ | ✓ (full subsection) |
| SGD step (manual) | ✗ | ✓ (7-step end-to-end example) |
| Mini-batches | ✗ | ✓ (dedicated subsection) |
| DataLoader / batching | ✗ | ✓ |
| Optimizer abstraction | △ (named "adam" in compile) | ✓ (refactored from manual steps) |
| Putting it all together | ✓ (lesson 05, library) | ✓ (rebuilds Learner from scratch) |
| Adding nonlinearity / why deep | ✗ | ✓ |
| Going deeper / multi-layer rationale | ✗ | ✓ |
| Pitfalls / debugging | △ (one note on shape mismatches) | ✓ (broadcasting, validation set, etc.) |

**Coverage gap (Tensorcraft missing):** loss derivation, gradient mechanics, learning rate explained, manual SGD step, mini-batch reasoning, optimizer-as-abstraction motivation, why-deep argument. These get glossed via `model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' })` — one line that fast.ai spends ~10k chars unpacking.

---

## Pedagogical pattern compare

**Tensorcraft (5C loop):**
> Context (story dialog) → Concept (1-paragraph + bridge) → Code (15–30 lines TFJS) → Challenge (1 exercise) → Consequence (story dialog).

Each lesson is self-contained, ~25 min. Bridge anchors the new ML concept to a familiar FE primitive. Exercise validates with `<Exercise slug="...">`.

**fast.ai (concrete-first, library-last):**
> Show end goal (digit classifier) → baseline by hand (pixel similarity) → motivate gradient descent → derive each piece bottom-up → refactor to library → add nonlinearity → recap.

The chapter is one continuous arc, not lessons. Reader is expected to run and modify cells throughout. No story scaffolding. No analogies — direct presentation of the math and code.

**Implication:** Tensorcraft optimizes for **learner momentum** (low activation energy per session, narrative pull). fast.ai optimizes for **explanatory depth** (no shortcuts, learner sees the derivative tape). They're not competing for the same outcome.

---

## Where Tensorcraft wins

1. **FE-bridge anchoring is genuinely original.** No fast.ai equivalent. A frontend dev who hits `tf.dot(inputs, weights).add(bias)` and immediately sees `inputs.reduce((sum, x, i) => sum + x * weights[i], bias)` (lesson 01) gets the dot product for free. Saves 30 min of confusion.
2. **Browser runtime, no Colab tax.** Exercises run in-page. fast.ai requires Colab/Jupyter setup, GPU credits, file upload. For a casual learner this is the difference between "I tried it" and "I'll get to it later."
3. **Story scaffolding lifts completion rate.** The ARIA/Dr. Farah/Commander Mirza arc gives each lesson a narrative pull. fast.ai is dry by comparison — you read because you want the skill, not because the next page beckons.
4. **Tighter time-to-first-model.** ~2 hours vs ~3–5 hours for the same surface area. Real value if the goal is "can I ship a tiny model in this sprint."

---

## Where fast.ai wins

1. **SGD is taught, not assumed.** The 7-step end-to-end example (init → predict → loss → gradient → step → repeat → stop) is the conceptual heart of training. Tensorcraft hides all of this behind `model.compile({ optimizer: 'adam' })`. A Tensorcraft graduate cannot debug a non-converging model; a fast.ai graduate can.
2. **Loss is derived, not named.** fast.ai walks through MSE → why we need a smooth loss → sigmoid → mnist_loss (~10k chars on this alone). Tensorcraft mentions `binaryCrossentropy` once in lesson 05 compilation step. The Tensorcraft learner doesn't know what loss measures.
3. **Manual gradient computation.** fast.ai uses `.backward()` but motivates it ("compute the slope at this point and step downhill"). Tensorcraft never says the word "gradient" in the NN module.
4. **Mini-batch reasoning.** fast.ai dedicates a subsection to why mini-batches (memory vs noise tradeoff). Tensorcraft never explains batching at this depth.
5. **Refactor-to-library pattern.** fast.ai builds from scratch, then refactors to library — so the library calls feel like compressed honest mechanics, not magic. Tensorcraft starts at the library and never opens the box.

---

## Specific gap candidates

If Tensorcraft wants to close the depth gap **without breaking the FE-bridge angle**, the leverage points are clear. Each is a candidate lesson or extras-module addition. Bridges proposed in `[brackets]` — would also need entries in `packages/shared/src/bridges.ts`.

| Missing concept | Suggested FE bridge | Tier | Suggested location |
|---|---|---|---|
| Gradient = slope of loss surface | DevTools Performance flame chart slope / `requestAnimationFrame` delta | intuition | New lesson `06-gradients-and-slopes.mdx` |
| SGD step (init → predict → loss → gradient → step) | React state reducer cycle (init → action → newState → re-render) | structural | New lesson `07-sgd-step-by-step.mdx` |
| Loss function (smooth, differentiable) | Lighthouse score (continuous, comparable across runs) — already in registry [#3] | structural | Expand `training-loop/01-loss-functions.mdx` |
| Mini-batches | Pagination / chunk size — already in registry [#7] | structural | Existing in `training-loop` module |
| Why nonlinearity / why deep | Component composition that can't reduce to a single function | structural | New lesson or expand `02-activation-functions.mdx` |
| Optimizer-as-abstraction | Custom hook wrapping setState pattern | structural | New lesson `08-optimizer-internals.mdx` |

Note: most of these would best fit in the existing `deep-orbit/training-loop` module rather than `neural-networks`. That module's current 5 lessons (loss, gradient descent, backprop, training loop, evaluation) are the natural home — read them next to assess whether the gap is in `neural-networks` alone or in both.

---

## Recommendation

Tensorcraft NN module is **fit for its stated purpose** ("FE dev → first browser model in 3 months") but **not a substitute for fast.ai** for someone who wants real ML engineering chops. Honest framing matters: don't sell `neural-networks` as a fast.ai replacement. Position it as the on-ramp; mark `training-loop` and `extras/math-deep-dive` as the next required step for depth.

The one tactical addition with highest leverage: **add a "How training actually works" lesson** between `04-forward-pass` and `05-building-a-network` that walks the SGD 7-step loop with FE-bridge framing (state reducer cycle). Without it, lesson 05's `model.compile({ optimizer: 'adam' })` is a black box and the rest of the curriculum builds on faith.

---

## Methodology notes

- Tensorcraft lesson content read in full from MDX source.
- fast.ai chapter pulled via `curl` of raw notebook JSON; section structure parsed via Python script. Per-section character counts verified from notebook AST (markdown chars + code chars per top-level section).
- Time estimates: Tensorcraft from `estimatedMinutes` frontmatter (sum 130 min); fast.ai estimated from word count at 200 wpm + code-execution overhead.
- All concept-coverage marks (✓/△/✗) verified by direct text inspection of both sources.
