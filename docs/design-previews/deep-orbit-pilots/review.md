# Frontend-design review: later Deep Orbit lessons

> Superseded rollout gate, October 6: the owner directed completion across all 56 lessons without a five-person test. The [production rollout](../deep-orbit-rollout.md) is the current implementation record. This file preserves the earlier pilot work; participant recruitment is not an active task or a prerequisite.


October 6, 2026. Scope: two local pilots, all five phases, desktop and phone, dark and light. This is a design and technical review. Participant learning evidence remains pending.

## Judgment

The shared visual pattern can express these two different teaching mechanisms without adding a new navigation layer. The Training Loop makes change over time inspectable. Evaluating DEEP SCAN lets the learner account for the mistakes hidden by an aggregate score. Both keep the crew's problem beside the work and keep the large Briefing header.

The owner subsequently authorized the complete course migration. This review supplies internal design evidence, not a claim about comparative learning outcomes.

## Frontend-design checks

| Criterion | Review result and evidence |
| --- | --- |
| Subject-specific composition | The epoch trace and signal outcomes are the dominant elements. Original Engineering and Bridge art give each lesson its place in the story. There is no added telemetry dashboard or repeated decorative chart. |
| Preserve the approved header | 60px desktop / 36px phone title, two-tone treatment, mission metadata, five progress segments, lesson drawer and scene heading remain. These are intentional existing brand choices. |
| Story carries into the work | Nazari's compute question accompanies training; her count of missed signals accompanies evaluation. Demir/Farah frame the coding tasks. New connective dialogue is proposed copy. |
| Causal visual teaching | A selected epoch updates both curves, losses and patience count. Evaluation's 50 tiles reconcile with 23 caught anomalies, 24 correctly ignored calm cases, 3 misses, and 0 false alarms. |
| Typography and reading | Inter carries explanation and dialogue; Mono carries values/code. Labels remain sentence case within new teaching UI. Phone SVG label sizing was enlarged after screenshot review because scaling a desktop SVG made the axes too small. |
| One clear next action | Existing five-step navigation is retained. A Concept offers a timeline or an outcome reveal. The Challenge has one Run checks action and a Stop run action while executing. |
| Code belongs to the mechanism | Explanation and worked JavaScript remain in Concept. The existing exercise runner grades the actual submitted code in Challenge, using canonical source tests. |
| Mistakes and recovery | Untouched starters fail. Original solutions pass. A held-out-data leak fails. Syntax failure and cancellation preserve the draft. Editing after a run marks the feedback as belonging to older code. |
| Phone behavior | Same content order as desktop; no viewport overflow at 320/390px. Evaluation uses five columns to preserve touch targets. Code can scroll horizontally and is keyboard-focusable. |
| Keyboard and motion | Timeline supports native range keys. The signal board uses one tab stop and arrow navigation. Native dialogs restore focus; review selects keep the approved 16px chevron inset. No autoplay is required; reduced motion keeps every state available. |
| Recall and ending | New visual cases ask for a written explanation before an explicit answer reveal. Takeaways contain no new scene. Epilogues preserve unresolved evidence and keep fiction distinct from measured exercise feedback. |

## Revisions made during the review

1. Added an accessible name to the Foundations link whose text is hidden on phones.
2. Replaced 50 sequential keyboard tab stops with arrow-key inspection and one tab stop for the signal board.
3. Made horizontally scrollable code blocks focusable for keyboard users.
4. Enlarged chart-axis text on phones after inspecting the rendered SVG scale, rather than relying only on desktop font sizes.
5. Removed a redundant provenance paragraph beside the opening dialogue. The prototype banner and labels beside numerical evidence still explain its status.
6. Added visible, inspectable run-readout code. Reported values appear with the original exercise checks, and do not update the separate illustrative Concept.
7. Added visual bars and anomaly markers to recall cases so retrieval begins with visible evidence, not a question alone.
8. Corrected the first-epoch observation to describe a starting point, since a single epoch cannot show a trend.

## Verification

The [verification record](verification.json) preserves the original run: 80
responsive views, 54 accessibility scans, nine interaction groups, and eight
real-runner scenarios. The original training solution passed six checks and the
evaluation solution passed nine. The full-course rollout replaced the prototype,
whose runtime and verification script were retired on November 6, 2026. These
historical results do not validate the current lesson renderer.

Generated snapshots include:

- [Training opening](screenshots/training-briefing-desktop.png)
- [Training mechanism](screenshots/training-concept-desktop.png) and [phone](screenshots/training-concept-phone.png)
- [Evaluation mechanism](screenshots/evaluation-concept-desktop.png) and [phone](screenshots/evaluation-concept-phone.png)
- [Evaluation in light appearance](screenshots/evaluation-concept-desktop-light.png)
- [Training Challenge](screenshots/training-challenge-desktop.png)
- [Evaluation retry feedback](screenshots/evaluation-challenge-feedback-desktop.png)
- [Evaluation ending](screenshots/evaluation-epilogue-desktop.png)
- [Phone review settings](screenshots/review-settings-phone.png)

Automated checks cover semantics, contrast, overflow, loaded artwork, focus, drafts, calculations, and execution. They do not replace assistive technology sessions or learner observation.

## Questions for learner sessions

The expanded evaluation board is longer on a phone. Observe whether it encourages inspection or delays the explanation/code. Do not infer success from the lack of overflow.

The canonical training exercise also asks for a two-window trend algorithm. Watch whether this JavaScript task dominates the learning objective or hides the distinction from early stopping. The exact contract is available in Challenge; using it is expected. A difficulty here may need a separately reviewed exercise-scaffolding change.

The saved readout, original hints/solution ladder, decision task, transfer assignment, and full production editor have different responsibilities. This pilot implements real primary-exercise grading and a short hint, not the full production shell. Preserve the original evaluation `DecisionTask` and `TransferAssignment`, access controls, solution-reveal tracking, and progress semantics during migration. None is approved for removal by this design.

The [learner protocol](learner-protocol.md) is archived and does not gate implementation. No ratings, completion-time claims, or paying-customer projections are derived from this review.
