# Deep Orbit clarity change risk plan

Date: 2026-11-06

Status: design assessment. No product changes, exercise execution, browser verification, or learner observations were performed for this plan. The findings describe the current working tree. Existing unrelated edits must remain intact.

## Decision

Treat the six proposals as separate changes. The previous proposal was too broad in three places: moving a complete model example into optional content, adding active checkpoint navigation, and intercepting all direct lesson links. Those approaches can remove required teaching, disturb editor state, or override an intentional learner action.

Start with factual corrections, source identification, actual-result interpretation, and access-aware destinations. Hold model/data restructuring, saved-schema changes, new lesson segmentation, and preference redesign until their specific evidence gates pass.

Risk cannot be eliminated by an assessment alone. This plan removes avoidable exposure through scope limits, preserves state so changes are reversible, and defines conditions that stop a release. Severity below describes consequences, not measured frequency or a numerical probability.

## Source and preservation rules

The current [project contract](../../../CLAUDE.md) and [story style bible](../../story-style-bible.md) govern the design. The [character bible](../../character-bible.md) supplies character background and visual identity. Current lessons establish what a character has actually said or discovered. Older scene descriptions and planning documents can disagree with current lessons; they do not authorize changing a scene or result.

Every candidate needs a small preservation ledger covering:

| Area | Required record |
| --- | --- |
| Learning | Current objective, learner-written decision or code, required checks, wrong answers those checks reject, transfer opportunity |
| Story | Incoming problem, evidence known at this point, character action, result, outgoing unresolved question |
| Data | Source or fixture ID, selected rows/sensors/times, labels and who knows them, feature order, units, transformations, model identity |
| State | Lesson and exercise IDs, drafts, hint use, passed exercises, saved runs and provenance, preferences, visited/resume state |
| Presentation | All five lesson phases, visible story/artwork, references, secondary exercises, keyboard and reduced-motion behavior |

The ledger must preserve these constraints:

- Story remains visible in its intended section. No extra narrator, forced playback, or hidden character handoff.
- Required concepts stay in the main teaching flow. A solution reference may be optional only when understanding the required task does not depend on opening it.
- Unknown signal labels remain unknown. Generated practice rows do not become archive measurements through new wording.
- Learner output, reference output, and fictional mission records remain distinguishable. Code edits mark old outputs stale.
- Keep the independent initialization comparison, real training, actual run evidence, robustness cases, and independent application.
- Preserve the 0157 canary, thirty shadow matches, rollout two minutes later, and the 0213 entry. Choices alter follow-up work, never scientific truth.
- Preserve the final operator_note: none as the final story beat. No project promotion or new explanation follows it inside the ending.
- Navigation never grants completion, discards work, weakens prerequisites, or reveals an unearned ending.

## Character arc controls

| Character | Existing progression | Change that would damage it | Required treatment |
| --- | --- | --- | --- |
| Mirza | Sets the task, demands evidence, makes operational decisions | Giving her a long explanation of input schemas or UI controls | Keep concise questions and orders. Put technical explanation in teaching prose or Farah's appropriate scene |
| Farah | Insists on trustworthy methods while the evidence becomes more unsettling | Letting her treat rehearsal success as a discovery, or explain future revelations early | Preserve source checks, uncertainty, and the timing of discoveries. A short naming correction must not become a new scientific finding |
| Demir | Moves from familiar JavaScript analogies and costly mistakes to competent engineering | Resetting him to a novice at every checkpoint or making him incapable without new scaffolding | Preserve his accumulated competence. In later work, let him produce and inspect the evidence |
| Nazari | Demands costs and counts, protects the crew, gradually earns trust in the system | Turning her into a cheerful step-by-step tutor or awarding early approval for a green test | Keep her requests operational. Approval follows meaningful evidence and remains restrained |
| ARIA | Begins with failing fixed rules, observes what replaces them, ends with the unanswered record | Making a diagnostic rule omniscient, adding early sentiment, or promising that code resolves the source | Keep precise observations, limits, and the original timing of her emotional development |

## 1. Model and data continuity

**Risk level: high for a numerical or narrative redesign.** Every learner must complete this task, and its values connect to later modules and saved evidence.

### Current journey and proposed effect

The learner receives Mirza's order to assemble the bridge classifier, sees the three-feature example, encounters another interactive configuration, builds an eight-feature generated rehearsal, and returns to the bridge classifier and sample 7741 in the ending. The next module uses another three-feature training fixture.

