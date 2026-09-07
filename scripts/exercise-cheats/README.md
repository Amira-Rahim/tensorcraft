# Exercise cheat files

Each file here is a deliberately ignorant solution for the exercise whose
slug it is named after. It is written to demonstrate no understanding of
the lesson's point while still satisfying the shape of the task.

The rule: **the cheat must fail at least one test.**

`node scripts/validate-exercises.mjs --cheats` runs every cheat against
its exercise's shipped tests and fails the build if one passes
everything, because a grader a cheat can clear is grading the API
surface rather than the lesson.

This exists because audit round 4 (2026-09-07) found six graders that
passed solutions written to understand nothing, including one that had
been "fixed" the night before by closing a single cheat instead of the
space of cheats. Write the cheat first, then the grader that stops it.
