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

An exercise may carry more than one cheat: `<slug>.js` plus
`<slug>.2.js`, `<slug>.3.js` and so on, each written against one
shortcut the grader was hardened to stop. Keep them separate rather than
folding two shortcuts into one file: a combined cheat still fails when
either check survives, so removing one check would go unnoticed. Every
file runs under `--cheats` and each must satisfy both halves of the rule.
The first batch came from the round-7 exercise readers on 2026-09-13, one
file per probe that had beaten a grader: a reference stack built lazily
inside the answer, an invented untrained sweep, a decoy autograd call, a
memoised leak check, a pinned `Math.random`, and the rest; each file's
header names the shortcut and the test that now catches it.

Run-time draws are sealed, and the seal is a set of specific locks rather
than a sandbox boundary. `Math.random` inside the grader is a per-run
seeded stream, non-writable and non-configurable, and the `Math` binding
itself is non-writable, so neither `Math.random = () => 0.5` nor
`globalThis.Math = copyWithRandomPinned` turns a fixture drawn at grade
time (a width, a multiplier, a window) into a constant (round 7,
2026-09-13: four graders fell to the first; round 7b, 2026-09-14: three
cheats walked around it with the second). The `tf` namespace refuses
writes to its own properties; the spied `Tensor.prototype` methods, the
read path (`data`, `array`, `dataSync`, `arraySync`) and
`LayersModel.prototype.predict` / `save` are locked after the spy wraps
them, and `tf.util` is frozen, so a submission cannot swap the read path or
the shuffle helper a grader draws with. `tf.__calls` is a frozen snapshot
on every read, so a counter cannot be forged. What is NOT sealed: the
CI validator's vm sandbox shares intrinsics with the host (so tensors built
in the host realm pass `instanceof` checks in test code), which means a
submission can reach the host realm through a constructor chain; the
host's `Math.random` and `Math` binding are locked and the sealed stream is
seeded from crypto, so that route cannot pin a draw or contaminate a later
exercise, but it is a lock, not a wall. Both harnesses carry the same
blocks, `exercise.test.ts` pins every route above, and `assertHarnessParity`
compares the spy lists and the seal between the two files.

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

## The call spy: `tf.__calls`

Both harnesses hand the submission a Proxy over the frozen tfjs namespace
and count, on `tf.__calls`, every call into the entry points a grader can
legitimately care about: `variableGrads`, `grad`, `grads`, `valueAndGrad`,
`valueAndGrads`, `customGrad`, `sequential`, `model`, `tidy`, `dispose`,
`keep` by name; every function under `layers`, `io`, `train` and `losses`
as `layers.dense`, `io.withSaveHandler`, `train.adam`; and
`LayersModel.prototype.save` as `model.save` and `LayersModel.prototype.predict` as `model.predict` (one count per call, Sequential or functional). Counters are fresh per run.
Test code reads them like any other global: snapshot before a call, assert
the delta after it, or read the total at describe registration to see what
the submission's top-level code did. Added 2026-09-13 because three graders
(gradient-step, export-model-artifact, build-layer) could not otherwise tell
the right number arrived by the wrong route: a finite-difference slope, a
hand-assembled artifact that reloads byte for byte, a second stack built to
measure the per-width step. The spy lives in
`packages/ui/src/mdx/exercise-runner.ts` and `scripts/validate-exercises.mjs`
and MUST stay identical in both; `exercise.test.ts` pins the runner half and
the corpus parity test pins the agreement.