Early source/model labels can reduce the effort of tracking these objects. They do not establish one continuous dataset. Giving Farah a new explanation for arbitrary generated rows would not, by itself, satisfy the requirement to teach through the ongoing mission's task and data.

### Smallest first change

Make each existing source and model identity explicit at its point of use. Keep essential compilation, initialization, parameter-count, and interpretation teaching visible. Explain the handoff back to the bridge classifier without inventing new archive evidence.

Treat this as an orientation repair, not a completed continuity fix. Keep the complete worked example where it is until a review establishes which parts are necessary. No fixture, architecture, numerical result, saved descriptor, or grade changes in this slice.

### Full solution discovery gate

Map the incoming architecture/forward-pass missions, this lesson, its ending, and the following training/evaluation missions. Record every model and dataset change. Determine whether a labeled excerpt from the calibration work already established in the story exists, including its source, values, labels, and label authority.

Do not assume that excerpt exists. If it does not, explicitly author and review a fictional calibration record before a new graded fixture is designed. A record needs a justified task, named measurements, and known calibration labels. Unknown Sector 7-G readings, including 7741, cannot acquire convenient labels to make a training demonstration succeed.

A candidate can then teach the same required operations on that identified mission data. Preserve adaptation by varying a clearly motivated excerpt or input contract after the learner understands the base task. Preserve answer-leak protection through partial examples and conceptual guidance. Do not require arbitrary eight-input dimensions merely because the old fixture used them.

### Failure cases and release gates

- Training the first model must leave the independently initialized comparison model untrained. Preserve initial weights and both initial sweeps.
- A confident initial score, a smaller training loss, or a favorable rehearsal result cannot certify mission performance or generalization.
- The 529-parameter practice model cannot replace the bridge model's 673-parameter record.
- Learners must identify the source/model behind each displayed value and explain the return to the bridge task.
- Review the previous ending and next opening together. Mirza's urgency, Farah's insistence on comparison, Demir's growing competence, and ARIA's archived-state observation must still make sense.
- Any new fixture requires a new identity and coordinated instructions, hints, solution, checks, interactive examples, recall, result readers, and story handoffs. Old captures retain their original descriptors and completion.

**Stop:** source or label authority remains undefined, core teaching becomes optional, a score gains an invented story interpretation, or an old capture changes meaning.

**Rollback:** remove only the new presentation or fixture version. Retain old readers and all learner records. Never delete old evidence to simplify the migration.

Sources: [network lesson](../../../packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx), [exercise](../../../packages/content/content/deep-orbit/neural-networks/exercises/simple-network.yaml), [historical contexts](../../../apps/web/lib/learning-evidence-types.ts), [answer-leak checks](../../../packages/content/__tests__/lesson-answer-leak.test.ts).

## 2. Feature names and units

**Risk level: high if applied globally; bounded when scoped to a verified source contract.** The same word describes raw measurements, scaled inputs, generated proxies, and actual FFT quantities in different places.

### Current journey and proposed effect

The learner sees frequency and phase in the early model, later learns their legacy extraction meanings, and also learns actual FFT frequency and phase. Accurate labels can reduce those exceptions. A global rename would introduce new false meanings.

### Smallest first change

Create an explicit display mapping for each known data contract:

| Context | Display meaning |
| --- | --- |
| Raw legacy frequency field | Zero-crossing count over the specified window |
| Raw legacy phase field | Sample-pair angle, with the existing atan2 definition and radians |
| Scaled model input | Scaled feature, dimensionless, with its raw source identified |
| Eight-feature generated rehearsal | Existing dimensionless proxy labels |
| Three-feature generated evaluation fixture | Existing practice-feature labels |
| FFT bins, frequencies, and controls | Actual frequency in hertz or FFT phase as appropriate |

Select the mapping by source identity and feature position. Unknown provenance keeps its original label. Store and decode existing artifacts unchanged, then apply the safe display name. Do not change extraction, zeros/sign conventions, vector order, scalers, model weights, or thresholds.

Put the essential definition beside the data. Farah can make a brief correction in a relevant scene. Avoid repeated explanations in character dialogue. Preserve the later 73.4 Hz discovery; the early proxy cannot be described as having already found it.

### Failure cases and release gates

- No dimensionless proxy becomes a measured angle. No normalized value gains a radians or hertz unit.
- Old captures decode with identical values and original provenance, including exact header validation.
- Model-file hashes, normalized vectors, and predictions remain unchanged for identical inputs.
- Prose, code comments, hints, chart labels, glossary context, and accessible text agree.
- Learners can state what was measured, what was scaled, and what is generated.

