# Deep Orbit content quality re-audit, 2026-09-06 (fresh eyes)

Owner request: run the 2026-09-05 audit again with fresh eyes, one day
after its remediation landed. Same four questions: is every module
delivering the best content it can, does every module bring a
JavaScript engineer closer to the basics of ML, can a finisher explain
the topics, and where is the text ambiguous, padded, or acting clever.

Method: every one of the 56 lessons was re-read from the current files,
in curriculum order, not from yesterday's notes. The remediation's own
edits were treated as suspect: added paragraphs can break flow, moved
drawers can strand pointers, and a re-pace can be wrong in the other
direction. Every gate was green before the pass (content suite 31 files
/ 413 tests, web content contract 20 / 20). Three defects that the
remediation itself introduced were found; they were fixed during this
pass because they were mine, and the gates were re-run green afterward.
Everything else found is reported, not edited. The 65 exercises were
not re-read in full; only the three rewritten yesterday were checked
again, and they pass the grader.

## Verdict in four answers, revisited

**1. Best content it can?** Closer than yesterday. The six Tier 1 gaps
are closed and read as if they had always been there. What fresh eyes
found is a layer below yesterday's: two places where the story's
chronology contradicts a lesson's premise, two basic ML ideas that are
named but never taught (validation versus test, regularization), and a
handful of inconsistencies between what a lesson's body now says and
what its recap or objectives still say. None of it is slop. All of it
is the kind of thing a careful learner trips on.

**2. Closer to ML basics?** Yes, and module 9 now connects to modules 6
and 8, which was the largest missing bridge. Two basics are still only
words: the course uses "validation" and "test" as if they were the
same set and never says which number you tune on and which you report,
and "regularization" appears in a fix list and the glossary but the
one regularizer the course actually uses (early stopping) is never
called one.

**3. Can a finisher explain the topics?** For the world's core, yes.
The remaining "will not be able to explain" list is short: why a
validation split and a test slice are different things; that early
stopping is a regularizer; and, for a reader who checks numbers, how
Demir's 2,369-parameter first draft in module 2 was built (the text
gives one layer width and the count only reproduces from two).

**4. Fuss and ambiguity?** Yesterday's bookkeeping paragraphs are gone
or shorter, with one exception I made worse: the finale's debts
paragraph grew when its explanation was corrected, and it is now the
longest non-teaching paragraph in the world. Two prose-in-code blocks
survived yesterday's sweep. The two chronology contradictions below are
the only new ambiguity of consequence.

## Grades, fresh

| Module | Yesterday (after fixes) | Today | What moved it |
|---|---|---|---|
| 1 Foundations | A | A | holds; three nits |
| 2 Neural Networks | A | A- | an unreproducible parameter count, a recap triad that contradicts the body, an objective the exercise does not meet |
| 3 Training | A | A- | lesson 2's epilogue contradicts lesson 3's premise; the chain-rule drawer shows the sigmoid factor lesson 1 cancelled, without saying so |
| 4 Browser Runtimes | A- | A- | holds |
| 5 Signal Processing | A- | A- | one prose-in-code block missed yesterday |
| 6 Recurrent Networks | A | A | holds; one prose-in-code block missed yesterday |
| 7 Anomaly Detection | A | A | holds |
| 8 Advanced Time-Series | A- | A- | holds after the scorer-ordering regression was fixed |
| 9 LLM Integration | B+ | B+ | holds after the token-count regression was fixed; exercises still mostly plumbing |
| 10 Optimization | A- | A- | holds; one plausibility nit that module 9's new section makes visible |
| 11 Capstone | A- | A- | holds; the debts paragraph is the one fuss item left |

Overall: **A-**, unchanged. The grade did not move because the fresh
findings are small and the regressions were fixed in the same pass; it
also did not move up because two chronology contradictions and two
untaught basics are exactly the kind of thing that separates A- from A.

## Regressions from the remediation (found and fixed this pass)

