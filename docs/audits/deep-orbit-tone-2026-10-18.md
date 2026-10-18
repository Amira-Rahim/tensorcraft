# Deep Orbit wording and task presentation audit

Reviewed 2026-10-18. Audience: frontend JavaScript engineers learning ML.

The owner flagged captions such as "Five readings in a JavaScript array" as
unhelpfully elementary. This pass treats the reader as a capable programmer
while keeping first explanations of unfamiliar ML concepts. The writing rubric
now records that distinction as an ongoing requirement.

## Coverage

Read every lesson in full: frontmatter, briefing, concept, challenge, recall,
takeaways, epilogue, optional references, and conditional story passages. Read
all exercise instruction surfaces, hints, and module descriptions. This was a
source review of the complete course, not a keyword-only search.

| Module | Lessons | Exercise files |
| --- | ---: | ---: |
| Foundations | 5 | 5 |
| Neural Networks | 5 | 5 |
| Training Loop | 5 | 5 |
| Browser Runtimes | 6 | 7 |
| Signal Processing | 5 | 5 |
| Recurrent Networks | 5 | 5 |
| Anomaly Detection | 5 | 8 |
| Advanced Time Series | 5 | 5 |
| LLM Integration | 5 | 6 |
| Optimization & Edge | 5 | 6 |
| Capstone | 5 | 8 |
| Total | 56 | 65 |

All 11 module descriptions were reviewed. Fifty lesson files and 18 exercise
files have changes in the local working tree. These counts include the opening
missions' sensor/header continuity work already underway before this tone pass.
Six lessons and all module descriptions needed no changes for this pass.

Shared UI review covered all lesson visual configurations, handoffs, numeric
and flow investigations, instrument and investigation presentation, the tensor
activity, channel-layout activity, learning experiments, and recall presentation.
It included rendered labels, prompts, feedback, captions, and optional examples.

## Changes

- Captions identify the data or decision. The opening task now says "Demir's
  readings"; Tensor Shapes identifies the selected readings in recording order.
- Removed unsupported assumptions about prior experience, repeated explanations
  of arrays and zero-based JavaScript indexing, and "simple part", "no magic",
  "that's it", and "Do the math" framing.
- Headings describe the crew's work: loading manifest and weights, classifying
  reports, tracking the pulse interval, or preparing an operator handover.
- Retained necessary first explanations of tensor, shape, axes, rank, batch,
  feature, loss, gradient, backend, calibration, and other ML concepts.
- Replaced scolding grader messages with the specific failed requirement and
  corrective action. Fourteen exercise test blocks have message-string changes;
  their assertions and expected values remain unchanged.
- Replaced 17 implausible recall distractors across 14 checks with relevant
  mistakes. Correct options and indexes are unchanged. An independent review
  caught one ambiguous question about contracts; it now explicitly asks about
  the shown shape, field, and range checks.
- Preserved fictional-result and synthetic-fixture disclosures, uncertainty,
  memory ownership, API requirements, numerical values, and story discoveries.
  Removed one premature reference to a capture loss that happens later.

The shared "Your first task" component now separates the heading and mission
goal, gives the readings one full-width array display, and leaves the next-step
cue beside the existing Continue action. Values stay in order. A keyboard- and
touch-scrollable region preserves legible numbers on narrow screens without
widening the page or triggering lesson swipes. Lessons without readings retain
the same task heading and spacing.

## Validation and limits

Source comparisons and manual diff review checked code, fixtures, saved decision
IDs, correct recall options, and exercise requirements. Lesson executable code
is unchanged; edits inside code examples are comments. Two exercise starters
have comment-only changes. Fourteen graders have assertion-message-only changes.

Content compilation, automated content and component checks, web typecheck,
targeted ESLint, and whitespace checks were run. The first recall-sync test
found stale generated content; rebuilding synchronized the new distractors with
spaced review. Final test and exercise-validator results are recorded below.

- Final content/component suite: 1,145 tests passed across 46 files.
- All 14 exercises with edited grader messages passed the existing validator
  with `--starters --cheats`: 166 solution tests passed, untouched starters
  did not complete, and 19 registered incorrect solutions were rejected.
  Harness parity passed with no allowlisted warnings.
- Content build, web typecheck, targeted ESLint, and `git diff --check` passed.
- Exercise execution used the existing CLI fixtures and pinned TensorFlow.js
  runtime. It did not call live language-model services or establish behavior
  on every browser backend or production device.

Browser verification covered Introduction to Tensors on the actual localhost
lesson route at desktop and 320px phone width. Confirmed the new caption, full
width, readable values, keyboard scrolling, absence of page-level horizontal
overflow, and Continue navigation into Concept. Restored the normal viewport.
Saved desktop and phone screenshots under `.superpowers/first-task-redesign-*`.

This pass did not browser-test every section of every lesson or rerun every
lesson example. Source coverage, automated tests, and browser checks establish
different things. No deployment or commit was made.
