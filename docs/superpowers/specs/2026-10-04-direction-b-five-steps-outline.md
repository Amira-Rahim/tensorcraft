# Direction B: five lesson steps

Date: 2026-10-04. Updated 2026-10-06: implemented in the working tree, including the all-lesson visual/story rollout. See the [implementation and verification record](../../design-previews/deep-orbit-rollout.md). The owner authorized the review corrections on October 4 after choosing "A then B then C" in the September 24 lesson audit. Direction A shipped as the [lesson tightening design](2026-09-24-lesson-tightening-design.md). This document replaces its earlier outline and retains the filename so existing links work. The [foundations opening plan](../../foundations-opening-plan.md) delivers against five steps and depends on B's implementation and verification.

Direction B removes the Code step and leaves Briefing, Concept, Challenge, Takeaways, Epilogue. Direction C supplies needed explanation and code traces inside Concept, with its own estimate. Each lesson should connect a story problem to a visible mechanism, a JavaScript action, and an explanation of what changed.

## 1. Historical baseline before implementation

These facts describe the pre-migration reader checked on 2026-10-04. They are retained as the reason for the change.

- `lesson-steps.tsx` renders six steps from `STEP_NAMES` (line 274) with `TOTAL_STEPS = 6` (line 153). Analytics use `STEP_EVENT_NAMES`, which names the last step "Consequence" so PostHog queries and `scripts/analytics/module1-baseline.mjs` keep reading the same `stepName`.
- Each step shows the MDX components in its visibility sets (lines 194 to 247). The Code step shows `CODE_LEFT` (MathBlock, DerivationDrawer, two pseudo-names) and `CODE_RIGHT` (CodeBlock, InteractiveDemo, ConceptReference). Every one of those components is already in `CONCEPT_LEFT` except the pseudo-name `code-shapes`, which no component or lesson uses.
- So the Code step re-serves what Concept already showed. On lesson one it is 24 words of framing, the same two code blocks, and the reference drawer opened by default, on a page 2,748 px tall (2026-09-24 audit).
- Content that could justify a second showing is thin: 16 of 56 Deep Orbit lessons carry a `DerivationDrawer`, 3 carry a `ConceptReference` (all three in the free module: lessons one, two and five), and none uses `InteractiveDemo`.
- The step index is persisted in `localStorage` under `tc_step_{world}_{lesson}` and `tc_step_max_{world}_{lesson}`, with `-passed` and `-visited` companions and a recall key. Signed-in learners use the `:account:{owner}` suffix; guest keys have no suffix. Stored values are validated against `TOTAL_STEPS` (lines 513, 530, 615).
- `#step-N` hashes are 1-based and parsed by `parseStepHash` (line 291, `[1-6]`). A hash wins over the stored position (line 583). `?start=concept`, `?start=experiment` (tensor-shapes only) and `?start=challenge` map to `entryStep` 1 or 3 in `page.tsx` (lines 188 to 192); the prop type is `0 | 1 | 3` (line 79).
- Hard-coded indices: Challenge is 3 (line 986, exercise gate; line 1148), completion and the epilogue are 5 (lines 369, 504, 799, 872), and the render switch at lines 1194 to 1266 branches on 0 to 4.
- The chrome reads `TOTAL_STEPS` and `STEP_NAMES` for the segment bar, the badge ("n / 6", line 1545) and the aria labels (lines 1379, 1480). Labels show from 1,024 px; six did not fit at 390 px (tightening spec, section 5).
- The layout spec keeps the Code step single column (line 387); Concept uses the paired columns.

## 2. Goal and non-goals

Goal: one Concept read with its code and derivations beside the prose, then the challenge. No learner reads the same code twice to reach the exercise. Saved positions, deep links, completion, certificates and analytics keep working for everyone who already has a stored step.

Preserve the Briefing, scene, spaced-review warm-up, Challenge pane, Takeaways order, and Epilogue. B moves essential existing teaching into Concept and adds the minimum missing task example where needed. It does not add a learning route or change lesson paths. Exercise scaffolding belongs to the linked foundations task; both must be verified before the revised free module is released.

