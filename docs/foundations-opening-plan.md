# Deep Orbit visual story driven foundations plan

Revised October 6, 2026. Status: the shared visual/story reader is implemented in the working tree across all 56 Deep Orbit lessons. The [rollout record](design-previews/deep-orbit-rollout.md) describes the implementation and checks. The [continuity and pacing pass](design-previews/deep-orbit-continuity.md) also implements the five-value excerpt, linked Foundations examples, shorter required reads, named references and exercise scaffolding. The design requirements below describe the implemented opening; separately scoped human and commercial research remains unperformed. This replaces the separate integration-missions proposal and refines the opening work already delivered under P2.

Improve the five free foundations lessons through the existing story and visual teaching. JavaScript engineers should encounter a concrete problem, inspect the relevant data, change it through code, and understand what their work lets the crew do next. Keep one recommended sequence and one obvious next action.

The original internal estimate was 44–68 hours for the opening, with navigation, targeted teaching, scaffolding and editorial work estimated separately. This was a planning estimate, not measured time or remaining implementation. It cannot establish buyer demand at current traffic. The [PostHog audit](post-launch-backlog.md#posthog-data-audit-follow-ups-2026-10-03) records about two external visitors between August 26 and October 2, 2026, after filtering, with tracking gaps. This is a tracked-visitor estimate, not a count of every human who visited. Observing twelve learners needs separate recruitment work and funding, costed below.

The long-term customer target is defined in the [roadmap](roadmap.md). This opening project does not forecast that target or prove demand for an integration-only product.

## Experience principles

These principles apply throughout Tensorcraft. The owner extended the visual rollout to all 56 Deep Orbit lessons on October 6; it is no longer limited to Foundations.

The starting audience is a JavaScript engineer comfortable with arrays, functions, and async code who has not studied ML. Teach new ML terms beside the visible operation. Do not assume React experience, prior tensor knowledge, or a second programming language.

The October 6 [training and evaluation pilots](design-previews/deep-orbit-pilots/README.md) established two additional instrument types before implementation. The owner then directed completion across the course without a five-person test. The [production implementation](design-previews/deep-orbit-rollout.md) uses the original scenes and authored narrative, a topic-specific instrument for every Concept, mission context in Challenge, and scene artwork in every Epilogue. Learner research is not a prerequisite for completing these changes.

1. **The story introduces the problem.** Begin with a scene, an instrument reading, a failure, or a character's question. Explain the concept when it helps resolve that situation.
2. **The visual explains a mechanism.** Show which values moved, which signal changed, or which prediction failed. Keep teaching visuals connected to actual data and code.
3. **The learner changes something visible.** A wrong attempt produces evidence they can inspect. A successful attempt changes what the crew can do next.
4. **The next action is clear.** Keep the sequential course. Place references within reach without sending a new learner into a different lesson halfway through the task.
5. **Practice checks understanding.** Connect the visual to real code and an unfamiliar example. Animation playback and worked-example completion are not evidence of independent skill.
6. **Discovery makes the experience enjoyable.** Preserve the mystery, character timing, and satisfaction of getting a system working. Use transitions to show how something changes. Keep retries forgiving and work intact.

Vary the lesson's opening and pace rather than repeating this as a fixed script. Follow the [story style bible](story-style-bible.md) and [writing rubric](writing-quality-rubric.md).

## Dependencies and lesson navigation

The [development plan P2](learning-product-development-plan.md#6-p2-connect-the-first-result-the-course-promise-and-both-entry-routes) already set a 10–15-minute first-result target and introduced the channel-layout experiment. It was implemented, with human timing still unmeasured. This plan adds a smaller visual result inside lesson one and connects it to the existing lesson-two experiment. It is a refinement of P2, not another claim to have solved first-session learning.

The owner selected A then B then C in the September 24 lesson audit. Direction A tightened the existing six-step shell. Direction B folds Code into Concept, leaving Briefing, Concept, Challenge, Takeaways, and Epilogue. The [corrected B specification](superpowers/specs/2026-10-04-direction-b-five-steps-outline.md) now defines implementation and verification requirements. B's runtime implementation is complete in the working tree, including migration and browser checks, as recorded in the [canonical backlog](post-launch-backlog.md#lesson-audit-2026-09-24).

The renderer now implements the five-step contract. Further opening content changes use that contract. Put worked code beside its explanation in Concept; do not assign a new job to a separate Code step. Reconcile direction C's content work with those five steps rather than restoring duplicate reading.

B's spec defines the exact legacy-index mapping, versioned positions, semantic hashes with legacy handling, analytics versions, and suppression of completion on restore. This opening project uses that contract rather than renumbering independently. Direction C is targeted teaching inside Concept and cannot restore a Code step. The original 44–68-hour estimate excluded B, C, exercise scaffolding, and the editorial pass. Their implementation status is now recorded in the canonical backlog.

## The first session

Keep the existing Start Mission destination. Briefing begins with the established scene and ARIA's failed parsing rules, with nothing inserted above it.

| Moment | Learner experience | Capability developed |
| --- | --- | --- |
| Briefing | The crew receives a stream it cannot interpret | Understand why the packet needs inspection |
| Concept | Inspect five labeled excerpt values in an instrument panel, beside their array and tensor representation | Read values, their order, and one-axis shape |
| Challenge | Complete the current tensor exercise and inspect its checks | Create a tensor, capture values and shape, release it |
| Takeaways | Explain the result and inspect a different small example | Distinguish a value count from layout meaning |
| Epilogue | Continue Demir's inspection of the full packet and hand its unknown layout to Farah | Understand why lesson two is necessary |

Target an understandable action, visible result, and explanation within 10–15 active minutes from the normal start. First-time learner observation must include the scene and any wrong turn. This is not a duration claim for the full module.

The result is structured data inspection. Training and classification come later. Sample 7741 and the existing classifier reveal stay in lesson five. Do not imply that the learner has decoded the signal or built DEEP SCAN during this opening.

## Make the purpose of foundations visible

The main beginner risk is that inspecting data feels disconnected from learning ML. In lesson one's existing Concept material, briefly connect the packet to the investigation: a model will need readable, consistently arranged inputs before it can learn patterns that ARIA's rules missed. State that as the next capability the course will develop, not something the current exercise has accomplished.

Use the same visual vocabulary across the free lessons so each result remains recognizable. Point to the values being inspected, then the layout Farah needs, then the comparable feeds used by the preview classifier. The visual should make clear what this operation prepares and what remains unresolved. Avoid another overview screen or progress system.

Each lesson's transition should name the next concrete question. For example, counting the full packet's values does not establish which readings belong together. That question leads directly to Farah's layout work. At the end of the free module, distinguish running the supplied classifier from learning to build and train one next.

Observe whether first-time learners can explain why their current task matters to that later work. If they describe the opening as unrelated data plumbing, revise the connection and feedback before adding another activity or moving the classifier reveal.

## Packet sizes and output evidence

Use the five values already in create-a-tensor as a **teaching excerpt from the full packet**, with that label on the panel, worked example, and exercise instructions. Align the worked code and reference output with those five values. Their exercise shape is [5].

The Epilogue retains Demir's prediction of 256 values and one axis for the full packet. Add a short transition from inspecting the excerpt to inspecting that full packet. The excerpt check must not claim to have verified the larger packet. Lesson two then examines a separate archive block with candidate layout [450, 64]. Identify these as three different scopes, not successive shapes of the five-value tensor.

The runner returns test results and console logs, not structured numeric output. The tensor is disposed before grading, and the checks inspect saved values and operation evidence. Float32 rounding alone cannot prove tensor readback; the existing grader combines it with tensor and harness checks.

The first release therefore uses an authored **reference packet preview**, verified against the solution, beside actual exercise pass/fail feedback. Label it as a reference result, not the learner's captured tensor output. Do not parse arbitrary console logs into the visual or add a new worker protocol for this project.

Sources: [lesson one](../packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx), [exercise contract](../packages/content/content/deep-orbit/foundations/exercises/create-a-tensor.yaml), [lesson two](../packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx), and [exercise runner integration](../packages/ui/src/mdx/exercise.tsx).

## Lesson one implementation

Place a compact packet panel near the start of Concept, using the existing frame, art, and typography. Show indexed values and shape. One initial action reveals or inspects the excerpt. Selecting a value highlights its position in the array and tensor view. Use an annotated value strip rather than implying that unknown packet positions are already a time axis.

Introduce rank and readback beside the relevant operation. Explain that the visual illustrates numeric structure while the exercise executes TFJS. Preserve the exercise's meaningful readback and disposal checks.

Keep the first cleanup explanation short: create the tensor, capture the values needed after the run, then release the tensor. A small annotation beside the existing example can show that the copied JavaScript values remain available after disposal. Label it as reference behavior; the runner does not expose the learner's live tensor state.

The sum creates a temporary tensor, so the worked example still needs synchronous tf.tidy cleanup. Explain that requirement beside the code. Keep backend storage details, memory accounting, and additional lifecycle examples in the existing reference drawer. The learner must complete cleanup correctly without reading those deeper details first.

Remove lesson one's current mid-Concept link to the lesson-two experiment. The normal next-lesson action leads to the same experiment in its story context. Keep optional reference drawers, hints, and back navigation in the current lesson.

Passing the exercise earns a specific acknowledgement naming the checked work. The worked preview is already available in Concept. Do not duplicate the Concept panel on a new success screen. Continue through Takeaways to the existing Epilogue. Preserve retry and solution-view behavior, and do not report revealed answers as independent success.

## The five lesson investigation

| Lesson | Visual teaching | Story consequence |
| --- | --- | --- |
| Tensors | Five-value excerpt, array, shape, and readback | Demir can inspect data and leave layout unresolved |
| Shapes | Existing experiment traces values through reshape and transpose | Farah preserves channel membership in the plotter |
| Operations | Annotated before-and-after values for the existing merge or scale operation | Nazari can inspect the repeated ripple |
| Data loading | Sixteen labeled sample IDs become four batches, with feature and label shapes shown | The learner can prepare the archive for bounded processing |
| Normalization | Existing scale experiment and live preview classifier | The comparable feeds expose an ambiguous reading |

For operations and data loading, start with actual code output and an annotated static figure. Add a control only if manipulating it teaches something the figure cannot. Reuse existing experiments in shapes and normalization.

Keep character responses specific to the evidence. Farah exposes a method's limitation, Nazari notices a cost, and ARIA reports what her rules cannot establish. Mirza asks questions or makes decisions. Preserve sample timing, existing character arcs, and the final mystery.

At the free-module boundary, connect the unresolved question to the next module. Describe the existing $50 course's actual model and project work. Preserve accurate effort and refund information. The homepage headline and removal of its live demo remain established decisions.

## Required teaching and beginner exercise ramp

Before releasing the revised free module, map every required exercise operation
to visible prior teaching or supplied starter code. Required prerequisites must
be covered internally before observation; learner research refines the amount
of scaffolding and pacing. It is not a condition for fixing a known hidden
prerequisite.

B owns these teaching moves: lesson two gets a small reshape-and-row-readback
example immediately after its visual experiment, using values different from
the exercise. Lesson five shows essential per-feature scaling, saved training
statistics, zero-scale behavior, scaler choice, and the supplied preview model
in the main Concept flow. Deeper archive and API material stays optional.

The [prerequisite task](post-launch-backlog.md#foundations-opening-follow-ups-2026-10-03)
owns exercise scaffolding. Keep one required exercise per lesson. Group
batch-data's existing requirements into named stages and teach the method with
a small worked example. Supply the fixed preview model construction in
normalize-data starter code so learners focus on scaling and inference with
saved statistics. Preserve meaningful checks for laziness, split membership,
per-feature transformations, zero-scale handling, and reuse on new inputs.
Do not count supplied model construction as an independently learned skill.

Keep the audience beginner. Do not resolve difficulty by relabeling the module
intermediate or adding another mandatory path. Observe all five lessons under
the existing formal pilot's first-module session, recording active time,
stalls, hints, reveals, and other help separately for each exercise. The short
opening round cannot establish the difficulty ramp through lessons four and
five. The scaffolding described here is now implemented; observed learner timing remains future evidence.

The editorial pass also runs before release. Remove repeated qualifications,
but retain distinctions needed to interpret a result or choose an action:
supplied versus trained models, training-only normalization statistics and
leakage, raw versus scaled inputs, and uncalibrated scores. Place each beside
the relevant mechanism once. Preserve scene-end provenance notes. Evaluate
clarity and accurate interpretation rather than reducing a caveat count.

## Visual and interaction acceptance

- The crew's problem remains visible through Concept and Challenge. The learner's action changes an inspectable value or arrangement, and the resulting observation connects to that problem.
- Every teaching visual answers a question and labels the relevant values. Illustration establishes the scene; data graphics show the mechanism. Keep these roles distinct so fictional artwork cannot be mistaken for measured output.
- Visuals, worked code, and reference output agree within their stated packet scope. Color is reinforced by labels or patterns.
- Transitions show a meaningful change. Reduced motion provides an equivalent static result, and advancing never waits for decorative animation.
- Controls work with keyboard and touch. Optional details stay collapsed, and phone layouts avoid precision hovering or dense horizontal scrolling.
- Phase changes, help, back navigation, and resize preserve existing drafts and account boundaries.
- Feedback identifies what happened and where to inspect it. Retrying preserves work.
- The first explanation connects packet inspection to future model inputs without claiming training has already happened.
- Cleanup guidance is sufficient to solve the current task. Deeper runtime detail remains optional, and the grader still checks disposal.
- Scene context and the working instrument lead Concept. Explanation and worked JavaScript follow in the same step, side by side on desktop and stacked on phones. Challenge retains the exercise and its instructions, with reference visuals labeled separately from grading.
- Every required operation has visible prior teaching or supplied scaffolding; solving the exercise does not require opening an optional reference drawer.
- Exercise stages make the next action clear while retaining meaningful checks. Supplied model setup is distinguished from learner-authored scaling and inference.
- The next action remains identifiable without adding another menu or completion screen.

Follow the established [lesson layout](superpowers/specs/2026-09-23-lesson-layout-design.md) and [direction A design](superpowers/specs/2026-09-24-lesson-tightening-design.md), then B's verified navigation contract. Preserve sequential unlocks, purchase checks, certificates, and current onboarding/profile contracts. No new learning route, schema, or paid tier belongs to this release.

## Visual prototype before runtime work

The [foundations visual prototype](design-previews/foundations/index.html)
demonstrates all five free lessons in the proposed five-step shell. It includes
the packet strip linked to code, shape transformations, operation results,
bounded batch consumption, scaling, and authored retry/success states. Existing
Deep Orbit artwork, fonts, and world colors ground the design. The normal
start remains Briefing; desktop and phone layouts put the scene and mechanism
before worked code, with matching visual and keyboard order.

The October 5 revision addresses the owner's finding that the story disappeared
when the lesson left Briefing. Concept now pairs scene artwork and a crew question
with a larger working instrument. Selecting a packet reading updates its plotted
point, array position, worked code, and ARIA's observation. Shapes label channel
membership, Operations compares proportional bars, Data Loading shows training
and held-out records, and Normalization shows the two features against one axis.
The explanation and JavaScript follow immediately below that workbench.

Challenge revisits the scene, states the task, and labels its reference input or
method. Takeaways uses a visual changed case while keeping narrative out of recall.
Epilogue restores the existing character dialogue and the unresolved evidence that
carries the crew into the next lesson. The first packet's blank layout field now
visibly goes to Farah; sample 7741 first appears in lesson five. New Concept and
Challenge lines are proposed dialogue, governed by the story style bible; opening
and closing dialogue excerpts use the existing authored lessons.

| First lesson step | What the learner sees and does |
| --- | --- |
| Briefing | The bridge scene, Mirza's question, and ARIA's failed parsing rules establish the problem. |
| Concept | Demir asks what a tensor adds to an array. Selecting a plotted reading traces the same value into the array and code. |
| Challenge | The packet remains visible as a labeled reference while the learner saves readback and releases the tensor. |
| Takeaways | A different seven-value plot prompts recall of its shape. |
| Epilogue | ARIA questions what treating the stream as data will buy them. The full packet is [256], but its row layout remains unknown. |

Review the revised [Concept](design-previews/foundations/screenshots/desktop-tensors.png),
[phone Concept](design-previews/foundations/screenshots/phone-tensors.png), and
[Epilogue](design-previews/foundations/screenshots/desktop-epilogue.png) together.
Existing Deep Orbit colors and typography remain the design vocabulary. No
additional phase, branching path, or required dialogue click is introduced.

The [current lesson](https://tensorcraft.app/worlds/deep-orbit/foundations/introduction-to-tensors#step-1)
is the visual baseline. Preserve the approved two-tone 60 px desktop and
36 px phone title, mission metadata, segmented progress, lesson drawer,
scene heading, and paired artwork and crew dialogue. Keep the existing
per-step title hierarchy: the large Briefing card and compact title in the
navigation on teaching steps. The earlier
[lesson layout decision](superpowers/specs/2026-09-23-lesson-layout-design.md)
remains binding. Two compact footer actions open review tools on demand: a
side panel on desktop and a bottom sheet on phones. Settings and design notes
share that panel, keeping the lesson ending clear.

The revised Briefing is captured on
[desktop](design-previews/foundations/screenshots/desktop-briefing.png) and
[phone](design-previews/foundations/screenshots/phone-briefing.png).

The prototype includes its token plan, layout notes, design critique,
and handoff notes. The review panel puts the three main design decisions first;
palette and implementation details expand separately. Preview navigation waits
for an explicit Open step action. The panel restores focus and scroll when
closed, and returns to the lesson when previewing feedback. Captures show the
[desktop panel](design-previews/foundations/screenshots/desktop-review-notes.png)
and [phone settings](design-previews/foundations/screenshots/phone-review-settings.png). [Desktop](design-previews/foundations/screenshots/desktop-tensors.png)
and [phone](design-previews/foundations/screenshots/phone-tensors.png) captures
make the layout reviewable. It is isolated from production. Navigation is
unlocked for review, and exercise feedback is simulated. It does not implement
B's migration, grading, account progress, or access gates, and does not mark
the opening implementation complete. Use the visual artifact to resolve
layout and teaching interactions before changing the production renderer.

The frontend-design audit fixes are applied in the prototype. Instrument updates
keep controls and open references mounted. Step links support browser history,
and per-sample drafts survive refresh within the preview tab. Keyboard skipping,
persistent status announcements, reduced motion, reserved image space, and
appearance controls are included. The refreshed
[verification report](design-previews/foundations/verification.json) records
200 responsive views, 16 review-panel layouts, 24 interaction checks, and 52
automated accessibility checks with no violations. Desktop and phone captures were visually reviewed.
These checks do not establish assistive technology compatibility or beginner
learning outcomes. Rerun them with
`node docs/design-previews/foundations/verify.cjs` while serving the repository
at `http://127.0.0.1:8767`.

## Internal implementation

Estimates assume one implementer with 20–30 focused hours per week. Budget 44–68 hours, roughly two to four weeks after navigation dependencies are ready. These estimates cover five lessons and exclude B, C, exercise scaffolding, the 4–6-hour free-module editorial pass, new films, recruitment, and later-module revisions. The total release estimate remains incomplete until B and scaffolding are estimated; the opening budget alone is not the release timeline.

| Work | Deliverable | Hours | Acceptance evidence |
| --- | --- | --- | --- |
| 1 Storyboard the opening | Five-step frames, excerpt/full-packet transition, and connection to future model work | 6–10 | Story and numeric scopes agree; the learner can see why the packet matters |
| 2 Implement lesson one | Packet panel, aligned examples, reference preview, brief cleanup guidance, and next-lesson handoff | 14–22 | Real exercise passes; preview is labeled; existing drafts persist |
| 3 Connect foundations | Refined experiment framing, bounded signal/archive visuals, and transitions | 10–16 | Five lessons read and run in order without premature reveals |
| 4 Describe the course outcomes | World/pricing copy connected to actual learning work | 4–6 | Every new outcome claim has a working example |
| 5 Verify and prepare observation | Focused checks, responsive review, timing record, and learner tasks | 10–14 | Internal evidence and discovery materials are recorded |

Review rough frames before polishing the panel. Finish lesson one in B's lesson shell before the remaining opening visual work; B's prerequisite teaching moves remain part of B. Register the component once in Concept and retain existing asset and state behavior. Complete scaffolding and the editorial pass before the release checks.

Run applicable content build, example/exercise validation, type checks, and focused unit/e2e checks. Cross-check reference values with actual TFJS results using float32 tolerance. Separately verify unchanged grading, disposal, single mounting, state retention, and access boundaries. Inspect all five rendered lessons on phone and desktop, including enlarged text and reduced motion. Report maintainer timing separately from human timing.

## Costed learner observation

The owner is the proposed study lead; compensation and recruitment are planning assumptions. This work begins after internal checks pass and a research slot is scheduled. It remains indexed in the [backlog](post-launch-backlog.md#foundations-opening-follow-ups-2026-10-03).

Reserve **16–24 additional founder hours**: 6–8 for recruitment and scheduling, 6–8 for twelve short sessions and follow-ups, and 4–8 for analysis. Propose **$25 per participant, $300 total**. Within the existing $200 monthly marketing budget, allocating $150 in each of two months leaves $50 per month for other acquisition work. Recruitment may take longer; neither the sample nor calendar is guaranteed. Internal work plus this round totals 60–92 hours.

Recruit twelve JavaScript engineers new to ML who are comfortable with arrays, functions, and async code, including people who want AI features but were not seeking a training course. Record starting intent during research, not as another product questionnaire. Use the normal lesson start and a changed packet or layout task. Record first attempts, help, active time, interruptions, and voluntary continuation.

Proposed diagnostic targets are 8 of 12 reaching and explaining the first result without facilitator takeover, median active time at most 15 minutes, and 8 of 12 explaining the changed case before seeing its worked answer. Report unaided attempts, hints, copied solutions, and facilitator help separately. These are design checkpoints, not effectiveness benchmarks.

Use the following observations to decide what needs revision:

| Question | Evidence to retain | Response to difficulty |
| --- | --- | --- |
| Can they explain their first result? | The values or code they point to and their account of what changed | Revise the visual or explanation rather than rewarding clicks |
| Can they handle a changed example? | First attempt and explanation before any worked answer, with help recorded | Revise practice if learners repeat the solution without understanding it |
| Do they know why this prepares them for ML? | Their explanation of what a later model will need from the data | Strengthen the connection within the existing scene and teaching |
| Does the next story question invite continuation? | Their stated reason and any optional start of lesson two after the observed task ends | Inspect pacing, repetition, and competing controls |
| Does understanding persist? | A seven-day follow-up using another short example and an explanation, before offering a refresher | Record missing responses and revise teaching when recall or transfer is weak |

The seven-day follow-up is included in the existing observation budget. Reserve one short follow-up slot per participant and report how many respond. Record any interim practice or prior exposure to the task. Administer it before showing a refresher during the session. A scheduled research return and a voluntary product return are different observations. Do not make follow-up participation a condition of product access or treat it as organic retention.

Ask learners which discovery surprised them, what the crew can now do, and what felt repetitive. Compare those recollections with their explanation and behavior. Enjoyment, independent skill, and willingness to pay remain separate findings. Compensated or reimbursed payments do not count as demand.

Keep this round separate from the [formal novice pilot](learning-study/README.md). Its existing tasks and acceptance gates remain intact.

After reviewing opening diagnostics and completing any internal repairs,
refresh the existing pilot handoff and freeze the revised course version. The
formal pilot has its own recruitment, consent, scheduling, and resource needs;
it is not included in the 16–24-hour opening budget. Its first-module observation
covers all five free lessons, followed by independent model work, the final
project, delayed checks, and 30-day use evidence. Record readiness and results
under Q6 in the canonical backlog. No participants or outcomes are implied by
preparing these documents.

## Purchase measurement and deferred work

Before reporting a funnel, complete the relevant [PostHog measurement follow-ups](post-launch-backlog.md#posthog-data-audit-follow-ups-2026-10-03). They include internal-traffic filtering, first-visit event loss, and purchase-event duplication. Reconcile purchases against payment records. The current estimate does not include those existing audit tasks.

Use existing events and add an opening revision identifier where needed so consented activity can be grouped by content version. Count distinct learners, separating staff, study participants, existing customers, and sources. Missing consent and cross-device identity are attribution limits. Free-text explanations stay out of product analytics.

When sufficient external use exists, report lesson completion, continuation, seven-day return, purchase within 14 days, and refunds after each purchase's five-day window. Small observational cohorts cannot establish a causal improvement. With current traffic, buyer evidence remains inconclusive even if observed learners enjoy the new opening.

Report the learner and commercial evidence separately. Research includes
engineers initially seeking AI features and those seeking model understanding;
compare their observed continuation and stated reasons without inferring a
market size from the small sample. Commercial reporting uses genuine buyers,
retained revenue, sources, refunds, and acquisition costs. Compensated purchases
remain excluded. Useful independent model work and repeatable buying evidence,
not an opening satisfaction score, guide expansion toward the 200,000-customer
goal. Subscriptions, enterprise, and an arena remain optional offers with their
own demand gates.

Later-module passes and any randomized comparison remain [backlog items](post-launch-backlog.md#foundations-opening-follow-ups-2026-10-03). Estimate each module after inspecting its current work. A signal-processing revision might use a trace. Deployment practice can center on a failed load and recovery. Preserve methods that already teach well. Add another learning path only when actual learner and buyer evidence identifies a need.

## First implementation task

Storyboard lesson one against B's five-step target using the existing five-value excerpt. Show why the packet prepares inputs for future model work. Include the reference panel, brief cleanup guidance, and explicit transition to Demir's full 256-value packet. Keep the route to Farah's layout problem in the normal next-lesson action. Complete B's separate specification and implementation before integrating the new panel.
