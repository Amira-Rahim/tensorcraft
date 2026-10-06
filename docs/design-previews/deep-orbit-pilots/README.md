# Deep Orbit training and evaluation pilots

> Superseded rollout gate, October 6: the owner directed completion across all 56 lessons without a five-person test. The [production rollout](../deep-orbit-rollout.md) is the current implementation record. This file preserves the earlier pilot work; participant recruitment is not an active task or a prerequisite.


October 6, 2026. Local visual prototypes for two existing lessons. Production lesson navigation, access, saved progress, and completion are outside this pilot.

## Design decision before building

Use the frontend-design skill for the visual plan, implementation, screenshot critique, and revision. The subject is the Archimedes crew investigating whether DEEP SCAN has learned anything useful. The audience is JavaScript engineers new to ML who have completed the preceding lessons.

Retain the approved Foundations identity: Hull `#181818`, Console `#232323`, Reading `#e0e0e0`, Instrument `#6baa8a`, Brass `#a89060`, and Axis `#78a2bd`. Use Inter for headings and reading, JetBrains Mono for numeric values and code. Keep the 60px desktop / 36px phone Briefing title, mission metadata, five visible progress segments, original scene artwork, and crew portraits. The existing light appearance carries equivalent contrast.

Selected layout, left aligned:

```text
Briefing:  large mission title / original scene | crew / assignment
Concept:   scene + crew | one interactive instrument
           explanation | corresponding JavaScript
Challenge: task + supplied setup | editable code + actual checks
Takeaways: unfamiliar visual case | written explanation / reveal
Epilogue:  original scene + unresolved handoff

Phone: same reading order, stacked; controls remain beside the instrument.
```

The memorable element changes with the subject. Training gets an epoch timeline with two directly labeled loss curves. Evaluation gets an inspectable board of 50 illustrative signals whose counts form a confusion matrix. No additional route, phase, dashboard, or progress gate is introduced.

Rejected sketch: apply the Foundations bar/matrix panel unchanged to both lessons. It obscures time in training and the individual mistakes behind evaluation. Rejected sketch: a cinematic full-screen scene between every action. It delays the learner's work. Keep the crew beside the evidence; keep reference detail below the required explanation and code.

## Content and evidence boundaries

- Sources: `packages/content/content/deep-orbit/training-loop/04-training-loop.mdx`, `05-evaluating-deep-scan.mdx`, and their existing exercise YAML files.
- Original opening/closing dialogue and scene art are retained. Any short connective dialogue is proposed copy and follows the story bible. Mirza asks or decides, Nazari counts costs, and ARIA uses no contractions.
- The training Concept uses a labeled illustrative 24-epoch trace. It is not a captured training run or the canonical 102-epoch story result. Early stopping tracks individual validation scores; the exercise's trend summary compares two ten-epoch windows. These are separate operations.
- The evaluation Concept preserves the authored 50-row example: 23 true positives, 24 true negatives, 3 false negatives, 0 false positives. Tiles represent aggregate counts, not recovered archive records or model scores. The original exercise has 43 held-out synthetic rows, explicitly a different dataset.
- Challenge uses the existing worker runner, TensorFlow.js runtime, canonical setup, and canonical test code. No authored pass/fail switch. The editable section starts after the supplied model setup, which remains inspectable. A separate inspectable readout logs values reported by the submitted code; original checks verify their provenance. Actual run feedback does not rewrite the illustrative Concept or fictional Epilogue.
- Takeaways ask for a written explanation before an explicit answer reveal. Revealing an answer is not a pass or course completion.
- No human learning or commercial validation has occurred. See the learner protocol for the remaining evidence.

## Build and review

From the repository root:

```sh
node docs/design-previews/deep-orbit-pilots/build.cjs
python3 -m http.server 8767 --bind 127.0.0.1
node docs/design-previews/deep-orbit-pilots/verify.cjs
```

Open `http://127.0.0.1:8767/docs/design-previews/deep-orbit-pilots/index.html`.

The build derives the shared visual CSS from the existing Foundations prototype, bundles the existing exercise runner, and extracts the original exercises. No production source is changed. The browser runner's vendored-runtime URL is adapted to the repository preview server. Solutions stay in the source YAML and are used by verification, not exposed as a learner-facing answer button.

Review settings and design notes remain behind the footer controls. Drafts and recall notes are local to the browser tab. This pilot does not submit learner activity to analytics or persist course progress.

The [frontend-design review](review.md) records the visual critique, corrections, and limits. The [learner protocol](learner-protocol.md) preserves an optional future research design. Its former rollout gate is superseded; no participant sessions are required for this change.