## 3. Approaches

**A. Remove the Code step everywhere (selected).** Five steps for all 56 lessons. Delete `CODE_LEFT` and `CODE_RIGHT`, renumber the indices, migrate stored positions, update analytics, tests and baselines. This keeps one predictable shell and removes duplicate reading. Cost: a one-time migration of stored steps and a round of test and baseline updates.

**B. Keep six steps and give Code real content first (direction C before B).** Rejected by the owner's order. It is also a 56-lesson content project, and 40 lessons have nothing to put there.

**C. Show the Code step only where a lesson has a derivation drawer.** Sixteen lessons keep six steps, forty get five. Rejected for now: a variable step count breaks the step bar's meaning, the saved-position contract, the analytics `step` index and the e2e step loops, and learners cannot predict where code starts. Listed so the alternative is on record.

## 4. Design sketch for approach A

### 4.1 Step model

| Today | After B |
| --- | --- |
| 0 Briefing | 0 Briefing |
| 1 Concept | 1 Concept |
| 2 Code | 1 Concept (merged; legacy positions resume here) |
| 3 Challenge | 2 Challenge |
| 4 Takeaways | 3 Takeaways |
| 5 Epilogue ("Consequence" in analytics) | 4 Epilogue ("Consequence" in analytics) |

`STEP_NAMES` and `STEP_EVENT_NAMES` drop their third entry. `TOTAL_STEPS` becomes 5. Use named step constants for navigation, gates, and completion. Audit numeric references by their meaning: old Challenge 3 becomes 2, Takeaways 4 becomes 3, and Epilogue 5 becomes 4. Do not replace unrelated numbers. `entryStep` becomes `0 | 1 | 2`, and `page.tsx` maps `?start=challenge` to 2.

### 4.2 Component partition

Delete `CODE_LEFT` and `CODE_RIGHT`. `CONCEPT_LEFT` already contains every real component they held. Drop the unused `code-shapes` pseudo-name. The content-partition contract test (`__tests__/content-partition-contract.test.ts`) must sweep all 56 lessons against the new sets. Passing that test establishes component coverage; rendered checks must separately establish that required teaching is visible before Challenge.

### 4.3 Stored positions

Stored values are indices. Without migration, old Code (2) becomes Challenge, old Challenge (3) becomes Takeaways, old Takeaways (4) becomes Epilogue, and old Epilogue (5) fails the bound. The migration contract is:

- Map each valid old index using `[0, 1, 1, 2, 3, 4]`. Apply this to the current position, maximum position, and every visited position. Deduplicate visited positions after mapping; do not mark skipped steps visited when an exact list exists.
- Write new current and maximum positions under `tc_step_v2_{world}_{lesson}` and `tc_step_max_v2_{world}_{lesson}`. The new visited list uses the new current-position key plus `-visited`. Preserve the existing account suffix on every key. Read a valid new value first, otherwise read and map its legacy value. Never map a new-format value again. Keep legacy keys intact so interrupted writes can retry.
- Preserve passed exercise slugs under their existing `-passed` key and recall under the existing `tc_recall_...` key. Retain filtering to the lesson's actual exercises. Code drafts, guest completions, account progress, and certificate records are unchanged. Never migrate between guest and account scopes or between accounts.
- Validate integers and ranges before mapping, isolate malformed fields, and handle unavailable storage without crashing. A malformed visited list must not erase valid position, pass, or recall records. Preserve the existing conservative fallback when no exact visited list exists. The restored maximum is at least the restored current position.
- An already completed lesson remains completed. Restoring or migrating onto Epilogue is not a new completion transition: retain suppression of completion analytics and side effects on reload. Normal exercise and recall gates still apply to subsequent navigation.

The e2e seed in `lesson-demo.spec.ts` must cover legacy "5" migrating to new "4", as well as a new-format finished session.

### 4.4 Deep links