**Stop:** a mapping relies only on text replacement, source identity is missing, old evidence cannot render, or numerical behavior changes.

**Rollback:** remove the display mapping and new wording. This slice needs no saved-data migration.

Sources: [feature extraction](../../../packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx), [inference pipeline](../../../packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx), [result parser](../../../apps/web/app/components/network-run-explanation.tsx).

## 3. Training diagnosis and actual results

**Risk level: medium for the proposed addition, high if it misrepresents the run.** The new output executes learner-written code and can make an incorrect or unsupported diagnosis look authoritative.

### Current journey and proposed effect

Demir trains with early stopping. The learner sees the actual curves and implements a diagnostic function, but that function is checked on constructed histories. The proposed output connects the learner's function to the actual fit.

The learner should first recognize the report's purpose, implement it, inspect its result, and explain its limits. Nazari asks what the compute bought. Technical explanations of windows and tolerance stay in teaching prose.

### Smallest first change

First identify the actual two windows and their means beside the existing curve. Once that data path is verified, apply the learner's diagnosis to copies of the full training and validation histories from that run, inside the existing worker budget. Capture the actual returned label or error beside the already captured curves. Do not run another fit or execute learner code in the UI.

The current plot samples at most 64 epochs. Compute both ten-epoch windows from the original history before plotting. Show original epoch numbers and exact windows. Twenty plotted points can represent far more than twenty epochs.

Show early stopping and reporting as separate policies. Keep the five-non-improvements callback rule and the two-window reporting rule distinct. A valid run with fewer than twenty epochs receives insufficient-history. Do not lengthen training to force a report.

Add a small visual explanation only if the new actual-run output exposes a comprehension gap. Add no required prediction click or new lesson phase. Preserve the existing opportunity to reason before revealing an answer. A supplied example must not look like the learner's run. Keep the crew's fictional 102-epoch run and 0.081 loss separate from the learner's measured outcome.

### Failure cases and release gates

- Test short, exactly twenty, and long/downsampled histories. Include zero baselines, exact boundaries, invalid values, and competing rule conditions.
- Preserve the original arrays if learner code mutates arguments. A thrown error or invalid label must not erase actual captured curves.
- A learner-provided incorrect label is visibly a failed implementation when checked. A valid unexpected training outcome remains valid.
- Keep diagnostics observational. A train-down/validation-up label does not establish its cause.
- Changing code makes prior results stale. Restored results retain their run identity and assistance context.
- Learners can explain why the stop decision and report can differ and identify the actual epochs used.

**Stop:** the report uses sampled plot values, forces a preferred curve, silently substitutes a reference answer, adds a fit, or turns a reporting error into loss of the original run.

**Rollback:** disable the added report capture/display. Preserve original training outputs and code. Keep the exercise's current required functions and checks.

Source: [training exercise and capture](../../../packages/content/content/deep-orbit/training-loop/exercises/training-loop-exercise.yaml), [lesson](../../../packages/content/content/deep-orbit/training-loop/04-training-loop.mdx).

## 4. Finale orientation and exercise pairing

**Risk level: high for active checkpoint navigation or new lessons.** This area combines multiple editors, completion state, conditional scenes, the climax, and a separate independent project.

### Current journey and proposed effect

The source lists three mission exercises followed by the independent project. The renderer projects briefs and editors into separate parts, so source order alone does not ensure a brief sits beside its editor. The mission gate requires all three exercise passes. The independent project is separate.

Clear orientation can help the learner track release checks, the candidate rehearsal, and the decision record while retaining the sense of one launch. A wizard can fragment that climax and remount editors.

### Smallest first change

Add a compact outline of the three required tasks using the existing ordered exercise slugs. Give each actual rendered editor a matching task title and stable anchor, with corresponding links from its brief. Keep every editor mounted and every story handoff visible. Use no new active-step state, next-checkpoint gate, tab, lesson slug, or completion model.

Do not assume Markdown headings solve the problem. Current content projections and CSS can hide additional second-level headings or duplicate authored IDs. Add anchors only in the real brief/editor render branches, with unique IDs and stable keys. Avoid wrappers that change partition selectors.

Label the independent project as separate work with its own effort and assessment. Keep it reachable from the project area. Its placement must not imply a fourth green exercise requirement or interrupt the final operator record.

The lesson estimate is 25 minutes, while its exercise estimates total 50 minutes. Reconcile these author estimates and identify the separate 4-to-8-hour project estimate. Do not publish a precise new duration as measured evidence.

