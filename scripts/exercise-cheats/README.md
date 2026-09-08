# Exercise cheat files

Each file here is a deliberately ignorant solution for the exercise whose
slug it is named after. It is written to demonstrate no understanding of
the lesson's point while still satisfying the shape of the task.

The rule has two halves: **the cheat must clear at least one test and
fail at least one.**

`node scripts/validate-exercises.mjs --cheats` runs every cheat against
its exercise's shipped tests and fails the build in two cases. A cheat
that passes everything (`cheat-passes`) means the grader is grading the
API surface rather than the lesson. A cheat that clears nothing
(`cheat-stale`) never ran as a submission at all, so it certifies
nothing: that is what happens when an exercise is rewritten to a new
function signature and its cheat is left behind, which is exactly how
`build-lstm` went stale on 2026-09-07 while the gate still read green.

Clearing at least one test is the proof the cheat is still a live
submission against the current exercise.

Two harness stubs are deliberately not constants, so a cheat cannot lean
on them. `tf.loadLayersModel` and `tf.loadGraphModel` return a model whose
architecture is derived from the url, and the ONNX session returns a score
derived from the feed. Both derivations are duplicated in
`scripts/validate-exercises.mjs` and `packages/ui/src/mdx/exercise-runner.ts`,
and `assertHarnessParity()` in the validator fails the run if the two copies
drift, because a harness that disagrees with the browser lets a solution pass
in one place and fail in the other. `load-model.js` and `onnx-comparison.js`
are the cheats that pin those two down: each does the mechanics and then
quotes a memorised answer.

This exists because audit round 4 (2026-09-07) found six graders that
passed solutions written to understand nothing, including one that had
been "fixed" the night before by closing a single cheat instead of the
space of cheats. Write the cheat first, then the grader that stops it.