Emit semantic hashes: `#step-briefing`, `#step-concept`, `#step-challenge`, `#step-takeaways`, and `#step-epilogue`. Parse legacy numeric hashes with their original six-step meanings:

| Legacy hash | New destination |
| --- | --- |
| `#step-1` | Briefing |
| `#step-2` | Concept |
| `#step-3` | Concept (former Code) |
| `#step-4` | Challenge |
| `#step-5` | Takeaways |
| `#step-6` | Epilogue |

Do not emit new numeric hashes: old and new meanings would be ambiguous. Preserve the current rule that a hash can only restore already reached territory. Back/Forward retains this clamp and does not bypass exercise, recall, or purchase boundaries.

New history entries preserve Next's router state and include `tcStepsVersion: 2` with `tcStep`. Validate and map unversioned legacy `tcStep` entries using the old-index table. Parse the hash when history state is absent or invalid; ignore unknown explicit versions rather than treating them as legacy. Normalize the resulting URL to its semantic hash without pushing another entry during restore or Back/Forward. Preserve the no-state-change clamp behavior so it does not swallow the learner's next navigation.

### 4.5 Analytics

Keep `stepName` as the semantic key, including "Consequence" for Epilogue. New step events include `stepsVersion: 2`; events without a version retain the old six-step interpretation. "Code" remains in historical data but stops appearing in new five-step sessions. Document both numberings in `analytics-events.ts`, and update `module1-baseline.mjs` and the KPI formulas in `docs/tech-spec.md` in the same change. Separate versions when grouping numeric `step` or `prevStep`, and use semantic names for cross-version comparisons. Completion events fire on a genuine transition to index 4, not a restore. Migration must not turn a first view into a revisit or emit a phantom Briefing view before restoration settles.

### 4.6 Concept composition in the three drawer lessons

Concept already shows `ConceptReference` closed by default and the Code step reopened it. Removing that step requires these content moves:

- Lesson one: retain essential creation, readback, `tf.tidy`, and disposal guidance beside the worked code. Backend storage and deeper lifecycle detail stay optional.
- Lesson two: immediately after the visual experiment, show a short reshape example and row extraction with `grid.arraySync()[1]`, including a labeled result. Use values different from the challenge, so the example teaches the method without giving away its answer. Keep the larger archive and transpose reference in the collapsed drawer.
- Lesson five: move the scaler examples, per-feature axes, saved training statistics, zero-scale behavior, scaler choice, and the explanation of the supplied preview neuron into the main Concept read. Keep deeper API reference optional. The linked foundations exercise task supplies the fixed model construction in starter code; learners still implement scaling and inference with saved statistics. Label the model as supplied and frozen, and its score as uncalibrated.

Before release, inspect every required exercise operation against visible prior teaching or supplied scaffolding. A learner must not need to open an optional drawer to discover a required prerequisite. This applies across all 56 lessons affected by B, not only the three drawer lessons.

### 4.7 Chrome and layout

The bar renders five segments from `STEP_NAMES`, so labels follow automatically. Measure whether five labels fit at 390 px; six did not. The badge reads "n / 5". The Code step's single-column rule retires. Concept's visual composition follows the opening plan: scene and instrument first, with explanation and JavaScript below in the same step. The two prior specs keep their "six" wording as history and this spec supersedes it.

## 5. Implementation decisions

Use five steps everywhere, migrate existing progress, and emit semantic links with legacy handling. Essential task teaching is visible in Concept; optional references remain collapsed. Direction C becomes targeted trace-through teaching inside Concept and cannot reintroduce a Code step. If five phone labels do not fit at 390 px or with enlarged text, keep direction A's badge-only behavior. These choices resolve the review findings; no additional owner decision is needed for them.

## 6. Tests and verification

