# Tensorcraft Content Quality Rubric

Sets the bar every artifact must meet. Derived from exemplar templates already shipped (Tensors as Linear Algebra, Feature Vectors, Loss bridge, apply-convolution exercise).

**Known consequential teaching errors block release of the affected material.**
Do not average them away or defer them solely because a category scored well.
The [content quality plan](content-quality-plan.md) defines the current 9/10
target and the independent evidence needed to claim it. Severity labels in
individual audits describe those audits; a factual error is not stylistic
because an older rubric used the same label for style.

## Lesson rubric (8 criteria)

| # | Criterion | Pass | Fail |
|---|---|---|---|
| L1 | Math correctness | All formulas, derivations, code-shown math match canonical references (DDPM, Adam, etc.) | Linear blend code claiming to teach DDPM. Misnamed equations. |
| L2 | Code executes | Code blocks run as written or are explicitly labeled `// pseudocode` | Mixes broken + real code with no marker |
| L3 | Concept clarity | Defines key terms before using them. Each paragraph advances understanding. | Paraphrases definitions. Jargon-defined-by-jargon. |
| L4 | Bridge honesty | `BridgeCallout` tier matches reality. Identity = literally same. Structural = same shape. Intuition = same mental model. | `useState ↔ model parameters` claimed identity. |
| L5 | Breaks specificity | When breaks present, names a concrete failure mode in <30 words | "They differ in implementation" |
| L6 | Pacing | Concept → code → derivation, OR derivation → code (NOT code → derivation that contradicts the code) | Code at L60 contradicted by math at L150 |
| L7 | Dialogue purpose | Dialogue advances understanding, a decision, character, or stakes; pacing fits the scene and story bible | Repeated analogy-and-correction exchanges that add no new understanding or consequence |
| L8 | Quiz / drawer quality | Quiz has plausible distractors (not "X" "Y" "Z" "right answer"). Drawer math is correct + motivated. | Identity check ("what is rank?" → "rank") |

## Exercise rubric (9 criteria)

| # | Criterion | Pass | Fail |
|---|---|---|---|
| E1 | Math correctness in solution | Solution computes the right answer for any valid input | Solution returns wrong magnitude/sign for some inputs |
| E2 | Tests verify math, not shape | At least 1 test asserts a specific value, not just `.shape` or `.length` | All tests check shape/type only |
| E3 | Test edge cases | Covers 0/empty, boundary, negative where relevant | Single happy-path test |
| E4 | Instruction clarity | Learner who just read the lesson can start immediately | "Implement X" with no spec |
| E5 | Instruction doesn't leak algorithm | States what, not how | "Loop through array, check each element with..." |
| E6 | Starter scaffolds | Provides function signature + comments marking decision points | Empty `// your code here` only |
| E7 | Difficulty rating honest | Beginner = 1 concept, no nesting. Intermediate = 2 concepts. Advanced = 3+ concepts or composition. | Beginner exercise with Gini formula derivation |
| E8 | mlContent tag honest | `data` actually uses tensor primitives. `model` actually composes layers. `arithmetic` is pure JS. | `data` tag on pure-JS string preprocessing |
| E9 | Solution uses only taught APIs | Solution uses APIs introduced in this or prior lessons | Solution uses `tf.layers.bidirectional` in intermediate exercise |

## Bridge rubric (5 criteria)

| # | Criterion | Pass | Fail |
|---|---|---|---|
| B1 | Tier honesty | Identity is literal (`Math.max(0, x) === ReLU`). Structural is same shape. Intuition is same mental model. | `tree-shaking ↔ pruning` claimed identity |
| B2 | Breaks present (non-identity) | Every structural/intuition has `breaks:` field | Missing breaks on structural bridge |
| B3 | Breaks specific | Names a concrete failure mode, ideally with a code example | "They differ in implementation" |
| B4 | JS side real | `jsCode` is idiomatic, current JS/React | Strawman code no JS dev would write |
| B5 | ML side real | `mlCode` is current TFJS, runs as written | Pseudo-TFJS, deprecated APIs |

## Derivation drawer rubric (4 criteria)

| # | Criterion | Pass | Fail |
|---|---|---|---|
| D1 | Math correct | Equations match canonical (Adam paper, DDPM paper, attention paper, etc.) | Wrong update rule, missing normalization |
| D2 | Motivated | First sentence says why this math matters | Equations dropped without context |
| D3 | Notation consistent | Variables defined or follow convention (lowercase = scalar, bold = vector, capital = matrix) | `W` used for weight in one block, learning rate in next |
| D4 | Drawer placement | Sits BESIDE the code that needs it, not 50 lines below | Code at L60, drawer at L150 |

## Quiz rubric (4 criteria)

| # | Criterion | Pass | Fail |
|---|---|---|---|
| Q1 | Distractors plausible | Wrong answers are real-looking misconceptions | "Wrong A", "Wrong B", correct |
| Q2 | Question tests reasoning | Requires synthesis, not recall | "What is X?" → "X" |
| Q3 | Explanation teaches | Explains why correct + why each distractor wrong | "Correct answer is right" |
| Q4 | Tier matches lesson | Lesson teaches structural bridge → quiz tests structural understanding | Lesson is intuition, quiz is identity |

## AI-slop detector

Reject anywhere these appear:

- "Let's dive into..."
- "It's important to note that..."
- "In the world of..."
- "When it comes to..."
- "Furthermore," / "Moreover,"
- Hedging without basis ("might possibly potentially")
- Listicle bullets that just rephrase the prose above
- Conclusion paragraphs that summarize what was just said in 3 paragraphs ("So, to recap, we covered...")
- Filler praise ("Great question!", "This is a fascinating topic")
- Any literal em dash, prohibited repo-wide by `CLAUDE.md`

## Approval gates

For every artifact:
- **All P0 must pass** before counted as quality.
- **No unresolved consequential misconception, misleading guarantee, or materially incorrect accepted solution.** Review the lesson, hints, recap, and exercise together.
- **No AI-slop markers.**
- **Human readability review is required.** Passing a vocabulary test does not establish clarity, voice, or comprehension. The binding [writing rubric](writing-quality-rubric.md) governs prose.