### Failure cases and release gates

- Run one exercise, edit another, navigate by anchor, return, reload, and inspect retained code/results. Confirm no remount clears a draft.
- All three exercise passes remain necessary. Preserve existing retry and completion behavior without silently changing it.
- Review partial completion, failed retry, stale output, hints, duplicate events, keyboard focus, and mobile reading order.
- The outline must preserve urgency. Demir performs checks, Nazari evaluates operational evidence, Farah inspects the signal rule, and Mirza decides. They do not become checkpoint instructors.
- Preserve the canary record, conditional follow-ups, skipped-choice neutrality, ARIA's final entry, and the unanswered ending.
- A learner can identify the current task and its useful output without following a new series of navigation steps.

If orientation is still poor in observation, prototype a shared interleaved brief/editor rendering path separately. Keep the old renderer available until state preservation, five-phase partitioning, and other multi-exercise lessons pass review. New lesson segmentation remains deferred.

**Stop:** hidden story, duplicate IDs, lost drafts, unintended completion, a changed scientific outcome, or content added after the final story beat.

**Rollback:** remove the outline/anchors or select the old rendering path. Preserve all progress, exercise IDs, code, and outcomes.

Sources: [launch](../../../packages/content/content/deep-orbit/capstone/05-launch.mdx), [phase projections and gates](../../../apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx), [independent project](../../../apps/web/app/components/mdx/independent-project.tsx).

## 5. Destinations, resume, and intentional review

**Risk level: bounded for the broken destination; high for changing all entry semantics.** The faulty picker appears in purchaser preferences. Exposure has not been measured. Resume and direct links affect a wider set of learners.

### Current journey and proposed effect

A purchaser can select an engineering route and receive a link to a prerequisite-blocked runtime lesson. Ordinary URLs restore progress. Explicit phase links intentionally override a saved phase, and automatically generated challenge queries currently do so too.

Fixing the inaccessible recommendation removes a dead end. Forcing every visitor through Briefing would also intercept intentional review and can overwrite a genuine resume position.

### Smallest first change

Give the picker and readiness result an access-aware destination with an honest label. Derive access from the same prerequisite policy used by the lesson route. Readiness recommends review and grants no credit.

Keep existing explicit concept, experiment, and challenge links, saved preference values, and resume behavior in this slice. Preserve static visible story and the existing replay option after someone skips autoplay. Story visibility does not require mandatory playback.

Separately evaluate removing automatically appended challenge queries from Continue links. Distinguish a default Continue action from an intentional phase link. Do not silently reinterpret the stored challenge preference as a different help preference.

### Failure cases and release gates

- Fresh and returning guests, purchasers, unpaid accounts, partially completed modules, and full completion all receive valid destinations.
- Account changes and failed preference reads do not adopt another person's browser progress or write replacement choices.
- Storage denial leaves navigation usable. Preference changes grant no passes and clear no saved work.
- Intentional review links reach their requested phase. Ordinary Continue preserves the actual resume point.
- The existing challenge scene remains visible. Context recovery is available without replaying an entire scene.
- Check the actual progression of characters: runtime assumes training has happened and Nazari's deployment concern has been earned. A readiness result must not bypass those prerequisites.

**Stop:** inaccessible recommendations remain, saved position changes unexpectedly, explicit links stop working, autoplay becomes mandatory, or navigation touches completion state.

**Rollback:** revert the changed URL generation or presentation only. Keep the factual destination correction and all stored preferences/progress.

Sources: [picker](../../../apps/web/app/components/learning-route-picker.tsx), [lesson access](../../../apps/web/app/worlds/[slug]/[module]/[lesson]/page.tsx), [resume and explicit entry](../../../apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx), [entry tests](../../../apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx).

## 6. Product outcomes and the independent project

**Risk level: low for the factual correction; medium for broader framing.** The framing affects first impressions and the emotional relationship between guided accomplishment and independent application.

### Current journey and proposed effect

Prospects encounter a promise of building and deploying a system. Lessons contain real training, inference, evaluation, engineering tasks, and fictional mission records. The independent room project supplies the application shell and helpers while the learner creates the training experiment and model.

A short early explanation can make those deliverables understandable. Repeated caveats or calling the mission merely illustrative would understate real work and weaken attachment to the crew.

### Smallest first change

Correct the launch sentence that says the independent project provides a supplied model and build command. Its starter has no trained weights or build script. Preserve the actual train, check, evaluate, and start workflow.

