# Facilitator scoring notes

Do not supply this sheet with participant forms. Record original responses
before feedback. One point per numbered task, five total. Award a point only
when all required parts below are supported. Partial answers receive zero
for this diagnostic count plus a written note; keep nuance in the response,
not an undocumented half-point rule. Use a second reviewer for ambiguous
responses before looking at aggregate rates.

1. Training uses labeled error to adjust fitted parameters. Inference uses
   the saved parameters to predict and does not train them. Loading weights
   itself is not training. Both operation names and the distinction are required.
2. Use changed-file count, current light or current backlog, respectively.
   Exclude post-outcome duration, future occupancy or actual arrival time.
   Fit scaling only on training data and apply the frozen transformation to
   later validation/test periods. Both leakage sources must be identified.
3. Compute `FP * fpCost + FN * fnCost`. Form A costs are A=28 and B=44;
   Form B: A=13 and B=22; Form C: A=20 and B=23. A wins in each case under
   these assumptions. Unequal costs mean accuracy alone can choose badly.
   Require arithmetic, choice and rationale; do not require a neural model.
4. A raw classifier output is not proof of a calibrated probability, a
   guarantee for one case or evidence of causality. Check held-out outcomes
   for similar scores, calibration and whether deployment data matches the
   evaluated population. Require at least calibration/outcome comparison and
   the absence of an individual guarantee, not the exact word “calibration”.
5. After the cost change: Form A A=64, B=56; Form B A=37, B=28;
   Form C A=32, B=26. B wins. Require a runnable JavaScript calculation,
   correct comparison and validation-based selection. Test-informed choices
   need fresh untouched final evidence; recomputing on the same test set does
   not restore independence.

Reference arithmetic, for scorer checks only:

```js
function cost(fp, fn, fpCost, fnCost) {
  return fp * fpCost + fn * fnCost;
}
```

For each concept observation, `correct` is five booleans in this order.
Include response/evidence references, actual observation date, active
minutes and assistance. A response with outside help is reported as assisted;
the summary separately counts unassisted delayed success. Do not convert an
absent answer into an observed failure or omit it from the return-rate count.

For project observations, `scores` are five integers (problem/data,
evaluation, judgment, implementation, explanation), `blockers` is a list,
and `reviewerId` refers to a declared independent reviewer. Also record
`runnable`, `failureExplained`, `freshChangeCompleted`, `solutionRevealed`,
active minutes, assistance and evidence. A total of eight with a blocker
still fails. The final project requires an observed explanation/adaptation;
the artifact checker alone cannot set those fields to true.

For the reader observation, preserve passage location, learner paraphrase,
whether clarification occurred and the specific story consequence. Both
`passageExplained` and `storyConsequence` must be true for the combined gate.
Mark explanations needing clarification false and record the intervention.

Keep disagreements, initial scores, revised scores and adjudication notes in
separate evidence records. A generated summary checks consistency and
denominators; it does not decide whether a human judgment was correct.
