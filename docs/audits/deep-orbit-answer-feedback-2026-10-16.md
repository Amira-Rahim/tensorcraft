# Deep Orbit checked-answer feedback

Date: 2026-10-16

Every graded answer must give an explicit correct or incorrect verdict, a
distinct visible state, and useful feedback. This rule is recorded in
`CLAUDE.md`. The shared `AnswerFeedback` component supplies the visual treatment;
existing grading functions, tolerances, exercise checks, and story outcomes stay
unchanged.

## Source coverage

Reviewed the interaction paths used by all 56 Deep Orbit lessons, including
optional references and secondary tasks.

| Surface | Coverage | Feedback owner |
| --- | --- | --- |
| Concept investigations | 54 general investigations, one opening tensor activity, one channel-layout activity | `LessonInvestigation`, `TensorInvestigation`, `ChannelLayoutExperiment` |
| Additional Concept practice | Six activities, including their changed cases | `LearningExperiment` |
| Takeaways | 70 graded recall cards containing 119 checks: 103 choice, 11 number, five shape | `CheckedRecallCard` |
| Briefing warm-ups | Reuse graded recall when a checked prompt is available | `LessonWarmup` through `ReviewPromptCard` and `CheckedRecallCard` |
| Coding challenges and incident drills | 65 exercises across all 56 lessons | `Exercise` test-result panel and live summary |
| Graded decisions | Three tasks with constrained choices; two include calculations | `DecisionTask` |
| Legacy fallback | No current Deep Orbit instances | `Quiz` |

Incorrect submissions now receive a direct verdict, rather than only a hint.
Numeric and choice tasks clear stale input errors when edited. Investigations
retain previous runs with their submitted predictions clearly labeled. Coding
results visibly label each check Passed or Failed and say Not passed yet until
all checks pass. Existing live regions announce results without duplicate nested
announcements.

The 13 free-response self-assessments remain ungraded. The six BossBeat story
choices, reference instruments, glossary, bridges, drawers, project reports,
and self-review assignments have no automatic correctness verdict. Skipping an
optional prediction and an unavailable tensor result are reported as ungraded.
Epilogues retain their story outcomes; no graded-answer surface was found there.

## Executed verification

- 193 tests passed across 17 focused files, covering grading feedback, retries,
  preserved first attempts, optional predictions, runtime errors, numeric
  tolerances, recall reveals, exercise execution, shared lesson workbenches,
  and the repository punctuation rule.
- Web TypeScript check, targeted ESLint, and `git diff --check` passed.
- The actual introductory coding example passed all five browser checks without
  changing the existing editor draft. Wrong, partial, and crashed coding runs
  were covered by component integration tests and existing runner tests.

## Browser verification

Used the development gallery, which renders production lesson sections without
completion writes.

| Representative page | Observed behavior |
| --- | --- |
| Tensor Shapes, Concept | Wrong second-row prediction explicitly incorrect; editing clears invalid state; correct retry succeeds. |
| Basic Tensor Operations, Concept | `999` reports an incorrect prediction for result `8`; retrying with `8` reports correct. |
| Tensor Shapes, Takeaways | Three wrong answers each receive their own incorrect panel and hint; corrected answers receive success. |
| Data Normalization, optional Concept practice | Changed-case `[1, 0]` reports incorrect; `[2, 2]` reports correct. |
| Loading and Preparing Data, Challenge decision | Invalid evaluation choice reports incorrect; chronological training-only choice reports correct. Reasoning remains ungraded. |
| Introduction to Tensors, Concept | Predicting three values for the five-value packet reports incorrect; reset and prediction of five reports correct using the real tensor result. |
| Introduction to Tensors, Challenge | All five checks visibly report Passed after running the existing correct draft. |

At a 320px viewport, the three incorrect recall panels fit the 280px reading
area and the page has no horizontal overflow. The temporary viewport override
was reset afterward.

Browser verification sampled each active graded component family. It did not
manually submit every individual prompt in every lesson; course-wide coverage
comes from shared component mapping and the source inventory above.