- Unit: update `lesson-steps.test.tsx` and the partition contract test. Cover every old index 0 to 5 for current/max/visited, deduplicated visits, migration on repeated mounts, partial writes, malformed fields, unavailable storage, passed slugs, recall, and guest/account isolation. Verify all six legacy hashes, all five semantic hashes, mixed-version Back/Forward, unknown versions, entry queries, and forward clamps. A restored final step must not emit completion again; new advancement must emit once.
- E2E: `accessibility.spec.ts` iterates a local `STEP_NAMES` copy that includes "Code" (lines 115 to 128); `lesson-layout.spec.ts` line 762; `lesson-demo.spec.ts` seeds step 5; `end-of-lesson.spec.ts` reaches the Consequence step. Each moves to the new indices.
- Visual: the step bar and badge change on every lesson baseline. Measure cold and diagnose any drift before re-minting; do not re-mint to green.
- Analytics: assert deterministic captured events locally for fresh, resumed, and completed sessions, including version, semantic name, revisit, and completion counts. Verify query handling with representative old/new event fixtures. A later production check uses actual eligible events when available; waiting for a day of traffic is not an implementation gate.
- Rendered checks: inspect all five free lessons on phone and desktop, including light/dark, enlarged text, keyboard/touch, and reduced motion. Exercise retries and phase changes preserve drafts. Required teaching is visible before the task. Check representative later lessons with derivations and multiple exercises, and cover all 56 lessons with the content-partition check.

## 7. Files

`apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx`, `page.tsx` in the same folder, `lesson-steps.test.tsx`, `__tests__/content-partition-contract.test.ts`, `apps/web/lib/analytics-events.ts`, `scripts/analytics/module1-baseline.mjs`, `docs/tech-spec.md` (KPI formulas), the four e2e specs above, the visual baselines, and `docs/post-launch-backlog.md` (B1 item). Teaching moves also touch `packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx` and `05-normalization.mdx`. Starter-code changes are indexed under the foundations prerequisite task.

## 8. Relation to other work

The owner requested frontend-design work before production coding. The
[isolated visual prototype](../../design-previews/foundations/index.html)
shows the five-step shell, visible prerequisite teaching, and the proposed
foundations instruments on desktop and phone. Design rationale is included in
the artifact. It is available for visual review; feedback and unlocked phase
navigation are prototype states, not implemented production behavior. Its
existence does not close the runtime or learner-validation tasks.

Keep the approved lesson header from the
[existing layout spec](2026-09-23-lesson-layout-design.md): the large two-tone
Briefing title, mission metadata, segmented progress, lesson drawer, scene
heading, and paired artwork/dialogue. The revised prototype preserves those
features and the compact title hierarchy on teaching steps. The five-step
change fits within that visual identity.

The October 5 visual revision keeps the crew's problem beside the Concept instrument and revisits it in Challenge. Explanation and code remain visible in Concept. Takeaways adds visual recall without new narrative, and Epilogue restores authored character dialogue with unresolved evidence. These presentation changes add no step, progress state, or exercise gate.

The October 6 [two-lesson pilot](../../design-previews/deep-orbit-pilots/README.md) applies the same shell to The Training Loop and Evaluating DEEP SCAN. It tests a time-based instrument and an error-inspection instrument, with the existing exercise runner grading code locally. [Design and technical findings](../../design-previews/deep-orbit-pilots/review.md) are recorded separately from the [archived learner-session proposal](../../design-previews/deep-orbit-pilots/learner-protocol.md). This does not implement the production navigation migration or remove the later lessons' decision tasks, transfer assignments, hints, access controls, or completion rules.

The opening plan builds lesson one against this five-step shell and must not renumber steps on its own. B owns navigation compatibility and the essential teaching moves in lessons two and five. The [foundations prerequisite task](../../post-launch-backlog.md#foundations-opening-follow-ups-2026-10-03) owns exercise scaffolding and the beginner ramp. Complete both before releasing the revised free module. Direction C adds only needed Concept-side teaching; estimate it separately and avoid duplicating B's content moves.

B is now implemented and verified. Separate opening curriculum/scaffolding work retains its own scope; the visual rollout does not claim that work or learner outcome research is complete. The owner explicitly removed the proposed five-person check as an implementation prerequisite.