Next, try one concise visible outcome summary on a course-decision surface. Keep the detailed preview collapsed and the story-led hero intact. Explain guided mission work and independent application without revealing 7741's fate, the accelerating intervals, calibration connection, ARIA's ending, or the final operator record.

Describe what the learner writes, what the starter supplies, and where the independent app runs. Keep the independent dataset outside the ship fiction. Avoid implying included hosting, a human-review service, exclusive access to a public download, or guaranteed accuracy.

Do not build a cumulative mission application as part of this wording change. That would require an explicit workspace, artifact, model, and curriculum design.

### Failure cases and release gates

- Verify every statement against the actual starter and exercise behavior. A clean-folder run must use the learner or clearly identified maintainer fixture, never claim the untouched starter is a completed model.
- Learners understand that guided lessons execute real ML and that the independent project asks them to make additional choices.
- Learners can explain what is supplied, what they build, the local setup, and the distinction between mission completion and project review.
- The independent project does not become a fourth finale gate or a new setting inside the story.
- No new pitch or task follows the final operator row. Demir's competence, Nazari's earned trust, Farah's uncertainty, and ARIA's ending retain their weight.

**Stop:** the framing spoils discoveries, makes real accomplishments seem fake, creates an implied service, or moves the ending.

**Rollback:** remove or revise the new summary while retaining the verified factual correction. No learner-data migration is needed.

Sources: [launch description](../../../packages/content/content/deep-orbit/capstone/05-launch.mdx), [project preview](../../../apps/web/app/components/course-project-preview.tsx), [starter brief](../../../apps/web/public/assignments/room-occupancy-v1/README.md), [starter commands](../../../apps/web/public/assignments/room-occupancy-v1/package.json).

## Implementation and evidence sequence

1. **Baseline and trace.** Record the exact current source snapshot without overwriting existing work. Capture the preservation ledgers and affected predecessor/successor scenes. Mark conflicting documentation for review rather than silently treating it as canon.
2. **Low-coupling corrections.** Make the false-project-description correction and access-aware destination fix as separate patches. These do not require new models, curriculum, preferences, or state schemas.
3. **Controlled prototypes.** Prototype source labels, scoped terminology, and the actual-run diagnostic independently. Review each before combining them. Keep the finale and lesson entry machinery unchanged.
4. **Finale orientation.** Add anchors and matching titles while retaining mounted editors and all existing gates. Observe this before proposing a renderer restructure.
5. **Learning and story observation.** Use fresh learners and the existing study's tasks and scoring anchors. Record first attempts, help, confusion, actual effort, source identification, transfer, character motives, and story consequences. Do not substitute satisfaction or faster clicking for comprehension. Use the separate experienced-learner discovery group for review/resume behavior.
6. **Larger changes only after evidence.** A coherent mission-data redesign, a new evidence descriptor, interleaved rendering, or revised preference meaning gets its own design and migration review. Do not bundle them into a clarity patch.

The [formal learner protocol](../../learning-study/pilot-protocol.md) already defines completion, transfer, delayed retention, and story-comprehension gates. Retain them. A small discovery session can expose failures but cannot prove equal learning or eliminate all pacing risk. Preserve prior observations and test revisions with fresh participants.

For each patch, run the appropriate existing solution, starter, plausible-wrong-answer, result, restoration, and content checks. Browser review must cover all affected phases, default and reduced motion, keyboard use, mobile reading order, and returning state. Trace each character's relevant earlier and later scene. Record source review, executed examples, browser checks, and learner evidence separately.

### Release and rollback rules

- Release only the patch whose own gates passed. An attractive prototype does not authorize its numerical or state redesign.
- Preserve old readers before writing a new format. A rollback must still read any newly saved evidence, or the new write path must remain disabled.
- Use additive presentation changes where possible. Never reset learner state, delete captures, or reinterpret past results to make rollback easier.
- In the dirty working tree, revert only the explicitly identified patch. Never use a broad repository reset or discard unrelated edits.
- A single reproducible data-loss, false-provenance, story-spoiler, answer-leak, or incorrect-result failure stops that candidate. Repeated learner confusion or a loss of story comprehension returns it to design.

## Evidence status

Completed for this assessment: current-source review, cross-check of character and story rules, independent risk challenges, and written journey/mitigation plans.

Not established: rendered-product correctness after changes, model equivalence after any future modification, measured learner incidence, improved comprehension, preserved transfer/retention, or rollout readiness. No product patch is represented as tested or released.
