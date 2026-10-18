# Deep Orbit: one investigation per lesson

> Superseded for the opening excerpt and exercise results on 2026-10-18.
> Follow [the mission purpose contract](../../CLAUDE.md#mission-purpose-and-visible-results-binding-2026-10-18)
> and the purpose audit. The first two missions now share the 12-reading
> selection; graded runs return actual displayable output. The older five-value
> excerpt and no-worker-protocol restriction below are historical.

October 6, 2026. Follow-up to the all-lesson visual rollout.

## Design before implementation

Keep the Archimedes, existing scene art, large Briefing titles, character
voices, five phases and working JavaScript. Improve pacing within that identity.

Tokens: hull `#181818`, console `#232323`, text `#e0e0e0`, sage `#6baa8a`,
brass `#c1a678`, instrument blue `#85b4ce`. Use existing light-theme equivalents.
Inter remains the reading face; JetBrains Mono is reserved for code and values.
Keep the current title scale and body text at readable sizes. Shorter content,
rather than smaller type, makes the phone experience shorter.

```text
Original Briefing: large title, scene, crew's unresolved problem

Concept: the question we are investigating
+------------------------+----------------------------------+
| Original scene         | Manipulate the relevant evidence |
| Why this task matters  | Read the change beside the view  |
+------------------------+----------------------------------+
Short worked JavaScript and only the teaching needed for the task
Optional reference and learning goals

Challenge: carry that question into the existing editor
Small scene context + a concrete handoff, then staged instructions
Real checks pass -> acknowledge the checked work -> continue

Epilogue: distinguish checked practice from the crew's larger investigation
Original scene, character beat, unresolved next question
```

All content is left aligned except the established cinematic ending. The
instrument remains the memorable element. Avoid another progress system,
new tabs, mandatory microsteps, or celebratory invented telemetry.

## Review against the brief

An extra summary card above the current read would make this worse. Replace
the repeated Concept introduction with the workbench; retain learning goals
in a quiet disclosure. Keep required operations visible. Move only extended
examples and implementation background into explicitly named references.

Lesson one uses the exercise's five-reading excerpt throughout the visual,
worked example and challenge. Let the learner inspect positions rather than
alter the packet's values. Its separate recall question checks transfer.
Name the shift from this excerpt to the crew's full 256-value packet.

For every lesson, connect the instrument to the actual challenge. A passed
challenge acknowledges only the work the checks establish. A teaching
instrument never marks an exercise complete, and authored story readings
never masquerade as measurements from the learner's code.

Edit categories from the writing rubric: unnecessary repetition, overloaded
explanations and unclear scope. Preserve canon, essential qualifications,
exercise contracts, drafts, account boundaries and completion gates.

## Verification to record

Inspect the actual first lesson at desktop and phone widths in both themes.
Check all lesson handoffs against the exercise corpus, including lessons with
multiple exercises. Verify real pass/fail behavior, recalled progress, optional
reference access, accessible controls and the first packet's values. Compare
the required phone read with the previous screenshot, then record results.

## Implemented scope

The shared reader now removes the repeated Concept introduction in all 56
Deep Orbit lessons. Learning goals follow the reading in a closed disclosure.
Each lesson has an authored handoff connecting the crew's need to its actual
exercise. The pass banner names checked exercises only after the existing
pass gate succeeds. Illustrative outputs remain separate from submitted work.

All five Foundations lessons received connected examples and shorter required
reads. The first packet is `[0.12, 0.94, 0.31, 0.88, 0.47]` in the instrument,
worked code and challenge. The control inspects a position without changing
the packet. The Epilogue explicitly moves to the full 256-value packet, and
the distinct recall example still checks transfer.

Shapes embeds the existing saved channel experiment once, inside the main
workbench. Its position-marked teaching packet leads into reshape/readback
code; the challenge identifies its different twelve-value packet. Operations
uses the same two feeds and gain in its visual and code. Data loading shows
the exercise's sixteen sample IDs and four batches. Normalization shares the
same four rows across visual, code and exercise, with explicit raw, z-score
and min-max views.

batch-data groups its existing requirements into four stages. normalize-data
supplies the frozen preview model, leaving statistics, scaling and inference
to the learner. The two model-only assertions now run inside the learner's
prediction check, so scaffolding earns no free passing checks. Their original
model and changed-input assertions remain. Neither task's substantive
correctness requirements or intended audience was relaxed.

Training-loop and evaluation also have shorter required explanations, direct
exercise connections and named references. Six existing supplementary
prediction experiments are optional, without changing their state or math.
This pass revises seven main reads and the shared presentation of all 56
lessons; it does not claim to rewrite all 56 lesson bodies.

## Visual critique and corrections

The initial shapes composition left a tall empty scene column beside the
experiment. The final version uses a wide scene header, then places input
and output alongside each other on desktop. On phones they follow the same
reading order in one column. Original artwork, large Briefing headers,
character dialogue, decisions and the five existing phases remain.

The first Concept at 390px is **3,502px tall, down from 6,614px** before this
pass, about **47% shorter** with references closed. These are full-page browser
captures including navigation and footer, not estimates of learning time.
The visible code still teaches readback, copied values, sum cleanup and
disposal. Type was not reduced to produce the improvement.

- [First Concept, phone](deep-orbit-continuity/concept-390-dark.png)
- [First Concept, desktop](deep-orbit-continuity/concept-1440-dark.png)
- [First Concept, 320px light](deep-orbit-continuity/concept-320-light.png)
- [Shapes, desktop input and output](deep-orbit-continuity/final-reads/tensor-shapes-1-1440-dark.png)
- [Normalization, phone visual](deep-orbit-continuity/final-reads/normalization-1-320-light.png)
- [Evaluation, required reading](deep-orbit-continuity/final-reads/evaluating-deep-scan-1-1440-light-read.png)

## Executed verification

- Content build and web TypeScript checks pass. Targeted ESLint has zero
  errors and three pre-existing warnings in lesson-steps.tsx.
- The 1,248 unit/content cases pass across the broad run and targeted reruns.
  Initial failures caught two over-complete teaching examples and two new
  test expectations. The examples now leave meaningful learner work. The
  separate 75-case writing, prerequisite and guidance gate run also passes.
- normalize-data: canonical solution 10/10, untouched starter 0/10, both
  registered cheating strategies rejected; runner parity checks pass.
  [Exercise validation output](deep-orbit-continuity/normalization-exercise-checks.log).
- The [full-course fixture audit](deep-orbit-continuity/full-course/verification.json)
  covers 672 views across 56 lessons and 119 axe scans, with zero failures or
  page errors. It renders production components and MDX with isolated account
  and network state. It does not exercise live purchases.
- The seven revised reads received another 84-view pass and full-reading
  captures. After the final shapes composition change, its 12 views were
  rerun with zero failures. [Seven-lesson run](deep-orbit-continuity/final-reads/seven-lesson-verification.log),
  [final shapes audit](deep-orbit-continuity/final-reads/verification.json).
- Real Next.js browser checks cover keyboard controls, phone layouts, drafts,
  history, optional references, recall gates, playback, the live normalization
  demo and starter-fails/solution-passes behavior. All 66 functional cases
  pass across the initial runs and targeted corrections. Four visual baseline
  checks complete, with the two changed Concept baselines refreshed and the
  Briefing baselines still matching. [Final affected-case run](deep-orbit-continuity/browser-final.log),
  [shapes and snapshot checks](deep-orbit-continuity/shape-and-snapshot-checks.log).

Implemented in the working tree and available on the local app. No deployment
or claim of measured learner outcomes is included in this change.

## Full-width Concept headers

Owner follow-up: make the open Concept header full width and larger on all
matching pages. Keep the palette and Inter typography specified above. The
headline remains left aligned, spans the same width as the scene/instrument
panel, and scales from 32px on phones to 56px on wide screens. Remove the 30ch
cap and the smaller phone override. Keep the existing artwork and quiet controls.

```text
Full-width investigation question, larger type
+----------------------------------------------------------+
| Existing scene and interactive instrument                 |
+----------------------------------------------------------+
```

This changes the existing shared header rather than adding a second hero or
another title above it. Natural wrapping uses the available content width.

Implemented in the shared workbench CSS used by all 56 Concept pages. Browser
inspection confirms the heading and panel have equal widths: 1,184px at the
normal desktop viewport, 928px at 1,024px, and 280px at 320px. Introduction and
normalization both retain readable wrapping without page overflow.
[Desktop capture](deep-orbit-headers/desktop.png) and
[320px capture](deep-orbit-headers/phone-320.png) show the revised scale.