**R1. Module 8 lesson 2: the positional section told the reader to
build the scorer on 4 features, then the ring-buffer example handed the
same scorer 3.** The dense layer builds its weight matrix on first
call, so the lesson's own code sequence could not run as written. Fix
applied: the section now sits after the ring-buffer example, uses its
own `positionalScorer`, and pools the original readings so position
informs where the model looks rather than what is pooled. This is a
better teaching sequence than the one I shipped yesterday.

**R2. Module 9 lesson 1: "six hundred words is six hundred forward
passes" two sentences after glossing a token as three quarters of a
word.** Fix applied: about eight hundred passes, one per token, and the
sentence now says why next-token prediction is classification rather
than calling it regression with a vocabulary.

**R3. Module 3 lesson 5 cited "spectrogram review" for three held-out
rows, two modules before spectrograms exist, and yesterday's compression
of module 5 lesson 4 sharpened that into a contradiction ("the old
labels could not see a 73.4 Hz component").** Pre-existing seam, made
worse by my edit. Fix applied: the three rows are now "confirmed only
after the fact, by eye, from the raw capture blocks", and the two later
references say "late-confirmed". Module 3 no longer contains the word
spectrogram.

## New findings, ranked

### Tier 1-lite: basics named but never taught

**N1. Validation and test are never distinguished.** Module 1 lesson 4
splits train and validation. Module 3 lesson 4 uses `validationSplit`
to stop early. Module 3 lesson 5 evaluates on a held-out slice and
calls it the honest number. The capstone model card says "80/10/10
(train/val/test)". No lesson says the sentence a learner needs: the
validation set is the number you tune on (epochs, thresholds, early
stopping), the test set is the number you report, and a number you
tuned on is no longer honest. Fix: one paragraph in `training-loop/05`,
where the held-out slice is introduced.

**N2. Early stopping is a regularizer and the course never says so.**
"Regularization" appears in module 3 lesson 5's fix list and now in the
glossary; the one regularizer the course applies (early stopping, in
lesson 4) is never named as one, and dropout and weight penalties are
only glossary words. Fix: one sentence in `training-loop/04` after the
early-stopping block, and one clause in lesson 5's fix list.

### Tier 2: contradictions a careful reader will hit

**N3. Module 3 lesson 2's epilogue runs "four thousand steps" of
descent on the network overnight and the loss "flattens at 0.31".
Lesson 3 then opens with Demir unable to get gradients for 673 weights
and trying numeric nudging as his first idea.** The 0.31 cannot be the
one-variable toy (its minimum is 0), so the epilogue descended the real
network with autograd the night before the lesson that presents autograd
as the discovery. Fix: reframe lesson 3's opener as a check on the
black box ("the overnight run used `tf.variableGrads` without anyone
knowing what it did; before trusting it on 673 weights, do it the way
you already understand"), which preserves the cost lesson and the
`discovery` pattern tag.

**N4. Module 3 lesson 3's chain-rule drawer derives with `L = ½(ŷ -
y)²` and shows `σ'(z₂)` as a factor.** Lesson 1 spent its drawer
proving that this factor is exactly what cross-entropy cancels, and the
code directly above lesson 3's drawer uses `sigmoidCrossEntropy`. The
drawer is correct as a chain-rule walk and silent about the
contradiction. Fix: one sentence at the end of the drawer ("with
cross-entropy the first two factors collapse to `(ŷ - y)`: lesson 1's
cancellation, seen from the other side").

### Tier 3: fuss and repetition

**N5. The finale's debts paragraph grew.** Yesterday's T2.5 fix
corrected the explanation of the untrained 0.998 score and made the
paragraph in `capstone/05` longer (about 230 words). It is now the
longest non-teaching paragraph in the world. Fix: keep the two settled
debts in two sentences, keep the sign point in two, cut the rest.

**N6. Two prose-in-code blocks survived yesterday's sweep.**
`signal-processing/03` "window-tradeoff.ts" is a comment essay with
three `stft` calls whose output is never shown; `recurrent-networks/02`
"rnn-unrolled.ts" is a comment essay with a model definition that is
never used. Same fix as yesterday: prose, or make them print.

**N7. Module 1 lesson 4 explains shuffling before it explains the
batch update the explanation relies on.** The shuffling paragraph (now
mechanical, good) says "the model adjusts its weights after every
batch"; the next section is where that fact is introduced. Swap the two
or move one sentence.

### Tier 4: nits

- `neural-networks/03`: "Demir's first stack quoted 2,369 parameters, on
  a 64-unit stage" reproduces only as a 64/32/1 stack; the text names
  one width. Say "64/32/1".
- `neural-networks/02`: recap bullet "ReLU is the default choice for
  hidden layers: fast, simple, and effective" is a rhetorical triad
  (rubric category 1) and credits speed, which the body now demotes.
  Objective promises implementing ReLU, sigmoid, and tanh; the
  exercise implements ReLU.
- `training-loop/01`: objective promises implementing binary
  cross-entropy; the exercise implements MSE.
- `foundations/04`: the recall answer still says batching first lets
  "the model learn sequence rather than patterns", the folk phrasing the
  body no longer uses. `foundations/02` uses "batch" in a shape example
  one lesson before it is defined.
- `neural-networks/02`: raw outputs of -11 and 600 one lesson after
  module 1 normalized every feed to one scale. Fiction, but the reader
  has just been taught why that cannot happen with small weights.
- `capstone/03` and `/04` label the second feature `zeroCrossings`;
  every other lesson calls it `frequency` (a zero-crossing count).
  Residue of T2.2.
- `optimization-edge/01` profiles the 85-million-parameter bundle as one
  `LayersModel` and feeds its embedding layer a float `[80, 11]` tensor.
  Module 9 lesson 1 now teaches what an embedding takes, so the seam is
  visible where it was not before.
- Browser-only anchors without the rubric's one-clause gloss for Node
  readers: `useEffect` cleanup (`foundations/01`, `browser-runtimes/04`),
  "In your React component" (`browser-runtimes/03`), CSS grid reflow
  (`foundations/02`).
- `foundations/01`: "a tensor's data lives on the backend" uses
  "backend" three lessons before module 4 defines it.

## What fresh eyes checked that held

- Every pointer yesterday's edits created resolves: "the drawer below"
  in `training-loop/03` is followed by the drawer; "lesson 2 shows the
  cheapest version" in `advanced-time-series/01` is true; "module 3's
  evaluation drawer" in `anomaly-detection/01` exists; the four moved
  drawers sit above their Challenge headings.
- The new paragraphs read in order without contradicting their recaps,
  with the two exceptions listed (N7, and the ReLU recap triad).
- The re-pace did not overshoot: module 9 lesson 1 gained 330 words and
  its 15-minute estimate still sits near 125 words per minute, in line
  with modules 1, 5, and 6.
- The five-class widening in `optimization-edge/02` reads as teaching,
  not bookkeeping, and nothing downstream still assumes a binary head
  (the capstone's launch rehearsal uses a sigmoid identity probe as a
  test fixture, which is fine).
- The finale's unresolved-sign paragraph is consistent with ARIA's
  module-2 line and with her "I resolve neither" in the epilogue.
- Interval canon, epoch traces, hint excerpts, exercise counts, and the
  partition contract all pass after the three regression fixes.

## Recommended order

1. N3 and N4 (module 3 chronology and drawer note): two paragraphs.
2. N1 and N2 (validation versus test; early stopping as regularization):
   two paragraphs and a clause. These are the last two basics a
   finisher cannot explain.
3. N5, N6, N7 and the Tier 4 list: an hour of opportunistic edits, best
   done together since several touch the same files.
4. The two items carried over from yesterday: the exercise mix (sixteen
   configuration-typing exercises), and the visual baseline re-mint the
   re-pace requires.
