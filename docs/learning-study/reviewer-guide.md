# Independent review instructions

Review the frozen version without using the author's category scores as a
target. Start with the learner prerequisites: JavaScript fluency, no assumed
ML background. Read every Deep Orbit lesson and exercise, its answer, hints
and grading rules. Use both rendered lessons and source. Inspect the project
briefs, rubrics, error feedback and exported applications.

For each artifact in `review.json`, record your reviewer ID, evidence paths,
findings and status under `subject` or `editorial`. Leave status `pending`
until the relevant work is complete. A file hash only identifies the reviewed
version. It does not establish quality. Run the summary command against the
same source checkout; changed source invalidates completion.

The subject reviewer checks facts against primary sources, executes examples,
tests wrong-but-plausible answers, checks prerequisites and evaluates whether
tasks demonstrate the claimed skill. Record commands, versions, inputs,
outputs and sources. Distinguish a teaching simulation from a real runtime or
benchmark. Check that descriptions match what the code actually executes.

The editorial reviewer reads from the JavaScript learner's perspective.
Check unexplained terms, repeated explanation, vague claims, overloaded
sentences and formulaic prose against the [writing rubric](../writing-quality-rubric.md).
Record an exact passage and why a learner could misunderstand it. Check
story continuity, character motives, pacing and consequences. For utility
code, review learner-visible instructions/errors and record that scope;
numerical correctness still belongs to the subject reviewer.

Each finding has `severity` (`minor`, `major` or `blocking`), `status` (`open`
or `resolved`), a description, evidence and resolution. Blocking means a
false core explanation, invalid assessment or unusable required path. Major
means a repeated misunderstanding or substantial missing prerequisite.
Minor means a local correction that does not change the concept. A resolved
finding needs the fix and a recheck recorded. Do not delete the original.

## Course score anchors

Score each of the five criteria in a category from 0 to 2. Zero means absent,
wrong or unusable; one means partly supported with a concrete limitation;
two means consistently supported across the reviewed course, with cited
examples and counterchecks. Explain every deduction and every two-point
judgment. The sum is out of ten. A score of nine requires complete review
coverage and no unresolved major or blocking findings. Learner evidence can
still contradict an expert's judgment.

| Category | Five criteria, two points each |
| --- | --- |
| Teaching for JavaScript engineers | Stated prerequisites; accurate JS connections; concepts before jargon; useful worked examples; progression to independent decisions |
| Factual accuracy | Correct concepts/math; runnable matching code; valid evaluation; qualified runtime/benchmark claims; current primary-source support |
| Readability | Concrete wording; defined terms; manageable sentences; useful rather than repeated explanation; readable instructions and feedback |
| Storytelling | Coherent events; distinct motives/voices; technical decisions affect events; pacing leaves room to learn; endings follow from prior choices |
| Assessment and practical transfer | Objectives tested; plausible mistakes rejected; baseline/metric decisions required; external project reproducible; explanation and fresh adaptation assessed |

Assign teaching, facts and assessment to the subject reviewer, and readability
and story to the editorial reviewer. A second qualified scorer should inspect
all blocking findings and at least three learner projects spanning observed
performance. Preserve separate scores before discussing disagreements;
record the agreed disposition and rationale afterward. The tools do not
calculate inter-rater reliability from a sample this small.

## Project scoring

Use the room project's public `RUBRIC.md`: five scores, pass at 8/10 with no
blocker. For early build triage, use the same categories with its stated
prediction time: features must exist when a build starts. Two implementation
points require a clean run that reproduces paired baseline/model evaluation;
the final-project browser export requirement applies only to the final project.
Two explanation points require explaining an error and adapting to a changed
error cost without reusing the reported test period for selection.

Run learner code in an isolated disposable environment with no credentials.
Preserve the submitted outputs before retraining. Compare methods and explain
random variation instead of requiring the maintainer fixture's exact metric.
Record active minutes, help, solution exposure, criteria, blockers, clean-run
evidence, the learner's error explanation and the fresh adaptation.

Price fairness, practical ROI and market reach remain unscored here. Expert
review can identify an implausible promise. Actual purchases/refunds, observed
use and acquisition cohorts are needed to evaluate those claims.
