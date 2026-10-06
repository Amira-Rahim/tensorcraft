# Deep Orbit: visual lessons throughout

Owner direction, 2026-10-06: finish the experience across all 56 lessons.
The proposed five-person test is superseded as a rollout prerequisite.
Learner research can inform later changes; it does not block this work.

Follow-up, October 6: the [continuity and pacing pass](deep-orbit-continuity.md)
connects the examples, shortens required reading and scaffolds the opening
exercises. This record describes the initial rollout; the follow-up records
the current shared reader and Foundations treatment.

## Design plan

The original scene and an instrument share the Concept opening. The scene
recalls what the crew needs; the instrument makes the lesson's mechanism
visible. The existing large Briefing header keeps its hierarchy and artwork.

Palette: hull `#181818`, console `#232323`, reading `#e0e0e0`, sage
`#6baa8a`, brass `#a89060`, axis blue `#78a2bd`. Use the app's corresponding
theme tokens so light mode remains supported. Inter carries prose and
headings; JetBrains Mono carries code and measured values only.

```text
Existing mission header and five-step navigation

Concept question, left aligned
+-------------------------+-----------------------------------+
| Original mission scene  | Interactive teaching instrument   |
| Location and crew       | Input, visible change, explanation|
| Original context        | Small, explicitly illustrative data|
+-------------------------+-----------------------------------+
             Existing teaching, JS examples and experiments

Challenge: compact mission scene, task alongside the existing editor
Takeaways: recall first, then the existing recap
Epilogue: large original scene, earned ending, next mission
```

On phones, scene precedes instrument and prose. Controls have visible focus,
native keyboard behavior and touch targets. Nothing animates without a
learner action. Plots include text readouts and descriptive labels.

## Review before building

A repeated diagram would turn 56 distinct missions into the same lesson.
Use tensor grids, neuron/activation graphs, error and training curves,
waveforms and spectra, sequence windows, attention weights, anomaly plots,
and inspectable system flows. Every lesson gets an explicit configuration
and a question tied to its actual subject. Pipeline lessons show stage
contracts and failure boundaries, not decorative boxes.

Do not write new dialogue merely to decorate the interface. Preserve the
authored narrative and character voices. Never use fictional measurements
as results of submitted code. Instruments use separate teaching examples;
existing graded predictions and exercises keep their own data and answers.

The Concept owns code in context. Remove the duplicate Code phase, migrate
saved progress and old URLs, preserve exercise passes and account isolation.
The five phases support the visual/story experience; reducing the phase
count alone does not satisfy this design.

## Verification

Verify all 56 registry entries and scene assets against the content corpus.
Check numerical transformations, keyboard controls, migration, completion
gates, recall and content partitioning. Inspect production components at
desktop and phone widths in both themes, then correct screenshot findings.
Record executed checks and any limits here after implementation.

## Implemented in the working tree

All 56 Deep Orbit lessons now use the production reader with five phases.
Every Concept has an explicitly authored visual question and instrument beside
its original scene and narrative. The registry covers 14 instrument families:
tensors, neurons, networks, loss, gradients, training, evaluation, signals,
sequences, attention, Kalman updates, anomaly inspection, precision changes,
and system handoffs. Changes to controls update calculated values or the
selected stage's contract and code.

Challenge retains mission context beside the existing task. Epilogue restores
large scene art for every lesson, using the distinct ending asset where one
exists. A canonical-slug copy restores the previously missing ensemble scene.
The original large Briefing title, crew dialogue, decisions, transfer tasks,
exercise runner, hints and recall behavior remain in place.

Legacy positions and visited lists migrate into account-scoped version-2
keys. Concept and Code both map to Concept. Exercise passes, recall and editor
drafts keep their original keys. Old numeric URLs retain their old meanings;
new navigation uses semantic hashes and versioned history entries. Step
analytics distinguish old and new numbering. The baseline query was updated
but was not executed against the production analytics account.

Tensor-shapes now teaches row extraction in the visible read. Normalization's
scalers, zero-scale handling, training statistics and frozen-neuron explanation
are visible before the challenge instead of hidden in a reference drawer.
Further exercise-scaffolding work in the opening plan is a separate curriculum
task; it is not claimed as part of this visual implementation.

## Screenshot critique and corrections

- Kept the existing Briefing hierarchy and art after the earlier rejected
  redesign. Concept uses one shared scene/instrument surface rather than a
  collection of unrelated decorative cards.
- A rank-one tensor initially wrapped into two display rows. It now stays on
  one row so the drawing cannot suggest a second axis.
- Phone SVG labels initially shrank with the chart. Increased their viewBox
  type size and separated axis labels; moved the neuron bias label below the
  weight label after inspecting the enlarged version.
- Short JS excerpts now wrap on phones. The original lesson examples retain
  their tested wrapping and indentation.
- Suppressed initial focus movement during restoration, including StrictMode
  effect replay, so the header stays visible. Real phase navigation still
  moves keyboard focus to the new content.
- Added a changing text readout to the window-function comparison alongside
  its changing spectrum. Its selected window and magnitude are now announced.

## Executed verification

- Content build and web TypeScript check pass.
- 1,307 relevant unit/content tests pass across the regression run and targeted
  rerun of the corrected phase-index expectation. These include full-corpus
  content partitioning, scene coverage, all 56 instrument interactions,
  scientific calculations, migration and account separation.
- The [full-course fixture report](deep-orbit-rollout/verification.json) records
  672 rendered views, 107 workbench axe scans, zero page errors and zero page
  overflow. All five phases were checked at 1440px dark and 320px light;
  every Concept was also checked at 390px dark and 1440px light.
- The [neuron refinement check](deep-orbit-rollout/neuron-refinement/verification.json)
  repeats its four viewport/theme combinations after the final label change.
- Actual Next.js routes pass the updated layout, draft recovery, reference,
  experiment, recall, award, history and legacy-migration checks. The browser
  worker rejects the starter and accepts the canonical tensor solution; the
  normalization demo still runs its real model.
- Full-page axe checks pass on all five phases in both themes on the actual
  free lesson. The lesson screenshot baselines were updated after inspection.
- Targeted ESLint reports zero errors and three pre-existing warnings in the
  shared reader. The writing and forbidden-character gates pass.

The full-course fixture uses production components, compiled MDX, CSS, fonts
and artwork with isolated account/network boundaries. It does not test real
purchases or write learner records. Browser checks use Chromium. The work is
implemented locally and has not been committed or deployed.

## Web interface audit

Reviewed the new workbench, instruments, styles and navigation using the
[Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)
on October 6. Original brand styling and the repository's writing rules take
precedence where style preferences differ.

- `apps/web/app/components/lesson-visuals/lesson-instrument.tsx`: pass after
  the phone-label corrections. Native controls, labels, text readouts,
  non-color category names and keyboard interaction are present.
- `apps/web/app/components/lesson-visuals/lesson-visuals.css`: pass. Focus and
  hover feedback, both themes, phone reflow, touch controls and no added
  automatic motion. Pane divider is neutral, with no colored left accents.
- `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx`: pass for the
  changed navigation and presentation. Semantic URLs, preserved history and
  progress, focus after navigation, and protected exercise/recall behavior.

No learner study is required to complete this change. This report describes
internal implementation and verification, not measured learning outcomes or
an estimate of future paying customers.
